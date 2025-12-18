import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './TutorDashboard.css';

function TutorDashboard({ tutor, onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [pendingPasses, setPendingPasses] = useState([]);
  const [approvedPasses, setApprovedPasses] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeTab, setActiveTab] = useState('pending-students');
  const [tutorImage, setTutorImage] = useState(null);
  const [currentTutor, setCurrentTutor] = useState(tutor);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationBox, setShowNotificationBox] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Helper function to convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Main data fetching effect
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
       
        // Determine current tutor - prioritize stored state over prop
        let tutorData = currentTutor || tutor;
       
        if (!tutorData && id) {
          const tutorResponse = await axios.get(`http://localhost:5000/tutor/${id}`);
          tutorData = tutorResponse.data;
          setCurrentTutor(tutorData);
        }
       
        if (!tutorData) {
          setError('Tutor profile not found');
          setIsLoading(false);
          return;
        }

        // Fetch tutor image - convert blob to base64 for stability
        let tutorImageUrl = null;
        try {
          const imageResponse = await axios.get(`http://localhost:5000/tutor/image/${tutorData._id}`, {
            responseType: 'blob'
          });
          // Convert blob to base64 data URL (more stable than blob URLs)
          tutorImageUrl = await blobToBase64(imageResponse.data);
        } catch (imageError) {
          console.log('Tutor image not available via endpoint, checking direct data...');
         
          // Fallback: Check if image exists in tutor data
          if (tutorData.image) {
            try {
              // If image is a Buffer
              if (Buffer.isBuffer(tutorData.image)) {
                const base64 = btoa(
                  new Uint8Array(tutorData.image).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ''
                  )
                );
                tutorImageUrl = `data:image/jpeg;base64,${base64}`;
              }
              // If image has data property
              else if (tutorData.image.data && Buffer.isBuffer(tutorData.image.data)) {
                const base64 = btoa(
                  new Uint8Array(tutorData.image.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ''
                  )
                );
                tutorImageUrl = `data:image/jpeg;base64,${base64}`;
              }
            } catch (bufferError) {
              console.log('Error processing tutor image buffer:', bufferError);
            }
          }
        }
        setTutorImage(tutorImageUrl);

        // Fetch all data in parallel
        const [studentsResponse, pendingPassesResponse, approvedPassesResponse, pendingStudentsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/tutor/${tutorData._id}/students`),
          axios.get(`http://localhost:5000/tutor/${tutorData._id}/pending-passes`),
          axios.get(`http://localhost:5000/tutor/${tutorData._id}/approved-passes`),
          axios.get(`http://localhost:5000/tutor/${tutorData._id}/pending-students`)
        ]);

        // Process student images - convert blobs to base64 for stability
        const studentsWithProcessedImages = await Promise.all(
          studentsResponse.data.map(async (student) => {
            let studentImageUrl = null;
           
            // Try to fetch from image endpoint first (most reliable)
            try {
              const studentImageResponse = await axios.get(`http://localhost:5000/student/image/${student._id}`, {
                responseType: 'blob',
                timeout: 5000
              });
              // Convert blob to base64 data URL (more stable than blob URLs)
              studentImageUrl = await blobToBase64(studentImageResponse.data);
            } catch (studentImageError) {
              console.log(`Student image not available for ${student.name}, trying alternative methods...`);
             
              // Fallback: Check if image exists in student data
              if (student.image) {
                try {
                  // If image is a Buffer
                  if (Buffer.isBuffer(student.image)) {
                    const base64 = btoa(
                      new Uint8Array(student.image).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                      )
                    );
                    studentImageUrl = `data:image/jpeg;base64,${base64}`;
                  }
                  // If image has data property
                  else if (student.image.data && Buffer.isBuffer(student.image.data)) {
                    const base64 = btoa(
                      new Uint8Array(student.image.data).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                      )
                    );
                    studentImageUrl = `data:image/jpeg;base64,${base64}`;
                  }
                } catch (bufferError) {
                  console.log(`Error processing image buffer for ${student.name}:`, bufferError);
                }
              }
            }
           
            return {
              ...student,
              displayImage: studentImageUrl
            };
          })
        );

        // Process images for pending students
        const pendingStudentsWithProcessedImages = await Promise.all(
          pendingStudentsResponse.data.map(async (student) => {
            let studentImageUrl = null;
           
            // Try to fetch from image endpoint first
            try {
              const studentImageResponse = await axios.get(`http://localhost:5000/student/image/${student._id}`, {
                responseType: 'blob',
                timeout: 5000
              });
              studentImageUrl = await blobToBase64(studentImageResponse.data);
            } catch (studentImageError) {
              console.log(`Pending student image not available for ${student.name}, trying alternative methods...`);
             
              // Fallback: Check if image exists in student data
              if (student.image) {
                try {
                  // If image is a Buffer
                  if (Buffer.isBuffer(student.image)) {
                    const base64 = btoa(
                      new Uint8Array(student.image).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                      )
                    );
                    studentImageUrl = `data:image/jpeg;base64,${base64}`;
                  }
                  // If image has data property
                  else if (student.image.data && Buffer.isBuffer(student.image.data)) {
                    const base64 = btoa(
                      new Uint8Array(student.image.data).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                      )
                    );
                    studentImageUrl = `data:image/jpeg;base64,${base64}`;
                  }
                } catch (bufferError) {
                  console.log(`Error processing pending student image buffer for ${student.name}:`, bufferError);
                }
              }
            }
           
            return {
              ...student,
              displayImage: studentImageUrl
            };
          })
        );

        setStudents(studentsWithProcessedImages);
        setPendingPasses(pendingPassesResponse.data);
        setApprovedPasses(approvedPassesResponse.data);
        setPendingStudents(pendingStudentsWithProcessedImages);
       
      } catch (fetchError) {
        console.error('Error loading dashboard data:', fetchError);
        setError('Unable to load dashboard information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [id]); // Only depend on id, not tutor prop

  // Update current tutor when prop changes
  useEffect(() => {
    if (tutor && tutor !== currentTutor) {
      setCurrentTutor(tutor);
    }
  }, [tutor]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const tutorData = currentTutor || tutor;
        
        if (tutorData) {
          const response = await axios.get(`http://localhost:5000/tutor/${tutorData._id}/notifications`);
          const newNotifications = response.data.notifications || [];
          
          // Check for new notifications since last check
          if (lastCheckTime) {
            const newCount = newNotifications.filter(notification => 
              new Date(notification.date) > new Date(lastCheckTime)
            ).length;
            
            // Show alert for new notifications (optional)
            if (newCount > 0 && !showNotificationBox) {
              console.log(`You have ${newCount} new notification(s)`);
            }
          }
          
          setNotifications(newNotifications);
          setUnreadCount(response.data.unreadCount || 0);
          setLastCheckTime(new Date());
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Initial fetch
    if (currentTutor || tutor) {
      fetchNotifications();
    }

    // Poll for new notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);

    return () => clearInterval(intervalId);
  }, [currentTutor, tutor, lastCheckTime, showNotificationBox]);

  // Function to handle notification click
  const handleNotificationClick = async (notificationId) => {
    try {
      // Mark as read
      await axios.post(`http://localhost:5000/tutor/notifications/${notificationId}/read`);
      
      // Update local state - mark as read but keep in list
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
      
      // Update unread count
      setUnreadCount(prev => {
        const clickedNotification = notifications.find(n => n.id === notificationId);
        return clickedNotification && !clickedNotification.read ? Math.max(0, prev - 1) : prev;
      });
      
      // Close the notification box
      setShowNotificationBox(false);
      
      // Navigate based on notification type
      const clickedNotif = notifications.find(n => n.id === notificationId);
      if (clickedNotif?.type === 'gatepass') {
        setActiveTab('pending');
      } else if (clickedNotif?.type === 'registration') {
        setActiveTab('pending-students');
      } else if (clickedNotif?.type === 'return') {
        setActiveTab('approved');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
      // Still update the UI locally even if backend call fails
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
    }
  };

  // Function to format time
  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter functions
  const getFilteredPassesByDate = (passesArray) => {
    if (!selectedDate) return passesArray;
   
    return passesArray.filter(pass => {
      const passDate = new Date(pass.date).toISOString().split('T')[0];
      return passDate === selectedDate;
    });
  };

  const getStudentsWithDateFilteredPasses = () => {
    if (!selectedDate) return [];
   
    const studentsWithFilteredPasses = [];
    const combinedPasses = [...pendingPasses, ...approvedPasses];
   
    combinedPasses.forEach(pass => {
      const passDate = new Date(pass.date).toISOString().split('T')[0];
      if (passDate === selectedDate) {
        const primaryStudent = students.find(s => s._id === pass.studentId?._id || s._id === pass.studentId);
        if (primaryStudent && !studentsWithFilteredPasses.find(s => s._id === primaryStudent._id)) {
          studentsWithFilteredPasses.push({
            ...primaryStudent,
            passPurpose: pass.purpose,
            passReturnTime: pass.returnTime,
            passStatus: pass.status
          });
        }
       
        if (pass.groupMembers && pass.groupMembers.length > 0) {
          pass.groupMembers.forEach(groupMember => {
            const groupStudent = students.find(s => s.admNo === (groupMember.admissionNo || groupMember.admNo));
            if (groupStudent && !studentsWithFilteredPasses.find(s => s._id === groupStudent._id)) {
              studentsWithFilteredPasses.push({
                ...groupStudent,
                passPurpose: pass.purpose,
                passReturnTime: pass.returnTime,
                passStatus: pass.status
              });
            }
          });
        }
      }
    });
   
    return studentsWithFilteredPasses;
  };

  // Gate pass approval functions
  const approveGatePass = async (passId) => {
    try {
      const tutorData = currentTutor || tutor;
      if (!tutorData) {
        alert('Unable to identify tutor. Please refresh the page.');
        return;
      }
     
      await axios.post(`http://localhost:5000/tutor/gatepass/${passId}/approve`, {
        status: 'approved',
        tutorId: tutorData._id
      });
     
      const approvedPass = pendingPasses.find(pass => pass._id === passId);
      setPendingPasses(pendingPasses.filter(pass => pass._id !== passId));
      setApprovedPasses([approvedPass, ...approvedPasses]);
     
      alert('Gate pass has been approved successfully!');
    } catch (approveError) {
      console.error('Error approving gate pass:', approveError);
      alert('Failed to approve gate pass: ' + approveError.message);
    }
  };

  const rejectGatePass = async (passId) => {
    try {
      const tutorData = currentTutor || tutor;
      if (!tutorData) {
        alert('Unable to identify tutor. Please refresh the page.');
        return;
      }
     
      await axios.post(`http://localhost:5000/tutor/gatepass/${passId}/approve`, {
        status: 'rejected',
        tutorId: tutorData._id
      });
     
      setPendingPasses(pendingPasses.filter(pass => pass._id !== passId));
      alert('Gate pass has been rejected successfully!');
    } catch (rejectError) {
      console.error('Error rejecting gate pass:', rejectError);
      alert('Failed to reject gate pass: ' + rejectError.message);
    }
  };

  // Student approval function
  const approveStudent = async (studentId) => {
    try {
      const tutorData = currentTutor || tutor;
      if (!tutorData) {
        alert('Unable to identify tutor. Please refresh the page.');
        return;
      }
      
      await axios.post(`http://localhost:5000/tutor/student/${studentId}/approve`, {
        tutorId: tutorData._id
      });
      
      // Remove from pending list and add to approved students list
      const approvedStudent = pendingStudents.find(student => student._id === studentId);
      setPendingStudents(pendingStudents.filter(student => student._id !== studentId));
      setStudents([...students, { ...approvedStudent, tutorApproved: true }]);
      
      alert('Student approved successfully!');
    } catch (error) {
      console.error('Error approving student:', error);
      alert('Failed to approve student: ' + error.message);
    }
  };

  // Utility functions
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    try {
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (dateError) {
      return 'Invalid date format';
    }
  };

  const handleUserLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  const handleEdit = () => {
    navigate(`/tutor/edit/${id}`);
  };

  if (error) {
    return (
      <div className="tutor-dashboard-container">
        <div className="error-state">
          <h3>Dashboard Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>
    );
  }

  const filteredPendingPasses = getFilteredPassesByDate(pendingPasses);
  const filteredApprovedPasses = getFilteredPassesByDate(approvedPasses);
  const filteredStudents = selectedDate ? getStudentsWithDateFilteredPasses() : students;

  // Use currentTutor for display
  const displayTutor = currentTutor || tutor;

  return (
    <div className="tutor-dashboard-container">
      {/* Header Section with Minimal Navbar */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-profile">
            <div className="avatar-square">
              {tutorImage ? (
                <img
                  src={tutorImage}
                  alt={`${displayTutor?.name || 'Tutor'} Profile`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`avatar-square-placeholder ${tutorImage ? 'avatar-fallback' : ''}`}>
                <i className="fas fa-user-tie"></i>
              </div>
            </div>
            <div className="user-info">
              <h1>{displayTutor?.name || 'Tutor Dashboard'}</h1>
              <div className="user-details">
                <span className="detail-item">
                  <i className="fas fa-id-card"></i> {displayTutor?.empId || 'N/A'}
                </span>
                <span className="detail-item">
                  <i className="fas fa-building"></i> {displayTutor?.dept || 'N/A'}
                </span>
                <span className="detail-item">
                  <i className="fas fa-envelope"></i> {displayTutor?.email || 'N/A'}
                </span>
                <button className="edit-profile-btn" onClick={handleEdit}>
                  <i className="fas fa-edit"></i> Edit 
                </button>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            {/* Notification Bell */}
            <div className="notification-wrapper">
              <button 
                className="notification-bell"
                onClick={() => setShowNotificationBox(!showNotificationBox)}
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="notification-count">{unreadCount}</span>
                )}
              </button>
              
              {/* Notification Box */}
              {showNotificationBox && (
                <div className="notification-box">
                  <div className="notification-header">
                    <h4>Notifications ({notifications.length})</h4>
                    
                  </div>
                  
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">
                        <i className="fas fa-bell-slash"></i>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div 
                          key={notification.id}
                          className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div className="notification-icon">
                            {notification.type === 'gatepass' ? (
                              <i className="fas fa-door-open"></i>
                            ) : notification.type === 'registration' ? (
                              <i className="fas fa-user-plus"></i>
                            ) : notification.type === 'return' ? (
                              <i className="fas fa-user-check return-icon"></i>
                            ) : (
                              <i className="fas fa-bell"></i>
                            )}
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">
                              {notification.title}
                              {!notification.read && <span className="unread-dot"></span>}
                            </div>
                            <div className="notification-message">
                              {notification.message}
                              {/* Show reason/purpose if available */}
                              {notification.reason && (
                                <div className="notification-reason">
                                 <strong>Reason:</strong> {notification.reason}
                                </div>
                              )}
                              {notification.securityName && (
                                <div className="notification-reason">
                                  <strong>Marked by:</strong> {notification.securityName}
                                </div>
                              )}
                            </div>
                            <div className="notification-time">
                              {formatNotificationTime(notification.date)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 5 && (
                    <div className="notification-footer">
                      <span className="more-text">{notifications.length - 5} more notifications</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Logout Button */}
            <button className="logout-btn" onClick={handleUserLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      <section className="stats-section">
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon pending">
              <i className="fas fa-user-clock"></i>
            </div>
            <div className="stat-info">
              <h3>{pendingStudents.length}</h3>
              <p>Pending Students</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <h3>{pendingPasses.length}</h3>
              <p>Pending Approvals</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon approved">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <h3>{approvedPasses.length}</h3>
              <p>Approved Passes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon students">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <h3>{students.length}</h3>
              <p>Total Students</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Controls and Filters Section */}
        <div className="controls-section">
          <div className="date-filter">
            <div className="filter-group">
              <label htmlFor="dateFilter">
                <i className="fas fa-calendar-alt"></i> Filter by Date:
              </label>
              <input
                type="date"
                id="dateFilter"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
              {selectedDate && (
                <button 
                  className="clear-filter"
                  onClick={() => setSelectedDate('')}
                >
                  <i className="fas fa-times"></i> Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs-container">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'pending-students' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending-students')}
              >
                <i className="fas fa-user-clock"></i>
                Student Approvals 
                <span className="tab-badge">{pendingStudents.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <i className="fas fa-clock"></i>
                Pending Approvals 
                <span className="tab-badge">{filteredPendingPasses.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                <i className="fas fa-check-circle"></i>
                Approved Passes 
                <span className="tab-badge">{filteredApprovedPasses.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <i className="fas fa-users"></i>
                Student Details 
                <span className="tab-badge">{filteredStudents.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Sections */}
        <div className="content-section">
          
          {/* Student Approvals Tab Content */}
          {activeTab === 'pending-students' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-user-clock"></i>
                  Pending Student Approvals
                </h2>
                <div className="section-stats">
                  <span className="stats-badge pending">
                    {pendingStudents.length} awaiting approval
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading pending student approvals...</p>
                </div>
              ) : pendingStudents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-user-check"></i>
                  </div>
                  <h3>No pending student approvals</h3>
                  <p>All student registrations have been approved. New registrations will appear here automatically.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {pendingStudents.map(student => (
                    <div key={student._id} className="card pending-card">
                      <div className="card-header">
                        <div className="student-info-with-avatar">
                          <div className="student-avatar-square">
                            {student.displayImage ? (
                              <>
                                <img 
                                  src={student.displayImage} 
                                  alt={student.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="avatar-square-placeholder-small student-avatar-fallback" style={{display: 'none'}}>
                                  <i className="fas fa-user-graduate"></i>
                                </div>
                              </>
                            ) : (
                              <div className="avatar-square-placeholder-small student-avatar-fallback">
                                <i className="fas fa-user-graduate"></i>
                              </div>
                            )}
                          </div>
                          <div className="card-title">
                            <h4>{student.name}</h4>
                            <span className="adm-no">{student.admNo}</span>
                          </div>
                        </div>
                        <span className="status-badge pending">
                          <i className="fas fa-clock"></i> Awaiting Approval
                        </span>
                      </div>
                      
                      <div className="card-body">
                        <div className="info-grid">
                          <div className="info-item">
                            <i className="fas fa-building"></i>
                            <div>
                              <label>Department</label>
                              <p>{student.dept}</p>
                            </div>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-graduation-cap"></i>
                            <div>
                              <label>Semester</label>
                              <p>Sem {student.sem}</p>
                            </div>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-phone"></i>
                            <div>
                              <label>Phone</label>
                              <p>{student.phone || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-envelope"></i>
                            <div>
                              <label>Email</label>
                              <p>{student.email || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="registration-date">
                          <i className="fas fa-calendar-plus"></i>
                          Registered on: {new Date(student.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="card-actions single-action">
                        <button 
                          className="btn-approve"
                          onClick={() => approveStudent(student._id)}
                        >
                          <i className="fas fa-check"></i> Approve Student
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Approvals Tab Content */}
          {activeTab === 'pending' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-clock"></i>
                  Pending Gate Pass Approvals
                </h2>
                <div className="section-stats">
                  <span className="stats-badge pending">
                    {filteredPendingPasses.length} awaiting review
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading pending approval requests...</p>
                </div>
              ) : filteredPendingPasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-inbox"></i>
                  </div>
                  <h3>No pending gate passes{selectedDate && ` for ${selectedDate}`}</h3>
                  <p>All gate pass requests have been processed. New requests will appear here automatically.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredPendingPasses.map(pass => (
                    <div key={pass._id} className="card pending-card">
                      <div className="card-header">
                        <div className="student-info-with-avatar">
                          <div className="student-avatar-square">
                            {(() => {
                              const student = students.find(s => s._id === pass.studentId?._id || s._id === pass.studentId);
                              if (student?.displayImage) {
                                return (
                                  <>
                                    <img
                                      src={student.displayImage}
                                      alt={pass.studentName}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="avatar-square-placeholder-small student-avatar-fallback" style={{display: 'none'}}>
                                      <i className="fas fa-user-graduate"></i>
                                    </div>
                                  </>
                                );
                              }
                              return (
                                <div className="avatar-square-placeholder-small student-avatar-fallback">
                                  <i className="fas fa-user-graduate"></i>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="card-title">
                            <h4>{pass.studentName}</h4>
                            <span className="adm-no">{pass.studentAdmNo}</span>
                          </div>
                        </div>
                        <span className="status-badge pending">
                          <i className="fas fa-clock"></i> Awaiting Approval
                        </span>
                      </div>
                      
                      <div className="card-body">
                        <div className="info-grid">
                          <div className="info-item">
                            <i className="fas fa-bullseye"></i>
                            <div>
                              <label>Purpose</label>
                              <p>{pass.purpose}</p>
                            </div>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-calendar"></i>
                            <div>
                              <label>Date & Time</label>
                              <p>{formatDisplayDate(pass.date)}</p>
                            </div>
                          </div>
                          {pass.returnTime && (
                            <div className="info-item">
                              <i className="fas fa-clock"></i>
                              <div>
                                <label>Expected Return</label>
                                <p>{pass.returnTime}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {pass.groupMembers && pass.groupMembers.length > 0 && (
                          <div className="group-section">
                            <h5>
                              <i className="fas fa-user-friends"></i>
                              Group Members ({pass.groupMembers.length})
                            </h5>
                            <div className="group-members">
                              {pass.groupMembers.map((member, index) => {
                                const groupStudent = students.find(s => s.admNo === (member.admissionNo || member.admNo));
                                return (
                                  <div key={index} className="group-member">
                                    <div className="group-member-avatar-square">
                                      {groupStudent?.displayImage ? (
                                        <>
                                          <img
                                            src={groupStudent.displayImage}
                                            alt={member.name}
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.nextSibling.style.display = 'flex';
                                            }}
                                          />
                                          <div className="avatar-square-placeholder-tiny" style={{display: 'none'}}>
                                            <i className="fas fa-user"></i>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="avatar-square-placeholder-tiny">
                                          <i className="fas fa-user"></i>
                                        </div>
                                      )}
                                    </div>
                                    <div className="group-member-info">
                                      <span className="member-name">{member.name}</span>
                                      <span className="member-adm">({member.admissionNo || member.admNo})</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-actions">
                        <button
                          className="btn-approve"
                          onClick={() => approveGatePass(pass._id)}
                        >
                          <i className="fas fa-check"></i> Approve Request
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => rejectGatePass(pass._id)}
                        >
                          <i className="fas fa-times"></i> Reject Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approved Passes Tab Content */}
          {activeTab === 'approved' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-check-circle"></i>
                  Approved Gate Passes
                </h2>
                <div className="section-stats">
                  <span className="stats-badge approved">
                    {filteredApprovedPasses.length} approved passes
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading approved gate passes...</p>
                </div>
              ) : filteredApprovedPasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h3>No approved gate passes{selectedDate && ` for ${selectedDate}`}</h3>
                  <p>Approved gate passes will be displayed here for reference and tracking.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredApprovedPasses.map(pass => {
                  
                    
                    const allReturned = pass.allReturned || false;
                    
                    return (
                      <div key={pass._id} className={`card approved-card ${allReturned ? 'returned-card' : ''}`}>
                        <div className="card-header">
                          <div className="student-info-with-avatar">
                            <div className="student-avatar-square">
                              {(() => {
                                const student = students.find(s => s._id === pass.studentId?._id || s._id === pass.studentId);
                                if (student?.displayImage) {
                                  return (
                                    <>
                                      <img
                                        src={student.displayImage}
                                        alt={pass.studentName}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="avatar-square-placeholder-small student-avatar-fallback" style={{display: 'none'}}>
                                        <i className="fas fa-user-graduate"></i>
                                      </div>
                                    </>
                                  );
                                }
                                return (
                                  <div className="avatar-square-placeholder-small student-avatar-fallback">
                                    <i className="fas fa-user-graduate"></i>
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="card-title">
                              <h4>{pass.studentName}</h4>
                              <span className="adm-no">{pass.studentAdmNo}</span>
                            </div>
                          </div>
                          <span className={`status-badge ${allReturned ? 'returned' : 'approved'}`}>
                            <i className={allReturned ? "fas fa-check-double" : "fas fa-check-circle"}></i>
                            {allReturned ? 'All Returned' : 'Approved'}
                          </span>
                        </div>
                        
                        <div className="card-body">
                          <div className="info-grid">
                            <div className="info-item">
                              <i className="fas fa-bullseye"></i>
                              <div>
                                <label>Purpose</label>
                                <p>{pass.purpose}</p>
                              </div>
                            </div>
                            <div className="info-item">
                              <i className="fas fa-calendar"></i>
                              <div>
                                <label>Date & Time</label>
                                <p>{formatDisplayDate(pass.date)}</p>
                              </div>
                            </div>
                            {pass.returnTime && (
                              <div className="info-item">
                                <i className="fas fa-clock"></i>
                                <div>
                                  <label>Expected Return</label>
                                  <p>{pass.returnTime}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Return Status */}
                            <div className="info-item">
                              <i className="fas fa-user-check"></i>
                              <div>
                                <label>Return Status</label>
                                <p>
                                  <span className={`return-status ${allReturned ? 'all-returned' : 'partial-returned'}`}>
                                    Returned
                                  </span>
                                  {allReturned && (
                                    <span className="fully-returned-badge">
                                      <i className="fas fa-check"></i> All safe
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            {/* Returned Students List */}
                            {pass.returnedStudents && pass.returnedStudents.length > 0 && (
                              <div className="info-item">
                                <i className="fas fa-history"></i>
                                <div>
                                  <label>Returned Students</label>
                                  <div className="returned-list">
                                    {pass.returnedStudents.slice(0, 3).map((rs, idx) => (
                                      <span key={idx} className="returned-student-tag">
                                        {rs.name || rs.studentId?.name}
                                        {rs.returnedBy && (
                                          <small> by {rs.returnedBy}</small>
                                        )}
                                      </span>
                                    ))}
                                    {pass.returnedStudents.length > 3 && (
                                      <span className="more-returned">
                                        +{pass.returnedStudents.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {pass.groupMembers && pass.groupMembers.length > 0 && (
                            <div className="group-section">
                              <h5>
                                <i className="fas fa-user-friends"></i>
                                Group Members ({pass.groupMembers.length})
                              </h5>
                              <div className="group-members">
                                {pass.groupMembers.map((member, index) => {
                                  const groupStudent = students.find(s => s.admNo === (member.admissionNo || member.admNo));
                                  const isReturned = pass.returnedStudents?.some(rs => 
                                    rs.admissionNo === (member.admissionNo || member.admNo)
                                  );
                                  
                                  return (
                                    <div key={index} className={`group-member ${isReturned ? 'returned-member' : ''}`}>
                                      <div className="group-member-avatar-square">
                                        {groupStudent?.displayImage ? (
                                          <>
                                            <img
                                              src={groupStudent.displayImage}
                                              alt={member.name}
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                              }}
                                            />
                                            <div className="avatar-square-placeholder-tiny" style={{display: 'none'}}>
                                              <i className="fas fa-user"></i>
                                            </div>
                                          </>
                                        ) : (
                                          <div className="avatar-square-placeholder-tiny">
                                            <i className="fas fa-user"></i>
                                          </div>
                                        )}
                                        {isReturned && (
                                          <div className="returned-indicator">
                                            <i className="fas fa-check"></i>
                                          </div>
                                        )}
                                      </div>
                                      <div className="group-member-info">
                                        <span className="member-name">{member.name}</span>
                                        <span className="member-adm">({member.admissionNo || member.admNo})</span>
                                        {isReturned && (
                                          <span className="returned-time">
                                            <i className="fas fa-check-circle"></i> Returned
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="card-meta">
                          <div className="meta-info">
                            <i className="fas fa-user-check"></i>
                            Approved on: {formatDisplayDate(pass.approvedAt)}
                          </div>
                          {allReturned && pass.returnedStudents?.length > 0 && (
                            <div className="meta-info returned-info">
                              <i className="fas fa-shield-alt"></i>
                              All students returned at: {formatDisplayDate(pass.returnedStudents[pass.returnedStudents.length - 1].returnedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Student Details Tab Content */}
          {activeTab === 'students' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-users"></i>
                  {selectedDate 
                    ? `Students with Passes on ${selectedDate}` 
                    : 'Student Details'
                  }
                </h2>
                <div className="section-stats">
                  <span className="stats-badge students">
                    {filteredStudents.length} students
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading student information...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-user-graduate"></i>
                  </div>
                  <h3>
                    {selectedDate 
                      ? `No student activity on ${selectedDate}`
                      : 'No students currently assigned'
                    }
                  </h3>
                  <p>
                    {selectedDate 
                      ? 'Students will appear here when they have scheduled gate passes for the selected date.'
                      : 'Student assignments are managed through the registration system.'
                    }
                  </p>
                </div>
              ) : (
                <div className="students-grid">
                  {filteredStudents.map(student => (
                    <div key={student._id} className="student-card">
                      <div className="student-header">
                        <div className="student-avatar-square">
                          {student.displayImage ? (
                            <>
                              <img
                                src={student.displayImage}
                                alt={student.name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className={`avatar-square-placeholder ${student.displayImage ? 'avatar-fallback' : ''}`} style={{display: 'none'}}>
                                <i className="fas fa-user-graduate"></i>
                              </div>
                            </>
                          ) : (
                            <div className="avatar-square-placeholder">
                              <i className="fas fa-user-graduate"></i>
                            </div>
                          )}
                        </div>
                        <div className="student-info">
                          <h4>{student.name}</h4>
                          <div className="student-meta">
                            <span className="student-adm">{student.admNo}</span>
                            <span className="student-sem">Sem {student.sem}</span>
                            <span className="student-dept">{student.dept}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="student-details">
                        <div className="contact-info">
                          <div className="contact-item">
                            <i className="fas fa-phone"></i>
                            <span>{student.phone || 'Not provided'}</span>
                          </div>
                          <div className="contact-item">
                            <i className="fas fa-envelope"></i>
                            <span>{student.email || 'Not provided'}</span>
                          </div>
                          {student.parent_No && (
                            <div className="contact-item">
                              <i className="fas fa-user-friends"></i>
                              <span>Parent: {student.parent_No}</span>
                            </div>
                          )}
                        </div>
                        
                        {student.passPurpose && (
                          <div className="gatepass-info">
                            <div className="pass-detail">
                              <i className="fas fa-bullseye"></i>
                              <span><strong>Purpose:</strong> {student.passPurpose}</span>
                            </div>
                            <div className="pass-detail">
                              <i className="fas fa-clock"></i>
                              <span><strong>Return Time:</strong> {student.passReturnTime}</span>
                            </div>
                            <div className="pass-detail">
                              <i className="fas fa-tag"></i>
                              <span>
                                <strong>Status:</strong>
                                <span className={`status-badge ${student.passStatus}`}>
                                  {student.passStatus}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TutorDashboard;