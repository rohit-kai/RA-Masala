import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, User } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  address?: string;
  city?: string;
  zip?: string;
}

const AdminCustomers = () => {
  const { user, users, orders, toggleUserStatus, addCustomer, updateCustomer, deleteCustomer } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const formRef = useRef<HTMLDivElement | null>(null);

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
  }, [user, navigate, t]);

  // Filter customers
  const customers = users.filter(u => u.role === 'customer');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');

  // Form & Modal States
  const [isAdding, setIsAdding] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Input States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Validation States
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Extract unique cities from customers
  const cities = Array.from(new Set(customers.map(c => c.city).filter(Boolean)));

  // Filtered List
  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = 
      (cust.name && cust.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (cust.email && cust.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
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

  // Field validation logic
  const validateField = (field: string, val: string): string => {
    switch (field) {
      case 'name':
        if (!val.trim()) return 'Customer full name is required.';
        if (val.trim().length < 2) return 'Full name must be at least 2 characters.';
        return '';

      case 'email':
        if (!val.trim()) return 'Customer email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
          return 'Please enter a valid email format (e.g., rahul@example.com).';
        }
        // Duplicate check (ignoring current editing customer)
        const isDuplicate = customers.some(c => 
          c.email.toLowerCase() === val.trim().toLowerCase() && 
          (!editingCustomer || (c.id !== editingCustomer.id && c._id !== editingCustomer.id && c._id !== editingCustomer._id))
        );
        if (isDuplicate) {
          return 'This email address is already registered to another customer.';
        }
        return '';

      case 'phone':
        if (!val.trim()) return 'Phone number is required.';
        const cleanPhone = val.replace(/[\s-]/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
          return 'Enter a valid 10-digit Indian phone number (starting with 6-9).';
        }
        return '';

      case 'password':
        if (isAdding) {
          if (val && val.length < 6) return 'Password must be at least 6 characters.';
        } else {
          if (val && val.length < 6) return 'New password must be at least 6 characters.';
        }
        return '';

      case 'address':
        if (!val.trim()) return 'Delivery street address is required.';
        if (val.trim().length < 5) return 'Address should be at least 5 characters.';
        return '';

      case 'city':
        if (!val.trim()) return 'City / Region is required.';
        return '';

      case 'zip':
        if (!val.trim()) return 'Postal / PIN code is required.';
        if (!/^\d{6}$/.test(val.trim())) {
          return 'Enter a valid 6-digit PIN code (e.g. 411001).';
        }
        return '';

      default:
        return '';
    }
  };

  // Run full form validation
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    const eName = validateField('name', name);
    const eEmail = validateField('email', email);
    const ePhone = validateField('phone', phone);
    const ePass = validateField('password', password);
    const eAddr = validateField('address', address);
    const eCity = validateField('city', city);
    const eZip = validateField('zip', zip);

    if (eName) newErrors.name = eName;
    if (eEmail) newErrors.email = eEmail;
    if (ePhone) newErrors.phone = ePhone;
    if (ePass) newErrors.password = ePass;
    if (eAddr) newErrors.address = eAddr;
    if (eCity) newErrors.city = eCity;
    if (eZip) newErrors.zip = eZip;

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      address: true,
      city: true,
      zip: true
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'name': setName(value); break;
      case 'email': setEmail(value); break;
      case 'phone': setPhone(value); break;
      case 'password': setPassword(value); break;
      case 'address': setAddress(value); break;
      case 'city': setCity(value); break;
      case 'zip': setZip(value); break;
    }

    if (touched[field]) {
      const err = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: err || undefined
      }));
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: err || undefined
    }));
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setAddress('');
    setCity('');
    setZip('');
    setIsActive(true);
    setErrors({});
    setTouched({});
    setIsAdding(false);
    setEditingCustomer(null);
    setShowPassword(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEditInit = (cust: User) => {
    resetForm();
    setEditingCustomer(cust);
    setName(cust.name || '');
    setEmail(cust.email || '');
    setPhone(cust.phone || '');
    setPassword(''); // Leave empty unless modifying
    setAddress(cust.address || '');
    setCity(cust.city || '');
    setZip(cust.zip || '');
    setIsActive(cust.isActive !== false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Required',
        text: 'Please correct the highlighted input fields before submitting.',
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAdding) {
        await addCustomer({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password.trim() || 'user123',
          address: address.trim(),
          city: city.trim(),
          zip: zip.trim(),
          isActive
        });
        Swal.fire({
          icon: 'success',
          title: t('adm_customer_added') || 'Customer Added!',
          text: `Customer account for ${name} has been created successfully.`,
          confirmButtonColor: '#4A1525'
        });
      } else if (editingCustomer) {
        const custId = editingCustomer.id || editingCustomer._id || '';
        await updateCustomer({
          id: custId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password.trim() ? password.trim() : undefined,
          address: address.trim(),
          city: city.trim(),
          zip: zip.trim(),
          isActive
        });
        Swal.fire({
          icon: 'success',
          title: t('adm_customer_updated') || 'Customer Updated!',
          text: `Customer profile for ${name} has been updated successfully.`,
          confirmButtonColor: '#4A1525'
        });
      }
      resetForm();
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err?.response?.data?.message || err?.message || 'Could not save customer details.',
        confirmButtonColor: '#aa1a31'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = (cust: User) => {
    const custId = cust.id || cust._id || '';
    Swal.fire({
      title: t('adm_are_you_sure'),
      text: `Are you sure you want to permanently delete the customer profile for "${cust.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#aa1a31',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete customer'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCustomer(custId);
          Swal.fire({
            icon: 'success',
            title: t('adm_customer_deleted') || 'Customer Deleted!',
            text: `Customer ${cust.name} has been removed from the directory.`,
            confirmButtonColor: '#4A1525'
          });
        } catch (error: any) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error?.response?.data?.message || error?.message || 'Failed to delete customer',
            confirmButtonColor: '#aa1a31'
          });
        }
      }
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
              {t('adm_customer_directory')}
            </h2>
            <p className="text-secondary mb-0">
              {t('adm_total_registered_customers')} <strong>{customers.length}</strong> {t('adm_profiles')} • {t('adm_filtered')} <strong>{filteredCustomers.length}</strong>
            </p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-sm-0 align-items-center">
            <button 
              className="btn text-white fw-bold d-flex align-items-center shadow-sm px-3 py-2" 
              style={{ backgroundColor: '#aa1a31', borderRadius: '8px' }}
              onClick={handleOpenAdd}
            >
              <i className="bi bi-person-plus-fill me-2 fs-5"></i> {t('adm_add_customer') || 'Add Customer'}
            </button>
            <Link to={RoutePaths.admin} className="btn btn-sm text-white fw-bold d-flex align-items-center px-3 py-2" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300', borderRadius: '8px' }}>
              <i className="bi bi-arrow-left me-1"></i> {t('adm_back_to_dashboard')}
            </Link>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-5" style={{ borderLeftColor: '#4A1525' }}>
              <div className="d-flex align-items-center">
                <div className="p-3 bg-light rounded-circle me-3" style={{ color: '#4A1525' }}>
                  <i className="bi bi-people-fill fs-3" style={{ color: '#4A1525' }}></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small fw-bold">{t('adm_total_customers_stat')}</h6>
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
                  <h6 className="text-muted mb-1 small fw-bold">{t('adm_active_accounts')}</h6>
                  <h3 className="mb-0 fw-bold text-success">{customers.filter(c => c.isActive !== false).length}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-5 border-warning" style={{ borderLeftColor: '#FFB300' }}>
              <div className="d-flex align-items-center">
                <div className="p-3 bg-light rounded-circle me-3" style={{ color: '#FFB300' }}>
                  <i className="bi bi-currency-rupee fs-3" style={{ color: '#FFB300' }}></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small fw-bold">{t('adm_total_lifetime_value')}</h6>
                  <h3 className="mb-0 fw-bold" style={{ color: '#D2691E' }}>₹{customers.reduce((sum, c) => sum + getCustomerMetrics(c.id).totalSpent, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add or Edit Customer Form Container */}
        {(isAdding || editingCustomer) && (
          <div 
            ref={formRef} 
            className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 border-top border-4 animate__animated animate__fadeIn"
            style={{ borderTopColor: '#aa1a31' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h4 className="mb-1 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
                  <i className={`bi ${isAdding ? 'bi-person-plus-fill' : 'bi-pencil-square'} me-2`} style={{ color: '#aa1a31' }}></i>
                  {isAdding ? (t('adm_add_new_customer') || 'Add New Customer Profile') : `${t('adm_edit_customer') || 'Edit Customer'}: ${editingCustomer?.name}`}
                </h4>
                <p className="text-muted small mb-0">
                  Enter customer information and delivery location details. All fields marked with (<span className="text-danger fw-bold">*</span>) are required.
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
                onClick={resetForm}
                title="Close Form"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                {/* Full Name */}
                <div className="col-md-6">
                  <label className="form-label text-secondary fw-semibold small mb-1">
                    Customer Full Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-person-fill"></i>
                    </span>
                    <input 
                      type="text" 
                      className={`form-control border-start-0 ${touched.name ? (errors.name ? 'is-invalid border-danger' : 'is-valid border-success') : ''}`}
                      placeholder="e.g. Rahul Patil" 
                      value={name} 
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={(e) => handleFieldBlur('name', e.target.value)}
                      required 
                    />
                  </div>
                  {touched.name && errors.name && (
                    <div className="text-danger small mt-1 animate__animated animate__fadeIn">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>{errors.name}
                    </div>
                  )}
                  {touched.name && !errors.name && (
                    <div className="text-success small mt-1">
                      <i className="bi bi-check-circle-fill me-1"></i>Looks good!
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div className="col-md-6">
                  <label className="form-label text-secondary fw-semibold small mb-1">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-envelope-at-fill"></i>
                    </span>
                    <input 
                      type="email" 
                      className={`form-control border-start-0 ${touched.email ? (errors.email ? 'is-invalid border-danger' : 'is-valid border-success') : ''}`}
                      placeholder="e.g. rahul.patil@gmail.com" 
                      value={email} 
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={(e) => handleFieldBlur('email', e.target.value)}
                      required 
                    />
                  </div>
                  {touched.email && errors.email && (
                    <div className="text-danger small mt-1 animate__animated animate__fadeIn">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>{errors.email}
                    </div>
                  )}
                  {touched.email && !errors.email && (
                    <div className="text-success small mt-1">
                      <i className="bi bi-check-circle-fill me-1"></i>Valid email address
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="col-md-4">
                  <label className="form-label text-secondary fw-semibold small mb-1">
                    Phone Number (10 digits) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-telephone-fill"></i>
                    </span>
                    <input 
                      type="tel" 
                      maxLength={10}
                      className={`form-control border-start-0 ${touched.phone ? (errors.phone ? 'is-invalid border-danger' : 'is-valid border-success') : ''}`}
                      placeholder="e.g. 9822012345" 
                      value={phone} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleFieldChange('phone', val);
                      }}
                      onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                      required 
                    />
                  </div>
                  {touched.phone && errors.phone && (
                    <div className="text-danger small mt-1 animate__animated animate__fadeIn">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>{errors.phone}
                    </div>
                  )}
                  {touched.phone && !errors.phone && (
                    <div className="text-success small mt-1">
                      <i className="bi bi-check-circle-fill me-1"></i>Valid phone number
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="col-md-4">
                  <label className="form-label text-secondary fw-semibold small mb-1">
                    {isAdding ? 'Password' : 'New Password (Optional)'} 
                    {isAdding && <span className="text-muted small ms-1">(Default: user123)</span>}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-key-fill"></i>
                    </span>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className={`form-control border-start-0 border-end-0 ${touched.password && errors.password ? 'is-invalid border-danger' : ''}`}
                      placeholder={isAdding ? 'Min 6 characters (or blank for user123)' : 'Leave empty to keep current password'} 
                      value={password} 
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={(e) => handleFieldBlur('password', e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn btn-light border border-start-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <div className="text-danger small mt-1 animate__animated animate__fadeIn">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>{errors.password}
                    </div>
                  )}
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                    {isAdding ? 'Default password is set to "user123" if left blank.' : 'Only enter a new password if you want to reset it.'}
                  </small>
                </div>

                {/* Account Status */}
                <div className="col-md-4">
                  <label className="form-label text-secondary fw-semibold small mb-1">
                    Account Status
                  </label>
                  <select 
                    className="form-select"
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                  >
                    <option value="true">Active (Can log in & order)</option>
                    <option value="false">Deactivated (Locked out)</option>
                  </select>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                    Active customers can browse and place orders on the site.
                  </small>
                </div>

                {/* Street Address */}
                <div className="col-md-6">
                  <label className="form-label text-secondary fw-semibold small mb-1">
                    Delivery Street Address <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-geo-alt-fill"></i>
                    </span>
                    <input 
                      type="text" 
                      className={`form-control border-start-0 ${touched.address ? (errors.address ? 'is-invalid border-danger' : 'is-valid border-success') : ''}`}
                      placeholder="e.g. Flat 302, Sai Heritage, Shivaji Nagar" 
                      value={address} 
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      onBlur={(e) => handleFieldBlur('address', e.target.value)}
                      required 
                    />
                  </div>
                  {touched.address && errors.address && (
                    <div className="text-danger small mt-1 animate__animated animate__fadeIn">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>{errors.address}
                    </div>
                  )}
                </div>

                {/* City */}
                <div className="col-md-3">
                  <label className="form-label text-secondary fw-semibold small mb-1">
                    City / Town <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-building"></i>
                    </span>
                    <input 
                      type="text" 
                      list="citySuggestions"
                      className={`form-control border-start-0 ${touched.city ? (errors.city ? 'is-invalid border-danger' : 'is-valid border-success') : ''}`}
                      placeholder="e.g. Pune" 
                      value={city} 
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      onBlur={(e) => handleFieldBlur('city', e.target.value)}
                      required 
                    />
                    <datalist id="citySuggestions">
                      <option value="Pune" />
                      <option value="Mumbai" />
                      <option value="Kolhapur" />
                      <option value="Nagpur" />
                      <option value="Nashik" />
                      <option value="Aurangabad" />
                      <option value="Sangli" />
                      <option value="Satara" />
                      <option value="Solapur" />
                    </datalist>
                  </div>
                  {touched.city && errors.city && (
                    <div className="text-danger small mt-1 animate__animated animate__fadeIn">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>{errors.city}
                    </div>
                  )}
                </div>

                {/* Postal / PIN code */}
                <div className="col-md-3">
                  <label className="form-label text-secondary fw-semibold small mb-1">
                    Postal / PIN Code (6 digits) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-pin-map-fill"></i>
                    </span>
                    <input 
                      type="text" 
                      maxLength={6}
                      className={`form-control border-start-0 ${touched.zip ? (errors.zip ? 'is-invalid border-danger' : 'is-valid border-success') : ''}`}
                      placeholder="e.g. 411001" 
                      value={zip} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        handleFieldChange('zip', val);
                      }}
                      onBlur={(e) => handleFieldBlur('zip', e.target.value)}
                      required 
                    />
                  </div>
                  {touched.zip && errors.zip && (
                    <div className="text-danger small mt-1 animate__animated animate__fadeIn">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>{errors.zip}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary px-4 fw-semibold"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  <i className="bi bi-x-circle me-1"></i> Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn text-white px-4 fw-bold shadow-sm"
                  style={{ backgroundColor: '#aa1a31' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving Customer...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill me-1"></i>
                      {isAdding ? 'Save & Register Customer' : 'Update Customer Profile'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-search"></i></span>
                <input 
                  type="text" 
                  className="form-control bg-light border-start-0" 
                  placeholder={t('adm_search_customers_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select bg-light" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                <option value="All">{t('adm_all_cities_regions')}</option>
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
            <div className="text-center py-5">
              <i className="bi bi-people text-muted fs-1 mb-2 d-block"></i>
              <p className="text-muted mb-3">{t('adm_no_customers_match') || 'No customers match your search.'}</p>
              <button className="btn btn-sm text-white fw-bold" style={{ backgroundColor: '#aa1a31' }} onClick={handleOpenAdd}>
                <i className="bi bi-person-plus-fill me-1"></i> Add New Customer
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                    <th>{t('adm_th_id')}</th>
                    <th>{t('adm_th_customer_name')}</th>
                    <th>{t('adm_th_email_address')}</th>
                    <th>{t('adm_th_phone')}</th>
                    <th>{t('adm_th_delivery_location')}</th>
                    <th className="text-center">{t('adm_th_orders_placed')}</th>
                    <th className="text-end">{t('adm_th_total_lifetime_value')}</th>
                    <th className="text-center">{t('adm_th_status')}</th>
                    <th className="text-end">{t('adm_th_actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(cust => {
                    const custId = cust.id || cust._id || '';
                    const metrics = getCustomerMetrics(custId);
                    const isCustActive = cust.isActive !== false;
                    return (
                      <tr key={custId} className="customer-tr">
                        <td style={{ fontSize: '0.8rem', color: '#888' }}>
                          {custId.length > 8 ? `${custId.slice(0, 8)}…` : custId}
                        </td>
                        <td>
                          <strong className="text-dark d-block">{cust.name}</strong>
                        </td>
                        <td>
                          <span className="text-muted small">{cust.email}</span>
                        </td>
                        <td>
                          {cust.phone ? (
                            <span className="fw-semibold text-dark">{cust.phone}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', maxWidth: '220px' }}>
                          {cust.address ? (
                            <span>{cust.address}, {cust.city || ''} {cust.zip ? `- ${cust.zip}` : ''}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-center fw-bold">
                          <span className="badge bg-light text-dark border">
                            {metrics.orderCount}
                          </span>
                        </td>
                        <td className="text-end fw-bold text-success">
                          ₹{metrics.totalSpent.toFixed(0)}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${isCustActive ? 'bg-success' : 'bg-danger'}`}>
                            {isCustActive ? t('adm_status_active') : t('adm_status_deactivated')}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm" role="group">
                            {/* Edit Button */}
                            <button
                              className="btn btn-outline-primary"
                              title="Edit Customer Profile"
                              onClick={() => handleEditInit(cust)}
                            >
                              <i className="bi bi-pencil-square me-1"></i> Edit
                            </button>

                            {/* Toggle Active Status */}
                            <button
                              className={`btn ${isCustActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              title={isCustActive ? 'Deactivate Customer' : 'Activate Customer'}
                              onClick={() => {
                                Swal.fire({
                                  title: `${t(isCustActive ? 'adm_deactivate' : 'adm_activate')} ${t('adm_customer_label')}?`,
                                  text: `${t('adm_are_you_sure_you_want_to')} ${t(isCustActive ? 'adm_deactivate_verb' : 'adm_activate_verb')} ${cust.name}?`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: isCustActive ? '#aa1a31' : '#198754',
                                  cancelButtonColor: '#6c757d',
                                  confirmButtonText: `${t('adm_yes')} ${t(isCustActive ? 'adm_deactivate_verb' : 'adm_activate_verb')}!`
                                }).then((result) => {
                                  if (result.isConfirmed) {
                                    toggleUserStatus(custId, !isCustActive);
                                    Swal.fire(
                                      t(isCustActive ? 'adm_deactivated' : 'adm_activated'),
                                      `${t('adm_customer_label')} ${cust.name} ${t(isCustActive ? 'adm_has_been_deactivated' : 'adm_has_been_activated')}.`,
                                      'success'
                                    );
                                  }
                                });
                              }}
                            >
                              <i className={`bi ${isCustActive ? 'bi-person-slash' : 'bi-person-check'}`}></i>
                            </button>

                            {/* Delete Customer */}
                            <button
                              className="btn btn-outline-danger"
                              title="Delete Customer Account"
                              onClick={() => handleDeleteCustomer(cust)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
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
      `}</style>
    </div>
  );
};

export default AdminCustomers;
