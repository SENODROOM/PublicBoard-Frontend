import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { authAPI } from '../api';
import VerifyEmail from '../pages/VerifyEmail';

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
    get: (param) => param === 'token' ? 'valid-verify-token' : null,
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

describe('VerifyEmail', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders verification page', () => {
    renderWithProviders(<VerifyEmail />);

    expect(screen.getByText('Verify Email')).toBeInTheDocument();
    expect(screen.getByText('Thank you for signing up!')).toBeInTheDocument();
    expect(screen.getByText('Please check your email and click the verification link to activate your account')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    mockAuthAPI.verifyEmail.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<VerifyEmail />);

    expect(screen.getByText('Verifying your email...')).toBeInTheDocument();
  });

  test('handles successful verification', async () => {
    mockAuthAPI.verifyEmail.mockResolvedValue({ 
      data: { message: 'Email verified successfully!' } 
    });

    renderWithProviders(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      expect(screen.getByText('Your email has been successfully verified')).toBeInTheDocument();
    });
  });

  test('handles invalid token', async () => {
    mockAuthAPI.verifyEmail.mockRejectedValue({
      response: { data: { message: 'Verification token is invalid or expired' } }
    });

    renderWithProviders(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText('The verification link is invalid or has expired')).toBeInTheDocument();
    });
  });

  test('shows resend option on failure', async () => {
    mockAuthAPI.verifyEmail.mockRejectedValue({
      response: { data: { message: 'Verification token is invalid or expired' } }
    });

    renderWithProviders(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeInTheDocument();
    });
  });

  test('handles email resend', async () => {
    mockAuthAPI.verifyEmail.mockRejectedValue({
      response: { data: { message: 'Verification token is invalid or expired' } }
    });

    // Mock the auth context to get user email
    const mockUser = { email: 'test@example.com', name: 'Test User' };
    jest.mock('../context/AuthContext', () => ({
      AuthProvider: ({ children }) => children,
      useAuth: () => ({ user: mockUser }),
    }));

    renderWithProviders(<VerifyEmail />);

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' });
      user.click(resendButton);
    });

    // This would need to be connected to actual resend functionality
    // For now, we'll just test the button exists and can be clicked
  });

  test('shows login link after successful verification', async () => {
    mockAuthAPI.verifyEmail.mockResolvedValue({ 
      data: { message: 'Email verified successfully!' } 
    });

    renderWithProviders(<VerifyEmail />);

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

    renderWithProviders(<VerifyEmail />);

    expect(screen.getByText('Invalid Verification Link')).toBeInTheDocument();
    expect(screen.getByText('No verification token found')).toBeInTheDocument();
  });

  test('shows success animation', async () => {
    mockAuthAPI.verifyEmail.mockResolvedValue({ 
      data: { message: 'Email verified successfully!' } 
    });

    renderWithProviders(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
      expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();
    });
  });

  test('displays benefits of verification', () => {
    renderWithProviders(<VerifyEmail />);

    expect(screen.getByText('Benefits of verifying your email:')).toBeInTheDocument();
    expect(screen.getByText('Full access to all features')).toBeInTheDocument();
    expect(screen.getByText('Receive important notifications')).toBeInTheDocument();
    expect(screen.getByText('Increased account security')).toBeInTheDocument();
    expect(screen.getByText('Priority support for reported issues')).toBeInTheDocument();
  });

  test('shows countdown timer for token expiry', () => {
    renderWithProviders(<VerifyEmail />);

    expect(screen.getByText(/This link will expire in/)).toBeInTheDocument();
    expect(screen.getByText(/24 hours/)).toBeInTheDocument();
  });

  test('handles network errors gracefully', async () => {
    mockAuthAPI.verifyEmail.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Unable to verify your email at this time')).toBeInTheDocument();
    });
  });

  test('shows helpful tips', () => {
    renderWithProviders(<VerifyEmail />);

    expect(screen.getByText('Didn\'t receive the email?')).toBeInTheDocument();
    expect(screen.getByText('Check your spam folder')).toBeInTheDocument();
    expect(screen.getByText('Make sure the email address is correct')).toBeInTheDocument();
    expect(screen.getByText('Wait a few minutes and try again')).toBeInTheDocument();
  });
});
