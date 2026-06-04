import { useState, useEffect, useCallback, useRef } from 'react';
import {
  authApi,
  topicsApi,
  auditsApi,
  taskbooksApi,
  proposalsApi,
  midtermApi,
  finalApi,
  batchesApi,
  usersApi
} from '../lib/api';

// Generic hook for async API calls
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { loading, error, execute };
}

// Auth hook
export function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('thesis_app_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem('thesis_app_role') || null;
  });
  const { loading, error, execute } = useAsyncOperation();

  const login = useCallback(async (identifier, password) => {
    const result = await execute(() => authApi.login(identifier, password));
    if (result.success) {
      setUser(result.user);
      setRole(result.user.role);
      localStorage.setItem('thesis_app_current_user', JSON.stringify(result.user));
      localStorage.setItem('thesis_app_role', result.user.role);
    }
    return result;
  }, [execute]);

  const register = useCallback(async (userData) => {
    return execute(() => authApi.register(userData));
  }, [execute]);

  const updateProfile = useCallback(async (profileData) => {
    if (!user) return;
    const result = await execute(() => authApi.updateProfile(user.id, profileData));
    if (result.success) {
      const updatedUser = { ...user, ...result.user };
      setUser(updatedUser);
      localStorage.setItem('thesis_app_current_user', JSON.stringify(updatedUser));
    }
    return result;
  }, [user, execute]);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('thesis_app_current_user');
    localStorage.removeItem('thesis_app_role');
  }, []);

  const switchRole = useCallback((newRole) => {
    setRole(newRole);
    localStorage.setItem('thesis_app_role', newRole);
  }, []);

  return { user, role, loading, error, login, register, updateProfile, logout, switchRole };
}

