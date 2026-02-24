import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Phone
} from 'lucide-react';
import { Button } from '../components/ui/button';

const Precautions = () => {
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
        const response = await api.get('/myhealth/precautions');
        setData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch precautions:', err);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="precautions-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('myHealth.precautionsTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('myHealth.precautionsSubtitle')}</p>
      </div>

      {/* Do's and Don'ts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Do's */}
        <Card className="glass-panel border-border/50 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              {t('myHealth.doTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data?.precautions?.do?.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Don'ts */}
        <Card className="glass-panel border-border/50 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              {t('myHealth.dontTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data?.precautions?.avoid?.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Warning Signs */}
      <Card className="glass-panel border-border/50 border-2 border-amber-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            {t('myHealth.warningSignsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Seek immediate medical attention if you experience any of the following:
          </p>
          <ul className="space-y-3">
            {data?.precautions?.warning_signs?.map((sign, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{sign}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Emergency Action */}
      <Card className="glass-panel border-border/50 bg-red-50 dark:bg-red-900/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Phone className="h-7 w-7 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Emergency Help</h3>
                <p className="text-sm text-muted-foreground">Always keep emergency contacts ready</p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => window.location.href = 'tel:108'}
              data-testid="call-emergency"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call 108
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            These precautions are general guidelines based on your health data. Always follow your doctor's specific advice and instructions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Precautions;
