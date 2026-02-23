import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Mail, Phone, Users, User, Calendar, FileText, Package, Truck, Stethoscope, Layers, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { Button, Card } from '../components/ui';
import './CompanyClinicDetails.css';

const ClinicDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);

    const clinicId = Number.isNaN(Number(id)) ? id : Number(id);

    const fetchClinic = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/clinics/${id}`);
            setClinic(res.data);
        } catch (error) {
            console.error('Error al cargar la clínica:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
                return;
            }
            setClinic(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClinic();
    }, [id]);

    const handleBack = () => navigate(-1);

    const goTo = (path) => {
        const params = new URLSearchParams();
        const companyId = clinic?.id_empresa ?? clinic?.company?.id_empresa;
        if (companyId) params.set('companyId', companyId);
        if (clinicId) params.set('clinicId', clinicId);
        const query = params.toString();
        navigate(query ? `${path}?${query}` : path);
    };

    if (loading) return <div className="detail-loading">Cargando...</div>;

    if (!clinic) {
        return (
            <div className="clinic-details-page detail-page animate-fade-in">
                <div className="details-header">
                    <div className="details-heading">
                        <MapPin className="text-success" size={28} />
                        <span>clínica no encontrada</span>
                    </div>
                    <p className="details-subtitle">No se encontrÃ³ la clínica solicitada.</p>
                    <div className="details-metadata">
                        <Button variant="ghost" onClick={handleBack}>Volver a empresas</Button>
                        <Button variant="primary" onClick={fetchClinic}>Reintentar</Button>
                    </div>
                </div>
            </div>
        );
    }

    const menus = [
        {
            key: 'users',
            title: 'Usuarios',
            description: 'Gestiona accesos y roles del personal.',
            icon: Users,
            tone: 'indigo',
            action: () => goTo('/users')
        },
        {
            key: 'patients',
            title: 'Pacientes',
            description: 'Historial y datos de pacientes.',
            icon: User,
            tone: 'green',
            action: () => goTo('/patients')
        },
        {
            key: 'appointments',
            title: 'Citas',
            description: 'Agenda y seguimiento diario.',
            icon: Calendar,
            tone: 'orange',
            action: () => goTo('/appointments')
        },
        {
            key: 'billing',
            title: 'Facturas',
            description: 'Cobros, estados y descargas.',
            icon: FileText,
            tone: 'blue',
            action: () => goTo('/billing')
        },
        {
            key: 'products',
            title: 'Productos',
            description: 'Stock, lotes y consumibles.',
            icon: Package,
            tone: 'teal',
            action: () => goTo('/products')
        },
        {
            key: 'suppliers',
            title: 'Proveedores',
            description: 'Contactos y pedidos externos.',
            icon: Truck,
            tone: 'slate',
            action: () => goTo('/suppliers')
        },
        {
            key: 'treatments',
            title: 'Tratamientos',
            description: 'Catálogo clínico y precios.',
            icon: Stethoscope,
            tone: 'rose',
            action: () => goTo('/treatments')
        }
    ];

    return (
        <div className="clinic-details-page detail-page animate-fade-in">
            <div className="detail-hero">
                <Button variant="ghost" className="company-back-btn" onClick={handleBack}>
                    <ArrowLeft size={18} /> Volver a {clinic.company?.nombre || 'empresa'}
                </Button>

                <div className="details-header">
                    <div className="details-heading">
                        <MapPin className="text-success" size={28} />
                        <span>{clinic.nombre}</span>
                    </div>
                    <p className="details-subtitle">Panel de administración de la clínica</p>
                    <div className="details-metadata">
                        <span className="details-chip"><MapPin size={14} /> {clinic.direccion || 'Dirección no indicada'}</span>
                        <span className="details-chip"><Phone size={14} /> {clinic.telefono || 'Teléfono no indicado'}</span>
                        {clinic.email_recordatorios && (
                            <span className="details-chip"><Mail size={14} /> {clinic.email_recordatorios}</span>
                        )}
                    </div>
                </div>
            </div>

            <section className="detail-section">
                <div className="page-header">
                    <div>
                        <h3 className="section-title">Menús de gestión</h3>
                        <p className="section-subtitle">Accede a cada módulo para crear, editar o eliminar registros</p>
                    </div>
                </div>

                <div className="menu-grid">
                    {menus.map(menu => {
                        const Icon = menu.icon;
                        return (
                            <Card key={menu.key} className={`menu-card tone-${menu.tone}`} padding="lg" onClick={menu.action}>
                                <div className="menu-card-top">
                                    <div className="menu-icon">
                                        <Icon size={20} />
                                    </div>
                                    <Layers size={18} className="menu-layer-icon" />
                                </div>
                                <div className="menu-card-body">
                                    <h4 className="menu-title">{menu.title}</h4>
                                    <p className="menu-subtitle">{menu.description}</p>
                                </div>
                                <div className="menu-card-footer">
                                    <span className="menu-link">
                                        <ChevronRight size={18} />
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default ClinicDetailsPage;
