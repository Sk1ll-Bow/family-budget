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

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (stack.length <= 1) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, closeModal, stack.length]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeModal();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ zIndex, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'w-full bg-surface-800 border border-glass-border animate-slide-up',
          'rounded-t-2xl sm:rounded-2xl',
          'max-h-[90dvh] flex flex-col',
          sizeClasses[size],
          className
        )}
        style={{ backdropFilter: 'blur(24px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border shrink-0">
          <h2 className="text-lg font-semibold text-surface-100">{title}</h2>
          <button
            type="button"
            onClick={() => closeModal()}
            className="btn btn-ghost btn-icon rounded-full"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
