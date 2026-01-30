import { useState, useEffect } from 'react';
import api from '../services/api';

const BillingPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/invoices')
            .then(response => {
                setInvoices(response.data.data || response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading invoices:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Cargando facturas...</div>;

    return (
        <div>
            <h1>Facturación</h1>
            <p>Total: {invoices.length} facturas emitidas</p>

            <table style={{ width: '100%', marginTop: '2rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '1rem' }}>ID Factura</th>
                        <th style={{ padding: '1rem' }}>Fecha Emisión</th>
                        <th style={{ padding: '1rem' }}>Importe Total</th>
                        <th style={{ padding: '1rem' }}>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map(invoice => (
                        <tr key={invoice.id_factura} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem' }}>{invoice.id_factura}</td>
                            <td style={{ padding: '1rem' }}>{invoice.fecha_emision}</td>
                            <td style={{ padding: '1rem' }}>€{invoice.importe_total}</td>
                            <td style={{ padding: '1rem' }}>{invoice.pago_status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BillingPage;
