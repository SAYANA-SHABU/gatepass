import React, { useState } from 'react';
import './RegisterForm.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TutorRegisterForm = () => {
  const navigate = useNavigate();
  const departments = [
    "BA Malayalam Language & Literature", "BA English Language & Literature", "BA Functional English", 
    "BA Economics", "BA Sociology", "B.Com", "B.Sc Mathematics", "B.Sc Statistics", "B.Sc Chemistry", 
    "B.Sc Botany", "B.Sc Zoology", "B.Sc Family & Community Science", "Bsc Computer Science", 
    "Bsc Physics", "B.Com(self)", "B.Sc Home Science (Textiles & Fashion Technology)", "B.Sc Psychology", 
    "B.Voc Web Technology", "B.Voc Food Processing ", "MA English", "MA Economics", "MA Malayalam", 
    "MA Sociology", "M.Com", "MSW", "M.Sc Physics", "M.Sc Zoology", "M.Sc Chemistry", "M.Sc Botany", 
    "M.Sc Mathematics", "M.Sc Statistics", "M.Sc Computer Science"
  ];

  const [formData, setFormData] = useState({
    empId: '',
    name: '',
    dept: '',
    email: '',
    password: '',
    image: null,
  });

  const [departmentInput, setDepartmentInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validatePassword = (password) => {
    const minLength = 6;
    const hasCapital = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 6 characters long';
    }
    if (!hasCapital) {
      return 'Password must contain at least one capital letter';
    }
    if (!hasNumber) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const filteredDepartments = departments.filter(dept =>
    dept.toLowerCase().includes(departmentInput.toLowerCase())
  );

  const handleDepartmentChange = e => {
    const { value } = e.target;
    setDepartmentInput(value);
    setFormData(prev => ({
      ...prev,
      dept: value
    }));
  };

  const handleChange = e => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    
    if (name === 'password') {
      setPasswordError(validatePassword(value));
    }
    if (name === 'email') {
      setEmailError(validateEmail(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordValidation = validatePassword(formData.password);
    const emailValidation = validateEmail(formData.email);
    
    if (passwordValidation || emailValidation) {
      setPasswordError(passwordValidation);
      setEmailError(emailValidation);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });

      await axios.post('http://localhost:5000/tutor/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Registration successful');
      navigate('/');
     window.scrollTo(0, 0);  // Force scroll to top
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="form-container">
      <h2>Tutor Registration</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="name">Full Name:</label>
          <input 
            id="name" 
            name="name" 
            type="text" 
            placeholder="Enter your full name" 
            value={formData.name} 
            onChange={handleChange} 
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="empId">Employee ID:</label>
          <input 
            id="empId" 
            name="empId" 
            type="text" 
            placeholder="Enter employee ID" 
            value={formData.empId} 
            onChange={handleChange} 
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="dept">Department:</label>
          <input 
            id="dept" 
            name="dept" 
            type="text" 
            list="departments" 
            placeholder="Select or type department" 
            value={formData.dept} 
            onChange={handleDepartmentChange} 
            required
          />
          <datalist id="departments">
            {filteredDepartments.map((dept, index) => (
              <option key={index} value={dept} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="Enter your email" 
            value={formData.email} 
            onChange={handleChange} 
            className={emailError ? 'input-error' : ''} 
            required
          />
          {emailError && (
            <div className="error-message">
              <span className="error-icon">⚠</span> {emailError}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Create password" 
            value={formData.password} 
            onChange={handleChange} 
            className={passwordError ? 'input-error' : ''} 
            required
          />
          {passwordError && (
            <div className="error-message">
              <span className="error-icon">⚠</span> {passwordError}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="image">Profile Photo:</label>
          <input 
            id="image" 
            type="file" 
            name="image" 
            accept="image/*" 
            onChange={handleChange} 
            className="file-input"
          />
        </div>

        <button type="submit" className="submit-btn">Register</button>
      </form>
    </div>
  );
};

export default TutorRegisterForm;