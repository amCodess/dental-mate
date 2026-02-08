import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredSelection } from '../utils/clinicSelection';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, Stethoscope, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal, ConfirmDialog } from '../components/ui';
import './UsersPage.css';
import './TreatmentsPage.css';

const schema = yup.object().shape({
    nombre_tratamiento: yup.string().required('El nombre es obligatorio'),
    descripcion: yup.string().nullable(),
    precio: yup.number().typeError('Precio inválido').min(0).nullable(),
    unidades: yup.number().typeError('Unidades inválidas').min(0).nullable(),
    productos_ids: yup.array().of(yup.number()).default([])
});

const TreatmentsPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const storedSelection = getStoredSelection();
    const companyId = Number(searchParams.get('companyId') || storedSelection.companyId || 1);

    const [treatments, setTreatments] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState({ open: false, treatment: null });
    const [autoPrice, setAutoPrice] = useState(true);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            nombre_tratamiento: '',
            descripcion: '',
            precio: '',
            unidades: '',
            productos_ids: []
        }
    });

    const selectedProducts = watch('productos_ids');

    const toArray = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.data?.data)) return payload.data.data;
        return [];
    };

    const fetchTreatments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/treatments', { params: { company_id: companyId } });
            setTreatments(toArray(res));
        } catch (error) {
            console.error('Error al cargar tratamientos:', error);
            setTreatments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products', { params: { company_id: companyId } });
            setProducts(toArray(res));
        } catch (error) {
            console.error('Error al cargar productos:', error);
            setProducts([]);
        }
    };

    useEffect(() => {
        fetchTreatments();
        fetchProducts();
    }, [companyId]);

    const openCreate = () => {
        setEditing(null);
        setAutoPrice(true);
        reset({ nombre_tratamiento: '', descripcion: '', precio: '', unidades: '', productos_ids: [] });
        setModalOpen(true);
    };

    const openEdit = (treatment) => {
        setEditing(treatment);
        setAutoPrice(false);
        reset({
            nombre_tratamiento: treatment.nombre_tratamiento,
            descripcion: treatment.descripcion || '',
            precio: treatment.precio ?? '',
            unidades: treatment.unidades ?? '',
            productos_ids: treatment.productos_ids || treatment.productos?.map(p => p.id_producto) || []
        });
        setModalOpen(true);
    };

    const productSum = useMemo(() => {
        const selected = products.filter(p => (selectedProducts || []).includes(p.id_producto || p.id));
        const sum = selected.reduce((acc, p) => acc + Number(p.precio || 0), 0);
        return sum.toFixed(2);
    }, [products, selectedProducts]);

    useEffect(() => {
        if (autoPrice) {
            setValue('precio', productSum);
        }
    }, [productSum, autoPrice, setValue]);

    const toggleProduct = (id) => {
        const current = new Set(selectedProducts || []);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }
        setValue('productos_ids', Array.from(current));
    };

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            id_empresa: Number(companyId),
            precio: data.precio === '' ? null : Number(data.precio),
            unidades: data.unidades === '' ? null : Number(data.unidades),
            productos_ids: data.productos_ids || []
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
                    <div className="dialog-grid full">
                        <Input label="Nombre" fullWidth error={errors.nombre_tratamiento?.message} {...register('nombre_tratamiento')} />
                        <Input label="Descripción" fullWidth {...register('descripcion')} />
                    </div>

                    <div className="dialog-grid">
                        <Input label="Precio (€)" type="number" step="0.01" fullWidth error={errors.precio?.message} {...register('precio')} />
                        <Input label="Unidades" type="number" fullWidth error={errors.unidades?.message} {...register('unidades')} />
                    </div>

                    <div className="product-picker">
                        <div className="product-picker-header">
                            <div>
                                <div className="text-sm font-semibold text-gray-800">Productos usados</div>
                                <div className="text-xs text-gray-500">Selecciona uno o varios, se resaltan los elegidos.</div>
                            </div>
                            <div className="total-row">Suma productos: €{productSum}</div>
                        </div>
                        <div className="product-list-scroll">
                            {products.map(prod => {
                                const id = prod.id_producto || prod.id;
                                const selected = (selectedProducts || []).includes(id);
                                return (
                                    <div key={id} className={`product-tile ${selected ? 'selected' : ''}`} onClick={() => toggleProduct(id)}>
                                        <div className="product-meta">
                                            <span className="product-name">{prod.nombre_producto || prod.nombre}</span>
                                            <span className="text-xs text-gray-500">Stock: {prod.stock_actual ?? '-'} • Min: {prod.stock_minimo ?? '-'}</span>
                                        </div>
                                        <div className="product-price">€{Number(prod.precio || 0).toFixed(2)}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="product-chipbar">
                            {(products.filter(p => (selectedProducts || []).includes(p.id_producto || p.id))).map(p => (
                                <span key={p.id_producto || p.id} className="product-chip">{p.nombre_producto || p.nombre}</span>
                            ))}
                        </div>
                        <label className="auto-price-toggle">
                            <input type="checkbox" checked={autoPrice} onChange={(e) => setAutoPrice(e.target.checked)} />
                            Usar suma de productos como precio por defecto
                        </label>
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
