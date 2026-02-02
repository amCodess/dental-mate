import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, User as UserIcon, Mail, Lock, Shield } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Badge, Modal, ConfirmDialog } from '../components/ui';
import './UsersPage.css';

// Esquema de validación
const userSchema = yup.object().shape({
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

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para diálogo de confirmación
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(userSchema),
        defaultValues: { mode: 'create', id_role: 2 }
    });

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users', { params: { search: searchTerm } });
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [searchTerm]);

    const handleOpenCreate = () => {
        setEditingUser(null);
        reset({ mode: 'create', nombre: '', apellido: '', email: '', password: '', id_role: 2 });
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

    // Preparar eliminación
    const confirmDelete = (user) => {
        setUserToDelete(user);
        setConfirmOpen(true);
    };

    // Ejecutar eliminación
    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            await api.delete(`/users/${userToDelete.id_usuario}`);
            // Optimistic update
            setUsers(users.filter(u => u.id_usuario !== userToDelete.id_usuario));
        } catch (error) {
            console.error('Error deleting user:', error);
            // Mostrar error en toast o alert custom (por ahora alert simple pero controlado)
            alert('No se pudo eliminar el usuario. Puede tener registros asociados.');
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
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar usuario: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    const getRoleBadge = (roleId) => {
        const role = roles.find(r => r.id_role === roleId);
        const roleName = role ? role.nombre_role : 'desconocido';

        switch (roleName) {
            case 'superadmin': return <Badge variant="primary" dot>{roleName}</Badge>;
            case 'admin': return <Badge variant="info" dot>{roleName}</Badge>;
            case 'empleado': return <Badge variant="warning" dot>{roleName}</Badge>;
            default: return <Badge variant="neutral">{roleName}</Badge>;
        }
    };

    return (
        <div className="users-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h2 className="page-heading">Gestión de usuarios</h2>
                    <p className="page-subheading">Administra los accesos y roles del sistema</p>
                </div>
                <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
                    Nuevo usuario
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" className="users-table-card card-elevated">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div> Cargando usuarios...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th className="text-center" style={{ width: '150px', minWidth: '150px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? users.map((user) => (
                                    <tr key={user.id_usuario}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-sm">
                                                    {user.nombre.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{user.nombre} {user.apellido}</span>
                                                    <span className="text-xs text-gray-500">ID: {user.id_usuario}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-gray-600">{user.email}</td>
                                        <td>{getRoleBadge(user.id_role)}</td>
                                        <td>
                                            <Badge variant={user.estado === 'activo' ? 'success' : 'neutral'}>
                                                {user.estado}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(user)}>
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-error hover:bg-red-50"
                                                    onClick={() => confirmDelete(user)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="empty-cell">No se encontraron usuarios</td>
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
                title={editingUser ? 'Editar usuario' : 'Crear nuevo usuario'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>
                            {editingUser ? 'Guardar cambios' : 'Crear usuario'}
                        </Button>
                    </>
                }
            >
                <form className="user-form">
                    <div className="form-row">
                        <Input
                            label="Nombre"
                            placeholder="Ej. Juan"
                            icon={<UserIcon size={16} />}
                            fullWidth
                            error={errors.nombre?.message}
                            {...register('nombre')}
                        />
                        <Input
                            label="Apellido"
                            placeholder="Ej. Pérez"
                            fullWidth
                            error={errors.apellido?.message}
                            {...register('apellido')}
                        />
                    </div>

                    <Input
                        label="Correo Electrónico"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        icon={<Mail size={16} />}
                        fullWidth
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    <div className="input-container full-width">
                        <label className="input-label">Rol de usuario</label>
                        <div className="select-wrapper">
                            <Shield size={16} className="select-icon" />
                            <select className="select-field" {...register('id_role')}>
                                <option value="">Selecciona un rol</option>
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
                        placeholder="••••••"
                        icon={<Lock size={16} />}
                        fullWidth
                        error={errors.password?.message}
                        helperText={editingUser ? "Déjalo en blanco para mantener la actual" : "Mínimo 6 caracteres"}
                        {...register('password')}
                    />
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar usuario"
                message={`¿Estás seguro de que deseas eliminar permanentemente a ${userToDelete?.nombre} ${userToDelete?.apellido}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};

export default UsersPage;
