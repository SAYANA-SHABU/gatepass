const express = require("express")
const app = express()
const QRCode = require('qrcode')
app.use(express.json())
const Student = require('./models/student')
const Tutor = require('./models/tutor')
const GatePass = require("./models/GatePass")
const cors = require('cors')
app.use(cors())
const multer = require('multer')
const bcrypt = require('bcryptjs')
const connectDB = require('./connection')
const nodemailer = require('nodemailer');
require('dotenv').config();
const crypto = require('crypto');
// Connect to database
connectDB

const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Serve static files
app.use(express.static('public'))
// Helper function to get all students in a gate pass
// Helper function to get all students in a gate pass
async function getStudentsForGatePass(gatePass) {
  const students = [];
  
  const mainStudent = await Student.findById(gatePass.studentId);
  if (mainStudent) {
    students.push(mainStudent);
  }

  if (gatePass.groupMembers) {
    for (const member of gatePass.groupMembers) {
      const admissionNo = member.admissionNo || member.admNo;
      if (admissionNo) {
        const student = await Student.findOne({ admNo: admissionNo });
        if (student) {
          students.push(student);
        }
      }
    }
  }

  return students;
}
app.patch('/student/gatepass/cancel/:passId/:studentId', async (req, res) => {
  try {
    const { passId, studentId } = req.params;

    const gatePass = await GatePass.findOne({
      _id: passId,
      studentId,
      status: 'pending'
    });

    if (!gatePass) {
      return res.status(404).json({ message: 'Pending gate pass not found' });
    }

    gatePass.status = 'cancelled';
    await gatePass.save();

    await Student.findByIdAndUpdate(studentId, {
      passStatus: 'cancelled',
      groupId: null
    });

    res.status(200).json({ message: 'Gate pass cancelled successfully' });

  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Security middleware
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  next()
})
// Get tutor image route
app.get('/tutor/image/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
    if (!tutor || !tutor.image) {
      return res.status(404).send('Image not found')
    }
    res.set('Content-Type', 'image/jpeg')
    res.send(tutor.image)
  } catch (err) {
    console.error('Error fetching tutor image:', err)
    res.status(500).send('Server error')
  }
})

// Input validation function
const validateStudentRegistration = (data) => {
  const errors = []
   if (!data.admNo) {
    errors.push('Admission number required');
  } else {
    const admNoRegex = /^\d{3}\/\d{2}$/;
    if (!admNoRegex.test(data.admNo)) {
      errors.push('Admission number must be in format: YYY/NN (e.g., 234/23)');
    }
  }
  if (!data.name || data.name.trim().length < 2) errors.push('Valid name required');
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) errors.push('Valid email required');
  if (!data.phone || isNaN(data.phone) || data.phone.toString().length !== 10) errors.push('Valid 10-digit phone number required')
  if (!data.password || data.password.length < 6) errors.push('Password must be at least 6 characters')
  return errors
}

// Get student image route
app.get('/student/image/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student || !student.image) {
      return res.status(404).send('Image not found')
    }
    res.set('Content-Type', 'image/jpeg')
    res.send(student.image)
  } catch (err) {
    console.error('Error fetching student image:', err)
    res.status(500).send('Server error')
  }
})

// Student registration with password hashing
app.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { admNo, name, dept, sem, tutorName, phone, email, password } = req.body
    
    // Validate required fields
    if (!admNo || !name || !dept || !sem || !tutorName || !phone || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required'
      })
    }
    const admNoRegex = /^\d{3}\/\d{2}$/;
    if (!admNoRegex.test(admNo)) {
      return res.status(400).json({
        message: 'Admission number must be in format: YYY/NN (e.g., 234/23)'
      });
    }
    // Input validation
    const validationErrors = validateStudentRegistration(req.body)
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      })
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [
        { admNo: admNo },
        { email: email }
      ]
    })

    if (existingStudent) {
      return res.status(400).json({ 
        message: 'Student with this admission number or email already exists' 
      })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new student
    const student = new Student({
      admNo: admNo,
      name: name.trim(),
      dept: dept.trim(),
      sem: Number(sem),
      tutorName: tutorName.trim(),
      phone: Number(phone),
      email: email.trim(),
      password: hashedPassword,
      image: req.file ? req.file.buffer : undefined,
    })

    await student.save()
    
    res.status(201).json({ 
      message: 'Registration successful',
      studentId: student._id 
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Student with this admission number or email already exists' 
      })
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message 
      })
    }
    
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    })
  }
})

