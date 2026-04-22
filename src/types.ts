/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

export interface ReceiptData {
  id: string;
  merchantName: string;
  date: string;
  total: number;
  category: string;
  items: ReceiptItem[];
  rawText?: string;
  timestamp: number;
}

export type ViewType = 'scanner' | 'list' | 'dashboard';
