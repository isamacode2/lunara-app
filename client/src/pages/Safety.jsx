import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ExternalLink, AlertTriangle, Shield, Heart, Phone, Check, X, Loader } from 'lucide-react';

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
};

const headerStyle = {
  padding: '20px 20px 12px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const headerButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--accent)',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.2s',
};

const scrollContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  paddingBottom: '40px',
};

const contentStyle = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const titleStyle = {
  fontSize: '28px',
  fontFamily: "'Outfit', sans-serif",
  fontWeight: '700',
  margin: '12px 0',
};

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const cardTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  fontFamily: "'Outfit', sans-serif",
  flex: 1,
};

const cardBodyStyle = {
  padding: '20px',
};

const bulletListStyle = {
  listStyle: 'none',
  padding: '0',
  margin: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const bulletItemStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  fontSize: '14px',
  color: 'var(--text2)',
  lineHeight: '1.6',
};

const bulletDotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--accent)',
  marginTop: '8px',
  flexShrink: 0,
};

const buttonStyle = {
  padding: '12px 24px',
  borderRadius: 'var(--radius-lg)',
  fontSize: '15px',
  fontWeight: '600',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  width: '100%',
};

const primaryButtonStyle = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
  color: '#fff',
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: 'transparent',
  color: 'var(--text)',
  border: '1.5px solid var(--border-focus)',
};

const linkStyle = {
  color: 'var(--accent)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'opacity 0.2s',
  cursor: 'pointer',
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  zIndex: '200',
  animation: 'fadeIn 0.2s ease-out',
};

const modalContentStyle = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '28px',
  maxWidth: '440px',
  width: '100%',
  maxHeight: '80vh',
  overflowY: 'auto',
};

const modalTitleStyle = {
  fontSize: '22px',
  fontFamily: "'Outfit', sans-serif",
  fontWeight: '700',
  marginBottom: '16px',
  margin: '0',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginBottom: '16px',
};

const labelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text2)',
  paddingLeft: '2px',
};

const inputStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: '15px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  padding: '12px 14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239e95a9' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: '36px',
};

const textareaStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: '15px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  padding: '12px 14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
  minHeight: '100px',
  resize: 'vertical',
};

const modalActionsStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '24px',
};

