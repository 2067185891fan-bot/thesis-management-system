# 论文管理系统 — 学术流程全面错误分析与修复计划

## 问题总览

经过全面代码扫描，发现以下关键 Bug，按严重程度排列：

---

## 🔴 严重Bug（导致功能完全不可用）

### Bug 1：TeacherView 的 prop 类型不匹配（TypeScript 类型错误）

**文件**: `TeacherView.tsx` L35-39 vs `App.tsx` L461-465

**问题描述**:
- `TeacherView` 的 props 类型声明期望 `onUpdateProposal`、`onUpdateMidterm`、`onUpdateFinal` 为 `React.Dispatch<React.SetStateAction<T>>`（即 setState 函数）
- 但 `App.tsx` 传入的是从 `useApi` hooks 返回的 `updateProposal`、`updateMidterm`、`updateFinal`，这些是**异步 API 调用函数**（参数为 partial updates 对象），签名完全不同
- 导致 TeacherView 内部的 `onUpdateMidterm(prev => ({...}))` 函数式更新写法在运行时**完全无法工作**，传入回调函数给 API 调用函数

**修复**: 修改 `TeacherView.tsx` 的 props 类型，改为与 `useApi.js` 匹配的回调签名。

---

### Bug 2：选题审核创建时重复审核检查逻辑缺陷

**文件**: `server/routes/audits.js` L60-69

**问题描述**:
- 检查是否已有"待审核"状态的审核记录，但没有检查"已通过"状态的记录
- 学生完成一次选题被通过后，可以再次选题并创建新的"待审核"记录，导致一个学生拥有多个有效审核记录
- 正确逻辑应检查：status NOT IN ('已驳回')

**修复**: 改为检查任何非"已驳回"状态的记录。

---

### Bug 3：`last_saved` 数据库字段类型错误

**文件**: `database/schema.sql` L92

**问题描述**:
- `midterm_reports` 表中 `last_saved` 字段类型为 `TIME`（仅存储时间，无日期）
- 代码中存入的是字符串格式 `"HH:MM:SS"`，但 `TIME` 类型在某些操作中可能引起查询问题
- 更合理的类型是 `VARCHAR(20)` 或 `TEXT`，因为代码中该字段仅用于显示

**修复**: Schema 中将 `last_saved` 类型改为 `TEXT`

---

## 🟠 中等Bug（功能部分失效）

### Bug 4：useAudits hook 中 `execute` 依赖项多余

**文件**: `src/hooks/useApi.js` L216

**问题描述**:
- `fetchAudits` 的 `useCallback` 依赖项包含 `execute`，但 `execute` 本身也是 `useCallback`，不会变化
- 更严重的问题是：`fetchAudits` 直接用 `fetch` 而不是 `execute`，但还在依赖中列出了 `execute`——这是不一致的，会造成 ESLint 警告和潜在的闭包问题

**修复**: 从 `fetchAudits` 的依赖中移除 `execute`。

---

### Bug 5：教师审核开题报告时调用了错误的 API 端点

**文件**: `src/components/TeacherView.tsx` L123

**问题描述**:
- 教师调用 `PUT /api/proposals/${selectedStudentId}` 来更新开题报告审核结果
- 但 `proposals.js` 的 `PUT /:id` 路由参数是 `id`（数据库记录的 UUID），而非 `student_id`
- 用 `studentId` 调用这个路由会导致：Supabase 找不到 `id = studentId` 的记录，更新失败

**修复**: 改为调用 `POST /api/proposals`（createOrUpdate 端点），传入 studentId。

---

### Bug 6：教师查看终稿调用了错误的 HTTP 方法

**文件**: `src/components/TeacherView.tsx` L243-246

**问题描述**:
- 教师对终稿进行审批时，调用 `PUT /api/final/${selectedStudentId}` 
- 同样问题：`final.js` 的 `PUT /:id` 使用的是 UUID id，而非 student_id
- 应该改为 `POST /api/final` 并传入 `studentId` 和 `status`

**修复**: 调用 `POST /api/final` 来正确更新状态。

---

### Bug 7：学生密码修改未调用真实 API

**文件**: `src/components/StudentView.tsx` L177-213

**问题描述**:
- 学生修改密码的逻辑完全只操作 `localStorage`（`thesis_app_registered_users`），没有调用 `/api/auth/password/:userId` 接口
- 意味着修改的密码不会保存到数据库，重新加载后密码不变

**修复**: 改为调用后端密码修改 API。

---

### Bug 8：App.tsx 中同步选题状态逻辑有死循环风险

**文件**: `src/App.tsx` L109-174

**问题描述**:
- `syncSelectionStatus` effect 依赖 `[user, topics, role]`，当 topics 变化时会触发
- effect 内部调用 `setMySelection`，但 `mySelection` 不在依赖中（通过 eslint-disable 跳过），当 `mySelection` 已经是正确状态时，`if (!mySelection || ...)` 判断并不可靠，可能因对象引用变化导致无限更新

**修复**: 添加更严格的对比逻辑避免无效 setState。

---

## 🟡 轻微Bug / 代码质量问题

### Bug 9：`useTaskBooks` hook 的 `execute` 依赖项冗余

**文件**: `src/hooks/useApi.js` L276

**问题描述**: `fetchTaskBooks` 的 `useCallback` 依赖包含 `execute`，但 `fetchTaskBooks` 内部直接用 `fetch` 而非 `execute`，`execute` 应从依赖中移除。

---

### Bug 10：`data.ts` 中的 AVATARS 引用

**文件**: `src/data.ts`

**问题描述**: 需要确认 AVATARS 和 INITIAL_STUDENT_PROFILE 等导出是否存在，StudentView 和其他组件都引用了这些值。

---

## 修复文件列表

| 文件 | 修改类型 | Bug编号 |
|------|---------|---------|
| `server/routes/audits.js` | 修复重复选题检查逻辑 | #2 |
| `database/schema.sql` | 修复 last_saved 字段类型 | #3 |
| `src/hooks/useApi.js` | 移除冗余 execute 依赖 | #4, #9 |
| `src/components/TeacherView.tsx` | 修复 prop 类型 + API 端点调用 | #1, #5, #6 |
| `src/components/StudentView.tsx` | 密码修改调用真实API | #7 |
| `src/App.tsx` | 修复 syncSelectionStatus 无效更新 | #8 |

## 验证计划

1. 启动服务器 `npm run server` 和前端 `npm run dev`
2. 学生登录 → 选题 → 验证 toast 提示正确
3. 教师登录 → 审核选题 → 验证任务书自动创建
4. 教师审核开题报告 → 验证 API 调用成功
5. 教师审核中期/终稿 → 验证状态更新
6. 学生修改密码 → 重新登录验证密码已更新
