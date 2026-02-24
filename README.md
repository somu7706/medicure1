# MediCureModel

A comprehensive healthcare platform with an AI assistant, hospital/pharmacy locator, and medical report analysis.

## Project Structure
- `backend/`: FastAPI Python server with Gemini AI integration.
- `frontend/`: React-based web application.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+
- **Python**: v3.10+
- **MongoDB**: Ensure a MongoDB instance is running (local or Atlas).

---

### 🛠️ Backend Setup (FastAPI)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Set up Virtual Environment (Recommended):**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   source venv/bin/activate  # macOS/Linux
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017
   GEMINI_API_KEY=your_api_key_here
   JWT_SECRET=your_secret_key
   ```

5. **Run the Server:**
   ```bash
   python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   ```
   The API will be available at [http://localhost:8000](http://localhost:8000).

---

### 💻 Frontend Setup (React)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the `frontend/` directory:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8000
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id
   ```

4. **Run the Application:**
   ```bash
   npm start
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000) (or the next available port).

---

### ☁️ Netlify Backend (Dev Server)

To run the frontend with Netlify features (functions, redirects, etc.) locally:

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Run Netlify Dev:**
   ```bash
   npx netlify dev
   ```
   This will typically start the server at [http://localhost:8888](http://localhost:8888).

---

## 🛠️ Troubleshooting

### Gemini AI "unexpected keyword argument 'system_instruction'"
This occurs due to an outdated `google-generativeai` library.
**Fix:** Ensure you are using version `0.8.6` or higher within your virtual environment:
```bash
pip install google-generativeai==0.8.6
```

### Port Conflicts
If port `8000` or `3000` is busy, you can change them in the respective `.env` files or allow the systems to auto-select an available port.










still error

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Upload as UploadIcon,
  FileText,
  Camera,
  Link as LinkIcon,
  Type,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const Upload = () => {
  const { t } = useTranslation();
  const { api, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('file');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);

  // Form states
  const [files, setFiles] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    const validFiles = droppedFiles.filter(f =>
      ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'].includes(f.type)
    );
    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      }
    });

    return response.data.data;
  };

  const uploadText = async () => {
    const response = await api.post('/uploads/text', { text: textContent });
    return response.data.data;
  };

  const uploadLink = async () => {
    const response = await api.post('/uploads/link', { url: linkUrl });
    return response.data.data;
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0);
    setResult(null);

    try {
      let uploadResult;

      if (activeTab === 'file' && files.length > 0) {
        // Upload first file (could be extended to handle multiple)
        uploadResult = await uploadFile(files[0]);
      } else if (activeTab === 'text' && textContent.trim()) {
        uploadResult = await uploadText();
      } else if (activeTab === 'link' && linkUrl.trim()) {
        uploadResult = await uploadLink();
      } else {
        toast.error('Please provide content to upload');
        setUploading(false);
        return;
      }

      setResult(uploadResult);
      await refreshUser();
      toast.success(t('upload.success'));
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setTextContent('');
    setLinkUrl('');
    setResult(null);
    setUploadProgress(0);
  };

  const getDocTypeIcon = (type) => {
    const icons = {
      prescription: '💊',
      lab_report: '🧪',
      xray: '📷',
      wound: '🩹',
      discharge: '📋',
      unknown: '📄'
    };
    return icons[type] || icons.unknown;
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6" data-testid="upload-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('upload.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('upload.subtitle')}</p>
        </div>

        {!result ? (
          <>
            {/* Upload Tabs */}
            <Card className="glass-panel border-border/50">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="file" data-testid="tab-file">
                      <FileText className="h-4 w-4 mr-2" />
                      File
                    </TabsTrigger>
                    <TabsTrigger value="camera" data-testid="tab-camera">
                      <Camera className="h-4 w-4 mr-2" />
                      Camera
                    </TabsTrigger>
                    <TabsTrigger value="text" data-testid="tab-text">
                      <Type className="h-4 w-4 mr-2" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="link" data-testid="tab-link">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link
                    </TabsTrigger>
                  </TabsList>

                  {/* File Upload */}
                  <TabsContent value="file" className="mt-0">
                    <div
                      className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onDrop={handleFileDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="file-dropzone"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                      />
                      <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground font-medium">{t('upload.dropzone')}</p>
                      <p className="text-sm text-muted-foreground mt-2">{t('upload.supportedFormats')}</p>
                    </div>

                    {/* Selected Files */}
                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(index)}
                              data-testid={`remove-file-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Camera Capture */}
                  <TabsContent value="camera" className="mt-0">
                    <div
                      className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => cameraInputRef.current?.click()}
                      data-testid="camera-capture"
                    >
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground font-medium">Take a Photo</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Capture prescription, lab report, or medical document
                      </p>
                    </div>

                    {files.length > 0 && (
                      <div className="mt-4">
                        <div className="relative rounded-xl overflow-hidden">
                          <img
                            src={URL.createObjectURL(files[0])}
                            alt="Captured"
                            className="w-full h-48 object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setFiles([])}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Text Input */}
                  <TabsContent value="text" className="mt-0">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">{t('upload.orPaste')}</p>
                      <Textarea
                        placeholder={t('upload.textPlaceholder')}
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="min-h-[200px] resize-none"
                        data-testid="text-input"
                      />
                    </div>
                  </TabsContent>

                  {/* Link Input */}
                  <TabsContent value="link" className="mt-0">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">{t('upload.orLink')}</p>
                      <Input
                        type="url"
                        placeholder={t('upload.linkPlaceholder')}
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        data-testid="link-input"
                        className="h-12"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Progress */}
                {uploading && (
                  <div className="mt-6">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      {t('upload.analyzing')} {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || (
                      activeTab === 'file' && files.length === 0 ||
                      activeTab === 'camera' && files.length === 0 ||
                      activeTab === 'text' && !textContent.trim() ||
                      activeTab === 'link' && !linkUrl.trim()
                    )}
                    className="flex-1 h-12 rounded-full"
                    data-testid="upload-submit"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {t('upload.processing')}
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-5 w-5 mr-2" />
                        {t('upload.uploadBtn')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Results View */
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>{t('upload.success')}</CardTitle>
                  <CardDescription>Your document has been analyzed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <span className="text-3xl">{getDocTypeIcon(result.doc_type)}</span>
                <div>
                  <p className="font-medium">{result.filename}</p>
                  <Badge className="mt-1">{result.doc_type}</Badge>
                </div>
              </div>

              {/* Summary */}
              {result.summary_short?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Summary</h3>
                  <ul className="space-y-2">
                    {result.summary_short.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medicines */}
              {result.medicines?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Medicines Found</h3>
                  <div className="space-y-2">
                    {result.medicines.map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💊</span>
                          <div>
                            <p className="font-medium text-sm">{med.name}</p>
                            {(med.dosage || med.frequency) && (
                              <p className="text-xs text-muted-foreground">
                                {med.dosage} {med.dosage && med.frequency && '•'} {med.frequency}
                              </p>
                            )}
                          </div>
                        </div>
                        {med.duration && (
                          <Badge variant="outline" className="text-[10px]">{med.duration}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Values */}
              {result.lab_values?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Lab Values</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {result.lab_values.map((val, index) => (
                      <div key={index} className="p-3 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground">{val.name}</p>
                        <p className="font-semibold">{val.value} {val.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This analysis is for informational purposes only. Please consult a licensed healthcare professional for medical advice.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 h-12 rounded-full"
                  data-testid="upload-another"
                >
                  Upload Another
                </Button>
                <Button
                  onClick={() => navigate('/history')}
                  className="flex-1 h-12 rounded-full"
                  data-testid="view-history"
                >
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Upload;

change acc to this like what are the connection are from this code pls excete has it is by the given code why beacause it work yesterda



 python -m uvicorn server:app --host 127.0.0.1 --port 8001 --reload



 python -m pip install -r requirements.txt