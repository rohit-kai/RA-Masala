import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please fill in all fields.',
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    const res = login(email, password);
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Welcome Back!',
        text: res.message,
        timer: 1500,
        showConfirmButton: false
      });
      // Redirect based on role
      if (email.toLowerCase() === 'admin@ramasala.com') {
        navigate(RoutePaths.admin);
      } else {
        navigate(RoutePaths.home);
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: res.message,
        confirmButtonColor: '#aa1a31'
      });
    }
  };

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '450px', width: '100%', overflow: 'hidden' }}>
          <div className="py-4 text-center text-white position-relative" style={{ background: 'linear-gradient(135deg, #800c1e 0%, #aa1a31 100%)' }}>
            <h3 className="mb-1" style={{ fontFamily: 'serif', fontWeight: 'bold' }}>RA Masala</h3>
            <p className="mb-0 text-white-50" style={{ fontSize: '0.9rem' }}>Pure taste, Rich Heritage since 1972</p>
          </div>
          <div className="card-body p-4 p-md-5">
            <h4 className="text-center mb-4" style={{ color: '#4A1525', fontFamily: 'serif', fontWeight: 'bold' }}>Sign In</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">Email Address</label>
                <input 
                  type="email" 
                  className="form-control border-2 rounded-3" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-secondary fw-semibold">Password</label>
                <input 
                  type="password" 
                  className="form-control border-2 rounded-3" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn w-100 py-2.5 text-white fw-bold border-0 rounded-3 shadow-sm transition-all"
                style={{ background: '#aa1a31', transition: '0.3s' }}
              >
                Sign In
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                Don't have an account? <Link to={RoutePaths.signup} style={{ color: '#aa1a31', fontWeight: 'bold', textDecoration: 'none' }}>Sign Up</Link>
              </p>
            </div>

            <div className="mt-4 p-3 rounded-3 bg-light border border-warning" style={{ fontSize: '0.82rem' }}>
              <strong className="text-warning-dark">Quick Access:</strong>
              <div className="mt-1"><strong>Customer:</strong> <code>ramesh@gmail.com</code> (any password)</div>
              <div><strong>Admin:</strong> <code>admin@ramasala.com</code> / password: <code>admin123</code></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
