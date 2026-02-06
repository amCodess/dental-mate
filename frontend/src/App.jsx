import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import BillingPage from './pages/BillingPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import ClinicDetailsPage from './pages/ClinicDetailsPage';
import AdminsPage from './pages/AdminsPage';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    if (!user) return <Navigate to="/login" />;

    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="patients" element={<PatientsPage />} />
                        <Route path="appointments" element={<AppointmentsPage />} />
                        <Route path="billing" element={<BillingPage />} />

                        {/* Administration Routes */}
                        <Route path="companies" element={<CompaniesPage />} />
                        <Route path="companies/:id" element={<CompanyDetailsPage />} />
                        <Route path="clinics/:id" element={<ClinicDetailsPage />} />
                        <Route path="admins" element={<AdminsPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
