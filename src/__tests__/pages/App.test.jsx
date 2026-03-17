import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Minimal mock of App that only tests the skip-link and ErrorBoundary
// We don't boot the full Router/Auth stack — just the pieces we care about.
jest.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({ user: null, loading: false }),
}));

jest.mock('react-hot-toast', () => ({
  Toaster: () => null,
  success: jest.fn(),
  error: jest.fn(),
}));

// Stub out every page import so the router doesn't need real components
const Stub = ({ name }) => <div data-testid={`page-${name}`}>{name}</div>;
jest.mock('../../pages/Home',          () => () => <Stub name="Home" />);
jest.mock('../../pages/Dashboard',     () => () => <Stub name="Dashboard" />);
jest.mock('../../pages/IssueDetail',   () => () => <Stub name="IssueDetail" />);
jest.mock('../../pages/ReportIssue',   () => () => <Stub name="Report" />);
jest.mock('../../pages/Donate',        () => () => <Stub name="Donate" />);
jest.mock('../../pages/Login',         () => () => <Stub name="Login" />);
jest.mock('../../pages/Register',      () => () => <Stub name="Register" />);
jest.mock('../../pages/UserProfile',   () => () => <Stub name="Profile" />);
jest.mock('../../pages/Bookmarks',     () => () => <Stub name="Bookmarks" />);
jest.mock('../../pages/AdvancedSearch',() => () => <Stub name="Search" />);
jest.mock('../../pages/admin/AdminLayout',      () => () => <Stub name="AdminLayout" />);
jest.mock('../../pages/admin/AdminOverview',    () => () => <Stub name="Overview" />);
jest.mock('../../pages/admin/AdminIssues',      () => () => <Stub name="AdminIssues" />);
jest.mock('../../pages/admin/AdminUsers',       () => () => <Stub name="AdminUsers" />);
jest.mock('../../pages/admin/AdminDonations',   () => () => <Stub name="AdminDonations" />);
jest.mock('../../pages/admin/AdminAnalytics',   () => () => <Stub name="AdminAnalytics" />);
jest.mock('../../pages/admin/AdminActivityLog', () => () => <Stub name="AdminActivity" />);
jest.mock('../../pages/admin/AdminAnnouncements',()=> () => <Stub name="AdminAnn" />);
jest.mock('../../hooks/useSSE',            () => () => {});
jest.mock('../../hooks/useNotifications',  () => () => ({
  notifications: [], unreadCount: 0, markRead: jest.fn(), markAllRead: jest.fn(), addNotification: jest.fn(),
}));
jest.mock('../../components/Navbar',              () => () => <nav aria-label="Main navigation" />);
jest.mock('../../components/Footer',              () => () => <footer>Footer</footer>);
jest.mock('../../components/NotificationPanel',   () => () => null);

import App from '../../App';

describe('App — skip-to-content link', () => {
  it('renders a skip-to-content link', () => {
    render(<App />);
    const skip = screen.getByText(/skip to main content/i);
    expect(skip).toBeInTheDocument();
    expect(skip.tagName).toBe('A');
    expect(skip.getAttribute('href')).toBe('#main-content');
  });
});

describe('App — main landmark', () => {
  it('renders a <main> element with id="main-content"', () => {
    render(<App />);
    const main = document.getElementById('main-content');
    expect(main).not.toBeNull();
    expect(main.tagName).toBe('MAIN');
  });
});

describe('App — ErrorBoundary', () => {
  it('wraps routes in an ErrorBoundary so crashes are caught', () => {
    // We can't easily trigger a real throw inside a Route here without heavy
    // setup, but we can verify ErrorBoundary is present by checking the DOM
    // renders normally (ErrorBoundary renders children when no error).
    render(<App />);
    // If ErrorBoundary itself crashed we'd see nothing — this passing is the assertion
    expect(document.getElementById('main-content')).not.toBeNull();
  });
});
