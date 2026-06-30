import React from 'react';
import Header from './includes/Header';
import Banner from '../components/Banner';
import Footer from './includes/Footer';
import { useLanguage } from '../context/LanguageContext';
import { getAssetPath } from '../Utils/imageHelper';

const Brands: React.FC = () => {
  const { t } = useLanguage();

  const brandList = [
    {
      id: 'masale',
      title: t('brands_masale_title'),
      desc: t('brands_masale_desc'),
      icon: 'bi-fire',
      badge: 'Spices',
      color: '#4A1525',
      logo: getAssetPath('images/log1.jpg')
    },
    {
      id: 'namkeen',
      title: t('brands_namkeen_title'),
      desc: t('brands_namkeen_desc'),
      icon: 'bi-basket',
      badge: 'Snacks',
      color: '#0A4D68',
      logo: getAssetPath('images/logo2.jpg')
    },
    {
      id: 'spicehome',
      title: t('brands_spicehome_title'),
      desc: t('brands_spicehome_desc'),
      icon: 'bi-house-heart',
      badge: 'Blends',
      color: '#05bfdb',
      logo: getAssetPath('images/logo3.jpg')
    },
    {
      id: 'chaha',
      title: t('brands_chaha_title'),
      desc: t('brands_chaha_desc'),
      icon: 'bi-cup-hot',
      badge: 'Tea',
      color: '#D2691E',
      logo: getAssetPath('images/logo4.jpg')
    },
    {
      id: 'agro',
      title: t('brands_agro_title'),
      desc: t('brands_agro_desc'),
      icon: 'bi-tree',
      badge: 'Agro',
      color: '#1A5F7A',
      logo: getAssetPath('images/logo5.jpg')
    }
  ];

  return (
    <>
      <Header />

      <Banner page={t('nav_brands')} path={[t('nav_home'), t('nav_brands')]} />

      <div className="brands-page-wrapper py-5" style={{ backgroundColor: '#FDF6ED', minHeight: '80vh', position: 'relative' }}>
        <div className="traditional-pattern-overlay"></div>

        <div className="container px-3 px-lg-5 position-relative" style={{ zIndex: 2 }}>

          {/* Torch & Introduction Section */}
          <div className="row align-items-center g-5 mb-5">
            <div className="col-12 col-md-5 text-center">
              <div className="torch-container position-relative p-3 d-inline-block animate__animated animate__fadeInLeft" style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
                borderRadius: '50%'
              }}>
                <img
                  src={getAssetPath('images/since_1972_torch.png')}
                  alt="RA Masala Torch Since 1972"
                  className="img-fluid"
                  style={{ maxHeight: '380px', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))' }}
                />
              </div>
            </div>

            <div className="col-12 col-md-7 animate__animated animate__fadeInRight">
              <span className="text-uppercase fw-bold tracking-wider" style={{ color: '#D2691E', fontSize: '0.9rem', letterSpacing: '2px' }}>
                {t('brands_tag')}
              </span>
              <h2 className="fw-bold mb-4 mt-2 display-5" style={{ color: '#4A1525', fontFamily: 'serif' }}>
                {t('brands_title')}
              </h2>

              <p className="lead mb-4 text-muted" style={{ lineHeight: '1.8' }}>
                {t('brands_subtitle')}
              </p>

              <p style={{ color: '#4E3629', lineHeight: '1.75', fontSize: '1.05rem' }}>
                {t('footer_promise')}
              </p>
            </div>
          </div>

          <hr style={{ borderTop: '2px dashed #FFD700', opacity: 0.5, margin: '50px 0' }} />

          {/* Grid of Associated Brands */}
          <div className="row g-4 justify-content-center">
            {brandList.map((brand) => (
              <div key={brand.id} className="col-12 col-md-6 col-lg-4">
                <div className="brand-card shadow-sm h-100 p-4 border-0 position-relative overflow-hidden" style={{
                  backgroundColor: '#FFF',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 215, 0, 0.25)',
                  transition: 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Styled Header with Icon */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="brand-icon-box d-flex align-items-center justify-content-center" style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '15px',
                      backgroundColor: `${brand.color}15`,
                      border: `2px solid ${brand.color}`,
                      color: brand.color
                    }}>
                      <i className={`bi ${brand.icon} fs-3`}></i>
                    </div>
                    <span className="badge text-uppercase tracking-wider px-3 py-2" style={{
                      backgroundColor: brand.color,
                      color: '#FFF',
                      fontSize: '0.75rem',
                      borderRadius: '30px'
                    }}>
                      {brand.badge}
                    </span>
                  </div>

                  {/* Brand Cropped Logo Placeholder */}
                  <div className="logo-crop-container mb-3" style={{
                    height: '130px',
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#FFF',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px'
                  }}>
                    <img
                      src={brand.logo}
                      alt={brand.title}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.05))'
                      }}
                    />
                  </div>

                  {/* Content */}
                  <h4 className="fw-bold mb-2" style={{ color: '#4A1525', fontFamily: 'serif' }}>
                    {brand.title}
                  </h4>
                  <p className="text-muted small mb-4 flex-grow-1" style={{ lineHeight: '1.6' }}>
                    {brand.desc}
                  </p>

                  {/* Action Button */}
                  <button className="brand-action-btn w-100" style={{
                    backgroundColor: '#4A1525',
                    color: '#FFD700',
                    border: '1px solid #FFD700',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}>
                    <i className="bi bi-box-seam me-2"></i>
                    {t('brands_more_products')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Full Portfolio Section */}
          <div className="row mt-5 pt-4 justify-content-center">
            <div className="col-12 col-lg-10 text-center">
              <div className="portfolio-banner p-4 p-md-5" style={{
                background: 'linear-gradient(135deg, #4A1525 0%, #2A060F 100%)',
                border: '3px solid #FFD700',
                borderRadius: '24px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.25)'
              }}>
                <h3 className="fw-bold mb-3" style={{ color: '#FFD700', fontFamily: 'serif' }}>
                  Our Complete Brand Portfolio
                </h3>
                <p className="text-light opacity-75 mb-4 max-w-600 mx-auto">
                  Representing excellence in every sector we enter. View our official brand family marks below.
                </p>
                <div className="row g-5 justify-content-center">
                  <div className="col-12">
                    <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm mb-4">
                      <h4 className="fw-bold mb-3 text-start" style={{ color: '#4A1525', fontFamily: 'serif' }}>
                        Brand Range Showcase
                      </h4>
                      <img 
                        src={getAssetPath('images/brand_products_showcase.png')} 
                        alt="RA Brands Products Showcase" 
                        className="img-fluid rounded w-100"
                        style={{ maxHeight: '850px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm">
                      <h4 className="fw-bold mb-3 text-start" style={{ color: '#4A1525', fontFamily: 'serif' }}>
                        Exhibition Showroom Showcase
                      </h4>
                      <img 
                        src={getAssetPath('images/brand_showroom_display.jpg')} 
                        alt="RA Brands Showroom Display" 
                        className="img-fluid rounded w-100"
                        style={{ maxHeight: '850px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />

      {/* Styled JSX for Brands page */}
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
        .brand-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 25px rgba(255, 215, 0, 0.15) !important;
          border-color: #FFD700 !important;
        }
        .brand-action-btn:hover {
          background-color: #FFD700 !important;
          color: #4A1525 !important;
          border-color: #4A1525 !important;
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
};

export default Brands;
