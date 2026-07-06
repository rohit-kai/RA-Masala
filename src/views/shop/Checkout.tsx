import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, placeOrder } = useAuth();
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

  // Autofill if logged in
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setZip(user.zip || '');
    }
  }, [user]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address || !city || !zip) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Details',
        text: 'Please complete your shipping address details.',
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Empty Cart',
        text: 'Your cart contains no items to order.',
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    // Call placeOrder
    const order = placeOrder({
      customerId: user ? user.id : 'guest',
      customerName: name,
      customerEmail: user ? user.email : 'guest@ramasala.com',
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal: cartTotal,
      tax: tax,
      shipping: shipping,
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

    Swal.fire({
      icon: 'success',
      title: 'Order Placed!',
      text: `Thank you! Your order ID is ${order.id}. Generating your E-Invoice now...`,
      timer: 2500,
      showConfirmButton: false
    });

    // Clear cart and redirect
    clearCart();
    setTimeout(() => {
      navigate(`/invoice/${order.id}`);
    }, 2500);
  };

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1">
        <h2 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold', borderBottom: '3px solid #FFB300', paddingBottom: '10px' }}>
          Checkout Details
        </h2>

        {!user && (
          <div className="alert alert-warning mb-4 rounded-3 d-flex justify-content-between align-items-center" role="alert">
            <span>
              <i className="bi bi-info-circle-fill me-2"></i>
              You are ordering as a <strong>Guest</strong>. Log in to save orders to your profile!
            </span>
            <Link to={RoutePaths.login} className="btn btn-sm btn-outline-dark fw-bold">Login</Link>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="row g-4">
            {/* Left Column: Billing / Shipping Info */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h5 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>
                  <i className="bi bi-truck me-2" style={{ color: '#aa1a31' }}></i> Shipping & Contact Information
                </h5>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold">Contact Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. +91 98765 43210" 
                      required 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted fw-semibold">Address Line</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Street address, Apartment, Suite" 
                      required 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold">City</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold">ZIP / Pincode</label>
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
                  <i className="bi bi-credit-card me-2" style={{ color: '#aa1a31' }}></i> Choose Payment Method
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
                      <strong className="d-block" style={{ color: '#4A1525' }}>Cash on Delivery (COD)</strong>
                      <span className="text-secondary text-xs">Pay with cash when your spices arrive at your door.</span>
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
                      <strong className="d-block" style={{ color: '#4A1525' }}>BHIM UPI / NetBanking</strong>
                      <span className="text-secondary text-xs">Instant payment via GooglePay, PhonePe, or PayTM.</span>
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
                      <strong className="d-block" style={{ color: '#4A1525' }}>Credit / Debit Card</strong>
                      <span className="text-secondary text-xs">Visa, MasterCard, RuPay, or AMEX supported.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Checkout List Summary */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h5 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>
                  Checkout List
                </h5>

                <div className="checkout-items max-vh-50 overflow-y-auto mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="p-1 bg-light rounded-2 me-3" style={{ width: '45px', height: '45px', overflow: 'hidden' }}>
                          <img src={item.image} alt={item.name} className="w-100 h-100 object-fit-contain" />
                        </div>
                        <div>
                          <strong className="d-block text-dark" style={{ fontSize: '0.9rem' }}>{item.name}</strong>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Qty: {item.quantity} x ₹{item.price}</span>
                        </div>
                      </div>
                      <span className="fw-semibold text-dark">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Subtotal</span>
                  <span className="fw-semibold text-dark">₹{cartTotal}</span>
                </div>
                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(1)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">GST Spice Tax (5%)</span>
                  <span className="fw-semibold text-dark">₹{tax.toFixed(1)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-secondary">Shipping charges</span>
                  <span className="fw-semibold text-dark">
                    {shipping === 0 ? <span className="text-success">FREE</span> : `₹${shipping}`}
                  </span>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <strong className="text-dark fs-5">Total Amount</strong>
                  <strong className="fs-4" style={{ color: '#aa1a31' }}>₹{total.toFixed(1)}</strong>
                </div>

                <button 
                  type="submit" 
                  className="btn w-100 py-3 text-white fw-bold border-0 rounded-3 shadow"
                  style={{ background: 'linear-gradient(90deg, #800c1e 0%, #aa1a31 100%)' }}
                >
                  Place Order & Get Invoice
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
