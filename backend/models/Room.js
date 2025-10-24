const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供自习室名称'],
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: [true, '请提供自习室位置']
  },
  capacity: {
    type: Number,
    required: [true, '请提供自习室容量']
  },
  openTime: {
    type: String,
    required: [true, '请提供开放时间']
  },
  closeTime: {
    type: String,
    required: [true, '请提供关闭时间']
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'maintenance'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', RoomSchema);