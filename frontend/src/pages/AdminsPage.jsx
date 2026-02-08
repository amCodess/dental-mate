import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, User as UserIcon, Mail, Lock, Shield } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Badge, Modal, ConfirmDialog } from '../components/ui';
import useDebouncedValue from '../hooks/useDebouncedValue';
import './UsersPage.css';

// Esquema para administradores
const adminSchema = yup.object().shape({
    nombre: yup.string().required('El nombre es requerido'),
    apellido: yup.string().required('El apellido es requerido'),
    email: yup.string().email('Email inválido').required('El email es requerido'),
    password: yup.string().test('password-required', 'La contraseña es requerida (min 6 caracteres)', function (value) {
        if (this.parent.mode === 'create') {
            return !!value && value.length >= 6;
        }
        return !value || value.length >= 6;
    }),
    id_role: yup.number().required('El rol es requerido'),
});

const AdminsPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebouncedValue(searchTerm);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(adminSchema),
        defaultValues: { mode: 'create', id_role: '' }
    });

    const fetchAdmins = async (term) => {
        try {
            setLoading(true);
            // Filtramos por roles 'admin' y 'superadmin'
            const response = await api.get('/users', {
                params: {
                    search: term,
                    role_in: 'admin,superadmin'
                }
            });
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            const rawRoles = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);

            const normalizedRoles = rawRoles.map(role => {
                const roleName = role.nombre_role || role.nombre || '';
                return {
                    ...role,
                    nombre_role: role.nombre_role || role.nombre,
                    _name: roleName.toLowerCase().trim()
                };
            });

            // Solo mostrar roles administrativos para asignar
            const adminRoles = normalizedRoles.filter(role => ['admin', 'superadmin'].includes(role._name));
            setRoles(adminRoles);

            if (!editingUser && adminRoles.length > 0) {
                setValue('id_role', adminRoles[0].id_role);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    useEffect(() => {
        fetchAdmins(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleOpenCreate = () => {
        setEditingUser(null);
        const firstRoleId = roles[0]?.id_role || '';
        reset({ mode: 'create', nombre: '', apellido: '', email: '', password: '', id_role: firstRoleId });
        setModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setValue('mode', 'edit');
        setValue('nombre', user.nombre);
        setValue('apellido', user.apellido);
        setValue('email', user.email);
        setValue('id_role', user.id_role);
        setValue('password', '');
        setModalOpen(true);
    };

    const confirmDelete = (user) => {
        setUserToDelete(user);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete.id_usuario}`);
            setUsers(users.filter(u => u.id_usuario !== userToDelete.id_usuario));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('No se pudo eliminar el administrador.');
        } finally {
            setConfirmOpen(false);
            setUserToDelete(null);
        }
    };

    const onSubmit = async (data) => {
        try {
            if (editingUser) {
                const payload = { ...data };
                if (!payload.password) delete payload.password;
                delete payload.mode;
                await api.put(`/users/${editingUser.id_usuario}`, payload);
            } else {
                await api.post('/users', data);
            }
            setModalOpen(false);
            fetchAdmins();
        } catch (error) {
            console.error('Error saving admin:', error);
            alert('Error al guardar: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    return (
        <div className="users-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h2 className="page-heading">Administradores del sistema</h2>
                    <p className="page-subheading">Gestiona los usuarios con acceso privilegiado (Super Admin y Admin)</p>
                </div>
                <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
                    Nuevo administrador
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar administrador..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" className="users-table-card card-elevated">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div> Cargando administradores...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Administrador</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? users.map((user) => (
                                    <tr key={user.id_usuario}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-sm bg-primary/10 text-primary">
                                                    {user.nombre.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{user.nombre} {user.apellido}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-gray-600">{user.email}</td>
                                        <td>
                                            <Badge variant={user.role?.nombre_role === 'superadmin' ? 'primary' : 'info'} dot>
                                                {user.role?.nombre_role}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge variant={user.estado === 'activo' ? 'success' : 'neutral'}>
                                                {user.estado}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(user)}>
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-error hover:bg-red-50" onClick={() => confirmDelete(user)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="empty-cell">No se encontraron administradores</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingUser ? 'Editar administrador' : 'Nuevo administrador'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>
                            {editingUser ? 'Guardar cambios' : 'Crear administrador'}
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nombre" placeholder="Ej. Carlos" fullWidth error={errors.nombre?.message} {...register('nombre')} />
                        <Input label="Apellido" placeholder="Ej. Ruiz" fullWidth error={errors.apellido?.message} {...register('apellido')} />
                    </div>
                    <Input label="Email" type="email" placeholder="admin@sistema.com" fullWidth error={errors.email?.message} {...register('email')} />

                    <div className="input-container full-width">
                        <label className="input-label">Rol de sistema</label>
                        <div className="select-wrapper">
                            <Shield size={16} className="select-icon" />
                            <select className="select-field" {...register('id_role')}>
                                <option value="">Selecciona un rol...</option>
                                {roles.map(role => (
                                    <option key={role.id_role} value={role.id_role}>
                                        {role.nombre_role}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.id_role && <span className="input-error-message">{errors.id_role.message}</span>}
                    </div>

                    <Input
                        label={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                        type="password"
                        fullWidth
                        error={errors.password?.message}
                        {...register('password')}
                    />
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar administrador"
                message={`¿Estás seguro de que deseas eliminar a ${userToDelete?.nombre}?`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};

export default AdminsPage;
