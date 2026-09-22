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
      Swal.fire({
        icon: res.data.failed > 0 ? 'warning' : 'success',
        title: t('adm_success'),
        text: res.data.failed > 0
          ? `${res.data.message} (${res.data.failed} failed)`
          : res.data.message,
        confirmButtonColor: '#aa1a31'
      });
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
            <Link to={RoutePaths.admin} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#aa1a31', border: '1px solid #FFB300' }}>
              {t('adm_back_to_dashboard')}
            </Link>
          </div>
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
      <Footer />
    </div>
  );
};

export default AdminSendOffers;
