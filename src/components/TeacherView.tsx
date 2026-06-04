/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserProfile, 
  SelectionAudit, 
  TaskBook, 
  UserRole,
  ProposalSubmission,
  MidtermReport,
  FinalThesisSubmission,
  AdvisorComment
} from '../types';
import { AVATARS } from '../data';

interface TeacherStudent {
  id: string;
  name: string;
  topicTitle: string;
}

interface TeacherViewProps {
  teacherProfile: UserProfile;
  audits: SelectionAudit[];
  onAuditSubmit: (id: string, status: '已通过' | '已驳回') => void;
  taskBooks: TaskBook[];
  onUpdateTaskBook: (id: string, status: '待提交' | '任务已下达' | '需要处理' | '草稿已保存') => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  proposal: ProposalSubmission;
  onUpdateProposal: React.Dispatch<React.SetStateAction<ProposalSubmission>>;
  onRefetchProposal: () => Promise<void>;
  midterm: MidtermReport;
  onUpdateMidterm: React.Dispatch<React.SetStateAction<MidtermReport>>;
  onAddComment: (advisorName: string, role: string, comment: string) => Promise<any>;
  finalSubmission: FinalThesisSubmission;
  onUpdateFinal: React.Dispatch<React.SetStateAction<FinalThesisSubmission>>;
  students: TeacherStudent[];
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
}

