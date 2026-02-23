import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    parseISO,
    addMinutes
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
    const [updating, setUpdating] = useState({});
    const [deleting, setDeleting] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('Pagado');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paidSoFar, setPaidSoFar] = useState(0);
    const [deletedAppointments, setDeletedAppointments] = useState([]);
    const [slotBlocked, setSlotBlocked] = useState(false);
    const [slotMessage, setSlotMessage] = useState('');

    const { register, handleSubmit, reset, setValue, watch, getValues } = useForm({
        defaultValues: {
            id_empresa: companyId,
            duracion_minutos: 30,
            precio: '',
            motivo: '',
            motivo_otro: ''
        }
    });

    const [dayListModal, setDayListModal] = useState({ open: false, day: null });
    const navigate = useNavigate();
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
            const scoped = toArray(response).filter(apt =>
                (!companyId || Number(apt.id_empresa) === Number(companyId)) &&
                (!clinicId || Number(apt.id_clinica) === Number(clinicId)) &&
                (apt.patient ? (!clinicId || Number(apt.patient.id_clinica || apt.patient.clinic_id) === Number(clinicId)) : true)
            ).map(apt => ({
                ...apt,
                id: apt.id_cita ?? apt.id, // id seguro para las acciones
                invoice: apt.invoice || apt.factura || null,
                pago_status: apt.pago_status ?? apt.invoice?.pago_status ?? apt.factura?.pago_status ?? null
            }));
            setAppointments(scoped);
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
            const scoped = toArray(response).filter(p =>
                (!companyId || Number(p.id_empresa || p.company_id) === Number(companyId)) &&
                (!clinicId || Number(p.id_clinica || p.clinic_id) === Number(clinicId))
            );
            setPatients(scoped);
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
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleDateClick = (day) => {
        setSelectedDate(day);
        setEditingAppointment(null);
        reset({
            fecha: format(day, 'yyyy-MM-dd'),
            hora: '09:00',
            duracion_minutos: 30,
            id_empresa: companyId,
            id_empleado: 1,
            precio: '',
            motivo: '',
            motivo_otro: '',
            id_paciente: '',
            id_tratamiento: ''
        });
        setPaymentStatus('Pagado');
        setPaymentMethod('Efectivo');
        setPaymentAmount('');
        setPaymentOpen(false);
        setModalOpen(true);
    };

    const handleAppointmentClick = (apt) => {
        const day = parseISO(apt.fecha);
        setSelectedDate(day);
        setEditingAppointment(apt);

        const matchingTreatment = treatments.find(t =>
            (t.nombre_tratamiento || t.nombre || '').toLowerCase() === (apt.motivo || '').toLowerCase()
        );
        const motiveForForm = matchingTreatment ? 'Tratamiento específico' : (apt.motivo || '');

        reset({
            fecha: apt.fecha,
            hora: apt.hora,
            duracion_minutos: apt.duracion_minutos || 30,
            id_empresa: apt.id_empresa || companyId,
            id_empleado: apt.id_empleado || 1,
            precio: apt.precio ?? '',
            motivo: motiveForForm,
            motivo_otro: motiveForForm === 'Otro' ? (apt.motivo || '') : '',
            id_paciente: apt.id_paciente || apt.patient?.id_paciente || '',
            id_tratamiento: matchingTreatment ? (matchingTreatment.id_tratamiento || matchingTreatment.id) : (apt.id_tratamiento || apt.tratamiento?.id_tratamiento || '')
        });
        setPaymentStatus(apt.pago_status || 'Pagado');
        setPaymentMethod(apt.invoice?.tipo_pago || 'Efectivo');
        const paid = (apt.invoice?.pago_status === 'Parcial' || apt.pago_status === 'Parcial')
            ? Number(apt.invoice?.importe_total || 0)
            : 0;
        setPaidSoFar(paid);
        setPaymentAmount('');
        setPaymentOpen(false);
        setModalOpen(true);
    };

    const motiveValue = watch('motivo');
    const customMotive = watch('motivo_otro');
    const selectedTreatmentId = watch('id_tratamiento');
    const priceValue = watch('precio');
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

    const partialPaymentInvalid = useMemo(() => {
        if (paymentStatus !== 'Parcial') return false;
        const amount = Number(paymentAmount || 0);
        const total = Number(priceValue || defaultPrice || editingAppointment?.precio || 0);
        if (!amount || amount <= 0) return true;
        if (total && amount + (paidSoFar || 0) - total > 0.0001) return true;
        return false;
    }, [paymentStatus, paymentAmount, priceValue, defaultPrice, paidSoFar, editingAppointment]);

    const totalPriceForPayment = Number(priceValue || defaultPrice || editingAppointment?.precio || 0);
    const remainingForPayment = Math.max(totalPriceForPayment - (paidSoFar || 0), 0);
    const paidPercent = totalPriceForPayment ? Math.min(((paidSoFar || 0) / totalPriceForPayment) * 100, 100) : 0;

    useEffect(() => {
        if (motiveValue !== 'Tratamiento específico') {
            setValue('id_tratamiento', '');
        }
        if (motiveValue !== 'Otro') {
            setValue('motivo_otro', '');
        }
    }, [motiveValue, setValue]);

    useEffect(() => {
        if (selectedTreatmentId) {
            setValue('precio', defaultPrice);
            const treatment = treatments.find(t => String(t.id_tratamiento || t.id) === String(selectedTreatmentId));
            if (treatment?.duracion_minima) {
                setValue('duracion_minutos', Number(treatment.duracion_minima));
            }
        }
    }, [selectedTreatmentId, defaultPrice, setValue, treatments]);

    useEffect(() => {
        if (paymentStatus === 'Pagado') {
            const autoAmount = priceValue || defaultPrice || '';
            setPaymentAmount(autoAmount);
        } else if (paymentStatus === 'Pendiente') {
            setPaymentAmount('');
        }
    }, [paymentStatus, priceValue, defaultPrice]);

    const buildPayloadFromForm = (data, extra = {}) => {
        const selectedTreat = treatments.find(t => String(t.id_tratamiento || t.id) === String(data.id_tratamiento));
        const motiveFromTreatment = (motiveValue === 'Tratamiento específico' && selectedTreat)
            ? (selectedTreat.nombre_tratamiento || selectedTreat.nombre || 'Tratamiento específico')
            : null;
        const motiveFromOther = motiveValue === 'Otro' ? (data.motivo_otro || null) : null;

        return {
            ...data,
            id_empresa: companyId,
            id_empleado: data.id_empleado || 1,
            id_paciente: parseInt(data.id_paciente),
            duracion_minutos: parseInt(data.duracion_minutos),
            id_clinica: clinicId || undefined,
            id_tratamiento: data.id_tratamiento ? parseInt(data.id_tratamiento) : undefined,
            precio: data.precio ? parseFloat(data.precio) : undefined,
            motivo: motiveFromTreatment || motiveFromOther || data.motivo || null,
            ...extra
        };
    };

    const isBlockingAppointment = (apt) => {
        if (!apt) return false;
        if (apt.deleted || apt.deleted_at) return false;
        if (apt.estado === 'Completada' && apt.pago_status !== 'Parcial') return false;
        return true;
    };

    const overlapExists = (newStart, newEnd, editingId = null) => {
        return appointments.some(apt => {
            if (!isBlockingAppointment(apt)) return false;
            if (editingId && (apt.id_cita || apt.id) === editingId) return false;
            if (!isSameDay(parseISO(apt.fecha), newStart)) return false;
            const aptStart = parseISO(`${apt.fecha}T${apt.hora}`);
            const aptEnd = addMinutes(aptStart, parseInt(apt.duracion_minutos || 30));
            return (newStart < aptEnd) && (newEnd > aptStart);
        });
    };

    const onSubmit = async (data) => {
        try {
            const payload = buildPayloadFromForm(data);

            const newStart = parseISO(`${data.fecha}T${data.hora}`);
            const newEnd = addMinutes(newStart, parseInt(data.duracion_minutos));
            const overlap = overlapExists(newStart, newEnd, editingAppointment ? (editingAppointment.id_cita || editingAppointment.id) : null);
            if (overlap) {
                alert('Ya existe una cita en ese rango horario.');
                return;
            }

            if (editingAppointment?.id_cita) {
                await api.put(`/appointments/${editingAppointment.id_cita}`, payload);
            } else {
                await api.post('/appointments', payload);
            }
            setModalOpen(false);
            fetchAppointments();
            reset({
                fecha: format(selectedDate, 'yyyy-MM-dd'),
                hora: '09:00',
                duracion_minutos: 30,
                id_empresa: companyId,
                id_empleado: 1,
                precio: '',
                motivo: ''
            });
            setEditingAppointment(null);
            setPaymentStatus('Pagado');
            setPaymentMethod('Efectivo');
            setPaymentAmount('');
            setPaymentOpen(false);
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Error al crear cita: ' + (error.response?.data?.message || 'Verifique los datos'));
        }
    };

    const handleSubmitPayment = async (formData) => {
        const apt = editingAppointment;
        if (!apt) return;
        const aptId = apt.id_cita || apt.id;
        if (!aptId) return;

        const parsedAmount = paymentStatus === 'Parcial'
            ? Number.parseFloat(paymentAmount || 0)
            : undefined;
        const totalPrice = Number(priceValue || defaultPrice || apt.precio || 0);
        const newPaidTotal = paymentStatus === 'Parcial'
            ? Math.min((paidSoFar || 0) + (parsedAmount || 0), totalPrice || ((paidSoFar || 0) + (parsedAmount || 0)))
            : totalPrice || payload.precio || 0;
        // Si la suma cubre el total, marcamos como pagado
        const effectiveStatus = (paymentStatus === 'Parcial' && totalPrice && newPaidTotal >= totalPrice - 0.0001)
            ? 'Pagado'
            : paymentStatus;
        const payload = buildPayloadFromForm(formData, {
            estado: 'Completada',
            pago_status: effectiveStatus,
            tipo_pago: paymentMethod,
            precio: formData.precio ? parseFloat(formData.precio) : undefined
        });

        try {
            // Guardar cita con estado completado
            await api.put(`/appointments/${aptId}`, payload);

            // Crear factura con los datos actualizados
            const updatedApt = { ...apt, ...payload };
            const invoiced = await createInvoiceFromAppointment(updatedApt, {
                tipoPago: paymentMethod,
                pagoStatus: effectiveStatus,
                // La factura refleja lo abonado hasta ahora (acumulado)
                overrideAmount: newPaidTotal
            });

            // Refrescar citas para ver el nuevo estado
            await fetchAppointments();
        } catch (error) {
            console.error('Error al confirmar pago:', error);
            alert('No se pudo confirmar el pago. Intenta nuevamente.');
            return;
        } finally {
            setModalOpen(false);
            setEditingAppointment(null);
            setPaymentStatus('Pagado');
            setPaymentMethod('Efectivo');
            setPaymentAmount('');
            setPaymentOpen(false);
        }
    };

    const updateAppointmentStatus = async (apt, nuevoEstado, extraPayload = {}) => {
        const aptId = apt?.id_cita || apt?.id;
        if (!aptId) return false;
        try {
            setUpdating(prev => ({ ...prev, [aptId]: true }));
            await api.put(`/appointments/${aptId}`, { estado: nuevoEstado, ...extraPayload });
            await fetchAppointments();
            return true;
        } catch (error) {
            console.error('Error actualizando cita:', error);
            alert('No se pudo actualizar el estado de la cita.');
            return false;
        } finally {
            setUpdating(prev => ({ ...prev, [aptId]: false }));
        }
    };

    const createInvoiceFromAppointment = async (apt, { tipoPago = 'Efectivo', pagoStatus = 'Pagado', overrideAmount = null } = {}) => {
        const appointmentId = apt?.id_cita || apt?.id;
        if (!appointmentId) {
            alert('No se pudo generar factura: falta el identificador de la cita.');
            return false;
        }
        const clinicForInvoice = apt?.id_clinica ?? clinicId ?? apt?.patient?.id_clinica ?? apt?.patient?.clinic_id ?? null;
        const companyForInvoice = apt?.id_empresa ?? companyId;
        const rawImporte = overrideAmount !== null ? overrideAmount : (apt?.precio ?? apt?.tratamiento?.precio ?? 0);
        const importeTotal = Number.parseFloat(rawImporte) || 0;
        try {
            const payload = {
                id_empresa: companyForInvoice,
                id_clinica: clinicForInvoice || undefined,
                id_paciente: apt.id_paciente || apt.patient?.id_paciente,
                id_cita: appointmentId,
                importe_total: importeTotal,
                tipo_pago: tipoPago,
                pago_status: pagoStatus,
                fecha_emision: apt.fecha || format(new Date(), 'yyyy-MM-dd')
            };
            if (apt.invoice?.id_factura) {
                await api.put(`/invoices/${apt.invoice.id_factura}`, payload);
            } else {
                await api.post('/invoices', payload);
            }
            return true;
        } catch (error) {
            console.error('Error al crear factura desde cita:', error);
            alert('La cita se marcó, pero la factura no pudo generarse.');
            return false;
        }
    };

    const handleCancelApt = async (apt) => {
        await updateAppointmentStatus(apt, 'Cancelada');
    };

    const handleMarkPaid = async (apt) => {
        const currentForm = getValues();
        // Reutiliza el mismo envío de pago para no duplicar lógica
        await handleSubmitPayment(currentForm);
    };

    // Recalcula si el horario actual está bloqueado
    useEffect(() => {
        const fecha = watch('fecha');
        const hora = watch('hora');
        const dur = parseInt(watch('duracion_minutos') || 30);
        if (!fecha || !hora) {
            setSlotBlocked(false);
            return;
        }
        const newStart = parseISO(`${fecha}T${hora}`);
        const newEnd = addMinutes(newStart, dur);
        const editingId = editingAppointment ? (editingAppointment.id_cita || editingAppointment.id) : null;
        const overlap = overlapExists(newStart, newEnd, editingId);
        setSlotBlocked(overlap);
    }, [watch('fecha'), watch('hora'), watch('duracion_minutos'), appointments, editingAppointment]);

    const handleMarkPaidClick = (apt) => {
        handleMarkPaid(apt);
    };

    const handleCompleteWithoutPayment = async (apt) => {
        const ok = await updateAppointmentStatus(apt, 'Completada', { pago_status: 'Pendiente' });
        if (ok) {
            await fetchAppointments();
            setModalOpen(false);
            setEditingAppointment(null);
            setPaymentStatus('Pagado');
        }
    };

    const handleDeleteApt = async (apt) => {
        const aptId = apt?.id_cita || apt?.id;
        if (!aptId) {
            alert('La cita no tiene identificador, recarga e inténtalo de nuevo.');
            return;
        }
        try {
            setDeleting(true);
            await api.delete(`/appointments/${aptId}`);
            setDeletedAppointments(prev => [...prev, { ...apt, estado: 'Eliminada' }]);
            setAppointments(prev => prev.filter(item => (item.id_cita || item.id) !== aptId));
            await fetchAppointments();
            setModalOpen(false);
            setEditingAppointment(null);
            setPaymentStatus('Pagado');
        } catch (error) {
            console.error('Error eliminando cita:', error?.response?.data || error);
            const message = error?.response?.data?.message || error?.response?.data?.error || 'No se pudo eliminar la cita.';
            alert(message);
        } finally {
            setDeleting(false);
        }
    };

    const dayAppointments = (day) => {
        return appointments
            .filter(apt => isSameDay(parseISO(apt.fecha), day))
            .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
    };

    const formatTimeRange = (apt) => {
        try {
            const startStr = (apt.hora || '').substring(0, 5);
            const startDate = parseISO(`${apt.fecha}T${startStr}`);
            const endDate = addMinutes(startDate, Number(apt.duracion_minutos || 30));
            const endStr = format(endDate, 'HH:mm');
            return `${startStr} - ${endStr}`;
        } catch (e) {
            return (apt.hora || '').substring(0, 5);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pendiente': return 'warning';
            case 'Cancelada': return 'error';
            case 'Completada': return 'success';
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
                    <div className="extra-actions">
                        <Button variant="outline" size="sm" onClick={handleToday}>Hoy</Button>
                        <Button variant="primary" size="sm" onClick={() => navigate('/appointments/history')}>Histórico</Button>
                    </div>
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
                        {dayApts.slice(0, 3).map((apt, i) => {
                            const timeRange = formatTimeRange(apt);
                            const patientName = apt.patient?.nombre || '';
                            const motive = apt.motivo || '';
                            return (
                                <div
                                    key={i}
                                    className={`apt-dot-item status-${apt.estado?.toLowerCase() || 'pendiente'} ${apt.pago_status === 'Parcial' ? 'status-parcial' : ''} ${apt.pago_status === 'Pagado' ? 'status-pagado' : ''} ${(apt.estado === 'Completada' && (!apt.pago_status || apt.pago_status === 'Pendiente')) ? 'status-completada-sin-pago' : ''}`}
                                    title={`${timeRange} - ${patientName}${motive ? ' · ' + motive : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt); }}
                                >
                                    <span className="apt-time">{timeRange}</span>
                                    <div className="apt-line">
                                        <span className="apt-name">{patientName}</span>
                                        {motive && <span className="apt-sep">·</span>}
                                        {motive && <span className="apt-motive">{motive}</span>}
                                    </div>
                                </div>
                            );
                        })}
                        {dayApts.length > 3 && (
                            <button
                                className="more-appointments-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDayListModal({ open: true, day });
                                }}
                            >
                                +{dayApts.length - 3} más
                            </button>
                        )}
                    </div>
                </div>
            );
        })}
                </div>
            </div>

            {/* Panel inferior eliminado: gestión ahora sólo desde el calendario (clic en cita abre modal) */}

            <Modal
                isOpen={modalOpen}
                onClose={() => {
        setModalOpen(false);
        setEditingAppointment(null);
        setPaymentStatus('Pagado');
            setPaymentMethod('Efectivo');
            setPaymentAmount('');
            setPaymentOpen(false);
        }}
        title={editingAppointment ? 'Editar cita' : 'Agendar nueva cita'}
        footer={
            <>
                        <Button variant="primary" disabled={slotBlocked} onClick={handleSubmit(onSubmit)}>
                            {editingAppointment ? 'Guardar cambios' : 'Confirmar cita'}
                        </Button>
                    </>
                }
            >
                <form className="appointment-form">
                    <div className="form-row">
                        <div className="input-container full-width">
                            <label className="input-label">Paciente</label>
                            <div className="select-wrapper">
                                <select className="select-field" {...register('id_paciente', { required: true })}>
                                    <option value="" disabled>Seleccionar paciente...</option>
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
                            suffix={slotBlocked ? <span className="hour-blocked-icon" title="Horario ocupado"></span> : null}
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
                                    <option value="" disabled>Selecciona motivo...</option>
                                    <option value="Revisión general">Revisión general</option>
                                    <option value="Urgencia">Urgencia</option>
                                    <option value="Seguimiento">Seguimiento</option>
                                    <option value="Tratamiento específico">Tratamiento específico</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {motiveValue === 'Otro' && (
                        <Input
                            label="Especifica el motivo"
                            placeholder=""
                            fullWidth
                            {...register('motivo_otro', { required: motiveValue === 'Otro' })}
                        />
                    )}

                    {motiveValue === 'Tratamiento específico' && (
                        <div className="form-row">
                            <div className="input-container full-width">
                            <label className="input-label">Tratamiento (obligatorio para este motivo)</label>
                            <div className="select-wrapper">
                                <select
                                    className="select-field"
                                    {...register('id_tratamiento', { required: motiveValue === 'Tratamiento específico' })}
                                >
                                    <option value="" disabled>Selecciona tratamiento...</option>
                                    {treatments.map(t => (
                                        <option key={t.id_tratamiento || t.id} value={t.id_tratamiento || t.id}>
                                            {t.nombre_tratamiento || t.nombre}
                                        </option>
                                    ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <Input
                            type="number"
                            label="Precio (€)"
                            min="0"
                            step="0.01"
                            fullWidth
                            placeholder=""
                            {...register('precio')}
                        />
                    </div>

                    {motiveValue === 'Tratamiento específico' && treatmentProducts.length > 0 && (
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
                        placeholder=""
                        fullWidth
                        {...register('notas')}
                    />

                    {editingAppointment && (
                        <>
                            <div className="payment-toggle-row">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPaymentOpen(p => !p)}
                                >
                                    {paymentOpen ? 'Ocultar pago' : 'Gestionar pago'}
                                </Button>
                                <span className="payment-hint-inline">Registrar cobro o dejarlo pendiente.</span>
                            </div>

                            {paymentOpen && (
                                <div className="payment-card">
                                    <div className="payment-card-header">
                                        <h4>Pago de la cita</h4>
                                        <span className="payment-hint">Selecciona estado y método. Para parciales indica el importe pagado.</span>
                                    </div>
                                    <div className="form-row">
                                        <div className="input-container full-width">
                                            <label className="input-label">Estado de pago</label>
                                            <div className="select-wrapper">
                                        <select
                                            className="select-field"
                                            value={paymentStatus}
                                            disabled={editingAppointment?.pago_status === 'Parcial' || editingAppointment?.pago_status === 'Pagado'}
                                            onChange={(e) => {
                                                if (editingAppointment?.pago_status === 'Parcial' || editingAppointment?.pago_status === 'Pagado') return;
                                                setPaymentStatus(e.target.value);
                                            }}
                                        >
                                            <option value="Pagado">Pago completo</option>
                                            <option value="Parcial">Pago parcial</option>
                                            <option value="Pendiente">Pendiente</option>
                                        </select>
                                    </div>
                                        </div>
                                        {paymentStatus !== 'Pendiente' && (
                                            <div className="input-container full-width">
                                                <label className="input-label">Método de pago</label>
                                                <div className="select-wrapper">
                                                    <select
                                                        className="select-field"
                                                        value={paymentMethod}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                    >
                                                        <option value="Efectivo">Efectivo</option>
                                                        <option value="Tarjeta">Tarjeta</option>
                                                        <option value="Transferencia">Transferencia</option>
                                                        <option value="Cheque">Cheque</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {paymentStatus === 'Parcial' && (
                                        <div className="form-row payment-two-col">
                                            <Input
                                                type="number"
                                                label="Nuevo pago parcial (€)"
                                                fullWidth
                                                min="0"
                                                step="0.01"
                                                max={remainingForPayment || undefined}
                                                value={paymentAmount}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    const num = Number(raw || 0);
                                                    if (Number.isNaN(num)) { setPaymentAmount(''); return; }
                                                    const capped = remainingForPayment ? Math.min(num, remainingForPayment) : num;
                                                    setPaymentAmount(capped.toString());
                                                }}
                                                disabled={editingAppointment?.pago_status === 'Pagado'}
                                                placeholder="Ej: 50,00"
                                            />
                                            <div className="input-container full-width">
                                                <label className="input-label">Pagado acumulado</label>
                                                <input
                                                    className="input-field readonly-amount"
                                                    value={`${(paidSoFar || 0).toFixed(2)} € de ${totalPriceForPayment ? totalPriceForPayment.toFixed(2) : '0.00'} €`}
                                                    readOnly
                                                    title="Suma de pagos registrados"
                                                />
                                                <div className="progress-bar">
                                                    <div className="progress-bar-fill" style={{ width: `${paidPercent}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="payment-actions">
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            disabled={updating[editingAppointment?.id_cita || editingAppointment?.id] || partialPaymentInvalid || editingAppointment?.pago_status === 'Pagado'}
                                            onClick={() => handleMarkPaidClick(editingAppointment)}
                                        >
                                            Guardar pago
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="appointment-actions-inline">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="pill-btn text-error"
                                    disabled={deleting || editingAppointment.estado === 'Completada' || editingAppointment.pago_status === 'Pagado'}
                                    title={(editingAppointment.estado === 'Completada' || editingAppointment.pago_status === 'Pagado') ? 'No se puede eliminar una cita completada o pagada' : ''}
                                    onClick={() => handleDeleteApt(editingAppointment)}
                                >
                                    Eliminar cita
                                </Button>
                            </div>
                        </>
                    )}
                </form>
            </Modal>

            {dayListModal.open && (
                <Modal
                    isOpen={dayListModal.open}
                    onClose={() => setDayListModal({ open: false, day: null })}
                    title={`Citas del ${dayListModal.day ? format(dayListModal.day, 'd MMMM', { locale: es }) : ''}`}
                    footer={<Button variant="primary" onClick={() => setDayListModal({ open: false, day: null })}>Cerrar</Button>}
                >
                    <div className="day-agenda-list">
                        {dayAppointments(dayListModal.day || new Date()).map((apt, idx) => (
                            <div
                                key={`${apt.id_cita || apt.id || idx}`}
                                className="agenda-item compact clickable"
                                onClick={() => handleAppointmentClick(apt)}
                            >
                                <div className="agenda-time">
                                    <Clock size={16} />
                                    <span>{formatTimeRange(apt)}</span>
                                </div>
                                <div className="agenda-info">
                                    <h4>{apt.patient?.nombre} {apt.patient?.apellido}</h4>
                                    <p className="agenda-subtitle">
                                        {apt.motivo || 'Sin motivo'} • {apt.duracion_minutos} min • Estado: {(apt.estado === 'Confirmada' ? 'Pendiente' : (apt.estado || 'Pendiente'))}
                                    </p>
                                </div>
                                <Badge variant={getStatusColor(apt.estado === 'Confirmada' ? 'Pendiente' : apt.estado)}>{apt.estado === 'Confirmada' ? 'Pendiente' : apt.estado}</Badge>
                            </div>
                        ))}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AppointmentsPage;