const descriptionStyle = {
  fontSize: '14px',
  color: 'var(--text2)',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const infoBoxStyle = {
  background: 'var(--accent-dim)',
  border: '1px solid var(--accent)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  fontSize: '14px',
  color: 'var(--accent)',
  lineHeight: '1.6',
};

export default function Safety() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reportModal, setReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    reported_user_id: '',
    reported_user_search: '',
    reason: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmitReport() {
    if (!reportForm.reported_user_search || !reportForm.reason) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Search for user by display_name or email
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .or(`display_name.ilike.%${reportForm.reported_user_search}%,email.ilike.%${reportForm.reported_user_search}%`)
        .limit(1)
        .single();

      if (!userData) {
        setError('User not found');
        setSubmitting(false);
        return;
      }

      // Insert into safety_flags table
      const { error: insertError } = await supabase.from('safety_flags').insert({
        reporter_id: user.id,
        reported_user_id: userData.id,
        reason: reportForm.reason,
        description: reportForm.description,
        status: 'pending',
      });

      if (insertError) throw insertError;

      setSuccess('Report submitted. Thank you for helping keep our community safe.');
      setReportModal(false);
      setReportForm({
        reported_user_id: '',
        reported_user_search: '',
        reason: '',
        description: '',
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <button style={headerButtonStyle} onClick={() => navigate('/profile')}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: '700' }}>Safety & Privacy</h1>
      </div>

      <div style={scrollContainerStyle}>
        <div style={contentStyle}>
          <h2 style={titleStyle}>Safety & Privacy</h2>

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '14px', border: '1px solid var(--danger)' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '12px 16px', background: 'rgba(126, 196, 146, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '14px', border: '1px solid var(--success)' }}>
              {success}
            </div>
          )}

          {/* ENM Safety Tips */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <Heart size={20} color="var(--accent)" />
              <h3 style={cardTitleStyle}>ENM Safety Tips</h3>
            </div>
            <div style={cardBodyStyle}>
              <ul style={bulletListStyle}>
                <li style={bulletItemStyle}>
                  <div style={bulletDotStyle} />
                  <span><strong>Prioritize Consent:</strong> Always ensure enthusiastic, informed consent from all parties involved. Clear communication is the foundation of safe ENM relationships.</span>
                </li>
                <li style={bulletItemStyle}>
                  <div style={bulletDotStyle} />
                  <span><strong>Establish Boundaries:</strong> Have open conversations about limits, expectations, and comfort levels before engaging with partners. Revisit these regularly.</span>
                </li>
                <li style={bulletItemStyle}>
                  <div style={bulletDotStyle} />
                  <span><strong>Communicate Honestly:</strong> Share your feelings, concerns, and needs with all partners. Transparency builds trust in non-monogamous relationships.</span>
                </li>
                <li style={bulletItemStyle}>
                  <div style={bulletDotStyle} />
                  <span><strong>Safer Sex Practices:</strong> Use protection and get regular STI testing. Discuss sexual health openly with all partners.</span>
                </li>
                <li style={bulletItemStyle}>
                  <div style={bulletDotStyle} />
                  <span><strong>Meet in Safe Locations:</strong> For first meetings, choose public spaces. Tell a trusted friend where you're going.</span>
                </li>
                <li style={bulletItemStyle}>
                  <div style={bulletDotStyle} />
                  <span><strong>Trust Your Instincts:</strong> If something feels wrong, it's okay to step away. Your safety is paramount.</span>
                </li>
                <li style={bulletItemStyle}>
                  <div style={bulletDotStyle} />
                  <span><strong>Consent is Ongoing:</strong> Agree to check in with partners regularly. Consent can be withdrawn at any time.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Report a User */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <AlertTriangle size={20} color="var(--danger)" />
              <h3 style={cardTitleStyle}>Report a User</h3>
            </div>
            <div style={cardBodyStyle}>
              <p style={descriptionStyle}>
                If you encounter inappropriate behavior, harassment, or suspect a fake profile, please report it to our moderation team.
              </p>
              <button
                style={primaryButtonStyle}
                onClick={() => setReportModal(true)}
              >
                Report User
              </button>
            </div>
          </div>

          {/* Block a User */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <Shield size={20} color="var(--accent)" />
              <h3 style={cardTitleStyle}>Block a User</h3>
            </div>
            <div style={cardBodyStyle}>
              <p style={descriptionStyle}>
                You can block users to prevent them from contacting or viewing your profile.
              </p>
              <button
                style={secondaryButtonStyle}
                onClick={() => navigate('/blocked-users')}
              >
                Manage Blocked Users
              </button>
            </div>
          </div>

          {/* Community Guidelines */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Community Guidelines</h3>
            </div>
            <div style={cardBodyStyle}>
              <p style={descriptionStyle}>
                Learn about our community standards and how we keep Lunara safe for everyone.
              </p>
              <a
                style={linkStyle}
                href="https://lunara.dating/safety"
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Read Guidelines <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Emergency Resources */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <Phone size={20} color="var(--accent)" />
              <h3 style={cardTitleStyle}>Emergency Resources</h3>
            </div>
            <div style={cardBodyStyle}>
              <div style={infoBoxStyle}>
                <p style={{ margin: '0 0 12px', fontWeight: '600' }}>Crisis Support</p>
                <p style={{ margin: 0 }}>
                  If you're in crisis, please reach out to a crisis hotline or mental health professional in your area. Your safety and wellbeing matter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div style={modalOverlayStyle} onClick={() => setReportModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>Report User</h2>

            <div style={formGroupStyle}>
              <label style={labelStyle}>User Name or Email *</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="Search for the user..."
                value={reportForm.reported_user_search}
                onChange={(e) => setReportForm({ ...reportForm, reported_user_search: e.target.value })}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Reason for Report *</label>
              <select
                style={selectStyle}
                value={reportForm.reason}
                onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              >
                <option value="">Select a reason</option>
                <option value="Harassment">Harassment or Bullying</option>
                <option value="Fake Profile">Fake Profile</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="Spam">Spam</option>
                <option value="Sexual Exploitation">Sexual Exploitation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Description (Optional)</label>
              <textarea
                style={textareaStyle}
                placeholder="Please provide any additional details that help us understand the issue..."
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', border: '1px solid var(--danger)' }}>
                {error}
              </div>
            )}

            <div style={modalActionsStyle}>
              <button
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: 'var(--text2)',
                  border: '1.5px solid var(--border-focus)',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => {
                  setReportModal(false);
                  setError(null);
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onClick={handleSubmitReport}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Submit Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
