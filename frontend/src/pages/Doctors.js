import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Search,
  Star,
  Phone,
  MapPin,
  Clock,
  Filter,
  Loader2,
  ChevronRight,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';

const Doctors = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const specialties = [
    { value: 'all', label: 'All Specialties' },
    { value: 'General Medicine', label: 'General Medicine' },
    { value: 'Cardiology', label: 'Cardiology' },
    { value: 'Dermatology', label: 'Dermatology' },
    { value: 'Orthopedics', label: 'Orthopedics' },
    { value: 'Pediatrics', label: 'Pediatrics' },
    { value: 'Gynecology', label: 'Gynecology' },
    { value: 'Neurology', label: 'Neurology' },
    { value: 'Psychiatry', label: 'Psychiatry' },
    { value: 'ENT', label: 'ENT' },
    { value: 'Ophthalmology', label: 'Ophthalmology' },
  ];

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('condition', searchQuery);
      if (specialty && specialty !== 'all') params.append('specialty', specialty);
      params.append('sort', sortBy);
      if (user?.lat) params.append('lat', user.lat);
      if (user?.lng) params.append('lng', user.lng);

      const response = await api.get(`/doctors?${params.toString()}`);
      setDoctors(response.data.items || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [api, searchQuery, specialty, sortBy, user]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Seed doctors on first load if none exist
  useEffect(() => {
    const seedDoctors = async () => {
      try {
        await api.post('/seed');
      } catch (err) {
        // Ignore if already seeded
      }
    };
    seedDoctors();
  }, [api]);

  const handleCall = (phone, doctorName) => {
    window.location.href = `tel:${phone}`;
    toast.success(`Calling ${doctorName}...`);
  };

  const navigateTo = (doctor) => {
    if (!doctor.lat || !doctor.lng) {
      toast.error('Location not available for this doctor');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${doctor.lat},${doctor.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6" data-testid="doctors-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('doctors.title')}</h1>
        <p className="text-muted-foreground mt-1">
          Find the right specialist for your needs
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="glass-panel border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('doctors.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
                data-testid="doctor-search"
              />
            </div>

            {/* Specialty Filter */}
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="w-full sm:w-48 h-12" data-testid="specialty-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('doctors.specialty')} />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((spec) => (
                  <SelectItem key={spec.value} value={spec.value}>
                    {spec.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40 h-12" data-testid="sort-filter">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="distance">Nearest</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Doctors List */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 shimmer rounded-2xl" />
          ))}
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid gap-4">
          {doctors.map((doctor) => (
            <Card
              key={doctor.id}
              className="glass-panel border-border/50 hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Avatar */}
                  <Avatar className="h-20 w-20 rounded-xl">
                    <AvatarImage src={doctor.image} alt={doctor.name} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xl">
                      {doctor.name ? doctor.name.split(' ').map(n => n[0]).join('') : 'DR'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{doctor.name}</h3>
                        <p className="text-primary text-sm">{doctor.specialty}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          {doctor.avg_rating?.toFixed(1) || '4.5'}
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {doctor.experience_years || 10} {t('doctors.experience')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {doctor.hospital || 'City Hospital'}
                      </span>
                    </div>

                    {/* Conditions */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {doctor.conditions?.slice(0, 4).map((condition, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        className="rounded-full bg-primary hover:bg-primary/90"
                        data-testid={`call-${doctor.id}`}
                        asChild
                      >
                        <a href={`tel:${doctor.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          {t('doctors.callNow')}
                        </a>
                      </Button>
                      <Link to={`/doctor/${doctor.id}`}>
                        <Button variant="ghost" className="rounded-full group" data-testid={`view-${doctor.id}`}>
                          {t('doctors.viewProfile')}
                          <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-panel border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('common.noResults')}</p>
            <Button
              variant="link"
              onClick={() => { setSearchQuery(''); setSpecialty('all'); }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Doctors;
