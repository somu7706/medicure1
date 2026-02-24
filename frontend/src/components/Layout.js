import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  LayoutDashboard,
  Upload,
  MessageSquare,
  Stethoscope,
  MapPin,
  Pill,
  History,
  HelpCircle,
  Settings,
  Heart,
  Activity,
  ClipboardList,
  AlertTriangle,
  Apple,
  Sun,
  Moon,
  Monitor,
  Menu,
  LogOut,
  User,
  ChevronDown,
  Languages,
  Search
} from 'lucide-react';

import logo from '../assets/logo.png';
import SOSButton from './SOSButton';

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const coreNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/upload', icon: Upload, label: t('nav.upload') },
    { path: '/assistant', icon: MessageSquare, label: t('nav.assistant') },
    { path: '/doctors', icon: Stethoscope, label: t('nav.doctors') },
    { path: '/nearby', icon: MapPin, label: t('nav.nearby') },
    { path: '/medicines', icon: Pill, label: t('nav.medicines') },
    { path: '/history', icon: History, label: t('nav.history') },
    { path: '/symptoms', icon: Search, label: 'Symptom Checker' },
    { path: '/help', icon: HelpCircle, label: t('nav.help') },
  ];

  const myHealthItems = [
    { path: '/stage', icon: Activity, label: t('nav.stage') },
    { path: '/care-plan', icon: ClipboardList, label: t('nav.carePlan') },
    { path: '/precautions', icon: AlertTriangle, label: t('nav.precautions') },
    { path: '/lifestyle', icon: Apple, label: t('nav.lifestyle') },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const NavContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border/40">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onItemClick}>
          <img src={logo} alt="MediCure Logo" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-primary">Medi</span>Cure
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Core Section */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
            Core
          </p>
          <ul className="space-y-1">
            {coreNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onItemClick}
                    data-testid={`nav-${item.path.slice(1)}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* My Health Section - Conditional */}
        {user?.has_uploads && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
              {t('nav.myHealth')}
            </p>
            <ul className="space-y-1">
              {myHealthItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onItemClick}
                      data-testid={`nav-${item.path.slice(1)}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Settings at bottom */}
      <div className="p-3 border-t border-border/40">
        <Link
          to="/settings"
          onClick={onItemClick}
          data-testid="nav-settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${location.pathname === '/settings'
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
          <Settings className="h-5 w-5" />
          <span>{t('nav.settings')}</span>
        </Link>
      </div>
    </div>
  );

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor
  };
  const ThemeIcon = themeIcons[theme];

  return (
    <div className="min-h-screen bg-background ecg-pattern">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 border-r border-border/40 bg-background/80 backdrop-blur-md z-40 flex-col">
        <NavContent onItemClick={() => { }} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <NavContent onItemClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(true)}
                  data-testid="mobile-menu-btn"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Spacer for desktop */}
            <div className="hidden lg:block" />

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="theme-toggle">
                    <ThemeIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')} data-testid="theme-light">
                    <Sun className="h-4 w-4 mr-2" />
                    {t('settings.light')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} data-testid="theme-dark">
                    <Moon className="h-4 w-4 mr-2" />
                    {t('settings.dark')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} data-testid="theme-system">
                    <Monitor className="h-4 w-4 mr-2" />
                    {t('settings.system')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="language-toggle">
                    <Languages className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage('en')} data-testid="lang-en">
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('hi')} data-testid="lang-hi">
                    हिंदी
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('te')} data-testid="lang-te">
                    తెలుగు
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2" data-testid="profile-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline-block text-sm font-medium max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/settings" data-testid="profile-settings">
                      <User className="h-4 w-4 mr-2" />
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" data-testid="settings-link">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('nav.settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-btn">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 page-enter-active">
          {children || <Outlet />}
        </main>
        <SOSButton />
      </div>
    </div>
  );
};

export default Layout;
