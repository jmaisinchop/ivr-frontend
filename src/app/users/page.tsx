'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { RoleBadge } from '@/components/ui/Badge';
import { usersApi, channelLimitsApi } from '@/lib/api';
import { User, UserRole, ChannelLimit } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, Edit2, Key, Search, Users, Shield, Phone, Check, X } from 'lucide-react';
import { PageLoading } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuthStore();
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total usuarios</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === UserRole.ADMIN || u.role === UserRole.SUPERVISOR).length}
                </p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.canAccessIvrs).length}
                </p>
                <p className="text-sm text-muted-foreground">Con acceso IVR</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50 p-4 rounded-xl border border-border/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-background"
            />
          </div>
          {isAdmin() && (
            <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </div>

        {/* Table */}
        <Table className="shadow-sm">
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
                    <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell><RoleBadge role={user.role} /></TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {getChannelLimit(user.id)} canales
                  </span>
                </TableCell>
                <TableCell>
                  {user.canAccessIvrs ? (
                    <span className="inline-flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                      <Check className="w-3.5 h-3.5 mr-1" /> Permitido
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-muted-foreground">
                      <X className="w-3.5 h-3.5 mr-1" /> Sin acceso
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditModal(user)} title="Editar">
                      <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }} title="Cambiar Contraseña">
                      <Key className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openChannelModal(user)} title="Asignar Canales">
                      <Phone className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
          
          <div className="flex items-center gap-3 p-1">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                id="canAccessIvrs" 
                checked={formData.canAccessIvrs} 
                onChange={(e) => setFormData({ ...formData, canAccessIvrs: e.target.checked })} 
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-input bg-background transition-all checked:border-primary checked:bg-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              />
              <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100 w-3.5 h-3.5" strokeWidth={3} />
            </div>
            <label htmlFor="canAccessIvrs" className="text-sm font-medium text-foreground cursor-pointer select-none">Acceso a campañas IVR</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="bg-background">Cancelar</Button>
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
          
          <div className="flex items-center gap-3 p-1">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                id="canAccessIvrsEdit" 
                checked={formData.canAccessIvrs} 
                onChange={(e) => setFormData({ ...formData, canAccessIvrs: e.target.checked })} 
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-input bg-background transition-all checked:border-primary checked:bg-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              />
              <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100 w-3.5 h-3.5" strokeWidth={3} />
            </div>
            <label htmlFor="canAccessIvrsEdit" className="text-sm font-medium text-foreground cursor-pointer select-none">Acceso a campañas IVR</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="bg-background">Cancelar</Button>
            <Button onClick={handleEdit} isLoading={submitting}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Cambiar Contraseña" size="sm">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Estás cambiando la contraseña para el usuario <strong className="text-foreground">{selectedUser?.username}</strong>
          </p>
          <Input label="Nueva contraseña" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="bg-background">Cancelar</Button>
            <Button onClick={handleChangePassword} isLoading={submitting}>Cambiar</Button>
          </div>
        </div>
      </Modal>

      {/* Channel Modal */}
      <Modal isOpen={showChannelModal} onClose={() => setShowChannelModal(false)} title="Asignar Canales" size="sm">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Asignar límite de canales simultáneos para <strong className="text-foreground">{selectedUser?.username}</strong>
          </p>
          <Input label="Máximo de canales" type="number" min={0} value={newChannelLimit} onChange={(e) => setNewChannelLimit(parseInt(e.target.value) || 0)} />
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setShowChannelModal(false)} className="bg-background">Cancelar</Button>
            <Button onClick={handleAssignChannels} isLoading={submitting}>Asignar</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}