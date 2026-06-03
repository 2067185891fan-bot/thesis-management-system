import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get all topics
router.get('/', async (req, res) => {
  try {
    const { data: topics, error } = await supabase
      .from('thesis_topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ success: true, topics });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ success: false, message: '获取题目失败' });
  }
});

// Create topic
router.post('/', async (req, res) => {
  try {
    const { title, abstract, category, totalSlots, advisorName, advisorTitle, advisorDept, advisorAvatar } = req.body;

    const { data: newTopic, error } = await supabase
      .from('thesis_topics')
      .insert({
        title,
        abstract,
        category,
        occupied_slots: 0,
        total_slots: totalSlots || 3,
        advisor_name: advisorName,
        advisor_title: advisorTitle,
        advisor_dept: advisorDept,
        advisor_avatar: advisorAvatar
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({ success: true, topic: newTopic });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ success: false, message: '创建题目失败' });
  }
});

// Update topic
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: updatedTopic, error } = await supabase
      .from('thesis_topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({ success: true, topic: updatedTopic });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ success: false, message: '更新题目失败' });
  }
});

// Delete topic
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('thesis_topics')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ success: false, message: '删除题目失败' });
  }
});

// Update occupied slots
router.put('/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { increment } = req.body; // true to increment, false to decrement

    const { data: topic, error: fetchError } = await supabase
      .from('thesis_topics')
      .select('occupied_slots, total_slots')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const newSlots = increment
      ? Math.min(topic.total_slots, topic.occupied_slots + 1)
      : Math.max(0, topic.occupied_slots - 1);

    const { data: updatedTopic, error } = await supabase
      .from('thesis_topics')
      .update({ occupied_slots: newSlots })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({ success: true, topic: updatedTopic });
  } catch (error) {
    console.error('Update slots error:', error);
    res.status(500).json({ success: false, message: '更新名额失败' });
  }
});

export default router;
