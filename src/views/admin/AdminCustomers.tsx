import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const AdminCustomers = () => {
  const { user, users, orders, toggleUserStatus } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'admin' && user?.email !== 'admin@ramasala.com';

  // Route security
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'You do not have administrative privileges.',
        confirmButtonColor: '#aa1a31'
      });
      navigate(RoutePaths.home);
    }
  }, [user, navigate]);

  // Filter customers
  const customers = users.filter(u => u.role === 'customer');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');

  // Extract unique cities
  const cities = Array.from(new Set(customers.map(c => c.city).filter(Boolean)));

  // Filtered List
  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = 
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cust.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust.phone && cust.phone.includes(searchQuery));
    const matchesCity = selectedCity === 'All' || cust.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const getCustomerMetrics = (customerId: string) => {
    const customerOrders = orders.filter(o => o.customerId === customerId && o.status !== 'Cancelled');
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      orderCount: customerOrders.length,
      totalSpent
    };
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1">
        
        {/* Admin Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-2" style={{ borderColor: '#FFB300' }}>
          <div>
            <h2 className="mb-1" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>
              Customer Directory
            </h2>
            <p className="text-secondary mb-0">Total Registered Customers: <strong>{customers.length}</strong> profiles • Filtered: <strong>{filteredCustomers.length}</strong></p>
          </div>
          <Link to={RoutePaths.admin} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>Back to Dashboard</Link>
        </div>
        
        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-5" style={{ borderLeftColor: '#4A1525 !important' }}>
              <div className="d-flex align-items-center">
                <div className="p-3 bg-light rounded-circle text-primary me-3" style={{ color: '#4A1525 !important' }}>
                  <i className="bi bi-people-fill fs-3" style={{ color: '#4A1525' }}></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small fw-bold">TOTAL CUSTOMERS</h6>
                  <h3 className="mb-0 fw-bold" style={{ color: '#4A1525' }}>{customers.length}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-5 border-success">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-light rounded-circle text-success me-3">
                  <i className="bi bi-person-check-fill fs-3"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small fw-bold">ACTIVE ACCOUNTS</h6>
                  <h3 className="mb-0 fw-bold text-success">{customers.filter(c => c.isActive !== false).length}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-5 border-warning" style={{ borderLeftColor: '#FFB300 !important' }}>
              <div className="d-flex align-items-center">
                <div className="p-3 bg-light rounded-circle me-3" style={{ color: '#FFB300' }}>
                  <i className="bi bi-currency-rupee fs-3" style={{ color: '#FFB300' }}></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small fw-bold">TOTAL LIFETIME VALUE</h6>
                  <h3 className="mb-0 fw-bold" style={{ color: '#D2691E' }}>₹{customers.reduce((sum, c) => sum + getCustomerMetrics(c.id).totalSpent, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-search"></i></span>
                <input 
                  type="text" 
                  className="form-control bg-light border-start-0" 
                  placeholder="Search customers by name, email, or phone number..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select bg-light" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                <option value="All">All Cities / Regions</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          {filteredCustomers.length === 0 ? (
            <p className="text-muted text-center py-5">No customer accounts match your search/filter.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                    <th>ID</th>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Delivery Location</th>
                    <th className="text-center">Orders Placed</th>
                    <th className="text-end">Total Lifetime Value</th>
                    <th className="text-center">Status</th>
                    {isSuperAdmin && <th className="text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(cust => {
                    const metrics = getCustomerMetrics(cust.id);
                    const isCustActive = cust.isActive !== false;
                    return (
                      <tr key={cust.id} className="customer-tr">
                        <td>{cust.id}</td>
                        <td><strong className="text-dark">{cust.name}</strong></td>
                        <td>{cust.email}</td>
                        <td>{cust.phone || <span className="text-muted">—</span>}</td>
                        <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                          {cust.address ? `${cust.address}, ${cust.city} - ${cust.zip}` : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center fw-bold">{metrics.orderCount}</td>
                        <td className="text-end fw-bold text-success">₹{metrics.totalSpent.toFixed(0)}</td>
                        <td className="text-center">
                          <span className={`badge ${isCustActive ? 'bg-success' : 'bg-danger'}`}>
                            {isCustActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="text-end">
                            <button
                              className={`btn btn-sm text-white fw-bold ${isCustActive ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => {
                                Swal.fire({
                                  title: `${isCustActive ? 'Deactivate' : 'Activate'} Customer?`,
                                  text: `Are you sure you want to ${isCustActive ? 'deactivate' : 'activate'} ${cust.name}?`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: isCustActive ? '#aa1a31' : '#198754',
                                  cancelButtonColor: '#secondary',
                                  confirmButtonText: `Yes, ${isCustActive ? 'deactivate' : 'activate'}!`
                                }).then((result) => {
                                  if (result.isConfirmed) {
                                    toggleUserStatus(cust.id || cust._id || '', !isCustActive);
                                    Swal.fire(
                                      isCustActive ? 'Deactivated!' : 'Activated!',
                                      `Customer ${cust.name} has been ${isCustActive ? 'deactivated' : 'activated'}.`,
                                      'success'
                                    );
                                  }
                                });
                              }}
                            >
                              {isCustActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <Footer />
      
      <style>{`
        .customer-tr {
          transition: background-color 0.25s ease;
        }
        .customer-tr:hover {
          background-color: #FDF6ED !important;
        }
        .badge {
          padding: 6px 12px;
          border-radius: 30px;
          font-weight: 600;
        }
        .btn-danger {
          background-color: #aa1a31 !important;
          border: none !important;
        }
        .btn-danger:hover {
          background-color: #8c1224 !important;
        }
        .btn-success {
          background-color: #198754 !important;
          border: none !important;
        }
        .btn-success:hover {
          background-color: #146c43 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminCustomers;
