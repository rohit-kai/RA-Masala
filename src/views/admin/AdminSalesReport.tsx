import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const AdminSalesReport = () => {
  const { user, orders } = useAuth();
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

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  const applyQuickRange = (range: 'today' | 'week' | 'month' | 'all') => {
    const now = new Date();
    if (range === 'all') {
      setFromDate('');
      setToDate('');
      return;
    }
    if (range === 'today') {
      setFromDate(toDateStr(now));
      setToDate(toDateStr(now));
      return;
    }
    if (range === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      setFromDate(toDateStr(start));
      setToDate(toDateStr(now));
      return;
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setFromDate(toDateStr(start));
    setToDate(toDateStr(now));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setMethodFilter('All');
    setFromDate('');
    setToDate('');
  };

  const getOrderDate = (o: { date?: string; createdAt?: string }) => {
    const raw = o.createdAt || o.date || '';
    return raw ? raw.split('T')[0] : '';
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const matchesSearch =
        !searchQuery ||
        ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ord.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ord.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || ord.status === statusFilter;
      const matchesMethod = methodFilter === 'All' || ord.paymentMethod === methodFilter;

      const orderDate = getOrderDate(ord);
      const matchesFrom = !fromDate || (orderDate && orderDate >= fromDate);
      const matchesTo = !toDate || (orderDate && orderDate <= toDate);

      return matchesSearch && matchesStatus && matchesMethod && matchesFrom && matchesTo;
    }).sort((a, b) => {
      const da = a.createdAt || a.date || '';
      const db = b.createdAt || b.date || '';
      return db.localeCompare(da);
    });
  }, [orders, searchQuery, statusFilter, methodFilter, fromDate, toDate]);

  // Summary stats from filtered orders (exclude Cancelled from revenue)
  const activeOrders = filteredOrders.filter(o => o.status !== 'Cancelled');
  const netSales = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const grossSales = activeOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalTax = activeOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
  const totalShipping = activeOrders.reduce((sum, o) => sum + (o.shipping || 0), 0);
  const totalDiscount = activeOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled');
  const avgOrderValue = activeOrders.length > 0 ? netSales / activeOrders.length : 0;
  const unitsSold = activeOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0), 0
  );

  // Status breakdown
  const statusBreakdown = (['Pending', 'Processing', 'Shipped', 'Cancelled'] as const).map(status => {
    const list = filteredOrders.filter(o => o.status === status);
    return {
      status,
      count: list.length,
      total: list.reduce((sum, o) => sum + o.total, 0)
    };
  });

  // Payment method breakdown
  const methodBreakdown = (['COD', 'UPI', 'CARD', 'NETBANKING'] as const).map(method => {
    const list = activeOrders.filter(o => o.paymentMethod === method);
    return {
      method,
      count: list.length,
      total: list.reduce((sum, o) => sum + o.total, 0)
    };
  }).filter(m => m.count > 0 || methodFilter === m.method);

  // Product-wise sales from filtered orders
  const productSales = useMemo(() => {
    const map: { [name: string]: { qty: number; revenue: number } } = {};
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        if (!map[item.name]) map[item.name] = { qty: 0, revenue: 0 };
        map[item.name].qty += item.quantity;
        map[item.name].revenue += item.price * item.quantity;
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [activeOrders]);

  // Monthly trend (last 12 months from filtered active orders)
  const monthlyTrend = useMemo(() => {
    const map: { [key: string]: { label: string; total: number; orders: number } } = {};
    activeOrders.forEach(o => {
      const d = o.createdAt ? new Date(o.createdAt) : (o.date ? new Date(o.date) : null);
      if (!d || isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = {
          label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
          total: 0,
          orders: 0
        };
      }
      map[key].total += o.total;
      map[key].orders += 1;
    });
    return Object.keys(map).sort().reverse().map(k => ({ key: k, ...map[k] }));
  }, [activeOrders]);

  const maxMonthlyTotal = monthlyTrend.length > 0
    ? Math.max(...monthlyTrend.map(m => m.total), 1)
    : 1;
  const maxProductRevenue = productSales.length > 0
    ? Math.max(...productSales.map(p => p.revenue), 1)
    : 1;

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] !== undefined ? row[header] : '';
        return `"${('' + val).replace(/"/g, '\\"')}"`;
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
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    if (filteredOrders.length === 0) {
      Swal.fire(t('adm_error'), t('adm_no_orders_match'), 'error');
      return;
    }
    const rows = filteredOrders.map(o => ({
      orderId: o.id,
      date: getOrderDate(o),
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      items: o.items.reduce((s, it) => s + it.quantity, 0),
      subtotal: o.subtotal,
      tax: o.tax,
      shipping: o.shipping,
      discount: o.discount || 0,
      total: o.total,
      status: o.status,
      paymentMethod: o.paymentMethod
    }));
    exportToCSV(
      rows,
      `sales_report_${fromDate || 'all'}_${toDate || 'all'}.csv`,
      ['orderId', 'date', 'customerName', 'customerEmail', 'items', 'subtotal', 'tax', 'shipping', 'discount', 'total', 'status', 'paymentMethod']
    );
  };

  const formatINR = (n: number) =>
    n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      Shipped: { bg: '#E8F5E9', color: '#2E7D32' },
      Processing: { bg: '#FFF3E0', color: '#E65100' },
      Cancelled: { bg: '#FFEBEE', color: '#C62828' },
      Pending: { bg: '#E3F2FD', color: '#1565C0' }
    };
    const s = styles[status] || { bg: '#EEEEEE', color: '#424242' };
    return (
      <span className="badge px-2 py-1" style={{ backgroundColor: s.bg, color: s.color }}>
        {status}
      </span>
    );
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
              <i className="bi bi-graph-up-arrow text-danger me-2"></i> {t('adm_sales_report_title')}
            </h2>
            <p className="text-secondary mb-0">
              {t('adm_sales_report_subtitle')} • {t('adm_filtered')} <strong>{filteredOrders.length}</strong> / {orders.length}
            </p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-sm-0">
            <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportReport}>
              <i className="bi bi-download me-1"></i> {t('adm_export_report_csv')}
            </button>
            <Link to={RoutePaths.admin} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#aa1a31', border: '1px solid #FFB300' }}>
              {t('adm_back_to_dashboard')}
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label text-muted fw-semibold">{t('adm_search_orders_placeholder')}</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder={t('adm_search_orders_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label text-muted fw-semibold">{t('adm_filter_from_date')}</label>
              <input
                type="date"
                className="form-control bg-light"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label text-muted fw-semibold">{t('adm_filter_to_date')}</label>
              <input
                type="date"
                className="form-control bg-light"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label text-muted fw-semibold">{t('adm_th_status')}</label>
              <select className="form-select bg-light" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">{t('adm_all_statuses')}</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label text-muted fw-semibold">{t('adm_th_method')}</label>
              <select className="form-select bg-light" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                <option value="All">{t('adm_all_payment_methods')}</option>
                <option value="COD">COD</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="NETBANKING">Net Banking</option>
              </select>
            </div>
            <div className="col-md-1">
              <button className="btn btn-outline-secondary w-100" onClick={resetFilters} title={t('adm_reset_filters')}>
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            </div>
            <div className="col-12">
              <div className="d-flex flex-wrap gap-2">
                <button className={`btn btn-sm fw-bold ${!fromDate && !toDate ? 'text-white' : 'btn-outline-secondary'}`} style={!fromDate && !toDate ? { backgroundColor: '#aa1a31' } : {}} onClick={() => applyQuickRange('all')}>
                  {t('adm_quick_all')}
                </button>
                <button className="btn btn-sm btn-outline-secondary fw-bold" onClick={() => applyQuickRange('today')}>{t('adm_quick_today')}</button>
                <button className="btn btn-sm btn-outline-secondary fw-bold" onClick={() => applyQuickRange('week')}>{t('adm_quick_week')}</button>
                <button className="btn btn-sm btn-outline-secondary fw-bold" onClick={() => applyQuickRange('month')}>{t('adm_quick_month')}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="row g-4 mb-4">
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-danger border-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>{t('adm_net_sales')}</h6>
                  <h3 className="mb-0 fw-bold text-dark">₹{formatINR(netSales)}</h3>
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
                  <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>{t('adm_stat_total_orders')}</h6>
                  <h3 className="mb-0 fw-bold text-dark">{filteredOrders.length}</h3>
                </div>
                <div className="p-3 rounded-4 bg-warning bg-opacity-10 text-warning">
                  <i className="bi bi-bag-check fs-3"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-success border-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>{t('adm_avg_order_value')}</h6>
                  <h3 className="mb-0 fw-bold text-dark">₹{formatINR(avgOrderValue)}</h3>
                </div>
                <div className="p-3 rounded-4 bg-success bg-opacity-10 text-success">
                  <i className="bi bi-receipt fs-3"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-info border-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>{t('adm_units_sold')}</h6>
                  <h3 className="mb-0 fw-bold text-dark">{unitsSold}</h3>
                </div>
                <div className="p-3 rounded-4 bg-info bg-opacity-10 text-info">
                  <i className="bi bi-box-seam fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary stats row */}
        <div className="row g-4 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
              <small className="text-muted fw-semibold text-uppercase">{t('adm_gross_sales')}</small>
              <h5 className="mb-0 fw-bold" style={{ color: '#4A1525' }}>₹{formatINR(grossSales)}</h5>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
              <small className="text-muted fw-semibold text-uppercase">{t('adm_total_tax_collected')}</small>
              <h5 className="mb-0 fw-bold" style={{ color: '#4A1525' }}>₹{formatINR(totalTax)}</h5>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
              <small className="text-muted fw-semibold text-uppercase">{t('adm_total_shipping')}</small>
              <h5 className="mb-0 fw-bold" style={{ color: '#4A1525' }}>₹{formatINR(totalShipping)}</h5>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
              <small className="text-muted fw-semibold text-uppercase">{t('adm_cancelled_orders')} ({cancelledOrders.length})</small>
              <h5 className="mb-0 fw-bold text-danger">₹{formatINR(cancelledOrders.reduce((s, o) => s + o.total, 0))}</h5>
            </div>
          </div>
        </div>

        {/* Breakdowns row */}
        <div className="row g-4 mb-4">
          {/* Status breakdown */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="mb-3 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                <i className="bi bi-pie-chart-fill text-danger me-2"></i> {t('adm_status_breakdown')}
              </h5>
              {statusBreakdown.map(s => (
                <div key={s.status} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>{statusBadge(s.status)}</div>
                  <div className="text-end">
                    <strong className="d-block">{s.count}</strong>
                    <small className="text-muted">₹{formatINR(s.total)}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment method breakdown */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="mb-3 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                <i className="bi bi-credit-card-fill text-danger me-2"></i> {t('adm_payment_breakdown')}
              </h5>
              {methodBreakdown.length === 0 ? (
                <p className="text-muted mb-0">{t('adm_no_orders_match')}</p>
              ) : methodBreakdown.map(m => {
                const pct = netSales > 0 ? Math.round((m.total / netSales) * 100) : 0;
                return (
                  <div key={m.method} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <strong style={{ fontSize: '0.9rem' }}>{m.method}</strong>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>{m.count} • ₹{formatINR(m.total)} ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: '#aa1a31' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly trend */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="mb-3 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                <i className="bi bi-bar-chart-fill text-danger me-2"></i> {t('adm_monthly_trend')}
              </h5>
              {monthlyTrend.length === 0 ? (
                <p className="text-muted mb-0">{t('adm_no_orders_match')}</p>
              ) : (
                <div className="d-flex align-items-end gap-2" style={{ minHeight: '140px' }}>
                  {monthlyTrend.slice(0, 8).reverse().map(m => {
                    const h = Math.max(8, Math.round((m.total / maxMonthlyTotal) * 120));
                    return (
                      <div key={m.key} className="text-center flex-fill" title={`${m.label}: ₹${formatINR(m.total)} (${m.orders})`}>
                        <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>₹{formatINR(m.total)}</small>
                        <div className="rounded-top mx-auto" style={{ width: '100%', maxWidth: '36px', height: `${h}px`, backgroundColor: '#aa1a31', opacity: 0.85 }}></div>
                        <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>{m.label.split(' ')[0]}</small>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product-wise sales */}
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
          <h5 className="mb-4 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
            <i className="bi bi-trophy-fill text-danger me-2"></i> {t('adm_product_sales_breakdown')}
          </h5>
          {productSales.length === 0 ? (
            <div className="text-center py-4 text-muted">{t('adm_no_orders_match')}</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                    <th>#</th>
                    <th>{t('adm_th_product')}</th>
                    <th>{t('adm_units_sold')}</th>
                    <th>{t('adm_th_revenue')}</th>
                    <th style={{ width: '30%' }}>{t('adm_th_share')}</th>
                  </tr>
                </thead>
                <tbody>
                  {productSales.map((p, idx) => {
                    const share = netSales > 0 ? Math.round((p.revenue / Math.max(grossSales, 1)) * 100) : 0;
                    return (
                      <tr key={p.name}>
                        <td className="text-muted">{idx + 1}</td>
                        <td className="fw-semibold text-dark">{p.name}</td>
                        <td>{p.qty}</td>
                        <td className="fw-bold">₹{formatINR(p.revenue)}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '8px' }}>
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${Math.max(4, Math.round((p.revenue / maxProductRevenue) * 100))}%`,
                                  backgroundColor: idx === 0 ? '#FFB300' : '#aa1a31'
                                }}
                              ></div>
                            </div>
                            <small className="text-muted" style={{ minWidth: '36px' }}>{share}%</small>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Filtered Orders Table */}
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="mb-4 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
            <i className="bi bi-list-check text-danger me-2"></i> {t('adm_filtered_orders_report')} ({filteredOrders.length})
          </h5>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-5 text-muted">{t('adm_no_orders_match')}</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                    <th>{t('adm_th_order_id')}</th>
                    <th>{t('adm_th_date')}</th>
                    <th>{t('adm_th_customer')}</th>
                    <th>{t('adm_th_method')}</th>
                    <th>{t('adm_th_total')}</th>
                    <th>{t('adm_th_status')}</th>
                    <th className="text-end">{t('adm_invoice')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(ord => (
                    <tr key={ord.id}>
                      <td className="fw-semibold text-dark">{ord.id}</td>
                      <td style={{ fontSize: '0.85rem' }}>{getOrderDate(ord) || t('adm_na')}</td>
                      <td>
                        <strong className="text-dark d-block">{ord.shippingAddress?.name || ord.customerName}</strong>
                        <small className="text-muted">{ord.customerEmail}</small>
                      </td>
                      <td><span className="badge bg-light text-dark border">{ord.paymentMethod}</span></td>
                      <td className="fw-bold">₹{formatINR(ord.total)}</td>
                      <td>{statusBadge(ord.status)}</td>
                      <td className="text-end">
                        <Link
                          to={`/invoice/${ord.id}`}
                          className="btn btn-sm text-white fw-bold"
                          style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}
                        >
                          {t('adm_invoice')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default AdminSalesReport;
