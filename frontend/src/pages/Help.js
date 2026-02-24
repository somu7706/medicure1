import React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import {
  Phone,
  AlertTriangle,
  HelpCircle,
  Shield,
  Heart,
  MessageSquare
} from 'lucide-react';

const Help = () => {
  const { t } = useTranslation();

  const emergencyContacts = [
    { name: 'Emergency Services', number: '112', description: 'Police, Fire, Medical' },
    { name: 'Ambulance', number: '108', description: 'Medical Emergency' },
    { name: 'Women Helpline', number: '181', description: '24/7 Support' },
    { name: 'Child Helpline', number: '1098', description: 'Child in Distress' },
  ];

  const faqs = [
    {
      question: 'How do I upload a medical document?',
      answer: 'Go to the "Upload Reports" section from the sidebar. You can upload files (PDF, JPG, PNG), capture photos with your camera, paste text, or enter a link to your document.'
    },
    {
      question: 'Is my medical data secure?',
      answer: 'Yes, your data is encrypted and stored securely. We follow healthcare data protection standards. Your information is never shared without your explicit consent.'
    },
    {
      question: 'Can the AI diagnose my condition?',
      answer: 'No, our AI assistant provides general health information only. It cannot diagnose conditions. Always consult a licensed healthcare professional for medical advice and diagnosis.'
    },
    {
      question: 'How accurate is the document analysis?',
      answer: 'Our AI uses advanced OCR and natural language processing. While accuracy is high for clear documents, always verify extracted information with the original document.'
    },
    {
      question: 'How do I find doctors near me?',
      answer: 'Set your location in settings, then go to "Find Doctors" or "Nearby Care" to see healthcare providers in your area. You can filter by specialty and call directly.'
    },
    {
      question: 'What languages are supported?',
      answer: 'VitalWave supports English, Hindi (हिंदी), and Telugu (తెలుగు). You can change your language in the top navbar or settings.'
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="help-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('help.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('help.subtitle')}</p>
      </div>

      {/* Emergency Card */}
      <Card className="glass-panel border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('help.emergency')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you're experiencing a medical emergency, call emergency services immediately.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {emergencyContacts.map((contact) => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-background hover:bg-muted transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{contact.number}</p>
                  <p className="text-sm text-muted-foreground">{contact.name}</p>
                </div>
              </a>
            ))}
          </div>
          <Button
            variant="destructive"
            className="w-full mt-4 h-12 rounded-full"
            onClick={() => window.location.href = 'tel:112'}
            data-testid="call-emergency"
          >
            <Phone className="h-5 w-5 mr-2" />
            {t('help.callEmergency')}
          </Button>
        </CardContent>
      </Card>

      {/* Safety Guidelines */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Safety Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">Medical Disclaimer</p>
                <p>VitalWave provides health information for awareness purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified healthcare provider.</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                When to Seek Help
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Chest pain or difficulty breathing</li>
                <li>• Sudden severe headache</li>
                <li>• High fever (&gt;103°F)</li>
                <li>• Severe allergic reactions</li>
                <li>• Loss of consciousness</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Stay Safe
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Never share login credentials</li>
                <li>• Keep your location updated</li>
                <li>• Verify doctor credentials</li>
                <li>• Report suspicious activity</li>
                <li>• Keep emergency contacts handy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {t('help.faq')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="glass-panel border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Need more help?</h3>
              <p className="text-sm text-muted-foreground">Our support team is here for you</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full" data-testid="contact-support">
            {t('help.contact')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