// Login route with bcrypt
app.post('/login', async (req, res) => {
  try {
    const admNo = req.body.admNo
    const { password } = req.body

    const student = await Student.findOne({ admNo: admNo })
    if (student) {
      // Check if student is approved by tutor
      if (!student.tutorApproved) {
        return res.status(403).json({ 
          message: 'Your registration is pending tutor approval. Please contact your tutor.' 
        });
      }
      
      if (await bcrypt.compare(password, student.password)) {
        res.json({ 
          message: 'Login successful', 
          student: {
            _id: student._id,
            name: student.name,
            admNo: student.admNo,
            dept: student.dept,
            email: student.email
          }
        })
      } else {
        res.status(401).json({ message: 'Invalid credentials' })
      }
    } else {
      res.status(401).json({ message: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

app.post('/form-fill/:id', async (req, res) => {
  const { id } = req.params;
  const { purpose, date, returnTime, groupMembers } = req.body;

  try {
    const mainStudent = await Student.findById(id);
    if (!mainStudent) return res.status(404).json({ message: 'Main student not found' });

    // Process group members to fetch existing student data
    const processedGroupMembers = [];
    
    if (groupMembers && groupMembers.length) {
      for (const member of groupMembers) {
        // Check if member has admission number
        const admNo = member.admissionNo || member.admNo;
        
        if (admNo) {
          // Look for existing student by admission number
          const existingStudent = await Student.findOne({ 
            admNo: String(admNo).trim()  // Convert to string and trim
          });
          
          if (existingStudent) {
            // Use existing student data
            processedGroupMembers.push({
              name: existingStudent.name,
              admissionNo: existingStudent.admNo,
              admNo: existingStudent.admNo, // Include both for compatibility
              dept: existingStudent.dept,
              sem: existingStudent.sem,
              tutorName: existingStudent.tutorName,
              phone: existingStudent.phone,
              email: existingStudent.email
            });
            
            // Also update the existing student's group info
            existingStudent.groupId = null; // Will be set after gate pass creation
            existingStudent.purpose = purpose;
            existingStudent.date = date;
            existingStudent.returnTime = returnTime;
            existingStudent.passStatus = 'pending';
            await existingStudent.save();
          } else {
            // If no existing student found, use provided data
            processedGroupMembers.push({
              name: member.name || 'Unknown',
              admissionNo: admNo,
              admNo: admNo,
              dept: member.dept || ''
            });
          }
        } else {
          // If no admission number provided, use provided data
          processedGroupMembers.push({
            name: member.name || 'Unknown',
            admissionNo: '',
            admNo: '',
            dept: member.dept || ''
          });
        }
      }
    }

    // Create gate pass record with processed group members
    const gp = new GatePass({
      studentId: mainStudent._id,
      purpose,
      date,
      returnTime,
      groupMembers: processedGroupMembers,
      status: 'pending'
    });
    await gp.save();

    // Update main student record
    mainStudent.groupId = gp._id;
    mainStudent.purpose = purpose;
    mainStudent.date = date;
    mainStudent.returnTime = returnTime;
    mainStudent.passStatus = 'pending';
    await mainStudent.save();

    // Update group members with gate pass ID
    for (const member of processedGroupMembers) {
      if (member.admissionNo) {
        const existingMember = await Student.findOne({ 
          admNo: String(member.admissionNo).trim() 
        });
        
        if (existingMember) {
          existingMember.groupId = gp._id;
          await existingMember.save();
        }
      }
    }

    return res.status(200).json({ 
      message: 'GatePass submitted for tutor approval', 
      gatePass: gp, 
      student: mainStudent 
    });
  } catch (err) {
    console.error('Form fill error:', err);
    return res.status(500).json({ 
      message: 'Form fill failed', 
      error: err.message 
    });
  }
});

// Add this endpoint to check if student exists by admission number
app.get('/check-student/:admNo', async (req, res) => {
  try {
    const { admNo } = req.params;
    
    if (!admNo) {
      return res.status(400).json({ message: 'Admission number required' });
    }
    
    // Look for student by admission number
    const student = await Student.findOne({ 
      admNo: String(admNo).trim(),
      tutorApproved: true // Only check approved students
    });
    
    if (!student) {
      return res.status(404).json({ 
        exists: false,
        message: 'Student not found or not approved yet'
      });
    }
    
    res.json({
      exists: true,
      student: {
        name: student.name,
        admNo: student.admNo,
        dept: student.dept,
        sem: student.sem,
        tutorName: student.tutorName
      }
    });
    
  } catch (error) {
    console.error('Check student error:', error);
    res.status(500).json({ 
      message: 'Error checking student', 
      error: error.message 
    });
  }
});
// Generate QR code route
app.post("/generate-qr/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params
    const student = await Student.findById(studentId)

    if (!student) return res.status(404).json({ message: "Student not found" })

    const verifyUrl = `${req.protocol}://${req.get('host')}/gatepass/${studentId}`
    const qrImage = await QRCode.toDataURL(verifyUrl)

    res.json({ 
      qrImage, 
      studentData: {
        name: student.name,
        admNo: student.admNo,
        dept: student.dept
      }
    })
  } catch (err) {
    console.error('QR generation error:', err)
    res.status(500).json({ message: "QR generation failed" })
  }
})

// Gate pass verification page
app.get('/gatepass/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).send('<h2>Student not found</h2>')

    // Find gatepass
    let gatePass = null
    if (student.groupId) {
      gatePass = await GatePass.findById(student.groupId)
    }
    if (!gatePass) {
      gatePass = await GatePass.findOne({ studentId: student._id })
    }
    if (!gatePass) {
      gatePass = {
        _id: null,
        purpose: student.purpose || 'N/A',
        date: student.date || null,
        returnTime: student.returnTime || null,
        groupMembers: []
      }
    }

    // Build members list
    const members = []
    members.push({
      _id: student._id,
      name: student.name,
      admNo: student.admNo.toString(),
      dept: student.dept,
      sem: student.sem,
      image: student.image ? `data:image/jpeg;base64,${student.image.toString('base64')}` : null,
      verified: student.verified || false
    })

    // Process group members
    for (const gm of gatePass.groupMembers || []) {
      const admNo = gm.admissionNo || gm.admNo
      let memberDoc = null
      if (admNo) {
        memberDoc = await Student.findOne({ admNo: admNo.toString() })
      }

      members.push({
        _id: memberDoc ? memberDoc._id : ('new-' + (admNo || gm.name)),
        name: gm.name || (memberDoc && memberDoc.name) || 'Unknown',
        admNo: admNo || (memberDoc && memberDoc.admNo) || '',
        dept: gm.dept || (memberDoc && memberDoc.dept) || '',
        sem: (memberDoc && memberDoc.sem) || gm.sem || '-',
        image: memberDoc && memberDoc.image ? `data:image/jpeg;base64,${memberDoc.image.toString('base64')}` : null,
        verified: (memberDoc && memberDoc.verified) || false
      })
    }

    // Build table rows with checkboxes
    const tableRows = members.map(m => `
      <tr>
        <td><img src="${m.image || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;border-radius:4px;object-fit:cover;"></td>
        <td>${m.name}</td>
        <td>${m.admNo}</td>
        <td>${m.dept}</td>
        <td>${m.sem}</td>
        <td>${gatePass.purpose || 'N/A'}</td>
        <td>${gatePass.date ? new Date(gatePass.date).toLocaleString() : 'N/A'}</td>
        <td>${gatePass.returnTime || 'N/A'}</td>
        <td>
          <input type="checkbox" 
                 id="verify-${m._id}" 
                 name="verify-${m._id}" 
                 data-student-id="${m._id}" 
                 autocomplete="off">
        </td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gate Pass Verification</title>
        <style>
          body{font-family:Arial;background:#f0f4f8;padding:30px;display:flex;justify-content:center}
          .container{background:#fff;padding:25px;border-radius:12px;box-shadow:0 5px 20px rgba(0,0,0,0.15);max-width:1200px;width:100%}
          table{width:100%;border-collapse:collapse}
          th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}
          th{background:#f8f9fa}
          img{display:block}
          button{padding:10px 20px;border:none;background:#3498db;color:#fff;border-radius:6px;cursor:pointer;margin-top:15px}
          .verified{color:green;font-weight:bold}
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Gate Pass Verification</h2>

          <table>
            <thead>
              <tr>
                <th>Photo</th><th>Name</th><th>Admission No</th><th>Department</th><th>Semester</th><th>Purpose</th><th>Date</th><th>Return Time</th><th>Verified</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <button id="submitBtn">Submit Verifications</button>
        </div>

        <script>
          document.getElementById('submitBtn').addEventListener('click', async () => {
            const verifiedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')).map(cb => cb.dataset.studentId);
            if (!verifiedIds.length) return alert('Select at least one student to verify');
            try {
              const res = await fetch('/verify-students', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ studentIds: verifiedIds })
              });
              if (res.ok) { 
                alert('Students verified successfully'); 
                location.reload(); 
              } else { 
                alert('Verification failed'); 
              }
            } catch (err) { 
              alert('Server error'); 
            }
          });
        </script>
      </body>
      </html>
    `
    res.send(html)

  } catch (err) {
    console.error('Gate pass verification error:', err)
    res.status(500).send('<h2>Server Error</h2>')
  }
})

// Get student by ID
app.get('/student/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }
    res.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    res.status(500).json({ message: 'Error fetching student', error: error.message })
  }
})

// Create new gate pass
app.post('/gatepasses', async (req, res) => {
  try {
    const { studentId, purpose, date, groupMembers, returnTime } = req.body
    
    // Create pass
    const gatePass = new GatePass({
      studentId,
      purpose,
      date,
      groupMembers,
      returnTime,
      status: 'approved'
    })
    
    await gatePass.save()
    
    res.json({ 
      message: 'Gate pass created successfully',
      pass: gatePass
    })
  } catch (error) {
    console.error('Gate pass creation error:', error)
    res.status(500).json({ message: 'Failed to create gate pass', error: error.message })
  }
})

// Verify students route
app.post('/verify-students', async (req, res) => {
  const { studentIds } = req.body
  try {
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { verified: true }
    )
    res.status(200).json({ message: 'Students verified successfully' })
  } catch (error) {
    console.error('Verification error:', error)
    res.status(500).json({ message: 'Verification failed', error: error.message })
  }
})

