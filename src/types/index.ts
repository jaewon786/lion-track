export interface Profile {
  id: string
  name: string
  email: string
  department: string
  role: 'ADMIN' | 'MEMBER'
  created_at: string
}

export interface Week {
  id: string
  number: number
  title: string
  description: string
  session_date: string
  status: 'completed' | 'current' | 'upcoming'
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
