import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Send, Upload } from 'lucide-react'
import { useAssignment, useMySubmissions, useSubmitAssignment, uploadSubmissionFile } from '../../hooks/useAssignments'
import { formatDateTime, getDDay } from '../../utils/format'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: assignment } = useAssignment(id)
  const { data: mySubmissions = [] } = useMySubmissions()
  const submitMutation = useSubmitAssignment()
  const user = useAuthStore((s) => s.user)
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const getDisplayFileName = (path: string) => {
    const raw = decodeURIComponent(path.split('/').pop() || '')
    return raw.replace(/^\d+-/, '')
  }

  const sub = mySubmissions.find((s) => s.assignment_id === assignment?.id)

  const requiresUrl = assignment?.submit_type === 'GITHUB_URL' || assignment?.submit_type === 'BOTH'
  const requiresFile = assignment?.submit_type === 'FILE_UPLOAD' || assignment?.submit_type === 'BOTH'

  useEffect(() => {
    if (sub?.github_url) {
      setUrl(sub.github_url)
    }
  }, [sub?.github_url])

  if (!assignment) return <div className="empty">로딩 중...</div>

  const canSubmit =
    !submitMutation.isPending &&
    (!requiresUrl || !!url.trim()) &&
    (!requiresFile || !!file || !!sub?.file_url)

  const handleSubmit = async () => {
    if (!user) {
      toast.error('로그인 정보를 확인해주세요.')
      return
    }

    if (requiresUrl && !url.trim()) {
      toast.error('GitHub URL을 입력해주세요.')
      return
    }

    if (requiresFile && !file) {
      toast.error('제출할 파일을 선택해주세요.')
      return
    }

    try {
      let uploadedFilePath: string | undefined = sub?.file_url || undefined

      if (file) {
        uploadedFilePath = await uploadSubmissionFile(assignment.id, user.id, file)
      }

      await submitMutation.mutateAsync({
        assignmentId: assignment.id,
        githubUrl: url.trim() || undefined,
        fileUrl: uploadedFilePath,
      })

      toast.success(sub ? '과제가 제출 수정되었습니다!' : '과제가 제출되었습니다!')
      setIsEditing(false)
      setFile(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : '제출에 실패했습니다.'
      toast.error(message)
    }
  }

  return (
    <div className="fade-in">
      <Link to="/assignments" className="detail-back">← 과제 목록</Link>
      <div className="page-header">
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <span className={`assignment-dday ${assignment.status === 'open' ? 'dday-open' : 'dday-closed'}`}>
            {assignment.status === 'open' ? getDDay(assignment.due_at) : '마감'}
          </span>
        </div>
        <div className="page-title">{assignment.title}</div>
        <div className="page-subtitle">마감: {formatDateTime(assignment.due_at)}</div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">과제 설명</div>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
          {assignment.description}
        </div>
      </div>

      <div className="card">
        <div className="section-title">과제 제출</div>
        {sub && !isEditing ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--green)', marginBottom: 4 }}>제출 완료!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {formatDateTime(sub.submitted_at)} 제출
            </div>
            {sub.github_url && (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <a href={sub.github_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{sub.github_url}</a>
              </div>
            )}
            {sub.file_url && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                업로드 파일: {getDisplayFileName(sub.file_url)}
              </div>
            )}
            {assignment.status !== 'closed' && (
              <div style={{ marginTop: 16 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditing(true)
                    setUrl(sub.github_url ?? '')
                    setFile(null)
                  }}
                >
                  제출 수정
                </button>
              </div>
            )}
          </div>
        ) : assignment.status === 'closed' ? (
          <div className="empty" style={{ color: 'var(--red)' }}>마감된 과제입니다. 더 이상 제출할 수 없습니다.</div>
        ) : (
          <>
            {(assignment.submit_type === 'GITHUB_URL' || assignment.submit_type === 'BOTH') && (
              <div className="form-group">
                <label className="form-label">GitHub Repository URL</label>
                <input className="form-input" placeholder="https://github.com/username/repo" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            )}
            {(assignment.submit_type === 'FILE_UPLOAD' || assignment.submit_type === 'BOTH') && (
              <div className="form-group">
                <label className="form-label">파일 업로드</label>
                <div
                  style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={() => document.getElementById('assignment-file-upload')?.click()}
                >
                  <Upload size={24} />
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    {file ? file.name : '파일을 드래그하거나 클릭하여 업로드'}
                  </div>
                </div>
                {sub?.file_url && !file && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    현재 파일 유지: {getDisplayFileName(sub.file_url)}
                  </div>
                )}
                <input
                  id="assignment-file-upload"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
                <Send size={16} /> {submitMutation.isPending ? '제출 중...' : sub ? '제출 수정하기' : '제출하기'}
              </button>
              {sub && isEditing && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditing(false)
                    setUrl(sub.github_url ?? '')
                    setFile(null)
                  }}
                >
                  취소
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
