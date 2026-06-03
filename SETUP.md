# 论文管理系统 - 后端设置指南

## 概述

本项目已升级为前后端分离架构，使用 Supabase 作为数据库。

## 设置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册账号
2. 创建新项目
3. 记录项目的 URL 和 anon key

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填入 Supabase 配置：

```env
# Supabase Configuration
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Frontend Supabase (for client-side)
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

# API URL
VITE_API_URL="http://localhost:3001/api"
```

### 3. 初始化数据库

1. 在 Supabase Dashboard 中，进入 SQL Editor
2. 复制 `database/schema.sql` 的内容并执行
3. 这将创建所有必要的表和初始数据

### 4. 启动应用

#### 开发模式（同时启动前后端）：

```bash
npm run dev:all
```

#### 分别启动：

```bash
# 启动后端服务器 (端口 3001)
npm run dev:server

# 启动前端开发服务器 (端口 3000)
npm run dev
```

### 5. 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001/api

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 学生 | STUD-2024081 | password123 |
| 教师 | ACAD-9921-X | password123 |
| 管理员 | ADMIN-8820-T | password123 |

## API 端点

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/profile/:userId` - 获取用户信息
- `PUT /api/auth/profile/:userId` - 更新用户信息
- `PUT /api/auth/password/:userId` - 修改密码

### 题目管理
- `GET /api/topics` - 获取所有题目
- `POST /api/topics` - 创建题目
- `PUT /api/topics/:id` - 更新题目
- `DELETE /api/topics/:id` - 删除题目

### 选题审核
- `GET /api/audits` - 获取所有审核记录
- `POST /api/audits` - 创建审核记录
- `PUT /api/audits/:id` - 更新审核状态

### 任务书
- `GET /api/taskbooks` - 获取所有任务书
- `POST /api/taskbooks` - 创建任务书
- `PUT /api/taskbooks/:id` - 更新任务书状态

### 开题报告
- `GET /api/proposals/:studentId` - 获取开题报告
- `POST /api/proposals` - 提交开题报告

### 中期报告
- `GET /api/midterm/:studentId` - 获取中期报告
- `POST /api/midterm` - 提交中期报告
- `POST /api/midterm/:studentId/comments` - 添加评论

### 终稿提交
- `GET /api/final/:studentId` - 获取终稿
- `POST /api/final` - 提交终稿

## 数据库表结构

- `users` - 用户表
- `academic_batches` - 学术批次表
- `thesis_topics` - 论文题目表
- `selection_audits` - 选题审核表
- `task_books` - 任务书表
- `proposals` - 开题报告表
- `midterm_reports` - 中期报告表
- `final_submissions` - 终稿提交表

## 故障排除

### 后端无法启动
- 检查 `.env` 文件中的 Supabase 配置是否正确
- 确保端口 3001 未被占用

### 数据库连接失败
- 验证 Supabase URL 和 anon key
- 检查网络连接

### 前端无法调用 API
- 确保后端服务器正在运行
- 检查 CORS 配置
- 验证 `VITE_API_URL` 环境变量
