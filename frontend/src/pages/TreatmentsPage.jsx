import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredSelection } from '../utils/clinicSelection';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, Stethoscope, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal, ConfirmDialog } from '../components/ui';
import Pagination from '../components/ui/Pagination';
import './UsersPage.css';
import './TreatmentsPage.css';

const schema = yup.object().shape({
    nombre_tratamiento: yup.string().required('El nombre es obligatorio'),
    descripcion: yup.string().nullable(),
    precio: yup.number().typeError('Precio inválido').min(0).nullable(),
    duracion_minima: yup.number().typeError('Duración inválida').integer('Debe ser un número entero').min(5, 'Mínimo 5 minutos').required('La duración mínima es obligatoria'),
    productos_ids: yup.array().of(yup.number()).default([])
});

const formatCurrency = (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value ?? 0));

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
    const [showPicker, setShowPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            nombre_tratamiento: '',
            descripcion: '',
            precio: '',
            duracion_minima: '',
            productos_ids: []
        }
    });

    const selectedProducts = watch('productos_ids');
    const [productQuantities, setProductQuantities] = useState({});

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
        setShowPicker(false);
        setProductSearch('');
        reset({ nombre_tratamiento: '', descripcion: '', precio: '', duracion_minima: '', productos_ids: [] });
        setProductQuantities({});
        setModalOpen(true);
    };

    const openEdit = (treatment) => {
        setEditing(treatment);
        setAutoPrice(false);
        setShowPicker(false);
        setProductSearch('');
        const initialIds = treatment.productos_ids || treatment.productos?.map(p => p.id_producto) || [];
        const qtys = {};
        (treatment.productos || []).forEach(p => {
            const id = p.id_producto || p.id;
            if (initialIds.includes(id)) {
                qtys[id] = p.cantidad || p.unidades || p.qty || 1;
            }
        });
        reset({
            nombre_tratamiento: treatment.nombre_tratamiento,
            descripcion: treatment.descripcion || '',
            precio: treatment.precio ?? '',
            duracion_minima: treatment.duracion_minima ?? '',
            productos_ids: initialIds
        });
        setProductQuantities(qtys);
        setModalOpen(true);
    };

    const productSumValue = useMemo(() => {
        const selectedIds = (selectedProducts || []).map(String);
        const selected = products.filter(p => selectedIds.includes(String(p.id_producto || p.id)));
        const sum = selected.reduce((acc, p) => {
            const id = p.id_producto || p.id;
            const qty = productQuantities[id] || 1;
            return acc + qty * Number(p.precio || 0);
        }, 0);
        return sum;
    }, [products, selectedProducts, productQuantities]);
    const productSum = formatCurrency(productSumValue);

    useEffect(() => {
        if (autoPrice) {
            setValue('precio', productSumValue.toFixed(2));
        }
    }, [productSumValue, autoPrice, setValue]);

    const toggleProduct = (id) => {
        const current = new Set(selectedProducts || []);
        const qtys = { ...productQuantities };
        if (current.has(id)) {
            current.delete(id);
            delete qtys[id];
        } else {
            current.add(id);
            qtys[id] = qtys[id] || 1;
        }
        setProductQuantities(qtys);
        setValue('productos_ids', Array.from(current));
    };

    const changeQty = (id, delta) => {
        const current = new Set(selectedProducts || []);
        if (!current.has(id)) return;
        const qty = (productQuantities[id] || 1) + delta;
        const qtys = { ...productQuantities };
        if (qty <= 0) {
            current.delete(id);
            delete qtys[id];
        } else {
            qtys[id] = qty;
        }
        setProductQuantities(qtys);
        setValue('productos_ids', Array.from(current));
    };

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            id_empresa: Number(companyId),
            precio: data.precio === '' ? null : Number(data.precio),
            duracion_minima: data.duracion_minima === '' ? null : Number(data.duracion_minima),
            unidades: null,
            productos_ids: data.productos_ids || [],
            productos_detalle: (data.productos_ids || []).map(id => ({
                id_producto: id,
                cantidad: productQuantities[id] || 1
            }))
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
    const [page, setPage] = useState(1);
    const pageSize = 10;
    useEffect(() => { setPage(1); }, [search, treatments]);
    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        const term = productSearch.toLowerCase();
        return products.filter(p =>
            (p.nombre_producto || p.nombre || '').toLowerCase().includes(term)
        );
    }, [products, productSearch]);

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
                                    <th>Duración mínima</th>
                                    <th>Precio</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? paginated.map(t => (
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
                                        <td className="text-gray-700">{t.duracion_minima ? `${t.duracion_minima} min` : '-'}</td>
                                        <td className="text-gray-700">{t.precio != null ? formatCurrency(t.precio) : '-'}</td>
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
                                        <td colSpan="6" className="empty-cell">No hay tratamientos</td>
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

                <div className="dialog-grid single">
                    <Input label="Precio (€)" type="number" step="0.01" fullWidth error={errors.precio?.message} {...register('precio')} />
                </div>

                <div className="dialog-grid single">
                    <Input
                        label="Duración mínima (min)"
                        type="number"
                        min="5"
                        step="5"
                        fullWidth
                        error={errors.duracion_minima?.message}
                        {...register('duracion_minima')}
                    />
                </div>

                    <div className="product-picker">
                        <div className="product-picker-header">
                            <div className="text-sm font-semibold text-gray-800">Productos usados</div>
                            <div className="product-picker-actions">
                                <Button size="sm" variant="outline" onClick={() => setShowPicker(!showPicker)}>
                                    {showPicker ? 'Ocultar productos' : 'Seleccionar productos'}
                                </Button>
                                <div className="total-row">Suma: {productSum}</div>
                            </div>
                        </div>
                        {showPicker && (
                            <div className="product-list-scroll">
                                <div className="product-search">
                                    <Search size={16} className="product-search-icon" />
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        placeholder="Buscar producto..."
                                    />
                                </div>
                                {filteredProducts.map(prod => {
                                    const id = prod.id_producto || prod.id;
                                    const selected = (selectedProducts || []).includes(id);
                                    return (
                                        <div key={id} className={`product-tile ${selected ? 'selected' : ''}`} onClick={() => toggleProduct(id)}>
                                            <div className="product-meta">
                                                <span className="product-name">{prod.nombre_producto || prod.nombre}</span>
                                                <span className="text-xs text-gray-500">Stock: {prod.stock_actual ?? '-'} • Min: {prod.stock_minimo ?? '-'}</span>
                                            </div>
                                            <div className="product-cta">
                                                {selected && (
                                                    <div className="qty-control" onClick={(e) => e.stopPropagation()}>
                                                        <button type="button" onClick={() => changeQty(id, -1)}>-</button>
                                                        <span>{productQuantities[id] || 1}</span>
                                                        <button type="button" onClick={() => changeQty(id, 1)}>+</button>
                                                    </div>
                                                )}
                                                <div className="product-price">{formatCurrency(prod.precio)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="product-chipbar">
                            {products.filter(p => (selectedProducts || []).includes(p.id_producto || p.id)).map(p => {
                                const id = p.id_producto || p.id;
                                return (
                                    <span key={id} className="product-chip">
                                        {p.nombre_producto || p.nombre} ×{productQuantities[id] || 1}
                                    </span>
                                );
                            })}
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


