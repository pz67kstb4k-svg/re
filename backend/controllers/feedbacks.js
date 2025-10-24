const Feedback = require('../models/Feedback');

// @desc    提交反馈
// @route   POST /api/feedbacks
// @access  Private
exports.submitFeedback = async (req, res) => {
  try {
    const { type, content } = req.body;

    // 验证输入
    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: '反馈类型和内容不能为空'
      });
    }

    if (!['environment', 'equipment', 'suggestion', 'other'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的反馈类型'
      });
    }

    const feedback = await Feedback.create({
      user: req.user.id,
      type,
      content: content.trim(),
    });

    res.status(201).json({
      success: true,
      data: feedback,
      message: '反馈提交成功'
    });
  } catch (err) {
    console.error('提交反馈错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    获取用户反馈
// @route   GET /api/feedbacks/my
// @access  Private
exports.getUserFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (err) {
    console.error('获取用户反馈错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    获取所有反馈 (管理员)
// @route   GET /api/feedbacks
// @access  Private/Admin
exports.getAllFeedbacks = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    // 构建查询条件
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const feedbacks = await Feedback.find(query)
      .populate('user', 'username studentId email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: feedbacks
    });
  } catch (err) {
    console.error('获取所有反馈错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    更新反馈状态或回复 (管理员)
// @route   PUT /api/feedbacks/:id
// @access  Private/Admin
exports.updateFeedback = async (req, res) => {
  try {
    const { status, response } = req.body;

    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '未找到反馈'
      });
    }

    // 详细记录请求体数据
    console.log('===== 更新反馈请求开始 =====');
    console.log('请求ID:', req.params.id);
    console.log('请求体完整数据:', req.body);
    console.log('status值:', status, '类型:', typeof status);
    console.log('response值:', response, '类型:', typeof response);
    console.log('更新前feedback对象:', feedback);
    
    // 重点处理status字段 - 加强状态处理逻辑
    if (status !== undefined) {
      console.log('开始处理status字段...');
      // 验证状态值是否有效
      const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
      if (validStatuses.includes(status)) {
        console.log('更新status为:', status);
        feedback.status = status;
        // 显式标记字段已修改
        feedback.markModified('status');
        console.log('已标记status字段为修改状态');
      } else {
        console.warn('收到无效的status值:', status, '，已忽略');
      }
    }
    
    // 重点处理response字段 - 添加多种安全检查
    if (response !== undefined) {
      console.log('开始处理response字段...');
      // 先记录原始值和类型
      console.log('原始response:', response, '类型:', typeof response);
      
      // 安全赋值逻辑
      if (response === null) {
        feedback.response = null;
        console.log('设置response为null');
      } else if (typeof response === 'string') {
        feedback.response = response.trim();
        console.log('设置response为trim后的字符串:', feedback.response);
      } else {
        // 转换为字符串再处理
        feedback.response = String(response).trim();
        console.log('转换为字符串并trim后:', feedback.response);
      }
      
      // 显式标记字段已修改（Mongoose有时需要）
      feedback.markModified('response');
      console.log('已标记response字段为修改状态');
    }
    
    console.log('更新后feedback对象:', feedback);
    console.log('Mongoose isModified状态:', feedback.isModified('response'));
    
    // 保存并获取更新后的文档
    console.log('准备保存到数据库...');
    const updatedFeedback = await feedback.save();
    console.log('保存成功！数据库返回:', updatedFeedback);
    console.log('保存后response值:', updatedFeedback.response);
    console.log('===== 更新反馈请求结束 =====');

    res.status(200).json({
      success: true,
      data: updatedFeedback,
      message: '反馈更新成功'
    });
  } catch (err) {
    console.error('更新反馈错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};

// @desc    删除反馈 (管理员)
// @route   DELETE /api/feedbacks/:id
// @access  Private/Admin
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '未找到反馈'
      });
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      message: '反馈删除成功'
    });
  } catch (err) {
    console.error('删除反馈错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: err.message
    });
  }
};