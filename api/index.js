import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Helper function to create routes inline for Vercel

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Check registered users
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', identifier)
      .single();

    if (error || !user) {
      // Check default roles
      let role = 'student';
      if (identifier.startsWith('ADMIN') || identifier.includes('admin')) {
        role = 'admin';
      } else if (identifier.startsWith('ACAD') || identifier.includes('teacher')) {
        role = 'teacher';
      }

      return res.json({
        success: true,
        user: {
          id: identifier,
          name: role === 'admin' ? '陈教授' : role === 'teacher' ? 'Dr. Julian Sterling' : '陈伟',
          department: role === 'admin' ? '学术教务中心' : '计算机科学学院',
          avatar: role === 'teacher' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18' : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRVogLufdW1c6_GNQ-6vGfnCHhz6Of2v7k1If62Wn8DA27cu0SDpl4OMwgf24okyqvGMi53fEQy4zrk6Iqyp3gd_-WcaYXkah0ykCTagpgnS0e-IYypFRoD5NHSNhueMvfvi39iwAyfyMxwP43ILpestkPKELHPMYhdPp8VOotIz5rW5v_NJUyg6Mxoh13BvGIavEHgXVJ_gnaucnfVMrVgBG6Qvwmpwz20iMgZY8VR01YLwkwyRR3XDFLBmEDwvNQCwQJ6m07Lak',
          role
        }
      });
    }

    // Verify password
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    return res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        department: user.department,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { id, name, email, department, role, password, avatar } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', id)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'ID已被占用' });
    }

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        user_id: id,
        name,
        email,
        department,
        role,
        password,
        avatar
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      user: {
        id: newUser.user_id,
        name: newUser.name,
        department: newUser.department,
        avatar: newUser.avatar,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// Topics routes
app.get('/api/topics', async (req, res) => {
  try {
    const { data: topics, error } = await supabase
      .from('thesis_topics')
      .select('*');

    if (error) throw error;

    return res.json({ success: true, topics });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ success: false, message: '获取课题失败' });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const topicData = req.body;

    const { data: newTopic, error } = await supabase
      .from('thesis_topics')
      .insert({
        title: topicData.title,
        abstract: topicData.abstract,
        category: topicData.category,
        occupied_slots: topicData.occupiedSlots || 0,
        total_slots: topicData.totalSlots || 3,
        advisor_name: topicData.advisorName,
        advisor_title: topicData.advisorTitle,
        advisor_dept: topicData.advisorDept,
        advisor_avatar: topicData.advisorAvatar
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, topic: newTopic });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ success: false, message: '创建课题失败' });
  }
});

app.put('/api/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: updatedTopic, error } = await supabase
      .from('thesis_topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, topic: updatedTopic });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ success: false, message: '更新课题失败' });
  }
});

app.delete('/api/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('thesis_topics')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ success: false, message: '删除课题失败' });
  }
});

app.put('/api/topics/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { increment } = req.body;

    // Get current topic
    const { data: topic, error: fetchError } = await supabase
      .from('thesis_topics')
      .select('occupied_slots')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newOccupied = increment
      ? (topic.occupied_slots || 0) + 1
      : Math.max(0, (topic.occupied_slots || 0) - 1);

    const { data: updatedTopic, error } = await supabase
      .from('thesis_topics')
      .update({ occupied_slots: newOccupied })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, topic: updatedTopic });
  } catch (error) {
    console.error('Update slots error:', error);
    res.status(500).json({ success: false, message: '更新名额失败' });
  }
});

// Audits routes
app.get('/api/audits', async (req, res) => {
  try {
    const { advisor } = req.query;

    let query = supabase.from('selection_audits').select('*');

    if (advisor) {
      // We need to filter by topic's advisor_name
      // First get topics by this advisor
      const { data: topics } = await supabase
        .from('thesis_topics')
        .select('title')
        .eq('advisor_name', advisor);

      if (topics && topics.length > 0) {
        const topicTitles = topics.map(t => t.title);
        query = query.in('topic_title', topicTitles);
      }
      // If no topics match, fall through and return all audits (demo fallback)
    }

    const { data: audits, error } = await query;

    if (error) throw error;

    return res.json({ success: true, audits });
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({ success: false, message: '获取审核失败' });
  }
});

app.post('/api/audits', async (req, res) => {
  try {
    const { studentId, studentName, topicTitle } = req.body;

    const { data: newAudit, error } = await supabase
      .from('selection_audits')
      .insert({
        student_id: studentId,
        student_name: studentName,
        topic_title: topicTitle,
        status: '待审核'
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, audit: newAudit });
  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({ success: false, message: '创建审核失败' });
  }
});

