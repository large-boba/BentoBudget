/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractReceiptData(base64Image: string, mimeType: string): Promise<ReceiptData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "Extract information from this receipt. Be accurate and return JSON matching the schema.",
          },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchantName: { type: Type.STRING },
          date: { type: Type.STRING, description: "ISO 8601 date string" },
          total: { type: Type.NUMBER },
          category: { type: Type.STRING, description: "One of: Food, Transport, Shopping, Utilities, Entertainment, Other" },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                quantity: { type: Type.NUMBER },
              },
              required: ["name", "price", "quantity"],
            },
          },
        },
        required: ["merchantName", "date", "total", "category", "items"],
      },
    },
  });

  const text = response.text || "{}";
  const parsed = JSON.parse(text);
  
  return {
    ...parsed,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
}
