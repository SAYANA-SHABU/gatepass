import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function StudentEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    admNo: "",
    dept: "",
    sem: "",
    tutorName: "",
    phone: "",
    email: "",
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await axios.get(`http://localhost:5000/student/${id}`);
        const s = res.data || {};
        setFormData({
          name: s.name || "",
          admNo: String(s.admNo || ""),
          dept: s.dept || "",
          sem: String(s.sem || ""),
          tutorName: s.tutorName || "",
          phone: String(s.phone || ""),
          email: s.email || "",
          image: null,
        });
      } catch (err) {
        console.error("Fetch student error", err);
        alert("Failed to load student data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

  function handleChange(e) {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  }

  function validate() {
    const vErrors = {};
    if (!formData.name.trim()) vErrors.name = "Name is required";
    if (!formData.admNo.trim()) vErrors.admNo = "Admission number required";
    if (!formData.dept.trim()) vErrors.dept = "Department is required";
    if (!formData.sem.trim()) vErrors.sem = "Semester required";
    if (!formData.tutorName.trim()) vErrors.tutorName = "Tutor required";
    if (!formData.phone.trim()) vErrors.phone = "Phone number required";
    if (!formData.email.trim()) vErrors.email = "Email required";
    setErrors(vErrors);
    return Object.keys(vErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const formDataToSend = new FormData();
      // Append fields — ensure numbers are sent sensibly
      formDataToSend.append("name", formData.name);
      formDataToSend.append("admNo", formData.admNo);
      formDataToSend.append("dept", formData.dept);
      formDataToSend.append("sem", formData.sem);
      formDataToSend.append("tutorName", formData.tutorName);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("email", formData.email);
      if (formData.image) formDataToSend.append("image", formData.image);

      const res = await axios.put(
        `http://localhost:5000/student/${id}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // If backend returns the updated student, great — otherwise at least navigate
      alert("Profile updated successfully!");
      // Navigate to the correct student URL (your dashboard route expects /student/:id)
      navigate(`/student/${id}`);
    } catch (err) {
      console.error("Update error:", err);
      const message =
        err?.response?.data?.message || err.message || "Update failed";
      alert("Failed to update profile: " + message);
    }
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="edit-profile-container">
      <h2>Edit Profile</h2>

      <form className="edit-form" onSubmit={handleSubmit}>
        <label htmlFor="name">Name:</label>
        <input id="name" name="name" value={formData.name} onChange={handleChange} />
        {errors.name && <p className="error">{errors.name}</p>}

        <label htmlFor="admNo">Admission No:</label>
        <input id="admNo" name="admNo" value={formData.admNo} onChange={handleChange} />
        {errors.admNo && <p className="error">{errors.admNo}</p>}

        <label htmlFor="dept">Department:</label>
        <input id="dept" name="dept" value={formData.dept} onChange={handleChange} />
        {errors.dept && <p className="error">{errors.dept}</p>}

        <label htmlFor="sem">Semester:</label>
        <input id="sem" name="sem" type="number" value={formData.sem} onChange={handleChange} />
        {errors.sem && <p className="error">{errors.sem}</p>}

        <label htmlFor="tutorName">Tutor Name:</label>
        <input id="tutorName" name="tutorName" value={formData.tutorName} onChange={handleChange} />
        {errors.tutorName && <p className="error">{errors.tutorName}</p>}

        <label htmlFor="phone">Phone:</label>
        <input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
        {errors.phone && <p className="error">{errors.phone}</p>}

        <label htmlFor="email">Email:</label>
        <input id="email" name="email" value={formData.email} onChange={handleChange} />
        {errors.email && <p className="error">{errors.email}</p>}

        <label htmlFor="image">Profile Photo:</label>
        <input id="image" type="file" name="image" accept="image/*" onChange={handleChange} />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

export default StudentEditForm;