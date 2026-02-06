import { useState, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, User, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Button, Card, Modal, Input, Badge } from '../components/ui';
import './AppointmentsPage.css';

const AppointmentsPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]); // Simplified patient list
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week' (simplified to month first)

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            id_empresa: 1,
            duracion_minutos: 30
        }
    });

    // Calendar generation logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            // In a real app, pass start/end dates to filter by month
            const response = await api.get('/appointments');
            setAppointments(response.data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients'); // Pagination might be an issue in real app
            setPatients(response.data.data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchPatients();
    }, [currentDate]);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const handleDateClick = (day) => {
        setSelectedDate(day);
        // Open modal pre-filled? or just show details below?
    };

    const handleNewAppointment = () => {
        reset({
            fecha: format(selectedDate, 'yyyy-MM-dd'),
            hora: '09:00',
            duracion_minutos: 30,
            id_empresa: 1,
            id_empleado: 1 // Default employee
        });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                id_empresa: 1,
                id_empleado: data.id_empleado || 1, // Default to 1 if not set
                id_paciente: parseInt(data.id_paciente),
                duracion_minutos: parseInt(data.duracion_minutos)
            };
            await api.post('/appointments', payload);
            setModalOpen(false);
            fetchAppointments();
            reset({
                fecha: format(selectedDate, 'yyyy-MM-dd'),
                hora: '09:00',
                duracion_minutos: 30,
                id_empresa: 1,
                id_empleado: 1
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Error al crear cita: ' + (error.response?.data?.message || 'Verifique los datos'));
        }
    };

    const dayAppointments = (day) => {
        return appointments.filter(apt => isSameDay(parseISO(apt.fecha), day));
    };

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
                <div>
                    <h2 className="page-heading">Calendario de citas</h2>
                    <p className="page-subheading">Gestiona tu agenda eficientemente</p>
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
                    {calendarDays.map((day, idx) => {
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

            {/* Selected Day Details Panel */}
            <Card className="selected-day-panel" title={`Citas del ${format(selectedDate, 'd MMMM', { locale: es })}`}>
                {dayAppointments(selectedDate).length === 0 ? (
                    <p className="text-gray-500 py-4">No hay citas programadas para este día.</p>
                ) : (
                    <div className="day-agenda-list">
                        {dayAppointments(selectedDate).map(apt => (
                            <div key={apt.id_cita} className="agenda-item">
                                <div className="agenda-time">
                                    <Clock size={16} />
                                    <span>{apt.hora.substring(0, 5)}</span>
                                </div>
                                <div className="agenda-info">
                                    <h4>{apt.patient?.nombre} {apt.patient?.apellido}</h4>
                                    <p className="agenda-subtitle">Consulta General • {apt.duracion_minutos} min</p>
                                </div>
                                <Badge variant={getStatusColor(apt.estado)}>{apt.estado}</Badge>
                            </div>
                        ))}
                    </div>
                )}
                <Button variant="outline" size="sm" className="mt-4" onClick={handleNewAppointment}>
                    Agregar cita aquí
                </Button>
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

                    <Input
                        type="number"
                        label="Duración (min)"
                        min="15"
                        step="15"
                        fullWidth
                        {...register('duracion_minutos')}
                    />

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
