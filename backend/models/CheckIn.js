const mongoose = require('mongoose');

const CheckInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  seat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out'],
    default: 'checked-in'
  },
  qrCodeUsed: {
    type: Boolean,
    default: false
  },
  qrCodeData: {
    type: String
  },
  duration: {
    type: Number,
    default: 0 // 学习时长（分钟）
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CheckIn', CheckInSchema);