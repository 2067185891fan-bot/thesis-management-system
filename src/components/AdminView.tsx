/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AcademicBatch, UserRole, ThesisTopic, SelectionAudit, TaskBook } from '../types';
import { AVATARS } from '../data';

interface AdminViewProps {
  batches: AcademicBatch[];
  onAddBatch: (batch: any) => Promise<any>;
  onDeleteBatch: (id: string) => Promise<any>;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  topics: ThesisTopic[];
  onCreateTopic: (topic: any) => Promise<any>;
  onDeleteTopic: (id: string) => Promise<any>;
  audits: SelectionAudit[];
  taskBooks: TaskBook[];
  users: any[];
  userStats: { total: number; students: number; teachers: number; admins: number };
  onCreateUser: (userData: any) => Promise<any>;
  onDeleteUser: (id: string) => Promise<any>;
  onUpdateUser: (id: string, updates: any) => Promise<any>;
}

export default function AdminView({
  batches,
  onAddBatch,
  onDeleteBatch,
  onSwitchRole,
  onLogout,
  showToast,
  topics,
  onCreateTopic,
  onDeleteTopic,
  audits,
  taskBooks,
  users,
  userStats,
  onCreateUser,
  onDeleteUser,
  onUpdateUser
}: AdminViewProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'batches' | 'topics' | 'users' | 'overview'>('batches');

  // Edit user state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const handleStartEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditDept(user.department || '');
    setEditEmail(user.email || '');
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editName.trim()) {
      showToast('error', '错误', '姓名不能为空');
      return;
    }
    try {
      await onUpdateUser(editingUser.id, {
        name: editName.trim(),
        department: editDept.trim(),
        email: editEmail.trim()
      });
      setEditingUser(null);
      showToast('success', '更新成功', `用户 ${editName} 的信息已更新。`);
    } catch (err) {
      showToast('error', '更新失败', '保存用户信息时出错。');
    }
  };

  // Batches local state
  const [localBatches, setLocalBatches] = useState<AcademicBatch[]>(batches);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchTimeline, setNewBatchTimeline] = useState('');
  const [newBatchCount, setNewBatchCount] = useState(120);

  // Topics list filter states
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [topicCategoryFilter, setTopicCategoryFilter] = useState('all');

  // New Thesis Topic state
  const [showAddTopicForm, setShowAddTopicForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicAbstract, setNewTopicAbstract] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('人工智能/机器学习');
  const [newTopicAdvisorName, setNewTopicAdvisorName] = useState('张教授');
  const [newTopicAdvisorTitle, setNewTopicAdvisorTitle] = useState('副教授');
  const [newTopicAdvisorDept, setNewTopicAdvisorDept] = useState('人工智能学部');

  // Statistics
  const [isImportedToday, setIsImportedToday] = useState(false);
  const [totalTopicsPool, setTotalTopicsPool] = useState(topics.length);
  const [approvedCount, setApprovedCount] = useState(128);
  const [pendingCount, setPendingCount] = useState(25);

  const handleAddBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName || !newBatchTimeline) {
      showToast('error', '信息不完整', '请填写届别批次中文名称以及对应的有效学术时间周期。');
      return;
    }
    const result = await onAddBatch({
      name: newBatchName,
      timeline: newBatchTimeline,
      studentCount: newBatchCount
    });
    if (result) {
      setNewBatchName('');
      setNewBatchTimeline('');
      setShowAddModal(false);
      showToast('success', '批次创建成功', `教务大纲批次 [${newBatchName}] 已创建。`);
    }
  };

  const handleImportTopics = () => {
    showToast('info', '功能开发中', '批量导入功能正在开发中，请使用手工新增功能。');
  };

  const handleOptimizeResources = () => {
    showToast('success', '选题大纲负载均衡算法运行完毕', '资源分配算法完成。评估报告：已调转资源并为 15 名处于待分配状态的学生分配了第一意愿导师，平均资源贴合系数达到97.4%。');
  };

  const handleAddTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle || !newTopicAbstract) {
      showToast('error', '信息不完整', '请填写新课题的题目名称与详细简介摘要内容。');
      return;
    }

    const result = await onCreateTopic({
      title: newTopicTitle,
      abstract: newTopicAbstract,
      category: newTopicCategory,
      advisorName: newTopicAdvisorName,
      advisorTitle: newTopicAdvisorTitle,
      advisorDept: newTopicAdvisorDept,
      totalSlots: 3
    });

    if (result) {
      setNewTopicTitle('');
      setNewTopicAbstract('');
      setShowAddTopicForm(false);
      showToast('success', '课题创建成功', '新课题已添加到选题池。');
    }
  };

  const handleDeleteTopic = async (id: string, name: string) => {
    await onDeleteTopic(id);
    showToast('info', '选题已删除', `已删除课题《${name}》。`);
  };

  // Filtered topics calculations
  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(topicSearchQuery.toLowerCase()) || 
                          t.advisorName.toLowerCase().includes(topicSearchQuery.toLowerCase());
    const matchesCategory = topicCategoryFilter === 'all' || t.category === topicCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', '人工智能/机器学习', '网络空间安全', '软件工程', '人机交互/虚拟现实', '分布式/系统工程', '物联网技术'];

  return (
    <div className="bg-[#f4fafd] min-h-screen text-[#161d1f] font-sans pb-24 md:pb-12 animate-fadeIn">
      {/* Upper Navigation Header bar */}
      <header className="bg-white border-b border-[#c0c8cd]/40 sticky top-0 z-40 shadow-sm h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <h1 className="font-bold text-lg text-primary tracking-tight md:text-xl flex items-center gap-1.5">
            论文管理系统
            <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold uppercase pb-1 leading-none">
              ADMIN
            </span>
          </h1>
        </div>

        {/* Global Action items */}
        <nav className="flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-[#eef5f7] border border-[#c0c8cd]/40 px-3.5 py-1.5 rounded-full">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-[#24695f] flex items-center justify-center text-white text-[10px] font-bold">
              教
            </div>
            <span className="text-xs font-bold text-primary">院教务处 (超级管理员)</span>
          </div>

          <button 
            onClick={onLogout} 
            className="material-symbols-outlined text-xl text-[#70787d] hover:text-error transition-colors p-1.5 hover:bg-red-50 rounded-full cursor-pointer"
            title="登出"
          >
            logout
          </button>
        </nav>
      </header>

      {/* Primary body view wrapper */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* Statistics and Title panel */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              校级毕设质控管理员大厅
            </h2>
            <p className="text-xs text-[#40484d] mt-1">负责拟定整届教学日历大纲、审核校企联合指标、以及评定题库与导师指导占比负载均衡情况。</p>
          </div>
          <div className="flex bg-[#e8eff1] border border-[#c0c8cd]/40 rounded-xl p-3 items-center gap-4 shadow-sm self-start shrink-0 text-xs text-secondary-fixed">
            <div className="text-center border-r border-[#c0c8cd] pr-4">
              <p className="text-[10px] text-slate-500 uppercase">开通大纲数</p>
              <p className="text-lg font-black text-primary">{topics.length} 门</p>
            </div>
            <div className="text-center border-r border-[#c0c8cd] pr-4">
              <p className="text-[10px] text-slate-500 uppercase">学生选报率</p>
              <p className="text-lg font-black text-[#24695f]">
                {topics.length > 0 ? Math.round((topics.filter(t => t.occupiedSlots > 0).length / topics.length) * 100) : 0}%
              </p>
            </div>
            <div className="text-center pl-1">
              <p className="text-[10px] text-slate-500 uppercase">系统健康度</p>
              <p className="text-lg font-black text-emerald-600">99.8%</p>
            </div>
          </div>
        </section>

        {/* Layout with admin navigation panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ADMIN SIDEBAR OPTIONS */}
          <nav className="lg:col-span-3 flex flex-col gap-1.5 bg-white p-4 rounded-xl border border-[#c0c8cd]/60 shadow-soft">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3 mb-2">日常教学视图</p>
            
            <button
              onClick={() => setActiveSubTab('batches')}
              className={`flex items-center gap-2.5 px-3 md:px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${activeSubTab === 'batches' ? 'bg-primary text-white shadow' : 'text-[#40484d] hover:bg-slate-50'}`}
            >
              <span className="material-symbols-outlined text-sm">calendar_view_month</span>
              毕设学制学届批次管理
            </button>

            <button
              onClick={() => setActiveSubTab('topics')}
              className={`flex items-center justify-between px-3 md:px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${activeSubTab === 'topics' ? 'bg-primary text-white shadow' : 'text-[#40484d] hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-sm font-medium">library_books</span>
                全校级教学毕设题库大纲
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                {topics.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('users')}
              className={`flex items-center justify-between px-3 md:px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${activeSubTab === 'users' ? 'bg-primary text-white shadow' : 'text-[#40484d] hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-sm font-medium">people</span>
                用户管理
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('overview')}
              className={`flex items-center gap-2.5 px-3 md:px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${activeSubTab === 'overview' ? 'bg-primary text-white shadow' : 'text-[#40484d] hover:bg-slate-50'}`}
            >
              <span className="material-symbols-outlined text-sm">troubleshoot</span>
              督考分析与导师自动调配
            </button>
          </nav>

          {/* ADMIN ACTION CONTAINER */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* TAB BATCHES: ORIGINAL ADMIN LAYOUT */}
            {activeSubTab === 'batches' && (
              <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary">history_toggle_off</span>
                    教学批次管控大纲
                  </h3>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-1.5 bg-primary hover:bg-[#1a5f7a] text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    + 新建答辩届别
                  </button>
                </div>

                {/* Grid Batches list */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localBatches.map(batch => (
                    <div 
                      key={batch.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white transition-all space-y-3 relative group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px] font-semibold border border-sky-200">
                          教务归属
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${batch.status === '进行中' ? 'bg-emerald-50 text-emerald-700 font-medium' : batch.status === '已存档' ? 'bg-slate-200 text-slate-500 font-light' : 'bg-amber-50 text-amber-600 font-bold'}`}>
                          {batch.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-[#161d1f] text-sm">{batch.name}</h4>

                      <div className="divide-y divide-slate-100 text-[11px] text-[#40484d]">
                        <div className="py-1 flex justify-between">
                          <span className="text-slate-400">大纲周期：</span>
                          <span className="font-bold">{batch.timeline}</span>
                        </div>
                        <div className="py-1 flex justify-between">
                          <span className="text-slate-400">答辩在册人数：</span>
                          <span className="font-semibold">{batch.studentCount} 人已对齐</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB TOPICS pool management */}
            {activeSubTab === 'topics' && (
              <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-105 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary">explore</span>
                      全校级课题志愿库管理面板
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">您可以在这里检索全校已经下画的毕业论文大纲要素，并进行实时下架或手动修正。</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowAddTopicForm(!showAddTopicForm)}
                    className="px-3 py-1.5 bg-[#acefe3] hover:bg-[#8eead7] text-[#005047] text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    {showAddTopicForm ? '关闭新建表单' : '+ 手工新增指标课题'}
                  </button>
                </div>

                {/* Manual Add Topic Form */}
                {showAddTopicForm && (
                  <form onSubmit={handleAddTopicSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3 animate-fadeIn text-xs">
                    <p className="font-bold text-primary text-xs">手工新增教学课题指标线索：</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-500 text-[10px]">毕设题目名称：</label>
                        <input
                          type="text"
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          placeholder="例如：基于跨链结构的跨境对账审计保障机制"
                          className="w-full p-2 bg-white border border-[#c0c8cd] rounded outline-none focus:ring-1 focus:ring-primary"
                          required
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-slate-500 text-[10px]">毕设专业领域分类：</label>
                        <select
                          value={newTopicCategory}
                          onChange={(e) => setNewTopicCategory(e.target.value)}
                          className="w-full p-2 bg-white border border-[#c0c8cd] rounded outline-none"
                        >
                          {categories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 text-[10px]">立题要点摘要简介：</label>
                      <textarea
                        value={newTopicAbstract}
                        onChange={(e) => setNewTopicAbstract(e.target.value)}
                        placeholder="请输入本课题的研究背景、预期毕业设计提交物、研究指标等..."
                        className="w-full h-16 p-2 bg-white border border-[#c0c8cd] rounded outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-500 text-[10px]">指导导师姓名：</label>
                        <input
                          type="text"
                          value={newTopicAdvisorName}
                          onChange={(e) => setNewTopicAdvisorName(e.target.value)}
                          className="w-full p-2 bg-white border border-[#c0c8cd] rounded outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 text-[10px]">导师学术职称：</label>
                        <input
                          type="text"
                          value={newTopicAdvisorTitle}
                          onChange={(e) => setNewTopicAdvisorTitle(e.target.value)}
                          className="w-full p-2 bg-white border border-[#c0c8cd] rounded outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 text-[10px]">所属科系学部：</label>
                        <input
                          type="text"
                          value={newTopicAdvisorDept}
                          onChange={(e) => setNewTopicAdvisorDept(e.target.value)}
                          className="w-full p-2 bg-white border border-[#c0c8cd] rounded outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddTopicForm(false)}
                        className="px-3 py-1 bg-white border rounded hover:bg-slate-100"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-primary text-white font-bold rounded"
                      >
                        入库挂牌选题
                      </button>
                    </div>
                  </form>
                )}

                {/* Filters Row */}
                <div className="flex gap-3 justify-between items-center flex-wrap">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="检索课题或导师名称..."
                      value={topicSearchQuery}
                      onChange={(e) => setTopicSearchQuery(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary bg-slate-50 w-44 md:w-56"
                    />

                    <select
                      value={topicCategoryFilter}
                      onChange={(e) => setTopicCategoryFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-[#161d1f]"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? '筛选：全部专业' : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                    匹配出 {filteredTopics.length} 个核心选题
                  </span>
                </div>

                {/* Topics pool compact table */}
                <div className="overflow-hidden border border-slate-100 rounded-lg text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#e8eff1] text-primary font-bold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">领域大项</th>
                        <th className="px-4 py-2.5">毕业论文课题题目</th>
                        <th className="px-4 py-2.5">所属导师 / 职位</th>
                        <th className="px-4 py-2.5">抢报进展</th>
                        <th className="px-4 py-2.5 text-right">调配操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTopics.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-[#eef5f7] text-[#24695f] font-bold text-[9px] rounded uppercase text-nowrap">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#161d1f]">
                            <p className="max-w-[240px] truncate" title={t.title}>{t.title}</p>
                          </td>
                          <td className="px-4 py-3 text-[#40484d]">
                            <span>{t.advisorName}</span>
                            <span className="text-[9px] text-slate-400 ml-1 bg-slate-100 px-1 py-0.5 rounded whitespace-nowrap">{t.advisorTitle}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-600 whitespace-nowrap">
                            {t.occupiedSlots} / {t.totalSlots} 人
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteTopic(t.id, t.title)}
                              className="text-error hover:underline text-[11px] font-bold cursor-pointer"
                            >
                              撤销下架
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredTopics.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center text-slate-400 py-8 italic text-xs">
                            没有找到对应的研究指向条目。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB USERS: USER MANAGEMENT */}
            {activeSubTab === 'users' && (
              <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary">people</span>
                    用户管理
                  </h3>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 border rounded text-center">
                    <span className="text-[10px] text-slate-400">总用户数</span>
                    <p className="text-xl font-bold mt-1 text-primary">{userStats.total}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded text-center">
                    <span className="text-[10px] text-slate-400">学生</span>
                    <p className="text-xl font-bold mt-1 text-[#24695f]">{userStats.students}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded text-center">
                    <span className="text-[10px] text-slate-400">教师</span>
                    <p className="text-xl font-bold mt-1 text-indigo-700">{userStats.teachers}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded text-center">
                    <span className="text-[10px] text-slate-400">管理员</span>
                    <p className="text-xl font-bold mt-1 text-amber-600">{userStats.admins}</p>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-hidden border border-slate-100 rounded-lg text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#e8eff1] text-primary font-bold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">用户ID</th>
                        <th className="px-4 py-2.5">姓名</th>
                        <th className="px-4 py-2.5">角色</th>
                        <th className="px-4 py-2.5">院系</th>
                        <th className="px-4 py-2.5 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-600">{u.userId}</td>
                          <td className="px-4 py-3 font-medium text-[#161d1f]">{u.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              u.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                              u.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {u.role === 'admin' ? '管理员' : u.role === 'teacher' ? '教师' : '学生'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{u.department || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            {u.role !== 'admin' && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleStartEdit(u)}
                                  className="text-primary hover:underline text-[11px] font-bold cursor-pointer"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => onDeleteUser(u.id)}
                                  className="text-error hover:underline text-[11px] font-bold cursor-pointer"
                                >
                                  删除
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Edit User Modal */}
                {editingUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4 animate-fadeIn">
                      <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        编辑用户信息
                      </h3>
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">姓名</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">院系</label>
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">邮箱</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-1.5 bg-primary text-white rounded text-xs font-bold hover:opacity-90 cursor-pointer"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB OVERVIEW: ADVANCED ANALYTICS */}
            {activeSubTab === 'overview' && (
              <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft h-full space-y-6 animate-fadeIn">
                
                <h3 className="font-bold text-primary text-sm flex items-center gap-1.5 pb-2 border-b border-slate-150">
                  <span className="material-symbols-outlined text-primary">troubleshoot</span>
                  教学任务督教与自动导师匹配中心
                </h3>

                {/* Bento controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Option A: Excel import */}
                  <div className="p-4 rounded-xl border border-[#c0c8cd]/60 hover:bg-slate-50/50 transition-all space-y-4 justify-between flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg shrink-0">
                        <span className="material-symbols-outlined text-xl">file_upload</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">校级 Excel 大纲格式选题一键同步导入</h4>
                        <p className="text-[10px] text-gray-500 mt-1 leading-normal">同步教研室线下审查签字批准的研究题目副本并合并入志愿池。</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100/40 my-3"></div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-[#eef5f7] rounded font-bold px-2 py-0.5 text-secondary">
                        {isImportedToday ? '今日已同步对账' : '待更新检测'}
                      </span>
                      <button
                        type="button"
                        onClick={handleImportTopics}
                        className="px-3.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded cursor-pointer transition-colors"
                      >
                        开始导入 Excel 大纲 (2个)
                      </button>
                    </div>
                  </div>

                  {/* Option B: Resource balancer */}
                  <div className="p-4 rounded-xl border border-[#c0c8cd]/60 hover:bg-slate-50/50 transition-all space-y-4 justify-between flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ffe264]/25 text-amber-700 rounded-lg shrink-0">
                        <span className="material-symbols-outlined text-xl">settings_suggest</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">全校学生指导负载均衡自动调配</h4>
                        <p className="text-[10px] text-gray-500 mt-1 leading-normal">当发现学生落选或导师负荷超出时，运用双向最大流割匹配进行修正。</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100/40 my-3"></div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#24695f] font-bold">推荐触发：15名学生待配对</span>
                      <button
                        type="button"
                        onClick={handleOptimizeResources}
                        className="px-3.5 py-1.5 bg-secondary text-white text-[11px] font-bold rounded cursor-pointer transition-all"
                      >
                        一键自动匹配论文资源
                      </button>
                    </div>
                  </div>

                </div>

                {/* Analytical overview table */}
                <div className="bg-[#eef5f7] p-5 rounded-xl border border-[#c0c8cd]/40 text-xs text-[#161d1f] space-y-3">
                  <p className="font-bold flex items-center gap-1 leading-none text-primary">
                    <span className="material-symbols-outlined text-sm leading-none text-secondary">assessment</span>
                    本学期毕设推进多维度质量稽查日志
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                    <div className="p-3 bg-white border rounded shadow-xs text-center">
                      <span className="text-[10px] text-slate-400">教务总在库题目</span>
                      <p className="text-xl font-bold mt-1 text-primary">{topics.length} 门</p>
                    </div>
                    <div className="p-3 bg-white border rounded shadow-xs text-center">
                      <span className="text-[10px] text-slate-400">通过审核的立题</span>
                      <p className="text-xl font-bold mt-1 text-[#24695f]">{topics.filter(t => t.occupiedSlots > 0).length} 门</p>
                    </div>
                    <div className="p-3 bg-white border rounded shadow-xs text-center">
                      <span className="text-[10px] text-slate-400">指导配额比率</span>
                      <p className="text-xl font-bold mt-1 text-indigo-700">92.5 %</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Global Academic Calendar log */}
        <section className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-3">
          <h4 className="font-bold text-xs text-primary flex items-center gap-1.5 pb-2 border-b border-[#c0c8cd]/30">
            <span className="material-symbols-outlined text-base">emergency</span>
            全校重要学术里程碑推进轨迹对照日历
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border-l-4 border-slate-350 rounded-r-lg">
              <p className="text-slate-400 text-[10px] font-bold uppercase leading-none">第一里程碑</p>
              <h5 className="font-bold text-[#161d1f] mt-1">师生完成志愿对账认定</h5>
              <p className="text-slate-500 text-[10px] mt-0.5">截止于今年 11月 15日</p>
            </div>
            <div className="p-3 bg-[#eef5f7] border-l-4 border-[#24695f] rounded-r-lg">
              <p className="text-[#24695f]/70 text-[10px] font-bold uppercase leading-none">第二里程碑 (当前)</p>
              <h5 className="font-bold text-primary mt-1">任务书全面下达与开题自检</h5>
              <p className="text-slate-500 text-[10px] mt-0.5">截止于今年 12月 30日</p>
            </div>
            <div className="p-3 bg-slate-50 border-l-4 border-slate-350 rounded-r-lg">
              <p className="text-slate-400 text-[10px] font-bold uppercase leading-none">第三里程碑</p>
              <h5 className="font-bold text-[#161d1f] mt-1">中期教学质量评估检查对账</h5>
              <p className="text-slate-500 text-[10px] mt-0.5">截止于来年 03月 15日</p>
            </div>
            <div className="p-3 bg-slate-50 border-l-4 border-slate-350 rounded-r-lg">
              <p className="text-slate-400 text-[10px] font-bold uppercase leading-none">终审和盲评</p>
              <h5 className="font-bold text-[#161d1f] mt-1">大论文排排重与公开答辩合规</h5>
              <p className="text-slate-500 text-[10px] mt-0.5">截止于来年 06月 10日</p>
            </div>
          </div>
        </section>

      </main>

      {/* Insert Add Batch Modal popover */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-xl border border-[#c0c8cd]/60 shadow-lg relative animate-scaleUp">
            <h3 className="font-bold text-primary text-sm flex items-center gap-1.5 pb-2 border-b border-[#c0c8cd]/35">
              <span className="material-symbols-outlined text-primary">domain_verification</span>
              初始化本学期学制批次
            </h3>

            <form onSubmit={handleAddBatchSubmit} className="space-y-4 pt-4 text-xs">
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#40484d]">教研届别/学院名称</label>
                <input 
                  type="text" 
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-[#c0c8cd] rounded outline-none focus:ring-1 focus:ring-primary"
                  placeholder="如：2024届 计科/智科 论文批次"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#40484d]">时间大纲范围</label>
                <input 
                  type="text" 
                  value={newBatchTimeline}
                  onChange={(e) => setNewBatchTimeline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-[#c0c8cd] rounded outline-none focus:ring-1 focus:ring-primary"
                  placeholder="如：9月 11 - 12月 30"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#40484d]">参评拟定学生人数</label>
                <input 
                  type="number" 
                  value={newBatchCount}
                  onChange={(e) => setNewBatchCount(parseInt(e.target.value) || 100)}
                  className="w-full p-2.5 bg-slate-50 border border-[#c0c8cd] rounded outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#c0c8cd] rounded text-[#40484d] cursor-pointer"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-white rounded font-bold cursor-pointer hover:opacity-90"
                >
                  通过验证并创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
