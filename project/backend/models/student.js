const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  admNo: { type: String, unique: true }, // Changed from Number to String
  image: Buffer,
  dept: String,
  sem: Number,
  tutorName: String,
  email: String,
  parent_No: Number,
  password: String,
  phone: Number,
  purpose: String,
  date: Date,
  returnTime: String,
  verified: { type: Boolean, default: false },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', default: null },
  passStatus: { type: String, default: 'none' },
  tutorApproved: { type: Boolean, default: false },
  registrationDate: { type: Date, default: Date.now },
  // Add reset password fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // Add returned field for security
  returned: { type: Boolean, default: false }
});

module.exports = mongoose.model('Student', studentSchema);