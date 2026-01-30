import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register, handleSubmit, formState: { errors }, setError } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        try {
            await registerUser(data.name, data.email, data.password);
            navigate('/');
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data) {
                // Manejar errores de validación de campos específicos
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

                if (hasFieldErrors) return;
            }

            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error al crear la cuenta. Inténtalo de nuevo.';
            setError('root', { message: errorMessage });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-branding">
                    <h1>DentalMate</h1>
                    <p>Únete a la plataforma profesional de gestión clínica dental</p>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-box">
                    <div className="auth-header">
                        <h2>Crear cuenta</h2>
                        <p>Completa tus datos profesionales</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                        <div className="form-field">
                            <label htmlFor="name">Nombre completo</label>
                            <input
                                id="name"
                                type="text"
                                {...register('name')}
                                className={errors.name ? 'input-error' : ''}
                                placeholder="Dr. Juan Pérez"
                            />
                            {errors.name && <span className="field-error">{errors.name.message}</span>}
                        </div>

                        <div className="form-field">
                            <label htmlFor="email">Correo electrónico</label>
                            <input
                                id="email"
                                type="email"
                                {...register('email')}
                                className={errors.email ? 'input-error' : ''}
                                placeholder="doctor@ejemplo.com"
                            />
                            {errors.email && <span className="field-error">{errors.email.message}</span>}
                        </div>

                        <div className="form-field">
                            <label htmlFor="password">Contraseña</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    className={errors.password ? 'input-error' : ''}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Mostrar contraseña"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && <span className="field-error">{errors.password.message}</span>}
                        </div>

                        <div className="form-field">
                            <label htmlFor="confirmPassword">Confirmar contraseña</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    {...register('confirmPassword')}
                                    className={errors.confirmPassword ? 'input-error' : ''}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label="Mostrar contraseña"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
                        </div>

                        {errors.root && (
                            <div className="alert-error">
                                {errors.root.message}
                            </div>
                        )}

                        <button type="submit" className="btn-submit">
                            Crear cuenta
                        </button>

                        <div className="auth-footer">
                            <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
