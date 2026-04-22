/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { ReceiptData, ViewType } from "./types";
import ReceiptScanner from "./components/ReceiptScanner";
import ExpenseList from "./components/ExpenseList";
import Dashboard from "./components/Dashboard";
import { Receipt, LayoutDashboard, List, Wallet, LogOut, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import * as sheets from "./services/sheets";

export default function App() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    const user = await sheets.getUserInfo();
    setIsAuthenticated(!!user);
    setUserInfo(user);
    if (user) {
      loadData();
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [checkAuth]);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const data = await sheets.fetchReceiptsFromSheets();
      setReceipts(data);
    } catch (e) {
      console.error("Failed to load sheets data", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = async () => {
    const url = await sheets.getAuthUrl();
    window.open(url, "google_oauth", "width=600,height=700");
  };

  const handleLogout = async () => {
    await sheets.logout();
    setIsAuthenticated(false);
    setReceipts([]);
  };

  const handleDataExtracted = async (data: ReceiptData) => {
    if (isAuthenticated) {
      setIsSyncing(true);
      try {
        await sheets.saveReceiptToSheets(data);
        setReceipts((prev) => [data, ...prev]);
      } catch (e) {
        console.error("Sync error", e);
        setReceipts((prev) => [data, ...prev]);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setReceipts((prev) => [data, ...prev]);
    }
    
    // Close scanner after success
    setTimeout(() => {
      setIsScannerOpen(false);
      setActiveView("list");
    }, 1500);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "list", label: "History", icon: List },
  ];

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Wallet className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500 font-medium font-sans">Bento Budget is warming up...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col pb-24 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none bg-clip-text">Bento Budget</h1>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mt-1">Receipt Mastery</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {isAuthenticated ? (
               <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end mr-2 text-right">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Authenticated</p>
                    <p className="text-sm font-bold text-gray-900 leading-none">{userInfo?.name}</p>
                  </div>
                  {userInfo?.picture && (
                    <img 
                      src={userInfo.picture} 
                      alt="User profile" 
                      className="w-9 h-9 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
               </div>
             ) : (
               <button 
                onClick={handleConnect}
                className="flex items-center gap-2 bg-gray-900 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-lg shadow-gray-200"
               >
                 <Wallet className="w-4 h-4" />
                 Link Sheets
               </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="w-full pt-4"
          >
            {activeView === "dashboard" && <Dashboard receipts={receipts} />}
            {activeView === "list" && <ExpenseList receipts={receipts} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Scanner Modal Overlay */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={() => setIsScannerOpen(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">New Receipt</h2>
                <p className="text-gray-500 text-sm mb-8">Take a photo or upload to scan automatically</p>
                <div className="bg-gray-25 rounded-[2rem] p-4 border border-gray-100">
                   <ReceiptScanner onDataExtracted={handleDataExtracted} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button & Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40 w-full max-w-md px-6">
        <nav className="flex-1 bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-full p-1.5 flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-6 rounded-full transition-all duration-300",
                activeView === item.id ? "text-blue-600" : "text-gray-400 hover:text-gray-500"
              )}
            >
              {activeView === item.id && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-blue-50 rounded-full -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-300"
          title="Add Receipt"
        >
          <Plus className="w-7 h-7" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}



