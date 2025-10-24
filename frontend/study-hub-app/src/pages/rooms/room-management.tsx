import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { roomApi } from '../../services/api'
import './room-management.scss'

export default function RoomManagement() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [currentRoom, setCurrentRoom] = useState({
    _id: '',
    name: '',
    location: '',
    capacity: 0,
    openTime: '',
    closeTime: '',
    description: ''
  })

  useEffect(() => {
    fetchRooms()
  }, [])

  // 每次页面显示时刷新数据
  useDidShow(() => {
    fetchRooms()
  })

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

  // 打开添加/编辑弹窗
  const handleOpenModal = (room = null) => {
    if (room) {
      setIsEdit(true)
      setCurrentRoom(room)
    } else {
      setIsEdit(false)
      setCurrentRoom({
        _id: '',
        name: '',
        location: '',
        capacity: 0,
        openTime: '',
        closeTime: '',
        description: ''
      })
    }
    setShowModal(true)
  }

  // 关闭弹窗
  const handleCloseModal = () => {
    setShowModal(false)
  }

  // 处理输入变化
  const handleChange = (key, value) => {
    setCurrentRoom(prev => ({ ...prev, [key]: value }))
  }

  // 提交房间信息
  const handleSubmit = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (isEdit) {
        await roomApi.updateRoom(currentRoom._id, currentRoom, token)
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 创建新房间时移除空的_id字段，避免MongoDB ObjectId验证失败
        const { _id, ...roomDataWithoutId } = currentRoom;
        await roomApi.createRoom(roomDataWithoutId, token)
        Taro.showToast({
          title: '添加成功',
          icon: 'success'
        })
      }
      handleCloseModal()
      fetchRooms()
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      })
    }
  }

  // 删除房间
  const handleDelete = async (id) => {
    Taro.showModal({
      title: '提示',
      content: '确定要删除该房间吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const token = Taro.getStorageSync('token')
            await roomApi.deleteRoom(id, token)
            Taro.showToast({
              title: '删除成功',
              icon: 'success'
            })
            fetchRooms()
          } catch (error) {
            console.error('删除失败:', error)
            Taro.showToast({
              title: error.message || '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  // 返回上一页
  const handleBack = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  return (
    <View className='room-management-container'>
      <View className='header'>
        <View className='back-btn' onClick={handleBack}>
          <Text className='back-icon'>←</Text>
          <Text className='back-text'>返回</Text>
        </View>
        <Text className='title'>房间管理</Text>
        <Button className='add-button' onClick={() => handleOpenModal()}>添加房间</Button>
      </View>

      {loading ? (
        <View className='loading'>加载中...</View>
      ) : (
        <ScrollView scrollY className='room-list'>
          {rooms.length > 0 ? (
            rooms.map(room => (
              <View key={room._id} className='room-card'>
                <View className='room-info'>
                  <Text className='room-name'>{room.name}</Text>
                  <Text className='room-location'>{room.location}</Text>
                  <View className='room-details'>
                    <Text className='room-capacity'>容量: {room.capacity}座</Text>
                    <Text className='room-time'>开放时间: {room.openTime}-{room.closeTime}</Text>
                  </View>
                  <Text className='room-description'>{room.description}</Text>
                </View>
                <View className='room-actions'>
                  <Button className='edit-button' onClick={() => handleOpenModal(room)}>编辑</Button>
                  <Button className='delete-button' onClick={() => handleDelete(room._id)}>删除</Button>
                </View>
              </View>
            ))
          ) : (
            <View className='empty'>暂无房间信息</View>
          )}
        </ScrollView>
      )}

      {showModal && (
        <View className='modal-overlay'>
          <View className='modal-content'>
            <Text className='modal-title'>{isEdit ? '编辑房间' : '添加房间'}</Text>
            <Input
              className='modal-input'
              placeholder='房间名称'
              value={currentRoom.name}
              onInput={(e) => handleChange('name', e.detail.value)}
            />
            <Input
              className='modal-input'
              placeholder='位置'
              value={currentRoom.location}
              onInput={(e) => handleChange('location', e.detail.value)}
            />
            <Input
              className='modal-input'
              placeholder='容量'
              type='number'
              value={String(currentRoom.capacity)}
              onInput={(e) => handleChange('capacity', parseInt(e.detail.value))}
            />
            <Input
              className='modal-input'
              placeholder='开放时间 (例如: 08:00)'
              value={currentRoom.openTime}
              onInput={(e) => handleChange('openTime', e.detail.value)}
            />
            <Input
              className='modal-input'
              placeholder='关闭时间 (例如: 22:00)'
              value={currentRoom.closeTime}
              onInput={(e) => handleChange('closeTime', e.detail.value)}
            />
            <Input
              className='modal-input'
              placeholder='描述'
              value={currentRoom.description}
              onInput={(e) => handleChange('description', e.detail.value)}
            />
            <View className='modal-buttons'>
              <Button className='modal-cancel-button' onClick={handleCloseModal}>取消</Button>
              <Button className='modal-submit-button' onClick={handleSubmit}>提交</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}