# SVG Repo Icons Integration Guide

## Home Assistant Outlined Icons Collection
**Source**: https://www.svgrepo.com/collection/home-assistant-outlined-icons/

This collection contains clean, outlined icons perfect for a cooperative system interface.

## How to Download and Organize Icons

### Step 1: Browse the Collection
1. Visit: https://www.svgrepo.com/collection/home-assistant-outlined-icons/
2. Browse through the available icons
3. Look for icons relevant to our credit cooperative system

### Step 2: Download Process
For each icon you want to use:
1. Click on the icon
2. Click "Download SVG"
3. Save the file with a descriptive name using kebab-case

### Step 3: Organize by Category

Place downloaded icons in the appropriate folders:

#### Navigation Icons
- `home.svg` → `navigation/home.svg`
- `menu.svg` → `navigation/menu.svg`
- `arrow-left.svg` → `navigation/arrow-left.svg`
- `arrow-right.svg` → `navigation/arrow-right.svg`

#### Actions Icons
- `edit.svg` → `actions/edit.svg`
- `delete.svg` → `actions/delete.svg`
- `save.svg` → `actions/save.svg`
- `add.svg` → `actions/add.svg`
- `search.svg` → `actions/search.svg`

#### Status Icons
- `check-circle.svg` → `status/success.svg`
- `x-circle.svg` → `status/error.svg`
- `alert-triangle.svg` → `status/warning.svg`
- `info.svg` → `status/info.svg`

#### Finance Icons
- `dollar-sign.svg` → `finance/money.svg`
- `credit-card.svg` → `finance/payment.svg`
- `trending-up.svg` → `finance/growth.svg`
- `calculator.svg` → `finance/calculator.svg`

#### User Icons
- `user.svg` → `user/profile.svg`
- `users.svg` → `user/members.svg`
- `user-plus.svg` → `user/add-member.svg`
- `user-check.svg` → `user/verified.svg`

#### Document Icons
- `file.svg` → `document/file.svg`
- `file-text.svg` → `document/document.svg`
- `download.svg` → `document/download.svg`
- `upload.svg` → `document/upload.svg`

#### Communication Icons
- `mail.svg` → `communication/email.svg`
- `bell.svg` → `communication/notification.svg`
- `message-circle.svg` → `communication/message.svg`

### Step 4: Icon Optimization

After downloading, ensure each SVG:
1. **Size Constraint**: Must not exceed 64px × 64px
2. **ViewBox**: Use consistent viewBox (preferably `0 0 24 24` for 24px icons)
3. **Single Color**: Use single color for styling flexibility
4. **Clean Code**: Remove unnecessary elements and optimize file size

#### Size Guidelines:
- **Small Icons (16px)**: For buttons and inline elements
- **Standard Icons (24px)**: For navigation and common actions
- **Feature Icons (32px)**: For main features and card headers
- **Large Icons (48px)**: For headers and empty states
- **Maximum (64px)**: Absolute size limit - use sparingly

#### Optimization Checklist:
```xml
<!-- Good: Clean, scalable SVG -->
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L2 7V10C2 16 6 21.3 12 22C18 21.3 22 16 22 10V7L12 2Z" stroke="currentColor" stroke-width="2"/>
</svg>

<!-- Avoid: Fixed dimensions -->
<svg width="64px" height="64px">
  <!-- content -->
</svg>
```

### Recommended Icons for Credit Cooperative System

#### Essential Icons:
- Home/Dashboard
- User profile/Members
- Loans/Finance
- Payments
- Documents/Reports
- Settings
- Notifications
- Search
- Add/Create
- Edit
- Delete
- Save
- Cancel

#### Status Icons:
- Approved/Success
- Pending/Warning
- Rejected/Error
- Information

### Example Usage After Download

```javascript
// Import in React component
import { ReactComponent as HomeIcon } from '../../../assets/icons/navigation/home.svg';
import { ReactComponent as UserIcon } from '../../../assets/icons/user/profile.svg';
import { ReactComponent as LoanIcon } from '../../../assets/icons/finance/money.svg';

// Use in JSX
<HomeIcon className="nav-icon" />
<UserIcon className="profile-icon" />
<LoanIcon className="loan-icon" />
```

### CSS Styling

```css
/* Small icons for buttons and inline elements */
.icon-small {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

/* Standard navigation and action icons */
.nav-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

/* Feature icons for cards and sections */
.feature-icon {
  width: 32px;
  height: 32px;
  fill: #007bff;
}

/* Large icons for headers */
.header-icon {
  width: 48px;
  height: 48px;
  fill: currentColor;
}

/* Maximum size icons (use sparingly) */
.large-icon {
  width: 64px;
  height: 64px;
  fill: currentColor;
}

/* Responsive icons that scale with text */
.responsive-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: middle;
}
```

## License
Home Assistant icons are typically open source. Always check the license on SVG Repo before using in production.