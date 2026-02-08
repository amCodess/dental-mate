import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, User as UserIcon, Mail, Lock, Shield, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Badge, Modal, ConfirmDialog } from '../components/ui';
import useDebouncedValue from '../hooks/useDebouncedValue';
import './UsersPage.css';
import { useLocation } from 'react-router-dom';
import { getStoredSelection } from '../utils/clinicSelection';

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
    menu_citas: yup.boolean(),
    menu_pacientes: yup.boolean(),
    menu_facturacion: yup.boolean(),
    menu_productos: yup.boolean(),
    menu_proveedores: yup.boolean(),
    menu_tratamientos: yup.boolean(),
    menu_usuarios: yup.boolean()
});

const defaultMenuVisibility = {
    menu_citas: true,
    menu_pacientes: true,
    menu_facturacion: true,
    menu_productos: true,
    menu_proveedores: true,
    menu_tratamientos: true,
    menu_usuarios: true
};

const menuOptions = [
    { key: 'menu_citas', label: 'Citas' },
    { key: 'menu_pacientes', label: 'Pacientes' },
    { key: 'menu_facturacion', label: 'Facturacion' },
    { key: 'menu_productos', label: 'Productos' },
    { key: 'menu_proveedores', label: 'Proveedores' },
    { key: 'menu_tratamientos', label: 'Tratamientos' },
    { key: 'menu_usuarios', label: 'Usuarios' }
];

const UsersPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const storedSelection = getStoredSelection();
    const clinicIdParam = searchParams.get('clinicId') || storedSelection.clinicId;
    const clinicId = clinicIdParam ? Number(clinicIdParam) : null;
    const companyId = Number(searchParams.get('companyId') || storedSelection.companyId || 1);

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebouncedValue(searchTerm);

    // Estado para diálogo de confirmación
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(userSchema),
        defaultValues: { mode: 'create', id_role: '', id_empresa: companyId, ...defaultMenuVisibility }
    });

    const fetchUsers = async (term) => {
        try {
            setLoading(true);
            const response = await api.get('/users', { params: { search: term, clinic_id: clinicId || undefined, company_id: companyId || undefined } });
            const filtered = (response.data.data || []).filter(u => u.role?.nombre_role !== 'superadmin');
            setUsers(filtered);
        } catch (error) {
            console.error('Error fetching users:', error);
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

            const filteredRoles = normalizedRoles.filter(role => role._name && role._name !== 'superadmin');
            const rolesToUse = filteredRoles.length > 0 ? filteredRoles : normalizedRoles;

            setRoles(rolesToUse);

            if (!editingUser && rolesToUse.length > 0) {
                setValue('id_role', rolesToUse[0].id_role);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    useEffect(() => {
        fetchUsers(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchRoles();
    }, []);

    const resolveMenuValue = (value, fallback) => {
        if (value === undefined || value === null) return fallback;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value === 1;
        if (typeof value === 'string') {
            const normalized = value.toLowerCase();
            if (['true', 't', '1', 'yes'].includes(normalized)) return true;
            if (['false', 'f', '0', 'no'].includes(normalized)) return false;
        }
        return fallback;
    };

    const buildMenuValues = (user) => {
        return Object.keys(defaultMenuVisibility).reduce((acc, key) => {
            acc[key] = resolveMenuValue(user?.[key], defaultMenuVisibility[key]);
            return acc;
        }, {});
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        const firstRoleId = roles[0]?.id_role || '';
        reset({ mode: 'create', nombre: '', apellido: '', email: '', password: '', id_role: firstRoleId, id_empresa: companyId, ...defaultMenuVisibility });
        setModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        reset({
            mode: 'edit',
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            id_role: user.id_role,
            password: '',
            id_empresa: companyId,
            ...buildMenuValues(user)
        });
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
            const payload = { ...data };
            const fallbackRole = roles[0]?.id_role;
            payload.id_role = Number(payload.id_role || fallbackRole || 0);
            if (!payload.password) delete payload.password;
            delete payload.mode;
            if (clinicId) {
                payload.clinic_id = clinicId;
            }

            if (editingUser) {
                await api.put(`/users/${editingUser.id_usuario}`, payload);
            } else {
                await api.post('/users', { ...payload, id_empresa: companyId });
            }
            setModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar usuario: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    const getRoleBadge = (user) => {
        const roleFromList = roles.find(r => r.id_role === user.id_role);
        const roleName = user?.role?.nombre_role || roleFromList?.nombre_role || 'desconocido';

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
                <div className="header-left">
                    <Button variant="ghost" onClick={() => window.history.back()} icon={<ArrowLeft size={16} />}>
                        Volver
                    </Button>
                    <div className="header-titles">
                        <h2 className="page-heading">Gestión de usuarios</h2>
                        <p className="page-subheading">Administra los accesos y roles del sistema</p>
                    </div>
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
                                        <td>{getRoleBadge(user)}</td>
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
                                        {role.nombre_role || role.nombre || 'rol'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.id_role && <span className="input-error-message">{errors.id_role.message}</span>}
                    </div>

                    {clinicId && (
                        <div className="visibility-section">
                            <div className="visibility-header">
                                <h4 className="visibility-title">Visibilidad del menu principal</h4>
                                <p className="visibility-subtitle">Selecciona que modulos vera en el sidebar.</p>
                            </div>
                            <div className="visibility-grid">
                                {menuOptions.map(option => (
                                    <label key={option.key} className="visibility-option">
                                        <input type="checkbox" {...register(option.key)} />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

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
