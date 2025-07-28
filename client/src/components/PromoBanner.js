import React from 'react';
import { Link } from 'react-router-dom';
import './PromoBanner.css';

// Component ab 'banner' naam ka prop le raha hai
const PromoBanner = ({ banner }) => {
  // Agar kisi wajah se banner ka data na ho to kuch bhi render na karo
  if (!banner) {
    return null;
  }

  return (
    <div className="promo-banner-container">
      <div className="promo-banner-content">
        {/* Hardcoded text ki jagah 'banner' prop se data dikhaya ja raha hai */}
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