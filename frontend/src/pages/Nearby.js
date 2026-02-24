import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Building2,
  Stethoscope,
  Pill,
  Phone,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = createIcon('blue');
const hospitalIcon = createIcon('red');
const clinicIcon = createIcon('green');
const pharmacyIcon = createIcon('violet');

// Map center component
const MapCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
};

// Component to fit map bounds to the route
const RouteFitBounds = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
};

const Nearby = () => {
  const { t } = useTranslation();
  const { api, user, setLocation } = useAuth();

  const [activeTab, setActiveTab] = useState('hospital');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const mapCenter = user?.lat && user?.lng ? [user.lat, user.lng] : [17.385, 78.4867]; // Default: Hyderabad

  const fetchNearby = useCallback(async () => {
    if (!user?.lat || !user?.lng) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setRoute(null);
    setRouteInfo(null);
    setSelectedPlace(null);

    try {
      const response = await api.get(`/nearby?type=${activeTab}&radius=5000&limit=20`);
      setPlaces(response.data.items || []);
      setWarning(response.data.warning);
    } catch (err) {
      console.error('Failed to fetch nearby places:', err);
      toast.error('Failed to load nearby places');
    } finally {
      setLoading(false);
    }
  }, [api, activeTab, user]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  const getDirections = async (place) => {
    if (!user?.lat || !user?.lng) return;

    setSelectedPlace(place);

    try {
      const response = await api.get(
        `/route?from_lat=${user.lat}&from_lng=${user.lng}&to_lat=${place.lat}&to_lng=${place.lng}`
      );

      const data = response.data;

      if (data.geometry?.coordinates) {
        // Convert [lng, lat] to [lat, lng] for Leaflet
        const routeCoords = data.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRoute(routeCoords);
        setRouteInfo({
          distance: data.distance ? (data.distance / 1000).toFixed(1) : null,
          duration: data.duration ? Math.round(data.duration / 60) : null,
          warning: data.warning
        });
      }
    } catch (err) {
      console.error('Failed to get directions:', err);
      toast.error('Failed to get directions');
    }
  };

  const makeCall = (phone) => {
    if (!phone) {
      toast.error('Phone number not available');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const updateLocation = async () => {
    if (!locationInput.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setUpdatingLocation(true);
    try {
      await setLocation('manual', { query: locationInput });
      setLocationInput('');
      toast.success('Location updated!');
      fetchNearby();
    } catch (err) {
      toast.error(err.message || 'Failed to update location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const getAutoLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await setLocation('auto', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('Location updated!');
          fetchNearby();
        } catch (err) {
          toast.error('Failed to update location');
        } finally {
          setUpdatingLocation(false);
        }
      },
      () => {
        setUpdatingLocation(false);
        toast.error('Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getPlaceIcon = (type) => {
    switch (type) {
      case 'hospital': return hospitalIcon;
      case 'clinic': return clinicIcon;
      case 'pharmacy': return pharmacyIcon;
      default: return hospitalIcon;
    }
  };

  const formatDistance = (meters) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="space-y-6" data-testid="nearby-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('nearby.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('nearby.subtitle')}</p>
        </div>
      </div>

      {/* Location Update */}
      <Card className="glass-panel border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={t('auth.locationPlaceholder')}
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="h-12"
                data-testid="location-search"
              />
              <Button
                onClick={updateLocation}
                disabled={updatingLocation}
                className="h-12 px-6"
                data-testid="update-location"
              >
                {updatingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : t('nearby.updateLocation')}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={getAutoLocation}
              disabled={updatingLocation}
              className="h-12"
              data-testid="auto-location"
            >
              <Navigation className="h-5 w-5 mr-2" />
              Auto Detect
            </Button>
          </div>
          {user?.location_label && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{t('nearby.yourLocation')}: {user.location_label}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map */}
        <Card className="glass-panel border-border/50 overflow-hidden">
          <div className="h-[400px] lg:h-[600px]">
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              className="rounded-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenter center={mapCenter} />
              <RouteFitBounds route={route} />

              {/* User marker */}
              {user?.lat && user?.lng && (
                <Marker position={[user.lat, user.lng]} icon={userIcon}>
                  <Popup>
                    <strong>You are here</strong>
                    <br />
                    {user.location_label}
                  </Popup>
                </Marker>
              )}

              {/* Place markers */}
              {places.map((place) => (
                <Marker
                  key={place.id}
                  position={[place.lat, place.lng]}
                  icon={getPlaceIcon(place.type)}
                  eventHandlers={{
                    click: () => setSelectedPlace(place)
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 space-y-2">
                      <strong className="text-base">{place.name}</strong>
                      <p className="text-sm text-muted-foreground">{formatDistance(place.distance)} away</p>
                      {place.phone && (
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {place.phone}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                        {place.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 flex-1"
                            asChild
                          >
                            <a href={`tel:${place.phone}`} onClick={(e) => e.stopPropagation()}>
                              <Phone className="h-3 w-3 mr-1" />
                              {t('nearby.makeCall')}
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="h-8 px-2 flex-1"
                          onClick={() => getDirections(place)}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          {t('nearby.directions')}
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Route polyline */}
              {route && (
                <Polyline
                  positions={route}
                  color="#0f766e"
                  weight={4}
                  opacity={0.8}
                />
              )}
            </MapContainer>
          </div>
        </Card>

        {/* List */}
        <div className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="hospital" data-testid="tab-hospitals">
                <Building2 className="h-4 w-4 mr-2" />
                {t('nearby.hospitals')}
              </TabsTrigger>
              <TabsTrigger value="clinic" data-testid="tab-clinics">
                <Stethoscope className="h-4 w-4 mr-2" />
                {t('nearby.clinics')}
              </TabsTrigger>
              <TabsTrigger value="pharmacy" data-testid="tab-pharmacies">
                <Pill className="h-4 w-4 mr-2" />
                {t('nearby.pharmacies')}
              </TabsTrigger>
            </TabsList>

            {/* Warning */}
            {warning && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Live data unavailable. Showing cached results.
                </span>
              </div>
            )}

            {/* Route Info */}
            {routeInfo && selectedPlace && (
              <Card className="mt-4 bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedPlace.name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {routeInfo.distance && <span>{routeInfo.distance} km</span>}
                        {routeInfo.duration && <span>{routeInfo.duration} mins</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setRoute(null)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {routeInfo.warning && (
                    <p className="text-xs text-amber-600 mt-2">{routeInfo.warning}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Places List */}
            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 shimmer rounded-xl" />
                  ))}
                </div>
              ) : !user?.lat || !user?.lng ? (
                <Card className="glass-panel border-border/50">
                  <CardContent className="p-6 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Please set your location to find nearby healthcare facilities
                    </p>
                  </CardContent>
                </Card>
              ) : places.length > 0 ? (
                <div className="space-y-3">
                  {places.map((place) => (
                    <Card
                      key={place.id}
                      className={`glass-panel border-border/50 cursor-pointer transition-all hover:shadow-md ${selectedPlace?.id === place.id ? 'ring-2 ring-primary' : ''
                        }`}
                      onClick={() => setSelectedPlace(place)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{place.name}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {formatDistance(place.distance)} {t('nearby.distance')}
                              </span>
                              {place.phone && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {place.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {place.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/50 text-primary hover:bg-primary/10"
                              asChild
                            >
                              <a
                                href={`tel:${place.phone}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                {t('nearby.makeCall')}
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              getDirections(place);
                            }}
                            data-testid={`directions-${place.id}`}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            {t('nearby.directions')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="glass-panel border-border/50">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">{t('common.noResults')}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Nearby;
