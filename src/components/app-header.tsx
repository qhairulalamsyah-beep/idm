'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Users, Settings, Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, divisionThemes } from '@/store';

const navItems = [
  { id: 'home', icon: Trophy, label: 'Home' },
  { id: 'rank', icon: Crown, label: 'Rank' },
  { id: 'teams', icon: Users, label: 'Teams' },
];

export function AppHeader() {
  const { activeDivision } = useAppStore();
  const theme = divisionThemes[activeDivision];
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-50"
    >
      {/* Top glow line */}
      <div className={cn(
        "h-[1px] opacity-80",
        activeDivision === 'MALE' && "bg-gradient-to-r from-transparent via-red-500 to-transparent",
        activeDivision === 'FEMALE' && "bg-gradient-to-r from-transparent via-purple-500 to-transparent"
      )} />

      {/* Main header */}
      <div className="backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Logo & Title */}
            <div className="flex items-center gap-3">
              {/* Logo with glow effect */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                {/* Animated glow behind */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-xl blur-lg",
                    activeDivision === 'MALE' && "bg-red-500/40",
                    activeDivision === 'FEMALE' && "bg-purple-500/40"
                  )}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                
                {/* Logo container */}
                <div 
                  className={cn(
                    "relative w-11 h-11 rounded-xl flex items-center justify-center shadow-lg overflow-hidden",
                    "bg-gradient-to-br",
                    activeDivision === 'MALE' && "from-red-600 via-red-700 to-red-800",
                    activeDivision === 'FEMALE' && "from-purple-600 via-purple-700 to-pink-700"
                  )}
                  style={{
                    boxShadow: activeDivision === 'MALE' 
                      ? '0 0 25px rgba(220, 38, 38, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)' 
                      : '0 0 25px rgba(168, 85, 247, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)'
                  }}
                >
                  {/* Light sweep animation */}
                  <motion.div
                    className="absolute inset-0 overflow-hidden"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: 'linear' }}
                  >
                    <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" />
                  </motion.div>
                  
                  {/* Logo text */}
                  <span className="text-base font-black text-white relative z-10 tracking-tight drop-shadow-lg">
                    IDM
                  </span>
                </div>
              </motion.div>

              {/* Title & Subtitle */}
              <div className="flex flex-col">
                {/* Main Title */}
                <motion.div 
                  className="flex items-baseline gap-1 leading-none"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-lg">
                      IDOL
                    </span>
                  </h1>
                  <h1 className={cn(
                    "text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r drop-shadow-lg",
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
                  className="flex items-center gap-2 mt-1"
                >
                  <div className="flex items-center gap-1">
                    <Sparkles className={cn(
                      "w-2.5 h-2.5",
                      activeDivision === 'MALE' && "text-red-400",
                      activeDivision === 'FEMALE' && "text-purple-400"
                    )} />
                    <span className={cn(
                      "text-[9px] uppercase tracking-[0.2em] font-semibold",
                      activeDivision === 'MALE' && "text-red-400/80",
                      activeDivision === 'FEMALE' && "text-purple-400/80"
                    )}>
                      Fan Made Edition
                    </span>
                    <Sparkles className={cn(
                      "w-2.5 h-2.5",
                      activeDivision === 'MALE' && "text-red-400",
                      activeDivision === 'FEMALE' && "text-purple-400"
                    )} />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right side - Navigation & Status */}
            <div className="flex items-center gap-2">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 mr-2">
                {navItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Division Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border",
                  "transition-all duration-300 flex items-center gap-1.5",
                  activeDivision === 'MALE' && "bg-red-500/15 border-red-500/40 text-red-400",
                  activeDivision === 'FEMALE' && "bg-purple-500/15 border-purple-500/40 text-purple-400"
                )}
                style={{
                  boxShadow: activeDivision === 'MALE' 
                    ? '0 0 20px rgba(239, 68, 68, 0.25)' 
                    : '0 0 20px rgba(168, 85, 247, 0.25)'
                }}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  activeDivision === 'MALE' && "bg-red-400",
                  activeDivision === 'FEMALE' && "bg-purple-400"
                )} />
                <span>{activeDivision === 'MALE' ? '♂ MALE' : '♀ FEMALE'}</span>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
              >
                {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-slate-800/50"
            >
              <nav className="p-3 flex justify-around">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                      "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom glow line */}
      <div className={cn(
        "h-[1px] opacity-50",
        activeDivision === 'MALE' && "bg-gradient-to-r from-red-900/50 via-red-500/50 to-red-900/50",
        activeDivision === 'FEMALE' && "bg-gradient-to-r from-purple-900/50 via-purple-500/50 to-purple-900/50"
      )} />
    </motion.header>
  );
}
