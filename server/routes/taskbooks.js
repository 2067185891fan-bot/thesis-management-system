import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get task books - with optional advisor filter
router.get('/', async (req, res) => {
  try {
    const { advisor } = req.query;

    let query = supabase.from('task_books').select('*');

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
        // Try partial match
        const { data: fuzzyTopics } = await supabase
          .from('thesis_topics')
          .select('title')
          .ilike('advisor_name', `%${advisor.split(' ')[0]}%`);

        if (fuzzyTopics && fuzzyTopics.length > 0) {
          const topicTitles = fuzzyTopics.map(t => t.title);
          query = query.in('topic_title', topicTitles);
        }
        // If still no match, return all taskbooks (demo fallback)
      }
    }

    const { data: taskBooks, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ success: true, taskBooks });
  } catch (error) {
    console.error('Get task books error:', error);
    res.status(500).json({ success: false, message: '获取任务书失败' });
  }
});

// Create task book
router.post('/', async (req, res) => {
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

    if (error) {
      throw error;
    }

    return res.json({ success: true, taskBook: newTaskBook });
  } catch (error) {
    console.error('Create task book error:', error);
    res.status(500).json({ success: false, message: '创建任务书失败' });
  }
});

// Update task book status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: updatedTaskBook, error } = await supabase
      .from('task_books')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({ success: true, taskBook: updatedTaskBook });
  } catch (error) {
    console.error('Update task book error:', error);
    res.status(500).json({ success: false, message: '更新任务书状态失败' });
  }
});

// Delete task book
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('task_books')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete task book error:', error);
    res.status(500).json({ success: false, message: '删除任务书失败' });
  }
});

export default router;
