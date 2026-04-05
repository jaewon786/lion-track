import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAssignments, useSubmissions, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, useUpdateSubmission, useAdminDeleteSubmission, downloadSubmissionFile } from '../../hooks/useAssignments'
import { useWeeks } from '../../hooks/useWeeks'
import { useMembers } from '../../hooks/useProfiles'
import { formatDateTime, getDDay, getStatusColor, getStatusLabel } from '../../utils/format'
import { Download, Edit, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminAssignmentsPage() {
  const { data: assignments = [] } = useAssignments()
  const { data: allSubmissions = [] } = useSubmissions()
  const { data: weeks = [] } = useWeeks()
  const { data: members = [] } = useMembers()
  const createAssignment = useCreateAssignment()
  const updateAssignment = useUpdateAssignment()
  const deleteAssignment = useDeleteAssignment()
  const updateSubmission = useUpdateSubmission()
  const deleteSubmission = useAdminDeleteSubmission()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [form, setForm] = useState({ week_id: '', title: '', description: '', due_at: '', submit_type: 'GITHUB_URL' })
  const [editForm, setEditForm] = useState({ week_id: '', title: '', description: '', due_at: '', submit_type: 'GITHUB_URL', status: 'open' })

  const selected = assignments.find((a) => a.id === selectedId)

  const getSubmitTypeLabel = (submitType: 'GITHUB_URL' | 'FILE_UPLOAD' | 'BOTH') => {
    if (submitType === 'GITHUB_URL') return 'GitHub URL'
    if (submitType === 'FILE_UPLOAD') return '파일 업로드'
    return 'URL + 파일'
  }

  const getDisplayFileName = (path: string) => {
    const raw = decodeURIComponent(path.split('/').pop() || 'submission')
    return raw.replace(/^\d+-/, '')
  }

  const handleCreate = async () => {
    if (!form.week_id) {
      toast.error('주차를 선택해주세요.')
      return
    }
    if (!form.title.trim()) {
      toast.error('과제 제목을 입력해주세요.')
      return
    }
    if (!form.due_at) {
      toast.error('마감일시를 선택해주세요.')
      return
    }
    try {
      const dueAtIso = new Date(form.due_at).toISOString()
      await createAssignment.mutateAsync({
        week_id: form.week_id,
        title: form.title,
        description: form.description,
        due_at: dueAtIso,
        submit_type: form.submit_type as 'GITHUB_URL' | 'FILE_UPLOAD' | 'BOTH',
        status: 'open',
      })
      toast.success('과제가 출제되었습니다.')
      setShowModal(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : '과제 출제에 실패했습니다.'
      toast.error(message)
    }
  }

  const handleOpenEditModal = (assignment: typeof assignments[number]) => {
    const localDateTime = new Date(assignment.due_at).toISOString().slice(0, 16)
    setEditingAssignmentId(assignment.id)
    setEditForm({
      week_id: assignment.week_id,
      title: assignment.title,
      description: assignment.description,
      due_at: localDateTime,
      submit_type: assignment.submit_type,
      status: assignment.status,
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editingAssignmentId) return
    if (!editForm.week_id) {
      toast.error('주차를 선택해주세요.')
      return
    }
    if (!editForm.title.trim()) {
      toast.error('과제 제목을 입력해주세요.')
      return
    }
    if (!editForm.due_at) {
      toast.error('마감일시를 선택해주세요.')
      return
    }

    try {
      await updateAssignment.mutateAsync({
        id: editingAssignmentId,
        week_id: editForm.week_id,
        title: editForm.title.trim(),
        description: editForm.description,
        due_at: new Date(editForm.due_at).toISOString(),
        submit_type: editForm.submit_type as 'GITHUB_URL' | 'FILE_UPLOAD' | 'BOTH',
        status: editForm.status as 'draft' | 'open' | 'closed',
      })
      toast.success('과제가 수정되었습니다.')
      setShowEditModal(false)
      setEditingAssignmentId(null)
    } catch {
      toast.error('과제 수정에 실패했습니다.')
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('정말로 이 과제를 삭제하겠습니까? 관련 제출 내역도 함께 삭제됩니다.')) return
    try {
      await deleteAssignment.mutateAsync(assignmentId)
      if (selectedId === assignmentId) {
        setSelectedId(null)
      }
      toast.success('과제가 삭제되었습니다.')
    } catch (error) {
      const message = error instanceof Error ? error.message : '과제 삭제에 실패했습니다.'
      toast.error(message)
    }
  }

  const handleDownloadSubmission = async (filePath: string) => {
    try {
      const fileName = getDisplayFileName(filePath)
      await downloadSubmissionFile(filePath, fileName)
      toast.success('제출 파일 다운로드가 시작되었습니다.')
    } catch {
      toast.error('제출 파일 다운로드에 실패했습니다.')
    }
  }

  const toggleSubStatus = async (userId: string) => {
    if (!selectedId) return
    const subs = allSubmissions.filter((s) => s.assignment_id === selectedId)
    const sub = subs.find((s) => s.user_id === userId)
    try {
      if (!sub) {
        await updateSubmission.mutateAsync({ assignmentId: selectedId, userId, status: 'submitted' })
      } else if (sub.status === 'submitted') {
        await updateSubmission.mutateAsync({ assignmentId: selectedId, userId, status: 'late' })
      } else {
        await deleteSubmission.mutateAsync({ assignmentId: selectedId, userId })
      }
    } catch {
      toast.error('상태 변경 실패')
    }
  }

  const openCreateModal = () => {
    if (!weeks.length) {
      toast.error('먼저 주차를 생성해주세요.')
      return
    }
    setForm({ week_id: weeks[0]?.id ?? '', title: '', description: '', due_at: '', submit_type: 'GITHUB_URL' })
    setShowModal(true)
  }

  const isCreateDisabled = createAssignment.isPending || !form.week_id || !form.title.trim() || !form.due_at
  const isEditDisabled = updateAssignment.isPending || !editForm.week_id || !editForm.title.trim() || !editForm.due_at

  const assignmentModal = showModal ? (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowModal(false)
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">새 과제 출제</div>
        <div className="form-group">
          <label className="form-label">주차 선택</label>
          <select className="form-input" value={form.week_id} onChange={(e) => setForm({ ...form, week_id: e.target.value })}>
            {weeks.map((w) => <option key={w.id} value={w.id}>{w.number}주차 - {w.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">과제 제목</label>
          <input className="form-input" placeholder="과제 제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">과제 설명</label>
          <textarea className="form-input" placeholder="마크다운 지원" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">마감일시</label>
          <input
            className="form-input"
            type="datetime-local"
            value={form.due_at}
            onChange={(e) => setForm({ ...form, due_at: e.target.value })}
            onMouseDown={(e) => {
              const input = e.currentTarget
              if (typeof input.showPicker === 'function') input.showPicker()
            }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">제출 방식</label>
          <select className="form-input" value={form.submit_type} onChange={(e) => setForm({ ...form, submit_type: e.target.value })}>
            <option value="GITHUB_URL">GitHub URL</option>
            <option value="FILE_UPLOAD">파일 업로드</option>
            <option value="BOTH">URL + 파일</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={isCreateDisabled}>
            {createAssignment.isPending ? '출제 중...' : '출제하기'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  const editAssignmentModal = showEditModal ? (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowEditModal(false)
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">과제 수정</div>
        <div className="form-group">
          <label className="form-label">주차 선택</label>
          <select className="form-input" value={editForm.week_id} onChange={(e) => setEditForm({ ...editForm, week_id: e.target.value })}>
            {weeks.map((w) => <option key={w.id} value={w.id}>{w.number}주차 - {w.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">과제 제목</label>
          <input className="form-input" placeholder="과제 제목" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">과제 설명</label>
          <textarea className="form-input" placeholder="마크다운 지원" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">마감일시</label>
          <input
            className="form-input"
            type="datetime-local"
            value={editForm.due_at}
            onChange={(e) => setEditForm({ ...editForm, due_at: e.target.value })}
            onMouseDown={(e) => {
              const input = e.currentTarget
              if (typeof input.showPicker === 'function') input.showPicker()
            }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">제출 방식</label>
          <select className="form-input" value={editForm.submit_type} onChange={(e) => setEditForm({ ...editForm, submit_type: e.target.value })}>
            <option value="GITHUB_URL">GitHub URL</option>
            <option value="FILE_UPLOAD">파일 업로드</option>
            <option value="BOTH">URL + 파일</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">상태</label>
          <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
            <option value="draft">임시저장</option>
            <option value="open">진행중</option>
            <option value="closed">마감</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={isEditDisabled}>
            {updateAssignment.isPending ? '수정 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  if (selected) {
    const subs = allSubmissions.filter((s) => s.assignment_id === selected.id)
    return (
      <div className="fade-in">
        <button className="detail-back" onClick={() => setSelectedId(null)}>← 과제 목록</button>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="page-title">{selected.title}</div>
              <div className="page-subtitle">
                마감: {formatDateTime(selected.due_at)} · 제출 {subs.length}/{members.length}명
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => handleOpenEditModal(selected)}>
                <Edit size={16} /> 수정
              </button>
              <button className="btn btn-secondary" onClick={() => handleDeleteAssignment(selected.id)}>
                <Trash2 size={16} /> 삭제
              </button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="section-title">제출 현황</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>클릭하여 상태 변경 (미제출 → 제출 → 지각 제출 → 미제출)</div>
          <table className="data-table">
            <thead>
              <tr><th>이름</th><th>학과</th><th>상태</th><th>제출 시간</th><th>GitHub URL</th><th>제출 파일</th></tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const sub = subs.find((s) => s.user_id === m.id)
                const fileName = sub?.file_url ? getDisplayFileName(sub.file_url) : ''
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</td>
                    <td>{m.department}</td>
                    <td>
                      <button className="btn btn-sm" style={{
                        background: sub ? `${getStatusColor(sub.status)}18` : 'rgba(148,163,184,0.1)',
                        color: sub ? getStatusColor(sub.status) : 'var(--text-muted)',
                        border: 'none', fontWeight: 600,
                      }} onClick={() => toggleSubStatus(m.id)}>
                        {sub ? getStatusLabel(sub.status) : '미제출'}
                      </button>
                    </td>
                    <td style={{ fontSize: 12 }}>{sub ? formatDateTime(sub.submitted_at) : '-'}</td>
                    <td style={{ fontSize: 12 }}>
                      {sub?.github_url ? (
                        <a href={sub.github_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                          {sub.github_url.replace('https://github.com/', '')}
                        </a>
                      ) : '-'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {sub?.file_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={fileName}>
                            {fileName}
                          </span>
                          <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); handleDownloadSubmission(sub.file_url!) }}>
                            <Download size={14} /> 다운로드
                          </button>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <div className="page-title">과제 관리</div>
          <div className="page-subtitle">과제를 출제하고 제출 현황을 관리하세요.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={18} /> 과제 출제</button>
      </div>

      {assignments.map((a) => {
        const subs = allSubmissions.filter((s) => s.assignment_id === a.id)
        const week = weeks.find((w) => w.id === a.week_id)
        const rate = members.length ? Math.round((subs.length / members.length) * 100) : 0
        return (
          <div key={a.id} className="card card-clickable" style={{ marginBottom: 12, padding: 16 }} onClick={() => setSelectedId(a.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={`assignment-dday ${a.status === 'open' ? 'dday-open' : 'dday-closed'}`}>
                {a.status === 'open' ? getDDay(a.due_at) : '마감'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {week?.number}주차 · {getSubmitTypeLabel(a.submit_type)} · 마감 {formatDateTime(a.due_at)} · 제출 {subs.length}/{members.length}명
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenEditModal(a)
                  }}
                >
                  <Edit size={14} /> 수정
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAssignment(a.id)
                  }}
                >
                  <Trash2 size={14} /> 삭제
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="progress-bar" style={{ width: 80 }}>
                  <div className="progress-fill" style={{ width: `${rate}%`, background: 'var(--accent)' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{rate}%</span>
              </div>
            </div>
          </div>
        )
      })}

      {assignmentModal && createPortal(assignmentModal, document.body)}
      {editAssignmentModal && createPortal(editAssignmentModal, document.body)}
    </div>
  )
}
