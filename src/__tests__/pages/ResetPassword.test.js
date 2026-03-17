import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { authAPI } from '../api';
import ResetPassword from '../pages/ResetPassword';

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

// Mock URL params
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => ({
    get: (param: string) => param === 'token' ? 'valid-reset-token' : null,
  }),
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

describe('ResetPassword', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders reset password form', () => {
    renderWithProviders(<ResetPassword />);

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText('Enter your new password below')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  test('validates password fields', async () => {
    renderWithProviders(<ResetPassword />);

    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(submitButton);

    expect(screen.getByText('New password is required')).toBeInTheDocument();
    expect(screen.getByText('Password confirmation is required')).toBeInTheDocument();
  });

  test('validates password length', async () => {
    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });

    await user.type(passwordInput, '123');
    await user.type(confirmPasswordInput, '123');
    await user.click(submitButton);

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  test('validates password confirmation', async () => {
    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('handles successful password reset', async () => {
    mockAuthAPI.resetPassword.mockResolvedValue({ 
      data: { message: 'Password reset successfully. You can now log in.' } 
    });

    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });

    await user.type(passwordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    expect(mockAuthAPI.resetPassword).toHaveBeenCalledWith({
      token: 'valid-reset-token',
      password: 'newpassword123'
    });

    await waitFor(() => {
      expect(screen.getByText('Password reset successfully!')).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockAuthAPI.resetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });

    await user.type(passwordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Resetting...')).toBeInTheDocument();
  });

  test('handles invalid token error', async () => {
    mockAuthAPI.resetPassword.mockRejectedValue({
      response: { data: { message: 'Reset token is invalid or has expired' } }
    });

    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });

    await user.type(passwordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Reset token is invalid or has expired')).toBeInTheDocument();
    });
  });

  test('shows login link after successful reset', async () => {
    mockAuthAPI.resetPassword.mockResolvedValue({ 
      data: { message: 'Password reset successfully. You can now log in.' } 
    });

    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });

    await user.type(passwordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    await waitFor(() => {
      const loginLink = screen.getByRole('link', { name: 'Go to Login' });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  test('handles missing token', () => {
    // Mock useSearchParams to return null for token
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useSearchParams: () => ({
        get: () => null,
      }),
    }));

    renderWithProviders(<ResetPassword />);

    expect(screen.getByText('Invalid or missing reset token')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request new reset link' })).toBeInTheDocument();
  });

  test('shows password strength indicator', async () => {
    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    
    await user.type(passwordInput, 'weak');
    expect(screen.getByText('Weak password')).toBeInTheDocument();

    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongP@ssw0rd123!');
    expect(screen.getByText('Strong password')).toBeInTheDocument();
  });

  test('prevents multiple submissions', async () => {
    let resolvePromise: any;
    mockAuthAPI.resetPassword.mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve;
    }));

    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });

    await user.type(passwordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);
    await user.click(submitButton); // Second click

    expect(mockAuthAPI.resetPassword).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();

    resolvePromise({ data: { message: 'Success' } });
  });

  test('shows security requirements', () => {
    renderWithProviders(<ResetPassword />);

    expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Include uppercase and lowercase letters')).toBeInTheDocument();
    expect(screen.getByText('Include at least one number')).toBeInTheDocument();
    expect(screen.getByText('Include at least one special character')).toBeInTheDocument();
  });
});
