# 管理端API文档

## 登录认证

### 管理员登录
- **接口**: POST /api/users/login
- **参数**:
  - studentId: admin (管理员账号)
  - password: admin123 (初始密码)
- **返回**: 包含token和用户信息的JSON对象，其中role字段为'admin'

## 自习室管理

### 获取所有自习室
- **接口**: GET /api/rooms
- **权限**: 公开
- **返回**: 所有自习室列表，包含每个自习室的基本信息和座位统计

### 添加自习室
- **接口**: POST /api/rooms
- **权限**: 管理员
- **参数**:
  - name: 自习室名称
  - location: 位置
  - capacity: 容量
  - description: 描述(可选)
- **返回**: 创建的自习室信息

### 更新自习室
- **接口**: PUT /api/rooms/:id
- **权限**: 管理员
- **参数**: 同上(部分字段可选)
- **返回**: 更新后的自习室信息

### 删除自习室
- **接口**: DELETE /api/rooms/:id
- **权限**: 管理员
- **返回**: 删除成功消息

## 座位管理

### 获取座位列表
- **接口**: GET /api/seats?room=房间ID
- **权限**: 公开
- **参数**:
  - room: 房间ID(可选，不提供则返回所有座位)
- **返回**: 座位列表，包含座位状态信息

### 为自习室添加座位
- **接口**: POST /api/seats
- **权限**: 管理员
- **参数**:
  - room: 房间ID
  - seatNumber: 座位号
  - type: 座位类型(普通/VIP等)
  - status: 座位状态(默认available)
- **返回**: 创建的座位信息

### 修改座位状态
- **接口**: PUT /api/seats/:id
- **权限**: 管理员
- **参数**:
  - status: 新状态(available/occupied/reserved/maintenance)
- **返回**: 更新后的座位信息

### 删除座位
- **接口**: DELETE /api/seats/:id
- **权限**: 管理员
- **返回**: 删除成功消息

## 预约管理

### 查看所有预约记录
- **接口**: GET /api/reservations
- **权限**: 管理员
- **返回**: 所有用户的预约记录，包含用户信息、座位信息和房间信息

### 查看单个预约详情
- **接口**: GET /api/reservations/:id
- **权限**: 管理员
- **返回**: 指定预约的详细信息

## 反馈处理

### 查看所有反馈
- **接口**: GET /api/feedbacks?status=pending&page=1&limit=10
- **权限**: 管理员
- **参数**:
  - status: 筛选状态(pending/in_progress/resolved/rejected)
  - type: 筛选类型
  - page: 页码
  - limit: 每页数量
- **返回**: 反馈列表，包含分页信息

### 回复反馈和更新状态
- **接口**: PUT /api/feedbacks/:id
- **权限**: 管理员
- **参数**:
  - status: 新状态
  - response: 回复内容
- **返回**: 更新后的反馈信息

### 删除反馈
- **接口**: DELETE /api/feedbacks/:id
- **权限**: 管理员
- **返回**: 删除成功消息

## 用户管理

### 查看所有用户
- **接口**: GET /api/users
- **权限**: 管理员
- **返回**: 所有用户列表

### 添加用户
- **接口**: POST /api/users
- **权限**: 管理员
- **参数**:
  - name: 姓名
  - studentId: 学号
  - password: 密码
  - phone: 手机号
  - role: 角色(user/admin)
- **返回**: 创建的用户信息

### 更新用户信息
- **接口**: PUT /api/users/:id
- **权限**: 管理员
- **参数**: 同上(部分字段可选)
- **返回**: 更新后的用户信息

## 使用说明

1. 管理员需要先使用admin账号登录系统获取token
2. 所有管理功能API需要在请求头中添加Authorization: Bearer {token}
3. 系统会自动验证用户角色权限，非管理员用户无法访问管理功能

## 管理员账号信息

- **默认账号**: admin
- **默认密码**: admin123
- **首次登录后建议修改密码**