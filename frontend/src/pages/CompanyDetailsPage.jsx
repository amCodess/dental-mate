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
import { Button, Input, Card, Modal, ConfirmDialog, Badge } from '../components/ui';

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
    const [searchTerm, setSearchTerm] = useState('');

    // Formulario para crear clínica
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(clinicSchema)
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [companyRes, clinicsRes] = await Promise.all([
                api.get(`/companies/${id}`),
                api.get('/clinics', { params: { company_id: id } })
            ]);
            setCompany(companyRes.data);
            setClinics(clinicsRes.data);
        } catch (error) {
            console.error('Error fetching details:', error);
            // Si falla, volver a lista
            // navigate('/companies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleCreateClinic = async (data) => {
        try {
            // Añadir id_empresa automáticamente
            await api.post('/clinics', { ...data, id_empresa: id });
            setModalOpen(false);
            fetchData(); // Recargar lista
        } catch (error) {
            console.error('Error creating clinic:', error);
            alert('Error al crear clínica');
        }
    };

    const handleOpenCreate = () => {
        reset({ nombre: '', direccion: '', telefono: '', email_recordatorios: '' });
        setModalOpen(true);
    };

    const handleClinicClick = (clinicId) => {
        navigate(`/clinics/${clinicId}`);
    };

    if (loading) {
        return <div className="p-8 flex justify-center">Cargando detalles...</div>;
    }

    if (!company) return <div>Empresa no encontrada</div>;

    const filteredClinics = clinics.filter(clinic =>
        clinic.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="company-details-page animate-fade-in">
            <div className="mb-6">
                <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent text-gray-500 hover:text-gray-900" onClick={() => navigate('/companies')}>
                    <ArrowLeft size={18} className="mr-2" /> Volver a Empresas
                </Button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Building className="text-primary" size={28} />
                            {company.nombre}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><FileText size={14} /> NIF: {company.nif}</span>
                            <span className="flex items-center gap-1"><Mail size={14} /> {company.email}</span>
                            <span className="flex items-center gap-1"><Phone size={14} /> {company.telefono}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-header mt-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Clínicas Asociadas</h3>
                    <p className="text-sm text-gray-500">Gestiona las sucursales de esta empresa</p>
                </div>
                <Button onClick={handleOpenCreate} size="sm" icon={<Plus size={16} />}>
                    Nueva Clínica
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
                                <th className="text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClinics.length > 0 ? filteredClinics.map(clinic => (
                                <tr
                                    key={clinic.id_clinica}
                                    onClick={() => handleClinicClick(clinic.id_clinica)}
                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
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
                                    <td className="text-right">
                                        <Button variant="ghost" size="sm" className="text-primary">
                                            Gestionar Personal <ChevronRight size={16} />
                                        </Button>
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

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva Clínica"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(handleCreateClinic)}>
                            Crear Clínica
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input label="Nombre de la Clínica" placeholder="Ej. Centro Madrid" fullWidth error={errors.nombre?.message} {...register('nombre')} />
                    <Input label="Dirección" placeholder="C/ Ejemplo 123" fullWidth icon={<MapPin size={16} />} error={errors.direccion?.message} {...register('direccion')} />
                    <Input label="Teléfono" placeholder="+34..." fullWidth icon={<Phone size={16} />} error={errors.telefono?.message} {...register('telefono')} />
                    <Input label="Email Recordatorios (Opcional)" type="email" fullWidth icon={<Mail size={16} />} error={errors.email_recordatorios?.message} {...register('email_recordatorios')} />
                </form>
            </Modal>
        </div>
    );
};

export default CompanyDetailsPage;
