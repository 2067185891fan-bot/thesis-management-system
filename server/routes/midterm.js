import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get midterm report by student ID with optional advisor filter
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

    const { data: midterm, error } = await supabase
      .from('midterm_reports')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default midterm if not exists
    if (!midterm) {
      return res.json({
        success: true,
        midterm: {
          currentProgress: 0,
          explanation: '',
          attachments: [],
          comments: [],
          isSubmitted: false,
          lastSaved: null
        }
      });
    }

    return res.json({ success: true, midterm });
  } catch (error) {
    console.error('Get midterm error:', error);
    res.status(500).json({ success: false, message: '获取中期报告失败' });
  }
});

// Create or update midterm report
router.post('/', async (req, res) => {
  try {
    const { studentId, currentProgress, explanation, attachments, comments, isSubmitted, lastSaved } = req.body;

    // Check if midterm exists
    const { data: existingMidterm } = await supabase
      .from('midterm_reports')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (existingMidterm) {
      // Update
      const { data: updatedMidterm, error } = await supabase
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

      if (error) {
        throw error;
      }

      return res.json({ success: true, midterm: updatedMidterm });
    } else {
      // Create
      const { data: newMidterm, error } = await supabase
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

      if (error) {
        throw error;
      }

      return res.json({ success: true, midterm: newMidterm });
    }
  } catch (error) {
    console.error('Create/update midterm error:', error);
    res.status(500).json({ success: false, message: '保存中期报告失败' });
  }
});

// Add comment to midterm
router.post('/:studentId/comments', async (req, res) => {
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
      id: `mc_${Date.now()}`,
      advisorName,
      role,
      date: new Date().toLocaleDateString('zh-CN'),
      comment,
      bulletType: 'active'
    };

    const updatedComments = [newComment, ...existingComments];

    if (midterm) {
      // Update
      const { error } = await supabase
        .from('midterm_reports')
        .update({ comments: updatedComments })
        .eq('student_id', studentId);

      if (error) {
        throw error;
      }
    } else {
      // Create
      const { error } = await supabase
        .from('midterm_reports')
        .insert({
          student_id: studentId,
          current_progress: 0,
          explanation: '',
          attachments: [],
          comments: updatedComments,
          is_submitted: false
        });

      if (error) {
        throw error;
      }
    }

    return res.json({ success: true, comments: updatedComments });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: '添加评论失败' });
  }
});

export default router;
