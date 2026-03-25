'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, QrCode, Building2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  type: 'registration' | 'donation' | 'entry_fee';
  userId?: string;
  tournamentId?: string;
  onSuccess?: (orderId: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  type,
  userId,
  tournamentId,
  onSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'qris' | 'ewallet' | 'va'>('qris');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    orderId: string;
    qrImageUrl?: string;
    redirectUrl?: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!name || !phone) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount,
          userId,
          tournamentId,
          name,
          phone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentData({
          orderId: data.data.orderId,
          qrImageUrl: data.data.qrImageUrl,
          redirectUrl: data.data.redirectUrl,
        });

        // If redirect URL, open it
        if (data.data.redirectUrl) {
          window.open(data.data.redirectUrl, '_blank');
        }

        onSuccess?.(data.data.orderId);
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Pembayaran {type === 'registration' ? 'Pendaftaran' : type === 'donation' ? 'Donasi' : 'Entry Fee'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Amount */}
              <div className="text-center py-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl">
                <p className="text-slate-400 text-sm">Total Pembayaran</p>
                <p className="text-3xl font-bold text-white">
                  Rp {amount.toLocaleString('id-ID')}
                </p>
              </div>

              {!paymentData ? (
                <>
                  {/* Input fields */}
                  <div className="space-y-3">
                    <Input
                      placeholder="Nama Lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <Input
                      placeholder="Nomor HP (cth: +628xxx)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  {/* Payment method selection */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Metode Pembayaran</p>
                    <div className="grid grid-cols-3 gap-2">
                      <PaymentMethodButton
                        icon={<QrCode className="w-5 h-5" />}
                        label="QRIS"
                        selected={selectedMethod === 'qris'}
                        onClick={() => setSelectedMethod('qris')}
                      />
                      <PaymentMethodButton
                        icon={<Wallet className="w-5 h-5" />}
                        label="E-Wallet"
                        selected={selectedMethod === 'ewallet'}
                        onClick={() => setSelectedMethod('ewallet')}
                      />
                      <PaymentMethodButton
                        icon={<Building2 className="w-5 h-5" />}
                        label="VA"
                        selected={selectedMethod === 'va'}
                        onClick={() => setSelectedMethod('va')}
                      />
                    </div>
                  </div>

                  {/* Pay button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !name || !phone}
                    className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Check className="w-5 h-5 mr-2" />
                    )}
                    {isLoading ? 'Memproses...' : 'Bayar Sekarang'}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  {paymentData.qrImageUrl && (
                    <div className="text-center">
                      <p className="text-slate-400 text-sm mb-2">Scan QR untuk bayar</p>
                      <img 
                        src={paymentData.qrImageUrl} 
                        alt="Payment QR" 
                        className="mx-auto rounded-lg"
                      />
                    </div>
                  )}
                  
                  {paymentData.redirectUrl && (
                    <div className="text-center">
                      <p className="text-slate-400 text-sm mb-2">
                        Halaman pembayaran terbuka di tab baru
                      </p>
                      <p className="text-xs text-slate-500">
                        Order ID: {paymentData.orderId}
                      </p>
                    </div>
                  )}

                  <p className="text-center text-sm text-slate-400">
                    Setelah pembayaran berhasil, halaman akan otomatis terupdate
                  </p>

                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300"
                  >
                    Tutup
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PaymentMethodButton({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
        selected
          ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

export default PaymentModal;