// Get gate pass history for a student (removes duplicates)
app.get('/gatepasses/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    // Find all passes where student is main or a group member
    const passes = await GatePass.find({
      $or: [
        { studentId },
        { 'groupMembers.admNo': student.admNo.toString() },
        { 'groupMembers.admissionNo': student.admNo.toString() }
      ]
    }).sort({ createdAt: -1 })

    // Remove duplicates by comparing GatePass._id
    const uniquePasses = []
    const seenIds = new Set()

    for (const pass of passes) {
      if (!seenIds.has(pass._id.toString())) {
        seenIds.add(pass._id.toString())
        uniquePasses.push(pass)
      }
    }

    res.status(200).json(uniquePasses)
  } catch (err) {
    console.error('Error fetching gate passes:', err)
    res.status(500).json({ message: 'Failed to fetch gate passes', error: err.message })
  }
})

// Tutor registration route
app.post('/tutor/register', upload.single('image'), async (req, res) => {
  try {
    const { empId, name, dept, email, password } = req.body

    // Check if tutor already exists
    const existingTutor = await Tutor.findOne({ 
      $or: [
        { empId: empId },
        { email: email }
      ]
    })

    if (existingTutor) {
      return res.status(400).json({ 
        message: 'Tutor with this employee ID or email already exists' 
      })
    }

    // Hash password for tutor
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const tutor = new Tutor({
      empId,
      name,
      dept,
      email,
      password: hashedPassword,
      image: req.file ? req.file.buffer : undefined,
      verified: false,
      status: 'pending'
    })

    await tutor.save()
    res.json({ message: 'Tutor registered successfully and awaiting admin verification' })
  } catch (error) {
    console.error('Tutor registration error:', error)
    res.status(500).json({ message: 'Tutor registration failed', error: error.message })
  }
})

// Tutor login route
app.post('/tutor/login', async (req, res) => {
  try {
    const { empId, password } = req.body;

    const tutor = await Tutor.findOne({ empId: empId });
    if (tutor && await bcrypt.compare(password, tutor.password)) {
      // ✅ Check if tutor is verified by admin
      if (!tutor.verified) {
        return res.status(403).json({ 
          message: 'Your account is pending admin approval. Please wait for approval.' 
        });
      }
      
      res.json({ 
        message: 'Login successful', 
        tutor: {
          _id: tutor._id,
          name: tutor.name,
          empId: tutor.empId,
          dept: tutor.dept,
          email: tutor.email
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Tutor login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get approved gate passes for a tutor's students
// Update the approved passes endpoint to include return status
app.get('/tutor/:id/approved-passes', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Find all students with this tutor
    const students = await Student.find({ tutorName: tutor.name });
    const studentIds = students.map(s => s._id);
    
    // Find approved passes for these students, sorted by date
    const passes = await GatePass.find({ 
      studentId: { $in: studentIds },
      status: 'approved'
    })
    .populate('studentId', 'name admNo dept sem returned')
    .populate('returnedStudents.studentId', 'name admNo')
    .sort({ createdAt: -1 });
    
    // Format the response with return information
    const formattedPasses = passes.map(pass => {
      const student = pass.studentId;
      const totalStudents = 1 + (pass.groupMembers?.length || 0);
      const returnedCount = pass.returnedStudents?.length || 0;
      const allReturned = pass.allReturned || false;
      
      return {
        _id: pass._id,
        purpose: pass.purpose,
        date: pass.date,
        returnTime: pass.returnTime,
        groupMembers: pass.groupMembers,
        returnedStudents: pass.returnedStudents,
        allReturned: allReturned,
        returnedCount: returnedCount,
        totalStudents: totalStudents,
        createdAt: pass.createdAt,
        approvedAt: pass.approvedAt,
        studentName: student.name,
        studentAdmNo: student.admNo,
        studentDept: student.dept,
        studentSem: student.sem,
        studentId: student._id,
        studentReturned: student.returned || false
      };
    });
    
    res.json(formattedPasses);
  } catch (error) {
    console.error('Error fetching approved passes:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});
// Get tutor by ID
app.get('/tutor/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' })
    }
    res.json(tutor)
  } catch (error) {
    console.error('Error fetching tutor:', error)
    res.status(500).json({ message: 'Error fetching tutor', error: error.message })
  }
})

// Get students under a tutor
app.get('/tutor/:id/students', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' })
    }
    
    const students = await Student.find({ tutorName: tutor.name })
    res.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({ message: 'Error fetching students', error: error.message })
  }
})

// Approve/reject gate pass - UPDATED
// In the gate pass approval endpoint (/tutor/gatepass/:id/approve), add:
app.post('/tutor/gatepass/:id/approve', async (req, res) => {
  try {
    const { status, tutorId } = req.body;
    
    // Update gate pass
    const updatedPass = await GatePass.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        approvedBy: status === 'approved' ? tutorId : null,
        approvedAt: status === 'approved' ? new Date() : null
      },
      { new: true }
    ).populate('studentId', 'name admNo dept');
    
    if (!updatedPass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    // When approving, set returned: false for all students
    if (status === 'approved') {
      // Update main student - set returned to false
      await Student.findByIdAndUpdate(
        updatedPass.studentId._id,
        { 
          passStatus: status,
          purpose: updatedPass.purpose,
          date: updatedPass.date,
          returnTime: updatedPass.returnTime,
          returned: false  // IMPORTANT: Reset returned status
        }
      );

      // Update group members - set returned to false
      await Student.updateMany(
        { groupId: req.params.id },
        { 
          passStatus: status,
          purpose: updatedPass.purpose,
          date: updatedPass.date,
          returnTime: updatedPass.returnTime,
          returned: false  // IMPORTANT: Reset returned status
        }
      );
    }
    
    res.json({ 
      message: `Gate pass ${status} successfully`,
      gatePass: updatedPass
    });
  } catch (error) {
    console.error('Error updating gate pass:', error);
    res.status(500).json({ message: 'Error updating gate pass', error: error.message });
  }
});
// Get pending gate passes for a tutor's students - UPDATED
app.get('/tutor/:id/pending-passes', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Find all students with this tutor
    const students = await Student.find({ tutorName: tutor.name });
    const studentIds = students.map(s => s._id);
    
    // Find pending passes for these students, sorted by date
    const passes = await GatePass.find({ 
      studentId: { $in: studentIds },
      status: 'pending'
    })
    .populate('studentId', 'name admNo dept sem')
    .sort({ createdAt: -1 });
    
    // Format the response with more details
    const formattedPasses = passes.map(pass => {
      const student = pass.studentId;
      return {
        _id: pass._id,
        purpose: pass.purpose,
        date: pass.date,
        returnTime: pass.returnTime,
        groupMembers: pass.groupMembers,
        createdAt: pass.createdAt,
        studentName: student.name,
        studentAdmNo: student.admNo,
        studentDept: student.dept,
        studentSem: student.sem,
        studentId: student._id
      };
    });
    
    res.json(formattedPasses);
  } catch (error) {
    console.error('Error fetching pending passes:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Get approved gate passes for student dashboard
app.get('/student/approved-passes/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const passes = await GatePass.find({
      $or: [
        { studentId: studentId },
        { 'groupMembers.admNo': { $in: [await getStudentAdmNo(studentId)] } }
      ],
      status: 'approved'
    })
    .populate('studentId', 'name admNo dept')
    .sort({ createdAt: -1 });
    
    res.json(passes);
  } catch (error) {
    console.error('Error fetching approved passes:', error);
    res.status(500).json({ message: 'Error fetching approved passes', error: error.message });
  }
});

