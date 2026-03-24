import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PortalModal } from '../../components/PortalModal';
import { useModalStore } from '../../core/useModalStore';
import { processReceiptImage, type OcrResult } from './ocrService';
import { cn } from '../../core/cn';

export const MODAL_RECEIPT_SCANNER = 'receipt-scanner';

interface IReceiptScannerProps {
  onAmountDetected: (amount: number) => void;
}

export function ReceiptScanner({ onAmountDetected }: IReceiptScannerProps) {
  const { closeModal, stack } = useModalStore();
  const isOpen = stack.some((m) => m.id === MODAL_RECEIPT_SCANNER);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    const ocrResult = await processReceiptImage(file);
    setResult(ocrResult);
    setIsProcessing(false);

    // If confidence is high, auto-complete
    if (ocrResult.confidence >= 0.7 && ocrResult.detectedAmount) {
      setTimeout(() => {
        onAmountDetected(ocrResult.detectedAmount!);
        closeModal();
      }, 1500);
    }
  };

  const reset = () => {
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <PortalModal modalId={MODAL_RECEIPT_SCANNER} title="Scan Receipt">
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
              Take a photo of the receipt so the total amount is clearly visible.
            </p>
            <button 
              type="button" 
              className="btn btn-primary btn-lg w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Take Photo
            </button>
          </div>
        )}

        {/* State 2: Processing */}
        {isProcessing && (
          <div className="text-center py-12 animate-fade-in">
            <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-4" />
            <p className="text-surface-100 font-medium text-lg">Recognizing...</p>
            <p className="text-surface-400 text-sm mt-2">Analyzing receipt text</p>
          </div>
        )}

        {/* State 3: Results (Medium/Low Confidence) */}
        {!isProcessing && result && (
          <div className="animate-fade-in space-y-5">
            
            {/* High confidence auto-close feedback */}
            {result.confidence >= 0.7 && result.detectedAmount && (
              <div className="glass-card p-6 bg-success/10 border-success/20 text-center">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="text-success font-bold text-xl mb-1">{result.detectedAmount} ₽</p>
                <p className="text-success/80 text-sm">Amount detected!</p>
              </div>
            )}

            {/* Medium Confidence - Show Candidates */}
            {result.confidence >= 0.3 && result.confidence < 0.7 && result.detectedAmount && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-primary mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-medium text-sm">Verify detected amounts</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                     type="button"
                     className="glass-card p-4 border-brand-primary/40 hover:bg-brand-primary/10 transition-colors text-center"
                     onClick={() => {
                        onAmountDetected(result.detectedAmount!);
                        closeModal();
                     }}
                  >
                     <p className="text-xs text-surface-400 mb-1">Most Likely</p>
                     <p className="text-lg font-bold text-surface-100">{result.detectedAmount} ₽</p>
                  </button>

                  {result.candidates.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className="glass-card p-4 hover:bg-surface-700 transition-colors text-center"
                      onClick={() => {
                         onAmountDetected(amount);
                         closeModal();
                      }}
                    >
                      <p className="text-xs text-surface-400 mb-1">Alternative</p>
                      <p className="text-lg font-bold text-surface-100">{amount} ₽</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Low Confidence - Failed */}
            {result.confidence < 0.3 && (
              <div className="text-center py-6">
                 <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3" />
                 <p className="text-surface-100 font-medium mb-1">Could not recognize receipt</p>
                 <p className="text-surface-400 text-sm mb-6">Try taking a photo in better lighting or enter the amount manually.</p>
              </div>
            )}

            <button type="button" onClick={reset} className="btn btn-secondary btn-md w-full">
              Try Again
            </button>

          </div>
        )}

      </div>
    </PortalModal>
  );
}
