import React, { useState } from 'react';
import axios from 'axios';

function QRCodeDisplay({ studentId, studentData }) {
  const [qrImage, setQrImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`http://localhost:5000/generate-qr/${studentId}`);
      setQrImage(res.data.qrImage);
      
      // If we need to update studentData from response
      if (res.data.studentData) {
        // You can pass this up to parent if needed
        console.log('QR generated with data:', res.data.studentData);
      }
    } catch (err) {
      console.error('QR generation failed:', err);
      setError('QR generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      marginTop: "20px", 
      padding: "20px", 
      border: "1px solid #ccc", 
      borderRadius: "8px",
      backgroundColor: "#fff"
    }}>
      <h3 style={{ marginBottom: "20px", color: "#333" }}>QR Code Gate Pass</h3>
      
      {/* Student Information */}
      {studentData && (
        <div style={{ 
          marginBottom: "20px", 
          padding: "15px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "5px",
          borderLeft: "4px solid #4CAF50"
        }}>
          <h4 style={{ marginBottom: "10px", color: "#555" }}>Student Details:</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            <div>
              <strong style={{ color: "#666" }}>Name:</strong> 
              <span style={{ marginLeft: "5px" }}>{studentData.name}</span>
            </div>
            <div>
              <strong style={{ color: "#666" }}>Adm No:</strong> 
              <span style={{ marginLeft: "5px" }}>{studentData.admNo}</span>
            </div>
            <div>
              <strong style={{ color: "#666" }}>Department:</strong> 
              <span style={{ marginLeft: "5px" }}>{studentData.dept}</span>
            </div>
            <div>
              <strong style={{ color: "#666" }}>Semester:</strong> 
              <span style={{ marginLeft: "5px" }}>{studentData.sem}</span>
            </div>
            <div>
              <strong style={{ color: "#666" }}>Purpose:</strong> 
              <span style={{ marginLeft: "5px" }}>{studentData.purpose || "Not specified"}</span>
            </div>
            <div>
              <strong style={{ color: "#666" }}>Date:</strong> 
              <span style={{ marginLeft: "5px" }}>
                {studentData.date ? new Date(studentData.date).toLocaleDateString() : "Not specified"}
              </span>
            </div>
            <div>
              <strong style={{ color: "#666" }}>Return Time:</strong> 
              <span style={{ marginLeft: "5px" }}>{studentData.returnTime || "Not specified"}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div style={{
          marginBottom: "15px",
          padding: "10px",
          backgroundColor: "#fee",
          color: "#c33",
          borderRadius: "4px",
          border: "1px solid #fcc"
        }}>
          {error}
        </div>
      )}
      
      <button 
        onClick={generateQR}
        disabled={loading}
        style={{
          padding: "12px 20px",
          backgroundColor: loading ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "16px",
          fontWeight: "600",
          width: "100%",
          maxWidth: "300px",
          display: "block",
          margin: "0 auto",
          transition: "background-color 0.3s"
        }}
        onMouseOver={(e) => {
          if (!loading) e.target.style.backgroundColor = "#45a049";
        }}
        onMouseOut={(e) => {
          if (!loading) e.target.style.backgroundColor = "#4CAF50";
        }}
      >
        {loading ? (
          <>
            <span style={{ marginRight: "8px" }}>Generating...</span>
            <i className="fas fa-spinner fa-spin"></i>
          </>
        ) : (
          "Generate QR Code"
        )}
      </button>
      
      <br />
      
      {/* QR Code Display */}
      {qrImage && (
        <div style={{ 
          marginTop: "30px", 
          textAlign: "center",
          padding: "20px",
          border: "1px dashed #ddd",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9"
        }}>
          <h4 style={{ marginBottom: "15px", color: "#555" }}>Your Gate Pass QR Code</h4>
          <img 
            src={qrImage} 
            alt="QR Code Gate Pass" 
            style={{ 
              maxWidth: "250px",
              width: "100%",
              border: "2px solid #fff",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              padding: "15px",
              backgroundColor: "white"
            }} 
          />
          <p style={{ 
            fontSize: "14px", 
            color: "#666", 
            marginTop: "15px",
            fontStyle: "italic"
          }}>
            Present this QR code at the security gate for verification
          </p>
          <div style={{
            marginTop: "10px",
            fontSize: "12px",
            color: "#888"
          }}>
            Student ID: {studentId}
          </div>
        </div>
      )}
    </div>
  );
}

export default QRCodeDisplay;