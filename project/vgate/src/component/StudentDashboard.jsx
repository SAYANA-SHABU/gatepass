import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';

function StudentDashboard({ student: propStudent, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  // State declarations
  const [student, setStudent] = useState(propStudent || null);
  const [gatePasses, setGatePasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [activeTab, setActiveTab] = useState('approved');
  const [studentImage, setStudentImage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);
  
  // Utility: convert server image payload to data URL
  function convertImagePayload(img) {
    if (!img) return null;
    if (typeof img === 'string' && img.startsWith('data:')) return img;
    if (img.data && Array.isArray(img.data)) {
      const byteArray = new Uint8Array(img.data);
      let binary = '';
      for (let i = 0; i < byteArray.length; i++) {
        binary += String.fromCharCode(byteArray[i]);
      }
      return 'data:image/jpeg;base64,' + window.btoa(binary);
    }
    return null;
  }

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (student) {
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 30000);
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [student]);
  
  // Fetch the latest student data
  useEffect(() => {
    let cancelled = false;
    const fetchStudent = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/student/${id}`);
        if (cancelled) return;
        setStudent(res.data);
        
        // Convert image if present
        const src = convertImagePayload(res.data.image);
        if (src) {
          setStudentImage(src);
        } else {
          try {
            const imgRes = await axios.get(`http://localhost:5000/student/image/${id}`, {
              responseType: 'blob',
            });
            if (cancelled) return;
            const url = URL.createObjectURL(imgRes.data);
            setStudentImage(url);
          } catch {
            setStudentImage(null);
          }
        }
      } catch (err) {
        console.error('Error fetching student:', err);
        setStudent(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudent();
    return () => {
      cancelled = true;
    };
  }, [id, location.key]);

  // Fetch passes for this student
  useEffect(() => {
  let canceled = false;

  const fetchPasses = async () => {
    if (!student) {
      setGatePasses([]);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/gatepasses/${student._id}`
      );
      if (!canceled) {
        setGatePasses(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching gate passes:', err);
      setGatePasses([]);
    }
  };

  fetchPasses();
  return () => (canceled = true);
}, [student]);


  // If location.state contained a newly created pass, prepend it
  useEffect(() => {
    if (location.state?.newPass) {
      setGatePasses(prev => [location.state.newPass, ...prev]);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Fetch notifications function
  const fetchNotifications = async () => {
    if (!student) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/student/${student._id}/notifications`);
      const newNotifications = response.data.notifications;
      
      setNotifications(prev => {
        const newIds = newNotifications.map(n => n._id);
        const oldIds = prev.map(n => n._id);
        if (JSON.stringify(newIds) !== JSON.stringify(oldIds)) {
          const unread = newNotifications.filter(n => !n.read).length;
          setUnreadCount(unread);
          
          // Optional: Play sound or show subtle alert for new notifications
          if (unread > 0 && unread > prev.filter(n => !n.read).length) {
            // New notification received
          }
          
          return newNotifications;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`http://localhost:5000/student/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };



  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  const handleGetPass = () => {
    if (!student || !student._id) return alert('Student data not loaded');
    navigate(`/pass/${student._id}`);
  };

  const generateQR = async (passId) => {
    if (!student || !student._id) return alert('Student not loaded');
    try {
      const res = await axios.post(`http://localhost:5000/generate-qr/${student._id}`);
      setQrImage(res.data.qrImage);
      setSelectedPass(passId);
    } catch (err) {
      console.error('QR generation error:', err);
      alert('QR generation failed');
    }
  };
 const baseURL = 'http://localhost:5000/api'; 
// Replace the entire handleDeletePass function (lines around 195-240) with:
const handleDeletePass = async (passId) => {
  if (!student || !student._id) {
    alert('Student data not available');
    return;
  }
  
  const studentId = student._id;
  console.log(`Attempting to cancel pass: ${passId} for student: ${studentId}`);
  
  // Confirm with user
  if (!window.confirm('Are you sure you want to cancel this pending gate pass?')) {
    return;
  }
  
  try {
    // Remove the /api prefix since your backend route doesn't have it
    const response = await axios.patch(
      `http://localhost:5000/student/gatepass/cancel/${passId}/${studentId}`,
      {},  // Empty body
      {
        headers: {
          'Content-Type': 'application/json'
          // Remove Authorization header if you don't have token-based auth
          // 'Authorization': `Bearer ${token}`,
        }
      }
    );
    
    console.log("Cancel successful", response.data);
    
    // Update local state to remove the cancelled pass
    setGatePasses(prev => prev.filter(pass => pass._id !== passId));
    
    // Show success message
    alert('Gate pass cancelled successfully');
    
    // Refresh notifications
    fetchNotifications();
    
  } catch (error) {
    console.error("Cancel failed:", error);
    
    // Show appropriate error message
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to cancel gate pass';
    alert(`Error: ${errorMessage}`);
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return new Date(dateString).toLocaleString(undefined, options);
    } catch {
      return dateString;
    }
  };

  const formatNotificationTime = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return notificationDate.toLocaleDateString();
  };

  // Calculate stats
  const approvedPasses = gatePasses.filter(pass => pass.status === 'approved');
  const pendingPasses = gatePasses.filter(pass => pass.status === 'pending');

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading student data...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="loading-container">
        <p>Student not found or failed to load.</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-profile">
            <div className="avatar-square">
              {studentImage ? (
                <img 
                  src={studentImage} 
                  alt={`${student.name} Profile`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`avatar-square-placeholder ${studentImage ? 'avatar-fallback' : ''}`}>
                <i className="fas fa-user-graduate"></i>
              </div>
            </div>
            <div className="user-info">
              <h1>{student.name}</h1>
              <div className="user-details">
                <span className="detail-item">
                  <i className="fas fa-id-card"></i> {student.admNo}
                </span>
                <span className="detail-item">
                  <i className="fas fa-building"></i> {student.dept}
                </span>
                <span className="detail-item">
                  <i className="fas fa-graduation-cap"></i> Semester {student.sem}
                </span>
                <span className="detail-item">
                  <i className="fas fa-user-tie"></i> {student.tutorName}
                </span>
                <button 
                  className="edit-icon-btn"
                  onClick={() => navigate(`/student/edit/${student._id}`)}>
                  <i className="fas fa-edit"></i> Edit
                </button>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="notification-container" ref={notificationRef}>
    <div 
      className="notification-bell"
      onClick={() => setShowNotifications(!showNotifications)}
    >
      <i className="fas fa-bell"></i>
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </div>
    
    {/* Notification Dropdown */}
    {showNotifications && (
      <div className="notification-dropdown">
       <div className="notification-header">
        <h4>Notifications ({notifications.length})</h4>
        
          
          
        </div>
        
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <i className="fas fa-bell-slash"></i>
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="notification-icon">
  {notification.type === 'approval' ? (
    <i className="fas fa-check-circle approved-icon"></i>
  ) : notification.type === 'gatepass' ? (
    <i className="fas fa-passport"></i>
  ) : notification.type === 'rejection' ? (
    <i className="fas fa-times-circle rejected-icon"></i>
  ) : (
    <i className="fas fa-info-circle"></i>
  )}
</div>
                <div className="notification-content">
                  <h5>{notification.title}</h5>
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {formatNotificationTime(notification.date)}
                  </span>
                </div>
                {!notification.read && (
                  <div className="unread-dot"></div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="notification-footer">
          <button 
            className="view-all-btn"
            onClick={() => {
              setShowNotifications(false);
            }}
          >
            View All Notifications
          </button>
        </div>
      </div>
      
    )}
    </div>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-overview">
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
            <div className="stat-icon history">
              <i className="fas fa-history"></i>
            </div>
            <div className="stat-info">
              <h3>{gatePasses.length}</h3>
              <p>Total Passes</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* New Pass Button Section */}
        <div className="new-pass-section">
          <button className="primary-button" onClick={handleGetPass}>
            <i className="icon-pass"></i> Get New Gate Pass
          </button>
        </div>

        {/* QR Code Display Section */}
        {selectedPass && qrImage && (
          <div className="qr-section">
            <h3>QR Code Gate Pass</h3>
            <div className="qr-container">
              <img src={qrImage} alt="QR Code" className="qr-image" />
              <div className="qr-info">
                <p><strong>Scan this QR code at the gate</strong></p>
                <p>Valid for: {formatDate(gatePasses.find(p => p._id === selectedPass)?.date)}</p>
                <button 
                  className="secondary-button"
                  onClick={() => {
                    setSelectedPass(null);
                    setQrImage('');
                  }}
                >
                  Close QR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls and Tabs Section */}
        <div className="controls-section">
          <div className="tabs-container">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                <i className="fas fa-check-circle"></i>
                Approved Passes 
                <span className="tab-badge">{approvedPasses.length}</span>
              </button>
              <button 
  className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
  onClick={() => setActiveTab('pending')}
>
  <i className="fas fa-clock"></i>
  Pending Passes
  <span className="tab-badge">{pendingPasses.length}</span>
</button>

              <button 
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <i className="fas fa-history"></i>
                All Passes 
                <span className="tab-badge">{gatePasses.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Sections */}
        <div className="content-section">
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
                    {approvedPasses.length} approved passes
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading approved gate passes...</p>
                </div>
              ) : approvedPasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h3>No approved gate passes</h3>
                  <p>Your approved gate passes will appear here after tutor approval</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {approvedPasses.map(pass => (
                    <div key={pass._id} className="card approved-card">
                      <div className="card-header">
                        <div className="card-title">
                          <h4>Gate Pass #{String(pass._id).slice(-6)}</h4>
                        </div>
                        <span className="status-badge approved">
                          <i className="fas fa-check-circle"></i> Approved
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
                              <p>{formatDate(pass.date)}</p>
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
                              {pass.groupMembers.map((member, index) => (
                                <div key={index} className="group-member">
                                  <div className="group-member-info">
                                    <span className="member-name">{member.name}</span>
                                    <span className="member-adm">({member.admissionNo || member.admNo})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-actions">
                        <button 
                          className="qr-button"
                          onClick={() => generateQR(pass._id)}
                        >
                          <i className="fas fa-qrcode"></i> Generate QR Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Passes Tab Content */}
          {activeTab === 'pending' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-clock"></i>
                  Pending Gate Passes
                </h2>
                <div className="section-stats">
                  <span className="stats-badge pending">
                    {pendingPasses.length} awaiting approval
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading pending gate passes...</p>
                </div>
              ) : pendingPasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <h3>No pending gate passes</h3>
                  <p>Your gate pass requests will appear here while waiting for tutor approval</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {pendingPasses.map(pass => (
                    <div key={pass._id} className="card pending-card">
                      <div className="card-header">
                        <div className="card-title">
                          <h4>Gate Pass #{String(pass._id).slice(-6)}</h4>
                        </div>
                        <span className="status-badge pending">
                          <i className="fas fa-clock"></i> Pending Approval
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
                              <p>{formatDate(pass.date)}</p>
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
                              {pass.groupMembers.map((member, index) => (
                                <div key={index} className="group-member">
                                  <div className="group-member-info">
                                    <span className="member-name">{member.name}</span>
                                    <span className="member-adm">({member.admissionNo || member.admNo})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-actions">
                        
                      
<button 
  className="delete-button"
  onClick={() => handleDeletePass(pass._id)}  // Only passing passId
>
  <i className="fas fa-trash"></i> Delete
</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Passes Tab Content */}
          {activeTab === 'all' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-history"></i>
                  All Gate Passes
                </h2>
                <div className="section-stats">
                  <span className="stats-badge">
                    {gatePasses.length} total passes
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading all gate passes...</p>
                </div>
              ) : gatePasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-history"></i>
                  </div>
                  <h3>No gate passes found</h3>
                  <p>Your gate pass history will appear here</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {gatePasses.map(pass => (
                    <div key={pass._id} className={`card ${pass.status}-card`}>
                      <div className="card-header">
                        <div className="card-title">
                          <h4>Gate Pass #{String(pass._id).slice(-6)}</h4>
                        </div>
                        <span className={`status-badge ${pass.status}`}>
                          <i className={`fas fa-${pass.status === 'approved' ? 'check-circle' : pass.status === 'pending' ? 'clock' : 'times-circle'}`}></i> 
                          {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
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
                              <p>{formatDate(pass.date)}</p>
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
                              {pass.groupMembers.map((member, index) => (
                                <div key={index} className="group-member">
                                  <div className="group-member-info">
                                    <span className="member-name">{member.name}</span>
                                    <span className="member-adm">({member.admissionNo || member.admNo})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-actions">
                        {pass.status === 'approved' ? (
                          <button 
                            className="qr-button"
                            onClick={() => generateQR(pass._id)}
                          >
                            <i className="fas fa-qrcode"></i> Generate QR Code
                          </button>
                        ) : (
                          <button className="qr-button" disabled>
                            <i className={`fas fa-${pass.status === 'pending' ? 'hourglass-half' : 'ban'}`}></i> 
                            {pass.status === 'pending' ? 'Awaiting Approval' : 'Not Available'}
                          </button>
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

export default StudentDashboard;
