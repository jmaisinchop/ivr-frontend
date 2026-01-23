'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { RoleBadge } from '@/components/ui/Badge';
import { usersApi, channelLimitsApi } from '@/lib/api';
import { User, UserRole, ChannelLimit } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, Edit2, Key, Search, Users, Shield, Phone } from 'lucide-react';
import { PageLoading } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user: currentUser, isAdmin, isSupervisor } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [channelLimits, setChannelLimits] = useState<ChannelLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.CALLCENTER,
    canAccessIvrs: true,
    extension: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [newChannelLimit, setNewChannelLimit] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, limitsRes] = await Promise.all([
        usersApi.getAll(),
        channelLimitsApi.getAll().catch(() => ({ data: [] })),
      ]);
      setUsers(usersRes.data);
      setChannelLimits(limitsRes.data);
    } catch (error) {
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.username} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const getChannelLimit = (userId: string) => {
    const limit = channelLimits.find((cl) => cl.user?.id === userId);
    return limit?.maxChannels || 0;
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await usersApi.create(formData);
      toast.success('Usuario creado');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creando usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await usersApi.update(selectedUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        canAccessIvrs: formData.canAccessIvrs,
        extension: formData.extension,
      });
      toast.success('Usuario actualizado');
      setShowEditModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error actualizando usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    setSubmitting(true);
    try {
      await usersApi.updatePassword(selectedUser.id, newPassword);
      toast.success('Contraseña actualizada');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error cambiando contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignChannels = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await channelLimitsApi.assign(selectedUser.id, newChannelLimit);
      toast.success('Canales asignados');
      setShowChannelModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error asignando canales');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      canAccessIvrs: user.canAccessIvrs,
      extension: user.extension || '',
    });
    setShowEditModal(true);
  };

  const openChannelModal = (user: User) => {
    setSelectedUser(user);
    setNewChannelLimit(getChannelLimit(user.id));
    setShowChannelModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      role: UserRole.CALLCENTER,
      canAccessIvrs: true,
      extension: '',
    });
  };

  const roleOptions = [
    { value: UserRole.ADMIN, label: 'Administrador' },
    { value: UserRole.SUPERVISOR, label: 'Supervisor' },
    { value: UserRole.CALLCENTER, label: 'Call Center' },
  ];

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <Header title="Usuarios" subtitle="Gestión de usuarios del sistema" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-dark-400">Total usuarios</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-violet/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent-violet" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.role === UserRole.ADMIN || u.role === UserRole.SUPERVISOR).length}
                </p>
                <p className="text-sm text-dark-400">Administradores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-cyan/20 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-accent-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.canAccessIvrs).length}
                </p>
                <p className="text-sm text-dark-400">Con acceso IVR</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <Input
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {isAdmin() && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Usuario</TableCell>
                  <TableCell header>Email</TableCell>
                  <TableCell header>Rol</TableCell>
                  <TableCell header>Canales</TableCell>
                  <TableCell header>IVR</TableCell>
                  <TableCell header>Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-dark-400">@{user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell>
                      <span className="text-primary-400 font-medium">{getChannelLimit(user.id)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={user.canAccessIvrs ? 'text-green-400' : 'text-red-400'}>
                        {user.canAccessIvrs ? 'Sí' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(user)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}>
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openChannelModal(user)}>
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Usuario" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
            <Input label="Apellido" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
          <Input label="Usuario" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <Input label="Contraseña" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <Select label="Rol" options={roleOptions} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} />
          <Input label="Extensión" value={formData.extension} onChange={(e) => setFormData({ ...formData, extension: e.target.value })} />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="canAccessIvrs" checked={formData.canAccessIvrs} onChange={(e) => setFormData({ ...formData, canAccessIvrs: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="canAccessIvrs" className="text-sm text-dark-300">Acceso a IVR</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} isLoading={submitting}>Crear</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Usuario" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
            <Input label="Apellido" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <Select label="Rol" options={roleOptions} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} />
          <Input label="Extensión" value={formData.extension} onChange={(e) => setFormData({ ...formData, extension: e.target.value })} />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="canAccessIvrsEdit" checked={formData.canAccessIvrs} onChange={(e) => setFormData({ ...formData, canAccessIvrs: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="canAccessIvrsEdit" className="text-sm text-dark-300">Acceso a IVR</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleEdit} isLoading={submitting}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Cambiar Contraseña" size="sm">
        <div className="space-y-4">
          <p className="text-dark-400">Cambiar contraseña de <strong className="text-white">{selectedUser?.username}</strong></p>
          <Input label="Nueva contraseña" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword} isLoading={submitting}>Cambiar</Button>
          </div>
        </div>
      </Modal>

      {/* Channel Modal */}
      <Modal isOpen={showChannelModal} onClose={() => setShowChannelModal(false)} title="Asignar Canales" size="sm">
        <div className="space-y-4">
          <p className="text-dark-400">Asignar canales a <strong className="text-white">{selectedUser?.username}</strong></p>
          <Input label="Máximo de canales" type="number" min={0} value={newChannelLimit} onChange={(e) => setNewChannelLimit(parseInt(e.target.value) || 0)} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowChannelModal(false)}>Cancelar</Button>
            <Button onClick={handleAssignChannels} isLoading={submitting}>Asignar</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
