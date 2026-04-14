import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuestion, useUpdateQuestion, useDeleteQuestion, useAnswers, useCreateAnswer, useDeleteAnswer } from '../../hooks/useQuestions'
import { useAuthStore } from '../../stores/authStore'
import { formatDateTime } from '../../utils/format'
import toast from 'react-hot-toast'

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: question, isLoading } = useQuestion(id!)
  const { data: answers = [] } = useAnswers(id!)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isAuthor = question?.created_by === user?.id
  const updateQuestion = useUpdateQuestion()
  const deleteQuestion = useDeleteQuestion()
  const createAnswer = useCreateAnswer()
  const deleteAnswer = useDeleteAnswer()

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [answerContent, setAnswerContent] = useState('')

  const startEdit = () => {
    if (!question) return
    setForm({ title: question.title, content: question.content })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!question) return
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }
    try {
      await updateQuestion.mutateAsync({
        id: question.id,
        title: form.title,
        content: form.content,
      })
      toast.success('질문이 수정되었습니다.')
      setIsEditing(false)
    } catch {
      toast.error('질문 수정에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!question) return
    const ok = window.confirm('이 질문을 삭제하시겠습니까?')
    if (!ok) return
    try {
      await deleteQuestion.mutateAsync(question.id)
      toast.success('질문이 삭제되었습니다.')
      navigate('/questions')
    } catch (error) {
      const message = error instanceof Error ? error.message : '질문 삭제에 실패했습니다.'
      toast.error(message)
    }
  }

  const handleAnswerSubmit = async () => {
    if (!answerContent.trim() || !question) return
    try {
      await createAnswer.mutateAsync({
        question_id: question.id,
        content: answerContent,
        created_by: user!.id,
      })
      toast.success('답변이 등록되었습니다.')
      setAnswerContent('')
    } catch {
      toast.error('답변 등록에 실패했습니다.')
    }
  }

  const handleAnswerDelete = async (answerId: string) => {
    const ok = window.confirm('이 답변을 삭제하시겠습니까?')
    if (!ok) return
    try {
      await deleteAnswer.mutateAsync({ id: answerId, questionId: id! })
      toast.success('답변이 삭제되었습니다.')
    } catch (error) {
      const message = error instanceof Error ? error.message : '답변 삭제에 실패했습니다.'
      toast.error(message)
    }
  }

  if (isLoading) return <div style={{ padding: 32, textAlign: 'center' }}>로딩 중...</div>
  if (!question) return <div style={{ padding: 32, textAlign: 'center' }}>질문을 찾을 수 없습니다.</div>

  return (
    <div className="fade-in">
      <button className="detail-back" onClick={() => navigate('/questions')}>← 질문 목록</button>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 6 }}>익명</span>
              <span className="notice-date">{formatDateTime(question.created_at)}</span>
            </div>
            <div className="page-title">{question.title}</div>
          </div>
          {(isAdmin || isAuthor) && !isEditing && (
            <div style={{ display: 'flex', gap: 8 }}>
              {isAuthor && <button className="btn btn-secondary" onClick={startEdit}>수정</button>}
              <button className="btn btn-secondary" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.4)' }} onClick={handleDelete} disabled={deleteQuestion.isPending}>
                {deleteQuestion.isPending ? '삭제 중...' : '삭제'}
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
              placeholder="질문 제목"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">내용</label>
            <textarea
              className="form-input"
              rows={10}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="질문 내용"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>취소</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={updateQuestion.isPending}>
              {updateQuestion.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {question.content}
          </div>
        </div>
      )}

      {/* 답변 영역 */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          답변 {answers.length > 0 && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{answers.length}</span>}
        </div>

        {answers.map((a) => (
          <div key={a.id} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', flex: 1 }}>
                {a.content}
              </div>
              {(isAdmin || a.created_by === user?.id) && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: '4px 8px', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.4)', flexShrink: 0 }}
                  onClick={() => handleAnswerDelete(a.id)}
                >
                  삭제
                </button>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {formatDateTime(a.created_at)}
            </div>
          </div>
        ))}

        {answers.length === 0 && (
          <div className="card empty" style={{ marginBottom: 12 }}>아직 답변이 없습니다.</div>
        )}

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            className="form-input"
            rows={3}
            placeholder="답변을 작성하세요"
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleAnswerSubmit} disabled={createAnswer.isPending || !answerContent.trim()}>
              {createAnswer.isPending ? '등록 중...' : '답변 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
