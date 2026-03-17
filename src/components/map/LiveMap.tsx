import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';

// Fix Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// NUST Technovation Centre - Prof Makhurane Building (Bulawayo, Zimbabwe)
const NUST_TECHNOVATION_CENTRE = {
  lat: -20.2068,
  lng: 28.5826,
};

const LiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [NUST_TECHNOVATION_CENTRE.lat, NUST_TECHNOVATION_CENTRE.lng],
      zoom: 17,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Main marker
    const marker = L.marker([NUST_TECHNOVATION_CENTRE.lat, NUST_TECHNOVATION_CENTRE.lng]).addTo(map);
    marker.bindPopup(
      `<div class="text-center">
        <strong class="text-base">NUST Technovation Centre</strong><br/>
        <span class="text-sm text-gray-600">Namibia University of Science and Technology</span><br/>
        <span class="text-xs text-gray-500">Windhoek, Namibia</span>
      </div>`
    ).openPopup();

    mapInstanceRef.current = map;

    // Fix map sizing after render
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <div
          ref={mapRef}
          className="w-full rounded-lg"
          style={{ height: '450px' }}
        />
      </CardContent>
    </Card>
  );
};

export default LiveMap;
