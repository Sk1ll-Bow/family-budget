import { useState, useRef } from 'react';
import { QrCode, Loader2, AlertCircle } from 'lucide-react';
import { PortalModal } from '../../components/PortalModal';
import { useModalStore } from '../../core/useModalStore';
import { extractAmountFromQR } from './ocrService';

// Note: For a real production app, we would use a library like zxing-js/browser for real-time video feed scanning.
// To keep things simple and reliable on all devices (iOS Safari camera constraints), 
// we'll use a photo upload approach for QR codes as well, identical to the receipt scanner flow.

export const MODAL_QR_SCANNER = 'qr-scanner';

interface IQrScannerProps {
  onAmountDetected: (amount: number) => void;
}

export function QrScanner({ onAmountDetected }: IQrScannerProps) {
  const { closeModal, stack } = useModalStore();
  const isOpen = stack.some((m) => m.id === MODAL_QR_SCANNER);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Modern browsers support BarcodeDetector API
      if (!('BarcodeDetector' in window)) {
        throw new Error('Your browser does not support barcode scanning.');
      }

      // @ts-ignore - TS doesn't have BarcodeDetector types built-in yet
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      
      // Convert file to ImageBitmap for the detector
      const imageBitmap = await createImageBitmap(file);
      const barcodes = await barcodeDetector.detect(imageBitmap);

      if (barcodes.length > 0) {
        const qrData = barcodes[0].rawValue;
        const amount = extractAmountFromQR(qrData);
        
        if (amount) {
           onAmountDetected(amount);
           closeModal();
        } else {
           setError('Receipt QR code does not contain an amount or has an invalid format.');
        }
      } else {
        setError('QR code not found. Please ensure the image is clear.');
      }
    } catch (err: any) {
      console.error('[QR] Error:', err);
      setError(err.message || 'Error processing QR code.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <PortalModal modalId={MODAL_QR_SCANNER} title="Scan QR Code">
      <div className="space-y-6">
        
        <input 
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleCapture}
          className="hidden"
        />

        {!isProcessing && !error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-surface-300" />
            </div>
            <p className="text-surface-300 mb-6 max-w-xs mx-auto text-sm">
              Take a photo of the QR code on your store receipt (usually at the bottom).
            </p>
            <button 
              type="button" 
              className="btn btn-primary btn-lg w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Scan QR
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-12 animate-fade-in">
            <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-4" />
            <p className="text-surface-100 font-medium text-lg">Searching for QR...</p>
          </div>
        )}

        {error && (
           <div className="text-center py-6 animate-fade-in">
             <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3" />
             <p className="text-surface-100 font-medium mb-1">Attention</p>
             <p className="text-surface-400 text-sm mb-6 max-w-[280px] mx-auto">{error}</p>
             <button type="button" onClick={reset} className="btn btn-secondary btn-md w-full">
               Try Again
             </button>
           </div>
        )}

      </div>
    </PortalModal>
  );
}
