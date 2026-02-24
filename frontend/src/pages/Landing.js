import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import {
  Heart,
  Upload,
  MessageSquare,
  MapPin,
  Stethoscope,
  Shield,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Languages
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const Landing = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const features = [
    {
      icon: Upload,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc')
    },
    {
      icon: MessageSquare,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc')
    },
    {
      icon: MapPin,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc')
    },
    {
      icon: Stethoscope,
      title: t('landing.feature4Title'),
      description: t('landing.feature4Desc')
    },
    {
      icon: Shield,
      title: t('landing.feature5Title'),
      description: t('landing.feature5Desc')
    }
  ];

  const themeIcons = { light: Sun, dark: Moon, system: Monitor };
  const ThemeIcon = themeIcons[theme];

  return (
    <div className="min-h-screen bg-background ecg-pattern">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Heart className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">
                <span className="text-primary">Vital</span>Wave
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="landing-theme-toggle">
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

              {/* Language */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="landing-lang-toggle">
                    <Languages className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('hi')}>हिंदी</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('te')}>తెలుగు</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Auth Buttons */}
              <Link to="/login">
                <Button variant="ghost" data-testid="landing-login-btn">{t('nav.login')}</Button>
              </Link>
              <Link to="/signup">
                <Button className="rounded-full" data-testid="landing-register-btn">{t('nav.register')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              <span>{t('landing.heroBadge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              {t('landing.heroTitle')}{' '}
              <span className="text-primary">{t('landing.heroTitleAccent')}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('landing.heroSubtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-8 btn-hover-lift" data-testid="hero-get-started">
                  {t('landing.getStarted')}
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-full px-8" data-testid="hero-sign-in">
                  {t('landing.signIn')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="mt-16 relative">
            <div className="aspect-[16/9] max-w-4xl mx-auto rounded-2xl overflow-hidden glass-panel">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=675&fit=crop"
                alt="Healthcare Dashboard"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass-panel rounded-xl p-4 max-w-md">
                  <p className="text-sm font-medium text-foreground">
                    {t('landing.testimonial')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">— Priya S., Patient</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('landing.languagesTitle')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t('landing.languagesSubtitle')}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="px-6 py-3 rounded-full bg-primary/10 text-primary font-medium">
              English
            </div>
            <div className="px-6 py-3 rounded-full bg-primary/10 text-primary font-medium">
              हिंदी
            </div>
            <div className="px-6 py-3 rounded-full bg-primary/10 text-primary font-medium">
              తెలుగు
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t('landing.ctaSubtitle')}
          </p>
          <Link to="/signup">
            <Button size="lg" className="rounded-full px-8 btn-hover-lift" data-testid="cta-get-started">
              {t('landing.createAccount')}
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              <span className="text-primary">Vital</span>Wave
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 VitalWave. {t('landing.footerNote')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
