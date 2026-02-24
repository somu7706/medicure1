import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
    Stethoscope,
    Search,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Loader2,
    AlertTriangle,
    Info
} from 'lucide-react';
import { toast } from 'sonner';

const commonSymptoms = [
    "Fever", "Cough", "Cold", "Headache", "Fatigue",
    "Sore Throat", "Body Ache", "Shortness of Breath",
    "Loss of Taste/Smell", "Nausea", "Vomiting", "Diarrhea",
    "Abdominal Pain", "Chest Pain", "Dizziness", "Skin Rash",
    "Joint Pain", "Muscle Weakness", "Blurred Vision", "Insomnia"
];

const SymptomChecker = () => {
    const { t } = useTranslation();
    const { api } = useAuth();
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [otherSymptoms, setOtherSymptoms] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const toggleSymptom = (symptom) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom)
                ? prev.filter(s => s !== symptom)
                : [...prev, symptom]
        );
    };

    const handleAnalyze = async () => {
        if (selectedSymptoms.length === 0 && !otherSymptoms.trim()) {
            toast.error(t('common.error') || 'Please select or enter at least one symptom');
            return;
        }

        setAnalyzing(true);
        setResult(null);
        try {
            const currentLang = t('symptomChecker.title') === 'లక్షణాల తనిఖీ' ? 'te' : (t('symptomChecker.title') === 'लक्षण जाँचकर्ता' ? 'hi' : 'en');
            // Better way is to use i18n object but let's stick to simple logic or use i18n instance if available
            // Actually I should check if I can import i18n

            const response = await api.post('/analyze-symptoms', {
                selected_symptoms: selectedSymptoms,
                other_symptoms: otherSymptoms,
                language: localStorage.getItem('language') || 'en'
            });

            if (response.data.error) {
                toast.error(response.data.error);
            } else {
                setResult(response.data);
                toast.success(t('upload.success') || 'Analysis complete');
            }
        } catch (err) {
            console.error('Symptom Analysis Error:', err);
            toast.error(t('common.error') || 'Failed to analyze symptoms. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const resetButton = () => {
        setSelectedSymptoms([]);
        setOtherSymptoms('');
        setResult(null);
    };



    const getConfidenceLevel = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return 100;
            case 'medium': return 65;
            case 'low': return 35;
            default: return 0;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Stethoscope className="h-8 w-8 text-primary" />
                        {t('symptomChecker.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t('symptomChecker.subtitle')}</p>
                </div>
                {result && (
                    <Button variant="outline" onClick={resetButton} className="rounded-full">
                        {t('symptomChecker.resetBtn')}
                    </Button>
                )}
            </div>

            {!result ? (
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Symptom Selection */}
                    <Card className="md:col-span-2 glass-panel border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Search className="h-5 w-5 text-primary" />
                                {t('symptomChecker.selectSymptoms')}
                            </CardTitle>
                            <CardDescription>{t('symptomChecker.selectSymptomsDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {commonSymptoms.map((symptom) => (
                                    <div
                                        key={symptom}
                                        className={`flex items-center space-x-2 p-3 rounded-xl border transition-all cursor-pointer ${selectedSymptoms.includes(symptom)
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-muted/30 border-transparent hover:border-border/50'
                                            }`}
                                        onClick={() => toggleSymptom(symptom)}
                                    >
                                        <Checkbox
                                            id={symptom}
                                            checked={selectedSymptoms.includes(symptom)}
                                            onCheckedChange={() => { }} // Handled by div onClick
                                        />
                                        <Label htmlFor={symptom} className="text-sm font-medium cursor-pointer flex-1">
                                            {t(`symptoms.${symptom}`) || symptom}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Other Symptoms */}
                    <div className="space-y-6">
                        <Card className="glass-panel border-border/50">
                            <CardHeader>
                                <CardTitle className="text-lg">{t('symptomChecker.otherSymptoms')}</CardTitle>
                                <CardDescription>{t('symptomChecker.otherSymptomsDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder={t('symptomChecker.placeholder')}
                                    className="min-h-[150px] bg-muted/30"
                                    value={otherSymptoms}
                                    onChange={(e) => setOtherSymptoms(e.target.value)}
                                />
                                <Button
                                    className="w-full rounded-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            {t('symptomChecker.analyzing')}
                                        </>
                                    ) : (
                                        <>
                                            {t('symptomChecker.analyzeBtn')}
                                            <ChevronRight className="h-5 w-5 ml-1" />
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4 flex items-start gap-3">
                                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                    {t('symptomChecker.disclaimer')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* System Message / Triage Advice */}
                    {result.system_message && (
                        <Card className={`overflow-hidden border-${result.system_message.type === 'warning' ? 'amber' : 'blue'}-500 bg-${result.system_message.type === 'warning' ? 'amber' : 'blue'}-500/5`}>
                            <div className={`bg-${result.system_message.type === 'warning' ? 'amber' : 'blue'}-500 p-4 flex items-center gap-3 text-white`}>
                                <AlertTriangle className="h-6 w-6 animate-pulse" />
                                <h3 className="text-lg font-bold">
                                    {result.system_message.type === 'warning' ? 'Attention' : 'Analysis Info'}
                                </h3>
                            </div>
                            <CardContent className="p-6">
                                <p className={`text-${result.system_message.type === 'warning' ? 'amber' : 'blue'}-700 dark:text-${result.system_message.type === 'warning' ? 'amber' : 'blue'}-400 font-medium text-lg mb-2`}>
                                    {result.system_message.text}
                                </p>
                                {/* Only show emergency action if it was a high confidence/critical result - inferred from context or if specifically flagged, but for now system_message is generic. 
                                    We can keep the emergency buttons if confidence is high on any result or just always show find hospital */}
                                <div className="flex flex-wrap gap-4 mt-4">
                                    <Button variant="destructive" onClick={() => window.open('tel:112')} className="rounded-full">
                                        {t('symptomChecker.callEmergency')}
                                    </Button>
                                    <Button variant="outline" className="rounded-full border-blue-200" onClick={() => window.location.href = '/nearby'}>
                                        {t('symptomChecker.findHospital')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Results Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {result.results?.map((pred, index) => (
                            <Card key={index} className="glass-panel border-border/50 flex flex-col h-full relative overflow-hidden group">
                                {/* Confidence Bar */}
                                <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000"
                                        style={{ width: `${getConfidenceLevel(pred.confidence_level)}%` }}
                                    />
                                </div>

                                <CardHeader className="pb-3 pt-6">
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20">
                                            {pred.match_type}
                                        </Badge>
                                        <span className={`text-[10px] uppercase font-bold tracking-widest ${pred.confidence_level === 'High' ? 'text-green-500' : (pred.confidence_level === 'Medium' ? 'text-amber-500' : 'text-slate-500')
                                            }`}>
                                            {pred.confidence_level} Confidence
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{pred.disease_name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    {/* Why This Disease */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('symptomChecker.whyThisDisease')}</p>
                                        <ul className="space-y-1.5">
                                            {pred.why_this_disease?.map((reason, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    {reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Matched Symptoms */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('symptomChecker.matchedSymptoms')}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pred.matched_symptoms?.map((s, i) => (
                                                <Badge key={i} variant="secondary" className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    <div className="pt-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('symptomChecker.nextStep')}</p>
                                        <div className="space-y-2">
                                            {pred.suggestions?.personal?.map((suggest, i) => (
                                                <div key={i} className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary font-medium">
                                                    {suggest}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Symptoms Analyzed (Matched Inputs) */}
                    <Card className="glass-panel border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg">{t('symptomChecker.symptomsAnalyzed')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {result.matched_input_symptoms?.map(s => (
                                    <Badge key={s} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none">
                                        {s}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <p className="text-[10px] text-center text-muted-foreground pt-4 leading-tight italic max-w-2xl mx-auto">
                        {t('symptomChecker.footerDisclaimer')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SymptomChecker;
