import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const AdminCustomers = () => {
  const { user, users, orders } = useAuth();
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

  // Filter customers
  const customers = users.filter(u => u.role === 'customer');

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
            <p className="text-secondary mb-0">Total Registered Customers: <strong>{customers.length}</strong> profiles</p>
          </div>
          <Link to={RoutePaths.admin} className="btn btn-outline-dark fw-bold">Back to Dashboard</Link>
        </div>

        {/* Customers Table */}
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          {customers.length === 0 ? (
            <p className="text-muted text-center py-5">No customer accounts registered yet.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {customers.map(cust => {
                    const metrics = getCustomerMetrics(cust.id);
                    return (
                      <tr key={cust.id}>
                        <td>{cust.id}</td>
                        <td><strong className="text-dark">{cust.name}</strong></td>
                        <td>{cust.email}</td>
                        <td>{cust.phone || <span className="text-muted">—</span>}</td>
                        <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                          {cust.address ? `${cust.address}, ${cust.city} - ${cust.zip}` : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center fw-bold">{metrics.orderCount}</td>
                        <td className="text-end fw-bold text-success">₹{metrics.totalSpent.toFixed(0)}</td>
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
    </div>
  );
};

export default AdminCustomers;
