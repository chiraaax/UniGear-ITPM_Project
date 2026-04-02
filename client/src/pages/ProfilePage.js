import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/* ─── Inline styles (you can delete ProfilePage.css) ───────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0d0f14 0%, #141820 60%, #0d1117 100%)',
    fontFamily: "'DM Sans', sans-serif",
    color: '#e8eaf0',
    padding: '40px 20px 80px',
  },
  maxW: {
    maxWidth: 1100,
    margin: '0 auto',
  },

  /* ── Page Header ── */
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 40,
    paddingBottom: 24,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#6ee7b7',
    boxShadow: '0 0 10px #6ee7b7',
    flexShrink: 0,
  },
  pageTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: '#f0f2f8',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    margin: '3px 0 0',
  },

  /* ── Two-column grid ── */
  grid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 24,
    alignItems: 'start',
  },

  /* ── Generic card ── */
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: '28px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 16,
    fontWeight: 600,
    color: '#c9ccd6',
    margin: 0,
  },

  /* ── Avatar card ── */
  avatarCard: {
    background: 'linear-gradient(160deg, rgba(110,231,183,0.08) 0%, rgba(255,255,255,0.02) 60%)',
    border: '1px solid rgba(110,231,183,0.12)',
    borderRadius: 20,
    padding: '36px 28px 28px',
    textAlign: 'center',
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6ee7b7, #3b82f6)',
    padding: 3,
    margin: '0 auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    boxShadow: '0 0 30px rgba(110,231,183,0.2)',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#1a1e2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 38,
    fontWeight: 700,
    color: '#6ee7b7',
  },
  avatarOverlayBase: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
    color: '#fff',
    fontWeight: 600,
    letterSpacing: '0.5px',
    transition: 'opacity 0.2s',
    pointerEvents: 'none',
  },
  userName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    fontWeight: 700,
    color: '#f0f2f8',
    margin: '0 0 4px',
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    margin: 0,
  },
  uploadBtn: {
    marginTop: 16,
    padding: '9px 22px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
    border: 'none',
    color: '#0d1117',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    letterSpacing: '0.3px',
  },

  /* ── Loyalty card ── */
  loyaltyCard: {
    marginTop: 20,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: '24px 28px',
  },
  loyaltyTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#4b5563',
    margin: '0 0 16px',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 14,
    marginBottom: 14,
  },
  badgeIcon: { fontSize: 24 },
  badgeName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.1,
  },
  badgeSub: { fontSize: 11, margin: '2px 0 0', opacity: 0.7 },
  pointsRow: { display: 'flex', alignItems: 'baseline', gap: 6 },
  pointsNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 32,
    fontWeight: 700,
    color: '#f0f2f8',
  },
  pointsLabel: { fontSize: 13, color: '#6b7280' },
  progressBar: {
    marginTop: 14,
    height: 4,
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 99 },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#4b5563',
    marginTop: 7,
  },

  /* ── Right column ── */
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20 },

  /* ── Edit button ── */
  editBtn: {
    padding: '7px 18px',
    borderRadius: 8,
    background: 'rgba(110,231,183,0.1)',
    border: '1px solid rgba(110,231,183,0.2)',
    color: '#6ee7b7',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    letterSpacing: '0.2px',
  },

  /* ── Info tiles ── */
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  infoField: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '14px 18px',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#4b5563',
    margin: '0 0 5px',
  },
  infoValue: { fontSize: 15, color: '#c9ccd6', margin: 0, fontWeight: 500 },

  /* ── Form ── */
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 7 },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    gridColumn: '1 / -1',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#4b5563',
  },
  input: {
    padding: '12px 14px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e8eaf0',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: 'none',
  },
  inputDisabled: {
    padding: '12px 14px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    color: '#4b5563',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: 'none',
    cursor: 'not-allowed',
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e8eaf0',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    minHeight: 80,
  },
  saveBtn: {
    marginTop: 6,
    padding: '12px 28px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
    border: 'none',
    color: '#0d1117',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    letterSpacing: '0.3px',
  },

  /* ── History ── */
  historyList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  historyLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  historyIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'rgba(110,231,183,0.1)',
    border: '1px solid rgba(110,231,183,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0,
  },
  historyAction: { fontSize: 14, color: '#c9ccd6', fontWeight: 500 },
  historyRight: { display: 'flex', alignItems: 'center', gap: 16 },
  historyPts: { fontSize: 14, fontWeight: 700, color: '#6ee7b7' },
  historyDate: { fontSize: 12, color: '#4b5563' },
  noHistory: {
    textAlign: 'center', color: '#4b5563',
    fontSize: 14, padding: '30px 0', fontStyle: 'italic',
  },

  /* ── Loader ── */
  loader: {
    minHeight: '100vh',
    background: '#0d0f14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 16,
    fontFamily: "'DM Sans', sans-serif",
    color: '#4b5563',
    fontSize: 14,
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid rgba(110,231,183,0.15)',
    borderTopColor: '#6ee7b7',
    borderRadius: '50%',
    animation: 'pf-spin 0.8s linear infinite',
  },
};

