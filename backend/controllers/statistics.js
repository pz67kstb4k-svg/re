const Reservation = require('../models/Reservation');
const Violation = require('../models/Violation');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// @desc    获取用户学习统计
// @route   GET /api/statistics/my
// @access  Private
exports.getMyStudyStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 从用户信息中获取基础学习统计数据
    const user = await User.findById(userId);
    
    // 获取用户所有已完成的预约记录（用于其他统计信息）
    const reservations = await Reservation.find({
      user: userId,
      status: 'completed'
    }).populate('room', 'name').populate('seat', 'number');

    // 总学习时长从用户信息中获取
    let totalStudyDuration = user.studyHours || 0;
    
    const dailyStudyDuration = {}; // 每日学习时长
    const roomUsage = {}; // 自习室使用统计
    const monthlyStats = {}; // 月度统计

    // 仍然需要处理详细的统计数据
    reservations.forEach(reservation => {
      // 这里仍然可以保留原有的详细统计逻辑
      // 但总学习时长已经从用户信息中获取
      if (reservation.actualStartTime && reservation.actualEndTime) {
        const durationMs = reservation.actualEndTime.getTime() - reservation.actualStartTime.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));

        // 统计每日学习时长
        const date = reservation.date;
        dailyStudyDuration[date] = (dailyStudyDuration[date] || 0) + durationMinutes;

        // 统计自习室使用情况
        const roomName = reservation.room?.name || '未知自习室';
        roomUsage[roomName] = (roomUsage[roomName] || 0) + durationMinutes;

        // 统计月度数据
        const month = new Date(reservation.date).toISOString().slice(0, 7); // YYYY-MM
        monthlyStats[month] = (monthlyStats[month] || 0) + durationMinutes;
      }
    });

    // 计算平均学习时长
    const studyDays = user.studyDays || 0;
    const averageDailyDuration = studyDays > 0 ? Math.round(totalStudyDuration / studyDays) : 0;

    // 最长单日学习时长
    const dailyDurations = Object.values(dailyStudyDuration);
    const maxDailyDuration = dailyDurations.length > 0 ? Math.max(...dailyDurations) : 0;

    // 本月学习统计
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthDuration = monthlyStats[currentMonth] || 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudyDuration,
        dailyStudyDuration,
        roomUsage,
        totalSessions: reservations.length,
        studyDays,
        averageDailyDuration,
        maxDailyDuration,
        currentMonthDuration,
        monthlyStats
      },
    });
  } catch (err) {
    console.error('获取用户统计错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    获取系统统计 (管理员)
// @route   GET /api/statistics/system
// @access  Private/Admin
exports.getSystemStatistics = async (req, res) => {
  try {
    // 基础统计
    const totalUsers = await User.countDocuments();
    const totalReservations = await Reservation.countDocuments();
    const completedReservations = await Reservation.countDocuments({ status: 'completed' });
    const cancelledReservations = await Reservation.countDocuments({ status: 'cancelled' });
    const totalViolations = await Violation.countDocuments();
    const totalFeedbacks = await Feedback.countDocuments();

    // 今日统计
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = await Reservation.countDocuments({ date: today });
    const todayCompletedReservations = await Reservation.countDocuments({
      date: today,
      status: 'completed'
    });

    // 本月统计
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 1);

    const monthlyReservations = await Reservation.countDocuments({
      createdAt: { $gte: monthStart, $lt: monthEnd }
    });

    const monthlyCompletedReservations = await Reservation.countDocuments({
      createdAt: { $gte: monthStart, $lt: monthEnd },
      status: 'completed'
    });

    // 最近7天的预约趋势
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayReservations = await Reservation.countDocuments({ date: dateStr });
      last7Days.push({
        date: dateStr,
        reservations: dayReservations
      });
    }

    // 违规统计
    const violationStats = await Violation.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // 反馈统计
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 计算完成率
    const completionRate = totalReservations > 0 ?
      ((completedReservations / totalReservations) * 100).toFixed(2) : 0;

    const todayCompletionRate = todayReservations > 0 ?
      ((todayCompletedReservations / todayReservations) * 100).toFixed(2) : 0;

    const monthlyCompletionRate = monthlyReservations > 0 ?
      ((monthlyCompletedReservations / monthlyReservations) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        // 基础统计
        totalUsers,
        totalReservations,
        completedReservations,
        cancelledReservations,
        totalViolations,
        totalFeedbacks,
        completionRate,

        // 今日统计
        todayReservations,
        todayCompletedReservations,
        todayCompletionRate,

        // 本月统计
        monthlyReservations,
        monthlyCompletedReservations,
        monthlyCompletionRate,

        // 趋势数据
        last7Days,
        violationStats,
        feedbackStats
      }
    });
  } catch (err) {
    console.error('获取系统统计错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};