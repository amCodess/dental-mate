import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, Stethoscope, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal, ConfirmDialog } from '../components/ui';
import './UsersPage.css';

const schema = yup.object().shape({
    nombre_tratamiento: yup.string().required('El nombre es obligatorio'),
    descripcion: yup.string().nullable(),
    precio: yup.number().typeError('Precio inválido').min(0).nullable(),
    unidades: yup.number().typeError('Unidades inválidas').min(0).nullable()
});

const TreatmentsPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const companyId = Number(searchParams.get('companyId') || 1);

    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState({ open: false, treatment: null });

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            nombre_tratamiento: '',
            descripcion: '',
            precio: '',
            unidades: ''
        }
    });

    const fetchTreatments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/treatments', { params: { company_id: companyId } });
            setTreatments(res.data || []);
        } catch (error) {
            console.error('Error al cargar tratamientos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTreatments();
    }, [companyId]);

    const openCreate = () => {
        setEditing(null);
        reset({ nombre_tratamiento: '', descripcion: '', precio: '', unidades: '' });
        setModalOpen(true);
    };

    const openEdit = (treatment) => {
        setEditing(treatment);
        reset({
            nombre_tratamiento: treatment.nombre_tratamiento,
            descripcion: treatment.descripcion || '',
            precio: treatment.precio ?? '',
            unidades: treatment.unidades ?? ''
        });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            id_empresa: Number(companyId),
            precio: data.precio === '' ? null : Number(data.precio),
            unidades: data.unidades === '' ? null : Number(data.unidades)
        };
        try {
            if (editing) {
                await api.put(`/treatments/${editing.id_tratamiento}`, payload);
            } else {
                await api.post('/treatments', payload);
            }
            setModalOpen(false);
            fetchTreatments();
        } catch (error) {
            console.error('Error al guardar tratamiento:', error);
            alert('No se pudo guardar el tratamiento.');
        }
    };

    const confirmDelete = (treatment) => setConfirm({ open: true, treatment });

    const deleteTreatment = async () => {
        if (!confirm.treatment) return;
        try {
            await api.delete(`/treatments/${confirm.treatment.id_tratamiento}`);
            setConfirm({ open: false, treatment: null });
            fetchTreatments();
        } catch (error) {
            console.error('Error al eliminar tratamiento:', error);
            alert('No se pudo eliminar el tratamiento.');
        }
    };

    const filtered = useMemo(() => {
        return treatments.filter(t =>
            t.nombre_tratamiento.toLowerCase().includes(search.toLowerCase())
        );
    }, [treatments, search]);

    return (
            <div className="users-page animate-fade-in">
            <div className="page-header">
                <div className="header-left">
                    <Button variant="ghost" onClick={() => window.history.back()} icon={<ArrowLeft size={16} />}>
                        Volver
                    </Button>
                    <div className="header-titles">
                        <h2 className="page-heading">Tratamientos</h2>
                        <p className="page-subheading">Configuración de servicios y precios</p>
                    </div>
                </div>
                <Button onClick={openCreate} icon={<Plus size={18} />}>
                    Nuevo tratamiento
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar tratamiento..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" className="users-table-card card-elevated">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div> Cargando tratamientos...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tratamiento</th>
                                    <th>Descripción</th>
                                    <th>Precio</th>
                                    <th>Unidades</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? filtered.map(t => (
                                    <tr key={t.id_tratamiento}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-sm bg-gray-100 text-gray-600">
                                                    <Stethoscope size={16} />
                                                </div>
                                                <span className="font-medium text-gray-900">{t.nombre_tratamiento}</span>
                                            </div>
                                        </td>
                                        <td className="text-gray-700">{t.descripcion || '-'}</td>
                                        <td className="text-gray-700">€{t.precio ?? '-'}</td>
                                        <td className="text-gray-700">{t.unidades ?? '-'}</td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-error hover:bg-red-50" onClick={() => confirmDelete(t)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="empty-cell">No hay tratamientos</td>
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
                title={editing ? 'Editar tratamiento' : 'Nuevo tratamiento'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>
                            {editing ? 'Guardar cambios' : 'Crear tratamiento'}
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input label="Nombre" fullWidth error={errors.nombre_tratamiento?.message} {...register('nombre_tratamiento')} />
                    <Input label="Descripción" fullWidth {...register('descripcion')} />
                    <div className="form-row">
                        <Input label="Precio (€)" type="number" step="0.01" fullWidth error={errors.precio?.message} {...register('precio')} />
                        <Input label="Unidades" type="number" fullWidth error={errors.unidades?.message} {...register('unidades')} />
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirm.open}
                onClose={() => setConfirm({ open: false, treatment: null })}
                onConfirm={deleteTreatment}
                title="Eliminar tratamiento"
                message={`¿Quieres eliminar ${confirm.treatment?.nombre_tratamiento}?`}
                variant="danger"
            />
        </div>
    );
};

export default TreatmentsPage;
