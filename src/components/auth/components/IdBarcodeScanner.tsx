import { useZxing } from 'react-zxing';
import { Button } from '@/components/ui/button';
import { CameraOff } from 'lucide-react';

const IdBarcodeScanner = ({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) => {
  const { ref } = useZxing({
    onDecodeResult: (r) => { const c = r.getText().trim(); if (c) onCode(c); },
  });
  return (
    <div className="space-y-2">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed border-primary/50">
        <video ref={ref} className="w-full h-full object-cover" />
      </div>
      <p className="text-xs text-center text-muted-foreground">Hold the barcode on the back of your ID in front of the camera</p>
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClose}>
        <CameraOff className="h-4 w-4 mr-2" />Cancel
      </Button>
    </div>
  );
};

export default IdBarcodeScanner;
