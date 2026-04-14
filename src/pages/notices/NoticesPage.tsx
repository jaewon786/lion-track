import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useNotices, useCreateNotice } from '../../hooks/useNotices'
import { useAuthStore } from '../../stores/authStore'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NoticesPage() {
  const navigate = useNavigate()
  const { data: notices = [], isLoading } = useNotices()
  const user = useAuthStore((s) => s.user)
  const activeTrack = useAuthStore((s) => s.activeTrack)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const createNotice = useCreateNotice()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    try {
      await createNotice.mutateAsync({ title: form.title, content: form.content, track: activeTrack, created_by: user!.id })
      toast.success('공지가 등록되었습니다.')
      setShowModal(false)
    } catch {
      toast.error('공지 등록에 실패했습니다.')
    }
  }

  if (isLoading) return <div style={{ padding: 32, textAlign: 'center' }}>로딩 중...</div>

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <div className="page-title">공지사항</div>
          <div className="page-subtitle">세션 관련 주요 공지를 확인하세요.</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', content: '' }); setShowModal(true) }}>
            <Plus size={18} /> 공지 작성
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notices.map((n) => (
          <div
            key={n.id}
            className="card card-clickable notice-card"
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', minHeight: 44 }}
            onClick={() => navigate(`/notices/${n.id}`)}>
            <div className="notice-title" style={{ fontSize: 16, marginTop: 0 }}>{n.title}</div>
          </div>
        ))}
        {notices.length === 0 && <div className="card empty">공지사항이 없습니다.</div>}
      </div>

      {showModal && createPortal(
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-content"
            style={{
              position: 'relative',
              margin: 0,
              width: 520,
              maxWidth: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title">공지 작성</div>
            <div className="form-group">
              <label className="form-label">제목</label>
              <input className="form-input" placeholder="공지 제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">내용</label>
              <textarea className="form-input" rows={6} placeholder="공지 내용을 작성하세요" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={createNotice.isPending}>
                {createNotice.isPending ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
