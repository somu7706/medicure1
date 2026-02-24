import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Phone, MapPin, Users, Heart, AlertTriangle, ChevronRight, Navigation, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Emergency = () => {
    const { t } = useTranslation();
    const { api, user } = useAuth();
    const navigate = useNavigate();

    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [medicalInfo, setMedicalInfo] = useState({});
    const [contacts, setContacts] = useState([]);
    const [triggeringSOS, setTriggeringSOS] = useState(false);
    const [aiGuidance, setAiGuidance] = useState(null);

    const fetchEmergencyData = React.useCallback(async () => {
        try {
            // Fetch nearby hospitals
            setLoadingHospitals(true);
            const hospitalResp = await api.get('/nearby?type=hospital&radius=5000&limit=3');
            setHospitals(hospitalResp.data?.items || []);

            // Fetch medical info and contacts
            const infoResp = await api.get('/me/medical-info');
            setMedicalInfo(infoResp.data?.data || {});

            const contactsResp = await api.get('/me/emergency-contacts');
            setContacts(contactsResp.data?.data || []);
        } catch (err) {
            console.error("Error fetching emergency data:", err);
        } finally {
            setLoadingHospitals(false);
        }
    }, [api]);

    useEffect(() => {
        fetchEmergencyData();
    }, [fetchEmergencyData]);

    const handleSOS = async () => {
        if (!window.confirm(t('emergency.sosConfirm'))) return;

        setTriggeringSOS(true);
        try {
            await api.post('/emergency/sos', {
                lat: user?.lat,
                lng: user?.lng,
                message: "Emergency triggered from app dashboard"
            });
            toast.success(t('emergency.sosSuccess'));
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to trigger SOS");
        } finally {
            setTriggeringSOS(false);
        }
    };

    const emergencyGuides = [
        { id: 'heart', title: 'Heart Attack', icon: Heart, color: 'text-red-500' },
        { id: 'stroke', title: 'Stroke', icon: AlertTriangle, color: 'text-amber-500' },
        { id: 'bleeding', title: 'Severe Bleeding', icon: AlertTriangle, color: 'text-red-600' },
        { id: 'breathing', title: 'Breathing Difficulty', icon: AlertTriangle, color: 'text-blue-500' }
    ];

    const getAiGuidance = async (issue) => {
        setAiGuidance({ loading: true, title: issue });
        try {
            const response = await api.post('/chat', {
                message: `EMERGENCY: Give immediate, concise first-aid steps for ${issue}. Formatted as bullet points. Max 5 points.`
            });
            setAiGuidance({ loading: false, title: issue, content: response.data.response });
        } catch (err) {
            setAiGuidance(null);
            toast.error("Failed to get AI guidance");
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6 pb-24">
            <div className="flex flex-col items-center text-center space-y-2 pt-4">
                <h1 className="text-3xl font-bold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-8 w-8" />
                    {t('emergency.title')}
                </h1>
                <p className="text-muted-foreground">{t('emergency.subtitle')}</p>
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    variant="destructive"
                    className="h-24 text-2xl font-bold rounded-2xl shadow-lg border-4 border-white/10 flex items-center justify-center gap-4 pulse-animation"
                    onClick={() => window.open('tel:112')}
                >
                    <Phone className="h-8 w-8 fill-current" />
                    {t('emergency.call112')}
                </Button>

                <Button
                    variant="outline"
                    className="h-24 text-2xl font-bold rounded-2xl shadow-lg border-2 border-red-500 text-red-600 dark:text-red-400 flex items-center justify-center gap-4"
                    onClick={handleSOS}
                    disabled={triggeringSOS}
                >
                    {triggeringSOS ? <Loader2 className="h-8 w-8 animate-spin" /> : <Users className="h-8 w-8" />}
                    {t('emergency.notifyContacts')}
                </Button>
            </div>

            {/* Nearest Hospitals */}
            <Card className="border-red-100 dark:border-red-900/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-500" />
                        {t('emergency.nearbyHospital')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingHospitals ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : hospitals.length > 0 ? (
                        hospitals.map((hosp) => (
                            <div key={hosp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                <div>
                                    <h3 className="font-semibold">{hosp.name}</h3>
                                    <p className="text-sm text-muted-foreground">{hosp.distance}m • {hosp.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => window.open(`tel:${hosp.phone}`)}>
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button variant="primary" size="icon" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`)}>
                                        <Navigation className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-4">No hospitals found nearby.</p>
                    )}
                </CardContent>
            </Card>

            {/* Medical Safety Info */}
            <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500 fill-current" />
                        {t('emergency.medicalInfo')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-background rounded-xl border">
                            <p className="text-xs text-muted-foreground uppercase">{t('emergency.bloodGroup')}</p>
                            <p className="text-lg font-bold text-red-600">{medicalInfo.blood_group || 'Not Set'}</p>
                        </div>
                        <div className="p-3 bg-background rounded-xl border">
                            <p className="text-xs text-muted-foreground uppercase">{t('emergency.allergies')}</p>
                            <p className="font-medium">{medicalInfo.allergies || 'None Reported'}</p>
                        </div>
                        <div className="col-span-2 p-3 bg-background rounded-xl border">
                            <p className="text-xs text-muted-foreground uppercase">{t('emergency.conditions')}</p>
                            <p className="font-medium">{medicalInfo.chronic_conditions || 'None'}</p>
                        </div>
                        <div className="col-span-2 p-3 bg-background rounded-xl border">
                            <p className="text-xs text-muted-foreground uppercase">{t('emergency.medications')}</p>
                            <p className="font-medium">{medicalInfo.current_medications || 'None'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Emergency Guidance */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    {t('emergency.aiGuidance')}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    {emergencyGuides.map((guide) => (
                        <Button
                            key={guide.id}
                            variant="outline"
                            className="h-16 justify-between px-4 border-primary/20 hover:border-primary"
                            onClick={() => getAiGuidance(guide.title)}
                        >
                            <div className="flex items-center gap-3">
                                <guide.icon className={`h-5 w-5 ${guide.color}`} />
                                <span>{guide.title}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-50" />
                        </Button>
                    ))}
                </div>
            </section>

            {/* AI Guidance Content */}
            {aiGuidance && (
                <Card className="border-primary animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader className="bg-primary/5 pb-2">
                        <CardTitle className="text-lg">{t('emergency.firstAidTitle')}: {aiGuidance.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {aiGuidance.loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                        ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {aiGuidance.content?.split('\n').map((line, i) => (
                                    <p key={i} className="mb-2 leading-relaxed">{line}</p>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <p className="text-[10px] text-center text-muted-foreground pt-4 leading-tight italic">
                {t('emergency.disclaimer')}
            </p>
        </div>
    );
};

export default Emergency;
