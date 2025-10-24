const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// 加载环境变量
dotenv.config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB连接成功');
  } catch (err) {
    console.error('MongoDB连接失败:', err.message);
    process.exit(1);
  }
};

// 创建管理员账号
const createAdmin = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 检查是否已存在管理员账号
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('管理员账号已存在');
      mongoose.connection.close();
      return;
    }
    
    // 创建管理员账号
    const admin = await User.create({
      name: '系统管理员',
      studentId: 'admin',
      password: 'admin123', // 可以根据需要修改初始密码
      phone: '13800138000',
      role: 'admin'
    });
    
    console.log('管理员账号创建成功');
    console.log('账号:', admin.studentId);
    console.log('密码:', 'admin123');
    
    // 关闭数据库连接
    mongoose.connection.close();
  } catch (err) {
    console.error('创建管理员账号失败:', err.message);
    mongoose.connection.close();
  }
};

// 执行创建管理员账号
createAdmin();