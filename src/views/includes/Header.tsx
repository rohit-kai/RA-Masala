import React, { FC, useState } from 'react'
import { Link } from 'react-router-dom'
import { SocialsNetworks } from '../../components/SocialsNetworks'
import Lang from '../../components/Lang'
import RoutePaths from '../../config'
import { toggleLinkClass } from '../../Utils/Generals'
import { useLanguage } from '../../context/LanguageContext'
import { getAssetPath } from '../../Utils/imageHelper'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'

const Header: FC = () => {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const { t } = useLanguage();
    const { cartCount } = useCart();
    const { user } = useAuth();
    const { wishlistItems } = useWishlist();

    const isSuperAdmin = user?.role === 'admin' && user?.email !== 'admin@ramasala.com';

    const navsBar = [
        { path: RoutePaths.home, name: t('nav_home') },
        { path: RoutePaths.ourstory, name: t('nav_our_story') },
        { path: RoutePaths.brands, name: t('nav_brands') },
        { path: RoutePaths.contact, name: t('nav_contact') },
    ];

    if (isSuperAdmin) {
        navsBar.push({ path: RoutePaths.recipes, name: 'RECIPES' });
    }

    navsBar.push(
        { path: RoutePaths.wishlist, name: `WISHLIST (${wishlistItems.length})` },
        { path: RoutePaths.cart, name: `CART (${cartCount})` },
        {
            path: user ? RoutePaths.userAccount : RoutePaths.login,
            name: user ? `${user.name.split(' ')[0]}` : '👤 LOGIN'
        }
    );

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    return (
        <>
            {/* Main Header Container */}
            <div className="header sticky-top shadow-lg traditional-header-entry" style={{ backgroundColor: '#fff', borderBottom: '4px solid #FFB300' }}>

                {/* Top Info Bar */}
                <div className="d-lg-flex justify-content-between px-3 py-2 px-lg-5 position-relative"
                    style={{ backgroundColor: '#4A1525', color: '#FDF6ED', fontSize: '0.88rem', borderBottom: '2px solid #FFB300', zIndex: 10 }}>

                    <div className="indian-cultural-overlay"></div>

                    <div className="d-flex header-contacts d-none d-lg-block gap-4 position-relative" style={{ zIndex: 2, fontFamily: 'serif' }}>
                        <span className="me-2">
                            <i className='bi bi-envelope-fill traditional-gold-glow' style={{ color: '#FFB300' }}></i>
                            &nbsp;&nbsp;{t('header_contact')}
                        </span>
                        <span>
                            <i className="bi bi-shop traditional-gold-glow" style={{ color: '#FFB300' }}></i>
                            &nbsp;&nbsp;{t('header_subtitle')}
                        </span>
                    </div>
                    <div className='d-flex justify-content-between header-socials-lang align-items-center gap-3 position-relative' style={{ zIndex: 2 }}>
                        <SocialsNetworks />
                        <span style={{ color: '#FFB300', opacity: 0.6 }}>|</span>
                        <Lang />
                    </div>
                </div>

                {/* Primary Navigation Bar: Vermilion Red Spices Gradient with Pattern overlay */}
                <div className="navigation d-flex flex-wrap justify-content-between px-3 px-lg-5 py-3 align-items-center position-relative"
                    style={{ background: 'linear-gradient(90deg, #800c1e 0%, #aa1a31 50%, #800c1e 100%)' }}>

                    <div className="indian-cultural-overlay-nav"></div>

                    <nav className='navbar col-12 navbar-expand-xl p-0' style={{ zIndex: 2 }}>
                        <div className="d-flex justify-content-between align-items-center w-100">
                            {/* Brand Logo */}
                            <Link to={RoutePaths.home} className='navbar-brand d-flex align-items-center traditional-logo-wrapper me-4'>
                                <img src={getAssetPath('images/ra_waa.png')} alt="RA Masala Logo" style={{ maxHeight: '75px', objectFit: 'contain', filter: 'drop-shadow(0px 6px 12px rgba(0,0,0,0.3))' }} />
                            </Link>

                            {/* Toggler Button - Hidden on desktop */}
                            <button
                                className="navbar-toggler traditional-toggler-btn d-xl-none"
                                onClick={toggleNav}
                                aria-expanded={isNavOpen}
                                style={{
                                    border: '2px solid #FFD700',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                <span className="navbar-icon-toggler">
                                    <i className={`bi ${isNavOpen ? 'bi-x-lg' : 'bi-list'} fs-2`} style={{ color: '#FFD700' }}></i>
                                </span>
                            </button>
                        </div>

                        {/* Navigation Links - Always in one line on desktop */}
                        <div className={`${isNavOpen ? 'd-block animate__animated animate__fadeInDown' : 'd-none d-xl-block'} w-100 mt-3 mt-xl-0`}>
                            <ul className="navbar-nav d-xl-flex gap-2 gap-xxl-3 traditional-navbar-nav">
                                {navsBar.map((link) => {
                                    const isActive = toggleLinkClass(link.path, 'active');
                                    return (
                                        <li key={link.name} className="navbar-item" style={{
                                            padding: '0',
                                            borderBottom: 'none',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <Link
                                                to={link.path}
                                                className="navbar-link text-decoration-none fw-bold text-uppercase tracking-wider traditional-nav-item"
                                                onClick={() => setIsNavOpen(false)}
                                                style={{
                                                    color: isActive ? '#FFD700' : '#FFFFFF',
                                                    position: 'relative',
                                                    paddingBottom: '6px',
                                                    fontSize: '0.88rem',
                                                    letterSpacing: '0.75px',
                                                    display: 'inline-block',
                                                    padding: '6px 12px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {link.name}
                                                <span className={`traditional-nav-line ${isActive ? 'active-line' : ''}`}></span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </nav>
                </div>
            </div>

            {/* CSS Customizations */}
            <style>{`
                @keyframes culturalSlideDown {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes brassGlow {
                    0% { text-shadow: 0 0 2px rgba(255,179,0,0.4); }
                    50% { text-shadow: 0 0 12px rgba(255,179,0,0.9); }
                    100% { text-shadow: 0 0 2px rgba(255,179,0,0.4); }
                }
                
                .traditional-header-entry {
                    animation: culturalSlideDown 0.6s cubic-bezier(0.19, 1, 0.22, 1) both;
                }

                .indian-cultural-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    opacity: 0.12;
                    background-image: radial-gradient(#FFB300 0.8px, transparent 0);
                    background-size: 12px 12px;
                    pointer-events: none;
                }

                .indian-cultural-overlay-nav {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    opacity: 0.06;
                    background-image: radial-gradient(#FFD700 0.8px, transparent 0);
                    background-size: 16px 16px;
                    pointer-events: none;
                    z-index: 1;
                }

                .traditional-gold-glow {
                    animation: brassGlow 2.5s ease-in-out infinite;
                }

                .traditional-logo-wrapper {
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .traditional-logo-wrapper:hover {
                    transform: scale(1.08) rotate(1deg);
                }

                .traditional-nav-line {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
                    border-radius: 4px;
                    transition: width 0.35s cubic-bezier(0.25, 1, 0.5, 1), left 0.35s cubic-bezier(0.25, 1, 0.5, 1);
                }
                .traditional-nav-item:hover .traditional-nav-line {
                    width: 100%;
                    left: 0;
                }
                .active-line {
                    width: 100% !important;
                    left: 0 !important;
                }
                
                .traditional-nav-item {
                    transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                .traditional-nav-item:hover {
                    color: #FFD700 !important;
                    transform: translateY(-2px);
                }

                .traditional-toggler-btn {
                    transition: all 0.25s ease;
                }
                .traditional-toggler-btn:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                }
                .traditional-toggler-btn:focus {
                    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.4);
                }

                .traditional-navbar-nav {
                    flex-direction: row;
                    flex-wrap: nowrap;
                    align-items: center;
                    justify-content: flex-start;
                }

                /* Mobile responsiveness */
                @media (max-width: 1199.98px) {
                    .traditional-navbar-nav {
                        flex-direction: column !important;
                        flex-wrap: wrap !important;
                        align-items: center !important;
                        width: 100%;
                        background: rgba(74, 21, 37, 0.98);
                        backdrop-filter: blur(10px);
                        border: 2px solid #FFD700;
                        border-radius: 12px;
                        padding: 15px !important;
                        margin-top: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
                    }
                    .navbar-nav {
                        flex-direction: column !important;
                        padding: 5px 0;
                    }
                    .navbar-item {
                        width: 100%;
                        text-align: center;
                    }
                    .traditional-nav-item {
                        display: inline-block !important;
                        padding: 10px 20px !important;
                        font-size: 1rem !important;
                        width: 100%;
                    }
                    .traditional-nav-line {
                        bottom: 4px;
                    }
                }
            `}</style>
        </>
    )
}

export default Header