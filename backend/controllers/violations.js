const Violation = require('../models/Violation');

// @desc    创建违规记录 (管理员)
// @route   POST /api/violations
// @access  Private/Admin
exports.createViolation = async (req, res) => {
  try {
    const { user, reservation, type, description, penalty, penaltyDuration } = req.body;

    // 验证输入
    if (!user || !reservation || !type) {
      return res.status(400).json({
        success: false,
        message: '用户、预约和违规类型不能为空'
      });
    }

    if (!['late_check_in', 'early_check_out', 'no_show', 'occupy_overtime', 'other'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的违规类型'
      });
    }

    const violation = await Violation.create({
      user,
      reservation,
      type,
      description: description?.trim(),
      penalty: penalty || 'none',
      penaltyDuration: penaltyDuration || 0
    });

    await violation.populate([
      { path: 'user', select: 'username studentId' },
      { path: 'reservation', populate: { path: 'room seat', select: 'name number' } }
    ]);

    res.status(201).json({
      success: true,
      data: violation,
      message: '违规记录创建成功'
    });
  } catch (err) {
    console.error('创建违规记录错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    获取用户违规记录
// @route   GET /api/violations/my
// @access  Private
exports.getUserViolations = async (req, res) => {
  try {
    const violations = await Violation.find({ user: req.user.id })
      .populate({
        path: 'reservation',
        populate: [
          { path: 'room', select: 'name' },
          { path: 'seat', select: 'number' }
        ]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: violations.length,
      data: violations
    });
  } catch (err) {
    console.error('获取用户违规记录错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    获取所有违规记录 (管理员)
// @route   GET /api/violations
// @access  Private/Admin
exports.getAllViolations = async (req, res) => {
  try {
    const { type, penalty, isResolved, page = 1, limit = 10 } = req.query;

    // 构建查询条件
    const query = {};
    if (type) query.type = type;
    if (penalty) query.penalty = penalty;
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';

    const violations = await Violation.find(query)
      .populate('user', 'username studentId email')
      .populate({
        path: 'reservation',
        populate: [
          { path: 'room', select: 'name' },
          { path: 'seat', select: 'number' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Violation.countDocuments(query);

    res.status(200).json({
      success: true,
      count: violations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: violations
    });
  } catch (err) {
    console.error('获取所有违规记录错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    更新违规记录 (管理员)
// @route   PUT /api/violations/:id
// @access  Private/Admin
exports.updateViolation = async (req, res) => {
  try {
    const { penalty, penaltyDuration, isResolved, description } = req.body;

    let violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: '未找到违规记录'
      });
    }

    // 更新字段
    if (penalty) violation.penalty = penalty;
    if (penaltyDuration !== undefined) violation.penaltyDuration = penaltyDuration;
    if (isResolved !== undefined) violation.isResolved = isResolved;
    if (description !== undefined) violation.description = description;

    await violation.save();

    await violation.populate([
      { path: 'user', select: 'username studentId' },
      { path: 'reservation', populate: { path: 'room seat', select: 'name number' } }
    ]);

    res.status(200).json({
      success: true,
      data: violation,
      message: '违规记录更新成功'
    });
  } catch (err) {
    console.error('更新违规记录错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    删除违规记录 (管理员)
// @route   DELETE /api/violations/:id
// @access  Private/Admin
exports.deleteViolation = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: '未找到违规记录'
      });
    }

    await violation.deleteOne();

    res.status(200).json({
      success: true,
      message: '违规记录删除成功'
    });
  } catch (err) {
    console.error('删除违规记录错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};