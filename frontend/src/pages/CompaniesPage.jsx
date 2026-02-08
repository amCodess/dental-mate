import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building, Phone, Mail, FileText, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { Button, Input, Card, Modal } from '../components/ui';
import './UsersPage.css';
import './CompaniesPage.css';

const companySchema = yup.object().shape({
    nombre: yup.string().required('El nombre de la empresa es requerido'),
    nif: yup.string().required('El NIF es requerido'),
    email: yup.string().email('Email inválido').required('El email es requerido'),
    telefono: yup.string().required('El teléfono es requerido'),
});

const CompaniesPage = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(companySchema)
    });

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/companies');
            setCompanies(response.data);
        } catch (error) {
            console.error('Error al obtener empresas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleOpenCreate = () => {
        reset({ nombre: '', nif: '', email: '', telefono: '' });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            await api.post('/companies', data);
            setModalOpen(false);
            fetchCompanies();
        } catch (error) {
            console.error('Error al crear empresa:', error);
            alert('Error al crear empresa: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    const handleRowClick = (companyId) => {
        navigate(`/companies/${companyId}`);
    };

    const filteredCompanies = companies.filter(company =>
        company.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.nif?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="companies-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h2 className="page-heading">Gestión de empresas</h2>
                    <p className="page-subheading">Administra las empresas registradas en el sistema</p>
                </div>
                <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
                    Nueva empresa
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o NIF..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" className="users-table-card card-elevated">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div> Cargando empresas...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table hoverable-rows">
                            <thead>
                                <tr>
                                    <th style={{ width: '25%' }}>Empresa</th>
                                    <th style={{ width: '15%' }}>NIF</th>
                                    <th style={{ width: '22%' }}>Correo electrónico</th>
                                    <th style={{ width: '15%' }}>Teléfono</th>
                                    <th style={{ width: '13%' }}>Fecha de creación</th>
                                    <th className="company-action-header" style={{ textAlign: 'right' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCompanies.length > 0 ? filteredCompanies.map((company) => (
                                    <tr
                                        key={company.id_empresa}
                                        onClick={() => handleRowClick(company.id_empresa)}
                                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>
                                            <div className="user-cell">
                                                <div className="company-avatar">
                                                    <Building size={16} />
                                                </div>
                                                <span className="company-name">
                                                    {company.nombre}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="company-nif">
                                                {company.nif}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="company-contact">
                                                <Mail size={14} />
                                                <span>{company.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="company-contact">
                                                <Phone size={14} />
                                                <span>{company.telefono}</span>
                                            </div>
                                        </td>
                                        <td className="company-date">
                                            {new Date(company.fecha_creacion).toLocaleDateString('es-ES')}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="company-action-btn icon-right"
                                                icon={<ChevronRight size={16} />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRowClick(company.id_empresa);
                                                }}
                                            >
                                                Ver clínicas
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="empty-cell">
                                            No se encontraron empresas
                                        </td>
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
                title="Registrar nueva empresa"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>
                            Crear empresa
                        </Button>
                    </>
                }
            >
                <form className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Nombre de la empresa"
                        placeholder="Ej. Dental Corp S.L."
                        icon={<Building size={16} />}
                        fullWidth
                        error={errors.nombre?.message}
                        {...register('nombre')}
                    />

                    <Input
                        label="NIF / CIF"
                        placeholder="Ej. B12345678"
                        icon={<FileText size={16} />}
                        fullWidth
                        error={errors.nif?.message}
                        {...register('nif')}
                    />

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem'
                    }}>
                        <Input
                            label="Correo electrónico"
                            type="email"
                            placeholder="contacto@empresa.com"
                            icon={<Mail size={16} />}
                            fullWidth
                            error={errors.email?.message}
                            {...register('email')}
                        />
                        <Input
                            label="Teléfono"
                            placeholder="+34 900 000 000"
                            icon={<Phone size={16} />}
                            fullWidth
                            error={errors.telefono?.message}
                            {...register('telefono')}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CompaniesPage;
