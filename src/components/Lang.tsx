import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { Language } from '../config/translation'

const Lang = () => {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getLangLabel = () => {
        if (language === 'mr') return 'मराठी';
        if (language === 'kn') return 'ಕನ್ನಡ';
        if (language === 'hi') return 'हिंदी';
        return 'English';
    };

    const handleLangChange = (e: React.MouseEvent, lang: Language) => {
        e.preventDefault();
        setLanguage(lang);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className='lang-selector' ref={containerRef}>
            <span className='current-lang' onClick={toggleDropdown}>
                <i className="bi bi-translate traditional-gold-glow" style={{ color: '#FFB300' }}></i>
                {getLangLabel()}
                <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.75rem', color: '#FFB300' }}></i>
            </span>
            <div className={`lang-dropdown animate__animated animate__fadeIn ${isOpen ? 'show' : ''}`}>
                <a href="#" className="lang-option" onClick={(e) => handleLangChange(e, 'en')}>English</a>
                <a href="#" className="lang-option" onClick={(e) => handleLangChange(e, 'mr')}>मराठी (Marathi)</a>
                <a href="#" className="lang-option" onClick={(e) => handleLangChange(e, 'kn')}>ಕನ್ನಡ (Kannada)</a>
                <a href="#" className="lang-option" onClick={(e) => handleLangChange(e, 'hi')}>हिंदी (Hindi)</a>
            </div>

            <style>{`
                .lang-selector {
                    position: relative;
                    display: inline-block;
                    cursor: pointer;
                    z-index: 9999;
                }
                .current-lang {
                    color: #FDF6ED;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }
                .lang-selector:hover .current-lang,
                .current-lang:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: #FFD700;
                }
                .lang-dropdown {
                    display: none;
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background-color: #ffffff;
                    min-width: 160px;
                    box-shadow: 0px 8px 24px rgba(0,0,0,0.15);
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid #FFB300;
                    margin-top: 6px;
                    animation-duration: 0.25s;
                }
                .lang-dropdown.show {
                    display: block;
                }
                .lang-dropdown::before {
                    content: '';
                    position: absolute;
                    top: -10px;
                    left: 0;
                    right: 0;
                    height: 10px;
                    background: transparent;
                }
                .lang-option {
                    color: #4A1525 !important;
                    padding: 10px 16px;
                    text-decoration: none;
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-align: left;
                    transition: all 0.25s ease;
                }
                .lang-option:hover {
                    background-color: #4A1525 !important;
                    color: #FFD700 !important;
                    padding-left: 20px;
                }
            `}</style>
        </div>
    )
}

export default Lang