import { useEffect, useMemo, useState } from 'react';
import { Users, Calendar, DollarSign, CheckCircle, ArrowRight, Clock, MapPin } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import api from '../services/api';
import { getStoredSelection } from '../utils/clinicSelection';
import { format, parseISO, addDays, isWithinInterval, addMinutes } from 'date-fns';
import './DashboardPage.css';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="stat-card" padding="lg">
    <div className="stat-header">
      <div className={`stat-icon-wrapper color-${color}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="stat-content">
      <p className="stat-value">{value}</p>
      <p className="stat-title">{title}</p>
    </div>
  </Card>
);

const AppointmentItem = ({ patient, time, type, status }) => (
  <div className="appointment-item">
    <div className="app-time-wrapper">
      <span className="app-time">{time}</span>
    </div>
    <div className="app-details">
      <p className="app-patient">{patient}</p>
      <p className="app-type">{type}</p>
    </div>
    <div className="app-status">
      <Badge variant={status === 'Completada' ? 'success' : status === 'Cancelada' ? 'error' : 'warning'} dot>
        {status || 'Pendiente'}
      </Badge>
    </div>
  </div>
);

const DashboardPage = () => {
  const storedSelection = getStoredSelection();
  const clinicId = storedSelection.clinicId ? Number(storedSelection.clinicId) : null;
  const clinicName = storedSelection.clinicName || 'Clínica no seleccionada';
  const companyId = Number(storedSelection.companyId || 1);

  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  };

  const filterAppointments = (list) => list.filter(apt => {
    const companyOk = !companyId || Number(apt.id_empresa) === Number(companyId);
    const clinicMatch = apt.id_clinica ?? apt.patient?.id_clinica ?? apt.patient?.clinic_id;
    const clinicOk = !clinicId || Number(clinicMatch) === Number(clinicId);
    const notDeleted = !apt.deleted_at;
    return companyOk && clinicOk && notDeleted;
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [patRes, aptRes, invRes] = await Promise.all([
          api.get('/patients', { params: { clinic_id: clinicId || undefined, company_id: companyId || undefined } }),
          api.get('/appointments', { params: { clinic_id: clinicId || undefined, company_id: companyId || undefined } }),
          api.get('/invoices', { params: { company_id: companyId || undefined } }).catch(() => ({ data: [] }))
        ]);
        setPatients(toArray(patRes));
        setAppointments(filterAppointments(toArray(aptRes)));
        setInvoices(filterInvoices(toArray(invRes)));
      } catch (error) {
        console.error('Error cargando dashboard:', error);
        setPatients([]);
        setAppointments([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [clinicId, companyId]);

  const normalizeEstado = (estado, pagoStatus) => {
    if (pagoStatus === 'Pagado') return 'Completada';
    return estado === 'Completada' ? 'Completada' : 'Pendiente';
  };

  const filterInvoices = (list) => list.filter(inv => {
    const companyOk = !companyId || Number(inv.id_empresa) === Number(companyId);
    const clinicMatch = inv.id_clinica ?? inv.patient?.id_clinica ?? inv.patient?.clinic_id;
    const clinicOk = !clinicId || Number(clinicMatch) === Number(clinicId);
    return companyOk && clinicOk;
  });

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const inSevenDays = addDays(now, 7);
    return appointments
      .filter(a => {
        const d = parseISO(a.fecha || '');
        return isWithinInterval(d, { start: now, end: inSevenDays });
      })
      .map(a => ({ ...a, estado: normalizeEstado(a.estado, a.pago_status) }))
      .filter(a => a.estado === 'Pendiente')
      .sort((a, b) => {
        const dA = parseISO(`${a.fecha}T${a.hora || '00:00'}`);
        const dB = parseISO(`${b.fecha}T${b.hora || '00:00'}`);
        return dA - dB;
      });
  }, [appointments]);

  const revenue = useMemo(() => invoices.reduce((acc, inv) => acc + Number(inv.importe_total || inv.total || 0), 0), [invoices]);
  const pendingCount = useMemo(() => appointments.filter(a => normalizeEstado(a.estado, a.pago_status) === 'Pendiente').length, [appointments]);

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h2 className="page-heading">Panel principal</h2>
          <p className="page-subheading">Datos reales de la clínica seleccionada</p>
          <div className="clinic-chip">
            <MapPin size={14} />
            <span>{clinicName}</span>
          </div>
        </div>
        <div className="header-actions">
          <Button variant="outline" icon={<Clock size={16} />} onClick={() => window.location.href = '/appointments/history'}>
            Histórico citas
          </Button>
          <Button variant="primary" icon={<Calendar size={16} />} onClick={() => window.location.href = '/appointments'}>
            Calendario
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total pacientes" value={patients.length} icon={Users} color="blue" />
        <StatCard title="Citas próximas (7 días)" value={upcomingAppointments.length} icon={Calendar} color="purple" />
        <StatCard title="Ingresos (facturas)" value={`${revenue.toFixed(2)} €`} icon={DollarSign} color="green" />
        <StatCard title="Citas pendientes" value={pendingCount} icon={CheckCircle} color="orange" />
      </div>

      <div className="dashboard-content-grid">
        <div className="dashboard-main-col full-width">
          <Card
            title="Próximas citas (7 días)"
            subtitle="Agenda filtrada por clínica actual"
            className="h-full wide-card"
            footer={
              <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />} onClick={() => window.location.href = '/appointments'}>
                Ver agenda completa
              </Button>
            }
          >
            <div className="appointments-list">
              {loading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : upcomingAppointments.length === 0 ? (
                <p className="text-gray-500">No hay citas próximas.</p>
              ) : upcomingAppointments.map((apt, idx) => {
                const start = parseISO(`${apt.fecha}T${apt.hora || '00:00'}`);
                const end = addMinutes(start, Number(apt.duracion_minutos || 30));
                const timeLabel = `${format(start, 'dd/MM')} · ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
                return (
                  <AppointmentItem
                    key={idx}
                    time={timeLabel}
                    patient={apt.patient?.nombre || 'Paciente'}
                    type={apt.motivo || 'Sin motivo'}
                    status={normalizeEstado(apt.estado, apt.pago_status)}
                  />
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
