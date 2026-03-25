'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Users, Trophy, ChevronRight, Plus, Check, X, RefreshCw, Zap, Target, Crown, Medal, Star, Play, Shield, Sparkles, ChevronLeft, ArrowRight, Clock, UserPlus, Building2, AlertCircle
} from 'lucide-react';
import { useAppStore, Division } from '@/store';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// ============ INTERFACES ============
interface Match {
  id: string;
  round: number;
  matchNumber: number;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  winnerId?: string;
  homeTeam?: { id: string; name: string };
  awayTeam?: { id: string; name: string };
}

interface Tournament {
  id: string;
  name: string;
  division: Division;
  mode: string;
  bpm: string;
  bracketType: string;
  status: string;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  location?: string;
  rules?: string;
  prizePool?: {
    championAmount: number;
    runnerUpAmount: number;
    thirdPlaceAmount: number;
    mvpAmount: number;
    totalAmount: number;
  };
  registrations?: Registration[];
  teams?: Team[];
  bracket?: { id: string; rounds: number; type: string; matches: Match[]; };
}

interface Registration {
  id: string;
  status: string;
  tier: string | null;
  user: { id: string; name: string | null; phone: string; tier?: string; clubs?: { club: { id: string; name: string } }[]; };
}

interface Team {
  id: string;
  name: string;
  seed?: number;
  members: { user: { id: string; name: string | null; tier?: string } }[];
}

// Simple status config
const STATUS_CONFIG: Record<string, { label: string; color: string; next: string; nextLabel: string }> = {
  SETUP: { label: 'Menyiapkan', color: 'slate', next: 'REGISTRATION', nextLabel: 'Buka Pendaftaran' },
  REGISTRATION: { label: 'Pendaftaran', color: 'green', next: 'APPROVAL', nextLabel: 'Proses Pendaftaran' },
  APPROVAL: { label: 'Approval', color: 'yellow', next: 'TEAM_GENERATION', nextLabel: 'Generate Tim' },
  TEAM_GENERATION: { label: 'Buat Tim', color: 'blue', next: 'BRACKET_GENERATION', nextLabel: 'Generate Bracket' },
  BRACKET_GENERATION: { label: 'Buat Bracket', color: 'purple', next: 'IN_PROGRESS', nextLabel: 'Mulai Turnamen' },
  IN_PROGRESS: { label: 'Sedang Berlangsung', color: 'orange', next: 'FINALIZATION', nextLabel: 'Finalisasi' },
  FINALIZATION: { label: 'Finalisasi', color: 'cyan', next: 'COMPLETED', nextLabel: 'Selesaikan Turnamen' },
  COMPLETED: { label: 'Selesai', color: 'emerald', next: '', nextLabel: '' },
};

