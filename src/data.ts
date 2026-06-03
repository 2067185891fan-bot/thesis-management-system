/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  UserProfile, 
  AcademicBatch, 
  ThesisTopic, 
  MySelection, 
  SelectionAudit, 
  TaskBook, 
  MidtermReport, 
  ProposalSubmission, 
  FinalThesisSubmission 
} from './types';

// Avatars hotlinked from application frames
export const AVATARS = {
  sterling: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18',
  vance: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGE0VDco0Mvlo0McJLMnnrNdx71l0ZAheVcz9pNHrlT9EBk4tGslYg9TjmP-MwIyuDEDrG8NQxpzvlOsEr248n85ZU72CdQs101qW8zAbC9c8t-ubvQzd_cdQ57GhbFnpVBmHMUlREvjPEsf3GQjCC0TWZcd3IiKbZd2f_a7SBL2ha9OfAMAd1GzCYbmoy-9Qqs0KY4p2TAnmXgDlqkGx0TigV6mC3qAFWSuE5nYOjBqhIh3Kq7Xkzr-djHm2LFSgzGZjX7pJ8KH8',
  moretti: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcl45KydeK0BXI4U8BjirUv71LfaTFWyfqCgcpdsfmXJMsS_QmvarL7mTeu43ZOKcVozauRio7DSggbFjYeCw0jCNdUeN3YbfHhpFcR70MwFpEFIwwCqIcypMM8knnoVG-g4RcA0r6KSpWfant8SKQ7U8LOmEkooXjvFNl9u_IZFO7y52U2wmccEzF5jfvl5Wg7J6rfhIvbRGVNx-w12HETMj0VYetvBgfbr0NY1RF0Jq8E-OgkYQ4ow9evUg_qVVAn_tFkVuKnjg',
  li: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuEYECTMGo_I_zsBQHtRXmaM1vW_8sdVJtGPduR_aonUkqjU3MsebJt9k_Rc8jXuRDaxqKOFUEfRVKS_HZMhzfVi2NJrIyc1FHKQoEPyytBd594Q7XDySuQiiD44AEsu5jDUAD8yy2biin6_E9IyEKhmEz0wlj58rWsv3IQ1j8LInedRADyYTkwPHI1R9X-rfl2KxX0cXVzDGvTj9s0eh7x6vTPdL2PYcRbu-bn7PQ1g5SMWPqdlN0ADRrMQ87BU12WP8kNepViF0',
  student: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRVogLufdW1c6_GNQ-6vGfnCHhz6Of2v7k1If62Wn8DA27cu0SDpl4OMwgf24okyqvGMi53fEQy4zrk6Iqyp3gd_-WcaYXkah0ykCTagpgnS0e-IYypFRoD5NHSNhueMvfvi39iwAyfyMxwP43ILpestkPKELHPMYhdPp8VOotIz5rW5v_NJUyg6Mxoh13BvGIavEHgXVJ_gnaucnfVMrVgBG6Qvwmpwz20iMgZY8VR01YLwkwyRR3XDFLBmEDwvNQCwQJ6m07Lak',
  chen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCOPF3hYfTU3hNtLgnlrLrjOJ1YmC3nnxN8T4v6pDdCY6a5cl-h5-qSiFZGz8wHyHzSTEeSN6XJ_bfALM65PPdLnfieNWBnbJn2my3a7mrtweMaZajqi57J6SwxPPzv1mf65-x_RwIdjpK_V9weWEnyt24xGSjlxl7pkCl7l04Z4UZI5M3euoKBW_YYxsjyGxyVktoN-DXH6B6JhmO5R4QoAv9mTVO2dAK8YfvjLUQvoq0ZMScHkxF77cfHLKwMA4A51qBqSoktc'
};

// Raw initial data sources
export const INITIAL_STUDENT_PROFILE: UserProfile = {
  name: '陈伟',
  id: 'STUD-2024081',
  department: '计算机科学学院',
  avatar: AVATARS.student
};

export const INITIAL_TEACHER_PROFILE: UserProfile = {
  name: 'Dr. Julian Sterling',
  id: 'ACAD-9921-X',
  department: '计算机科学学院',
  avatar: AVATARS.sterling,
  studentCount: 12,
  pendingCount: 8
};

