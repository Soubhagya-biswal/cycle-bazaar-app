import React from 'react';
import { Link } from 'react-router-dom';
import './PromoBanner.css';


const PromoBanner = ({ banner }) => {
  
  if (!banner) {
    return null;
  }

  return (
    <div className="promo-banner-container">
      <div className="promo-banner-content">

        <h1>{banner.bannerTitle}</h1>
        <p>{banner.bannerText}</p>
        <div className="promo-code-box">
          {banner.code}
        </div>
        <Link to="/cart" className="promo-banner-button">
          Shop Now
        </Link>
      </div>
    </div>
  );
};

export default PromoBanner;
