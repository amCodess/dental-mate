import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredSelection } from '../utils/clinicSelection';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addDays,
    parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, User, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Button, Card, Modal, Input, Badge } from '../components/ui';
import './AppointmentsPage.css';

const AppointmentsPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const storedSelection = getStoredSelection();
    const clinicIdParam = searchParams.get('clinicId') || storedSelection.clinicId;
    const clinicId = clinicIdParam ? Number(clinicIdParam) : null;
    const companyId = Number(searchParams.get('companyId') || storedSelection.companyId || 1);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            id_empresa: companyId,
            duracion_minutos: 30,
            precio: '',
            motivo: '',
            motivo_detallado: ''
        }
    });

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const toArray = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.data?.data)) return payload.data.data;
        return [];
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/appointments', { params: { clinic_id: clinicId || undefined, company_id: companyId || undefined } });
            setAppointments(toArray(response));
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients', { params: { clinic_id: clinicId || undefined, company_id: companyId || undefined } });
            setPatients(toArray(response));
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const fetchTreatments = async () => {
        try {
            const response = await api.get('/treatments', { params: { company_id: companyId || undefined, clinic_id: clinicId || undefined } });
            setTreatments(toArray(response));
        } catch (error) {
            console.error('Error fetching treatments:', error);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchPatients();
        fetchTreatments();
    }, [currentDate, clinicId, companyId]);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const handleDateClick = (day) => {
        setSelectedDate(day);
        reset({
            fecha: format(day, 'yyyy-MM-dd'),
            hora: '09:00',
            duracion_minutos: 30,
            id_empresa: companyId,
            id_empleado: 1,
            precio: '',
            motivo: '',
            motivo_detallado: ''
        });
        setModalOpen(true);
    };

    const handleNewAppointment = () => {
        handleDateClick(selectedDate);
    };

    const selectedTreatmentId = watch('id_tratamiento');
    const treatmentProducts = useMemo(() => {
        if (!selectedTreatmentId) return [];
        const treatment = treatments.find(t => String(t.id_tratamiento || t.id) === String(selectedTreatmentId));
        if (!treatment) return [];
        if (Array.isArray(treatment.products)) return treatment.products;
        if (Array.isArray(treatment.productos)) return treatment.productos;
        return [];
    }, [selectedTreatmentId, treatments]);

    const defaultPrice = useMemo(() => {
        if (treatmentProducts.length > 0) {
            const sum = treatmentProducts.reduce((acc, p) => acc + Number(p.precio || p.price || 0), 0);
            return sum ? sum.toFixed(2) : '';
        }
        const treatment = treatments.find(t => String(t.id_tratamiento || t.id) === String(selectedTreatmentId));
        if (treatment?.precio) return Number(treatment.precio).toFixed(2);
        return '';
    }, [treatmentProducts, treatments, selectedTreatmentId]);

    useEffect(() => {
        if (selectedTreatmentId) {
            setValue('precio', defaultPrice);
        }
    }, [selectedTreatmentId, defaultPrice, setValue]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                id_empresa: companyId,
                id_empleado: data.id_empleado || 1,
                id_paciente: parseInt(data.id_paciente),
                duracion_minutos: parseInt(data.duracion_minutos),
                id_clinica: clinicId || undefined,
                id_tratamiento: data.id_tratamiento ? parseInt(data.id_tratamiento) : undefined,
                precio: data.precio ? parseFloat(data.precio) : undefined,
                motivo: data.motivo || data.motivo_detallado || null
            };
            await api.post('/appointments', payload);
            setModalOpen(false);
            fetchAppointments();
            reset({
                fecha: format(selectedDate, 'yyyy-MM-dd'),
                hora: '09:00',
                duracion_minutos: 30,
                id_empresa: companyId,
                id_empleado: 1,
                precio: '',
                motivo: '',
                motivo_detallado: ''
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Error al crear cita: ' + (error.response?.data?.message || 'Verifique los datos'));
        }
    };

    const dayAppointments = (day) => appointments.filter(apt => isSameDay(parseISO(apt.fecha), day));

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmada': return 'success';
            case 'Pendiente': return 'warning';
            case 'Cancelada': return 'error';
            default: return 'neutral';
        }
    };

    return (
        <div className="appointments-page animate-fade-in">
            <div className="page-header">
                <div className="header-left">
                    <Button variant="ghost" onClick={() => window.history.back()} icon={<ArrowLeft size={16} />}>
                        Volver
                    </Button>
                    <div className="header-titles">
                        <h2 className="page-heading">Calendario de citas</h2>
                        <p className="page-subheading">Gestiona tu agenda eficientemente</p>
                    </div>
                </div>
                <div className="header-controls">
                    <div className="date-navigation">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                            <ChevronLeft size={20} />
                        </Button>
                        <h3 className="current-month-label">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                            <ChevronRight size={20} />
                        </Button>
                    </div>
                    <Button variant="primary" onClick={handleNewAppointment} icon={<Plus size={18} />}>
                        Nueva cita
                    </Button>
                </div>
            </div>

            <div className="calendar-container">
                <div className="weekdays-header">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="weekday-label">{day}</div>
                    ))}
                </div>
                <div className="days-grid">
                    {calendarDays.map((day) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        const dayApts = dayAppointments(day);

                        return (
                            <div
                                key={day.toISOString()}
                                className={`day-cell ${!isCurrentMonth ? 'outside-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => handleDateClick(day)}
                            >
                                <div className="day-number">
                                    <span className="day-num-text">{format(day, 'd')}</span>
                                </div>
                                <div className="day-content">
                                    {dayApts.map((apt, i) => (
                                        <div key={i} className={`apt-dot-item status-${apt.estado?.toLowerCase() || 'pendiente'}`} title={`${apt.hora} - ${apt.patient?.nombre}`}>
                                            <span className="apt-time">{apt.hora.substring(0, 5)}</span>
                                            <span className="apt-name">{apt.patient?.nombre}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Card className="selected-day-panel" title={`Citas del ${format(selectedDate, 'd MMMM', { locale: es })}`}>
                <div className="panel-header">
                    <div className="panel-actions">
                        <Button size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))} variant="ghost" icon={<ChevronLeft size={14} />} />
                        <Button size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))} variant="ghost" icon={<ChevronRight size={14} />} />
                    </div>
                    <Button size="sm" onClick={handleNewAppointment} icon={<Plus size={14} />}>Agregar cita</Button>
                </div>
                {dayAppointments(selectedDate).length === 0 ? (
                    <p className="text-gray-500 py-4">No hay citas programadas para este día.</p>
                ) : (
                    <div className="day-agenda-list">
                        {dayAppointments(selectedDate).map(apt => (
                            <div key={apt.id_cita || `${apt.fecha}-${apt.hora}`} className="agenda-item">
                                <div className="agenda-time">
                                    <Clock size={16} />
                                    <span>{apt.hora.substring(0, 5)}</span>
                                </div>
                                <div className="agenda-info">
                                    <h4>{apt.patient?.nombre} {apt.patient?.apellido}</h4>
                                    <p className="agenda-subtitle">Motivo: {apt.motivo || 'N/D'} • Tratamiento: {apt.tratamiento?.nombre_tratamiento || 'N/D'} • {apt.duracion_minutos} min</p>
                                </div>
                                <Badge variant={getStatusColor(apt.estado)}>{apt.estado}</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Agendar nueva cita"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>Confirmar cita</Button>
                    </>
                }
            >
                <form className="appointment-form">
                    <div className="form-row">
                        <div className="input-container full-width">
                            <label className="input-label">Paciente</label>
                            <div className="select-wrapper">
                                <select className="select-field" {...register('id_paciente', { required: true })}>
                                    <option value="">Seleccionar paciente...</option>
                                    {patients.map(p => (
                                        <option key={p.id_paciente} value={p.id_paciente}>
                                            {p.nombre} {p.apellido}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <Input
                            type="date"
                            label="Fecha"
                            fullWidth
                            {...register('fecha', { required: true })}
                        />
                        <Input
                            type="time"
                            label="Hora"
                            fullWidth
                            {...register('hora', { required: true })}
                        />
                    </div>

                    <div className="form-row">
                        <Input
                            type="number"
                            label="Duración (min)"
                            min="15"
                            step="15"
                            fullWidth
                            {...register('duracion_minutos')}
                        />
                        <div className="input-container full-width">
                            <label className="input-label">Motivo de la cita</label>
                            <div className="select-wrapper">
                                <select className="select-field" {...register('motivo')}>
                                    <option value="">Selecciona motivo...</option>
                                    <option value="Revisión general">Revisión general</option>
                                    <option value="Urgencia">Urgencia</option>
                                    <option value="Seguimiento">Seguimiento</option>
                                    <option value="Tratamiento">Tratamiento específico</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Motivo detallado (opcional)"
                        placeholder="Escribe una nota breve"
                        fullWidth
                        {...register('motivo_detallado')}
                    />

                    <div className="form-row">
                        <div className="input-container full-width">
                            <label className="input-label">Tratamiento (opcional)</label>
                            <div className="select-wrapper">
                                <select className="select-field" {...register('id_tratamiento')}>
                                    <option value="">Selecciona tratamiento...</option>
                                    {treatments.map(t => (
                                        <option key={t.id_tratamiento || t.id} value={t.id_tratamiento || t.id}>
                                            {t.nombre_tratamiento || t.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <Input
                            type="number"
                            label="Precio sugerido (€)"
                            min="0"
                            step="0.01"
                            fullWidth
                            placeholder="Auto desde productos"
                            {...register('precio')}
                        />
                    </div>

                    {treatmentProducts.length > 0 && (
                        <div className="product-list">
                            <div className="product-list-header">Productos del tratamiento</div>
                            <ul>
                                {treatmentProducts.map(prod => (
                                    <li key={prod.id_producto || prod.id}>
                                        <span>{prod.nombre_producto || prod.nombre}</span>
                                        <span className="product-price">{Number(prod.precio || prod.price || 0).toFixed(2)}€</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="product-total">Suma productos: {defaultPrice || '0.00'}€</div>
                        </div>
                    )}

                    <Input
                        label="Notas"
                        placeholder="Motivo de la consulta..."
                        fullWidth
                        {...register('notas')}
                    />
                </form>
            </Modal>
        </div>
    );
};

export default AppointmentsPage;
