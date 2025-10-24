import React, { useState } from 'react';
import { View, Text, Textarea, Button, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';
import { feedbackApi } from '../../../services/api';

const Feedback: React.FC = () => {
  const [type, setType] = useState('environment');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const feedbackTypes = [
    { value: 'environment', label: '环境问题' },
    { value: 'equipment', label: '设备问题' },
    { value: 'suggestion', label: '建议意见' },
    { value: 'other', label: '其他' }
  ];

  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({
        title: '反馈内容不能为空',
        icon: 'none',
      });
      return;
    }

    if (content.trim().length > 500) {
      Taro.showToast({
        title: '反馈内容不能超过500字符',
        icon: 'none',
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = Taro.getStorageSync('token');

      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
        });
        Taro.navigateTo({ url: '/pages/login/index' });
        return;
      }

      await feedbackApi.submitFeedback({ type, content: content.trim() }, token);

      Taro.showToast({
        title: '反馈提交成功',
        icon: 'success',
      });

      // 重置表单
      setType('environment');
      setContent('');

      // 延迟返回上一页
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('提交反馈失败:', error);
      Taro.showToast({
        title: error.message || '反馈提交失败',
        icon: 'none',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTypeChange = (e) => {
    setType(feedbackTypes[e.detail.value].value);
  };

  return (
    <View className='feedback-container'>
      <View className='header'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>{'<'}</Text>
          <Text className='back-text'>返回</Text>
        </View>
        <Text className='title'>提交反馈</Text>
      </View>

      <View className='form-section'>
        <View className='form-item'>
          <Text className='form-label'>反馈类型</Text>
          <Picker
            mode='selector'
            range={feedbackTypes.map(item => item.label)}
            onChange={handleTypeChange}
            value={feedbackTypes.findIndex(item => item.value === type)}
          >
            <View className='picker-view'>
              <Text className='picker-text'>
                {feedbackTypes.find(item => item.value === type)?.label}
              </Text>
              <Text className='picker-arrow'>{'>'}</Text>
            </View>
          </Picker>
        </View>

        <View className='form-item'>
          <Text className='form-label'>反馈内容</Text>
          <Textarea
            className='feedback-textarea'
            placeholder='请详细描述您的反馈内容，我们会认真处理每一条反馈...'
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={500}
            showConfirmBar={false}
          />
          <Text className={`char-count ${content.length > 450 ? 'warning' : ''}`}>
            {content.length}/500
          </Text>
        </View>

        <Button
          className={`submit-button ${submitting ? 'submitting' : ''}`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交反馈'}
        </Button>
      </View>
    </View>
  );
};

export default Feedback;