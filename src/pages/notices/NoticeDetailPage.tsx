import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNotice, useUpdateNotice, useDeleteNotice } from '../../hooks/useNotices'
import { useAuthStore } from '../../stores/authStore'
import { formatDateTime } from '../../utils/format'
import toast from 'react-hot-toast'

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: notice, isLoading } = useNotice(id!)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const updateNotice = useUpdateNotice()
  const deleteNotice = useDeleteNotice()

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const startEdit = () => {
    if (!notice) return
    setForm({ title: notice.title, content: notice.content })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!notice) return
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }
    try {
      await updateNotice.mutateAsync({
        id: notice.id,
        title: form.title,
        content: form.content,
      })
      toast.success('공지가 수정되었습니다.')
      setIsEditing(false)
    } catch {
      toast.error('공지 수정에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!notice) return
    const ok = window.confirm('이 공지를 삭제하시겠습니까?')
    if (!ok) return
    try {
      await deleteNotice.mutateAsync(notice.id)
      toast.success('공지가 삭제되었습니다.')
      navigate('/notices')
    } catch (error) {
      const message = error instanceof Error ? error.message : '공지 삭제에 실패했습니다.'
      toast.error(message)
    }
  }

  if (isLoading) return <div style={{ padding: 32, textAlign: 'center' }}>로딩 중...</div>
  if (!notice) return <div style={{ padding: 32, textAlign: 'center' }}>공지를 찾을 수 없습니다.</div>

  return (
    <div className="fade-in">
      <button className="detail-back" onClick={() => navigate('/notices')}>← 공지 목록</button>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="notice-date" style={{ marginBottom: 8 }}>{formatDateTime(notice.created_at)}</div>
            <div className="page-title">{notice.title}</div>
          </div>
          {isAdmin && !isEditing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={startEdit}>수정</button>
              <button className="btn btn-secondary" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.4)' }} onClick={handleDelete} disabled={deleteNotice.isPending}>
                {deleteNotice.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">제목</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="공지 제목"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">내용</label>
            <textarea
              className="form-input"
              rows={10}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="공지 내용"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>취소</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={updateNotice.isPending}>
              {updateNotice.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {notice.content}
          </div>
        </div>
      )}
    </div>
  )
}
