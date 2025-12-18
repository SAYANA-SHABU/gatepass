import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [expandedPass, setExpandedPass] = useState(null);
  const [gatePasses, setGatePasses] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 10 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const toggleExpand = (passId) => {
    setExpandedPass(expandedPass === passId ? null : passId);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel WITH cache-busting
      const [studentsRes, gatePassesRes, tutorsRes] = await Promise.all([
        axios.get('http://localhost:5000/admin/students'),
        // Add timestamp to prevent caching
        axios.get(`http://localhost:5000/admin/gate-passes-detailed?status=approved&t=${Date.now()}`),
        axios.get('http://localhost:5000/admin/tutors')
      ]);
      
      setStudents(studentsRes.data);
      
      // Log the gate passes data to debug
      console.log('Fetched gate passes:', gatePassesRes.data);
      
      // Ensure allReturned is properly calculated
      const updatedGatePasses = gatePassesRes.data.map(pass => {
        const returnedStudents = pass.returnedStudents || [];
        const returnedCount = returnedStudents.length;
        const totalStudents = pass.totalStudents || (1 + (pass.groupMembers?.length || 0));
        
        return {
          ...pass,
          allReturned: pass.allReturned || returnedCount >= totalStudents,
          returnedStudentsCount: returnedCount,
          totalStudents: totalStudents
        };
      });
      
      setGatePasses(updatedGatePasses);
      setTutors(tutorsRes.data || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      // Don't show alert on auto-refresh errors
      if (!err.config?.params?.t) {
        alert('Error fetching data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  // Approve tutor
  const handleApproveTutor = async (tutorId) => {
    if (window.confirm('Are you sure you want to approve this tutor?')) {
      try {
        await axios.put(`http://localhost:5000/admin/tutors/${tutorId}/verify`);
        setTutors(tutors.map(tutor => 
          tutor._id === tutorId ? { ...tutor, verified: true } : tutor
        ));
        alert('Tutor approved successfully');
      } catch (err) {
        console.error('Error approving tutor:', err);
        alert('Error approving tutor');
      }
    }
  };

  // Delete gate pass
  const handleDeleteGatePass = async (gatePassId) => {
    if (window.confirm('Are you sure you want to delete this gate pass?')) {
      try {
        await axios.delete(`http://localhost:5000/admin/gatepasses/${gatePassId}`);
        setGatePasses(gatePasses.filter(pass => pass._id !== gatePassId));
        alert('Gate pass deleted successfully');
      } catch (err) {
        console.error('Error deleting gate pass:', err);
        alert('Error deleting gate pass');
      }
    }
  };

  // Delete student
  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`http://localhost:5000/admin/students/${studentId}`);
        setStudents(students.filter(student => student._id !== studentId));
        alert('Student deleted successfully');
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Error deleting student');
      }
    }
  };

  // Mark all students in gate pass as returned
  const handleMarkAsReturned = async (gatePassId) => {
    if (window.confirm('Are you sure you want to mark ALL students in this gate pass as returned?')) {
      try {
        // Use the new endpoint to mark entire gate pass as returned
        const response = await axios.post(`http://localhost:5000/admin/gatepass/${gatePassId}/mark-all-returned`, {
          securityName: 'Admin'
        });

        console.log('Mark returned response:', response.data);

        // Update local state immediately
        setGatePasses(prev => prev.map(p => 
          p._id === gatePassId 
            ? { 
                ...p, 
                allReturned: true,
                returnedStudentsCount: response.data.returnedCount,
                returnedStudents: response.data.gatePass.returnedStudents
              } 
            : p
        ));

        alert(`${response.data.returnedCount} student(s) marked as returned successfully`);
        
        // Force a full refresh after marking
        fetchData();
        
      } catch (err) {
        console.error('Error marking gate pass as returned:', err);
        alert('Error marking gate pass as returned: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Delete tutor
  const handleDeleteTutor = async (tutorId) => {
    if (window.confirm('Are you sure you want to delete this tutor?')) {
      try {
        await axios.delete(`http://localhost:5000/admin/tutors/${tutorId}`);
        setTutors(tutors.filter(tutor => tutor._id !== tutorId));
        alert('Tutor deleted successfully');
      } catch (err) {
        console.error('Error deleting tutor:', err);
        alert('Error deleting tutor');
      }
    }
  };

  // Improved image URL handler
  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    
    // If it's already a URL string
    if (typeof imageData === 'string') {
      return imageData;
    }
    
    // If it's a Buffer object
    if (imageData.data && Array.isArray(imageData.data)) {
      try {
        const base64 = btoa(
          new Uint8Array(imageData.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
        return `data:${imageData.contentType || 'image/jpeg'};base64,${base64}`;
      } catch (err) {
        console.error('Error converting buffer to base64:', err);
        return null;
      }
    }
    
    // If it's an object with base64 property
    if (imageData.base64) {
      return `data:${imageData.contentType || 'image/jpeg'};base64,${imageData.base64}`;
    }
    
    return null;
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admNo?.toString().includes(searchTerm) ||
    student.dept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTutors = tutors.filter(tutor =>
    tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.empId?.toString().includes(searchTerm) ||
    tutor.dept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGatePasses = gatePasses
    .filter(pass => {
      // Always show only approved passes in the gatepasses tab
      if (pass.status !== 'approved') return false;
      
      return true; // Show all approved passes
    })
    .filter(pass =>
      pass.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pass.admNo?.toString().includes(searchTerm) ||
      pass.dept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pass.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pass.tutorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'students':
        return 'Search students by name, admission no, department, or email...';
      case 'tutors':
        return 'Search tutors by name, employee ID, department, or email...';
      case 'gatepasses':
        return 'Search gate passes by name, admission no, department, purpose, or tutor...';
      default:
        return 'Search...';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <span className="welcome-text">Welcome, Administrator</span>
          <button 
            onClick={fetchData} 
            className="refresh-button"
            title="Refresh Data"
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3 className="stat-number">{students.length}</h3>
          <p className="stat-label">Total Students</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">{tutors.length}</h3>
          <p className="stat-label">Registered Tutors</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">{gatePasses.length}</h3>
          <p className="stat-label">Approved Gate Passes</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">
            {students.filter(s => s.verified).length}
          </h3>
          <p className="stat-label">Verified Students</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => {
            setActiveTab('students');
            setSearchTerm('');
          }}
        >
          Registered Students ({students.length})
        </button>
        <button 
          className={activeTab === 'tutors' ? 'active' : ''}
          onClick={() => {
            setActiveTab('tutors');
            setSearchTerm('');
          }}
        >
          Registered Tutors ({tutors.length})
        </button>
        <button 
          className={activeTab === 'gatepasses' ? 'active' : ''}
          onClick={() => {
            setActiveTab('gatepasses');
            setSearchTerm('');
          }}
        >
          Approved Gate Passes ({gatePasses.length})
        </button>
      </div>

      <div className="admin-content">
        <div className="content-header">
          <h2>
            {activeTab === 'students' && 'Registered Students'}
            {activeTab === 'tutors' && 'Registered Tutors'}
            {activeTab === 'gatepasses' && 'Approved Gate Passes'}
          </h2>
          <input
            type="text"
            className="search-box"
            placeholder={getSearchPlaceholder()}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container">
          {activeTab === 'students' && (
            <>
              {filteredStudents.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Adm No</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Tutor</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const imageUrl = getImageUrl(student.image);
                      return (
                        <tr key={student._id}>
                          <td className="avatar-cell">
                            {imageUrl ? (
                              <img 
                                src={imageUrl}
                                alt={student.name}
                                className="avatar"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="avatar" 
                              style={{
                                background: '#e2e8f0',
                                display: imageUrl ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                                fontSize: '12px'
                              }}
                            >
                              No Image
                            </div>
                          </td>
                          <td>{student.admNo}</td>
                          <td>{student.name}</td>
                          <td>{student.dept}</td>
                          <td>{student.sem}</td>
                          <td>{student.tutorName}</td>
                          <td>{student.email}</td>
                          <td>{student.phone}</td>
                          <td>
                            <span className={`status-badge ${student.verified ? 'status-active' : 'status-pending'}`}>
                              {student.verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteStudent(student._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No Students Found</h3>
                  <p>No students match your search criteria.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'tutors' && (
            <>
              {filteredTutors.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Students Count</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTutors.map(tutor => {
                      const imageUrl = getImageUrl(tutor.image);
                      return (
                        <tr key={tutor._id}>
                          <td className="avatar-cell">
                            {imageUrl ? (
                              <img 
                                src={imageUrl}
                                alt={tutor.name}
                                className="avatar"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="avatar" 
                              style={{
                                background: '#e2e8f0',
                                display: imageUrl ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                                fontSize: '12px'
                              }}
                            >
                              No Image
                            </div>
                          </td>
                          <td>{tutor.empId}</td>
                          <td>{tutor.name}</td>
                          <td>{tutor.dept}</td>
                          <td>{tutor.email}</td>
                          <td>
                            {students.filter(s => s.tutorName === tutor.name).length}
                          </td>
                          <td>
                            <span className={`status-badge ${tutor.verified ? 'status-active' : 'status-pending'}`}>
                              {tutor.verified ? 'Verified' : 'Pending Approval'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            {!tutor.verified && (
                              <button 
                                className="action-btn view-btn"
                                onClick={() => handleApproveTutor(tutor._id)}
                              >
                                Approve
                              </button>
                            )}
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteTutor(tutor._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No Tutors Found</h3>
                  <p>No tutors match your search criteria.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'gatepasses' && (
            <>
              {filteredGatePasses.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Adm No</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Tutor</th>
                      <th>Purpose</th>
                      <th>Date/Time</th>
                      <th>Return Time</th>
                      <th>Return Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGatePasses.map(pass => {
                      // Calculate return information
                      const returnedStudents = pass.returnedStudents || [];
                      const returnedCount = returnedStudents.length;
                      const totalStudents = pass.totalStudents || (1 + (pass.groupMembers?.length || 0));
                      const allReturned = pass.allReturned || returnedCount >= totalStudents;
                      
                      return (
                        <tr key={pass._id}>
                          <td>{pass.admNo}</td>
                          <td>{pass.name}</td>
                          <td>{pass.dept}</td>
                          <td>{pass.tutorName}</td>
                          <td>{pass.purpose}</td>
                          <td>{new Date(pass.date).toLocaleString()}</td>
                          <td>{pass.returnTime || 'N/A'}</td>
                          <td className="return-status-cell">
                            {allReturned ? (
                              <span className="return-badge status-completed">
                                <i className="fas fa-check-circle" style={{marginRight: '5px'}}></i>
                                All Returned
                                <small style={{display: 'block', fontSize: '0.8em'}}>
                                  {returnedCount}/{totalStudents} students
                                </small>
                              </span>
                            ) : returnedCount > 0 ? (
                              <span className="return-badge status-partial">
                                <i className="fas fa-history" style={{marginRight: '5px'}}></i>
                                Partially Returned
                                <small style={{display: 'block', fontSize: '0.8em'}}>
                                  {returnedCount}/{totalStudents} students
                                </small>
                              </span>
                            ) : (
                              <span className="return-badge status-not-returned">
                                <i className="fas fa-clock" style={{marginRight: '5px'}}></i>
                                Not Returned
                                {totalStudents > 1 && (
                                  <small style={{display: 'block', fontSize: '0.8em'}}>
                                    {totalStudents} students
                                  </small>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="actions-cell">
                            {!allReturned && (
                              <button 
                                className="action-btn view-btn"
                                onClick={() => handleMarkAsReturned(pass._id)}
                                style={{ marginRight: '0.5rem' }}
                              >
                                Mark All Returned
                              </button>
                            )}
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteGatePass(pass._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No Approved Gate Passes Found</h3>
                  <p>No approved gate passes match your search criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;