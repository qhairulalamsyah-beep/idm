'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAppStore, divisionThemes } from '@/store';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const defaultRules = [
  'Dilarang menggunakan BOT atau cheat',
  'Peserta wajib hadir 15 menit sebelum pertandingan',
  'Tim yang tidak hadir otomatis dianggap walkover',
  'Keputusan juri bersifat mutlak',
  'Dilarang melakukan toxic behavior',
];

export function RulesSection() {
  const { activeDivision } = useAppStore();
  const theme = divisionThemes[activeDivision];
  const [rules, setRules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tournaments?division=${activeDivision}&status=REGISTRATION,APPROVAL,TEAM_GENERATION,BRACKET_GENERATION,IN_PROGRESS`);
        const data = await res.json();
        
        if (data.success && data.data?.length > 0) {
          const tournament = data.data[0];
          // Parse rules from tournament (could be newline-separated string)
          if (tournament.rules) {
            const parsedRules = tournament.rules.split('\n').filter((r: string) => r.trim());
            setRules(parsedRules.length > 0 ? parsedRules : defaultRules);
          } else {
            setRules(defaultRules);
          }
        } else {
          setRules(defaultRules);
        }
      } catch (error) {
        console.error('Error fetching rules:', error);
        setRules(defaultRules);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRules();
  }, [activeDivision]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 px-4 mb-4"
    >
      <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Rules & Regulations
      </h3>

      <div
        className={cn(
          "rounded-xl border p-4",
          "bg-gradient-to-br from-slate-900/90 to-slate-800/50",
          theme.cardBorder
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <ul className="space-y-2">
            {rules.map((rule, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 text-sm text-slate-300"
              >
                <CheckCircle2 className={cn(
                  "w-4 h-4 mt-0.5 flex-shrink-0",
                  activeDivision === 'MALE' && "text-red-400",
                  activeDivision === 'FEMALE' && "text-purple-400"
                )} />
                <span>{rule}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
