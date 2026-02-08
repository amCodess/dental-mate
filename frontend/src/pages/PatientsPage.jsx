import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search, Plus, Edit2, Trash2, Calendar, Phone, MapPin, User, FileText, ArrowLeft, List, Grid } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { Button, Input, Card, Modal, Badge, ConfirmDialog } from '../components/ui';
import useDebouncedValue from '../hooks/useDebouncedValue';
import './PatientsPage.css';
import './UsersPage.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredSelection } from '../utils/clinicSelection';

const patientSchema = yup.object().shape({
    nombre: yup.string().required('El nombre es requerido'),
    apellido: yup.string().required('El apellido es requerido'),
    email: yup.string().email('Email inválido').nullable().transform((v, o) => o === '' ? null : v),
    telefono: yup.string().nullable().transform((v, o) => o === '' ? null : v),
    fecha_nacimiento: yup.date().nullable().transform((curr, orig) => orig === '' ? null : curr).typeError('Fecha inválida'),
    direccion: yup.string().nullable(),
    historial_medico: yup.string().nullable(),
});

const PatientsPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const storedSelection = getStoredSelection();
    const clinicIdParam = searchParams.get('clinicId') || storedSelection.clinicId;
    const clinicId = clinicIdParam ? Number(clinicIdParam) : null;
    const companyId = Number(searchParams.get('companyId') || storedSelection.companyId || 1);
    const navigate = useNavigate();

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, patientId: null, patientName: '' });
    const [viewMode, setViewMode] = useState('cards'); // cards | list
    const debouncedSearchTerm = useDebouncedValue(searchTerm);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(patientSchema),
        defaultValues: {
            id_empresa: companyId,
        }
    });

    const fetchPatients = async (term) => {
        try {
            setLoading(true);
            const response = await api.get('/patients', { params: { search: term, clinic_id: clinicId || undefined, company_id: companyId || undefined } });
            setPatients(response.data.data);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    const handleOpenCreate = () => {
        setEditingPatient(null);
        reset({
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            fecha_nacimiento: null,
            direccion: '',
            historial_medico: '',
            id_empresa: companyId
        });
        setModalOpen(true);
    };

    const handleOpenEdit = (patient) => {
        setEditingPatient(patient);
        setValue('nombre', patient.nombre);
        setValue('apellido', patient.apellido);
        setValue('email', patient.email);
        setValue('telefono', patient.telefono);
        // Formatear fecha para input date si existe
        if (patient.fecha_nacimiento) {
            setValue('fecha_nacimiento', patient.fecha_nacimiento.split('T')[0]);
        }
        setValue('direccion', patient.direccion);
        setValue('historial_medico', patient.historial_medico);
        setModalOpen(true);
    };

    const handleDeleteClick = (patient) => {
        setConfirmDialog({
            isOpen: true,
            patientId: patient.id_paciente,
            patientName: `${patient.nombre} ${patient.apellido}`
        });
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/patients/${confirmDialog.patientId}`);
            setConfirmDialog({ isOpen: false, patientId: null, patientName: '' });
            fetchPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
        }
    };

    const onSubmit = async (data) => {
        try {
            // Limpieza de datos: convertir strings vacíos a null
            const cleanedData = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
            );

            const payload = { ...cleanedData, id_empresa: companyId, id_clinica: clinicId || undefined }; // Asegurar tenant

            if (editingPatient) {
                await api.put(`/patients/${editingPatient.id_paciente}`, payload);
            } else {
                await api.post('/patients', payload);
            }
            setModalOpen(false);
            fetchPatients();
        } catch (error) {
            console.error('Error saving patient:', error);
            alert('Error al guardar paciente. Verifica los datos.');
        }
    };

    return (
        <div className="patients-page animate-fade-in">
            <div className="page-header">
                <div className="header-left">
                    <Button variant="ghost" onClick={() => window.history.back()} icon={<ArrowLeft size={16} />}>
                        Volver
                    </Button>
                    <div className="header-titles">
                        <h2 className="page-heading">Pacientes</h2>
                        <p className="page-subheading">Gestión y expediente digital</p>
                    </div>
                </div>
                <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
                    Nuevo paciente
                </Button>
            </div>

            <div className="filters-bar">
                <div className="search-container">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="view-switch">
                    <Button
                        variant={viewMode === 'cards' ? 'primary' : 'outline'}
                        size="sm"
                        icon={<Grid size={14} />}
                        onClick={() => setViewMode('cards')}
                    >
                        Vista tarjetas
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'primary' : 'outline'}
                        size="sm"
                        icon={<List size={14} />}
                        onClick={() => setViewMode('list')}
                    >
                        Vista tabla
                    </Button>
                </div>
            </div>

            {viewMode === 'cards' ? (
                <div className="patients-grid">
                    {loading ? (
                        <div className="col-span-full text-center py-10 text-gray-500">Cargando pacientes...</div>
                    ) : patients.length > 0 ? (
                        patients.map(patient => (
                            <Card key={patient.id_paciente} className="patient-card" padding="md">
                                <div className="patient-card-body">
                                    <div className="patient-card-header">
                                        <div className="patient-avatar">
                                            {patient.nombre ? patient.nombre.charAt(0) : 'P'}
                                        </div>
                                        <div className="patient-info">
                                            <h3 className="patient-name">{patient.nombre} {patient.apellido}</h3>
                                            <p className="patient-meta">
                                                Exp: {patient.id_paciente.toString().padStart(6, '0')}
                                            </p>
                                        </div>
                                        <div className="patient-actions">
                                            <button className="icon-btn" onClick={() => handleOpenEdit(patient)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="icon-btn text-error" onClick={() => handleDeleteClick(patient)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="patient-details">
                                        {patient.telefono && (
                                            <div className="detail-row">
                                                <Phone size={14} className="detail-icon" />
                                                <span>{patient.telefono}</span>
                                            </div>
                                        )}
                                        {patient.fecha_nacimiento && (
                                            <div className="detail-row">
                                                <Calendar size={14} className="detail-icon" />
                                                <span>{format(new Date(patient.fecha_nacimiento), 'dd MMM yyyy', { locale: es })}</span>
                                            </div>
                                        )}
                                        {patient.direccion && (
                                            <div className="detail-row">
                                                <MapPin size={14} className="detail-icon" />
                                                <span>{patient.direccion}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="patient-footer">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        icon={<FileText size={14} />}
                                        onClick={() => navigate(`/appointments/history?patientId=${patient.id_paciente}&clinicId=${clinicId || ''}&companyId=${companyId}`)}
                                    >
                                        Ver historial de citas
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10">
                            <div className="empty-state-icon"><User size={48} /></div>
                            <p className="text-gray-500 mt-2">No se encontraron pacientes</p>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="users-table-card card-elevated">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Cargando pacientes...</div>
                    ) : patients.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No se encontraron pacientes</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Teléfono</th>
                                        <th>Email</th>
                                        <th>Dirección</th>
                                        <th>Fecha nac.</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.map(patient => (
                                        <tr key={patient.id_paciente}>
                                            <td className="font-mono">#{patient.id_paciente.toString().padStart(6, '0')}</td>
                                            <td>{patient.nombre} {patient.apellido}</td>
                                            <td>{patient.telefono || '—'}</td>
                                            <td>{patient.email || '—'}</td>
                                            <td>{patient.direccion || '—'}</td>
                                            <td>{patient.fecha_nacimiento ? format(new Date(patient.fecha_nacimiento), 'dd/MM/yyyy') : '—'}</td>
                                            <td className="table-actions">
                                                <Button variant="ghost" size="sm" icon={<FileText size={14} />} onClick={() => navigate(`/appointments/history?patientId=${patient.id_paciente}&clinicId=${clinicId || ''}&companyId=${companyId}`)}>
                                                    Historial
                                                </Button>
                                                <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEdit(patient)}>
                                                    Editar
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-error" icon={<Trash2 size={14} />} onClick={() => handleDeleteClick(patient)}>
                                                    Eliminar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingPatient ? 'Editar paciente' : 'Registrar nuevo paciente'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>
                            {editingPatient ? 'Guardar cambios' : 'Registrar'}
                        </Button>
                    </>
                }
            >
                <form className="patient-form">
                    <div className="form-row">
                        <Input
                            label="Nombre"
                            placeholder="Nombre del paciente"
                            fullWidth
                            error={errors.nombre?.message}
                            {...register('nombre')}
                        />
                        <Input
                            label="Apellido"
                            placeholder="Apellidos"
                            fullWidth
                            error={errors.apellido?.message}
                            {...register('apellido')}
                        />
                    </div>

                    <div className="form-row">
                        <Input
                            label="Teléfono"
                            placeholder="+34 600 000 000"
                            icon={<Phone size={16} />}
                            fullWidth
                            {...register('telefono')}
                        />
                        <Input
                            label="Fecha nacimiento"
                            type="date"
                            fullWidth
                            {...register('fecha_nacimiento')}
                        />
                    </div>

                    <Input
                        label="Email (opcional)"
                        placeholder="paciente@email.com"
                        type="email"
                        fullWidth
                        {...register('email')}
                    />

                    <Input
                        label="Dirección"
                        placeholder="Calle, número, piso..."
                        fullWidth
                        {...register('direccion')}
                    />

                    <div className="input-container">
                        <label className="input-label">Historial médico inicial</label>
                        <textarea
                            className="input-field textarea-field"
                            rows="3"
                            placeholder="Alergias, condiciones previas..."
                            {...register('historial_medico')}
                        ></textarea>
                    </div>

                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Confirmar eliminación"
                message={`¿Estás seguro de que deseas eliminar al paciente ${confirmDialog.patientName}? Esta acción no se puede deshacer.`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, patientId: null, patientName: '' })}
            />
        </div>
    );
};

export default PatientsPage;
