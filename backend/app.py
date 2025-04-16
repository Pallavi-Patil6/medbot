from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from diagnose import DiagnosisSystem
import cv2
import numpy as np
import pytesseract
import logging
import os
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Tesseract path for Windows
if sys.platform == 'win32':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = FastAPI()

# Initialize diagnosis system
diagnosis_system = DiagnosisSystem()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class SymptomsRequest(BaseModel):
    symptoms: List[str]

@app.get("/symptoms")
async def get_symptoms():
    """Get list of available symptoms"""
    try:
        symptoms = diagnosis_system.symptom_columns
        return {"symptoms": symptoms}
    except Exception as e:
        logger.error(f"Error getting symptoms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/diagnose")
async def diagnose(request: SymptomsRequest):
    """Get diagnosis based on symptoms"""
    try:
        if not request.symptoms:
            raise HTTPException(status_code=400, detail="No symptoms provided")
        
        result = diagnosis_system.diagnose(request.symptoms)
        return result
    except Exception as e:
        logger.error(f"Error in diagnosis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_medicine")
async def analyze_medicine(file: UploadFile = File(...)):
    """Analyze medicine from image"""
    try:
        logger.info(f"Received medicine analysis request for file: {file.filename}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Please upload an image file")
        
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Could not read image file")
        
        logger.info("Image loaded successfully, starting OCR...")
        
        try:
            # Preprocess image
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            
            # Extract text using OCR
            text = pytesseract.image_to_string(thresh)
            logger.info(f"OCR extracted text: {text}")
            
            # Clean and process text
            text = text.strip().lower()
            
            # Search for medicine in database
            medicines_df = diagnosis_system.medicines_df
            matches = []
            
            for _, row in medicines_df.iterrows():
                medicine_name = row['name'].lower()
                if medicine_name in text:
                    matches.append(row.to_dict())
            
            if not matches:
                logger.info("No medicine matches found in the image")
                return {
                    "status": "not_found",
                    "message": "No medicine information found in the image",
                    "extracted_text": text
                }
            
            logger.info(f"Found {len(matches)} medicine matches")
            return {
                "status": "success",
                "medicines": matches,
                "extracted_text": text
            }
            
        except Exception as e:
            logger.error(f"Error during OCR or medicine matching: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error in medicine analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 