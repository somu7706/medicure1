import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Upload,
  Stethoscope,
  MapPin,
  MessageSquare,
  FileText,
  Activity,
  Calendar,
  ChevronRight,
  Heart,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, api } = useAuth();
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentUploads = async () => {
      try {
        const response = await api.get('/uploads?page_size=5');
        setRecentUploads(response.data.items || []);
      } catch (err) {
        console.error('Failed to fetch uploads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentUploads();
  }, [api]);

  const quickActions = [
    { icon: Upload, label: t('dashboard.uploadReport'), path: '/upload', color: 'bg-blue-500/10 text-blue-500' },
    { icon: Stethoscope, label: t('dashboard.findDoctor'), path: '/doctors', color: 'bg-emerald-500/10 text-emerald-500' },
    { icon: MapPin, label: t('dashboard.nearbyHospital'), path: '/nearby', color: 'bg-amber-500/10 text-amber-500' },
    { icon: MessageSquare, label: t('dashboard.askAI'), path: '/assistant', color: 'bg-purple-500/10 text-purple-500' },
    { icon: Stethoscope, label: 'Symptom Checker', path: '/symptoms', color: 'bg-red-500/10 text-red-500' },
  ];

  const getDocTypeColor = (type) => {
    const colors = {
      prescription: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      lab_report: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      xray: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      wound: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      discharge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    };
    return colors[type] || colors.unknown;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.welcome')}, {user?.name ? user.name.split(' ')[0] : 'User'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.location_label || 'Set your location for personalized care'}
          </p>
        </div>
        <Link to="/upload">
          <Button className="rounded-full" data-testid="dashboard-upload-btn">
            <Upload className="h-4 w-4 mr-2" />
            {t('dashboard.uploadReport')}
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link to={action.path} key={index}>
            <Card className="glass-panel border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Overview */}
        <Card className="lg:col-span-2 glass-panel border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {t('dashboard.healthOverview')}
              </CardTitle>
              <CardDescription>Your recent health activity</CardDescription>
            </div>
            {user?.has_uploads && (
              <Link to="/stage">
                <Button variant="ghost" size="sm" className="text-primary">
                  View Details <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {user?.has_uploads ? (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <FileText className="h-5 w-5" />
                    <span className="text-2xl font-bold">{recentUploads.length}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <Activity className="h-5 w-5" />
                    <span className="text-2xl font-bold">Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Health Status</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-2xl font-bold">Good</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">{t('dashboard.noUploads')}</p>
                <p className="text-sm text-muted-foreground mb-4">{t('dashboard.startUploading')}</p>
                <Link to="/upload">
                  <Button className="rounded-full" data-testid="start-uploading-btn">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('dashboard.uploadReport')}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('dashboard.recentUploads')}</CardTitle>
            {recentUploads.length > 0 && (
              <Link to="/history">
                <Button variant="ghost" size="sm" className="text-primary text-xs">
                  {t('common.seeAll')}
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 shimmer rounded-xl" />
                ))}
              </div>
            ) : recentUploads.length > 0 ? (
              <div className="space-y-3">
                {recentUploads.map((upload) => (
                  <Link
                    to={`/history`}
                    key={upload.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{upload.filename}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={`text-xs ${getDocTypeColor(upload.doc_type)}`}>
                          {upload.doc_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(upload.created_at)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('dashboard.noUploads')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Prompt */}
      <Card className="glass-panel border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Have a health question?</h3>
              <p className="text-sm text-muted-foreground">Our AI assistant is here to help 24/7</p>
            </div>
          </div>
          <Link to="/assistant">
            <Button className="rounded-full" data-testid="ask-ai-btn">
              {t('dashboard.askAI')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
