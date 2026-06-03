# Vercel 部署指南

## 1. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```
SUPABASE_URL=https://fmyqovqjictnfvdjptww.supabase.co
SUPABASE_ANON_KEY=sb_publishable_S4iJeuPHU4b7aEVBmPaKMw_GtpihGx0
```

## 2. 部署步骤

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量（见上方）
4. 部署

## 3. 常见问题

### 登录失败
- 确保环境变量已正确配置
- 检查 Supabase 表是否已创建（users, topics, audits, taskbooks, proposals, midterms, finals, batches）

### API 404 错误
- 确保 vercel.json 配置正确
- 检查 api/index.js 是否导出正确的 Express 应用

## 4. 数据库表结构

需要在 Supabase 中创建以下表：

```sql
-- 用户表
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  department TEXT,
  role TEXT DEFAULT 'student',
  password TEXT,
  avatar TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 课题表
CREATE TABLE topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT,
  category TEXT,
  occupied_slots INTEGER DEFAULT 0,
  total_slots INTEGER DEFAULT 3,
  advisor_name TEXT,
  advisor_title TEXT,
  advisor_dept TEXT,
  advisor_avatar TEXT
);

-- 审核表
CREATE TABLE audits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id TEXT,
  student_name TEXT,
  topic_title TEXT,
  status TEXT DEFAULT '待审核',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务书表
CREATE TABLE taskbooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_name TEXT,
  topic_title TEXT,
  status TEXT DEFAULT '待提交'
);

-- 开题报告表
CREATE TABLE proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id TEXT UNIQUE,
  abstract_text TEXT,
  proposal_file JSONB,
  history JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  is_submitted BOOLEAN DEFAULT FALSE
);

-- 中期报告表
CREATE TABLE midterms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id TEXT UNIQUE,
  current_progress INTEGER DEFAULT 0,
  explanation TEXT,
  attachments JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  is_submitted BOOLEAN DEFAULT FALSE,
  last_saved TIMESTAMP WITH TIME ZONE
);

-- 终稿表
CREATE TABLE finals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id TEXT UNIQUE,
  chinese_title TEXT,
  english_title TEXT,
  plagiarism_rate TEXT DEFAULT '0',
  plagiarism_institution TEXT DEFAULT '中国知网 (CNKI)',
  plagiarism_report JSONB,
  final_thesis_file JSONB,
  instructor_name TEXT,
  instructor_dept TEXT,
  instructor_avatar TEXT,
  comments JSONB DEFAULT '[]',
  status TEXT DEFAULT '等待提交'
);

-- 批次表
CREATE TABLE batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  timeline TEXT,
  student_count INTEGER DEFAULT 0,
  status TEXT DEFAULT '进行中'
);
```
