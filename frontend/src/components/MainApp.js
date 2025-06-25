import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MainApp.css';

const API_BASE_URL = 'http://localhost:8000';

function MainApp() {
  const [activeTab, setActiveTab] = useState('diagnosis');
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
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDiagnosis = async (e) => {
    e.preventDefault();
    if (!patientInfo.name || !patientInfo.age || !patientInfo.gender || !patientInfo.symptoms) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setDiagnosis(null);
    setShowResults(false);

    try {
      const symptoms = patientInfo.symptoms.split(',').map(s => s.trim());
      const response = await axios.post(`${API_BASE_URL}/diagnose`, {
        symptoms: symptoms
      });
      setDiagnosis(response.data);
      setShowResults(true);
    } catch (err) {
      setError('Failed to get diagnosis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      analyzeMedicine(file);
    }
  };

  const analyzeMedicine = async (file) => {
    setMedicineLoading(true);
    setMedicineError(null);
    setMedicineAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/analyze_medicine`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMedicineAnalysis(response.data);
    } catch (err) {
      setMedicineError('Failed to analyze medicine image');
      console.error(err);
    } finally {
      setMedicineLoading(false);
    }
  };

  return (
    <div className="main-app">
      <header className="app-header">
        <h1>MedBot</h1>
        <p className="subtitle">AI-Powered Medical Diagnosis System</p>
      </header>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'diagnosis' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnosis')}
        >
          Diagnosis
        </button>
        <button 
          className={`tab-button ${activeTab === 'medicine' ? 'active' : ''}`}
          onClick={() => setActiveTab('medicine')}
        >
          Medicine Analysis
        </button>
      </div>

      {activeTab === 'diagnosis' && (
        <div className="diagnosis-section">
          <form onSubmit={handleDiagnosis} className="patient-form">
            <div className="form-group">
              <label htmlFor="name">Patient Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={patientInfo.name}
                onChange={handleInputChange}
                placeholder="Enter patient name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={patientInfo.age}
                  onChange={handleInputChange}
                  placeholder="Age"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={patientInfo.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="symptoms">Symptoms</label>
              <textarea
                id="symptoms"
                name="symptoms"
                value={patientInfo.symptoms}
                onChange={handleInputChange}
                placeholder="Enter symptoms separated by commas (e.g., fever, cough, headache)"
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Analyzing...' : 'Get Diagnosis'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          {showResults && diagnosis && (
            <div className="results-section">
              <div className="result-card primary-diagnosis">
                <h3>Primary Diagnosis</h3>
                <h2>{diagnosis.diagnosis}</h2>
                <div className="confidence">
                  Confidence: {(diagnosis.confidence * 100).toFixed(2)}%
                </div>
              </div>

              <div className="result-card disease-info">
                <h3>Disease Information</h3>
                <div className="info-grid">
                  
              
                  <div className="info-item">
                    <span className="label">Precautions</span>
                    <p>{diagnosis.disease_info.precautions}</p>
                  </div>
                </div>
              </div>

              {diagnosis.possible_diagnoses.length > 1 && (
                <div className="result-card possible-diagnoses">
                  <h3>Other Possible Diagnoses</h3>
                  <div className="diagnosis-list">
                    {diagnosis.possible_diagnoses.slice(1).map((diag, index) => (
                      <div key={index} className="diagnosis-item">
                        <span className="disease-name">{diag.disease}</span>
                        <span className="confidence">{(diag.confidence * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diagnosis.medicines && diagnosis.medicines.length > 0 && (
                <div className="result-card recommended-medicines">
                  <h3>Recommended Medicines</h3>
                  <div className="medicine-grid">
                    {diagnosis.medicines.map((medicine, index) => (
                      <div key={index} className="medicine-card">
                        <h4>{medicine.name}</h4>
                        <div className="medicine-info">
                          <div className="info-row">
                            <span className="label">Usage</span>
                            <p>{medicine.usage}</p>
                          </div>
                          <div className="info-row">
                            <span className="label">Dosage</span>
                            <p>{medicine.dosage}</p>
                          </div>
                          <div className="info-row">
                            <span className="label">Side Effects</span>
                            <p>{medicine.side_effects}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'medicine' && (
        <div className="medicine-analysis-section">
          <div className="upload-container">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              id="medicine-image"
              className="image-upload"
            />
            <label htmlFor="medicine-image" className="upload-label">
              <div className="upload-icon">📷</div>
              <div className="upload-text">
                {medicineLoading ? 'Analyzing...' : 'Upload Medicine Image'}
              </div>
              <div className="upload-hint">Click or drag image here</div>
            </label>
          </div>

          {medicineError && <div className="error-message">{medicineError}</div>}

          {medicineAnalysis && (
            <div className="analysis-results">
              {medicineAnalysis.status === 'success' ? (
                <div className="medicine-grid">
                  {medicineAnalysis.medicines.map((medicine, index) => (
                    <div key={index} className="medicine-card">
                      <h4>{medicine.name}</h4>
                      <div className="medicine-info">
                        <div className="info-row">
                          <span className="label">Usage</span>
                          <p>{medicine.usage}</p>
                        </div>
                        <div className="info-row">
                          <span className="label">Dosage</span>
                          <p>{medicine.dosage}</p>
                        </div>
                        <div className="info-row">
                          <span className="label">Side Effects</span>
                          <p>{medicine.side_effects}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="not-found">
                  <p>{medicineAnalysis.message}</p>
                  <p className="extracted-text">Extracted text: {medicineAnalysis.extracted_text}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MainApp; 