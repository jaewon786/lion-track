import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
// icons removed - unused

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
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
          <div className="login-title">LION-TRACK</div>
          <div className="login-subtitle">세션 학습 관리 플랫폼</div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">이메일</label>
          <input
            className="form-input"
            type="email"
            placeholder="example@likelion.org"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">비밀번호</label>
          <input
            className="form-input"
            type="password"
            placeholder="8자 이상, 영문+숫자"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, borderRadius: 12, marginTop: 8 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="login-footer">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  )
}
