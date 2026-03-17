import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
  },
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders logo and navigation links', () => {
    renderWithProviders(<Navbar />);
    
    expect(screen.getByAltText('PublicBoard')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByText('Donate')).toBeInTheDocument();
  });

  test('shows login/register buttons when not authenticated', () => {
    renderWithProviders(<Navbar />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  test('shows user menu when authenticated', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    };
    
    localStorage.setItem('pb_token', 'mock-token');
    localStorage.setItem('pb_user', JSON.stringify(mockUser));
    
    renderWithProviders(<Navbar />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  test('opens mobile menu when hamburger clicked', () => {
    renderWithProviders(<Navbar />);
    
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(hamburger);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('shows notification badge when unreadCount > 0', () => {
    renderWithProviders(<Navbar unreadCount={5} onNotifClick={jest.fn()} />);
    
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });
});
