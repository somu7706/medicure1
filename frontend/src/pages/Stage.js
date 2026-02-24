import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Activity, CheckCircle, Clock, ArrowRight, Loader2 } from 'lucide-react';

const Stage = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.has_uploads) {
      navigate('/upload');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await api.get('/myhealth/stage');
        setData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch stage data:', err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'current':
        return <Activity className="h-6 w-6 text-primary animate-pulse" />;
      case 'upcoming':
        return <Clock className="h-6 w-6 text-muted-foreground" />;
      default:
        return <Clock className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-amber-600 bg-amber-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="stage-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('myHealth.stageTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('myHealth.stageSubtitle')}</p>
      </div>

      {/* Stage Timeline */}
      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* Stages */}
            <div className="space-y-6">
              {data?.stages?.map((stage, index) => (
                <div key={index} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center bg-background border-primary`}>
                    <Activity className="h-6 w-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 p-4 rounded-xl border-2 border-primary bg-primary/5`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-lg">{stage.stage}</h3>
                      <Badge className={getRiskColor(stage.risk_level)}>
                        Risk: {stage.risk_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mt-2">{stage.description}</p>

                    {stage.common_symptoms && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stage.common_symptoms.map((symptom, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-background/50">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disease Context */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>Medical Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Diagnosed Condition</p>
            <h3 className="text-xl font-bold text-primary capitalize">{data?.disease || 'Health Data Processing'}</h3>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          This stage visualization is for informational purposes only and does not constitute a medical diagnosis. Please consult your healthcare provider for accurate assessment.
        </p>
      </div>
    </div>
  );
};

export default Stage;
