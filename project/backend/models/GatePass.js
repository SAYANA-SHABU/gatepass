const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  purpose: String,
  date: Date,
  returnTime: String,
  groupMembers: [
    {
      name: String,
      admNo: String,
      admissionNo: String,
      dept: String
    }
  ],
  status: { type: String, default: 'pending' },
  verified: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', default: null },
  approvedAt: { type: Date, default: null },
  
  // Add these fields for tracking returns
  returnedStudents: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    admissionNo: String,
    name: String,
    returnedAt: { type: Date, default: Date.now },
    returnedBy: String,
    isGuest: { type: Boolean, default: false }
  }],
  
  returnedGuests: [{
    name: String,
    admissionNo: String,
    returnedAt: { type: Date, default: Date.now },
    returnedBy: String
  }],
  
  allReturned: { type: Boolean, default: false }
  
}, { timestamps: true });

module.exports = mongoose.model('GatePass', gatePassSchema);