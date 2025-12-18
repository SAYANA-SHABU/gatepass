// src/component/TutorEditForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function TutorEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    empId: "",
    dept: "",
    email: "",
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTutor() {
      try {
        const res = await axios.get(`http://localhost:5000/tutor/${id}`);
        const t = res.data;
        setFormData({
          name: t.name || "",
          empId: t.empId || "",
          dept: t.dept || "",
          email: t.email || "",
          image: null,
        });
      } catch (err) {
        console.error("Fetch tutor error", err);
        alert("Failed to load tutor details");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTutor();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: files ? files[0] : value,
    }));
  };

  const validate = () => {
    const v = {};
    if (!formData.name.trim()) v.name = "Name required";
    if (!formData.empId.trim()) v.empId = "Employee ID required";
    if (!formData.dept.trim()) v.dept = "Department required";
    if (!formData.email.trim()) v.email = "Email required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) v.email = "Invalid email";
    setErrors(v);
    return Object.keys(v).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const body = new FormData();
      body.append("name", formData.name.trim());
      body.append("empId", formData.empId.trim());
      body.append("dept", formData.dept.trim());
      body.append("email", formData.email.trim());
      if (formData.image) body.append("image", formData.image);

      const res = await axios.put(`http://localhost:5000/tutor/${id}`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Tutor updated successfully");
      // Go back to tutor dashboard/profile page
      navigate(`/tutor/${id}`, { replace: true });
    } catch (err) {
      console.error("Update error:", err);
      // If backend sends JSON error message
      const msg = err.response?.data?.message || "Failed to update tutor";
      alert(msg);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="edit-profile-container">
      <h2>Edit Tutor Profile</h2>
      <form onSubmit={handleSubmit} className="edit-form">
        <label htmlFor="name">Name:</label>
        <input id="name" name="name" value={formData.name} onChange={handleChange} />
        {errors.name && <p className="error">{errors.name}</p>}

        <label htmlFor="empId">Employee ID:</label>
        <input id="empId" name="empId" value={formData.empId} onChange={handleChange} />
        {errors.empId && <p className="error">{errors.empId}</p>}

        <label htmlFor="dept">Department:</label>
        <input id="dept" name="dept" value={formData.dept} onChange={handleChange} />
        {errors.dept && <p className="error">{errors.dept}</p>}

        <label htmlFor="email">Email:</label>
        <input id="email" name="email" value={formData.email} onChange={handleChange} />
        {errors.email && <p className="error">{errors.email}</p>}

        <label htmlFor="image">Profile Photo:</label>
        <input id="image" type="file" name="image" accept="image/*" onChange={handleChange} />

        <div style={{ marginTop: 12 }}>
          <button type="submit">Save Changes</button>{" "}
          <button type="button" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default TutorEditForm;
