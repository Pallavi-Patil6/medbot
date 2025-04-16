import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MainApp.css';

const API_BASE_URL = 'http://localhost:8000';

function MainApp() {
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    gender: '',
    symptoms: ''
  });
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [medicineAnalysis, setMedicineAnalysis] = useState(null);
  const [medicineLoading, setMedicineLoading] = useState(false);
  const [medicineError, setMedicineError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDiagnosis = async () => {
    if (!patientInfo.name || !patientInfo.age || !patientInfo.gender || !patientInfo.symptoms) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      // Split symptoms by comma and clean up
      const symptomsList = patientInfo.symptoms
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const response = await axios.post(`${API_BASE_URL}/diagnose`, {
        symptoms: symptomsList
      });

      setDiagnosis(response.data);
    } catch (err) {
      console.error('Diagnosis error:', err);
      setError(err.response?.data?.detail || 'Failed to get diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeMedicine = async (file) => {
    setMedicineLoading(true);
    setMedicineError(null);
    setMedicineAnalysis(null);

    try {
      if (!file) {
        throw new Error('No file selected');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/analyze_medicine`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMedicineAnalysis(response.data);
    } catch (err) {
      console.error('Medicine analysis error:', err);
      setMedicineError(err.response?.data?.detail || 'Failed to analyze medicine image. Please try again.');
    } finally {
      setMedicineLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      analyzeMedicine(file);
    }
  };

  return (
    <div className="main-app">
      <h1>MedNexus - AI Medical Assistant</h1>
      
      <div className="patient-info-section">
        <h2>Patient Information</h2>
        <div className="input-group">
          <input
            type="text"
            name="name"
            value={patientInfo.name}
            onChange={handleInputChange}
            placeholder="Patient Name"
            className="input-field"
          />
        </div>
        <div className="input-group">
          <input
            type="number"
            name="age"
            value={patientInfo.age}
            onChange={handleInputChange}
            placeholder="Age"
            className="input-field"
          />
        </div>
        <div className="input-group">
          <select
            name="gender"
            value={patientInfo.gender}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="input-group">
          <textarea
            name="symptoms"
            value={patientInfo.symptoms}
            onChange={handleInputChange}
            placeholder="Enter your symptoms (comma-separated)&#10;Example: fever, cough, headache"
            className="input-field textarea"
            rows="4"
          />
        </div>
        <button 
          className="diagnose-button"
          onClick={handleDiagnosis}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Get Diagnosis'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {diagnosis && (
        <div className="diagnosis-results">
          <h2>Diagnosis Results</h2>
          <div className="primary-diagnosis">
            <h3>Primary Diagnosis: {diagnosis.diagnosis}</h3>
            <p>Confidence: {(diagnosis.confidence * 100).toFixed(2)}%</p>
          </div>
          
          <div className="disease-info">
            <h3>Disease Information</h3>
            <p><strong>Description:</strong> {diagnosis.disease_info.description}</p>
            <p><strong>Severity:</strong> {diagnosis.disease_info.severity}</p>
            <p><strong>Contagious:</strong> {diagnosis.disease_info.contagious}</p>
            <p><strong>Precautions:</strong> {diagnosis.disease_info.precautions}</p>
          </div>

          {diagnosis.possible_diagnoses.length > 1 && (
            <div className="possible-diagnoses">
              <h3>Other Possible Diagnoses</h3>
              <ul>
                {diagnosis.possible_diagnoses.slice(1).map((diag, index) => (
                  <li key={index}>
                    {diag.disease} ({(diag.confidence * 100).toFixed(2)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {diagnosis.medicines && diagnosis.medicines.length > 0 && (
            <div className="recommended-medicines">
              <h3>Recommended Medicines</h3>
              {diagnosis.medicines.map((medicine, index) => (
                <div key={index} className="medicine-card">
                  <h4>{medicine.name}</h4>
                  <p><strong>Usage:</strong> {medicine.usage}</p>
                  <p><strong>Dosage:</strong> {medicine.dosage}</p>
                  <p><strong>Side Effects:</strong> {medicine.side_effects}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="medicine-analysis-section">
        <h2>Medicine Analysis</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="image-upload"
        />
        
        {medicineLoading && <div className="loading">Analyzing image...</div>}
        {medicineError && <div className="error">{medicineError}</div>}
        
        {medicineAnalysis && (
          <div className="medicine-results">
            {medicineAnalysis.status === 'success' ? (
              <>
                <h3>Found Medicines</h3>
                {medicineAnalysis.medicines.map((medicine, index) => (
                  <div key={index} className="medicine-card">
                    <h4>{medicine.name}</h4>
                    <p><strong>Usage:</strong> {medicine.usage}</p>
                    <p><strong>Dosage:</strong> {medicine.dosage}</p>
                    <p><strong>Side Effects:</strong> {medicine.side_effects}</p>
                  </div>
                ))}
              </>
            ) : (
              <div className="not-found">
                <p>{medicineAnalysis.message}</p>
                <p>Extracted text: {medicineAnalysis.extracted_text}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainApp; 