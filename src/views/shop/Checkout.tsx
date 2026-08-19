import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';
import { getAssetPath } from '../../Utils/imageHelper';

const Checkout = () => {
  const { t } = useLanguage();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, placeOrder, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Route state data
  const stateData = location.state || { discount: 0, tax: 0, shipping: 40, total: 0 };
  const { discount, tax, shipping, total } = stateData;

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Dynamic Payment Config States
  const [gatewayKeyId, setGatewayKeyId] = useState('');
  const [isLiveGateway, setIsLiveGateway] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Autofill if logged in or from localStorage if guest
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setZip(user.zip || '');
    } else {
      const savedGuestShipping = localStorage.getItem('ra_guest_shipping');
      if (savedGuestShipping) {
        try {
          const parsed = JSON.parse(savedGuestShipping);
          setName(parsed.name || '');
          setPhone(parsed.phone || '');
          setAddress(parsed.address || '');
          setCity(parsed.city || '');
          setZip(parsed.zip || '');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  // Load Razorpay Checkout SDK script dynamically
  useEffect(() => {
    if ((window as any).Razorpay) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptLoaded(false);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch Dynamic payment configurations from database on mount
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        const res = await axios.get('/api/config/payment/public');
        if (res.data) {
          if (res.data.gatewayKeyId) setGatewayKeyId(res.data.gatewayKeyId);
          if (typeof res.data.isLive === 'boolean') setIsLiveGateway(res.data.isLive);
        }
      } catch (err) {
        console.error('Error fetching payment config settings:', err);
      }
    };
    fetchPaymentConfig();
  }, []);

  const executeOrderPlacement = async () => {
    try {
      const order = await placeOrder({
        customerId: user ? user.id : 'guest',
        customerName: name,
        customerEmail: user ? user.email : 'guest@ramasala.com',
        items: cartItems.map(item => ({
          id: String(item.id),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        subtotal: cartTotal,
        tax: tax,
        shipping: shipping,
        discount: discount,
        total: total,
        paymentMethod: paymentMethod,
        shippingAddress: {
          name,
          phone,
          address,
          city,
          zip
        }
      });

      // Save shipping details to avoid re-typing
      if (user) {
        try {
          await updateProfile(name, phone, address, city, zip);
        } catch (e) {
          console.error('Error saving checkout profile info:', e);
        }
      } else {
        localStorage.setItem('ra_guest_shipping', JSON.stringify({ name, phone, address, city, zip }));
      }

      return order;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const finalizePaidOrder = (order: any) => {
    clearCart();
    Swal.fire({
      icon: 'success',
      title: t('chk_payment_success_title'),
      text: t('chk_payment_success_text'),
      timer: 2000,
      showConfirmButton: false
    });
    setTimeout(() => {
      navigate(`/invoice/${order.id}`);
    }, 2000);
  };

  const verifyRzpPayment = async (order: any, response: any) => {
    try {
      Swal.showLoading();
      await axios.post('/api/payments/verify', {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        orderId: order.id
      });
      Swal.close();
      finalizePaidOrder(order);
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: t('chk_payment_not_verified_title'),
        text: t('chk_payment_not_verified_text'),
        confirmButtonColor: '#aa1a31'
      });
    }
  };

  const openRazorpayCheckout = (order: any) => {
    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      Swal.fire(t('chk_payment_unavailable_title'), t('chk_razorpay_load_failed_text'), 'error');
      return;
    }
    const options = {
      key: gatewayKeyId,
      amount: Math.round(order.total * 100), // server-authoritative amount
      currency: 'INR',
      name: 'RA Masala',
      description: t('chk_rzp_description'),
      image: getAssetPath('images/ra_waa.png'),
      order_id: order.transactionId, // Razorpay Order ID created server-side
      handler: async (response: any) => {
        await verifyRzpPayment(order, response);
      },
      prefill: {
        name: name,
        contact: phone,
        email: user ? user.email : 'guest@ramasala.com'
      },
      theme: {
        color: '#4A1525'
      },
      modal: {
        ondismiss: () => {
          Swal.fire({
            icon: 'warning',
            title: t('chk_payment_cancelled_title'),
            text: t('chk_payment_cancelled_text'),
            confirmButtonColor: '#aa1a31'
          });
        }
      }
    };
    const rzp = new RazorpayCtor(options);
    rzp.open();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (placingOrder) return;

    if (!name || !phone || !address || !city || !zip) {
      Swal.fire({
        icon: 'error',
        title: t('chk_missing_details_title'),
        text: t('chk_missing_details_text'),
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'error',
        title: t('chk_empty_cart_title'),
        text: t('chk_empty_cart_text'),
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    setPlacingOrder(true);

    try {
      if (paymentMethod === 'COD') {
        const order = await executeOrderPlacement();
        Swal.fire({
          icon: 'success',
          title: t('chk_order_placed_title'),
          text: t('chk_order_placed_text').replace('{orderId}', order.id),
          timer: 2500,
          showConfirmButton: false
        });
        clearCart();
        setTimeout(() => {
          navigate(`/invoice/${order.id}`);
        }, 2500);
      } else {
        // Digital payments (UPI / Cards / Net Banking)
        if (!isLiveGateway) {
          Swal.fire({
            icon: 'error',
            title: t('chk_online_payment_unavailable_title'),
            text: t('chk_online_payment_unavailable_text'),
            confirmButtonColor: '#aa1a31'
          });
          return;
        }

        const order = await executeOrderPlacement();

        if (!order.transactionId || !order.transactionId.startsWith('ord_')) {
          Swal.fire(t('chk_payment_unavailable_title'), t('chk_gateway_init_failed_text'), 'error');
          return;
        }

        if (!scriptLoaded) {
          Swal.fire(t('chk_payment_unavailable_title'), t('chk_razorpay_still_loading_text'), 'error');
          return;
        }

        Swal.close();
        openRazorpayCheckout(order);
      }
    } catch (err) {
      Swal.close();
      const msg =
        (err as any)?.response?.data?.message ||
        t('chk_order_failed_db_text');
      Swal.fire({
        icon: 'error',
        title: t('chk_order_error_title'),
        text: msg,
        confirmButtonColor: '#aa1a31'
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1">
        <h2 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold', borderBottom: '3px solid #FFB300', paddingBottom: '10px' }}>
          {t('chk_details_title')}
        </h2>

        {!user && (
          <div className="alert alert-warning mb-4 rounded-3 d-flex justify-content-between align-items-center" role="alert">
            <span>
              <i className="bi bi-info-circle-fill me-2"></i>
              {t('chk_guest_note_a')}<strong>{t('chk_guest_word')}</strong>{t('chk_guest_note_b')}
            </span>
            <Link to={RoutePaths.login} className="btn btn-sm btn-outline-dark fw-bold">{t('chk_login_btn')}</Link>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="row g-4">
            {/* Left Column: Billing / Shipping Info */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h5 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>
                  <i className="bi bi-truck me-2" style={{ color: '#aa1a31' }}></i> {t('chk_shipping_contact_title')}
                </h5>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold">{t('chk_contact_name_label')}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold">{t('chk_phone_label')}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={t('chk_phone_placeholder')} 
                      required 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted fw-semibold">{t('chk_address_line_label')}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={t('chk_address_placeholder')} 
                      required 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold">{t('chk_city_label')}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold">{t('chk_zip_label')}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={zip} 
                      onChange={(e) => setZip(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>
                  <i className="bi bi-credit-card me-2" style={{ color: '#aa1a31' }}></i> {t('chk_choose_payment_title')}
                </h5>

                <div className="d-flex flex-column gap-3">
                  <label className={`d-flex align-items-center p-3 border rounded-3 cursor-pointer ${paymentMethod === 'COD' ? 'border-danger bg-light' : ''}`} style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="payment" 
                      className="me-3" 
                      checked={paymentMethod === 'COD'} 
                      onChange={() => setPaymentMethod('COD')} 
                    />
                    <div>
                      <strong className="d-block" style={{ color: '#4A1525' }}>{t('chk_pay_cod')}</strong>
                      <span className="text-secondary text-xs">{t('chk_pay_cod_desc')}</span>
                    </div>
                  </label>

                  <label className={`d-flex align-items-center p-3 border rounded-3 cursor-pointer ${paymentMethod === 'UPI' ? 'border-danger bg-light' : ''}`} style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="payment" 
                      className="me-3" 
                      checked={paymentMethod === 'UPI'} 
                      onChange={() => setPaymentMethod('UPI')} 
                    />
                    <div>
                      <strong className="d-block" style={{ color: '#4A1525' }}>{t('chk_pay_upi')}</strong>
                      <span className="text-secondary text-xs">{t('chk_pay_upi_desc')}</span>
                    </div>
                  </label>

                  <label className={`d-flex align-items-center p-3 border rounded-3 cursor-pointer ${paymentMethod === 'CARD' ? 'border-danger bg-light' : ''}`} style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="payment" 
                      className="me-3" 
                      checked={paymentMethod === 'CARD'} 
                      onChange={() => setPaymentMethod('CARD')} 
                    />
                    <div>
                      <strong className="d-block" style={{ color: '#4A1525' }}>{t('chk_pay_card')}</strong>
                      <span className="text-secondary text-xs">{t('chk_pay_card_desc')}</span>
                    </div>
                  </label>

                  <label className={`d-flex align-items-center p-3 border rounded-3 cursor-pointer ${paymentMethod === 'NETBANKING' ? 'border-danger bg-light' : ''}`} style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="payment" 
                      className="me-3" 
                      checked={paymentMethod === 'NETBANKING'} 
                      onChange={() => setPaymentMethod('NETBANKING')} 
                    />
                    <div>
                      <strong className="d-block" style={{ color: '#4A1525' }}>{t('chk_pay_netbanking')}</strong>
                      <span className="text-secondary text-xs">{t('chk_pay_netbanking_desc')}</span>
                    </div>
                  </label>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
                  <span className="text-muted small">
                    <i className="bi bi-shield-lock-fill me-1" style={{ color: '#4A1525' }}></i>
                    {t('chk_secure_razorpay')}
                  </span>
                  {!isLiveGateway && (
                    <span className="badge bg-warning text-dark">{t('chk_online_unavailable_badge')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Checkout List Summary */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h5 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>
                  {t('chk_list_title')}
                </h5>

                <div className="checkout-items max-vh-50 overflow-y-auto mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="p-1 bg-light rounded-2 me-3" style={{ width: '45px', height: '45px', overflow: 'hidden' }}>
                          <img src={getAssetPath(item.image)} alt={item.name} className="w-100 h-100 object-fit-contain" />
                        </div>
                        <div>
                          <strong className="d-block text-dark" style={{ fontSize: '0.9rem' }}>{item.name}</strong>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{t('chk_qty')}: {item.quantity} x ₹{item.price}</span>
                        </div>
                      </div>
                      <span className="fw-semibold text-dark">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">{t('chk_subtotal')}</span>
                  <span className="fw-semibold text-dark">₹{cartTotal}</span>
                </div>
                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>{t('chk_discount')}</span>
                    <span>-₹{discount.toFixed(1)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">{t('chk_gst_tax')}</span>
                  <span className="fw-semibold text-dark">₹{tax.toFixed(1)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-secondary">{t('chk_shipping')}</span>
                  <span className="fw-semibold text-dark">
                    {shipping === 0 ? <span className="text-success">{t('chk_free')}</span> : `₹${shipping}`}
                  </span>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <strong className="text-dark fs-5">{t('chk_total_amount')}</strong>
                  <strong className="fs-4" style={{ color: '#aa1a31' }}>₹{total.toFixed(1)}</strong>
                </div>

                <button 
                  type="submit" 
                  className="btn w-100 py-3 text-white fw-bold border-0 rounded-3 shadow"
                  style={{ background: 'linear-gradient(90deg, #800c1e 0%, #aa1a31 100%)' }}
                  disabled={placingOrder}
                >
                  {placingOrder ? (
                    <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>{t('chk_processing')}</span>
                  ) : paymentMethod === 'COD' ? (
                    t('chk_place_order_cod')
                  ) : (
                    t('chk_pay_place_order').replace('{amount}', total.toFixed(2))
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
