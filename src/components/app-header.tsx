'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, Division, divisionThemes } from '@/store';

const divisions: { id: Division; label: string; icon: string }[] = [
  { id: 'MALE', label: 'Male', icon: '♂' },
  { id: 'FEMALE', label: 'Female', icon: '♀' },
];

export function AppHeader() {
  const { activeDivision, setActiveDivision } = useAppStore();
  const theme = divisionThemes[activeDivision];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-50"
    >
      {/* Top glow line */}
      <div className={cn(
        "h-[2px]",
        activeDivision === 'MALE' && "bg-gradient-to-r from-transparent via-red-500 to-transparent",
        activeDivision === 'FEMALE' && "bg-gradient-to-r from-transparent via-purple-500 to-transparent"
      )} />

      {/* Main header */}
      <div className="backdrop-blur-xl bg-slate-950/95 border-b border-slate-800/50">
        <div className="px-4 py-3">
          {/* Single row with title on left, tabs on right (vertically centered) */}
          <div className="flex items-center justify-between gap-3">
            
            {/* Left side - Logo & Title Stack */}
            <div className="flex items-center gap-2.5">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex-shrink-0"
              >
                {/* Glow effect */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-lg blur-md",
                    activeDivision === 'MALE' && "bg-red-500/40",
                    activeDivision === 'FEMALE' && "bg-purple-500/40"
                  )}
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                
                {/* Logo container */}
                <div 
                  className={cn(
                    "relative w-9 h-9 rounded-lg flex items-center justify-center shadow-lg overflow-hidden",
                    "bg-gradient-to-br",
                    activeDivision === 'MALE' && "from-red-600 via-red-700 to-red-800",
                    activeDivision === 'FEMALE' && "from-purple-600 via-purple-700 to-pink-700"
                  )}
                  style={{
                    boxShadow: activeDivision === 'MALE' 
                      ? '0 0 15px rgba(220, 38, 38, 0.4)' 
                      : '0 0 15px rgba(168, 85, 247, 0.4)'
                  }}
                >
                  <span className="text-xs font-black text-white relative z-10 tracking-tight drop-shadow-lg">
                    IDM
                  </span>
                </div>
              </motion.div>

              {/* Title Stack */}
              <div className="flex flex-col justify-center">
                {/* Title */}
                <motion.div 
                  className="flex items-baseline gap-0.5 leading-none"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-lg font-black tracking-tight">
                    <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                      IDOL
                    </span>
                  </h1>
                  <h1 className={cn(
                    "text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
                    activeDivision === 'MALE' && "from-red-400 via-red-500 to-red-600",
                    activeDivision === 'FEMALE' && "from-purple-400 via-pink-500 to-purple-600"
                  )}>
                    META
                  </h1>
                </motion.div>
                
                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-0.5 mt-0.5"
                >
                  <Sparkles className={cn(
                    "w-2 h-2",
                    activeDivision === 'MALE' && "text-red-400",
                    activeDivision === 'FEMALE' && "text-purple-400"
                  )} />
                  <span className={cn(
                    "text-[8px] uppercase tracking-[0.12em] font-semibold",
                    activeDivision === 'MALE' && "text-red-400/70",
                    activeDivision === 'FEMALE' && "text-purple-400/70"
                  )}>
                    Fan Made Edition
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Right side - Division Tabs with improved visibility */}
            <div className="flex-shrink-0">
              <div className="relative flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700/50">
                {/* Tab buttons - more visible design */}
                {divisions.map((division) => {
                  const isActive = activeDivision === division.id;
                  return (
                    <button
                      key={division.id}
                      onClick={() => setActiveDivision(division.id)}
                      className={cn(
                        "relative flex items-center justify-center gap-1 px-3 py-2 rounded-lg",
                        "text-xs font-bold transition-all duration-300",
                        "min-w-[52px]",
                        // Active state - filled background with glow
                        isActive && division.id === 'MALE' && "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30",
                        isActive && division.id === 'FEMALE' && "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30",
                        // Inactive state - visible but muted with border
                        !isActive && "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700 hover:text-white"
                      )}
                    >
                      <span className="text-sm">{division.icon}</span>
                      <span>{division.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className={cn(
        "h-[1px] opacity-60",
        activeDivision === 'MALE' && "bg-gradient-to-r from-red-900/30 via-red-500/50 to-red-900/30",
        activeDivision === 'FEMALE' && "bg-gradient-to-r from-purple-900/30 via-purple-500/50 to-purple-900/30"
      )} />
    </motion.header>
  );
}
