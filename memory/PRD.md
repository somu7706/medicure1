# VitalWave (MediGuide) - Product Requirements Document

## Overview
VitalWave is a premium healthcare platform that provides AI-powered medical assistance, document analysis, doctor discovery, and nearby care finding with multilingual support.

## User Personas
1. **Patients**: Individuals seeking health guidance and wanting to understand their medical reports
2. **Chronic Condition Managers**: People managing long-term health conditions who need regular monitoring
3. **Healthcare Seekers**: Users looking for nearby hospitals, clinics, and pharmacies
4. **Multilingual Users**: Non-English speakers who prefer health information in Hindi or Telugu

## Core Requirements (Static)
- AI-powered medical chatbot (medical-only queries)
- Voice input/output (STT/TTS)
- Medical document analysis (OCR + AI)
- Doctor discovery with direct calling and feedback
- Nearby care finder with Leaflet maps
- Route directions to healthcare facilities
- Multilingual support (EN/HI/TE)
- JWT authentication with refresh tokens
- Conditional "My Health" section visibility

## What's Been Implemented (Jan 2025)

### Backend (FastAPI + MongoDB)
- [x] User authentication (register, login, refresh, logout)
- [x] User profile management with location
- [x] Document upload (file, text, link)
- [x] OCR pipeline (pytesseract + pdf2image)
- [x] Document classification (prescription, lab_report, xray, wound, discharge)
- [x] AI-powered document analysis (GPT-5.2 via Emergent LLM Key)
- [x] Medical chatbot with context binding
- [x] Medical-only query filtering
- [x] Doctors CRUD with feedback ranking
- [x] Nearby places API (Overpass API for OSM data)
- [x] Route directions (OSRM)
- [x] My Health endpoints (stage, care-plan, precautions, lifestyle)
- [x] Voice STT (faster-whisper)
- [x] Voice TTS (edge-tts)
- [x] 20 seeded doctors with specialties

### Frontend (React + TailwindCSS + shadcn/ui)
- [x] VitalWave splash screen (once per session)
- [x] Landing page with branding
- [x] Login/Register with location setup
- [x] Dashboard with health overview
- [x] Upload Center (file, camera, text, link)
- [x] AI Assistant with voice support
- [x] Find Doctors with search/filters
- [x] Doctor Profile with feedback
- [x] Nearby Care with Leaflet map
- [x] Medicines page
- [x] History page
- [x] Help & Safety page
- [x] Settings page
- [x] My Health pages (conditional visibility)
- [x] i18n (EN/HI/TE complete)
- [x] Theme system (light/dark/system)
- [x] Premium UI design (glass panels, ECG pattern)

## Prioritized Backlog

### P0 (Critical) - Completed
- [x] Core authentication flow
- [x] Document upload and analysis
- [x] AI chatbot with medical filtering
- [x] Doctor discovery and calling
- [x] Nearby care with maps

### P1 (High Priority) - Pending
- [ ] Image vision analysis (GPT-4o Vision) for X-rays/wounds
- [ ] Push notifications for reminders
- [ ] Chat history persistence across sessions
- [ ] Doctor appointment booking

### P2 (Medium Priority) - Pending
- [ ] Health data export
- [ ] Account deletion workflow
- [ ] More granular doctor search filters
- [ ] Pharmacy medicine ordering integration

### P3 (Low Priority) - Future
- [ ] Wearable device integration
- [ ] Family member profiles
- [ ] Telemedicine video calls
- [ ] Insurance claim assistance

## Next Tasks
1. Implement GPT-4o Vision for medical image analysis
2. Add push notification support
3. Implement proper chat history with pagination
4. Add doctor appointment booking flow
5. Enhance medicine availability with real pharmacy APIs
