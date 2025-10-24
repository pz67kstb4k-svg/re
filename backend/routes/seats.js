const express = require('express');
const { getSeats, getSeat, createSeat, updateSeat, deleteSeat } = require('../controllers/seats');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .get(getSeats)
  .post(protect, authorize('admin'), createSeat);

router.route('/:id')
  .get(getSeat)
  .put(protect, authorize('admin'), updateSeat)
  .delete(protect, authorize('admin'), deleteSeat);

module.exports = router;