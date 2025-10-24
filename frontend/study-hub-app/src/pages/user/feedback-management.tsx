import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './feedback-management.scss';
import { feedbackApi } from '../../services/api';

interface FeedbackItem {
  id: string;
  user?: { username: string; id: string } | null;
  type: string;
  content: string;
  status: string;
  response?: string;
  createdAt: string;
}

const FeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleRefresh = () => {
    fetchAllFeedbacks();
  };

  const fetchAllFeedbacks = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');
      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      const response = await feedbackApi.getAllFeedback(token);
      // 确保数据格式正确，如果user可能为null，则提供默认值
      const formattedFeedbacks = response.data.map((item: any) => ({
        ...item,
        user: item.user || null
      }));
      setFeedbacks(formattedFeedbacks);
    } catch (error) {
      console.error('获取反馈列表失败:', error);
      Taro.showToast({
        title: '获取反馈列表失败',
        icon: 'none'
      });
      // 失败时使用模拟数据
      const mockFeedbacks: FeedbackItem[] = [
        {
          id: '1',
          user: { username: 'testuser1', id: 'user1' },
          type: 'suggestion',
          content: '建议增加更多学习资源',
          status: 'pending',
          createdAt: '2024-01-15T08:30:00Z'
        },
        {
          id: '2',
          user: { username: 'testuser2', id: 'user2' },
          type: 'bug',
          content: '预约功能有时无法正常使用',
          status: 'in_progress',
          response: '我们正在处理这个问题',
          createdAt: '2024-01-16T10:20:00Z'
        }
      ];
      setFeedbacks(mockFeedbacks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFeedbacks();
  }, []);

  const getTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
      'suggestion': '建议',
      'environment': '环境',
      'equipment': '设备',
      'other': '其他'
    };
    return typeMap[type] || '未知';
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': '待处理',
      'in_progress': '处理中',
      'resolved': '已解决',
      'rejected': '已拒绝'
    };
    return statusMap[status] || '未知';
  };

  const getStatusClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'status-pending',
      'in_progress': 'status-processing',
      'resolved': 'status-resolved',
      'rejected': 'status-rejected'
    };
    return statusMap[status] || '';
  };

  const handleEditFeedback = (feedback: any) => {
    // 创建一个深拷贝，避免引用问题
    const feedbackCopy = { ...feedback };
    
    // 处理MongoDB的_id字段，将其映射到id字段
    if (!feedbackCopy.id && feedbackCopy._id) {
      feedbackCopy.id = feedbackCopy._id.toString();
    }
    
    // 确保id存在
    if (!feedbackCopy.id) {
      console.error('接收到无效的feedback对象，缺少有效id:', feedback);
      Taro.showToast({
        title: '操作失败：无效的反馈数据',
        icon: 'none'
      });
      return;
    }
    
    // 设置初始状态和回复内容
    setSelectedFeedback(feedbackCopy);
    setReply(feedbackCopy.response || '');
    setStatus(feedbackCopy.status || 'pending');
    setShowModal(true);
  };

  const handleSaveFeedback = async () => {
    console.log('handleSaveFeedback调用时的selectedFeedback状态:', selectedFeedback);
    if (!selectedFeedback) {
      console.error('无法保存反馈：selectedFeedback为null/undefined');
      Taro.showToast({
        title: '操作失败：未选择反馈',
        icon: 'none'
      });
      // 重置状态以避免用户被卡在错误状态
      setShowModal(false);
      return;
    }
    if (!selectedFeedback.id) {
      console.error('无法保存反馈：selectedFeedback.id为undefined，完整对象:', selectedFeedback);
      Taro.showToast({
        title: '操作失败：缺少有效ID',
        icon: 'none'
      });
      // 重置状态以避免用户被卡在错误状态
      setShowModal(false);
      setSelectedFeedback(null);
      return;
    }

    try {
      const token = Taro.getStorageSync('token');
      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        });
        // 重置状态
        setShowModal(false);
        setSelectedFeedback(null);
        return;
      }
      
      // 使用局部变量保存当前的回复内容和用户选择的状态
      const currentReply = reply;
      // 直接使用用户选择的状态，不再硬编码为resolved
      const newStatus = status;
      
      // 再次验证id是否存在（防御性编程）
      const feedbackId = selectedFeedback.id;
      if (!feedbackId) {
        throw new Error('反馈ID丢失');
      }
      // 调用更新反馈API，使用response字段保存回复内容
      const response = await feedbackApi.updateFeedback(feedbackId, { response: currentReply, status: newStatus }, token);
      
      // 更新本地状态，使用response字段
      setFeedbacks(prevFeedbacks => 
        prevFeedbacks.map(item => 
          item.id === feedbackId 
            ? { ...item, response: currentReply, status: newStatus }
            : item
        )
      );
      setShowModal(false);
      // 清空回复内容和选中的反馈，避免影响下一次回复
      setReply('');
      setSelectedFeedback(null);
      Taro.showToast({
        title: '回复成功',
        icon: 'success'
      });
    } catch (error) {
      // 统一错误处理
      console.error('回复失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 根据错误类型显示不同的提示信息
      let toastTitle = '回复失败';
      if (errorMessage.includes('ID') || errorMessage.includes('id')) {
        toastTitle = '无法保存反馈：缺少有效的反馈ID';
      } else {
        toastTitle = `回复失败: ${errorMessage}`;
      }
      
      // 即使API调用失败，也允许在本地更新（模拟环境下）
      const currentReply = reply;
      // 使用用户选择的状态
      const newStatus = status;
      // 再次验证selectedFeedback和id是否存在
      if (selectedFeedback && selectedFeedback.id) {
        setFeedbacks(prevFeedbacks => 
          prevFeedbacks.map(item => 
            item.id === selectedFeedback.id 
              ? { ...item, response: currentReply, status: newStatus }
              : item
          )
        );
      }
      
      // 重置状态以避免用户被卡在错误状态
      setShowModal(false);
      setReply('');
      setSelectedFeedback(null);
      
      Taro.showToast({
        title: toastTitle,
        icon: 'none'
      });
    }
  };

  const handleStatusChange = (e: any) => {
    setStatus(e.target.value);
  };

  return (
    <View className="feedback-management-container">
      <View className="header">
        <Text className="title">反馈管理</Text>
        <Button className="refresh-button" onClick={handleRefresh}>刷新</Button>
      </View>

      {loading ? (
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      ) : feedbacks.length === 0 ? (
        <View className="empty">
          <Text>暂无反馈信息</Text>
        </View>
      ) : (
        <ScrollView className="feedback-list" scrollY>
          {feedbacks.map((feedback) => (
            <View key={feedback.id} className="feedback-item">
              <View className="feedback-header">
                <Text className="username">{feedback.user?.username || '匿名用户'}</Text>
                <Text className={`status ${getStatusClass(feedback.status)}`}>
                  {getStatusText(feedback.status)}
                </Text>
              </View>
              <View className="feedback-content">
                <Text className="feedback-type">{getTypeText(feedback.type)}</Text>
                <Text className="content">{feedback.content}</Text>
                {feedback.response && (
            <View className="reply-section">
              <Text className="reply-label">管理员回复：</Text>
              <Text className="reply-content">{feedback.response}</Text>
            </View>
          )}
                <Text className="time">
                  {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                </Text>
              </View>
              <Button className="reply-button" onClick={() => handleEditFeedback(feedback)} plain={false} size="mini">
                回复
              </Button>
            </View>
          ))}
        </ScrollView>
      )}

      {showModal && selectedFeedback && (
        <View className="modal-overlay" onClick={() => setShowModal(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">回复反馈</Text>
              <Button className="close-button" onClick={() => setShowModal(false)}>
                关闭
              </Button>
            </View>
            <View className="modal-body">
              <View className="form-item">
                <Text className="label">反馈内容：</Text>
                <Text className="content">{selectedFeedback.content}</Text>
              </View>
              <View className="form-item">
                <Text className="label">处理状态：</Text>
                <View className="status-selector">
                  {(['pending', 'in_progress', 'resolved', 'rejected'] as const).map((s) => (
                    <Button
                      key={s}
                      className={`status-button ${status === s ? 'active' : ''}`}
                      onClick={() => setStatus(s)}
                    >
                      {getStatusText(s)}
                    </Button>
                  ))}
                </View>
                <Text className="status-hint">（请选择合适的处理状态）</Text>
              </View>
              <View className="form-item">
                <Text className="label">回复内容：</Text>
                <Input
                  className="reply-input"
                  value={reply}
                  onChange={(e) => setReply(e.detail.value)}
                  placeholder="请输入回复内容"
                  multiline
                  style={{ height: '100px' }}
                />
              </View>
            </View>
            <View className="modal-footer">
              <Button className="cancel-button" onClick={() => setShowModal(false)}>
                取消
              </Button>
              <Button className="reply-button" onClick={handleSaveFeedback}>
                回复
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default FeedbackManagement;