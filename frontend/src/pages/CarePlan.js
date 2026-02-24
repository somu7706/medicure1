import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  ClipboardList,
  Calendar,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Pill,
  Activity
} from 'lucide-react';

const CarePlan = () => {
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
        const response = await api.get('/myhealth/care-plan');
        setData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch care plan:', err);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="care-plan-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('myHealth.carePlanTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('myHealth.carePlanSubtitle')}</p>
      </div>

      {/* Medications */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data?.care_plan?.medications?.map((med, index) => (
              <Badge key={index} variant="secondary" className="px-4 py-2">
                {med}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monitoring */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data?.care_plan?.monitoring?.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Lifestyle Changes */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Lifestyle Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data?.care_plan?.lifestyle_changes?.map((change, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-foreground">{change}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Follow-up */}
      <Card className="glass-panel border-border/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Follow-up Recommendation</p>
              <p className="text-lg font-semibold text-foreground">{data?.care_plan?.follow_up}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            This care plan is generated based on your uploaded documents and is for guidance only. Always follow your doctor's specific instructions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CarePlan;
