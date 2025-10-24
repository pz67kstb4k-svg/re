const User = require('../models/User');

// @desc    注册用户
// @route   POST /api/users/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, studentId, password, phone } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({ studentId });
    if (userExists) {
      return res.status(400).json({ success: false, message: '该学号已注册' });
    }

    // 创建用户
    const user = await User.create({
      name,
      studentId,
      password,
      phone
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    删除用户（管理员）
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    console.log('管理员删除用户:', req.params.id);
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      console.error('用户不存在，ID:', req.params.id);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    console.log('删除用户成功:', user.name);
    res.status(200).json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除用户失败:', err.message);
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    用户登录
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // 验证输入
    if (!studentId || !password) {
      return res.status(400).json({ success: false, message: '请提供学号和密码' });
    }

    // 查找用户
    const user = await User.findOne({ studentId }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: '无效的凭据' });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '无效的凭据' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    获取当前登录用户
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    console.log('尝试获取用户信息，用户ID:', req.user ? req.user.id : '未定义');
    
    // 如果req.user不存在（理论上不应该发生，因为auth中间件已经验证过）
    if (!req.user) {
      console.error('错误: 在getMe控制器中req.user为undefined');
      return res.status(401).json({ success: false, message: '用户未认证' });
    }
    
    // 再次查询数据库获取最新用户信息
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.error('错误: 数据库中找不到用户，ID:', req.user.id);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    console.log('用户信息获取成功，用户ID:', user._id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('获取用户信息时发生错误:', err.message, '\n堆栈:', err.stack);
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    更新用户信息
// @route   PUT /api/users/me
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// 生成token并发送响应
const sendTokenResponse = (user, statusCode, res) => {
  // 创建token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      studentId: user.studentId,
      phone: user.phone,
      role: user.role
    }
  });
};

// @desc    获取所有用户（管理员）
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    console.log('管理员查询用户列表');
    const users = await User.find({});
    console.log(`找到 ${users.length} 个用户`);
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('获取用户列表失败:', err.message);
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    根据ID获取用户（管理员）
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    console.log('管理员查询单个用户，ID:', req.params.id);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.error('用户不存在，ID:', req.params.id);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    console.log('获取用户成功:', user.name);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('获取用户失败:', err.message);
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    更新用户信息（管理员）
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    console.log('管理员更新用户，ID:', req.params.id);
    
    // 过滤可更新的字段
    const fieldsToUpdate = {};
    if (req.body.name) fieldsToUpdate.name = req.body.name;
    if (req.body.studentId) fieldsToUpdate.studentId = req.body.studentId;
    if (req.body.phone) fieldsToUpdate.phone = req.body.phone;
    if (req.body.role) fieldsToUpdate.role = req.body.role;
    
    const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    
    if (!user) {
      console.error('用户不存在，ID:', req.params.id);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    console.log('更新用户成功:', user.name);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('更新用户失败:', err.message);
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};

// @desc    创建用户（管理员）
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    console.log('管理员创建新用户');
    
    // 检查学号是否已存在
    const userExists = await User.findOne({ studentId: req.body.studentId });
    if (userExists) {
      console.error('学号已存在:', req.body.studentId);
      return res.status(400).json({ success: false, message: '该学号已注册' });
    }
    
    // 创建用户
    const user = await User.create({
      name: req.body.name,
      studentId: req.body.studentId,
      password: req.body.password || '123456', // 默认密码
      phone: req.body.phone,
      role: req.body.role || 'user'
    });
    
    console.log('创建用户成功:', user.name);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.error('创建用户失败:', err.message);
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
};