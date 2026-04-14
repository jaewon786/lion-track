import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCreateWeek, useWeeks, useUpdateWeek, useDeleteWeek } from '../../hooks/useWeeks'
import { useMaterials, useCreateMaterial, uploadMaterialFile, useDeleteMaterial, getMaterialDownloadUrl } from '../../hooks/useMaterials'
import { useAuthStore } from '../../stores/authStore'
import { formatDate } from '../../utils/format'
import { FileText, Link as LinkIcon, Plus, Upload, Trash2, Edit, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminWeeksPage() {
  const activeTrack = useAuthStore((s) => s.activeTrack)
  const { data: weeks = [] } = useWeeks()
  const createWeek = useCreateWeek()
  const updateWeek = useUpdateWeek()
  const deleteWeek = useDeleteWeek()
  const { data: materials = [] } = useMaterials()
  const createMaterial = useCreateMaterial()
  const deleteMaterial = useDeleteMaterial()
  
  const [showModal, setShowModal] = useState(false)
  const [showWeekModal, setShowWeekModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null)
  const [form, setForm] = useState({ week_id: '', type: 'FILE', title: '', description: '', url: '', file: null as File | null })
  const [weekForm, setWeekForm] = useState({ number: 1, title: '', description: '', session_date: '' })
  const [editForm, setEditForm] = useState({ title: '', description: '', session_date: '' })

  const handleOpenWeekModal = () => {
    const usedNumbers = new Set(weeks.map((w) => w.number))
    const nextNumber = Array.from({ length: 10 }, (_, i) => i + 1).find((n) => !usedNumbers.has(n)) ?? 10
    setWeekForm({ number: nextNumber, title: '', description: '', session_date: '' })
    setShowWeekModal(true)
  }

  const handleOpen = () => {
    if (!weeks.length) {
      toast.error('먼저 주차를 생성한 뒤 자료를 업로드하세요.')
      return
    }
    setForm({ week_id: weeks[0]?.id ?? '', type: 'FILE', title: '', description: '', url: '', file: null })
    setShowModal(true)
  }

  useEffect(() => {
    if (showModal && !form.week_id && weeks.length) {
      setForm((prev) => ({ ...prev, week_id: weeks[0].id }))
    }
  }, [showModal, form.week_id, weeks])

  const handleSubmit = async () => {
    if (!form.week_id) {
      toast.error('주차를 선택하세요.')
      return
    }
    if (!form.title.trim()) {
      toast.error('자료명을 입력하세요.')
      return
    }

    if (form.type === 'FILE' && !form.file) {
      toast.error('업로드할 파일을 선택하세요.')
      return
    }

    if (form.type === 'LINK' && !form.url.trim()) {
      toast.error('외부 링크 URL을 입력하세요.')
      return
    }

    try {
      let url = form.url
      if (form.type === 'FILE' && form.file) {
        url = await uploadMaterialFile(form.week_id, form.file)
      }
      await createMaterial.mutateAsync({
        week_id: form.week_id,
        type: form.type as 'FILE' | 'LINK',
        title: form.title,
        description: form.description || '',
        url,
        is_public: true,
      })
      toast.success('자료가 업로드되었습니다.')
      setShowModal(false)
    } catch (error) {
      console.error('[자료 업로드 오류]', error)
      const message = error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: unknown }).message) : '업로드에 실패했습니다.')
      if (message.toLowerCase().includes('mime type') && message.toLowerCase().includes('not supported')) {
        toast.error('업로드 실패: 파일 형식이 허용되지 않습니다. Supabase Storage 버킷의 Allowed MIME types 설정을 확인하세요.')
      } else if (message.toLowerCase().includes('bucket') || message.toLowerCase().includes('not found')) {
        toast.error('업로드 실패: Supabase Storage에 "materials" 버킷이 없습니다. 대시보드에서 버킷을 생성하세요.')
      } else if (message.toLowerCase().includes('policy') || message.toLowerCase().includes('permission') || message.toLowerCase().includes('denied')) {
        toast.error('업로드 실패: 권한이 없습니다. Supabase Storage 버킷의 접근 정책을 확인하세요.')
      } else {
        toast.error(`업로드 실패: ${message}`)
      }
    }
  }

  const handleCreateWeek = async () => {
    if (!weekForm.title.trim() || !weekForm.session_date) {
      toast.error('주차 제목과 날짜를 입력하세요.')
      return
    }

    try {
      await createWeek.mutateAsync({
        number: weekForm.number,
        title: weekForm.title.trim(),
        description: weekForm.description.trim(),
        session_date: weekForm.session_date,
        status: 'upcoming',
        track: activeTrack,
      })
      toast.success('주차가 생성되었습니다.')
      setShowWeekModal(false)
    } catch {
      toast.error('주차 생성에 실패했습니다. 번호 중복 여부를 확인하세요.')
    }
  }

  const handleOpenEditModal = (week: typeof weeks[0]) => {
    setEditingWeekId(week.id)
    setEditForm({ title: week.title, description: week.description, session_date: week.session_date })
    setShowEditModal(true)
  }

  const handleUpdateWeek = async () => {
    if (!editForm.title.trim() || !editForm.session_date) {
      toast.error('주차 제목과 날짜를 입력하세요.')
      return
    }

    try {
      await updateWeek.mutateAsync({
        id: editingWeekId!,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        session_date: editForm.session_date,
      })
      toast.success('주차가 수정되었습니다.')
      setShowEditModal(false)
      setEditingWeekId(null)
    } catch {
      toast.error('주차 수정에 실패했습니다.')
    }
  }

  const handleDeleteWeek = async (weekId: string) => {
    if (!confirm('정말로 이 주차를 삭제하겠습니까? 관련된 모든 자료도 함께 삭제됩니다.')) return
    try {
      await deleteWeek.mutateAsync(weekId)
      toast.success('주차가 삭제되었습니다.')
    } catch {
      toast.error('주차 삭제에 실패했습니다.')
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('정말로 이 자료를 삭제하겠습니까?')) return
    try {
      await deleteMaterial.mutateAsync(materialId)
      toast.success('자료가 삭제되었습니다.')
    } catch {
      toast.error('자료 삭제에 실패했습니다.')
    }
  }

  const handleDownloadMaterial = async (material: typeof materials[0]) => {
    if (material.type === 'LINK') {
      window.open(material.url, '_blank')
      return
    }
    try {
      const signedUrl = await getMaterialDownloadUrl(material.url)
      if (!signedUrl) throw new Error('다운로드 URL 생성 실패')
      const res = await fetch(signedUrl)
      if (!res.ok) throw new Error('파일을 가져오지 못했습니다.')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = material.title || material.url.split('/').pop() || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('[다운로드 오류]', err)
      const msg = err instanceof Error ? err.message : '다운로드에 실패했습니다.'
      toast.error(`다운로드 실패: ${msg}`)
    }
  }

  const modal = showModal ? (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">새 수업자료 업로드</div>
        <div className="form-group">
          <label className="form-label">주차 선택</label>
          <select className="form-input" value={form.week_id} onChange={(e) => setForm({ ...form, week_id: e.target.value })} disabled={!weeks.length}>
            {!weeks.length && <option value="">주차가 없습니다</option>}
            {weeks.map((w) => <option key={w.id} value={w.id}>{w.number}주차 - {w.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">자료 유형</label>
          <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="FILE">파일 업로드</option>
            <option value="LINK">외부 링크</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">자료명</label>
          <input className="form-input" placeholder="자료 제목을 입력하세요" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">설명 (선택)</label>
          <input className="form-input" placeholder="간단한 설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {form.type === 'FILE' ? (
          <div className="form-group">
            <label className="form-label">파일</label>
            <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => document.getElementById('file-upload')?.click()}>
              <Upload size={20} />
              <div style={{ marginTop: 8, fontSize: 13 }}>{form.file ? form.file.name : '파일을 드래그하거나 클릭 (최대 50MB)'}</div>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.zip,.doc,.docx,.pptx,.ppt,.xlsx,.xls,.txt,.hwp,image/*,video/*"
              style={{ display: 'none' }}
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">URL</label>
            <input className="form-input" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={createMaterial.isPending}>
            {createMaterial.isPending ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  const weekModal = showWeekModal ? (
    <div className="modal-overlay" onClick={() => setShowWeekModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">주차 추가</div>
        <div className="form-group">
          <label className="form-label">주차 번호</label>
          <select className="form-input" value={weekForm.number} onChange={(e) => setWeekForm({ ...weekForm, number: Number(e.target.value) })}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}주차</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">주차 제목</label>
          <input className="form-input" placeholder="예: React 상태 관리" value={weekForm.title} onChange={(e) => setWeekForm({ ...weekForm, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">설명 (선택)</label>
          <input className="form-input" placeholder="이번 주 학습 주제" value={weekForm.description} onChange={(e) => setWeekForm({ ...weekForm, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">수업 날짜</label>
          <input
            type="date"
            className="form-input"
            value={weekForm.session_date}
            onChange={(e) => setWeekForm({ ...weekForm, session_date: e.target.value })}
            onMouseDown={(e) => {
              const input = e.currentTarget
              if (typeof input.showPicker === 'function') input.showPicker()
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowWeekModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={handleCreateWeek} disabled={createWeek.isPending}>
            {createWeek.isPending ? '생성 중...' : '주차 생성'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  const editModal = showEditModal && editingWeekId ? (
    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">주차 수정</div>
        <div className="form-group">
          <label className="form-label">주차 제목</label>
          <input className="form-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">설명 (선택)</label>
          <input className="form-input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">수업 날짜</label>
          <input
            type="date"
            className="form-input"
            value={editForm.session_date}
            onChange={(e) => setEditForm({ ...editForm, session_date: e.target.value })}
            onMouseDown={(e) => {
              const input = e.currentTarget
              if (typeof input.showPicker === 'function') input.showPicker()
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={handleUpdateWeek} disabled={updateWeek.isPending}>
            {updateWeek.isPending ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <div className="page-title">주차 관리</div>
          <div className="page-subtitle">수업자료를 업로드하고 주차를 관리하세요.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleOpenWeekModal}><Plus size={18} /> 주차 추가</button>
          <button className="btn btn-primary" onClick={handleOpen}><Plus size={18} /> 자료 업로드</button>
        </div>
      </div>

      {weeks.map((w) => {
        const wMats = materials.filter((m) => m.week_id === w.id)
        return (
          <div key={w.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: wMats.length ? 12 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="week-card-number">WEEK {String(w.number).padStart(2, '0')}</span>
                <span style={{ fontWeight: 600 }}>{w.title}</span>
                <span className={`week-status ${w.status}`} style={{ fontSize: 10 }}>
                  {w.status === 'completed' ? '완료' : w.status === 'current' ? '진행 중' : '예정'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(w.session_date)} · 자료 {wMats.length}개</span>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', border: 'none', padding: '6px 10px' }}
                  onClick={() => handleOpenEditModal(w)}
                >
                  <Edit size={16} />
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: 'none', padding: '6px 10px' }}
                  onClick={() => handleDeleteWeek(w.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {wMats.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                <span style={{ color: m.type === 'FILE' ? 'var(--blue)' : 'var(--green)' }}>
                  {m.type === 'FILE' ? <FileText size={18} /> : <LinkIcon size={18} />}
                </span>
                <span style={{ flex: 1, fontSize: 13 }}>{m.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.type}</span>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: 'none', padding: '4px 6px' }}
                  onClick={() => handleDownloadMaterial(m)}
                  title={m.type === 'FILE' ? '다운로드' : '열기'}
                >
                  <Download size={14} />
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: 'none', padding: '4px 6px' }}
                  onClick={() => handleDeleteMaterial(m.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )
      })}

      {modal && createPortal(modal, document.body)}
      {weekModal && createPortal(weekModal, document.body)}
      {editModal && createPortal(editModal, document.body)}
    </div>
  )
}
