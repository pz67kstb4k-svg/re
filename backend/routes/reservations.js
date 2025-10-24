const express = require('express');
const { getReservations, getReservation, createReservation, updateReservation, cancelReservation } = require('../controllers/reservations');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

router.route('/')
  .get(getReservations)
  .post(createReservation);

router.route('/:id')
  .get(getReservation)
  .put(updateReservation)
  .delete(cancelReservation);

module.exports = router;