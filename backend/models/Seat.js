const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: [true, '请提供座位号'],
    trim: true
  },
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'Room',
    required: [true, '请提供所属自习室']
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 确保同一自习室内座位号唯一
SeatSchema.index({ seatNumber: 1, room: 1 }, { unique: true });

module.exports = mongoose.model('Seat', SeatSchema);