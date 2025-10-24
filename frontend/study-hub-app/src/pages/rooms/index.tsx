import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { roomApi } from '../../services/api'
import './index.scss'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkLogin()
  }, [])

  // 每次页面显示时刷新数据
  useDidShow(() => {
    fetchRooms()
  })

  // 检查登录状态
  const checkLogin = () => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.navigateTo({
        url: '/pages/login/index'
      })
    }
  }

  // 获取自习室列表
  const fetchRooms = async () => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')
      const res = await roomApi.getRooms(token)
      setRooms(res.data)
    } catch (error) {
      console.error('获取自习室失败:', error)
      Taro.showToast({
        title: '获取自习室失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 查看自习室详情
  const viewRoomDetail = (roomId: string) => {
    Taro.navigateTo({
      url: `/pages/room-detail/index?id=${roomId}`
    })
  }

  // 返回首页
  const handleBack = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  return (
    <View className='rooms-container'>
      <View className='header'>
        <View className='back-btn' onClick={handleBack} hoverClass='button-hover'>
          <Text className='back-icon'>←</Text>
          <Text className='back-text'>返回</Text>
        </View>
        <Text className='title'>自习室列表</Text>
      </View>

      {loading ? (
        <View className='loading'>
          <View className='skeleton' style={{width: '200px', height: '24px', margin: '0 auto 16px', borderRadius: '12px'}}></View>
          <Text>加载中...</Text>
        </View>
      ) : (
        <ScrollView scrollY className='room-list' showsVerticalScrollIndicator={false}>
          {rooms.length > 0 ? (
            rooms.map(room => {
              const isAvailable = room.occupiedSeats < room.availableSeats;
              return (
                <View 
                  key={room._id} 
                  className='room-card'
                  onClick={() => viewRoomDetail(room._id)}
                  hoverClass='room-card-hover'
                >
                  <View className='room-info'>
                    <Text className='room-name'>{room.name}</Text>
                    <Text className='room-location'>{room.location}</Text>
                    <View className='room-details'>
                      <Text className='room-capacity'>容量: {room.capacity}座</Text>
                      <Text className='room-time'>开放时间: {room.openTime}-{room.closeTime}</Text>
                    </View>
                    <View className='room-occupancy'>
                      <Text className='occupied-seats'>已占用: {room.occupiedSeats}</Text>
                      <Text className='available-seats'>可用: {room.availableSeats}</Text>
                    </View>
                    <Text className={`room-status ${isAvailable ? 'available' : 'full'}`}>
                      {isAvailable ? '有空位' : '已满'}
                    </Text>
                    {room.description && (
                      <Text className='room-description'>{room.description}</Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View className='empty'>暂无自习室信息</View>
          )}
        </ScrollView>
      )}
    </View>
  )
}