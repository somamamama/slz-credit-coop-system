import React, { useEffect } from 'react';
import './Hero.css';
import moneyBagIcon from '../assets/icons/finance/money-bag-svgrepo-com.svg';
import houseIcon from '../assets/icons/finance/house-svgrepo-com.svg';
import investmentIcon from '../assets/icons/finance/investment-account-svgrepo-com.svg';
import lockIcon from '../assets/icons/finance/lock-svgrepo-com.svg';
import lightningIcon from '../assets/icons/finance/lightning-svgrepo-com.svg';
import digitalIcon from '../assets/icons/finance/digital-content-content-read-look-at-pictures-svgrepo-com.svg';

const Hero = () => {
  useEffect(() => {
    const elems = document.querySelectorAll('.fade-up');
    if (!elems || elems.length === 0) return;

    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elems.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="hero-pattern"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-text">Trusted by 1000+ Members</span>
            </div>
            
            <h1 className="hero-title">
              Nakatulong kana, 
              <span className="text-primary"> Kumita ka pa!</span>
            </h1>
            
            <p className="hero-description">
              Our goal is to help improve the quality of life of its members and thereby contribute to inclusive growth and enterprise development.
            </p>
            
            <div className="hero-buttons">
              <a href="#membership" className="btn btn-primary btn-lg">
                <span>Become a Member</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a href="#services" className="btn btn-secondary btn-lg">
                Explore Services
              </a>
            </div>
            
            <div className="hero-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <img src={lockIcon} alt="PDIC Insured" />
                </div>
                <span>PDIC Insured</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <img src={lightningIcon} alt="Instant Processing" />
                </div>
                <span>Instant Processing</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <img src={digitalIcon} alt="Digital Banking" />
                </div>
                <span>Digital Banking</span>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-cards">
              <div className="hero-card card-savings fade-up">
                <div className="card-header">
                  <div className="card-icon">
                    <img src={moneyBagIcon} alt="Savings Account" />
                  </div>
                  <h4>Savings Account</h4>
                </div>
                <div className="card-amount">₱125,000.00</div>
                <div className="card-growth">+5.2% this month</div>
              </div>
              
              <div className="hero-card card-loan fade-up">
                <div className="card-header">
                  <div className="card-icon">
                    <img src={houseIcon} alt="Home Loan" />
                  </div>
                  <h4>Home Loan</h4>
                </div>
                <div className="card-rate">3.5% APR</div>
                <div className="card-term">Up to 30 years</div>
              </div>
              
              <div className="hero-card card-investment fade-up">
                <div className="card-header">
                  <div className="card-icon">
                    <img src={investmentIcon} alt="Investment" />
                  </div>
                  <h4>Investment</h4>
                </div>
                <div className="card-amount">₱50,000.00</div>
                <div className="card-growth">+12.8% annually</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-stats">
          <div className="stats-grid">
            <div className="stat-item fade-up">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Active Members</div>
            </div>
            <div className="stat-item fade-up">
              <div className="stat-number">3+</div>
              <div className="stat-label">Years of Service</div>
            </div>
            <div className="stat-item fade-up">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;