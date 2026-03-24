import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { useEffect } from 'react';

const otpSchema = z.object({
  code: z.string().min(6, 'Minimum 6 digits').max(8, 'Maximum 8 digits').regex(/^\d+$/, 'Numbers only'),
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

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  if (!email) return null;

  const onOtpSubmit = async (data: OtpFormData) => {
    const { error } = await verifyOtp(email, data.code);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Account verified! You can now sign in.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 relative">
      <div className="ambient-bg" />
      <div className="spotlight" />

      <div className="glass p-10 w-full max-w-md rounded-[40px] shadow-modal border border-white/5 relative z-10 animate-scale-in">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-brand-primary/10 mb-8 shadow-glow relative group transition-transform hover:scale-110 duration-500">
            <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <KeyRound className="w-12 h-12 text-brand-primary relative z-10" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">Verification</h1>
          <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] mt-3 max-w-[240px] mx-auto leading-relaxed">
            We've sent a code to <span className="text-white">{email}</span>
          </p>
        </div>

        <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-6">
          <div className="space-y-4">
            <label htmlFor="opt-code" className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1 block text-center">
              Enter Secret Code
            </label>
            <div className="relative group">
              <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-600 group-focus-within:text-brand-primary transition-colors" />
              <input
                id="opt-code"
                type="text"
                maxLength={8}
                autoComplete="one-time-code"
                className={cn(
                  'bg-surface-900/40 w-full pl-14 pr-6 py-6 rounded-3xl text-center tracking-[0.5em] text-2xl font-black border border-white/5 outline-none focus:border-brand-primary/50 transition-all placeholder:text-surface-800',
                  otpErrors.code && 'border-danger/50 bg-danger/5'
                )}
                placeholder="000000"
                {...registerOtp('code')}
              />
            </div>
            {otpErrors.code && (
              <p className="text-danger text-[10px] font-black uppercase tracking-widest text-center">{otpErrors.code.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 rounded-[24px] bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-glow flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 mt-12 group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Verify Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full py-4 text-[10px] font-black uppercase tracking-[0.4em] text-surface-600 hover:text-white transition-colors mt-6"
            disabled={loading}
          >
            Change Email
          </button>
        </form>
      </div>
    </div>
  );
}

