'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Send, Loader2, CheckCircle2, AlertCircle, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentName: string;
  division: 'MALE' | 'FEMALE' | 'LIGA';
  onSuccess?: () => void;
}

type RegistrationStep = 'form' | 'loading' | 'success' | 'error';

export function RegistrationModal({
  isOpen,
  onClose,
  tournamentId,
  tournamentName,
  division,
  onSuccess,
}: RegistrationModalProps) {
  const [step, setStep] = useState<RegistrationStep>('form');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    clubAffiliation: '', // Just for info in Male/Female
    // For Liga - Team registration
    teamName: '',
    clubName: '',
    member2Name: '',
    member2Phone: '',
    member3Name: '',
    member3Phone: '',
    member4Name: '',
    member4Phone: '',
    member5Name: '',
    member5Phone: '',
  });

  const isLiga = division === 'LIGA';

  const handleSubmit = async () => {
    // Validate
    if (!formData.name) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (isLiga) {
      // Liga validation
      if (!formData.teamName) {
        toast.error('Nama tim wajib diisi');
        return;
      }
      if (!formData.clubName) {
        toast.error('Nama club wajib diisi untuk Liga IDM');
        return;
      }
      // Validate all 5 members
      if (!formData.member2Name || !formData.member3Name || !formData.member4Name || !formData.member5Name) {
        toast.error('Semua 5 anggota tim wajib diisi');
        return;
      }
    }

    setStep('loading');

    try {
      if (isLiga) {
        // Liga registration - Club registers a complete team
        const teamRes = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId,
            name: formData.teamName,
            clubName: formData.clubName,
            members: [
              { name: formData.name, phone: formData.phone, isCaptain: true },
              { name: formData.member2Name, phone: formData.member2Phone },
              { name: formData.member3Name, phone: formData.member3Phone },
              { name: formData.member4Name, phone: formData.member4Phone },
              { name: formData.member5Name, phone: formData.member5Phone },
            ],
          }),
        });

        const teamData = await teamRes.json();
        if (teamData.success) {
          setStep('success');
          onSuccess?.();
        } else {
          throw new Error(teamData.error || 'Gagal mendaftarkan tim');
        }
      } else {
        // Individual registration (Male/Female)
        const res = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId,
            name: formData.name,
            phone: formData.phone,
            division,
            clubAffiliation: formData.clubAffiliation || null, // Just for info
          }),
        });

        const data = await res.json();
        if (data.success) {
          setStep('success');
          onSuccess?.();
        } else {
          throw new Error(data.error || 'Gagal mendaftar');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      name: '',
      phone: '',
      clubAffiliation: '',
      teamName: '',
      clubName: '',
      member2Name: '',
      member2Phone: '',
      member3Name: '',
      member3Phone: '',
      member4Name: '',
      member4Phone: '',
      member5Name: '',
      member5Phone: '',
    });
    onClose();
  };

  const divisionColors = {
    MALE: { bg: 'from-red-500/20 to-red-900/20', border: 'border-red-500/30', text: 'text-red-400' },
    FEMALE: { bg: 'from-purple-500/20 to-purple-900/20', border: 'border-purple-500/30', text: 'text-purple-400' },
    LIGA: { bg: 'from-emerald-500/20 to-emerald-900/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
              divisionColors[division].bg
            )}>
              {division === 'MALE' && '♂'}
              {division === 'FEMALE' && '♀'}
              {division === 'LIGA' && '👑'}
            </span>
            Pendaftaran {tournamentName}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Form Step */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 pt-4"
            >
              {!isLiga ? (
                // Individual Registration (Male/Female)
                <>
                  <div className={cn(
                    "p-3 rounded-lg border",
                    "bg-cyan-500/10 border-cyan-500/30"
                  )}>
                    <p className="text-sm text-cyan-300">
                      <strong>Pendaftaran Individual</strong><br />
                      Tier akan ditentukan oleh admin setelah approval.
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Nama Lengkap *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                        className="pl-10 bg-slate-800 border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Nomor WhatsApp (Opsional)</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+628xxx (untuk notifikasi)"
                        className="pl-10 bg-slate-800 border-slate-700"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Isi jika ingin menerima notifikasi via WhatsApp
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Afiliasi Club (Opsional)</Label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <Input
                        value={formData.clubAffiliation}
                        onChange={(e) => setFormData({ ...formData, clubAffiliation: e.target.value })}
                        placeholder="Nama club (jika ada)"
                        className="pl-10 bg-slate-800 border-slate-700"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Hanya untuk informasi, tidak mempengaruhi pembentukan tim
                    </p>
                  </div>
                </>
              ) : (
                // Team Registration (Liga IDM)
                <>
                  <div className={cn(
                    "p-3 rounded-lg border bg-gradient-to-r mb-4",
                    divisionColors[division].bg,
                    divisionColors[division].border
                  )}>
                    <p className="text-sm text-slate-300">
                      <strong>Pendaftaran Tim Liga IDM</strong><br />
                      Daftarkan tim lengkap Anda dengan 5 pemain.
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Nama Club *</Label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <Input
                        value={formData.clubName}
                        onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                        placeholder="Contoh: Alpha Gaming Club"
                        className="pl-10 bg-slate-800 border-slate-700"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Club akan dibuat jika belum terdaftar
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Nama Tim *</Label>
                    <div className="relative mt-1">
                      <Users className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <Input
                        value={formData.teamName}
                        onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                        placeholder="Contoh: Alpha Squad"
                        className="pl-10 bg-slate-800 border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <Label className="text-slate-200 font-semibold">Pemain 1 (Kapten) *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nama *"
                        className="bg-slate-800 border-slate-700"
                      />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="WhatsApp (opsional)"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                  </div>

                  {[2, 3, 4, 5].map((num) => (
                    <div key={num} className="space-y-2">
                      <Label className="text-slate-400 text-sm">Pemain {num} *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={formData[`member${num}Name` as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [`member${num}Name`]: e.target.value })}
                          placeholder="Nama *"
                          className="bg-slate-800 border-slate-700"
                        />
                        <Input
                          value={formData[`member${num}Phone` as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [`member${num}Phone`]: e.target.value })}
                          placeholder="WhatsApp (opsional)"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div className="pt-4 flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 border-slate-700">
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  className={cn(
                    "flex-1",
                    division === 'MALE' && "bg-red-600 hover:bg-red-500",
                    division === 'FEMALE' && "bg-purple-600 hover:bg-purple-500",
                    division === 'LIGA' && "bg-emerald-600 hover:bg-emerald-500"
                  )}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isLiga ? 'Daftarkan Tim' : 'Daftar'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Loading Step */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-cyan-400 mb-4" />
              <p className="text-slate-400">Memproses pendaftaran...</p>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {isLiga ? 'Tim Berhasil Didaftarkan!' : 'Pendaftaran Berhasil!'}
              </h3>
              <p className="text-slate-400 mb-6">
                {isLiga
                  ? 'Tim Anda telah terdaftar untuk Liga IDM. Tunggu jadwal pertandingan.'
                  : 'Anda telah terdaftar. Admin akan menentukan tier dan membentuk tim.'}
              </p>
              <Button onClick={handleClose} className="bg-emerald-600 hover:bg-emerald-500">
                Tutup
              </Button>
            </motion.div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Gagal Mendaftar</h3>
              <p className="text-slate-400 mb-6">
                Terjadi kesalahan. Silakan coba lagi.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 border-slate-700">
                  Tutup
                </Button>
                <Button onClick={() => setStep('form')} className="flex-1 bg-slate-700 hover:bg-slate-600">
                  Coba Lagi
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
