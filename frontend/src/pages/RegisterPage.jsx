import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Input, Button } from '../components/ui';
import './LoginPage.css';

const schema = yup.object({
    name: yup.string().required('El nombre es requerido'),
    email: yup.string().email('Correo electrónico inválido').required('El correo electrónico es requerido'),
    password: yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es requerida'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
        .required('Confirma tu contraseña')
});

const RegisterPage = () => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    
    const { register, handleSubmit, formState: { errors }, setError } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await registerUser(data.name, data.email, data.password);
            navigate('/');
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data) {
                const serverErrors = error.response.data;
                let hasFieldErrors = false;

                Object.keys(serverErrors).forEach((key) => {
                    if (['name', 'email', 'password'].includes(key)) {
                        setError(key, {
                            type: 'server',
                            message: Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key]
                        });
                        hasFieldErrors = true;
                    }
                });

                if (hasFieldErrors) {
                    setIsLoading(false);
                    return;
                }
            }

            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error al crear la cuenta. Inténtalo de nuevo.';
            setError('root', { message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-brand-section">
                <div className="brand-pattern" />
                <div className="brand-content">
                    <div className="brand-logo-wrapper">
                        <span className="brand-logo-text">DM</span>
                    </div>
                    <h1 className="brand-title">Únete a DentalMate.</h1>
                    <p className="brand-subtitle">La plataforma integral para clínicas dentales modernas.</p>
                    
                    <div className="brand-features">
                        <div className="feature-item">
                            <div className="feature-dot" />
                            <span>Gestión de pacientes simplificada</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-dot" />
                            <span>Agenda inteligente</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-dot" />
                            <span>Facturación automatizada</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-form-section">
                <div className="login-form-wrapper animate-fade-in">
                    <div className="form-header">
                        <h2 className="form-title">Crear cuenta</h2>
                        <p className="form-subtitle">Empieza tu prueba gratuita de 30 días</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                        <Input
                            label="Nombre completo"
                            placeholder="Dr. Juan Pérez"
                            icon={<User size={18} />}
                            error={errors.name?.message}
                            fullWidth
                            {...register('name')}
                        />

                        <Input
                            label="Correo electrónico"
                            placeholder="doctor@clinica.com"
                            icon={<Mail size={18} />}
                            error={errors.email?.message}
                            fullWidth
                            {...register('email')}
                        />

                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            icon={<Lock size={18} />}
                            error={errors.password?.message}
                            fullWidth
                            {...register('password')}
                        />

                        <Input
                            label="Confirmar contraseña"
                            type="password"
                            placeholder="••••••••"
                            icon={<CheckCircle size={18} />}
                            error={errors.confirmPassword?.message}
                            fullWidth
                            {...register('confirmPassword')}
                        />

                        {errors.root && (
                            <div className="login-error-alert">
                                <span>{errors.root.message}</span>
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            variant="primary" 
                            size="lg" 
                            fullWidth 
                            loading={isLoading}
                            className="mt-4"
                        >
                            Registrarse
                        </Button>

                        <div className="form-footer">
                            <p>¿Ya tienes una cuenta? <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Inicia sesión</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
