import React, { useState, useEffect } from 'react';
import Header from './includes/Header';
import Footer from './includes/Footer';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLanguage();
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [showPromoModal, setShowPromoModal] = useState(false);

  // Show the modal after 1.5 seconds when page mounts/refreshes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPromoModal(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Define the sliding content or background panels
  const brandPanels = [
    {
      image: '/images/b1.png', 
      headline: t('home_headline_1'),
      subtext: t('home_subtext_1'),
    },
    {
      image: '/images/b2.png',
      headline: t('home_headline_2'),
      subtext: t('home_subtext_2'),
    },
  ];

  // Sample product data
  const products = [
    {
      id: 1,
      name: t('p1_name'),
      price: '$12.99',
      image: '/images/product1.jpg',
      description: t('p1_desc')
    },
    {
      id: 2,
      name: t('p2_name'),
      price: '$15.99',
      image: '/images/product2.jpg',
      description: t('p2_desc')
    },
    {
      id: 3,
      name: t('p3_name'),
      price: '$9.99',
      image: '/images/product3.jpg',
      description: t('p3_desc')
    },
    {
      id: 4,
      name: t('p4_name'),
      price: '$8.99',
      image: '/images/product4.jpg',
      description: t('p4_desc')
    },
    {
      id: 5,
      name: t('p5_name'),
      price: '$18.99',
      image: '/images/product5.jpg',
      description: t('p5_desc')
    },
    {
      id: 6,
      name: t('p6_name'),
      price: '$11.99',
      image: '/images/product6.jpg',
      description: t('p6_desc')
    },
  ];

  // Automatic panel cross-fade every 7 seconds
  useEffect(() => {
    const panelInterval = setInterval(() => {
      setCurrentPanelIndex((prev) => (prev + 1) % brandPanels.length);
    }, 7000);

    return () => clearInterval(panelInterval);
  }, [brandPanels.length]);

  const currentPanel = brandPanels[currentPanelIndex] || brandPanels[0];

  return (
    <>
      <Header />

      {/* Main content with background image */}
      <main 
        className="homepage-content position-relative"
        style={{
          backgroundImage: `url('images/sp2.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh'
        }}
      >
        {/* Dark rich red overlay for the entire background image to blend it perfectly */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(42, 6, 15, 0.5) 0%, rgba(20, 2, 6, 0.75) 100%)',
          zIndex: 1
        }}></div>

        {/* Traditional cultural dotted pattern overlay */}
        <div className="traditional-home-pattern"></div>

        {/* Content wrapper to stand out above overlays */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          
          {/* Sliding Banner Section */}
          <section className="hero-slider" style={{ 
            position: 'relative',
            width: '100%',
            minHeight: '85vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            
            {/* Background 'Sliding' (Cross-fading) Layers */}
            {brandPanels.map((panel, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${panel.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'opacity 1.5s ease-in-out', 
                  opacity: index === currentPanelIndex ? 1 : 0,
                  zIndex: 0,
                }}
              />
            ))}

            {/* Dark gradient slide overlay to increase text contrast */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)',
              zIndex: 1
            }}></div>

            {/* Content Overlay */}
            <div className="hero-content-card" style={{ 
              position: 'relative',
              zIndex: 10,
              maxWidth: '1000px',
              margin: '0 20px',
              padding: '40px 20px',
              color: '#fff',
              textAlign: 'center',
            }}>
              <h1 className="hero-headline" style={{ 
                fontSize: '3.6rem',
                marginBottom: '20px', 
                fontWeight: 'bold', 
                color: '#FFD700',
                fontFamily: 'serif',
                textShadow: '0 4px 12px rgba(0,0,0,0.7)',
                lineHeight: '1.2'
              }}>
                {currentPanel.headline}
              </h1>
              
              <p style={{ 
                fontSize: '1.4rem', 
                fontWeight: '400', 
                marginBottom: '35px',
                color: '#FDF6ED',
                textShadow: '0 2px 6px rgba(0,0,0,0.6)'
              }}>
                {currentPanel.subtext}
              </p>

              <button className="hero-cta-button">
                {t('home_explore_btn')}
              </button>
            </div>
          </section>

          {/* Products Section - FULLY TRANSPARENT */}
          <section className="products-section" style={{
            padding: '80px 20px',
            backgroundColor: 'transparent',  
            maxWidth: '1400px',
            margin: '0 auto',
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '60px',
            }}>
              {/* Elegant Mandala Motif above Title */}
              <div className="mandala-title-icon mb-3"></div>

              <h2 style={{
                fontSize: '3rem',
                color: '#FFD700',  
                marginBottom: '15px',
                fontWeight: 'bold',
                fontFamily: 'serif',
                textShadow: '0 2px 10px rgba(0,0,0,0.6)', 
              }}>
                {t('home_title')}
              </h2>
              
              <div className="title-divider mb-3"></div>

              <p style={{
                fontSize: '1.25rem',
                color: '#FDF6ED',  
                maxWidth: '650px',
                margin: '0 auto',
                textShadow: '0 1px 5px rgba(0,0,0,0.4)',
              }}>
                {t('home_subtitle')}
              </p>
            </div>

            {/* Premium Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '35px',
              padding: '0 20px',
            }}>
              {products.map((product) => (
                <div key={product.id} className="premium-product-card">
                  
                  {/* Image container with hover zoom effect */}
                  <div className="product-image-container">
                    <div className="product-image-zoom" style={{
                      backgroundImage: `url(${product.image})`
                    }}></div>
                    <div className="product-image-badge">100% NATURAL</div>
                  </div>

                  <div className="product-card-body">
                    <h3 className="product-card-title text-center">
                      {product.name}
                    </h3>
                    <p className="product-card-desc text-center">
                      {product.description}
                    </p>
                    
                    <div className="product-card-footer">
                      <button className="product-card-btn w-100">
                        <i className="bi bi-info-circle me-2"></i>
                        {t('home_more_info')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Products CTA */}
            <div style={{
              textAlign: 'center',
              marginTop: '65px',
            }}>
              <button className="view-all-cta-btn">
                {t('home_view_all')}
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Premium Festive Promo Modal */}
      {showPromoModal && (
        <div className="promo-modal-backdrop animate__animated animate__fadeIn">
          <div className="promo-modal-content animate__animated animate__zoomIn">
            
            {/* Left Side: Product/Spice Image (Desktop Only, stacks on mobile) */}
            <div className="promo-modal-image-sec">
              <div className="promo-modal-image-overlay"></div>
            </div>

            {/* Right Side: Form and Content */}
            <div className="promo-modal-form-sec">
              <button className="promo-modal-close" onClick={() => setShowPromoModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
              
              {/* Traditional Mandala Design element */}
              <div className="promo-modal-header-icon"></div>
              
              <span className="promo-tag">{t('promo_tag')}</span>
              <h3 className="promo-title">{t('promo_title')}</h3>
              <p className="promo-subtitle">{t('promo_subtitle')}</p>
              
              <p className="promo-desc text-light opacity-90">
                {t('promo_desc')}
              </p>
              
              <form className="promo-form" onSubmit={(e) => { e.preventDefault(); setShowPromoModal(false); }}>
                <input 
                  type="email" 
                  placeholder={t('promo_placeholder')} 
                  required 
                  className="promo-input"
                />
                <button type="submit" className="promo-submit-btn text-uppercase">
                  {t('promo_submit')}
                </button>
              </form>
              
              <button className="promo-decline-link" onClick={() => setShowPromoModal(false)}>
                {t('promo_decline')}
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .traditional-home-pattern {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.04;
          background-image: radial-gradient(#FFD700 1.5px, transparent 0);
          background-size: 24px 24px;
          pointer-events: none;
          z-index: 1;
        }

        .hero-cta-button {
          background: linear-gradient(135deg, #D2691E 0%, #B85C1A 100%);
          color: #fff; 
          border: 2px solid #FFD700; 
          padding: 16px 36px; 
          font-size: 1.15rem; 
          cursor: pointer; 
          border-radius: 30px;
          font-weight: bold;
          text-shadow: none;
          box-shadow: 0 4px 15px rgba(210, 105, 30, 0.4);
          transition: all 0.3s ease;
        }
        .hero-cta-button:hover {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #4A1525;
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .mandala-title-icon {
          display: inline-block;
          width: 50px;
          height: 50px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-13a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3z"/></svg>');
          background-size: contain;
          background-repeat: no-repeat;
          opacity: 0.85;
          animation: spinMandala 20s linear infinite;
        }
        @keyframes spinMandala {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .title-divider {
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #FFD700, transparent);
          margin: 0 auto;
        }

        /* Premium Card Layout */
        .premium-product-card {
          background: linear-gradient(180deg, #FFFDF8 0%, #FFF4E5 100%);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0,0,0,0.35);
          border: 2px solid rgba(255, 215, 0, 0.25);
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .premium-product-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 5px;
          background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
          z-index: 5;
        }
        .premium-product-card:hover {
          transform: translateY(-12px);
          box-shadow: 0 20px 40px rgba(255, 215, 0, 0.25);
          border-color: #FFD700;
        }

        .product-image-container {
          width: 100%;
          height: 240px;
          overflow: hidden;
          position: relative;
        }
        .product-image-zoom {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          transition: transform 0.6s ease;
        }
        .premium-product-card:hover .product-image-zoom {
          transform: scale(1.08);
        }
        .product-image-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background-color: #4A1525;
          color: #FFD700;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid #FFD700;
          letter-spacing: 1px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .product-card-body {
          padding: 25px 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .product-card-title {
          font-size: 1.45rem;
          color: #4A1525;
          margin-bottom: 10px;
          font-weight: 700;
          font-family: serif;
        }
        .product-card-desc {
          font-size: 0.95rem;
          color: #5C4033;
          margin-bottom: 25px;
          line-height: 1.6;
          flex-grow: 1;
        }
        .product-card-footer {
          margin-top: auto;
          width: 100%;
        }
        .product-card-btn {
          background: linear-gradient(135deg, #4A1525 0%, #2A060F 100%);
          color: #FFD700;
          border: 2px solid #FFD700;
          padding: 12px 24px;
          border-radius: 30px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(74, 21, 37, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .product-card-btn:hover {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #4A1525;
          border-color: #4A1525;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(255, 215, 0, 0.3);
        }

        /* View All button styling */
        .view-all-cta-btn {
          background-color: transparent;
          color: #FFD700;
          border: 2px solid #FFD700;
          padding: 15px 45px;
          font-size: 1.15rem;
          font-weight: bold;
          cursor: pointer;
          border-radius: 30px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .view-all-cta-btn:hover {
          background-color: #FFD700;
          color: #4A1525;
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.3);
        }

        /* Promo Modal Styles */
        .promo-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }
        .promo-modal-content {
          background: radial-gradient(circle at top, #5b1a2c 0%, #2c0b14 100%);
          border: 3px solid #FFD700;
          border-radius: 20px;
          max-width: 850px;
          width: 100%;
          display: flex;
          flex-direction: row;
          overflow: hidden;
          position: relative;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 30px rgba(255, 215, 0, 0.15);
        }
        .promo-modal-image-sec {
          flex: 1;
          background-image: url('images/welcome_central_spices_1782269826725.png');
          background-size: cover;
          background-position: center;
          position: relative;
          min-height: 480px;
          display: block;
        }
        .promo-modal-image-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to right, rgba(91, 26, 44, 0.1), rgba(44, 11, 20, 0.6));
        }
        .promo-modal-form-sec {
          flex: 1.2;
          padding: 40px 35px;
          text-align: center;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .promo-modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.3rem;
          cursor: pointer;
          transition: color 0.3s;
          z-index: 10;
        }
        .promo-modal-close:hover {
          color: #FFD700;
        }
        
        .promo-modal-header-icon {
          width: 50px;
          height: 50px;
          margin: 0 auto 15px auto;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-13h-2v3H8v2h3v3h2v-3h3v-2h-3v-3z"/></svg>');
          background-size: contain;
          background-repeat: no-repeat;
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
          animation: spinMandala 20s linear infinite;
        }
        
        .promo-tag {
          font-size: 0.75rem;
          letter-spacing: 2px;
          font-weight: 700;
          color: #FFD700;
          border: 1px solid #FFD700;
          padding: 3px 12px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 15px;
        }
        .promo-title {
          font-size: 2.3rem;
          color: #FFF;
          font-weight: bold;
          font-family: serif;
          margin-bottom: 5px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .promo-subtitle {
          font-size: 1.15rem;
          color: #FFD700;
          font-weight: 600;
          margin-bottom: 20px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .promo-desc {
          font-size: 0.92rem;
          color: #FDF6ED;
          line-height: 1.6;
          margin-bottom: 25px;
          opacity: 0.9;
        }
        .promo-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          margin-bottom: 20px;
        }
        .promo-input {
          padding: 12px 20px;
          border-radius: 30px;
          border: 2px solid rgba(255, 215, 0, 0.4);
          background: rgba(255, 255, 255, 0.08);
          color: #FFF;
          outline: none;
          font-size: 1rem;
          text-align: center;
          transition: border-color 0.3s;
        }
        .promo-input:focus {
          border-color: #FFD700;
          background: rgba(255, 255, 255, 0.12);
        }
        .promo-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        .promo-submit-btn {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #4A1525;
          font-weight: bold;
          border: none;
          padding: 14px 20px;
          border-radius: 30px;
          cursor: pointer;
          font-size: 1.05rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }
        .promo-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
          background: linear-gradient(135deg, #FFF 0%, #FFD700 100%);
        }
        .promo-decline-link {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.3s;
        }
        .promo-decline-link:hover {
          color: #FFF;
        }

        /* Responsive stack for mobile */
        @media (max-width: 768px) {
          .promo-modal-content {
            flex-direction: column;
            max-width: 450px;
          }
          .promo-modal-image-sec {
            min-height: 200px;
            width: 100%;
          }
          .promo-modal-form-sec {
            padding: 30px 20px;
          }
        }
      `}</style>
    </>
  );
};

export default Home;