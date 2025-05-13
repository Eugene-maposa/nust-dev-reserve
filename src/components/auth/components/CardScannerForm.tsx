
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QrCode } from 'lucide-react';

const CardScannerForm = () => {
  const { toast } = useToast();

  const handleCardScan = () => {
    toast({
      title: "Card Scanner",
      description: "This feature will be available soon!",
    });
  };

  return (
    <div className="text-center space-y-4 py-6">
      <QrCode className="h-24 w-24 mx-auto text-university-blue" />
      <h3 className="text-xl font-medium">Scan Your University Card</h3>
      <p className="text-gray-500">
        Place your university ID card near the scanner to login.
      </p>
      <Button 
        onClick={handleCardScan}
        className="bg-university-blue hover:bg-university-blue/90"
      >
        Simulate Card Scan
      </Button>
    </div>
  );
};

export default CardScannerForm;
