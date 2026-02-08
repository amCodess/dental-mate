import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, MapPin, Phone } from 'lucide-react';
import api from '../services/api';
import { Button, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getStoredSelection, persistSelection } from '../utils/clinicSelection';
import './ClinicSelectorPage.css';

const ClinicSelectorPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedClinicId, setSelectedClinicId] = useState('');

    const sessionUserLabel = useMemo(() => {
        if (!user) return 'Invitado';
        const fullName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim();
        if (fullName) return fullName;
        return user.email || 'Usuario';
    }, [user]);

    useEffect(() => {
        const fetchClinics = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await api.get('/clinics');
                setClinics(response.data || []);
            } catch (err) {
                console.error('Error fetching clinics:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    logout();
                    navigate('/login');
                    return;
                }
                setError('No se pudieron cargar las clinicas. Intenta nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchClinics();
    }, []);

    const storedSelection = getStoredSelection();

    const companies = useMemo(() => {
        const map = new Map();
        clinics.forEach((clinic) => {
            const companyId = clinic.id_empresa;
            const companyName = clinic.company?.nombre || `Empresa ${companyId}`;
            if (!map.has(companyId)) {
                map.set(companyId, { id: companyId, name: companyName });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [clinics]);

    const clinicsForCompany = useMemo(() => {
        if (!selectedCompanyId) return [];
        return clinics.filter((clinic) => String(clinic.id_empresa) === String(selectedCompanyId));
    }, [clinics, selectedCompanyId]);

    const selectedClinic = useMemo(() => {
        if (!selectedClinicId) return null;
        return clinicsForCompany.find((clinic) => String(clinic.id_clinica) === String(selectedClinicId)) || null;
    }, [clinicsForCompany, selectedClinicId]);

    useEffect(() => {
        if (!selectedCompanyId) {
            setSelectedClinicId('');
            return;
        }
        const exists = clinicsForCompany.some((clinic) => String(clinic.id_clinica) === String(selectedClinicId));
        if (!exists) {
            setSelectedClinicId('');
        }
    }, [selectedCompanyId, clinicsForCompany, selectedClinicId]);

    const handleSelect = (clinic) => {
        const clinicId = clinic.id_clinica;
        const companyId = clinic.id_empresa;
        const companyName = clinic.company?.nombre || 'Sin empresa';
        const role = clinic.user_role || user?.role?.nombre_role || 'empleado';

        persistSelection({
            clinicId,
            companyId,
            clinicName: clinic.nombre,
            companyName,
            role
        });

        navigate(`/dashboard?companyId=${companyId}&clinicId=${clinicId}`);
    };

    const handleEnter = () => {
        if (!selectedClinic) return;
        handleSelect(selectedClinic);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="clinic-selector-page">
            <div className="clinic-selector-shell">
                <div className="clinic-selector-header">
                    <div>
                        <h1>Selecciona tu clinica</h1>
                        <p>Primero elige la empresa y luego la clinica que vas a gestionar.</p>
                    </div>
                    <div className="session-info">
                        <div className="session-user">
                            <span className="session-user-label">Sesion</span>
                            <span className="session-user-name">{sessionUserLabel}</span>
                        </div>
                        <Button variant="ghost" onClick={handleLogout}>Cerrar sesion</Button>
                    </div>
                </div>

                {loading && (
                    <div className="clinic-selector-loading">Cargando clinicas...</div>
                )}

                {!loading && error && (
                    <div className="clinic-selector-error">{error}</div>
                )}

                {!loading && !error && clinics.length === 0 && (
                    <div className="clinic-selector-empty">
                        <h3>No tienes clinicas asignadas</h3>
                        <p>Contacta a un administrador para que te asigne acceso.</p>
                    </div>
                )}

                {!loading && !error && clinics.length > 0 && (
                    <>
                        <Card className="selector-panel" padding="lg">
                            <div className="selector-panel-header">
                                <div className="selector-title">
                                    <Building size={20} />
                                    <span>Seleccion de empresa y clinica</span>
                                </div>
                                <div className="selector-subtitle">
                                    {companies.length} empresas disponibles
                                </div>
                            </div>
                            <div className="selector-grid">
                                <div className="selector-field">
                                    <label>Empresa</label>
                                    <select
                                        value={selectedCompanyId}
                                        onChange={(event) => {
                                            setSelectedCompanyId(event.target.value);
                                            setSelectedClinicId('');
                                        }}
                                    >
                                        <option value="">Selecciona una empresa</option>
                                        {companies.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="selector-field">
                                    <label>Clinica</label>
                                    <select
                                        value={selectedClinicId}
                                        onChange={(event) => setSelectedClinicId(event.target.value)}
                                        disabled={!selectedCompanyId}
                                    >
                                        <option value="">Selecciona una clinica</option>
                                        {clinicsForCompany.map((clinic) => (
                                            <option key={clinic.id_clinica} value={clinic.id_clinica}>
                                                {clinic.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="selector-flow">
                                {selectedClinic && (
                                    <div className="selector-summary">
                                        <div className="selector-summary-title">
                                            {selectedClinic.nombre}
                                        </div>
                                        <div className="selector-summary-meta">
                                            <MapPin size={14} />
                                            <span>{selectedClinic.direccion || 'Direccion no indicada'}</span>
                                        </div>
                                        <div className="selector-summary-meta">
                                            <Phone size={14} />
                                            <span>{selectedClinic.telefono || 'Telefono no indicado'}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="selector-actions">
                                    <Button variant="primary" onClick={handleEnter} disabled={!selectedClinic}>
                                        Entrar
                                    </Button>
                                    {storedSelection.clinicId && (
                                        <span className="selector-hint">Ultima clinica: {storedSelection.clinicName}</span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClinicSelectorPage;
