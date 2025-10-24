const Room = require('../models/Room');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');

// @desc    获取所有自习室
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();

    const roomsWithStatus = await Promise.all(rooms.map(async (room) => {
      const totalSeats = await Seat.countDocuments({ room: room._id });
      // 计算当前已占用的座位数（基于座位的实际状态）
      const occupiedSeats = await Seat.countDocuments({
        room: room._id,
        status: { $in: ['occupied', 'reserved'] }
      });

      // 计算可用座位数
      const availableSeats = totalSeats - occupiedSeats;
      
      // 计算预约次数（统计与该自习室相关的所有预约）
      const reservationCount = await Reservation.countDocuments({
        room: room._id
      });
      
      return {
        ...room.toObject(),
        totalSeats,
        occupiedSeats,
        availableSeats,
        reservationCount
      };
    }));

    // 按照预约次数降序排序
    roomsWithStatus.sort((a, b) => (b.reservationCount || 0) - (a.reservationCount || 0));

    res.status(200).json({ success: true, count: roomsWithStatus.length, data: roomsWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    获取单个自习室
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ success: false, message: '未找到自习室' });
    }

    const totalSeats = await Seat.countDocuments({ room: room._id });
    // 计算当前已占用的座位数（基于座位的实际状态）
    const occupiedSeats = await Seat.countDocuments({
      room: room._id,
      status: { $in: ['occupied', 'reserved'] }
    });

    // 计算可用座位数
    const availableSeats = totalSeats - occupiedSeats;
    
    const roomWithStatus = {
      ...room.toObject(),
      totalSeats,
      occupiedSeats,
      availableSeats
    };
    
    res.status(200).json({ success: true, data: roomWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    创建自习室
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    更新自习室
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!room) {
      return res.status(404).json({ success: false, message: '未找到自习室' });
    }
    
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    删除自习室
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ success: false, message: '未找到自习室' });
    }
    
    // 删除自习室下的所有座位
    await Seat.deleteMany({ room: req.params.id });
    
    await room.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};