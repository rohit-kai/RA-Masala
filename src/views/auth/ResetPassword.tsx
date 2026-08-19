import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';
import { getAssetPath } from '../../Utils/imageHelper';
import { useLanguage } from '../../context/LanguageContext';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: t('rsp_swal_invalid_link_title'),
        text: t('rsp_swal_invalid_link_text'),
        confirmButtonColor: '#aa1a31'
      });
      return;
    }
    if (password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: t('rsp_swal_weak_password_title'),
        text: t('rsp_swal_weak_password_text'),
        confirmButtonColor: '#aa1a31'
      });
      return;
    }
    if (password !== confirm) {
      Swal.fire({
        icon: 'error',
        title: t('rsp_swal_mismatch_title'),
        text: t('rsp_swal_mismatch_text'),
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(token, password);
    setIsSubmitting(false);

    Swal.fire({
      icon: res.success ? 'success' : 'error',
      title: res.success ? t('rsp_swal_success_title') : t('rsp_swal_reset_failed'),
      text: res.message,
      confirmButtonColor: '#aa1a31'
    });

    if (res.success) {
      setTimeout(() => navigate(RoutePaths.login), 2500);
    }
  };

  return (
    <div style={{
      backgroundImage: `linear-gradient(rgba(253, 246, 237, 0.85), rgba(253, 246, 237, 0.85)), url('${getAssetPath('images/sp2.png')}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <div className="container py-5 flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '450px', width: '100%', overflow: 'hidden' }}>
          <div className="py-4 text-center text-white position-relative" style={{ background: 'linear-gradient(135deg, #800c1e 0%, #aa1a31 100%)' }}>
            <h3 className="mb-1" style={{ fontFamily: 'serif', fontWeight: 'bold' }}>RA Masala</h3>
            <p className="mb-0 text-white-50" style={{ fontSize: '0.9rem' }}>{t('rsp_brand_tagline')}</p>
          </div>
          <div className="card-body p-4 p-md-5">
            <h4 className="text-center mb-3" style={{ color: '#4A1525', fontFamily: 'serif', fontWeight: 'bold' }}>{t('rsp_title')}</h4>
            <p className="text-muted text-center mb-4" style={{ fontSize: '0.9rem' }}>
              {t('rsp_subtitle')}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">{t('rsp_new_password_label')}</label>
                <input
                  type="password"
                  className="form-control border-2 rounded-3"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-secondary fw-semibold">{t('rsp_confirm_password_label')}</label>
                <input
                  type="password"
                  className="form-control border-2 rounded-3"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn w-100 text-white fw-bold border-0 rounded-3 shadow-sm"
                style={{ background: '#aa1a31', transition: '0.3s', padding: '12px' }}
              >
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-shield-lock me-2"></i>
                )}
                {t('rsp_submit')}
              </button>
            </form>

            <div className="mt-4 text-center login-card-links">
              <p className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                <Link to={RoutePaths.login}>{t('rsp_back_to_signin')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <style>{`
        .login-card-links a {
          color: #aa1a31 !important;
          font-weight: bold;
          text-decoration: none !important;
        }
        .login-card-links a:hover {
          color: #8c1224 !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
