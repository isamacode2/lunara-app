import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MoonLogo from '../components/MoonLogo';

const pageStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  background: 'var(--bg)',
};

const cardStyle = {
  width: '100%',
  maxWidth: '400px',
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
};

const headerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  textAlign: 'center',
};

const logoStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle = {
  fontSize: '32px',
  fontFamily: "'Outfit', sans-serif",
  fontWeight: '800',
  color: 'var(--ink)',
  letterSpacing: '-0.5px',
  margin: '0',
};

const subtitleStyle = {
  fontSize: '14px',
  color: 'var(--text2)',
  margin: '0',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const linksStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  fontSize: '14px',
  textAlign: 'center',
};

const linkStyle = {
  color: 'var(--accent)',
  textDecoration: 'none',
  transition: 'opacity 0.2s',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle} className="anim-in">
        <div style={headerStyle}>
          <div style={logoStyle}>
            <MoonLogo size={56} />
          </div>
          <h1 style={titleStyle}>Lunara</h1>
          <p style={subtitleStyle}>Grow into your relationships</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="msg-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={linksStyle}>
          <span>
            Don't have an account?{' '}
            <Link to="/signup" style={linkStyle}>
              Sign up
            </Link>
          </span>
          <Link to="/forgot-password" style={linkStyle}>
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
