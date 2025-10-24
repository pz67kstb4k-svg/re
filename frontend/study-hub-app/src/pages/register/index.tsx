import { View, Text, Button, Input, Form } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { userApi } from '../../services/api'
import './index.scss'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.name || !formData.studentId || !formData.phone || !formData.password || !formData.confirmPassword) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      Taro.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)
      await userApi.register({
        name: formData.name,
        studentId: formData.studentId,
        phone: formData.phone,
        password: formData.password
      })

      Taro.showToast({
        title: '注册成功',
        icon: 'success'
      })

      // 跳转到登录页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      Taro.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const goToLogin = () => {
    Taro.navigateBack()
  }

  return (
    <View className='register-container'>
      <View className='register-header'>
        <Text className='register-title'>自习室预约平台</Text>
        <Text className='register-subtitle'>创建新账号</Text>
      </View>

      <Form className='register-form'>
        <View className='form-item'>
          <Text className='form-label'>姓名</Text>
          <Input
            className='form-input'
            placeholder='请输入姓名'
            value={formData.name}
            onInput={(e) => handleChange('name', e.detail.value)}
          />
        </View>

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
          <Text className='form-label'>手机号</Text>
          <Input
            className='form-input'
            placeholder='请输入手机号'
            value={formData.phone}
            onInput={(e) => handleChange('phone', e.detail.value)}
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

        <View className='form-item'>
          <Text className='form-label'>确认密码</Text>
          <Input
            className='form-input'
            password
            placeholder='请再次输入密码'
            value={formData.confirmPassword}
            onInput={(e) => handleChange('confirmPassword', e.detail.value)}
          />
        </View>

        <Button 
          className='register-button' 
          onClick={handleSubmit}
          loading={loading}
        >
          注册
        </Button>

        <View className='login-link'>
          <Text>已有账号？</Text>
          <Text className='link' onClick={goToLogin}>返回登录</Text>
        </View>
      </Form>
    </View>
  )
}