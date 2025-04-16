import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_diagnosis_model():
    try:
        # Load symptoms data
        logger.info("Loading symptoms data...")
        symptoms_df = pd.read_csv('data/symptoms.csv')
        
        # Prepare features and target
        X = symptoms_df.drop('diagnosis', axis=1)
        y = symptoms_df['diagnosis']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        logger.info("Training Random Forest model...")
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42
        )
        model.fit(X_train, y_train)
        
        # Evaluate model
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        logger.info(f"Training accuracy: {train_score:.2%}")
        logger.info(f"Test accuracy: {test_score:.2%}")
        
        # Save model and symptom columns
        os.makedirs('models', exist_ok=True)
        joblib.dump(model, 'models/diagnosis_model.joblib')
        
        # Save symptom columns
        with open('models/symptom_columns.txt', 'w') as f:
            for col in X.columns:
                f.write(f"{col}\n")
        
        logger.info("Model and symptom columns saved successfully")
        
        return model, X.columns.tolist()
        
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        raise

if __name__ == "__main__":
    train_diagnosis_model() 