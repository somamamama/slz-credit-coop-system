import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { getMenuItems } from '../utils/permissions';
import './Sidebar.css';
// SVG icons (SVGR) - map menu paths to these components below
import { ReactComponent as DashboardIcon } from '../pages/assets/dashboard-2-svgrepo-com.svg';
import { ReactComponent as UserIcon } from '../pages/assets/user-svgrepo-com.svg';
import { ReactComponent as ApplicationIcon } from '../pages/assets/clipboard-text-svgrepo-com.svg';
import { ReactComponent as BankIcon } from '../pages/assets/bank-svgrepo-com.svg';
import { ReactComponent as MoneyBagIcon } from '../pages/assets/money-bag-svgrepo-com.svg';
// loan page removed — LoanIcon import kept commented for history if needed
// import { ReactComponent as LoanIcon } from '../pages/assets/loan-round-svgrepo-com.svg';
import { ReactComponent as CheckIcon } from '../pages/assets/check-circle-svgrepo-com.svg';
import { ReactComponent as ReportsIcon } from '../pages/assets/reports-svgrepo-com.svg';

const Sidebar = () => {
  const { userRole, loading } = useUserRole();

  // Get menu items based on user role
  const menuItems = userRole ? getMenuItems(userRole) : [];

  // Map route paths to icon components. If a path isn't mapped we fall back to the
  // existing `item.icon` value (emoji or text) so this change is low-risk.
  const iconMap = {
    '/dashboard': DashboardIcon,
    '/members': UserIcon,
    '/membership-applications': ApplicationIcon,
    '/savings-setup': BankIcon,
    '/loan-amounts': MoneyBagIcon,
  '/reports': ReportsIcon,
    '/loan-approval': CheckIcon,
    '/loan-applications': ApplicationIcon,
  '/loan-review': ApplicationIcon,
    '/loans-verified': CheckIcon,
    '/create-invoice': ApplicationIcon,
    '/user-management': UserIcon,
    '/credit-investigator': CheckIcon
  };

  if (loading) {
    return (
      <aside className="sidebar">
        <div className="sidebar-loading">
          <div className="spinner"></div>
          <p>Loading menu...</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-title">Main Menu</h3>
          <div className="user-role-indicator">
            <span className="role-badge">{userRole?.replace('_', ' ').toUpperCase()}</span>
          </div>
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={() => {
                    try {
                      // close the sidebar if it was opened via the header hamburger
                      document.body.classList.remove('sidebar-open');
                    } catch (e) {
                      // ignore when running in non-browser environments
                    }
                  }}
                >
                  {/* prefer SVG component when available, otherwise render the existing icon value */}
                  {(() => {
                    const IconComp = iconMap[item.path];
                    return IconComp ? (
                      <IconComp className="sidebar-icon" />
                    ) : (
                      <span className="nav-icon">{item.icon}</span>
                    );
                  })()}
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
