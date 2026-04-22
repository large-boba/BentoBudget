/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ReceiptData } from "../types";
import { Calendar, Store, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface ExpenseListProps {
  receipts: ReceiptData[];
}

export default function ExpenseList({ receipts }: ExpenseListProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Store className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">No receipts yet</h3>
        <p className="text-gray-500 mt-2 max-w-xs">
          Start by scanning your first receipt to see your expense breakdown here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto p-4">
      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
        >
          <div
            className="p-5 cursor-pointer flex items-center justify-between"
            onClick={() => setExpandedId(expandedId === receipt.id ? null : receipt.id)}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                receipt.category === 'Food' ? "bg-orange-100 text-orange-600" :
                receipt.category === 'Shopping' ? "bg-blue-100 text-blue-600" :
                receipt.category === 'Transport' ? "bg-green-100 text-green-600" :
                "bg-gray-100 text-gray-600"
              )}>
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{receipt.merchantName}</h4>
                <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(receipt.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Tag className="w-3 h-3" />
                    {receipt.category}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-lg font-black text-gray-900">
                  ${receipt.total.toFixed(2)}
                </p>
              </div>
              {expandedId === receipt.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>

          <AnimatePresence>
            {expandedId === receipt.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6"
              >
                <div className="pt-4 border-t border-gray-50">
                  <h5 className="text-xs font-black text-secondary uppercase tracking-widest mb-3">Items</h5>
                  <div className="space-y-2">
                    {receipt.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex gap-2 text-gray-700">
                          <span className="text-secondary font-mono">x{item.quantity}</span>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-mono font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total Charged</span>
                    <span className="text-lg font-black text-blue-600">${receipt.total.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
