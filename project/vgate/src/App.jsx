// src/App.jsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import RegisterForm from './component/RegisterForm';
import TutorRegisterForm from './component/TutorRegisterForm';
import About from './component/About';
import Header from './component/Header';
import Layout from './component/Layout';
import Footer from './component/Footer';
import StudentLogin from './component/StudentLogin';
import TutorLogin from './component/TutorLogin';
import AdminLogin from './component/AdminLogin';
import AdminDashboard from './component/AdminDashboard';
import GatePassForm from './component/GatepassForm';
import StudentDashboard from './component/StudentDashboard';
import TutorDashboard from './component/TutorDashboard';
import StudentEditForm from './component/StudentEditForm';
import TutorEditForm from './component/TutorEditForm';
import SecurityDashboard from './component/SecurityDashboard';
import SecurityLogin from './component/SecurityLogin';



function App() {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [currentTutor, setCurrentTutor] = useState(null);

  const handleStudentLogin = (student) => {
    setCurrentStudent(student);
  };

  const handleTutorLogin = (tutor) => {
    setCurrentTutor(tutor);
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setCurrentTutor(null);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <Header />
              <Layout />
              <About />
              <Footer />
              
            </>
          } 
        />
        {/* Separate Login Routes */}
        <Route 
          path="/login/student" 
          element={
            <StudentLogin 
              onStudentLogin={handleStudentLogin} 
            />
          } 
        />
        <Route 
          path="/login/tutor" 
          element={
            <TutorLogin 
              onTutorLogin={handleTutorLogin} 
            />
          } 
        />
        <Route 
          path="/student/:id" 
          element={<StudentDashboard student={currentStudent} onLogout={handleLogout} />} 
        />
        <Route 
          path="/tutor/:id" 
          element={<TutorDashboard tutor={currentTutor} onLogout={handleLogout} />} 
        />
        <Route path="/pass/:id" element={<GatePassForm />} />
        <Route path="/r" element={<RegisterForm />} />
        <Route path="/tutor/register" element={<TutorRegisterForm />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/Security/login" element={<SecurityLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/gatepass-form/:id" element={<GatePassForm />} />
        <Route path="/student/edit/:id" element={<StudentEditForm />} />
        <Route path="/security/dashboard" element={<SecurityDashboard/>} />
        <Route path="/tutor/edit/:id" element={<TutorEditForm />} />
       
      </Routes>
    </Router>
  );
}

export default App;