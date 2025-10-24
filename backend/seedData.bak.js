const mongoose = require('mongoose');
const Room = require('./models/Room');
const Seat = require('./models/Seat');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB 连接成功，开始添加测试数据...');
  seedData();
}).catch(err => {
  console.error('MongoDB 连接失败:', err.message);
  process.exit(1);
});

// 清除现有数据并添加新数据
const seedData = async () => {
  try {
    // 清除现有数据
    await Room.deleteMany({});
    await Seat.deleteMany({});
    
    // 创建管理员用户
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await User.create({
        name: '管理员',
        studentId: 'admin001',
        phone: '13800000000',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('管理员用户创建成功');
    }
    
    // 创建测试用户
    const testUserExists = await User.findOne({ studentId: '20210001' });
    if (!testUserExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      await User.create({
        name: '测试用户',
        studentId: '20210001',
        phone: '13900000000',
        password: hashedPassword,
        role: 'user'
      });
      console.log('测试用户创建成功');
    }

    // 添加自习室数据
    const rooms = [
      {
        name: '图书馆自习室A',
        location: '图书馆一楼',
        capacity: 50,
        openTime: '08:00',
        closeTime: '22:00',
        description: '安静舒适的学习环境，靠近图书馆入口，配备空调和充电插座。',
        status: 'open'
      },
      {
        name: '图书馆自习室B',
        location: '图书馆二楼',
        capacity: 40,
        openTime: '08:00',
        closeTime: '22:00',
        description: '适合小组讨论的自习室，有隔音设施，可容纳小组学习。',
        status: 'open'
      },
      {
        name: '理学院自习室',
        location: '理学院大楼三楼',
        capacity: 30,
        openTime: '09:00',
        closeTime: '21:00',
        description: '理学院专用自习室，环境安静，有专业参考书籍。',
        status: 'open'
      },
      {
        name: '工学院自习室',
        location: '工学院大楼二楼',
        capacity: 35,
        openTime: '08:30',
        closeTime: '21:30',
        description: '工学院专用自习室，配备工程类参考资料和设计工具。',
        status: 'open'
      },
      {
        name: '文学院自习室',
        location: '文学院大楼一楼',
        capacity: 25,
        openTime: '09:00',
        closeTime: '20:00',
        description: '文学院专用自习室，环境优雅，适合阅读和写作。',
        status: 'open'
      },
      {
        name: '24小时自习室',
        location: '学生中心地下一层',
        capacity: 60,
        openTime: '00:00',
        closeTime: '23:59',
        description: '全天候开放的自习室，适合夜间学习，配备自动售货机和休息区。',
        status: 'open'
      }
    ];

    // 保存自习室数据
    const savedRooms = await Room.insertMany(rooms);
    console.log(`成功添加 ${savedRooms.length} 个自习室`);

    // 为每个自习室添加座位
    for (const room of savedRooms) {
      const seats = [];
      const rows = ['A', 'B', 'C', 'D', 'E'];
      const seatsPerRow = room.capacity / rows.length;
      
      for (let i = 0; i < rows.length; i++) {
        for (let j = 1; j <= seatsPerRow; j++) {
          seats.push({
            seatNumber: `${rows[i]}${j}`,
            room: room._id,
            status: 'available'
          });
        }
      }
      
      await Seat.insertMany(seats);
      console.log(`为自习室 ${room.name} 添加了 ${seats.length} 个座位`);
    }

    console.log('数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};