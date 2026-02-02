import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Building,
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Plus,
    Search,
    User,
    Shield,
    Lock,
    Edit2,
    Trash2
} from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal, Badge, ConfirmDialog } from '../components/ui';

// Esquema para usuarios (similar a UsersPage pero simplificado/adaptado)
const userSchema = yup.object().shape({
    nombre: yup.string().required('Nombre requerido'),
    apellido: yup.string().required('Apellido requerido'),
    email: yup.string().email('Email inválido').required('Email requerido'),
    password: yup.string().test('password-required', 'Contraseña requerida (min 6)', function (value) {
        if (this.parent.mode === 'create') return !!value && value.length >= 6;
        return !value || value.length >= 6;
    }),
    id_role: yup.number().required('Rol requerido'),
});

const ClinicDetailsPage = () => {
    const { id } = useParams(); // Clinic ID
    const navigate = useNavigate();
    const [clinic, setClinic] = useState(null);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(userSchema),
        defaultValues: { mode: 'create' }
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [clinicRes, usersRes, rolesRes] = await Promise.all([
                api.get(`/clinics/${id}`),
                api.get('/users', { params: { clinic_id: id } }), // Requiere filtro en backend
                api.get('/roles')
            ]);
            setClinic(clinicRes.data);
            setUsers(usersRes.data.data || usersRes.data); // Support pagination or list

            // Filtramos roles para empleados normales (admin/superadmin se gestionan aparte idealmente)
            const staffRoles = rolesRes.data.filter(r => ['usuario', 'empleado', 'admin'].includes(r.nombre_role));
            setRoles(staffRoles);
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleBack = () => {
        if (clinic && clinic.id_empresa) {
            navigate(`/companies/${clinic.id_empresa}`);
        } else {
            navigate('/companies'); // Fallback
        }
    };

    const handleCreateUser = async (data) => {
        try {
            // Nota: El backend necesitaría lógica para asociar usuario a clínica en la creación
            // Si el backend UserStore no soporta clinic_id directo, habría que hacer 2 llamadas o modificar backend.
            // Asumiremos que backend puede manejarlo o que esto es un paso futuro. 
            // Para "users associated with clinic", normalmente es User + Pivot User_Clinic.
            // Por simplicidad ahora, creamos usuario y luego (si existiera endpoint) asociaríamos.
            // Dado el alcance actual, creamos el usuario base. La asociación requeriría actualizar UserController.php.
            // Vamos a enviar data y esperemos que el backend ignore campos extra si no está preparado,
            // pero lo ideal es modificar UserController::store para aceptar 'clinic_id'.
            // Sin esa modificación en backend, esto creará un usuario "suelto".
            // Voy a editar UserController después para soportar esto si es necesario.

            const payload = { ...data };
            if (!payload.password) delete payload.password;
            if (payload.mode) delete payload.mode;

            if (editingUser) {
                await api.put(`/users/${editingUser.id_usuario}`, payload);
            } else {
                // TODO: Backend needs to handle clinic association
                await api.post('/users', { ...payload, clinic_id: id });
            }

            setModalOpen(false);
            fetchData();
        } catch (error) {
            alert('Error al guardar usuario: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        reset({ mode: 'create', nombre: '', apellido: '', email: '', password: '', id_role: '' });
        setModalOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setValue('mode', 'edit');
        setValue('nombre', user.nombre);
        setValue('apellido', user.apellido);
        setValue('email', user.email);
        setValue('id_role', user.id_role);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete.id_usuario}`);
            setUsers(users.filter(u => u.id_usuario !== userToDelete.id_usuario));
        } catch (err) {
            alert('Error al eliminar');
        } finally {
            setConfirmOpen(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;
    if (!clinic) return <div>Clínica no encontrada</div>;

    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="clinic-details-page animate-fade-in">
            <div className="mb-6">
                <Button variant="ghost" className="mb-4 pl-0 text-gray-500 hover:text-gray-900" onClick={handleBack}>
                    <ArrowLeft size={18} className="mr-2" /> Volver a {clinic.company?.nombre || 'Empresa'}
                </Button>

                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <MapPin className="text-success" size={28} />
                    {clinic.nombre}
                </h2>
                <p className="text-gray-600 mt-1 ml-10">{clinic.direccion} • {clinic.telefono}</p>
            </div>

            <div className="page-header mt-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Personal de la Clínica</h3>
                    <p className="text-sm text-gray-500">Doctores, recepcionistas y staff asignado</p>
                </div>
                <Button onClick={handleOpenCreate} size="sm" icon={<Plus size={16} />}>
                    Nuevo Usuario
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar personal..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" className="users-table-card card-elevated">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <tr key={user.id_usuario}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="user-avatar-sm bg-gray-100 text-gray-600">
                                                {user.nombre.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900">{user.nombre} {user.apellido}</span>
                                        </div>
                                    </td>
                                    <td className="text-gray-600">{user.email}</td>
                                    <td>
                                        <Badge variant="neutral">{user.role?.nombre_role}</Badge>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-error" onClick={() => { setUserToDelete(user); setConfirmOpen(true); }}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="empty-cell">No hay usuarios asignados</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingUser ? "Editar Usuario" : "Nuevo Usuario de Clínica"}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(handleCreateUser)}>Guardar</Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nombre" fullWidth error={errors.nombre?.message} {...register('nombre')} />
                        <Input label="Apellido" fullWidth error={errors.apellido?.message} {...register('apellido')} />
                    </div>
                    <Input label="Email" type="email" fullWidth error={errors.email?.message} {...register('email')} />

                    <div className="input-container full-width">
                        <label className="input-label">Rol</label>
                        <select className="select-field" {...register('id_role')}>
                            <option value="">Selecciona rol...</option>
                            {roles.map(r => <option key={r.id_role} value={r.id_role}>{r.nombre_role}</option>)}
                        </select>
                        {errors.id_role && <span className="input-error-message">{errors.id_role.message}</span>}
                    </div>

                    <Input label="Contraseña" type="password" fullWidth error={errors.password?.message} {...register('password')} />
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Usuario"
                message="¿Seguro que deseas eliminar este usuario?"
                variant="danger"
            />
        </div>
    );
};

export default ClinicDetailsPage;
