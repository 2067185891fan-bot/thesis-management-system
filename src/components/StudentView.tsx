/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  ThesisTopic, 
  MySelection, 
  ProposalSubmission, 
  MidtermReport, 
  FinalThesisSubmission,
  UserRole,
  TaskBook
} from '../types';
import { AVATARS } from '../data';

interface StudentViewProps {
  topics: ThesisTopic[];
  onSelectTopic: (topicId: string) => void;
  mySelection: MySelection | null;
  onCancelSelection: () => void;
  proposal: ProposalSubmission;
  onUpdateProposal: (proposal: ProposalSubmission) => void;
  midterm: MidtermReport;
  onUpdateMidterm: (midterm: MidtermReport) => void;
  finalSubmission: FinalThesisSubmission;
  onUpdateFinal: (final: FinalThesisSubmission) => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  taskBooks?: TaskBook[];
  studentProfile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export default function StudentView({
  topics,
  onSelectTopic,
  mySelection,
  onCancelSelection,
  proposal,
  onUpdateProposal,
  midterm,
  onUpdateMidterm,
  finalSubmission,
  onUpdateFinal,
  onSwitchRole,
  onLogout,
  showToast,
  taskBooks = [],
  studentProfile,
  onUpdateProfile
}: StudentViewProps) {
  // Navigation Tabs
  // 'selection' (选题大厅), 'proposal' (开题报告), 'midterm' (中期进展), 'final' (终稿提交), 'profile' (个人资料)
  const [activeTab, setActiveTab] = useState<'selection' | 'proposal' | 'midterm' | 'final' | 'profile'>('selection');

  // Role switch verification dialog state
  const [showRoleSwitchDialog, setShowRoleSwitchDialog] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [verifyIdentifier, setVerifyIdentifier] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Handle role switch with verification
  const handleRoleSwitchRequest = (role: UserRole) => {
    setPendingRole(role);
    setVerifyIdentifier('');
    setVerifyPassword('');
    setShowRoleSwitchDialog(true);
  };

  const handleVerifyAndSwitch = async () => {
    if (!verifyIdentifier || !verifyPassword) {
      showToast('error', '验证失败', '请输入账号和密码');
      return;
    }

    setVerifying(true);

    // Call API to verify credentials
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: verifyIdentifier, password: verifyPassword })
      });
      const data = await response.json();

      if (data.success && data.user.role === pendingRole) {
        // Verification passed
        setShowRoleSwitchDialog(false);
        onSwitchRole(pendingRole!);
        showToast('success', '身份验证通过', `已切换至${pendingRole === 'teacher' ? '教师' : pendingRole === 'admin' ? '管理员' : '学生'}端`);
      } else if (data.success && data.user.role !== pendingRole) {
        showToast('error', '角色不匹配', `该账号的身份为${data.user.role === 'student' ? '学生' : data.user.role === 'teacher' ? '教师' : '管理员'}，无法切换至${pendingRole === 'teacher' ? '教师' : pendingRole === 'admin' ? '管理员' : '学生'}端`);
      } else {
        showToast('error', '验证失败', '账号或密码错误，请重试');
      }
    } catch (err) {
      console.error('Verification error:', err);
      showToast('error', '验证失败', '网络错误，请稍后重试');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelVerify = () => {
    setShowRoleSwitchDialog(false);
    setPendingRole(null);
    setVerifyIdentifier('');
    setVerifyPassword('');
  };

  const selectedTopic = mySelection ? topics.find(t => t.id === mySelection.topicId) : null;
  const myTaskBook = taskBooks?.find(tb => tb.studentName === studentProfile?.name || tb.topicTitle === selectedTopic?.title);

  // Check if selection is approved (gate for proposal/midterm/final stages)
  const isSelectionApproved = mySelection && (mySelection.status === '初审通过' || mySelection.status === '最终批准');

  // Profile editing hooks and fields
  const [profileName, setProfileName] = useState(studentProfile?.name || '');
  const [profileDept, setProfileDept] = useState(studentProfile?.department || '');
  const [profileEmail, setProfileEmail] = useState((studentProfile as any)?.email || '');
  const [profilePhone, setProfilePhone] = useState((studentProfile as any)?.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(studentProfile?.avatar || AVATARS.student);

  // Change password hooks and fields
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Sync profile edits when studentProfile prop changes
  useEffect(() => {
    if (studentProfile) {
      setProfileName(studentProfile.name);
      setProfileDept(studentProfile.department);
      setProfileAvatar(studentProfile.avatar);
      setProfileEmail((studentProfile as any).email || '');
      setProfilePhone((studentProfile as any).phone || '');
    }
  }, [studentProfile]);

  const handleSaveProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('error', '姓名为空', '请输入有效的真实学者姓名。');
      return;
    }
    const updated: UserProfile = {
      ...(studentProfile || { id: '', department: '', avatar: AVATARS.student }),
      name: profileName.trim(),
      department: profileDept,
      avatar: profileAvatar,
      email: profileEmail,
      phone: profilePhone
    } as any;

    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }
    showToast('success', '基本资料已更新', '学术个人基本信息更改已经由考务控制节点校验保存并在全站实时同步。');
  };

  const handleChangePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      showToast('error', '信息不完整', '请填写好所有的密码输入项后再进行更新。');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('error', '密码不匹配', '两次输入的新设置密码不一致，请重复确认。');
      return;
    }

    try {
      const stored = localStorage.getItem('thesis_app_registered_users');
      const registeredUsers = stored ? JSON.parse(stored) : [];
      const userIndex = registeredUsers.findIndex((u: any) => u.id === studentProfile?.id);

      if (userIndex !== -1) {
        if (registeredUsers[userIndex].password !== oldPassword) {
          showToast('error', '当前密码错误', '您输入的「校内统一认证旧密码」有误，校验失败。');
          return;
        }
        registeredUsers[userIndex].password = newPassword;
        localStorage.setItem('thesis_app_registered_users', JSON.stringify(registeredUsers));
        showToast('success', '安全密码更新成功', '系统已对您的学术认证密码进行了哈希升级核准更新！');
      } else {
        // Fallback or setup for pre-seeded user
        const newUser = {
          id: studentProfile?.id || '',
          name: studentProfile?.name || '',
          email: profileEmail,
          department: studentProfile?.department || '',
          role: 'student',
          password: newPassword,
          avatar: studentProfile?.avatar || AVATARS.student
        };
        registeredUsers.push(newUser);
        localStorage.setItem('thesis_app_registered_users', JSON.stringify(registeredUsers));
        showToast('success', '初始密码升级成功', '您已被成功升级为单点认证保护学者，并且新密码即时生效。');
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      console.error(err);
      showToast('error', '数据库繁忙', '由于浏览器本地高负荷校验延迟，密码暂时保存失败。');
    }
  };

  // -------------------------------------------------------------
  // Dynamic interactivity states added for superior UX flow
  // -------------------------------------------------------------
  // Removed old uploading states - now using uploadState object
  const [viewingTopic, setViewingTopic] = useState<ThesisTopic | null>(null);

  // Shortlisted/Bookmarked items from selection pool
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('thesis_app_shortlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleShortlist = (id: string, title: string) => {
    setShortlistedIds(prev => {
      const exists = prev.includes(id);
      let updated;
      if (exists) {
        updated = prev.filter(x => x !== id);
        showToast('info', '已取消收藏', `课题《${title.slice(0, 12)}...》已从志愿清单中移除`);
      } else {
        updated = [...prev, id];
        showToast('success', '已加入志愿', `课题《${title.slice(0, 12)}...》已加入您的备选收藏夹！`);
      }
      localStorage.setItem('thesis_app_shortlist', JSON.stringify(updated));
      return updated;
    });
  };

  // Phase Milestone Progress Checklist
  const [checklist, setChecklist] = useState<{ id: string; label: string; checked: boolean }[]>(() => {
    const defaultList = [
      { id: 'c1', label: '与指导老师确认选题方向并签署意向建议', checked: true },
      { id: 'c2', label: '阅读 5 篇以上专业领域核心外文期刊并完成综述大纲', checked: true },
      { id: 'c3', label: '完成核心计算架构的代码实现与 Baseline 数据跑通训练', checked: false },
      { id: 'c4', label: '完成 1.5 万字中期进展报告并归档 PDF 附件', checked: false },
      { id: 'c5', label: '通过教研室中期答辩并在系统签署自评成绩说明', checked: false },
      { id: 'c6', label: '提交论文定稿进行学术不端防抄袭排重检测，拿到查重报告', checked: false }
    ];
    try {
      const saved = localStorage.getItem('thesis_app_checklist');
      return saved ? JSON.parse(saved) : defaultList;
    } catch {
      return defaultList;
    }
  });

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
      localStorage.setItem('thesis_app_checklist', JSON.stringify(updated));
      const target = updated.map(i => i.id === id ? i : undefined).find(Boolean);
      if (target?.checked) {
        showToast('success', '目标解锁', `🎉 恭喜达成里程碑: "${target.label}" 已标记完工！`);
      }
      return updated;
    });
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Helper to parse file info and get display name
  const getFileDisplayName = (fileInfo: string | null): string => {
    if (!fileInfo) return '';
    try {
      const parsed = JSON.parse(fileInfo);
      return parsed.name || fileInfo;
    } catch {
      return fileInfo;
    }
  };

  // Real File Upload Handler
  const [uploadState, setUploadState] = useState<{
    field: string;
    progress: number;
    onComplete: ((name: string) => void) | null;
  } | null>(null);

  const triggerFileUpload = (field: string, onComplete: (name: string) => void) => {
    if (uploadState !== null) {
      showToast('warning', '上载进行中', '已有文件传输信道正在运行，请勿重复发起。');
      return;
    }
    // Store callback and trigger file input
    setUploadState({ field, progress: 0, onComplete });
    setTimeout(() => {
      const fileInput = document.getElementById('hidden-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
        // Listen for cancel event (fires when dialog closes without file selection)
        const onCancel = () => {
          setUploadState(null);
          fileInput.removeEventListener('cancel', onCancel);
        };
        fileInput.addEventListener('cancel', onCancel);
        fileInput.click();
      }
    }, 100);
  };

  const cancelUpload = () => {
    setUploadState(null);
    showToast('info', '上传已取消', '文件上传已取消。');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadState) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      showToast('error', '文件过大', '文件大小不能超过 50MB');
      setUploadState(null);
      return;
    }

    const currentField = uploadState.field;
    const studentId = studentProfile?.id || 'unknown';

    // Start real upload with progress simulation
    showToast('info', '开始上传', `正在上传文件: ${file.name}`);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 10) + 5;
      setUploadState(prev => prev ? { ...prev, progress: Math.min(current, 90) } : null);
    }, 200);

    try {
      // Dynamic import to avoid bundling issues if Supabase not configured
      const { uploadFile } = await import('../lib/upload');
      const folder = currentField.startsWith('proposal') ? 'proposals'
        : currentField.startsWith('midterm') ? 'midterm'
        : 'final';
      const result = await uploadFile(file, folder, studentId);

      clearInterval(interval);
      setUploadState(prev => prev ? { ...prev, progress: 100 } : null);

      if (result) {
        const fileInfo = JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.url
        });
        setTimeout(() => {
          uploadState.onComplete?.(fileInfo);
          setUploadState(null);
          showToast('success', '上传成功', `文件 "${file.name}" 已安全存储。`);
        }, 300);
      } else {
        setUploadState(null);
        showToast('error', '上传失败', `文件 "${file.name}" 上传失败，请重试。`);
      }
    } catch (err) {
      clearInterval(interval);
      setUploadState(null);
      showToast('error', '上传失败', `文件上传出错: ${err.message || '未知错误'}`);
    }

    // Reset file input
    e.target.value = '';
  };
  
  // Selection Lobby internals
  const [lobbySubTab, setLobbySubTab] = useState<'pool' | 'my'>('pool');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Proposal form state
  const [proposalAbstract, setProposalAbstract] = useState(proposal.abstractText);
  const [proposalFile, setProposalFile] = useState<string | null>(proposal.proposalFile?.name || null);

  // Midterm form state - two separate files
  const [midtermReportFile, setMidtermReportFile] = useState<string | null>(midterm.attachments[0]?.name || null);
  const [midtermCodeFile, setMidtermCodeFile] = useState<string | null>(midterm.attachments[1]?.name || null);
  const [isProposalSavedDraft, setIsProposalSavedDraft] = useState(false);

  // Midterm report state
  const [midtermExplanation, setMidtermExplanation] = useState(midterm.explanation);
  const [midtermSavedTime, setMidtermSavedTime] = useState<string | undefined>(midterm.lastSaved);

  // Final submission state
  const [cnTitle, setCnTitle] = useState(finalSubmission.chineseTitle);
  const [enTitle, setEnTitle] = useState(finalSubmission.englishTitle);
  const [plagRate, setPlagRate] = useState(finalSubmission.plagiarismRate);
  const [plagInst, setPlagInst] = useState(finalSubmission.plagiarismInstitution);
  const [plagFile, setPlagFile] = useState<string | null>(finalSubmission.plagiarismReport?.name || null);
  const [thesisFile, setThesisFile] = useState<string | null>(finalSubmission.finalThesisFile?.name || null);
  const [timeState, setTimeState] = useState(finalSubmission.deadlineCountdown || { days: 0, hours: '00', minutes: '00', seconds: '00' });

  // Synchronizers to unify student-teacher operations instantly upon switching views
  useEffect(() => {
    setProposalAbstract(proposal.abstractText);
    setProposalFile(proposal.proposalFile?.name || null);
  }, [proposal]);

  useEffect(() => {
    setMidtermExplanation(midterm.explanation);
    setMidtermReportFile(midterm.attachments[0]?.name || null);
    setMidtermCodeFile(midterm.attachments[1]?.name || null);
    setMidtermSavedTime(midterm.lastSaved);
  }, [midterm]);

  useEffect(() => {
    setCnTitle(finalSubmission.chineseTitle);
    setEnTitle(finalSubmission.englishTitle);
    setPlagRate(finalSubmission.plagiarismRate);
    setPlagInst(finalSubmission.plagiarismInstitution);
    setPlagFile(finalSubmission.plagiarismReport?.name || null);
    setThesisFile(finalSubmission.finalThesisFile?.name || null);
  }, [finalSubmission]);

  useEffect(() => {
    if (selectedTopic) {
      setCnTitle(selectedTopic.title);
    }
  }, [selectedTopic]);

  // Profile preferences
  const [emailNotify, setEmailNotify] = useState(true);
  const [appAlert, setAppAlert] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  // Countdown clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(prev => {
        let secs = parseInt(prev.seconds) - 1;
        let mins = parseInt(prev.minutes);
        let hrs = parseInt(prev.hours);
        let dys = prev.days;

        if (secs < 0) {
          secs = 59;
          mins -= 1;
        }
        if (mins < 0) {
          mins = 59;
          hrs -= 1;
        }
        if (hrs < 0) {
          hrs = 23;
          dys -= 1;
        }
        if (dys < 0) {
          clearInterval(timer);
          return prev;
        }

        return {
          days: dys,
          hours: hrs.toString().padStart(2, '0'),
          minutes: mins.toString().padStart(2, '0'),
          seconds: secs.toString().padStart(2, '0')
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filtered topics
  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.advisorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Unique categories
  const categories = ['all', ...Array.from(new Set(topics.map(t => t.category)))];

  // Action handlers
  const handleProposalSubmit = async () => {
    if (mySelection?.status === '已退回') {
      showToast('error', '无法提交开题', '您的选题申请已被导师退回，请先返回”课题大厅”清除退回记录并重新选题。');
      return;
    }
    if (!mySelection || mySelection.status === '选题待审核') {
      showToast('error', '无法提交开题', '您的选题尚未通过导师审核，请等待选题通过后再提交开题报告。');
      return;
    }
    // Block if already submitted and pending review or approved
    if (proposal.isSubmitted) {
      const lastStatus = proposal.history[0]?.status;
      if (lastStatus === '审核中') {
        showToast('warning', '已提交审核中', '您的开题报告正在审核中，请等待导师批阅。');
        return;
      }
      if (lastStatus === '已通过') {
        showToast('info', '已通过无需重复提交', '您的开题报告已通过审核，无需再次提交。');
        return;
      }
      // lastStatus === '已驳回' → allow resubmission
    }
    if (!proposalFile) {
      showToast('error', '未发现开题大纲', '请先通过上传器传输开题大纲 Word/PDF 报告成果。');
      return;
    }
    // Parse file info from JSON string
    let fileInfo;
    try {
      fileInfo = JSON.parse(proposalFile);
    } catch {
      fileInfo = { name: proposalFile, size: '未知', type: '未知' };
    }
    const updated = {
      ...proposal,
      abstractText: proposalAbstract,
      proposalFile: { id: 'pfa_new', name: fileInfo.name, size: formatFileSize(fileInfo.size), type: fileInfo.type || 'docx', url: fileInfo.url || null },
      isSubmitted: true,
      history: [
        { id: `ph_${Date.now()}`, fileName: fileInfo.name, date: '刚刚 提交', status: '审核中' as const },
        ...proposal.history
      ]
    };
    onUpdateProposal(updated);
    showToast('success', '开题正式提交', '您的开题大纲摘要与文件已移交给教研室指导名录，请等待导师初评签字。');
  };

  const handleProposalDraft = () => {
    setIsProposalSavedDraft(true);
    showToast('info', '成果已暂存', '当前录入的核心摘要已被本地浏览器安全沙箱缓存，安全离线暂存中。');
    setTimeout(() => setIsProposalSavedDraft(false), 3000);
  };

  const handleMidtermSubmit = async () => {
    // Block if already submitted (teacher needs to review first)
    if (midterm.isSubmitted) {
      showToast('warning', '已提交审核中', '您的中期报告已提交，请等待导师审核。');
      return;
    }
    if (!midtermReportFile && !midtermCodeFile) {
      showToast('error', '未检测到进度文档', '请先上传中期研究报告附件。');
      return;
    }

    // Build attachments array
    const attachments = [];
    if (midtermReportFile) {
      let fileInfo;
      try {
        fileInfo = JSON.parse(midtermReportFile);
      } catch {
        fileInfo = { name: midtermReportFile, size: 0, type: 'pdf' };
      }
      attachments.push({ id: 'mfa_report', name: fileInfo.name, size: formatFileSize(fileInfo.size), type: fileInfo.type || 'pdf', url: fileInfo.url || null });
    }
    if (midtermCodeFile) {
      let fileInfo;
      try {
        fileInfo = JSON.parse(midtermCodeFile);
      } catch {
        fileInfo = { name: midtermCodeFile, size: 0, type: 'zip' };
      }
      attachments.push({ id: 'mfa_code', name: fileInfo.name, size: formatFileSize(fileInfo.size), type: fileInfo.type || 'zip', url: fileInfo.url || null });
    }

    const updated = {
      ...midterm,
      explanation: midtermExplanation,
      attachments,
      isSubmitted: true
    };
    await onUpdateMidterm(updated);
    showToast('success', '中期审阅进行中', '中期答辩申报纪要正式递达到负责教研组！质量评估结果及导师意见将第一时间推送。');
  };

  const handleMidtermDraft = async () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setMidtermSavedTime(timeStr);
    // Only update explanation and lastSaved — preserve teacher's isSubmitted/comments/status
    const updated = {
      ...midterm,
      explanation: midtermExplanation,
      lastSaved: timeStr
    };
    await onUpdateMidterm(updated);
    showToast('success', '草稿同步成功', `研究进展说明已于 ${timeStr} 成功实现离线多重云备份。`);
  };

  const handleFinalSubmit = async () => {
    if (!thesisFile) {
      showToast('error', '未找到终稿定稿', '您必须选定并上载完成格式标定的论文终定稿 PDF 文本。');
      return;
    }
    // Prevent duplicate submission while under review or already approved
    if (finalSubmission.status === '审核中') {
      showToast('warning', '已提交审核', '您的终稿正在审核中，请勿重复提交。');
      return;
    }
    if (finalSubmission.status === '已通过') {
      showToast('info', '已通过无需重复提交', '您的终稿已通过审核，无需再次提交。');
      return;
    }
    // Parse file info from JSON string
    let thesisFileInfo;
    try {
      thesisFileInfo = JSON.parse(thesisFile);
    } catch {
      thesisFileInfo = { name: thesisFile, size: 0, type: 'pdf' };
    }

    // Parse plagiarism file info
    let plagFileInfo = null;
    if (plagFile) {
      try {
        plagFileInfo = JSON.parse(plagFile);
      } catch {
        plagFileInfo = { name: plagFile, size: 0, type: 'pdf' };
      }
    }

    const updated = {
      ...finalSubmission,
      chineseTitle: cnTitle,
      englishTitle: enTitle,
      plagiarismRate: plagRate,
      plagiarismInstitution: plagInst,
      plagiarismReport: plagFileInfo ? { id: 'rp_new', name: plagFileInfo.name, size: formatFileSize(plagFileInfo.size), type: plagFileInfo.type || 'pdf', url: plagFileInfo.url || null } : finalSubmission.plagiarismReport,
      finalThesisFile: { id: 'tf_new', name: thesisFileInfo.name, size: formatFileSize(thesisFileInfo.size), type: thesisFileInfo.type || 'pdf', url: thesisFileInfo.url || null },
      status: '审核中' as const
    };
    await onUpdateFinal(updated);
    showToast('success', '终程双审已激活', '恭喜！本科毕业设计论文定稿及查重契证已交由教务委员会备案审议。');
  };

  return (
    <div className="bg-[#f4fafd] min-h-screen text-[#161d1f] font-sans pb-24 md:pb-12">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#c0c8cd]/40 sticky top-0 z-40 shadow-sm h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <h1 className="font-bold text-lg text-primary tracking-tight md:text-xl flex items-center gap-1.5">
            论文管理系统
            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold uppercase">
              STUDENT
            </span>
          </h1>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex gap-6 items-center">
          <button 
            onClick={() => setActiveTab('selection')} 
            className={`cursor-pointer pb-1 text-sm font-semibold transition-all border-b-2 ${activeTab === 'selection' ? 'border-primary text-primary' : 'border-transparent text-[#40484d] hover:text-[#1d1d1f]'}`}
          >
            选题大厅
          </button>
          <button
            onClick={() => isSelectionApproved && setActiveTab('proposal')}
            disabled={!isSelectionApproved}
            title={!isSelectionApproved ? '请先完成选题并通过导师审核' : ''}
            className={`pb-1 text-sm font-semibold transition-all border-b-2 ${activeTab === 'proposal' ? 'border-primary text-primary' : 'border-transparent text-[#40484d]'} ${isSelectionApproved ? 'cursor-pointer hover:text-[#1d1d1f]' : 'cursor-not-allowed text-slate-300'}`}
          >
            开题报告
          </button>
          <button
            onClick={() => isSelectionApproved && setActiveTab('midterm')}
            disabled={!isSelectionApproved}
            title={!isSelectionApproved ? '请先完成选题并通过导师审核' : ''}
            className={`pb-1 text-sm font-semibold transition-all border-b-2 ${activeTab === 'midterm' ? 'border-primary text-primary' : 'border-transparent text-[#40484d]'} ${isSelectionApproved ? 'cursor-pointer hover:text-[#1d1d1f]' : 'cursor-not-allowed text-slate-300'}`}
          >
            中期汇报
          </button>
          <button
            onClick={() => isSelectionApproved && setActiveTab('final')}
            disabled={!isSelectionApproved}
            title={!isSelectionApproved ? '请先完成选题并通过导师审核' : ''}
            className={`pb-1 text-sm font-semibold transition-all border-b-2 ${activeTab === 'final' ? 'border-primary text-primary' : 'border-transparent text-[#40484d]'} ${isSelectionApproved ? 'cursor-pointer hover:text-[#1d1d1f]' : 'cursor-not-allowed text-slate-300'}`}
          >
            终稿提交
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`cursor-pointer pb-1 text-sm font-semibold transition-all border-b-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-[#40484d] hover:text-[#1d1d1f]'}`}
          >
            个人资料
          </button>

          <div className="w-px h-6 bg-[#c0c8cd] mx-2"></div>

          {/* Connected User pill */}
          <div className="flex items-center gap-3 bg-[#eef5f7] border border-[#c0c8cd]/40 px-3.5 py-1.5 rounded-full">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-primary-container text-white font-bold text-xs flex items-center justify-center">
              {(studentProfile?.name || '?').substring(0, 1)}
            </div>
            <span className="text-xs font-bold text-primary">{studentProfile?.name || '未登录'}</span>
          </div>
          <button 
            onClick={onLogout} 
            className="material-symbols-outlined text-xl text-[#70787d] hover:text-error transition-colors p-1.5 hover:bg-red-50 rounded-full cursor-pointer"
            title="登出"
          >
            logout
          </button>
        </nav>

        {/* Mobile Header elements */}
        <div className="md:hidden flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('profile')} 
            className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-slate-100"
          >
            <img src={studentProfile?.avatar || AVATARS.student} className="w-full h-full object-cover" alt="Avatar" />
          </button>
          <button onClick={onLogout} className="material-symbols-outlined text-xl text-[#70787d] p-1.5">
            logout
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">

        {/* Tab 1: 选题大厅 */}
        {activeTab === 'selection' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Tab header title */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-primary">选题大厅</h2>
              <p className="text-sm text-[#40484d]">在选题池中选择毕业设计题目，或进入“我的选择”查看您的题目初审状态与终审意见。</p>
            </div>

            {/* Selection Sub-tabs */}
            <div className="relative flex border-b border-[#c0c8cd] pb-0">
              <button 
                onClick={() => setLobbySubTab('pool')}
                className={`cursor-pointer px-6 py-3 font-semibold text-sm transition-all focus:outline-none relative ${lobbySubTab === 'pool' ? 'text-primary' : 'text-[#40484d]'}`}
              >
                选题池
                {lobbySubTab === 'pool' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>}
              </button>
              <button 
                onClick={() => setLobbySubTab('my')}
                className={`cursor-pointer px-6 py-3 font-semibold text-sm transition-all focus:outline-none relative flex items-center gap-1.5 ${lobbySubTab === 'my' ? 'text-primary' : 'text-[#40484d]'}`}
              >
                我的选择
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#00475e] text-[#ffffff] rounded-full">
                  {mySelection ? '1' : '0'}
                </span>
                {lobbySubTab === 'my' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>}
              </button>
            </div>

            {/* Sub-tab A: Topic Pool */}
            {lobbySubTab === 'pool' && (
              <div className="space-y-6">
                {/* Search / Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#70787d] text-xl">
                      search
                    </span>
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索论文课题、特定导师、研究方向等..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#c0c8cd] rounded-xl outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm shadow-sm"
                    />
                  </div>
                  
                  {/* Category Pill select (Vv4 custom filters) */}
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-full md:max-w-md items-center">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap cursor-pointer transition-all ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/20 hover:bg-slate-50'}`}
                      >
                        {cat === 'all' ? '全部领域' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTopics.map(topic => {
                    const isOccupiedFull = topic.occupiedSlots >= topic.totalSlots;
                    const isAlreadySelected = mySelection?.topicId === topic.id;
                    const hasActiveSelection = mySelection && mySelection.status !== '已退回';
                    const isShortlisted = shortlistedIds.includes(topic.id);

                    return (
                      <div 
                        key={topic.id}
                        className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft hover:border-primary hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold">
                              {topic.category}
                            </span>
                            <div className="flex items-center gap-2">
                              {/* Star icon for shortlisting */}
                              <button
                                type="button"
                                onClick={() => toggleShortlist(topic.id, topic.title)}
                                className={`text-lg p-1 rounded-full hover:bg-slate-150 transition-colors cursor-pointer flex items-center justify-center ${isShortlisted ? 'text-amber-500 font-bold' : 'text-gray-400 hover:text-amber-500'}`}
                                title={isShortlisted ? "从候选移出" : "标星为备选志愿"}
                              >
                                <span className="material-symbols-outlined font-bold text-sm leading-none">
                                  {isShortlisted ? 'star' : 'star_border'}
                                </span>
                              </button>

                              <span className={`text-[11px] font-semibold flex items-center gap-1 ${isOccupiedFull ? 'text-error' : 'text-[#40484d]'}`}>
                                <span className="material-symbols-outlined text-sm">groups</span>
                                {topic.occupiedSlots}/{topic.totalSlots} 名额
                              </span>
                            </div>
                          </div>
                          
                          <h3 
                            onClick={() => setViewingTopic(topic)}
                            className="font-bold text-base text-primary mb-2 leading-snug tracking-tight hover:text-secondary hover:underline cursor-pointer transition-colors"
                          >
                            {topic.title}
                          </h3>
                          <p className="text-xs text-[#40484d] mb-4 line-clamp-3 leading-relaxed">
                            {topic.abstract}
                          </p>

                          <button
                            onClick={() => setViewingTopic(topic)}
                            className="text-[11px] text-secondary font-bold hover:text-primary transition-colors flex items-center gap-1 mb-4 cursor-pointer"
                          >
                            查看研究提纲与参考书目
                            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                          </button>
                        </div>

                        <div className="pt-4 border-t border-[#c0c8cd]/40">
                          {/* Advisor portrait info */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <img src={topic.advisorAvatar} className="w-full h-full object-cover" alt="Advisor" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-primary leading-none">{topic.advisorName}</p>
                              <p className="text-[10px] text-[#70787d] mt-1">{topic.advisorDept} • {topic.advisorTitle}</p>
                            </div>
                          </div>

                          {/* Quick selection button */}
                          {hasActiveSelection ? (
                            isAlreadySelected ? (
                              <button
                                disabled
                                className="w-full py-2.5 rounded-lg text-xs font-bold bg-secondary text-white cursor-not-allowed"
                              >
                                已选定该课题
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full py-2.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                title="您已有进行中或已审批通过的选题，需等老师评审不通过（退回）后才能选报其他课题。"
                              >
                                无法选报 (已有进行中课题)
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => onSelectTopic(topic.id)}
                              disabled={isOccupiedFull}
                              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                                isOccupiedFull 
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                                  : 'bg-primary hover:bg-[#1a5f7a] text-white'
                              }`}
                            >
                              {isOccupiedFull ? '名额已满' : '确认选择题目'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredTopics.length === 0 && (
                    <div className="col-span-full bg-white p-12 text-center rounded-xl border border-dashed border-[#c0c8cd] text-[#70787d]">
                      <span className="material-symbols-outlined text-4xl mb-2 text-outline">search_off</span>
                      <p className="text-sm">没有找到匹配检索词的课题。请重置筛选条件。</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab B: My Selection Status */}
            {lobbySubTab === 'my' && (
              <div className="space-y-6">
                {mySelection ? (
                  (() => {
                    const selectedTopic = topics.find(t => t.id === mySelection.topicId);
                    if (!selectedTopic) return null;

                    return (
                      <div className="bg-white rounded-xl border border-[#c0c8cd]/60 shadow-soft overflow-hidden animate-fadeIn">
                        <div className="p-6 md:p-8">
                          
                          {/* Banner block */}
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b border-[#c0c8cd]/40">
                            <div>
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                                mySelection.status === '初审通过' 
                                  ? 'bg-secondary/20 text-secondary' 
                                  : mySelection.status === '已退回' 
                                  ? 'bg-[#ffdad6] text-error' 
                                  : 'bg-[#ffe264]/20 text-tertiary'
                              }`}>
                                <span className="material-symbols-outlined text-sm">
                                  {mySelection.status === '初审通过' ? 'check_circle' : mySelection.status === '已退回' ? 'cancel' : 'pending'}
                                </span>
                                {mySelection.status || '审批中'}
                              </span>
                              <h3 className="text-xl font-bold text-primary leading-tight">
                                {selectedTopic.title}
                              </h3>
                              <p className="text-xs text-[#70787d] mt-1">课题分类：{selectedTopic.category}</p>
                            </div>

                            {mySelection.status === '已退回' ? (
                              <button 
                                onClick={onCancelSelection}
                                className="px-4 py-2 text-xs border border-error text-error font-semibold rounded-lg hover:bg-red-50 transition-colors cursor-pointer self-start"
                              >
                                清除退回记录并重新选题
                              </button>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#eef5f7] border border-[#c0c8cd] text-primary select-none">
                                  <span className="material-symbols-outlined text-sm text-primary animate-spin">sync</span>
                                  流程锁定 (正等待导师评审)
                                </span>
                                <span className="text-[10px] text-[#70787d]">
                                  选题不可撤销，需由评审核退后方可更改
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Detail cells */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img src={selectedTopic.advisorAvatar} className="w-full h-full object-cover" alt="Advisor" />
                              </div>
                              <div>
                                <p className="text-[10px] text-[#70787d]">指导教师</p>
                                <p className="text-sm font-bold text-[#161d1f]">{selectedTopic.advisorName}</p>
                                <p className="text-[10px] text-[#40484d]">{selectedTopic.advisorDept}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary text-3xl">event_available</span>
                              <div>
                                <p className="text-[10px] text-[#70787d]">选定提交时间</p>
                                <p className="text-sm font-bold text-[#161d1f]">{mySelection.submitDate}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary text-3xl">info_outline</span>
                              <div>
                                <p className="text-[10px] text-[#70787d]">学术编号</p>
                                <p className="text-sm font-bold text-[#161d1f]">{mySelection.projectCode}</p>
                              </div>
                            </div>
                          </div>

                          {/* Historical stages list */}
                          <div className="mt-8 border-t border-[#c0c8cd]/40 pt-6">
                            <h4 className="font-bold text-[#161d1f] text-sm mb-4">选题审核轨迹</h4>
                            <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#c0c8cd]">
                              
                              <div className="relative font-sans">
                                <span className="absolute -left-[25px] top-1 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-white"></span>
                                <div>
                                  <p className="text-xs font-bold text-[#161d1f]">学生提交选题意向</p>
                                  <p className="text-[10px] text-[#70787d] mt-0.5">{mySelection.submitDate} • 14:32</p>
                                </div>
                              </div>

                              <div className="relative font-sans">
                                <span className={`absolute -left-[25px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                  mySelection.status === '初审通过' ? 'bg-secondary' : mySelection.status === '已退回' ? 'bg-error' : 'bg-primary animate-pulse'
                                }`}></span>
                                <div>
                                  <p className="text-xs font-bold text-[#161d1f]">指导教师资格初审</p>
                                  <p className={`text-[10px] mt-0.5 ${
                                    mySelection.status === '初审通过' ? 'text-secondary font-bold' : mySelection.status === '已退回' ? 'text-error font-bold' : 'text-[#70787d]'
                                  }`}>
                                    {mySelection.status === '初审通过' 
                                      ? '已审核通过 (导师已在选题书上签名同意 ✓)' 
                                      : mySelection.status === '已退回' 
                                      ? '已退回修订 (导师建议调整选题方向 ✗)' 
                                      : '正在进行 (等待导师签字)'}
                                  </p>
                                </div>
                              </div>

                              <div className={`relative font-sans ${mySelection.status === '初审通过' ? '' : 'opacity-40'}`}>
                                <span className={`absolute -left-[25px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${mySelection.status === '初审通过' ? 'bg-primary animate-pulse' : 'bg-[#c0c8cd]'}`}></span>
                                <div>
                                  <p className="text-xs font-bold text-[#161d1f]">教务委员会最终备案批准</p>
                                  <p className="text-[10px] text-[#70787d] mt-0.5">
                                    {mySelection.status === '初审通过' ? '已收到初审签字，正式进行学籍最终备案确认中...' : '等待前序评价结果'}
                                  </p>
                                </div>
                              </div>

                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-white p-12 text-center rounded-xl border border-dashed border-[#c0c8cd] text-[#70787d]">
                    <span className="material-symbols-outlined text-4xl mb-2 text-outline">history</span>
                    <p className="text-sm">您本学期尚未选定任何毕业论文课题。</p>
                    <button 
                      onClick={() => setLobbySubTab('pool')}
                      className="mt-4 px-6 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:opacity-90 cursor-pointer"
                    >
                      前往选题池挑选
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Tab 2: 开题报告 */}
        {activeTab === 'proposal' && (
          <div className="space-y-6 animate-fadeIn">
          {!isSelectionApproved ? (
            <div className="bg-white p-12 rounded-xl border border-[#c0c8cd]/40 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">lock</span>
              <h3 className="text-lg font-bold text-slate-400 mb-2">选题未通过，暂不可提交</h3>
              <p className="text-sm text-slate-400">请先在"选题大厅"选择课题并等待导师审核通过后再提交开题报告。</p>
              <button onClick={() => setActiveTab('selection')} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-[#1a5f7a]">前往选题</button>
            </div>
          ) : (<>
            {/* Header info */}
            <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/40 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary leading-tight">开题报告提交</h2>
                <p className="text-xs text-[#40484d] mt-1">请按期提交开题大纲、内容摘要以及WORD/PDF大纲。若老师驳回，需针对建议修缮重新提交。</p>
                {selectedTopic && (
                  <p className="text-xs text-sky-700 font-bold mt-2.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm font-bold">bookmark</span>
                    当前选定课题：{selectedTopic.title}
                  </p>
                )}
              </div>
              
              {/* Proposal status badge */}
              <div className="flex flex-col md:items-end gap-1 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">开题最高审批进度</span>
                {(() => {
                  const latestHistory = proposal.history[0];
                  const status = mySelection?.status === '已退回'
                    ? '已驳回'
                    : (latestHistory ? latestHistory.status : (proposal.isSubmitted ? '审核中' : '草稿暂存'));
                  const isApproved = status === '已通过' || (proposal.isSubmitted && latestHistory?.status === '已通过');
                  const isRejected = status === '已驳回' || latestHistory?.status === '已驳回';
                  
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      isApproved 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : isRejected 
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    }`}>
                      <span className="material-symbols-outlined text-sm">
                        {isApproved ? 'check_circle' : isRejected ? 'cancel' : 'pending'}
                      </span>
                      {status === '已通过' ? '审核通过 ✓' : status === '已驳回' ? '已被退回 ✗' : '审核中 (导师评选中)'}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form panel */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-6">
                
                {/* Text abstract */}
                <div className="space-y-2">
                  <label className="text-base font-bold text-primary block">课题核心摘要</label>
                  <textarea 
                    value={proposalAbstract}
                    onChange={(e) => setProposalAbstract(e.target.value)}
                    className="w-full h-44 p-4 rounded-lg border border-[#c0c8cd] focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-xs bg-slate-50 font-sans leading-relaxed"
                    placeholder="请输入毕业设计论文的研究背景、应用场景、目标要点及核心成果预期等内容 (300~500字)..."
                  />
                </div>

                {/* File Upload drag block */}
                <div className="space-y-2">
                  <label className="text-base font-bold text-primary block">开题报告文档大纲 (.docx / .pdf)</label>
                  <div 
                    className="border-2 border-dashed border-[#c0c8cd] rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all text-center cursor-pointer relative group overflow-hidden"
                    onClick={() => triggerFileUpload('proposal', setProposalFile)}
                  >
                    {uploadState?.field === 'proposal' ? (
                      <div className="space-y-2 w-full max-w-xs py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center text-xs font-bold text-primary">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 bg-secondary rounded-full animate-ping"></span>
                            上载中...
                          </span>
                          <span>{uploadState?.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-secondary h-full transition-all duration-150" style={{ width: `${uploadState?.progress || 0}%` }}></div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                          className="text-[10px] text-error font-bold hover:underline cursor-pointer"
                        >
                          取消上传
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-outline text-4xl group-hover:text-primary transition-colors">
                          cloud_upload
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#161d1f]">
                            {proposalFile ? (
                              <span className="flex items-center gap-2 justify-center">
                                已就绪（暂存）：{getFileDisplayName(proposalFile)}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setProposalFile(null); }}
                                  className="text-error hover:text-red-700 cursor-pointer"
                                  title="删除文件"
                                >
                                  <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                              </span>
                            ) : '点击这里 上传您的开题报告文件'}
                          </p>
                          <p className="text-[11px] text-[#70787d] mt-1">支持 Word (docx)、PDF 格式（最高支持 20MB 校验）</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex gap-3 justify-end pt-2">
                  <button 
                    onClick={handleProposalDraft}
                    className="px-5 py-2 border border-secondary text-secondary text-xs font-semibold rounded-full hover:bg-[#acefe3]/10 transition-colors cursor-pointer"
                  >
                    {isProposalSavedDraft ? '草稿已保存 ✓' : '保存本地草稿'}
                  </button>
                  <button 
                    onClick={handleProposalSubmit}
                    className="px-7 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:opacity-90 shadow active:scale-[0.98] cursor-pointer"
                  >
                    确认正式提交开题
                  </button>
                </div>

              </div>

              {/* Guidelines & History list */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Academic Task Book status block */}
                <div className={`p-6 rounded-xl border space-y-3 shadow-sm ${
                  myTaskBook?.status === '任务已下达' 
                    ? 'bg-emerald-50/75 border-emerald-200 text-emerald-800' 
                    : 'bg-amber-50/75 border-amber-200 text-amber-850'
                }`}>
                  <h3 className="font-bold text-sm flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-md">assignment_turned_in</span>
                      官方学术任务书状态
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      myTaskBook?.status === '任务已下达' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {myTaskBook ? myTaskBook.status : '未下达'}
                    </span>
                  </h3>
                  <p className="text-[11px] leading-normal opacity-90">
                    {myTaskBook?.status === '任务已下达'
                      ? '导师已签署并正式下达毕业设计任务书。您的开题工作已被正式并入学术毕设考务档案中。'
                      : '⚠️ 指导教师尚未完成官方学术任务大纲的正式下达。请告知指导老师从教师日常教学工作台建立并签署该选题的任务大纲。'}
                  </p>
                  {myTaskBook?.status === '任务已下达' && (
                    <div className="bg-white/80 p-3 rounded-lg border border-emerald-100/60 text-[10px] text-slate-700 leading-relaxed font-sans shadow-inner">
                      <p className="font-semibold text-primary mb-1">🔍 导师正式签署大纲要素：</p>
                      <p className="italic">“要求学生配合当下大纲进度指标独立完成开题论证，针对核心计算模块做出合理架构，且保证知网学术查重率控制在 15% 框架以内合格交付研究成果。”</p>
                    </div>
                  )}
                </div>

                {/* Submit directives block */}
                <div className="bg-[#1a5f7a]/5 border border-primary/20 p-6 rounded-xl relative overflow-hidden">
                  <h3 className="font-bold text-primary text-sm flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined">info</span>
                    开题提交须知
                  </h3>
                  <ul className="text-xs text-[#004d66] space-y-2 leading-relaxed">
                    <li className="flex gap-1.5"><span className="font-bold">1.</span> 确认指导教师已在线下审核通过您的研究路线，切勿盲目自行开题。</li>
                    <li className="flex gap-1.5"><span className="font-bold">2.</span> 正确规范命名：学号_姓名_开题报告_V1.docx。</li>
                    <li className="flex gap-1.5"><span className="font-bold">3.</span> 开题审批通过后，当前进度将解锁并推进至中期进展。</li>
                  </ul>
                </div>

                {/* Historical records */}
                <div className="space-y-3">
                  <h3 className="font-bold text-primary text-sm">开题指导历史</h3>
                  <div className="space-y-3">
                    {proposal.history.map((hist) => (
                      <div key={hist.id} className="bg-white p-4 rounded-xl border border-[#c0c8cd]/40 shadow-sm flex justify-between items-center text-xs">
                        <div className="flex gap-3 items-center">
                          <span className="material-symbols-outlined text-primary text-xl">description</span>
                          <div>
                            <p className="font-bold text-[#161d1f] max-w-[180px] truncate">{hist.fileName}</p>
                            <p className="text-[10px] text-[#70787d] mt-0.5">{hist.date}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${hist.status === '已通过' ? 'bg-secondary-container text-on-secondary-container' : hist.status === '已驳回' ? 'bg-[#ffdad6] text-error' : 'bg-[#ffe264]/20 text-tertiary'}`}>
                          {hist.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teacher review comments */}
                {proposal.comments && proposal.comments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">rate_review</span>
                      导师开题审核意见
                    </h3>
                    <div className="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                      {proposal.comments.map((comment) => (
                        <div key={comment.id} className="relative text-xs">
                          <span className="absolute -left-[22.5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-primary"></span>
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg space-y-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-primary">{comment.advisorName} ({comment.role})</span>
                              <span className="text-slate-400 font-mono">{comment.date}</span>
                            </div>
                            <p className="text-[#40484d] leading-relaxed">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
            </>)}
          </div>
        )}

        {/* Tab 3: 中期进展 */}
        {activeTab === 'midterm' && (
          <div className="space-y-6 animate-fadeIn">
          {!isSelectionApproved ? (
            <div className="bg-white p-12 rounded-xl border border-[#c0c8cd]/40 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">lock</span>
              <h3 className="text-lg font-bold text-slate-400 mb-2">选题未通过，暂不可提交</h3>
              <p className="text-sm text-slate-400">请先在"选题大厅"选择课题并等待导师审核通过后再提交中期报告。</p>
              <button onClick={() => setActiveTab('selection')} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-[#1a5f7a]">前往选题</button>
            </div>
          ) : (<>
            {/* Header section */}
            <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/40 shadow-soft">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-secondary text-xs uppercase font-bold tracking-wider">当前课题名称</span>
                  <h2 className="text-lg font-bold text-primary leading-snug">
                    {selectedTopic ? selectedTopic.title : '暂无选题'}
                  </h2>
                </div>
                {/* Progress bar info */}
                <div className="flex items-center gap-6">
                  {/* Status badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">中期评审结果</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold leading-none ${
                      midterm.isSubmitted 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {midterm.isSubmitted ? 'check_circle' : 'pending'}
                      </span>
                      {midterm.isSubmitted ? '进度合格交付 ✓' : '在编修订 / 待上报'}
                    </span>
                  </div>

                  <div className="text-right border-l border-slate-200 pl-4 shrink-0">
                    <p className="text-[10px] text-[#70787d]">总体进度评估</p>
                    <p className="text-xl font-bold text-primary">{midterm.currentProgress}%</p>
                  </div>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden md:block">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${midterm.currentProgress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Split view */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form editing area */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Description rich mock area */}
                <section className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[#161d1f] font-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">edit_note</span>
                      中期研究进展详细说明
                    </h3>
                    <span className="text-[10px] text-[#70787d]">字数统计: {midtermExplanation.length}</span>
                  </div>

                  <div className="border border-[#c0c8cd] rounded-lg overflow-hidden">
                    {/* Rich text mock bar */}
                    <div className="bg-[#eef5f7] p-2 border-b border-[#c0c8cd] flex gap-2 justify-start flex-wrap">
                      <button type="button" className="p-1 hover:bg-white rounded text-xs select-none"><b>B</b></button>
                      <button type="button" className="p-1 hover:bg-white rounded text-xs select-none"><i>I</i></button>
                      <button type="button" className="p-1 hover:bg-white rounded text-xs select-none"><u>U</u></button>
                      <span className="text-[#c0c8cd] select-none">|</span>
                      <button type="button" className="p-1 hover:bg-white rounded text-sm material-symbols-outlined select-none text-[16px]">link</button>
                      <button type="button" className="p-1 hover:bg-white rounded text-sm material-symbols-outlined select-none text-[16px]">image</button>
                    </div>

                    <textarea
                      value={midtermExplanation}
                      onChange={(e) => setMidtermExplanation(e.target.value)}
                      className="w-full h-80 p-4 border-none text-xs text-[#161d1f] bg-transparent focus:ring-0 resize-none outline-none leading-relaxed font-sans"
                      placeholder="请详细汇报您的大纲达成度、已完成的实验模块、碰到的阻碍瓶颈、以及下一步工作方向要求..."
                    />
                  </div>
                </section>

                {/* Attachments Section */}
                <section className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                  <h3 className="text-[#161d1f] font-bold text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">cloud_upload</span>
                    学术研究报告及数据附件 (.zip / .pdf)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 中期考核书上传 */}
                    <div
                      onClick={() => triggerFileUpload('midterm-report', setMidtermReportFile)}
                      className="border-2 border-dashed border-[#c0c8cd] hover:border-primary hover:bg-[#eef5f7] transition-all p-5 rounded-lg flex flex-col items-center justify-center cursor-pointer text-center group/btn overflow-hidden min-h-[110px]"
                    >
                      {uploadState?.field === 'midterm-report' ? (
                        <div className="space-y-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-between items-center text-[10px] font-bold text-primary">
                            <span>上传中...</span>
                            <span>{uploadState?.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-secondary h-full" style={{ width: `${uploadState?.progress || 0}%` }}></div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                            className="text-[10px] text-error font-bold hover:underline cursor-pointer"
                          >
                            取消
                          </button>
                        </div>
                      ) : midtermReportFile ? (
                        <>
                          <span className="material-symbols-outlined text-2xl text-primary mb-1">check_circle</span>
                          <span className="text-xs font-bold text-[#161d1f] mb-1">{getFileDisplayName(midtermReportFile)}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setMidtermReportFile(null); }}
                            className="text-[10px] text-error font-bold hover:underline cursor-pointer"
                          >
                            重新上传
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-2xl text-outline group-hover/btn:text-primary mb-1">
                            picture_as_pdf
                          </span>
                          <span className="text-xs font-semibold text-[#1a5f7a] group-hover/btn:underline">上传中期考核书 (PDF/Word)</span>
                        </>
                      )}
                    </div>

                    {/* 成果算法数据包上传 */}
                    <div
                      onClick={() => triggerFileUpload('midterm-code', setMidtermCodeFile)}
                      className="border-2 border-dashed border-[#c0c8cd] hover:border-primary hover:bg-[#eef5f7] transition-all p-5 rounded-lg flex flex-col items-center justify-center cursor-pointer text-center group/btn overflow-hidden min-h-[110px]"
                    >
                      {uploadState?.field === 'midterm-code' ? (
                        <div className="space-y-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-between items-center text-[10px] font-bold text-primary">
                            <span>上传中...</span>
                            <span>{uploadState?.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-secondary h-full" style={{ width: `${uploadState?.progress || 0}%` }}></div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                            className="text-[10px] text-error font-bold hover:underline cursor-pointer"
                          >
                            取消
                          </button>
                        </div>
                      ) : midtermCodeFile ? (
                        <>
                          <span className="material-symbols-outlined text-2xl text-primary mb-1">check_circle</span>
                          <span className="text-xs font-bold text-[#161d1f] mb-1">{getFileDisplayName(midtermCodeFile)}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setMidtermCodeFile(null); }}
                            className="text-[10px] text-error font-bold hover:underline cursor-pointer"
                          >
                            重新上传
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-2xl text-outline group-hover/btn:text-primary mb-1">
                            folder_zip
                          </span>
                          <span className="text-xs font-semibold text-[#1a5f7a] group-hover/btn:underline">上传成果算法数据包 (ZIP)</span>
                        </>
                      )}
                    </div>
                  </div>
                </section>

              </div>

              {/* Sidebar list: Advisor guidance records */}
              <div className="lg:col-span-4 space-y-6">

                {/* Progress Checklist */}
                <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#c0c8cd]/35">
                    <h3 className="font-bold text-primary text-xs flex items-center gap-1.5 leading-none">
                      <span className="material-symbols-outlined text-sm">checklist</span>
                      毕业设计进度自研工单
                    </h3>
                    <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                      {checklist.filter(c => c.checked).length} / {checklist.length} 已自核
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    这是您与教务大纲并行的成果微观指标自核工单，打勾来安全跟踪：
                  </p>

                  <div className="space-y-2 pt-1">
                    {checklist.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${item.checked ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={item.checked} 
                          onChange={() => {}} // handled by click container
                          className="mt-0.5 h-3.5 w-3.5 rounded text-primary focus:ring-primary cursor-pointer border-[#c0c8cd]" 
                        />
                        <span className={`text-[10px] leading-tight font-medium ${item.checked ? 'line-through text-slate-400 font-normal' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft sticky top-24 space-y-4">
                  <h3 className="text-[#161d1f] font-bold text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">history_edu</span>
                    导师学术建议纪要
                  </h3>

                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#dde4e6]">
                    
                    {midterm.comments.map(c => (
                      <div key={c.id} className="relative text-xs">
                        <span className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${c.bulletType === 'active' ? 'bg-secondary' : 'bg-[#c0c8cd]'}`}></span>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-primary">{c.advisorName} ({c.role})</span>
                            <span className="text-[10px] text-[#70787d]">{c.date}</span>
                          </div>
                          <p className="text-[#40484d] leading-relaxed bg-[#eef5f7] p-2.5 rounded">
                            {c.comment}
                          </p>
                        </div>
                      </div>
                    ))}

                  </div>
                </aside>
              </div>

            </div>

            {/* Bottom sticky action bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#c0c8cd]/60 z-30 shadow-md">
              <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
                <span className="text-xs text-[#70787d] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {midtermSavedTime ? `最后暂存于：${midtermSavedTime}` : '中途保存防止数据丢失'}
                </span>
                <div className="flex gap-3">
                  <button 
                    onClick={handleMidtermDraft}
                    className="px-5 py-2 text-xs border border-secondary text-secondary font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    暂存进度草稿
                  </button>
                  <button 
                    onClick={handleMidtermSubmit}
                    className="px-7 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 cursor-pointer"
                  >
                    汇报正式审阅
                  </button>
                </div>
              </div>
            </div>

            </>)}
          </div>
        )}

        {/* Tab 4: 终稿提交 */}
        {activeTab === 'final' && (
          <div className="space-y-6 animate-fadeIn">
          {!isSelectionApproved ? (
            <div className="bg-white p-12 rounded-xl border border-[#c0c8cd]/40 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">lock</span>
              <h3 className="text-lg font-bold text-slate-400 mb-2">选题未通过，暂不可提交</h3>
              <p className="text-sm text-slate-400">请先在"选题大厅"选择课题并等待导师审核通过后再提交终稿。</p>
              <button onClick={() => setActiveTab('selection')} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-[#1a5f7a]">前往选题</button>
            </div>
          ) : (<>
            {/* Countdown header */}
            <div className="bg-[#ffdad6] text-on-error-container border border-error/20 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-2xl">warning</span>
                <p className="text-xs font-bold">
                  【关键提醒】当前批次论定稿截止倒计时开启，逾期未按规定上传学术成果将丧失首轮答辩推优资格。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-[#93000a]">剩余：</span>
                <span className="font-mono font-black text-sm bg-error text-white px-2.5 py-1 rounded">
                  {timeState.days}天 {timeState.hours}:{timeState.minutes}:{timeState.seconds}
                </span>
              </div>
            </div>

            {/* Content grids */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column forms */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Titles */}
                <section className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 pb-2">
                    <span className="w-1 bg-[#00475e] h-5 rounded"></span>
                    <h3 className="font-bold text-primary text-base">最终论文题目核定</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#40484d]">最终中文题目</label>
                      <input 
                        type="text"
                        value={cnTitle}
                        onChange={(e) => setCnTitle(e.target.value)}
                        className="w-full p-3 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none"
                        placeholder="请输入最终确定的学术成果中文题目"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#40484d]">最终英文题目</label>
                      <input 
                        type="text"
                        value={enTitle}
                        onChange={(e) => setEnTitle(e.target.value)}
                        className="w-full p-3 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none font-sans"
                        placeholder="Enter the final verified English dissertation title"
                      />
                    </div>
                  </div>
                </section>

                {/* Plagiarism Plagiarism */}
                <section className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 pb-2">
                    <span className="w-1 bg-[#00475e] h-5 rounded"></span>
                    <h3 className="font-bold text-primary text-base">学术查重报告填报</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#40484d]">知网查重率 (%)</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={plagRate}
                            onChange={(e) => setPlagRate(e.target.value)}
                            className="w-full p-3 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none pr-10"
                            placeholder="0.00"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">%</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#40484d]">官方检测机构</label>
                        <select 
                          value={plagInst}
                          onChange={(e) => setPlagInst(e.target.value)}
                          className="w-full p-3 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option>中国知网 (CNKI)</option>
                          <option>维普 (VipPay)</option>
                          <option>万方数据 (Wanfang)</option>
                          <option>Turnitin国际版</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <label className="block text-xs font-semibold text-[#40484d] mb-1">查重率证明报告上传 (PDF)</label>
                      <div
                        onClick={() => triggerFileUpload('plagiarism', setPlagFile)}
                        className="border-2 border-dashed border-[#c0c8cd] hover:border-primary hover:bg-[#eef5f7] transition-all rounded-lg flex-1 p-6 flex flex-col items-center justify-center cursor-pointer text-center group"
                      >
                        {uploadState?.field === 'plagiarism' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-primary">
                              <span>正在上传查重报告...</span>
                              <span>{uploadState?.progress || 0}%</span>
                            </div>
                            <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-secondary h-full" style={{ width: `${uploadState?.progress || 0}%` }}></div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-outline text-3xl group-hover:text-primary mb-1">
                              gpp_good
                            </span>
                            <p className="text-xs font-bold text-[#161d1f]">
                              {plagFile ? (
                                <span className="flex items-center gap-2 justify-center">
                                  已就绪: {getFileDisplayName(plagFile)}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setPlagFile(null); }}
                                    className="text-error hover:text-red-700 cursor-pointer"
                                    title="删除文件"
                                  >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                  </button>
                                </span>
                              ) : '点击上传 PDF 查重凭证'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Main Dissertation File */}
                <section className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 pb-2">
                    <span className="w-1 bg-[#00475e] h-5 rounded"></span>
                    <h3 className="font-bold text-primary text-base">正式最终合格定稿归档</h3>
                  </div>

                  <div className="bg-[#e8eff1] rounded-xl p-8 border border-dashed border-primary/30 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-4xl text-primary mb-3">upload_file</span>
                    <h4 className="font-bold text-primary text-base">提交整卷正式稿大纲</h4>
                    <p className="text-xs text-[#70787d] max-w-sm mt-1 mb-6">
                      仅允许提交 PDF/Word (.docx) 标准结构体，文件体积需在50MB以内。请提前确认目录生成结构。
                    </p>

                    <button 
                      type="button"
                      onClick={() => triggerFileUpload('thesis', setThesisFile)}
                      className="px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-full hover:opacity-90 cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      {uploadState?.field === 'thesis' ? `上传中 ${uploadState?.progress || 0}%` : (thesisFile ? '更换定稿文件' : '选择论文定稿大纲')}
                    </button>

                    {thesisFile && (
                      <div className="mt-3 flex items-center justify-between text-xs bg-[#acefe3] text-primary px-3 py-1 rounded font-bold">
                        <span>当前就绪文件: {getFileDisplayName(thesisFile)}</span>
                        <button
                          type="button"
                          onClick={() => setThesisFile(null)}
                          className="text-error hover:text-red-700 cursor-pointer ml-2"
                          title="删除文件"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                </section>

              </div>

              {/* Right column advisor & guidelines */}
              <div className="lg:col-span-4 space-y-6">

                {/* Supervisor auditor profile */}
                <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft">
                  <h4 className="text-xs text-[#70787d] uppercase tracking-widest font-bold mb-4">指导老师初评状态</h4>
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                      <img src={finalSubmission.instructorAvatar} className="w-full h-full object-cover" alt="Instructor" />
                    </div>
                    <div>
                      <p className="font-bold text-primary text-base">{finalSubmission.instructorName}</p>
                      <p className="text-xs text-[#70787d]">{finalSubmission.instructorDept} • 教授教研室</p>
                    </div>
                  </div>

                  <div className="bg-[#eef5f7] p-3.5 rounded-xl flex justify-between items-center text-xs border border-[#c0c8cd]/35 shadow-inner">
                    <span className="text-[#161d1f] font-bold">最终论文定稿评审进度</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                      finalSubmission.status === '已通过' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : finalSubmission.status === '已驳回' 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : finalSubmission.status === '审核中'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {finalSubmission.status === '已通过' ? '审核通过 ✓' : finalSubmission.status === '已驳回' ? '已被退回 ✗' : finalSubmission.status}
                    </span>
                  </div>
                </div>

                {/* Final step guidelines */}
                <div className="p-6 rounded-xl bg-[#c6a915]/5 border border-[#c6a915]/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-tertiary">
                    <span className="material-symbols-outlined">gavel</span>
                    <h4 className="font-bold text-sm">正式提交须知</h4>
                  </div>
                  <ul className="text-xs text-on-tertiary-container space-y-2 leading-relaxed">
                    <li className="flex gap-1.5"><span className="font-bold">•</span> 一经正式递交给终审大厅，前后台均不接受擅自撤回调换。</li>
                    <li className="flex gap-1.5"><span className="font-bold">•</span> 必须确保知网官方检测率和附赠证明文档完全对称，否则予以学术欺诈红牌退回。</li>
                  </ul>
                </div>

                {/* Teacher final review comments */}
                {finalSubmission.comments && finalSubmission.comments.length > 0 && (
                  <div className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft space-y-3">
                    <h4 className="text-xs text-[#70787d] uppercase tracking-widest font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">rate_review</span>
                      导师终审意见
                    </h4>
                    <div className="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                      {finalSubmission.comments.map((comment) => (
                        <div key={comment.id} className="relative text-xs">
                          <span className="absolute -left-[22.5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-primary"></span>
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg space-y-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-primary">{comment.advisorName} ({comment.role})</span>
                              <span className="text-slate-400 font-mono">{comment.date}</span>
                            </div>
                            <p className="text-[#40484d] leading-relaxed">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Desktop final big button */}
            <div className="border-t border-[#c0c8cd] pt-6 flex flex-col items-center gap-4 pb-12">
              <p className="text-xs text-error font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                关键提醒：此操作具备学术不可回溯性，正式递交请仔细核验所有申报文本与版本！
              </p>
              <button 
                onClick={handleFinalSubmit}
                className="px-16 py-3.5 bg-primary text-white text-sm font-bold rounded-full hover:bg-[#1a5f7a] shadow-soft cursor-pointer transition-all active:scale-[0.98]"
              >
                确认信息无误，正式递交终稿大纲
              </button>
            </div>
            </>)}
          </div>
        )}

        {/* Tab 5: 个人中心 */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Title */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-primary">基本资料与安全设置</h2>
              <p className="text-sm text-[#40484d]">在此维护您的账号偏好，更新个人学术名录，或在工作流中安全地切换角色以直观模拟教师端和管理员端交互表现。</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Profile Card */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Dr. Julian Sterling layout in Screenshot 1 */}
                <section className="bg-white p-6 rounded-xl border border-[#c0c8cd]/60 shadow-soft text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-20 bg-primary/5"></div>
                  
                  <div className="relative mt-4">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-soft overflow-hidden mx-auto bg-slate-50">
                      <img src={studentProfile?.avatar || AVATARS.student} className="w-full h-full object-cover" alt="Student Profile" />
                    </div>
                    
                    <h3 className="mt-3 text-lg font-bold text-[#161d1f]">{studentProfile?.name || '未设置'}</h3>
                    <p className="text-[10px] text-[#70787d]">ID: {studentProfile?.id || '-'}</p>
                    <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium text-[10px]">
                      {studentProfile?.department || '未设置'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#c0c8cd]/40 text-center">
                    <div>
                      <p className="text-lg font-black text-primary">03</p>
                      <p className="text-[10px] text-[#70787d]">提交阶段数</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-secondary">进行中</p>
                      <p className="text-[10px] text-[#70787d]">培养状态</p>
                    </div>
                  </div>
                </section>

                {/* Role Switcher */}
                <section className="bg-white p-5 rounded-xl border-2 border-primary/20 shadow-soft">
                  <h3 className="font-bold text-primary text-sm mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-xl">published_with_changes</span>
                    切换角色
                  </h3>
                  <p className="text-xs text-[#70787d] mb-4">
                    由于毕业流程繁琐，应用支持实时变换您的校内身份，以此轻松体验不同角色之间的一体化协同流：
                  </p>

                  <div className="space-y-2">
                    <button
                      onClick={() => onSwitchRole('student')}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold bg-primary text-white cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">person</span>
                        学生阶段
                      </span>
                      <span className="material-symbols-outlined text-sm">radio_button_checked</span>
                    </button>

                    <button
                      onClick={() => handleRoleSwitchRequest('teacher')}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold border border-[#c0c8cd] text-primary hover:bg-[#eef5f7] cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">school</span>
                        教师阶段
                      </span>
                      <span className="material-symbols-outlined text-sm text-[#70787d]">radio_button_unchecked</span>
                    </button>

                    <button
                      onClick={() => handleRoleSwitchRequest('admin')}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold border border-[#c0c8cd] text-primary hover:bg-[#eef5f7] cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">shield_person</span>
                        教务管理员
                      </span>
                      <span className="material-symbols-outlined text-sm text-[#70787d]">radio_button_unchecked</span>
                    </button>
                  </div>
                </section>

              </div>

              {/* Forms side */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Personal Academic Profile Modification */}
                <section className="bg-white rounded-xl border border-[#c0c8cd]/60 shadow-soft overflow-hidden">
                  <div className="px-5 py-4 bg-[#eef5f7] border-b border-[#c0c8cd]/40">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-lg">manage_accounts</span>
                      个人核心学术资料修改
                    </h3>
                  </div>

                  <form className="p-5 space-y-4 text-xs" onSubmit={handleSaveProfileSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#40484d] uppercase tracking-wider">
                          真实学者姓名
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                          placeholder="姓名"
                          required
                        />
                      </div>

                      {/* ID field (Read only with school locks) */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#40484d] uppercase tracking-wider flex items-center justify-between">
                          <span>学工号标识码 (校认证号)</span>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">lock</span>
                            教教处锁定
                          </span>
                        </label>
                        <input
                          type="text"
                          value={studentProfile?.id || '-'}
                          disabled
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg outline-none cursor-not-allowed font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Department Select */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#40484d] uppercase tracking-wider">
                          所属专业学部院系
                        </label>
                        <select
                          value={profileDept}
                          onChange={(e) => setProfileDept(e.target.value)}
                          className="w-full px-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer appearance-none"
                        >
                          <option value="计算机科学学院">计算机科学学院</option>
                          <option value="信息学院">信息学院</option>
                          <option value="社会科学系">社会科学系</option>
                          <option value="建筑系">建筑系</option>
                        </select>
                      </div>

                      {/* Phone contact */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#40484d] uppercase tracking-wider">
                          联络绑定手机
                        </label>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full px-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none font-sans"
                          placeholder="138xxxxxxxx"
                        />
                      </div>
                    </div>

                    {/* Email address */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#40484d] uppercase tracking-wider">
                        电子收件邮箱 (毕审通知)
                      </label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none font-sans"
                        placeholder="your@email.cn"
                      />
                    </div>

                    {/* Preset Avatars picker */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-[#40484d] uppercase tracking-wider">
                        选择个人系统官方矢量头像
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {Object.entries(AVATARS).map(([key, imageUrl]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setProfileAvatar(imageUrl)}
                            className={`relative rounded-lg p-1 border-2 transition-all hover:bg-sky-50 flex items-center justify-center cursor-pointer ${
                              profileAvatar === imageUrl ? 'border-primary bg-[#eef5f7]' : 'border-transparent'
                            }`}
                          >
                            <img src={imageUrl} className="w-10 h-10 rounded-full object-cover" alt={key} />
                            {profileAvatar === imageUrl && (
                              <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] font-extrabold">check</span>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save profile profile action */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-primary hover:bg-[#1a5f7a] text-white text-xs font-bold rounded-full shadow hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">save_as</span>
                        保存修改基本学术资料
                      </button>
                    </div>
                  </form>
                </section>

                {/* 2. Account Security & Password Changes */}
                <section className="bg-white rounded-xl border border-[#c0c8cd]/60 shadow-soft overflow-hidden">
                  <div className="px-5 py-4 bg-[#eef5f7] border-b border-[#c0c8cd]/40">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined">security</span>
                      账号安全与密码设定
                    </h3>
                  </div>

                  <div className="p-5 divide-y divide-[#c0c8cd]/40">
                    
                    <div className="py-3 flex flex-col gap-4 text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-[#161d1f]">校内统一验证密码</p>
                          <p className="text-[10px] text-[#70787d]">实时与学术身份锁系统联防</p>
                        </div>
                        <button 
                          onClick={() => setShowPasswordForm(!showPasswordForm)}
                          className="px-4 py-1.5 border border-primary text-primary rounded-full hover:bg-slate-50 cursor-pointer font-bold"
                        >
                          {showPasswordForm ? '取消修改' : '修改校内验证密码'}
                        </button>
                      </div>

                      {/* Expandable Password Form */}
                      {showPasswordForm && (
                        <form className="bg-slate-50 p-4 rounded-xl border border-dotted border-[#c0c8cd] space-y-3 mt-1 animate-fadeIn" onSubmit={handleChangePasswordSubmit}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-[#40484d]">原身份验证密码</label>
                              <input 
                                type="password" 
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-[#c0c8cd] rounded focus:ring-1 focus:ring-primary outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-[#40484d]">新验证密码</label>
                              <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-[#c0c8cd] rounded focus:ring-1 focus:ring-primary outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-[#40484d]">确认新密码</label>
                              <input 
                                type="password" 
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-[#c0c8cd] rounded focus:ring-1 focus:ring-primary outline-none"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setOldPassword('');
                                setNewPassword('');
                                setConfirmNewPassword('');
                                setShowPasswordForm(false);
                              }}
                              className="px-4 py-1 bg-slate-200 text-[#40484d] rounded font-semibold text-[10px] hover:bg-slate-300"
                            >
                              取消
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1 bg-primary text-white rounded font-bold text-[10px] shadow"
                            >
                              确认修改
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    <div className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-[#161d1f]">双重校验身份卡 (MFA)</p>
                        <p className="text-[10px] text-[#70787d]">重要毕业节点递交必备安全机制</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#70787d]">{twoFactor ? '已开启安全验证' : '已停用校验'}</span>
                        <button 
                          onClick={() => setTwoFactor(!twoFactor)}
                          className={`w-11 h-6 rounded-full relative transition-colors duration-200 cursor-pointer focus:outline-none ${twoFactor ? 'bg-primary' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${twoFactor ? 'left-6' : 'left-1'}`}></span>
                        </button>
                      </div>
                    </div>

                    <div className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-[#161d1f]">安全认证绑定设备</p>
                        <p className="text-[10px] text-[#70787d]">目前在3台学术终端上有您的登录许可记录</p>
                      </div>
                      <button className="text-primary hover:underline font-bold flex items-center">
                        设备一键注销
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>

                  </div>
                </section>

                {/* Notifications checkboxes */}
                <section className="bg-white rounded-xl border border-[#c0c8cd]/60 shadow-soft overflow-hidden">
                  <div className="px-5 py-4 bg-[#eef5f7] border-b border-[#c0c8cd]/40">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined">notifications_active</span>
                      提醒通知接收渠道
                    </h3>
                  </div>

                  <div className="p-5 space-y-4">
                    
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={emailNotify} 
                        onChange={() => setEmailNotify(!emailNotify)} 
                        className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 border-[#c0c8cd]"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#161d1f]">邮件即时推送 (推荐)</p>
                        <p className="text-[10px] text-[#70787d]">当毕业选题通过审批、任务书下发、指导教师批改退回时投递至您的认证邮箱。</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={appAlert} 
                        onChange={() => setAppAlert(!appAlert)} 
                        className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 border-[#c0c8cd]"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#161d1f]">校务应用端内提醒</p>
                        <p className="text-[10px] text-[#70787d]">系统在网站标题栏中直接显示红色红点铃铛消息反馈。</p>
                      </div>
                    </label>

                  </div>
                </section>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* Mobile Sticky Tab bar icons (Tablet/Mobile fallback) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#c0c8cd] z-45 md:hidden flex justify-around items-center">
        <button 
          onClick={() => { setActiveTab('selection'); setLobbySubTab('pool'); }}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'selection' ? 'text-primary' : 'text-[#70787d]'}`}
        >
          <span className="material-symbols-outlined text-xl">account_tree</span>
          <span className="text-[9px] font-bold">选题大厅</span>
        </button>
        <button
          onClick={() => isSelectionApproved && setActiveTab('proposal')}
          disabled={!isSelectionApproved}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'proposal' ? 'text-primary' : isSelectionApproved ? 'text-[#70787d]' : 'text-slate-300'}`}
        >
          <span className="material-symbols-outlined text-xl">description</span>
          <span className="text-[9px] font-bold">开题大纲</span>
        </button>
        <button
          onClick={() => isSelectionApproved && setActiveTab('midterm')}
          disabled={!isSelectionApproved}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'midterm' ? 'text-primary' : isSelectionApproved ? 'text-[#70787d]' : 'text-slate-300'}`}
        >
          <span className="material-symbols-outlined text-xl">edit_note</span>
          <span className="text-[9px] font-bold">中期进展</span>
        </button>
        <button
          onClick={() => isSelectionApproved && setActiveTab('final')}
          disabled={!isSelectionApproved}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'final' ? 'text-primary' : isSelectionApproved ? 'text-[#70787d]' : 'text-slate-300'}`}
        >
          <span className="material-symbols-outlined text-xl">gavel</span>
          <span className="text-[9px] font-bold">定稿归档</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-primary' : 'text-[#70787d]'}`}
        >
          <span className="material-symbols-outlined text-xl">person</span>
          <span className="text-[9px] font-bold">个人资料</span>
        </button>
      </nav>

      {/* Topic Details Modal */}
      {viewingTopic && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 text-xs">
            {/* Modal header */}
            <div className="p-6 pb-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur z-10">
              <div>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold text-[9px] uppercase tracking-wider">
                  {viewingTopic.category}
                </span>
                <h3 className="text-base font-bold text-primary mt-1.5 leading-snug">
                  {viewingTopic.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingTopic(null)}
                className="text-gray-400 hover:text-gray-900 p-1.5 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#161d1f] text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">menu_book</span>
                  课题研究提要与论文要点
                </h4>
                <p className="text-gray-600 leading-relaxed text-xs">
                  {viewingTopic.abstract}
                </p>
              </div>

              {/* Simulated technical details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h5 className="font-bold text-primary block leading-none text-xs">📋 推荐技术栈与预备基础</h5>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-gray-700 rounded text-[10px] font-medium">PyTorch / Python 基准</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-gray-700 rounded text-[10px] font-medium">大语言模型微调套件 (LoRA)</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-gray-700 rounded text-[10px] font-medium">数据清洗与预处理框架</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-gray-700 rounded text-[10px] font-medium">文献解析算法与自然语言处理</span>
                </div>

                <h5 className="font-bold text-primary block leading-none pt-1 text-xs">📚 推荐参考文献检索索引</h5>
                <ol className="list-decimal list-inside pl-1 space-y-1 text-[10px] text-gray-500 leading-normal">
                  <li>Devlin, J. et al. "BERT: Pre-training of Deep Bidirectional Transformers." (2019)</li>
                  <li>Vaswani, A. et al. "Attention Is All You Need." NeurIPS (2017)</li>
                  <li>徐博士, 《分布式预训练文献自动归纳与蒸馏评价综述》, 学术月刊 2024</li>
                </ol>
              </div>

              {/* Advisor team schedule card */}
              <div className="border border-[#c0c8cd]/60 p-4 rounded-xl flex items-center justify-between gap-3 bg-white shadow-soft">
                <div className="flex items-center gap-3">
                  <img src={viewingTopic.advisorAvatar} className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0" alt="Advisor" />
                  <div>
                    <h5 className="font-bold text-gray-950 text-xs leading-none">{viewingTopic.advisorName} ({viewingTopic.advisorTitle})</h5>
                    <p className="text-[10px] text-gray-400 mt-1">{viewingTopic.advisorDept}</p>
                    <p className="text-[10px] text-[#24695f] mt-1.5 font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                      面谈时间: 每周二/四 下午14:05-17:00
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const isOccupiedFull = viewingTopic.occupiedSlots >= viewingTopic.totalSlots;
                    const isAlreadySelected = mySelection?.topicId === viewingTopic.id;
                    const hasActiveSelection = mySelection && mySelection.status !== '已退回';
                    if (isAlreadySelected) {
                      showToast('info', '不可重复选题', '您已经选定了本毕业课题大纲。');
                    } else if (hasActiveSelection) {
                      showToast('warning', '已有进行中的选题', '您已有待审核或已通过的毕业课题，无法选报其他课题。若需重新选报，请等待当前课题审核不通过（等老师退回）。');
                    } else if (isOccupiedFull) {
                      showToast('warning', '名额已达上限', '抱歉，当前课题的志愿学生名额已达满员，您可以面谈导师了解是否追加选报计划。');
                    } else {
                      onSelectTopic(viewingTopic.id);
                      setViewingTopic(null);
                    }
                  }}
                  className="px-3 py-2 bg-primary hover:bg-[#1a5f7a] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0"
                >
                  确认选报
                </button>
              </div>
            </div>
          </div>
        </div>
)}

      {/* Hidden file input for uploads */}
      <input
        id="hidden-file-input"
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.zip,.rar"
        onChange={handleFileChange}
      />

      {/* Role Switch Verification Dialog */}
      {showRoleSwitchDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-xl border border-[#c0c8cd]/60 shadow-lg relative">
            <h3 className="font-bold text-primary text-sm flex items-center gap-1.5 pb-2 border-b border-[#c0c8cd]/35">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              身份验证 - 角色切换
            </h3>

            <p className="text-xs text-[#40484d] mt-4 mb-4">
              您即将切换至 <span className="font-bold text-primary">{pendingRole === 'teacher' ? '教师' : pendingRole === 'admin' ? '管理员' : '学生'}</span> 端。
              请输入对应角色的账号密码以完成身份验证。
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#40484d]">账号 (工号/学号)</label>
                <input
                  type="text"
                  value={verifyIdentifier}
                  onChange={(e) => setVerifyIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                  placeholder={pendingRole === 'teacher' ? 'ACAD-XXXX-X' : pendingRole === 'admin' ? 'ADMIN-XXXX-X' : 'STUD-XXXXXXXX'}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#40484d]">密码</label>
                <input
                  type="password"
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyAndSwitch()}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={handleCancelVerify}
                className="px-4 py-2 border border-[#c0c8cd] rounded text-xs font-semibold text-[#40484d] hover:bg-slate-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleVerifyAndSwitch}
                disabled={verifying}
                className="px-5 py-2 bg-primary text-white rounded text-xs font-bold hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {verifying ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    验证中...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    确认切换
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleCancelVerify}
              className="absolute top-4 right-4 text-[#70787d] hover:text-[#161d1f] cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
