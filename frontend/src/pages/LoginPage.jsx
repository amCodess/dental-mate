import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import './LoginPage.css';

const loginSchema = yup.object().shape({
    email: yup.string().email('Introduce un email válido').required('El email es obligatorio'),
    password: yup.string().required('La contraseña es obligatoria'),
});

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setServerError('');
        try {
            await login(data.email, data.password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            if (error.response?.status === 401) {
                setServerError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
            } else {
                setServerError('Ocurrió un error al iniciar sesión. Inténtalo más tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left Side - Branding */}
                <div className="login-brand-section">
                    <div className="brand-content">
                        <div className="brand-logo-wrapper">
                            <span className="brand-logo-text">DM</span>
                        </div>
                        <h1 className="brand-title">DentalMate</h1>
                        <p className="brand-subtitle">
                            Gestión integral para clínicas dentales modernas.
                        </p>
                        <div className="brand-features">
                            <div className="feature-item">
                                <span className="feature-dot"></span>
                                Gestión de pacientes simplificada
                            </div>
                            <div className="feature-item">
                                <span className="feature-dot"></span>
                                Agenda inteligente
                            </div>
                            <div className="feature-item">
                                <span className="feature-dot"></span>
                                Facturación automatizada
                            </div>
                        </div>
                    </div>
                    <div className="brand-pattern"></div>
                </div>

                {/* Right Side - Form */}
                <div className="login-form-section">
                    <div className="login-form-wrapper">
                        <div className="form-header">
                            <h2 className="form-title">Bienvenido de nuevo</h2>
                            <p className="form-subtitle">Ingresa tus credenciales para acceder</p>
                        </div>

                        {serverError && (
                            <div className="login-error-alert">
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                            <Input
                                label="Correo electrónico"
                                type="email"
                                placeholder="nombre@clinica.com"
                                icon={<Mail size={18} />}
                                fullWidth
                                error={errors.email?.message}
                                {...register('email')}
                            />

                            <div className="password-group">
                                <Input
                                    label="Contraseña"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={<Lock size={18} />}
                                    fullWidth
                                    error={errors.password?.message}
                                    {...register('password')}
                                />
                                <div className="forgot-password">
                                    <a href="#">¿Olvidaste tu contraseña?</a>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={loading}
                                icon={<LogIn size={20} />}
                            >
                                Iniciar sesión
                            </Button>
                        </form>

                        <div className="form-footer">
                            <p>¿No tienes una cuenta? <span className="contact-support">Contacta a soporte</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
