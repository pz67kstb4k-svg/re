import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { reservationApi } from '../../services/api'
import './reservation-management.scss'

export default function ReservationManagement() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({
          title: '未登录，请重新登录',
          icon: 'none'
        })
        setTimeout(() => {
          Taro.navigateTo({
            url: '/pages/login/index'
          })
        }, 1500)
        return
      }
      // 管理员查看所有预约时不传递myOnly参数
      const res = await reservationApi.getUserReservations(token)
      setReservations(res.data)
    } catch (error) {
      console.error('获取预约列表失败:', error)
      Taro.showToast({
        title: error.message || '获取预约列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待签到',
      'checked_in': '已签到',
      'completed': '已完成',
      'cancelled': '已取消',
      'no_show': '未签到'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    const classMap = {
      'pending': 'status-pending',
      'checked_in': 'status-checked-in',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'no_show': 'status-no-show'
    }
    return classMap[status] || ''
  }

  return (
    <View className='reservation-management-container'>
      <View className='header'>
        <Button 
          className='back-button' 
          onClick={() => Taro.navigateBack()}
          type='text'
        >
          返回
        </Button>
        <Text className='title'>预约管理</Text>
        <View style={{ width: 60 }} />
      </View>
      
      {loading ? (
        <View className='loading'>加载中...</View>
      ) : reservations.length === 0 ? (
        <View className='empty'>暂无预约记录</View>
      ) : (
        <ScrollView className='reservation-list' scrollY>
          {reservations.map(reservation => (
            <View key={reservation._id} className='reservation-card'>
              <View className='card-header'>
                <Text className='room-name'>{reservation.room?.name || '未知房间'}</Text>
                <Text className={`status ${getStatusClass(reservation.status)}`}>
                  {getStatusText(reservation.status)}
                </Text>
              </View>
              
              <View className='card-content'>
                <View className='info-item'>
                  <Text className='label'>座位号：</Text>
                  <Text className='value'>{reservation.seat?.seatNumber || '未知座位'}</Text>
                </View>
                
                <View className='info-item'>
                  <Text className='label'>预约时间：</Text>
                  <Text className='value'>
                    {reservation.date} {reservation.startTime} - {reservation.endTime}
                  </Text>
                </View>
                
                {/* 用户信息显示 - 管理员功能 */}
                <View className='info-item user-info'>
                  <Text className='label'>预约人：</Text>
                  <Text className='value'>{reservation.user?.name || '未知用户'}</Text>
                </View>
                
                {reservation.user?.studentId && (
                  <View className='info-item'>
                    <Text className='label'>学号：</Text>
                    <Text className='value'>{reservation.user.studentId}</Text>
                  </View>
                )}
                
                <View className='info-item'>
                  <Text className='label'>创建时间：</Text>
                  <Text className='value'>{new Date(reservation.createdAt).toLocaleString()}</Text>
                </View>
                

              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}