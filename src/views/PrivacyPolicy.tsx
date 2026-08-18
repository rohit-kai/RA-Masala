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
      title: '1. Information We Collect',
      items: [
        'Personal details you provide at registration or checkout, such as your name, email address, phone number, shipping address, and payment details.',
        'Order history, wishlist, and browsing behaviour used to improve our services and recommend relevant products.',
        'Device and usage data (such as browser type, IP address, pages visited) collected automatically for analytics and security.'
      ]
    },
    {
      title: '2. How We Use Your Information',
      items: [
        'To process and deliver your orders, including order confirmations, invoices, and shipping updates.',
        'To provide customer support and respond to your queries and feedback.',
        'To personalise your shopping experience, send offers, and keep you informed about our products.',
        'To maintain security, prevent fraud, and comply with legal obligations.'
      ]
    },
    {
      title: '3. Sharing of Information',
      items: [
        'We never sell your personal information to third parties.',
        'Your information is shared only with trusted partners who help us operate our store (such as payment gateways, logistics partners, and hosting providers) under strict confidentiality.',
        'We may disclose information where required by law or to protect the rights and safety of RA Masala and its customers.'
      ]
    },
    {
      title: '4. Data Security',
      items: [
        'We use industry-standard security measures, including encryption, to protect your personal data during transmission and storage.',
        'Payment transactions are processed through secure, PCI-compliant payment gateways. We do not store your full card or payment credentials on our servers.'
      ]
    },
    {
      title: '5. Cookies',
      items: [
        'Our website uses cookies to remember your preferences, keep items in your cart, and improve performance.',
        'You can disable cookies in your browser settings; however, some features of the site may not work correctly without them.'
      ]
    },
    {
      title: '6. Your Rights',
      items: [
        'You may access, correct, or update your personal information anytime from your account.',
        'You may request deletion of your account and personal data by contacting us.',
        'You can opt out of promotional communications at any time.'
      ]
    },
    {
      title: '7. Terms & Conditions',
      items: [
        'All orders are subject to product availability. We reserve the right to cancel any order due to unavailability of stock or payment issues.',
        'Prices, taxes, and shipping charges are calculated at checkout and may change without prior notice.',
        'Product images are indicative; actual product colour, size, and packaging may vary slightly.',
        'Delivery timelines are estimates and may be affected by location, weather, or unforeseen circumstances.',
        'Returns and refunds are governed by our return policy. If you receive a damaged or incorrect product, contact us within 48 hours of delivery.',
        'Cash on Delivery (COD) orders are confirmed only after a successful verification call. We may cancel orders with repeated non-acceptance.'
      ]
    },
    {
      title: '8. Intellectual Property',
      items: [
        'All content on this website, including text, logos, images, and branding, is the property of RA Masala and may not be reproduced without permission.'
      ]
    },
    {
      title: '9. Changes to This Policy',
      items: [
        'We may update this Privacy Policy from time to time. Any changes will be posted on this page with the revised date.'
      ]
    },
    {
      title: '10. Contact Us',
      items: [
        'For any questions regarding this policy, your personal data, or our terms, please contact us at:',
        'Customer Care No: 7518166686',
        'Email: ramasale@ymail.com / RAMASALE.6686@GMAIL.COM'
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

      <Banner page={t('nav_contact')} path={[t('nav_home'), 'Privacy Policy']} />

      <div className="container py-5 flex-grow-1 position-relative" style={{ zIndex: 2 }}>
        <div className="traditional-pattern-overlay"></div>

        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
          <span className="text-uppercase fw-bold tracking-wider" style={{ color: '#D2691E', fontSize: '0.9rem', letterSpacing: '2px' }}>
            LEGAL
          </span>
          <h2 className="fw-bold mb-3 mt-2 display-6" style={{ color: '#4A1525', fontFamily: 'serif' }}>
            Privacy Policy & Terms & Conditions
          </h2>
          <p className="text-muted mb-4" style={{ lineHeight: '1.7' }}>
            This Privacy Policy and Terms & Conditions govern your use of the RA Masala website and the purchase of our products. By accessing our website or placing an order, you agree to the practices described below.
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
            Last updated: August 2026. RA Masala reserves the right to amend this policy at any time.
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
