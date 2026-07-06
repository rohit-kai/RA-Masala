import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
  const { user, orders, users, tickets, resolveTicket, updateOrderStatus } = useAuth();
  const navigate = useNavigate();

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

  // Statistics
  const totalSales = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const activeTickets = tickets.filter(t => t.status === 'Open').length;

  // Best Selling Products Calculation
  const productSalesMap: { [name: string]: number } = {};
  orders.forEach(order => {
    if (order.status !== 'Cancelled') {
      order.items.forEach(item => {
        productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
      });
    }
  });

  const bestSellers = Object.keys(productSalesMap).map(name => ({
    name,
    qty: productSalesMap[name]
  })).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const handleResolveTicket = (id: string) => {
    resolveTicket(id);
    Swal.fire({
      icon: 'success',
      title: 'Ticket Resolved',
      text: 'Support ticket status set to Resolved.',
      timer: 1500,
      showConfirmButton: false
    });
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
              <i className="bi bi-shield-fill-check text-danger me-2"></i> Admin Panel
            </h2>
            <p className="text-secondary mb-0">Management Portal for RA Masala Operations</p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-sm-0">
            <Link to={RoutePaths.adminProducts} className="btn btn-sm btn-outline-dark fw-bold">Manage Products</Link>
            <Link to={RoutePaths.adminCustomers} className="btn btn-sm btn-outline-dark fw-bold">Manage Customers</Link>
            <Link to={RoutePaths.userAccount} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525' }}>My Account</Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="row g-4 mb-5">
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-danger border-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>Total Sales</h6>
                  <h3 className="mb-0 fw-bold text-dark">₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                </div>
                <div className="p-3 rounded-4 bg-danger bg-opacity-10 text-danger">
                  <i className="bi bi-currency-rupee fs-3"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-warning border-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>Total Orders</h6>
                  <h3 className="mb-0 fw-bold text-dark">{totalOrders}</h3>
                </div>
                <div className="p-3 rounded-4 bg-warning bg-opacity-10 text-warning">
                  <i className="bi bi-bag-fill fs-3"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-success border-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>Registered Users</h6>
                  <h3 className="mb-0 fw-bold text-dark">{totalCustomers}</h3>
                </div>
                <div className="p-3 rounded-4 bg-success bg-opacity-10 text-success">
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-info border-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>Open Tickets</h6>
                  <h3 className="mb-0 fw-bold text-dark">{activeTickets}</h3>
                </div>
                <div className="p-3 rounded-4 bg-info bg-opacity-10 text-info">
                  <i className="bi bi-chat-left-text-fill fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="row g-4 mb-5">
          {/* Reports & Best Sellers */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                <i className="bi bi-bar-chart-fill me-2 text-danger"></i> Sales & Best Sellers Report
              </h5>
              
              {bestSellers.length === 0 ? (
                <div className="text-center py-5 text-muted">No sales reports available. Placed orders will show statistics here.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {bestSellers.map((item, index) => {
                    const pct = Math.min(100, Math.max(15, (item.qty / Math.max(...bestSellers.map(s => s.qty))) * 100));
                    return (
                      <div key={item.name}>
                        <div className="d-flex justify-content-between mb-1 text-sm">
                          <span className="fw-semibold text-dark">{item.name}</span>
                          <span className="fw-bold text-secondary">{item.qty} units sold</span>
                        </div>
                        <div className="progress rounded-pill" style={{ height: '10px' }}>
                          <div 
                            className="progress-bar rounded-pill" 
                            style={{ 
                              width: `${pct}%`, 
                              background: 'linear-gradient(90deg, #aa1a31 0%, #FFB300 100%)' 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Customer Support Tickets */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                <i className="bi bi-headset me-2 text-danger"></i> Customer Queries & Tickets
              </h5>
              
              <div className="d-flex flex-column gap-3 overflow-y-auto" style={{ maxHeight: '350px' }}>
                {tickets.length === 0 ? (
                  <p className="text-muted text-center py-5">No customer queries currently.</p>
                ) : (
                  tickets.map(ticket => (
                    <div key={ticket.id} className="p-3 rounded-3 border bg-light position-relative">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong className="d-block text-dark" style={{ fontSize: '0.95rem' }}>{ticket.customerName}</strong>
                          <small className="text-muted">{ticket.customerEmail} • {ticket.date}</small>
                        </div>
                        <span className={`badge ${ticket.status === 'Open' ? 'bg-danger' : 'bg-success'}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mb-2 text-dark" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>"{ticket.message}"</p>
                      {ticket.status === 'Open' && (
                        <button 
                          className="btn btn-sm btn-success py-1 px-2.5 rounded-2 fw-semibold"
                          onClick={() => handleResolveTicket(ticket.id)}
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Orders Section */}
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
            <i className="bi bi-clock-history me-2 text-danger"></i> Order Status Control
          </h5>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                  <th className="text-end">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <tr key={ord.id}>
                    <td className="fw-semibold text-dark">{ord.id}</td>
                    <td>
                      <strong className="text-dark d-block">{ord.shippingAddress.name}</strong>
                      <small className="text-muted">{ord.shippingAddress.phone}</small>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(ord.date).toLocaleDateString()}</td>
                    <td className="fw-bold">₹{ord.total.toFixed(0)}</td>
                    <td>
                      <span className="badge px-2 py-1" style={{ 
                        backgroundColor: ord.status === 'Shipped' ? '#E8F5E9' : ord.status === 'Processing' ? '#FFF3E0' : ord.status === 'Cancelled' ? '#FFEBEE' : '#E3F2FD',
                        color: ord.status === 'Shipped' ? '#2E7D32' : ord.status === 'Processing' ? '#E65100' : ord.status === 'Cancelled' ? '#C62828' : '#1565C0',
                      }}>
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="form-select form-select-sm" 
                        value={ord.status}
                        onChange={(e) => {
                          updateOrderStatus(ord.id, e.target.value as any);
                          Swal.fire({
                            icon: 'success',
                            title: 'Status Updated',
                            text: `Order status set to ${e.target.value}`,
                            timer: 1000,
                            showConfirmButton: false
                          });
                        }}
                        style={{ maxWidth: '130px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="text-end">
                      <Link to={`/invoice/${ord.id}`} className="btn btn-sm btn-outline-secondary">
                        Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