// Helper function to get student admission number
async function getStudentAdmNo(studentId) {
  const student = await Student.findById(studentId);
  return student ? student.admNo : null;
}

// Admin login route
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    // Hardcoded admin credentials (should be stored securely in production)
    if (username === 'admin' && password === '12345') {
      res.json({ message: 'Admin login successful' })
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' })
    }
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: 'Server error during admin login' })
  }
})
app.post('/Security/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    // Hardcoded admin credentials (should be stored securely in production)
    if (username === 'security' && password === '12345') {
      res.json({ message: 'Security logined successful' })
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' })
    }
  } catch (error) {
    console.error('Security login error:', error)
    res.status(500).json({ message: 'Server error during Security login' })
  }
})
// Get all students route
app.get('/admin/students', async (req, res) => {
  try {
    const students = await Student.find({})
    res.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({ message: 'Error fetching students', error: error.message })
  }
})

// Get all gate pass requests
app.get('/admin/gate-passes', async (req, res) => {
  try {
    const passes = await Student.find({ 
      purpose: { $exists: true, $ne: null },
      date: { $exists: true, $ne: null }
    })
    res.json(passes)
  } catch (error) {
    console.error('Error fetching gate passes:', error)
    res.status(500).json({ message: 'Error fetching gate passes', error: error.message })
  }
})

// ========== NEW ROUTES ADDED FROM SECOND FILE ==========

// Get all tutors route
app.get('/admin/tutors', async (req, res) => {
  try {
    const tutors = await Tutor.find({});
    res.json(tutors);
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).json({ message: 'Error fetching tutors', error: error.message });
  }
});

// Get all gate passes with detailed information
// Get all gate passes with detailed information - UPDATED VERSION
// Get all gate passes with detailed information - UPDATED VERSION
// In the /admin/gate-passes-detailed route, update the response:
app.get('/admin/gate-passes-detailed', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    // Only show approved gate passes by default
    if (!status || status === 'approved') {
      query.status = 'approved';
    } else {
      query.status = status;
    }
    
    const passes = await GatePass.find(query)
      .populate('studentId', 'name admNo dept tutorName returned')
      .populate('returnedStudents.studentId', 'name admNo returned')
      .sort({ date: -1 });
    
    const formattedPasses = passes.map(pass => {
      // Calculate return information
      const totalStudents = 1 + (pass.groupMembers?.length || 0);
      const returnedCount = pass.returnedStudents?.length || 0;
      
      // IMPORTANT: Calculate allReturned based on actual returned students count
      const allReturned = returnedCount >= totalStudents;
      
      // Update the gate pass if allReturned status has changed
      if (pass.allReturned !== allReturned) {
        // Update in database asynchronously
        GatePass.findByIdAndUpdate(pass._id, { allReturned: allReturned })
          .catch(err => console.error('Error updating allReturned:', err));
      }
      
      // Check individual student return status
      const mainStudentReturned = pass.studentId?.returned || false;
      
      // FIXED: Return ALL necessary fields including return status
      return {
        _id: pass._id,
        admNo: pass.studentId?.admNo,
        name: pass.studentId?.name,
        dept: pass.studentId?.dept,
        tutorName: pass.studentId?.tutorName,
        purpose: pass.purpose,
        date: pass.date,
        returnTime: pass.returnTime,
        status: pass.status,
        groupMembers: pass.groupMembers,
        
        // 🔴 CRITICAL: Add return tracking fields
        returnedStudents: pass.returnedStudents || [],
        returnedCount: returnedCount,
        totalStudents: totalStudents,
        allReturned: allReturned,
        mainStudentReturned: mainStudentReturned
      };
    });
    
    res.json(formattedPasses);
  } catch (error) {
    console.error('Error fetching detailed gate passes:', error);
    res.status(500).json({ message: 'Error fetching gate passes', error: error.message });
  }
});
// Mark all students in gate pass as returned (Admin endpoint)
app.post('/admin/gatepass/:id/mark-all-returned', async (req, res) => {
  try {
    const { securityName } = req.body;
    const gatePassId = req.params.id;
    
    const gatePass = await GatePass.findById(gatePassId)
      .populate('studentId');
    
    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }
    
    // Mark main student
    if (gatePass.studentId) {
      gatePass.studentId.returned = true;
      await gatePass.studentId.save();
    }
    
    // Get all students for this gate pass
    const studentsInPass = await getStudentsForGatePass(gatePass);
    
    // Track returns
    gatePass.returnedStudents = [];
    
    // Mark registered students
    for (const student of studentsInPass) {
      student.returned = true;
      await student.save();
      
      gatePass.returnedStudents.push({
        studentId: student._id,
        admissionNo: student.admNo,
        name: student.name,
        returnedAt: new Date(),
        returnedBy: securityName || 'Admin'
      });
    }
    
    // Mark guest students
    if (gatePass.groupMembers) {
      for (const member of gatePass.groupMembers) {
        const admissionNo = member.admissionNo || member.admNo;
        const memberStudent = await Student.findOne({ admNo: admissionNo });
        
        if (!memberStudent) {
          // This is a guest
          gatePass.returnedStudents.push({
            admissionNo: admissionNo,
            name: member.name || 'Guest Student',
            returnedAt: new Date(),
            returnedBy: securityName || 'Admin',
            isGuest: true
          });
        }
      }
    }
    
    gatePass.allReturned = true;
    await gatePass.save();
    
    res.json({
      message: 'All students marked as returned',
      gatePass: gatePass,
      returnedCount: gatePass.returnedStudents.length
    });
    
  } catch (err) {
    console.error('Error marking all returned:', err);
    res.status(500).json({ 
      message: 'Error marking students as returned',
      error: err.message 
    });
  }
});
// Delete student route
app.delete('/admin/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

// Delete tutor route
app.delete('/admin/tutors/:id', async (req, res) => {
  try {
    await Tutor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tutor deleted successfully' });
  } catch (error) {
    console.error('Error deleting tutor:', error);
    res.status(500).json({ message: 'Error deleting tutor', error: error.message });
  }
});

// Update gate pass status
app.put('/admin/gate-passes/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedPass = await GatePass.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: 'Gate pass updated successfully', gatePass: updatedPass });
  } catch (error) {
    console.error('Error updating gate pass status:', error);
    res.status(500).json({ message: 'Error updating gate pass', error: error.message });
  }
});

