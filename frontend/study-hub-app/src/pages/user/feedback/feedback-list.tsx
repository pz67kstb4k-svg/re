import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './feedback-list.scss';
import { feedbackApi } from '../../../services/api';

interface FeedbackItem {
  _id: string;
  type: 'environment' | 'equipment' | 'suggestion' | 'other';
  content: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  response?: string;
}

const FeedbackList: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = Taro.getStorageSync('token');

      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
        });
        Taro.navigateTo({ url: '/pages/login/index' });
        return;
      }

      const res = await feedbackApi.getUserFeedback(token);
      setFeedbacks(res.data || []);
    } catch (error) {
      console.error('获取反馈列表失败:', error);
      Taro.showToast({
        title: error.message || '获取反馈列表失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTypeText = (type: string) => {
    const typeMap = {
      'environment': '环境问题',
      'equipment': '设备问题',
      'suggestion': '建议意见',
      'other': '其他'
    };
    return typeMap[type] || type;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'pending': '待处理',
      'in_progress': '处理中',
      'resolved': '已解决',
      'rejected': '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap = {
      'pending': 'status-pending',
      'in_progress': 'status-in-progress',
      'resolved': 'status-resolved',
      'rejected': 'status-rejected'
    };
    return classMap[status] || '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    fetchFeedbacks(true);
  };

  const goToSubmitFeedback = () => {
    Taro.navigateTo({ url: '/pages/user/feedback/index' });
  };

  if (loading) {
    return (
      <View className='feedback-list-container'>
        <View className='header'>
          <View className='back-btn' onClick={() => Taro.navigateBack()}>
            <Text className='back-icon'>{'<'}</Text>
            <Text className='back-text'>返回</Text>
          </View>
          <Text className='title'>我的反馈</Text>
        </View>
        <View className='loading'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='feedback-list-container'>
      <View className='header'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>{'<'}</Text>
          <Text className='back-text'>返回</Text>
        </View>
        <Text className='title'>我的反馈</Text>
        <View className='header-actions'>
          <Button className='refresh-btn' onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '刷新中' : '刷新'}
          </Button>
        </View>
      </View>

      <ScrollView
        scrollY
        className='feedback-scroll-view'
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {feedbacks.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>📝</Text>
            <Text className='empty-text'>暂无反馈记录</Text>
            <Button className='empty-action' onClick={goToSubmitFeedback}>
              提交第一条反馈
            </Button>
          </View>
        ) : (
          <View className='feedback-list'>
            {feedbacks.map((feedback) => (
              <View className='feedback-card' key={feedback._id}>
                <View className='feedback-header'>
                  <View className='feedback-type-status'>
                    <Text className='feedback-type'>{getTypeText(feedback.type)}</Text>
                    <Text className={`status ${getStatusClass(feedback.status)}`}>
                      {getStatusText(feedback.status)}
                    </Text>
                  </View>
                  <Text className='feedback-time'>{formatDate(feedback.createdAt)}</Text>
                </View>

                <View className='feedback-content'>
                  <Text className='content-text'>{feedback.content}</Text>
                </View>

                {feedback.response && (
                  <View className='feedback-response'>
                    <Text className='response-label'>管理员回复:</Text>
                    <Text className='response-text'>{feedback.response}</Text>
                    <Text className='response-time'>
                      回复时间: {formatDate(feedback.updatedAt)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View className='bottom-actions'>
        <Button className='submit-new-btn' onClick={goToSubmitFeedback}>
          提交新反馈
        </Button>
      </View>
    </View>
  );
};

export default FeedbackList;