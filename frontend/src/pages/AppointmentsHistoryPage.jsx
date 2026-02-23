import { useEffect, useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { getStoredSelection } from '../utils/clinicSelection';
import { Button, Card, Badge } from '../components/ui';
import { ArrowLeft } from 'lucide-react';
import './AppointmentsPage.css';

const AppointmentsHistoryPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const storedSelection = getStoredSelection();
  const clinicId = storedSelection.clinicId ? Number(storedSelection.clinicId) : null;
  const companyId = Number(storedSelection.companyId || 1);
  const patientFilter = searchParams.get('patientId') ? Number(searchParams.get('patientId')) : null;

  const [appointments, setAppointments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  };

  const filterByScope = (list) => {
    return list.filter(apt =>
      (!companyId || Number(apt.id_empresa) === Number(companyId)) &&
      (!clinicId || Number(apt.id_clinica) === Number(clinicId)) &&
      (
        !clinicId
          ? true
          : (apt.patient ? Number(apt.patient.id_clinica || apt.patient.clinic_id) === Number(clinicId) : false)
      )
    );
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments', {
        params: {
          clinic_id: clinicId || undefined,
          company_id: companyId || undefined,
          include_deleted: true
        }
      });
      const scoped = filterByScope(toArray(response)).map(apt => ({
        ...apt,
        invoice: apt.invoice || null,
        pago_status: apt.pago_status ?? apt.invoice?.pago_status ?? null
      }));
      const filteredByPatient = patientFilter
        ? scoped.filter(apt => Number(apt.id_paciente || apt.patient?.id_paciente) === Number(patientFilter))
        : scoped;
      setAppointments(filteredByPatient);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatments = async () => {
    try {
      const response = await api.get('/treatments', { params: { company_id: companyId || undefined, clinic_id: clinicId || undefined } });
      setTreatments(toArray(response));
    } catch (error) {
      console.error('Error fetching treatments:', error);
      setTreatments([]);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);
  useEffect(() => { fetchTreatments(); }, []);

  const sorted = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aDate = parseISO(`${a.fecha}T${a.hora}`);
      const bDate = parseISO(`${b.fecha}T${b.hora}`);
      return aDate - bDate; // más antiguas arriba
    });
  }, [appointments]);

  const normalizeEstado = (estado) => {
    if (estado === 'Completada') return 'Completada';
    return 'Pendiente';
  };

  const getStatusColor = (estado) => {
    switch (normalizeEstado(estado)) {
      case 'Pendiente': return 'warning';
      case 'Completada': return 'success';
      default: return 'neutral';
    }
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case 'Pagado': return 'success';
      case 'Parcial': return 'info';
      default: return 'warning';
    }
  };

  return (
    <div className="appointments-history-page animate-fade-in">
      <div className="page-header">
        <div className="header-left">
          <Button variant="ghost" onClick={() => window.history.back()} icon={<ArrowLeft size={16} />}>
            Volver
          </Button>
          <div className="header-titles">
            <h2 className="page-heading">Histórico de citas</h2>
            <p className="page-subheading">Listado completo de todas las citas</p>
          </div>
        </div>
        <div className="header-controls">
          <Button variant="outline" size="sm" onClick={fetchAppointments}>Actualizar</Button>
        </div>
      </div>

      <Card className="history-card">
        {loading ? (
          <div className="loading-state">Cargando historial...</div>
        ) : (
          <div className="history-table">
            <div className="history-row history-head">
              <span>#ID</span>
              <span>Fecha</span>
              <span>Hora</span>
              <span>Paciente</span>
              <span>Motivo</span>
              <span>Estado</span>
              <span>Pago</span>
              <span>Importe total</span>
              <span>Pagado</span>
              <span>Duración</span>
            </div>
            {sorted.map((apt, idx) => {
              const aptId = apt.id_cita || apt.id || '-';

              const importeTotal = (() => {
                // Preferencia: precio de cita o tratamiento; la factura puede ser parcial
                if (apt.precio) return Number(apt.precio);
                if (apt.tratamiento?.precio) return Number(apt.tratamiento.precio);
                if (apt.id_tratamiento) {
                  const t = treatments.find(tr => String(tr.id_tratamiento || tr.id) === String(apt.id_tratamiento));
                  if (t?.precio) return Number(t.precio);
                }
                if (apt.motivo) {
                  const t = treatments.find(tr => (tr.nombre_tratamiento || tr.nombre || '').toLowerCase() === apt.motivo.toLowerCase());
                  if (t?.precio) return Number(t.precio);
                }
                if (apt.invoice?.importe_total) return Number(apt.invoice.importe_total);
                return 0;
              })();

              const pagado = (() => {
                if (
                  apt.invoice?.importe_total &&
                  (apt.pago_status === 'Pagado' || apt.invoice?.pago_status === 'Pagado' || apt.pago_status === 'Parcial' || apt.invoice?.pago_status === 'Parcial')
                ) {
                  return Number(apt.invoice.importe_total);
                }
                if (apt.pago_status === 'Pagado') return importeTotal;
                return 0;
              })();

              const estadoMostrar = apt.deleted_at
                ? 'Eliminada'
                : (apt.pago_status === 'Pagado' ? 'Completada' : normalizeEstado(apt.estado));

              return (
                <div key={idx} className="history-row">
                  <span>{aptId !== '-' ? `#${aptId}` : '-'}</span>
                  <span>{format(parseISO(apt.fecha), 'dd/MM/yyyy', { locale: es })}</span>
                  <span>{(apt.hora || '').substring(0, 5)}</span>
                  <span>{apt.patient?.nombre || 'Paciente'} {apt.patient?.apellido || ''}</span>
                  <span>{apt.motivo || 'Sin motivo'}</span>
                  <span>
                    <Badge variant={getStatusColor(estadoMostrar)}>
                      {estadoMostrar}
                    </Badge>
                  </span>
                  <span>
                    <Badge variant={getPaymentColor(apt.pago_status || 'Pendiente')}>
                      {apt.pago_status || 'Pendiente'}
                    </Badge>
                  </span>
                  <span>{`${importeTotal.toFixed(2)} €`}</span>
                  <span>{`${pagado.toFixed(2)} €`}</span>
                  <span>{apt.duracion_minutos || 0} min</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AppointmentsHistoryPage;



