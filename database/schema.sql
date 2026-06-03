-- 论文管理系统数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件

-- 先删除已存在的表（如果需要重新创建）
DROP TABLE IF EXISTS final_submissions CASCADE;
DROP TABLE IF EXISTS midterm_reports CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS task_books CASCADE;
DROP TABLE IF EXISTS selection_audits CASCADE;
DROP TABLE IF EXISTS thesis_topics CASCADE;
DROP TABLE IF EXISTS academic_batches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  department VARCHAR(100),
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  avatar TEXT,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学术批次表
CREATE TABLE academic_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  timeline VARCHAR(100),
  student_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT '即将开始',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 论文题目表
CREATE TABLE thesis_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  abstract TEXT,
  category VARCHAR(100),
  occupied_slots INTEGER DEFAULT 0,
  total_slots INTEGER DEFAULT 3,
  advisor_name VARCHAR(100),
  advisor_title VARCHAR(50),
  advisor_dept VARCHAR(100),
  advisor_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 选题审核表
CREATE TABLE selection_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(100),
  topic_title VARCHAR(255),
  status VARCHAR(20) DEFAULT '待审核',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务书表
CREATE TABLE task_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name VARCHAR(100),
  topic_title VARCHAR(255),
  status VARCHAR(20) DEFAULT '待提交',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 开题报告表
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) NOT NULL,
  abstract_text TEXT,
  proposal_file JSONB,
  is_submitted BOOLEAN DEFAULT FALSE,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 中期报告表
CREATE TABLE midterm_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) NOT NULL,
  current_progress INTEGER DEFAULT 0,
  explanation TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  is_submitted BOOLEAN DEFAULT FALSE,
  last_saved TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 终稿提交表
CREATE TABLE final_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) NOT NULL,
  chinese_title VARCHAR(255),
  english_title VARCHAR(255),
  plagiarism_rate VARCHAR(20),
  plagiarism_institution VARCHAR(100),
  plagiarism_report JSONB,
  final_thesis_file JSONB,
  instructor_name VARCHAR(100),
  instructor_dept VARCHAR(100),
  instructor_avatar TEXT,
  status VARCHAR(20) DEFAULT '等待提交',
  deadline_countdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入初始用户数据