export function TournamentManagement() {
  const { user } = useAppStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '', division: 'MALE' as Division, mode: 'GR Arena 3vs3', bpm: 'Random 120-140',
    bracketType: 'SINGLE_ELIMINATION', maxParticipants: 16, startDate: '', location: '',
    championAmount: 0, runnerUpAmount: 0, thirdPlaceAmount: 0, mvpAmount: 0,
  });

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      if (data.success) setTournaments(data.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTournamentDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      const data = await res.json();
      if (data.success) setSelectedTournament(data.data);
    } catch (error) {
      toast.error('Gagal memuat detail');
    }
  };

  const createTournament = async () => {
    if (!formData.name || !formData.startDate) {
      toast.error('Nama dan tanggal harus diisi');
      return;
    }
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Turnamen berhasil dibuat');
        setShowCreateDialog(false);
        fetchTournaments();
        setFormData({ name: '', division: 'MALE', mode: 'GR Arena 3vs3', bpm: 'Random 120-140', bracketType: 'SINGLE_ELIMINATION', maxParticipants: 16, startDate: '', location: '', championAmount: 0, runnerUpAmount: 0, thirdPlaceAmount: 0, mvpAmount: 0 });
      } else {
        toast.error(data.error || 'Gagal membuat turnamen');
      }
    } catch {
      toast.error('Gagal membuat turnamen');
    }
  };

  const statusInfo = selectedTournament ? STATUS_CONFIG[selectedTournament.status] : null;

  // Progress steps
  const steps = ['SETUP', 'REGISTRATION', 'APPROVAL', 'TEAM_GENERATION', 'BRACKET_GENERATION', 'IN_PROGRESS', 'FINALIZATION', 'COMPLETED'];
  const currentStepIndex = selectedTournament ? steps.indexOf(selectedTournament.status) : -1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Kelola Turnamen</h2>
          <p className="text-xs text-slate-400">{tournaments.length} turnamen</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-medium shadow-lg">
              <Plus className="w-4 h-4" /> Buat Baru
            </motion.button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Buat Turnamen Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label className="text-xs text-slate-300">Nama Turnamen *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 bg-slate-800 border-slate-700" placeholder="Contoh: Tarkam #10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Divisi</Label>
                  <Select value={formData.division} onValueChange={(v) => setFormData({ ...formData, division: v as Division })}>
                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="MALE">♂ Male</SelectItem>
                      <SelectItem value="FEMALE">♀ Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Max Peserta</Label>
                  <Input type="number" value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })} className="mt-1 bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-300">Tanggal Mulai *</Label>
                <Input type="datetime-local" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="mt-1 bg-slate-800 border-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Mode</Label>
                  <Select value={formData.mode} onValueChange={(v) => setFormData({ ...formData, mode: v })}>
                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="GR Arena 3vs3">GR Arena 3vs3</SelectItem>
                      <SelectItem value="GR Arena 2vs2">GR Arena 2vs2</SelectItem>
                      <SelectItem value="GR Arena 1vs1">GR Arena 1vs1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">BPM</Label>
                  <Select value={formData.bpm} onValueChange={(v) => setFormData({ ...formData, bpm: v })}>
                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Random 120-140">Random 120-140</SelectItem>
                      <SelectItem value="Random 130-150">Random 130-150</SelectItem>
                      <SelectItem value="Fixed 130">Fixed 130</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-300">Lokasi</Label>
                <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Pub 1">Pub 1</SelectItem>
                    <SelectItem value="Pub 2">Pub 2</SelectItem>
                    <SelectItem value="Pub 3">Pub 3</SelectItem>
                    <SelectItem value="VIP Room">VIP Room</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <Label className="text-xs text-amber-400">💰 Prize Pool (Rp) - Opsional</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-[10px] text-yellow-400">🏆 Juara 1</Label>
                    <Input type="number" value={formData.championAmount || ''} onChange={(e) => setFormData({ ...formData, championAmount: parseInt(e.target.value) || 0 })} className="mt-1 bg-slate-800 border-slate-700 text-yellow-400 text-sm" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-300">🥈 Juara 2</Label>
                    <Input type="number" value={formData.runnerUpAmount || ''} onChange={(e) => setFormData({ ...formData, runnerUpAmount: parseInt(e.target.value) || 0 })} className="mt-1 bg-slate-800 border-slate-700 text-sm" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-amber-400">🥉 Juara 3</Label>
                    <Input type="number" value={formData.thirdPlaceAmount || ''} onChange={(e) => setFormData({ ...formData, thirdPlaceAmount: parseInt(e.target.value) || 0 })} className="mt-1 bg-slate-800 border-slate-700 text-sm" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-cyan-400">⭐ MVP</Label>
                    <Input type="number" value={formData.mvpAmount || ''} onChange={(e) => setFormData({ ...formData, mvpAmount: parseInt(e.target.value) || 0 })} className="mt-1 bg-slate-800 border-slate-700 text-sm" placeholder="0" />
                  </div>
                </div>
                {/* Total Prize */}
                <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total:</span>
                    <span className="text-yellow-400 font-bold">Rp {((formData.championAmount || 0) + (formData.runnerUpAmount || 0) + (formData.thirdPlaceAmount || 0) + (formData.mvpAmount || 0)).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={createTournament} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold">
                Buat Turnamen
              </motion.button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {!selectedTournament ? (
        <TournamentList tournaments={tournaments} isLoading={isLoading} onSelect={fetchTournamentDetails} />
      ) : (
        <TournamentDetail
          tournament={selectedTournament}
          steps={steps}
          currentStepIndex={currentStepIndex}
          statusInfo={statusInfo}
          user={user}
          onBack={() => setSelectedTournament(null)}
          onRefresh={() => fetchTournamentDetails(selectedTournament.id)}
        />
      )}
    </div>
  );
}

