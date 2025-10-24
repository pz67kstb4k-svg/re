const express = require('express');
const { getMyStudyStatistics, getSystemStatistics } = require('../controllers/statistics');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');

// 用户统计
router.route('/my').get(protect, getMyStudyStatistics);

// 系统统计 (管理员)
router.route('/system').get(protect, authorize('admin'), getSystemStatistics);

module.exports = router;