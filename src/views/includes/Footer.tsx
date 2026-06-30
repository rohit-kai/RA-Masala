import React, { FC } from 'react'
import { SocialsNetworks } from '../../components/SocialsNetworks'
import { Link } from 'react-router-dom'
import RoutePaths from '../../config'
import { useLanguage } from '../../context/LanguageContext'
import { getAssetPath } from '../../Utils/imageHelper'

const Footer: FC = () => {
    // Current year calculation for copyright signature
    const currentYear = new Date().getFullYear();
    const { t } = useLanguage();

    const blends = ["Garam Masala", "Kanda Lasun Masala", "Ghoti Misal Masala", "Malvani Spice Mix", "Biryani Masala"];
    const powders = ["Turmeric Powder", "Kashmiri Red Chilli Mix", "Coriander Powder", "Cumin Powder"];

    return (
        <footer className='mt-5 text-white position-relative overflow-hidden' style={{ borderTop: '5px solid #FFD700' }}>
            
            {/* Main Premium Traditional Container with Background Image Only */}
            <div 
                className='footer-content px-3 px-lg-5 py-5 position-relative' 
                style={{ 
                    backgroundImage: `url(${getAssetPath('images/sp4.jpg')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                {/* Dark rich red-maroon overlay for brand alignment & readability */}
                <div className="footer-bg-overlay" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(42, 6, 15, 0.65), rgba(20, 2, 6, 0.82))',
                    zIndex: 1
                }}></div>
                
                {/* Cultural overlay grid background matching the header layout */}
                <div className="traditional-footer-overlay"></div>

                <div className="container-fluid position-relative p-0" style={{ zIndex: 3 }}>
                    
                    {/* Ornamental Gold Divider Line */}
                    <div className="text-center mb-4">
                        <div className="traditional-mandala-divider"></div>
                    </div>

                    {/* Adjusted Grid from row-cols-lg-5 to a well-balanced row-cols-lg-3 */}
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4 justify-content-between">
                        
                        {/* Column 1: Brand Info & Contacts */}
                        <div className="col">
                            <h5 className="fw-bold mb-4 text-uppercase border-bottom pb-2 position-relative d-inline-block" style={{ color: '#FFD700', letterSpacing: '1px' }}>
                                {t('footer_address_title')}
                                <span className="title-underline"></span>
                            </h5>
                            <div className="d-flex flex-column gap-3 opacity-90 custom-footer-links">
                                <div className="d-flex align-items-start">
                                    <i className="bi bi-geo-alt-fill me-2 fs-5" style={{ color: '#FFD700' }}></i>
                                    <span>{t('footer_address')}</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-telephone-fill me-2 fs-5" style={{ color: '#FFD700' }}></i>
                                    <span>+91 98765 43210</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-envelope-fill me-2 fs-5" style={{ color: '#FFD700' }}></i>
                                    <span>contact@ramasala.com</span>
                                </div>
                            </div>
                            <div className="mt-4 traditional-social-wrapper">
                                <SocialsNetworks />
                            </div>
                        </div>

                        {/* Column 2: Information links */}
                        <div className="col">
                            <h5 className="fw-bold mb-4 text-uppercase border-bottom pb-2 position-relative d-inline-block" style={{ color: '#FFD700', letterSpacing: '1px' }}>
                                {t('footer_info_title')}
                                <span className="title-underline"></span>
                            </h5>
                            <div className="d-flex flex-column gap-2 custom-footer-links">
                                <Link to={RoutePaths.home} className="text-white text-decoration-none py-1">{t('nav_home')}</Link>
                                <Link to={RoutePaths.ourstory} className="text-white text-decoration-none py-1">{t('nav_our_story')}</Link>
                                <Link to={RoutePaths.brands} className="text-white text-decoration-none py-1">{t('nav_brands')}</Link>
                                <a href="#" className="text-white text-decoration-none py-1">Privacy Policy</a>
                                <a href="#" className="text-white text-decoration-none py-1">Help Center</a>
                                <a href="#" className="text-white text-decoration-none py-1">Quality Assurance Policy</a>
                            </div>
                        </div>

                        {/* Column 3: Spice Highlights */}
                        <div className="col">
                            <h5 className="fw-bold mb-4 text-uppercase border-bottom pb-2 position-relative d-inline-block" style={{ color: '#FFD700', letterSpacing: '1px' }}>
                                {t('footer_promise_title')}
                                <span className="title-underline"></span>
                            </h5>
                            <p className="small lh-lg text-light opacity-90" style={{ fontFamily: 'serif', fontSize: '1.02rem' }}>
                                {t('footer_promise')}
                            </p>
                        </div>

                    </div>

                    {/* Spice Category Fast Navigation Badges (Pills) */}
                    <div className='my-4'>
                        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                            <h6 className='fw-bold mb-0 text-uppercase me-2' style={{ color: '#FFD700', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Authentic Blends:</h6>
                            <div className='d-flex flex-wrap gap-1'>
                                {blends.map((item, idx) => (
                                    <span key={idx} className="spice-tag">{item}</span>
                                ))}
                            </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <h6 className='fw-bold mb-0 text-uppercase me-2' style={{ color: '#FFD700', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Pure Powders:</h6>
                            <div className='d-flex flex-wrap gap-1'>
                                {powders.map((item, idx) => (
                                    <span key={idx} className="spice-tag">{item}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <hr style={{ backgroundColor: '#FFD700', height: '2px', opacity: 0.4 }} />
                    
                    {/* Footnote details */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-2">
                        <p className="mb-0 small opacity-90 text-white">
                            Copyright &copy; {currentYear} By <span className='fw-bold' style={{ color: '#FFD700' }}>RA Masala</span>. {t('footer_copyright')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Interactive Local Scoped CSS Styling */}
            <style>{`
                .traditional-footer-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    opacity: 0.08;
                    background-image: radial-gradient(#FFFFFF 0.8px, transparent 0);
                    background-size: 16px 16px;
                    pointer-events: none;
                    z-index: 2;
                }
                .custom-footer-links a {
                    transition: all 0.3s ease-in-out;
                    opacity: 0.88;
                    display: inline-block;
                }
                .custom-footer-links a:hover {
                    color: #FFD700 !important;
                    transform: translateX(6px);
                    opacity: 1;
                }
                
                .spice-tag {
                    display: inline-block;
                    color: #FFFFFF;
                    background-color: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 215, 0, 0.2);
                    padding: 4px 12px;
                    font-size: 0.8rem;
                    border-radius: 20px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .spice-tag:hover {
                    background-color: #FFD700;
                    color: #4A1525;
                    border-color: #FFD700;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
                }

                .title-underline {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 30px;
                    height: 2px;
                    background-color: #FFD700;
                }

                .traditional-mandala-divider {
                    display: inline-block;
                    width: 120px;
                    height: 12px;
                    background: radial-gradient(circle, #FFD700 3px, transparent 4px);
                    background-size: 12px 12px;
                    position: relative;
                }
                .traditional-mandala-divider::before,
                .traditional-mandala-divider::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    width: 50px;
                    height: 1px;
                    background: linear-gradient(to right, transparent, #FFD700);
                }
                .traditional-mandala-divider::before { right: 100%; }
                .traditional-mandala-divider::after { left: 100%; transform: scaleX(-1); }

                /* Social Network Override helper inside Red context */
                .traditional-social-wrapper a {
                    background-color: #FFFFFF !important;
                    color: #FF0000 !important;
                    transition: transform 0.25s ease, background-color 0.25s ease;
                }
                .traditional-social-wrapper a:hover {
                    transform: scale(1.15) rotate(5deg);
                    background-color: #4A1525 !important;
                    color: #FFD700 !important;
                }

                /* Background image animation */
                .footer-content {
                    position: relative;
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                }

                /* Add a subtle zoom animation on the background */
                @keyframes subtleZoom {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                .footer-content::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: url('images/f1.png');
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                    animation: subtleZoom 20s ease-in-out infinite;
                    z-index: 0;
                    opacity: 1;
                }
            `}</style>
        </footer>
    )
}

export default Footer