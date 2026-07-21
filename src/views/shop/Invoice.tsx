import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import { getAssetPath } from '../../Utils/imageHelper';

const Invoice = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Find order
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <h3 className="text-danger">Invoice Not Found</h3>
          <p>We couldn't locate the order details for ID: {orderId}</p>
          <Link to={RoutePaths.home} className="btn text-white" style={{ backgroundColor: '#aa1a31' }}>
            Go Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate SGST and CGST (2.5% each)
  const cgst = order.tax / 2;
  const sgst = order.tax / 2;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1 d-flex flex-column align-items-center">
        
        {/* Print controls bar */}
        <div className="d-flex justify-content-between align-items-center w-100 max-width-invoice mb-4 print-hide" style={{ maxWidth: '800px' }}>
          <Link to={RoutePaths.home} className="btn btn-sm text-white fw-bold d-flex align-items-center" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>
            <i className="bi bi-arrow-left me-2"></i> Return to Shopping
          </Link>
          <button className="btn text-white fw-bold d-flex align-items-center gap-2" style={{ backgroundColor: '#aa1a31' }} onClick={handlePrint}>
            <i className="bi bi-printer-fill"></i> Print E-Invoice
          </button>
        </div>

        {/* Invoice Card */}
        <div 
          ref={invoiceRef}
          className="card border-0 shadow rounded-4 p-4 p-md-5 bg-white w-100 print-invoice" 
          style={{ maxWidth: '800px', borderTop: '8px solid #aa1a31' }}
        >
          {/* Header */}
          <div className="row mb-4 align-items-center">
            <div className="col-sm-6 mb-3 mb-sm-0">
              <div className="d-flex align-items-center gap-3 mb-2">
                <img src={getAssetPath('images/ra_waa.png')} alt="RA Masala Logo" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                <div>
                  <h3 className="fw-bold mb-0" style={{ color: '#4A1525', fontFamily: 'serif' }}>RA MASALA</h3>
                  <span className="text-muted d-block" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PURE & AUTHENTIC INDIAN SPICES</span>
                </div>
              </div>
              <small className="text-secondary d-block" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                RA Masala Private Limited<br />
                Gat No. 45, Devde Industrial Area, Pune Road<br />
                Maharashtra, India - 411048<br />
                GSTIN: 27AABCR4587M1ZX | PAN: AABCR4587M
              </small>
            </div>
            <div className="col-sm-6 text-sm-end">
              <h3 className="fw-bold text-uppercase text-secondary tracking-widest mb-2" style={{ letterSpacing: '2px' }}>TAX INVOICE</h3>
              <div className="text-sm-end">
                <span className="d-block text-secondary"><strong>Invoice No:</strong> INV-{order.id.split('-')[1]}</span>
                <span className="d-block text-secondary"><strong>Date:</strong> {new Date(order.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                <span className="d-block text-secondary"><strong>Order ID:</strong> {order.id}</span>
                <span className="d-block text-secondary"><strong>Payment Method:</strong> {order.paymentMethod}</span>
              </div>
            </div>
          </div>

          <hr />

          {/* Billing / Shipping */}
          <div className="row my-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <h6 className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Billed & Shipped To:</h6>
              <h5 className="fw-bold mb-1 text-dark">{order.shippingAddress.name}</h5>
              <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city} - {order.shippingAddress.zip}<br />
                <strong>Phone:</strong> {order.shippingAddress.phone}<br />
                <strong>Email:</strong> {order.customerEmail}
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <span className="badge px-3 py-2 fs-7" style={{ 
                backgroundColor: order.status === 'Shipped' ? '#E8F5E9' : order.status === 'Processing' ? '#FFF3E0' : '#E3F2FD',
                color: order.status === 'Shipped' ? '#2E7D32' : order.status === 'Processing' ? '#E65100' : '#1565C0',
                border: '1px solid'
              }}>
                Order Status: {order.status}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive mb-4">
            <table className="table align-middle">
              <thead>
                <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                  <th>Sr.</th>
                  <th>Product Description</th>
                  <th className="text-center">Rate</th>
                  <th className="text-center">Qty</th>
                  <th className="text-end">Taxable Value</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong className="text-dark">{item.name}</strong>
                      <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>HSN Code: 0910 (Spices)</span>
                    </td>
                    <td className="text-center">₹{item.price}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end fw-semibold text-dark">₹{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakdown */}
          <div className="row g-4 justify-content-between mt-2">
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 text-secondary" style={{ fontSize: '0.82rem' }}>
                <strong className="text-dark d-block mb-1">Declaration:</strong>
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Spices are charged under 5% GST (CGST 2.5% & SGST 2.5%).
              </div>
            </div>
            <div className="col-md-5">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary">Subtotal:</span>
                <span className="text-dark fw-semibold">₹{order.subtotal}</span>
              </div>
              {order.subtotal > (order.total - order.tax - order.shipping) && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount:</span>
                  <span>-₹{(order.subtotal - (order.total - order.tax - order.shipping)).toFixed(1)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-1 text-xs text-muted">
                <span>CGST (2.5%):</span>
                <span>₹{cgst.toFixed(1)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-xs text-muted">
                <span>SGST (2.5%):</span>
                <span>₹{sgst.toFixed(1)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary">Shipping Fee:</span>
                <span>{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center mb-3">
                <strong className="text-dark fs-5">Grand Total:</strong>
                <strong className="fs-4" style={{ color: '#aa1a31' }}>₹{order.total.toFixed(1)}</strong>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="row mt-5 pt-4 text-center">
            <div className="col-6">
              <div className="border-bottom mx-auto" style={{ width: '150px', height: '40px' }}></div>
              <small className="text-secondary d-block mt-2">Customer Signature</small>
            </div>
            <div className="col-6">
              <div className="mx-auto text-center" style={{ width: '150px', height: '40px', fontFamily: 'cursive', color: '#800c1e', fontWeight: 'bold' }}>
                RA Masala Ltd.
              </div>
              <small className="text-secondary d-block mt-2">Authorized Signatory</small>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Styled styles for Printing */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm 15mm 10mm 15mm !important;
          }
          body, html {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100%;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hide, .header, .footer, footer, div.header {
            display: none !important;
          }
          .print-invoice {
            box-shadow: none !important;
            border: 0 !important;
            border-top: 5px solid #aa1a31 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #fff !important;
          }
          /* Adjust layout to fit on a single A4 page */
          .card {
            border: none !important;
          }
          .row {
            margin-bottom: 0.3rem !important;
            margin-top: 0.3rem !important;
          }
          .mb-5 {
            margin-bottom: 0.8rem !important;
          }
          .my-4 {
            margin-top: 0.3rem !important;
            margin-bottom: 0.3rem !important;
          }
          .mt-5 {
            margin-top: 1rem !important;
          }
          hr {
            margin: 0.4rem 0 !important;
          }
          .table-responsive {
            margin-bottom: 0.3rem !important;
          }
          table {
            font-size: 0.8rem !important;
          }
          td, th {
            padding: 3px 6px !important;
          }
          .p-3 {
            padding: 6px !important;
          }
          .fs-4 {
            font-size: 1.15rem !important;
          }
          .fs-5 {
            font-size: 0.95rem !important;
          }
          .border-bottom {
            height: 25px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
