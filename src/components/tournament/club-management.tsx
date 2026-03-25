'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Users, Plus, Edit, Trash2, Shield, Star, 
  Trophy, Building2, UserPlus, X, Search, MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Club {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  totalPoints: number;
  ranking?: number;
  members: ClubMember[];
  teams: { id: string; name: string }[];
  createdAt: string;
}

interface ClubMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: {
    id: string;
    name: string | null;
    phone: string;
    avatar?: string;
  };
}

export function ClubManagement() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clubs');
      const data = await res.json();
      if (data.success) {
        setClubs(data.data);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Gagal memuat data club');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Club Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Kelola club dan tim Liga IDM
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              <Plus className="w-4 h-4 mr-2" />
              Buat Club
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Club Baru</DialogTitle>
            </DialogHeader>
            <CreateClubForm
              onSuccess={() => {
                setShowCreateDialog(false);
                fetchClubs();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari club..."
          className="pl-10 bg-slate-900/50 border-slate-800"
        />
      </div>

      {/* Club List */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Memuat...</div>
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          {searchQuery ? 'Tidak ada club yang ditemukan' : 'Belum ada club terdaftar'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/50 border border-slate-800 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                    {club.logo ? (
                      <img src={club.logo} alt={club.name} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Crown className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{club.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Users className="w-3 h-3" />
                      {club.members.length} anggota
                    </div>
                  </div>
                </div>
                {club.ranking && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    #{club.ranking}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Points</p>
                  <p className="font-bold text-emerald-400">{club.totalPoints}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Teams</p>
                  <p className="font-bold text-cyan-400">{club.teams.length}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Members</p>
                  <p className="font-bold text-purple-400">{club.members.length}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-700 text-xs"
                  onClick={() => setSelectedClub(club)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Detail
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-xs"
                  onClick={() => toast.info('Fitur coming soon')}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Club Detail Modal */}
      <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          {selectedClub && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-emerald-400" />
                  {selectedClub.name}
                </DialogTitle>
              </DialogHeader>
              <ClubDetail club={selectedClub} onClose={() => setSelectedClub(null)} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateClubForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      toast.error('Nama club wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Club berhasil dibuat');
        onSuccess();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat club');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <Label className="text-slate-300">Nama Club *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alpha Squad"
          className="bg-slate-800 border-slate-700 mt-1"
        />
      </div>
      <div>
        <Label className="text-slate-300">Deskripsi</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi singkat club..."
          className="bg-slate-800 border-slate-700 mt-1"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-500"
      >
        {isLoading ? 'Menyimpan...' : 'Buat Club'}
      </Button>
    </div>
  );
}

function ClubDetail({ club, onClose }: { club: Club; onClose: () => void }) {
  const roleColors = {
    OWNER: 'text-yellow-400 bg-yellow-400/10',
    ADMIN: 'text-purple-400 bg-purple-400/10',
    MEMBER: 'text-slate-400 bg-slate-400/10',
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-3 rounded-lg bg-slate-800/50">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">Ranking</p>
          <p className="font-bold text-white">#{club.ranking || '-'}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-slate-800/50">
          <Star className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">Points</p>
          <p className="font-bold text-white">{club.totalPoints}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-slate-800/50">
          <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">Members</p>
          <p className="font-bold text-white">{club.members.length}</p>
        </div>
      </div>

      {/* Members */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Anggota</h4>
        <ScrollArea className="h-48">
          <div className="space-y-2 pr-2">
            {club.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                    {member.user.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.user.name}</p>
                    <p className="text-xs text-slate-500">{member.user.phone}</p>
                  </div>
                </div>
                <Badge className={cn("text-xs", roleColors[member.role])}>
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Teams */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Tim Terdaftar</h4>
        {club.teams.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {club.teams.map((team) => (
              <Badge key={team.id} variant="outline" className="border-slate-700">
                {team.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Belum ada tim terdaftar</p>
        )}
      </div>

      <Button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600">
        Tutup
      </Button>
    </div>
  );
}