// ========== TUTOR APPROVAL ROUTE - MOVED ABOVE 404 HANDLER ==========

// Approve tutor route - FIXED VERSION
app.put('/admin/tutors/:id/verify', async (req, res) => {
  try {
    const tutorId = req.params.id;

    // Check if tutor exists
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      console.log('❌ Tutor not found with ID:', tutorId);
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Update tutor verification status
    const updatedTutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { 
        verified: true,
        status: 'approved'
      },
      { new: true }
    );
    
    res.json({ 
      message: 'Tutor approved successfully',
      tutor: updatedTutor
    });
  } catch (error) {
    console.error('❌ Error approving tutor:', error);
    res.status(500).json({ 
      message: 'Error approving tutor', 
      error: error.message 
    });
  }
});

// ========== END OF NEW ROUTES ==========

// Delete gate pass route
app.delete('/admin/gatepasses/:id', async (req, res) => {
  try {
    await GatePass.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gate pass deleted successfully' });
  } catch (error) {
    console.error('Error deleting gate pass:', error);
    res.status(500).json({ message: 'Error deleting gate pass', error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ 
    message: 'Internal server error',
    error: error.message 
  })
})


// student-details edit
// UPDATE STUDENT DETAILS
app.put('/student/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    const updates = {
      name: req.body.name,
      admNo: req.body.admNo,
      dept: req.body.dept,
      sem: Number(req.body.sem),
      tutorName: req.body.tutorName,
      phone: Number(req.body.phone),
      email: req.body.email,
    };
    const admNoRegex = /^\d{3}\/\d{2}$/;
    if (updates.admNo && !admNoRegex.test(updates.admNo)) {
      return res.status(400).json({
        message: 'Admission number must be in format: YYY/NN (e.g., 234/23)'
      });
    }
    // If a new image is uploaded
    if (req.file) {
      updates.image = req.file.buffer;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student updated successfully", student: updatedStudent });

  } catch (error) {
    console.error("Student update error:", error);
    res.status(500).json({ message: "Update failed", error });
  }
});


// Tutor-edit

app.put('/tutor/:id', upload.single('image'), async (req, res) => {
  try {
    const tutorId = req.params.id;
    const { name, empId, dept, email } = req.body;

    // Basic validation
    if (!name || !empId || !dept || !email) {
      return res.status(400).json({ message: 'All fields (name, empId, dept, email) are required' });
    }

    // Check for duplicate empId or email in other docs
    const conflict = await Tutor.findOne({
      $or: [{ empId }, { email }],
      _id: { $ne: tutorId }
    });

    if (conflict) {
      return res.status(400).json({ message: 'Another tutor with same empId or email exists' });
    }

    const updates = {
      name: name.trim(),
      empId: empId.trim(),
      dept: dept.trim(),
      email: email.trim()
    };

    if (req.file) {
      updates.image = req.file.buffer;
    }

    const updatedTutor = await Tutor.findByIdAndUpdate(tutorId, updates, { new: true });
    if (!updatedTutor) return res.status(404).json({ message: 'Tutor not found' });

    // Don't send password field to client
    const safe = {
      _id: updatedTutor._id,
      name: updatedTutor.name,
      empId: updatedTutor.empId,
      dept: updatedTutor.dept,
      email: updatedTutor.email,
      verified: updatedTutor.verified,
      status: updatedTutor.status
    };

    res.json({ message: 'Tutor updated successfully', tutor: safe });
  } catch (err) {
    console.error('Tutor update error:', err);
    res.status(500).json({ message: 'Failed to update tutor', error: err.message });
  }
});

