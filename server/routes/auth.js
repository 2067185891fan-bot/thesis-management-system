import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
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

// Register
router.post('/register', async (req, res) => {
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

// Get profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    return res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        department: user.department,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// Update profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, department, avatar, phone } = req.body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ name, email, department, avatar, phone })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      user: {
        id: updatedUser.user_id,
        name: updatedUser.name,
        email: updatedUser.email,
        department: updatedUser.department,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// Change password
router.put('/password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    // Verify old password
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('user_id', userId)
      .single();

    if (!user || user.password !== oldPassword) {
      return res.status(400).json({ success: false, message: '当前密码错误' });
    }

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return res.json({ success: true, message: '密码更新成功' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: '密码更新失败' });
  }
});

export default router;
