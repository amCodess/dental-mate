import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Building, MapPin, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal } from '../components/ui';
import Pagination from '../components/ui/Pagination';
import './UsersPage.css';

const clinicSchema = yup.object().shape({
    id_empresa: yup.string().required('Debes seleccionar una empresa'),
    nombre: yup.string().required('El nombre de la clínica es requerido'),
    direccion: yup.string().required('La dirección es requerida'),
    telefono: yup.string().required('El teléfono es requerido'),
});

const ClinicsPage = () => {
    const [clinics, setClinics] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(clinicSchema)
    });

    const fetchData = async () => {
        try {
            const [clinicsRes, companiesRes] = await Promise.all([
                api.get('/clinics'),
                api.get('/companies')
            ]);
            setClinics(clinicsRes.data);
            setCompanies(companiesRes.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreate = () => {
        reset({ id_empresa: '', nombre: '', direccion: '', telefono: '' });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                telefono: (data.telefono || '').trim(),
            };
            await api.post('/clinics', payload);
            setModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error al crear clínica:', error);
            alert('Error al crear clínica: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    const filteredClinics = clinics.filter(clinic =>
        clinic.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clinic.company && clinic.company.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    useEffect(() => { setPage(1); }, [searchTerm, clinics]);
    const paginatedClinics = filteredClinics.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="clinics-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h2 className="page-heading">Gestión de clínicas</h2>
                    <p className="page-subheading">Administra las clínicas y sucursales asociadas a empresas</p>
                </div>
                <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
                    Nueva clínica
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o empresa..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" className="users-table-card card-elevated">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div> Cargando clínicas...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Clínica</th>
                                    <th>Empresa madre</th>
                                    <th>Dirección</th>
                                    <th>Contacto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClinics.length > 0 ? paginatedClinics.map((clinic) => (
                                    <tr key={clinic.id_clinica}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-success/10 p-2 rounded-full text-success">
                                                    <Building size={16} />
                                                </div>
                                                <span className="font-medium text-gray-900">{clinic.nombre}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-gray-700 font-medium">
                                                {clinic.company?.nombre || 'Sin empresa'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin size={14} />
                                                <span className="truncate max-w-[200px]" title={clinic.direccion}>
                                                    {clinic.direccion}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col text-sm text-gray-600">
                                                <span className="flex items-center gap-2">
                                                    <Phone size={12} /> {clinic.telefono}
                                                </span>
                                                {clinic.email_recordatorios && (
                                                    <span className="flex items-center gap-2 mt-1">
                                                        <Mail size={12} /> {clinic.email_recordatorios}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="empty-cell">No se encontraron clínicas</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                        <Pagination page={page} total={filteredClinics.length} pageSize={pageSize} onPageChange={setPage} />
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Registrar nueva clínica"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>
                            Crear clínica
                        </Button>
                    </>
                }
            >
                <form className="clinic-form space-y-4">
                    <div className="input-container full-width">
                        <label className="input-label">Empresa madre</label>
                        <div className="select-wrapper">
                            <Building size={16} className="select-icon" />
                            <select className="select-field" {...register('id_empresa')}>
                                <option value="">Selecciona una empresa...</option>
                                {companies.map(company => (
                                    <option key={company.id_empresa} value={company.id_empresa}>
                                        {company.nombre} ({company.nif})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.id_empresa && <span className="input-error-message">{errors.id_empresa.message}</span>}
                    </div>

                    <Input
                        label="Nombre de la clínica"
                        placeholder="Ej. Clínica central Madrid"
                        icon={<Building size={16} />}
                        fullWidth
                        error={errors.nombre?.message}
                        {...register('nombre')}
                    />

                    <Input
                        label="Dirección física"
                        placeholder="Calle Principal 123, 28001 Madrid"
                        icon={<MapPin size={16} />}
                        fullWidth
                        error={errors.direccion?.message}
                        {...register('direccion')}
                    />

                    <Input
                        label="Telefono de contacto"
                        placeholder="+34 910 000 000"
                        icon={<Phone size={16} />}
                        fullWidth
                        error={errors.telefono?.message}
                        {...register('telefono')}
                    />
                </form>
            </Modal>
        </div>
    );
};

export default ClinicsPage;
