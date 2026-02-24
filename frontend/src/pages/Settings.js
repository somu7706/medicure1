import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Separator } from '../components/ui/separator';
import {
  User,
  Palette,
  Globe,
  MapPin,
  Shield,
  Save,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser, setLocation, api } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [locationQuery, setLocationQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  // New features state
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Forgot Password flow state
  const [resetState, setResetState] = useState('default'); // 'default', 'verifying', 'resetting'
  const [resetCode, setResetCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Emergency States
  const [medicalInfo, setMedicalInfo] = useState({
    blood_group: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: ''
  });
  const [contacts, setContacts] = useState([]);
  const [loadingEmergency, setLoadingEmergency] = useState(true);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });

  const fetchEmergencyData = React.useCallback(async () => {
    try {
      const infoResp = await api.get('/me/medical-info');
      if (infoResp.data.data) setMedicalInfo(infoResp.data.data);

      const contactsResp = await api.get('/me/emergency-contacts');
      setContacts(contactsResp.data.data || []);
    } catch (err) {
      console.error("Failed to fetch emergency data", err);
    } finally {
      setLoadingEmergency(false);
    }
  }, [api]);

  useEffect(() => {
    fetchEmergencyData();
  }, [fetchEmergencyData]);

  const handleSaveMedicalInfo = async () => {
    setSavingEmergency(true);
    try {
      await api.put('/me/medical-info', medicalInfo);
      toast.success('Medical info updated');
    } catch (err) {
      toast.error('Failed to update medical info');
    } finally {
      setSavingEmergency(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Name and phone are required');
      return;
    }
    setSavingEmergency(true);
    try {
      const resp = await api.post('/me/emergency-contacts', newContact);
      setContacts([...contacts, resp.data.data]);
      setNewContact({ name: '', relationship: '', phone: '' });
      toast.success('Contact added');
    } catch (err) {
      toast.error('Failed to add contact');
    } finally {
      setSavingEmergency(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await api.delete(`/me/emergency-contacts/${contactId}`);
      setContacts(contacts.filter(c => c.id !== contactId));
      toast.success('Contact deleted');
    } catch (err) {
      toast.error('Failed to delete contact');
    }
  };

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      await updateUser({ name: name.trim() });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    try {
      await updateUser({ preferred_language: lang });
    } catch (err) {
      console.error('Failed to save language preference');
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await updateUser({ theme: newTheme });
    } catch (err) {
      console.error('Failed to save theme preference');
    }
  };

  const handleLocationUpdate = async () => {
    if (!locationQuery.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setSavingLocation(true);
    try {
      await setLocation('manual', { query: locationQuery });
      setLocationQuery('');
      toast.success('Location updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update location');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleAutoLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setSavingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await setLocation('auto', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('Location updated');
        } catch (err) {
          toast.error('Failed to update location');
        } finally {
          setSavingLocation(false);
        }
      },
      () => {
        setSavingLocation(false);
        toast.error('Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };


  const isUsernameValid = newUsername.length >= 4 && !newUsername.includes(' ') && /^[a-zA-Z0-9_]+$/.test(newUsername);

  const handleSaveUsername = async () => {
    setUsernameError('');
    setSavingUsername(true);
    try {
      const response = await api.patch('/user/username', { username: newUsername });
      await updateUser({ username: newUsername });
      setEditingUsername(false);
      toast.success(response.data.message || 'Username updated');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update username';
      setUsernameError(msg);
      toast.error(msg);
    } finally {
      setSavingUsername(false);
    }
  };

  const passwordRules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    different: newPassword !== currentPassword,
    match: newPassword === confirmPassword && newPassword !== ''
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean) && currentPassword.length > 0;

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    setPasswordError('');
    setSavingPassword(true);
    try {
      const response = await api.post('/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(response.data.message || 'Password changed successfully');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change password';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    setPasswordError('');
    setResendingCode(true);
    try {
      await api.post('/auth/forgot-password', { email: user?.email });
      setResetState('verifying');
      setResendTimer(60);
      toast.success('Verification code sent');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to send code';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setResendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setPasswordError('');
    setVerifyingCode(true);
    try {
      await api.post('/auth/verify-reset-code', { email: user?.email, code: resetCode });
      setResetState('resetting');
      toast.success('Code verified successfully');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid or expired code';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setPasswordError('');
    setSavingPassword(true);
    try {
      await api.post('/auth/reset-password', {
        email: user?.email,
        code: resetCode,
        new_password: newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetCode('');
      setResetState('default');
      toast.success('Password updated successfully');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset password';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="settings-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="rounded-full"
            data-testid="save-profile"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Sections */}
      <div className="space-y-6">
        <Card className="glass-panel border-red-100 dark:border-red-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {t('emergency.medicalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_group">{t('emergency.bloodGroup')}</Label>
                <Input
                  id="blood_group"
                  value={medicalInfo.blood_group}
                  onChange={e => setMedicalInfo({ ...medicalInfo, blood_group: e.target.value })}
                  placeholder="e.g. O+"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">{t('emergency.allergies')}</Label>
                <Input
                  id="allergies"
                  value={medicalInfo.allergies}
                  onChange={e => setMedicalInfo({ ...medicalInfo, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Peanuts"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">{t('emergency.conditions')}</Label>
              <Input
                id="conditions"
                value={medicalInfo.chronic_conditions}
                onChange={e => setMedicalInfo({ ...medicalInfo, chronic_conditions: e.target.value })}
                placeholder="e.g. Diabetes, Hypertension"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">{t('emergency.medications')}</Label>
              <Input
                id="medications"
                value={medicalInfo.current_medications}
                onChange={e => setMedicalInfo({ ...medicalInfo, current_medications: e.target.value })}
                placeholder="e.g. Metformin 500mg"
              />
            </div>
            <Button
              className="w-full rounded-full bg-red-600 hover:bg-red-700"
              onClick={handleSaveMedicalInfo}
              disabled={savingEmergency}
            >
              {savingEmergency ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {t('emergency.saveInfo')}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* List Contacts */}
            <div className="space-y-3">
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.relationship} • {contact.phone}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">{t('emergency.noContacts')}</p>
              )}
            </div>

            <Separator />

            {/* Add Contact Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Add New Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Name"
                  value={newContact.name}
                  onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                />
                <Input
                  placeholder="Relationship"
                  value={newContact.relationship}
                  onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={newContact.phone}
                  onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={handleAddContact}
                disabled={savingEmergency}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('emergency.addContact')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Profile Section */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex gap-2">
              {editingUsername ? (
                <div className="flex-1 space-y-2">
                  <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    className={usernameError ? 'border-destructive' : ''}
                  />
                  {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveUsername}
                      disabled={!isUsernameValid || savingUsername}
                      className="rounded-full"
                    >
                      {savingUsername ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingUsername(false);
                        setNewUsername(user?.username || '');
                        setUsernameError('');
                      }}
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-1 p-3 rounded-xl bg-muted/50">
                  <span className="font-medium text-foreground">{user?.username || 'Not set'}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingUsername(true)}
                    className="rounded-full transition-all hover:bg-primary hover:text-primary-foreground"
                  >
                    Edit Username
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Min 4 characters, no spaces, letters, numbers, underscores only</p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className={resetState !== 'default' ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={resetState !== 'default'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetState === 'default' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {resetState !== 'default' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-muted/50 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-2">Enter the verification code sent to your email</p>
                    <div className="flex gap-2">
                      <Input
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit code"
                        className="font-mono text-center tracking-widest"
                        disabled={resetState === 'resetting'}
                      />
                      {resetState === 'verifying' && (
                        <Button
                          size="sm"
                          onClick={handleVerifyCode}
                          disabled={resetCode.length !== 6 || verifyingCode}
                        >
                          {verifyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                        </Button>
                      )}
                    </div>
                    {resetState === 'verifying' && (
                      <div className="mt-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleForgotPassword}
                          disabled={resendTimer > 0 || resendingCode}
                          className="h-auto p-0 text-xs text-primary font-normal hover:bg-transparent"
                        >
                          {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className={`flex items-center gap-1 text-xs ${passwordRules.length ? 'text-success-signal' : 'text-muted-foreground'}`}>
                    {passwordRules.length ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    8+ characters
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${passwordRules.upper ? 'text-success-signal' : 'text-muted-foreground'}`}>
                    {passwordRules.upper ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${passwordRules.number ? 'text-success-signal' : 'text-muted-foreground'}`}>
                    {passwordRules.number ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    At least one number
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${passwordRules.special ? 'text-success-signal' : 'text-muted-foreground'}`}>
                    {passwordRules.special ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Special character
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${passwordRules.different ? 'text-success-signal' : 'text-muted-foreground'}`}>
                    {passwordRules.different ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Different from current
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                {!passwordRules.match && confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              {passwordError && <p className="text-sm text-destructive mt-2">{passwordError}</p>}

              <Button
                onClick={resetState === 'resetting' ? handleResetPassword : handleChangePassword}
                disabled={!isPasswordValid || savingPassword || resetState === 'verifying'}
                className="w-full rounded-full"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {resetState === 'resetting' ? 'Reset Password' : 'Change Password'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Section */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            {t('settings.theme')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="light" id="light" className="peer sr-only" />
              <Label
                htmlFor="light"
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-muted bg-background hover:bg-muted/50 peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                data-testid="theme-light-option"
              >
                <Sun className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">{t('settings.light')}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
              <Label
                htmlFor="dark"
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-muted bg-background hover:bg-muted/50 peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                data-testid="theme-dark-option"
              >
                <Moon className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">{t('settings.dark')}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="system" id="system" className="peer sr-only" />
              <Label
                htmlFor="system"
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-muted bg-background hover:bg-muted/50 peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                data-testid="theme-system-option"
              >
                <Monitor className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">{t('settings.system')}</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger data-testid="language-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
              <SelectItem value="te">తెలుగు</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Location Section */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t('settings.location')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.location_label && (
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground">Current Location</p>
              <p className="font-medium">{user.location_label}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Enter city, pincode, or address"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              data-testid="location-input"
            />
            <Button
              onClick={handleLocationUpdate}
              disabled={savingLocation}
              data-testid="update-location"
            >
              {savingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleAutoLocation}
            disabled={savingLocation}
            className="w-full"
            data-testid="auto-detect-location"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Auto-detect Location
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Section */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('settings.privacy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Your health data is encrypted and stored securely. We never share your information without your explicit consent.
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Export</p>
              <p className="text-sm text-muted-foreground">Download all your data</p>
            </div>
            <Button variant="outline" size="sm" data-testid="export-data">
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account</p>
            </div>
            <Button variant="destructive" size="sm" data-testid="delete-account">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
