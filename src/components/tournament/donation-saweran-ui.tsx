'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Gift, DollarSign, Users, Send, Loader2, CheckCircle2, Sparkles,
  Wallet, ArrowLeft, Eye, Clock, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface DonationSaweranUIProps {
  tournamentId?: string;
  prizePoolId?: string;
  defaultTab?: 'donation' | 'saweran';
  onDonationComplete?: () => void;
}

interface DonationRecord {
  id: string;
  name: string;
  amount: number;
  message?: string;
  paymentMethod?: string;
  status: string;
  createdAt: string;
}

const presetAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

const paymentMethods = [
  { id: 'DANA', name: 'DANA', number: '0812-3456-7890', logo: '💳', color: 'bg-blue-500' },
  { id: 'OVO', name: 'OVO', number: '0812-3456-7890', logo: '💜', color: 'bg-purple-500' },
  { id: 'GOPAY', name: 'GoPay', number: '0812-3456-7890', logo: '💚', color: 'bg-green-500' },
  { id: 'SHOPEEPAY', name: 'ShopeePay', number: '0812-3456-7890', logo: '🧡', color: 'bg-orange-500' },
  { id: 'BCA', name: 'BCA Transfer', number: '1234567890', logo: '🏦', color: 'bg-blue-600' },
  { id: 'MANDIRI', name: 'Mandiri Transfer', number: '0987654321', logo: '🏦', color: 'bg-yellow-600' },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function DonationSaweranUI({ tournamentId, prizePoolId, defaultTab = 'donation', onDonationComplete }: DonationSaweranUIProps) {
  const [activeTab, setActiveTab] = useState<'donation' | 'saweran'>(defaultTab);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [saweran, setSaweran] = useState<DonationRecord[]>([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalSaweran, setTotalSaweran] = useState(0);

  const fetchDonations = async () => {
    try {
      const res = await fetch('/api/donations');
      const data = await res.json();
      if (data.success) {
        setDonations(data.data);
        setTotalDonations(data.total);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  const fetchSaweran = async () => {
    try {
      const res = await fetch(`/api/saweran${prizePoolId ? `?prizePoolId=${prizePoolId}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setSaweran(data.data);
        setTotalSaweran(data.total);
      }
    } catch (error) {
      console.error('Error fetching saweran:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDonations(), fetchSaweran()]);
    };
    loadData();
  }, [prizePoolId]);

  return (
    <div className="space-y-4">
      {/* Tab Header */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('donation')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2",
            activeTab === 'donation'
              ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400"
              : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600"
          )}
        >
          <Heart className="w-4 h-4" />
          <span className="font-medium">Donasi</span>
        </button>
        <button
          onClick={() => setActiveTab('saweran')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2",
            activeTab === 'saweran'
              ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400"
              : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Saweran</span>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'donation' ? (
          <motion.div
            key="donation"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <DonationContent
              donations={donations}
              totalDonations={totalDonations}
              onRefresh={fetchDonations}
              onComplete={onDonationComplete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="saweran"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <SaweranContent
              saweran={saweran}
              totalSaweran={totalSaweran}
              prizePoolId={prizePoolId}
              onRefresh={fetchSaweran}
              onComplete={onDonationComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Donation Content Component
function DonationContent({ 
  donations, 
  totalDonations, 
  onRefresh, 
  onComplete 
}: { 
  donations: DonationRecord[];
  totalDonations: number;
  onRefresh: () => void;
  onComplete?: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  return (
    <>
      <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="font-semibold text-white">Dukung Platform</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Donasi</p>
            <p className="text-lg font-bold text-pink-400">{formatCurrency(totalDonations)}</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Bantu penyelenggaraan IDM League Season 2...
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowListModal(true)}
            variant="outline"
            className="flex-1 border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Daftar Donasi
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500"
          >
            <Heart className="w-4 h-4 mr-2" />
            Donasi
          </Button>
        </div>
      </div>

      <DonationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="donation"
        onComplete={() => {
          onRefresh();
          onComplete?.();
        }}
      />

      <DonationListModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        donations={donations}
        type="donation"
      />
    </>
  );
}

// Saweran Content Component
function SaweranContent({ 
  saweran, 
  totalSaweran,
  prizePoolId, 
  onRefresh, 
  onComplete 
}: { 
  saweran: DonationRecord[];
  totalSaweran: number;
  prizePoolId?: string;
  onRefresh: () => void;
  onComplete?: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  return (
    <>
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-white">Tambah Prize Pool</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Saweran</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalSaweran)}</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Saweran Anda akan langsung menambah hadiah turnamen.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowListModal(true)}
            variant="outline"
            className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Penyawer
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Sawer
          </Button>
        </div>
      </div>

      {/* Saweran List - shown below the card */}
      {saweran.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Penyawer Pekan Ini
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {saweran.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <DonationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="saweran"
        prizePoolId={prizePoolId}
        onComplete={() => {
          onRefresh();
          onComplete?.();
        }}
      />

      <DonationListModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        donations={saweran}
        type="saweran"
      />
    </>
  );
}

// Donation Modal with Payment Flow
interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'donation' | 'saweran';
  prizePoolId?: string;
  onComplete?: () => void;
}

function DonationModal({ isOpen, onClose, type, prizePoolId, onComplete }: DonationModalProps) {
  const [step, setStep] = useState<'form' | 'payment' | 'loading' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: '',
    amount: 50000,
    message: '',
    paymentMethod: '',
  });
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<typeof paymentMethods[0] | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.name || formData.amount < 10000) {
      toast.error('Nama wajib diisi dan minimal Rp 10.000');
      return;
    }
    setStep('payment');
  };

  const handlePaymentSelect = (method: typeof paymentMethods[0]) => {
    setSelectedPayment(method);
    setFormData({ ...formData, paymentMethod: method.id });
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) {
      toast.error('Pilih metode pembayaran terlebih dahulu');
      return;
    }

    setStep('loading');

    try {
      const endpoint = type === 'donation' ? '/api/donations' : '/api/saweran';
      const body = type === 'donation'
        ? formData
        : { ...formData, prizePoolId };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setCreatedId(data.data.id);
        setStep('success');
        onComplete?.();
        toast.success(type === 'donation' ? 'Donasi berhasil!' : 'Saweran berhasil!');
      } else {
        throw new Error(data.error || 'Gagal memproses');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan');
      setStep('payment');
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ name: '', amount: 50000, message: '', paymentMethod: '' });
    setCustomAmount('');
    setSelectedPayment(null);
    setCreatedId(null);
    onClose();
  };

  const colors = type === 'donation'
    ? { bg: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', button: 'from-pink-600 to-rose-600', text: 'text-pink-400' }
    : { bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', button: 'from-emerald-600 to-teal-600', text: 'text-emerald-400' };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'donation' ? (
              <>
                <Heart className="w-5 h-5 text-pink-400" />
                Donasi Platform
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Saweran Prize Pool
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pt-4"
            >
              {/* Name */}
              <div>
                <Label className="text-slate-300">Nama *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama Anda"
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>

              {/* Preset Amounts */}
              <div>
                <Label className="text-slate-300">Pilih Nominal</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setFormData({ ...formData, amount });
                        setCustomAmount('');
                      }}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-sm transition-all",
                        formData.amount === amount && !customAmount
                          ? `bg-gradient-to-r ${colors.bg} ${colors.border} text-white`
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                      )}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <Label className="text-slate-300">Atau masukkan nominal lain</Label>
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCustomAmount(e.target.value);
                    setFormData({ ...formData, amount: val });
                  }}
                  placeholder="Minimal Rp 10.000"
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>

              {/* Selected Amount Display */}
              {formData.amount > 0 && (
                <div className={cn(
                  "p-3 rounded-lg border bg-gradient-to-r text-center",
                  colors.bg,
                  colors.border
                )}>
                  <span className="text-sm text-slate-400">Total:</span>
                  <p className="text-2xl font-bold text-white">{formatCurrency(formData.amount)}</p>
                </div>
              )}

              {/* Message */}
              <div>
                <Label className="text-slate-300">Pesan (Optional)</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Pesan semangat untuk peserta..."
                  className="bg-slate-800 border-slate-700 mt-1 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 border-slate-700">
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  className={cn("flex-1 bg-gradient-to-r hover:opacity-90", colors.button)}
                >
                  Metode Pembayaran
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pt-4"
            >
              {/* Summary */}
              <div className={cn(
                "p-3 rounded-lg border bg-gradient-to-r",
                colors.bg,
                colors.border
              )}>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total {type === 'donation' ? 'Donasi' : 'Saweran'}</span>
                  <p className="text-xl font-bold text-white">{formatCurrency(formData.amount)}</p>
                </div>
                <p className="text-sm text-slate-400 mt-1">Atas nama: {formData.name}</p>
              </div>

              {/* Payment Methods */}
              <div>
                <Label className="text-slate-300">Pilih Metode Pembayaran</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handlePaymentSelect(method)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        selectedPayment?.id === method.id
                          ? `bg-gradient-to-r ${colors.bg} ${colors.border}`
                          : "bg-slate-800 border-slate-700 hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{method.logo}</span>
                        <span className="font-medium text-white text-sm">{method.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Payment Info */}
              {selectedPayment && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Transfer ke:</p>
                  <p className="font-bold text-white">{selectedPayment.name}</p>
                  <p className="text-lg font-mono text-cyan-400">{selectedPayment.number}</p>
                  <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Transfer sesuai nominal: {formatCurrency(formData.amount)}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('form')} 
                  className="flex-1 border-slate-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={!selectedPayment}
                  className={cn("flex-1 bg-gradient-to-r hover:opacity-90", colors.button)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {type === 'donation' ? 'Donasi Sekarang' : 'Sawer Sekarang'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-cyan-400 mb-4" />
              <p className="text-slate-400">Memproses pembayaran...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {type === 'donation' ? 'Donasi Anda Berhasil!' : 'Saweran Anda Berhasil!'}
              </h3>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {type === 'donation' 
                    ? 'Terima kasih atas donasi Anda! Kami akan memverifikasi pembayaran Anda. Setelah diverifikasi, donasi Anda akan ditampilkan dalam daftar donatur.'
                    : 'Terima kasih atas saweran Anda! Kami akan memverifikasi pembayaran Anda. Setelah diverifikasi, saweran Anda akan ditampilkan dalam daftar penyawer dan menambah prize pool turnamen.'}
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-xl border mb-4",
                colors.bg,
                colors.border
              )}>
                <p className="text-sm text-white font-semibold mb-1">Total {type === 'donation' ? 'Donasi' : 'Saweran'}:</p>
                <p className={cn("text-2xl font-bold", colors.text)}>{formatCurrency(formData.amount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                <p className="text-sm text-yellow-400 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Menunggu verifikasi dari admin
                </p>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                🙏 Terima kasih ya! Kontribusi Anda sangat berarti!
              </p>
              <Button onClick={handleClose} className={cn("bg-gradient-to-r hover:opacity-90", colors.button)}>
                Tutup
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Donation List Modal
interface DonationListModalProps {
  isOpen: boolean;
  onClose: () => void;
  donations: DonationRecord[];
  type: 'donation' | 'saweran';
}

function DonationListModal({ isOpen, onClose, donations, type }: DonationListModalProps) {
  const colors = type === 'donation'
    ? { text: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' }
    : { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'donation' ? (
              <>
                <Heart className="w-5 h-5 text-pink-400" />
                Daftar Donatur
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Daftar Penyawer
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4">
          {/* Total */}
          <div className={cn(
            "p-3 rounded-lg border mb-4 text-center",
            colors.bg,
            colors.border
          )}>
            <p className="text-sm text-slate-400">Total {type === 'donation' ? 'Donasi' : 'Saweran'}</p>
            <p className={cn("text-2xl font-bold", colors.text)}>{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-slate-500">{donations.length} {type === 'donation' ? 'donatur' : 'penyawer'}</p>
          </div>

          {/* List */}
          <ScrollArea className="h-[300px]">
            {donations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Belum ada {type === 'donation' ? 'donatur' : 'penyawer'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {donations.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                        colors.bg
                      )}>
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                        {item.message && (
                          <p className="text-xs text-slate-400 italic">"{item.message}"</p>
                        )}
                      </div>
                    </div>
                    <p className={cn("font-bold", colors.text)}>{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { DonationModal, DonationListModal };
