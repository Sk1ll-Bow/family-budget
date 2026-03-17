import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { toast } from 'sonner';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Registration page with glassmorphism styling.
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const { register: authRegister, loading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const { error } = await authRegister(data.email, data.password, data.displayName);
    console.log('Registration attempt finished', { success: !error, error });
    if (error) {
      toast.error(error);
    } else {
      toast.success('Код подтверждения отправлен на ваш email');
      const targetUrl = `/verify-otp?email=${encodeURIComponent(data.email)}`;
      console.log('Navigating to:', targetUrl);
      navigate(targetUrl);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative">
      <div className="ambient-glow w-full h-full" />

      <div className="glass-card p-8 w-full max-w-md animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-secondary/15 mb-4">
            <UserPlus className="w-8 h-8 text-brand-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100">Регистрация</h1>
          <p className="text-surface-400 text-sm mt-1">
            Создайте аккаунт для семейного бюджета
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Display Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-surface-300 mb-1.5">
                Имя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="reg-name"
                  type="text"
                  className={cn(
                    'glass-input w-full pl-10 pr-4 py-3 text-sm focus-ring',
                    errors.displayName && 'border-danger'
                  )}
                  placeholder="Ваше имя"
                  {...register('displayName')}
                />
              </div>
              {errors.displayName && (
                <p className="text-danger text-xs mt-1">{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-surface-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="reg-email"
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
              <label htmlFor="reg-password" className="block text-sm font-medium text-surface-300 mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-surface-300 mb-1.5">
                Повторите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  className={cn(
                    'glass-input w-full pl-10 pr-4 py-3 text-sm focus-ring',
                    errors.confirmPassword && 'border-danger'
                  )}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>
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
                  <UserPlus className="w-5 h-5" />
                  Создать аккаунт
                </>
              )}
            </button>
          </form>

        <p className="text-center text-sm text-surface-400 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-brand-primary hover:text-brand-primary-light transition-colors cursor-pointer">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
