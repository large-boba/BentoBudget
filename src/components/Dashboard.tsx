/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { ReceiptData } from "../types";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { TrendingUp, Wallet, ShoppingBag, CreditCard, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface DashboardProps {
  receipts: ReceiptData[];
}

const COLORS = ['#2563EB', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#94A3B8'];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Dashboard({ receipts }: DashboardProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const d = new Date(r.date);
      if (viewMode === 'monthly') {
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }
      return d.getFullYear() === selectedYear;
    });
  }, [receipts, viewMode, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const total = filteredReceipts.reduce((sum, r) => sum + r.total, 0);
    const count = filteredReceipts.length;
    const avg = count > 0 ? total / count : 0;
    
    const byCategory = filteredReceipts.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.total;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    const byDate = filteredReceipts.reduce((acc, r) => {
      const date = new Date(r.date).toLocaleDateString(undefined, { 
        month: viewMode === 'yearly' ? 'short' : undefined, 
        day: viewMode === 'monthly' ? 'numeric' : undefined,
        year: viewMode === 'yearly' ? 'numeric' : undefined 
      });
      acc[date] = (acc[date] || 0) + r.total;
      return acc;
    }, {} as Record<string, number>);

    const trendData = Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { total, count, avg, categoryData, trendData };
  }, [filteredReceipts, viewMode]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(v => v - 1);
    } else {
      setSelectedMonth(v => v - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(v => v + 1);
    } else {
      setSelectedMonth(v => v + 1);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-20">
      {/* View Toggle & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setViewMode('monthly')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              viewMode === 'monthly' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            Monthly
          </button>
          <button 
            onClick={() => setViewMode('yearly')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              viewMode === 'yearly' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            Yearly
          </button>
        </div>

        {viewMode === 'monthly' ? (
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
            <div className="min-w-[120px] text-center">
              <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
            </div>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
             <button onClick={() => setSelectedYear(v => v - 1)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
             <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedYear}</span>
             <button onClick={() => setSelectedYear(v => v + 1)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>

      {!filteredReceipts.length ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
          <CalendarIcon className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No data for this period</h3>
          <p className="text-gray-400 text-sm mt-1">Try switching months or scan a new receipt</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Wallet size={80} />
              </div>
              <div className="flex items-center gap-3 text-secondary mb-2">
                <div className="p-2 bg-blue-50 rounded-xl"><Wallet className="w-4 h-4 text-blue-500" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Spending</span>
              </div>
              <p className="text-4xl font-black text-gray-900 tracking-tighter">${stats.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShoppingBag size={80} />
              </div>
              <div className="flex items-center gap-3 text-secondary mb-2">
                <div className="p-2 bg-orange-50 rounded-xl"><ShoppingBag className="w-4 h-4 text-orange-500" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Volume</span>
              </div>
              <p className="text-4xl font-black text-gray-900 tracking-tighter">{stats.count}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <CreditCard size={80} />
              </div>
              <div className="flex items-center gap-3 text-secondary mb-2">
                <div className="p-2 bg-purple-50 rounded-xl"><CreditCard className="w-4 h-4 text-purple-500" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Average</span>
              </div>
              <p className="text-4xl font-black text-gray-900 tracking-tighter">${stats.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Trend */}
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Financial Pulse</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Transaction flow</p>
                </div>
                <TrendingUp className="text-blue-100" size={32} />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 800 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 800 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px' }}
                      labelStyle={{ fontWeight: 900, color: '#111827', marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#2563EB" 
                      strokeWidth={5} 
                      dot={{ r: 0 }}
                      activeDot={{ r: 8, fill: '#2563EB', strokeWidth: 4, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Spending Split</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Allocation</p>
                </div>
                <ShoppingBag className="text-orange-100" size={32} />
              </div>
              <div className="h-[300px] w-full flex flex-col sm:flex-row items-center gap-8">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={10}
                        dataKey="value"
                      >
                        {stats.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={12} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 grid grid-cols-2 gap-3">
                  {stats.categoryData.map((cat, idx) => (
                    <div key={cat.name} className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none truncate">{cat.name}</span>
                      </div>
                      <span className="text-sm font-black text-gray-900 leading-none">${cat.value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

