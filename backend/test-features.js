const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入模型
const User = require('./models/User');
const Feedback = require('./models/Feedback');
const Violation = require('./models/Violation');
const Reservation = require('./models/Reservation');
const Room = require('./models/Room');
const Seat = require('./models/Seat');

// 数据库连接配置
const mongooseOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000
};

// 连接数据库
mongoose.connect(process.env.MONGO_URI || 'cc', mongooseOptions)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

async function createTestData() {
  try {
    console.log('开始创建测试数据...');

    // 创建测试用户
    const testUser = await User.findOne({ studentId: 'TEST001' }) || await User.create({
      name: '测试用户',
      studentId: 'TEST001',
      password: 'password123',
      phone: '13800138000',
      role: 'user'
    });

    // 创建测试管理员
    const testAdmin = await User.findOne({ studentId: 'admin' }) || await User.create({
      name: '测试用户',
      studentId: 'admin',
      password: 'admin123',
      phone: '13800138000',
      role: 'admin'
    });

    console.log('✅ 测试用户创建成功:', testUser.name);
    console.log('✅ 测试管理员创建成功:', testUser.name);

    // 创建测试自习室和座位
    let testRoom = await Room.findOne({ name: '测试自习室A' });
    if (!testRoom) {
      testRoom = await Room.create({
        name: '测试自习室A',
        location: '图书馆1楼',
        capacity: 50,
        description: '安静的学习环境',
        openTime: '08:00',
        closeTime: '22:00'
      });
    }

    let testSeat = await Seat.findOne({ room: testRoom._id, seatNumber: 'A001' });
    if (!testSeat) {
      testSeat = await Seat.create({
        room: testRoom._id,
        seatNumber: 'A001',
        status: 'available'
      });
    }

    console.log('✅ 测试自习室和座位创建成功');

    // 创建测试反馈
    const feedbackTypes = ['environment', 'equipment', 'suggestion', 'other'];
    const feedbackContents = [
      '自习室的空调温度太低了，希望能调高一些。',
      '座位的插座有问题，无法正常充电。',
      '建议增加更多的书架和储物柜。',
      '希望能延长开放时间到晚上11点。'
    ];

    for (let i = 0; i < 4; i++) {
      const existingFeedback = await Feedback.findOne({
        user: testUser._id,
        type: feedbackTypes[i]
      });

      if (!existingFeedback) {
        await Feedback.create({
          user: testUser._id,
          type: feedbackTypes[i],
          content: feedbackContents[i],
          status: i % 2 === 0 ? 'pending' : 'resolved',
          response: i % 2 === 1 ? '感谢您的反馈，我们会尽快处理。' : undefined
        });
      }
    }

    console.log('✅ 测试反馈创建成功');

    // 创建测试预约记录（用于统计）
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    for (const date of dates) {
      const existingReservation = await Reservation.findOne({
        user: testUser._id,
        date: date
      });

      if (!existingReservation) {
        const startTime = new Date(`${date}T09:00:00`);
        const endTime = new Date(`${date}T12:00:00`);

        await Reservation.create({
          user: testUser._id,
          room: testRoom._id,
          seat: testSeat._id,
          date: date,
          startTime: '09:00',
          endTime: '12:00',
          status: 'completed',
          actualStartTime: startTime,
          actualEndTime: endTime
        });
      }
    }

    console.log('✅ 测试预约记录创建成功');

    // 创建测试违规记录
    const violationTypes = ['late_check_in', 'early_check_out'];
    const penalties = ['warning', 'none'];

    for (let i = 0; i < 2; i++) {
      const reservation = await Reservation.findOne({ user: testUser._id });
      if (reservation) {
        const existingViolation = await Violation.findOne({
          user: testUser._id,
          type: violationTypes[i]
        });

        if (!existingViolation) {
          await Violation.create({
            user: testUser._id,
            reservation: reservation._id,
            type: violationTypes[i],
            description: i === 0 ? '迟到15分钟签到' : '提前30分钟离开',
            penalty: penalties[i],
            penaltyDuration: i === 0 ? 1 : 0,
            isResolved: i === 1
          });
        }
      }
    }

    console.log('✅ 测试违规记录创建成功');

    console.log('\n🎉 所有测试数据创建完成！');
    console.log('\n📋 测试数据包括:');
    console.log('- 2个测试用户 (testuser/password123 admin/admin123)');
    console.log('- 4条不同类型的反馈记录');
    console.log('- 7天的学习统计数据');
    console.log('- 2条违规记录');
    console.log('\n🚀 现在可以在小程序中测试这些功能了！');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
    process.exit(1);
  }
}

createTestData();