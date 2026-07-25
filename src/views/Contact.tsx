import React, { useState } from 'react';
import Header from './includes/Header';
import Banner from '../components/Banner';
import Footer from './includes/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import axios from 'axios';

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
      Swal.fire('Error', 'Please fill in all fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/tickets', {
        customerName: name,
        customerEmail: email,
        message: message
      });
      Swal.fire('Message Sent!', 'Thank you for reaching out. We will get back to you shortly.', 'success');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire('Submission Failed', 'Something went wrong. Please try again later.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      backgroundImage: "linear-gradient(rgba(253, 246, 237, 0.85), rgba(253, 246, 237, 0.85)), url('/images/sp2.png')",
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
              GET IN TOUCH
            </span>
            <h2 className="fw-bold mb-4 mt-2 display-6" style={{ color: '#4A1525', fontFamily: 'serif' }}>
              We'd Love to Hear From You
            </h2>
            <p className="text-muted mb-5" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
              Have questions about our premium spice blends, bulk orders, or want to share feedback? Reach out to us, and our team will get in touch with you.
            </p>

            <div className="d-flex flex-column gap-4">
              {/* Address Card */}
              <div className="d-flex align-items-start p-3 bg-white shadow-sm rounded-4 border-start border-4" style={{ borderColor: '#FFD700' }}>
                <div className="p-3 bg-light rounded-circle text-danger me-3">
                  <i className="bi bi-geo-alt-fill fs-4" style={{ color: '#aa1a31' }}></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#4A1525' }}>Corporate Office</h5>
                  <p className="text-muted mb-0 small">
                    RA Masala Private Limited<br />
                    abcd ichalkaranji,<br />
                    Maharashtra, India - 411048
                  </p>
                </div>
              </div>

              {/* Phone Card */}
              <div className="d-flex align-items-start p-3 bg-white shadow-sm rounded-4 border-start border-4" style={{ borderColor: '#FFD700' }}>
                <div className="p-3 bg-light rounded-circle text-danger me-3">
                  <i className="bi bi-telephone-fill fs-4" style={{ color: '#aa1a31' }}></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#4A1525' }}>Call / WhatsApp</h5>
                  <p className="text-muted mb-0 small">
                    +91 74447749962(Customer Support)<br />
                    Mon – Sat, 9:00 AM – 6:00 PM IST
                  </p>
                </div>
              </div>

              {/* Email Card */}
              <div className="d-flex align-items-start p-3 bg-white shadow-sm rounded-4 border-start border-4" style={{ borderColor: '#FFD700' }}>
                <div className="p-3 bg-light rounded-circle text-danger me-3">
                  <i className="bi bi-envelope-fill fs-4" style={{ color: '#aa1a31' }}></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#4A1525' }}>Email Address</h5>
                  <p className="text-muted mb-0 small">
                    contact@ramasala.com<br />
                    support@ramasala.com
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
                    <h5 className="fw-bold mb-1" style={{ color: '#4A1525' }}>Technical Developers</h5>
                    <p className="text-muted mb-0 small" style={{ fontSize: '0.82rem' }}>
                      RA Masala Dev Team •{' '}
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
                      <span className="text-secondary d-block mb-2" style={{ fontSize: '0.75rem' }}>UI/UX Engineer</span>
                      <a href="https://rohit-kai.github.io/cyber-portfolio/" target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white w-100 py-1 fw-semibold" style={{ backgroundColor: '#aa1a31', fontSize: '0.75rem' }}>
                        <i className="bi bi-briefcase me-1"></i> Visit Portfolio
                      </a>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-light border text-center">
                      <strong className="d-block small text-dark">Akash Mahadik</strong>
                      <span className="text-secondary d-block mb-2" style={{ fontSize: '0.75rem' }}>Backend Architect</span>
                      <a href="https://akash-mahadik.github.io/portfolio1/" target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white w-100 py-1 fw-semibold" style={{ backgroundColor: '#aa1a31', fontSize: '0.75rem' }}>
                        <i className="bi bi-briefcase me-1"></i> Visit Portfolio
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Interactive Form */}
          <div className="col-12 col-lg-7 animate__animated animate__fadeInRight">
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
              <h4 className="fw-bold mb-4" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                Send Us a Message
              </h4>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label text-muted fw-semibold">Your Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-secondary border-end-0">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-secondary border-end-0">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control bg-light border-start-0"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted fw-semibold">Your Message</label>
                  <textarea
                    className="form-control bg-light"
                    rows={5}
                    required
                    placeholder="Write your message or inquiry details here..."
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
                  Send Message
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
