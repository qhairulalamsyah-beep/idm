'use client';

import { motion } from 'framer-motion';
import { useAppStore, Division, divisionThemes } from '@/store';
import { cn } from '@/lib/utils';

const tabs: { id: Division; label: string; emoji: string }[] = [
  { id: 'MALE', label: 'Male', emoji: '♂️' },
  { id: 'FEMALE', label: 'Female', emoji: '♀️' },
  { id: 'LIGA', label: 'Liga', emoji: '👑' },
];

export function DivisionTabs() {
  const { activeDivision, setActiveDivision } = useAppStore();

  return (
    <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="flex items-center justify-center px-4 py-3">
        <div className="relative flex items-center p-1 bg-slate-900/50 rounded-xl border border-slate-800/50">
          {/* Animated background */}
          <motion.div
            key={activeDivision}
            initial={false}
            animate={{
              x: tabs.findIndex((t) => t.id === activeDivision) * 100 + '%',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "absolute w-1/3 h-[calc(100%-8px)] rounded-lg",
              activeDivision === 'MALE' && "bg-gradient-to-r from-red-600/80 to-red-700/80",
              activeDivision === 'FEMALE' && "bg-gradient-to-r from-purple-600/80 to-pink-600/80",
              activeDivision === 'LIGA' && "bg-gradient-to-r from-emerald-600/80 to-teal-600/80"
            )}
            style={{
              boxShadow: activeDivision === 'MALE' 
                ? '0 0 20px rgba(239, 68, 68, 0.4)' 
                : activeDivision === 'FEMALE'
                ? '0 0 20px rgba(168, 85, 247, 0.4)'
                : '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
          />

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDivision(tab.id)}
              className={cn(
                "relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg",
                "text-sm font-semibold transition-all duration-200",
                "touch-feedback",
                activeDivision === tab.id
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <span className="text-lg">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
