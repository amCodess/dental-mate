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
    FileText,
    ChevronRight,
    Edit2,
    Trash2
} from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal, ConfirmDialog } from '../components/ui';
import { persistSelection } from '../utils/clinicSelection';
import './CompanyClinicDetails.css';

// Esquema para clínicas (copiado/adaptado de ClinicsPage)
const clinicSchema = yup.object().shape({
    nombre: yup.string().required('El nombre de la clínica es requerido'),
    direccion: yup.string().required('La dirección es requerida'),
    telefono: yup.string().required('El teléfono es requerido'),
    email_recordatorios: yup.string().email('Email inválido').nullable(),
});

const CompanyDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, clinic: null });
    const [errorMessage, setErrorMessage] = useState('');

    // Formulario para crear clínica
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(clinicSchema)
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage('');

            const [companyRes, clinicsRes] = await Promise.all([
                api.get(`/companies/${id}`).catch(() => null),
                api.get('/clinics', { params: { company_id: id } }).catch(() => ({ data: [] }))
            ]);

            let resolvedCompany = companyRes?.data || null;

            if (!resolvedCompany) {
                const fallback = await api.get('/companies');
                resolvedCompany = (fallback.data || []).find(c => String(c.id_empresa) === String(id)) || null;
            }

            setCompany(resolvedCompany);
            const clinicsData = clinicsRes?.data || [];
            const filteredByCompany = clinicsData.filter(c => String(c.id_empresa) === String(id));
            setClinics(filteredByCompany);
        } catch (error) {
            console.error('Error fetching details:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
                return;
            }
            setErrorMessage('No se pudo cargar la empresa. IntÃ©ntalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleSaveClinic = async (data) => {
        try {
            // Añadir id_empresa automáticamente
            const payload = { 
                ...data, 
                id_empresa: id,
                telefono: (data.telefono || '').trim(),
            };
            if (editingClinic) {
                await api.put(`/clinics/${editingClinic.id_clinica}`, payload);
            } else {
                await api.post('/clinics', payload);
            }
            setModalOpen(false);
            setEditingClinic(null);
            fetchData(); // Recargar lista
        } catch (error) {
            console.error('Error creating clinic:', error);
            alert('Error al crear clínica');
        }
    };

    const handleOpenCreate = () => {
        setEditingClinic(null);
        reset({ nombre: '', direccion: '', telefono: '', email_recordatorios: '' });
        setModalOpen(true);
    };

    const handleOpenEdit = (clinic) => {
        setEditingClinic(clinic);
        reset({
            nombre: clinic.nombre || '',
            direccion: clinic.direccion || '',
            telefono: clinic.telefono || '',
            email_recordatorios: clinic.email_recordatorios || ''
        });
        setModalOpen(true);
    };

    // Navegación a detalle de clínica deshabilitada: solo edición/eliminación desde acciones.

    const handleDeleteClick = (clinic) => {
        setConfirmDialog({ isOpen: true, clinic });
    };

    const handleDeleteClinic = async () => {
        if (!confirmDialog.clinic) return;
        try {
            await api.delete(`/clinics/${confirmDialog.clinic.id_clinica}`);
            setConfirmDialog({ isOpen: false, clinic: null });
            fetchData();
        } catch (error) {
            console.error('Error deleting clinic:', error);
            alert('No se pudo eliminar la clínica.');
        }
    };

    if (loading) {
        return <div className="detail-loading">Cargando detalles...</div>;
    }

    if (!company) {
        return (
            <div className="company-details-page detail-page animate-fade-in">
                <div className="details-header">
                    <div className="details-heading">
                        <Building className="text-primary" size={28} />
                        <span>Empresa no encontrada</span>
                    </div>
                    <p className="details-subtitle">{errorMessage || 'No se encontrÃ³ la empresa solicitada.'}</p>
                    <div className="details-metadata">
                        <Button variant="ghost" onClick={() => navigate('/companies')}>Volver a empresas</Button>
                        <Button variant="primary" onClick={fetchData}>Reintentar</Button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredClinics = clinics.filter(clinic =>
        clinic.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="company-details-page detail-page animate-fade-in">
            <div className="detail-hero">
                <Button variant="ghost" className="company-back-btn" onClick={() => navigate('/companies')}>
                    <ArrowLeft size={18} /> Volver a empresas
                </Button>

                <div className="details-header">
                    <div className="details-heading">
                        <Building className="text-primary" size={28} />
                        <span>{company.nombre}</span>
                    </div>
                    <p className="details-subtitle">Información general de la empresa</p>
                    <div className="details-metadata">
                        <span className="details-chip"><FileText size={14} /> NIF: {company.nif}</span>
                        <span className="details-chip"><Mail size={14} /> {company.email}</span>
                        <span className="details-chip"><Phone size={14} /> {company.telefono}</span>
                    </div>
                </div>
            </div>

            <section className="detail-section">
                <div className="page-header">
                    <div>
                        <h3 className="section-title">clínicas asociadas</h3>
                        <p className="section-subtitle">Gestiona las sucursales de esta empresa</p>
                    </div>
                    <Button onClick={handleOpenCreate} size="sm" icon={<Plus size={16} />}>
                        Nueva clínica
                    </Button>
                </div>

                <div className="filters-bar">
                    <div className="search-container">
                        <Search size={18} className="search-input-icon" />
                        <input
                            type="text"
                            placeholder="Buscar clínica..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card padding="none" className="users-table-card card-elevated">
                    <div className="table-responsive">
                        <table className="data-table hoverable-rows">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Dirección</th>
                                    <th>Contacto</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClinics.length > 0 ? filteredClinics.map(clinic => (
                                    <tr
                                        key={clinic.id_clinica}
                                        className="clickable-row"
                                    >
                                        <td className="font-medium text-gray-900">{clinic.nombre}</td>
                                        <td className="text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} /> {clinic.direccion}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col text-sm text-gray-600">
                                                <span><Phone size={12} className="inline mr-1" /> {clinic.telefono}</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="clinic-actions">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="clinic-action-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEdit(clinic);
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="clinic-action-btn danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(clinic);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="empty-cell">No hay clínicas registradas para esta empresa</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </section>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingClinic ? "Editar clínica" : "Nueva clínica"}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(handleSaveClinic)}>
                            {editingClinic ? "Guardar cambios" : "Crear clínica"}
                        </Button>
                    </>
                }
            >
                <form className="form-stack">
                    <Input label="Nombre de la clínica" placeholder="Ej. Centro Madrid" fullWidth error={errors.nombre?.message} {...register('nombre')} />
                    <Input label="Dirección" placeholder="C/ Ejemplo 123" fullWidth icon={<MapPin size={16} />} error={errors.direccion?.message} {...register('direccion')} />
                    <Input label="Telefono" placeholder="+34 900 000 000" fullWidth icon={<Phone size={16} />} error={errors.telefono?.message} {...register('telefono')} />
                    <Input label="Correo de recordatorios (opcional)" type="email" fullWidth icon={<Mail size={16} />} error={errors.email_recordatorios?.message} {...register('email_recordatorios')} />
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Eliminar clínica"
                message={`Â¿Seguro que deseas eliminar la clínica ${confirmDialog.clinic?.nombre}?`}
                onConfirm={handleDeleteClinic}
                onCancel={() => setConfirmDialog({ isOpen: false, clinic: null })}
                variant="danger"
            />
        </div>
    );
};

export default CompanyDetailsPage;




