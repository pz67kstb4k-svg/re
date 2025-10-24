import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';
import { violationApi } from '../../../services/api';

interface ViolationItem {
  _id: string;
  type: 'late_check_in' | 'early_check_out' | 'no_show' | 'occupy_overtime' | 'other';
  description: string;
  penalty: 'warning' | 'suspend' | 'ban' | 'none';
  penaltyDuration: number;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  reservation: {
    room: {
      name: string;
    };
    seat: {
      number: string;
    };
    date: string;
    startTime: string;
    endTime: string;
  };
}

const Violations: React.FC = () => {
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async (isRefresh = false) => {
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

      const res = await violationApi.getUserViolations(token);
      setViolations(res.data || []);
    } catch (error) {
      console.error('获取违规记录失败:', error);
      Taro.showToast({
        title: error.message || '获取违规记录失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getViolationTypeText = (type: string) => {
    const typeMap = {
      'late_check_in': '迟到签到',
      'early_check_out': '提前签退',
      'no_show': '未到场',
      'occupy_overtime': '超时占用',
      'other': '其他违规'
    };
    return typeMap[type] || type;
  };

  const getPenaltyText = (penalty: string) => {
    const penaltyMap = {
      'warning': '警告',
      'suspend': '暂停使用',
      'ban': '禁止使用',
      'none': '无处罚'
    };
    return penaltyMap[penalty] || penalty;
  };

  const getPenaltyClass = (penalty: string) => {
    const classMap = {
      'warning': 'penalty-warning',
      'suspend': 'penalty-suspend',
      'ban': 'penalty-ban',
      'none': 'penalty-none'
    };
    return classMap[penalty] || '';
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
    fetchViolations(true);
  };

  if (loading) {
    return (
      <View className='violations-container'>
        <View className='header'>
          <View className='back-btn' onClick={() => Taro.navigateBack()}>
            <Text className='back-icon'>{'<'}</Text>
            <Text className='back-text'>返回</Text>
          </View>
          <Text className='title'>违规记录</Text>
        </View>
        <View className='loading'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='violations-container'>
      <View className='header'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>{'<'}</Text>
          <Text className='back-text'>返回</Text>
        </View>
        <Text className='title'>违规记录</Text>
        <View className='header-actions'>
          <Button className='refresh-btn' onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '刷新中' : '刷新'}
          </Button>
        </View>
      </View>

      <ScrollView
        scrollY
        className='violations-scroll-view'
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {violations.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>🎉</Text>
            <Text className='empty-text'>暂无违规记录，继续保持！</Text>
            <Text className='empty-tip'>遵守自习室规则，营造良好学习环境</Text>
          </View>
        ) : (
          <View className='violations-list'>
            {violations.map((violation) => (
              <View className='violation-card' key={violation._id}>
                <View className='violation-header'>
                  <View className='violation-type-penalty'>
                    <Text className='violation-type'>
                      {getViolationTypeText(violation.type)}
                    </Text>
                    <Text className={`penalty ${getPenaltyClass(violation.penalty)}`}>
                      {getPenaltyText(violation.penalty)}
                      {violation.penaltyDuration > 0 && ` (${violation.penaltyDuration}天)`}
                    </Text>
                  </View>
                  <Text className='violation-date'>
                    {formatDate(violation.createdAt)}
                  </Text>
                </View>

                <View className='violation-info'>
                  {/* 预约信息 */}
                  <View className='reservation-info'>
                    <View className='info-row'>
                      <Text className='info-label'>自习室:</Text>
                      <Text className='info-value'>
                        {violation.reservation?.room?.name || '未知'}
                      </Text>
                    </View>
                    <View className='info-row'>
                      <Text className='info-label'>座位:</Text>
                      <Text className='info-value'>
                        {violation.reservation?.seat?.number || '未知'}
                      </Text>
                    </View>
                    <View className='info-row'>
                      <Text className='info-label'>预约时间:</Text>
                      <Text className='info-value'>
                        {violation.reservation?.date} {violation.reservation?.startTime}-{violation.reservation?.endTime}
                      </Text>
                    </View>
                  </View>

                  {/* 违规描述 */}
                  {violation.description && (
                    <View className='violation-description'>
                      <Text className='description-label'>违规描述:</Text>
                      <Text className='description-text'>{violation.description}</Text>
                    </View>
                  )}

                  {/* 处理状态 */}
                  <View className='violation-status'>
                    <Text className={`status ${violation.isResolved ? 'resolved' : 'unresolved'}`}>
                      {violation.isResolved ? '已处理' : '待处理'}
                    </Text>
                    {violation.isResolved && violation.resolvedAt && (
                      <Text className='resolved-time'>
                        处理时间: {formatDate(violation.resolvedAt)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Violations;