export const INITIAL_ADMIN_PROFILE: UserProfile = {
  name: '陈教授',
  id: 'ADMIN-8820-T',
  department: '学术教务中心',
  avatar: AVATARS.chen
};

export const INITIAL_BATCHES: AcademicBatch[] = [
  { id: 'b1', name: '2024 春季学期', timeline: '1月 15 - 5月 30', studentCount: 142, status: '进行中' },
  { id: 'b2', name: '2023 秋季学期', timeline: '8月 10 - 12月 20', studentCount: 128, status: '已完成' },
  { id: 'b3', name: '2024 夏季强化班', timeline: '6月 01 - 7月 15', studentCount: 45, status: '即将开始' },
  { id: 'b4', name: '2023 春季学期', timeline: '1月 12 - 5月 28', studentCount: 156, status: '已存档' }
];

export const INITIAL_TOPICS: ThesisTopic[] = [
  {
    id: 't1',
    title: '边缘设备的神经网络优化 research',
    abstract: '研究在资源受限的物联网传感器上部署深度学习模型的轻量级架构搜索方法 and 剪枝算法。',
    category: '人工智能与数据科学',
    occupiedSlots: 3,
    totalSlots: 3,
    advisorName: 'Alistair Vance 博士',
    advisorTitle: '教授',
    advisorDept: '信息学院',
    advisorAvatar: AVATARS.vance
  },
  {
    id: 't2',
    title: '城市发展中的循环经济框架',
    abstract: '评估全球南方迅速扩张的大都市地区垃圾发电与资源再分配对城市规划和社区发展的影响。',
    category: '可持续发展',
    occupiedSlots: 1,
    totalSlots: 1,
    advisorName: 'Elena Moretti 教授',
    advisorTitle: '教授',
    advisorDept: '建筑系',
    advisorAvatar: AVATARS.moretti
  },
  {
    id: 't3',
    title: '远程学习环境中的认知负荷研究',
    abstract: '针对同步与异步数字教育平台间信息保留情况的比较研究，提出最优化界面缓解注意力不集中。',
    category: '心理学',
    occupiedSlots: 0,
    totalSlots: 5,
    advisorName: 'Julian Thorne 博士',
    advisorTitle: '副教授',
    advisorDept: '社会科学系',
    advisorAvatar: AVATARS.sterling
  },
  {
    id: 't4',
    title: '基于区块链技术的供应链透明度改进',
    abstract: '构建支持高流通、防篡改的区块底层追溯系统，优化跨企业共识开销，并在生鲜冷链中应用。',
    category: '工程与科技',
    occupiedSlots: 0,
    totalSlots: 3,
    advisorName: 'Sarah Jenkins 博士',
    advisorTitle: '副教授',
    advisorDept: '计算机学院',
    advisorAvatar: AVATARS.chen
  },
  {
    id: 't5',
    title: '基于大语言模型的智能代码审查系统',
    abstract: '利用大语言模型对代码提交进行自动化审查，检测潜在缺陷、安全漏洞和代码风格问题，提升软件工程质量。',
    category: '人工智能与数据科学',
    occupiedSlots: 0,
    totalSlots: 3,
    advisorName: '王建国 教授',
    advisorTitle: '教授',
    advisorDept: '计算机科学学院',
    advisorAvatar: AVATARS.sterling
  },
  {
    id: 't6',
    title: '多模态情感分析在电商评论中的应用',
    abstract: '融合文本、图片和视频多模态信息，构建电商用户评论的情感分析模型，为商家提供精准的用户反馈洞察。',
    category: '人工智能与数据科学',
    occupiedSlots: 0,
    totalSlots: 2,
    advisorName: '刘思远 副教授',
    advisorTitle: '副教授',
    advisorDept: '信息学院',
    advisorAvatar: AVATARS.vance
  },
  {
    id: 't7',
    title: '微服务架构下的分布式链路追踪优化',
    abstract: '针对微服务架构设计低开销的分布式链路追踪方案，通过采样策略和数据压缩降低性能损耗，提升系统可观测性。',
    category: '工程与科技',
    occupiedSlots: 0,
    totalSlots: 4,
    advisorName: '赵明辉 教授',
    advisorTitle: '教授',
    advisorDept: '软件工程学院',
    advisorAvatar: AVATARS.moretti
  }
];