app.put('/api/audits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: updatedAudit, error } = await supabase
      .from('selection_audits')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, audit: updatedAudit });
  } catch (error) {
    console.error('Update audit error:', error);
    res.status(500).json({ success: false, message: '更新审核失败' });
  }
});

// Taskbooks routes
app.get('/api/taskbooks', async (req, res) => {
  try {
    const { advisor } = req.query;

    let query = supabase.from('task_books').select('*');

    if (advisor) {
      // Filter by topic's advisor
      const { data: topics } = await supabase
        .from('thesis_topics')
        .select('title')
        .eq('advisor_name', advisor);

      if (topics && topics.length > 0) {
        const topicTitles = topics.map(t => t.title);
        query = query.in('topic_title', topicTitles);
      }
      // If no topics match, fall through and return all taskbooks (demo fallback)
    }

    const { data: taskBooks, error } = await query;

    if (error) throw error;

    return res.json({ success: true, taskBooks });
  } catch (error) {
    console.error('Get taskbooks error:', error);
    res.status(500).json({ success: false, message: '获取任务书失败' });
  }
});

app.post('/api/taskbooks', async (req, res) => {
  try {
    const { studentName, topicTitle } = req.body;

    const { data: newTaskBook, error } = await supabase
      .from('task_books')
      .insert({
        student_name: studentName,
        topic_title: topicTitle,
        status: '待提交'
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, taskBook: newTaskBook });
  } catch (error) {
    console.error('Create taskbook error:', error);
    res.status(500).json({ success: false, message: '创建任务书失败' });
  }
});

app.put('/api/taskbooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: updatedTaskBook, error } = await supabase
      .from('task_books')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, taskBook: updatedTaskBook });
  } catch (error) {
    console.error('Update taskbook error:', error);
    res.status(500).json({ success: false, message: '更新任务书失败' });
  }
});

// Proposals routes
app.get('/api/proposals/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.json({
      success: true,
      proposal: proposal || {
        student_id: studentId,
        abstract_text: '',
        proposal_file: null,
        history: [],
        comments: [],
        is_submitted: false
      }
    });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ success: false, message: '获取开题报告失败' });
  }
});

app.post('/api/proposals', async (req, res) => {
  try {
    const { studentId, abstractText, proposalFile, isSubmitted, history, comments } = req.body;

    // Check if proposal exists
    const { data: existing } = await supabase
      .from('proposals')
      .select('id')
      .eq('student_id', studentId)
      .single();

    let result;

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('proposals')
        .update({
          abstract_text: abstractText,
          proposal_file: proposalFile,
          is_submitted: isSubmitted,
          history,
          comments
        })
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          student_id: studentId,
          abstract_text: abstractText,
          proposal_file: proposalFile,
          is_submitted: isSubmitted,
          history,
          comments
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.json({ success: true, proposal: result });
  } catch (error) {
    console.error('Upsert proposal error:', error);
    res.status(500).json({ success: false, message: '更新开题报告失败' });
  }
});

// Midterm routes
app.get('/api/midterm/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: midterm, error } = await supabase
      .from('midterm_reports')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.json({
      success: true,
      midterm: midterm || {
        student_id: studentId,
        current_progress: 0,
        explanation: '',
        attachments: [],
        comments: [],
        is_submitted: false,
        last_saved: null
      }
    });
  } catch (error) {
    console.error('Get midterm error:', error);
    res.status(500).json({ success: false, message: '获取中期报告失败' });
  }
});

app.post('/api/midterm', async (req, res) => {
  try {
    const { studentId, currentProgress, explanation, attachments, comments, isSubmitted, lastSaved } = req.body;

    // Check if exists
    const { data: existing } = await supabase
      .from('midterm_reports')
      .select('id')
      .eq('student_id', studentId)
      .single();

    let result;

    if (existing) {
      const { data, error } = await supabase
        .from('midterm_reports')
        .update({
          current_progress: currentProgress,
          explanation,
          attachments,
          comments,
          is_submitted: isSubmitted,
          last_saved: lastSaved
        })
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('midterm_reports')
        .insert({
          student_id: studentId,
          current_progress: currentProgress,
          explanation,
          attachments,
          comments,
          is_submitted: isSubmitted,
          last_saved: lastSaved
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.json({ success: true, midterm: result });
  } catch (error) {
    console.error('Upsert midterm error:', error);
    res.status(500).json({ success: false, message: '更新中期报告失败' });
  }
});

app.post('/api/midterm/:studentId/comments', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { advisorName, role, comment } = req.body;

    // Get existing midterm
    const { data: midterm } = await supabase
      .from('midterm_reports')
      .select('comments')
      .eq('student_id', studentId)
      .single();

    const existingComments = midterm?.comments || [];
    const newComment = {
      id: Date.now().toString(),
      advisorName,
      role,
      comment,
      timestamp: new Date().toISOString()
    };

    const updatedComments = [...existingComments, newComment];

    // Update
    const { data, error } = await supabase
      .from('midterm_reports')
      .update({ comments: updatedComments })
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, midterm: data });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: '添加评论失败' });
  }
});

