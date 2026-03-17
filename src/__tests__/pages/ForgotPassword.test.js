import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { authAPI } from '../api';
import ForgotPassword from '../pages/ForgotPassword';

// Mock API
jest.mock('../api');
const mockAuthAPI = authAPI;

// Mock components
jest.mock('../components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);
jest.mock('../components/Footer', () => () => <div data-testid="footer">Footer</div>);

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
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

describe('ForgotPassword', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders forgot password form', () => {
    renderWithProviders(<ForgotPassword />);

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address and we\'ll send you a link to reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  test('validates email field', async () => {
    renderWithProviders(<ForgotPassword />);

    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(submitButton);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  test('validates email format', async () => {
    renderWithProviders(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(submitButton);

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  test('handles successful submission', async () => {
    mockAuthAPI.forgotPassword.mockResolvedValue({ 
      data: { message: 'If that email exists, a reset link has been sent.' } 
    });

    renderWithProviders(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(submitButton);

    expect(mockAuthAPI.forgotPassword).toHaveBeenCalledWith('test@example.com');
    
    await waitFor(() => {
      expect(screen.getByText('If that email exists, a reset link has been sent.')).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockAuthAPI.forgotPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  test('handles API errors', async () => {
    mockAuthAPI.forgotPassword.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  test('shows back to login link', () => {
    renderWithProviders(<ForgotPassword />);

    const loginLink = screen.getByRole('link', { name: 'Back to Login' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('handles email input changes', async () => {
    renderWithProviders(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  test('shows security notice', () => {
    renderWithProviders(<ForgotPassword />);

    expect(screen.getByText(/For your security/)).toBeInTheDocument();
    expect(screen.getByText(/password reset links expire after 1 hour/)).toBeInTheDocument();
  });

  test('prevents multiple submissions', async () => {
    let resolvePromise;
    mockAuthAPI.forgotPassword.mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve;
    }));

    renderWithProviders(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(submitButton);
    await user.click(submitButton); // Second click

    // Should only call API once
    expect(mockAuthAPI.forgotPassword).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolvePromise({ data: { message: 'Success' } });
  });

  test('handles case insensitive email', async () => {
    mockAuthAPI.forgotPassword.mockResolvedValue({ 
      data: { message: 'If that email exists, a reset link has been sent.' } 
    });

    renderWithProviders(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'TEST@EXAMPLE.COM');

    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(submitButton);

    expect(mockAuthAPI.forgotPassword).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
  });
});
