import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';

// Mock useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
const { useAuth } = require('../../context/AuthContext');

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({ success: jest.fn() }));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderNavbar(props = {}, authOverrides = {}) {
  useAuth.mockReturnValue({
    user: null,
    logout: jest.fn(),
    ...authOverrides,
  });
  return render(
    <MemoryRouter>
      <Navbar unreadCount={0} onNotifClick={jest.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('Navbar — unauthenticated', () => {
  it('renders the PublicBoard logo', () => {
    renderNavbar();
    expect(screen.getByText('PublicBoard')).toBeInTheDocument();
  });

  it('shows Login and Register links', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('does NOT show notification bell when logged out', () => {
    renderNavbar();
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
  });
});

describe('Navbar — authenticated', () => {
  const user = { name: 'Alice', email: 'alice@test.com', role: 'user', reputation: 50 };

  it('does not show Login/Register when logged in', () => {
    renderNavbar({}, { user });
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
  });

  it('shows notification bell with aria-label', () => {
    renderNavbar({ unreadCount: 0 }, { user });
    const bell = screen.getByRole('button', { name: /notifications/i });
    expect(bell).toBeInTheDocument();
  });

  it('notification bell aria-label includes unread count when > 0', () => {
    renderNavbar({ unreadCount: 3 }, { user });
    const bell = screen.getByRole('button', { name: /3 unread/i });
    expect(bell).toBeInTheDocument();
  });

  it('notification bell has aria-haspopup="dialog"', () => {
    renderNavbar({ unreadCount: 0 }, { user });
    expect(screen.getByRole('button', { name: /notifications/i })).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('calls onNotifClick when bell is clicked', async () => {
    const onNotifClick = jest.fn();
    renderNavbar({ onNotifClick, unreadCount: 0 }, { user });
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(onNotifClick).toHaveBeenCalled();
  });
});

describe('Navbar — hamburger menu', () => {
  it('hamburger button has aria-label for opening', () => {
    renderNavbar();
    const burger = screen.getByRole('button', { name: /open navigation menu/i });
    expect(burger).toBeInTheDocument();
  });

  it('hamburger button has aria-expanded="false" when closed', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /open navigation menu/i }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('hamburger button changes aria-label and aria-expanded after click', async () => {
    renderNavbar();
    const burger = screen.getByRole('button', { name: /open navigation menu/i });
    await userEvent.click(burger);
    expect(screen.getByRole('button', { name: /close navigation menu/i }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('hamburger button has aria-controls="mobile-nav"', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /open navigation menu/i }))
      .toHaveAttribute('aria-controls', 'mobile-nav');
  });
});

describe('Navbar — nav landmark', () => {
  it('nav has aria-label="Main navigation"', () => {
    renderNavbar();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});

describe('Navbar — admin user', () => {
  const adminUser = { name: 'Admin', email: 'admin@test.com', role: 'admin', reputation: 200 };

  it('shows ADMIN badge in user menu button', () => {
    renderNavbar({}, { user: adminUser });
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });
});
