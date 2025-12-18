import React, { useEffect, useState } from "react";
import "./GatePassForm.css"; 
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';

const GatePassForm = ({ studentId }) => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    admissionNo: "",
    dept: "",
    tutor: "",
    reason: "",
    isGroup: false,
    groupMembers: [],
    isReturning: false,
    returnTime: "",
    returnMeridiem: "AM" // New state for AM/PM
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [autoFillLoading, setAutoFillLoading] = useState({});
  const [autoFillTimers, setAutoFillTimers] = useState({});

  const location = useLocation();

  // Fetch or set student data on component mount
  useEffect(() => {
    const initializeStudentData = async () => {
      if (location.state?.student) {
        const student = location.state.student;
        setStudentData(student);
        setFormData({
          name: student.name,
          admissionNo: String(student.admNo),
          dept: student.dept,
          tutor: student.tutorName,
          reason: "",
          isGroup: false,
          groupMembers: [],
          isReturning: false,
          returnTime: "",
          returnMeridiem: "AM"
        });
      } else {
        try {
          const response = await axios.get(`http://localhost:5000/student/${id}`);
          const student = response.data;
          setStudentData(student);
          setFormData({
            name: student.name,
            admissionNo: String(student.admNo),
            dept: student.dept,
            tutor: student.tutorName,
            reason: "",
            isGroup: false,
            groupMembers: [],
            isReturning: false,
            returnTime: "",
            returnMeridiem: "AM"
          });
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      }
    };

    initializeStudentData();
  }, [id, location.state]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Function to auto-fill member details
  const autoFillMemberDetails = async (index, admissionNo) => {
    // Clean and validate admission number
    const cleanAdmissionNo = admissionNo.trim();
    
    // If admission number is empty, clear the fields
    if (!cleanAdmissionNo) {
      updateGroupMember(index, { name: "", dept: "", admissionNo: "" });
      return;
    }

    // If admission number is same as main student
    if (cleanAdmissionNo === formData.admissionNo) {
      updateGroupMember(index, {
        name: formData.name,
        dept: formData.dept,
        admissionNo: cleanAdmissionNo
      });
      return;
    }

    setAutoFillLoading(prev => ({ ...prev, [index]: true }));

    try {
      const response = await axios.get(`http://localhost:5000/check-student/${encodeURIComponent(cleanAdmissionNo)}`);
      
      if (response.data.exists) {
        const { student } = response.data;
        updateGroupMember(index, {
          name: student.name,
          dept: student.dept,
          admissionNo: cleanAdmissionNo
        });
      } else {
        // If student not found, keep admission number but clear other fields
        updateGroupMember(index, {
          name: "",
          dept: "",
          admissionNo: cleanAdmissionNo
        });
      }
    } catch (error) {
      console.error("Error checking student:", error);
      // Keep the admission number but clear other fields on error
      updateGroupMember(index, {
        name: "",
        dept: "",
        admissionNo: cleanAdmissionNo
      });
    } finally {
      setAutoFillLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  // Helper function to update group member
  const updateGroupMember = (index, updates) => {
    const newGroupMembers = [...formData.groupMembers];
    newGroupMembers[index] = {
      ...newGroupMembers[index],
      ...updates
    };
    setFormData({ ...formData, groupMembers: newGroupMembers });
  };

  // Handle group member field changes with debouncing for admission number
  const handleGroupMemberChange = (index, field, value) => {
    const newGroupMembers = [...formData.groupMembers];
    
    // Only update the specific field
    newGroupMembers[index] = {
      ...newGroupMembers[index],
      [field]: value
    };
    
    setFormData({ ...formData, groupMembers: newGroupMembers });

    // Auto-fill logic when admission number is entered (with debouncing)
    if (field === "admissionNo") {
      // Clear any existing timer for this index
      if (autoFillTimers[index]) {
        clearTimeout(autoFillTimers[index]);
      }

      // Create a new timer
      const newTimer = setTimeout(() => {
        autoFillMemberDetails(index, value);
      }, 800); // Increased delay to ensure user has stopped typing

      // Store the timer reference
      setAutoFillTimers(prev => ({
        ...prev,
        [index]: newTimer
      }));
    }
  };

  const addGroupMember = () => {
    setFormData({
      ...formData,
      groupMembers: [...formData.groupMembers, { name: "", admissionNo: "", dept: "" }]
    });
  };

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      Object.values(autoFillTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [autoFillTimers]);

  // Convert 12-hour time to 24-hour format for backend
  const convertTo24HourFormat = (time12h, meridiem) => {
    if (!time12h) return "";
    
    let [hours, minutes] = time12h.split(':').map(Number);
    
    if (meridiem === "PM" && hours !== 12) {
      hours += 12;
    } else if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Form validation
  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.admissionNo.trim()) errs.admissionNo = "Admission number is required";
    if (!formData.dept.trim()) errs.dept = "Department is required";
    if (!formData.tutor.trim()) errs.tutor = "Tutor name is required";
    if (!formData.reason.trim()) errs.reason = "Reason is required";
    if (formData.isReturning && !formData.returnTime.trim())
      errs.returnTime = "Return time required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Convert time to 24-hour format for backend
    const returnTime24h = formData.isReturning ? 
      convertTo24HourFormat(formData.returnTime, formData.returnMeridiem) : 
      null;

    const formDataToSend = {
      purpose: formData.reason,
      date: new Date().toISOString(),
      returnTime: returnTime24h,
      groupMembers: formData.isGroup ? formData.groupMembers : []
    };

    console.log("Data being sent to backend:", formDataToSend);

    try {
      const response = await axios.post(`http://localhost:5000/form-fill/${id}`, formDataToSend);
      console.log("Server response:", response.data);
      setStudentData(response.data.student);
      setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Form submission failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Show submission success message
  if (submitted && studentData) {
    return (
      <div style={{ maxWidth: "600px", margin: "auto", textAlign: "center" }}>
        <h2>Gate Pass Submitted for Approval</h2>
        <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "10px" }}>
          <div style={{ marginBottom: "20px" }}>
            {studentData.image && (
              <img
                src={`http://localhost:5000/student/image/${studentData._id}`}
                alt="Student"
                style={{ width: "100px", height: "100px", borderRadius: "50%" }}
              />
            )}
            <h3>{studentData.name}</h3>
            <p>Admission No: {studentData.admNo}</p>
            <p>Department: {studentData.dept}</p>
            <p>Purpose: {studentData.purpose}</p>
            {studentData.returnTime && (
              <p>
                Return Time: {
                  // Display in 12-hour format
                  (() => {
                    const [hours, minutes] = studentData.returnTime.split(':').map(Number);
                    const meridiem = hours >= 12 ? 'PM' : 'AM';
                    const hours12 = hours % 12 || 12;
                    return `${hours12}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
                  })()
                }
              </p>
            )}
            <p style={{ color: 'orange', fontWeight: 'bold' }}>
              ⏳ Waiting for tutor approval
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main form render
  return (
    <div>
      <h2>Gate Pass Registration</h2>
      <form id="for" onSubmit={handleSubmit}>
        {/* Student Details */}
        <label>Name:</label>
        <input 
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
        />
        {errors.name && <span className="error">{errors.name}</span>}

        <label>Admission No:</label>
        <input 
          type="text" 
          name="admissionNo" 
          value={formData.admissionNo} 
          onChange={handleChange} 
        />
        {errors.admissionNo && <span className="error">{errors.admissionNo}</span>}

        <label>Department:</label>
        <input
          type="text"
          name="dept"
          value={formData.dept}
          onChange={handleChange}
          list="departments"
        />
        <datalist id="departments">
          <option value="BA Malayalam Language & Literature" />
          <option value="BA English Language & Literature" />
          <option value="BA Functional English" />
          <option value="BA Economics" />
          <option value="BA Sociology" />
          <option value="B.Com" />
          <option value="B.Sc Chemistry" />
          <option value="B.Sc Physics" />
          <option value="B.Sc Mathematics" />
          <option value="B.Sc Statistics" />
          <option value="B.Sc Botany" />
          <option value="B.Sc Zoology" />
          <option value="B.Sc Family & Community Science" />
          <option value="B.Sc Computer Science" />
          <option value="B.Com (Self)" />
          <option value="B.Sc Home Science (Textiles & Fashion Technology)" />
          <option value="B.Sc Psychology" />
          <option value="B.Voc Web Technology" />
          <option value="B.Voc Food Processing" />
          <option value="MA English" />
          <option value="MA Economics" />
          <option value="MA Sociology" />
          <option value="M.Com" />
          <option value="MSW" />
          <option value="M.Sc Zoology" />
          <option value="M.Sc Chemistry" />
          <option value="M.Sc Botany" />
          <option value="M.Sc Mathematics" />
          <option value="M.Sc Statistics" />
          <option value="M.Sc Computer Science" />
        </datalist>
        {errors.dept && <span className="error">{errors.dept}</span>}

        <label>Tutor Name:</label>
        <input 
          type="text" 
          name="tutor" 
          value={formData.tutor} 
          onChange={handleChange} 
        />
        {errors.tutor && <span className="error">{errors.tutor}</span>}

        <label>Reason for Gate Pass:</label>
        <textarea 
          name="reason" 
          value={formData.reason} 
          onChange={handleChange} 
        />
        {errors.reason && <span className="error">{errors.reason}</span>}

        {/* Group Members Section */}
        <div style={{ margin: "20px 0" }}>
          <label style={{ display: "inline-block", marginRight: "10px" }}>
            Is this request for a group?
          </label>
          <input
            type="checkbox"
            name="isGroup"
            checked={formData.isGroup}
            onChange={handleChange}
          />
        </div>

        {formData.isGroup && (
          <div style={{ margin: "20px 0", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
            <h3>Group Members</h3>
            {formData.groupMembers.map((member, index) => (
              <div key={index} style={{ padding: "15px", border: "1px dashed #ccc", marginBottom: "15px", borderRadius: "5px" }}>
                <strong>Group Member {index + 1}</strong><br />
                
                <label>Admission No:</label>
                <div style={{ position: 'relative', marginBottom: "10px" }}>
                  <input
                    type="text"
                    value={member.admissionNo || ''}
                    onChange={(e) => handleGroupMemberChange(index, "admissionNo", e.target.value)}
                    placeholder="Enter admission number"
                    disabled={autoFillLoading[index]}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: `2px solid ${member.admissionNo && !member.name ? '#ffa500' :
                        member.admissionNo && member.name ? '#4CAF50' : '#ccc'}`,
                      borderRadius: "4px"
                    }}
                  />
                  {autoFillLoading[index] && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      Checking...
                    </div>
                  )}
                </div>
                
                {member.admissionNo && !member.name && !autoFillLoading[index] && (
                  <div style={{ fontSize: '12px', color: '#ffa500', marginBottom: "10px" }}>
                    ⚠️ Student not found. Please enter details manually.
                  </div>
                )}
                
                <label>Name:</label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => handleGroupMemberChange(index, "name", e.target.value)}
                  placeholder={member.admissionNo && !member.name ? "Enter name manually" : "Will auto-fill if student exists"}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "10px",
                    backgroundColor: member.admissionNo && member.name ? '#f0fff0' : 'white',
                    border: `2px solid ${member.admissionNo && member.name ? '#4CAF50' : '#ccc'}`,
                    borderRadius: "4px"
                  }}
                />
                
                <label>Department:</label>
                <input
                  type="text"
                  value={member.dept}
                  onChange={(e) => handleGroupMemberChange(index, "dept", e.target.value)}
                  placeholder={member.admissionNo && !member.dept ? "Enter department manually" : "Will auto-fill if student exists"}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "10px",
                    backgroundColor: member.admissionNo && member.dept ? '#f0fff0' : 'white',
                    border: `2px solid ${member.admissionNo && member.dept ? '#4CAF50' : '#ccc'}`,
                    borderRadius: "4px"
                  }}
                />
                
                {member.admissionNo && member.name && member.dept && !autoFillLoading[index] && (
                  <div style={{ fontSize: '12px', color: 'green', marginTop: '5px' }}>
                    ✓ Student details loaded from database
                  </div>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={addGroupMember}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              + Add Group Member
            </button>
          </div>
        )}

        {/* Returning Section */}
        <div style={{ margin: "20px 0" }}>
          <label style={{ display: "inline-block", marginRight: "10px" }}>
            Will the student(s) return?
          </label>
          <input
            type="checkbox"
            name="isReturning"
            checked={formData.isReturning}
            onChange={handleChange}
          />
        </div>

        {formData.isReturning && (
          <div style={{ margin: "20px 0" }}>
            <label>Return Time:</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="time"
                name="returnTime"
                value={formData.returnTime}
                onChange={handleChange}
                style={{ 
                  padding: "8px",
                  width: "150px",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <input
                    type="radio"
                    name="returnMeridiem"
                    value="AM"
                    checked={formData.returnMeridiem === "AM"}
                    onChange={handleChange}
                  />
                  AM
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <input
                    type="radio"
                    name="returnMeridiem"
                    value="PM"
                    checked={formData.returnMeridiem === "PM"}
                    onChange={handleChange}
                  />
                  PM
                </label>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
              {formData.returnTime && (
                <>
                  Selected: {formData.returnTime.split(':').map((part, i) => 
                    i === 0 ? (parseInt(part) % 12 || 12) : part
                  ).join(':')} {formData.returnMeridiem}
                  <br />
                  (Will be stored as: {convertTo24HourFormat(formData.returnTime, formData.returnMeridiem)})
                </>
              )}
            </div>
            {errors.returnTime && <span className="error">{errors.returnTime}</span>}
          </div>
        )}

        <button 
          type="submit"
          style={{
            padding: "12px 30px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            marginTop: "20px"
          }}
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default GatePassForm;