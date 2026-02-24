import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
import { Heart, Loader2, Mail, Lock, CheckCircle2, ArrowLeft, Sun, Moon, Monitor, Languages } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
    const { t, i18n } = useTranslation();
    const { forgotPassword, verifyResetCode, resetPassword } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const themeIcons = { light: Sun, dark: Moon, system: Monitor };
    const ThemeIcon = themeIcons[theme];

    const handleRequestCode = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setLoading(true);
        try {
            await forgotPassword(email);
            setStep(2);
            setResendTimer(60);
            toast.success(t('auth.forgotPasswordSubtitle', 'Verification code sent'));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (code.length !== 6) {
            toast.error('Please enter 6-digit code');
            return;
        }

        setLoading(true);
        try {
            await verifyResetCode(email, code);
            setStep(3);
            toast.success('Code verified');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email, code, password);
            toast.success(t('auth.resetSuccess', 'Password reset successfully'));
            navigate('/login');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background ecg-pattern flex items-center justify-center p-4 relative">
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <Heart className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold text-foreground">
                            <span className="text-primary">Vital</span>Wave
                        </span>
                    </Link>
                </div>

                <Card className="glass-panel border-border/50">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-2">
                            {step === 1 && <Mail className="h-10 w-10 text-primary opacity-80" />}
                            {step === 2 && <CheckCircle2 className="h-10 w-10 text-primary opacity-80" />}
                            {step === 3 && <Lock className="h-10 w-10 text-primary opacity-80" />}
                        </div>
                        <CardTitle className="text-2xl">
                            {step === 1 && t('auth.forgotPasswordTitle')}
                            {step === 2 && t('auth.verifyResetCode')}
                            {step === 3 && t('auth.resetPasswordTitle')}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && t('auth.forgotPasswordSubtitle')}
                            {step === 2 && `${t('auth.enterCode')} ${email}`}
                            {step === 3 && t('auth.resetPasswordSubtitle')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 && (
                            <form onSubmit={handleRequestCode} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('auth.email')}</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-12 pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 rounded-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.sendCode')}
                                </Button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyCode} className="space-y-6">
                                <div className="flex flex-col items-center space-y-4">
                                    <InputOTP
                                        maxLength={6}
                                        value={code}
                                        onChange={setCode}
                                        containerClassName="justify-center"
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                        </InputOTPGroup>
                                        <InputOTPGroup>
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>

                                    {resendTimer > 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            {t('auth.resendCodeIn')} {resendTimer}s
                                        </p>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="text-primary h-auto p-0"
                                            onClick={handleRequestCode}
                                        >
                                            {t('auth.resendCode')}
                                        </Button>
                                    )}
                                </div>
                                <Button type="submit" className="w-full h-12 rounded-full" disabled={loading || code.length !== 6}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.verify')}
                                </Button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('auth.newPassword')}</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-12 pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-12 pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 rounded-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.resetPasswordTitle')}
                                </Button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                {t('common.back', 'Back to Login')}
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
