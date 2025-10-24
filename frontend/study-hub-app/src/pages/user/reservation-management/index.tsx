import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { reservationApi } from '../../../services/api'
import './index.scss'

export default function ReservationManagement() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReservations()
  }, [])

  // 获取所有预约列表
  const fetchReservations = async () => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')
      const res = await reservationApi.getUserReservations(token) // 后端会根据用户角色返回相应数据
      setReservations(res.data)
    } catch (error) {
      console.error('获取预约列表失败:', error)
      Taro.showToast({
        title: '获取预约列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取状态文本和颜色
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { text: '待签到', color: '#faad14' }
      case 'confirmed':
        return { text: '已确认', color: '#1890ff' }
      case 'checked_in':
        return { text: '已签到', color: '#52c41a' }
      case 'completed':
        return { text: '已完成', color: '#52c41a' }
      case 'cancelled':
        return { text: '已取消', color: '#999' }
      case 'rejected':
        return { text: '已拒绝', color: '#ff4d4f' }
      default:
        return { text: status, color: '#999' }
    }
  }

  return (
    <View className='reservation-management-container'>
      <View className='header'>
        <View className='back-btn' onClick={handleBack}>
          <Text className='back-icon'>←</Text>
          <Text className='back-text'>返回</Text>
        </View>
        <Text className='title'>预约管理</Text>
      </View>

      {loading ? (
        <View className='loading'>加载中...</View>
      ) : (
        <ScrollView scrollY className='reservation-list'>
          {reservations.length > 0 ? (
            reservations.map((reservation) => {
              const statusInfo = getStatusInfo(reservation.status)

              return (
                <View key={reservation._id} className='reservation-card'>
                  <View className='reservation-header'>
                    <Text className='room-name'>{reservation.room.name}</Text>
                    <Text
                      className='status'
                      style={{ color: statusInfo.color }}
                    >
                      {statusInfo.text}
                    </Text>
                  </View>

                  <View className='reservation-info'>
                    {/* 显示用户信息 - 管理员特有的功能 */}
                    {reservation.user && (
                      <View className='user-info-section'>
                        <Text className='user-label'>预约人：</Text>
                        <Text className='user-name'>{reservation.user.name}</Text>
                        <Text className='user-studentId'>({reservation.user.studentId})</Text>
                      </View>
                    )}
                    <Text className='info-item'>
                      座位号: {reservation.seat?.seatNumber || '未知座位'}
                    </Text>
                    <Text className='info-item'>
                      日期: {reservation.date.split('T')[0]}
                    </Text>
                    <Text className='info-item'>
                      时间: {reservation.startTime} - {reservation.endTime}
                    </Text>
                    <Text className='info-item'>
                      地点: {reservation.room.location}
                    </Text>
                  </View>
                </View>
              )
            })
          ) : (
            <View className='empty'>
              <Text className='empty-text'>暂无预约记录</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}