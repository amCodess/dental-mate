import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, User as UserIcon, Mail, Lock, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Badge, Modal, ConfirmDialog } from '../components/ui';
import Pagination from '../components/ui/Pagination';
import useDebouncedValue from '../hooks/useDebouncedValue';
import './UsersPage.css';
import { useLocation } from 'react-router-dom';
import { getStoredSelection } from '../utils/clinicSelection';

// Esquema de validación
const userSchema = yup.object().shape({
    nombre: yup.string().required('El nombre es requerido'),
    apellido: yup.string().required('El apellido es requerido'),
    email: yup.string().email('Email inválido').required('El email es requerido'),
    password: yup.string().test('password-required', 'La contraseña es requerida (mín 6 caracteres)', function (value) {
        if (this.parent.mode === 'create') {
            return !!value && value.length >= 6;
        }
        return !value || value.length >= 6;
    })
});

const UsersPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const storedSelection = getStoredSelection();
    const clinicIdParam = searchParams.get('clinicId') || storedSelection.clinicId;
    const clinicId = clinicIdParam ? Number(clinicIdParam) : null;
    const companyId = Number(searchParams.get('companyId') || storedSelection.companyId || 1);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [errorDialog, setErrorDialog] = useState({ open: false, title: '', message: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebouncedValue(searchTerm);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(userSchema),
        defaultValues: { mode: 'create', id_empresa: companyId }
    });

    // Estado para diálogo de confirmación
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const fetchUsers = async (term) => {
        try {
            setLoading(true);
            const response = await api.get('/users', { params: { search: term, clinic_id: clinicId || undefined, company_id: companyId || undefined, include_deleted: true } });
            const filtered = (response.data.data || [])
                .filter(u => !u.is_superadmin)
                .filter(u => !u.deleted_at);
            setUsers(filtered);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    const [page, setPage] = useState(1);
    const pageSize = 10;
    useEffect(() => { setPage(1); }, [users]);
    const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);

    const handleOpenCreate = () => {
        setEditingUser(null);
        reset({ mode: 'create', nombre: '', apellido: '', email: '', password: '', id_empresa: companyId });
        setModalOpen(true);
    };

    const showErrorDialog = (title, message) => {
        setErrorDialog({ open: true, title, message });
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        reset({
            mode: 'edit',
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            password: '',
            id_empresa: companyId
        });
        setModalOpen(true);
    };

    // Preparar eliminaciÃ³n
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
            if (!payload.password) delete payload.password;
            delete payload.mode;
            if (clinicId) {
                payload.id_clinica = clinicId;
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
            const serverMsg = error.response?.data?.message || error.response?.data?.error || '';
            // Intento de reactivación si el correo ya existe eliminado
            const messageText = (serverMsg || '').toLowerCase();
            const duplicateEmail = messageText.includes('email') || messageText.includes('correo') || error.response?.status === 409;
            if (!editingUser && duplicateEmail) {
                showErrorDialog(
                    'Correo ya registrado',
                    'Ya existe un usuario con este correo electrónico en la clínica o empresa seleccionada. Usa otro correo o reactiva al usuario existente.'
                );
                try {
                    const lookup = await api.get('/users', { params: { search: data.email, include_deleted: true, clinic_id: clinicId || undefined, company_id: companyId || undefined } });
                    const match = (lookup.data.data || []).find(u => u.email === data.email && u.deleted_at);
                    if (match) {
                            const payload = {
                            ...data,
                            id_clinica: clinicId || undefined,
                            id_empresa: companyId,
                            estado: 'activo',
                            deleted_at: null
                        };
                        if (!payload.password) delete payload.password;
                        await api.put(`/users/${match.id_usuario}`, payload);
                        setModalOpen(false);
                        fetchUsers();
                        return;
                    }
                } catch (reactivateError) {
                    console.error('Error reactivando usuario eliminado:', reactivateError);
                }
            }
            showErrorDialog('No se pudo guardar', serverMsg || 'Error desconocido al guardar el usuario.');
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
                        <p className="page-subheading">Administra las cuentas de tu clínica</p>
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
                                    <th>Estado</th>
                                    <th className="text-center" style={{ width: '150px', minWidth: '150px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? paginatedUsers.map((user) => (
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
                                        <td colSpan="4" className="empty-cell">No se encontraron usuarios</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination page={page} total={users.length} pageSize={pageSize} onPageChange={setPage} />
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
                        label="Correo electrónico"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        icon={<Mail size={16} />}
                        fullWidth
                        error={errors.email?.message}
                        {...register('email')}
                    />

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

            <Modal
                isOpen={errorDialog.open}
                onClose={() => setErrorDialog({ open: false, title: '', message: '' })}
                title={errorDialog.title || 'Aviso'}
                footer={
                    <Button variant="primary" onClick={() => setErrorDialog({ open: false, title: '', message: '' })}>
                        Entendido
                    </Button>
                }
                size="sm"
            >
                <p style={{ margin: 0, color: '#4B5563', lineHeight: 1.5 }}>
                    {errorDialog.message}
                </p>
            </Modal>
        </div>
    );
};

export default UsersPage;
