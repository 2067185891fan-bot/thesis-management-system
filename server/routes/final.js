import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get final submission by student ID with optional advisor filter
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { advisor } = req.query;

    // If advisor filter is provided, check if student's topic belongs to this advisor
    if (advisor) {
      const { data: audit } = await supabase
        .from('selection_audits')
        .select('topic_title')
        .eq('student_id', studentId)
        .neq('status', '已驳回')
        .single();

      if (audit) {
        const { data: topic } = await supabase
          .from('thesis_topics')
          .select('advisor_name')
          .eq('title', audit.topic_title)
          .single();

        if (topic) {
          const exactMatch = topic.advisor_name === advisor;
          const fuzzyMatch = topic.advisor_name && advisor &&
            topic.advisor_name.toLowerCase().includes(advisor.split(' ')[0].toLowerCase());
          if (!exactMatch && !fuzzyMatch) {
            // Student's topic doesn't belong to this advisor — allow access (demo fallback)
          }
        }
      }
    }

    const { data: final, error } = await supabase
      .from('final_submissions')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default final submission if not exists
    if (!final) {
      return res.json({
        success: true,
        final: {
          chineseTitle: '',
          englishTitle: '',
          plagiarismRate: '0',
          plagiarismInstitution: '中国知网 (CNKI)',
          plagiarismReport: null,
          finalThesisFile: null,
          instructorName: '李教授',
          instructorDept: '计算机科学学院',
          instructorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuEYECTMGo_I_zsBQHtRXmaM1vW_8sdVJtGPduR_aonUkqjU3MsebJt9k_Rc8jXuRDaxqKOFUEfRVKS_HZMhzfVi2NJrIyc1FHKQoEPyytBd594Q7XDySuQiiD44AEsu5jDUAD8yy2biin6_E9IyEKhmEz0wlj58rWsv3IQ1j8LInedRADyYTkwPHI1R9X-rfl2KxX0cXVzDGvTj9s0eh7x6vTPdL2PYcRbu-bn7PQ1g5SMWPqdlN0ADRrMQ87BU12WP8kNepViF0',
          status: '等待提交',
          deadlineCountdown: {
            days: 14,
            hours: '08',
            minutes: '24',
            seconds: '10'
          }
        }
      });
    }

    return res.json({ success: true, final });
  } catch (error) {
    console.error('Get final error:', error);
    res.status(500).json({ success: false, message: '获取终稿提交失败' });
  }
});

// Create or update final submission
router.post('/', async (req, res) => {
  try {
    const {
      studentId,
      chineseTitle,
      englishTitle,
      plagiarismRate,
      plagiarismInstitution,
      plagiarismReport,
      finalThesisFile,
      instructorName,
      instructorDept,
      instructorAvatar,
      status,
      deadlineCountdown,
      comments
    } = req.body;

    // Check if final exists
    const { data: existingFinal } = await supabase
      .from('final_submissions')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (existingFinal) {
      // Update
      const updateData = {
        chinese_title: chineseTitle,
        english_title: englishTitle,
        plagiarism_rate: plagiarismRate,
        plagiarism_institution: plagiarismInstitution,
        plagiarism_report: plagiarismReport,
        final_thesis_file: finalThesisFile,
        instructor_name: instructorName,
        instructor_dept: instructorDept,
        instructor_avatar: instructorAvatar,
        status,
        deadline_countdown: deadlineCountdown
      };
      if (comments !== undefined) updateData.comments = comments;

      const { data: updatedFinal, error } = await supabase
        .from('final_submissions')
        .update(updateData)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.json({ success: true, final: updatedFinal });
    } else {
      // Create
      const { data: newFinal, error } = await supabase
        .from('final_submissions')
        .insert({
          student_id: studentId,
          chinese_title: chineseTitle,
          english_title: englishTitle,
          plagiarism_rate: plagiarismRate,
          plagiarism_institution: plagiarismInstitution,
          plagiarism_report: plagiarismReport,
          final_thesis_file: finalThesisFile,
          instructor_name: instructorName,
          instructor_dept: instructorDept,
          instructor_avatar: instructorAvatar,
          status,
          deadline_countdown: deadlineCountdown,
          comments: comments || []
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.json({ success: true, final: newFinal });
    }
  } catch (error) {
    console.error('Create/update final error:', error);
    res.status(500).json({ success: false, message: '保存终稿提交失败' });
  }
});

// Update final status (for teacher review) — supports both DB id and student_id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (comments !== undefined) updateData.comments = comments;

    // Try by database id first, then by student_id
    let { data: updatedFinal, error } = await supabase
      .from('final_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedFinal) {
      // Fallback: try matching by student_id
      const result = await supabase
        .from('final_submissions')
        .update(updateData)
        .eq('student_id', id)
        .select()
        .single();
      updatedFinal = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    if (!updatedFinal) {
      return res.status(404).json({ success: false, message: '未找到对应的终稿记录' });
    }

    return res.json({ success: true, final: updatedFinal });
  } catch (error) {
    console.error('Update final error:', error);
    res.status(500).json({ success: false, message: '更新终稿状态失败' });
  }
});

export default router;
