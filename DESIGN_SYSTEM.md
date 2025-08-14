# Meraki Education Design System

This document outlines the comprehensive design system for the Meraki Education ERP application, featuring the Meraki Education color palette and component-based architecture.

## 🎨 Color Palette

### Primary Colors
- **Primary Orange (#F97316)**: Main brand color for primary actions, active states, and key UI elements
- **Secondary Teal (#14B8A6)**: For secondary actions, links, and complementary elements
- **Accent Yellow (#FBBF24)**: For notifications, warnings, and highlights

### Status Colors
- **Success Green (#22C55E)**: For success states, confirmations, and positive feedback
- **Warning Yellow (#FBBF24)**: For warnings and caution states
- **Error Red (#EF4444)**: For errors, destructive actions, and alerts
- **Info Blue (#3B82F6)**: For informational messages and neutral states

### Neutral Colors
- **Background Light (#FAFAF9)**: Main page background
- **Card White (#FFFFFF)**: Card and modal backgrounds
- **Border Gray (#E5E7EB)**: Borders and dividers
- **Text Primary (#1F2937)**: Main text color
- **Text Secondary (#4B5563)**: Secondary text
- **Text Muted (#9CA3AF)**: Disabled and muted text

## 📝 Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.)

### Font Sizes
- **H1**: 28px (bold) - Page titles
- **H2**: 22px (semibold) - Section headers
- **H3**: 18px (semibold) - Subsection headers
- **Body**: 14px (regular) - Main content
- **Caption**: 12px (regular) - Helper text, labels

### Font Weights
- **Regular (400)**: Body text
- **Medium (500)**: Emphasized text
- **Semibold (600)**: Headers, labels
- **Bold (700)**: Important headings

## 🧩 Components

### Buttons

#### Primary Button
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">
  Primary Action
</Button>
```

#### Secondary Button
```tsx
<Button variant="secondary" size="md">
  Secondary Action
</Button>
```

#### Text Button
```tsx
<Button variant="text" size="md">
  Text Action
</Button>
```

### Cards

#### Basic Card
```tsx
import { Card } from '@/components/ui';

<Card padding="md" shadow="md">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</Card>
```

#### Hover Card
```tsx
<Card padding="md" shadow="md" hover>
  Interactive card content
</Card>
```

### Form Elements

#### Input Field
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  fullWidth
/>
```

#### Input with Error
```tsx
<Input
  label="Password"
  type="password"
  error="Password is required"
  fullWidth
/>
```

### Badges

#### Status Badges
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Inactive</Badge>
<Badge variant="info">Draft</Badge>
```

## 🎯 Usage Guidelines

### Color Usage
1. **Primary Orange**: Use for main CTAs, active navigation, and primary actions
2. **Secondary Teal**: Use for secondary actions, links, and interactive elements
3. **Accent Yellow**: Use sparingly for notifications and highlights
4. **Status Colors**: Use consistently for status indicators and feedback

### Typography Hierarchy
1. Use consistent heading hierarchy (H1 → H2 → H3)
2. Maintain proper contrast ratios for accessibility
3. Limit to 2-3 font weights per page for clarity

### Component Consistency
1. Use design system components instead of custom styles
2. Maintain consistent spacing using the 4px grid system
3. Follow responsive design patterns for mobile compatibility

## 📱 Responsive Design

### Breakpoints
- **Mobile**: ≤767px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥1024px

### Mobile-First Approach
- Design for mobile first, then enhance for larger screens
- Use responsive utilities: `ds-mobile-only`, `ds-desktop-only`, `ds-tablet-up`
- Ensure touch targets are minimum 44px for accessibility

## 🎨 CSS Classes

### Legacy Classes (Backward Compatibility)
- `.btn-primary` - Primary button styling
- `.btn-secondary` - Secondary button styling
- `.form-input` - Input field styling
- `.card` - Basic card styling

### New Design System Classes
- `.ds-button-primary` - Enhanced primary button
- `.ds-button-secondary` - Enhanced secondary button
- `.ds-card` - Enhanced card component
- `.ds-input` - Enhanced input field
- `.ds-badge-*` - Status badge variants
- `.ds-nav-tab-*` - Navigation tab styles
- `.ds-table-*` - Table component styles
- `.ds-modal-*` - Modal component styles

## 🔧 Implementation

### Using Components
```tsx
// Import individual components
import { Button, Card, Input, Badge } from '@/components/ui';

// Use in your component
function MyComponent() {
  return (
    <Card padding="lg">
      <h2>Form Example</h2>
      <Input label="Name" fullWidth />
      <div className="flex gap-4 mt-4">
        <Button variant="primary">Save</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
      <Badge variant="success">Active</Badge>
    </Card>
  );
}
```

### Using CSS Classes
```tsx
// For existing components that need quick updates
function LegacyComponent() {
  return (
    <div className="ds-card">
      <button className="ds-button-primary">
        Updated Button
      </button>
      <span className="ds-badge-success">
        Status
      </span>
    </div>
  );
}
```

## 🎯 Accessibility

### Color Contrast
- All text meets WCAG AA contrast requirements
- Interactive elements have sufficient contrast in all states

### Touch Targets
- Minimum 44px touch target size for mobile
- Adequate spacing between interactive elements

### Focus Management
- Visible focus indicators on all interactive elements
- Logical tab order throughout the application

### Screen Reader Support
- Proper ARIA labels and roles
- Semantic HTML structure
- Alternative text for images and icons

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install @tailwindcss/forms
   ```

2. **Import Styles**
   The design system is automatically imported in `globals.css`

3. **Use Components**
   ```tsx
   import { Button, Card, Input, Badge } from '@/components/ui';
   ```

4. **Follow Guidelines**
   - Use design system components consistently
   - Follow color and typography guidelines
   - Ensure responsive design patterns
   - Maintain accessibility standards

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Inter Font](https://fonts.google.com/specimen/Inter)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

This design system ensures consistency, accessibility, and maintainability across the entire Meraki Education ERP application.
