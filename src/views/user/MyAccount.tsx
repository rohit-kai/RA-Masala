import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const MyAccount = () => {
  const { user, orders, updateProfile, logout } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

  // Filter orders for current user
  const userOrders = orders.filter(o => o.customerId === user?.id);

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
            {activeTab === 'profile' ? (
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
            ) : (
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
                              <Link to={`/invoice/${ord.id}`} className="btn btn-sm btn-outline-secondary">
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
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyAccount;
