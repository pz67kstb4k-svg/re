import Taro from '@tarojs/taro';

// API基础URL
const BASE_URL = 'http://localhost:5000/api';

// 请求方法封装
const request = async (url: string, method: any, data?: any, token?: string) => {
  console.log(`===== 开始请求 =====`);
  console.log(`URL: ${BASE_URL}${url}`);
  console.log(`方法: ${method}`);
  console.log('请求数据:', JSON.stringify(data));
  console.log('Token存在:', !!token);
  console.log('Token长度:', token ? token.length : 0);
  
  const header: any = {
    'Content-Type': 'application/json'
  };

  if (token) {
    header['Authorization'] = `Bearer ${token}`;
    console.log('Token已添加到请求头');
    // 只记录token的前10位和后10位作为标识
    const tokenPrefix = token.substring(0, 10);
    const tokenSuffix = token.substring(token.length - 10);
    console.log(`Token标识: ${tokenPrefix}...${tokenSuffix}`);
  } else {
    console.warn('⚠️ 警告: 请求未携带Token');
  }

  // 对于 DELETE 请求且没有数据体时，不发送 Content-Type 和 data
  if (method === 'DELETE' && (data === null || typeof data === 'undefined')) {
    delete header['Content-Type'];
    data = undefined; // 确保不发送数据体
    console.log('DELETE请求，不发送数据体');
  }

  try {
    console.log('准备发送请求，请求头:', JSON.stringify(header));
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header
    });

    console.log(`===== 请求响应 =====`);
    console.log('响应状态码:', response.statusCode);
    console.log('响应数据:', JSON.stringify(response.data));
    
    // 检查是否有错误响应
    if (response.statusCode >= 400) {
      console.error(`❌ 请求失败: ${response.statusCode} - ${JSON.stringify(response.data)}`);
      const errorMessage = response.data.message || response.data.error || `请求失败: ${response.statusCode}`;
      throw new Error(errorMessage);
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ 请求成功');
      return response.data;
    }

    const errorMessage = response.data.message || `请求失败: ${response.statusCode}`;
    console.error('❌ 请求失败:', errorMessage);
    throw new Error(errorMessage);
  } catch (error: any) {
    console.log(`===== 请求异常 =====`);
    console.error('❌ API请求错误:', error);
    console.error('错误类型:', typeof error);
    console.error('错误详情:', JSON.stringify(error));
    
    // 增强错误信息
    if (error.errMsg && error.errMsg.includes('request:fail')) {
      const networkError = new Error(`网络请求失败: ${error.errMsg}`);
      throw networkError;
    }
    
    // 抛出原始错误或创建包含更多信息的错误
    const errorToThrow = error.message ? error : new Error('未知错误: ' + JSON.stringify(error));
    throw errorToThrow;
  }
};

// 用户相关API
export const userApi = {
  // 用户注册
  register: (userData: any) => {
    return request('/users/register', 'POST', userData);
  },

  // 用户登录
  login: (credentials: any) => {
    return request('/users/login', 'POST', credentials);
  },

  // 获取当前用户信息
  getCurrentUser: (token: string) => {
    return request('/users/me', 'GET', null, token);
  },

  // 更新当前用户信息
  updateCurrentUser: (userData: any, token: string) => {
    return request('/users/me', 'PUT', userData, token);
  },

  // 获取用户列表（管理员功能）
  getUsers: (token: string) => {
    return request('/users', 'GET', null, token);
  },

  // 根据ID获取用户（管理员功能）
  getUserById: (userId: string, token: string) => {
    return request(`/users/${userId}`, 'GET', null, token);
  },

  // 更新用户信息（管理员功能）
  updateUser: (userId: string, userData: any, token: string) => {
    return request(`/users/${userId}`, 'PUT', userData, token);
  },

  // 创建用户（管理员功能）
  createUser: (userData: any, token: string) => {
    return request('/users', 'POST', userData, token);
  },
 // 删除用户（管理员功能）
  deleteUser: (userId: string, token: string) => {
    return request(`/users/${userId}`, 'DELETE', null, token);
  }
};

