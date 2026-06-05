/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../types';
import { AVATARS } from '../data';

interface LoginViewProps {
  onLogin: (role: UserRole, userProfile?: any) => void;
  showToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export default function LoginView({ onLogin, showToast }: LoginViewProps) {
  const [isRegistering, setIsRegistering] = useState(false);

  // Login states
  const [identifier, setIdentifier] = useState('STUD-2024081');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Registration states
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDept, setRegDept] = useState('计算机科学学院');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Try API login first
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await response.json();

      if (data.success) {
        onLogin(data.user.role, data.user);
        if (showToast) {
          showToast('success', '登录成功', `欢迎回来，${data.user.name}！您的身份为：${data.user.role === 'student' ? '学生' : data.user.role === 'teacher' ? '教师' : '管理员'}`);
        }
        return;
      }
    } catch (err) {
      console.log('API login failed, using fallback:', err);
    }

    // Fallback to localStorage check
    try {
      const stored = localStorage.getItem('thesis_app_registered_users');
      const registeredUsers = stored ? JSON.parse(stored) : [];
      const matchedUser = registeredUsers.find((u: any) => u.id === identifier);

      if (matchedUser) {
        if (matchedUser.password === password) {
          onLogin(matchedUser.role, {
            id: matchedUser.id,
            name: matchedUser.name,
            department: matchedUser.department || '计算机科学学院',
            avatar: matchedUser.avatar
          });
          if (showToast) {
            showToast('success', '登录成功', `欢迎回来，${matchedUser.name}！您的身份为：${matchedUser.role === 'student' ? '学生' : '教师'}`);
          }
          return;
        } else {
          if (showToast) {
            showToast('error', '密码错误', '您输入的校内身份认证密码错误，请重试。');
          }
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    // Default hardcoded roles bypass fallback
    let defaultProfile;
    let defaultRole: UserRole = 'student';

    if (identifier.startsWith('ADMIN') || identifier.includes('admin') || identifier === '850') {
      defaultRole = 'admin';
      defaultProfile = {
        id: identifier,
        name: '陈教授',
        department: '学术教务中心',
        avatar: ''
      };
    } else if (identifier.startsWith('ACAD') || identifier.includes('teacher') || identifier === 'Sterling') {
      defaultRole = 'teacher';
      defaultProfile = {
        id: identifier,
        name: 'Dr. Julian Sterling',
        department: '计算机科学学院',
        avatar: ''
      };
    } else {
      defaultProfile = {
        id: identifier,
        name: '陈伟',
        department: '计算机科学学院',
        avatar: ''
      };
    }

    onLogin(defaultRole, defaultProfile);

    if (showToast) {
      showToast('success', '校内默认登录', `您已通过快捷仿真通道以「${identifier}」身份进入工作站。`);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regId.trim() || !regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      if (showToast) {
        showToast('error', '信息不完整', '请填写所有必要的申请注册要素。');
      }
      return;
    }

    if (regPassword !== regConfirmPassword) {
      if (showToast) {
        showToast('error', '密码不一致', '两次输入的登录密码不相同，请核对。');
      }
      return;
    }

    if (!agreeTerms) {
      if (showToast) {
        showToast('warning', '服务守则', '您需勾选并同意学术信息安全要求及保密义务守则。');
      }
      return;
    }

    const newUser = {
      id: regId.trim(),
      name: regName.trim(),
      email: regEmail.trim(),
      department: regDept,
      role: regRole,
      password: regPassword,
      avatar: regRole === 'teacher' ? AVATARS.sterling : AVATARS.student
    };

    // Try API registration first
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await response.json();

      if (data.success) {
        if (showToast) {
          showToast('success', '注册登记成功', `系统已成功备案您的学术账号：${regName}（${regRole === 'student' ? '学生' : '教师'}）！`);
        }
        setIdentifier(regId);
        setPassword(regPassword);
        setIsRegistering(false);
        setRegId('');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        return;
      } else if (data.message === 'ID已被占用') {
        if (showToast) {
          showToast('error', 'ID已被占用', '此学号/工号已在系统注册登记过，无需重复注册。');
        }
        return;
      }
    } catch (err) {
      console.log('API registration failed, using localStorage fallback:', err);
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('thesis_app_registered_users');
      const registeredUsers = stored ? JSON.parse(stored) : [];

      if (registeredUsers.some((u: any) => u.id === newUser.id)) {
        if (showToast) {
          showToast('error', 'ID已被占用', '此学号/工号已在系统注册登记过，无需重复注册。');
        }
        return;
      }

      registeredUsers.push(newUser);
      localStorage.setItem('thesis_app_registered_users', JSON.stringify(registeredUsers));

      if (showToast) {
        showToast('success', '注册登记成功', `系统已成功备案您的学术账号：${regName}（${regRole === 'student' ? '学生' : '教师'}）！`);
      }

      // Pre-fill and switch view
      setIdentifier(regId);
      setPassword(regPassword);
      setIsRegistering(false);

      // Clean inputs
      setRegId('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast('error', '注册失败', '发生未知错误，请重试或在后台检查。');
      }
    }
  };

  return (
    <div className="bg-[#f4fafd] min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00475e]/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#24695f]/5 blur-[100px]"></div>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, #00475e 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }}
        ></div>
      </div>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-[1100px] grid md:grid-cols-12 gap-0 shadow-soft overflow-hidden rounded-xl bg-white mx-4">
        
        {/* Left Branding Side (Desktop only) */}
        <section className="hidden md:flex md:col-span-7 bg-[#00475e] relative flex-col justify-between p-10 overflow-hidden text-white">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-secondary-fixed">school</span>
            <span className="font-bold text-xl tracking-tight">毕设管理系统 <span className="text-xs uppercase text-[#acefe3] font-mono">v4.0</span></span>
          </div>

          <div className="relative z-10 my-auto py-8">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans tracking-tight mb-4 leading-tight">
              构建高效学术工作流
            </h2>
            <p className="text-[#9bd7f7] font-sans text-base max-w-md leading-relaxed">
              专为研究学者、在校学生及指导教师设计的端到端毕业设计与论文选题平台，从开题到整稿提交、多角色无缝协同。
            </p>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="border-l-2 border-[#acefe3]/40 pl-4">
                <span className="block text-2xl font-bold">100%</span>
                <span className="text-xs text-[#9bd7f7] uppercase tracking-wider">学术成果电子化</span>
              </div>
              <div className="border-l-2 border-[#acefe3]/40 pl-4">
                <span className="block text-2xl font-bold">2.5k+</span>
                <span className="text-xs text-[#9bd7f7] uppercase tracking-wider">年度在线评审</span>
              </div>
            </div>
          </div>

                  </section>

        {/* Right Form Side */}
        <section className="col-span-12 md:col-span-5 p-8 lg:p-12 flex flex-col justify-center bg-[#ffffff]">
          
          {/* Logo on Mobile */}
          <div className="md:hidden flex items-center gap-2 mb-6 justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">school</span>
            <h1 className="font-bold text-xl text-primary tracking-tight">毕设管理系统</h1>
          </div>

          {isRegistering ? (
            <>
              <div className="space-y-2 mb-6">
                <h2 className="text-2xl font-bold text-[#161d1f] tracking-tight">学术账号注册</h2>
                <p className="text-[#40484d] text-sm">申请注册一个学位论文系统账号以获得导师指导及课题申报服务。</p>
              </div>

              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                {/* Segmented control for Role */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider">
                    学术预设身份
                  </label>
                  <div className="grid grid-cols-2 gap-3 bg-[#eef5f7] p-1.5 rounded-lg border border-[#c0c8cd]/40">
                    <button
                      type="button"
                      onClick={() => setRegRole('student')}
                      className={`py-2 px-4 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        regRole === 'student' ? 'bg-primary text-white shadow-sm' : 'text-[#40484d] hover:text-[#161d1f]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">school</span>
                      学生身份
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`py-2 px-4 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        regRole === 'teacher' ? 'bg-primary text-white shadow-sm' : 'text-[#40484d] hover:text-[#161d1f]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">assignment_ind</span>
                      教师身份
                    </button>
                  </div>
                </div>

                {/* Name & ID fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider" htmlFor="regName">
                      真实姓名
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg">
                        person
                      </span>
                      <input 
                        type="text" 
                        id="regName" 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[#161d1f] outline-none text-xs"
                        placeholder="王小明"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider" htmlFor="regId">
                      学号 / 教师工号
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg">
                        badge
                      </span>
                      <input 
                        type="text" 
                        id="regId" 
                        value={regId}
                        onChange={(e) => setRegId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[#161d1f] outline-none text-xs font-sans"
                        placeholder={regRole === 'teacher' ? 'ACAD-202408' : 'STUD-202408'}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Dept */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider" htmlFor="regEmail">
                      电子邮箱 (考务联络)
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg">
                        mail
                      </span>
                      <input 
                        type="email" 
                        id="regEmail" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[#161d1f] outline-none text-xs font-sans"
                        placeholder="edu@university.cn"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider">
                      所属院系门类
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg">
                        lan
                      </span>
                      <select
                        value={regDept}
                        onChange={(e) => setRegDept(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[#161d1f] outline-none text-xs cursor-pointer appearance-none"
                      >
                        <option value="计算机科学学院">计算机科学学院</option>
                        <option value="信息学院">信息学院</option>
                        <option value="社会科学系">社会科学系</option>
                        <option value="建筑系">建筑系</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider" htmlFor="regPassword">
                      设置登录密码
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg">
                        lock
                      </span>
                      <input 
                        type={showRegPassword ? 'text' : 'password'} 
                        id="regPassword" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[#161d1f] outline-none text-xs"
                        placeholder="密码"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#70787d] hover:text-[#161d1f]"
                      >
                        <span className="material-symbols-outlined text-base">
                          {showRegPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider" htmlFor="regConfirmPassword">
                      重复确认密码
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg">
                        lock_reset
                      </span>
                      <input 
                        type={showRegPassword ? 'text' : 'password'} 
                        id="regConfirmPassword" 
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[#161d1f] outline-none text-xs"
                        placeholder="确认密码"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Compliance checkboxes */}
                <div className="flex items-start py-1">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={agreeTerms}
                      onChange={() => setAgreeTerms(!agreeTerms)}
                      className="w-3.5 h-3.5 rounded border-[#c0c8cd] text-primary focus:ring-primary cursor-pointer transition-all"
                    />
                    <span className="ml-2 text-[11px] text-[#40484d] group-hover:text-on-background transition-colors leading-snug">
                      我同意《网络安全与学位论文合规守则》
                    </span>
                  </label>
                </div>

                {/* Register Action button */}
                <button 
                  type="submit" 
                  className="w-full bg-[#00475e] hover:bg-[#1a5f7a] text-white py-2.5 px-6 rounded-lg font-semibold text-xs shadow-soft hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>递交注册并正式开通</span>
                  <span className="material-symbols-outlined text-base">how_to_reg</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-[#161d1f] tracking-tight">学术平台登录</h2>
                <p className="text-[#40484d] text-sm">请输入您的校内ID及密码，进入学术管理控制台。</p>
              </div>

              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                {/* ID Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider" htmlFor="identifier">
                    学号 / 工号 (校内认证)
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">
                      badge
                    </span>
                    <input 
                      type="text" 
                      id="identifier" 
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[#161d1f] outline-none text-sm font-sans"
                      placeholder="STUD-2024081"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-[#40484d] uppercase tracking-wider" htmlFor="password">
                      登录密码
                    </label>
                    <a href="#forgot" className="text-xs text-primary hover:underline font-medium" onClick={(e) => e.preventDefault()}>
                      忘记密码？
                    </a>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">
                      lock
                    </span>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 bg-[#eef5f7] border border-[#c0c8cd] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[#161d1f] outline-none text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#70787d] hover:text-[#161d1f] transition-colors focus:outline-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="w-4 h-4 rounded border-[#c0c8cd] text-primary focus:ring-primary cursor-pointer transition-all"
                    />
                    <span className="ml-2 text-xs text-[#40484d] group-hover:text-on-background transition-colors">
                      在本台计算机上保持登录
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-[#1a5f7a] text-white py-3.5 px-6 rounded-lg font-semibold text-[#ffffff] shadow-soft hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>正式登录账户</span>
                  <span className="material-symbols-outlined text-lg">login</span>
                </button>
              </form>
            </>
          )}

          {/* Register Toggle Footer */}
          <div className="mt-8 pt-6 border-t border-[#c0c8cd]/40 text-center text-xs text-[#40484d]">
            {isRegistering ? (
              <>
                <span>已有学术账号？</span>
                <button 
                  onClick={() => setIsRegistering(false)} 
                  className="text-primary hover:underline font-bold ml-1 cursor-pointer bg-transparent border-none outline-none"
                >
                  立即返回登录
                </button>
              </>
            ) : (
              <>
                <span>系统新用户？</span>
                <button 
                  onClick={() => setIsRegistering(true)} 
                  className="text-[#24695f] hover:underline font-bold ml-1 cursor-pointer bg-transparent border-none outline-none"
                >
                  提交注册申请
                </button>
              </>
            )}
          </div>

          <div className="mt-4 flex gap-4 justify-center text-[11px] text-[#70787d]">
            <a href="#help" className="hover:text-primary" onClick={(e) => e.preventDefault()}>帮助中心</a>
            <span>•</span>
            <a href="#support" className="hover:text-primary" onClick={(e) => e.preventDefault()}>IT技术支持</a>
          </div>

        </section>

      </main>
    </div>
  );
}
