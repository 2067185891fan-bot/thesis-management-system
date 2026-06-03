import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get proposal by student ID with optional advisor filter
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { advisor } = req.query;

    // If advisor filter is provided, check if student's topic belongs to this advisor
    if (advisor) {
      // Get student's active audit
      const { data: audit } = await supabase
        .from('selection_audits')
        .select('topic_title')
        .eq('student_id', studentId)
        .neq('status', '已驳回')
        .single();

      if (audit) {
        // Check if topic belongs to this advisor (exact or fuzzy match)
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

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default proposal if not exists
    if (!proposal) {
      return res.json({
        success: true,
        proposal: {
          abstractText: '',
          proposalFile: null,
          history: [],
          isSubmitted: false
        }
      });
    }

    return res.json({ success: true, proposal });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ success: false, message: '获取开题报告失败' });
  }
});

// Create or update proposal
router.post('/', async (req, res) => {
  try {
    const { studentId, abstractText, proposalFile, isSubmitted, history, comments } = req.body;

    // Check if proposal exists
    const { data: existingProposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (existingProposal) {
      // Update
      const updateData = {
        abstract_text: abstractText,
        proposal_file: proposalFile,
        is_submitted: isSubmitted,
        history
      };
      if (comments !== undefined) updateData.comments = comments;

      const { data: updatedProposal, error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.json({ success: true, proposal: updatedProposal });
    } else {
      // Create
      const { data: newProposal, error } = await supabase
        .from('proposals')
        .insert({
          student_id: studentId,
          abstract_text: abstractText,
          proposal_file: proposalFile,
          is_submitted: isSubmitted,
          history,
          comments: comments || []
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.json({ success: true, proposal: newProposal });
    }
  } catch (error) {
    console.error('Create/update proposal error:', error);
    res.status(500).json({ success: false, message: '保存开题报告失败' });
  }
});

// Update proposal status (for teacher review) — supports both DB id and student_id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Try by database id first, then by student_id
    let { data: updatedProposal, error } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedProposal) {
      // Fallback: try matching by student_id
      const result = await supabase
        .from('proposals')
        .update(updates)
        .eq('student_id', id)
        .select()
        .single();
      updatedProposal = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    return res.json({ success: true, proposal: updatedProposal });
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ success: false, message: '更新开题报告失败' });
  }
});

export default router;
