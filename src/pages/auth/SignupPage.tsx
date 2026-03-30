import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dept, setDept] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      setError('이름, 이메일, 비밀번호는 필수입니다.')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    setLoading(true)
    const result = await signUp(email, password, name, dept)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-accent" />
      <div className="login-bg-accent2" />
      <div className="login-card fade-in">
        <div className="login-logo">
          <div className="logo-mark" style={{ width: 56, height: 56, fontSize: 22, margin: '0 auto 16px', borderRadius: 16 }}>LT</div>
          <div className="login-title">회원가입</div>
          <div className="login-subtitle">멋쟁이사자처럼 14기 프론트엔드</div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">이름 (실명)</label>
          <input className="form-input" placeholder="홍길동" value={name}
            onChange={(e) => { setName(e.target.value); setError('') }} />
        </div>
        <div className="form-group">
          <label className="form-label">학과/소속</label>
          <input className="form-input" placeholder="컴퓨터공학과" value={dept}
            onChange={(e) => setDept(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">이메일</label>
          <input className="form-input" type="email" placeholder="example@likelion.org" value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }} />
        </div>
        <div className="form-group">
          <label className="form-label">비밀번호</label>
          <input className="form-input" type="password" placeholder="8자 이상, 영문+숫자" value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, borderRadius: 12, marginTop: 8 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>

        <div className="login-footer">
          이미 계정이 있으신가요?{' '}
          <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  )
}
