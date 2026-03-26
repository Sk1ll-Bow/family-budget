import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalStore } from '../core/useModalStore';
import { cn } from '../core/cn';

interface IPortalModalProps {
  modalId: string;
  title: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-full mx-4',
};

/**
 * Portal-based modal rendered to document.body.
 * Uses the global Zustand modal store for open/close state.
 * Supports stacking with automatic z-index calculation.
 */
export function PortalModal({ modalId, title, children, className, size = 'md' }: IPortalModalProps) {
  const { stack, closeModal } = useModalStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  const modalIndex = stack.findIndex((m) => m.id === modalId);
  const isOpen = modalIndex !== -1;
  const zIndex = 1000 + modalIndex * 10;

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    return () => {
      if (stack.length <= 1) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, stack.length]);



  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}

      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in"
      style={{ zIndex, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'w-full glass-card animate-slide-up flex flex-col',
          'rounded-t-3xl sm:rounded-2xl',
          'max-h-[92dvh] sm:max-h-[90dvh]',
          sizeClasses[size],
          className
        )}
      >
        {/* Handle for mobile swipe-down feel */}
        <div className="sm:hidden w-12 h-1.5 bg-surface-700/50 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0">
          <h2 className="text-xl font-bold text-surface-50 tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={() => closeModal()}
            className="w-10 h-10 rounded-full bg-surface-800/80 hover:bg-surface-700/80 flex items-center justify-center transition-colors transition-all active:scale-90"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
