/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReceiptData } from "../types";

export async function getAuthUrl(): Promise<string> {
  const response = await fetch("/api/auth/url");
  const data = await response.json();
  return data.url;
}

export async function getAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/status");
    if (!response.ok) {
       // Check user info instead as status was replaced by user info in server
       const userRes = await fetch("/api/auth/user");
       return userRes.ok;
    }
    const data = await response.json();
    return data.authenticated;
  } catch (e) {
    return false;
  }
}

export async function getUserInfo(): Promise<any> {
  const response = await fetch("/api/auth/user");
  if (!response.ok) return null;
  return response.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function saveReceiptToSheets(data: ReceiptData): Promise<void> {
  const response = await fetch("/api/sheets/append", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) {
    throw new Error("Failed to save to Google Sheets");
  }
}

export async function fetchReceiptsFromSheets(): Promise<ReceiptData[]> {
  const response = await fetch("/api/sheets/data");
  if (!response.ok) return [];
  const data = await response.json();
  return data.receipts;
}