/* ─── Rank config ───────────────────────────────────────────────────────────── */
const RANKS = {
  bronze: {
    icon: '🥉', label: 'Bronze',
    gradient: 'linear-gradient(135deg,rgba(180,83,9,0.25),rgba(180,83,9,0.08))',
    border: 'rgba(180,83,9,0.3)', color: '#f59e0b', max: 200, next: 'Silver',
  },
  silver: {
    icon: '🥈', label: 'Silver',
    gradient: 'linear-gradient(135deg,rgba(148,163,184,0.25),rgba(148,163,184,0.08))',
    border: 'rgba(148,163,184,0.3)', color: '#94a3b8', max: 500, next: 'Gold',
  },
  gold: {
    icon: '🏆', label: 'Gold',
    gradient: 'linear-gradient(135deg,rgba(234,179,8,0.25),rgba(234,179,8,0.08))',
    border: 'rgba(234,179,8,0.3)', color: '#eab308', max: null, next: null,
  },
};

/* ─── Component ─────────────────────────────────────────────────────────────── */
const ProfilePage = () => {
  const { token } = useAuth();
  const [profile, setProfile]           = useState(null);
  const [editing, setEditing]           = useState(false);
  const [formData, setFormData]         = useState({ name: '', phone: '', address: '' });
  const [imageFile, setImageFile]       = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [avatarHover, setAvatarHover]   = useState(false);

  /* Inject Google Fonts + spinner keyframe once */
  useEffect(() => {
    if (!document.getElementById('pf-fonts')) {
      const link = document.createElement('link');
      link.id  = 'pf-fonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('pf-spin')) {
      const style = document.createElement('style');
      style.id          = 'pf-spin';
      style.textContent = '@keyframes pf-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }
  }, []);

  /* Fetch profile */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res  = await fetch('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
          setFormData({ name: data.name || '', phone: data.phone || '', address: data.address || '' });
          if (data.profileImage) setPreviewImage(`http://localhost:5000${data.profileImage}`);
        } else {
          console.error('Failed to load profile:', data);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
    else setLoading(false);
  }, [token]);

  /* ── Handlers ── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res  = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) { setProfile(data); setEditing(false); }
      else alert(data.message || 'Error updating profile');
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res  = await fetch('http://localhost:5000/api/users/profile/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(prev => ({ ...prev, profileImage: data.profileImage }));
        setPreviewImage(`http://localhost:5000${data.profileImage}`);
        setImageFile(null);
      } else {
        alert(data.message || 'Error uploading image');
      }
    } catch (err) {
      console.error('Upload error', err);
    }
  };

  /* ── Rank helpers ── */
  const rankKey  = (profile && profile.rank ? profile.rank : 'bronze').toLowerCase();
  const rankCfg  = RANKS[rankKey] || RANKS.bronze;
  const pts      = profile ? (profile.loyaltyPoints || 0) : 0;
  const progress = rankCfg.max ? Math.min((pts / rankCfg.max) * 100, 100) : 100;

  /* ── Loading / error ── */
  if (loading) {
    return (
      React.createElement('div', { style: S.loader },
        React.createElement('div', { style: S.spinner }),
        React.createElement('span', null, 'Loading your profile…')
      )
    );
  }

  if (!profile) {
    return (
      React.createElement('div', { style: S.loader },
        React.createElement('span', {
          style: { color: '#e8eaf0', fontSize: 18, fontFamily: "'Playfair Display', serif" }
        }, 'Could not load profile.'),
        React.createElement('span', null, 'Ensure you are logged in and the server is running on port 5000.')
      )
    );
  }

  const infoFields = [
    { label: 'Full Name',     value: profile.name,                  full: false },
    { label: 'Email Address', value: profile.email,                 full: false },
    { label: 'Phone Number',  value: profile.phone    || 'Not provided', full: false },
    { label: 'Address',       value: profile.address  || 'Not provided', full: true  },
  ];

  /* ── Render ── */
  return (
    <div style={S.page}>
      <div style={S.maxW}>

        {/* Page header */}
        <div style={S.pageHeader}>
          <div style={S.headerDot} />
          <div>
            <h1 style={S.pageTitle}>My Profile</h1>
            <p style={S.pageSubtitle}>Manage your account and loyalty rewards</p>
          </div>
        </div>

        <div style={S.grid}>

          {/* ── Left sidebar ── */}
          <div>

            {/* Avatar card */}
            <div style={S.avatarCard}>
              <div
                style={S.avatarRing}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => document.getElementById('pf-file-upload').click()}
              >
                <div style={S.avatarInner}>
                  {previewImage
                    ? <img src={previewImage} alt="Profile" style={S.avatarImg} />
                    : <span style={S.avatarPlaceholder}>
                        {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                      </span>
                  }
                </div>
                <div style={{ ...S.avatarOverlayBase, opacity: avatarHover ? 1 : 0 }}>
                  <span>📷</span>
                  <span>Change photo</span>
                </div>
              </div>

              <input
                id="pf-file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              <p style={S.userName}>{profile.name}</p>
              <p style={S.userEmail}>{profile.email}</p>

              {imageFile && (
                <button style={S.uploadBtn} onClick={handleImageUpload}>
                  Upload Photo
                </button>
              )}
            </div>

            {/* Loyalty card */}
            <div style={S.loyaltyCard}>
              <p style={S.loyaltyTitle}>Loyalty Status</p>

              <div style={{
                ...S.badge,
                background: rankCfg.gradient,
                border: `1px solid ${rankCfg.border}`,
              }}>
                <span style={S.badgeIcon}>{rankCfg.icon}</span>
                <div>
                  <p style={{ ...S.badgeName, color: rankCfg.color }}>
                    {rankCfg.label} Member
                  </p>
                  {rankCfg.next && (
                    <p style={S.badgeSub}>Next tier: {rankCfg.next}</p>
                  )}
                </div>
              </div>

              <div style={S.pointsRow}>
                <span style={S.pointsNum}>{pts.toLocaleString()}</span>
                <span style={S.pointsLabel}>points earned</span>
              </div>

              {rankCfg.max && (
                <>
                  <div style={S.progressBar}>
                    <div style={{
                      ...S.progressFill,
                      width: progress + '%',
                      background: `linear-gradient(90deg, ${rankCfg.color}, ${rankCfg.color}aa)`,
                    }} />
                  </div>
                  <div style={S.progressLabel}>
                    <span>{pts} pts</span>
                    <span>{rankCfg.max} pts for {rankCfg.next}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={S.rightCol}>

            {/* Personal info card */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>Personal Information</h3>
                <button
                  style={S.editBtn}
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? '✕ Cancel' : '✎ Edit'}
                </button>
              </div>

              {editing ? (
                <form onSubmit={handleUpdateProfile}>
                  <div style={S.formGrid}>
                    <div style={S.formGroup}>
                      <label style={S.label}>Full Name</label>
                      <input
                        style={S.input}
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Email</label>
                      <input
                        style={S.inputDisabled}
                        type="email"
                        value={profile.email}
                        disabled
                      />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Phone Number</label>
                      <input
                        style={S.input}
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div style={S.formGroup} />
                    <div style={S.formGroupFull}>
                      <label style={S.label}>Address</label>
                      <textarea
                        style={S.textarea}
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <button type="submit" style={S.saveBtn}>Save Changes</button>
                  </div>
                </form>
              ) : (
                <div style={S.infoGrid}>
                  {infoFields.map(function(field) {
                    return (
                      <div
                        key={field.label}
                        style={field.full
                          ? { ...S.infoField, gridColumn: '1 / -1' }
                          : S.infoField
                        }
                      >
                        <p style={S.infoLabel}>{field.label}</p>
                        <p style={S.infoValue}>{field.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Points history card */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>Points History</h3>
                {profile.pointsHistory && profile.pointsHistory.length > 0 && (
                  <span style={{ fontSize: 12, color: '#4b5563' }}>
                    {profile.pointsHistory.length} transactions
                  </span>
                )}
              </div>

              {profile.pointsHistory && profile.pointsHistory.length > 0 ? (
                <ul style={S.historyList}>
                  {profile.pointsHistory.slice().reverse().map(function(entry, i) {
                    return (
                      <li key={i} style={S.historyItem}>
                        <div style={S.historyLeft}>
                          <div style={S.historyIcon}>⭐</div>
                          <span style={S.historyAction}>{entry.action}</span>
                        </div>
                        <div style={S.historyRight}>
                          <span style={S.historyPts}>+{entry.points} pts</span>
                          <span style={S.historyDate}>
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={S.noHistory}>
                  No points history yet. Start earning to see your rewards here.
                </p>
              )}
            </div>

          </div>{/* end right col */}
        </div>{/* end grid */}
      </div>
    </div>
  );
};

export default ProfilePage;