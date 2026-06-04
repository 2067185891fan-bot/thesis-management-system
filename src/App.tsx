/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserRole,
  UserProfile,
  ThesisTopic,
  MySelection,
  ProposalSubmission,
  MidtermReport,
  FinalThesisSubmission,
  SelectionAudit,
  TaskBook,
  AcademicBatch
} from './types';

import LoginView from './components/LoginView';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import AdminView from './components/AdminView';
import NotificationToast, { ToastMessage } from './components/NotificationToast';

// API hooks
import {
  useAuth,
  useTopics,
  useAudits,
  useTaskBooks,
  useProposals,
  useMidterm,
  useFinal,
  useBatches,
  useUsers
} from './hooks/useApi';

export default function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth state
  const { user, role, login, register, updateProfile, logout, switchRole } = useAuth();

  // Get current user from localStorage (must be before useAudits)
  const currentUser: UserProfile | null = (() => {
    const saved = localStorage.getItem('thesis_app_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  })();

  // Data hooks
  const { topics, createTopic, updateTopic, deleteTopic, updateSlots } = useTopics();
  // Get advisor name for teacher role filtering
  const advisorName = role === 'teacher' ? (user?.name || currentUser?.name || '') : null;
  const { audits, createAudit, updateAudit } = useAudits(advisorName);
  const { taskBooks, updateTaskBook, fetchTaskBooks } = useTaskBooks(advisorName);

  // Teacher's student list derived from audits (exclude rejected)
  const teacherStudents = useMemo(() => {
    if (role !== 'teacher' || !audits.length) return [];
    const seen = new Map();
    for (const a of audits) {
      // Skip rejected audits — student is no longer under this teacher's guidance
      if (a.status === '已驳回') continue;
      if (!seen.has(a.studentId)) {
        seen.set(a.studentId, { id: a.studentId, name: a.studentName, topicTitle: a.topicTitle });
      }
    }
    return Array.from(seen.values());
  }, [role, audits]);

  // Admin-specific hooks
  const { batches, createBatch, deleteBatch } = useBatches();
  const { users, stats: userStats, createUser, deleteUser, updateUser } = useUsers();

  // Filter taskbooks for student view — only show student's own
  const studentTaskBooks = useMemo(() => {
    if (role !== 'student') return taskBooks;
    const studentName = currentUser?.name || user?.name;
    if (!studentName) return taskBooks;
    return taskBooks.filter(tb => tb.studentName === studentName);
  }, [role, taskBooks, currentUser, user]);

  // Selection state
  const [mySelection, setMySelection] = useState<MySelection | null>(() => {
    const saved = localStorage.getItem('thesis_app_my_selection_v3');
    return saved ? JSON.parse(saved) : null;
  });

  // Sync mySelection with audit status from API
  useEffect(() => {
    if (role !== 'student') return;

    const syncSelectionStatus = async () => {
      if (!user) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/audits`);
        const data = await response.json();
        if (data.success) {
          // Find active audit for current student (not rejected)
          const activeAudit = data.audits.find(
            (a: any) => a.student_id === user.id && a.status !== '已驳回'
          );

          if (activeAudit) {
            // Find topic ID from title
            const topic = topics.find(t => t.title === activeAudit.topic_title);
            const topicId = topic?.id || '';

            let newStatus: MySelection['status'];
            switch (activeAudit.status) {
              case '已通过':
                newStatus = '初审通过';
                break;
              default:
                newStatus = '选题待审核';
            }

            // Use functional form to avoid stale closure
            setMySelection(prev => {
              if (prev && prev.topicId === topicId && prev.status === newStatus) return prev;
              return {
                topicId,
                status: newStatus,
                submitDate: activeAudit.created_at ? new Date(activeAudit.created_at).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
                projectCode: `PROJ-CS-${activeAudit.student_id}`,
                timelineSteps: []
              };
            });
          } else {
            // Check for rejected audit
            const rejectedAudit = data.audits.find(
              (a: any) => a.student_id === user.id && a.status === '已驳回'
            );
            if (rejectedAudit) {
              const topic = topics.find(t => t.title === rejectedAudit.topic_title);
              const topicId = topic?.id || '';
              setMySelection(prev => {
                if (prev && prev.topicId === topicId && prev.status === '已退回') return prev;
                return {
                  topicId,
                  status: '已退回',
                  submitDate: rejectedAudit.created_at ? new Date(rejectedAudit.created_at).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
                  projectCode: `PROJ-CS-${rejectedAudit.student_id}`,
                  timelineSteps: []
                };
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync selection status:', err);
      }
    };

    syncSelectionStatus();
  }, [user, topics, role, audits]); // eslint-disable-line react-hooks/exhaustive-deps

  // Teacher: selected student for viewing details
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Auto-select first student when teacher students list changes
  useEffect(() => {
    if (role === 'teacher' && teacherStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(teacherStudents[0].id);
    }
    if (role !== 'teacher') {
      setSelectedStudentId(null);
    }
  }, [role, teacherStudents]); // eslint-disable-line react-hooks/exhaustive-deps

  // Student-specific hooks
  const studentId = user?.role === 'student' ? user.id : (role === 'teacher' ? selectedStudentId : null);
  const { proposal, updateProposal, fetchProposal } = useProposals(studentId, advisorName);
  const { midterm, updateMidterm, addComment } = useMidterm(studentId, advisorName);
  const { finalSubmission, updateFinal } = useFinal(studentId, advisorName);

  // Persist selection to localStorage
  useEffect(() => {
    if (mySelection) {
      localStorage.setItem('thesis_app_my_selection_v3', JSON.stringify(mySelection));
    } else {
      localStorage.removeItem('thesis_app_my_selection_v3');
    }
  }, [mySelection]);

  // Auth actions
  const handleLogin = async (selectedRole: UserRole, userProfile?: any) => {
    if (!userProfile) {
      showToast('error', '登录失败', '请提供有效的用户凭证');
      return;
    }

    // Use the user profile from API authentication
    switchRole(selectedRole);
    localStorage.setItem('thesis_app_current_user', JSON.stringify(userProfile));
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    setMySelection(null);
    localStorage.removeItem('thesis_app_current_user');
    localStorage.removeItem('thesis_app_my_selection_v3');
    window.location.reload();
  };

  const handleSwitchRole = (newRole: UserRole) => {
    switchRole(newRole);
    // Set appropriate user profile
    let defaultProfile: UserProfile;
    if (newRole === 'student') {
      defaultProfile = { id: '', name: '', department: '', avatar: '' };
    } else if (newRole === 'teacher') {
      defaultProfile = { id: '', name: '', department: '', avatar: '' };
    } else {
      defaultProfile = { id: '', name: '', department: '', avatar: '' };
    }
    localStorage.setItem('thesis_app_current_user', JSON.stringify(defaultProfile));
    window.location.reload();
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    localStorage.setItem('thesis_app_current_user', JSON.stringify(updatedProfile));
    window.location.reload();
  };

  // Student operations
  const handleSelectTopic = async (topicId: string) => {
    // Get student ID
    const studentId = user?.id || JSON.parse(localStorage.getItem('thesis_app_current_user') || '{}').id;
    if (!studentId) {
      showToast('error', '错误', '无法获取用户信息');
      return;
    }

    // Check database for any existing active audit
    let hasActiveAudit = false;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/audits`);
      const data = await response.json();
      if (data.success) {
        const existingActiveAudit = data.audits.find(
          (a: any) => a.student_id === studentId && a.status !== '已驳回'
        );
        if (existingActiveAudit) {
          hasActiveAudit = true;
        }
      }
    } catch (err) {
      console.error('Failed to check existing audits:', err);
      // If API fails, check local state
      if (mySelection && mySelection.status !== '已退回') {
        hasActiveAudit = true;
      }
    }

    if (hasActiveAudit) {
      showToast('warning', '无法选题', '您已有进行中的选题，请等待审核结果或退回后再选。');
      return;
    }

    // Double check local state
    if (mySelection && mySelection.status !== '已退回') {
      showToast('warning', '无法选题', '您已有进行中的选题，请等待审核结果或退回后再选。');
      return;
    }

    // Check if selecting the same topic
    const prevSelectedId = mySelection ? mySelection.topicId : null;
    if (prevSelectedId === topicId) {
      showToast('info', '提示', '您已选定该课题。');
      return;
    }

    const selectedTopic = topics.find(t => t.id === topicId);
    if (!selectedTopic) return;

    // Check if topic is full
    if (selectedTopic.occupiedSlots >= selectedTopic.totalSlots) {
      showToast('error', '名额已满', '该课题名额已满，无法选择。');
      return;
    }

    // Update local state
    const updatedSelection: MySelection = {
      topicId: topicId,
      status: '选题待审核',
      submitDate: new Date().toLocaleDateString('zh-CN'),
      projectCode: `PROJ-CS-${Math.floor(1000 + Math.random() * 9000)}`,
      timelineSteps: []
    };
    setMySelection(updatedSelection);

    // Update slots via API
    await updateSlots(topicId, true);
    if (prevSelectedId) {
      await updateSlots(prevSelectedId, false);
    }

    // Create audit record
    const studentProfile = JSON.parse(localStorage.getItem('thesis_app_current_user') || '{}');
    const result = await createAudit({
      studentId: studentProfile.id || user?.id || 'STUD-2024081',
      studentName: studentProfile.name || user?.name || '陈伟',
      topicTitle: selectedTopic.title
    });

    if (result) {
      showToast('success', '选题成功', `已成功选择课题《${selectedTopic.title}》，请等待导师审核。`);
    }
  };

  const handleCancelSelection = async () => {
    if (mySelection) {
      const topicId = mySelection.topicId;
      const status = mySelection.status;
      const studentId = user?.id || JSON.parse(localStorage.getItem('thesis_app_current_user') || '{}').id;

      // Clear local state first for responsive UI
      setMySelection(null);
      localStorage.removeItem('thesis_app_my_selection_v3');

      // Release slot if not already rejected (slot was freed by teacher on rejection)
      if (status !== '已退回') {
        await updateSlots(topicId, false);
      }

      // Delete the audit record from DB so student can re-select
      // (otherwise the old audit blocks new selections via the duplicate check)
      if (studentId) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/audits`);
          const data = await response.json();
          if (data.success) {
            const topic = topics.find(t => t.id === topicId);
            const auditToDelete = data.audits.find(
              (a: any) => a.student_id === studentId && a.topic_title === topic?.title
            );
            if (auditToDelete) {
              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/audits/${auditToDelete.id}`, {
                method: 'DELETE'
              });
            }
          }
        } catch (err) {
          console.error('Failed to delete audit record:', err);
        }
      }

      showToast('info', '已清除', '选题记录已清除，您可以重新选择课题。');
    }
  };

  // Faculty operations
  const handleAuditSubmit = async (id: string, status: '已通过' | '已驳回') => {
    try {
      await updateAudit(id, status);

      const targetAudit = audits.find(a => a.id === id);

      // If approved, auto-create a taskbook for the student
      if (status === '已通过' && targetAudit) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/taskbooks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentName: targetAudit.studentName,
              topicTitle: targetAudit.topicTitle
            })
          });
          // Refresh taskbooks list
          await fetchTaskBooks();
        } catch (err) {
          console.error('Failed to auto-create taskbook:', err);
        }
      }

      // If rejected, release the slot
      if (status === '已驳回' && targetAudit) {
        const topic = topics.find(t => t.title === targetAudit.topicTitle);
        if (topic) {
          try {
            await updateSlots(topic.id, false);
          } catch (err) {
            console.error('Failed to release slot after rejection:', err);
            showToast('error', '名额释放失败', '审核状态已更新，但课题名额释放失败，请手动检查。');
          }
        }
      }

      // Sync student selection if this is their application
      if (mySelection && user) {
        const matchedAudit = audits.find(a => a.id === id);
        if (matchedAudit && matchedAudit.studentId === user.id) {
          const matchedTopic = topics.find(t => t.id === mySelection.topicId);
          if (matchedTopic && matchedTopic.title === matchedAudit.topicTitle) {
            setMySelection(prev => {
              if (!prev) return null;
              return {
                ...prev,
                status: status === '已通过' ? '初审通过' : '已退回'
              };
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to submit audit:', err);
      showToast('error', '审核操作失败', '请稍后重试。');
    }
  };

  const handleUpdateTaskBook = async (id: string, status: '待提交' | '任务已下达' | '需要处理' | '草稿已保存') => {
    await updateTaskBook(id, status);
  };

  // Router layout
  if (!role) {
    return (
      <>
        <LoginView onLogin={handleLogin} showToast={showToast} />
        <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  if (role === 'student') {
    return (
      <>
        <StudentView
          topics={topics}
          onSelectTopic={handleSelectTopic}
          mySelection={mySelection}
          onCancelSelection={handleCancelSelection}
          proposal={proposal}
          onUpdateProposal={updateProposal}
          midterm={midterm}
          onUpdateMidterm={updateMidterm}
          finalSubmission={finalSubmission}
          onUpdateFinal={updateFinal}
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
          showToast={showToast}
          taskBooks={studentTaskBooks}
          studentProfile={currentUser || undefined}
          onUpdateProfile={handleUpdateProfile}
        />
        <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  if (role === 'teacher') {
    const teacherProfile: UserProfile = currentUser || {
      id: '',
      name: '',
      department: '',
      avatar: ''
    };

    return (
      <>
        <TeacherView
          teacherProfile={teacherProfile}
          audits={audits}
          onAuditSubmit={handleAuditSubmit}
          taskBooks={taskBooks}
          onUpdateTaskBook={handleUpdateTaskBook}
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
          showToast={showToast}
          proposal={proposal}
          onUpdateProposal={updateProposal}
          onRefetchProposal={fetchProposal}
          midterm={midterm}
          onUpdateMidterm={updateMidterm}
          onAddComment={addComment}
          finalSubmission={finalSubmission}
          onUpdateFinal={updateFinal}
          students={teacherStudents}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
        />
        <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  if (role === 'admin') {
    return (
      <>
        <AdminView
          batches={batches}
          onAddBatch={createBatch}
          onDeleteBatch={deleteBatch}
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
          showToast={showToast}
          topics={topics}
          onCreateTopic={createTopic}
          onDeleteTopic={deleteTopic}
          audits={audits}
          taskBooks={taskBooks}
          users={users}
          userStats={userStats}
          onCreateUser={createUser}
          onDeleteUser={deleteUser}
          onUpdateUser={updateUser}
        />
        <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  return (
    <>
      <LoginView onLogin={handleLogin} showToast={showToast} />
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
    </>
  );
}
