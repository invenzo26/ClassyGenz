export type UserRole = "student" | "teacher";

export type EventType =
  | "tab_switch"
  | "camera_off"
  | "multiple_face"
  | "copy_paste"
  | "presence_ping"
  | "fullscreen_exit";

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface ClassListItem {
  id: string;
  name: string;
  teacher_id: string;
  created_at: string;
}

export interface ClassMessage {
  id: string;
  class_id: string;
  sender_id: string;
  message: string;
  type: "text" | "announcement";
  created_at: string;
  sender: {
    name: string;
    role: UserRole;
  } | null;
}

export interface ClassMaterial {
  id: string;
  class_id: string;
  title: string;
  file_url: string;
  created_at: string;
}

export interface ClassDetail extends ClassListItem {
  teacher: {
    name: string;
    email: string;
  } | null;
}

export interface SessionListItem {
  id: string;
  class_id: string;
  meeting_url: string | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
  class: {
    id: string;
    name: string;
    teacher_id: string;
  } | null;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  last_seen_at: string | null;
  left_at: string | null;
}

export interface SessionEventRecord {
  id: string;
  user_id: string;
  session_id: string;
  type: EventType;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface SessionScoreRow {
  user_id: string;
  user_name: string;
  user_role: UserRole;
  session_id: string;
  class_id: string;
  class_name: string;
  session_start: string;
  engagement_score: number;
  integrity_score: number;
  event_counts: Partial<Record<EventType, number>>;
  message_count: number;
  attendance_minutes: number;
}

export interface AnalyticsSummary {
  total_sessions: number;
  average_engagement: number;
  average_integrity: number;
  suspicious_count: number;
  low_engagement_count: number;
}

export interface AssignmentListItem {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  class: {
    id: string;
    name: string;
    teacher_id: string;
  } | null;
}

export interface SubmissionRecord {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  marks: number | null;
  feedback: string | null;
  created_at: string;
  student: {
    name: string;
    email: string;
  } | null;
}

export interface ClassMemberRecord {
  id: string;
  class_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  user: {
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

export interface StudentRiskInsight {
  user_id: string;
  user_name: string;
  class_name: string;
  session_id: string;
  score: number;
  reason: string;
}

export interface AssignmentWeaknessInsight {
  submission_id: string;
  assignment_id: string;
  assignment_title: string;
  class_name: string;
  student_name: string;
  marks: number | null;
  submitted_at: string;
}

export interface EvidenceInsight {
  event_id: string;
  user_id: string;
  user_name: string;
  class_name: string;
  session_id: string;
  event_type: EventType;
  evidence_url: string;
  captured_at: string;
}

export interface TeacherInsightDashboard {
  suspicious_students: StudentRiskInsight[];
  low_engagement_students: StudentRiskInsight[];
  weak_submissions: AssignmentWeaknessInsight[];
  recent_evidence: EvidenceInsight[];
}
