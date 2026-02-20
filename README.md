# PublicBoard Frontend 🎨

The modern, responsive web interface for PublicBoard - A community issue reporting platform. Built with React 18, Vite, and Tailwind CSS.

## 📋 Overview

This frontend application provides an intuitive and accessible interface for community members to report, track, and manage public issues. It features a clean design, real-time updates, and a seamless user experience across all devices.

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Lightning-fast build tool and development server
- **React Router DOM** - Client-side routing with navigation
- **Axios** - Promise-based HTTP client for API calls
- **Tailwind CSS** - Utility-first CSS framework for styling
- **ESLint** - Code quality and consistency tooling

## ✨ Features

### User Features
- **🏠 Dashboard** - View and browse all community issues
- **📝 Issue Reporting** - Easy-to-use form for reporting new issues
- **🔍 Issue Details** - Comprehensive view of individual issues
- **📊 Statistics** - Visual analytics and insights
- **🌙 Dark Mode** - Toggle between light and dark themes
- **📱 Responsive Design** - Optimized for mobile, tablet, and desktop

### Admin Features
- **🔐 Admin Authentication** - Secure login for administrators
- **⚙️ Admin Dashboard** - Manage and resolve issues
- **📈 Issue Management** - Update status, priority, and details
- **👥 User Management** - Overview of community activity

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend API server running (see [backend README](../backend/README.md))

### Quick Start

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root of the frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 🗂️ Project Structure

```
frontend/
├── public/
│   ├── favicon.ico        # Site favicon
│   └── other assets       # Static assets
├── src/
│   ├── components/        # Reusable React components
│   │   ├── Layout.jsx     # Main layout wrapper
│   │   ├── ProtectedRoute.jsx  # Route protection
│   │   ├── Toast.jsx      # Notification component
│   │   └── ...            # Other UI components
│   ├── context/           # React context providers
│   │   ├── AdminContext.jsx    # Admin authentication state
│   │   └── ThemeContext.jsx     # Theme management
│   ├── pages/             # Page-level components
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── ReportIssue.jsx     # Issue reporting form
│   │   ├── IssueDetail.jsx     # Issue details view
│   │   ├── Statistics.jsx      # Analytics page
│   │   ├── AdminLogin.jsx      # Admin login
│   │   └── AdminDashboard.jsx  # Admin interface
│   ├── utils/             # Utility functions
│   │   └── api.js         # API helper functions
│   ├── App.jsx            # Main App component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── .env                   # Environment variables (create this)
├── .eslintrc.cjs          # ESLint configuration
├── .gitignore             # Git ignore file
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## 🎨 Components Overview

### Core Components

- **Layout**: Main application layout with navigation and footer
- **ProtectedRoute**: Route protection for admin-only pages
- **Toast**: Global notification system for user feedback

### Context Providers

- **AdminContext**: Manages admin authentication state
- **ThemeContext**: Handles light/dark theme switching
- **ToastContext**: Global toast notification management

### Page Components

- **Dashboard**: Browse and filter community issues
- **ReportIssue**: Form for submitting new issues
- **IssueDetail**: Detailed view of individual issues
- **Statistics**: Charts and analytics dashboard
- **AdminLogin**: Authentication for administrators
- **AdminDashboard**: Administrative interface

## 🎯 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🌐 Application Routes

### Public Routes
- `/` - Main dashboard (home page)
- `/report` - Report a new issue
- `/issues/:id` - View specific issue details
- `/statistics` - Community statistics and analytics

### Admin Routes
- `/admin/login` - Administrator login page
- `/admin/dashboard` - Admin dashboard (protected)

## 🎨 Theming System

The application supports both light and dark themes:

### Theme Toggle
- Switch between themes using the theme toggle button
- Theme preference is persisted in localStorage
- Smooth transitions between theme changes

### CSS Variables
Themes are managed through CSS custom properties for easy customization:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #6b7280;
}

[data-theme="dark"] {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | http://localhost:5000 |

### Vite Configuration

The `vite.config.js` includes:
- React plugin for fast refresh
- Development server configuration
- Build optimization settings

## 📱 Responsive Design

The application is fully responsive with breakpoints for:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Touch-friendly interface
- Optimized navigation
- Swipe gestures (where applicable)
- Adaptive layouts

## 🚀 Deployment

### Build for Production

1. **Create production build**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

3. **Deploy to hosting service**
   
   The build output in `dist/` can be deployed to:
   - Netlify
   - Vercel
   - GitHub Pages
   - Any static hosting service

### Environment-Specific Builds

Set the API URL for different environments:

```bash
# Development
VITE_API_URL=http://localhost:5000

# Staging
VITE_API_URL=https://staging-api.publicboard.com

# Production
VITE_API_URL=https://api.publicboard.com
```

## 🧪 Development

### Code Quality

The project uses ESLint for code quality:
```bash
npm run lint
```

### Hot Module Replacement

Vite provides fast HMR for:
- Component changes
- Style updates
- Configuration modifications

### Development Tips

1. **Component Development**: Use React DevTools for debugging
2. **Network Debugging**: Use browser DevTools Network tab
3. **State Management**: Leverage React DevTools Profiler
4. **Styling**: Use Tailwind IntelliSense in your IDE

## 🎨 UI/UX Guidelines

### Design Principles
- **Consistency**: Uniform design language throughout
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for fast loading
- **User Experience**: Intuitive and predictable interactions

### Color Scheme
- **Primary**: Blue tones for primary actions
- **Success**: Green for positive feedback
- **Warning**: Yellow/Orange for cautions
- **Error**: Red for errors and warnings
- **Neutral**: Gray scales for text and backgrounds

## 🔒 Security Features

- **Input Validation**: Client-side validation for all forms
- **XSS Prevention**: Proper data sanitization
- **Secure Routing**: Protected admin routes
- **API Security**: Proper error handling without information leakage

## 🤝 Contributing to Frontend

We welcome frontend contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
   ```bash
   npm run dev
   ```
5. **Run linting**
   ```bash
   npm run lint
   ```
6. **Submit a pull request**

### Frontend Development Guidelines

- Follow React best practices and hooks patterns
- Use Tailwind CSS classes for styling
- Ensure responsive design for all components
- Write accessible HTML semantics
- Test on multiple screen sizes
- Follow existing component patterns
- Add comments for complex logic

## 🐛 Troubleshooting

### Common Issues

**Development Server Not Starting:**
```bash
# Clear Vite cache
npm run dev -- --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**API Connection Issues:**
- Verify backend server is running
- Check `VITE_API_URL` in `.env` file
- Ensure CORS is configured on backend

**Build Errors:**
```bash
# Clear build cache
rm -rf dist
npm run build
```

**Styling Issues:**
- Verify Tailwind CSS is properly imported
- Check for conflicting CSS classes
- Ensure responsive prefixes are correct

## 📚 Learning Resources

For developers new to the tech stack:

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)

## 📞 Support

For frontend-specific issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [GitHub issues](https://github.com/yourusername/PublicBoard/issues)
3. Create a new issue with:
   - Detailed description of the issue
   - Steps to reproduce
   - Browser and device information
   - Screenshots if applicable

---

**Built with ❤️ and modern web technologies for the PublicBoard community**
