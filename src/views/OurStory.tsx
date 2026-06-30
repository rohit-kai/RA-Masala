import React from 'react'
import Header from './includes/Header'
import Banner from '../components/Banner'
import Footer from './includes/Footer'
import { useLanguage } from '../context/LanguageContext'
import { getAssetPath } from '../Utils/imageHelper'

const OurStory: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      
      <Banner page={t('nav_our_story')} path={[t('nav_home'), t('nav_our_story')]} />

      {/* Main Story Container with subtle traditional background pattern */}
      <div className="our-story-wrapper py-5" style={{ backgroundColor: '#FDF6ED', minHeight: '80vh', position: 'relative' }}>
        <div className="traditional-pattern-overlay"></div>
        
        <div className="container px-3 px-lg-5 position-relative" style={{ zIndex: 2 }}>
          
          {/* Main Intro Section */}
          <div className="row align-items-center g-5 mb-5">
            
            {/* Image Section with Elegant Gold Traditional Frame */}
            <div className="col-12 col-md-5">
              <div className="story-image-frame position-relative p-2" style={{ 
                background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
              }}>
                <img 
                  src={getAssetPath('images/story.png')} 
                  alt="RA Masala Story" 
                  className="img-fluid rounded w-100"
                  style={{ objectFit: 'cover', maxHeight: '550px', display: 'block', borderRadius: '10px' }}
                />
                {/* Decorative Corner Elements */}
                <div className="frame-corner tl"></div>
                <div className="frame-corner tr"></div>
                <div className="frame-corner bl"></div>
                <div className="frame-corner br"></div>
              </div>
            </div>

            {/* Story Text Section */}
            <div className="col-12 col-md-7">
              <span className="text-uppercase fw-bold tracking-wider" style={{ color: '#D2691E', fontSize: '0.9rem', letterSpacing: '2px' }}>
                {t('story_subtitle')}
              </span>
              <h2 className="fw-bold mb-4 mt-2 display-6" style={{ color: '#4A1525', fontFamily: 'serif' }}>
                {t('story_title')}
              </h2>
              
              <div className="lead mb-4 fw-medium text-dark border-start border-4 px-3" style={{ borderColor: '#FFD700', lineHeight: '1.8' }}>
                {t('story_lead')}
              </div>
              
              <div className="story-paragraphs" style={{ color: '#4E3629', lineHeight: '1.75', fontSize: '1.05rem' }}>
                <p className="mb-3">
                  {t('story_p1')}
                </p>
                
                <p className="mb-3">
                  {t('story_p2')}
                </p>
              </div>
            </div>

          </div>

          {/* Core Values / Founders Grid */}
          <div className="row g-4 my-5 justify-content-center">
            <div className="col-12 text-center mb-4">
              <h3 className="fw-bold text-uppercase position-relative d-inline-block pb-3" style={{ color: '#4A1525', fontFamily: 'serif', letterSpacing: '1px' }}>
                {t('story_founders_title')}
                <span className="position-absolute bottom-0 start-50 translate-middle-x" style={{ width: '60px', height: '3px', background: '#FFD700' }}></span>
              </h3>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <div className="card text-center border-0 p-4 h-100 shadow-sm" style={{ backgroundColor: '#FFF', borderRadius: '12px', transition: 'transform 0.3s ease' }}>
                <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px', background: '#FCECEF', border: '2px solid #4A1525' }}>
                  <i className="bi bi-heart-fill fs-2" style={{ color: '#4A1525' }}></i>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#4A1525' }}>{t('story_value1_title')}</h5>
                <p className="small text-muted mb-0">{t('story_value1_desc')}</p>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <div className="card text-center border-0 p-4 h-100 shadow-sm" style={{ backgroundColor: '#FFF', borderRadius: '12px', transition: 'transform 0.3s ease' }}>
                <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px', background: '#FFF6E0', border: '2px solid #FFD700' }}>
                  <i className="bi bi-award-fill fs-2" style={{ color: '#D2691E' }}></i>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#4A1525' }}>{t('story_value2_title')}</h5>
                <p className="small text-muted mb-0">{t('story_value2_desc')}</p>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <div className="card text-center border-0 p-4 h-100 shadow-sm" style={{ backgroundColor: '#FFF', borderRadius: '12px', transition: 'transform 0.3s ease' }}>
                <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px', background: '#E2F4E9', border: '2px solid #2E7D32' }}>
                  <i className="bi bi-people-fill fs-2" style={{ color: '#2E7D32' }}></i>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#4A1525' }}>{t('story_value3_title')}</h5>
                <p className="small text-muted mb-0">{t('story_value3_desc')}</p>
              </div>
            </div>
          </div>

          {/* Modern Distribution & Future Section */}
          <div className="row align-items-center g-5 mt-4">
            <div className="col-12 col-md-7 order-2 order-md-1">
              <h3 className="fw-bold mb-3" style={{ color: '#4A1525', fontFamily: 'serif' }}>{t('story_network_title')}</h3>
              <p className="lead" style={{ color: '#4E3629' }}>
                {t('story_network_desc')}
              </p>
              <p style={{ color: '#4E3629', fontSize: '1.05rem' }}>
                {t('story_network_promise')}
              </p>
            </div>
            <div className="col-12 col-md-5 order-1 order-md-2 text-center">
              <img 
                src={getAssetPath('img/welcome_bags.png')} 
                alt="Spice Assortment Bags" 
                className="img-fluid" 
                style={{ maxHeight: '280px', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.15))' }}
              />
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .traditional-pattern-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.05;
          background-image: radial-gradient(#4A1525 1.5px, transparent 0);
          background-size: 24px 24px;
          pointer-events: none;
          z-index: 1;
        }

        .story-image-frame::after {
          content: '';
          position: absolute;
          border: 2px solid rgba(255, 215, 0, 0.4);
          top: -12px;
          left: -12px;
          right: -12px;
          bottom: -12px;
          border-radius: 20px;
          pointer-events: none;
          z-index: -1;
        }

        .frame-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 4px solid #FFD700;
          z-index: 2;
        }
        .frame-corner.tl { top: 10px; left: 10px; border-right: none; border-bottom: none; border-top-left-radius: 4px; }
        .frame-corner.tr { top: 10px; right: 10px; border-left: none; border-bottom: none; border-top-right-radius: 4px; }
        .frame-corner.bl { bottom: 10px; left: 10px; border-right: none; border-top: none; border-bottom-left-radius: 4px; }
        .frame-corner.br { bottom: 10px; right: 10px; border-left: none; border-top: none; border-bottom-right-radius: 4px; }

        .card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>

      <Footer />
    </>
  )
}

export default OurStory
