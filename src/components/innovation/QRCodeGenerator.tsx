import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBaseUrl } from '@/lib/env';

const QRCodeGenerator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const generateQR = async () => {
      if (canvasRef.current) {
        const baseUrl = getBaseUrl();
        const formUrl = `${baseUrl}/innovation-hub`;
        
        try {
          await QRCode.toCanvas(canvasRef.current, formUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };

    generateQR();
  }, []);

  return (
    <Card className="w-fit mx-auto mb-8">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg">Quick Access</CardTitle>
        <p className="text-sm text-muted-foreground">
          Scan to access the Innovation Hub application form
        </p>
      </CardHeader>
      <CardContent className="flex justify-center">
        <canvas ref={canvasRef} className="border rounded-lg" />
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;