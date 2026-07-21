import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';
import { getAssetPath } from '../../Utils/imageHelper';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const navigate = useNavigate();

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.toUpperCase() === 'WELCOME15') {
      const discountAmount = cartTotal * 0.15;
      setDiscount(discountAmount);
      Swal.fire({
        icon: 'success',
        title: 'Promo Applied!',
        text: 'You received a 15% discount.',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Promo Code',
        text: 'Try code: WELCOME15',
        confirmButtonColor: '#aa1a31'
      });
    }
  };

  const tax = (cartTotal - discount) * 0.05; // 5% GST for spices
  const shipping = cartTotal > 500 || cartTotal === 0 ? 0 : 40;
  const finalTotal = cartTotal - discount + tax + shipping;

  const handleProceed = () => {
    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cart Empty',
        text: 'Please add some delicious spices to your cart first!',
        confirmButtonColor: '#aa1a31'
      });
      return;
    }
    navigate(RoutePaths.checkout, { state: { discount, tax, shipping, total: finalTotal } });
  };

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1">
        <h2 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold', borderBottom: '3px solid #FFB300', paddingBottom: '10px' }}>
          Shopping Cart
        </h2>

        {cartItems.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
            <i className="bi bi-cart-x fs-1 text-muted"></i>
            <h4 className="mt-3" style={{ color: '#4A1525', fontFamily: 'serif' }}>Your cart is empty</h4>
            <p className="text-secondary">Fill it with the aroma and heritage of pure spices!</p>
            <Link to={RoutePaths.home} className="btn text-white mt-2 px-4 py-2 fw-semibold" style={{ backgroundColor: '#aa1a31' }}>
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {/* Cart Items List */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="table-responsive">
                  <table className="table table-borderless align-middle mb-0">
                    <thead>
                      <tr className="border-bottom text-secondary" style={{ fontSize: '0.9rem' }}>
                        <th>Product</th>
                        <th className="text-center">Price</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-end">Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.id} className="border-bottom">
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <div className="p-1 bg-light rounded-3 me-3" style={{ width: '60px', height: '60px', overflow: 'hidden' }}>
                                <img src={getAssetPath(item.image)} alt={item.name} className="w-100 h-100 object-fit-contain" />
                              </div>
                              <div>
                                <h6 className="mb-0 fw-bold" style={{ color: '#4A1525' }}>{item.name}</h6>
                                <small className="text-muted">Authentic Indian Blend</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center fw-semibold">₹{item.price}</td>
                          <td className="text-center">
                            <div className="d-inline-flex align-items-center border rounded-3 p-1">
                              <button 
                                className="btn btn-sm btn-link text-decoration-none px-2 py-0 fs-5 text-dark fw-bold"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >-</button>
                              <span className="px-2 fw-bold">{item.quantity}</span>
                              <button 
                                className="btn btn-sm btn-link text-decoration-none px-2 py-0 fs-5 text-dark fw-bold"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >+</button>
                            </div>
                          </td>
                          <td className="text-end fw-bold text-dark">₹{item.price * item.quantity}</td>
                          <td className="text-end">
                            <button 
                              className="btn btn-sm text-danger"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <i className="bi bi-trash fs-5"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-between mt-3 px-2">
                  <Link to={RoutePaths.home} className="btn text-muted fw-semibold ps-0">
                    <i className="bi bi-arrow-left me-2"></i> Continue Shopping
                  </Link>
                  <button className="btn btn-outline-danger btn-sm" onClick={clearCart}>
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary & Promos */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h5 className="mb-4" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>Apply Coupon</h5>
                <form onSubmit={handleApplyPromo} className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter Code (e.g. WELCOME15)" 
                    value={promoCode} 
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button type="submit" className="btn text-white px-3 fw-bold" style={{ backgroundColor: '#4A1525' }}>
                    Apply
                  </button>
                </form>
              </div>

              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="mb-4" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>Order Summary</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Bag Subtotal</span>
                  <span className="fw-semibold text-dark">₹{cartTotal}</span>
                </div>
                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Discount (15%)</span>
                    <span>-₹{discount.toFixed(1)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">GST / Spice Tax (5%)</span>
                  <span className="fw-semibold text-dark">₹{tax.toFixed(1)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-secondary">Shipping charges</span>
                  <span className="fw-semibold text-dark">
                    {shipping === 0 ? <span className="text-success">FREE</span> : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <small className="text-muted d-block mb-3" style={{ fontSize: '0.8rem' }}>
                    Add <strong>₹{(500 - cartTotal).toFixed(0)}</strong> more to get FREE shipping!
                  </small>
                )}
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold fs-5" style={{ color: '#4A1525' }}>Grand Total</span>
                  <span className="fw-bold fs-4" style={{ color: '#aa1a31' }}>₹{finalTotal.toFixed(1)}</span>
                </div>
                <button 
                  className="btn w-100 py-3 text-white fw-bold border-0 rounded-3 shadow"
                  style={{ background: 'linear-gradient(90deg, #800c1e 0%, #aa1a31 100%)' }}
                  onClick={handleProceed}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
