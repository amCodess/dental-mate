import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredSelection } from '../utils/clinicSelection';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, Truck, Mail, Phone, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal, ConfirmDialog } from '../components/ui';
import Pagination from '../components/ui/Pagination';
import './UsersPage.css';

const schema = yup.object().shape({
    nombre: yup.string().required('El nombre es obligatorio'),
    contacto: yup.string().nullable(),
    email: yup.string().email('Email inválido').nullable(),
    telefono: yup.string().nullable(),
    direccion: yup.string().nullable()
});

const SuppliersPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const storedSelection = getStoredSelection();
    const companyId = Number(searchParams.get('companyId') || storedSelection.companyId || 1);

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState({ open: false, supplier: null });
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            nombre: '',
            contacto: '',
            email: '',
            telefono: '',
            direccion: ''
        }
    });

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/suppliers', { params: { company_id: companyId } });
            setSuppliers(res.data || []);
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [companyId]);

    const openCreate = () => {
        setEditing(null);
        reset({ nombre: '', contacto: '', email: '', telefono: '', direccion: '' });
        setModalOpen(true);
    };

    const openEdit = (supplier) => {
        setEditing(supplier);
        reset({
            nombre: supplier.nombre,
            contacto: supplier.contacto || '',
            email: supplier.email || '',
            telefono: supplier.telefono || '',
            direccion: supplier.direccion || ''
        });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            id_empresa: Number(companyId)
        };
        try {
            if (editing) {
                await api.put(`/suppliers/${editing.id_proveedor}`, payload);
            } else {
                await api.post('/suppliers', payload);
            }
            setModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Error al guardar proveedor:', error);
            alert('No se pudo guardar el proveedor.');
        }
    };

    const confirmDelete = (supplier) => setConfirm({ open: true, supplier });

    const deleteSupplier = async () => {
        if (!confirm.supplier) return;
        try {
            await api.delete(`/suppliers/${confirm.supplier.id_proveedor}`);
            setConfirm({ open: false, supplier: null });
            fetchSuppliers();
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            alert('No se pudo eliminar el proveedor.');
        }
    };

    const filtered = useMemo(() => {
        return suppliers.filter(s =>
            s.nombre.toLowerCase().includes(search.toLowerCase()) ||
            (s.email || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [suppliers, search]);
    useEffect(() => { setPage(1); }, [search, suppliers]);
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
                        <h2 className="page-heading">Proveedores</h2>
                        <p className="page-subheading">Gestiona proveedores de la empresa</p>
                    </div>
                </div>
                <Button onClick={openCreate} icon={<Plus size={18} />}>
                    Nuevo proveedor
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" className="users-table-card card-elevated">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div> Cargando proveedores...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Proveedor</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? paginated.map(sup => (
                                    <tr key={sup.id_proveedor}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-sm bg-gray-100 text-gray-600">
                                                    <Truck size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{sup.nombre}</span>
                                                    {sup.contacto && <span className="text-xs text-gray-500">{sup.contacto}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-gray-700">{sup.email || '-'}</td>
                                        <td className="text-gray-700">{sup.telefono || '-'}</td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(sup)}>
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-error hover:bg-red-50" onClick={() => confirmDelete(sup)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="empty-cell">No hay proveedores</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination page={page} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>
                            {editing ? 'Guardar cambios' : 'Crear proveedor'}
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input label="Nombre" fullWidth error={errors.nombre?.message} {...register('nombre')} />
                    <Input label="Contacto" fullWidth {...register('contacto')} />
                    <div className="form-row">
                        <Input label="Email" type="email" fullWidth error={errors.email?.message} {...register('email')} />
                        <Input label="Teléfono" fullWidth {...register('telefono')} />
                    </div>
                    <Input label="Dirección" fullWidth {...register('direccion')} />
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirm.open}
                onClose={() => setConfirm({ open: false, supplier: null })}
                onConfirm={deleteSupplier}
                title="Eliminar proveedor"
                message={`¿Quieres eliminar ${confirm.supplier?.nombre}?`}
                variant="danger"
            />
        </div>
    );
};

export default SuppliersPage;