// 自习室相关API
export const roomApi = {
  // 获取所有自习室
  getRooms: (token?: string) => {
    return request('/rooms', 'GET', null, token);
  },

  // 获取单个自习室
  getRoom: (roomId: string, token?: string) => {
    return request(`/rooms/${roomId}`, 'GET', null, token);
  },

  // 创建自习室（管理员功能）
  createRoom: (roomData: any, token: string) => {
    return request('/rooms', 'POST', roomData, token);
  },

  // 更新自习室（管理员功能）
  updateRoom: (roomId: string, roomData: any, token: string) => {
    return request(`/rooms/${roomId}`, 'PUT', roomData, token);
  },

  // 删除自习室（管理员功能）
  deleteRoom: (roomId: string, token: string) => {
    return request(`/rooms/${roomId}`, 'DELETE', null, token);
  }
};

// 座位相关API
export const seatApi = {
  // 获取自习室的所有座位
  getSeatsByRoom: (roomId: string, token?: string) => {
    return request(`/seats?room=${roomId}`, 'GET', null, token);
  },

  // 获取单个座位
  getSeat: (seatId: string, token?: string) => {
    return request(`/seats/${seatId}`, 'GET', null, token);
  },
  
  // 创建座位（管理员功能）
  createSeat: (seatData: any, token: string) => {
    return request('/seats', 'POST', seatData, token);
  },
  
  // 更新座位（管理员功能）
  updateSeat: (seatId: string, seatData: any, token: string) => {
    return request(`/seats/${seatId}`, 'PUT', seatData, token);
  },
  
  // 删除座位（管理员功能）
  deleteSeat: (seatId: string, token: string) => {
    return request(`/seats/${seatId}`, 'DELETE', null, token);
  }
};

// 预约相关API
export const reservationApi = {
  // 获取用户的所有预约
  getUserReservations: (token: string, params?: any) => {
    // 构建查询字符串
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, params[key]);
        }
      });
      const query = searchParams.toString();
      if (query) {
        queryString = '?' + query;
      }
    }
    return request('/reservations' + queryString, 'GET', null, token);
  },

  // 创建预约
  createReservation: (reservationData: any, token: string) => {
    return request('/reservations', 'POST', reservationData, token);
  },

  // 取消预约
  cancelReservation: (reservationId: string, token: string) => {
    return request(`/reservations/${reservationId}`, 'DELETE', null, token);
  },

  // 签到
  checkIn: (reservationId: string, token: string) => {
    return request('/checkins/checkin', 'POST', { reservationId }, token);
  }
};

// 签到相关API
export const checkInApi = {
  // 生成签到二维码
  generateQRCode: (reservationId: string, token: string) => {
    return request(`/checkins/${reservationId}/qrcode`, 'GET', null, token);
  },

  // 验证二维码并签到
  verifyQRCodeAndCheckIn: (qrCodeData: string, token: string) => {
    return request('/checkins/qrcode/verify-checkin', 'POST', { qrCodeData }, token);
  },

  // 签退
  checkOut: (checkInId: string, token: string) => {
    return request(`/checkins/checkout/${checkInId}`, 'PUT', null, token);
  },

  // 获取用户的签到记录
  getUserCheckIns: (token: string) => {
    return request('/checkins/user', 'GET', null, token);
  }
};
// 反馈相关API
export const feedbackApi = {
  // 提交反馈
  submitFeedback: (feedbackData: any, token: string) => {
    return request('/feedbacks', 'POST', feedbackData, token);
  },

  // 获取用户反馈列表
  getUserFeedback: (token: string) => {
    return request('/feedbacks/my', 'GET', null, token);
  },

  // 获取所有反馈（管理员）
  getAllFeedback: (token: string) => {
    return request('/feedbacks', 'GET', null, token);
  },
  
  // 更新反馈状态（管理员）
  updateFeedback: (feedbackId: string, feedbackData: any, token: string) => {
    return request(`/feedbacks/${feedbackId}`, 'PUT', feedbackData, token);
  }
};

// 统计相关API
export const statisticsApi = {
  // 获取用户学习统计
  getUserStatistics: (token: string) => {
    return request('/statistics/my', 'GET', null, token);
  },

  // 获取系统统计（管理员）
  getSystemStatistics: (token: string) => {
    return request('/statistics/system', 'GET', null, token);
  }
};

// 违规记录相关API
export const violationApi = {
  // 获取用户违规记录
  getUserViolations: (token: string) => {
    return request('/violations/my', 'GET', null, token);
  },

  // 获取所有违规记录（管理员）
  getAllViolations: (token: string) => {
    return request('/violations', 'GET', null, token);
  },

  // 创建违规记录（管理员）
  createViolation: (violationData: any, token: string) => {
    return request('/violations', 'POST', violationData, token);
  }
};