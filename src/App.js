import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import jsPDF from "jspdf";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files[0];
    setFile(selectedFile);
    setPreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const result = {
        fileName: file.name,
        prediction: data.prediction.class,
        confidence: data.prediction.confidence,
        imageUrl: preview,
        timestamp: new Date().toLocaleString(),
      };
      setPrediction(data.prediction || null);
      setUploadHistory((prev) => [result, ...prev]);
    } catch (error) {
      console.error("Error:", error);
      setPrediction({ class: "Error", confidence: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setPrediction(null);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleDownloadReport = (report) => {
  const doc = new jsPDF();
  const confidence = (report.confidence * 100).toFixed(2);
  const diagnosis =
    report.prediction === "Malignant"
      ? "Signs of breast cancer detected"
      : report.prediction === "Benign"
      ? "Benign mass found. Monitor if needed."
      : "Breast tissue appears normal";

  doc.setTextColor(33, 37, 41); // Dark grey
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MammoGuard Diagnosis Report", 20, 25);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Generated: ${report.timestamp}`, 20, 35);

  doc.setDrawColor(200);
  doc.line(20, 40, 190, 40); // Horizontal line

  doc.setFontSize(14);
  doc.setTextColor(33, 37, 41);
  doc.text(`File: ${report.fileName || "N/A"}`, 20, 55);
  doc.text(`Prediction: ${report.prediction}`, 20, 65);
  doc.text(`Confidence: ${confidence}%`, 20, 75);

  doc.setFont("helvetica", "italic");
  doc.setTextColor(90, 90, 90);
  doc.text(`Diagnosis: ${diagnosis}`, 20, 90);

  doc.save(`mammo_guard_report_${Date.now()}.pdf`);
};


  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="App">
      <p className="subtitle">MAMMOGUARD</p>
      <h1>Breast Cancer Screening</h1>

      <button onClick={toggleTheme} className="theme-toggle">
        {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        Drag & drop an image here, or click to upload
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
      </div>

      <button onClick={handleSubmit} disabled={loading}>
        Submit
      </button>
      <button onClick={handleReset} disabled={loading}>
        Reset
      </button>

      {preview && (
        <div style={{ marginTop: "20px" }}>
          <h3>Selected Image:</h3>
          <img src={preview} alt="Selected preview" className="image-preview" />
        </div>
      )}

      {loading && (
        <div className="spinner-wrapper">
          <div className="spinner"></div>
          <p>Predicting... Please wait.</p>
        </div>
      )}

      {!loading && prediction && (
        <div className="prediction-section">
          <h2
            className={`prediction-result ${prediction.class.toLowerCase()}`}
          >
            Prediction: {prediction.class}
          </h2>
          <p className="confidence">
            Confidence: {(prediction.confidence * 100).toFixed(2)}%
          </p>
          <p className="warning">
            {prediction.class === "Malignant" &&
              "🚨 Warning: Signs of breast cancer detected!"}
            {prediction.class === "Benign" &&
              "⚠️ Benign mass found. Not cancer, but monitor if needed."}
            {prediction.class === "Normal" &&
              "✅ Breast tissue appears normal."}
          </p>
          <button onClick={() => handleDownloadReport({
            fileName: file?.name,
            prediction: prediction.class,
            confidence: prediction.confidence,
            timestamp: new Date().toLocaleString(),
          })}>
            Download Report (PDF)
          </button>
        </div>
      )}

      {uploadHistory.length > 0 && (
        <div className="upload-history">
          <h2>Upload History</h2>
          <ul>
            {uploadHistory.map((entry, idx) => (
              <li key={idx}>
                <strong>{entry.fileName}</strong>
                <img src={entry.imageUrl} alt="History" width="100" />
                <p>Prediction: {entry.prediction}</p>
                <p>Confidence: {(entry.confidence * 100).toFixed(2)}%</p>
                <p>{entry.timestamp}</p>
                <button onClick={() => handleDownloadReport(entry)}>
                  Download Report
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="about-section">
        <h2>📘 About This Project</h2>
        <p><strong>MammoGuard</strong> is a machine learning-based breast cancer screening tool designed to assist clinicians and researchers. Users can upload a mammogram image and receive predictions from an AI model trained on publicly available datasets.</p>
        <p>This project was developed as part of a Master’s Thesis in Software Engineering and showcases real-time image analysis using a FastAPI backend with a PyTorch-trained model.</p>
        <p><strong>⚠️ Disclaimer:</strong> This tool is a research prototype and should not be used for clinical diagnosis or treatment decisions.</p>
      </div>

      <div className="research-section">
        <h2>📖 Know More About the Research by Author</h2>
        <div className="research-cards">
          <div className="card">
            <h3>Problem Statement</h3>
            <p>
              Traditional mammogram analysis techniques struggle with class imbalance,
              low contrast, and diagnostic uncertainty. This project aims to enhance diagnosis
              by utilizing deep learning with better preprocessing and model tuning.
            </p>
          </div>
          <div className="card">
            <h3>Author's Approach</h3>
            <ul>
              <li>
                <strong>ResNet18 & attention module:</strong> Improves feature extraction for subtle tissue variations.
              </li>
              <li>
                <strong>Transfer learning:</strong> Uses pretrained weights for better generalization on small datasets.
              </li>
              <li>
                <strong>Real-time deployment:</strong> Backend served using FastAPI and prediction integrated into a modern frontend.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer">
        <p>📩 Contact: <a href="mailto:kethmini.msc@university.edu">kethmini.msc@university.edu</a></p>
        <p>© 2025 MammoGuard Project. All rights reserved.</p>
      </div>
    </div>
  );
}

export default App;
