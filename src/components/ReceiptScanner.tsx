/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { extractReceiptData } from "../services/ai";
import { ReceiptData } from "../types";
import { cn } from "../lib/utils";

interface ReceiptScannerProps {
  onDataExtracted: (data: ReceiptData) => void;
}

export default function ReceiptScanner({ onDataExtracted }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsScanning(true);
    setError(null);
    setSuccess(false);

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type;
      const data = await extractReceiptData(base64.split(",")[1], mimeType);
      
      setSuccess(true);
      onDataExtracted(data);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to extract data. Please try again with a clearer photo.");
    } finally {
      setIsScanning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="relative group">
        <label
          className={cn(
            "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300",
            isScanning ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50/30",
            error ? "border-red-200 bg-red-50/30" : ""
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-blue-600 font-medium">Analysing receipt...</p>
                  <p className="text-blue-400 text-sm mt-1">Extracting items and total</p>
                </motion.div>
              ) : success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                  <p className="text-green-600 font-medium">Scan Complete!</p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="mb-2 text-sm text-gray-700 font-semibold">
                    Click to capture or upload a receipt
                  </p>
                  <p className="text-xs text-secondary">
                    PNG, JPG or JPEG (MAX. 10MB)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={isScanning}
          />
        </label>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Upload className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-secondary uppercase font-bold tracking-wider">Instructions</p>
            <p className="text-sm font-medium text-gray-700">Ensure text is legible</p>
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-secondary uppercase font-bold tracking-wider">AI Powered</p>
            <p className="text-sm font-medium text-gray-700">Auto-categorization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
