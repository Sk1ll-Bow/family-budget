import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login page with glassmorphism styling.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await login(data.email, data.password);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Добро пожаловать!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative">
      {/* Ambient glow background */}
      <div className="ambient-glow w-full h-full" />

      <div className="glass-card p-8 w-full max-w-md animate-scale-in relative z-10">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/15 mb-4">
            <LogIn className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100">Вход в аккаунт</h1>
          <p className="text-surface-400 text-sm mt-1">
            Управляйте семейным бюджетом вместе
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-surface-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={cn(
                  'glass-input w-full pl-10 pr-4 py-3 text-sm focus-ring',
                  errors.email && 'border-danger'
                )}
                placeholder="you@example.com"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-surface-300 mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className={cn(
                  'glass-input w-full pl-10 pr-4 py-3 text-sm focus-ring',
                  errors.password && 'border-danger'
                )}
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-danger text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full mt-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Войти
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-surface-400 mt-6">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-brand-primary hover:text-brand-primary-light transition-colors cursor-pointer">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
