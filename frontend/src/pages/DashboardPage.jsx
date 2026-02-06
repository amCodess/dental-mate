import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, CheckCircle, ArrowUp, ArrowRight, Clock } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import api from '../services/api';
import './DashboardPage.css';

const StatCard = ({ title, value, trend, icon: Icon, color, trendValue }) => (
    <Card className="stat-card" padding="lg">
        <div className="stat-header">
            <div className={`stat-icon-wrapper color-${color}`}>
                <Icon size={24} />
            </div>
            {trend && (
                <div className="stat-trend positive">
                    <ArrowUp size={14} />
                    {trendValue}
                </div>
            )}
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
            <Badge variant={status === 'confirmed' ? 'success' : 'warning'} dot>
                {status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
            </Badge>
        </div>
    </div>
);

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        patients: 0,
        appointmentsToday: 0,
        revenue: 0,
        pending: 0
    });

    // Simulation of data fetching
    useEffect(() => {
        const loadData = async () => {
            // In a real scenario, we would fetch from APIs
            // await Promise.all([api.get('/stats'), ...])

            // Simulating loading
            setTimeout(() => {
                setStats({
                    patients: 1248,
                    appointmentsToday: 8,
                    revenue: '12.4k',
                    pending: 3
                });
                setLoading(false);
            }, 800);
        };

        loadData();
    }, []);

    return (
        <div className="dashboard-page animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h2 className="page-heading">Panel principal</h2>
                    <p className="page-subheading">Resumen de actividad de hoy, 14 Octubre</p>
                </div>
                <div className="header-actions">
                    <Button variant="outline" icon={<Clock size={16} />}>
                        Historial
                    </Button>
                    <Button variant="primary" icon={<Calendar size={16} />}>
                        Nueva cita
                    </Button>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Total pacientes"
                    value={stats.patients}
                    icon={Users}
                    color="blue"
                    trend
                    trendValue="+12%"
                />
                <StatCard
                    title="Citas hoy"
                    value={stats.appointmentsToday}
                    icon={Calendar}
                    color="purple"
                    trend
                    trendValue="+2"
                />
                <StatCard
                    title="Ingresos mes"
                    value={`$${stats.revenue}`}
                    icon={DollarSign}
                    color="green"
                    trend
                    trendValue="+8.4%"
                />
                <StatCard
                    title="Tareas pendientes"
                    value={stats.pending}
                    icon={CheckCircle}
                    color="orange"
                />
            </div>

            <div className="dashboard-content-grid">
                <div className="dashboard-main-col">
                    <Card
                        title="Próximas citas"
                        subtitle="Agenda para el día de hoy"
                        className="h-full"
                        footer={
                            <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />}>
                                Ver agenda completa
                            </Button>
                        }
                    >
                        <div className="appointments-list">
                            <AppointmentItem
                                time="09:00 AM"
                                patient="María García"
                                type="Limpieza General"
                                status="confirmed"
                            />
                            <AppointmentItem
                                time="10:30 AM"
                                patient="Carlos Rodríguez"
                                type="Ortodoncia Revisión"
                                status="pending"
                            />
                            <AppointmentItem
                                time="11:45 AM"
                                patient="Ana Martínez"
                                type="Extracción"
                                status="confirmed"
                            />
                            <AppointmentItem
                                time="03:15 PM"
                                patient="Luis Sánchez"
                                type="Blanqueamiento"
                                status="confirmed"
                            />
                        </div>
                    </Card>
                </div>

                <div className="dashboard-side-col">
                    <Card title="Acciones rápidas" className="mb-6">
                        <div className="quick-actions-grid">
                            <button className="quick-action-btn">
                                <div className="qa-icon"><Users size={20} /></div>
                                <span>Registrar paciente</span>
                            </button>
                            <button className="quick-action-btn">
                                <div className="qa-icon"><DollarSign size={20} /></div>
                                <span>Generar factura</span>
                            </button>
                        </div>
                    </Card>

                    <Card title="Rendimiento semanal">
                        <div className="chart-placeholder">
                            <div className="bar" style={{ height: '40%' }}></div>
                            <div className="bar" style={{ height: '60%' }}></div>
                            <div className="bar" style={{ height: '35%' }}></div>
                            <div className="bar active" style={{ height: '85%' }}></div>
                            <div className="bar" style={{ height: '55%' }}></div>
                            <div className="bar" style={{ height: '70%' }}></div>
                            <div className="bar" style={{ height: '45%' }}></div>
                        </div>
                        <div className="chart-labels">
                            <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
