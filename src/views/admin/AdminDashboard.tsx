import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
    deleteReview, securityLogs, toggleUserStatus, loadData
  } = useAuth();
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'shipping' | 'discounts' | 'reviews' | 'logs' | 'tickets' | 'security' | 'settings'>('overview');
  const isSuperAdmin = user?.role === 'admin' && user?.email !== 'admin@ramasala.com';

  // Payment Settings States
  const [adminMerchantUpi, setAdminMerchantUpi] = useState('ramasala@upi');
  const [adminMerchantName, setAdminMerchantName] = useState('RA Masala');
  const [adminGatewayKeyId, setAdminGatewayKeyId] = useState('');
  const [adminGatewayKeySecret, setAdminGatewayKeySecret] = useState('');

  // Maintenance state
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Inventory / production report filter states
  const [logSearch, setLogSearch] = useState('');
  const [logType, setLogType] = useState<'All' | 'sale' | 'restock' | 'correction'>('All');
  const [logFrom, setLogFrom] = useState('');
  const [logTo, setLogTo] = useState('');
  const [restockProductId, setRestockProductId] = useState('');
  const [restockQty, setRestockQty] = useState(1);
  const [showRestockForm, setShowRestockForm] = useState(false);

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
        title: t(res.data.isMaintenanceMode ? 'adm_maintenance_activated' : 'adm_maintenance_deactivated'),
        text: t(res.data.isMaintenanceMode ? 'adm_maintenance_status_set' : 'adm_live_status_set'),
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire(t('adm_error'), t('adm_maintenance_toggle_failed'), 'error');
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
      Swal.fire(t('adm_success'), t('adm_payment_config_saved'), 'success');
    } catch (err) {
      console.error(err);
      Swal.fire(t('adm_error'), t('adm_config_save_failed'), 'error');
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
    const logList = filteredLogs.map((l: any) => ({
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

  const resetLogFilters = () => {
    setLogSearch('');
    setLogType('All');
    setLogFrom('');
    setLogTo('');
  };

  const logDateStr = (l: { createdAt?: string }) =>
    l.createdAt ? l.createdAt.split('T')[0] : '';

  // Filtered inventory logs for production / sales reports
  const filteredLogs = useMemo(() => {
    return inventoryLogs.filter(log => {
      const matchesSearch = !logSearch ||
        (log.productName || '').toLowerCase().includes(logSearch.toLowerCase());
      const matchesType = logType === 'All' || log.changeType === logType;
      const d = logDateStr(log);
      const matchesFrom = !logFrom || (d && d >= logFrom);
      const matchesTo = !logTo || (d && d <= logTo);
      return matchesSearch && matchesType && matchesFrom && matchesTo;
    }).sort((a, b) => {
      const da = a.createdAt || '';
      const db = b.createdAt || '';
      return db.localeCompare(da);
    });
  }, [inventoryLogs, logSearch, logType, logFrom, logTo]);

  // Production inward (restock) report from filtered logs
  const inwardLogs = filteredLogs.filter(l => l.changeType === 'restock' && l.quantityChanged > 0);
  const saleLogs = filteredLogs.filter(l => l.changeType === 'sale');
  const correctionLogs = filteredLogs.filter(l => l.changeType === 'correction');

  const totalInwardUnits = inwardLogs.reduce((s, l) => s + l.quantityChanged, 0);
  const totalSoldUnits = saleLogs.reduce((s, l) => s + Math.abs(l.quantityChanged), 0);
  const totalCorrectionUnits = correctionLogs.reduce((s, l) => s + l.quantityChanged, 0);
  const productsInwarded = new Set(inwardLogs.map(l => l.productName)).size;

  // Which month got the most stock inward
  const monthlyInward = useMemo(() => {
    const map: { [key: string]: { label: string; units: number; entries: number } } = {};
    inwardLogs.forEach(l => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = {
          label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
          units: 0,
          entries: 0
        };
      }
      map[key].units += l.quantityChanged;
      map[key].entries += 1;
    });
    return Object.keys(map).sort().reverse().map(k => ({ key: k, ...map[k] }));
  }, [inwardLogs]);

  const topInwardMonth = monthlyInward.length > 0
    ? monthlyInward.reduce((a, b) => (b.units > a.units ? b : a))
    : null;
  const maxMonthlyInward = monthlyInward.length > 0
    ? Math.max(...monthlyInward.map(m => m.units), 1)
    : 1;

  // Product-wise inward summary (filtered)
  const productInwardSummary = useMemo(() => {
    const map: { [name: string]: { qty: number; entries: number; lastIn: string; productId: string } } = {};
    inwardLogs.forEach(l => {
      const name = l.productName || 'Unknown';
      if (!map[name]) {
        map[name] = { qty: 0, entries: 0, lastIn: l.createdAt || '', productId: l.productId };
      }
      map[name].qty += l.quantityChanged;
      map[name].entries += 1;
      if ((l.createdAt || '') > map[name].lastIn) map[name].lastIn = l.createdAt || '';
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty);
  }, [inwardLogs]);

  // Sales overview from filtered sale logs + matching product prices
  const salesOverview = useMemo(() => {
    const productPriceMap: { [id: string]: number } = {};
    products.forEach(p => {
      productPriceMap[String(p._id || p.id)] = p.price;
      if (p.name) productPriceMap[p.name] = p.price;
    });

    const byProduct: { [name: string]: { qty: number; value: number } } = {};
    saleLogs.forEach(l => {
      const name = l.productName || 'Unknown';
      const qty = Math.abs(l.quantityChanged);
      const price = productPriceMap[l.productId] ?? productPriceMap[name] ?? 0;
      if (!byProduct[name]) byProduct[name] = { qty: 0, value: 0 };
      byProduct[name].qty += qty;
      byProduct[name].value += qty * price;
    });

    const monthly: { [key: string]: { label: string; units: number; value: number } } = {};
    saleLogs.forEach(l => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) {
        monthly[key] = {
          label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
          units: 0,
          value: 0
        };
      }
      const qty = Math.abs(l.quantityChanged);
      const price = productPriceMap[l.productId] ?? productPriceMap[l.productName] ?? 0;
      monthly[key].units += qty;
      monthly[key].value += qty * price;
    });

    const productList = Object.entries(byProduct)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value || b.qty - a.qty);

    const monthlyList = Object.keys(monthly).sort().reverse().map(k => ({ key: k, ...monthly[k] }));

    return {
      productSales: productList,
      monthlySales: monthlyList,
      saleValue: productList.reduce((s, p) => s + p.value, 0)
    };
  }, [saleLogs, products]);

  const maxProductInward = productInwardSummary.length > 0
    ? Math.max(...productInwardSummary.map(p => p.qty), 1)
    : 1;
  const maxSaleValue = salesOverview.productSales.length > 0
    ? Math.max(...salesOverview.productSales.map(p => p.value), 1)
    : 1;

  const toDateInput = (d: Date) => d.toISOString().split('T')[0];

  const applyLogQuickRange = (range: 'today' | 'week' | 'month' | 'all') => {
    const now = new Date();
    if (range === 'all') {
      setLogFrom('');
      setLogTo('');
      return;
    }
    if (range === 'today') {
      setLogFrom(toDateInput(now));
      setLogTo(toDateInput(now));
      return;
    }
    if (range === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      setLogFrom(toDateInput(start));
      setLogTo(toDateInput(now));
      return;
    }
    setLogFrom(toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
    setLogTo(toDateInput(now));
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductId || restockQty <= 0) {
      Swal.fire(t('adm_error'), t('adm_fill_valid_details'), 'error');
      return;
    }
    try {
      await axios.post('/api/inventory-logs/restock', {
        productId: restockProductId,
        quantity: restockQty
      });
      await loadData();
      Swal.fire(t('adm_success'), t('adm_restock_success'), 'success');
      setRestockProductId('');
      setRestockQty(1);
      setShowRestockForm(false);
    } catch (err: any) {
      Swal.fire(
        t('adm_error'),
        err?.response?.data?.message || err?.message || 'Failed to inward stock',
        'error'
      );
    }
  };

  const handleImportCSV = () => {
    const importTypeEl = document.getElementById('importType') as HTMLSelectElement;
    const fileInputEl = document.getElementById('importFile') as HTMLInputElement;
    const importType = importTypeEl?.value || 'products';
    const file = fileInputEl?.files?.[0];

    if (!file) {
      Swal.fire(t('adm_error'), t('adm_csv_select_file_first'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;

        const rows = text.split('\n').map(row => {
          // Splitting columns while preserving commas inside double quotes
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          return matches.map(val => val.replace(/^"|"$/g, '').trim());
        }).filter(row => row.length > 0);

        if (rows.length < 2) {
          Swal.fire(t('adm_error'), t('adm_csv_no_data'), 'error');
          return;
        }

        const headers = rows[0].map(h => h.toLowerCase().trim());
        const dataRows = rows.slice(1);

        Swal.fire({
          title: t('adm_importing_data'),
          text: t('adm_uploading_records_wait'),
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        let successCount = 0;
        let failCount = 0;

        for (const row of dataRows) {
          if (row.length === 0 || row.join('').trim() === '') continue;

          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = row[index] || '';
          });

          try {
            if (importType === 'products') {
              const name = record.name || '';
              const price = parseFloat(record.price) || 0;
              const category = record.category || 'Masale';
              const stock = parseInt(record.stock) || 0;
              const unit = record.unit || '250g';
              const description = record.description || '';

              let brand = 'masale';
              const catLower = category.toLowerCase().trim();
              if (catLower === 'namkeen') brand = 'namkeen';
              else if (catLower === 'spice home' || catLower === 'spicehome') brand = 'spicehome';
              else if (catLower === 'chaha' || catLower === 'tea' || catLower === 'tea/chaha') brand = 'chaha';
              else if (catLower === 'agro') brand = 'agro';

              if (name && price > 0) {
                await axios.post('/api/products', {
                  name,
                  price,
                  category,
                  stock,
                  unit,
                  description,
                  image: '/images/ra_waa.png',
                  brand
                });
                successCount++;
              } else {
                failCount++;
              }
            } else if (importType === 'customers') {
              const name = record.name || '';
              const email = record.email || '';
              const password = record.password || 'user123';

              if (name && email) {
                await axios.post('/api/users/signup', { name, email, password });
                successCount++;
              } else {
                failCount++;
              }
            }
          } catch (err) {
            console.error(err);
            failCount++;
          }
        }

        await loadData();
        Swal.fire({
          icon: 'success',
          title: t('adm_import_completed'),
          text: `${t('adm_import_success_label')} ${successCount} ${t('adm_records_imported')}. ${t('adm_import_failed_label')} ${failCount} ${t('adm_records_failed')}.`,
        });
        if (fileInputEl) fileInputEl.value = '';
      } catch (err) {
        console.error(err);
        Swal.fire(t('adm_error'), t('adm_csv_read_error'), 'error');
      }
    };
    reader.readAsText(file);
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
        title: t('adm_access_denied'),
        text: t('adm_no_admin_privileges'),
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
      title: t('adm_ticket_resolved'),
      text: t('adm_ticket_resolved_message'),
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || couponValue <= 0) {
      Swal.fire(t('adm_error'), t('adm_coupon_invalid_details'), 'error');
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
    Swal.fire(t('adm_success'), t('adm_coupon_created'), 'success');
  };

  const handleSaveShipping = async (id: string) => {
    await updateShipping(id, shipCarrier, shipTracking, shipStatus);
    setEditingShipId(null);
    Swal.fire(t('adm_success'), t('adm_shipping_updated'), 'success');
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
              <i className="bi bi-shield-fill-check text-danger me-2"></i> {t('adm_panel_title')}
            </h2>
            <p className="text-secondary mb-0">{t('adm_panel_subtitle')}</p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-sm-0">
            <Link to={RoutePaths.adminProducts} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>{t('adm_manage_products')}</Link>
            <Link to={RoutePaths.adminCustomers} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>{t('adm_manage_customers')}</Link>
            <Link to={RoutePaths.adminSalesReport} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>{t('adm_sales_report_title')}</Link>
            <Link to={RoutePaths.adminSendOffers} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>{t('adm_send_offers')}</Link>
            <Link to={RoutePaths.userAccount} className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#aa1a31', border: '1px solid #FFB300' }}>{t('adm_my_account')}</Link>
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
              <i className="bi bi-speedometer2 me-1"></i> {t('adm_tab_overview')}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'payments' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'payments' ? '#aa1a31' : 'transparent', color: activeTab === 'payments' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('payments')}
            >
              <i className="bi bi-credit-card me-1"></i> {t('adm_tab_payments')} ({payments.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'shipping' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'shipping' ? '#aa1a31' : 'transparent', color: activeTab === 'shipping' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('shipping')}
            >
              <i className="bi bi-truck me-1"></i> {t('adm_tab_shipping')} ({shippingList.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'discounts' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'discounts' ? '#aa1a31' : 'transparent', color: activeTab === 'discounts' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('discounts')}
            >
              <i className="bi bi-tag me-1"></i> {t('adm_tab_coupons')} ({discounts.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'reviews' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'reviews' ? '#aa1a31' : 'transparent', color: activeTab === 'reviews' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('reviews')}
            >
              <i className="bi bi-star me-1"></i> {t('adm_tab_reviews')} ({reviews.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'logs' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'logs' ? '#aa1a31' : 'transparent', color: activeTab === 'logs' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('logs')}
            >
              <i className="bi bi-journal-text me-1"></i> {t('adm_tab_inventory_logs')} ({inventoryLogs.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold px-3 py-2 ${activeTab === 'tickets' ? 'active' : ''}`}
              style={{ backgroundColor: activeTab === 'tickets' ? '#aa1a31' : 'transparent', color: activeTab === 'tickets' ? '#fff' : '#4A1525' }}
              onClick={() => setActiveTab('tickets')}
            >
              <i className="bi bi-headset me-1"></i> {t('adm_tab_support_tickets')} ({tickets.length})
            </button>
          </li>
          {isSuperAdmin && (
            <li className="nav-item">
              <button 
                className={`nav-link fw-bold px-3 py-2 ${activeTab === 'settings' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'settings' ? '#aa1a31' : 'transparent', color: activeTab === 'settings' ? '#fff' : '#4A1525' }}
                onClick={() => setActiveTab('settings')}
              >
                <i className="bi bi-wallet2 me-1"></i> {t('adm_tab_payment_settings')}
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
                <i className="bi bi-shield-lock-fill me-1"></i> {t('adm_tab_security_logs')} ({securityLogs.length})
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
                      <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>{t('adm_stat_total_sales')}</h6>
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
                      <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>{t('adm_stat_total_orders')}</h6>
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
                      <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>{t('adm_stat_registered_users')}</h6>
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
                      <h6 className="text-uppercase text-secondary fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>{t('adm_stat_open_tickets')}</h6>
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
                  <i className="bi bi-gear-fill me-2 text-danger"></i> {t('adm_super_admin_ops')}
                </h5>
                <div className="row g-4 align-items-start">
                  {/* Maintenance Mode Toggle */}
                  <div className="col-lg-4 border-end pb-3">
                    <div className="d-flex align-items-center justify-content-between pe-lg-3">
                      <div>
                        <strong className="d-block text-dark">{t('adm_site_maintenance_mode')}</strong>
                        <span className="text-muted small">{t('adm_maintenance_desc')}</span>
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
                  <div className="col-lg-4 border-end pb-3 px-lg-3">
                    <strong className="d-block text-dark mb-2">{t('adm_export_system_databases')}</strong>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportCustomers}>
                        <i className="bi bi-people-fill me-1"></i> {t('adm_export_customers_list')}
                      </button>
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportProducts}>
                        <i className="bi bi-box-seam-fill me-1"></i> {t('adm_export_products_catalog')}
                      </button>
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportOrders}>
                        <i className="bi bi-receipt me-1"></i> {t('adm_export_orders_history')}
                      </button>
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportPayments}>
                        <i className="bi bi-credit-card me-1"></i> {t('adm_export_payments_list')}
                      </button>
                      <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={handleExportInventoryLogs}>
                        <i className="bi bi-journal-text me-1"></i> {t('adm_export_inventory_logs')}
                      </button>
                    </div>
                  </div>

                  {/* CSV Data Import */}
                  <div className="col-lg-4 pb-3 ps-lg-3">
                    <strong className="d-block text-dark mb-2">{t('adm_import_system_databases')}</strong>
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex gap-2">
                        <select className="form-select form-select-sm" id="importType" defaultValue="products" style={{ border: '1px solid #FFB300', backgroundColor: '#FFF', maxWidth: '120px' }}>
                          <option value="products">{t('adm_option_products')}</option>
                          <option value="customers">{t('adm_option_customers')}</option>
                        </select>
                        <input 
                          type="file" 
                          id="importFile"
                          accept=".csv"
                          className="form-control form-control-sm"
                          style={{ border: '1px solid #FFD700' }}
                        />
                      </div>
                      <button 
                        className="btn btn-sm text-white fw-bold w-100" 
                        style={{ backgroundColor: '#4A1525', border: '1.5px solid #FFB300' }}
                        onClick={handleImportCSV}
                      >
                        <i className="bi bi-file-earmark-arrow-up-fill me-1"></i> {t('adm_upload_import_csv')}
                      </button>
                      <small className="text-secondary" style={{ fontSize: '0.72rem', lineHeight: '1.3' }}>
                        <strong>{t('adm_products_csv_label')}</strong> name, price, category, stock, unit, description<br />
                        <strong>{t('adm_customers_csv_label')}</strong> name, email, password
                      </small>
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
                    <i className="bi bi-bar-chart-fill me-2 text-danger"></i> {t('adm_sales_best_sellers_report')}
                  </h5>
                  
                  {bestSellers.length === 0 ? (
                    <div className="text-center py-5 text-muted">{t('adm_no_sales_reports')}</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {bestSellers.map((item) => {
                        const maxQty = Math.max(...bestSellers.map(s => s.qty));
                        const pct = maxQty > 0 ? Math.min(100, Math.max(15, (item.qty / maxQty) * 100)) : 15;
                        return (
                          <div key={item.name}>
                            <div className="d-flex justify-content-between mb-1 text-sm">
                              <span className="fw-semibold text-dark">{item.name}</span>
                              <span className="fw-bold text-secondary">{item.qty} {t('adm_units_sold')}</span>
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
                    <i className="bi bi-headset me-2 text-danger"></i> {t('adm_customer_queries_tickets')}
                  </h5>
                  
                  <div className="d-flex flex-column gap-3 overflow-y-auto" style={{ maxHeight: '350px' }}>
                    {tickets.length === 0 ? (
                      <p className="text-muted text-center py-5">{t('adm_no_customer_queries')}</p>
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
                              {t('adm_mark_resolved')}
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
                <i className="bi bi-clock-history me-2 text-danger"></i> {t('adm_order_status_control')}
              </h5>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                      <th>{t('adm_th_order_id')}</th>
                      <th>{t('adm_th_customer')}</th>
                      <th>{t('adm_th_date')}</th>
                      <th>{t('adm_th_total')}</th>
                      <th>{t('adm_th_status')}</th>
                      <th>{t('adm_th_actions')}</th>
                      <th className="text-end">{t('adm_invoice')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(ord => (
                      <tr key={ord.id}>
                        <td className="fw-semibold text-dark">{ord.id}</td>
                        <td>
                          <strong className="text-dark d-block">{ord.shippingAddress?.name || ord.customerName}</strong>
                          <small className="text-muted">{ord.shippingAddress?.phone || t('adm_na')}</small>
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
                                title: t('adm_status_updated'),
                                text: `${t('adm_order_status_set_to')} ${e.target.value}`,
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
                            {t('adm_invoice')}
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
              <i className="bi bi-credit-card me-2 text-danger"></i> {t('adm_transaction_payment_logs')}
            </h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary">
                    <th>{t('adm_th_order_id')}</th>
                    <th>{t('adm_th_amount')}</th>
                    <th>{t('adm_th_method')}</th>
                    <th>{t('adm_th_transaction_id')}</th>
                    <th>{t('adm_th_status')}</th>
                    <th>{t('adm_th_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay._id}>
                      <td className="fw-semibold">{pay.orderId}</td>
                      <td>₹{pay.amount}</td>
                      <td><span className="badge bg-light text-dark border">{pay.method}</span></td>
                      <td><code>{pay.transactionId || t('adm_cod_none')}</code></td>
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
                              Swal.fire(t('adm_success'), t('adm_payment_status_updated'), 'success');
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
              <i className="bi bi-truck me-2 text-danger"></i> {t('adm_shipping_delivery_status')}
            </h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary">
                    <th>{t('adm_th_order_id')}</th>
                    <th>{t('adm_th_carrier')}</th>
                    <th>{t('adm_th_tracking_number')}</th>
                    <th>{t('adm_th_status')}</th>
                    <th>{t('adm_th_action')}</th>
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
                          ship.trackingNumber || <em className="text-muted">{t('adm_not_assigned')}</em>
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
                              {t('adm_save')}
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingShipId(null)}>
                              {t('adm_cancel')}
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
                            {t('adm_update')}
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
                <h5 className="mb-4 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>{t('adm_create_coupon')}</h5>
                <form onSubmit={handleCreateCoupon}>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">{t('adm_coupon_code')}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={t('adm_coupon_code_placeholder')} 
                      value={couponCode} 
                      onChange={(e) => setCouponCode(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">{t('adm_discount_type')}</label>
                    <select 
                      className="form-select" 
                      value={discountType} 
                      onChange={(e) => setDiscountType(e.target.value as any)}
                    >
                      <option value="percentage">{t('adm_percentage')}</option>
                      <option value="flat">{t('adm_flat_rate')}</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">{t('adm_discount_value')}</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={couponValue} 
                      onChange={(e) => setCouponValue(Number(e.target.value))} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">{t('adm_min_purchase_limit')}</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={minPurchase} 
                      onChange={(e) => setMinPurchase(Number(e.target.value))} 
                    />
                  </div>
                  <button type="submit" className="btn text-white w-100 fw-bold" style={{ backgroundColor: '#aa1a31' }}>
                    {t('adm_generate_coupon')}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="mb-4 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>{t('adm_active_coupons')}</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="table-light text-secondary">
                        <th>{t('adm_th_code')}</th>
                        <th>{t('adm_th_type')}</th>
                        <th>{t('adm_th_value')}</th>
                        <th>{t('adm_th_min_purchase')}</th>
                        <th>{t('adm_th_status')}</th>
                        <th className="text-end">{t('adm_th_actions')}</th>
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
                              {disc.active ? t('adm_status_active') : t('adm_status_inactive')}
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
              <i className="bi bi-star me-2 text-danger"></i> {t('adm_product_reviews_moderation')}
            </h5>
            <div className="row g-3">
              {reviews.length === 0 ? (
                <div className="text-center text-muted py-5 col-12">{t('adm_no_customer_reviews')}</div>
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
                        {t('adm_review_by')} <strong>{rev.customerName}</strong> ({rev.customerEmail})
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
          <>
            {/* Production / Inventory Report Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                <i className="bi bi-box-seam me-2 text-danger"></i> {t('adm_production_reports')}
              </h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm text-white fw-bold"
                  style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}
                  onClick={() => setShowRestockForm(v => !v)}
                >
                  <i className="bi bi-plus-circle me-1"></i> {t('adm_inward_stock')}
                </button>
                <button
                  className="btn btn-sm text-white fw-bold"
                  style={{ backgroundColor: '#aa1a31', border: '1px solid #FFB300' }}
                  onClick={handleExportInventoryLogs}
                >
                  <i className="bi bi-download me-1"></i> {t('adm_export_inventory_logs')}
                </button>
              </div>
            </div>

            {/* Manual production inward form */}
            {showRestockForm && (
              <form onSubmit={handleRestock} className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4 border-start border-5 border-success">
                <div className="row g-2 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label text-muted fw-semibold">{t('adm_th_product')}</label>
                    <select
                      className="form-select bg-light"
                      required
                      value={restockProductId}
                      onChange={(e) => setRestockProductId(e.target.value)}
                    >
                      <option value="">{t('adm_select_product')}</option>
                      {products.map(p => (
                        <option key={p._id || p.id} value={String(p._id || p.id)}>
                          {p.name} ({t('adm_th_stock')}: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted fw-semibold">{t('adm_restock_qty')}</label>
                    <input
                      type="number"
                      className="form-control bg-light"
                      min={1}
                      required
                      value={restockQty}
                      onChange={(e) => setRestockQty(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-md-4 d-flex gap-2">
                    <button type="submit" className="btn text-white fw-bold px-4" style={{ backgroundColor: '#aa1a31' }}>
                      {t('adm_save')}
                    </button>
                    <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setShowRestockForm(false)}>
                      {t('adm_cancel')}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Inventory log filters */}
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold">{t('adm_filter_product')}</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    placeholder={t('adm_search_products_placeholder')}
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">{t('adm_th_change_type')}</label>
                  <select className="form-select bg-light" value={logType} onChange={(e) => setLogType(e.target.value as any)}>
                    <option value="All">{t('adm_all_types')}</option>
                    <option value="restock">{t('adm_type_inward')}</option>
                    <option value="sale">{t('adm_type_sale')}</option>
                    <option value="correction">{t('adm_type_correction')}</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">{t('adm_filter_from_date')}</label>
                  <input type="date" className="form-control bg-light" value={logFrom} onChange={(e) => setLogFrom(e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">{t('adm_filter_to_date')}</label>
                  <input type="date" className="form-control bg-light" value={logTo} onChange={(e) => setLogTo(e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">{t('adm_quick_range')}</label>
                  <select
                    className="form-select bg-light"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) applyLogQuickRange(e.target.value as any);
                    }}
                  >
                    <option value="">{t('adm_select')}</option>
                    <option value="today">{t('adm_quick_today')}</option>
                    <option value="week">{t('adm_quick_week')}</option>
                    <option value="month">{t('adm_quick_month')}</option>
                    <option value="all">{t('adm_quick_all')}</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <button className="btn btn-outline-secondary w-100" onClick={resetLogFilters} title={t('adm_reset_filters')}>
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Production summary cards */}
            <div className="row g-3 mb-4">
              <div className="col-xl-3 col-sm-6">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
                  <small className="text-uppercase text-secondary fw-semibold" style={{ fontSize: '0.75rem' }}>{t('adm_total_inward_units')}</small>
                  <h4 className="mb-0 fw-bold text-success">{totalInwardUnits}</h4>
                  <small className="text-muted">{inwardLogs.length} {t('adm_entries')} • {productsInwarded} {t('adm_products_label')}</small>
                </div>
              </div>
              <div className="col-xl-3 col-sm-6">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-danger">
                  <small className="text-uppercase text-secondary fw-semibold" style={{ fontSize: '0.75rem' }}>{t('adm_total_sold_units')}</small>
                  <h4 className="mb-0 fw-bold text-danger">{totalSoldUnits}</h4>
                  <small className="text-muted">{saleLogs.length} {t('adm_sale_entries')}</small>
                </div>
              </div>
              <div className="col-xl-3 col-sm-6">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-warning">
                  <small className="text-uppercase text-secondary fw-semibold" style={{ fontSize: '0.75rem' }}>{t('adm_est_sale_value')}</small>
                  <h4 className="mb-0 fw-bold" style={{ color: '#E65100' }}>
                    ₹{salesOverview.saleValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </h4>
                  <small className="text-muted">{salesOverview.productSales.length} {t('adm_products_label')}</small>
                </div>
              </div>
              <div className="col-xl-3 col-sm-6">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
                  <small className="text-uppercase text-secondary fw-semibold" style={{ fontSize: '0.75rem' }}>{t('adm_top_inward_month')}</small>
                  <h5 className="mb-0 fw-bold text-primary">{topInwardMonth ? topInwardMonth.label : t('adm_na')}</h5>
                  <small className="text-muted">
                    {topInwardMonth ? `${topInwardMonth.units} ${t('adm_units_in')}` : '—'}
                  </small>
                </div>
              </div>
            </div>

            {/* Monthly inward + sales overview charts */}
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <h6 className="mb-3 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                    <i className="bi bi-bar-chart-fill text-success me-2"></i> {t('adm_monthly_inward_title')}
                  </h6>
                  {monthlyInward.length === 0 ? (
                    <p className="text-muted mb-0">{t('adm_no_inventory_match')}</p>
                  ) : (
                    <div className="d-flex align-items-end gap-2 overflow-auto" style={{ minHeight: '140px' }}>
                      {monthlyInward.slice(0, 12).reverse().map(m => {
                        const h = Math.max(8, Math.round((m.units / maxMonthlyInward) * 110));
                        const isTop = topInwardMonth && m.key === topInwardMonth.key;
                        return (
                          <div key={m.key} className="text-center flex-fill" style={{ minWidth: '48px' }}
                            title={`${m.label}: ${m.units} ${t('adm_units_in')} (${m.entries})`}>
                            <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>{m.units}</small>
                            <div className="rounded-top mx-auto" style={{
                              width: '70%',
                              height: `${h}px`,
                              backgroundColor: isTop ? '#FFB300' : '#2E7D32',
                              opacity: isTop ? 1 : 0.8
                            }}></div>
                            <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>
                              {m.label.split(' ')[0]}
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <h6 className="mb-3 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                    <i className="bi bi-graph-up text-danger me-2"></i> {t('adm_sales_overview_title')}
                  </h6>
                  {salesOverview.monthlySales.length === 0 ? (
                    <p className="text-muted mb-0">{t('adm_no_inventory_match')}</p>
                  ) : (
                    <div className="d-flex align-items-end gap-2 overflow-auto" style={{ minHeight: '140px' }}>
                      {salesOverview.monthlySales.slice(0, 12).reverse().map(m => {
                        const maxV = Math.max(...salesOverview.monthlySales.map(x => x.value), 1);
                        const h = Math.max(8, Math.round((m.value / maxV) * 110));
                        return (
                          <div key={m.key} className="text-center flex-fill" style={{ minWidth: '48px' }}
                            title={`${m.label}: ${m.units} units • ₹${m.value.toLocaleString('en-IN')}`}>
                            <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>
                              ₹{m.value.toLocaleString('en-IN')}
                            </small>
                            <div className="rounded-top mx-auto" style={{
                              width: '70%',
                              height: `${h}px`,
                              backgroundColor: '#aa1a31',
                              opacity: 0.85
                            }}></div>
                            <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>
                              {m.label.split(' ')[0]}
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product-wise inward + product sales side by side */}
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <h6 className="mb-3 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                    <i className="bi bi-truck text-success me-2"></i> {t('adm_product_inward_report')}
                  </h6>
                  {productInwardSummary.length === 0 ? (
                    <p className="text-muted mb-0">{t('adm_no_inventory_match')}</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr className="table-light text-secondary" style={{ fontSize: '0.8rem' }}>
                            <th>{t('adm_th_product')}</th>
                            <th>{t('adm_units_in')}</th>
                            <th>{t('adm_th_entries')}</th>
                            <th>{t('adm_last_inward')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productInwardSummary.map(p => (
                            <tr key={p.name}>
                              <td>
                                <strong className="text-dark d-block">{p.name}</strong>
                                <div className="progress mt-1" style={{ height: '6px', maxWidth: '140px' }}>
                                  <div className="progress-bar bg-success" style={{ width: `${Math.max(6, Math.round((p.qty / maxProductInward) * 100))}%` }}></div>
                                </div>
                              </td>
                              <td className="fw-bold text-success">{p.qty}</td>
                              <td>{p.entries}</td>
                              <td style={{ fontSize: '0.8rem' }}>
                                {p.lastIn ? new Date(p.lastIn).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <h6 className="mb-3 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                    <i className="bi bi-currency-rupee text-danger me-2"></i> {t('adm_product_sales_overview')}
                  </h6>
                  {salesOverview.productSales.length === 0 ? (
                    <p className="text-muted mb-0">{t('adm_no_inventory_match')}</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr className="table-light text-secondary" style={{ fontSize: '0.8rem' }}>
                            <th>{t('adm_th_product')}</th>
                            <th>{t('adm_units_sold')}</th>
                            <th>{t('adm_th_revenue')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesOverview.productSales.map(p => (
                            <tr key={p.name}>
                              <td>
                                <strong className="text-dark d-block">{p.name}</strong>
                                <div className="progress mt-1" style={{ height: '6px', maxWidth: '140px' }}>
                                  <div className="progress-bar" style={{
                                    width: `${Math.max(6, Math.round((p.value / maxSaleValue) * 100))}%`,
                                    backgroundColor: '#aa1a31'
                                  }}></div>
                                </div>
                              </td>
                              <td className="fw-bold">{p.qty}</td>
                              <td className="fw-bold text-danger">₹{p.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filtered inventory transaction log table */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                  <i className="bi bi-journal-text me-2 text-danger"></i> {t('adm_inventory_transaction_logs')}
                  <span className="text-muted fw-normal fs-6">({filteredLogs.length})</span>
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr className="table-light text-secondary">
                      <th>{t('adm_th_product')}</th>
                      <th>{t('adm_th_change_type')}</th>
                      <th>{t('adm_th_quantity_changed')}</th>
                      <th>{t('adm_th_new_stock_level')}</th>
                      <th>{t('adm_th_timestamp')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">{t('adm_no_inventory_match')}</td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log._id}>
                          <td><strong>{log.productName}</strong></td>
                          <td>
                            <span className={`badge ${
                              log.changeType === 'sale' ? 'bg-danger' : log.changeType === 'restock' ? 'bg-success' : 'bg-primary'
                            }`}>
                              {log.changeType === 'restock'
                                ? t('adm_type_inward').toUpperCase()
                                : log.changeType === 'sale'
                                  ? t('adm_type_sale').toUpperCase()
                                  : log.changeType.toUpperCase()}
                            </span>
                          </td>
                          <td className={log.quantityChanged < 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                            {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                          </td>
                          <td className="fw-semibold">{log.newStock} {t('adm_units')}</td>
                          <td style={{ fontSize: '0.85rem' }}>{new Date(log.createdAt || '').toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tickets Handling & Report Tab */}
        {activeTab === 'tickets' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-headset me-2 text-danger"></i> {t('adm_support_tickets_reports')}
            </h5>

            {/* Ticket Report Stats */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border text-center">
                  <h6 className="text-muted small text-uppercase fw-semibold mb-1">{t('adm_stat_total_queries')}</h6>
                  <h3 className="fw-bold mb-0 text-dark">{tickets.length}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border text-center border-start border-danger border-3">
                  <h6 className="text-muted small text-uppercase fw-semibold mb-1">{t('adm_stat_pending_open')}</h6>
                  <h3 className="fw-bold mb-0 text-danger">{tickets.filter(t => t.status === 'Open').length}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border text-center border-start border-success border-3">
                  <h6 className="text-muted small text-uppercase fw-semibold mb-1">{t('adm_stat_resolved')}</h6>
                  <h3 className="fw-bold mb-0 text-success">{tickets.filter(t => t.status === 'Resolved').length}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border text-center">
                  <h6 className="text-muted small text-uppercase fw-semibold mb-1">{t('adm_stat_resolution_rate')}</h6>
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
                    <th>{t('adm_th_customer_details')}</th>
                    <th>{t('adm_th_query_message')}</th>
                    <th>{t('adm_th_received_date')}</th>
                    <th>{t('adm_th_status')}</th>
                    <th>{t('adm_th_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">{t('adm_no_support_tickets')}</td>
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
                              {t('adm_mark_resolved')}
                            </button>
                          ) : (
                            <span className="text-muted small"><i className="bi bi-check-circle-fill text-success me-1"></i> {t('adm_completed')}</span>
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
              <i className="bi bi-wallet2 me-2 text-danger"></i> {t('adm_payment_gateway_settings')}
            </h5>
            <form onSubmit={handleSavePaymentSettings}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">{t('adm_merchant_upi_vpa')}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={adminMerchantUpi} 
                  onChange={(e) => setAdminMerchantUpi(e.target.value)} 
                  placeholder={t('adm_upi_placeholder')} 
                  required
                />
                <small className="text-muted">{t('adm_upi_help')}</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">{t('adm_merchant_name')}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={adminMerchantName} 
                  onChange={(e) => setAdminMerchantName(e.target.value)} 
                  placeholder={t('adm_merchant_name_placeholder')} 
                  required
                />
                <small className="text-muted">{t('adm_merchant_name_help')}</small>
              </div>

              <hr className="my-4 text-muted" />

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">{t('adm_razorpay_key_id')}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={adminGatewayKeyId} 
                  onChange={(e) => setAdminGatewayKeyId(e.target.value)} 
                  placeholder={t('adm_razorpay_key_id_placeholder')} 
                />
                <small className="text-muted">{t('adm_razorpay_key_id_help')}</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">{t('adm_razorpay_key_secret')}</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={adminGatewayKeySecret} 
                  onChange={(e) => setAdminGatewayKeySecret(e.target.value)} 
                  placeholder={t('adm_razorpay_secret_placeholder')} 
                />
                <small className="text-muted">{t('adm_razorpay_secret_help')}</small>
              </div>

              <button type="submit" className="btn text-white fw-bold px-4 py-2 mt-3" style={{ backgroundColor: '#4A1525' }}>
                {t('adm_save_settings')}
              </button>
            </form>
          </div>
        )}

        {isSuperAdmin && activeTab === 'security' && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-start fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              <i className="bi bi-shield-lock-fill me-2 text-danger"></i> {t('adm_security_logs_title')}
            </h5>
            
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary">
                    <th>{t('adm_th_timestamp')}</th>
                    <th>{t('adm_th_action_taken_by')}</th>
                    <th>{t('adm_th_action')}</th>
                    <th>{t('adm_th_target_user')}</th>
                    <th>{t('adm_th_log_details')}</th>
                    <th className="text-end">{t('adm_th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">{t('adm_no_security_logs')}</td>
                    </tr>
                  ) : (
                    securityLogs.map(log => (
                      <tr key={log._id}>
                        <td style={{ fontSize: '0.85rem' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : t('adm_na')}
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
                                      title: t('adm_reactivate_admin_q'),
                                      text: `${t('adm_reactivate_confirm')} ${log.targetName}?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#198754',
                                      cancelButtonColor: '#secondary',
                                      confirmButtonText: t('adm_yes_reactivate')
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        toggleUserStatus(targetUserObj.id || targetUserObj._id || '', true);
                                        Swal.fire(t('adm_activated'), `${t('adm_user')} ${log.targetName} ${t('adm_is_now_active')}`, 'success');
                                      }
                                    });
                                  }}
                                >
                                  {t('adm_activate')}
                                </button>
                              );
                            } else if (targetUserObj) {
                              return (
                                <span className="text-muted small">
                                  <i className="bi bi-check-circle-fill text-success me-1"></i> {t('adm_status_active')}
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
