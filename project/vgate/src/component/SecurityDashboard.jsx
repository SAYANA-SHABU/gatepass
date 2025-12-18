import React, { useEffect, useState } from "react";
import "./SecurityDashboard.css";

const SecurityDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStudentsWithReturnTime = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/security/students-with-return-time");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsWithReturnTime();
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const submitReturned = async () => {
    if (!selected.length) return alert("Select at least one student");

    try {
      const res = await fetch("http://localhost:5000/security/mark-returned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selected }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`${result.count} student(s) marked as returned and removed from list`);
        setSelected([]);
        
        // Immediately remove marked students from local state
        setStudents(prev => prev.filter(student => !selected.includes(student._id)));
        
        // Also refresh from server to ensure consistency
        fetchStudentsWithReturnTime();
      } else {
        alert("Update failed");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const handleGuestReturn = async (gatePassId, memberData, studentId) => {
  try {
    // For guest members, use the regular mark-returned endpoint
    const res = await fetch("http://localhost:5000/security/mark-returned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        studentIds: [studentId],
        securityName: "Security" 
      }),
    });
    
    if (res.ok) {
      alert("Guest student marked as returned");
      
      // Remove guest from local state
      setStudents(prev => prev.filter(student => student._id !== studentId));
      
      // Refresh from server
      fetchStudentsWithReturnTime();
    } else {
      const error = await res.json();
      alert("Failed to mark guest as returned: " + (error.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Error marking guest as returned:", err);
    alert("Failed to mark guest as returned: " + err.message);
  }
};

  // Select all students
  const selectAll = () => {
    if (selected.length === students.length) {
      // If all are selected, deselect all
      setSelected([]);
    } else {
      // Select all student IDs
      const allIds = students.map(s => s._id);
      setSelected(allIds);
    }
  };

  return (
    <div className="security-container">
      <h2 className="title">Students With Return Time</h2>
      <p className="subtitle">Showing both main students and group members</p>
      
      {loading && <div className="loading">Loading...</div>}

      <div className="controls">
        <div className="selection-info">
          {selected.length > 0 && (
            <span className="selected-count">
              {selected.length} student(s) selected
            </span>
          )}
        </div>
        <div className="buttons">
          <button 
            className="select-all-btn"
            onClick={selectAll}
          >
            {selected.length === students.length ? "Deselect All" : "Select All"}
          </button>
          
          <button 
            className="submit-btn" 
            onClick={submitReturned}
            disabled={selected.length === 0}
          >
            Mark Selected as Returned ({selected.length})
          </button>
        </div>
      </div>

      <table className="security-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={students.length > 0 && selected.length === students.length}
                onChange={selectAll}
                disabled={students.length === 0}
              />
            </th>
            <th>Photo</th>
            <th>Type</th>
            <th>Name</th>
            <th>Adm No</th>
            <th>Department</th>
            <th>Semester</th>
            <th>Purpose</th>
            <th>Date</th>
            <th>Return Time</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="11" className="empty-msg">
                {loading ? "Loading..." : "No students with pending return time."}
              </td>
            </tr>
          ) : (
            students.map((s) => (
              <tr key={s._id} className={s.isGroupMember ? "group-member-row" : ""}>
                <td>
                  {!s.isGuest && (
                    <input
                      type="checkbox"
                      checked={selected.includes(s._id)}
                      onChange={() => toggleSelect(s._id)}
                    />
                  )}
                </td>
                <td>
                  {s.image ? (
                    <img
                      src={`http://localhost:5000/student/image/${s._id}`}
                      alt=""
                      className="student-img"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/50";
                        e.target.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="guest-photo">Guest</div>
                  )}
                </td>
                <td>
                  {s.isGuest ? "Guest" : s.isGroupMember ? "Group Member" : "Main Student"}
                </td>
                <td>{s.name}</td>
                <td>{s.admNo}</td>
                <td>{s.dept}</td>
                <td>{s.sem}</td>
                <td>{s.purpose}</td>
                <td>{s.date ? new Date(s.date).toLocaleString() : "N/A"}</td>
                <td>{s.returnTime}</td>
                <td>
                  {s.isGuest ? (
                    <button
                      className="mark-guest-btn"
                      onClick={() => handleGuestReturn(s.gatePassId, {
                        name: s.name,
                        admissionNo: s.admNo
                      }, s._id)}
                    >
                      Mark Returned
                    </button>
                  ) : (
                    <button
                      className="mark-single-btn"
                      onClick={() => {
                        setSelected([s._id]);
                        setTimeout(() => submitReturned(), 100);
                      }}
                    >
                      Mark
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SecurityDashboard;