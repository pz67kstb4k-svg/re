import { useEffect, useState, useRef } from 'react'
import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { roomApi } from '../../services/api'
import './index.scss'

export default function Index() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleRooms, setVisibleRooms] = useState([])
  const roomsRef = useRef(null)

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
      // 只显示前两个自习室（已经在后端按预约次数排序）
      const roomsData = res.data.slice(0, 2)
      setRooms(roomsData)
      
      // 分批显示房间，增加动画效果
      let visible = []
      for (let i = 0; i < roomsData.length; i++) {
        setTimeout(() => {
          visible = [...visible, roomsData[i]]
          setVisibleRooms([...visible])
        }, 200 * (i + 1))
      }
    } catch (error) {
      console.error('获取自习室失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 跳转到自习室列表
  const goToRooms = () => {
    Taro.switchTab({
      url: '/pages/rooms/index'
    })
  }

  // 跳转到我的预约
  const goToReservations = () => {
    Taro.switchTab({
      url: '/pages/reservations/index'
    })
  }

  return (
    <View className='index-container'>
      <View className='header'>
        <Text className='title'>自习室预约平台</Text>
        <Text className='subtitle'>高效学习，从这里开始</Text>
      </View>

      <Swiper
        className='banner'
        indicatorColor='rgba(255, 255, 255, 0.5)'
        indicatorActiveColor='#ffffff'
        circular
        autoplay
        interval={5000}
        duration={1000}
        indicatorDots={{ position: 'bottom', distanceToBottom: 10 }}
      >
        <SwiperItem>
          <View className='banner-item banner-1 fade-in'>
            <Text className='banner-text'>安静舒适的学习环境</Text>
          </View>
        </SwiperItem>
        <SwiperItem>
          <View className='banner-item banner-2 fade-in'>
            <Text className='banner-text'>便捷的座位预约系统</Text>
          </View>
        </SwiperItem>
        <SwiperItem>
          <View className='banner-item banner-3 fade-in'>
            <Text className='banner-text'>高效的学习时间管理</Text>
          </View>
        </SwiperItem>
      </Swiper>

      <View className='quick-actions slide-up'>
        <View className='action-container'>
          <View className='action-item' onClick={goToRooms} style={{ animationDelay: '100ms' }}>
            <View className='action-icon rooms-icon'></View>
          </View>
          <Text className='action-text'>浏览自习室</Text>
        </View>
        <View className='action-container'>
          <View className='action-item' onClick={goToReservations} style={{ animationDelay: '200ms' }}>
            <View className='action-icon reservation-icon'></View>
          </View>
          <Text className='action-text'>我的预约</Text>
        </View>
      </View>

      <View className='section' ref={roomsRef}>
        <View className='section-header slide-up'>
          <Text className='section-title'>热门自习室</Text>
          <Text className='section-more' onClick={goToRooms}>查看更多</Text>
        </View>

        {loading ? (
          <View className='loading-container'>
            <View className='loading-spinner'></View>
            <Text className='loading-text'>加载中...</Text>
          </View>
        ) : (
          <View className='room-list'>
            {visibleRooms.length > 0 ? (
              visibleRooms.map((room, index) => {
                const availableSeats = room.availableSeats || room.capacity
                return (
                  <View 
                    key={room._id} 
                    className='room-card slide-up'
                    style={{ animationDelay: `${(index + 1) * 150}ms` }}
                    onClick={() => {
                      Taro.navigateTo({
                        url: `/pages/room-detail/index?id=${room._id}`
                      })
                    }}
                  >
                    <View className='room-info'>
                      <Text className='room-name'>{room.name}</Text>
                      <Text className='room-location'>{room.location}</Text>
                      <Text className='room-capacity'>容量: {room.capacity}座</Text>
                      <Text className='room-time'>开放时间: {room.openTime}-{room.closeTime}</Text>
                      <View className='room-occupancy'>
                        <Text className='occupied-seats'>已占用: {room.occupiedSeats || 0}</Text>
                        <Text className='available-seats'>可用: {availableSeats}</Text>
                      </View>
                      <Text className='room-reservation-count'>预约次数: {room.reservationCount || 0}</Text>
                      <Text className={`room-status ${(room.occupiedSeats || 0) < availableSeats ? 'available' : 'full'}`}>
                        {(room.occupiedSeats || 0) < availableSeats ? '有空位' : '已满'}
                      </Text>
                    </View>
                  </View>
                )
              })
            ) : (
              <View className='empty fade-in'>
                <Text className='empty-icon'>📚</Text>
                <Text className='empty-text'>暂无自习室信息</Text>
              </View>
            )}
          </View>
        )}
      </View>
      {/* 底部装饰 */}
      <View className='home-footer fade-in'>
        <Text className='footer-text'>祝您学习愉快！</Text>
      </View>
    </View>
  )
}
