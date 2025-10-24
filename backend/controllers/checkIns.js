const CheckIn = require('../models/CheckIn');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const Seat = require('../models/Seat');
const crypto = require('crypto');

// 生成签到二维码数据
exports.generateQRCode = async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    // 验证预约是否存在且属于当前用户
    const reservation = await Reservation.findOne({
      _id: reservationId,
      user: req.user.id
    });
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: '预约不存在或不属于当前用户'
      });
    }
    
    // 检查预约状态是否有效
    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: '只有已确认的预约才能生成签到二维码'
      });
    }
    
    // 生成唯一的二维码数据
    const qrCodeData = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const uniqueQRData = `${qrCodeData}-${reservationId}-${timestamp}`;
    
    // 返回二维码数据
    res.status(200).json({
      success: true,
      data: {
        qrCodeData: uniqueQRData,
        reservationId,
        expiresIn: 300 // 5分钟有效期
      }
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法生成二维码'
    });
  }
};

// 签到
exports.checkIn = async (req, res) => {
  try {
    const { reservationId, qrCodeData } = req.body;
    
    // 验证预约是否存在
    const reservation = await Reservation.findById(reservationId)
      .populate('room seat');
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }
    
    // 检查是否已经签到
    const existingCheckIn = await CheckIn.findOne({
      reservation: reservationId,
      status: 'checked-in'
    });
    
    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message: '已经签到，不能重复签到'
      });
    }
    
    // 更新座位状态为已占用
    if (reservation.seat) {
      await Seat.findByIdAndUpdate(reservation.seat._id, { status: 'occupied' });
    }
    
    // 创建签到记录
    const checkIn = await CheckIn.create({
      user: reservation.user,
      reservation: reservationId,
      room: reservation.room._id,
      seat: reservation.seat._id,
      qrCodeUsed: true,
      qrCodeData
    });
    
    // 更新预约状态为'checked_in'以便前端显示签退按钮
    reservation.status = 'checked_in';
    await reservation.save();
    
    res.status(201).json({
      success: true,
      data: checkIn
    });
  } catch (error) {
    console.error('签到失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，签到失败'
    });
  }
};

// 签退
exports.checkOut = async (req, res) => {
  try {
    // 完全不使用req.body，只从URL参数获取checkInId
    const checkInId = req.params.checkInId;
    
    if (!checkInId) {
      return res.status(400).json({
        success: false,
        message: '缺少签到记录ID'
      });
    }
    
    // 查找签到记录
    const checkIn = await CheckIn.findById(checkInId);
    
    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: '签到记录不存在'
      });
    }
    
    // 检查是否已经签退
    if (checkIn.status === 'checked-out') {
      return res.status(400).json({
        success: false,
        message: '已经签退，不能重复签退'
      });
    }
    
    // 更新签退时间和状态
    const checkOutTime = new Date();
    const checkInTime = new Date(checkIn.checkInTime);
    
    // 计算学习时长（分钟）
    const durationMs = checkOutTime - checkInTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    checkIn.checkOutTime = checkOutTime;
    checkIn.status = 'checked-out';
    checkIn.duration = durationMinutes;
    await checkIn.save();
    
    // 更新用户的学习时长统计
    const user = await User.findById(checkIn.user);
    if (user) {
      // 更新总学习时长
      user.studyHours += durationMinutes;
      
      // 检查是否需要更新学习天数
      const today = new Date().toDateString();
      const lastStudyDate = user.lastStudyDate ? new Date(user.lastStudyDate).toDateString() : null;
      
      if (lastStudyDate !== today) {
        // 如果今天是新的学习日期，增加学习天数
        user.studyDays += 1;
        user.lastStudyDate = new Date();
      }
      
      // 保存用户信息
      await user.save();
      
      console.log(`用户 ${user.name} 的学习时长已更新：+${durationMinutes}分钟，总计${user.studyHours}分钟`);
    }
    
    // 更新预约状态
    const reservation = await Reservation.findById(checkIn.reservation).populate('seat');
    if (reservation) {
      reservation.status = 'completed';
      await reservation.save();
      
      // 更新座位状态为可用（使用完成后释放座位）
      if (reservation.seat) {
        await Seat.findByIdAndUpdate(reservation.seat._id, { status: 'available' });
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        checkIn,
        duration: durationMinutes
      }
    });
  } catch (error) {
    console.error('签退失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，签退失败'
    });
  }
};

// 获取用户的签到记录
exports.getUserCheckIns = async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ user: req.user.id })
      .populate('room seat reservation')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: checkIns.length,
      data: checkIns
    });
  } catch (error) {
    console.error('获取签到记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取签到记录'
    });
  }
};

// 验证二维码并签到
exports.verifyQRCodeAndCheckIn = async (req, res) => {
  try {
    const { qrCodeData } = req.body;
    
    // 从二维码数据中提取预约ID
    const parts = qrCodeData.split('-');
    if (parts.length < 2) {
      return res.status(400).json({
        success: false,
        message: '无效的二维码数据'
      });
    }
    
    const reservationId = parts[1];
    
    // 验证预约是否存在
    const reservation = await Reservation.findById(reservationId)
      .populate('room seat user');
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }
    
    // 检查是否已经签到
    const existingCheckIn = await CheckIn.findOne({
      reservation: reservationId,
      status: 'checked-in'
    });
    
    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message: '已经签到，不能重复签到'
      });
    }
    
    // 更新座位状态为已占用
    if (reservation.seat) {
      await Seat.findByIdAndUpdate(reservation.seat._id, { status: 'occupied' });
    }
    
    // 创建签到记录
    const checkIn = await CheckIn.create({
      user: reservation.user._id,
      reservation: reservationId,
      room: reservation.room._id,
      seat: reservation.seat._id,
      qrCodeUsed: true,
      qrCodeData
    });
    
    // 更新预约状态为'checked_in'以便前端显示签退按钮
    reservation.status = 'checked_in';
    await reservation.save();
    
    res.status(201).json({
      success: true,
      data: checkIn
    });
  } catch (error) {
    console.error('二维码验证签到失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，二维码验证签到失败'
    });
  }
};