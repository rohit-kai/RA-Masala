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
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  };

  const validateZip = (zip: string) => {
    return /^[0-9]{5,6}$/.test(zip);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      Swal.fire({ icon: 'error', title: t('sgn_swal_error_title'), text: t('sgn_name_required'), confirmButtonColor: '#aa1a31' });
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      Swal.fire({ icon: 'error', title: t('sgn_swal_error_title'), text: t('sgn_email_invalid'), confirmButtonColor: '#aa1a31' });
      return;
    }
    if (phone && !validatePhone(phone)) {
      Swal.fire({ icon: 'error', title: t('sgn_swal_error_title'), text: t('sgn_phone_invalid'), confirmButtonColor: '#aa1a31' });
      return;
    }
    if (!address.trim()) {
      Swal.fire({ icon: 'error', title: t('sgn_swal_error_title'), text: t('sgn_address_required'), confirmButtonColor: '#aa1a31' });
      return;
    }
    if (!city.trim()) {
      Swal.fire({ icon: 'error', title: t('sgn_swal_error_title'), text: t('sgn_city_required'), confirmButtonColor: '#aa1a31' });
      return;
    }
    if (!zip.trim() || !validateZip(zip)) {
      Swal.fire({ icon: 'error', title: t('sgn_swal_error_title'), text: t('sgn_zip_invalid'), confirmButtonColor: '#aa1a31' });
      return;
    }
    if (!password || !validatePassword(password)) {
      Swal.fire({ icon: 'error', title: t('sgn_swal_error_title'), text: t('sgn_password_min'), confirmButtonColor: '#aa1a31' });
      return;
    }

    const res = await signup(name, email, password, phone, address, city, zip);
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
                  required
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
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">{t('chk_phone_label')}</label>
                <input 
                  type="tel" 
                  className="form-control border-2 rounded-3" 
                  placeholder={t('chk_phone_placeholder')} 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">{t('chk_address_line_label')}</label>
                <input 
                  type="text" 
                  className="form-control border-2 rounded-3" 
                  placeholder={t('chk_address_placeholder')} 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">{t('chk_city_label')}</label>
                <input 
                  type="text" 
                  className="form-control border-2 rounded-3" 
                  placeholder={t('sgn_city_placeholder')} 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-secondary fw-semibold">{t('chk_zip_label')}</label>
                <input 
                  type="text" 
                  className="form-control border-2 rounded-3" 
                  placeholder={t('sgn_zip_placeholder')} 
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                  required
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
                  required
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
