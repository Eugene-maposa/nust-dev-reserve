import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Loader2, MapPin, X } from 'lucide-react';

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
  const routingControlRef = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [locating, setLocating] = useState(false);
  const [routeActive, setRouteActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; time: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

    // Destination marker
    const destIcon = L.divIcon({
      html: `<div style="background:#dc2626;width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#dc2626"/></svg>
      </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    L.marker([NUST_TECHNOVATION_CENTRE.lat, NUST_TECHNOVATION_CENTRE.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(
        `<div class="text-center">
          <strong class="text-base">NUST Technovation Centre</strong><br/>
          <span class="text-sm text-gray-600">Prof Makhurane Building</span><br/>
          <span class="text-sm text-gray-600">National University of Science and Technology</span><br/>
          <span class="text-xs text-gray-500">Bulawayo, Zimbabwe</span>
        </div>`
      )
      .openPopup();

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const clearRoute = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    setRouteActive(false);
    setRouteInfo(null);
    setLocationError(null);
    map.setView([NUST_TECHNOVATION_CENTRE.lat, NUST_TECHNOVATION_CENTRE.lng], 17);
  };

  const getDirections = () => {
    const map = mapInstanceRef.current;
    if (!map || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocating(false);

        // Clear previous route
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current);
        }
        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
        }

        // User location marker
        const userIcon = L.divIcon({
          html: `<div style="background:#2563eb;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
            <div style="background:white;width:10px;height:10px;border-radius:50%;"></div>
          </div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup('<strong>Your Location</strong>');

        // Add routing with shortest route
        const control = (L as any).Routing.control({
          waypoints: [
            L.latLng(latitude, longitude),
            L.latLng(NUST_TECHNOVATION_CENTRE.lat, NUST_TECHNOVATION_CENTRE.lng),
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          showAlternatives: false,
          lineOptions: {
            styles: [{ color: '#2563eb', weight: 5, opacity: 0.8 }],
            extendToWaypoints: true,
            missingRouteTolerance: 0,
          },
          router: (L as any).Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving',
          }),
          createMarker: () => null, // We handle markers ourselves
          show: false, // Hide the default itinerary panel
        }).addTo(map);

        control.on('routesfound', (e: any) => {
          const route = e.routes[0];
          const distKm = (route.summary.totalDistance / 1000).toFixed(1);
          const timeMin = Math.ceil(route.summary.totalTime / 60);
          setRouteInfo({
            distance: `${distKm} km`,
            time: timeMin < 60 ? `${timeMin} min` : `${Math.floor(timeMin / 60)}h ${timeMin % 60}min`,
          });
          setRouteActive(true);
        });

        control.on('routingerror', () => {
          setLocationError('Could not find a route. You may be too far away.');
          setLocating(false);
        });

        routingControlRef.current = control;
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions in your browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('An unknown error occurred getting your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0 relative">
        {/* Controls overlay */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          {!routeActive ? (
            <Button
              onClick={getDirections}
              disabled={locating}
              className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
              size="sm"
            >
              {locating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Locating...</>
              ) : (
                <><Navigation className="w-4 h-4 mr-2" /> Get Directions</>
              )}
            </Button>
          ) : (
            <Button
              onClick={clearRoute}
              variant="destructive"
              size="sm"
              className="shadow-lg"
            >
              <X className="w-4 h-4 mr-2" /> Clear Route
            </Button>
          )}
        </div>

        {/* Route info overlay */}
        {routeInfo && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {routeInfo.distance} · {routeInfo.time}
                </p>
                <p className="text-xs text-muted-foreground">Shortest route to Prof Makhurane Building</p>
              </div>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {locationError && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-destructive/10 border border-destructive/30 rounded-lg p-3 shadow-lg max-w-xs">
            <p className="text-xs text-destructive font-medium">{locationError}</p>
          </div>
        )}

        <div
          ref={mapRef}
          className="w-full rounded-lg"
          style={{ height: '500px' }}
        />
      </CardContent>
    </Card>
  );
};

export default LiveMap;
