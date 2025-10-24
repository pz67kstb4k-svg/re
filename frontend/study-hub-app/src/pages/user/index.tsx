import { useEffect, useState } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { userApi } from '../../services/api'
import './index.scss'

export default function User() {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    checkLogin()
    fetchUserInfo()
  }, [])

  // 检查登录状态
  const checkLogin = () => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.navigateTo({
        url: '/pages/login/index'
      })
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')
      console.log('获取用户信息，使用的token长度:', token ? token.length : 0)
      
      if (!token) {
        console.error('错误: 没有找到token')
        Taro.showToast({
          title: '未登录，请重新登录',
          icon: 'none'
        })
        setTimeout(() => {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
          Taro.navigateTo({
            url: '/pages/login/index'
          })
        }, 1500)
        return
      }
      
      const res = await userApi.getCurrentUser(token)
      console.log('获取用户信息成功:', res)
      setUserInfo(res.data)
      setError(false)
    } catch (err) {
      console.error('获取用户信息失败:', err)
      setError(true)
      
      // 显示错误提示
      Taro.showToast({
        title: err.message || '获取用户信息失败',
        icon: 'none'
      })
      
      // 检查是否是认证相关错误
      const authErrorMessages = ['未授权', 'Token无效', 'Token已过期', '用户不存在']
      const isAuthError = authErrorMessages.some(msg => 
        error.message && error.message.includes(msg)
      )
      
      if (isAuthError) {
        console.log('检测到认证错误，清除token并跳转到登录页')
        // 清除token和用户信息
        Taro.removeStorageSync('token')
        Taro.removeStorageSync('userInfo')
        // 跳转到登录页
        setTimeout(() => {
          Taro.navigateTo({
            url: '/pages/login/index'
          })
        }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: function (res) {
        if (res.confirm) {
          // 清除本地存储
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
          
          // 跳转到登录页
          Taro.reLaunch({
            url: '/pages/login/index'
          })
        }
      }
    })
  }

  if (loading) {
    return (
      <View className='loading-container'>
        <View className='loading-spinner'></View>
        <Text>加载中...</Text>
      </View>
    );
  }
  
  if (error || !userInfo) {
    return (
      <View className='error-container'>
        <View className='error-icon'></View>
        <Text className='error-message'>获取用户信息失败</Text>
        <Button className='retry-button' onClick={() => {
          setError(false);
          fetchUserInfo();
        }}>重试</Button>
      </View>
    );
  }

  return (
    <View className='user-container'>
      <View className='user-card'>
        <View className='avatar-container'>
          <View className='avatar'></View>
        </View>
        <Text className='user-name'>{userInfo.name}</Text>
        <Text className='user-role'>{userInfo.role === 'admin' ? '管理员' : '学生'}</Text>
      </View>

      <View className='info-section'>
        <View className='info-item'>
          <Text className='info-label'>学号</Text>
          <Text className='info-value'>{userInfo.studentId}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>手机号</Text>
          <Text className='info-value'>{userInfo.phone}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>注册时间</Text>
          <Text className='info-value'>{new Date(userInfo.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <View className='button-group'>
        {userInfo.role === 'user' && (
        <Button className='feedback-button' onClick={() => Taro.navigateTo({ url: '/pages/user/feedback/index' })}>
          提交反馈
        </Button>
        )}
        {userInfo.role === 'user' && (
        <Button className='feedback-list-button' onClick={() => Taro.navigateTo({ url: '/pages/user/feedback/feedback-list' })}>
          查看我的反馈
        </Button>
        )}
        {userInfo.role === 'user' && (
        <Button className='statistics-button' onClick={() => Taro.navigateTo({ url: '/pages/user/statistics/index' })}>
          学习统计
        </Button>
        )}

        
        {userInfo.role === 'admin' && (
          <Button className='room-management-button' onClick={() => Taro.navigateTo({ url: '/pages/rooms/room-management' })}>
            房间管理
          </Button>
        )}

        {userInfo.role === 'admin' && (
          <Button className='seat-management-button' onClick={() => Taro.navigateTo({ url: '/pages/rooms/seat-management' })}>
            座位管理
          </Button>
        )}

        {userInfo.role === 'admin' && (
          <Button className='reservation-management-button' onClick={() => Taro.navigateTo({ url: '/pages/user/reservation-management' })}>
            预约管理
          </Button>
        )}

        {userInfo.role === 'admin' && (
          <Button className='user-management-button' onClick={() => Taro.navigateTo({ url: '/pages/user/user-management/index' })}>
            用户管理
          </Button>
        )}
        
        {userInfo.role === 'admin' && (
          <Button className='feedback-management-button' onClick={() => Taro.navigateTo({ url: '/pages/user/feedback-management' })}>
            反馈管理
          </Button>
        )}

        <Button className='logout-button' onClick={handleLogout}>
          退出登录
        </Button>
      </View>
    </View>
  )
}