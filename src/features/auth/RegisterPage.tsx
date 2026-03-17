import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { useState } from 'react';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

const otpSchema = z.object({
  code: z.string().length(6, 'Код должен состоять из 6 цифр').regex(/^\d+$/, 'Только цифры'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

/**
 * Registration page with glassmorphism styling.
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const { register: authRegister, verifyOtp, loading } = useAuthStore();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const { error } = await authRegister(data.email, data.password, data.displayName);
    if (error) {
      toast.error(error);
    } else {
      setRegisteredEmail(data.email);
      setStep('otp');
      toast.success('Код подтверждения отправлен на ваш email');
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    const { error } = await verifyOtp(registeredEmail, data.code);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Аккаунт успешно подтвержден! Вы можете войти.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative">
      <div className="ambient-glow w-full h-full" />

      <div className="glass-card p-8 w-full max-w-md animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-secondary/15 mb-4">
            {step === 'form' ? (
              <UserPlus className="w-8 h-8 text-brand-secondary" />
            ) : (
              <KeyRound className="w-8 h-8 text-brand-secondary" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-surface-100">
            {step === 'form' ? 'Регистрация' : 'Подтверждение Email'}
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {step === 'form' 
              ? 'Создайте аккаунт для семейного бюджета' 
              : `Введите 6-значный код, отправленный на ${registeredEmail}`}
          </p>
        </div>

        {step === 'form' ? (
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
        ) : (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
            <div>
              <label htmlFor="opt-code" className="block text-sm font-medium text-surface-300 mb-1.5">
                Код из Email
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="opt-code"
                  type="text"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className={cn(
                    'glass-input w-full pl-10 pr-4 py-3 text-center tracking-widest text-lg focus-ring',
                    otpErrors.code && 'border-danger'
                  )}
                  placeholder="123456"
                  {...registerOtp('code')}
                />
              </div>
              {otpErrors.code && (
                <p className="text-danger text-xs mt-1 text-center">{otpErrors.code.message}</p>
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
                  Подтвердить
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('form')}
              className="btn btn-ghost w-full mt-4"
              disabled={loading}
            >
              Изменить email
            </button>
          </form>
        )}

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
