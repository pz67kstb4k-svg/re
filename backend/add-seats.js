const mongoose = require('mongoose');
const Room = require('./models/Room');
const Seat = require('./models/Seat');

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/study-hub', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 添加座位函数
const addSeats = async () => {
  try {
    // 查找测试自习室A
    const room = await Room.findOne({ name: '测试自习室A' });
    
    if (!room) {
      console.error('未找到测试自习室A');
      return;
    }
    
    console.log(`找到测试自习室A，ID: ${room._id}`);
    
    // 创建新座位列表（A002-A010）
    const newSeats = [];
    for (let i = 2; i <= 10; i++) {
      const seatNumber = `A${i.toString().padStart(3, '0')}`;
      
      // 检查座位是否已存在
      const existingSeat = await Seat.findOne({ seatNumber, room: room._id });
      if (!existingSeat) {
        newSeats.push({
          seatNumber,
          room: room._id,
          status: 'available'
        });
        console.log(`准备创建座位: ${seatNumber}`);
      } else {
        console.log(`座位 ${seatNumber} 已存在，跳过`);
      }
    }
    
    // 批量创建座位
    if (newSeats.length > 0) {
      const createdSeats = await Seat.insertMany(newSeats);
      console.log(`成功创建 ${createdSeats.length} 个新座位`);
    } else {
      console.log('没有需要创建的新座位');
    }
    
    // 更新自习室容量
    const totalSeats = await Seat.countDocuments({ room: room._id });
    await Room.findByIdAndUpdate(room._id, { capacity: totalSeats });
    console.log(`已更新测试自习室A的容量为: ${totalSeats}`);
    
  } catch (error) {
    console.error('添加座位失败:', error);
  } finally {
    // 关闭数据库连接
    mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
};

// 执行脚本
const runScript = async () => {
  await connectDB();
  await addSeats();
};

runScript();