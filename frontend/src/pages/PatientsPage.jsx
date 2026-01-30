import { useState, useEffect } from 'react';
import api from '../services/api';

const PatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/patients')
            .then(response => {
                setPatients(response.data.data || response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading patients:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Cargando pacientes...</div>;

    return (
        <div>
            <h1>Pacientes</h1>
            <p>Total: {patients.length} pacientes registrados</p>
            
            <table style={{ width: '100%', marginTop: '2rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '1rem' }}>ID</th>
                        <th style={{ padding: '1rem' }}>Teléfono</th>
                        <th style={{ padding: '1rem' }}>Fecha Nacimiento</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(patient => (
                        <tr key={patient.id_paciente} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem' }}>{patient.id_paciente}</td>
                            <td style={{ padding: '1rem' }}>{patient.telefono || 'N/A'}</td>
                            <td style={{ padding: '1rem' }}>{patient.fecha_nacimiento || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PatientsPage;
