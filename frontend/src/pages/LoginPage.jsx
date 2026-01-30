import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import './LoginPage.css';

const schema = yup.object({
    email: yup.string().email('Correo electrónico inválido').required('El correo electrónico es requerido'),
    password: yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es requerida')
});

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors }, setError } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        try {
            await login(data.email, data.password);
            navigate('/');
        } catch (error) {
            setError('root', {
                message: error.response?.data?.error || 'Credenciales incorrectas'
            });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-branding">
                    <h1>DentalMate</h1>
                    <p>Sistema profesional de gestión clínica dental</p>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-box">
                    <div className="auth-header">
                        <h2>Iniciar sesión</h2>
                        <p>Accede a tu cuenta profesional</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
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

                        {errors.root && (
                            <div className="alert-error">
                                {errors.root.message}
                            </div>
                        )}

                        <button type="submit" className="btn-submit">
                            Iniciar sesión
                        </button>

                        <div className="auth-footer">
                            <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
