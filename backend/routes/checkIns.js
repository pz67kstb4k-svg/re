const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  generateQRCode,
  checkIn,
  checkOut,
  getUserCheckIns,
  verifyQRCodeAndCheckIn
} = require('../controllers/checkIns');

const router = express.Router();

// 签退路由 - 现在JSON解析已在server.js中全局处理
router.route('/checkout/:checkInId').put(protect, checkOut);

// 其他路由
router.route('/:reservationId/qrcode').get(protect, generateQRCode);
router.route('/checkin').post(protect, checkIn);
router.route('/user').get(protect, getUserCheckIns);
router.route('/qrcode/verify-checkin').post(protect, verifyQRCodeAndCheckIn);

module.exports = router;