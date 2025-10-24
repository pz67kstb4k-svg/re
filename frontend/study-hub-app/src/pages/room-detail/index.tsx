import { useEffect, useState } from 'react'
import { View, Text, Button, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { roomApi, seatApi, reservationApi, checkInApi } from '../../services/api'
import './index.scss'


export default function RoomDetail() {
  const router = useRouter()
  const { id } = router.params
  
  const [room, setRoom] = useState(null)
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [date, setDate] = useState(formatDate(new Date()))
  const [timeRange, setTimeRange] = useState('08:00 - 10:00');
  const [submitting, setSubmitting] = useState(false)
  const [userReservation, setUserReservation] = useState(null)

  useEffect(() => {
    if (id) {
      fetchRoomDetail(id)
      fetchSeats(id)
      fetchUserReservation(id)
    }
  }, [id])

  // 格式化日期
  function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 获取自习室详情
  const fetchRoomDetail = async (roomId) => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')
      const res = await roomApi.getRoom(roomId, token)
      setRoom(res.data)
    } catch (error) {
      console.error('获取自习室详情失败:', error)
      Taro.showToast({
        title: '获取自习室详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取座位列表
  const fetchSeats = async (roomId) => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await seatApi.getSeatsByRoom(roomId, token)
      
      // 获取座位后，检查每个座位在选定日期和时间段是否已被预约
      const seatsWithAvailability = await Promise.all(
        res.data.map(async (seat) => {
          // 重置选中的座位，因为可用性可能已改变
          if (selectedSeat && selectedSeat._id === seat._id) {
            setSelectedSeat(null)
          }
          
          // 只有当用户选择了日期和时间段时才进行可用性检查
          if (date && timeRange) {
            // 解析时间范围，格式应为"HH:mm - HH:mm"
            const timeParts = timeRange.split(' - ');
            const [startTime, endTime] = timeParts;
            
            try {
              // 获取指定座位在指定日期的所有预约
              const { data: reservations } = await reservationApi.getUserReservations(token, {
                myOnly: false,
                seat: seat._id,
                date: date
              });
              
              // 检查是否有时间段冲突的预约
              // 如果有已确认的预约且时间段冲突，则标记为不可用
              const hasConflict = reservations.some(reservation => {
                // 时间段冲突判断：当且仅当日期相同且时间有重叠时
                return (
                  reservation.status === 'confirmed' &&
                  reservation.date === date &&
                  (
                    // 预约时间与选择时间有重叠的情况
                    (reservation.startTime <= startTime && reservation.endTime > startTime) ||
                    (reservation.startTime < endTime && reservation.endTime >= endTime) ||
                    (reservation.startTime >= startTime && reservation.endTime <= endTime)
                  )
                );
              });
              
              // 根据需求：日期相同且时间段冲突时标记为已预约（不可用）
              // 日期不同或时间段不冲突时保持可用状态
              return {
                ...seat,
                status: hasConflict ? 'reserved' : 'available'
              };
            } catch (err) {
              console.error('检查座位可用性失败:', err);
              // 出错时默认使用可用状态
              return {
                ...seat,
                status: 'available'
              };
            }
          }
          // 如果没有选择日期和时间段，默认可用
          return {
            ...seat,
            status: 'available'
          };
        })
      );
      
      setSeats(seatsWithAvailability);
    } catch (error) {
      console.error('获取座位列表失败:', error);
    }
  }

  // 选择座位
  const handleSelectSeat = (seat) => {
    if (seat.status === 'available') {
      setSelectedSeat(seat)
    }
  }

  // 日期选择
  const onDateChange = (e) => {
      setDate(e.detail.value)
        // 当日期改变时，重新获取座位信息以更新可用性状态
        fetchSeats(id)
    }

  // 时间选择
  const onTimeChange = (e) => {
    try {
      // Picker返回的是索引，需要根据索引获取实际的时间范围文本
      const timeOptions = generateTimeOptions();
      const selectedIndex = e.detail.value;
      if (selectedIndex >= 0 && selectedIndex < timeOptions.length) {
        setTimeRange(timeOptions[selectedIndex]);
          // 当时间段改变时，重新获取座位信息以更新可用性状态
          fetchSeats(id)
      }
    } catch (error) {
      console.error('处理时间选择失败:', error);
      // 如果出错，保持当前值不变
    }
  }

  // 提交预约
  const handleSubmit = async () => {
    if (!selectedSeat) {
      Taro.showToast({
        title: '请选择座位',
        icon: 'none'
      })
      return
    }

    try {
      setSubmitting(true)
      const token = Taro.getStorageSync('token')
      
      // 预约前重新检查座位可用性，确保与后端状态一致
      const freshSeats = await seatApi.getSeatsByRoom(id, token);
      const freshSeat = freshSeats.data.find(s => s._id === selectedSeat._id);
      
      if (!freshSeat || freshSeat.status !== 'available') {
        Taro.showToast({
          title: '座位状态已变更，请重新选择',
          icon: 'none'
        });
        fetchSeats(id); // 刷新座位列表
        return;
      }
      
      // 解析时间范围
      const timeParts = timeRange.split(' - ');
      await reservationApi.createReservation({
        seat: selectedSeat._id,
        room: id,
        date,
        startTime: timeParts[0],
        endTime: timeParts[1]
      }, token)

      Taro.showToast({
        title: '预约成功',
        icon: 'success'
      })

      // 预约成功后，重新获取座位信息以更新可用性状态
        fetchSeats(id)
      
      // 跳转到我的预约页面
      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/reservations/index'
        })
      }, 1500)
    } catch (error) {
      Taro.showToast({
        title: error.message || '预约失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 生成时间选择器的选项 - 只生成2小时的时间段
  const generateTimeOptions = () => {
    const options = []
    const startHour = 8
    const endHour = 22
    const durationHours = 2 // 固定2小时预约时长
    
    // 只生成2小时的时间段选项
    for (let i = startHour; i <= endHour - durationHours; i++) {
      const j = i + durationHours
      const start = `${String(i).padStart(2, '0')}:00`
      const end = `${String(j).padStart(2, '0')}:00`
      options.push(`${start} - ${end}`)
    }
    
    return options
  }

  // 获取用户在该自习室的预约信息
  const fetchUserReservation = async (roomId) => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await reservationApi.getMyReservations(token) // 获取所有预约
      const currentReservation = res.data.find(r => 
        r.room._id === roomId && 
        (r.status === 'pending' || r.status === 'checked_in') &&
        new Date(r.date + ' ' + r.endTime) > new Date()
      )
      setUserReservation(currentReservation || null) // 确保没有找到时设置为 null
    } catch (error) {
      console.error('获取用户预约失败:', error)
      setUserReservation(null) // 发生错误时也设置为 null
    }
  }

  // 签到
  const handleCheckIn = async () => {
    if (!userReservation) return
    try {
      setSubmitting(true)
      const token = Taro.getStorageSync('token')
      await reservationApi.checkIn(userReservation._id, token)
      Taro.showToast({
        title: '签到成功',
        icon: 'success'
      })
      fetchUserReservation(id) // 刷新预约状态
    } catch (error) {
      Taro.showToast({
        title: error.message || '签到失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 签退
  const handleCheckOut = async () => {
    if (!userReservation) return
    try {
      setSubmitting(true)
      const token = Taro.getStorageSync('token')
      // 从API定义看，checkOut属于checkInApi
      await checkInApi.checkOut(userReservation.checkIn?._id || userReservation._id, token)
      Taro.showToast({
        title: '签退成功',
        icon: 'success'
      })
      fetchUserReservation(id) // 刷新预约状态
      fetchSeats(id) // 同时刷新座位可用性
    } catch (error) {
      Taro.showToast({
        title: error.message || '签退失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 取消预约
  const handleCancelReservation = async () => {
    if (!userReservation) return
    
    Taro.showModal({
      title: '取消预约',
      content: '确定要取消此预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            setSubmitting(true)
            const token = Taro.getStorageSync('token')
            await reservationApi.cancelReservation(userReservation._id, token)
            Taro.showToast({
              title: '取消成功',
              icon: 'success'
            })
            fetchUserReservation(id) // 刷新预约状态
          } catch (error) {
            Taro.showToast({
              title: error.message || '取消失败',
              icon: 'none'
            })
          } finally {
            setSubmitting(false)
          }
        }
      }
    })
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack({
      delta: 1
    })
  }

  return (
    <View className='room-detail-container'>
      {loading ? (
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      ) : room ? (
        <>
          <View className='room-header'>
            <View className='back-btn' onClick={handleBack}>
              <Text className='back-icon'>←</Text>
              <Text className='back-text'>返回</Text>
            </View>
            <Text className='room-name'>{room.name}</Text>
            <Text className='room-location'>{room.location}</Text>
            <View className='room-info'>
              <Text className='room-capacity'>容量: {room.capacity}座</Text>
              <Text className='room-time'>开放时间: {room.openTime}-{room.closeTime}</Text>
              <View className='room-occupancy'>
                <Text className='occupied-seats'>已占用: {room.occupiedSeats || 0}</Text>
                <Text className='available-seats'>可用: {room.availableSeats || room.capacity}</Text>
              </View>
            </View>
            <Text className='room-status' style={{ color: (room.occupiedSeats || 0) < (room.availableSeats || room.capacity) ? '#52c41a' : '#f5222d' }}>
              {(room.occupiedSeats || 0) < (room.availableSeats || room.capacity) ? '有空位' : '已满'}
            </Text>
            <Text className='room-status-label' style={{ color: room.status === 'open' ? '#52c41a' : '#f5222d' }}>
              {room.status === 'open' ? '开放中' : '已关闭'}
            </Text>
            {room.description && (
              <Text className='room-description'>{room.description}</Text>
            )}
          </View>

          {/* 签到/签退/取消预约区域 */}
          {userReservation && (
            <View className='section check-in-out-section'>
              <Text className='section-title'>我的预约</Text>
              <View className='reservation-info'>
                <Text>座位: {userReservation.seat?.seatNumber || '未知座位'}</Text>
                <Text>时间: {userReservation.date} {userReservation.startTime}-{userReservation.endTime}</Text>
                <Text>状态: {userReservation.status === 'pending' ? '待签到' : userReservation.status === 'confirmed' ? '已预约' : userReservation.status === 'checked_in' ? '已签到' : '已取消'}</Text>
              </View>
              <View className='reservation-actions'>
                {userReservation.status === 'pending' && new Date() >= new Date(userReservation.date + ' ' + userReservation.startTime) && new Date() <= new Date(userReservation.date + ' ' + userReservation.endTime) && (
                  <Button 
                    className='check-in-button' 
                    onClick={handleCheckIn}
                    loading={submitting}
                    disabled={submitting}
                  >
                    签到
                  </Button>
                )}
                {userReservation.status === 'checked_in' && new Date() <= new Date(userReservation.date + ' ' + userReservation.endTime) && (
                  <Button 
                    className='check-out-button' 
                    onClick={handleCheckOut}
                    loading={submitting}
                    disabled={submitting}
                  >
                    签退
                  </Button>
                )}
                {(userReservation.status === 'pending' || userReservation.status === 'confirmed') && (
                  <Button 
                    className='cancel-button' 
                    onClick={handleCancelReservation}
                    loading={submitting}
                    disabled={submitting}
                  >
                    取消预约
                  </Button>
                )}
              </View>
            </View>
          )}

          <View className='section'>
            <Text className='section-title'>选择座位</Text>
            <View className='seat-grid'>
              {seats.length > 0 ? (
                seats.map(seat => (
                  <View 
                    key={seat._id} 
                    className={`seat-item ${seat.status === 'available' ? 'available' : 'unavailable'} ${selectedSeat && selectedSeat._id === seat._id ? 'selected' : ''}`}
                    onClick={() => handleSelectSeat(seat)}
                  >
                    {/* 只显示座位号，不显示其他提示信息 */}
                    <Text className='seat-number'>{seat.seatNumber}</Text>
                  </View>
                ))
              ) : (
                <View className='empty'>暂无座位信息</View>
              )}
            </View>
          </View>

          {!userReservation && (
            <View className='section'>
              <Text className='section-title'>选择日期和时间</Text>
              
              <View className='form-item'>
                <Text className='form-label'>日期</Text>
                <Picker mode='date' value={date} onChange={onDateChange}>
                  <View className='picker'>
                    {date}
                  </View>
                </Picker>
              </View>

              <View className='form-item'>
                <Text className='form-label'>时间段</Text>
                <Picker mode='selector' range={generateTimeOptions()} onChange={onTimeChange}>
                  <View className='picker'>
                    {/* 直接显示完整的timeRange字符串 */}
                    {timeRange}
                  </View>
                </Picker>
              </View>
            </View>
          )}

          {!userReservation && (
            <Button 
              className='submit-button' 
              onClick={handleSubmit}
              loading={submitting}
              disabled={!selectedSeat || room.status !== 'open'}
            >
              确认预约
            </Button>
          )}
        </>
      ) : (
        <View className='empty-room-detail'>
          <Text className='empty-text'>未能加载自习室详情</Text>
        </View>
      )}
    </View>
  )
}