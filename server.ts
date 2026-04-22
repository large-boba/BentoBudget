/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cookieParser from "cookie-parser";
import { google } from "googleapis";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "bento-budget-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  const getOAuth2Client = () => new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/auth/callback`
  );

  // Authentication Routes
  app.get("/api/auth/url", (req, res) => {
    const client = getOAuth2Client();
    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });
    res.json({ url: authUrl });
  });

  app.get("/api/auth/user", async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: "Not logged in" });

    const client = getOAuth2Client();
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    
    try {
      const userInfo = await oauth2.userinfo.get();
      res.json(userInfo.data);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    const client = getOAuth2Client();
    try {
      const { tokens } = await client.getToken(code as string);
      (req.session as any).tokens = tokens;
      
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f9fafb;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <h2 style="color: #111827;">Authenticated!</h2>
              <p style="color: #4b5563;">You can close this window now.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  setTimeout(() => window.close(), 1000);
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Sheets API proxy
  app.post("/api/sheets/append", async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: "Not authenticated" });

    const client = getOAuth2Client();
    client.setCredentials(tokens);
    const sheets = google.sheets({ version: "v4", auth: client });
    const drive = google.drive({ version: "v3", auth: client });

    try {
      // 1. Find or create the master spreadsheet
      let spreadsheetId = "";
      const listResponse = await drive.files.list({
        q: "name = 'Bento Budget' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
        fields: "files(id, name)",
      });

      if (listResponse.data.files && listResponse.data.files.length > 0) {
        spreadsheetId = listResponse.data.files[0].id!;
      } else {
        const createResponse = await sheets.spreadsheets.create({
          requestBody: {
            properties: { title: "Bento Budget" },
          },
        });
        spreadsheetId = createResponse.data.spreadsheetId!;
        
        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "Sheet1!A1:H1",
          valueInputOption: "RAW",
          requestBody: {
            values: [["ID", "Date", "Merchant", "Category", "Total", "Items", "Raw Text", "Timestamp"]],
          },
        });
      }

      // 2. Append the new data
      const { data } = req.body;
      const values = [[
        data.id,
        data.date,
        data.merchantName,
        data.category,
        data.total,
        JSON.stringify(data.items),
        data.rawText || "",
        data.timestamp
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A2",
        valueInputOption: "RAW",
        requestBody: { values },
      });

      res.json({ success: true, spreadsheetId });
    } catch (error) {
      console.error("Sheets Error:", error);
      res.status(500).json({ error: "Failed to write to Google Sheets" });
    }
  });

  app.get("/api/sheets/data", async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: "Not authenticated" });

    const client = getOAuth2Client();
    client.setCredentials(tokens);
    const sheets = google.sheets({ version: "v4", auth: client });
    const drive = google.drive({ version: "v3", auth: client });

    try {
      const listResponse = await drive.files.list({
        q: "name = 'Bento Budget' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
      });

      if (!listResponse.data.files || listResponse.data.files.length === 0) {
        return res.json({ receipts: [] });
      }

      const spreadsheetId = listResponse.data.files[0].id!;
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A2:H",
      });

      const rows = dataResponse.data.values || [];
      const receipts = rows.map(row => ({
        id: row[0],
        date: row[1],
        merchantName: row[2],
        category: row[3],
        total: parseFloat(row[4]),
        items: JSON.parse(row[5] || "[]"),
        rawText: row[6],
        timestamp: parseInt(row[7])
      }));

      res.json({ receipts: receipts.reverse() });
    } catch (error) {
      console.error("Sheets Read Error:", error);
      res.json({ receipts: [] });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
