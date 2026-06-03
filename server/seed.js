import { supabase } from './supabase.js';

const NEW_TOPICS = [
  {
    title: '基于大语言模型的智能代码审查系统',
    abstract: '利用大语言模型对代码提交进行自动化审查，检测潜在缺陷、安全漏洞和代码风格问题，提升软件工程质量。',
    category: '人工智能与数据科学',
    occupied_slots: 0,
    total_slots: 3,
    advisor_name: '王建国 教授',
    advisor_title: '教授',
    advisor_dept: '计算机科学学院',
    advisor_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18'
  },
  {
    title: '多模态情感分析在电商评论中的应用',
    abstract: '融合文本、图片和视频多模态信息，构建电商用户评论的情感分析模型，为商家提供精准的用户反馈洞察。',
    category: '人工智能与数据科学',
    occupied_slots: 0,
    total_slots: 2,
    advisor_name: '刘思远 副教授',
    advisor_title: '副教授',
    advisor_dept: '信息学院',
    advisor_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGE0VDco0Mvlo0McJLMnnrNdx71l0ZAheVcz9pNHrlT9EBk4tGslYg9TjmP-MwIyuDEDrG8NQxpzvlOsEr248n85ZU72CdQs101qW8zAbC9c8t-ubvQzd_cdQ57GhbFnpVBmHMUlREvjPEsf3GQjCC0TWZcd3IiKbZd2f_a7SBL2ha9OfAMAd1GzCYbmoy-9Qqs0KY4p2TAnmXgDlqkGx0TigV6mC3qAFWSuE5nYOjBqhIh3Kq7Xkzr-djHm2LFSgzGZjX7pJ8KH8'
  },
  {
    title: '微服务架构下的分布式链路追踪优化',
    abstract: '针对微服务架构设计低开销的分布式链路追踪方案，通过采样策略和数据压缩降低性能损耗，提升系统可观测性。',
    category: '工程与科技',
    occupied_slots: 0,
    total_slots: 4,
    advisor_name: '赵明辉 教授',
    advisor_title: '教授',
    advisor_dept: '软件工程学院',
    advisor_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcl45KydeK0BXI4U8BjirUv71LfaTFWyfqCgcpdsfmXJMsS_QmvarL7mTeu43ZOKcVozauRio7DSggbFjYeCw0jCNdUeN3YbfHhpFcR70MwFpEFIwwCqIcypMM8knnoVG-g4RcA0r6SpWfant8SKQ7U8LOmEkooXjvFNl9u_IZFO7y52U2wmccEzF5jfvl5Wg7J6rfhIvbRGVNx-w12HETMj0VYetvBgfbr0NY1RF0Jq8E-OgkYQ4ow9evUg_qVVAn_tFkVuKnjg'
  }
];

const NEW_TEACHERS = [
  {
    user_id: 'ACAD-WANG-01',
    name: '王建国 教授',
    email: 'wangjianguo@university.cn',
    department: '计算机科学学院',
    role: 'teacher',
    password: 'password123',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18'
  },
  {
    user_id: 'ACAD-LIU-02',
    name: '刘思远 副教授',
    email: 'liusiyuan@university.cn',
    department: '信息学院',
    role: 'teacher',
    password: 'password123',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGE0VDco0Mvlo0McJLMnnrNdx71l0ZAheVcz9pNHrlT9EBk4tGslYg9TjmP-MwIyuDEDrG8NQxpzvlOsEr248n85ZU72CdQs101qW8zAbC9c8t-ubvQzd_cdQ57GhbFnpVBmHMUlREvjPEsf3GQjCC0TWZcd3IiKbZd2f_a7SBL2ha9OfAMAd1GzCYbmoy-9Qqs0KY4p2TAnmXgDlqkGx0TigV6mC3qAFWSuE5nYOjBqhIh3Kq7Xkzr-djHm2LFSgzGZjX7pJ8KH8'
  },
  {
    user_id: 'ACAD-ZHAO-03',
    name: '赵明辉 教授',
    email: 'zhaominghui@university.cn',
    department: '软件工程学院',
    role: 'teacher',
    password: 'password123',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcl45KydeK0BXI4U8BjirUv71LfaTFWyfqCgcpdsfmXJMsS_QmvarL7mTeu43ZOKcVozauRio7DSggbFjYeCw0jCNdUeN3YbfHhpFcR70MwFpEFIwwCqIcypMM8knnoVG-g4RcA0r6SpWfant8SKQ7U8LOmEkooXjvFNl9u_IZFO7y52U2wmccEzF5jfvl5Wg7J6rfhIvbRGVNx-w12HETMj0VYetvBgfbr0NY1RF0Jq8E-OgkYQ4ow9evUg_qVVAn_tFkVuKnjg'
  }
];

async function seed() {
  console.log('🌱 开始插入种子数据...\n');

  // 1. Insert teacher accounts
  for (const teacher of NEW_TEACHERS) {
    const { data: existing } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', teacher.user_id)
      .single();

    if (existing) {
      console.log(`⏭️  教师 ${teacher.name} (${teacher.user_id}) 已存在，跳过`);
    } else {
      const { error } = await supabase.from('users').insert(teacher);
      if (error) {
        console.error(`❌ 插入教师 ${teacher.name} 失败:`, error.message);
      } else {
        console.log(`✅ 教师 ${teacher.name} (${teacher.user_id}) 插入成功`);
      }
    }
  }

  // 2. Insert topics
  for (const topic of NEW_TOPICS) {
    const { data: existing } = await supabase
      .from('thesis_topics')
      .select('id')
      .eq('title', topic.title)
      .single();

    if (existing) {
      console.log(`⏭️  选题「${topic.title}」已存在，跳过`);
    } else {
      const { error } = await supabase.from('thesis_topics').insert(topic);
      if (error) {
        console.error(`❌ 插入选题「${topic.title}」失败:`, error.message);
      } else {
        console.log(`✅ 选题「${topic.title}」(导师: ${topic.advisor_name}) 插入成功`);
      }
    }
  }

  console.log('\n🎉 种子数据插入完成！');
  console.log('\n📋 新增教师账号（密码均为 password123）：');
  console.log('   - ACAD-WANG-01  王建国 教授   (计算机科学学院)');
  console.log('   - ACAD-LIU-02   刘思远 副教授 (信息学院)');
  console.log('   - ACAD-ZHAO-03  赵明辉 教授   (软件工程学院)');
}

seed().catch(console.error);
