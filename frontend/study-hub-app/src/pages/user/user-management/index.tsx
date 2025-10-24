import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { userApi } from '../../../services/api'
import './index.scss'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [currentUser, setCurrentUser] = useState({
    _id: '',
    name: '',
    studentId: '',
    phone: '',
    role: 'student',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')
      const res = await userApi.getUsers(token)
      setUsers(res.data)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      Taro.showToast({
        title: '获取用户列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 打开添加/编辑弹窗
  const handleOpenModal = (user = null) => {
    if (user) {
      setIsEdit(true)
      setCurrentUser(user)
    } else {
      setIsEdit(false)
      setCurrentUser({
        _id: '',
        name: '',
        studentId: '',
        phone: '',
        role: 'user',
        password: ''
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
    setCurrentUser(prev => ({ ...prev, [key]: value }))
  }

  // 提交用户信息
  const handleSubmit = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (isEdit) {
        await userApi.updateUser(currentUser._id, currentUser, token)
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        await userApi.createUser(currentUser, token)
        Taro.showToast({
          title: '添加成功',
          icon: 'success'
        })
      }
      handleCloseModal()
      fetchUsers()
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      })
    }
  }

  // 删除用户
  const handleDelete = async (id) => {
    Taro.showModal({
      title: '提示',
      content: '确定要删除该用户吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const token = Taro.getStorageSync('token')
            await userApi.deleteUser(id, token)
            Taro.showToast({
              title: '删除成功',
              icon: 'success'
            })
            fetchUsers()
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
    <View className='user-management-container'>
      <View className='header'>
        <View className='back-btn' onClick={handleBack}>
          <Text className='back-icon'>←</Text>
          <Text className='back-text'>返回</Text>
        </View>
        <Text className='title'>用户管理</Text>
        <Button className='add-button' onClick={() => handleOpenModal()}>添加用户</Button>
      </View>

      {loading ? (
        <View className='loading'>加载中...</View>
      ) : (
        <ScrollView scrollY className='user-list'>
          {users.length > 0 ? (
            users.map(user => (
              <View key={user._id} className='user-card'>
                <View className='user-info'>
                  <Text className='user-name'>{user.name}</Text>
                  <Text className='user-studentId'>学号: {user.studentId}</Text>
                  <Text className='user-phone'>手机: {user.phone}</Text>
                  <Text className={`user-role role-${user.role}`}>角色: {user.role === 'admin' ? '管理员' : '学生'}</Text>
                </View>
                <View className='user-actions'>
                  <Button className='edit-button' onClick={() => handleOpenModal(user)}>编辑</Button>
                  <Button className='delete-button' onClick={() => handleDelete(user._id)}>删除</Button>
                </View>
              </View>
            ))
          ) : (
            <View className='empty'>暂无用户信息</View>
          )}
        </ScrollView>
      )}

      {showModal && (
        <View className='modal-overlay'>
          <View className='modal-content'>
            <Text className='modal-title'>{isEdit ? '编辑用户' : '添加用户'}</Text>
            <Input
              className='modal-input'
              placeholder='姓名'
              value={currentUser.name}
              onInput={(e) => handleChange('name', e.detail.value)}
            />
            <Input
              className='modal-input'
              placeholder='学号'
              value={currentUser.studentId}
              onInput={(e) => handleChange('studentId', e.detail.value)}
            />
            <Input
              className='modal-input'
              placeholder='手机号'
              value={currentUser.phone}
              onInput={(e) => handleChange('phone', e.detail.value)}
            />
            <Input
              className='modal-input'
              placeholder='角色 (user/admin)'
              value={currentUser.role}
              onInput={(e) => handleChange('role', e.detail.value)}
            />
            {!isEdit && (
              <Input
                className='modal-input'
                placeholder='密码'
                password
                value={currentUser.password}
                onInput={(e) => handleChange('password', e.detail.value)}
              />
            )}
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