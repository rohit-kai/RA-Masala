import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';
import axios from 'axios';

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
  alreadyAlerted: boolean;
}

const AdminSendOffers = () => {
  const { user, users } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: t('adm_access_denied'),
        text: t('adm_no_admin_privileges'),
        confirmButtonColor: '#aa1a31'
      });
      navigate(RoutePaths.home);
    }
  }, [user, navigate]);

  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [message, setMessage] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [recipientMode, setRecipientMode] = useState<'all' | 'custom'>('all');
  const [customEmails, setCustomEmails] = useState('');
  const [sending, setSending] = useState(false);

  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [alertSending, setAlertSending] = useState(false);

  const customers = users.filter(u => u.role === 'customer' && u.isActive !== false && u.email);

  const loadLowStock = async () => {
    try {
      const res = await axios.get('/api/email/low-stock', { timeout: 15000 });
      setLowStock(res.data.products || []);
      setLowStockThreshold(res.data.threshold ?? 10);
    } catch (err) {
      console.error('Error loading low stock list:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') loadLowStock();
  }, [user]);

  const handleSendAlert = async () => {
    setAlertSending(true);
    try {
      const res = await axios.post('/api/email/low-stock-alert', {}, { timeout: 30000 });
      Swal.fire({
        icon: 'success',
        title: t('adm_success'),
        text: res.data.count > 0 ? `${res.data.message}` : t('adm_no_low_stock'),
        confirmButtonColor: '#aa1a31'
      });
      await loadLowStock();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: t('adm_error'),
        text: err?.response?.data?.detail || err?.response?.data?.message || err?.message || t('adm_error'),
        confirmButtonColor: '#aa1a31'
      });
    } finally {
      setAlertSending(false);
    }
  };

  const handleSendOffer = async () => {
    if (!subject.trim() || !message.trim()) {
      Swal.fire(t('adm_error'), t('adm_offers_required'), 'error');
      return;
    }
    let recipients: string[] | undefined;
    if (recipientMode === 'custom') {
      recipients = customEmails
        .split(/[\n,;]+/)
        .map(e => e.trim())
        .filter(Boolean);
      if (recipients.length === 0) {
        Swal.fire(t('adm_error'), t('adm_offers_no_recipients'), 'error');
        return;
      }
    }

    setSending(true);
    try {
      const res = await axios.post(
        '/api/email/offers',
        { subject, heading, message, offerCode, recipients },
        { timeout: 120000 }
      );
      const firstError = res.data.errors?.[0]?.error;
      const sentCount = res.data.sent || 0;
      const failedCount = res.data.failed || 0;

      if (sentCount > 0 && failedCount === 0) {
        Swal.fire({
          icon: 'success',
          title: t('adm_success'),
          text: res.data.message,
          confirmButtonColor: '#aa1a31'
        });
      } else if (sentCount > 0 && failedCount > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Partial Success',
          text: `${res.data.message} (${firstError || 'Some recipients failed'})`,
          confirmButtonColor: '#aa1a31'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: t('adm_error'),
          text: firstError || res.data.message || 'Email delivery failed',
          confirmButtonColor: '#aa1a31'
        });
      }
      setSubject('');
      setHeading('');
      setMessage('');
      setOfferCode('');
      setCustomEmails('');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: t('adm_error'),
        text: err?.response?.data?.message || err?.message || t('adm_error'),
        confirmButtonColor: '#aa1a31'
      });
    } finally {
      setSending(false);
    }
  };

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number | string>(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [isResendActive, setIsResendActive] = useState(false);

  const loadEmailConfig = async () => {
    try {
      const res = await axios.get('/api/config/email');
      setResendApiKey(res.data.resendApiKey || '');
      setSmtpHost(res.data.smtpHost || 'smtp.gmail.com');
      setSmtpPort(res.data.smtpPort || 587);
      setSmtpSecure(res.data.smtpSecure || false);
      setSmtpUser(res.data.smtpUser || '');
      setSmtpFrom(res.data.smtpFrom || '');
      setSmtpPass(res.data.hasSmtpPass ? '***' : '');
      setIsResendActive(Boolean(res.data.isResendActive));
    } catch (err) {
      console.error('Error loading email config:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') loadEmailConfig();
  }, [user]);

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await axios.post('/api/config/email', {
        resendApiKey,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpSecure,
        smtpUser,
        smtpPass,
        smtpFrom
      });
      Swal.fire(t('adm_success'), res.data.message || 'Email settings saved successfully', 'success');
      setShowConfigModal(false);
      await loadEmailConfig();
    } catch (err: any) {
      Swal.fire(t('adm_error'), err?.response?.data?.message || 'Failed to save email settings', 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1">

        {/* Page Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-2" style={{ borderColor: '#FFB300' }}>
          <div>
            <h2 className="mb-1" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>
              <i className="bi bi-envelope-paper-fill text-danger me-2"></i> {t('adm_send_offers_title')}
            </h2>
            <p className="text-secondary mb-0">{t('adm_send_offers_subtitle')}</p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-sm-0">
            <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={() => setShowConfigModal(true)}>
              <i className="bi bi-gear-fill me-1"></i> Email Settings
            </button>
            <Link to={RoutePaths.admin} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#aa1a31', border: '1px solid #FFB300' }}>
              {t('adm_back_to_dashboard')}
            </Link>
          </div>
        </div>

        {/* Vercel / Cloud Notice Banner */}
        <div className="alert alert-info d-flex flex-wrap align-items-center justify-content-between rounded-4 shadow-sm mb-4 border-0 p-3" style={{ background: '#FFF8E1', borderLeft: '5px solid #FFB300' }}>
          <div>
            <h6 className="fw-bold mb-1" style={{ color: '#4A1525' }}>
              <i className="bi bi-lightning-charge-fill text-warning me-2"></i> Fast Vercel / Cloud Email Delivery
              {isResendActive && <span className="badge bg-success ms-2">Resend HTTPS API Active (300ms)</span>}
            </h6>
            <small className="text-muted">
              Vercel serverless functions block raw outbound SMTP (port 587/465). Use a free <strong>Resend API Key</strong> (HTTPS port 443) for <strong>instant 300ms email delivery</strong> on live sites!
            </small>
          </div>
          <button className="btn btn-sm btn-outline-danger fw-bold mt-2 mt-sm-0" onClick={() => setShowConfigModal(true)}>
            <i className="bi bi-sliders me-1"></i> Configure Key
          </button>
        </div>

        <div className="row g-4">
          {/* Low stock alerts panel */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="mb-1 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i> {t('adm_low_stock_title')}
              </h5>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                {t('adm_low_stock_desc')} (≤ {lowStockThreshold})
              </p>

              {lowStock.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-check-circle-fill text-success fs-3 d-block mb-2"></i>
                  {t('adm_no_low_stock')}
                </div>
              ) : (
                <div className="mb-3">
                  {lowStock.map(p => (
                    <div key={p.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <strong className="d-block" style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                        <small className="text-muted">{p.category}</small>
                      </div>
                      <span className={`badge px-2 py-1 ${p.stock === 0 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {p.stock === 0 ? t('adm_out_of_stock') : `${p.stock}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-sm text-white fw-bold w-100"
                style={{ backgroundColor: '#aa1a31', border: '1px solid #FFB300' }}
                onClick={handleSendAlert}
                disabled={alertSending || lowStock.length === 0}
              >
                {alertSending
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('adm_sending')}</>
                  : <><i className="bi bi-bell-fill me-1"></i>{t('adm_send_stock_alert')}</>}
              </button>
            </div>
          </div>

          {/* Offers compose panel */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="mb-3 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                <i className="bi bi-megaphone-fill text-danger me-2"></i> {t('adm_compose_offer')}
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold">{t('adm_offers_subject')} *</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    maxLength={150}
                    placeholder={t('adm_offers_subject_ph')}
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold">{t('adm_offers_heading')}</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    maxLength={100}
                    placeholder={t('adm_offers_heading_ph')}
                    value={heading}
                    onChange={e => setHeading(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold">{t('adm_offers_code')}</label>
                  <input
                    type="text"
                    className="form-control bg-light text-uppercase"
                    maxLength={30}
                    placeholder={t('adm_offers_code_ph')}
                    value={offerCode}
                    onChange={e => setOfferCode(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold">{t('adm_offers_recipients')}</label>
                  <select
                    className="form-select bg-light"
                    value={recipientMode}
                    onChange={e => setRecipientMode(e.target.value as 'all' | 'custom')}
                  >
                    <option value="all">{t('adm_offers_all_customers')} ({customers.length})</option>
                    <option value="custom">{t('adm_offers_custom_emails')}</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted fw-semibold">{t('adm_offers_message')} *</label>
                  <textarea
                    className="form-control bg-light"
                    rows={6}
                    maxLength={5000}
                    placeholder={t('adm_offers_message_ph')}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  ></textarea>
                </div>
                {recipientMode === 'custom' && (
                  <div className="col-12">
                    <label className="form-label text-muted fw-semibold">{t('adm_offers_custom_emails')}</label>
                    <textarea
                      className="form-control bg-light"
                      rows={3}
                      placeholder="customer1@example.com, customer2@example.com"
                      value={customEmails}
                      onChange={e => setCustomEmails(e.target.value)}
                    ></textarea>
                    <small className="text-muted">{t('adm_offers_custom_hint')}</small>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button
                  className="btn text-white fw-bold px-4"
                  style={{ backgroundColor: '#aa1a31', border: '1px solid #FFB300' }}
                  onClick={handleSendOffer}
                  disabled={sending}
                >
                  {sending
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('adm_sending')}</>
                    : <><i className="bi bi-send-fill me-1"></i>{t('adm_offers_send')}</>}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

        {/* Email Settings Modal */}
        {showConfigModal && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header border-bottom text-white" style={{ backgroundColor: '#4A1525' }}>
                  <h5 className="modal-title fw-bold" style={{ fontFamily: 'serif' }}>
                    <i className="bi bi-gear-fill me-2"></i> System Email Configuration
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfigModal(false)}></button>
                </div>
                <form onSubmit={handleSaveEmailConfig}>
                  <div className="modal-body p-4" style={{ backgroundColor: '#FDF6ED' }}>
                    
                    {/* Resend API Key section (RECOMMENDED FOR VERCEL) */}
                    <div className="card border-0 shadow-sm p-3 mb-4 rounded-3" style={{ background: '#E8F5E9', borderLeft: '5px solid #2E7D32' }}>
                      <h6 className="fw-bold text-success mb-1">
                        <i className="bi bi-lightning-charge-fill me-1"></i> Option 1: Resend API Key (Recommended for Vercel / Cloud Hosts)
                      </h6>
                      <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                        Free tier provides 3,000 emails/month. Works over HTTPS (port 443) with <strong>300ms speed</strong> and never times out on Vercel. Sign up free at <a href="https://resend.com" target="_blank" rel="noreferrer" className="fw-bold text-success">resend.com</a>.
                      </p>
                      <div className="mb-2">
                        <label className="form-label text-dark fw-semibold" style={{ fontSize: '0.9rem' }}>Resend API Key</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="e.g. re_xxxxxxxxxxxxxxxxxxxxxxxx"
                          value={resendApiKey}
                          onChange={e => setResendApiKey(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* SMTP Credentials section */}
                    <div className="card border-0 shadow-sm p-3 rounded-3 bg-white">
                      <h6 className="fw-bold text-dark mb-1">
                        <i className="bi bi-hdd-network-fill me-1"></i> Option 2: SMTP Configuration (Gmail / Provider)
                      </h6>
                      <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                        Used as fallback on localhost or hosts that permit raw SMTP outbound connections.
                      </p>
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>SMTP Host</label>
                          <input type="text" className="form-control" placeholder="smtp.gmail.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Port</label>
                          <input type="number" className="form-control" placeholder="587 or 465" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>SMTP User (Gmail Email)</label>
                          <input type="email" className="form-control" placeholder="your-email@gmail.com" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>SMTP App Password</label>
                          <input type="password" className="form-control" placeholder="Google App Password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Sender Name & Email (From)</label>
                          <input type="text" className="form-control" placeholder="RA Masala <your-email@gmail.com>" value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} />
                        </div>
                      </div>
                    </div>

                  </div>
                  <div className="modal-footer border-top bg-white">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowConfigModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-sm text-white fw-bold px-4" style={{ backgroundColor: '#aa1a31' }} disabled={configSaving}>
                      {configSaving ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</> : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      <Footer />
    </div>
  );
};

export default AdminSendOffers;
