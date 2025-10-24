const mongoose = require('mongoose');

const ViolationSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['late_check_in', 'early_check_out', 'no_show', 'occupy_overtime', 'other'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '描述不能超过200字符']
  },
  penalty: {
    type: String,
    enum: ['warning', 'suspend', 'ban', 'none'],
    default: 'none'
  },
  penaltyDuration: {
    type: Number, // 处罚天数
    default: 0
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 解决违规时更新时间
ViolationSchema.pre('save', function (next) {
  if (this.isModified('isResolved') && this.isResolved) {
    this.resolvedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Violation', ViolationSchema);