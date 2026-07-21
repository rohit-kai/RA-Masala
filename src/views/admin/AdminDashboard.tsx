import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';
import axios from 'axios';

const AdminDashboard = () => {
  const { 
    user, orders, users, products, tickets, resolveTicket, updateOrderStatus,
    payments, shippingList, discounts, reviews, inventoryLogs,
    updatePaymentStatus, updateShipping, addDiscount, updateDiscount, deleteDiscount,
    deleteReview, securityLogs, toggleUserStatus
  } = useAuth();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'shipping' | 'discounts' | 'reviews' | 'logs' | 'tickets' | 'security' | 'settings'>('overview');
  const isSuperAdmin = user?.role === 'admin' && user?.email !== 'admin@ramasala.com';

  // Payment Settings States
  const [adminMerchantUpi, setAdminMerchantUpi] = useState('ramasala@upi');
  const [adminMerchantName, setAdminMerchantName] = useState('RA Masala');
  const [adminGatewayKeyId, setAdminGatewayKeyId] = useState('');
  const [adminGatewayKeySecret, setAdminGatewayKeySecret] = useState('');

  // Maintenance state
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const res = await axios.get('/api/maintenance/status');
        setIsMaintenanceMode(res.data.isMaintenanceMode);
      } catch (err) {
        console.error(err);
      }
    };
    if (user && user.role === 'admin') {
      fetchMaintenanceStatus();
    }
  }, [user]);

  const handleToggleMaintenance = async () => {
    try {
      const res = await axios.post('/api/maintenance/toggle', { status: !isMaintenanceMode });
      setIsMaintenanceMode(res.data.isMaintenanceMode);
      Swal.fire({
        icon: 'success',
        title: `Maintenance Mode ${res.data.isMaintenanceMode ? 'Activated' : 'Deactivated'}`,
        text: `The site has been set to ${res.data.isMaintenanceMode ? 'maintenance status' : 'live status'}.`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to toggle maintenance mode.', 'error');
    }
  };

  // Load Admin Settings Configs on active tab change
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const res = await axios.get('/api/config/payment/admin');
        if (res.data) {
          setAdminMerchantUpi(res.data.merchantUpi || '');
          setAdminMerchantName(res.data.merchantName || '');
          setAdminGatewayKeyId(res.data.gatewayKeyId || '');
          setAdminGatewayKeySecret(res.data.gatewayKeySecret || '');
        }
      } catch (err) {
        console.error('Error fetching admin config settings:', err);
      }
    };
    if (activeTab === 'settings') {
      fetchPaymentSettings();
    }
  }, [activeTab]);

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      Swal.showLoading();
      await axios.post('/api/config/payment', {
        merchantUpi: adminMerchantUpi,
        merchantName: adminMerchantName,
        gatewayKeyId: adminGatewayKeyId,
        gatewayKeySecret: adminGatewayKeySecret
      });
      Swal.fire('Success', 'Payment gateway and VPA configurations updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to save configuration settings.', 'error');
    }
  };

  // CSV Export helper
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] !== undefined ? row[header] : '';
        const escaped = ('' + val).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCustomers = () => {
    const customers = users.filter(u => u.role === 'customer');
    exportToCSV(customers, 'customers_list.csv', ['id', 'name', 'email', 'phone', 'address', 'city', 'zip']);
  };

  const handleExportProducts = () => {
    const prodList = products.map((p: any) => ({
      id: p._id || p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      stock: p.stock,
      unit: p.unit,
      description: p.description
    }));
    exportToCSV(prodList, 'products_list.csv', ['id', 'name', 'price', 'category', 'stock', 'unit', 'description']);
  };

  const handleExportOrders = () => {
    const ordersList = orders.map(o => ({
      id: o.id,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      subtotal: o.subtotal,
      tax: o.tax,
      shipping: o.shipping,
      total: o.total,
      date: new Date(o.date).toLocaleDateString(),
      status: o.status,
      paymentMethod: o.paymentMethod
    }));
    exportToCSV(ordersList, 'orders_list.csv', ['id', 'customerName', 'customerEmail', 'subtotal', 'tax', 'shipping', 'total', 'date', 'status', 'paymentMethod']);
  };

  const handleExportPayments = () => {
    const payList = payments.map((p: any) => ({
      id: p._id,
      orderId: p.orderId,
      amount: p.amount,
      method: p.method,
      status: p.status,
      transactionId: p.transactionId,
      date: p.createdAt ? new Date(p.createdAt).toLocaleString() : ''
    }));
    exportToCSV(payList, 'payments_list.csv', ['id', 'orderId', 'amount', 'method', 'status', 'transactionId', 'date']);
  };

  const handleExportInventoryLogs = () => {
    const logList = inventoryLogs.map((l: any) => ({
      id: l._id,
      productId: l.productId,
      productName: l.productName,
      changeType: l.changeType,
      quantityChanged: l.quantityChanged,
      newStock: l.newStock,
      date: l.createdAt ? new Date(l.createdAt).toLocaleString() : ''
    }));
    exportToCSV(logList, 'inventory_logs.csv', ['id', 'productId', 'productName', 'changeType', 'quantityChanged', 'newStock', 'date']);
  };

  // Coupon Form States
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [couponValue, setCouponValue] = useState(0);
  const [minPurchase, setMinPurchase] = useState(0);

  // Edit Shipping States
  const [editingShipId, setEditingShipId] = useState<string | null>(null);
  const [shipCarrier, setShipCarrier] = useState('');
  const [shipTracking, setShipTracking] = useState('');
  const [shipStatus, setShipStatus] = useState<'Order Placed' | 'In Transit' | 'Out for Delivery' | 'Delivered'>('Order Placed');

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

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || couponValue <= 0) {
      Swal.fire('Error', 'Please provide valid coupon details.', 'error');
      return;
    }
    await addDiscount({
      code: couponCode.toUpperCase(),
      discountType,
      value: couponValue,
      minPurchase,
      active: true
    });
    setCouponCode('');
    setCouponValue(0);
    setMinPurchase(0);
    Swal.fire('Success', 'Coupon created successfully!', 'success');
  };

  const handleSaveShipping = async (id: string) => {
    await updateShipping(id, shipCarrier, shipTracking, shipStatus);
    setEditingShipId(null);
    Swal.fire('Success', 'Shipping information updated.', 'success');
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
            <Link to={RoutePaths.adminProducts} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>Manage Products</Link>
            <Link to={RoutePaths.adminCustomers} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>Manage Customers</Link>
            <Link to={RoutePaths.userAccount} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#aa1a31', border: '1px solid #FFB300' }}>My Account</Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <ul className="nav nav-pills mb-4 d-flex gap-2 border-bottom pb-3" style={{ borderColor: 'rgba(74, 21, 37, 0.1)' }}>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'overview' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'overview' ? '#aa1a31' : 'transparent', color: activeTab === 'overview' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-speedometer2 me-1"></i> Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'payments' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'payments' ? '#aa1a31' : 'transparent', color: activeTab === 'payments' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('payments')}
            >
              <i className="bi bi-credit-card me-1"></i> Payments ({payments.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'shipping' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'shipping' ? '#aa1a31' : 'transparent', color: activeTab === 'shipping' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('shipping')}
            >
              <i className="bi bi-truck me-1"></i> Shipping ({shippingList.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'discounts' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'discounts' ? '#aa1a31' : 'transparent', color: activeTab === 'discounts' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('discounts')}
            >
              <i className="bi bi-tag me-1"></i> Coupons ({discounts.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'reviews' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'reviews' ? '#aa1a31' : 'transparent', color: activeTab === 'reviews' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('reviews')}
            >
              <i className="bi bi-star me-1"></i> Reviews ({reviews.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'logs' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'logs' ? '#aa1a31' : 'transparent', color: activeTab === 'logs' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('logs')}
            >
              <i className="bi bi-journal-text me-1"></i> Inventory Logs ({inventoryLogs.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'tickets' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'tickets' ? '#aa1a31' : 'transparent', color: activeTab === 'tickets' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('tickets')}
            >
              <i className="bi bi-headset me-1"></i> Support Tickets ({tickets.length})
            </button>
          </li>
          {isSuperAdmin && (
            <li className="nav-item">
              <button 
                className={`nav-link fw-bold px-3 py-2 ${activeTab === 'settings' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'settings' ? '#aa1a31' : 'transparent', color: activeTab === 'settings' ? '#fff' : '#4A1525' }}
                onClick={() => setActiveTab('settings')}
              >
                <i className="bi bi-wallet2 me-1"></i> Payment Settings
              </button>
            </li>
          )}
          {isSuperAdmin && (
            <li className="nav-item">
              <button 
                className={`nav-link fw-bold px-3 py-2 ${activeTab === 'security' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'security' ? '#aa1a31' : 'transparent', color: activeTab === 'security' ? '#fff' : '#4A1525' }}
                onClick={() => setActiveTab('security')}
              >
                <i className="bi bi-shield-lock-fill me-1"></i> Security Logs ({securityLogs.length})
              </button>
            </li>
          )}
        </ul>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <>
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

            {/* Super Admin Control Panel */}
            {user?.email?.toLowerCase() === 'ujumakikai8975@gmail.com' && (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                  <i className="bi bi-gear-fill me-2 text-danger"></i> System Operations (Super Admin)
                </h5>
                <div className="row g-3 align-items-center">
                  {/* Maintenance Mode Toggle */}
                  <div className="col-md-6 border-end">
                    <div className="d-flex align-items-center justify-content-between pe-md-4">
                      <div>
                        <strong className="d-block text-dark">Site Maintenance Mode</strong>
                        <span className="text-muted small">Redirect all non-admin visitors to placeholder page.</span>
                      </div>
                      <div className="form-check form-switch fs-4">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="maintenanceToggle" 
                          checked={isMaintenanceMode}
                          onChange={handleToggleMaintenance}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CSV Data Export */}
                  <div className="col-md-6 ps-md-4">
                    <strong className="d-block text-dark mb-2">Export System Databases</strong>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportCustomers}>
                        <i className="bi bi-people-fill me-1"></i> Customers List
                      </button>
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportProducts}>
                        <i className="bi bi-box-seam-fill me-1"></i> Products Catalog
                      </button>
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportOrders}>
                        <i className="bi bi-receipt me-1"></i> Orders History
                      </button>
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportPayments}>
                        <i className="bi bi-credit-card me-1"></i> Payments List
                      </button>
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportInventoryLogs}>
                        <i className="bi bi-journal-text me-1"></i> Inventory Logs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      {bestSellers.map((item) => {
                        const maxQty = Math.max(...bestSellers.map(s => s.qty));
                        const pct = maxQty > 0 ? Math.min(100, Math.max(15, (item.qty / maxQty) * 100)) : 15;
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
                          <strong className="text-dark d-block">{ord.shippingAddress?.name || ord.customerName}</strong>
                          <small className="text-muted">{ord.shippingAddress?.phone || 'N/A'}</small>
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
                          <Link to={`/invoice/${ord.id}`} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>
                            Invoice
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Payments Management Tab */}
        {activeTab === 'payments' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-credit-card me-2 text-danger"></i> Transaction & Payment Logs
            </h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary">
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Transaction ID</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay._id}>
                      <td className="fw-semibold">{pay.orderId}</td>
                      <td>₹{pay.amount}</td>
                      <td><span className="badge bg-light text-dark border">{pay.method}</span></td>
                      <td><code>{pay.transactionId || 'COD (None)'}</code></td>
                      <td>
                        <span className={`badge ${
                          pay.status === 'Completed' ? 'bg-success' : pay.status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="form-select form-select-sm"
                          value={pay.status}
                          onChange={(e) => {
                            if (pay._id) {
                              updatePaymentStatus(pay._id, e.target.value as any);
                              Swal.fire('Success', 'Payment status updated.', 'success');
                            }
                          }}
                          style={{ maxWidth: '130px' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-truck me-2 text-danger"></i> Shipping & Delivery Status
            </h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary">
                    <th>Order ID</th>
                    <th>Carrier</th>
                    <th>Tracking Number</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shippingList.map(ship => (
                    <tr key={ship._id}>
                      <td className="fw-semibold">{ship.orderId}</td>
                      <td>
                        {editingShipId === ship._id ? (
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={shipCarrier} 
                            onChange={(e) => setShipCarrier(e.target.value)} 
                          />
                        ) : (
                          ship.carrier
                        )}
                      </td>
                      <td>
                        {editingShipId === ship._id ? (
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={shipTracking} 
                            onChange={(e) => setShipTracking(e.target.value)} 
                          />
                        ) : (
                          ship.trackingNumber || <em className="text-muted">Not Assigned</em>
                        )}
                      </td>
                      <td>
                        {editingShipId === ship._id ? (
                          <select 
                            className="form-select form-select-sm" 
                            value={shipStatus} 
                            onChange={(e) => setShipStatus(e.target.value as any)}
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        ) : (
                          <span className={`badge ${
                            ship.status === 'Delivered' ? 'bg-success' : 'bg-primary'
                          }`}>{ship.status}</span>
                        )}
                      </td>
                      <td>
                        {editingShipId === ship._id ? (
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-success" onClick={() => ship._id && handleSaveShipping(ship._id)}>
                              Save
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingShipId(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-sm text-white" 
                            style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}
                            onClick={() => {
                              setEditingShipId(ship._id || null);
                              setShipCarrier(ship.carrier);
                              setShipTracking(ship.trackingNumber);
                              setShipStatus(ship.status);
                            }}
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'discounts' && (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="mb-4 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>Create Coupon</h5>
                <form onSubmit={handleCreateCoupon}>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Coupon Code</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. MONSOON20" 
                      value={couponCode} 
                      onChange={(e) => setCouponCode(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Discount Type</label>
                    <select 
                      className="form-select" 
                      value={discountType} 
                      onChange={(e) => setDiscountType(e.target.value as any)}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Rate (₹)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Discount Value</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={couponValue} 
                      onChange={(e) => setCouponValue(Number(e.target.value))} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Min Purchase Limit (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={minPurchase} 
                      onChange={(e) => setMinPurchase(Number(e.target.value))} 
                    />
                  </div>
                  <button type="submit" className="btn text-white w-100 fw-bold" style={{ backgroundColor: '#aa1a31' }}>
                    Generate Coupon
                  </button>
                </form>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="mb-4 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>Active Coupons</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="table-light text-secondary">
                        <th>Code</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Min Purchase</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map(disc => (
                        <tr key={disc._id}>
                          <td><strong>{disc.code}</strong></td>
                          <td><span className="badge bg-light text-dark border">{disc.discountType}</span></td>
                          <td>{disc.discountType === 'percentage' ? `${disc.value}%` : `₹${disc.value}`}</td>
                          <td>₹{disc.minPurchase}</td>
                          <td>
                            <span className={`badge ${disc.active ? 'bg-success' : 'bg-secondary'}`}>
                              {disc.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="text-end">
                            <button 
                              className="btn btn-sm text-white bg-danger" 
                              onClick={() => disc._id && deleteDiscount(disc._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-star me-2 text-danger"></i> Product Reviews & Moderation
            </h5>
            <div className="row g-3">
              {reviews.length === 0 ? (
                <div className="text-center text-muted py-5 col-12">No customer reviews yet.</div>
              ) : (
                reviews.map(rev => (
                  <div key={rev._id} className="col-md-6 col-lg-4">
                    <div className="card border-0 bg-light shadow-sm rounded-3 p-3 h-100 position-relative">
                      <button 
                        className="btn btn-sm btn-link text-danger position-absolute" 
                        style={{ top: '10px', right: '10px' }}
                        onClick={() => rev._id && deleteReview(rev._id)}
                      >
                        <i className="bi bi-trash fs-5"></i>
                      </button>
                      <strong className="text-danger d-block">{rev.productName}</strong>
                      <div className="my-1" style={{ color: '#FFD700' }}>
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <i key={i} className="bi bi-star-fill me-0.5"></i>
                        ))}
                        {Array.from({ length: 5 - rev.rating }).map((_, i) => (
                          <i key={i} className="bi bi-star me-0.5"></i>
                        ))}
                      </div>
                      <p className="text-dark small mb-2">"{rev.comment}"</p>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        By <strong>{rev.customerName}</strong> ({rev.customerEmail})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Inventory Logs Tab */}
        {activeTab === 'logs' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-journal-text me-2 text-danger"></i> Inventory Transaction Logs
            </h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary">
                    <th>Product</th>
                    <th>Change Type</th>
                    <th>Quantity Changed</th>
                    <th>New Stock Level</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLogs.map(log => (
                    <tr key={log._id}>
                      <td><strong>{log.productName}</strong></td>
                      <td>
                        <span className={`badge ${
                          log.changeType === 'sale' ? 'bg-danger' : log.changeType === 'restock' ? 'bg-success' : 'bg-primary'
                        }`}>
                          {log.changeType.toUpperCase()}
                        </span>
                      </td>
                      <td className={log.quantityChanged < 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                        {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                      </td>
                      <td className="fw-semibold">{log.newStock} units</td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(log.createdAt || '').toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tickets Handling & Report Tab */}
        {activeTab === 'tickets' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-headset me-2 text-danger"></i> Customer Support Tickets & Reports
            </h5>

            {/* Ticket Report Stats */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border text-center">
                  <h6 className="text-muted small text-uppercase fw-semibold mb-1">Total Queries</h6>
                  <h3 className="fw-bold mb-0 text-dark">{tickets.length}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border text-center border-start border-danger border-3">
                  <h6 className="text-muted small text-uppercase fw-semibold mb-1">Pending/Open</h6>
                  <h3 className="fw-bold mb-0 text-danger">{tickets.filter(t => t.status === 'Open').length}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border text-center border-start border-success border-3">
                  <h6 className="text-muted small text-uppercase fw-semibold mb-1">Resolved</h6>
                  <h3 className="fw-bold mb-0 text-success">{tickets.filter(t => t.status === 'Resolved').length}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border text-center">
                  <h6 className="text-muted small text-uppercase fw-semibold mb-1">Resolution Rate</h6>
                  <h3 className="fw-bold mb-0 text-primary">
                    {tickets.length > 0 
                      ? `${Math.round((tickets.filter(t => t.status === 'Resolved').length / tickets.length) * 100)}%`
                      : '100%'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary">
                    <th>Customer Details</th>
                    <th>Query Message</th>
                    <th>Received Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">No support tickets found.</td>
                    </tr>
                  ) : (
                    tickets.map(ticket => (
                      <tr key={ticket.id || ticket._id}>
                        <td>
                          <strong className="text-dark d-block">{ticket.customerName}</strong>
                          <span className="text-muted small">{ticket.customerEmail}</span>
                        </td>
                        <td style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                          "{ticket.message}"
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ticket.date}
                        </td>
                        <td>
                          <span className={`badge px-2.5 py-1.5 ${ticket.status === 'Resolved' ? 'bg-success' : 'bg-danger'}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td>
                          {ticket.status === 'Open' ? (
                            <button 
                              className="btn btn-sm btn-success fw-bold py-1 px-2.5 rounded-2"
                              onClick={() => handleResolveTicket(ticket._id || ticket.id)}
                            >
                              Mark Resolved
                            </button>
                          ) : (
                            <span className="text-muted small"><i className="bi bi-check-circle-fill text-success me-1"></i> Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Configuration Settings Tab */}
        {isSuperAdmin && activeTab === 'settings' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ maxWidth: '650px' }}>
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-wallet2 me-2 text-danger"></i> Payment Gateway & Bank settings
            </h5>
            <form onSubmit={handleSavePaymentSettings}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">Merchant UPI VPA / VPA ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={adminMerchantUpi} 
                  onChange={(e) => setAdminMerchantUpi(e.target.value)} 
                  placeholder="e.g. yourname@bank, paytm, or upi" 
                  required
                />
                <small className="text-muted">Customers will scan or open intent links pointing to this VPA address to pay you directly.</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">Merchant Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={adminMerchantName} 
                  onChange={(e) => setAdminMerchantName(e.target.value)} 
                  placeholder="e.g. RA Masala Ltd" 
                  required
                />
                <small className="text-muted">Display name configured with your merchant VPA.</small>
              </div>

              <hr className="my-4 text-muted" />

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">Razorpay Key ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={adminGatewayKeyId} 
                  onChange={(e) => setAdminGatewayKeyId(e.target.value)} 
                  placeholder="rzp_live_xxxxxxxxxx" 
                />
                <small className="text-muted">Your public API key from Razorpay Merchant Dashboard.</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">Razorpay Key Secret</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={adminGatewayKeySecret} 
                  onChange={(e) => setAdminGatewayKeySecret(e.target.value)} 
                  placeholder="Secret API Key" 
                />
                <small className="text-muted">Your secret API key. Kept secure and hidden on the server.</small>
              </div>

              <button type="submit" className="btn text-white fw-bold px-4 py-2 mt-3" style={{ backgroundColor: '#4A1525' }}>
                Save Settings
              </button>
            </form>
          </div>
        )}

        {isSuperAdmin && activeTab === 'security' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-shield-lock-fill me-2 text-danger"></i> Super Admin System & Security Logs
            </h5>
            
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary">
                    <th>Timestamp</th>
                    <th>Action Taken By</th>
                    <th>Action</th>
                    <th>Target User</th>
                    <th>Log Details</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">No security logs recorded.</td>
                    </tr>
                  ) : (
                    securityLogs.map(log => (
                      <tr key={log._id}>
                        <td style={{ fontSize: '0.85rem' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td>
                          <strong className="text-dark d-block">{log.adminName}</strong>
                          <span className="text-muted small">{log.adminEmail}</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            log.action === 'activated' ? 'bg-success' : log.action === 'deactivated' ? 'bg-danger' : 'bg-dark'
                          }`}>
                            {log.action.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <strong className="text-dark d-block">{log.targetName}</strong>
                          <span className="text-muted small">{log.targetEmail}</span>
                        </td>
                        <td style={{ maxWidth: '300px', wordBreak: 'break-word', fontSize: '0.9rem' }}>
                          {log.details}
                        </td>
                        <td className="text-end">
                          {(() => {
                            const targetUserObj = users.find(u => u.email === log.targetEmail);
                            const isCurrentlyActive = targetUserObj ? targetUserObj.isActive !== false : true;
                            if (targetUserObj && !isCurrentlyActive) {
                              return (
                                <button
                                  className="btn btn-sm btn-success fw-bold py-1 px-2.5 rounded-2"
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'Reactivate Admin?',
                                      text: `Are you sure you want to reactivate ${log.targetName}?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#198754',
                                      cancelButtonColor: '#secondary',
                                      confirmButtonText: 'Yes, reactivate!'
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        toggleUserStatus(targetUserObj.id || targetUserObj._id || '', true);
                                        Swal.fire('Activated!', `User ${log.targetName} is now active.`, 'success');
                                      }
                                    });
                                  }}
                                >
                                  Activate
                                </button>
                              );
                            } else if (targetUserObj) {
                              return (
                                <span className="text-muted small">
                                  <i className="bi bi-check-circle-fill text-success me-1"></i> Active
                                </span>
                              );
                            } else {
                              return <span className="text-muted small">—</span>;
                            }
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
