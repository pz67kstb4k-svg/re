const express = require('express');
const {
  submitFeedback,
  getAllFeedbacks,
  getUserFeedbacks,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedbacks');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');

// 用户路由
router.route('/').post(protect, submitFeedback);
router.route('/my').get(protect, getUserFeedbacks);

// 管理员路由
router.route('/').get(protect, authorize('admin'), getAllFeedbacks);
router.route('/:id')
  .put(protect, authorize('admin'), updateFeedback)
  .delete(protect, authorize('admin'), deleteFeedback);

module.exports = router;