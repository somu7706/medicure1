import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Pill,
  MapPin,
  ExternalLink,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Medicines = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get latest upload with medicines
        const uploadsRes = await api.get('/uploads?page_size=10');
        const uploads = uploadsRes.data.items || [];

        // Extract medicines from all uploads
        const allMedicines = [];
        uploads.forEach(upload => {
          if (upload.medicines?.length > 0) {
            upload.medicines.forEach(med => {
              if (!allMedicines.find(m => m.name.toLowerCase() === med.name.toLowerCase())) {
                allMedicines.push({
                  ...med,
                  source: upload.filename,
                  uploadId: upload.id
                });
              }
            });
          }
        });
        setMedicines(allMedicines);

        // Get nearby pharmacies if location is set
        if (user?.lat && user?.lng) {
          const pharmacyRes = await api.get('/nearby?type=pharmacy&limit=5');
          setPharmacies(pharmacyRes.data.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch medicines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, user]);

  const onlinePharmacies = [
    { name: '1mg', url: 'https://www.1mg.com', color: 'bg-orange-100 text-orange-700' },
    { name: 'PharmEasy', url: 'https://pharmeasy.in', color: 'bg-green-100 text-green-700' },
    { name: 'Apollo Pharmacy', url: 'https://www.apollopharmacy.in', color: 'bg-blue-100 text-blue-700' },
    { name: 'Netmeds', url: 'https://www.netmeds.com', color: 'bg-teal-100 text-teal-700' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="medicines-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('medicines.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('medicines.subtitle')}</p>
      </div>

      {medicines.length > 0 ? (
        <>
          {/* Medicines List */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Your Medicines ({medicines.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicines.map((medicine, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{medicine.name}</h3>
                        {medicine.dosage && (
                          <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      From: {medicine.source}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nearby Pharmacies */}
          {pharmacies.length > 0 && (
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('medicines.nearbyPharmacies')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pharmacies.map((pharmacy) => (
                    <div key={pharmacy.id} className="p-4 rounded-xl bg-muted/50">
                      <h3 className="font-medium text-foreground">{pharmacy.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(pharmacy.distance / 1000).toFixed(1)} km away
                      </p>
                      {pharmacy.phone && (
                        <a
                          href={`tel:${pharmacy.phone}`}
                          className="text-primary text-sm hover:underline mt-2 inline-block"
                        >
                          {pharmacy.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Online Pharmacies */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>{t('medicines.orderOnline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {onlinePharmacies.map((pharmacy) => (
                  <a
                    key={pharmacy.name}
                    href={pharmacy.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 rounded-xl ${pharmacy.color} flex items-center justify-between hover:opacity-80 transition-opacity`}
                  >
                    <span className="font-medium">{pharmacy.name}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* No Medicines */
        <Card className="glass-panel border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Pill className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{t('medicines.noMedicines')}</h3>
            <p className="text-muted-foreground mb-4">{t('medicines.uploadPrescription')}</p>
            <Link to="/upload">
              <Button className="rounded-full" data-testid="upload-prescription-btn">
                <Upload className="h-4 w-4 mr-2" />
                Upload Prescription
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Always verify medicine availability and dosage with your pharmacist. Never change your medication without consulting your doctor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Medicines;
