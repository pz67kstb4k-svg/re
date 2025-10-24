const express = require('express');
const {
  createViolation,
  getAllViolations,
  getUserViolations,
  updateViolation,
  deleteViolation
} = require('../controllers/violations');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');

// 用户路由
router.route('/my').get(protect, getUserViolations);

// 管理员路由
router.route('/')
  .post(protect, authorize('admin'), createViolation)
  .get(protect, authorize('admin'), getAllViolations);

router.route('/:id')
  .put(protect, authorize('admin'), updateViolation)
  .delete(protect, authorize('admin'), deleteViolation);

module.exports = router;