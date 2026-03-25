'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AdminLogin() {
  const { setUser } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('Isi semua field');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.data);
        toast.success('Login berhasil');
      } else {
        toast.error(data.error || 'Login gagal');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-center mb-8"
        >
          {/* Animated Logo */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.5)',
                  '0 0 40px rgba(239, 68, 68, 0.8)',
                  '0 0 20px rgba(239, 68, 68, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center"
            >
              <span className="text-3xl font-bold text-white">IDM</span>
            </motion.div>
            
            {/* Floating particles */}
            <motion.div
              animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-2 -right-2 w-4 h-4 bg-red-400 rounded-full"
            />
            <motion.div
              animate={{ y: [5, -5, 5], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-1 -left-2 w-3 h-3 bg-orange-400 rounded-full"
            />
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Admin Login
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 text-sm mt-2"
          >
            Idol Meta Fan Made Edition
          </motion.p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl" />
          
          <div className="relative p-6 rounded-3xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-tr-3xl" />
            
            <div className="space-y-5">
              {/* Username Input */}
              <div>
                <Label className="text-slate-300 text-xs flex items-center gap-1 mb-2">
                  <User className="w-3 h-3" />
                  Username
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tazos"
                    className={cn(
                      "pl-11 h-12 bg-slate-800/50 border-slate-700/50",
                      "text-white placeholder:text-slate-600",
                      "focus:border-cyan-500/50 focus:ring-cyan-500/20",
                      "transition-all duration-300"
                    )}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <Label className="text-slate-300 text-xs flex items-center gap-1 mb-2">
                  <Lock className="w-3 h-3" />
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(
                      "pl-11 h-12 bg-slate-800/50 border-slate-700/50",
                      "text-white placeholder:text-slate-600",
                      "focus:border-cyan-500/50 focus:ring-cyan-500/20",
                      "transition-all duration-300"
                    )}
                  />
                </div>
              </div>

              {/* Login Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-12 rounded-xl font-semibold",
                    "bg-gradient-to-r from-cyan-500 to-blue-500",
                    "hover:from-cyan-400 hover:to-blue-400",
                    "shadow-[0_0_20px_rgba(34,211,238,0.3)]",
                    "hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]",
                    "transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Login Admin</span>
                    </div>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-slate-600">
            Super Admin: <span className="text-cyan-500/70">tazos</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-slate-700" />
            <span className="text-[10px] text-slate-600">Secure Login</span>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-slate-700" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
