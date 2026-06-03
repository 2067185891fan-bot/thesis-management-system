import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get all batches
router.get('/', async (req, res) => {
  try {
    const { data: batches, error } = await supabase
      .from('academic_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, batches });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ success: false, message: '获取批次失败' });
  }
});

// Create batch
router.post('/', async (req, res) => {
  try {
    const { name, timeline, studentCount } = req.body;

    const { data: newBatch, error } = await supabase
      .from('academic_batches')
      .insert({
        name,
        timeline,
        student_count: studentCount || 0,
        status: '即将开始'
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

// Update batch
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: updatedBatch, error } = await supabase
      .from('academic_batches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, batch: updatedBatch });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ success: false, message: '更新批次失败' });
  }
});

// Delete batch
router.delete('/:id', async (req, res) => {
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

export default router;
