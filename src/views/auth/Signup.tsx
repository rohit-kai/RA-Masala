import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please fill in all fields.',
        confirmButtonColor: '#aa1a31'
      });
      return;
    }

    const res = signup(name, email, password);
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: res.message,
        timer: 1500,
        showConfirmButton: false
      });
      navigate(RoutePaths.home);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Signup Failed',
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
            <p className="mb-0 text-white-50" style={{ fontSize: '0.9rem' }}>Join us in tasting authentic heritage spices</p>
          </div>
          <div className="card-body p-4 p-md-5">
            <h4 className="text-center mb-4" style={{ color: '#4A1525', fontFamily: 'serif', fontWeight: 'bold' }}>Create Account</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">Full Name</label>
                <input 
                  type="text" 
                  className="form-control border-2 rounded-3" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ borderColor: '#EAEAEA' }}
                />
              </div>
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
                className="btn w-100 py-2.5 text-white fw-bold border-0 rounded-3 shadow-sm"
                style={{ background: '#aa1a31' }}
              >
                Sign Up
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                Already have an account? <Link to={RoutePaths.login} style={{ color: '#aa1a31', fontWeight: 'bold', textDecoration: 'none' }}>Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