app.get('/tutor/:id/pending-students', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Find students with this tutor name who are not yet approved
    const pendingStudents = await Student.find({ 
      tutorName: tutor.name,
      tutorApproved: false 
    });
    
    res.json(pendingStudents);
  } catch (error) {
    console.error('Error fetching pending students:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Approve student registration
app.post('/tutor/student/:id/approve', async (req, res) => {
  try {
    const { tutorId } = req.body;
    const tutor = await Tutor.findById(tutorId);
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Verify that the student belongs to this tutor
    if (student.tutorName !== tutor.name) {
      return res.status(403).json({ message: 'Student does not belong to this tutor' });
    }

    // Approve the student
    student.tutorApproved = true;
    await student.save();

    res.json({ 
      message: 'Student approved successfully',
      student: {
        _id: student._id,
        name: student.name,
        admNo: student.admNo,
        dept: student.dept
      }
    });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({ 
      message: 'Error approving student', 
      error: error.message 
    });
  }
});

// Update the /security/students-with-return-time endpoint
// Update the /security/students-with-return-time endpoint
// Update the /security/students-with-return-time endpoint
app.get('/security/students-with-return-time', async (req, res) => {
  try {
    console.log('=== DEBUG: Fetching ONLY students who have NOT returned yet ===');
    
    // First, get all approved gate passes with return time
    const gatePasses = await GatePass.find({
      status: 'approved',
      returnTime: { $exists: true, $ne: null }
    })
    .populate('studentId', 'name admNo dept sem image returned')
    .sort({ date: 1 });

    console.log(`DEBUG: Found ${gatePasses.length} gate passes with return time`);
    
    // Create an array to store ONLY students who haven't returned
    const allStudents = [];

    for (const gatePass of gatePasses) {
      // Check if main student exists AND hasn't returned
      if (gatePass.studentId) {
        console.log(`DEBUG: Checking main student ${gatePass.studentId.name}`);
        console.log(`DEBUG: Returned status: ${gatePass.studentId.returned}`);
        
        // IMPORTANT: Only add if student hasn't returned (returned is false or undefined)
        if (gatePass.studentId.returned === false || gatePass.studentId.returned === undefined) {
          allStudents.push({
            _id: gatePass.studentId._id,
            name: gatePass.studentId.name,
            admNo: gatePass.studentId.admNo,
            dept: gatePass.studentId.dept,
            sem: gatePass.studentId.sem,
            purpose: gatePass.purpose,
            date: gatePass.date,
            returnTime: gatePass.returnTime,
            image: gatePass.studentId.image,
            isGroupMember: false,
            gatePassId: gatePass._id,
            isGuest: false,
            returned: gatePass.studentId.returned || false
          });
          console.log(`DEBUG: ✓ Added main student (NOT returned): ${gatePass.studentId.name}`);
        } else {
          console.log(`DEBUG: ✗ Skipping main student (already returned): ${gatePass.studentId.name}`);
        }
      }

      // Check group members - ONLY those who haven't returned
      if (gatePass.groupMembers && gatePass.groupMembers.length > 0) {
        console.log(`DEBUG: Checking ${gatePass.groupMembers.length} group members`);
        
        for (const groupMember of gatePass.groupMembers) {
          try {
            const admissionNo = groupMember.admissionNo || groupMember.admNo;
            
            if (admissionNo) {
              // Try to find registered student
              const memberStudent = await Student.findOne({ 
                admNo: String(admissionNo).trim() 
              }).select('name admNo dept sem image returned');
              
              if (memberStudent) {
                console.log(`DEBUG: Checking registered group member: ${memberStudent.name}`);
                console.log(`DEBUG: Returned status: ${memberStudent.returned}`);
                
                // Only add if student hasn't returned
                if (memberStudent.returned === false || memberStudent.returned === undefined) {
                  allStudents.push({
                    _id: memberStudent._id,
                    name: memberStudent.name,
                    admNo: memberStudent.admNo,
                    dept: memberStudent.dept,
                    sem: memberStudent.sem,
                    purpose: gatePass.purpose,
                    date: gatePass.date,
                    returnTime: gatePass.returnTime,
                    image: memberStudent.image,
                    isGroupMember: true,
                    gatePassId: gatePass._id,
                    isGuest: false,
                    returned: memberStudent.returned || false
                  });
                  console.log(`DEBUG: ✓ Added registered group member (NOT returned): ${memberStudent.name}`);
                } else {
                  console.log(`DEBUG: ✗ Skipping registered group member (already returned): ${memberStudent.name}`);
                }
              } else {
                // For guest members, check if they're already in returnedGuests
                const isGuestReturned = gatePass.returnedGuests?.some(
                  g => g.admissionNo === admissionNo || g.admNo === admissionNo
                );
                
                console.log(`DEBUG: Guest member ${groupMember.name || admissionNo}, returned status: ${isGuestReturned}`);
                
                if (!isGuestReturned) {
                  allStudents.push({
                    _id: `guest-${gatePass._id}-${admissionNo}`,
                    name: groupMember.name || 'Guest Student',
                    admNo: admissionNo,
                    dept: groupMember.dept || 'Not Registered',
                    sem: groupMember.sem || '-',
                    purpose: gatePass.purpose,
                    date: gatePass.date,
                    returnTime: gatePass.returnTime,
                    image: null,
                    isGroupMember: true,
                    gatePassId: gatePass._id,
                    isGuest: true,
                    returned: false
                  });
                  console.log(`DEBUG: ✓ Added guest group member (NOT returned): ${groupMember.name || admissionNo}`);
                } else {
                  console.log(`DEBUG: ✗ Skipping guest group member (already returned): ${groupMember.name || admissionNo}`);
                }
              }
            }
          } catch (memberError) {
            console.error('ERROR: Error processing group member:', memberError);
          }
        }
      }
    }

    console.log(`DEBUG: Total students who haven't returned: ${allStudents.length}`);
    
    // Remove duplicates
    const uniqueStudents = [];
    const seenIds = new Set();
    
    for (const student of allStudents) {
      const key = student.isGuest ? student._id : student._id.toString();
      if (!seenIds.has(key)) {
        seenIds.add(key);
        uniqueStudents.push(student);
      }
    }

    console.log(`DEBUG: Final unique students (not returned): ${uniqueStudents.length}`);
    
    // Log if no students found
    if (uniqueStudents.length === 0) {
      console.log('DEBUG: No students found with pending return time.');
      console.log('DEBUG: This could mean:');
      console.log('DEBUG: 1. All students have already returned (returned: true)');
      console.log('DEBUG: 2. No approved gate passes with return time exist');
      console.log('DEBUG: 3. All guest students are marked as returned in returnedGuests');
    }

    res.json(uniqueStudents);

  } catch (err) {
    console.error('ERROR: Error fetching students with return time:', err);
    res.status(500).json({ 
      message: "Error fetching students",
      error: err.message 
    });
  }
});
// Add this temporary endpoint to reset returned status
app.post('/debug/reset-returned', async (req, res) => {
  try {
    // Reset all students
    const studentResult = await Student.updateMany(
      {},
      { $set: { returned: false } }
    );
    
    // Clear returned data from gate passes
    const gatePassResult = await GatePass.updateMany(
      {},
      { 
        $set: { 
          returnedStudents: [],
          returnedGuests: [],
          allReturned: false 
        } 
      }
    );
    
    res.json({ 
      message: 'Returned status reset successfully',
      studentsReset: studentResult.modifiedCount,
      gatePassesReset: gatePassResult.modifiedCount
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ message: 'Reset failed', error: err.message });
  }
});
// Add this endpoint for marking guest students as returned
app.post('/gatepass/:id/mark-guest-returned', async (req, res) => {
  try {
    const gatePassId = req.params.id;
    const { memberData } = req.body;
    
    const gatePass = await GatePass.findById(gatePassId);
    
    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }
    
    // Add a returnedGuests field or update groupMembers status
    if (!gatePass.returnedGuests) {
      gatePass.returnedGuests = [];
    }
    
    gatePass.returnedGuests.push({
      ...memberData,
      returnedAt: new Date()
    });
    
    await gatePass.save();
    
    res.json({ 
      message: 'Guest marked as returned',
      gatePass 
    });
  } catch (error) {
    console.error('Error marking guest as returned:', error);
    res.status(500).json({ 
      message: 'Error marking guest as returned',
      error: error.message 
    });
  }
});
// Mark students as returned (for security)
// Update the existing mark-returned endpoint
// Mark students as returned
// Enhanced mark returned endpoint with notifications
// Mark students as returned (for security)
app.post('/security/mark-returned', async (req, res) => {
  try {
    const { studentIds, securityName } = req.body;
    
    console.log('Marking students as returned:', studentIds);
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'No student IDs provided' });
    }

    // Separate real student IDs from guest IDs
    const realStudentIds = studentIds.filter(id => !id.startsWith('guest-'));
    const guestIds = studentIds.filter(id => id.startsWith('guest-'));

    console.log(`Real students: ${realStudentIds.length}, Guests: ${guestIds.length}`);

    let updatedCount = 0;
    const gatePassUpdates = [];
    const notifications = [];

    // Update real students
    if (realStudentIds.length > 0) {
      const studentsToUpdate = await Student.find({ _id: { $in: realStudentIds } });
      
      for (const student of studentsToUpdate) {
        // Update student
        student.returned = true;
        await student.save();
        
        // Find the gate pass for this student
        const gatePass = await GatePass.findOne({
          $or: [
            { studentId: student._id },
            { 'groupMembers.admissionNo': student.admNo },
            { 'groupMembers.admNo': student.admNo }
          ],
          status: 'approved'
        });
        
        if (gatePass) {
          // Check if student already in returnedStudents
          const alreadyReturned = gatePass.returnedStudents.some(
            rs => rs.studentId && rs.studentId.toString() === student._id.toString()
          );
          
          if (!alreadyReturned) {
            gatePass.returnedStudents.push({
              studentId: student._id,
              admissionNo: student.admNo,
              name: student.name,
              returnedAt: new Date(),
              returnedBy: securityName || 'security'
            });
            
            // Check if all students in this gate pass have returned
            const totalStudents = 1 + (gatePass.groupMembers?.length || 0);
            const returnedCount = gatePass.returnedStudents?.length || 0;
            if (returnedCount >= totalStudents) {
    gatePass.allReturned = true;
  } else {
    gatePass.allReturned = false;
  }
            // After marking returned students, update allReturned flag
            if (gatePass.returnedStudents.length >= totalStudents) {
              gatePass.allReturned = true;
            }
            
            await gatePass.save();
            gatePassUpdates.push(gatePass._id);
            
            // Create notification for tutor
            const tutor = await Tutor.findOne({ name: student.tutorName });
            if (tutor) {
              notifications.push({
                tutorId: tutor._id,
                type: 'return',
                title: 'Student Returned',
                message: `${student.name} (${student.admNo}) has returned to campus`,
                studentName: student.name,
                studentAdmNo: student.admNo,
                gatePassId: gatePass._id,
                returnedAt: new Date(),
                securityName: securityName || 'Security',
                read: false
              });
            }
          }
        }
        updatedCount++;
      }
    }

    // For guest students
    if (guestIds.length > 0) {
      for (const guestId of guestIds) {
        // Extract gate pass ID from guest ID
        const match = guestId.match(/guest-(.+)-(.+)/);
        if (match) {
          const gatePassId = match[1];
          const admissionNo = match[2];
          
          const gatePass = await GatePass.findById(gatePassId);
          if (gatePass) {
            // Find the guest in groupMembers
            const guestMember = gatePass.groupMembers.find(gm => 
              gm.admissionNo === admissionNo || gm.admNo === admissionNo
            );
            const alreadyMarked = gatePass.returnedStudents.some(
  s => s.studentId?.toString() === student._id.toString()
);

if (!alreadyMarked) {
  gatePass.returnedStudents.push({
    studentId: student._id,
    admissionNo: student.admNo,
    name: student.name,
    returnedAt: new Date(),
    returnedBy: securityName || "Security"
  });
}
            if (guestMember) {
              // Check if guest already returned
              const alreadyReturned = gatePass.returnedStudents.some(
                rs => rs.admissionNo === admissionNo && rs.isGuest === true
              );
              
              if (!alreadyReturned) {
                gatePass.returnedStudents.push({
                  admissionNo: admissionNo,
                  name: guestMember.name,
                  returnedAt: new Date(),
                  returnedBy: securityName || 'security',
                  isGuest: true
                });
                
                // Check if all students have returned
                const totalStudents = 1 + (gatePass.groupMembers?.length || 0);
                
                // After marking returned students, update allReturned flag
                if (gatePass.returnedStudents.length >= totalStudents) {
                  gatePass.allReturned = true;
                }
                
                await gatePass.save();
                
                // Notify tutor for guest returns too
                const mainStudent = await Student.findById(gatePass.studentId);
                if (mainStudent) {
                  const tutor = await Tutor.findOne({ name: mainStudent.tutorName });
                  if (tutor) {
                    notifications.push({
                      tutorId: tutor._id,
                      type: 'return',
                      title: 'Guest Student Returned',
                      message: `Guest student ${guestMember.name} (${admissionNo}) has returned`,
                      studentName: guestMember.name,
                      studentAdmNo: admissionNo,
                      gatePassId: gatePass._id,
                      returnedAt: new Date(),
                      securityName: securityName || 'Security',
                      read: false
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // Save all notifications (in a real app, you'd save to a notifications collection)
    // For now, we'll just log them and they'll be fetched from real-time data
    
    console.log('Generated notifications:', notifications);

    res.status(200).json({ 
      message: 'Students marked as returned successfully',
      count: updatedCount,
      guestCount: guestIds.length,
      gatePassUpdates: gatePassUpdates,
      notifications: notifications
    });

  } catch (err) {
    console.error('Error marking students as returned:', err);
    res.status(500).json({ 
      message: 'Error marking students as returned',
      error: err.message
    });
  }
});
// Get verified tutors for student registration
app.get('/verified-tutors', async (req, res) => {
  try {
    // Fetch only verified tutors
    const tutors = await Tutor.find({ 
      verified: true,
      status: 'approved'
    }).select('name empId dept');
    
    res.json(tutors);
  } catch (error) {
    console.error('Error fetching verified tutors:', error);
    res.status(500).json({ 
      message: 'Error fetching tutors',
      error: error.message 
    });
  }
});
app.get('/student/:id/notifications', async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get all gate passes for this student
    const gatePasses = await GatePass.find({
      $or: [
        { studentId: studentId },
        { 'groupMembers.admNo': { $in: [student.admNo, Number(student.admNo)] } }, // Handle both string and number
        { 'groupMembers.admissionNo': { $in: [student.admNo, Number(student.admNo)] } } // Handle both string and number
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20);

    // Format notifications
    const notifications = [];

    // Check for status changes in gate passes
    gatePasses.forEach(pass => {
      // Check if this is a recent approval (within last 7 days)
      if (pass.status === 'approved' && pass.approvedAt) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (new Date(pass.approvedAt) > sevenDaysAgo) {
          // Create approval notification
          notifications.push({
            _id: pass._id,
            type: 'approval',
            title: 'Gate Pass Approved!',
            message: `Your gate pass request for "${pass.purpose}" has been approved by your tutor`,
            passId: pass._id,
            purpose: pass.purpose,
            date: pass.approvedAt,
            read: false,
            priority: 'high'
          });
        }
      }

      // Check for new gate pass submissions (pending status)
      if (pass.status === 'pending' && pass.createdAt) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        if (new Date(pass.createdAt) > oneDayAgo) {
          notifications.push({
            _id: `pending-${pass._id}`,
            type: 'gatepass',
            title: 'Gate Pass Submitted',
            message: `Your gate pass request for "${pass.purpose}" is pending tutor approval`,
            passId: pass._id,
            purpose: pass.purpose,
            date: pass.createdAt,
            read: true, // These are read by default since student submitted them
            priority: 'medium'
          });
        }
      }
    });

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      count: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
      notifications: notifications
    });

  } catch (error) {
    console.error('Error fetching student notifications:', error);
    res.status(500).json({ 
      message: 'Error fetching notifications', 
      error: error.message 
    });
  }
});

// Mark student notification as read
app.post('/student/notifications/:id/read', async (req, res) => {
  try {
    // In a real app with a notifications collection, you'd update the read status
    // For now, we'll just acknowledge the request
    res.json({ 
      message: 'Notification marked as read',
      notificationId: req.params.id 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: 'Error updating notification', 
      error: error.message 
    });
  }
});

// Mark all student notifications as read
app.post('/student/:id/notifications/read-all', async (req, res) => {
  try {
    res.json({ 
      message: 'All notifications marked as read',
      studentId: req.params.id 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      message: 'Error updating notifications', 
      error: error.message 
    });
  }
});



// ========== NOTIFICATION ROUTES ==========

// Get notifications for tutor
// Update tutor notifications to include return notifications
app.get('/tutor/:id/notifications', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Get pending gate passes for this tutor's students
    const students = await Student.find({ tutorName: tutor.name });
    const studentIds = students.map(s => s._id);
    
    const pendingPasses = await GatePass.find({ 
      studentId: { $in: studentIds },
      status: 'pending'
    })
    .populate('studentId', 'name admNo dept sem')
    .sort({ createdAt: -1 })
    .limit(5);

    // Get pending students for this tutor
    const pendingStudents = await Student.find({ 
      tutorName: tutor.name,
      tutorApproved: false 
    }).limit(5);

    // Get recent returns (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentReturns = await GatePass.find({
      'returnedStudents.returnedAt': { $gte: twentyFourHoursAgo },
      status: 'approved'
    })
    .populate('studentId', 'name admNo dept tutorName')
    .sort({ 'returnedStudents.returnedAt': -1 })
    .limit(10);

    // Format notifications
    const notifications = [];

    // Add pending gate pass notifications
    pendingPasses.forEach(pass => {
      notifications.push({
        id: pass._id,
        type: 'gatepass',
        title: 'New Gate Pass Request',
        message: `${pass.studentId.name} (${pass.studentId.admNo}) has submitted a gate pass request`,
        studentName: pass.studentId.name,
        studentAdmNo: pass.studentId.admNo,
        purpose: pass.purpose,
        date: pass.createdAt,
        read: false,
        priority: 'high'
      });
    });

    // Add pending student registration notifications
    pendingStudents.forEach(student => {
      notifications.push({
        id: student._id,
        type: 'registration',
        title: 'New Student Registration',
        message: `${student.name} (${student.admNo}) has registered and awaits your approval`,
        studentName: student.name,
        studentAdmNo: student.admNo,
        dept: student.dept,
        date: student.registrationDate,
        read: false,
        priority: 'medium'
      });
    });

    // Add return notifications
    recentReturns.forEach(pass => {
      const lastReturn = pass.returnedStudents[pass.returnedStudents.length - 1];
      if (lastReturn && pass.studentId && pass.studentId.tutorName === tutor.name) {
        notifications.push({
          id: `return-${pass._id}-${lastReturn.returnedAt.getTime()}`,
          type: 'return',
          title: 'Student Returned',
          message: `${lastReturn.name || lastReturn.studentId?.name} (${lastReturn.admissionNo}) has returned to campus`,
          studentName: lastReturn.name || lastReturn.studentId?.name,
          studentAdmNo: lastReturn.admissionNo,
          securityName: lastReturn.returnedBy,
          gatePassId: pass._id,
          date: lastReturn.returnedAt,
          read: false,
          priority: 'info'
        });
      }
    });

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Count unread
    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      count: notifications.length,
      unreadCount: unreadCount,
      notifications: notifications.slice(0, 20) // Limit to 20 most recent
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Error fetching notifications', 
      error: error.message 
    });
  }
});
// Mark notification as read
app.post('/tutor/notifications/:id/read', async (req, res) => {
  try {
    // In a real app, you'd store notifications in a separate collection
    // For now, we'll just acknowledge the request
    res.json({ 
      message: 'Notification marked as read',
      notificationId: req.params.id 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: 'Error updating notification', 
      error: error.message 
    });
  }
});

// Mark all notifications as read for a tutor
app.post('/tutor/:id/notifications/read-all', async (req, res) => {
  try {
    res.json({ 
      message: 'All notifications marked as read',
      tutorId: req.params.id 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      message: 'Error updating notifications', 
      error: error.message 
    });
  }
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})


app.listen(5000, () => {
  console.log("Server is running on port 5000")
})