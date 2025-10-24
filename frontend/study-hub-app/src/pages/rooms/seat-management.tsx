import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button, Input, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { roomApi, seatApi } from '../../services/api'
import './seat-management.scss'

export default function SeatManagement() {
  const [rooms, setRooms] = useState([])
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSeat, setCurrentSeat] = useState({
    seatNumber: '',
    room: '',
    status: 'available'
  })

  // 座位状态选项
  const statusOptions = [
    { value: 'available', label: '可用' },
    { value: 'occupied', label: '已占用' },
    { value: 'reserved', label: '已预订' },
    { value: 'maintenance', label: '维护中' }
  ]

  useEffect(() => {
    fetchRooms()
  }, [])

  // 获取自习室列表
  const fetchRooms = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await roomApi.getRooms(token)
      setRooms(res.data)
      if (res.data.length > 0 && !selectedRoomId) {
        setSelectedRoomId(res.data[0]._id)
      }
    } catch (error) {
      console.error('获取自习室列表失败:', error)
      Taro.showToast({
        title: '获取自习室列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 当选择不同的自习室时，获取该自习室的座位列表
  useEffect(() => {
    if (selectedRoomId) {
      fetchSeats()
    }
  }, [selectedRoomId])

  // 获取座位列表
  const fetchSeats = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await seatApi.getSeatsByRoom(selectedRoomId, token)
      setSeats(res.data)
    } catch (error) {
      console.error('获取座位列表失败:', error)
      Taro.showToast({
        title: '获取座位列表失败',
        icon: 'none'
      })
    }
  }

  // 打开添加座位弹窗
  const handleOpenModal = () => {
    console.log('创建模式')
    setCurrentSeat({
      seatNumber: '',
      room: selectedRoomId,
      status: 'available'
    })
    // 直接显示表单
    showFormModal()
  }

  // 显示表单模态框
  const showFormModal = () => {
    // 确保在打开模态框前有正确的自习室信息
    const initialRoomId = selectedRoomId;
    if (!initialRoomId) {
      Taro.showToast({ title: '请先选择自习室', icon: 'none' });
      return;
    }
    
    // 先更新currentSeat的room值为当前选中的自习室
    setCurrentSeat(prev => ({ ...prev, room: initialRoomId }));
    
    Taro.showModal({
      title: '添加座位',
      editable: true,
      placeholderText: '座位号',
      defaultValue: '',
      success: (res) => {
        if (res.confirm) {
          // 检查座位号有效性
          const trimmedContent = res.content?.trim();
          if (!trimmedContent) {
            console.log('❌ 座位号为空或仅包含空白字符');
            Taro.showToast({ title: '请输入有效的座位号', icon: 'none' });
            return;
          }
          
          // 创建新座位数据
          const updatedSeat = {
            ...currentSeat,
            seatNumber: trimmedContent,
            room: initialRoomId // 确保room值正确
          };
          
          console.log('创建座位数据:', JSON.stringify(updatedSeat));
          
          // 更新状态
          setCurrentSeat(updatedSeat);
          
          // 只在座位号有效时调用状态选择器，并传递更新后的座位数据
          showStatusPicker(updatedSeat);
          console.log('✅ 座位号输入有效：', trimmedContent);
        } else {
          // 用户取消输入
          console.log('⚠️ 用户取消座位号输入');
        }
      }
    })
  }

  // 显示状态选择器 - 接收最新的座位数据以避免异步状态问题
  const showStatusPicker = (seatData) => {
    Taro.showActionSheet({
      itemList: statusOptions.map(opt => opt.label),
      success: (res) => {
        const selectedIndex = res.tapIndex
        const newStatus = statusOptions[selectedIndex].value
        
        // 使用传入的最新座位数据，只更新状态
        const updatedSeat = {
          ...seatData,
          status: newStatus
        }
        
        // 确认保存
        Taro.showModal({
          title: '确认保存',
          content: `座位号: ${updatedSeat.seatNumber}\n状态: ${statusOptions[selectedIndex].label}\n操作类型: 创建`,
          success: (confirmRes) => {
            if (confirmRes.confirm) {
              console.log('准备提交的座位数据:', JSON.stringify(updatedSeat));
              // 直接使用更新后的数据提交，避免异步状态问题
              handleSubmitWithData(updatedSeat)
            }
          }
        })
      }
    })
  }

  // 处理输入变化
  const handleChange = (key, value) => {
    setCurrentSeat(prev => ({ ...prev, [key]: value }))
  }

  // 提交座位信息 (只保留创建功能)
  const handleSubmitWithData = async (seatData) => {
    try {
      console.log('===== 开始提交座位信息 =====')
      console.log('提交的座位数据:', JSON.stringify(seatData))
      
      // 表单验证
      if (!seatData.seatNumber || seatData.seatNumber.trim() === '') {
        Taro.showToast({ title: '请输入座位号', icon: 'none' });
        console.log('❌ 验证失败：座位号为空');
        return;
      }
      
      // 确保有自习室信息
      if (!seatData.room || seatData.room === '') {
        console.log('⚠️ seatData.room为空，使用selectedRoomId:', selectedRoomId);
        
        if (!selectedRoomId) {
          Taro.showToast({ title: '请选择自习室', icon: 'none' });
          console.log('❌ 验证失败：未选择自习室');
          return;
        }
        // 更新room值
        seatData.room = selectedRoomId;
      }
      
      const token = Taro.getStorageSync('token')
      console.log('Token存在:', !!token)
      
      // 构造创建数据，移除可能存在的_id字段
      const createData = {
        seatNumber: seatData.seatNumber.trim(),
        room: seatData.room,
        status: seatData.status
      }
      console.log('最终提交的座位数据:', JSON.stringify(createData))
      
      // 只执行创建操作
      console.log('执行创建操作')
      await seatApi.createSeat(createData, token)
      Taro.showToast({
        title: '创建成功',
        icon: 'success'
      })
      
      // 刷新座位列表
      fetchSeats()
      
      // 重置表单
      setCurrentSeat({
        seatNumber: '',
        room: selectedRoomId,
        status: 'available'
      })
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({
        title: error.response?.data?.message || error.message || '提交失败',
        icon: 'none'
      })
    }
  }
  
  // 提交座位信息 (原始版本，调用新的函数避免代码重复)
  const handleSubmit = async () => {
    // 调用新的handleSubmitWithData函数，传入当前状态
    handleSubmitWithData({
      ...currentSeat,
      room: currentSeat.room || selectedRoomId // 确保room值正确
    })
  }

  // 删除座位
  const handleDelete = async (id) => {
    Taro.showModal({
      title: '提示',
      content: '确定要删除该座位吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const token = Taro.getStorageSync('token')
            await seatApi.deleteSeat(id, token)
            Taro.showToast({
              title: '删除成功',
              icon: 'success'
            })
            fetchSeats()
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

  // 批量添加座位
  const handleBatchAddSeats = () => {
    // 检查是否已选择自习室
    if (!selectedRoomId) {
      Taro.showToast({ title: '请先选择自习室', icon: 'none' });
      return;
    }

    // 创建批量添加参数收集界面
    const createBatchAddModal = () => {
      // 使用自定义组件或Taro.showModal组合实现多输入
      Taro.showModal({
        title: '批量添加座位',
        content: '',
        editable: true,
        placeholderText: '请输入座位号前缀（如A）',
        defaultValue: '',
        success: (res) => {
          if (res.confirm) {
            const prefix = res.content?.trim();
            if (!prefix) {
              Taro.showToast({ title: '请输入有效的座位号前缀', icon: 'none' });
              return;
            }

            // 输入起始编号
              Taro.showModal({
                title: '起始编号',
                content: '',
                editable: true,
                placeholderText: '请输入起始座位编号',
                defaultValue: '1',
              success: (startRes) => {
                if (startRes.confirm) {
                  const startNum = parseInt(startRes.content?.trim() || '1');
                  if (isNaN(startNum) || startNum < 1) {
                    Taro.showToast({ title: '请输入有效的起始编号', icon: 'none' });
                    return;
                  }

                  // 输入结束编号
                  Taro.showModal({
                    title: '结束编号',
                    content: '',
                    editable: true,
                    placeholderText: '请输入结束座位编号',
                    defaultValue: '10',
                    success: (endRes) => {
                      if (endRes.confirm) {
                        const endNum = parseInt(endRes.content?.trim() || '10');
                        if (isNaN(endNum) || endNum < startNum) {
                          Taro.showToast({ title: '请输入有效的结束编号', icon: 'none' });
                          return;
                        }

                        // 确认批量添加
                        Taro.showModal({
                          title: '确认批量添加',
                          content: `确定要添加以下座位吗？\n\n前缀: ${prefix}\n起始编号: ${startNum}\n结束编号: ${endNum}\n\n预计添加: ${endNum - startNum + 1} 个座位`,
                          success: (confirmRes) => {
                            if (confirmRes.confirm) {
                              // 开始批量添加
                              performBatchAdd(prefix, startNum, endNum);
                            }
                          }
                        });
                      }
                    }
                  });
                }
              }
            });
          }
        }
      });
    };

    // 执行批量添加操作
    const performBatchAdd = async (prefix, startNum, endNum) => {
      try {
        const token = Taro.getStorageSync('token');
        let successCount = 0;
        let failCount = 0;
        const totalCount = endNum - startNum + 1;

        // 显示加载提示
        Taro.showLoading({
          title: `正在添加 ${successCount}/${totalCount}`,
          mask: true
        });

        // 逐个添加座位
        for (let i = startNum; i <= endNum; i++) {
          try {
            // 格式化座位号，例如 A001
            const seatNumber = `${prefix}${i.toString().padStart(3, '0')}`;
            
            // 构造座位数据
            const seatData = {
              seatNumber,
              room: selectedRoomId,
              status: 'available'
            };

            // 调用API创建座位
            await seatApi.createSeat(seatData, token);
            successCount++;
          } catch (error) {
            console.error(`添加座位 ${i} 失败:`, error);
            failCount++;
          }

          // 更新加载提示
          Taro.showLoading({
            title: `正在添加 ${successCount}/${totalCount}`,
            mask: true
          });

          // 避免请求过快，添加短暂延迟
          if (i < endNum) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // 隐藏加载提示
        Taro.hideLoading();

        // 显示结果
        Taro.showModal({
          title: '批量添加完成',
          content: `成功: ${successCount} 个\n失败: ${failCount} 个\n总计: ${totalCount} 个`,
          showCancel: false,
          success: () => {
            // 刷新座位列表
            fetchSeats();
          }
        });
      } catch (error) {
        Taro.hideLoading();
        console.error('批量添加失败:', error);
        Taro.showToast({
          title: '批量添加过程中发生错误',
          icon: 'none'
        });
      }
    };

    // 调用批量添加模态框
    createBatchAddModal();
  }

  return (
    <View className='seat-management-container'>
      <View className='header'>
        <Text className='title'>座位管理</Text>
      </View>

      {loading ? (
        <View className='loading'>加载中...</View>
      ) : (
        <>
          <View className='room-selector'>
            <Text className='label'>选择自习室：</Text>
            <Picker
              mode='selector'
              range={rooms.map(room => {
                  // 提取纯自习室名称，去掉可能的ID后缀
                  const nameParts = room.name.split('_');
                  return nameParts[0];
                })}
              value={rooms.findIndex(room => room._id === selectedRoomId)}
              onChange={(e) => {
                const index = e.detail.value
                setSelectedRoomId(rooms[index]._id)
              }}
            >
              <View className='picker'>
                {rooms.find(room => room._id === selectedRoomId) ? 
                  rooms.find(room => room._id === selectedRoomId)?.name.split('_')[0] : 
                  '请选择自习室'
                }
              </View>
            </Picker>
          </View>

          <View className='actions'>
            <Button className='add-button' onClick={() => handleOpenModal()}>添加座位</Button>
            <Button className='batch-add-button' onClick={handleBatchAddSeats}>批量添加</Button>
          </View>

          <ScrollView className='seats-list' scrollY>
            {seats.length > 0 ? (
              seats.map(seat => (
                <View key={seat._id} className='seat-item'>
                  <View className='seat-info'>
                    <Text className='seat-number'>座位号: {seat.seatNumber}</Text>
                    <Text className={`seat-status ${seat.status}`}>
                      状态: {statusOptions.find(opt => opt.value === seat.status)?.label || seat.status}
                    </Text>
                  </View>
                  <View className='seat-actions'>
                    <Button size='mini' className='delete-button' onClick={() => handleDelete(seat._id)}>删除</Button>
                  </View>
                </View>
              ))
            ) : (
              <View className='empty'>暂无座位信息</View>
            )}
          </ScrollView>

          {/* 模态框功能已通过Taro API实现 */}
        </>
      )}
    </View>
  )
}