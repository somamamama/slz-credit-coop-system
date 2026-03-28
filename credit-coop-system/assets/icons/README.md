# SVG Icons

This folder contains SVG icons used throughout the Credit Cooperative System.

## Organization

Icons are organized by category to make them easy to find and maintain:

### Suggested Categories:
- **navigation/** - Menu, home, back, forward icons
- **actions/** - Edit, delete, save, cancel, submit icons  
- **status/** - Success, error, warning, info, pending icons
- **finance/** - Money, payment, loan, transaction icons
- **user/** - Profile, member, staff, admin icons
- **document/** - File, report, invoice, receipt icons
- **communication/** - Email, notification, message icons

## Usage Guidelines

1. **File Naming**: Use kebab-case naming (e.g., `user-profile.svg`, `payment-success.svg`)
2. **Size**: Maximum 64px × 64px (recommended: 24px × 24px for UI icons, 32px × 32px for feature icons)
3. **ViewBox**: Use consistent viewBox values (e.g., `viewBox="0 0 24 24"` or `viewBox="0 0 64 64"`)
4. **Color**: Use single color (#000000) for icons that will be styled with CSS
5. **Optimization**: Ensure SVGs are optimized and minified
6. **Accessibility**: Include meaningful `title` and `desc` elements in SVGs

### Size Recommendations:
- **Small UI Icons**: 16px × 16px (buttons, inline elements)
- **Standard Icons**: 24px × 24px (navigation, actions)
- **Feature Icons**: 32px × 32px (main features, cards)
- **Large Icons**: 48px × 48px (headers, empty states)
- **Maximum Size**: 64px × 64px (absolute limit)

## Importing Icons

### In React Components:
```javascript
import { ReactComponent as UserIcon } from '../../assets/icons/user/user-profile.svg';

// Usage
<UserIcon className="icon" />
```

### As Image Source:
```javascript
import userIcon from '../../assets/icons/user/user-profile.svg';

// Usage
<img src={userIcon} alt="User Profile" className="icon" />
```

## Contributing

When adding new icons:
1. Choose the appropriate category folder (create if needed)
2. Follow the naming convention
3. Ensure the icon is properly optimized
4. Update this README if adding a new category