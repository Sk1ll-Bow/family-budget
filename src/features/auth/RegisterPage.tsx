import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Loader2, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { toast } from 'sonner';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Minimum 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
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
    if (error) {
      toast.error(error);
    } else {
      toast.success('Verification code sent to your email');
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
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
            <UserPlus className="w-12 h-12 text-brand-primary relative z-10" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">Create Account</h1>
          <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.4em]">
            Start Your Financial Journey
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-3">
            <label htmlFor="reg-name" className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">
              Full Name
            </label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-600 group-focus-within:text-brand-primary transition-colors" />
              <input
                id="reg-name"
                type="text"
                className={cn(
                  'bg-surface-900/40 w-full pl-14 pr-6 py-4 rounded-2xl text-sm font-bold border border-white/5 outline-none focus:border-brand-primary/50 transition-all placeholder:text-surface-700',
                  errors.displayName && 'border-danger/50 bg-danger/5'
                )}
                placeholder="How should we call you?"
                {...register('displayName')}
              />
            </div>
            {errors.displayName && (
              <p className="text-danger text-[10px] font-black uppercase tracking-widest px-1">{errors.displayName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-3">
            <label htmlFor="reg-email" className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-600 group-focus-within:text-brand-primary transition-colors" />
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className={cn(
                  'bg-surface-900/40 w-full pl-14 pr-6 py-4 rounded-2xl text-sm font-bold border border-white/5 outline-none focus:border-brand-primary/50 transition-all placeholder:text-surface-700',
                  errors.email && 'border-danger/50 bg-danger/5'
                )}
                placeholder="you@example.com"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-danger text-[10px] font-black uppercase tracking-widest px-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-3">
            <label htmlFor="reg-password" className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">
              Secure Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-600 group-focus-within:text-brand-primary transition-colors" />
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                className={cn(
                  'bg-surface-900/40 w-full pl-14 pr-6 py-4 rounded-2xl text-sm font-bold border border-white/5 outline-none focus:border-brand-primary/50 transition-all placeholder:text-surface-700',
                  errors.password && 'border-danger/50 bg-danger/5'
                )}
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-danger text-[10px] font-black uppercase tracking-widest px-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-3">
            <label htmlFor="reg-confirm" className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-600 group-focus-within:text-brand-primary transition-colors" />
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                className={cn(
                  'bg-surface-900/40 w-full pl-14 pr-6 py-4 rounded-2xl text-sm font-bold border border-white/5 outline-none focus:border-brand-primary/50 transition-all placeholder:text-surface-700',
                  errors.confirmPassword && 'border-danger/50 bg-danger/5'
                )}
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-danger text-[10px] font-black uppercase tracking-widest px-1">{errors.confirmPassword.message}</p>
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
                Continue
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-surface-600 mt-10">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-primary hover:text-white transition-colors cursor-pointer">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

