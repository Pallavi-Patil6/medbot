import pandas as pd
import numpy as np
import joblib
import os
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DiagnosisSystem:
    def __init__(self):
        try:
            # Get absolute paths
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(base_dir, 'models', 'diagnosis_model.joblib')
            columns_path = os.path.join(base_dir, 'models', 'symptom_columns.txt')
            diseases_path = os.path.join(base_dir, 'data', 'diseases.csv')
            medicines_path = os.path.join(base_dir, 'data', 'medicines.csv')
            
            logger.info(f"Loading model from: {model_path}")
            logger.info(f"Loading columns from: {columns_path}")
            
            if not os.path.exists(model_path) or not os.path.exists(columns_path):
                logger.error(f"Model files not found at {model_path} or {columns_path}")
                raise FileNotFoundError("Model files not found")
            
            self.model = joblib.load(model_path)
            with open(columns_path, 'r') as f:
                self.symptom_columns = [line.strip() for line in f]
            
            # Load diseases and medicines data
            try:
                logger.info(f"Loading diseases from: {diseases_path}")
                logger.info(f"Loading medicines from: {medicines_path}")
                self.diseases_df = pd.read_csv(diseases_path)
                self.medicines_df = pd.read_csv(medicines_path)
            except pd.errors.ParserError as e:
                logger.error(f"Error reading CSV files: {str(e)}")
                raise
            
            # Validate data
            if self.diseases_df.empty or self.medicines_df.empty:
                logger.error("CSV files are empty")
                raise ValueError("CSV files are empty")
            
            logger.info(f"Loaded {len(self.symptom_columns)} symptoms")
            logger.info(f"Loaded {len(self.diseases_df)} diseases")
            logger.info(f"Loaded {len(self.medicines_df)} medicines")
            logger.info("Diagnosis system initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing diagnosis system: {str(e)}")
            raise
    
    def diagnose(self, symptoms: List[str]) -> Dict[str, Any]:
        """Diagnose based on symptoms"""
        try:
            logger.info(f"Diagnosing symptoms: {symptoms}")
            
            # Create feature vector
            features = np.zeros(len(self.symptom_columns))
            for symptom in symptoms:
                if symptom in self.symptom_columns:
                    idx = self.symptom_columns.index(symptom)
                    features[idx] = 1
            
            # Get prediction probabilities
            probs = self.model.predict_proba([features])[0]
            classes = self.model.classes_
            
            # Get top 3 possible diagnoses
            top_indices = np.argsort(probs)[-3:][::-1]
            possible_diagnoses = [
                {
                    "disease": classes[idx],
                    "confidence": float(probs[idx])
                }
                for idx in top_indices
            ]
            
            # Get primary diagnosis
            primary_diagnosis = possible_diagnoses[0]["disease"]
            
            # Get disease information
            try:
                disease_info = self.diseases_df[self.diseases_df['name'] == primary_diagnosis].iloc[0].to_dict()
            except IndexError:
                logger.error(f"Disease information not found for: {primary_diagnosis}")
                disease_info = {
                    "name": primary_diagnosis,
                    "description": "Information not available",
                    "severity": "Unknown",
                    "contagious": "Unknown",
                    "precautions": "Consult a healthcare professional"
                }
            
            # Get recommended medicines
            try:
                recommended_medicines = self.medicines_df[
                    self.medicines_df['diagnosis'] == primary_diagnosis
                ].to_dict('records')
            except Exception as e:
                logger.error(f"Error getting medicines: {str(e)}")
                recommended_medicines = []
            
            result = {
                "diagnosis": primary_diagnosis,
                "confidence": possible_diagnoses[0]["confidence"],
                "possible_diagnoses": possible_diagnoses,
                "disease_info": disease_info,
                "medicines": recommended_medicines
            }
            
            logger.info(f"Diagnosis completed: {primary_diagnosis}")
            return result
            
        except Exception as e:
            logger.error(f"Error in diagnosis: {str(e)}")
            raise

def print_diagnosis_result(result):
    print("\n=== Diagnosis Results ===")
    print(f"Primary Diagnosis: {result['diagnosis']}")
    print(f"Confidence: {result['confidence']:.2%}")
    
    print("\n=== Disease Information ===")
    print(f"Description: {result['disease_info']['description']}")
    print(f"Severity: {result['disease_info']['severity']}")
    print(f"Contagious: {result['disease_info']['contagious']}")
    print(f"Precautions: {result['disease_info']['precautions']}")
    
    if len(result['possible_diagnoses']) > 1:
        print("\n=== Other Possible Diagnoses ===")
        for diag in result['possible_diagnoses'][1:]:
            print(f"- {diag['disease']} ({diag['confidence']:.2%})")
    
    if result['medicines']:
        print("\n=== Recommended Medicines ===")
        for med in result['medicines']:
            print(f"\nMedicine: {med['name']}")
            print(f"Usage: {med['usage']}")
            print(f"Dosage: {med['dosage']}")
            print(f"Side Effects: {med['side_effects']}")

def main():
    # Initialize diagnosis system
    system = DiagnosisSystem()
    
    # Example symptoms (you can modify these)
    test_symptoms = [
        'fever',
        'cough',
        'headache',
        'sore_throat'
    ]
    
    print("Analyzing symptoms:", ', '.join(test_symptoms))
    result = system.diagnose(test_symptoms)
    print_diagnosis_result(result)

if __name__ == "__main__":
    main() 