INSERT INTO users (user_id, name, email, department, role, avatar, password) VALUES
  ('STUD-2024081', '陈伟', 'chenwei_edu@university.cn', '计算机科学学院', 'student', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRVogLufdW1c6_GNQ-6vGfnCHhz6Of2v7k1If62Wn8DA27cu0SDpl4OMwgf24okyqvGMi53fEQy4zrk6Iqyp3gd_-WcaYXkah0ykCTagpgnS0e-IYypFRoD5NHSNhueMvfvi39iwAyfyMxwP43ILpestkPKELHPMYhdPp8VOotIz5rW5v_NJUyg6Mxoh13BvGIavEHgXVJ_gnaucnfVMrVgBG6Qvwmpwz20iMgZY8VR01YLwkwyRR3XDFLBmEDwvNQCwQJ6m07Lak', 'password123'),
  ('ACAD-9921-X', 'Dr. Julian Sterling', NULL, '计算机科学学院', 'teacher', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18', 'password123'),
  ('ADMIN-8820-T', '陈教授', NULL, '学术教务中心', 'admin', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCOPF3hYfTU3hNtLgnlrLrjOJ1YmC3nnxN8T4v6pDdCY6a5cl-h5-qSiFZGz8wHyHzSTEeSN6XJ_bfALM65PPdLnfieNWBnbJn2my3a7mrtweMaZajqi57J6SwxPPzv1mf65-x_RwIdjpK_V9weWEnyt24xGSjlxl7pkCl7l04Z4UZI5M3euoKBW_YYxsjyGxyVktoN-DXH6B6JhmO5R4QoAv9mTVO2dAK8YfvjLUQvoq0ZMScHkxF77cfHLKwMA4A51qBqSoktc', 'password123');

-- 插入初始学术批次
INSERT INTO academic_batches (name, timeline, student_count, status) VALUES
  ('2024 春季学期', '1月 15 - 5月 30', 142, '进行中'),
  ('2023 秋季学期', '8月 10 - 12月 20', 128, '已完成'),
  ('2024 夏季强化班', '6月 01 - 7月 15', 45, '即将开始'),
  ('2023 春季学期', '1月 12 - 5月 28', 156, '已存档');

-- 插入初始论文题目
INSERT INTO thesis_topics (title, abstract, category, occupied_slots, total_slots, advisor_name, advisor_title, advisor_dept, advisor_avatar) VALUES
  ('边缘设备的神经网络优化 research', '研究在资源受限的物联网传感器上部署深度学习模型的轻量级架构搜索方法 and 剪枝算法。', '人工智能与数据科学', 3, 3, 'Alistair Vance 博士', '教授', '信息学院', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGE0VDco0Mvlo0McJLMnnrNdx71l0ZAheVcz9pNHrlT9EBk4tGslYg9TjmP-MwIyuDEDrG8NQxpzvlOsEr248n85ZU72CdQs101qW8zAbC9c8t-ubvQzd_cdQ57GhbFnpVBmHMUlREvjPEsf3GQjCC0TWZcd3IiKbZd2f_a7SBL2ha9OfAMAd1GzCYbmoy-9Qqs0KY4p2TAnmXgDlqkGx0TigV6mC3qAFWSuE5nYOjBqhIh3Kq7Xkzr-djHm2LFSgzGZjX7pJ8KH8'),
  ('城市发展中的循环经济框架', '评估全球南方迅速扩张的大都市地区垃圾发电与资源再分配对城市规划和社区发展的影响。', '可持续发展', 1, 1, 'Elena Moretti 教授', '教授', '建筑系', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcl45KydeK0BXI4U8BjirUv71LfaTFWyfqCgcpdsfmXJMsS_QmvarL7mTeu43ZOKcVozauRio7DSggbFjYeCw0jCNdUeN3YbfHhpFcR70MwFpEFIwwCqIcypMM8knnoVG-g4RcA0r6KSpWfant8SKQ7U8LOmEkooXjvFNl9u_IZFO7y52U2wmccEzF5jfvl5Wg7J6rfhIvbRGVNx-w12HETMj0VYetvBgfbr0NY1RF0Jq8E-OgkYQ4ow9evUg_qVVAn_tFkVuKnjg'),
  ('远程学习环境中的认知负荷研究', '针对同步与异步数字教育平台间信息保留情况的比较研究，提出最优化界面缓解注意力不集中。', '心理学', 0, 5, 'Julian Thorne 博士', '副教授', '社会科学系', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18'),
  ('基于区块链技术的供应链透明度改进', '构建支持高流通、防篡改的区块底层追溯系统，优化跨企业共识开销，并在生鲜冷链中应用。', '工程与科技', 0, 3, 'Sarah Jenkins 博士', '副教授', '计算机学院', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCOPF3hYfTU3hNtLgnlrLrjOJ1YmC3nnxN8T4v6pDdCY6a5cl-h5-qSiFZGz8wHyHzSTEeSN6XJ_bfALM65PPdLnfieNWBnbJn2my3a7mrtweMaZajqi57J6SwxPPzv1mf65-x_RwIdjpK_V9weWEnyt24xGSjlxl7pkCl7l04Z4UZI5M3euoKBW_YYxsjyGxyVktoN-DXH6B6JhmO5R4QoAv9mTVO2dAK8YfvjLUQvoq0ZMScHkxF77cfHLKwMA4A51qBqSoktc');

-- 插入初始选题审核
INSERT INTO selection_audits (student_id, student_name, topic_title, status) VALUES
  ('2024081102', '李伟', '智慧农业中边缘设备的深度学习优化', '待审核'),
  ('2024081145', '张莎拉', '后量子加密算法的对比分析', '待审核'),
  ('2024081190', '徐凯文', '混合现实教育软件的用户界面范式', '待审核');

-- 插入初始任务书
INSERT INTO task_books (student_name, topic_title, status) VALUES
  ('陈伟', '供应链透明度中的区块链应用', '待提交'),
  ('Elena Rodriguez', '可再生能源预测模型', '任务已下达'),
  ('James Lee', '历史遗址中的增强现实技术', '需要处理'),
  ('Mina Tanaka', '社交机器人交互模式', '草稿已保存');

-- 创建索引
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_thesis_topics_category ON thesis_topics(category);
CREATE INDEX idx_selection_audits_student_id ON selection_audits(student_id);
CREATE INDEX idx_proposals_student_id ON proposals(student_id);
CREATE INDEX idx_midterm_reports_student_id ON midterm_reports(student_id);
CREATE INDEX idx_final_submissions_student_id ON final_submissions(student_id);
