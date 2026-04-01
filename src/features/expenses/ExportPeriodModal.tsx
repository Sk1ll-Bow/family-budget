import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { PortalModal } from '../../components/PortalModal';
import { useAuthStore } from '../../core/useAuthStore';
import { useModalStore } from '../../core/useModalStore';
import { exportExpenses, ExportFormat } from './exportService';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';
import { cn } from '../../core/cn';

export const MODAL_EXPORT_PERIOD = 'export-period';

const exportSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  format: z.enum(['excel', 'pdf'] as const)
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date cannot be before start date",
  path: ["endDate"]
});

type ExportFormData = z.infer<typeof exportSchema>;

export function ExportPeriodModal() {
  const { familyId } = useAuthStore();
  const { closeModal, stack } = useModalStore();
  
  const modalData = stack.find((m) => m.id === MODAL_EXPORT_PERIOD);
  const isOpen = !!modalData;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      format: 'excel'
    }
  });

  const selectedFormat = watch('format');

  const onSubmit = async (data: ExportFormData) => {
    if (!familyId) return;
    setSubmitting(true);

    try {
      await exportExpenses(familyId, data.startDate, data.endDate, data.format);
      toast.success(`Successfully exported as ${data.format.toUpperCase()}`);
      closeModal();
    } catch (error) {
      toast.error('Failed to export. Please try again.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <PortalModal modalId={MODAL_EXPORT_PERIOD} title="Choose Export Period" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="export-start-date" className="block text-[10px] font-black text-surface-500 uppercase tracking-widest pl-1">
              Start Date
            </label>
            <input
              id="export-start-date"
              type="date"
              className={cn(
                "glass w-full px-4 py-4 text-sm focus:ring-1 focus:ring-brand-primary/50 outline-none rounded-2xl font-black text-surface-50 transition-all",
                errors.startDate ? "border-danger text-danger" : ""
              )}
              {...register('startDate')}
            />
            {errors.startDate && <p className="text-[10px] text-danger font-bold pl-1">{errors.startDate.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="export-end-date" className="block text-[10px] font-black text-surface-500 uppercase tracking-widest pl-1">
              End Date
            </label>
            <input
              id="export-end-date"
              type="date"
              className={cn(
                "glass w-full px-4 py-4 text-sm focus:ring-1 focus:ring-brand-primary/50 outline-none rounded-2xl font-black text-surface-50 transition-all",
                errors.endDate ? "border-danger text-danger" : ""
              )}
              {...register('endDate')}
            />
            {errors.endDate && <p className="text-[10px] text-danger font-bold pl-1">{errors.endDate.message}</p>}
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest pl-1">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setValue('format', 'excel')}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all group outline-none",
                selectedFormat === 'excel' 
                  ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                  : "glass border-transparent text-surface-400 hover:text-surface-100 hover:bg-white/5"
              )}
            >
              <FileSpreadsheet className={cn("w-8 h-8 transition-transform group-active:scale-95", selectedFormat === 'excel' && "drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]")} />
              <span className="text-xs font-black uppercase tracking-widest">Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('format', 'pdf')}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all group outline-none",
                selectedFormat === 'pdf' 
                  ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                  : "glass border-transparent text-surface-400 hover:text-surface-100 hover:bg-white/5"
              )}
            >
              <FileText className={cn("w-8 h-8 transition-transform group-active:scale-95", selectedFormat === 'pdf' && "drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]")} />
              <span className="text-xs font-black uppercase tracking-widest">PDF Document</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-primary flex items-center justify-center gap-3 text-white font-black hover:bg-brand-primary/90 text-sm py-5 rounded-[24px] shadow-2xl shadow-brand-primary/20 active:scale-[0.98] transition-all group"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span className="uppercase tracking-[0.2em]">Generate Export</span>
            </>
          )}
        </button>
      </form>
    </PortalModal>
  );
}
