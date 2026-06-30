import React from 'react';
import { Link } from 'react-router-dom';
import RoutePaths from '../config';
import { useLanguage } from '../context/LanguageContext';
import { getAssetPath } from '../Utils/imageHelper';

const Welcome: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="welcome-container">
      {/* Layer 1: Background Wood Image */}
      <img 
        src={getAssetPath('img/welcome_bg.png')} 
        className="welcome-bg-image" 
        alt="Rustic Wooden Kitchen Background" 
      />
      <div className="welcome-bg-overlay"></div>
      <div className="welcome-center-glow"></div>

      {/* Layer 2: Corner Mandalas */}
      <div className="welcome-mandala-tl"></div>
      <div className="welcome-mandala-tr"></div>


      {/* Layer 4: Central Spice Whirl and Golden Emblem */}
      <div className="welcome-center-stage animate__animated animate__zoomIn">
        <div className="welcome-emblem-container">
          <img 
            src={getAssetPath('img/welcome_central.png')} 
            className="welcome-emblem-image" 
            alt="Golden Swirling Spices Emblem" 
          />
          
          <div className="welcome-brand-content">
            <span className="welcome-brand-subtitle">{t('welcome_subtitle')}</span>
            <h1 className="welcome-brand-title">{t('welcome_title')}</h1>
            
            {/* Transparent Company Logo Image */}
            <img 
              src={getAssetPath('img/welcome_logo.png')} 
              className="welcome-brand-logo-img img-fluid" 
              alt="RA Masale Pvt. Ltd. Logo" 
              style={{ maxHeight: '160px', marginTop: '15px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
            />
          </div>
        </div>
      </div>

      {/* Layer 5 & 8: Centered Bottom Spices Bags & Caption Wrapper */}
      <div className="welcome-bottom-section">
        <img 
          src={getAssetPath('img/welcome_bags.png')} 
          className="welcome-bags-foreground animate__animated animate__fadeInUp" 
          alt="Burlap bags filled with spices" 
        />
        <div className="welcome-bottom-caption animate__animated animate__pulse animate__infinite">
          {t('welcome_caption')}
        </div>
      </div>

      {/* Layer 6: Traditional Indian Brass Lamp (Diya) with slow fade-in */}
      <img 
        src={getAssetPath('img/welcome_lamp.png')} 
        className="welcome-lamp-foreground" 
        alt="Flickering Brass Lamp" 
      />

      {/* Layer 7: Interactive Actions Overlay (Enter Store Button Only) */}
      <div className="welcome-actions-overlay animate__animated animate__fadeInUp animate__delay-1s">
        <Link to={RoutePaths.home} className="welcome-cta-btn">
          <span>{t('welcome_enter')}</span>
          <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
};

export default Welcome;