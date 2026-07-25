import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './includes/Header';
import Footer from './includes/Footer';
import Banner from '../components/Banner';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Swal from 'sweetalert2';
import { getAssetPath } from '../Utils/imageHelper';

const BrandDetail: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { products } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const brandList = [
    {
      id: 'masale',
      title: t('brands_masale_title') || 'RA Masale Pvt. Ltd.',
      desc: t('brands_masale_desc') || 'Our signature range of pure ground spices and authentic custom blends.',
      icon: 'bi-fire',
      badge: 'Spices',
      color: '#4A1525',
      logo: getAssetPath('images/log1.jpg')
    },
    {
      id: 'namkeen',
      title: t('brands_namkeen_title') || 'RA Namkeen',
      desc: t('brands_namkeen_desc') || 'Traditional, crispy, and savory snacks crafted with high-quality ingredients.',
      icon: 'bi-basket',
      badge: 'Snacks',
      color: '#0A4D68',
      logo: getAssetPath('images/logo2.jpg')
    },
    {
      id: 'spicehome',
      title: t('brands_spicehome_title') || 'RA Spice Home',
      desc: t('brands_spicehome_desc') || 'Everyday spice necessities processed under strict hygienic standards.',
      icon: 'bi-house-heart',
      badge: 'Blends',
      color: '#05bfdb',
      logo: getAssetPath('images/logo3.jpg')
    },
    {
      id: 'chaha',
      title: t('brands_chaha_title') || 'RA Chaha',
      desc: t('brands_chaha_desc') || 'Premium tea leaves selected from rich gardens, blended for authentic flavor.',
      icon: 'bi-cup-hot',
      badge: 'Tea',
      color: '#D2691E',
      logo: getAssetPath('images/logo4.jpg')
    },
    {
      id: 'agro',
      title: t('brands_agro_title') || 'RA Agro',
      desc: t('brands_agro_desc') || 'Directly sourced agricultural essentials like grains, pulses, and organic oils.',
      icon: 'bi-tree',
      badge: 'Agro',
      color: '#1A5F7A',
      logo: getAssetPath('images/logo5.jpg')
    }
  ];

  // Find the selected brand details
  const currentBrand = brandList.find(b => b.id === brandId);

  if (!currentBrand) {
    return (
      <>
        <Header />
        <div className="container py-5 text-center my-5">
          <h2 className="text-danger fw-bold">Brand Not Found</h2>
          <p className="text-muted">The brand you are looking for does not exist or has been removed.</p>
          <Link to="/brands" className="btn btn-danger mt-3 px-4">Back to Brands</Link>
        </div>
        <Footer />
      </>
    );
  }

  // Filter products by brand, with strict category mapping to avoid brand crossover
  const brandProducts = products.filter(product => {
    const cat = product.category.toLowerCase().trim();
    if (brandId === 'masale') {
      return cat === 'masale';
    }
    if (brandId === 'namkeen') {
      return cat === 'namkeen';
    }
    if (brandId === 'spicehome') {
      return cat === 'spice home' || cat === 'spicehome';
    }
    if (brandId === 'chaha') {
      return cat === 'chaha' || cat === 'tea' || cat === 'tea/chaha';
    }
    if (brandId === 'agro') {
      return cat === 'agro';
    }
    return false;
  });

  // Extract unique categories from filtered products
  const categories = ['All', ...Array.from(new Set(brandProducts.map(p => p.category)))];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');

  const subCategoriesList = [
    { name: 'Ground Spices', img: 'images/subcategories/ground_spices.png', bg: '#D12B43' },
    { name: 'Pickles & Papad', img: 'images/subcategories/pickles_papad.png', bg: '#008b70' },
    { name: 'Ready Mix Spices', img: 'images/subcategories/ready_mix.png', bg: '#E45B5B' },
    { name: 'Seasonal Range', img: 'images/subcategories/seasonal.png', bg: '#C28E5D' },
    { name: 'Chutneys', img: 'images/subcategories/chutneys.png', bg: '#708050' },
    { name: 'Kitchen Favourites', img: 'images/subcategories/kitchen_favs.png', bg: '#60729B' },
    { name: 'Premium Range', img: 'images/subcategories/premium.png', bg: '#D47525' },
    { name: 'Dessert', img: 'images/subcategories/dessert.png', bg: '#D65A98' }
  ];

  // Filter products by selected category and subcategory
  const filteredProducts = brandProducts.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSubCat = selectedSubCategory === 'All' || p.subCategory === selectedSubCategory;
    return matchesCat && matchesSubCat;
  });

  return (
    <>
      <Header />

      <Banner page={currentBrand.title} path={[t('nav_home'), t('nav_brands'), currentBrand.title]} />

      <div className="brand-detail-page py-5" style={{
        backgroundImage: "linear-gradient(rgba(253, 246, 237, 0.94), rgba(253, 246, 237, 0.94)), url('/images/sp2.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '80vh',
        position: 'relative'
      }}>
        <div className="traditional-pattern-overlay"></div>

        <div className="container px-3 px-lg-5 position-relative" style={{ zIndex: 2 }}>

          {/* Back button */}
          <div className="mb-4">
            <Link to="/brands" className="btn text-decoration-none fw-bold d-inline-flex align-items-center gap-2" style={{ color: currentBrand.color }}>
              <i className="bi bi-arrow-left fs-5"></i> Back to Brands Portfolio
            </Link>
          </div>

          {/* Brand Header Card */}
          <div className="card shadow border-0 rounded-4 overflow-hidden mb-5 animate__animated animate__fadeIn" style={{
            background: `linear-gradient(135deg, ${currentBrand.color} 0%, #1A050B 100%)`,
            color: '#FFF',
            border: '2px solid #FFD700'
          }}>
            <div className="card-body p-4 p-md-5">
              <div className="row align-items-center g-4">
                <div className="col-12 col-md-3 text-center">
                  <div className="bg-white p-3 rounded-4 shadow-sm d-inline-block" style={{ width: '160px', height: '160px', overflow: 'hidden' }}>
                    <img
                      src={currentBrand.logo}
                      alt={currentBrand.title}
                      className="w-100 h-100 object-fit-contain"
                    />
                  </div>
                </div>
                <div className="col-12 col-md-9 text-center text-md-start">
                  <span className="badge text-uppercase tracking-wider px-3 py-2 mb-3" style={{
                    backgroundColor: '#FFD700',
                    color: '#000',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    borderRadius: '30px'
                  }}>
                    {currentBrand.badge} Brand Range
                  </span>
                  <h1 className="fw-bold mb-3 display-4 font-serif" style={{ fontFamily: 'serif', color: '#FFD700' }}>
                    {currentBrand.title}
                  </h1>
                  <p className="lead mb-0 text-white-50" style={{ lineHeight: '1.7', fontSize: '1.1rem' }}>
                    {currentBrand.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          {categories.length > 2 && (
            <div className="d-flex flex-wrap gap-2 justify-content-center mb-5 animate__animated animate__fadeInUp">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-2 fw-semibold rounded-pill transition-all"
                  style={{
                    backgroundColor: selectedCategory === cat ? currentBrand.color : '#FFF',
                    color: selectedCategory === cat ? '#FFF' : '#4E3629',
                    border: `1.5px solid ${selectedCategory === cat ? currentBrand.color : 'rgba(74, 21, 37, 0.15)'}`,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {cat === 'All' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Custom Subcategories for Spice Home */}
          {brandId === 'spicehome' && (
            <div className="mb-5 animate__animated animate__fadeIn">
              <h5 className="text-center fw-bold mb-4" style={{ color: '#4A1525', fontFamily: 'serif' }}>
                Browse by Spice Categories
              </h5>
              <div className="d-flex flex-wrap gap-4 justify-content-center">
                {/* 'All' button */}
                <div
                  onClick={() => setSelectedSubCategory('All')}
                  className="text-center transition-all"
                  style={{ width: '100px', cursor: 'pointer' }}
                >
                  <div
                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-2 mb-2"
                    style={{
                      width: '75px',
                      height: '75px',
                      backgroundColor: selectedSubCategory === 'All' ? '#FFD700' : '#FFF',
                      borderColor: selectedSubCategory === 'All' ? '#FFD700' : 'rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <i className={`bi bi-grid-fill fs-3 ${selectedSubCategory === 'All' ? 'text-dark' : 'text-secondary'}`}></i>
                  </div>
                  <strong className="d-block small text-dark">ALL</strong>
                </div>

                {subCategoriesList.map((sub) => {
                  const isActive = selectedSubCategory === sub.name;
                  return (
                    <div
                      key={sub.name}
                      onClick={() => setSelectedSubCategory(sub.name)}
                      className="text-center transition-all"
                      style={{ width: '100px', cursor: 'pointer' }}
                    >
                      <div
                        className="mx-auto rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-2 mb-2 overflow-hidden"
                        style={{
                          width: '75px',
                          height: '75px',
                          backgroundColor: isActive ? (sub.img ? 'transparent' : sub.bg) : '#FFF',
                          borderColor: isActive ? '#FFD700' : 'rgba(0,0,0,0.1)',
                          color: isActive ? '#FFF' : sub.bg,
                          transition: 'all 0.2s',
                          transform: isActive ? 'scale(1.08)' : 'scale(1)'
                        }}
                      >
                        {sub.img ? (
                          <img
                            src={getAssetPath(sub.img)}
                            alt={sub.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              filter: isActive ? 'none' : 'grayscale(35%) contrast(1.15) brightness(0.95)'
                            }}
                          />
                        ) : (
                          <i className={`bi ${(sub as any).icon || ''} fs-3`}></i>
                        )}
                      </div>
                      <strong className="d-block text-secondary" style={{ fontSize: '0.72rem', textTransform: 'uppercase', lineHeight: '1.2' }}>
                        {sub.name}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="row g-4 justify-content-center">
            {filteredProducts.length === 0 ? (
              <div className="col-12 text-center py-5">
                <div className="p-5 rounded-4 bg-white shadow-sm border border-dashed d-inline-block max-w-500">
                  <i className="bi bi-box-seam display-1 text-muted d-block mb-3"></i>
                  <h4 className="fw-bold text-dark mb-2">No Products Available</h4>
                  <p className="text-secondary mb-4">
                    Products under this brand are temporarily unavailable or in the process of being imported. Please check back later.
                  </p>
                  <Link to="/shop" className="btn text-white fw-bold px-4" style={{ backgroundColor: currentBrand.color }}>
                    Explore General Shop
                  </Link>
                </div>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const pId = product._id || product.id;
                return (
                  <div key={pId} className="col-12 col-md-6 col-lg-4 animate__animated animate__fadeInUp">
                    <div className="premium-product-card h-100 d-flex flex-column" style={{
                      background: 'linear-gradient(135deg, #4A1525 0%, #2A060F 100%)',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                      border: '1px solid rgba(255, 215, 0, 0.15)',
                      transition: 'all 0.35s ease',
                      position: 'relative'
                    }}>

                      {/* Badge / Wishlist absolute controls */}
                      <div className="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-center" style={{ zIndex: 10 }}>
                        <span className="badge text-white px-3 py-2 shadow-sm" style={{
                          backgroundColor: currentBrand.color,
                          borderRadius: '30px',
                          fontSize: '0.75rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          {product.category}
                        </span>

                        <button
                          className="btn d-flex align-items-center justify-content-center p-2 rounded-circle border-0 shadow-sm"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (isInWishlist(pId)) {
                              removeFromWishlist(pId);
                            } else {
                              addToWishlist(product);
                            }
                          }}
                        >
                          <i className={`bi ${isInWishlist(pId) ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'}`} style={{ fontSize: '1.1rem', marginTop: '2px' }}></i>
                        </button>
                      </div>

                      {/* Product Image Box */}
                      <div className="image-container-wrapper" style={{
                        height: '240px',
                        backgroundColor: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: '24px',
                        borderBottom: '2px solid rgba(255, 215, 0, 0.15)'
                      }}>
                        <Link to={`/product/${pId}`} className="w-100 h-100 d-flex align-items-center justify-content-center text-decoration-none">
                          <img
                            src={getAssetPath(product.image)}
                            alt={product.name}
                            style={{
                              maxHeight: '100%',
                              maxWidth: '100%',
                              objectFit: 'contain',
                              transition: 'transform 0.5s ease'
                            }}
                            className="product-hover-image"
                          />
                        </Link>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 d-flex flex-column flex-grow-1 text-white">
                        <Link to={`/product/${pId}`} className="text-decoration-none text-white">
                          <h3 className="fs-5 fw-bold text-center mb-1 product-hover-title">{product.name}</h3>
                        </Link>
                        <div className="text-center fw-bold fs-5 mb-2" style={{ color: '#FFD700' }}>
                          ₹{product.price} <span className="text-light opacity-50 fw-normal" style={{ fontSize: '0.85rem' }}>/ {product.unit}</span>
                        </div>
                        <p className="text-light opacity-75 text-center flex-grow-1 mb-4" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                          {product.description}
                        </p>

                        {/* Actions */}
                        <div className="d-flex flex-column gap-2 mt-auto">
                          <button
                            className="btn w-100 fw-bold text-white border-0 py-2 btn-cart-action"
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
                          <Link
                            to={`/product/${pId}`}
                            className="btn btn-outline-light w-100 fw-semibold py-2"
                            style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      <Footer />

      {/* Styled components */}
      <style>{`
        .traditional-pattern-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.03;
          background-image: radial-gradient(#4A1525 1.5px, transparent 0);
          background-size: 24px 24px;
          pointer-events: none;
          z-index: 1;
        }
        .premium-product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(255,215,0,0.18) !important;
          border-color: #FFD700 !important;
        }
        .premium-product-card:hover .product-hover-image {
          transform: scale(1.08);
        }
        .product-hover-title:hover {
          color: #FFD700 !important;
        }
        .btn-cart-action:hover {
          background-color: #FFD700 !important;
          color: #4A1525 !important;
        }
      `}</style>
    </>
  );
};

export default BrandDetail;
