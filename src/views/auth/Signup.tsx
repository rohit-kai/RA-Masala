import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      Swal.fire({
        icon: 'error',
        title: t('sgn_swal_error_title'),
        text: t('sgn_swal_fill_fields'),
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    const res = await signup(name, email, password);
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: t('sgn_swal_account_created'),
        text: res.message,
        timer: 1500,
        showConfirmButton: false
      });
      navigate(RoutePaths.home);
    } else {
      Swal.fire({
        icon: 'error',
        title: t('sgn_swal_signup_failed'),
        text: res.message,
        confirmButtonColor: '#aa1a31'
      });
    }
  };

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '450px', width: '100%', overflow: 'hidden' }}>
          <div className="py-4 text-center text-white position-relative" style={{ background: 'linear-gradient(135deg, #800c1e 0%, #aa1a31 100%)' }}>
            <h3 className="mb-1" style={{ fontFamily: 'serif', fontWeight: 'bold' }}>RA Masala</h3>
            <p className="mb-0 text-white-50" style={{ fontSize: '0.9rem' }}>{t('sgn_brand_tagline')}</p>
          </div>
          <div className="card-body p-4 p-md-5">
            <h4 className="text-center mb-4" style={{ color: '#4A1525', fontFamily: 'serif', fontWeight: 'bold' }}>{t('sgn_title')}</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">{t('sgn_full_name_label')}</label>
                <input 
                  type="text" 
                  className="form-control border-2 rounded-3" 
                  placeholder={t('sgn_name_placeholder')} 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">{t('sgn_email_label')}</label>
                <input 
                  type="email" 
                  className="form-control border-2 rounded-3" 
                  placeholder={t('sgn_email_placeholder')} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-secondary fw-semibold">{t('sgn_password_label')}</label>
                <input 
                  type="password" 
                  className="form-control border-2 rounded-3" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn w-100 py-2.5 text-white fw-bold border-0 rounded-3 shadow-sm"
                style={{ background: '#aa1a31' }}
              >
                {t('sgn_submit')}
              </button>
            </form>

            <div className="mt-4 text-center signup-card-links">
              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                {t('sgn_login_question')} <Link to={RoutePaths.login}>{t('sgn_login_link')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <style>{`
        .signup-card-links a {
          color: #aa1a31 !important;
          font-weight: bold;
          text-decoration: none !important;
        }
        .signup-card-links a:hover {
          color: #8c1224 !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
};

export default Signup;
