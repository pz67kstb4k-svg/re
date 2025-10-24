const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 保护路由中间件
exports.protect = async (req, res, next) => {
  console.log('================================');
  console.log('🔐 进入认证中间件 - 路由:', req.method, req.path);
  let token;

  // 检查Authorization头
  console.log('📋 检查认证头:', req.headers.authorization ? '存在' : '不存在');
  if (req.headers.authorization) {
    console.log('🔍 Authorization头内容开始:', req.headers.authorization.substring(0, 20), '...');
  }
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('✅ Token提取成功，长度:', token ? token.length : 0);
    // 只记录token的前10位和后10位作为标识
    if (token) {
      const tokenPrefix = token.substring(0, 10);
      const tokenSuffix = token.substring(token.length - 10);
      console.log(`🔑 Token标识: ${tokenPrefix}...${tokenSuffix}`);
    }
  }

  if (!token) {
    console.error('❌ 错误: 未提供认证token');
    return res.status(401).json({ success: false, message: '未授权访问 - 未提供token' });
  }

  try {
    // 验证token
    console.log('🔐 开始验证token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token验证成功，解码数据:', { userId: decoded.id });

    // 查找用户
    console.log('👤 查找用户，ID:', decoded.id);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      console.error('❌ 错误: Token有效但用户不存在，ID:', decoded.id);
      return res.status(401).json({ success: false, message: '未授权访问 - 用户不存在' });
    }
    
    console.log('✅ 用户查找成功:', req.user.name, 'ID:', req.user._id, '角色:', req.user.role);
    next();
  } catch (err) {
    console.error('❌ Token验证或用户查找失败:', err.message);
    console.error('❌ 错误类型:', err.name);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '未授权访问 - Token无效' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '未授权访问 - Token已过期' });
    }
    return res.status(401).json({ success: false, message: '未授权访问 - 认证失败' });
  }
};

// 角色授权中间件
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('================================');
    console.log('👮‍♂️ 进入授权中间件 - 路由:', req.method, req.path);
    console.log('👤 当前用户:', req.user.name, '角色:', req.user.role);
    console.log('🔒 允许的角色:', roles);
    
    if (!roles.includes(req.user.role)) {
      console.error('❌ 权限不足: 用户角色', req.user.role, '不在允许列表', roles, '中');
      return res.status(403).json({ success: false, message: '无权执行此操作' });
    }
    
    console.log('✅ 权限验证通过: 用户', req.user.name, '(角色:', req.user.role, ')有权限访问此路由');
    next();
  };
};