import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useQuestions, useCreateQuestion } from '../../hooks/useQuestions'
import { useAuthStore } from '../../stores/authStore'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuestionsPage() {
  const navigate = useNavigate()
  const { data: questions = [], isLoading } = useQuestions()
  const user = useAuthStore((s) => s.user)
  const activeTrack = useAuthStore((s) => s.activeTrack)
  const createQuestion = useCreateQuestion()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    try {
      await createQuestion.mutateAsync({ title: form.title, content: form.content, track: activeTrack, created_by: user!.id })
      toast.success('질문이 등록되었습니다.')
      setShowModal(false)
    } catch {
      toast.error('질문 등록에 실패했습니다.')
    }
  }

  if (isLoading) return <div style={{ padding: 32, textAlign: 'center' }}>로딩 중...</div>

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <div className="page-title">질문 게시판</div>
          <div className="page-subtitle">익명으로 궁금한 점을 자유롭게 질문하세요. 작성자 본인과 운영진만 볼 수 있습니다.</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ title: '', content: '' }); setShowModal(true) }}>
          <Plus size={18} /> 질문 작성
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q) => (
          <div
            key={q.id}
            className="card card-clickable notice-card"
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', minHeight: 44 }}
            onClick={() => navigate(`/questions/${q.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>익명</span>
              <div className="notice-title" style={{ fontSize: 16, marginTop: 0 }}>{q.title}</div>
            </div>
          </div>
        ))}
        {questions.length === 0 && <div className="card empty">등록된 질문이 없습니다.</div>}
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
            <div className="modal-title">질문 작성</div>
            <div className="form-group">
              <label className="form-label">제목</label>
              <input className="form-input" placeholder="질문 제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">내용</label>
              <textarea className="form-input" rows={6} placeholder="질문 내용을 작성하세요" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={createQuestion.isPending}>
                {createQuestion.isPending ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
