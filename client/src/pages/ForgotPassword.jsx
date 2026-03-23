import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MoonLogo from '../components/MoonLogo';

const pageStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  backgroundImage: 'linear-gradient(135deg, rgba(59,32,112,0.1) 0%, rgba(180,124,255,0.05) 100%)',
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
  fontFamily: "'Playfair Display', serif",
  fontWeight: '700',
  background: 'linear-gradient(135deg, #b47cff 0%, #ffbe55 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  margin: '0',
};

const subtitleStyle = {
  fontSize: '14px',
  color: 'var(--text2)',
  margin: '0',
};

const descriptionStyle = {
  fontSize: '14px',
  color: 'var(--text2)',
  lineHeight: '1.5',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const linkStyle = {
  color: 'var(--accent)',
  textDecoration: 'none',
  transition: 'opacity 0.2s',
  textAlign: 'center',
  fontSize: '14px',
};

const confirmationStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  textAlign: 'center',
};

const checkIconStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'var(--accent-dim)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  color: 'var(--accent)',
};

const confirmationTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const confirmationTitleStyle = {
  fontSize: '22px',
  fontFamily: "'Playfair Display', serif",
  fontWeight: '700',
  color: 'var(--text)',
  margin: '0',
};

const confirmationDescStyle = {
  fontSize: '14px',
  color: 'var(--text2)',
  lineHeight: '1.5',
  margin: '0',
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Error sending reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle} className="anim-in">
          <div style={confirmationStyle}>
            <div style={checkIconStyle}>✓</div>
            <div style={confirmationTextStyle}>
              <h2 style={confirmationTitleStyle}>Check your email</h2>
              <p style={confirmationDescStyle}>
                We've sent a password reset link to <strong>{email}</strong>. Click it to set a new password.
              </p>
            </div>
            <Link
              to="/login"
              className="btn btn-primary btn-lg btn-full"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle} className="anim-in">
        <div style={headerStyle}>
          <div style={logoStyle}>
            <MoonLogo size={56} />
          </div>
          <h1 style={titleStyle}>Reset password</h1>
          <p style={descriptionStyle}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
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

          {error && <div className="msg-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        <Link to="/login" style={linkStyle}>
          Back to login
        </Link>
      </div>
    </div>
  );
}
