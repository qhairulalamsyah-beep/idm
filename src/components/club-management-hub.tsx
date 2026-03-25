'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, Plus, X, Shield, Crown, UserCog,
  Search, Trash2, Edit2, ChevronRight, Check, AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ClubMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    phone: string;
    tier: string | null;
    points: number;
    avatar?: string | null;
  };
}

interface Club {
  id: string;
  name: string;
  logo?: string | null;
  description?: string | null;
  totalPoints: number;
  _count?: { members: number; teams: number };
  members?: ClubMember[];
  userRole?: string;
}

interface ClubManagementHubProps {
  userId: string;
  onSelectClub?: (clubId: string) => void;
}

export function ClubManagementHub({ userId, onSelectClub }: ClubManagementHubProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, [userId]);

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clubs/manage?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setClubs(data.data);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClubDetails = async (clubId: string) => {
    try {
      const res = await fetch(`/api/clubs/manage?clubId=${clubId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedClub({ ...data.data, userRole: clubs.find(c => c.id === clubId)?.userRole });
      }
    } catch (error) {
      console.error('Error fetching club details:', error);
    }
  };

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    fetchClubDetails(club.id);
    onSelectClub?.(club.id);
  };

  const handleBack = () => {
    setSelectedClub(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Club List View
  if (!selectedClub) {
    return (
      <div className="p-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Club Hub
            </span>
          </h2>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Club
          </Button>
        </div>

        {clubs.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Belum Ada Club</h3>
            <p className="text-slate-400 mb-4">Buat club untuk mengelola roster tim Anda</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Club Baru
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {clubs.map((club) => (
              <ClubCard 
                key={club.id} 
                club={club} 
                onClick={() => handleSelectClub(club)}
              />
            ))}
          </div>
        )}

        {/* Create Club Modal */}
        <CreateClubModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userId={userId}
          onSuccess={(newClub) => {
            setClubs([...clubs, newClub]);
            setShowCreateModal(false);
          }}
        />
      </div>
    );
  }

  // Club Detail View
  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-slate-400 mb-4 hover:text-white transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span>Kembali</span>
      </button>

      {/* Club Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
          {selectedClub.logo || '🏢'}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{selectedClub.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              <Crown className="w-3 h-3 mr-1" />
              {selectedClub.userRole}
            </Badge>
            <Badge variant="outline" className="border-slate-500/30 text-slate-400">
              {selectedClub._count?.members || 0} anggota
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Anggota" value={selectedClub.members?.length || 0} icon={<Users />} />
        <StatCard label="Tim" value={selectedClub._count?.teams || 0} icon={<Shield />} />
        <StatCard label="Poin" value={selectedClub.totalPoints} icon={<Crown />} />
      </div>

      {/* Members List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Anggota Club</CardTitle>
          {selectedClub.userRole !== 'MEMBER' && (
            <Button
              size="sm"
              onClick={() => setShowAddMemberModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedClub.members?.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                canManage={selectedClub.userRole === 'OWNER'}
                clubId={selectedClub.id}
                onUpdate={() => fetchClubDetails(selectedClub.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        clubId={selectedClub.id}
        userId={userId}
        onSuccess={() => {
          setShowAddMemberModal(false);
          fetchClubDetails(selectedClub.id);
        }}
      />
    </div>
  );
}

// Club Card Component
function ClubCard({ club, onClick }: { club: Club; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl cursor-pointer transition-all",
        "bg-gradient-to-r from-emerald-900/20 via-slate-900 to-slate-900",
        "border border-emerald-500/20 hover:border-emerald-500/40",
        "shadow-[0_0_20px_rgba(16,185,129,0.1)]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center text-2xl border border-emerald-500/30">
          {club.logo || '🏢'}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{club.name}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{club._count?.members || 0} anggota</span>
            <span>•</span>
            <span>{club._count?.teams || 0} tim</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">{club.totalPoints.toLocaleString()} pts</span>
          </div>
        </div>
        <Badge variant="outline" className={cn(
          club.userRole === 'OWNER' && "border-yellow-500/30 text-yellow-400",
          club.userRole === 'ADMIN' && "border-purple-500/30 text-purple-400"
        )}>
          {club.userRole === 'OWNER' && <Crown className="w-3 h-3 mr-1" />}
          {club.userRole}
        </Badge>
        <ChevronRight className="w-5 h-5 text-slate-500" />
      </div>
    </motion.div>
  );
}

// Stat Card
function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-800">
      <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
        {icon}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

// Member Card
function MemberCard({ 
  member, 
  canManage, 
  clubId,
  onUpdate 
}: { 
  member: ClubMember; 
  canManage: boolean;
  clubId: string;
  onUpdate: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const tierEmoji = member.user.tier === 'S' ? '⭐' : member.user.tier === 'A' ? '🔸' : '🔹';

  const handleRemove = async () => {
    if (!confirm('Hapus anggota ini dari club?')) return;
    
    try {
      const res = await fetch(`/api/clubs/members?clubId=${clubId}&userId=${member.userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
      onClick={() => canManage && member.role !== 'OWNER' && setShowActions(!showActions)}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg">
        {member.user.avatar || '👤'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-white truncate">{member.user.name || 'Unknown'}</p>
          <span className="text-sm">{tierEmoji}</span>
        </div>
        <p className="text-xs text-slate-500">{member.user.points} pts</p>
      </div>
      <Badge variant="outline" className={cn(
        member.role === 'OWNER' && "border-yellow-500/30 text-yellow-400",
        member.role === 'ADMIN' && "border-purple-500/30 text-purple-400",
        member.role === 'MEMBER' && "border-slate-500/30 text-slate-400"
      )}>
        {member.role === 'OWNER' && <Crown className="w-3 h-3 mr-1" />}
        {member.role}
      </Badge>

      {showActions && canManage && member.role !== 'OWNER' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-2"
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              // Handle role change
            }}
            className="text-slate-400 hover:text-white"
          >
            <UserCog className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Create Club Modal
function CreateClubModal({ 
  isOpen, 
  onClose, 
  userId,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  userId: string;
  onSuccess: (club: Club) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/clubs/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, ownerId: userId }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
        setName('');
        setDescription('');
      }
    } catch (error) {
      console.error('Error creating club:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Buat Club Baru</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nama Club</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama club"
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Deskripsi (opsional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat club"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !name}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
          >
            {isLoading ? 'Membuat...' : 'Buat Club'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// Add Member Modal
function AddMemberModal({
  isOpen,
  onClose,
  clubId,
  userId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  userId: string;
  onSuccess: () => void;
}) {
  const [searchPhone, setSearchPhone] = useState('');
  const [foundUser, setFoundUser] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchPhone) return;
    
    try {
      const res = await fetch(`/api/admin/users?phone=${searchPhone}`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setFoundUser(data.data[0]);
      } else {
        setFoundUser(null);
      }
    } catch (error) {
      console.error('Error searching user:', error);
    }
  };

  const handleAdd = async () => {
    if (!foundUser) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/clubs/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          userId: foundUser.id,
          addedBy: userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        setSearchPhone('');
        setFoundUser(null);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Tambah Anggota</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Nomor HP (cth: +628xxx)"
              className="bg-slate-800 border-slate-700 flex-1"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {foundUser && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="font-medium text-white">{foundUser.name}</p>
              <p className="text-sm text-slate-400">{searchPhone}</p>
              <Button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500"
              >
                <Check className="w-4 h-4 mr-2" />
                Tambah ke Club
              </Button>
            </div>
          )}

          {searchPhone && !foundUser && (
            <div className="p-4 rounded-xl bg-slate-800/50 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-slate-400 text-sm">User tidak ditemukan</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ClubManagementHub;
