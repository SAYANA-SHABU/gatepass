import React, { useState, useMemo, useEffect } from 'react';
import './RegisterForm.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
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
    admNo: '',
    name: '',
    dept: '',
    sem: '',
    tutorName: '',
    phone: '',
    email: '',
    password: '',
    image: null,
  });

  const [departmentInput, setDepartmentInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutors, setTutors] = useState([]); // Changed from static array to state
  const [tutorInput, setTutorInput] = useState('');
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [tutorError, setTutorError] = useState('');

  // Fetch verified tutors from backend
  useEffect(() => {
    const fetchVerifiedTutors = async () => {
      try {
        setLoadingTutors(true);
        const response = await axios.get('http://localhost:5000/verified-tutors');
        setTutors(response.data);
        setTutorError('');
      } catch (err) {
        console.error('Error fetching tutors:', err);
        setTutorError('Failed to load tutors list. Please try again.');
        setTutors([]);
      } finally {
        setLoadingTutors(false);
      }
    };

    fetchVerifiedTutors();
  }, []);

  const validateAdmNo = (admNo) => {
    const regex = /^\d{3}\/\d{2}$/;
    return regex.test(admNo);
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    
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
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const filteredDepartments = useMemo(() => {
    if (!departmentInput) return departments;
    
    const inputLower = departmentInput.toLowerCase();
    
    return departments
      .map(dept => ({
        dept,
        index: dept.toLowerCase().indexOf(inputLower)
      }))
      .filter(({ index }) => index !== -1)
      .sort((a, b) => {
        if (a.index === 0 && b.index !== 0) return -1;
        if (b.index === 0 && a.index !== 0) return 1;
        if (a.index !== b.index) return a.index - b.index;
        return a.dept.localeCompare(b.dept);
      })
      .map(({ dept }) => dept);
  }, [departmentInput, departments]);

  // Filter tutors based on input
  const filteredTutors = useMemo(() => {
    if (!tutorInput) return tutors;
    
    const inputLower = tutorInput.toLowerCase();
    
    return tutors
      .map(tutor => ({
        tutor,
        index: tutor.name.toLowerCase().indexOf(inputLower)
      }))
      .filter(({ index }) => index !== -1)
      .sort((a, b) => {
        if (a.index === 0 && b.index !== 0) return -1;
        if (b.index === 0 && a.index !== 0) return 1;
        if (a.index !== b.index) return a.index - b.index;
        return a.tutor.name.localeCompare(b.tutor.name);
      })
      .map(({ tutor }) => tutor);
  }, [tutorInput, tutors]);

  const handleDepartmentChange = e => {
    const { value } = e.target;
    setDepartmentInput(value);
    setFormData(prev => ({
      ...prev,
      dept: value
    }));
  };

  const handleTutorChange = e => {
    const { value } = e.target;
    setTutorInput(value);
    setFormData(prev => ({
      ...prev,
      tutorName: value
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

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      password: value
    }));

    setPasswordError(validatePassword(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate before submission
    const passwordValidation = validatePassword(formData.password);
    const emailValidation = validateEmail(formData.email);
    
    if (!validateAdmNo(formData.admNo)) {
      alert('Admission number must be in format: YYY/NN (e.g., 234/23)');
      setIsSubmitting(false);
      return;
    }
    
    // Validate tutor selection
    if (!formData.tutorName) {
      alert('Please select a tutor from the list');
      setIsSubmitting(false);
      return;
    }
    
    // Check if selected tutor exists in verified tutors list
    const selectedTutor = tutors.find(tutor => tutor.name === formData.tutorName);
    if (!selectedTutor) {
      alert('Please select a valid tutor from the list. Only verified tutors are allowed.');
      setIsSubmitting(false);
      return;
    }
    
    if (passwordValidation || emailValidation) {
      setPasswordError(passwordValidation);
      setEmailError(emailValidation);
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData with different variable name
      const submitData = new FormData();
      
      // Append all form fields
      submitData.append('admNo', formData.admNo);
      submitData.append('name', formData.name);
      submitData.append('dept', formData.dept);
      submitData.append('sem', formData.sem);
      submitData.append('tutorName', formData.tutorName);
      submitData.append('phone', formData.phone);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      
      // Append image if exists
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      console.log('Submitting form data:', {
        admNo: formData.admNo,
        name: formData.name,
        dept: formData.dept,
        sem: formData.sem,
        tutorName: formData.tutorName,
        phone: formData.phone,
        email: formData.email,
        hasImage: !!formData.image
      });

      const response = await axios.post('http://localhost:5000/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Registration response:', response.data);
      alert('Registration successful');
      
      // Reset form after successful submission
      setFormData({
        admNo: '',
        name: '',
        dept: '',
        sem: '',
        tutorName: '',
        phone: '',
        email: '',
        password: '',
        image: null,
      });
      setDepartmentInput('');
      setTutorInput('');
      
      navigate('/');
    window.scrollTo(0, 0);
      
    } catch (err) {
      console.error('Registration error details:', err);
      console.error('Error response:', err.response?.data);
      alert('Registration failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Student Registration</h2>
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
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="admNo">Admission Number:</label>
          <input 
            id="admNo" 
            name="admNo" 
            type="text" 
            placeholder=" (e.g., 234/23)" 
            value={formData.admNo} 
            onChange={handleChange} 
            required
            disabled={isSubmitting}
          />
          <small className="input-hint"></small>
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
            disabled={isSubmitting}
          />
          <datalist id="departments">
            {filteredDepartments.map((dept, index) => (
              <option key={index} value={dept} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label htmlFor="sem">Semester:</label>
          <input 
            id="sem" 
            name="sem" 
            type="number" 
            min="1" 
            max="8" 
            placeholder="Enter semester (1-8)" 
            value={formData.sem} 
            onChange={handleChange} 
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tutorName">Tutor Name:</label>
          {loadingTutors ? (
            <div className="loading-tutors">Loading tutors list...</div>
          ) : tutorError ? (
            <div className="error-message">
              <span className="error-icon">⚠</span> {tutorError}
            </div>
          ) : tutors.length === 0 ? (
            <div className="error-message">
              <span className="error-icon">⚠</span> No verified tutors available. Please contact administrator.
            </div>
          ) : (
            <>
              <input 
                id="tutorName" 
                name="tutorName" 
                type="text" 
                list="tutors" 
                placeholder="Select or type tutor name" 
                value={formData.tutorName} 
                onChange={handleTutorChange} 
                required
                disabled={isSubmitting}
                className={!tutors.some(t => t.name === formData.tutorName) && formData.tutorName ? 'input-error' : ''}
              />
              <datalist id="tutors">
                {filteredTutors.map((tutor, index) => (
                  <option key={index} value={tutor.name} />
                ))}
              </datalist>
              {!tutors.some(t => t.name === formData.tutorName) && formData.tutorName && (
                <div className="error-message">
                  <span className="error-icon">⚠</span> Please select a tutor from the list. Only verified tutors are allowed.
                </div>
              )}
              <small className="input-hint">
                {tutors.length} verified tutor{tutors.length !== 1 ? 's' : ''} available
              </small>
            </>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number:</label>
          <input 
            id="phone" 
            name="phone" 
            type="tel" 
            placeholder="Enter 10-digit phone number" 
            value={formData.phone} 
            onChange={handleChange} 
            required
            disabled={isSubmitting}
          />
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
            disabled={isSubmitting}
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
            onChange={handlePasswordChange} 
            className={passwordError ? 'input-error' : ''} 
            required
            disabled={isSubmitting}
          />
          {passwordError && (
            <div className="error-message">
              <span className="error-icon">⚠</span> {passwordError}
            </div>
          )}
          <div className="password-strength">
            <div className={`strength-indicator ${formData.password.length >= 6 ? 'valid' : ''}`}>
              Min 6 chars
            </div>
            <div className={`strength-indicator ${/[A-Z]/.test(formData.password) ? 'valid' : ''}`}>
              Capital letter
            </div>
            <div className={`strength-indicator ${/[0-9]/.test(formData.password) ? 'valid' : ''}`}>
              Number
            </div>
            <div className={`strength-indicator ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'valid' : ''}`}>
              Special char
            </div>
          </div>
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
            disabled={isSubmitting}
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isSubmitting || loadingTutors || tutors.length === 0}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;