export default function TeacherView({
  teacherProfile,
  audits,
  onAuditSubmit,
  taskBooks,
  onUpdateTaskBook,
  onSwitchRole,
  onLogout,
  showToast,
  proposal,
  onUpdateProposal,
  midterm,
  onUpdateMidterm,
  onAddComment,
  finalSubmission,
  onUpdateFinal,
  students,
  selectedStudentId,
  onSelectStudent,
  onRefetchProposal
}: TeacherViewProps) {
  // Local interface states
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const [activeTaskBookId, setActiveTaskBookId] = useState<string | null>(null);

  // New task book local state
  const [customTaskContent, setCustomTaskContent] = useState('');

  // Primary navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'milestones' | 'guidance'>('dashboard');

  // Milestone deep navigation sub-tabs
  const [currentMilestoneTab, setCurrentMilestoneTab] = useState<'proposal' | 'midterm' | 'final'>('proposal');

  // Interactive evaluations forms states
  const [proposalOpinion, setProposalOpinion] = useState('');

  // Derive selected student info
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedStudentName = selectedStudent?.name || '未选择';
  const [midtermOpinion, setMidtermOpinion] = useState('');
  const [finalOpinion, setFinalOpinion] = useState('');

  // Slider state for student progress simulation
  const [interactiveProgress, setInteractiveProgress] = useState(midterm.currentProgress);

  // Guidance chat state
  const [newGuidanceText, setNewGuidanceText] = useState('');
  const [selectedReviewerRole, setSelectedReviewerRole] = useState<'advisor' | 'assistant'>('advisor');

  const handleAuditAction = (id: string, status: '已通过' | '已驳回') => {
    onAuditSubmit(id, status);
    setActiveAuditId(null);
    if (status === '已通过') {
      showToast('success', '开题选题初审通过', '毕业选题申报已获教研组初步签字赞成，学生学籍工作台已同步流转。');
    } else {
      showToast('warning', '选题申报已被驳回', '论文提纲已成功批注退回至学生沙盒中，供学生重新调优摘要。');
    }
  };

  const handleTaskAction = (id: string) => {
    onUpdateTaskBook(id, '任务已下达');
    setActiveTaskBookId(null);
    setCustomTaskContent('');
    showToast('success', '学术任务书已正式签署', '官方毕设任务大纲、周报进度指标已正式锁定并同步至学生毕设看板。');
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleProposalVerdict = async (status: '已通过' | '已驳回') => {
    if (isProcessing || !selectedStudentId) return;
    setIsProcessing(true);

    const defaultOpinion = status === '已通过'
      ? '开题论证充足，技术路线清晰，具备可行性。准予开展下一步研究。'
      : '立题依据和文献综述仍显单薄，核心数学模型推导不够严密。退回修改。';
    const finalOpinionText = proposalOpinion.trim() || defaultOpinion;

    const newComment: AdvisorComment = {
      id: `mc_ph_${Date.now()}`,
      advisorName: teacherProfile.name,
      role: '指导老师',
      date: new Date().toLocaleDateString('zh-CN'),
      comment: `【开题大纲审核建议】：评级为「${status}」。指导意见：${finalOpinionText}`,
      bulletType: status === '已通过' ? 'active' : 'expired'
    };

    // Save to proposal record (comments + history + status)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/proposals/${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_submitted: status === '已通过',
          history: [
            {
              id: `ph_new_${Date.now()}`,
              fileName: proposal.proposalFile?.name || '开题报告文档大纲.docx',
              date: new Date().toLocaleString('zh-CN'),
              status: status
            },
            ...(proposal.history || [])
          ],
          comments: [newComment, ...(proposal.comments || [])]
        })
      });
      const result = await response.json();
      if (result.success) {
        // Raw fetch already persisted history + comments to API.
        // Refetch from API to sync local state (avoids duplicate history entries).
        await onRefetchProposal();
      }
    } catch (err) {
      console.error('Failed to update proposal:', err);
    }

    setProposalOpinion('');
    setIsProcessing(false);
    showToast(
      status === '已通过' ? 'success' : 'warning',
      `开题报告已判定为: ${status}`,
      status === '已通过' ? '报告已入选备案。' : '报告已退回给学生。'
    );
  };

  const handleMidtermVerdict = async (status: '已通过' | '需要处理') => {
    if (!selectedStudentId) return;
    const feedback = midtermOpinion.trim() || (status === '已通过' ? '中期进度良好，主要指标均已落实，建议保持研究动力。' : '算法推导及训练偏失较大，需立即和导师面谈修改方案。');

    const newComment: AdvisorComment = {
      id: `mc_mid_${Date.now()}`,
      advisorName: teacherProfile.name,
      role: '指导老师',
      date: new Date().toLocaleDateString('zh-CN'),
      comment: `【中期关键评估纪要】：评审判定为「${status === '已通过' ? '合格交付' : '限期整改'}」。评定反馈：${feedback}`,
      bulletType: status === '已通过' ? 'active' : 'expired'
    };

    // Call API to update midterm
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/midterm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          currentProgress: interactiveProgress,
          isSubmitted: status === '已通过',
          comments: [newComment, ...(midterm.comments || [])]
        })
      });
      const result = await response.json();
      if (result.success) {
        onUpdateMidterm(prev => ({
          ...prev,
          currentProgress: interactiveProgress,
          isSubmitted: status === '已通过',
          comments: [newComment, ...prev.comments]
        }));
        setMidtermOpinion('');
        showToast(
          status === '已通过' ? 'success' : 'warning',
          `中期成果审核判定: ${status === '已通过' ? '合格通过' : '限期整改'}`,
          `进度锚点 (${interactiveProgress}%) 及对应指导建议已同步至学生看板。`
        );
      } else {
        showToast('error', '中期评审失败', '服务器返回错误，请稍后重试。');
      }
    } catch (err) {
      console.error('Failed to update midterm:', err);
      showToast('error', '中期评审失败', '网络请求失败，请检查连接后重试。');
    }
  };

  const handleFinalVerdict = async (status: '已通过' | '已驳回') => {
    if (!selectedStudentId) return;
    const feedback = finalOpinion.trim() || (status === '已通过' ? '论文排版美观，检测查重报告合格，创新点充盈。同意送审盲审。' : '中英文摘要不通顺，第三章公式排错、数据待补，予以批注挂回。');

    const newComment: AdvisorComment = {
      id: `mc_fin_${Date.now()}`,
      advisorName: teacherProfile.name,
      role: '指导老师',
      date: new Date().toLocaleDateString('zh-CN'),
      comment: `【论文终稿终审判词】：审核结果为「${status === '已通过' ? '通过' : '整改重审'}」。详细批注为：${feedback}`,
      bulletType: status === '已通过' ? 'active' : 'expired'
    };

    // Save to final record (status + comments)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/final/${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          comments: [newComment, ...(finalSubmission.comments || [])]
        })
      });
      const result = await response.json();
      if (result.success) {
        onUpdateFinal(prev => ({
          ...prev,
          status,
          comments: [newComment, ...(prev.comments || [])]
        }));
        setFinalOpinion('');
        showToast(
          status === '已通过' ? 'success' : 'warning',
          `学术大论终审判定为: ${status}`,
          status === '已通过' ? '准予进入接续的毕业论文公开答辩资格核实程序。' : '论文已退回至学生工作台重构。'
        );
      } else {
        showToast('error', '终稿评审失败', '服务器返回错误，请稍后重试。');
      }
    } catch (err) {
      console.error('Failed to update final:', err);
      showToast('error', '终稿评审失败', '网络请求失败，请检查连接后重试。');
    }
  };

  const handleSendGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuidanceText.trim() || !selectedStudentId) return;

    const advisorName = selectedReviewerRole === 'advisor' ? teacherProfile.name : '李助教';
    const role = selectedReviewerRole === 'advisor' ? '指导老师' : '教辅人员';

    try {
      await onAddComment(advisorName, role, newGuidanceText.trim());
      setNewGuidanceText('');
      showToast('success', '学术指导建议发布成功', '纪要日志已存盘对账，并已向学生工作台推送系统级通知。');
    } catch (err) {
      console.error('Failed to send guidance:', err);
      showToast('error', '发布失败', '指导建议保存失败，请重试。');
    }
  };

  return (
    <div className="bg-[#f4fafd] min-h-screen text-[#161d1f] font-sans pb-24 md:pb-12 animate-fadeIn">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#c0c8cd]/40 sticky top-0 z-40 shadow-sm h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <h1 className="font-bold text-lg text-primary tracking-tight md:text-xl flex items-center gap-1.5">
            论文管理系统
            <span className="text-[10px] bg-[#acefe3] text-[#005047] px-2 py-0.5 rounded-full font-bold uppercase pb-1 leading-none">
              FACULTY
            </span>
          </h1>
        </div>

        {/* Global actions */}
        <nav className="flex gap-4 items-center">
          {/* Student selector */}
          {students.length > 0 && (
            <div className="flex items-center gap-2 bg-[#eef5f7] border border-[#c0c8cd]/40 px-3 py-1.5 rounded-full">
              <span className="text-[10px] text-[#70787d] font-bold">查看学生：</span>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="bg-white border border-[#c0c8cd] rounded px-2 py-0.5 text-[11px] font-bold text-primary outline-none cursor-pointer"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>
          )}

          {/* Profile pill */}
          <div className="flex items-center gap-3 bg-[#eef5f7] border border-[#c0c8cd]/40 px-3.5 py-1.5 rounded-full">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 border border-slate-300">
              <img src={teacherProfile.avatar} className="w-full h-full object-cover" alt="Teacher profile" />
            </div>
            <span className="text-xs font-bold text-primary">{teacherProfile.name}</span>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">supervisor_account</span>
              教师日常教学工作台
            </h2>
            <p className="text-xs text-[#40484d] mt-1">您具备博导级审批权限。在这里您可以跟踪和批复您组内学生的开题立项、中期核算、答辩资格和日常指导纪要。</p>
          </div>
          <div className="flex bg-[#eef5f7] border border-[#c0c8cd]/40 rounded-xl p-3 items-center gap-4 shadow-sm self-start shrink-0 text-xs">
            <div className="text-center border-r border-[#c0c8cd] pr-4">
              <p className="text-xs text-[#70787d]">指导学生数</p>
              <p className="text-lg font-bold text-primary">{students.length} 人</p>
            </div>
            <div className="text-center border-r border-[#c0c8cd] pr-4">
              <p className="text-[11px] text-[#70787d]">待审核课题</p>
              <p className="text-lg font-bold text-[#24695f]">
                {audits.filter(a => a.status === '待审核').length}
              </p>
            </div>
            <div className="text-center pl-1">
              <p className="text-[11px] text-[#70787d]">待处理任务书</p>
              <p className="text-lg font-bold text-amber-600">
                {taskBooks.filter(t => t.status === '需要处理').length} 份
              </p>
            </div>
          </div>
        </section>

        {/* Responsive Grid with Sidebar Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <nav className="lg:col-span-3 flex flex-col gap-1.5 bg-white p-4 rounded-xl border border-[#c0c8cd]/60 shadow-soft">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3 mb-2">日常教学视图</p>
            
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`flex items-center justify-between px-3 md:px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${activeSubTab === 'dashboard' ? 'bg-primary text-white shadow' : 'text-[#40484d] hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-sm">dashboard</span>
                题目审核与任务下达
              </span>
              {audits.filter(a => a.status === '待审核').length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeSubTab === 'dashboard' ? 'bg-[#acefe3] text-[#005047]' : 'bg-primary text-white'}`}>
                  {audits.filter(a => a.status === '待审核').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('milestones')}
              className={`flex items-center gap-2.5 px-3 md:px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${activeSubTab === 'milestones' ? 'bg-primary text-white shadow' : 'text-[#40484d] hover:bg-slate-50'}`}
            >
              <span className="material-symbols-outlined text-sm font-medium">fact_check</span>
              毕设考评 (开题/中期/终审)
            </button>

            <button
              onClick={() => setActiveSubTab('guidance')}
              className={`flex items-center justify-between px-3 md:px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${activeSubTab === 'guidance' ? 'bg-primary text-white shadow' : 'text-[#40484d] hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-sm">question_answer</span>
                日常学术答疑记录簿
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                {midterm.comments.length}
              </span>
            </button>

            <div className="border-t border-[#c0c8cd]/40 my-3"></div>

            {/* Simulated guidance notice info */}
            <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-lg space-y-1">
              <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs leading-none">warning</span>
                重要考务节点提醒
              </span>
              <p className="text-[10px] text-amber-800 leading-normal">
                本届毕业论文的中期答辩材料在线归口已开启，请叮嘱您的组员及时提交。
              </p>
            </div>
          </nav>

          {/* RIGHT VIEW BLOCK */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* TAB A: ORIGINAL COMPREHENSIVE DASHBOARD (Auditing + Task Books) */}
            {activeSubTab === 'dashboard' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Selection Audit card */}
                <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                  <div className="flex justify-between items-center border-b border-[#c0c8cd]/30 pb-3">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">rule</span>
                      选题预审控制窗
                    </h3>
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">
                      {audits.filter(a => a.status === '待审核').length} 待处理
                    </span>
                  </div>

                  {/* Loop Audits (exclude rejected) */}
                  <div className="space-y-4">
                    {audits.filter(a => a.status !== '已驳回').map(audit => (
                      <div 
                        key={audit.id}
                        className="p-3.5 bg-[#eef5f7] border border-transparent rounded-lg hover:border-primary/20 transition-all text-xs flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-[#161d1f] text-xs">{audit.studentName}</span>
                            <span className="text-[10px] text-[#70787d] ml-2">学号: {audit.studentId}</span>
                          </div>
                          
                          {audit.status === '待审核' ? (
                            <button 
                              onClick={() => {
                                if (activeAuditId === audit.id) {
                                  setActiveAuditId(null);
                                } else {
                                  setActiveAuditId(audit.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-primary text-white font-bold rounded hover:opacity-90 active:scale-95 transition-all text-[10px] cursor-pointer"
                            >
                              立即评审
                            </button>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${audit.status === '已通过' ? 'bg-[#acefe3] text-[#005047]' : 'bg-[#ffdad6] text-error'}`}>
                              {audit.status}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-primary font-bold italic select-none">
                          “{audit.topicTitle}”
                        </p>

                        {/* Expand audit menu */}
                        {activeAuditId === audit.id && (
                          <div className="p-3 bg-white border border-[#c0c8cd] rounded mt-2 space-y-2.5 animate-fadeIn">
                            <p className="font-bold text-[#1d1d1f] text-[10px]">认定评审资质：</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleAuditAction(audit.id, '已通过')}
                                className="flex-1 bg-secondary hover:bg-secondary/90 text-white py-1.5 rounded font-bold hover:opacity-90 cursor-pointer text-[10px]"
                              >
                                准予立题通过
                              </button>
                              <button 
                                onClick={() => handleAuditAction(audit.id, '已驳回')}
                                className="flex-1 border border-error text-error py-1.5 rounded font-bold hover:bg-red-50 cursor-pointer text-[10px]"
                              >
                                退回重拟摘要
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {audits.length === 0 && (
                      <p className="text-center text-xs text-[#70787d] py-6">暂无待审阅的课题申报需求。</p>
                    )}
                  </div>
                </div>

                {/* Task Book Issuance list & details */}
                <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                  <div className="flex justify-between items-start border-b border-[#c0c8cd]/30 pb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">assignment_turned_in</span>
                        正式学术任务书下达大厅
                      </h3>
                      <p className="text-[10px] text-[#70787d] mt-0.5">管理针对已通过选题学生的正式考核任务要求与研究范围限制。</p>
                    </div>
                  </div>

                  {/* Task Books list table */}
                  {taskBooks.length > 0 ? (
                    <div className="overflow-hidden border border-[#c0c8cd]/60 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#e8eff1] text-primary uppercase font-bold tracking-wider border-b border-[#c0c8cd]">
                          <tr>
                            <th className="px-3 py-2.5 text-[10px]">学生 / 所属毕业课题</th>
                            <th className="px-3 py-2.5 text-[10px]">大纲状态</th>
                            <th className="px-3 py-2.5 text-right text-[10px]">管理与更改</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#c0c8cd]/60">
                          {taskBooks.map(tb => (
                            <tr key={tb.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-3">
                                <p className="font-bold text-[#161d1f] text-xs">{tb.studentName}</p>
                                <p className="text-[9px] text-[#70787d] truncate max-w-[150px] mt-0.5" title={tb.topicTitle}>
                                  {tb.topicTitle}
                                </p>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${tb.status === '任务已下达' ? 'bg-[#acefe3] text-[#005047]' : tb.status === '需要处理' ? 'bg-[#ffdad6] text-error' : tb.status === '草稿已保存' ? 'bg-slate-100 text-[#40484d]' : 'bg-[#ffe264]/20 text-tertiary'}`}>
                                  {tb.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <button
                                  onClick={() => {
                                    if (tb.status === '任务已下达') {
                                      onUpdateTaskBook(tb.id, '需要处理');
                                      showToast('info', '任务书已转为待处理', `已撤回 ${tb.studentName} 的正式任务，处于修订调优状态。`);
                                    } else {
                                      setActiveTaskBookId(tb.id);
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 rounded font-bold text-[10px] cursor-pointer ${tb.status === '任务已下达' ? 'bg-white border border-[#c0c8cd] text-slate-700 hover:bg-slate-50' : 'bg-primary text-white hover:opacity-90'}`}
                                >
                                  {tb.status === '任务已下达' ? '撤回修订' : tb.status === '草稿已保存' ? '继续下达' : '撰写任务书'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-[#70787d] space-y-2">
                      <span className="material-symbols-outlined text-3xl text-slate-300 block">assignment</span>
                      <p className="font-bold">暂无待下达的任务书</p>
                      <p className="text-[10px]">请先在左侧「选题预审控制窗」中审核通过学生的选题申请，系统将自动为通过的学生生成任务书记录。</p>
                    </div>
                  )}

                  {/* Expand Task Book writer */}
                  {activeTaskBookId && (
                    <div className="p-3 bg-[#eef5f7] border-l-4 border-primary rounded-r-lg space-y-3 animate-fadeIn text-[11px]">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-primary">编制详细实验考评范围及指标</p>
                        <button 
                          onClick={() => setActiveTaskBookId(null)}
                          className="text-[10px] text-gray-500 hover:underline"
                        >
                          收起
                        </button>
                      </div>

                      <textarea 
                        value={customTaskContent}
                        onChange={(e) => setCustomTaskContent(e.target.value)}
                        placeholder="请输入具体的实验大纲、参考文献、以及关键周期代码交付和答辩排重率指标要求..."
                        className="w-full h-20 p-2.5 bg-white border border-[#c0c8cd] rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                      />

                      <div className="flex justify-end gap-2 text-[10px]">
                        <button 
                          onClick={() => {
                            onUpdateTaskBook(activeTaskBookId, '草稿已保存');
                            setActiveTaskBookId(null);
                            showToast('info', '任务书存为草稿', '当前修订大纲草稿文件已安全同步在本地。');
                          }}
                          className="px-3 py-1.5 bg-white border border-[#c0c8cd] rounded text-[#40484d] font-bold"
                        >
                          暂存本地草稿
                        </button>
                        <button 
                          onClick={() => handleTaskAction(activeTaskBookId)}
                          className="px-4 py-1.5 bg-primary text-white rounded font-bold"
                        >
                          签名授权发布
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* TAB B: INTERACTIVE MILESTONES EVALUATION (PROPOSAL, MIDTERM, FINAL) */}
            {activeSubTab === 'milestones' && (
              <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-6">
                
                {/* Milestone Selectors */}
                <div className="flex justify-between items-center border-b border-[#c0c8cd]/35 pb-2">
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setCurrentMilestoneTab('proposal')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${currentMilestoneTab === 'proposal' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-primary'}`}
                    >
                      <span className="material-symbols-outlined text-xs">auto_stories</span>
                      开题大纲审定
                    </button>
                    <button
                      onClick={() => {
                        setCurrentMilestoneTab('midterm');
                        setInteractiveProgress(midterm.currentProgress);
                      }}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${currentMilestoneTab === 'midterm' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-primary'}`}
                    >
                      <span className="material-symbols-outlined text-xs">insights</span>
                      中期成果质量监控
                    </button>
                    <button
                      onClick={() => setCurrentMilestoneTab('final')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${currentMilestoneTab === 'final' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-primary'}`}
                    >
                      <span className="material-symbols-outlined text-xs">workspace_premium</span>
                      毕业论文终审查重评定
                    </button>
                  </div>

                  <span className="text-[10px] text-[#70787d] font-bold flex items-center gap-1 bg-[#eef5f7] px-2 py-1 rounded">
                    <span className="material-symbols-outlined text-xs text-primary animate-spin">sync</span>
                    正在链接学生工作区
                  </span>
                </div>

                {/* AREA 1: PROPOSAL SUBMISSION DETAILS */}
                {currentMilestoneTab === 'proposal' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-[#eef5f7] p-4 rounded-xl border border-[#c0c8cd]/35 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-secondary">feed</span>
                          学生开题提交文本及研究摘要 ({selectedStudentName} - {selectedStudentId})
                        </p>
                        <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded text-[10px] font-bold">
                          {proposal.isSubmitted ? '已提交终审稿' : '处于暂存状态'}
                        </span>
                      </div>
                      
                      <div className="bg-white p-3.5 rounded border border-slate-200/60 text-slate-700 leading-relaxed text-xs">
                        {proposal.abstractText || "（暂未正式撰写，大纲未空）"}
                      </div>

                      {proposal.proposalFile && (
                        <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200 text-[11px]">
                          <span className="font-bold text-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-secondary-fixed">description</span>
                            论文大纲副本：{proposal.proposalFile.name} ({proposal.proposalFile.size})
                          </span>
                          {proposal.proposalFile.url ? (
                            <a
                              href={proposal.proposalFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-bold text-[10px] cursor-pointer"
                            >
                              下载审阅
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">文件未上传</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Evaluator Form — only show if not yet approved */}
                    {proposal.history[0]?.status === '已通过' ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                        <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                        <p className="text-emerald-700 font-bold text-sm mt-1">开题报告已审核通过</p>
                        <p className="text-emerald-600 text-xs mt-1">学生可进入下一阶段。</p>
                      </div>
                    ) : (
                    <div className="space-y-3 bg-white border border-slate-200/80 p-4 rounded-xl">
                      <h4 className="font-bold text-xs text-[#161d1f] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">rate_review</span>
                        批复学术开题评估大纲意见：
                      </h4>
                      <textarea
                        value={proposalOpinion}
                        onChange={(e) => setProposalOpinion(e.target.value)}
                        placeholder="请输入开题质量判词与立论细节。若留空，将自动载入符合教务规范的指导大纲评定模板..."
                        className="w-full h-20 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                      />

                      <div className="flex gap-2 justify-end text-[11px]">
                        <button
                          onClick={() => handleProposalVerdict('已驳回')}
                          className="px-4 py-1.5 border border-error text-error rounded font-bold hover:bg-red-50/50 cursor-pointer"
                        >
                          不通过 / 驳回要求整修
                        </button>
                        <button
                          onClick={() => handleProposalVerdict('已通过')}
                          className="px-5 py-1.5 bg-secondary text-white rounded font-bold hover:opacity-90 cursor-pointer"
                        >
                          签字核准 (初审通过)
                        </button>
                      </div>
                    </div>
                    )}

                    {/* Proposal history checklist */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-slate-400 tracking-wider uppercase">上报审核生命轨迹</h4>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg text-[10px]">
                        {proposal.history.map(hist => (
                          <div key={hist.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50/50">
                            <span className="text-slate-600 font-medium">{hist.fileName}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 font-mono">{hist.date}</span>
                              <span className={`px-2 py-0.5 rounded font-bold ${hist.status === '已通过' ? 'bg-[#acefe3] text-[#005047]' : 'bg-[#ffdad6] text-error'}`}>
                                {hist.status === '已通过' ? '初审通过' : '已退回'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* AREA 2: MIDTERM PROGRESS EVALUATION */}
                {currentMilestoneTab === 'midterm' && (
                  <div className="space-y-5 animate-fadeIn text-xs">
                    
                    {/* Synchronized dashboard card */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-[#eef5f7] p-4 rounded-xl border border-[#c0c8cd]/40">
                      
                      {/* Percent dial widget */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center p-3.5 bg-white rounded-lg border border-slate-200/50 text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">实存学术进度</span>
                        <p className="text-3xl font-black text-secondary leading-none">{interactiveProgress}%</p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 max-w-[80px]">
                          <div className="bg-secondary h-full" style={{ width: `${interactiveProgress}%` }}></div>
                        </div>
                      </div>

                      {/* Explanation details and doc */}
                      <div className="md:col-span-9 space-y-3 text-xs flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-[#161d1f]">学生中期自我总结汇报摘要</p>
                          <p className="text-slate-600 mt-1 lines-clamp-2 leading-relaxed">
                            {midterm.explanation}
                          </p>
                        </div>

                        {midterm.attachments.length > 0 && midterm.attachments.map((att: any) => (
                          <div key={att.id} className="flex items-center gap-2 text-[10px] bg-white px-2 py-1 rounded border border-slate-200 self-start">
                            <span className="material-symbols-outlined text-xs text-secondary uppercase font-bold">article</span>
                            {att.url ? (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">{att.name} ({att.size})</a>
                            ) : (
                              <span>{att.name} ({att.size})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive state updating */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-4">

                    {midterm.comments && midterm.comments.length > 0 ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                        <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                        <p className="text-emerald-700 font-bold text-sm mt-1">中期报告已审核通过</p>
                        <p className="text-emerald-600 text-xs mt-1">进度锚点 ({midterm.currentProgress}%) 已同步至学生看板。</p>
                      </div>
                    ) : (<>
                      {/* Progress scale bar adjustment */}
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold text-xs">
                          <label className="text-slate-700">修正当前的学术毕设完成度百分比指标：</label>
                          <span className="text-primary">{interactiveProgress}%</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={interactiveProgress}
                            onChange={(e) => setInteractiveProgress(parseInt(e.target.value) || 0)}
                            className="flex-1 accent-primary h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-slate-400">(滑块仿真参数修正)</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-750">下达中期质控把关评价意见：</label>
                        <textarea
                          value={midtermOpinion}
                          onChange={(e) => setMidtermOpinion(e.target.value)}
                          placeholder="请输入关于算法微观突破、数据集收集效率、或理论深度的批阅要求..."
                          className="w-full h-16 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="flex gap-2 justify-end text-[11px]">
                        <button
                          onClick={() => handleMidtermVerdict('需要处理')}
                          className="px-4 py-1.5 border border-red-200 text-error rounded font-bold hover:bg-neutral-50 cursor-pointer"
                        >
                          不合格 (责成限期改进)
                        </button>
                        <button
                          onClick={() => handleMidtermVerdict('已通过')}
                          className="px-5 py-1.5 bg-secondary text-white rounded font-bold hover:opacity-95 cursor-pointer"
                        >
                          进度判定合格 (准予流准)
                        </button>
                      </div>
                    </>)}
                    </div>
                  </div>
                )}

                {/* AREA 3: FINAL PAPER REVIEW */}
                {currentMilestoneTab === 'final' && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    
                    {/* Plagiarism checks details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#eef5f7] p-4 rounded-xl border border-slate-200/60 text-xs space-y-2.5">
                        <p className="font-bold text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">biotech</span>
                          知网查重分析指标仪表
                        </p>
                        
                        <div className="flex items-baseline gap-1 bg-white p-3 rounded border border-slate-200">
                          <span className="text-3xl font-black text-secondary">{finalSubmission.plagiarismRate}%</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">学术查重重复率</span>
                          <span className="ml-auto bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-extrabold border border-green-200">合格 (低于15%)</span>
                        </div>

                        <p className="text-[10px] text-slate-500 leading-normal">
                          查重对接权威检测引擎：<strong>{finalSubmission.plagiarismInstitution || '未设置'}</strong>
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">学生正式呈报题目大纲</p>
                          <p className="font-bold text-primary text-xs leading-snug">{finalSubmission.chineseTitle}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1 italic">{finalSubmission.englishTitle}</p>
                        </div>

                        {finalSubmission.plagiarismReport && (
                          <div className="flex items-center gap-2 text-[10px] bg-slate-50 px-2 py-1.5 rounded border border-slate-200 mt-2">
                            <span className="material-symbols-outlined text-xs text-secondary">gpp_good</span>
                            {finalSubmission.plagiarismReport.url ? (
                              <a href={finalSubmission.plagiarismReport.url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">查重报告：{finalSubmission.plagiarismReport.name} ({finalSubmission.plagiarismReport.size})</a>
                            ) : (
                              <span className="font-bold">查重报告：{finalSubmission.plagiarismReport.name} ({finalSubmission.plagiarismReport.size})</span>
                            )}
                          </div>
                        )}

                        {finalSubmission.finalThesisFile && (
                          <div className="flex items-center gap-2 text-[10px] bg-slate-50 px-2 py-1.5 rounded border border-slate-200 mt-2">
                            <span className="material-symbols-outlined text-xs text-secondary">description</span>
                            {finalSubmission.finalThesisFile.url ? (
                              <a href={finalSubmission.finalThesisFile.url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">论文定稿：{finalSubmission.finalThesisFile.name} ({finalSubmission.finalThesisFile.size})</a>
                            ) : (
                              <span className="font-bold">论文定稿：{finalSubmission.finalThesisFile.name} ({finalSubmission.finalThesisFile.size})</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] border-t border-slate-100 pt-3 mt-2">
                          <span className="text-slate-500 text-[10px]">当前论文状态：<strong>{finalSubmission.status}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Evaluator judgement input */}
                    <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl">
                      <h4 className="font-bold text-xs text-[#161d1f] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">gavel</span>
                        论文校级送审资格终审意见：
                      </h4>
                      <textarea
                        value={finalOpinion}
                        onChange={(e) => setFinalOpinion(e.target.value)}
                        placeholder="请输入最终学术评审质询意见。论文通过后将直接赋予院外评阅即双盲评审答辩资格..."
                        className="w-full h-16 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                      />

                      <div className="flex gap-2 justify-end text-[11px]">
                        <button
                          onClick={() => handleFinalVerdict('已驳回')}
                          className="px-4 py-1.5 border border-error text-error rounded font-bold hover:bg-red-50 cursor-pointer"
                        >
                          不合格 (责令全面大修)
                        </button>
                        <button
                          onClick={() => handleFinalVerdict('已通过')}
                          className="px-5 py-1.5 bg-secondary text-white rounded font-bold hover:opacity-90 cursor-pointer"
                        >
                          签字认定 (同意提呈送审)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB C: ADVISOR GUIDANCE LOG */}
            {activeSubTab === 'guidance' && (
              <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-6">
                
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-primary text-base flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary">history_edu</span>
                      在线咨询答疑与论文修改指导日志
                    </h3>
                    <p className="text-xs text-[#70787d] mt-1">您在此处添加的每一项教学批注，均同步呈现在{selectedStudentName}同学工作台右侧「导师学术建议纪要」之中。</p>
                  </div>
                  
                  <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-bold">
                    共计 {midterm.comments.length} 个指导批注
                  </span>
                </div>

                {/* Dynamic guidance sender form */}
                <form onSubmit={handleSendGuidance} className="bg-[#eef5f7] p-4 rounded-xl border border-slate-200/60 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-primary">新增答疑建议纪要：</p>
                    
                    {/* Role toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold">签名身份：</span>
                      <select
                        value={selectedReviewerRole}
                        onChange={(e) => setSelectedReviewerRole(e.target.value as 'advisor' | 'assistant')}
                        className="p-1 px-2.5 bg-white border border-slate-200 rounded font-semibold text-[10px]"
                      >
                        <option value="advisor">{teacherProfile.name} (指导老师)</option>
                        <option value="assistant">李助教 (教辅人员)</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={newGuidanceText}
                    onChange={(e) => setNewGuidanceText(e.target.value)}
                    placeholder="输入具体的修改规范、格式调整建议、参考书目等。例如：格式需确保统一为仿宋GB2312；补充多特征消融实验图表..."
                    className="w-full h-24 p-3 bg-white border border-[#c0c8cd] rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                    required
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-primary hover:bg-[#1a5f7a] text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      安全签名并发布至学生终端
                    </button>
                  </div>
                </form>

                {/* Interactive list of advisor logs */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">过往在线答疑日志记录</h4>
                  
                  <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                    {midterm.comments.map(comment => (
                      <div key={comment.id} className="relative text-xs">
                        <span className="absolute -left-[22.5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-secondary"></span>
                        
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg hover:bg-slate-50/50 hover:border-slate-200/50 transition-all space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-primary block leading-none">{comment.advisorName} ({comment.role})</span>
                            <span className="text-slate-400 font-mono">{comment.date}</span>
                          </div>
                          
                          <p className="text-[#40484d] leading-relaxed text-xs">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Dynamic timeline blocks at bottom */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div className="bg-[#ffe264]/10 p-5 rounded-xl border border-tertiary-fixed/30 flex gap-4 items-center shadow-sm">
            <div className="bg-[#ffe264] w-12 h-12 rounded-full flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#161d1f]">学术最近研究动态</h4>
              <p className="text-xs text-[#40484d] mt-1">你的组员{selectedStudentName}近期连续提交了关于"文献归类算法查重对账"的3个大纲草稿。</p>
            </div>
          </div>

          <div className="bg-[#acefe3]/20 p-5 rounded-xl border border-[#secondary]/20 flex gap-4 items-center shadow-sm">
            <div className="bg-[#acefe3] w-12 h-12 rounded-full flex items-center justify-center text-[#005047] shrink-0">
              <span className="material-symbols-outlined text-[24px]">groups</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#161d1f]">线下学术指导队列</h4>
              <p className="text-xs text-on-secondary-container mt-1">本组下次线下进度答辩审议暂定于本周四10:00，在信院402多功能室召开。</p>
            </div>
          </div>

        </section>

      </main>

      {/* Floating help node */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-12 text-center text-xs text-[#70787d] pb-8 border-t border-[#c0c8cd]/40 pt-6">
        <p>学术督导系统平台 • 中期质量合规质评模块均受统一教务规则约束。</p>
      </footer>
    </div>
  );
}

