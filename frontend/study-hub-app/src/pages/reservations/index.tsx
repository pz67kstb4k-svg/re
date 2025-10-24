import { Button, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { reservationApi, checkInApi } from "../../services/api";
import "./index.scss";

// 定义预约数据类型接口
interface Room {
  name: string;
  location: string;
}

interface Seat {
  seatNumber?: string;
}

interface Reservation {
  _id: string;
  room: Room;
  seat?: Seat;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
    fetchReservations();
  }, []);

  // 每次页面显示时都重新获取数据
  useDidShow(() => {
    fetchReservations();
  });

  // 检查登录状态
  const checkLogin = () => {
    const token = Taro.getStorageSync("token");
    if (!token) {
      Taro.navigateTo({
        url: "/pages/login/index",
      });
    }
  };

  // 获取预约列表
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync("token");
      // 添加myOnly=true参数，确保只获取当前用户的预约，即使是管理员也只看自己的
      const res = await reservationApi.getUserReservations(token, { myOnly: 'true' });
      setReservations(res.data);
    } catch (error) {
      console.error("获取预约列表失败:", error);
      Taro.showToast({
        title: "获取预约列表失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  // 取消预约
  const handleCancel = async (id: string) => {
    try {
      const token = Taro.getStorageSync("token");
      await reservationApi.cancelReservation(id, token);

      Taro.showToast({
        title: "取消成功",
        icon: "success",
      });

      // 刷新列表
      fetchReservations();
    } catch (error: any) {
      Taro.showToast({
        title: error.message || "取消失败",
        icon: "none",
      });
    }
  };

  // 获取状态文本、颜色和类名
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { text: "待使用", color: "#1890ff", className: "status-primary" };
      case "confirmed": // 新增状态
        return { text: "已预约", color: "#faad14", className: "status-warning" };
      case "checked_in":
        return { text: "已签到", color: "#52c41a", className: "status-success" };
      case "completed":
        return { text: "已完成", color: "#8c8c8c", className: "status-secondary" };
      case "cancelled":
        return { text: "已取消", color: "#f5222d", className: "status-error" };
      default:
        return { text: "未知", color: "#8c8c8c", className: "status-secondary" };
    }
  };

  // 扫码签到
  const handleScanCodeCheckIn = async (reservationId: string) => {
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: true,
        scanType: ["qrCode"],
      });

      if (res.result) {
        const scannedReservationId = res.result; // 假设二维码内容就是 reservationId
        if (scannedReservationId === reservationId) {
          const token = Taro.getStorageSync("token");
          await reservationApi.checkIn(reservationId, token);
          Taro.showToast({
            title: "签到成功",
            icon: "success",
          });
          fetchReservations(); // 刷新列表
        } else {
          Taro.showToast({
            title: "二维码不匹配",
            icon: "none",
          });
        }
      }
    } catch (error: any) {
      console.error("扫码签到失败:", error);
      Taro.showToast({
        title: error.message || "扫码签到失败",
        icon: "none",
      });
    }
  };

  // 直接签到
  const handleDirectCheckIn = async (reservationId: string) => {
    try {
      Taro.showLoading({ title: '签到中...' });
      const token = Taro.getStorageSync("token");
      await reservationApi.checkIn(reservationId, token);
      Taro.showToast({
        title: "签到成功",
        icon: "success",
      });
      fetchReservations(); // 刷新列表
    } catch (error: any) {
      console.error("签到失败:", error);
      Taro.showToast({
        title: error.message || "签到失败",
        icon: "none",
      });
    } finally {
      Taro.hideLoading();
    }
  };

  // 使用完成（签退）
  const handleComplete = async (reservationId: string) => {
    try {
      Taro.showLoading({ title: '处理中...' });
      const token = Taro.getStorageSync("token");
      
      // 获取用户的签到记录，找到对应的checkInId
      const checkIns = await checkInApi.getUserCheckIns(token);
      const checkInRecord = checkIns.data.find(
        (record) => record.reservation && record.reservation._id === reservationId
      );
      
      if (!checkInRecord || !checkInRecord._id) {
        throw new Error('未找到对应的签到记录');
      }
      
      // 调用签退API
      await checkInApi.checkOut(checkInRecord._id, token);
      
      Taro.showToast({
        title: "使用完成",
        icon: "success",
      });
      
      fetchReservations(); // 刷新列表
    } catch (error: any) {
      console.error("使用完成失败:", error);
      Taro.showToast({
        title: error.message || "使用完成失败",
        icon: "none",
      });
    } finally {
      Taro.hideLoading();
    }
  };

  // 返回上一页
  const handleBack = () => {
    Taro.switchTab({
      url: "/pages/index/index",
    });
  };

  return (
    <View className="reservations-container">
      <View className="header">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">←</Text>
          <Text className="back-text">返回</Text>
        </View>
        <Text className="title">我的预约</Text>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : (
        <ScrollView scrollY className="reservation-list" style={{ height: 'calc(100vh - 100px)' }}>
          {reservations.length > 0 ? (
            reservations.map((reservation) => {
              const statusInfo = getStatusInfo(reservation.status);
              const now = new Date();
              const startTime = new Date(
                reservation.date + " " + reservation.startTime
              );
              const endTime = new Date(
                reservation.date + " " + reservation.endTime
              );

              return (
                <View key={reservation._id} className="reservation-card">
                  <View className="reservation-header">
                    <Text className="room-name">{reservation.room.name}</Text>
                    <Text
                      className={`status ${statusInfo.className}`}
                      style={{ color: statusInfo.color }}
                    >
                      {statusInfo.text}
                    </Text>
                  </View>

                  <View className="reservation-info">
                    <Text className="info-item">
                      座位号: {reservation.seat?.seatNumber || '未知座位'}
                    </Text>
                    <Text className="info-item">
                      日期: {reservation.date.split("T")[0]}
                    </Text>
                    <Text className="info-item">
                      时间: {reservation.startTime} - {reservation.endTime}
                    </Text>
                    <Text className="info-item">
                      地点: {reservation.room.location}
                    </Text>
                  </View>

                  {(reservation.status === "pending" || reservation.status === "confirmed") && (
                    <>
                      <Button
                        className="check-in-button"
                        onClick={() => handleDirectCheckIn(reservation._id)}
                      >
                        签到
                      </Button>
                      <Button
                        className="cancel-button"
                        onClick={() => handleCancel(reservation._id)}
                      >
                        取消预约
                      </Button>
                    </>
                  )}
                  
                  {reservation.status === "checked_in" && (
                    <Button
                      className="cancel-button"
                      onClick={() => handleComplete(reservation._id)}
                    >
                      使用完成
                    </Button>
                  )}
                </View>
              );
            })
          ) : (
            <View className="empty">
              <Text className="empty-text">暂无预约记录</Text>
              <Button
                className="create-button"
                onClick={() => {
                  Taro.switchTab({
                    url: "/pages/rooms/index",
                  });
                }}
              >
                去预约
              </Button>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
