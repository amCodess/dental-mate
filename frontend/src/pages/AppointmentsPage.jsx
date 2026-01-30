import { useState, useEffect } from 'react';
import api from '../services/api';

const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/appointments')
            .then(response => {
                setAppointments(response.data.data || response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading appointments:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Cargando citas...</div>;

    return (
        <div>
            <h1>Gestión de Citas</h1>
            <p>Total: {appointments.length} citas programadas</p>

            <table style={{ width: '100%', marginTop: '2rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '1rem' }}>Fecha</th>
                        <th style={{ padding: '1rem' }}>Hora</th>
                        <th style={{ padding: '1rem' }}>Estado</th>
                        <th style={{ padding: '1rem' }}>Duración</th>
                    </tr>
                </thead>
                <tbody>
                    {appointments.map(apt => (
                        <tr key={apt.id_cita} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem' }}>{apt.fecha}</td>
                            <td style={{ padding: '1rem' }}>{apt.hora}</td>
                            <td style={{ padding: '1rem' }}>{apt.estado}</td>
                            <td style={{ padding: '1rem' }}>{apt.duracion_minutos} min</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AppointmentsPage;