export const INITIAL_SELECTION_AUDITS: SelectionAudit[] = [
  { id: 'sa1', studentId: '2024081102', studentName: '李伟', topicTitle: '智慧农业中边缘设备的深度学习优化', status: '待审核' },
  { id: 'sa2', studentId: '2024081145', studentName: '张莎拉', topicTitle: '后量子加密算法的对比分析', status: '待审核' },
  { id: 'sa3', studentId: '2024081190', studentName: '徐凯文', topicTitle: '混合现实教育软件的用户界面范式', status: '待审核' }
];

export const INITIAL_TASK_BOOKS: TaskBook[] = [
  { id: 'tb1', studentName: '陈伟', topicTitle: '供应链透明度中的区块链应用', status: '待提交' },
  { id: 'tb2', studentName: 'Elena Rodriguez', topicTitle: '可再生能源预测模型', status: '任务已下达' },
  { id: 'tb3', studentName: 'James Lee', topicTitle: '历史遗址中的增强现实技术', status: '需要处理' },
  { id: 'tb4', studentName: 'Mina Tanaka', topicTitle: '社交机器人交互模式', status: '草稿已保存' }
];

export const INITIAL_MIDTERM_REPORT: MidtermReport = {
  currentProgress: 65,
  explanation: '目前已完成文献调研及核心算法框架搭建，深度学习模型Baseline已在数据集上跑通，准确率达到预期。正在进行参数微调及多模态数据融合实验...',
  attachments: [
    { id: 'mfa1', name: '中期进度汇报_V1.2.pdf', size: '12.4 MB', type: 'application/pdf' }
  ],
  comments: [
    { id: 'mc1', advisorName: '张教授', role: '指导老师', date: '2023.11.15', comment: '模型在处理长文本时的性能仍有待提升，建议尝试引入注意力机制优化。', bulletType: 'active' },
    { id: 'mc2', advisorName: '李助教', role: '教辅人员', date: '2023.10.20', comment: '初步开题报告格式符合要求，继续保持。', bulletType: 'expired' }
  ],
  isSubmitted: false,
  lastSaved: '14:32:05'
};

export const INITIAL_PROPOSAL: ProposalSubmission = {
  abstractText: '基于深度学习的自动摘要研究对于海量研究文献过滤具有核心价值。本项目探索端到端网络在大文本集上的收敛速度。',
  proposalFile: { id: 'pfa1', name: '20231012_开题报告_修改稿.docx', size: '4.8 MB', type: 'docx' },
  history: [
    { id: 'ph1', fileName: '20231012_开题报告_终稿.pdf', date: '2023年10月12日 14:30', status: '已通过' },
    { id: 'ph2', fileName: '20231005_开题报告_初稿.pdf', date: '2023年10月05日 09:15', status: '已驳回' },
    { id: 'ph3', fileName: '20230928_选题说明.docx', date: '2023年09月28日 11:20', status: '已通过' }
  ],
  comments: [],
  isSubmitted: false
};

export const INITIAL_FINAL_SUBMISSION: FinalThesisSubmission = {
  chineseTitle: '基于深度学习的学术文献自动摘要系统研究与实现',
  englishTitle: 'Research and Implementation of Deep Learning Based Academic Literature Summarization',
  plagiarismRate: '8.4',
  plagiarismInstitution: '中国知网 (CNKI)',
  plagiarismReport: { id: 'rp1', name: '查重检测报告_2024.pdf', size: '2.5 MB', type: 'pdf' },
  finalThesisFile: undefined,
  instructorName: '李教授',
  instructorDept: '计算机科学学院',
  instructorAvatar: AVATARS.li,
  comments: [],
  status: '等待提交',
  deadlineCountdown: {
    days: 14,
    hours: '08',
    minutes: '24',
    seconds: '10'
  }
};

// LocalStorage helpers for cross-role data sync simulation
export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('LocalStorage read error for key:', key, error);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('LocalStorage write error for key:', key, error);
  }
}
