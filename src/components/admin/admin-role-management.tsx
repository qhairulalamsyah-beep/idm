'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, Edit2, Trash2, Users, ChevronRight, X, Check,
  Eye, UserPlus, Search, AlertCircle, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Default menus for permissions
const DEFAULT_MENUS = [
  { key: 'home', label: 'Dashboard' },
  { key: 'tournaments', label: 'Turnamen' },
  { key: 'registrations', label: 'Pendaftaran' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'donations', label: 'Donasi/Saweran' },
  { key: 'admins', label: 'Role Admin' },
  { key: 'users', label: 'Manajemen User' },
  { key: 'clubs', label: 'Manajemen Club' },
  { key: 'notifications', label: 'Notifikasi' },
  { key: 'settings', label: 'Pengaturan' },
];

interface Permission {
  id: string;
  menuKey: string;
  menuLabel: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isDefault: boolean;
  permissions: Permission[];
  _count?: { userAdmins: number };
}

interface AdminUser {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
  adminProfile?: {
    id: string;
    isActive: boolean;
    notes: string | null;
    role: {
      id: string;
      name: string;
      color: string;
    };
  } | null;
}

type ViewMode = 'roles' | 'admins' | 'permissions';

export function AdminRoleManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  const [adminForm, setAdminForm] = useState({
    phone: '',
    name: '',
    email: '',
    roleId: '',
    notes: '',
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchAdmins();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.data);
        if (data.data.length === 0) {
          // Seed default roles
          await fetch('/api/admin/roles/seed', { method: 'POST' });
          const res2 = await fetch('/api/admin/roles');
          const data2 = await res2.json();
          if (data2.success) setRoles(data2.data);
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Gagal memuat data role');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error('Nama role wajib diisi');
      return;
    }

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roleForm,
          permissions: DEFAULT_MENUS
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Role berhasil dibuat');
        setShowRoleModal(false);
        resetRoleForm();
        fetchRoles();
      } else {
        toast.error(data.error || 'Gagal membuat role');
      }
    } catch {
      toast.error('Gagal membuat role');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !roleForm.name.trim()) {
      toast.error('Nama role wajib diisi');
      return;
    }

    try {
      const res = await fetch(`/api/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Role berhasil diperbarui');
        setShowRoleModal(false);
        setEditingRole(null);
        resetRoleForm();
        fetchRoles();
      } else {
        toast.error(data.error || 'Gagal memperbarui role');
      }
    } catch {
      toast.error('Gagal memperbarui role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Yakin ingin menghapus role ini?')) return;

    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Role berhasil dihapus');
        fetchRoles();
      } else {
        toast.error(data.error || 'Gagal menghapus role');
      }
    } catch {
      toast.error('Gagal menghapus role');
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.phone.trim()) {
      toast.error('Nomor telepon wajib diisi');
      return;
    }
    if (!adminForm.roleId) {
      toast.error('Role wajib dipilih');
      return;
    }

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin berhasil ditambahkan');
        setShowAdminModal(false);
        resetAdminForm();
        fetchAdmins();
      } else {
        toast.error(data.error || 'Gagal menambahkan admin');
      }
    } catch {
      toast.error('Gagal menambahkan admin');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Yakin ingin menghapus admin ini?')) return;

    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin berhasil dihapus');
        fetchAdmins();
      } else {
        toast.error(data.error || 'Gagal menghapus admin');
      }
    } catch {
      toast.error('Gagal menghapus admin');
    }
  };

  const handleTogglePermission = async (roleId: string, permissionId: string, field: keyof Permission, value: boolean) => {
    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      const permissions = role.permissions.map(p =>
        p.id === permissionId ? { ...p, [field]: value } : p
      );

      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (data.success) {
        setRoles(roles.map(r => r.id === roleId ? data.data : r));
        if (selectedRole?.id === roleId) {
          setSelectedRole(data.data);
        }
      }
    } catch {
      toast.error('Gagal memperbarui permission');
    }
  };

  const resetRoleForm = () => {
    setRoleForm({ name: '', description: '', color: '#3b82f6' });
  };

  const resetAdminForm = () => {
    setAdminForm({ phone: '', name: '', email: '', roleId: '', notes: '' });
  };

  const openEditRoleModal = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      color: role.color,
    });
    setShowRoleModal(true);
  };

  const filteredAdmins = admins.filter(a =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl">
        {[
          { id: 'roles', label: 'Daftar Role', icon: Shield },
          { id: 'admins', label: 'Daftar Admin', icon: Users },
          { id: 'permissions', label: 'Permission Matrix', icon: Eye },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as ViewMode)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              viewMode === tab.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === 'roles' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400">Daftar Role</h3>
            <Button
              size="sm"
              onClick={() => {
                resetRoleForm();
                setEditingRole(null);
                setShowRoleModal(true);
              }}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Role
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Memuat...</div>
          ) : (
            <div className="space-y-2">
              {roles.map((role) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{role.name}</span>
                          {role.isDefault && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{role.description || 'Tidak ada deskripsi'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {role._count?.userAdmins || 0} admin
                      </Badge>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditRoleModal(role)}
                          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!role.isDefault && (
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'admins' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari admin..."
                className="pl-9 bg-slate-900/50 border-slate-800"
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                resetAdminForm();
                setShowAdminModal(true);
              }}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredAdmins.map((admin) => (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-cyan-400">
                      {admin.name?.[0] || admin.phone.slice(-2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{admin.name || 'Tanpa Nama'}</span>
                        {admin.role === 'SUPER_ADMIN' && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] py-0">
                            SUPER ADMIN
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{admin.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {admin.adminProfile?.role && (
                      <Badge
                        style={{
                          backgroundColor: `${admin.adminProfile.role.color}20`,
                          color: admin.adminProfile.role.color,
                          borderColor: `${admin.adminProfile.role.color}40`
                        }}
                        variant="outline"
                      >
                        {admin.adminProfile.role.name}
                      </Badge>
                    )}
                    {admin.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredAdmins.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Belum ada admin</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'permissions' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400">Permission Matrix</h3>

          {/* Role Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all border",
                  selectedRole?.id === role.id
                    ? "text-white"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
                )}
                style={{
                  backgroundColor: selectedRole?.id === role.id ? `${role.color}30` : undefined,
                  borderColor: selectedRole?.id === role.id ? `${role.color}50` : undefined,
                  color: selectedRole?.id === role.id ? role.color : undefined,
                }}
              >
                {role.name}
              </button>
            ))}
          </div>

          {/* Permission Table */}
          {selectedRole && (
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/80">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Menu</th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-slate-400">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="w-3 h-3" /> View
                        </div>
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-slate-400">
                        <div className="flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" /> Create
                        </div>
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-slate-400">
                        <div className="flex items-center justify-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </div>
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-slate-400">
                        <div className="flex items-center justify-center gap-1">
                          <Trash2 className="w-3 h-3" /> Delete
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEFAULT_MENUS.map((menu) => {
                      const permission = selectedRole.permissions.find(p => p.menuKey === menu.key);
                      return (
                        <tr key={menu.key} className="border-t border-slate-800">
                          <td className="py-3 px-4 text-sm text-white">{menu.label}</td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => permission && handleTogglePermission(
                                selectedRole.id, permission.id, 'canView', !permission.canView
                              )}
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                permission?.canView
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-600 border border-slate-700"
                              )}
                            >
                              {permission?.canView ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => permission && handleTogglePermission(
                                selectedRole.id, permission.id, 'canCreate', !permission.canCreate
                              )}
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                permission?.canCreate
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-600 border border-slate-700"
                              )}
                            >
                              {permission?.canCreate ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => permission && handleTogglePermission(
                                selectedRole.id, permission.id, 'canEdit', !permission.canEdit
                              )}
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                permission?.canEdit
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-600 border border-slate-700"
                              )}
                            >
                              {permission?.canEdit ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => permission && handleTogglePermission(
                                selectedRole.id, permission.id, 'canDelete', !permission.canDelete
                              )}
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                permission?.canDelete
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-600 border border-slate-700"
                              )}
                            >
                              {permission?.canDelete ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!selectedRole && (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Pilih role untuk melihat permission</p>
            </div>
          )}
        </div>
      )}

      {/* Role Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setShowRoleModal(false);
                setEditingRole(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-4">
                {editingRole ? 'Edit Role' : 'Tambah Role Baru'}
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Nama Role *</Label>
                  <Input
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="contoh: Moderator"
                  />
                </div>

                <div>
                  <Label className="text-sm text-slate-300">Deskripsi</Label>
                  <Textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="Deskripsi singkat role ini..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-sm text-slate-300">Warna</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="color"
                      value={roleForm.color}
                      onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                    <div className="flex gap-2">
                      {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setRoleForm({ ...roleForm, color })}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all",
                            roleForm.color === color ? "border-white scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {editingRole ? 'Simpan' : 'Buat Role'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowAdminModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-4">Tambah Admin Baru</h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Nomor Telepon *</Label>
                  <Input
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="+628xxxxxxxxxx"
                  />
                  <p className="text-xs text-slate-500 mt-1">Jika user sudah ada, akan dipromosikan menjadi admin</p>
                </div>

                <div>
                  <Label className="text-sm text-slate-300">Nama</Label>
                  <Input
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="Nama admin"
                  />
                </div>

                <div>
                  <Label className="text-sm text-slate-300">Email</Label>
                  <Input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <Label className="text-sm text-slate-300">Role *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setAdminForm({ ...adminForm, roleId: role.id })}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          adminForm.roleId === role.id
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <span className="text-sm font-medium text-white">{role.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-slate-300">Catatan</Label>
                  <Textarea
                    value={adminForm.notes}
                    onChange={(e) => setAdminForm({ ...adminForm, notes: e.target.value })}
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="Catatan opsional..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAdminModal(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                  onClick={handleCreateAdmin}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Tambah Admin
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
