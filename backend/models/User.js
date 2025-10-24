const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供姓名']
  },
  studentId: {
    type: String,
    required: [true, '请提供学号'],
    unique: true
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, '请提供手机号']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  studyHours: {
    type: Number,
    default: 0,
    description: '总学习时长（分钟）'
  },
  studyDays: {
    type: Number,
    default: 0,
    description: '学习天数'
  },
  lastStudyDate: {
    type: Date,
    description: '最后一次学习日期'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 加密密码
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 生成JWT Token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// 验证密码
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);