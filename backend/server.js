const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors());

// 在全局JSON解析器之前，为checkout路由添加特殊处理
app.use((req, res, next) => {
  // 检查是否是签退路由
  if (req.method === 'PUT' && req.path.startsWith('/api/checkins/checkout/')) {
    // 完全绕过JSON解析，直接继续处理
    next();
  } else {
    // 其他路由使用正常的JSON解析
    express.json()(req, res, next);
  }
});

// 路由
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const seatRoutes = require('./routes/seats');
const reservationRoutes = require('./routes/reservations');
const checkInRoutes = require('./routes/checkIns');
const feedbackRoutes = require('./routes/feedbacks');
const statisticsRoutes = require('./routes/statistics');
const violationRoutes = require('./routes/violations');

// 挂载所有路由
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/violations', violationRoutes);

// 数据库连接配置
const mongooseOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  // 添加连接池和重连配置
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000
};

// 数据库连接函数
function connectDB() {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/study-hub', mongooseOptions)
    .then(() => {
      console.log('MongoDB连接成功');
    })
    .catch(err => {
      console.error('MongoDB连接失败:', err.message);
      console.log('5秒后尝试重新连接...');
      // 5秒后重新尝试连接
      setTimeout(connectDB, 5000);
    });
}

// 监听数据库连接事件
mongoose.connection.on('connected', () => {
  console.log('Mongoose已连接到数据库');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose已断开连接');
  console.log('5秒后尝试重新连接...');
  setTimeout(connectDB, 5000);
});

// 启动数据库连接
connectDB();

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});