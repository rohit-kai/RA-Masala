import React from 'react';
import Header from './includes/Header';
import Banner from '../components/Banner';
import Footer from './includes/Footer';
import { useLanguage } from '../context/LanguageContext';
import { getAssetPath } from '../Utils/imageHelper';

const PrivacyPolicy: React.FC = () => {
  const { t } = useLanguage();

  const sections = [
    {
      title: t('pol_s1_title'),
      items: [
        t('pol_s1_item1'),
        t('pol_s1_item2'),
        t('pol_s1_item3')
      ]
    },
    {
      title: t('pol_s2_title'),
      items: [
        t('pol_s2_item1'),
        t('pol_s2_item2'),
        t('pol_s2_item3'),
        t('pol_s2_item4')
      ]
    },
    {
      title: t('pol_s3_title'),
      items: [
        t('pol_s3_item1'),
        t('pol_s3_item2'),
        t('pol_s3_item3')
      ]
    },
    {
      title: t('pol_s4_title'),
      items: [
        t('pol_s4_item1'),
        t('pol_s4_item2')
      ]
    },
    {
      title: t('pol_s5_title'),
      items: [
        t('pol_s5_item1'),
        t('pol_s5_item2')
      ]
    },
    {
      title: t('pol_s6_title'),
      items: [
        t('pol_s6_item1'),
        t('pol_s6_item2'),
        t('pol_s6_item3')
      ]
    },
    {
      title: t('pol_s7_title'),
      items: [
        t('pol_s7_item1'),
        t('pol_s7_item2'),
        t('pol_s7_item3'),
        t('pol_s7_item4'),
        t('pol_s7_item5'),
        t('pol_s7_item6')
      ]
    },
    {
      title: t('pol_s8_title'),
      items: [
        t('pol_s8_item1')
      ]
    },
    {
      title: t('pol_s9_title'),
      items: [
        t('pol_s9_item1')
      ]
    },
    {
      title: t('pol_s10_title'),
      items: [
        t('pol_s10_item1'),
        t('pol_s10_item2'),
        t('pol_s10_item3')
      ]
    }
  ];

  return (
    <div style={{
      backgroundImage: `linear-gradient(rgba(253, 246, 237, 0.85), rgba(253, 246, 237, 0.85)), url('${getAssetPath('images/sp2.png')}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />

      <Banner page={t('nav_contact')} path={[t('nav_home'), t('pol_banner_title')]} />

      <div className="container py-5 flex-grow-1 position-relative" style={{ zIndex: 2 }}>
        <div className="traditional-pattern-overlay"></div>

        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
          <span className="text-uppercase fw-bold tracking-wider" style={{ color: '#D2691E', fontSize: '0.9rem', letterSpacing: '2px' }}>
            {t('pol_legal_tag')}
          </span>
          <h2 className="fw-bold mb-3 mt-2 display-6" style={{ color: '#4A1525', fontFamily: 'serif' }}>
            {t('pol_title')}
          </h2>
          <p className="text-muted mb-4" style={{ lineHeight: '1.7' }}>
            {t('pol_intro')}
          </p>

          {sections.map((section) => (
            <div className="mb-4" key={section.title}>
              <h5 className="fw-bold mb-2" style={{ color: '#4A1525', fontFamily: 'serif' }}>{section.title}</h5>
              <ul className="text-muted mb-0" style={{ lineHeight: '1.8' }}>
                {section.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}

          <p className="text-muted small border-top pt-3 mb-0" style={{ fontStyle: 'italic' }}>
            {t('pol_last_updated')}
          </p>
        </div>
      </div>

      <style>{`
        .traditional-pattern-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.04;
          background-image: radial-gradient(#4A1525 1.5px, transparent 0);
          background-size: 24px 24px;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
