const Seat = require('../models/Seat');
const Room = require('../models/Room');

// @desc    获取所有座位
// @route   GET /api/seats
// @access  Public
exports.getSeats = async (req, res) => {
  try {
    let query;
    
    // 复制req.query
    const reqQuery = { ...req.query };
    
    // 如果有room参数，查询特定自习室的座位
    if (req.query.room) {
      query = Seat.find({ room: req.query.room });
    } else {
      query = Seat.find();
    }
    
    // 添加关联查询
    query = query.populate('room', 'name location');
    
    const seats = await query;
    
    res.status(200).json({ success: true, count: seats.length, data: seats });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    获取单个座位
// @route   GET /api/seats/:id
// @access  Public
exports.getSeat = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id).populate('room', 'name location');
    
    if (!seat) {
      return res.status(404).json({ success: false, message: '未找到座位' });
    }
    
    res.status(200).json({ success: true, data: seat });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    创建座位
// @route   POST /api/seats
// @access  Private/Admin
exports.createSeat = async (req, res) => {
  console.log('================================');
  console.log('🪑 开始创建座位');
  console.log('📥 接收到的请求数据:', JSON.stringify(req.body));
  
  try {
    // 验证请求数据
    if (!req.body) {
      console.error('❌ 请求体为空');
      return res.status(400).json({ success: false, message: '请求体不能为空' });
    }
    
    if (!req.body.room) {
      console.error('❌ 缺少room字段');
      return res.status(400).json({ success: false, message: '缺少自习室信息' });
    }
    
    if (!req.body.seatNumber) {
      console.error('❌ 缺少seatNumber字段');
      return res.status(400).json({ success: false, message: '缺少座位号' });
    }
    
    // 检查自习室是否存在
    console.log('🏢 检查自习室是否存在，ID:', req.body.room);
    const room = await Room.findById(req.body.room);
    
    if (!room) {
      console.error('❌ 未找到自习室，ID:', req.body.room);
      return res.status(404).json({ success: false, message: '未找到自习室' });
    }
    
    console.log('✅ 自习室存在:', room.name);
    
    // 准备创建座位的数据
    const seatData = {
      seatNumber: req.body.seatNumber,
      room: req.body.room,
      status: req.body.status || 'available'
    };
    
    console.log('📝 准备创建的座位数据:', JSON.stringify(seatData));
    
    // 创建座位
    console.log('🚀 执行座位创建...');
    const seat = await Seat.create(seatData);
    
    console.log('✅ 座位创建成功，ID:', seat._id);
    res.status(201).json({ success: true, data: seat });
  } catch (err) {
    console.log('❌ 创建座位失败');
    console.error('❌ 错误类型:', err.name);
    console.error('❌ 错误代码:', err.code);
    console.error('❌ 错误消息:', err.message);
    console.error('❌ 错误详情:', JSON.stringify(err));
    
    // 处理唯一索引冲突
    if (err.code === 11000) {
      console.log('⚠️ 座位号重复错误');
      return res.status(400).json({ success: false, message: '该自习室中已存在相同座位号' });
    }
    
    // 处理验证错误
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      console.log('⚠️ 数据验证错误:', validationErrors.join(', '));
      return res.status(400).json({ 
        success: false, 
        message: '数据验证失败', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '服务器错误', 
      error: err.message,
      errorName: err.name,
      errorCode: err.code
    });
  }
};

// @desc    更新座位
// @route   PUT /api/seats/:id
// @access  Private/Admin
exports.updateSeat = async (req, res) => {
  try {
    const seat = await Seat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!seat) {
      return res.status(404).json({ success: false, message: '未找到座位' });
    }
    
    res.status(200).json({ success: true, data: seat });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    删除座位
// @route   DELETE /api/seats/:id
// @access  Private/Admin
exports.deleteSeat = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);
    
    if (!seat) {
      return res.status(404).json({ success: false, message: '未找到座位' });
    }
    
    await seat.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};