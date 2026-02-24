import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useTheme } from '../contexts/ThemeContext';
import { Heart, Eye, EyeOff, Loader2, MapPin, Navigation, Sun, Moon, Monitor, Languages, Mail } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const { t, i18n } = useTranslation();
  const { register, setLocation } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferred_language: i18n.language || 'en',
    location_mode: 'manual',
    location_query: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Removed OTP States


  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    handleChange('preferred_language', lang);
  };

  const themeIcons = { light: Sun, dark: Moon, system: Monitor };
  const ThemeIcon = themeIcons[theme];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location_mode: 'auto',
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
        setGettingLocation(false);
        toast.success('Location detected!');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Failed to get location. Please enter manually.');
        handleChange('location_mode', 'manual');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleStep1Next = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.location_mode === 'manual' && !formData.location_query) {
      toast.error('Please enter your location');
      return;
    }

    setLoading(true);
    try {
      // Prepare registration data
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        preferred_language: formData.preferred_language,
        location_mode: formData.location_mode,
        otp: null
      };

      if (formData.location_mode === 'auto' && formData.lat && formData.lng) {
        userData.lat = formData.lat;
        userData.lng = formData.lng;
      }

      // Register user
      await register(userData);

      // If manual location, set it after registration
      if (formData.location_mode === 'manual' && formData.location_query) {
        try {
          await setLocation('manual', { query: formData.location_query });
        } catch (locErr) {
          console.warn('Location set failed:', locErr);
        }
      } else if (formData.location_mode === 'auto' && formData.lat && formData.lng) {
        try {
          await setLocation('auto', { lat: formData.lat, lng: formData.lng });
        } catch (locErr) {
          console.warn('Location set failed:', locErr);
        }
      }

      // Update language
      i18n.changeLanguage(formData.preferred_language);
      localStorage.setItem('language', formData.preferred_language);

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background ecg-pattern flex items-center justify-center p-4 relative">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="register-theme-toggle">
              <ThemeIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4 mr-2" /> {t('settings.light')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4 mr-2" /> {t('settings.dark')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="h-4 w-4 mr-2" /> {t('settings.system')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="register-lang-toggle">
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('hi')}>हिंदी</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('te')}>తెలుగు</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">
              <span className="text-primary">Vital</span>Wave
            </span>
          </Link>
        </div>

        <Card className="glass-panel border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('auth.registerTitle')}</CardTitle>
            <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`w-8 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('auth.name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    data-testid="register-name"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="h-12 pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      data-testid="register-password"
                      className="h-12 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    data-testid="register-confirm-password"
                    className="h-12"
                    required
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full h-12 rounded-full"
                  data-testid="register-next"
                  disabled={false}
                >
                  {t('common.next')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Language Selection */}
                <div className="space-y-2">
                  <Label>{t('auth.selectLanguage')}</Label>
                  <Select
                    value={formData.preferred_language}
                    onValueChange={(value) => {
                      handleChange('preferred_language', value);
                      i18n.changeLanguage(value);
                      localStorage.setItem('language', value);
                    }}
                  >
                    <SelectTrigger className="h-12" data-testid="register-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी</SelectItem>
                      <SelectItem value="te">తెలుగు</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Mode */}
                <div className="space-y-3">
                  <Label>{t('auth.locationMode')}</Label>
                  <RadioGroup
                    value={formData.location_mode}
                    onValueChange={(value) => handleChange('location_mode', value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-xl border border-border/50 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="auto" id="auto" data-testid="location-auto" />
                      <Label htmlFor="auto" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Navigation className="h-4 w-4 text-primary" />
                        {t('auth.autoLocation')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl border border-border/50 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="manual" id="manual" data-testid="location-manual" />
                      <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer flex-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        {t('auth.manualLocation')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Location Input */}
                {formData.location_mode === 'auto' ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className="w-full h-12"
                    data-testid="get-location-btn"
                  >
                    {gettingLocation ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : formData.lat ? (
                      <>
                        <MapPin className="h-5 w-5 mr-2 text-green-500" />
                        {t('auth.locationDetected', 'Location detected!')}
                      </>
                    ) : (
                      <>
                        <Navigation className="h-5 w-5 mr-2" />
                        {t('auth.detectLocation', 'Detect My Location')}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder={t('auth.locationPlaceholder')}
                      value={formData.location_query}
                      onChange={(e) => handleChange('location_query', e.target.value)}
                      data-testid="location-input"
                      className="h-12"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 rounded-full"
                    data-testid="register-back"
                  >
                    {t('common.back')}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-full"
                    disabled={loading}
                    data-testid="register-submit"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('auth.signUp')
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{t('auth.hasAccount')} </span>
              <Link to="/login" className="text-primary hover:underline font-medium" data-testid="goto-login">
                {t('auth.signIn')}
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t('landing.footerNote')}
        </p>
      </div>
    </div>
  );
};

export default Register;
