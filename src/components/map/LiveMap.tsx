import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Loader2, MapPin, X, MapPinPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

// Default fallback coordinates
const DEFAULT_COORDS = { lat: -20.1525, lng: 28.6345 };

const LiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  const [locating, setLocating] = useState(false);
  const [settingLocation, setSettingLocation] = useState(false);
  const [routeActive, setRouteActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; time: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [centreCoords, setCentreCoords] = useState(DEFAULT_COORDS);
  const [locationIsSet, setLocationIsSet] = useState<boolean | null>(null); // null = loading
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  // Fetch stored location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'centre_location')
        .single();

      if (!error && data) {
        const val = data.value as any;
        if (val.set && val.lat && val.lng) {
          setCentreCoords({ lat: val.lat, lng: val.lng });
          setLocationIsSet(true);
        } else {
          setLocationIsSet(false);
        }
      } else {
        setLocationIsSet(false);
      }
    };
    fetchLocation();
  }, []);

  // Initialize map once coords are ready
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || locationIsSet === null) return;

    const map = L.map(mapRef.current, {
      center: [centreCoords.lat, centreCoords.lng],
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

    const marker = L.marker([centreCoords.lat, centreCoords.lng], { icon: destIcon })
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

    destMarkerRef.current = marker;
    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [locationIsSet, centreCoords]);

  const setAdminLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setSettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const { error } = await supabase
          .from('site_settings')
          .update({ value: { lat: latitude, lng: longitude, set: true } })
          .eq('key', 'centre_location');

        if (error) {
          toast({ title: 'Error', description: 'Failed to save location.', variant: 'destructive' });
          setSettingLocation(false);
          return;
        }

        setCentreCoords({ lat: latitude, lng: longitude });
        setLocationIsSet(true);
        setSettingLocation(false);

        // Update map view and marker
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([latitude, longitude], 17);
          if (destMarkerRef.current) {
            destMarkerRef.current.setLatLng([latitude, longitude]);
          }
        }

        toast({ title: 'Location Set', description: 'Technovation Centre location has been saved permanently.' });
      },
      (error) => {
        setSettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
    map.setView([centreCoords.lat, centreCoords.lng], 17);
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

        if (routingControlRef.current) map.removeControl(routingControlRef.current);
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);

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

        const control = (L as any).Routing.control({
          waypoints: [
            L.latLng(latitude, longitude),
            L.latLng(centreCoords.lat, centreCoords.lng),
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
          createMarker: () => null,
          show: false,
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

  if (locationIsSet === null) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading map...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0 relative">
        {/* Admin: Set Location button (only shown if location not yet set) */}
        {isAdmin && !locationIsSet && (
          <div className="absolute top-3 left-3 z-[1000]">
            <Button
              onClick={setAdminLocation}
              disabled={settingLocation}
              className="bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
              size="sm"
            >
              {settingLocation ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting Location...</>
              ) : (
                <><MapPinPlus className="w-4 h-4 mr-2" /> Set Centre Location</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1 bg-background/90 rounded px-2 py-1 max-w-[220px]">
              Use your current live location to set the Technovation Centre pin. This can only be done once.
            </p>
          </div>
        )}

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
