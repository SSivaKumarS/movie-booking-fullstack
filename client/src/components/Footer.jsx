import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import '../styles/Footer.css';
import logoIcon from '../../icon.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img src={logoIcon} alt="CinePlus+ Logo" style={{ height: '160px', marginTop: '-80px', marginBottom: '-70px', marginLeft: '-10px' }} />
          <p>Your Ultimate Movie Experience</p>
        </div>
        
        <div className="social-links">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FaFacebook className="social-icon" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <FaTwitter className="social-icon" />
          </a>
          <a href="https://www.instagram.com/____agk____/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FaInstagram className="social-icon" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <FaYoutube className="social-icon" />
          </a>
        </div>
      </div>  
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Xavier. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 