// Role-based permissions configuration
export const PERMISSIONS = {
  // Admin permissions - limited to member management and reports
  admin: {
    allowedRoutes: ['/dashboard', '/members', '/reports', '/membership-applications', '/loan-amounts', '/savings-setup'],
    menuItems: [
      {
        path: '/dashboard',
        icon: '📊',
        label: 'Dashboard',
        description: 'Admin Overview'
      },
      {
        path: '/members',
        icon: '👥',
        label: 'Members',
        description: 'Member Management'
      },
      {
        path: '/membership-applications',
        icon: '📝',
        label: 'Applications',
        description: 'Membership Applications'
      },
      {
        path: '/savings-setup',
        icon: '🏦',
        label: 'Savings',
        description: 'Setup Member Savings'
      },
      {
        path: '/loan-amounts',
        icon: '🏦',
        label: 'Loan Amounts',
        description: 'Assign Loan Amounts'
      },
      {
        path: '/reports',
        icon: '📈',
        label: 'Reports', 
        description: 'System Reports'
      }
    ]
  },

  // Manager permissions - access to most features except IT functions
  manager: {
  allowedRoutes: ['/dashboard', '/members', '/reports', '/loan-approval', '/membership-applications'],
    menuItems: [
      {
        path: '/dashboard',
        icon: '📊',
        label: 'Dashboard',
        description: 'Manager Overview'
      },
      {
        path: '/members',
        icon: '👥',
        label: 'Members',
        description: 'Member Management'
      },
      {
        path: '/membership-applications',
        icon: '📝',
        label: 'Applications',
        description: 'Membership Applications'
      },
      
      {
        path: '/loan-approval',
        icon: '✅',
        label: 'Loan Approval',
        description: 'Approve/Reject Loans'
      },
      
      {
        path: '/reports',
        icon: '📈',
        label: 'Reports',
        description: 'Financial Reports'
      }
    ]
  },

  // Loan Officer permissions - focused only on loan applications and verification
  loan_officer: {
    allowedRoutes: ['/dashboard', '/loan-applications', '/loans-verified', '/loan-review'],
    menuItems: [
      {
        path: '/dashboard',
        icon: '📊',
        label: 'Dashboard',
        description: 'Loan Officer View'
      },
      {
        path: '/loan-applications',
        icon: '📋',
        label: 'Loan Applications',
        description: 'View All Applications'
      },
      {
        path: '/loan-review',
        icon: '🔍',
        label: 'Loan Review',
        description: 'Review & Process Applications'
      },
      {
        path: '/loans-verified',
        icon: '✅',
        label: 'Loans Verified',
        description: 'Manage Approved Loans'
      }
    ]
  },

  // Cashier permissions - transactions and basic member info
  cashier: {
    allowedRoutes: ['/dashboard', '/members', '/create-invoice', '/savings-setup'],
    menuItems: [
      {
        path: '/dashboard',
        icon: '📊',
        label: 'Dashboard',
        description: 'Cashier Overview'
      },
      {
        path: '/members',
        icon: '👥',
        label: 'Members',
        description: 'Member Lookup'
      },
      
      {
        path: '/savings-setup',
        icon: '🏦',
        label: 'Savings',
        description: 'Setup Member Savings'
      },
      
      {
        path: '/create-invoice',
        icon: '🧾',
        label: 'Create Invoice',
        description: 'Issue and print invoices'
      }
    ]
  },

  // IT Admin permissions - system management and settings
  it_admin: {
    allowedRoutes: ['/dashboard', '/members', '/reports', '/settings', '/user-management', '/import', '/membership-applications'],
    menuItems: [
      {
        path: '/dashboard',
        icon: '📊',
        label: 'Dashboard',
        description: 'System Overview'
      },
      {
        path: '/members',
        icon: '👥',
        label: 'User Management',
        description: 'Staff & Members'
      },
      {
        path: '/membership-applications',
        icon: '📝',
        label: 'Applications',
        description: 'Membership Applications'
      },
      {
        path: '/reports',
        icon: '📈',
        label: 'System Reports',
        description: 'Usage & Performance'
      },
      {
        path: '/settings',
        icon: '⚙️',
        label: 'Settings',
        description: 'System Configuration'
      },
      {
        path: '/user-management',
        icon: '🛂',
        label: 'User Management',
        description: 'Create Member Accounts'
      },
      {
        path: '/import',
        icon: '📥',
        label: 'Import Members',
        description: 'Import Member Data'
      }
    ]
  },

  // Credit Investigator permissions - review loan applications
  credit_investigator: {
    allowedRoutes: ['/credit-investigator'],
    menuItems: [
      {
        path: '/credit-investigator',
        icon: '🕵️',
        label: 'Credit Investigator',
        description: 'Review Loan Applications'
      }
    ]
  }
};

// Helper function to check if user has permission for a route
export const hasPermission = (userRole, route) => {
  if (!userRole) return false;
  // normalize role (case-insensitive, allow variants like 'Administrator' or 'ADMIN')
  const normalized = normalizeRole(userRole);
  if (!PERMISSIONS[normalized]) return false;
  return PERMISSIONS[normalized].allowedRoutes.includes(route);
};

// Helper function to get menu items for a role
export const getMenuItems = (userRole) => {
  if (!userRole) return [];
  const normalized = normalizeRole(userRole);
  if (!PERMISSIONS[normalized]) return [];
  return PERMISSIONS[normalized].menuItems;
};

// Helper function to get allowed routes for a role
export const getAllowedRoutes = (userRole) => {
  if (!userRole) return [];
  const normalized = normalizeRole(userRole);
  if (!PERMISSIONS[normalized]) return [];
  return PERMISSIONS[normalized].allowedRoutes;
};

// Normalize role string to match keys in PERMISSIONS
function normalizeRole(role) {
  if (!role) return '';
  const r = String(role).trim().toLowerCase();
  // common mappings
  if (r === 'administrator' || r === 'admin' || r === 'administrator_role' || r === 'administrator_role') return 'admin';
  if (r === 'staff') return 'admin';
  if (r === 'it admin' || r === 'it_admin' || r === 'it-admin') return 'it_admin';
  if (r === 'loan officer' || r === 'loan_officer' || r === 'loan-officer') return 'loan_officer';
  if (r === 'cashier') return 'cashier';
  if (r === 'manager') return 'manager';
  if (r === 'credit investigator' || r === 'credit_investigator' || r === 'credit-investigator') return 'credit_investigator';
  // fallback: if key exists directly, return it
  if (PERMISSIONS[r]) return r;
  // last attempt: try underscore form
  const us = r.replace(/\s+/g, '_');
  if (PERMISSIONS[us]) return us;
  return r;
}
