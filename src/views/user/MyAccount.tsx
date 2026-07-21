import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const MyAccount = () => {
  const { user, orders, updateProfile, logout, tickets, addTicket, reviews, addReview, products, changePassword } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate(RoutePaths.login);
    }
  }, [user, navigate]);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [zip, setZip] = useState(user?.zip || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'tickets' | 'reviews' | 'settings'>('profile');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference Settings State
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [orderNotif, setOrderNotif] = useState(true);

  // Support Ticket Form State
  const [ticketMessage, setTicketMessage] = useState('');
  
  // Review Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Filter orders, tickets, and reviews for current user
  const userOrders = orders.filter(o => o.customerId === user?.id || o.customerId === user?._id);
  const userTickets = tickets.filter(t => t.customerEmail?.toLowerCase() === user?.email?.toLowerCase());
  const userReviews = reviews.filter(r => r.customerEmail?.toLowerCase() === user?.email?.toLowerCase());

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, phone, address, city, zip);
    Swal.fire({
      icon: 'success',
      title: 'Profile Updated',
      text: 'Your details have been successfully saved.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'New passwords do not match.',
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password updated successfully.',
          timer: 2000,
          showConfirmButton: false
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: res.message,
          confirmButtonColor: '#aa1a31'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong.',
        confirmButtonColor: '#aa1a31'
      });
    }
  };

  const handleLogout = () => {
    logout();
    Swal.fire({
      icon: 'success',
      title: 'Logged Out',
      text: 'You have been safely signed out.',
      timer: 1500,
      showConfirmButton: false
    });
    navigate(RoutePaths.home);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    try {
      await addTicket(ticketMessage);
      setTicketMessage('');
      Swal.fire({
        icon: 'success',
        title: 'Ticket Submitted',
        text: 'Our support team will get back to you shortly.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !reviewComment.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Fields',
        text: 'Please select a product and write a comment.',
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    const prod = products.find(p => String(p._id || p.id) === String(selectedProductId));
    if (!prod) return;

    try {
      await addReview({
        productId: selectedProductId,
        productName: prod.name,
        customerName: user?.name || 'Customer',
        customerEmail: user?.email || '',
        rating: reviewRating,
        comment: reviewComment
      });
      setSelectedProductId('');
      setReviewComment('');
      setReviewRating(5);
      Swal.fire({
        icon: 'success',
        title: 'Review Posted',
        text: 'Thank you for your valuable feedback!',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1">
        
        {/* Welcome Section */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-2" style={{ borderColor: '#FFB300' }}>
          <div>
            <h2 className="mb-1" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>My Account</h2>
            <p className="text-secondary mb-0">Welcome back, <strong>{user.name}</strong> ({user.email})</p>
          </div>
          <button className="btn btn-outline-danger fw-bold btn-sm mt-3 mt-sm-0" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i> Logout
          </button>
        </div>

        <div className="row g-4">
          {/* Navigation Sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="d-flex flex-column gap-2">
                <button 
                  className={`btn text-start py-2.5 px-3 fw-semibold border-0 rounded-3 ${activeTab === 'profile' ? 'text-white' : 'text-dark bg-transparent'}`}
                  style={{ backgroundColor: activeTab === 'profile' ? '#aa1a31' : 'transparent' }}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="bi bi-person-fill me-2"></i> Profile Details
                </button>
                <button 
                  className={`btn text-start py-2.5 px-3 fw-semibold border-0 rounded-3 ${activeTab === 'orders' ? 'text-white' : 'text-dark bg-transparent'}`}
                  style={{ backgroundColor: activeTab === 'orders' ? '#aa1a31' : 'transparent' }}
                  onClick={() => setActiveTab('orders')}
                >
                  <i className="bi bi-bag-check-fill me-2"></i> My Orders
                  {userOrders.length > 0 && (
                    <span className="badge bg-light text-dark ms-2">{userOrders.length}</span>
                  )}
                </button>
                <button 
                  className={`btn text-start py-2.5 px-3 fw-semibold border-0 rounded-3 ${activeTab === 'tickets' ? 'text-white' : 'text-dark bg-transparent'}`}
                  style={{ backgroundColor: activeTab === 'tickets' ? '#aa1a31' : 'transparent' }}
                  onClick={() => setActiveTab('tickets')}
                >
                  <i className="bi bi-headset me-2"></i> Support Tickets
                  {userTickets.length > 0 && (
                    <span className="badge bg-light text-dark ms-2">{userTickets.length}</span>
                  )}
                </button>
                <button 
                  className={`btn text-start py-2.5 px-3 fw-semibold border-0 rounded-3 ${activeTab === 'reviews' ? 'text-white' : 'text-dark bg-transparent'}`}
                  style={{ backgroundColor: activeTab === 'reviews' ? '#aa1a31' : 'transparent' }}
                  onClick={() => setActiveTab('reviews')}
                >
                  <i className="bi bi-star-fill me-2"></i> My Reviews
                  {userReviews.length > 0 && (
                    <span className="badge bg-light text-dark ms-2">{userReviews.length}</span>
                  )}
                </button>
                <button 
                  className={`btn text-start py-2.5 px-3 fw-semibold border-0 rounded-3 ${activeTab === 'settings' ? 'text-white' : 'text-dark bg-transparent'}`}
                  style={{ backgroundColor: activeTab === 'settings' ? '#aa1a31' : 'transparent' }}
                  onClick={() => setActiveTab('settings')}
                >
                  <i className="bi bi-gear-fill me-2"></i> Settings
                </button>
                {user.role === 'admin' && (
                  <Link 
                    to={RoutePaths.admin} 
                    className="btn btn-outline-warning text-dark text-start py-2.5 px-3 fw-bold border-1 rounded-3 mt-3"
                  >
                    <i className="bi bi-shield-lock-fill me-2 text-danger"></i> Admin Control
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-md-9">
            {activeTab === 'profile' && (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h4 className="mb-4" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>Shipping & Billing Address</h4>
                <form onSubmit={handleUpdate}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-semibold">Full Name</label>
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
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted fw-semibold">Delivery Address</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        placeholder="Full Shipping Address" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-semibold">City</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-semibold">ZIP / Pincode</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={zip} 
                        onChange={(e) => setZip(e.target.value)} 
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="btn text-white fw-bold px-4 py-2.5 rounded-3 border-0 mt-4 shadow-sm"
                    style={{ backgroundColor: '#aa1a31' }}
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h4 className="mb-4" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>My Order History</h4>
                {userOrders.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-bag-x fs-2 text-muted"></i>
                    <p className="mt-2 text-secondary">You haven't placed any orders yet.</p>
                    <Link to={RoutePaths.home} className="btn text-white mt-1 px-4 btn-sm" style={{ backgroundColor: '#aa1a31' }}>
                      Shop Now
                    </Link>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th className="text-end">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userOrders.map((ord) => (
                          <tr key={ord.id}>
                            <td className="fw-semibold text-dark">{ord.id}</td>
                            <td style={{ fontSize: '0.85rem' }}>{new Date(ord.date).toLocaleDateString()}</td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {ord.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                            </td>
                            <td className="fw-bold">₹{ord.total.toFixed(0)}</td>
                            <td>
                              <span className="badge px-2.5 py-1.5" style={{ 
                                backgroundColor: ord.status === 'Shipped' ? '#E8F5E9' : ord.status === 'Processing' ? '#FFF3E0' : '#E3F2FD',
                                color: ord.status === 'Shipped' ? '#2E7D32' : ord.status === 'Processing' ? '#E65100' : '#1565C0',
                              }}>
                                {ord.status}
                              </span>
                            </td>
                             <td className="text-end">
                               <Link to={`/invoice/${ord.id}`} className="btn btn-sm text-white fw-bold d-flex align-items-center justify-content-center" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>
                                 <i className="bi bi-receipt me-1"></i> View
                               </Link>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h4 className="mb-4" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>Support Tickets</h4>
                
                {/* Submit New Ticket Form */}
                <form onSubmit={handleTicketSubmit} className="mb-5 p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold mb-3" style={{ color: '#4A1525' }}>Raise a New Support Query</h6>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Describe your issue or query below:</label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      placeholder="Enter details here..." 
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-sm text-white fw-bold px-3 py-2" style={{ backgroundColor: '#4A1525' }}>
                    Submit Ticket
                  </button>
                </form>

                {/* Tickets History List */}
                <h6 className="fw-bold mb-3" style={{ color: '#4A1525' }}>Ticket History</h6>
                {userTickets.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-secondary mb-0">No support tickets raised yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                          <th>Date</th>
                          <th>Message</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userTickets.map((t: any) => (
                          <tr key={t.id || t._id}>
                            <td style={{ fontSize: '0.85rem' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Just now'}</td>
                            <td className="text-dark" style={{ fontSize: '0.85rem' }}>{t.message}</td>
                            <td>
                              <span className={`badge px-2.5 py-1.5 ${t.status === 'Resolved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h4 className="mb-4" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>Product Reviews</h4>
                
                {/* Submit New Review Form */}
                <form onSubmit={handleReviewSubmit} className="mb-5 p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold mb-3" style={{ color: '#4A1525' }}>Write a Product Review</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Select Product</label>
                      <select 
                        className="form-select" 
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        required
                      >
                        <option value="">Choose a product...</option>
                        {products.map(p => (
                          <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Rating</label>
                      <div className="d-flex align-items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i 
                            key={star}
                            className={`bi bi-star-fill fs-4 cursor-pointer ${star <= reviewRating ? 'text-warning' : 'text-muted'}`}
                            onClick={() => setReviewRating(star)}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Comment</label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      placeholder="Describe your experience with this product..." 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-sm text-white fw-bold px-3 py-2" style={{ backgroundColor: '#aa1a31' }}>
                    Post Review
                  </button>
                </form>

                {/* Reviews History List */}
                <h6 className="fw-bold mb-3" style={{ color: '#4A1525' }}>My Previous Reviews</h6>
                {userReviews.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-secondary mb-0">You haven't written any product reviews yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                          <th>Product</th>
                          <th>Rating</th>
                          <th>Comment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userReviews.map((rev: any) => {
                          const prod = products.find(p => String(p._id || p.id) === String(rev.productId));
                          return (
                            <tr key={rev._id || rev.id}>
                              <td className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                                {prod ? (
                                  <Link to={`/product/${prod._id || prod.id}`} className="text-decoration-none fw-bold" style={{ color: '#4A1525' }}>
                                    {rev.productName}
                                  </Link>
                                ) : (
                                  <span className="text-dark">{rev.productName}</span>
                                )}
                              </td>
                              <td>
                                <div className="text-warning">
                                  {Array.from({ length: rev.rating }).map((_, i) => (
                                    <i key={i} className="bi bi-star-fill me-0.5"></i>
                                  ))}
                                </div>
                              </td>
                              <td className="text-muted" style={{ fontSize: '0.85rem' }}>{rev.comment}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h4 className="mb-4" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>Account Settings</h4>
                
                {/* Change Password Form */}
                <div className="mb-5">
                  <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#4A1525' }}>Update Password</h6>
                  <form onSubmit={handleChangePassword}>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label text-muted small fw-semibold">Current Password</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          required 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)} 
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-muted small fw-semibold">New Password</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          required 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-muted small fw-semibold">Confirm New Password</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          required 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn text-white fw-bold px-4 py-2 rounded-3 border-0 mt-3 shadow-sm"
                      style={{ backgroundColor: '#aa1a31', fontSize: '0.9rem' }}
                    >
                      Change Password
                    </button>
                  </form>
                </div>

                {/* Notifications & Preferences */}
                <div>
                  <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#4A1525' }}>Notification Preferences</h6>
                  <div className="d-flex flex-column gap-3 mt-3">
                    <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0">
                      <div>
                        <label className="form-check-label fw-semibold text-dark mb-0 animate__animated" htmlFor="emailNotif" style={{ cursor: 'pointer' }}>Email Notifications</label>
                        <div className="text-muted small">Receive monthly newsletter and offers</div>
                      </div>
                      <input 
                        className="form-check-input ms-0" 
                        type="checkbox" 
                        id="emailNotif" 
                        checked={emailNotif} 
                        style={{ cursor: 'pointer' }}
                        onChange={(e) => {
                          setEmailNotif(e.target.checked);
                          Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Preferences updated',
                            showConfirmButton: false,
                            timer: 1500
                          });
                        }} 
                      />
                    </div>
                    <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0">
                      <div>
                        <label className="form-check-label fw-semibold text-dark mb-0 animate__animated" htmlFor="orderNotif" style={{ cursor: 'pointer' }}>Order Status Alerts</label>
                        <div className="text-muted small">Get notified on email about shipping updates</div>
                      </div>
                      <input 
                        className="form-check-input ms-0" 
                        type="checkbox" 
                        id="orderNotif" 
                        checked={orderNotif} 
                        style={{ cursor: 'pointer' }}
                        onChange={(e) => {
                          setOrderNotif(e.target.checked);
                          Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Preferences updated',
                            showConfirmButton: false,
                            timer: 1500
                          });
                        }} 
                      />
                    </div>
                    <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0">
                      <div>
                        <label className="form-check-label fw-semibold text-dark mb-0 animate__animated" htmlFor="smsNotif" style={{ cursor: 'pointer' }}>SMS Updates</label>
                        <div className="text-muted small">Get instant text alerts on your phone</div>
                      </div>
                      <input 
                        className="form-check-input ms-0" 
                        type="checkbox" 
                        id="smsNotif" 
                        checked={smsNotif} 
                        style={{ cursor: 'pointer' }}
                        onChange={(e) => {
                          setSmsNotif(e.target.checked);
                          Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Preferences updated',
                            showConfirmButton: false,
                            timer: 1500
                          });
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyAccount;
