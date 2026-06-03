import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;

    let query = supabase.from('users').select('id, user_id, name, email, department, role, avatar, created_at');

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: '获取用户失败' });
  }
});

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const { data: users } = await supabase.from('users').select('role');

    const stats = {
      total: users?.length || 0,
      students: users?.filter(u => u.role === 'student').length || 0,
      teachers: users?.filter(u => u.role === 'teacher').length || 0,
      admins: users?.filter(u => u.role === 'admin').length || 0
    };

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { user_id, name, email, department, role, password, avatar } = req.body;

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: '用户已存在' });
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        user_id,
        name,
        email,
        department,
        role,
        password: password || 'password123',
        avatar
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: '创建用户失败' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't update password through this endpoint
    delete updates.password;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: '更新用户失败' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
});

export default router;
