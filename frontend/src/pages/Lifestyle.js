import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
  Apple,
  Dumbbell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Salad,
  Heart
} from 'lucide-react';

const Lifestyle = () => {
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
        const response = await api.get('/myhealth/lifestyle');
        setData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch lifestyle data:', err);
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
    <div className="max-w-3xl mx-auto space-y-6" data-testid="lifestyle-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('myHealth.lifestyleTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('myHealth.lifestyleSubtitle')}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="diet" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="diet" data-testid="diet-tab">
            <Apple className="h-4 w-4 mr-2" />
            {t('myHealth.dietTab')}
          </TabsTrigger>
          <TabsTrigger value="exercise" data-testid="exercise-tab">
            <Dumbbell className="h-4 w-4 mr-2" />
            {t('myHealth.exerciseTab')}
          </TabsTrigger>
        </TabsList>

        {/* Diet Tab */}
        <TabsContent value="diet" className="space-y-6">
          {/* Recommendations */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Salad className="h-5 w-5 text-primary" />
                Diet Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Hydration Advice</p>
                <p className="font-medium text-foreground">{data?.diet?.hydration}</p>
              </div>
            </CardContent>
          </Card>

          {/* Foods Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Foods to Include */}
            <Card className="glass-panel border-border/50 border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-green-600 text-lg">Foods to Include</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data?.diet?.recommended_foods?.map((food, index) => (
                    <Badge key={index} className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {food}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Foods to Limit */}
            <Card className="glass-panel border-border/50 border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-red-600 text-lg">Foods to Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data?.diet?.foods_to_avoid?.map((food, index) => (
                    <Badge key={index} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {food}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Exercise Tab */}
        <TabsContent value="exercise" className="space-y-6">
          {/* Recommendations */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Exercise Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Recommended Sessions</p>
                <p className="font-medium text-foreground">{data?.exercise?.frequency}</p>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Activities */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Recommended Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data?.exercise?.recommended?.map((activity, index) => (
                  <Badge key={index} variant="secondary" className="px-4 py-2">
                    {activity}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Precautions */}
          <Card className="glass-panel border-border/50 bg-amber-50 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Activities to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data?.exercise?.avoid?.map((precaution, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{precaution}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            These lifestyle recommendations are general guidelines. Please consult your doctor before making significant changes to your diet or starting a new exercise program.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Lifestyle;
