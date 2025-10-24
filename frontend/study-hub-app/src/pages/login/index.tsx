import { View, Text, Button, Input, Form } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { userApi } from '../../services/api'
import './index.scss'

export default function Login() {
  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.password) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)
      const res = await userApi.login({
        studentId: formData.studentId,
        password: formData.password
      })

      // 保存token到本地
      Taro.setStorageSync('token', res.token)
      Taro.setStorageSync('userInfo', res.data)

      Taro.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 跳转到首页
      Taro.switchTab({
        url: '/pages/index/index'
      })
    } catch (error) {
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const goToRegister = () => {
    Taro.navigateTo({
      url: '/pages/register/index'
    })
  }

  return (
    <View className='login-container'>
      <View className='login-header'>
        <Text className='login-title'>自习室预约平台</Text>
        <Text className='login-subtitle'>登录您的账号</Text>
      </View>

      <Form className='login-form'>
        <View className='form-item'>
          <Text className='form-label'>学号</Text>
          <Input
            className='form-input'
            placeholder='请输入学号'
            value={formData.studentId}
            onInput={(e) => handleChange('studentId', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Text className='form-label'>密码</Text>
          <Input
            className='form-input'
            password
            placeholder='请输入密码'
            value={formData.password}
            onInput={(e) => handleChange('password', e.detail.value)}
          />
        </View>

        <Button 
          className='login-button' 
          onClick={handleSubmit}
          loading={loading}
        >
          登录
        </Button>

        <View className='register-link'>
          <Text>还没有账号？</Text>
          <Text className='link' onClick={goToRegister}>立即注册</Text>
        </View>
      </Form>
    </View>
  )
}