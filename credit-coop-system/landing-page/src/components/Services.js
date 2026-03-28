import React from 'react';
import './Services.css';
import moneyBagIcon from '../assets/icons/finance/money-bag-svgrepo-com.svg';
import motorcycleIcon from '../assets/icons/finance/scooter-line-svgrepo-com.svg';
import moneyfinance from '../assets/icons/finance/dollar-finance-money-20-svgrepo-com.svg';
import BusinessIcon from '../assets/icons/finance/business-building-svgrepo-com.svg';
import EducationIcon from '../assets/icons/finance/graduation-cap-svgrepo-com.svg';
import FarmIcon from '../assets/icons/finance/farm-wheat-svgrepo-com.svg';

const Services = () => {
  const services = [
    {
      icon: <img src={moneyBagIcon} alt="Salary Loan" />,
      title: 'Salary Loan',
      description: 'Quick cash advance against your salary for immediate financial needs and emergencies.',
      features: ['Fast approval', 'Competitive interest rates', 'Flexible payment terms']
    },
    {
      icon: <img src={motorcycleIcon} alt="Motorcycle Loan" />,
      title: 'Motorcycle Loan',
      description: 'Get your dream motorcycle with our affordable financing options for new and used bikes.',
      features: ['Low down payment', 'Up to 3 years to pay', 'Quick processing']
    },
    {
      icon: <img src={moneyfinance} alt="Personal Loan" />,
      title: 'Personal Loan',
      description: 'Flexible personal financing for various needs like home improvement, medical expenses, or special occasions.',
      features: ['No collateral required', 'Fixed interest rates', 'Same-day release']
    },
    {
      icon: <img src={BusinessIcon} alt="Business Loan" />,
      title: 'Business Loan',
      description: 'Fuel your business growth with our comprehensive business financing solutions and working capital loans.',
      features: ['Business expansion funding', 'Equipment financing', 'Working capital support']
    },
    {
      icon: <img src={EducationIcon} alt="Educational Loan" />,
      title: 'Educational Loan',
      description: 'Invest in your education with our student loan programs for tuition, books, and other school expenses.',
      features: ['Low interest rates', 'Deferred payment options', 'Covers all education levels']
    },
    {
      icon: <img src={FarmIcon} alt="Agricultural Loan" />,
      title: 'Agricultural Loan',
      description: 'Support your farming and agricultural ventures with specialized financing for crops, livestock, and equipment.',
      features: ['Seasonal payment terms', 'Crop insurance support', 'Farm equipment financing']
    }
  ];

  return (
    <section id="services" className="services">
      <div className="container">
        <div className="section-header">
          <h2>Our Services</h2>
          <p>Comprehensive financial solutions designed with your success in mind</p>
        </div>
        
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ul>
                {service.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
              <a href="#contact" className="service-link">Learn More</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
