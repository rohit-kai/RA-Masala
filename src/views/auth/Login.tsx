import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const Login = ({ isMaintenanceMode = false }: { isMaintenanceMode?: boolean }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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

    const res = await login(email, password);
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
    <div style={{
      backgroundImage: "linear-gradient(rgba(253, 246, 237, 0.85), rgba(253, 246, 237, 0.85)), url('/images/sp2.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <div className="container py-5 flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '450px', width: '100%', overflow: 'hidden' }}>
          <div className="py-4 text-center text-white position-relative" style={{ background: 'linear-gradient(135deg, #800c1e 0%, #aa1a31 100%)' }}>
            <h3 className="mb-1" style={{ fontFamily: 'serif', fontWeight: 'bold' }}>RA Masala</h3>
            <p className="mb-0 text-white-50" style={{ fontSize: '0.9rem' }}>Pure taste, Rich Heritage since 1972</p>
          </div>
          <div className="card-body p-4 p-md-5">
            {isMaintenanceMode && (
              <div className="alert alert-warning border border-warning rounded-3 mb-4 text-center fw-semibold" style={{ fontSize: '0.88rem', backgroundColor: '#FFF3CD', color: '#664D03' }}>
                <i className="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
                Note: There is issue in login pls try after some time
              </div>
            )}
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

            <div className="mt-4 text-center login-card-links">
              <p className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                Don't have an account? <Link to={RoutePaths.signup}>Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <style>{`
        .login-card-links a {
          color: #aa1a31 !important;
          font-weight: bold;
          text-decoration: none !important;
        }
        .login-card-links a:hover {
          color: #8c1224 !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
};

export default Login;
