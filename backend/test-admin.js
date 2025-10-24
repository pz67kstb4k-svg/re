// 管理端功能测试脚本
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let token = '';

// 登录函数
async function login() {
  try {
    const response = await axios.post(`${API_URL}/users/login`, {
      studentId: 'admin',
      password: 'admin123'
    });
    token = response.data.token;
    console.log('✅ 管理员登录成功');
    console.log('用户信息:', response.data.user);
    return true;
  } catch (error) {
    console.error('❌ 管理员登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 获取所有用户
async function testGetUsers() {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n✅ 获取用户列表成功');
    console.log(`找到 ${response.data.data.length} 个用户`);
    response.data.data.forEach(user => {
      console.log(`- ${user.name} (${user.studentId}, 角色: ${user.role})`);
    });
  } catch (error) {
    console.error('❌ 获取用户列表失败:', error.response?.data || error.message);
  }
}

// 获取所有自习室
async function testGetRooms() {
  try {
    const response = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n✅ 获取自习室列表成功');
    console.log(`找到 ${response.data.count} 个自习室`);
    response.data.data.forEach(room => {
      console.log(`- ${room.name} (位置: ${room.location}, 座位: ${room.totalSeats}个)`);
    });
  } catch (error) {
    console.error('❌ 获取自习室列表失败:', error.response?.data || error.message);
  }
}

// 获取所有预约
async function testGetReservations() {
  try {
    const response = await axios.get(`${API_URL}/reservations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n✅ 获取预约列表成功');
    console.log(`找到 ${response.data.count} 个预约`);
    if (response.data.data.length > 0) {
      console.log('最新的预约:');
      const latest = response.data.data[0];
      console.log(`- 用户: ${latest.user.name}, 房间: ${latest.room.name}, 座位: ${latest.seat.seatNumber}`);
    }
  } catch (error) {
    console.error('❌ 获取预约列表失败:', error.response?.data || error.message);
  }
}

// 获取所有反馈
async function testGetFeedbacks() {
  try {
    const response = await axios.get(`${API_URL}/feedbacks`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, limit: 5 }
    });
    console.log('\n✅ 获取反馈列表成功');
    console.log(`共 ${response.data.total} 条反馈，当前第 ${response.data.page}/${response.data.pages} 页`);
    response.data.data.forEach(feedback => {
      console.log(`- 类型: ${feedback.type}, 状态: ${feedback.status}, 用户: ${feedback.user.studentId}`);
    });
  } catch (error) {
    console.error('❌ 获取反馈列表失败:', error.response?.data || error.message);
  }
}

// 运行测试
async function runTests() {
  console.log('开始管理端功能测试...');
  
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('登录失败，无法继续测试');
    return;
  }
  
  await testGetUsers();
  await testGetRooms();
  await testGetReservations();
  await testGetFeedbacks();
  
  console.log('\n📋 管理端功能测试完成！');
  console.log('\n使用说明:');
  console.log('1. 管理员账号: admin');
  console.log('2. 管理员密码: admin123');
  console.log('3. 所有管理功能已在后端API中实现');
  console.log('4. 详细的API文档请查看 ADMIN_API文档.md');
}

// 执行测试
runTests();