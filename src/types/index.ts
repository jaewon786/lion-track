export type Track = 'FRONTEND' | 'BACKEND' | 'PLANNING' | 'DESIGN'

export const TRACKS: Track[] = ['FRONTEND', 'BACKEND', 'PLANNING', 'DESIGN']

export const TRACK_LABELS: Record<Track, string> = {
  FRONTEND: '프론트엔드',
  BACKEND: '백엔드',
  PLANNING: '기획',
  DESIGN: '디자인',
}

export interface Profile {
  id: string
  name: string
  email: string
  department: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
  track: Track
  created_at: string
}

export interface Week {
  id: string
  number: number
  title: string
  description: string
  session_date: string
  status: 'completed' | 'current' | 'upcoming'
  track: Track
}

export interface Material {
  id: string
  week_id: string
  type: 'FILE' | 'LINK'
  title: string
  description: string
  url: string
  is_public: boolean
}

export interface Assignment {
  id: string
  week_id: string
  title: string
  description: string
  due_at: string
  submit_type: 'GITHUB_URL' | 'FILE_UPLOAD' | 'BOTH'
  status: 'draft' | 'open' | 'closed'
}

export interface Submission {
  id: string
  assignment_id: string
  user_id: string
  github_url: string | null
  file_url: string | null
  status: 'submitted' | 'late'
  submitted_at: string
}

export interface Attendance {
  id: string
  week_id: string
  user_id: string
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'PENDING'
  checked_at: string | null
}

export interface AttendCode {
  id: string
  week_id: string
  code: string
  expires_at: string
  created_by: string
}

export interface Notice {
  id: string
  title: string
  content: string
  track: Track
  created_by: string
  created_at: string
}

export interface Feedback {
  id: string
  submission_id: string
  admin_id: string
  comment: string
  created_at: string
}

export interface Question {
  id: string
  title: string
  content: string
  track: Track
  created_by: string
  created_at: string
}

export interface Answer {
  id: string
  question_id: string
  content: string
  created_by: string
  created_at: string
}
