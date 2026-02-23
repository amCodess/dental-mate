import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredSelection } from '../utils/clinicSelection';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, Package, Shield, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal, ConfirmDialog } from '../components/ui';
import Pagination from '../components/ui/Pagination';
import './UsersPage.css';

const schema = yup.object().shape({
    nombre_producto: yup.string().required('El nombre es obligatorio'),
    precio: yup.number().typeError('Precio inválido').min(0).nullable(),
    coste: yup.number().typeError('Coste inválido').min(0).nullable(),
    stock_actual: yup.number().typeError('Stock inválido').min(0).required('Stock requerido'),
    stock_minimo: yup.number().typeError('Stock inválido').min(0).required('Stock mínimo requerido'),
    vendible: yup.string().required()
});

const ProductsPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const storedSelection = getStoredSelection();
    const clinicIdParam = searchParams.get('clinicId') || storedSelection.clinicId;
    const clinicId = clinicIdParam ? Number(clinicIdParam) : null;
    const companyId = Number(searchParams.get('companyId') || storedSelection.companyId || 1);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState({ open: false, product: null });

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            nombre_producto: '',
            precio: '',
            coste: '',
            stock_actual: 0,
            stock_minimo: 0,
            vendible: 'true'
        }
    });

    const vendibleValue = watch('vendible');

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/products', { params: { company_id: companyId, clinic_id: clinicId } });
            setProducts(res.data || []);
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [companyId, clinicId]);

    const openCreate = () => {
        setEditing(null);
        reset({
            nombre_producto: '',
            precio: '',
            coste: '',
            stock_actual: 0,
            stock_minimo: 0,
            vendible: 'true'
        });
        setModalOpen(true);
    };

    const openEdit = (product) => {
        setEditing(product);
        reset({
            nombre_producto: product.nombre_producto,
            precio: product.precio ?? '',
            coste: product.coste ?? '',
            stock_actual: product.stock_actual,
            stock_minimo: product.stock_minimo,
            vendible: product.vendible ? 'true' : 'false'
        });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            id_empresa: Number(companyId),
            precio: data.precio === '' ? null : Number(data.precio),
            coste: data.coste === '' ? null : Number(data.coste),
            stock_actual: Number(data.stock_actual),
            stock_minimo: Number(data.stock_minimo),
            vendible: data.vendible === 'true'
        };

        try {
            if (editing) {
                await api.put(`/products/${editing.id_producto}`, payload);
            } else {
                await api.post('/products', payload);
            }
            setModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error('Error al guardar producto:', error);
            alert('No se pudo guardar el producto.');
        }
    };

    const confirmDelete = (product) => setConfirm({ open: true, product });

    const deleteProduct = async () => {
        if (!confirm.product) return;
        try {
            await api.delete(`/products/${confirm.product.id_producto}`);
            setConfirm({ open: false, product: null });
            fetchProducts();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('No se pudo eliminar el producto.');
        }
    };

    const filtered = useMemo(() => {
        return products.filter(p =>
            p.nombre_producto.toLowerCase().includes(search.toLowerCase())
        );
    }, [products, search]);

    const [page, setPage] = useState(1);
    const pageSize = 10;
    useEffect(() => { setPage(1); }, [search, products]);
    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page]);

    return (
        <div className="users-page animate-fade-in">
            <div className="page-header">
                <div className="header-left">
                    <Button variant="ghost" onClick={() => window.history.back()} icon={<ArrowLeft size={16} />}>
                        Volver
                    </Button>
                    <div className="header-titles">
                        <h2 className="page-heading">Productos</h2>
                        <p className="page-subheading">Catálogo y stock asociados a la empresa</p>
                    </div>
                </div>
                <Button onClick={openCreate} icon={<Plus size={18} />}>
                    Nuevo producto
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" className="users-table-card card-elevated">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div> Cargando productos...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Coste</th>
                                    <th>Stock</th>
                                    <th>Vendible</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? paginated.map(prod => (
                                    <tr key={prod.id_producto}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-sm bg-gray-100 text-gray-600">
                                                    <Package size={16} />
                                                </div>
                                                <span className="font-medium text-gray-900">{prod.nombre_producto}</span>
                                            </div>
                                        </td>
                                        <td className="text-gray-700">€{prod.precio ?? '-'}</td>
                                        <td className="text-gray-700">€{prod.coste ?? '-'}</td>
                                        <td className="text-gray-700">{prod.stock_actual}</td>
                                        <td>
                                            <div className="vendible-cell">
                                                <Shield size={14} className="text-gray-500" />
                                                <span>{prod.vendible ? 'Sí' : 'No'}</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(prod)}>
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-error hover:bg-red-50" onClick={() => confirmDelete(prod)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="empty-cell">No hay productos</td>
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
                title={editing ? 'Editar producto' : 'Nuevo producto'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>
                            {editing ? 'Guardar cambios' : 'Crear producto'}
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input label="Nombre" fullWidth error={errors.nombre_producto?.message} {...register('nombre_producto')} />
                    <div className="form-row">
                        <Input label="Precio (€)" type="number" step="0.01" fullWidth error={errors.precio?.message} {...register('precio')} />
                        <Input label="Coste (€)" type="number" step="0.01" fullWidth error={errors.coste?.message} {...register('coste')} />
                    </div>
                    <div className="form-row">
                        <Input label="Stock actual" type="number" fullWidth error={errors.stock_actual?.message} {...register('stock_actual')} />
                        <Input label="Stock mÃ­nimo" type="number" fullWidth error={errors.stock_minimo?.message} {...register('stock_minimo')} />
                    </div>
                    <div className="input-container full-width">
                        <label className="input-label">Vendible</label>
                        <div className="vendible-toggle">
                            <label className={`vendible-option ${vendibleValue === 'true' ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={vendibleValue === 'true'}
                                    onChange={() => setValue('vendible', 'true')}
                                />
                                Sí
                            </label>
                            <label className={`vendible-option ${vendibleValue === 'false' ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={vendibleValue === 'false'}
                                    onChange={() => setValue('vendible', 'false')}
                                />
                                No
                            </label>
                        </div>
                        {errors.vendible && <span className="input-error-message">{errors.vendible.message}</span>}
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirm.open}
                onClose={() => setConfirm({ open: false, product: null })}
                onConfirm={deleteProduct}
                title="Eliminar producto"
                message={`Â¿Quieres eliminar ${confirm.product?.nombre_producto}?`}
                variant="danger"
            />
        </div>
    );
};

export default ProductsPage;