// Final routes
app.get('/api/final/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: finalSubmission, error } = await supabase
      .from('final_submissions')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.json({
      success: true,
      final: finalSubmission || {
        student_id: studentId,
        chinese_title: '',
        english_title: '',
        plagiarism_rate: '0',
        plagiarism_institution: '中国知网 (CNKI)',
        plagiarism_report: null,
        final_thesis_file: null,
        instructor_name: '李教授',
        instructor_dept: '计算机科学学院',
        instructor_avatar: '',
        comments: [],
        status: '等待提交'
      }
    });
  } catch (error) {
    console.error('Get final error:', error);
    res.status(500).json({ success: false, message: '获取终稿失败' });
  }
});

app.post('/api/final', async (req, res) => {
  try {
    const { studentId, ...updates } = req.body;

    // Check if exists
    const { data: existing } = await supabase
      .from('final_submissions')
      .select('id')
      .eq('student_id', studentId)
      .single();

    let result;

    if (existing) {
      const { data, error } = await supabase
        .from('final_submissions')
        .update(updates)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('final_submissions')
        .insert({
          student_id: studentId,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.json({ success: true, final: result });
  } catch (error) {
    console.error('Upsert final error:', error);
    res.status(500).json({ success: false, message: '更新终稿失败' });
  }
});

// Batches routes
app.get('/api/batches', async (req, res) => {
  try {
    const { data: batches, error } = await supabase
      .from('academic_batches')
      .select('*');

    if (error) throw error;

    return res.json({ success: true, batches });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ success: false, message: '获取批次失败' });
  }
});

app.post('/api/batches', async (req, res) => {
  try {
    const { name, timeline, studentCount } = req.body;

    const { data: newBatch, error } = await supabase
      .from('academic_batches')
      .insert({
        name,
        timeline,
        student_count: studentCount || 0,
        status: '进行中'
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, batch: newBatch });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ success: false, message: '创建批次失败' });
  }
});

app.delete('/api/batches/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('academic_batches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ success: false, message: '删除批次失败' });
  }
});

// Users routes
app.get('/api/users', async (req, res) => {
  try {
    const { role } = req.query;

    let query = supabase.from('users').select('*');

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    // Remove password from response
    const safeUsers = users.map(({ password, ...user }) => user);

    return res.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: '获取用户失败' });
  }
});

app.get('/api/users/stats', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('role');

    if (error) throw error;

    const stats = {
      total: users.length,
      students: users.filter(u => u.role === 'student').length,
      teachers: users.filter(u => u.role === 'teacher').length,
      admins: users.filter(u => u.role === 'admin').length
    };

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, name, email, department, role, password, avatar } = req.body;

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        user_id: id,
        name,
        email,
        department,
        role,
        password,
        avatar
      })
      .select()
      .single();

    if (error) throw error;

    const { password: _, ...safeUser } = newUser;

    return res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: '创建用户失败' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', id)
      .select()
      .single();

    if (error) throw error;

    const { password: _, ...safeUser } = updatedUser;

    return res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: '更新用户失败' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', id);

    if (error) throw error;

    return res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed data endpoint
