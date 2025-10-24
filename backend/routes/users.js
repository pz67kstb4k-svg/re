const express = require('express');
const { register, login, getMe, updateDetails, getUsers, getUserById, updateUser, createUser, deleteUser } = require('../controllers/users');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 受保护的路由
router.get('/me', protect, getMe);
router.put('/me', protect, updateDetails);

// 管理员路由
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.post('/', protect, authorize('admin'), createUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;