import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Star,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  MessageSquare,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const DoctorProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Feedback form state
  const [stars, setStars] = useState(5);
  const [wasHelpful, setWasHelpful] = useState(true);
  const [accuracy, setAccuracy] = useState([7]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const [doctorRes, feedbackRes] = await Promise.all([
          api.get(`/doctors/${id}`),
          api.get(`/doctors/${id}/feedback`)
        ]);
        setDoctor(doctorRes.data.data);
        setFeedback(feedbackRes.data.items || []);
      } catch (err) {
        console.error('Failed to fetch doctor:', err);
        toast.error('Doctor not found');
        navigate('/doctors');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [api, id, navigate]);

  const handleCall = () => {
    if (doctor?.phone) {
      window.location.href = `tel:${doctor.phone}`;
      toast.success(`Calling ${doctor.name}...`);
    }
  };

  const submitFeedback = async () => {
    setSubmitting(true);
    try {
      await api.post(`/doctors/${id}/feedback`, {
        stars,
        was_helpful: wasHelpful,
        accuracy: accuracy[0],
        comment: comment.trim() || null
      });

      // Refresh feedback
      const feedbackRes = await api.get(`/doctors/${id}/feedback`);
      setFeedback(feedbackRes.data.items || []);

      // Refresh doctor to get updated rating
      const doctorRes = await api.get(`/doctors/${id}`);
      setDoctor(doctorRes.data.data);

      setFeedbackOpen(false);
      toast.success('Feedback submitted!');

      // Reset form
      setStars(5);
      setWasHelpful(true);
      setAccuracy([7]);
      setComment('');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="doctor-profile">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/doctors')}
        className="mb-4"
        data-testid="back-btn"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>

      {/* Doctor Card */}
      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="h-32 w-32 rounded-2xl mx-auto sm:mx-0">
              <AvatarImage src={doctor.image} alt={doctor.name} />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-3xl">
                {doctor.name ? doctor.name.split(' ').map(n => n[0]).join('') : 'DR'}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground">{doctor.name}</h1>
              <p className="text-primary font-medium">{doctor.specialty}</p>

              {/* Rating */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {doctor.avg_rating?.toFixed(1) || '4.5'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({doctor.review_count || 0} {t('doctors.reviews')})
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {doctor.experience_years || 10} {t('doctors.experience')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {doctor.hospital}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button className="rounded-full flex-1" data-testid="call-doctor" asChild>
                  <a href={`tel:${doctor.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    {t('doctors.callNow')}
                  </a>
                </Button>
                <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-full flex-1" data-testid="leave-feedback">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t('doctors.feedback')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Leave Feedback for {doctor.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      {/* Star Rating */}
                      <div>
                        <Label>Rating</Label>
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setStars(star)}
                              className="p-1"
                              data-testid={`star-${star}`}
                            >
                              <Star
                                className={`h-8 w-8 ${star <= stars
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-muted-foreground'
                                  }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Was Helpful */}
                      <div className="flex items-center justify-between">
                        <Label>Was the advice helpful?</Label>
                        <Switch
                          checked={wasHelpful}
                          onCheckedChange={setWasHelpful}
                          data-testid="helpful-switch"
                        />
                      </div>

                      {/* Accuracy Slider */}
                      <div>
                        <Label>Accuracy (1-10): {accuracy[0]}</Label>
                        <Slider
                          value={accuracy}
                          onValueChange={setAccuracy}
                          max={10}
                          min={1}
                          step={1}
                          className="mt-2"
                          data-testid="accuracy-slider"
                        />
                      </div>

                      {/* Comment */}
                      <div>
                        <Label>Comment (optional)</Label>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Share your experience..."
                          className="mt-2"
                          data-testid="feedback-comment"
                        />
                      </div>

                      <Button
                        onClick={submitFeedback}
                        disabled={submitting}
                        className="w-full rounded-full"
                        data-testid="submit-feedback"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Feedback'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions Treated */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>{t('doctors.conditions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {doctor.conditions?.map((condition, i) => (
              <Badge key={i} variant="secondary" className="px-3 py-1">
                {condition}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>{t('doctors.reviews')} ({feedback.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length > 0 ? (
            <div className="space-y-4">
              {feedback.map((review) => (
                <div key={review.id} className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.user_name}</span>
                      {review.was_helpful && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Helpful
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.stars
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-muted-foreground'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No reviews yet. Be the first to leave feedback!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorProfile;
