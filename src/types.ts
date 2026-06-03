/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  name: string;
  id: string;
  department: string;
  avatar: string;
  studentCount?: number;
  pendingCount?: number;
}

export interface AcademicBatch {
  id: string;
  name: string;
  timeline: string;
  studentCount: number;
  status: '进行中' | '已完成' | '即将开始' | '已存档';
}

export interface ThesisTopic {
  id: string;
  title: string;
  abstract: string;
  category: string;
  occupiedSlots: number;
  totalSlots: number;
  advisorName: string;
  advisorTitle: string;
  advisorDept: string;
  advisorAvatar: string;
}

export interface MySelection {
  topicId: string;
  status: '选题待审核' | '初审通过' | '最终批准' | '已退回';
  submitDate: string;
  projectCode: string;
  timelineSteps: {
    title: string;
    date: string;
    status: 'completed' | 'active' | 'upcoming';
  }[];
}

export interface SelectionAudit {
  id: string;
  studentId: string;
  studentName: string;
  topicTitle: string;
  status: '待审核' | '已通过' | '已驳回';
}

export interface TaskBook {
  id: string;
  studentName: string;
  topicTitle: string;
  status: '待提交' | '任务已下达' | '需要处理' | '草稿已保存';
}

export interface AdvisorComment {
  id: string;
  advisorName: string;
  role: string;
  date: string;
  comment: string;
  bulletType?: 'active' | 'expired';
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface MidtermReport {
  currentProgress: number; // e.g. 65%
  explanation: string;
  attachments: Attachment[];
  comments: AdvisorComment[];
  isSubmitted: boolean;
  lastSaved?: string;
}

export interface ProposalSubmission {
  abstractText: string;
  proposalFile?: Attachment;
  history: {
    id: string;
    fileName: string;
    date: string;
    status: '已通过' | '已驳回' | '审核中';
  }[];
  comments: AdvisorComment[];
  isSubmitted: boolean;
}

export interface FinalThesisSubmission {
  chineseTitle: string;
  englishTitle: string;
  plagiarismRate: string;
  plagiarismInstitution: string;
  plagiarismReport?: Attachment;
  finalThesisFile?: Attachment;
  instructorName: string;
  instructorDept: string;
  instructorAvatar: string;
  comments: AdvisorComment[];
  status: string;
  deadlineCountdown: {
    days: number;
    hours: string;
    minutes: string;
    seconds: string;
  };
}
