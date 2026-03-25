'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Users, Trophy, Calendar, DollarSign,
  ChevronRight, Plus, Eye, Check, X, RefreshCw, Zap, LayoutDashboard, LogOut, Target, Crown, Medal, Star, Play, Heart, Sparkles, Clock, Menu, ArrowLeft, Bell, Wallet, MapPin, Music, Gamepad2, Shield
} from 'lucide-react';
import { useAppStore, Division } from '@/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AdminRoleManagement } from './admin-role-management';

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  bracketSide?: string;
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
  pendingCount?: number;
  approvedCount?: number;
  actualParticipants?: number;
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
  bracket?: {
    id: string;
    rounds: number;
    type: string;
    matches: Match[];
  };
  champion?: {
    championTeamId: string;
    runnerUpTeamId: string;
    thirdPlaceTeamId?: string;
    mvpId?: string;
  };
}

interface Registration {
  id: string;
  status: string;
  tier: string | null;
  user: { 
    name: string | null; 
    phone: string;
    clubs?: { club: { id: string; name: string } }[];
  };
}

interface Team {
  id: string;
  name: string;
  members: { user: { name: string | null } }[];
}

export function AdminDashboard() {
  const { user, logout } = useAppStore();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createStep, setCreateStep] = useState<'form' | 'prize' | 'confirm'>('form');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    division: 'MALE' as Division,
    mode: 'GR Arena 3vs3',
    bpm: 'Random 120-140',
    bracketType: 'SINGLE_ELIMINATION',
    maxParticipants: 16,
    startDate: '',
    location: 'Pub 1',
    rules: '',
    championAmount: 0,
    runnerUpAmount: 0,
    thirdPlaceAmount: 0,
    mvpAmount: 0,
  });

  // Stats for home
  const [stats, setStats] = useState({
    pendingRegistrations: 0,
    pendingDonations: 0,
    activeTournaments: 0,
    totalUsers: 0,
  });

  // Fetch tournaments
  useEffect(() => {
    fetchTournaments();
    fetchStats();
  }, []);

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      if (data.success) {
        setTournaments(data.data);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Gagal memuat data turnamen');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersRes, donationsRes, saweranRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/donations?all=true'),
        fetch('/api/saweran?all=true'),
      ]);
      
      const usersData = await usersRes.json();
      const donationsData = await donationsRes.json();
      const saweranData = await saweranRes.json();

      const pendingDonations = (donationsData.data || []).filter((d: { status: string }) => d.status === 'PENDING').length;
      const pendingSaweran = (saweranData.data || []).filter((s: { status: string }) => s.status === 'PENDING').length;

      setStats({
        pendingRegistrations: 0,
        pendingDonations: pendingDonations + pendingSaweran,
        activeTournaments: tournaments.filter(t => t.status === 'IN_PROGRESS').length,
        totalUsers: usersData.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createTournament = async () => {
    // Validasi
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Nama turnamen harus diisi');
      return;
    }
    if (!formData.startDate) {
      toast.error('Tanggal mulai harus diisi');
      return;
    }

    console.log('[DEBUG] Creating tournament with data:', formData);
    
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log('[DEBUG] API Response:', data);
      
      if (data.success) {
        toast.success('Turnamen berhasil dibuat');
        setShowCreateDialog(false);
        fetchTournaments();
        resetForm();
      } else {
        toast.error(data.error || 'Gagal membuat turnamen');
      }
    } catch (error) {
      console.error('[DEBUG] Error creating tournament:', error);
      toast.error('Gagal membuat turnamen');
    }
  };

  const updateTournamentStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Status turnamen diperbarui');
        fetchTournaments();
      }
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  const approveRegistration = async (id: string, tier: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', tier, approvedBy: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pendaftaran disetujui');
        if (selectedTournament) {
          fetchTournamentDetails(selectedTournament.id);
        }
      }
    } catch (error) {
      toast.error('Gagal menyetujui pendaftaran');
    }
  };

  const updateRegistrationTier = async (id: string, tier: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Tier berhasil diperbarui');
        if (selectedTournament) {
          fetchTournamentDetails(selectedTournament.id);
        }
      }
    } catch (error) {
      toast.error('Gagal memperbarui tier');
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pendaftaran ini?')) return;
    
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pendaftaran dihapus');
        if (selectedTournament) {
          fetchTournamentDetails(selectedTournament.id);
        }
        fetchTournaments();
      }
    } catch (error) {
      toast.error('Gagal menghapus pendaftaran');
    }
  };

  const rejectRegistration = async (id: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pendaftaran ditolak');
        if (selectedTournament) {
          fetchTournamentDetails(selectedTournament.id);
        }
      }
    } catch (error) {
      toast.error('Gagal menolak pendaftaran');
    }
  };

  const generateTeams = async (tournamentId: string) => {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, generate: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        updateTournamentStatus(tournamentId, 'TEAM_GENERATION');
        fetchTournamentDetails(tournamentId);
      }
    } catch (error) {
      toast.error('Gagal generate tim');
    }
  };

  const generateBracket = async (tournamentId: string) => {
    try {
      const res = await fetch('/api/brackets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Bracket berhasil dibuat');
        updateTournamentStatus(tournamentId, 'BRACKET_GENERATION');
      }
    } catch (error) {
      toast.error('Gagal membuat bracket');
    }
  };

  const generatePlayoff = async (tournamentId: string, topAdvance: number = 2) => {
    try {
      const res = await fetch('/api/brackets/playoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, topAdvance }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Playoff bracket berhasil dibuat dengan ${data.data?.teams?.length || 0} tim`);
        fetchTournamentDetails(tournamentId);
        fetchTournaments();
      } else {
        toast.error(data.error || 'Gagal membuat playoff bracket');
      }
    } catch (error) {
      toast.error('Gagal membuat playoff bracket');
    }
  };

  const cancelGenerateTeams = async (tournamentId: string) => {
    if (!confirm('Yakin ingin membatalkan generate tim? Semua tim akan dihapus.')) return;
    
    try {
      const res = await fetch(`/api/teams?tournamentId=${tournamentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Generate tim dibatalkan');
        updateTournamentStatus(tournamentId, 'APPROVAL');
        fetchTournamentDetails(tournamentId);
      }
    } catch (error) {
      toast.error('Gagal membatalkan generate tim');
    }
  };

  const resetTournament = async (tournamentId: string, maxParticipants?: number) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxParticipants }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Turnamen berhasil direset! Dihapus: ${data.data.deleted.registrations} pendaftaran, ${data.data.deleted.teams} tim, ${data.data.deleted.matches} pertandingan`);
        fetchTournaments();
        fetchTournamentDetails(tournamentId);
      } else {
        toast.error(data.error || 'Gagal reset turnamen');
      }
    } catch (error) {
      toast.error('Gagal reset turnamen');
    }
  };

  const fetchTournamentDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTournament(data.data);
      }
    } catch (error) {
      console.error('Error fetching tournament details:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      division: 'MALE',
      mode: 'GR Arena 3vs3',
      bpm: 'Random 120-140',
      bracketType: 'SINGLE_ELIMINATION',
      maxParticipants: 16,
      startDate: '',
      location: 'Pub 1',
      rules: '',
      championAmount: 0,
      runnerUpAmount: 0,
      thirdPlaceAmount: 0,
      mvpAmount: 0,
    });
    setCreateStep('form');
  };

  const statusColors: Record<string, string> = {
    SETUP: 'bg-slate-500',
    REGISTRATION: 'bg-green-500',
    APPROVAL: 'bg-yellow-500',
    TEAM_GENERATION: 'bg-blue-500',
    BRACKET_GENERATION: 'bg-purple-500',
    IN_PROGRESS: 'bg-orange-500',
    FINALIZATION: 'bg-cyan-500',
    COMPLETED: 'bg-emerald-500',
  };

  const divisionColors: Record<string, string> = {
    MALE: 'text-red-400',
    FEMALE: 'text-purple-400',
    LIGA: 'text-emerald-400',
  };

  // Render based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <AdminHome 
          stats={stats} 
          tournaments={tournaments}
          onNavigate={setActiveSection}
          onSelectTournament={(t) => {
            fetchTournamentDetails(t.id);
            setActiveSection('tournament-detail');
          }}
          onCreateTournament={() => {
            setShowCreateDialog(true);
          }}
        />;
      case 'tournaments':
        return <TournamentList 
          tournaments={tournaments}
          onSelect={(t) => {
            fetchTournamentDetails(t.id);
            setActiveSection('tournament-detail');
          }}
          onCreate={() => {
            setShowCreateDialog(true);
          }}
        />;
      case 'registrations':
        return <RegistrationManagement 
          tournaments={tournaments}
          selectedTournament={selectedTournament}
          onSelectTournament={fetchTournamentDetails}
          onApprove={approveRegistration}
        />;
      case 'scoring':
        return <ScoringManagement 
          tournaments={tournaments}
          selectedTournament={selectedTournament}
          onSelectTournament={fetchTournamentDetails}
        />;
      case 'donations':
        return <DonationSaweranManagement />;
      case 'admins':
        return <AdminRoleManagement />;
      case 'settings':
        return <AdminSettings user={user} onLogout={logout} />;
      case 'tournament-detail':
        return selectedTournament ? (
          <TournamentDetail 
            tournament={selectedTournament}
            onBack={() => setActiveSection('tournaments')}
            onUpdateStatus={updateTournamentStatus}
            onGenerateTeams={generateTeams}
            onGenerateBracket={generateBracket}
            onGeneratePlayoff={generatePlayoff}
            onCancelGenerateTeams={cancelGenerateTeams}
            onRefresh={() => fetchTournamentDetails(selectedTournament.id)}
            onApprove={approveRegistration}
            onUpdateTier={updateRegistrationTier}
            onDelete={deleteRegistration}
            onReject={rejectRegistration}
            onReset={resetTournament}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {activeSection !== 'home' && (
              <button 
                onClick={() => setActiveSection('home')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                Admin
              </h1>
              {activeSection !== 'home' && (
                <p className="text-xs text-slate-400 capitalize">{activeSection.replace('-', ' ')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors relative">
              <Bell className="w-5 h-5 text-slate-400" />
              {stats.pendingDonations > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                  {stats.pendingDonations}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 safe-bottom z-40">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { id: 'home', icon: LayoutDashboard, label: 'Home' },
            { id: 'tournaments', icon: Trophy, label: 'Turnamen' },
            { id: 'registrations', icon: Users, label: 'Daftar' },
            { id: 'scoring', icon: Target, label: 'Scoring' },
            { id: 'donations', icon: Heart, label: 'Donasi' },
          ].map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px]",
                  isActive ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Create Tournament Modal */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}
          />
          
          {/* Modal Content */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                Buat Turnamen Baru
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center gap-2 p-4 pb-0">
              {['form', 'prize', 'confirm'].map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    createStep === step ? "bg-cyan-500 text-white" : 
                    ['form', 'prize', 'confirm'].indexOf(createStep) > i ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"
                  )}>{i + 1}</div>
                  {i < 2 && <div className={cn(
                    "flex-1 h-0.5",
                    ['form', 'prize', 'confirm'].indexOf(createStep) > i ? "bg-emerald-500" : "bg-slate-700"
                  )} />}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Step 1: Basic Info */}
              {createStep === 'form' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-slate-300">Nama Turnamen *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-800 border-slate-700 mt-1"
                      placeholder="Tarkam #10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-300">Divisi</Label>
                      <Select value={formData.division} onValueChange={(v) => setFormData({ ...formData, division: v as Division })}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="MALE">♂ Male</SelectItem>
                          <SelectItem value="FEMALE">♀ Female</SelectItem>
                          <SelectItem value="LIGA">👑 Liga IDM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-300">Bracket</Label>
                      <Select value={formData.bracketType} onValueChange={(v) => setFormData({ ...formData, bracketType: v })}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                          <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                          <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                          <SelectItem value="GROUP_STAGE">Group Stage + Playoff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Mode, BPM, Location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-300 flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3" /> Mode
                      </Label>
                      <Input
                        value={formData.mode}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                        className="bg-slate-800 border-slate-700 mt-1"
                        placeholder="GR Arena 3vs3"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-300 flex items-center gap-1">
                        <Music className="w-3 h-3" /> BPM
                      </Label>
                      <Input
                        value={formData.bpm}
                        onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                        className="bg-slate-800 border-slate-700 mt-1"
                        placeholder="Random 120-140"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Lokasi
                    </Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="bg-slate-800 border-slate-700 mt-1"
                      placeholder="Pub 1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-300">Max Peserta</Label>
                      <Input
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 16 })}
                        className="bg-slate-800 border-slate-700 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-300">Tanggal *</Label>
                      <Input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-slate-800 border-slate-700 mt-1"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setCreateStep('prize')}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Lanjut ke Prize Pool
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Prize Pool */}
              {createStep === 'prize' && (
                <div className="space-y-4">
                  <div className="border-t border-slate-700 pt-4">
                    <Label className="text-sm text-cyan-400 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Prize Pool (Rp)
                    </Label>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label className="text-xs text-yellow-400">🏆 Juara 1</Label>
                        <Input
                          type="number"
                          value={formData.championAmount || ''}
                          onChange={(e) => setFormData({ ...formData, championAmount: parseInt(e.target.value) || 0 })}
                          className="bg-slate-800 border-slate-700 mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-300">🥈 Juara 2</Label>
                        <Input
                          type="number"
                          value={formData.runnerUpAmount || ''}
                          onChange={(e) => setFormData({ ...formData, runnerUpAmount: parseInt(e.target.value) || 0 })}
                          className="bg-slate-800 border-slate-700 mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-amber-400">🥉 Juara 3</Label>
                        <Input
                          type="number"
                          value={formData.thirdPlaceAmount || ''}
                          onChange={(e) => setFormData({ ...formData, thirdPlaceAmount: parseInt(e.target.value) || 0 })}
                          className="bg-slate-800 border-slate-700 mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-cyan-400">⭐ MVP</Label>
                        <Input
                          type="number"
                          value={formData.mvpAmount || ''}
                          onChange={(e) => setFormData({ ...formData, mvpAmount: parseInt(e.target.value) || 0 })}
                          className="bg-slate-800 border-slate-700 mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {/* Total Prize Pool */}
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Total Prize Pool:</span>
                        <span className="text-lg font-bold text-yellow-400">
                          Rp {((formData.championAmount || 0) + (formData.runnerUpAmount || 0) + (formData.thirdPlaceAmount || 0) + (formData.mvpAmount || 0)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCreateStep('form')}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-white font-medium transition-colors flex items-center justify-center gap-2 hover:bg-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateStep('confirm')}
                      className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Lanjut Konfirmasi
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {createStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                    <h4 className="font-semibold text-white">Konfirmasi Turnamen</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nama:</span>
                        <span className="text-white font-medium">{formData.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Divisi:</span>
                        <span className={cn(
                          "font-medium",
                          formData.division === 'MALE' && "text-red-400",
                          formData.division === 'FEMALE' && "text-purple-400",
                          formData.division === 'LIGA' && "text-emerald-400"
                        )}>{formData.division}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mode:</span>
                        <span className="text-white">{formData.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">BPM:</span>
                        <span className="text-white">{formData.bpm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lokasi:</span>
                        <span className="text-white">{formData.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Peserta:</span>
                        <span className="text-white">{formData.maxParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Prize:</span>
                        <span className="text-yellow-400 font-semibold">Rp {((formData.championAmount || 0) + (formData.runnerUpAmount || 0) + (formData.thirdPlaceAmount || 0) + (formData.mvpAmount || 0)).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCreateStep('prize')}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-white font-medium transition-colors flex items-center justify-center gap-2 hover:bg-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        createTournament();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium transition-colors flex items-center justify-center gap-2 hover:opacity-90"
                    >
                      <Trophy className="w-4 h-4" />
                      Buat Turnamen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin Home Component
function AdminHome({ stats, tournaments, onNavigate, onSelectTournament, onCreateTournament }: {
  stats: { pendingRegistrations: number; pendingDonations: number; activeTournaments: number; totalUsers: number };
  tournaments: Tournament[];
  onNavigate: (section: string) => void;
  onSelectTournament: (t: Tournament) => void;
  onCreateTournament: () => void;
}) {
  const activeTournaments = tournaments.filter(t => t.status !== 'COMPLETED' && t.status !== 'SETUP');

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard 
          icon={Trophy} 
          value={tournaments.length} 
          label="Turnamen" 
          color="cyan"
          onClick={() => onNavigate('tournaments')}
        />
        <StatCard 
          icon={Users} 
          value={stats.totalUsers} 
          label="Users" 
          color="emerald"
          onClick={() => onNavigate('registrations')}
        />
        <StatCard 
          icon={Heart} 
          value={stats.pendingDonations} 
          label="Pending" 
          color="pink"
          highlight={stats.pendingDonations > 0}
          onClick={() => onNavigate('donations')}
        />
        <StatCard 
          icon={Target} 
          value={stats.activeTournaments} 
          label="Active" 
          color="yellow"
          onClick={() => onNavigate('scoring')}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onCreateTournament();
            }}
            className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-left hover:border-cyan-400/50 transition-all active:scale-[0.98]"
          >
            <Plus className="w-6 h-6 text-cyan-400 mb-2" />
            <p className="font-medium text-white text-sm">Buat Turnamen</p>
            <p className="text-xs text-slate-500">Baru</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('donations')}
            className="p-4 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 text-left hover:border-pink-400/50 transition-all relative active:scale-[0.98]"
          >
            <Wallet className="w-6 h-6 text-pink-400 mb-2" />
            <p className="font-medium text-white text-sm">Konfirmasi</p>
            <p className="text-xs text-slate-500">Donasi/Saweran</p>
            {stats.pendingDonations > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {stats.pendingDonations}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Admin Menu */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400">Menu Admin</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavigate('admins')}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/30 text-left hover:border-purple-400/50 transition-all active:scale-[0.98]"
          >
            <Shield className="w-6 h-6 text-purple-400 mb-2" />
            <p className="font-medium text-white text-sm">Role Admin</p>
            <p className="text-xs text-slate-500">Kelola Akses</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="p-4 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-500/10 border border-slate-500/30 text-left hover:border-slate-400/50 transition-all active:scale-[0.98]"
          >
            <Settings className="w-6 h-6 text-slate-400 mb-2" />
            <p className="font-medium text-white text-sm">Pengaturan</p>
            <p className="text-xs text-slate-500">Settings</p>
          </button>
        </div>
      </div>

      {/* Active Tournaments */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-400">Turnamen Aktif</h3>
          <button type="button" onClick={() => onNavigate('tournaments')} className="text-xs text-cyan-400">
            Lihat Semua →
          </button>
        </div>
        {activeTournaments.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
            <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Belum ada turnamen aktif</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTournaments.slice(0, 3).map((tournament) => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament} 
                onClick={() => onSelectTournament(tournament)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, value, label, color, highlight, onClick }: {
  icon: typeof Trophy;
  value: number;
  label: string;
  color: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/20',
    pink: 'text-pink-400 bg-pink-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl bg-slate-900/50 border flex flex-col items-center transition-all",
        highlight ? "border-red-500/50 animate-pulse" : "border-slate-800 hover:border-slate-700"
      )}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1", colorClasses[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </button>
  );
}

// Tournament Card Component
function TournamentCard({ tournament, onClick }: { tournament: Tournament; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    REGISTRATION: 'bg-green-500',
    APPROVAL: 'bg-yellow-500',
    TEAM_GENERATION: 'bg-blue-500',
    BRACKET_GENERATION: 'bg-purple-500',
    IN_PROGRESS: 'bg-orange-500 animate-pulse',
    FINALIZATION: 'bg-cyan-500',
  };

  const divisionColors: Record<string, string> = {
    MALE: 'border-red-500/30',
    FEMALE: 'border-purple-500/30',
    LIGA: 'border-emerald-500/30',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl bg-slate-900/50 border text-left transition-all hover:bg-slate-800/50 active:scale-[0.98]",
        divisionColors[tournament.division]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn("text-xs", statusColors[tournament.status] || 'bg-slate-500')}>
              {tournament.status.replace('_', ' ')}
            </Badge>
          </div>
          <h4 className="font-semibold text-white truncate">{tournament.name}</h4>
          {/* Mode, BPM, Location */}
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" />
              {tournament.mode || 'GR Arena 3vs3'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              {tournament.bpm || 'Random 120-140'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {tournament.location || 'Pub 1'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-500">
              {(tournament.approvedCount || tournament.actualParticipants || 0)}/{tournament.maxParticipants} disetujui
            </p>
            {(tournament.pendingCount || 0) > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                {tournament.pendingCount} pending
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
      </div>
    </button>
  );
}

// Tournament List Component
function TournamentList({ tournaments, onSelect, onCreate }: {
  tournaments: Tournament[];
  onSelect: (t: Tournament) => void;
  onCreate: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'active') return t.status !== 'COMPLETED';
    if (filter === 'completed') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                filter === f ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500"
              )}
            >
              {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Selesai'}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={onCreate} className="bg-cyan-600 hover:bg-cyan-500">
          <Plus className="w-4 h-4 mr-1" />
          Baru
        </Button>
      </div>

      {filteredTournaments.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Tidak ada turnamen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} onClick={() => onSelect(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tournament Detail Component
function TournamentDetail({ tournament, onBack, onUpdateStatus, onGenerateTeams, onGenerateBracket, onGeneratePlayoff, onCancelGenerateTeams, onRefresh, onApprove, onUpdateTier, onDelete, onReject, onReset }: {
  tournament: Tournament;
  onBack: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onGenerateTeams: (id: string) => void;
  onGenerateBracket: (id: string) => void;
  onGeneratePlayoff: (id: string, topAdvance?: number) => void;
  onCancelGenerateTeams: (id: string) => void;
  onRefresh: () => void;
  onApprove: (id: string, tier: string) => void;
  onUpdateTier: (id: string, tier: string) => void;
  onDelete: (id: string) => void;
  onReject: (id: string) => void;
  onReset: (id: string, maxParticipants?: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'registrations' | 'teams' | 'matches'>('info');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMaxParticipants, setResetMaxParticipants] = useState(tournament.maxParticipants);
  const [showPlayoffDialog, setShowPlayoffDialog] = useState(false);
  const [playoffTopAdvance, setPlayoffTopAdvance] = useState(2);

  return (
    <div className="space-y-4">
      {/* Tournament Header */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Badge className={cn(
              "mb-2",
              tournament.division === 'MALE' && "bg-red-500/20 text-red-400",
              tournament.division === 'FEMALE' && "bg-purple-500/20 text-purple-400",
              tournament.division === 'LIGA' && "bg-emerald-500/20 text-emerald-400"
            )}>
              {tournament.division}
            </Badge>
            <h2 className="text-xl font-bold text-white">{tournament.name}</h2>
            <p className="text-sm text-slate-400">{tournament.mode} • {tournament.bpm}</p>
          </div>
          <Badge className={cn(
            tournament.status === 'IN_PROGRESS' && "bg-orange-500 animate-pulse",
            tournament.status === 'REGISTRATION' && "bg-green-500",
            tournament.status === 'COMPLETED' && "bg-emerald-500",
            !['IN_PROGRESS', 'REGISTRATION', 'COMPLETED'].includes(tournament.status) && "bg-slate-500"
          )}>
            {tournament.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {tournament.status === 'SETUP' && (
            <Button size="sm" onClick={() => onUpdateStatus(tournament.id, 'REGISTRATION')} className="bg-green-600 hover:bg-green-500">
              Buka Pendaftaran
            </Button>
          )}
          {tournament.status === 'REGISTRATION' && (
            <Button size="sm" onClick={() => onUpdateStatus(tournament.id, 'APPROVAL')} className="bg-yellow-600 hover:bg-yellow-500">
              Proses Approval
            </Button>
          )}
          {tournament.status === 'APPROVAL' && (
            <Button size="sm" onClick={() => onGenerateTeams(tournament.id)} className="bg-blue-600 hover:bg-blue-500">
              <RefreshCw className="w-4 h-4 mr-1" />
              Generate Tim
            </Button>
          )}
          {tournament.status === 'TEAM_GENERATION' && (
            <>
              <Button size="sm" onClick={() => onGenerateBracket(tournament.id)} className="bg-purple-600 hover:bg-purple-500">
                Generate Bracket
              </Button>
              <Button size="sm" onClick={() => onCancelGenerateTeams(tournament.id)} className="bg-red-600 hover:bg-red-500">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </>
          )}
          {tournament.status === 'BRACKET_GENERATION' && (
            <Button size="sm" onClick={() => onUpdateStatus(tournament.id, 'IN_PROGRESS')} className="bg-orange-600 hover:bg-orange-500">
              Mulai Turnamen
            </Button>
          )}
          {/* Group Stage Playoff Button - Show when all group matches are completed */}
          {tournament.status === 'IN_PROGRESS' && tournament.bracketType === 'GROUP_STAGE' && tournament.bracket?.type === 'GROUP_STAGE' && (
            <Button size="sm" onClick={() => setShowPlayoffDialog(true)} className="bg-amber-600 hover:bg-amber-500">
              <Trophy className="w-4 h-4 mr-1" />
              Generate Playoff
            </Button>
          )}
          {tournament.status === 'IN_PROGRESS' && (
            <Button size="sm" onClick={() => setActiveTab('matches')} className="bg-cyan-600 hover:bg-cyan-500">
              <Target className="w-4 h-4 mr-1" />
              Input Skor
            </Button>
          )}
          
          {/* Reset Button - Always visible for non-SETUP tournaments */}
          {tournament.status !== 'SETUP' && tournament.status !== 'COMPLETED' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowResetConfirm(true)} 
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-red-400" />
              Reset Turnamen
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Tindakan ini akan menghapus <strong className="text-red-400">SEMUA DATA</strong> termasuk:
            </p>
            <ul className="text-xs text-slate-500 mb-4 space-y-1">
              <li>• Semua pendaftaran peserta</li>
              <li>• Semua tim yang sudah dibuat</li>
              <li>• Semua bracket dan pertandingan</li>
              <li>• Status akan kembali ke REGISTRATION</li>
            </ul>
            
            <div className="mb-4">
              <Label className="text-xs text-slate-300">Max Peserta Baru</Label>
              <Input
                type="number"
                value={resetMaxParticipants}
                onChange={(e) => setResetMaxParticipants(parseInt(e.target.value) || 24)}
                className="bg-slate-800 border-slate-700 mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                {tournament.bracketType === 'DOUBLE_ELIMINATION' && 'Double Elimination: 8 tim = 24 peserta'}
                {tournament.bracketType === 'SINGLE_ELIMINATION' && 'Single Elimination: 16 tim = 48 peserta'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowResetConfirm(false)} 
                className="flex-1 border-slate-700"
              >
                Batal
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  onReset(tournament.id, resetMaxParticipants);
                  setShowResetConfirm(false);
                }} 
                className="flex-1 bg-red-600 hover:bg-red-500"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reset Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Playoff Generation Dialog */}
      {showPlayoffDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPlayoffDialog(false)} />
          <div className="relative bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md p-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Generate Playoff Bracket
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Buat playoff bracket dari hasil group stage. Tim terbaik dari setiap group akan maju ke playoff.
            </p>
            
            <div className="mb-4">
              <Label className="text-xs text-slate-300">Tim yang maju per group</Label>
              <Select value={playoffTopAdvance.toString()} onValueChange={(v) => setPlayoffTopAdvance(parseInt(v))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">Top 1 per group</SelectItem>
                  <SelectItem value="2">Top 2 per group</SelectItem>
                  <SelectItem value="3">Top 3 per group</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Semua pertandingan group stage harus sudah selesai
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowPlayoffDialog(false)} 
                className="flex-1 border-slate-700"
              >
                Batal
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  onGeneratePlayoff(tournament.id, playoffTopAdvance);
                  setShowPlayoffDialog(false);
                }} 
                className="flex-1 bg-amber-600 hover:bg-amber-500"
              >
                <Trophy className="w-4 h-4 mr-1" />
                Generate Playoff
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-lg overflow-x-auto">
        {['info', 'registrations', 'teams', 'matches'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={cn(
              "flex-1 min-w-[80px] py-2 px-3 rounded-md text-xs font-medium transition-all capitalize text-center",
              activeTab === tab ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Disetujui</p>
              <p className="text-lg font-bold text-emerald-400">{tournament.approvedCount || tournament.registrations?.filter(r => r.status === 'APPROVED').length || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-yellow-500/30">
              <p className="text-xs text-slate-500 mb-1">Pending</p>
              <p className="text-lg font-bold text-yellow-400">{tournament.pendingCount || tournament.registrations?.filter(r => r.status === 'PENDING').length || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Max Slot</p>
              <p className="text-lg font-bold text-white">{tournament.maxParticipants}</p>
            </div>
          </div>
          {tournament.prizePool && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20">
              <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Prize Pool
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Juara 1:</span>
                  <span className="text-yellow-400 font-semibold">Rp {tournament.prizePool.championAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Juara 2:</span>
                  <span className="text-slate-300">Rp {tournament.prizePool.runnerUpAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {/* Approved Registrations */}
          {(tournament.registrations?.filter(r => r.status === 'APPROVED') ?? []).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                <Check className="w-3 h-3" />
                Sudah Disetujui ({(tournament.registrations ?? []).filter(r => r.status === 'APPROVED').length})
              </h4>
              <div className="space-y-2">
                {(tournament.registrations ?? []).filter(r => r.status === 'APPROVED').map((reg, index) => (
                  <div key={reg.id} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-start gap-3">
                        <span className="text-sm font-bold text-slate-500 w-6 flex-shrink-0">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium text-white">{reg.user.name}</p>
                          <p className="text-xs text-slate-500">{reg.user.phone}</p>
                          {reg.user.clubs && reg.user.clubs.length > 0 && (
                            <p className="text-xs text-cyan-400 mt-1">Club: {reg.user.clubs[0].club.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Edit Tier Dropdown */}
                        <Select 
                          value={reg.tier || ''} 
                          onValueChange={(tier) => onUpdateTier(reg.id, tier)}
                        >
                          <SelectTrigger className={cn(
                            "w-20 h-7 text-xs border-0",
                            reg.tier === 'S' && "bg-yellow-500/30 text-yellow-400",
                            reg.tier === 'A' && "bg-cyan-500/30 text-cyan-400",
                            reg.tier === 'B' && "bg-slate-500/30 text-slate-300"
                          )}>
                            <SelectValue placeholder="Tier" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="S" className="text-yellow-400">Tier S</SelectItem>
                            <SelectItem value="A" className="text-cyan-400">Tier A</SelectItem>
                            <SelectItem value="B" className="text-slate-300">Tier B</SelectItem>
                          </SelectContent>
                        </Select>
                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(reg.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Pending Registrations */}
          <div>
            <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Menunggu Approval ({tournament.registrations?.filter(r => r.status === 'PENDING').length || 0})
            </h4>
            {tournament.registrations?.filter(r => r.status === 'PENDING').map((reg, index) => (
              <div key={reg.id} className="p-3 rounded-xl bg-slate-900/50 border border-yellow-500/30 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-start gap-3">
                    <span className="text-sm font-bold text-slate-500 w-6 flex-shrink-0">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="font-medium text-white">{reg.user.name}</p>
                      <p className="text-xs text-slate-500">{reg.user.phone}</p>
                      {reg.user.clubs && reg.user.clubs.length > 0 && (
                        <p className="text-xs text-cyan-400 mt-1">Club: {reg.user.clubs[0].club.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Approve with Tier */}
                    <Select onValueChange={(tier) => onApprove(reg.id, tier)}>
                      <SelectTrigger className="w-20 bg-green-600 border-0 text-white text-xs h-7 hover:bg-green-500">
                        <SelectValue placeholder="✓ Setujui" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="S" className="text-yellow-400">Tier S</SelectItem>
                        <SelectItem value="A" className="text-cyan-400">Tier A</SelectItem>
                        <SelectItem value="B" className="text-slate-300">Tier B</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Reject Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(reg.id)}
                      className="h-7 px-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                    >
                      Tolak
                    </Button>
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(reg.id)}
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!tournament.registrations || tournament.registrations.filter(r => r.status === 'PENDING').length === 0) && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                <Check className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <p className="text-slate-500 text-sm">Tidak ada pendaftaran pending</p>
              </div>
            )}
          </div>
          
          {/* Rejected Registrations */}
          {(tournament.registrations ?? []).filter(r => r.status === 'REJECTED').length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-2">
                <X className="w-3 h-3" />
                Ditolak ({(tournament.registrations ?? []).filter(r => r.status === 'REJECTED').length})
              </h4>
              <div className="space-y-2">
                {(tournament.registrations ?? []).filter(r => r.status === 'REJECTED').map((reg, index) => (
                  <div key={reg.id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-bold text-slate-500 w-6 flex-shrink-0">{index + 1}.</span>
                        <div>
                          <p className="font-medium text-white line-through">{reg.user.name}</p>
                          <p className="text-xs text-slate-500">{reg.user.phone}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(reg.id)}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-2">
          {tournament.teams?.map((team) => (
            <div key={team.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="font-medium text-white mb-2">{team.name}</p>
              <div className="flex flex-wrap gap-1">
                {team.members.map((m, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{m.user.name}</Badge>
                ))}
              </div>
            </div>
          ))}
          {(!tournament.teams || tournament.teams.length === 0) && (
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-slate-500">Belum ada tim</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'matches' && (
        <MatchesTab tournament={tournament} onRefresh={onRefresh} />
      )}
    </div>
  );
}

// Match Score Card
function MatchScoreCard({ match, tournamentId, onUpdate }: { 
  match: Match; 
  tournamentId: string;
  onUpdate: () => void;
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore || 0);
  const [awayScore, setAwayScore] = useState(match.awayScore || 0);
  const [showInput, setShowInput] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartMatch = async () => {
    setIsStarting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pertandingan dimulai');
        onUpdate();
      } else {
        toast.error(data.error || 'Gagal memulai pertandingan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsStarting(false);
    }
  };

  const handleUpdateScore = async () => {
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore, awayScore, status: 'COMPLETED' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Skor berhasil disimpan');
        setShowInput(false);
        onUpdate();
      } else {
        toast.error(data.error || 'Gagal memperbarui skor');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const isCompleted = match.status === 'COMPLETED';
  const isInProgress = match.status === 'IN_PROGRESS';
  const isScheduled = match.status === 'SCHEDULED';
  const homeWon = match.winnerId === match.homeTeamId;

  // Check if teams are assigned
  const hasTeams = match.homeTeam && match.awayTeam;

  return (
    <div className={cn(
      "p-3 rounded-xl border",
      isCompleted ? "bg-emerald-500/10 border-emerald-500/20" : 
      isInProgress ? "bg-orange-500/10 border-orange-500/30" : 
      "bg-slate-900/50 border-slate-800"
    )}>
      {/* Match Number Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">Match #{match.matchNumber}</span>
        <Badge className={cn(
          "text-[10px]",
          isCompleted ? "bg-emerald-500/30 text-emerald-400" :
          isInProgress ? "bg-orange-500/30 text-orange-400 animate-pulse" :
          "bg-slate-700 text-slate-400"
        )}>
          {isCompleted ? 'Selesai' : isInProgress ? 'Live' : 'Terjadwal'}
        </Badge>
      </div>

      {showInput ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-xs text-slate-400 mb-1">{match.homeTeam?.name || 'TBD'}</p>
              <Input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                className="w-16 h-10 mx-auto bg-slate-800 border-slate-700 text-center"
              />
            </div>
            <span className="text-slate-500 px-2">vs</span>
            <div className="flex-1 text-center">
              <p className="text-xs text-slate-400 mb-1">{match.awayTeam?.name || 'TBD'}</p>
              <Input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                className="w-16 h-10 mx-auto bg-slate-800 border-slate-700 text-center"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowInput(false)} className="flex-1 border-slate-700">
              Batal
            </Button>
            <Button size="sm" onClick={handleUpdateScore} className="flex-1 bg-emerald-600 hover:bg-emerald-500">
              Simpan
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn("font-medium text-sm", isCompleted && homeWon ? "text-emerald-400" : "text-white")}>
              {match.homeTeam?.name || 'TBD'}
            </p>
          </div>
          <div className="px-4 text-center">
            {isCompleted ? (
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", homeWon ? "text-emerald-400" : "text-slate-400")}>
                  {match.homeScore}
                </span>
                <span className="text-slate-500">-</span>
                <span className={cn("text-lg font-bold", !homeWon ? "text-emerald-400" : "text-slate-400")}>
                  {match.awayScore}
                </span>
              </div>
            ) : isInProgress ? (
              <Button size="sm" onClick={() => setShowInput(true)} className="bg-orange-600 hover:bg-orange-500 h-8">
                Input Skor
              </Button>
            ) : isScheduled && hasTeams ? (
              <Button 
                size="sm" 
                onClick={handleStartMatch} 
                disabled={isStarting}
                className="bg-cyan-600 hover:bg-cyan-500 h-8"
              >
                {isStarting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    Mulai
                  </>
                )}
              </Button>
            ) : (
              <span className="text-xs text-slate-500">Menunggu tim</span>
            )}
          </div>
          <div className="flex-1 text-right">
            <p className={cn("font-medium text-sm", isCompleted && !homeWon ? "text-emerald-400" : "text-white")}>
              {match.awayTeam?.name || 'TBD'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Matches Tab Component - Shows all matches organized by round
function MatchesTab({ tournament, onRefresh }: { 
  tournament: Tournament; 
  onRefresh: () => void;
}) {
  const matches = tournament.bracket?.matches || [];
  
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);
  
  const totalRounds = Object.keys(matchesByRound).length;
  
  // Calculate stats
  const completedMatches = matches.filter(m => m.status === 'COMPLETED').length;
  const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED').length;
  
  // Round names
  const getRoundName = (round: number, total: number) => {
    const fromFinal = total - round;
    if (fromFinal === 0) return '🏆 Final';
    if (fromFinal === 1) return '🥈 Semi Final';
    if (fromFinal === 2) return '🥉 Quarter Final';
    return `Round ${round}`;
  };

  if (matches.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
        <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">Belum ada bracket</p>
        <p className="text-slate-500 text-xs mt-1">Generate bracket terlebih dahulu</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Match Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-lg font-bold text-white">{matches.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
          <p className="text-xs text-slate-500">Terjadwal</p>
          <p className="text-lg font-bold text-cyan-400">{scheduledMatches}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-xs text-slate-500">Selesai</p>
          <p className="text-lg font-bold text-emerald-400">{completedMatches}</p>
        </div>
      </div>

      {/* Matches by Round */}
      {Object.entries(matchesByRound)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([round, roundMatches]) => (
          <div key={round} className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              {getRoundName(parseInt(round), totalRounds)}
              <Badge variant="outline" className="text-xs">
                {roundMatches.filter(m => m.status === 'COMPLETED').length}/{roundMatches.length}
              </Badge>
            </h4>
            {roundMatches.map((match) => (
              <MatchScoreCard 
                key={match.id} 
                match={match} 
                tournamentId={tournament.id} 
                onUpdate={onRefresh} 
              />
            ))}
          </div>
        ))}
    </div>
  );
}

// Registration Management Component
function RegistrationManagement({ tournaments, selectedTournament, onSelectTournament, onApprove }: {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  onSelectTournament: (id: string) => void;
  onApprove: (id: string, tier: string) => void;
}) {
  const tournamentsWithPending = tournaments.filter(t => 
    t.registrations?.some(r => r.status === 'PENDING')
  );

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Pilih Turnamen</h3>
        <div className="space-y-2">
          {tournamentsWithPending.length === 0 ? (
            <p className="text-slate-500 text-sm">Tidak ada pendaftaran pending</p>
          ) : (
            tournamentsWithPending.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTournament(t.id)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  selectedTournament?.id === t.id
                    ? "bg-cyan-500/20 border-cyan-500/30"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                )}
              >
                <p className="font-medium text-white">{t.name}</p>
                <p className="text-xs text-slate-500">
                  {t.registrations?.filter(r => r.status === 'PENDING').length} pending
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Scoring Management Component
function ScoringManagement({ tournaments, selectedTournament, onSelectTournament }: {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  onSelectTournament: (id: string) => void;
}) {
  const activeTournaments = tournaments.filter(t => t.status === 'IN_PROGRESS');

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Turnamen Berlangsung</h3>
        <div className="space-y-2">
          {activeTournaments.length === 0 ? (
            <p className="text-slate-500 text-sm">Tidak ada turnamen yang sedang berlangsung</p>
          ) : (
            activeTournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTournament(t.id)}
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-left hover:border-cyan-500/50 transition-all"
              >
                <p className="font-medium text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.currentParticipants} peserta</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Donation & Saweran Management Component
interface PaymentRecord {
  id: string;
  name: string;
  amount: number;
  message?: string | null;
  paymentMethod?: string | null;
  status: string;
  createdAt: string;
  paidAt?: string | null;
  user?: { name: string | null } | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

function DonationSaweranManagement() {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'completed'>('pending');
  const [paymentType, setPaymentType] = useState<'donation' | 'saweran'>('donation');
  const [donations, setDonations] = useState<PaymentRecord[]>([]);
  const [saweran, setSaweran] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [donationRes, saweranRes] = await Promise.all([
        fetch('/api/donations?all=true'),
        fetch('/api/saweran?all=true'),
      ]);
      const donationData = await donationRes.json();
      const saweranData = await saweranRes.json();
      if (donationData.success) setDonations(donationData.data);
      if (saweranData.success) setSaweran(saweranData.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      if (showLoading) toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string, type: 'donation' | 'saweran') => {
    try {
      const endpoint = type === 'donation' ? '/api/donations' : '/api/saweran';
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'COMPLETED' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${type === 'donation' ? 'Donasi' : 'Saweran'} berhasil dikonfirmasi`);
        fetchData();
      } else {
        toast.error(data.error || 'Gagal mengkonfirmasi');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleReject = async (id: string, type: 'donation' | 'saweran') => {
    try {
      const endpoint = type === 'donation' ? '/api/donations' : '/api/saweran';
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'FAILED' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${type === 'donation' ? 'Donasi' : 'Saweran'} ditolak`);
        fetchData();
      } else {
        toast.error(data.error || 'Gagal menolak');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const currentData = paymentType === 'donation' ? donations : saweran;
  const filteredData = currentData.filter(d => 
    activeSubTab === 'pending' ? d.status === 'PENDING' : d.status === 'COMPLETED'
  );

  const pendingDonations = donations.filter(d => d.status === 'PENDING').length;
  const pendingSaweran = saweran.filter(s => s.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Terakhir diperbarui: {lastUpdate.toLocaleTimeString('id-ID')}
        </p>
        <button
          onClick={() => fetchData()}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setPaymentType('donation')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2",
            paymentType === 'donation'
              ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400"
              : "bg-slate-900/50 border-slate-700 text-slate-400"
          )}
        >
          <Heart className="w-5 h-5" />
          <span className="font-medium">Donasi</span>
          {pendingDonations > 0 && (
            <Badge className="bg-pink-500 text-white text-xs">{pendingDonations}</Badge>
          )}
        </button>
        <button
          onClick={() => setPaymentType('saweran')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2",
            paymentType === 'saweran'
              ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400"
              : "bg-slate-900/50 border-slate-700 text-slate-400"
          )}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">Saweran</span>
          {pendingSaweran > 0 && (
            <Badge className="bg-emerald-500 text-white text-xs">{pendingSaweran}</Badge>
          )}
        </button>
      </div>

      {/* Status Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg border transition-all flex items-center justify-center gap-2",
            activeSubTab === 'pending'
              ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
              : "bg-slate-900/50 border-slate-700 text-slate-400"
          )}
        >
          <Clock className="w-4 h-4" />
          Pending
        </button>
        <button
          onClick={() => setActiveSubTab('completed')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg border transition-all flex items-center justify-center gap-2",
            activeSubTab === 'completed'
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              : "bg-slate-900/50 border-slate-700 text-slate-400"
          )}
        >
          <Check className="w-4 h-4" />
          Selesai
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/5 border border-pink-500/20">
          <p className="text-xs text-slate-400">Total Donasi</p>
          <p className="text-lg font-bold text-pink-400">
            {formatCurrency(donations.filter(d => d.status === 'COMPLETED').reduce((sum, d) => sum + d.amount, 0))}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
          <p className="text-xs text-slate-400">Total Saweran</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(saweran.filter(s => s.status === 'COMPLETED').reduce((sum, s) => sum + s.amount, 0))}
          </p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Memuat...</div>
      ) : filteredData.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
          <p className="text-slate-500">Tidak ada data</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredData.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-xl border",
                item.status === 'PENDING' 
                  ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border-yellow-500/20"
                  : "bg-slate-900/50 border-slate-800"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm",
                    paymentType === 'donation' ? "bg-pink-500/30 text-pink-400" : "bg-emerald-500/30 text-emerald-400"
                  )}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
                <p className={cn(
                  "text-lg font-bold",
                  paymentType === 'donation' ? "text-pink-400" : "text-emerald-400"
                )}>
                  {formatCurrency(item.amount)}
                </p>
              </div>

              {item.message && (
                <p className="text-sm text-slate-400 italic mb-3 pl-13">"{item.message}"</p>
              )}

              {item.status === 'PENDING' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(item.id, paymentType)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-9"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Konfirmasi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(item.id, paymentType)}
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-9"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Tolak
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Admin Settings Component
function AdminSettings({ user, onLogout }: { user: { name?: string | null; phone?: string; role?: string } | null; onLogout: () => void }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Info Admin</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Nama</span>
            <span className="text-white text-sm">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Phone</span>
            <span className="text-white text-sm">{user?.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Role</span>
            <Badge>{user?.role}</Badge>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/20 transition-all"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}