app.post('/api/seed', async (req, res) => {
  try {
    const NEW_TOPICS = [
      {
        title: '基于大语言模型的智能代码审查系统',
        abstract: '利用大语言模型对代码提交进行自动化审查，检测潜在缺陷、安全漏洞和代码风格问题，提升软件工程质量。',
        category: '人工智能与数据科学',
        occupied_slots: 0,
        total_slots: 3,
        advisor_name: '王建国 教授',
        advisor_title: '教授',
        advisor_dept: '计算机科学学院',
        advisor_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18'
      },
      {
        title: '多模态情感分析在电商评论中的应用',
        abstract: '融合文本、图片和视频多模态信息，构建电商用户评论的情感分析模型，为商家提供精准的用户反馈洞察。',
        category: '人工智能与数据科学',
        occupied_slots: 0,
        total_slots: 2,
        advisor_name: '刘思远 副教授',
        advisor_title: '副教授',
        advisor_dept: '信息学院',
        advisor_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGE0VDco0Mvlo0McJLMnnrNdx71l0ZAheVcz9pNHrlT9EBk4tGslYg9TjmP-MwIyuDEDrG8NQxpzvlOsEr248n85ZU72CdQs101qW8zAbC9c8t-ubvQzd_cdQ57GhbFnpVBmHMUlREvjPEsf3GQjCC0TWZcd3IiKbZd2f_a7SBL2ha9OfAMAd1GzCYbmoy-9Qqs0KY4p2TAnmXgDlqkGx0TigV6mC3qAFWSuE5nYOjBqhIh3Kq7Xkzr-djHm2LFSgzGZjX7pJ8KH8'
      },
      {
        title: '微服务架构下的分布式链路追踪优化',
        abstract: '针对微服务架构设计低开销的分布式链路追踪方案，通过采样策略和数据压缩降低性能损耗，提升系统可观测性。',
        category: '工程与科技',
        occupied_slots: 0,
        total_slots: 4,
        advisor_name: '赵明辉 教授',
        advisor_title: '教授',
        advisor_dept: '软件工程学院',
        advisor_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcl45KydeK0BXI4U8BjirUv71LfaTFWyfqCgcpdsfmXJMsS_QmvarL7mTeu43ZOKcVozauRio7DSggbFjYeCw0jCNdUeN3YbfHhpFcR70MwFpEFIwwCqIcypMM8knnoVG-g4RcA0r6SpWfant8SKQ7U8LOmEkooXjvFNl9u_IZFO7y52U2wmccEzF5jfvl5Wg7J6rfhIvbRGVNx-w12HETMj0VYetvBgfbr0NY1RF0Jq8E-OgkYQ4ow9evUg_qVVAn_tFkVuKnjg'
      }
    ];

    const NEW_TEACHERS = [
      {
        user_id: 'ACAD-WANG-01',
        name: '王建国 教授',
        email: 'wangjianguo@university.cn',
        department: '计算机科学学院',
        role: 'teacher',
        password: 'password123',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18'
      },
      {
        user_id: 'ACAD-LIU-02',
        name: '刘思远 副教授',
        email: 'liusiyuan@university.cn',
        department: '信息学院',
        role: 'teacher',
        password: 'password123',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGE0VDco0Mvlo0McJLMnnrNdx71l0ZAheVcz9pNHrlT9EBk4tGslYg9TjmP-MwIyuDEDrG8NQxpzvlOsEr248n85ZU72CdQs101qW8zAbC9c8t-ubvQzd_cdQ57GhbFnpVBmHMUlREvjPEsf3GQjCC0TWZcd3IiKbZd2f_a7SBL2ha9OfAMAd1GzCYbmoy-9Qqs0KY4p2TAnmXgDlqkGx0TigV6mC3qAFWSuE5nYOjBqhIh3Kq7Xkzr-djHm2LFSgzGZjX7pJ8KH8'
      },
      {
        user_id: 'ACAD-ZHAO-03',
        name: '赵明辉 教授',
        email: 'zhaominghui@university.cn',
        department: '软件工程学院',
        role: 'teacher',
        password: 'password123',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcl45KydeK0BXI4U8BjirUv71LfaTFWyfqCgcpdsfmXJMsS_QmvarL7mTeu43ZOKcVozauRio7DSggbFjYeCw0jCNdUeN3YbfHhpFcR70MwFpEFIwwCqIcypMM8knnoVG-g4RcA0r6SpWfant8SKQ7U8LOmEkooXjvFNl9u_IZFO7y52U2wmccEzF5jfvl5Wg7J6rfhIvbRGVNx-w12HETMj0VYetvBgfbr0NY1RF0Jq8E-OgkYQ4ow9evUg_qVVAn_tFkVuKnjg'
      }
    ];

    const results = { teachers: [], topics: [] };

    // Insert teachers
    for (const teacher of NEW_TEACHERS) {
      const { data: existing } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', teacher.user_id)
        .single();

      if (!existing) {
        const { error } = await supabase.from('users').insert(teacher);
        if (!error) {
          results.teachers.push(teacher.user_id);
        }
      }
    }

    // Insert topics
    for (const topic of NEW_TOPICS) {
      const { data: existing } = await supabase
        .from('thesis_topics')
        .select('id')
        .eq('title', topic.title)
        .single();

      if (!existing) {
        const { error } = await supabase.from('thesis_topics').insert(topic);
        if (!error) {
          results.topics.push(topic.title);
        }
      }
    }

    return res.json({
      success: true,
      message: '种子数据初始化完成',
      added: {
        teachers: results.teachers.length,
        topics: results.topics.length
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: '初始化失败' });
  }
});

export default app;
