import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import Swal from 'sweetalert2';
import { getAssetPath } from '../../Utils/imageHelper';

const Shop = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { products } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'priceAsc' | 'priceDesc'>('name');

  // Static list to ensure all five brand categories are always visible for filtration
  const categories = ['All', 'Masale', 'Namkeen', 'Spice Home', 'Chaha', 'Agro'];

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <Header />
      <main 
        className="shop-page py-5"
        style={{
          backgroundImage: `url(${getAssetPath('images/sp2.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        {/* Dark overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(42, 6, 15, 0.7) 0%, rgba(20, 2, 6, 0.9) 100%)',
          zIndex: 1
        }}></div>

        <div className="container position-relative" style={{ zIndex: 2 }}>
          {/* Header Title with traditional motif */}
          <div className="text-center mb-5 text-white">
            <div className="mandala-title-icon mb-3" style={{
              width: '50px',
              height: '50px',
              margin: '0 auto',
              backgroundImage: `url(${getAssetPath('images/ra_waa.png')})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'drop-shadow(0 0 8px #FFD700)'
            }}></div>
            <h1 className="display-4 fw-bold" style={{ fontFamily: 'serif', color: '#FFD700' }}>
              Explore Our Spices Collection
            </h1>
            <p className="lead text-light opacity-75">
              Discover authentic, rich, and aromatic Indian spices handpicked for your kitchen.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="row g-3 mb-5 p-4 rounded-4 shadow-lg text-white align-items-center" style={{
            background: 'rgba(74, 21, 37, 0.35)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Search Input */}
            <div className="col-md-4">
              <label className="form-label text-warning fw-semibold">Search Spices</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-light">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control bg-dark bg-opacity-50 text-white border-secondary"
                  placeholder="e.g. Garam Masala..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Category Select tabs */}
            <div className="col-md-5">
              <label className="form-label text-warning fw-semibold">Category</label>
              <div className="d-flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`btn btn-sm px-3 py-2 fw-semibold ${selectedCategory === cat ? 'active-cat-btn' : 'inactive-cat-btn'}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      borderRadius: '30px',
                      transition: 'all 0.2s',
                      border: '1.5px solid #FFD700'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div className="col-md-3">
              <label className="form-label text-warning fw-semibold">Sort By</label>
              <select 
                className="form-select bg-dark bg-opacity-50 text-white border-secondary"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="name">Alphabetical (A-Z)</option>
                <option value="priceAsc">Price (Low to High)</option>
                <option value="priceDesc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center text-white p-5 rounded-4 bg-dark bg-opacity-20 border border-secondary">
              <i className="bi bi-emoji-frown display-3 text-warning mb-3 d-block"></i>
              <h3>No Spices Found</h3>
              <p className="text-light opacity-50">Try broadening your search or choosing another category.</p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredProducts.map((product) => (
                <div key={product.id || product._id} className="col-md-6 col-lg-4">
                  <div className="premium-product-card h-100 d-flex flex-column" style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'all 0.3s'
                  }}>
                    {/* Image container */}
                    <div className="position-relative overflow-hidden" style={{ height: '220px', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <img 
                        src={getAssetPath(product.image)} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '15px' }}
                      />
                      <span 
                        className="position-absolute top-0 start-0 m-3 px-2 py-1 rounded fw-semibold text-uppercase text-white"
                        style={{ backgroundColor: '#aa1a31', fontSize: '0.75rem' }}
                      >
                        {product.category}
                      </span>
                      <button 
                        className="btn position-absolute top-0 end-0 m-3 rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center border-0"
                        style={{ width: '32px', height: '32px', zIndex: 10 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const pId = product._id || product.id;
                          if (isInWishlist(pId)) {
                            removeFromWishlist(pId);
                          } else {
                            addToWishlist(product);
                          }
                        }}
                      >
                        <i className={`bi ${isInWishlist(product._id || product.id) ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'}`} style={{ fontSize: '1.1rem', marginTop: '2px' }}></i>
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 d-flex flex-column flex-grow-1 text-white">
                      <h3 className="fs-5 fw-bold text-center mb-1">{product.name}</h3>
                      <div className="text-center fw-bold fs-5 mb-2" style={{ color: '#FFD700' }}>
                        ₹{product.price} <span className="text-light opacity-50 fw-normal" style={{ fontSize: '0.85rem' }}>/ {product.unit}</span>
                      </div>
                      <p className="text-light opacity-75 text-center flex-grow-1 mb-4" style={{ fontSize: '0.9rem' }}>
                        {product.description}
                      </p>

                      {/* Card Footer */}
                      <div className="d-flex flex-column gap-2 mt-auto">
                        <button 
                          className="btn w-100 fw-bold text-white border-0 py-2"
                          style={{ backgroundColor: '#aa1a31', borderRadius: '8px' }}
                          onClick={() => {
                            if (product.stock <= 0) {
                              Swal.fire('Out of Stock', 'Sorry, this product is temporarily unavailable.', 'warning');
                              return;
                            }
                            addToCart(product);
                            Swal.fire({
                              icon: 'success',
                              title: 'Added to Cart',
                              text: `${product.name} has been added to your shopping cart.`,
                              timer: 1200,
                              showConfirmButton: false
                            });
                          }}
                        >
                          <i className="bi bi-cart-plus me-2"></i> Add to Cart
                        </button>
                        <button 
                          className="btn w-100 py-1.5 fw-semibold"
                          style={{ borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'transparent', color: '#FFD700', border: '1.5px solid #FFD700' }}
                          onClick={() => {
                            navigate(`/product/${product._id || product.id}`);
                          }}
                        >
                          <i className="bi bi-info-circle me-1"></i> More Info
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <style>{`
        .active-cat-btn {
          background-color: #FFD700;
          color: #4A1525;
        }
        .inactive-cat-btn {
          background-color: transparent;
          color: #FFFFFF;
        }
        .inactive-cat-btn:hover {
          background-color: rgba(255, 215, 0, 0.1);
          color: #FFD700;
        }
        .premium-product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 10px 25px rgba(255, 215, 0, 0.15) !important;
          border-color: rgba(255, 215, 0, 0.4) !important;
        }
      `}</style>
    </>
  );
};

export default Shop;
