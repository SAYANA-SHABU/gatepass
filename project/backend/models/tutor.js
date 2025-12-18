const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  name: String,
  empId: { type: String, unique: true },
  dept: String,
  email: { type: String, unique: true },
  image: Buffer,
  password: String,
  verified: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  // Add reset password fields
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

module.exports = mongoose.model('Tutor', tutorSchema);