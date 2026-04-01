import { useState, useRef } from 'react';
import {
  Camera, Loader2, CheckCircle2, AlertCircle,
  List, Trash2, ShoppingCart, Store, Tag,
} from 'lucide-react';
import { PortalModal } from '../../components/PortalModal';
import { useModalStore } from '../../core/useModalStore';
import { processReceiptWithGemini, type OcrResult } from './ocrService';
import type { IReceiptPosition } from './geminiService';
import { formatCurrency } from '../../core/formatters';
import { cn } from '../../core/cn';

export const MODAL_RECEIPT_SCANNER = 'receipt-scanner';

interface IReceiptScannerProps {
  /** Called with the full list of positions the user confirmed */
  onPositionsConfirmed: (positions: IReceiptPosition[]) => void;
  existingCategoryNames?: string[];
  existingStoreNames?: string[];
}

export function ReceiptScanner({ onPositionsConfirmed, existingCategoryNames = [], existingStoreNames = [] }: IReceiptScannerProps) {
  const { closeModal, stack } = useModalStore();
  const isOpen = stack.some((m) => m.id === MODAL_RECEIPT_SCANNER);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [scanError, setScanError] = useState<{ message: string, isQuota: boolean } | null>(null);
  /** Mutable list of positions the user can remove items from */
  const [positions, setPositions] = useState<IReceiptPosition[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResult(null);
    setPositions([]);

    try {
      const ocrResult = await processReceiptWithGemini(file, existingCategoryNames, existingStoreNames);
      setResult(ocrResult);
      setPositions(ocrResult.positions ?? []);
    } catch (err: unknown) {
      console.error('Gemini error:', err);
      const isQuota = err instanceof Error && (err as any).isQuotaExceeded;
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try another photo.';
      
      setScanError({
        message,
        isQuota: !!isQuota
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removePosition = (idx: number) => {
    setPositions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddAll = () => {
    if (positions.length === 0) return;
    setIsAdding(true);
    onPositionsConfirmed(positions);
    // Brief delay for visual feedback, then close
    setTimeout(() => {
      setIsAdding(false);
      closeModal();
    }, 300);
  };

  const reset = () => {
    setResult(null);
    setPositions([]);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  const totalSum = positions.reduce((s, p) => s + p.amount, 0);

  return (
    <PortalModal modalId={MODAL_RECEIPT_SCANNER} title="Scan Receipt" size="lg">
      <div className="space-y-6">

        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleCapture}
          className="hidden"
        />

        {/* State 1: Ready to Scan */}
        {!isProcessing && !result && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-surface-300" />
            </div>
            <p className="text-surface-300 mb-6 max-w-xs mx-auto text-sm">
              Take a photo of the receipt. Gemini AI will extract every item automatically.
            </p>
            <button
              type="button"
              className={cn("btn btn-primary btn-lg w-full", scanError?.isQuota && "opacity-50 pointer-events-none")}
              onClick={() => !scanError?.isQuota && fileInputRef.current?.click()}
            >
              {scanError?.isQuota ? "Limit Reached" : "Take Photo"}
            </button>
          </div>
        )}

        {/* State 2: Processing */}
        {isProcessing && (
          <div className="text-center py-12 animate-fade-in">
            <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-4" />
            <p className="text-surface-100 font-medium text-lg">Gemini is thinking...</p>
            <p className="text-surface-400 text-sm mt-2">Extracting items and prices</p>
          </div>
        )}

        {/* State 3: Results */}
        {!isProcessing && result && (
          <div className="animate-fade-in space-y-5">

            {/* Positions list */}
            {positions.length > 0 && (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <List className="w-5 h-5" />
                    <p className="font-medium text-sm">
                      {positions.length} item{positions.length > 1 ? 's' : ''} found
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Total</p>
                    <p className="text-lg font-black text-surface-50">{formatCurrency(totalSum)}</p>
                  </div>
                </div>

                {/* Position cards */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {positions.map((pos, idx) => (
                    <div
                      key={idx}
                      className="glass-card p-4 space-y-3 relative group"
                    >
                      {/* Delete button */}
                      <button
                        type="button"
                        aria-label="Remove item"
                        className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-danger/20 transition-all cursor-pointer"
                        onClick={() => removePosition(idx)}
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>

                      {/* Row 1: Name + Amount */}
                      <div className="flex items-start justify-between pr-10">
                        <p className="text-sm font-bold text-surface-100 leading-tight min-w-0 flex-1 mr-3">
                          {pos.name}
                        </p>
                        <p className="text-lg font-black text-brand-primary shrink-0">
                          {formatCurrency(pos.amount)}
                        </p>
                      </div>

                      {/* Row 2: Metadata chips */}
                      <div className="flex flex-wrap gap-2">
                        {pos.storeName && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-700/50 text-[10px] font-bold text-surface-300 uppercase tracking-wider">
                            <Store className="w-3 h-3" />
                            {pos.storeName}
                          </span>
                        )}
                        {pos.categorySuggestion && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-primary/10 text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                            <Tag className="w-3 h-3" />
                            {pos.categorySuggestion}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-700/50 text-[10px] font-bold text-surface-400 tracking-wider">
                          {new Date(pos.spentAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Row 3: Details (quantity, discounts, etc.) */}
                      {pos.details && (
                        <p className="text-xs text-surface-400 leading-relaxed">
                          {pos.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add All button */}
                <button
                  type="button"
                  disabled={isAdding || positions.length === 0}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black text-base py-5 rounded-[24px] shadow-2xl shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                  onClick={handleAddAll}
                >
                  {isAdding ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span className="uppercase tracking-[0.15em]">
                        Add All {positions.length} Item{positions.length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error or No results */}
            {(scanError || positions.length === 0) && (
              <div className="text-center py-6">
                <AlertCircle className={cn("w-12 h-12 mx-auto mb-3", scanError?.isQuota ? "text-danger" : "text-warning")} />
                <p className="text-surface-100 font-medium mb-1">
                  {scanError?.isQuota ? 'Quota Exceeded' : (scanError?.message || 'Could not extract items')}
                </p>
                <p className="text-surface-400 text-sm mb-6 max-w-[280px] mx-auto">
                  {scanError?.isQuota 
                    ? "Gemini AI daily limit reached. Please try again tomorrow or enter items manually."
                    : "Try again with a better photo or enter the expense manually."}
                </p>
              </div>
            )}

            <button type="button" onClick={reset} className="btn btn-secondary btn-md w-full">
              Try Another Photo
            </button>

          </div>
        )}

      </div>
    </PortalModal>
  );
}