// Topics hook
export function useTopics() {
  const [topics, setTopics] = useState([]);
  const { loading, error, execute } = useAsyncOperation();
  const fetchedRef = useRef(false);

  const fetchTopics = useCallback(async () => {
    try {
      const result = await execute(() => topicsApi.getAll());
      if (result && result.success) {
        const transformed = result.topics.map(t => ({
          id: t.id,
          title: t.title,
          abstract: t.abstract,
          category: t.category,
          occupiedSlots: t.occupied_slots,
          totalSlots: t.total_slots,
          advisorName: t.advisor_name,
          advisorTitle: t.advisor_title,
          advisorDept: t.advisor_dept,
          advisorAvatar: t.advisor_avatar
        }));
        setTopics(transformed);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    }
  }, [execute]);

  const createTopic = useCallback(async (topicData) => {
    try {
      const result = await execute(() => topicsApi.create({
        title: topicData.title,
        abstract: topicData.abstract,
        category: topicData.category,
        totalSlots: topicData.totalSlots || 3,
        advisorName: topicData.advisorName,
        advisorTitle: topicData.advisorTitle,
        advisorDept: topicData.advisorDept,
        advisorAvatar: topicData.advisorAvatar
      }));
      if (result && result.success) {
        await fetchTopics();
      }
      return result;
    } catch (err) {
      console.error('Failed to create topic:', err);
    }
  }, [execute, fetchTopics]);

  const updateTopic = useCallback(async (id, updates) => {
    try {
      const dbUpdates = {};
      if (updates.occupiedSlots !== undefined) dbUpdates.occupied_slots = updates.occupiedSlots;
      if (updates.totalSlots !== undefined) dbUpdates.total_slots = updates.totalSlots;

      const result = await execute(() => topicsApi.update(id, dbUpdates));
      if (result && result.success) {
        await fetchTopics();
      }
      return result;
    } catch (err) {
      console.error('Failed to update topic:', err);
    }
  }, [execute, fetchTopics]);

  const deleteTopic = useCallback(async (id) => {
    try {
      const result = await execute(() => topicsApi.delete(id));
      if (result && result.success) {
        await fetchTopics();
      }
      return result;
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  }, [execute, fetchTopics]);

  const updateSlots = useCallback(async (id, increment) => {
    try {
      const result = await execute(() => topicsApi.updateSlots(id, increment));
      if (result && result.success) {
        await fetchTopics();
      }
      return result;
    } catch (err) {
      console.error('Failed to update slots:', err);
    }
  }, [execute, fetchTopics]);

  // Fetch topics only once on mount
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchTopics();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { topics, loading, error, fetchTopics, createTopic, updateTopic, deleteTopic, updateSlots };
}

// Audits hook
export function useAudits(advisorName = null) {
  const [audits, setAudits] = useState([]);
  const { loading, error, execute } = useAsyncOperation();
  const fetchedRef = useRef(false);

  const fetchAudits = useCallback(async () => {
    try {
      const url = advisorName
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/audits?advisor=${encodeURIComponent(advisorName)}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/audits`;
      const response = await fetch(url);
      const result = await response.json();
      if (result && result.success) {
        // Transform snake_case to camelCase
        const transformed = result.audits.map(a => ({
          id: a.id,
          studentId: a.student_id,
          studentName: a.student_name,
          topicTitle: a.topic_title,
          status: a.status
        }));
        setAudits(transformed);
      }
    } catch (err) {
      console.error('Failed to fetch audits:', err);
    }
  }, [execute, advisorName]);

  const createAudit = useCallback(async (auditData) => {
    try {
      const result = await execute(() => auditsApi.create(auditData));
      if (result && result.success) {
        await fetchAudits();
      }
      return result;
    } catch (err) {
      console.error('Failed to create audit:', err);
    }
  }, [execute, fetchAudits]);

  const updateAudit = useCallback(async (id, status) => {
    try {
      const result = await execute(() => auditsApi.update(id, status));
      if (result && result.success) {
        await fetchAudits();
      }
      return result;
    } catch (err) {
      console.error('Failed to update audit:', err);
    }
  }, [execute, fetchAudits]);

  useEffect(() => {
    fetchedRef.current = true;
    fetchAudits();
  }, [advisorName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { audits, loading, error, fetchAudits, createAudit, updateAudit };
}

// Task Books hook
export function useTaskBooks(advisorName = null) {
  const [taskBooks, setTaskBooks] = useState([]);
  const { loading, error, execute } = useAsyncOperation();
  const fetchedRef = useRef(false);

  const fetchTaskBooks = useCallback(async () => {
    try {
      const url = advisorName
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/taskbooks?advisor=${encodeURIComponent(advisorName)}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/taskbooks`;
      const response = await fetch(url);
      const result = await response.json();
      if (result && result.success) {
        // Transform snake_case to camelCase
        const transformed = result.taskBooks.map(t => ({
          id: t.id,
          studentName: t.student_name,
          topicTitle: t.topic_title,
          status: t.status
        }));
        setTaskBooks(transformed);
      }
    } catch (err) {
      console.error('Failed to fetch task books:', err);
    }
  }, [execute, advisorName]);

  const updateTaskBook = useCallback(async (id, status) => {
    try {
      const result = await execute(() => taskbooksApi.update(id, status));
      if (result && result.success) {
        await fetchTaskBooks();
      }
      return result;
    } catch (err) {
      console.error('Failed to update task book:', err);
    }
  }, [execute, fetchTaskBooks]);

  useEffect(() => {
    if (advisorName !== null || !fetchedRef.current) {
      fetchedRef.current = true;
      fetchTaskBooks();
    }
  }, [advisorName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { taskBooks, loading, error, fetchTaskBooks, updateTaskBook };
}

// Proposals hook
export function useProposals(studentId, advisorName = null) {
  const [proposal, setProposal] = useState({
    abstractText: '',
    proposalFile: null,
    history: [],
    comments: [],
    isSubmitted: false
  });
  const { loading, error, execute } = useAsyncOperation();
  const fetchedRef = useRef(false);

  const fetchProposal = useCallback(async () => {
    if (!studentId) return;
    try {
      const url = advisorName
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/proposals/${studentId}?advisor=${encodeURIComponent(advisorName)}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/proposals/${studentId}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result && result.success) {
        const p = result.proposal;
        setProposal({
          abstractText: p.abstract_text || p.abstractText || '',
          proposalFile: p.proposal_file || p.proposalFile || null,
          history: p.history || [],
          comments: p.comments || [],
          isSubmitted: p.is_submitted !== undefined ? p.is_submitted : (p.isSubmitted || false)
        });
      }
    } catch (err) {
      console.error('Failed to fetch proposal:', err);
    }
  }, [studentId, execute, advisorName]);

  const updateProposal = useCallback(async (updates) => {
    if (!studentId) return;
    try {
      const result = await execute(() => proposalsApi.createOrUpdate({
        studentId,
        abstractText: updates.abstractText !== undefined ? updates.abstractText : proposal.abstractText,
        proposalFile: updates.proposalFile !== undefined ? updates.proposalFile : proposal.proposalFile,
        isSubmitted: updates.isSubmitted !== undefined ? updates.isSubmitted : proposal.isSubmitted,
        history: updates.history || proposal.history,
        comments: updates.comments !== undefined ? updates.comments : proposal.comments
      }));
      if (result && result.success) {
        await fetchProposal();
      }
      return result;
    } catch (err) {
      console.error('Failed to update proposal:', err);
    }
  }, [studentId, proposal, execute, fetchProposal]);

  useEffect(() => {
    if (studentId) {
      fetchedRef.current = true;
      fetchProposal();
    }
  }, [studentId, advisorName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { proposal, loading, error, fetchProposal, updateProposal };
}

// Midterm hook
export function useMidterm(studentId, advisorName = null) {
  const [midterm, setMidterm] = useState({
    currentProgress: 0,
    explanation: '',
    attachments: [],
    comments: [],
    isSubmitted: false,
    lastSaved: null
  });
  const { loading, error, execute } = useAsyncOperation();
  const fetchedRef = useRef(false);

  const fetchMidterm = useCallback(async () => {
    if (!studentId) return;
    try {
      const url = advisorName
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/midterm/${studentId}?advisor=${encodeURIComponent(advisorName)}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/midterm/${studentId}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result && result.success) {
        // Transform snake_case to camelCase
        const m = result.midterm;
        setMidterm({
          currentProgress: m.current_progress || m.currentProgress || 0,
          explanation: m.explanation || '',
          attachments: m.attachments || [],
          comments: m.comments || [],
          isSubmitted: m.is_submitted !== undefined ? m.is_submitted : (m.isSubmitted || false),
          lastSaved: m.last_saved || m.lastSaved || null
        });
      }
    } catch (err) {
      console.error('Failed to fetch midterm:', err);
    }
  }, [studentId, execute, advisorName]);

  const updateMidterm = useCallback(async (updates) => {
    if (!studentId) return;
    try {
      const result = await execute(() => midtermApi.createOrUpdate({
        studentId,
        currentProgress: updates.currentProgress !== undefined ? updates.currentProgress : midterm.currentProgress,
        explanation: updates.explanation || midterm.explanation,
        attachments: updates.attachments || midterm.attachments,
        comments: updates.comments || midterm.comments,
        isSubmitted: updates.isSubmitted !== undefined ? updates.isSubmitted : midterm.isSubmitted,
        lastSaved: updates.lastSaved || midterm.lastSaved
      }));
      if (result && result.success) {
        await fetchMidterm();
      }
      return result;
    } catch (err) {
      console.error('Failed to update midterm:', err);
    }
  }, [studentId, midterm, execute, fetchMidterm]);

  const addComment = useCallback(async (advisorName, role, comment) => {
    if (!studentId) return;
    try {
      const result = await execute(() => midtermApi.addComment(studentId, { advisorName, role, comment }));
      if (result && result.success) {
        await fetchMidterm();
      }
      return result;
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  }, [studentId, execute, fetchMidterm]);

  useEffect(() => {
    if (studentId) {
      fetchedRef.current = true;
      fetchMidterm();
    }
  }, [studentId, advisorName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { midterm, loading, error, fetchMidterm, updateMidterm, addComment };
}

// Final submission hook
export function useFinal(studentId, advisorName = null) {
  const [finalSubmission, setFinalSubmission] = useState({
    chineseTitle: '',
    englishTitle: '',
    plagiarismRate: '0',
    plagiarismInstitution: '',
    plagiarismReport: null,
    finalThesisFile: null,
    instructorName: '',
    instructorDept: '',
    instructorAvatar: '',
    comments: [],
    status: '等待提交',
    deadlineCountdown: null
  });
  const { loading, error, execute } = useAsyncOperation();
  const fetchedRef = useRef(false);

  const fetchFinal = useCallback(async () => {
    if (!studentId) return;
    try {
      const url = advisorName
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/final/${studentId}?advisor=${encodeURIComponent(advisorName)}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/final/${studentId}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result && result.success) {
        const f = result.final;
        const validStatuses = ['等待提交', '审核中', '已通过', '已驳回'];
        const status = validStatuses.includes(f.status) ? f.status : '等待提交';
        setFinalSubmission({
          chineseTitle: f.chinese_title || f.chineseTitle || '',
          englishTitle: f.english_title || f.englishTitle || '',
          plagiarismRate: f.plagiarism_rate || f.plagiarismRate || '0',
          plagiarismInstitution: f.plagiarism_institution || f.plagiarismInstitution || '',
          plagiarismReport: f.plagiarism_report || f.plagiarismReport || null,
          finalThesisFile: f.final_thesis_file || f.finalThesisFile || null,
          instructorName: f.instructor_name || f.instructorName || '',
          instructorDept: f.instructor_dept || f.instructorDept || '',
          instructorAvatar: f.instructor_avatar || f.instructorAvatar || '',
          comments: f.comments || [],
          status,
          deadlineCountdown: f.deadline_countdown || f.deadlineCountdown || null
        });
      }
    } catch (err) {
      console.error('Failed to fetch final:', err);
    }
  }, [studentId, execute, advisorName]);

  const updateFinal = useCallback(async (updates) => {
    if (!studentId) return;
    try {
      const result = await execute(() => finalApi.createOrUpdate({
        studentId,
        ...updates
      }));
      if (result && result.success) {
        await fetchFinal();
      }
      return result;
    } catch (err) {
      console.error('Failed to update final:', err);
    }
  }, [studentId, execute, fetchFinal]);

  useEffect(() => {
    if (studentId) {
      fetchedRef.current = true;
      fetchFinal();
    }
  }, [studentId, advisorName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { finalSubmission, loading, error, fetchFinal, updateFinal };
}

// Batches hook
export function useBatches() {
  const [batches, setBatches] = useState([]);
  const { loading, error, execute } = useAsyncOperation();
  const fetchedRef = useRef(false);

  const fetchBatches = useCallback(async () => {
    try {
      const result = await execute(() => batchesApi.getAll());
      if (result && result.success) {
        const transformed = result.batches.map(b => ({
          id: b.id,
          name: b.name,
          timeline: b.timeline,
          studentCount: b.student_count,
          status: b.status
        }));
        setBatches(transformed);
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  }, [execute]);

  const createBatch = useCallback(async (batchData) => {
    try {
      const result = await execute(() => batchesApi.create({
        name: batchData.name,
        timeline: batchData.timeline,
        studentCount: batchData.studentCount || 0
      }));
      if (result && result.success) {
        await fetchBatches();
      }
      return result;
    } catch (err) {
      console.error('Failed to create batch:', err);
    }
  }, [execute, fetchBatches]);

  const deleteBatch = useCallback(async (id) => {
    try {
      const result = await execute(() => batchesApi.delete(id));
      if (result && result.success) {
        await fetchBatches();
      }
      return result;
    } catch (err) {
      console.error('Failed to delete batch:', err);
    }
  }, [execute, fetchBatches]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchBatches();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { batches, loading, error, fetchBatches, createBatch, deleteBatch };
}

// Users hook
export function useUsers(role = null) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, students: 0, teachers: 0, admins: 0 });
  const { loading, error, execute } = useAsyncOperation();
  const fetchedRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    try {
      const result = await execute(() => usersApi.getAll(role));
      if (result && result.success) {
        const transformed = result.users.map(u => ({
          id: u.id,
          userId: u.user_id,
          name: u.name,
          email: u.email,
          department: u.department,
          role: u.role,
          avatar: u.avatar,
          createdAt: u.created_at
        }));
        setUsers(transformed);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [execute, role]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await execute(() => usersApi.getStats());
      if (result && result.success) {
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [execute]);

  const createUser = useCallback(async (userData) => {
    try {
      const result = await execute(() => usersApi.create(userData));
      if (result && result.success) {
        await fetchUsers();
        await fetchStats();
      }
      return result;
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  }, [execute, fetchUsers, fetchStats]);

  const deleteUser = useCallback(async (id) => {
    try {
      const result = await execute(() => usersApi.delete(id));
      if (result && result.success) {
        await fetchUsers();
        await fetchStats();
      }
      return result;
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  }, [execute, fetchUsers, fetchStats]);

  const updateUser = useCallback(async (id, updates) => {
    try {
      const result = await execute(() => usersApi.update(id, updates));
      if (result && result.success) {
        await fetchUsers();
        await fetchStats();
      }
      return result;
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  }, [execute, fetchUsers, fetchStats]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchUsers();
      fetchStats();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { users, stats, loading, error, fetchUsers, fetchStats, createUser, deleteUser, updateUser };
}
