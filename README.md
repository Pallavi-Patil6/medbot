# MedNexus - AI Medical Assistant

MedNexus is a web-based AI medical assistant system designed for small clinics to streamline symptom intake, diagnosis, prescription generation, and medicine recognition from images.

## Features

- Patient symptom intake form
- AI-driven diagnosis and prescription generation
- Medicine image analysis using OCR
- Responsive design for clinic tablets
- Multi-language support (coming soon)

## Tech Stack

### Frontend
- React.js
- Material-UI
- Tesseract.js (OCR)

### Backend
- Flask
- Python
- Scikit-learn
- Tesseract OCR

## Project Structure

```
mednexus/
├── frontend/          # React frontend application
├── backend/           # Flask backend server
├── models/            # AI models and data
└── docs/             # Documentation
```

## Setup Instructions

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## License
MIT 