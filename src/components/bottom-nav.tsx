'use client';

import { motion } from 'framer-motion';
import { Home, Trophy, Users, Crown, User, LayoutGrid } from 'lucide-react';
import { useNavigationStore, useAppStore, divisionThemes } from '@/store';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'rank', icon: Trophy, label: 'Top Global' },
  { id: 'champions', icon: Crown, label: 'Juara' },
  { id: 'teams', icon: Users, label: 'Tim' },
  { id: 'profile', icon: User, label: 'Profil' },
] as const;

export function BottomNavigation() {
  const { activePage, setActivePage } = useNavigationStore();
  const { activeDivision, activeModal, openModal, closeModal } = useAppStore();
  const theme = divisionThemes[activeDivision];

  const divisionStyles = {
    MALE: {
      accent: 'text-red-400',
      glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]',
      border: 'border-red-500/30',
      shadow: '0 0 25px rgba(239, 68, 68, 0.4)',
      bg: 'bg-red-500',
    },
    FEMALE: {
      accent: 'text-purple-400',
      glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]',
      border: 'border-purple-500/30',
      shadow: '0 0 25px rgba(168, 85, 247, 0.4)',
      bg: 'bg-purple-500',
    },
    LIGA: {
      accent: 'text-emerald-400',
      glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      border: 'border-emerald-500/30',
      shadow: '0 0 25px rgba(16, 185, 129, 0.4)',
      bg: 'bg-emerald-500',
    },
  };

  const style = divisionStyles[activeDivision];

  const toggleBracket = () => {
    if (activeModal === 'bracket') {
      closeModal();
    } else {
      openModal('bracket');
    }
  };

  return (
    <>
      {/* FAB - Bracket Button with 3D Effect */}
      <motion.button
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleBracket}
        className={cn(
          "fixed bottom-24 right-4 z-50 w-16 h-16 rounded-2xl",
          "bg-gradient-to-br from-slate-800 via-slate-900 to-black",
          "border-2 flex items-center justify-center",
          "transition-all duration-300",
          style.border,
          activeModal === 'bracket' && "ring-2 ring-offset-2 ring-offset-slate-900",
          activeModal === 'bracket' && activeDivision === 'MALE' && "ring-red-500",
          activeModal === 'bracket' && activeDivision === 'FEMALE' && "ring-purple-500",
          activeModal === 'bracket' && activeDivision === 'LIGA' && "ring-emerald-500"
        )}
        style={{
          boxShadow: style.shadow,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Inner glow */}
        <div className={cn(
          "absolute inset-1 rounded-xl opacity-50",
          activeDivision === 'MALE' && "bg-gradient-to-br from-red-500/20 to-transparent",
          activeDivision === 'FEMALE' && "bg-gradient-to-br from-purple-500/20 to-transparent",
          activeDivision === 'LIGA' && "bg-gradient-to-br from-emerald-500/20 to-transparent"
        )} />
        <LayoutGrid className={cn("w-6 h-6 relative z-10", style.accent, style.glow)} />
      </motion.button>

      {/* Bottom Navigation with Glassmorphism */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40",
          "bg-slate-900/80 backdrop-blur-xl border-t",
          "safe-bottom px-2 py-3",
          style.border
        )}
        style={{
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                onClick={() => setActivePage(item.id as typeof activePage)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative flex flex-col items-center justify-center",
                  "px-4 py-2 rounded-2xl transition-all duration-200",
                  "min-w-[64px]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={cn(
                      "absolute inset-0 rounded-2xl",
                      activeDivision === 'MALE' && "bg-gradient-to-br from-red-500/30 to-red-600/10",
                      activeDivision === 'FEMALE' && "bg-gradient-to-br from-purple-500/30 to-purple-600/10",
                      activeDivision === 'LIGA' && "bg-gradient-to-br from-emerald-500/30 to-emerald-600/10"
                    )}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{
                      boxShadow: isActive ? style.shadow.replace('25px', '15px') : 'none',
                    }}
                  />
                )}
                <Icon className={cn(
                  "w-5 h-5 relative z-10 transition-all duration-200",
                  isActive ? cn(style.accent, style.glow) : "text-slate-500"
                )} />
                <span className={cn(
                  "text-[10px] mt-1 relative z-10 font-medium transition-all duration-200",
                  isActive ? style.accent : "text-slate-500"
                )}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
