import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DollarSign, FileText, Download, Plus, Search, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button, Card, Badge, Modal, Input, LoadingSpinner, EmptyState } from '../components/ui';
import './BillingPage.css';

const BillingPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const clinicIdParam = searchParams.get('clinicId');
    const clinicId = clinicIdParam ? Number(clinicIdParam) : null;
    const companyId = Number(searchParams.get('companyId') || 1);

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            id_empresa: companyId,
            tipo_pago: 'Efectivo',
            pago_status: 'Pendiente'
        }
    });

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/invoices', { params: { clinic_id: clinicId || undefined, company_id: companyId || undefined } });
            setInvoices(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients', { params: { clinic_id: clinicId || undefined, company_id: companyId || undefined } });
            setPatients(response.data.data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchPatients();
    }, []);

    const handleDownloadPdf = async (id) => {
        try {
            // In a real scenario, this would trigger a browser download
            // For now, we just call the API which returns a stream/blob
            window.open(`${import.meta.env.VITE_API_URL}/invoices/${id}/pdf`, '_blank');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Error al descargar factura');
        }
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                id_empresa: companyId,
                id_clinica: clinicId || undefined,
                id_paciente: parseInt(data.id_paciente),
                importe_total: parseFloat(data.importe_total)
            };
            await api.post('/invoices', payload);
            setModalOpen(false);
            fetchInvoices();
            reset({ id_empresa: companyId, tipo_pago: 'Efectivo', pago_status: 'Pendiente' });
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Error al crear factura: ' + (error.response?.data?.message || 'Verifique los datos'));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pagado': return <Badge variant="success" dot={false}>Pagado</Badge>;
            case 'Pendiente': return <Badge variant="warning" dot>Pendiente</Badge>;
            case 'Parcial': return <Badge variant="info" dot>Parcial</Badge>;
            default: return <Badge variant="neutral">{status}</Badge>;
        }
    };

    // Calculate simple stats from loaded invoices (client-side for MVP)
    const totalRevenue = invoices.reduce((acc, curr) => acc + parseFloat(curr.importe_total), 0);
    const pendingInvoices = invoices.filter(i => i.pago_status === 'Pendiente').length;

    return (
        <div className="billing-page animate-fade-in">
            <div className="page-header">
                <div className="header-left">
                    <Button variant="ghost" onClick={() => window.history.back()} icon={<ArrowLeft size={16} />}>
                        Volver
                    </Button>
                    <div className="header-titles">
                        <h2 className="page-heading">Facturación</h2>
                        <p className="page-subheading">Control de ingresos y facturas emitidas</p>
                    </div>
                </div>
                <Button onClick={() => setModalOpen(true)} icon={<Plus size={18} />}>
                    Nueva factura
                </Button>
            </div>

            <div className="billing-stats-grid">
                <Card padding="lg" className="stat-card-billing">
                    <div className="stat-billing-icon bg-green-100 text-green-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="stat-label">Ingresos totales</p>
                        <p className="stat-value">€{totalRevenue.toLocaleString()}</p>
                    </div>
                </Card>
                <Card padding="lg" className="stat-card-billing">
                    <div className="stat-billing-icon bg-orange-100 text-orange-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="stat-label">Facturas pendientes</p>
                        <p className="stat-value">{pendingInvoices}</p>
                    </div>
                </Card>
                <Card padding="lg" className="stat-card-billing">
                    <div className="stat-billing-icon bg-blue-100 text-blue-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="stat-label">Total facturas</p>
                        <p className="stat-value">{invoices.length}</p>
                    </div>
                </Card>
            </div>

            <Card padding="none" className="invoices-table-card">
                {loading ? (
                    <div className="py-12">
                        <LoadingSpinner text="Cargando facturas..." />
                    </div>
                ) : invoices.length > 0 ? (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Paciente</th>
                                    <th>Fecha</th>
                                    <th>Método</th>
                                    <th>Importe</th>
                                    <th>Estado</th>
                                    <th className="text-center" style={{ width: '1%', whiteSpace: 'nowrap' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.id_factura}>
                                        <td className="font-mono text-gray-500">#{invoice.id_factura.toString().padStart(6, '0')}</td>
                                        <td>
                                            <div className="font-medium">
                                                {invoice.patient ? `${invoice.patient.nombre} ${invoice.patient.apellido}` : 'Cliente General'}
                                            </div>
                                        </td>
                                        <td>{invoice.fecha_emision}</td>
                                        <td>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <CreditCard size={14} />
                                                {invoice.tipo_pago}
                                            </div>
                                        </td>
                                        <td className="font-bold text-gray-900">€{invoice.importe_total}</td>
                                        <td>{getStatusBadge(invoice.pago_status)}</td>
                                        <td className="text-center">
                                            <div className="actions-center">
                                                <Button variant="ghost" size="sm" icon={<Download size={16} />} onClick={() => handleDownloadPdf(invoice.id_factura)}>
                                                    PDF
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        icon={FileText}
                        title="No hay facturas"
                        description="Comienza creando una nueva factura para registrar ingresos."
                        actionLabel="Crear factura"
                        onAction={() => setModalOpen(true)}
                    />
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva factura"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit(onSubmit)}>Emitir factura</Button>
                    </>
                }
            >
                <form className="billing-form">
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
                            label="Fecha de emisión"
                            fullWidth
                            {...register('fecha_emision', { required: true })}
                        />
                        <div className="input-container full-width">
                            <label className="input-label">Método de pago</label>
                            <div className="select-wrapper">
                                <select className="select-field" {...register('tipo_pago')}>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                    <option value="Transferencia">Transferencia</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <Input
                        type="number"
                        label="Importe total (€)"
                        placeholder="0.00"
                        step="0.01"
                        fullWidth
                        {...register('importe_total', { required: true })}
                    />

                    <div className="input-container">
                        <label className="input-label">Estado de pago</label>
                        <div className="select-wrapper">
                            <select className="select-field" {...register('pago_status')}>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagado">Pagado</option>
                                <option value="Parcial">Parcial</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BillingPage;
