import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { toast } from 'sonner';

const otpSchema = z.object({
  code: z.string().length(6, 'Код должен состоять из 6 цифр').regex(/^\d+$/, 'Только цифры'),
});

type OtpFormData = z.infer<typeof otpSchema>;

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const { verifyOtp, loading } = useAuthStore();

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Если email не передан, отправляем обратно на регистрацию
  if (!email) {
    navigate('/register', { replace: true });
    return null;
  }

  const onOtpSubmit = async (data: OtpFormData) => {
    const { error } = await verifyOtp(email, data.code);
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
            <KeyRound className="w-8 h-8 text-brand-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100">
            Подтверждение Email
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Введите 6-значный код, отправленный на {email}
          </p>
        </div>

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
            onClick={() => navigate('/register')}
            className="btn btn-ghost w-full mt-4"
            disabled={loading}
          >
            Изменить email
          </button>
        </form>
      </div>
    </div>
  );
}