// ============ TOURNAMENT LIST ============
function TournamentList({ tournaments, isLoading, onSelect }: { tournaments: Tournament[]; isLoading: boolean; onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState<'ALL' | Division>('ALL');
  const filtered = filter === 'ALL' ? tournaments : tournaments.filter(t => t.division === filter);

  return (
    <div className="space-y-3">
      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['ALL', 'MALE', 'FEMALE'] as const).map((div) => (
          <button
            key={div}
            onClick={() => setFilter(div)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              filter === div
                ? div === 'MALE' ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : div === 'FEMALE' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50"
            )}
          >
            {div === 'ALL' ? 'Semua' : div === 'MALE' ? '♂ Male' : '♀ Female'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Belum ada turnamen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(t.id)}
              className={cn(
                "w-full p-4 rounded-2xl border text-left transition-all",
                t.division === 'MALE' && "bg-slate-800/50 border-red-500/20 hover:border-red-500/40",
                t.division === 'FEMALE' && "bg-slate-800/50 border-purple-500/20 hover:border-purple-500/40"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-lg",
                      t.division === 'MALE' && "text-red-400",
                      t.division === 'FEMALE' && "text-purple-400"
                    )}>
                      {t.division === 'MALE' ? '♂' : '♀'}
                    </span>
                    <h3 className="font-semibold text-white truncate">{t.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                    <span>{STATUS_CONFIG[t.status]?.label}</span>
                    <span className="text-slate-600">•</span>
                    <span>{t.mode || 'GR Arena 3vs3'}</span>
                    <span className="text-slate-600">•</span>
                    <span>{t.location || 'Pub 1'}</span>
                    <span className="text-slate-600">•</span>
                    <span>{t.currentParticipants}/{t.maxParticipants} peserta</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ TOURNAMENT DETAIL ============
function TournamentDetail({ tournament, steps, currentStepIndex, statusInfo, user, onBack, onRefresh }: {
  tournament: Tournament;
  steps: string[];
  currentStepIndex: number;
  statusInfo: { label: string; color: string; next: string; nextLabel: string } | null;
  user: any;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [actionLoading, setActionLoading] = useState(false);

  // Action handlers
  const handleAction = async () => {
    setActionLoading(true);
    try {
      if (tournament.status === 'SETUP') {
        const res = await fetch(`/api/tournaments/${tournament.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'REGISTRATION' }) });
        const data = await res.json();
        if (data.success) {
          toast.success('Pendaftaran dibuka');
        } else {
          toast.error(data.error || 'Gagal');
          return;
        }
      } else if (tournament.status === 'REGISTRATION') {
        const res = await fetch(`/api/tournaments/${tournament.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APPROVAL' }) });
        const data = await res.json();
        if (data.success) {
          toast.success('Silakan approve pendaftaran');
        } else {
          toast.error(data.error || 'Gagal');
          return;
        }
      } else if (tournament.status === 'APPROVAL') {
        const res = await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: tournament.id, generate: true }) });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message);
        } else {
          toast.error(data.error || 'Gagal membuat tim');
          return;
        }
      } else if (tournament.status === 'TEAM_GENERATION') {
        const res = await fetch('/api/brackets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: tournament.id }) });
        const data = await res.json();
        if (data.success) {
          toast.success('Bracket berhasil dibuat! Klik "Mulai Turnamen" untuk melanjutkan.');
        } else {
          toast.error(data.error || 'Gagal membuat bracket');
          return;
        }
      } else if (tournament.status === 'BRACKET_GENERATION') {
        const res = await fetch(`/api/tournaments/${tournament.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'IN_PROGRESS' }) });
        const data = await res.json();
        if (data.success) {
          toast.success('Turnamen dimulai!');
        } else {
          toast.error(data.error || 'Gagal');
          return;
        }
      } else if (tournament.status === 'IN_PROGRESS') {
        const res = await fetch(`/api/tournaments/${tournament.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'FINALIZATION' }) });
        const data = await res.json();
        if (data.success) {
          toast.success('Lanjut ke finalisasi');
        } else {
          toast.error(data.error || 'Gagal');
          return;
        }
      }
      // Refresh data after successful action
      onRefresh();
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Gagal melakukan aksi');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRegs = tournament.registrations?.filter(r => r.status === 'PENDING') || [];
  
  // Reset status handler
  const handleResetStatus = async (targetStatus: string) => {
    const statusLabel = STATUS_CONFIG[targetStatus]?.label || targetStatus;
    if (!confirm(`Yakin ingin kembali ke tahap "${statusLabel}"?\n\nData akan direset sesuai tahap tersebut.`)) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/reset-status`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ targetStatus }) 
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status direset ke "${statusLabel}"`);
        onRefresh();
      } else {
        toast.error(data.error || 'Gagal reset status');
      }
    } catch (err) {
      toast.error('Gagal reset status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Kembali
      </button>

      {/* Tournament Card */}
      <div className={cn(
        "p-4 rounded-2xl border",
        tournament.division === 'MALE' && "bg-gradient-to-br from-red-500/10 to-slate-900 border-red-500/30",
        tournament.division === 'FEMALE' && "bg-gradient-to-br from-purple-500/10 to-slate-900 border-purple-500/30"
      )}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{tournament.division === 'MALE' ? '♂' : '♀'}</span>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{tournament.name}</h2>
            <p className="text-sm text-slate-400">{tournament.mode} • {tournament.location || 'Online'}</p>
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 py-2">
        {steps.map((_, i) => (
          <div key={i} className={cn(
            "w-2 h-2 rounded-full transition-all",
            i < currentStepIndex ? "bg-emerald-400" : i === currentStepIndex ? "bg-cyan-400 w-4" : "bg-slate-600"
          )} />
        ))}
      </div>

      {/* Current Step */}
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            statusInfo?.color === 'green' && "bg-green-500/20",
            statusInfo?.color === 'yellow' && "bg-yellow-500/20",
            statusInfo?.color === 'blue' && "bg-blue-500/20",
            statusInfo?.color === 'purple' && "bg-purple-500/20",
            statusInfo?.color === 'orange' && "bg-orange-500/20",
            statusInfo?.color === 'cyan' && "bg-cyan-500/20",
            statusInfo?.color === 'emerald' && "bg-emerald-500/20",
            !statusInfo?.color && "bg-slate-500/20"
          )}>
            {currentStepIndex >= 7 ? <Trophy className="w-5 h-5 text-emerald-400" /> : <span className="text-sm font-bold text-white">{currentStepIndex + 1}</span>}
          </div>
          <div>
            <p className="font-semibold text-white">{statusInfo?.label}</p>
            <p className="text-xs text-slate-400">Langkah {currentStepIndex + 1} dari 8</p>
          </div>
        </div>

        {/* Step Content */}
        {tournament.status === 'SETUP' && (
          <SetupContent tournament={tournament} />
        )}
        {tournament.status === 'REGISTRATION' && (
          <RegistrationContent tournament={tournament} />
        )}
        {tournament.status === 'APPROVAL' && (
          <ApprovalContent tournament={tournament} user={user} onRefresh={onRefresh} />
        )}
        {tournament.status === 'TEAM_GENERATION' && (
          <TeamContent tournament={tournament} />
        )}
        {tournament.status === 'BRACKET_GENERATION' && (
          <BracketContent tournament={tournament} />
        )}
        {tournament.status === 'IN_PROGRESS' && (
          <ScoringContent tournament={tournament} onRefresh={onRefresh} />
        )}
        {tournament.status === 'FINALIZATION' && (
          <FinalizationContent tournament={tournament} onRefresh={onRefresh} />
        )}
        {tournament.status === 'COMPLETED' && (
          <CompletedContent tournament={tournament} />
        )}

        {/* Action Button */}
        {tournament.status !== 'COMPLETED' && tournament.status !== 'APPROVAL' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAction}
            disabled={actionLoading}
            className={cn(
              "w-full mt-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2",
              tournament.status === 'SETUP' && "bg-gradient-to-r from-green-500 to-emerald-500",
              tournament.status === 'REGISTRATION' && "bg-gradient-to-r from-yellow-500 to-amber-500 text-black",
              tournament.status === 'TEAM_GENERATION' && "bg-gradient-to-r from-blue-500 to-cyan-500",
              tournament.status === 'BRACKET_GENERATION' && "bg-gradient-to-r from-orange-500 to-red-500",
              tournament.status === 'IN_PROGRESS' && "bg-gradient-to-r from-cyan-500 to-blue-500"
            )}
          >
            {actionLoading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : (
              <>
                {statusInfo?.nextLabel}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        )}

        {/* Approval needs manual action */}
        {tournament.status === 'APPROVAL' && pendingRegs.length === 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAction}
            disabled={actionLoading}
            className="w-full mt-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center gap-2"
          >
            {actionLoading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : (
              <>
                Generate Tim <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        )}

        {/* Reset Button - Go back to previous stage */}
        {['TEAM_GENERATION', 'BRACKET_GENERATION', 'IN_PROGRESS', 'FINALIZATION'].includes(tournament.status) && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 mb-2 text-center">Perlu mengulang proses?</p>
            <div className="flex gap-2">
              {tournament.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleResetStatus('BRACKET_GENERATION')}
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset ke Bracket
                </button>
              )}
              {(tournament.status === 'IN_PROGRESS' || tournament.status === 'BRACKET_GENERATION') && (
                <button
                  onClick={() => handleResetStatus('TEAM_GENERATION')}
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset ke Tim
                </button>
              )}
              {(tournament.status === 'IN_PROGRESS' || tournament.status === 'BRACKET_GENERATION' || tournament.status === 'TEAM_GENERATION') && (
                <button
                  onClick={() => handleResetStatus('APPROVAL')}
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset ke Approval
                </button>
              )}
              {tournament.status === 'FINALIZATION' && (
                <button
                  onClick={() => handleResetStatus('IN_PROGRESS')}
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Kembali ke Match
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ STEP CONTENTS ============

function SetupContent({ tournament }: { tournament: Tournament }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-700/30">
          <p className="text-xs text-slate-400">Mode</p>
          <p className="text-white font-medium">{tournament.mode}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-700/30">
          <p className="text-xs text-slate-400">BPM</p>
          <p className="text-white font-medium">{tournament.bpm}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-700/30">
          <p className="text-xs text-slate-400">Max Peserta</p>
          <p className="text-white font-medium">{tournament.maxParticipants}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-700/30">
          <p className="text-xs text-slate-400">Tanggal</p>
          <p className="text-white font-medium">{new Date(tournament.startDate).toLocaleDateString('id-ID')}</p>
        </div>
      </div>
      {tournament.prizePool && (tournament.prizePool.championAmount > 0 || tournament.prizePool.runnerUpAmount > 0) && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-yellow-400 mb-2">💰 Prize Pool</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Juara 1:</span><span className="text-yellow-400 font-semibold">Rp {tournament.prizePool.championAmount.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Juara 2:</span><span className="text-slate-300">Rp {tournament.prizePool.runnerUpAmount.toLocaleString('id-ID')}</span></div>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500 text-center">Klik tombol di bawah untuk membuka pendaftaran</p>
    </div>
  );
}

function RegistrationContent({ tournament }: { tournament: Tournament }) {
  const total = tournament.registrations?.length || 0;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-slate-700/30 text-center">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-slate-400">Pendaftar</p>
        </div>
        <div className="p-3 rounded-xl bg-green-500/10 text-center">
          <p className="text-2xl font-bold text-green-400">{tournament.registrations?.filter(r => r.status === 'APPROVED').length || 0}</p>
          <p className="text-xs text-slate-400">Disetujui</p>
        </div>
        <div className="p-3 rounded-xl bg-yellow-500/10 text-center">
          <p className="text-2xl font-bold text-yellow-400">{tournament.registrations?.filter(r => r.status === 'PENDING').length || 0}</p>
          <p className="text-xs text-slate-400">Pending</p>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-slate-700/30 text-center">
        <p className="text-sm text-slate-300">Peserta dapat mendaftar melalui aplikasi atau WhatsApp</p>
      </div>
    </div>
  );
}

function ApprovalContent({ tournament, user, onRefresh }: { tournament: Tournament; user: any; onRefresh: () => void }) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const pendingRegs = tournament.registrations?.filter(r => r.status === 'PENDING') || [];

  const approve = async (id: string, tier?: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', tier, approvedBy: user?.id }),
      });
      toast.success('Disetujui ✓');
      onRefresh();
    } catch {
      toast.error('Gagal');
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingRegs.length === 0) {
    return (
      <div className="text-center py-4">
        <Check className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
        <p className="text-emerald-400 font-medium">Semua pendaftaran sudah diproses</p>
        <p className="text-xs text-slate-400 mt-1">Klik "Generate Tim" untuk melanjutkan</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[250px] overflow-y-auto">
      <p className="text-xs text-slate-400 mb-2">{pendingRegs.length} pendaftaran menunggu approval:</p>
      {pendingRegs.map((reg) => (
        <div key={reg.id} className="p-3 rounded-xl bg-slate-700/30 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm truncate">{reg.user.name}</p>
            <p className="text-xs text-slate-400">{reg.user.phone}</p>
          </div>
          <div className="flex gap-1 ml-2">
            {true ? (
              <Select onValueChange={(tier) => approve(reg.id, tier)} disabled={processingId === reg.id}>
                <SelectTrigger className="w-20 h-8 bg-green-500/20 border-green-500/30 text-green-400 text-xs">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="S"><span className="text-yellow-400">★ S</span></SelectItem>
                  <SelectItem value="A"><span className="text-purple-400">A</span></SelectItem>
                  <SelectItem value="B"><span className="text-cyan-400">B</span></SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => approve(reg.id)} disabled={processingId === reg.id} className="px-3 h-8 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs">
                ✓
              </motion.button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamContent({ tournament }: { tournament: Tournament }) {
  const teams = tournament.teams || [];
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
        <p className="text-sm text-blue-400">Tim digenerate otomatis dengan komposisi seimbang (S+A+B)</p>
      </div>
      {teams.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
          {teams.map((team) => (
            <div key={team.id} className="p-2 rounded-lg bg-slate-700/30 text-center">
              <p className="text-sm font-medium text-white truncate">{team.name}</p>
              <p className="text-xs text-slate-400">{team.members.length} pemain</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-400 text-sm py-4">Menunggu generate tim...</p>
      )}
    </div>
  );
}

function BracketContent({ tournament }: { tournament: Tournament }) {
  const matches = tournament.bracket?.matches || [];
  const teams = tournament.teams || [];
  
  // Check if bracket exists
  if (!tournament.bracket) {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
          <Target className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
          <p className="text-yellow-400 font-medium">Bracket Belum Dibuat</p>
          <p className="text-xs text-slate-400 mt-1">Klik "Generate Bracket" untuk membuat bracket</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-700/30 text-center">
          <p className="text-sm text-slate-400">{teams.length} tim siap bertanding</p>
        </div>
      </div>
    );
  }
  
  // Count matches with teams assigned
  const matchesWithTeams = matches.filter(m => m.homeTeamId && m.awayTeamId);
  
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
        <p className="text-sm text-purple-400">Bracket: {tournament.bracketType.replace(/_/g, ' ')}</p>
        <p className="text-xs text-slate-400 mt-1">{matches.length} pertandingan ({matchesWithTeams.length} siap dimainkan)</p>
      </div>
      {matches.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-700/30 text-center">
          <p className="text-2xl mb-1">🏆</p>
          <p className="text-sm text-white">Siap untuk dimulai!</p>
          <p className="text-xs text-slate-400 mt-1">{teams.length} tim akan bertanding</p>
        </div>
      )}
    </div>
  );
}

function ScoringContent({ tournament, onRefresh }: { tournament: Tournament; onRefresh: () => void }) {
  const matches = tournament.bracket?.matches || [];
  const completed = matches.filter(m => m.status === 'COMPLETED').length;
  const total = matches.length;
  const [showInput, setShowInput] = useState<string | null>(null);
  const [scores, setScores] = useState<{ home: number; away: number }>({ home: 0, away: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Filter matches that can be played (have both teams)
  const playableMatches = matches.filter(m => m.homeTeamId && m.awayTeamId);
  const inProgressMatches = playableMatches.filter(m => m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED');

  const handleScore = async (matchId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore: scores.home, awayScore: scores.away }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Skor disimpan');
        setShowInput(null);
        onRefresh();
      } else {
        toast.error(data.error || 'Gagal menyimpan skor');
      }
    } catch {
      toast.error('Gagal menyimpan skor');
    } finally {
      setIsLoading(false);
    }
  };

  const startMatch = async (matchId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pertandingan dimulai');
        onRefresh();
      } else {
        toast.error(data.error || 'Gagal memulai pertandingan');
      }
    } catch {
      toast.error('Gagal memulai pertandingan');
    } finally {
      setIsLoading(false);
    }
  };

  // No bracket available
  if (!tournament.bracket) {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-400 mb-2" />
          <p className="text-red-400 font-medium">Bracket belum tersedia</p>
          <p className="text-xs text-slate-400 mt-1">Silakan generate bracket terlebih dahulu</p>
        </div>
      </div>
    );
  }

  // No matches available
  if (matches.length === 0) {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
          <Target className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
          <p className="text-yellow-400 font-medium">Tidak ada pertandingan</p>
          <p className="text-xs text-slate-400 mt-1">Bracket sudah dibuat tapi tidak ada match</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Progress</span>
        <span className="text-cyan-400 font-medium">{completed}/{total}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-slate-700/30">
          <p className="text-lg font-bold text-slate-300">{playableMatches.length}</p>
          <p className="text-[10px] text-slate-500">Match Siap</p>
        </div>
        <div className="p-2 rounded-lg bg-orange-500/10">
          <p className="text-lg font-bold text-orange-400">{playableMatches.filter(m => m.status === 'IN_PROGRESS').length}</p>
          <p className="text-[10px] text-slate-500">Sedang Berlangsung</p>
        </div>
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <p className="text-lg font-bold text-emerald-400">{completed}</p>
          <p className="text-[10px] text-slate-500">Selesai</p>
        </div>
      </div>

      {/* Current Matches */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {inProgressMatches.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-700/30 text-center">
            <p className="text-slate-400 text-sm">Semua pertandingan sudah selesai</p>
          </div>
        ) : (
          inProgressMatches.slice(0, 5).map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-slate-700/30">
              {showInput === m.id ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-400 w-16 truncate">{m.homeTeam?.name || 'TBD'}</span>
                  <Input type="number" className="w-12 h-8 text-center bg-slate-800 border-slate-600" value={scores.home} onChange={(e) => setScores({ ...scores, home: parseInt(e.target.value) || 0 })} />
                  <span className="text-slate-400">-</span>
                  <Input type="number" className="w-12 h-8 text-center bg-slate-800 border-slate-600" value={scores.away} onChange={(e) => setScores({ ...scores, away: parseInt(e.target.value) || 0 })} />
                  <button onClick={() => handleScore(m.id)} disabled={isLoading} className="px-2 h-8 rounded bg-cyan-500 text-white text-xs disabled:opacity-50">✓</button>
                  <button onClick={() => setShowInput(null)} className="px-2 h-8 rounded bg-slate-600 text-white text-xs">✕</button>
                  <span className="text-xs text-slate-400 w-16 truncate text-right">{m.awayTeam?.name || 'TBD'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white truncate flex-1">{m.homeTeam?.name || 'TBD'}</span>
                  {m.status === 'COMPLETED' ? (
                    <span className="text-sm font-bold text-emerald-400 px-2">{m.homeScore} - {m.awayScore}</span>
                  ) : m.status === 'IN_PROGRESS' ? (
                    <button onClick={() => { setShowInput(m.id); setScores({ home: m.homeScore || 0, away: m.awayScore || 0 }); }} className="px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs">Input Skor</button>
                  ) : (
                    <button onClick={() => startMatch(m.id)} disabled={isLoading} className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs disabled:opacity-50">Mulai</button>
                  )}
                  <span className="text-sm text-white truncate flex-1 text-right">{m.awayTeam?.name || 'TBD'}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FinalizationContent({ tournament, onRefresh }: { tournament: Tournament; onRefresh: () => void }) {
  const [championId, setChampionId] = useState('');
  const [runnerUpId, setRunnerUpId] = useState('');
  const [mvpId, setMvpId] = useState('');
  const [loading, setLoading] = useState(false);
  const teams = tournament.teams || [];
  const participants = teams.flatMap(t => t.members.map(m => ({ id: m.user.id, name: m.user.name || 'Unknown' })));

  const finalize = async () => {
    if (!championId || !runnerUpId) {
      toast.error('Pilih Juara 1 dan Juara 2');
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/tournaments/${tournament.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championTeamId: championId, runnerUpTeamId: runnerUpId, mvpId: mvpId || null }),
      });
      toast.success('🎉 Turnamen selesai!');
      onRefresh();
    } catch {
      toast.error('Gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Prize */}
      {tournament.prizePool && tournament.prizePool.championAmount > 0 && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
          <p className="text-yellow-400 font-bold">💰 Rp {tournament.prizePool.championAmount.toLocaleString('id-ID')}</p>
          <p className="text-xs text-slate-400">untuk Juara 1</p>
        </div>
      )}

      {/* Champion */}
      <div>
        <Label className="text-xs text-yellow-400">🏆 Juara 1</Label>
        <Select value={championId} onValueChange={setChampionId}>
          <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue placeholder="Pilih juara 1" /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">{teams.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {/* Runner Up */}
      <div>
        <Label className="text-xs text-slate-300">🥈 Juara 2</Label>
        <Select value={runnerUpId} onValueChange={setRunnerUpId}>
          <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue placeholder="Pilih juara 2" /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">{teams.filter(t => t.id !== championId).map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {/* MVP */}
      <div>
        <Label className="text-xs text-cyan-400">⭐ MVP (Opsional)</Label>
        <Select value={mvpId} onValueChange={setMvpId}>
          <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue placeholder="Pilih MVP" /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">{participants.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={finalize} disabled={loading || !championId || !runnerUpId} className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : (
          <>
            <Trophy className="w-4 h-4" /> Selesaikan Turnamen
          </>
        )}
      </motion.button>
    </div>
  );
}

function CompletedContent({ tournament }: { tournament: Tournament }) {
  const teams = tournament.teams || [];
  return (
    <div className="text-center py-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }} className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 mx-auto mb-4 flex items-center justify-center shadow-lg">
        <Trophy className="w-10 h-10 text-white" />
      </motion.div>
      <h3 className="text-xl font-bold text-white mb-1">🎉 Selesai!</h3>
      <p className="text-sm text-slate-400 mb-4">{tournament.name} telah selesai</p>
      {teams[0] && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400 font-medium">{teams[0].name}</span>
        </div>
      )}
    </div>
  );
}
