import React, { useState } from 'react';
import Header from './includes/Header';
import Banner from '../components/Banner';
import Footer from './includes/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import axios from 'axios';
import { getAssetPath } from '../Utils/imageHelper';

const Contact: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Form States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      Swal.fire(t('cnt_error_title'), t('cnt_fill_fields_text'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/tickets', {
        customerName: name,
        customerEmail: email,
        message: message
      });
      Swal.fire(t('cnt_message_sent_title'), t('cnt_message_sent_text'), 'success');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire(t('cnt_submission_failed_title'), t('cnt_submission_failed_text'), 'error');
    } finally {
      setIsSubmitting(false);
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

      <Banner page={t('nav_contact')} path={[t('nav_home'), t('nav_contact')]} />

      <div className="container py-5 flex-grow-1 position-relative" style={{ zIndex: 2 }}>
        <div className="traditional-pattern-overlay"></div>

        <div className="row g-5">
          {/* Contact Details & Info Card */}
          <div className="col-12 col-lg-5 animate__animated animate__fadeInLeft">
            <span className="text-uppercase fw-bold tracking-wider" style={{ color: '#D2691E', fontSize: '0.9rem', letterSpacing: '2px' }}>
              {t('cnt_get_in_touch')}
            </span>
            <h2 className="fw-bold mb-4 mt-2 display-6" style={{ color: '#4A1525', fontFamily: 'serif' }}>
              {t('cnt_headline')}
            </h2>
            <p className="text-muted mb-5" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
              {t('cnt_subtext')}
            </p>

            <div className="d-flex flex-column gap-4">
              {/* Address Card */}
              <div className="d-flex align-items-start p-3 bg-white shadow-sm rounded-4 border-start border-4" style={{ borderColor: '#FFD700' }}>
                <div className="p-3 bg-light rounded-circle text-danger me-3">
                  <i className="bi bi-geo-alt-fill fs-4" style={{ color: '#aa1a31' }}></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#4A1525' }}>{t('cnt_locations_title')}</h5>
                  <div className="text-muted mb-0 small">
                    <p className="mb-1"><strong>{t('cnt_unit1_label')}</strong><br />
                      Gat No: 1814/A, Sangli-Tasgaon Road,<br />
                      A/P Kavathe Ekand - 416307,<br />
                      Tal. Tasgaon, Dist. Sangli (Mah), India</p>
                    <p className="mb-1"><strong>{t('cnt_unit2_label')}</strong><br />
                      C.S. No: 2030/2031, Navjeevan Nagar,<br />
                      Near Sanjay Industrial Estate,<br />
                      Sangli - 416406, Dist. Sangli (Mah), India</p>
                    <p className="mb-0"><strong>{t('cnt_unit3_label')}</strong><br />
                      Gat No: 24/25, Madhavnagar,<br />
                      Near Sanjay Industrial Estate,<br />
                      Sangli - 416406, Dist. Sangli (Mah), India</p>
                  </div>
                </div>
              </div>

              {/* Phone Card */}
              <div className="d-flex align-items-start p-3 bg-white shadow-sm rounded-4 border-start border-4" style={{ borderColor: '#FFD700' }}>
                <div className="p-3 bg-light rounded-circle text-danger me-3">
                  <i className="bi bi-telephone-fill fs-4" style={{ color: '#aa1a31' }}></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#4A1525' }}>{t('cnt_phone_title')}</h5>
                  <p className="text-muted mb-0 small">
                    {t('cnt_customer_care_no')}: 7518166686<br />
                    +91 9503993999 ({t('cnt_customer_support')})<br />
                    {t('cnt_hours')}
                  </p>
                </div>
              </div>

              {/* Email Card */}
              <div className="d-flex align-items-start p-3 bg-white shadow-sm rounded-4 border-start border-4" style={{ borderColor: '#FFD700' }}>
                <div className="p-3 bg-light rounded-circle text-danger me-3">
                  <i className="bi bi-envelope-fill fs-4" style={{ color: '#aa1a31' }}></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#4A1525' }}>{t('cnt_email_title')}</h5>
                  <p className="text-muted mb-0 small">
                    ramasale@ymail.com<br />
                    RAMASALE.6686@GMAIL.COM
                  </p>
                </div>
              </div>

              {/* Developers Card */}
              <div className="p-3 bg-white shadow-sm rounded-4 border-start border-4" style={{ borderColor: '#aa1a31' }}>
                <div className="d-flex align-items-start mb-3">
                  <div className="p-2 bg-light rounded-circle text-danger me-3" style={{ height: 'fit-content' }}>
                    <i className="bi bi-code-slash fs-4" style={{ color: '#aa1a31' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: '#4A1525' }}>{t('cnt_developers_title')}</h5>
                    <p className="text-muted mb-0 small" style={{ fontSize: '0.82rem' }}>
                      {t('cnt_dev_team')} •{' '}
                      <a href="mailto:rohitdongale3@gmail.com" className="text-decoration-none fw-semibold dev-email-link">
                        rohitdongale3@gmail.com
                      </a>
                      {' | '}
                      <a href="mailto:akashmahadik259@gmail.com" className="text-decoration-none fw-semibold dev-email-link">
                        akashmahadik259@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="row g-2 mt-1">
                  <div className="col-6">
                    <div className="p-2 rounded bg-light border text-center">
                      <strong className="d-block small text-dark">Rohit Dongale</strong>
                      <span className="text-secondary d-block mb-2" style={{ fontSize: '0.75rem' }}>{t('cnt_role_uiux')}</span>
                      <a href="https://rohit-kai.github.io/cyber-portfolio/" target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white w-100 py-1 fw-semibold" style={{ backgroundColor: '#aa1a31', fontSize: '0.75rem' }}>
                        <i className="bi bi-briefcase me-1"></i> {t('cnt_visit_portfolio')}
                      </a>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-light border text-center">
                      <strong className="d-block small text-dark">Akash Mahadik</strong>
                      <span className="text-secondary d-block mb-2" style={{ fontSize: '0.75rem' }}>{t('cnt_role_backend')}</span>
                      <a href="https://akash-mahadik.github.io/portfolio1/" target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white w-100 py-1 fw-semibold" style={{ backgroundColor: '#aa1a31', fontSize: '0.75rem' }}>
                        <i className="bi bi-briefcase me-1"></i> {t('cnt_visit_portfolio')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Card */}
            <div className="p-3 bg-white shadow-sm rounded-4 border-start border-4" style={{ borderColor: '#4A1525' }}>
              <div className="d-flex align-items-center mb-2">
                <div className="p-2 bg-light rounded-circle text-danger me-3" style={{ height: 'fit-content' }}>
                  <i className="bi bi-map-fill fs-5" style={{ color: '#aa1a31' }}></i>
                </div>
                <h5 className="fw-bold mb-0" style={{ color: '#4A1525' }}>{t('cnt_maps_title')}</h5>
              </div>
              <div className="mt-2 rounded-3 overflow-hidden border" style={{ height: 260 }}>
                <iframe
                  title="RA Masala on Google Maps"
                  src="https://www.google.com/maps?cid=2994242596398159361&output=embed"
                  style={{ border: 0, width: '100%', height: '100%' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Contact Interactive Form */}
          <div className="col-12 col-lg-7 animate__animated animate__fadeInRight">
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
              <h4 className="fw-bold mb-4" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                {t('cnt_form_title')}
              </h4>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label text-muted fw-semibold">{t('cnt_name_label')}</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-secondary border-end-0">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0"
                      required
                      placeholder={t('cnt_name_placeholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted fw-semibold">{t('cnt_email_title')}</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-secondary border-end-0">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control bg-light border-start-0"
                      required
                      placeholder={t('cnt_email_placeholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted fw-semibold">{t('cnt_message_label')}</label>
                  <textarea
                    className="form-control bg-light"
                    rows={5}
                    required
                    placeholder={t('cnt_message_placeholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn text-white fw-bold w-100 py-3 rounded-3 mt-2 shadow-sm"
                  style={{ backgroundColor: '#aa1a31', border: 'none', transition: 'all 0.3s ease' }}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : (
                    <i className="bi bi-send-fill me-2"></i>
                  )}
                  {t('cnt_send_btn')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .traditional-pattern-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.04;
          background-image: radial-gradient(#4A1525 1.5px, transparent 0);
          background-size: 24px 24px;
          pointer-events: none;
          z-index: 1;
        }
        .card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
        }
        .dev-email-link {
          color: #aa1a31 !important;
          text-decoration: underline !important;
        }
        .dev-email-link:hover {
          color: #D2691E !important;
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default Contact;
