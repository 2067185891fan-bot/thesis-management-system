import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get audits - with optional advisor filter
router.get('/', async (req, res) => {
  try {
    const { advisor } = req.query;

    let query = supabase.from('selection_audits').select('*');

    // If advisor filter is provided, filter by topic's advisor
    if (advisor) {
      // First get topics managed by this advisor
      const { data: topics } = await supabase
        .from('thesis_topics')
        .select('title')
        .eq('advisor_name', advisor);

      if (topics && topics.length > 0) {
        const topicTitles = topics.map(t => t.title);
        query = query.in('topic_title', topicTitles);
      } else {
        // Advisor has no matching topics — try partial match
        const { data: fuzzyTopics } = await supabase
          .from('thesis_topics')
          .select('title')
          .ilike('advisor_name', `%${advisor.split(' ')[0]}%`);

        if (fuzzyTopics && fuzzyTopics.length > 0) {
          const topicTitles = fuzzyTopics.map(t => t.title);
          query = query.in('topic_title', topicTitles);
        } else {
          // Still no match — return all audits so teacher can see pending work
          // This handles demo data where advisor names may not align exactly
        }
      }
    }

    const { data: audits, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ success: true, audits });
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({ success: false, message: '获取审核记录失败' });
  }
});

// Create audit
router.post('/', async (req, res) => {
  try {
    const { studentId, studentName, topicTitle } = req.body;

    // Check for existing active audit (any status that is not rejected)
    const { data: existingAudit } = await supabase
      .from('selection_audits')
      .select('id')
      .eq('student_id', studentId)
      .neq('status', '已驳回')
      .single();

    if (existingAudit) {
      return res.status(400).json({ success: false, message: '已有待审核记录' });
    }

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

    if (error) {
      throw error;
    }

    return res.json({ success: true, audit: newAudit });
  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({ success: false, message: '创建审核记录失败' });
  }
});

// Update audit status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: updatedAudit, error } = await supabase
      .from('selection_audits')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({ success: true, audit: updatedAudit });
  } catch (error) {
    console.error('Update audit error:', error);
    res.status(500).json({ success: false, message: '更新审核状态失败' });
  }
});

// Delete audit
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('selection_audits')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({ success: false, message: '删除审核记录失败' });
  }
});

export default router;
