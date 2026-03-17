import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { authAPI } from '../api';
import Login from '../pages/Login';

jest.mock('../api');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithProviders = (component) =>
  render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );

describe('Login', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ── Rendering ────────────────────────────────────────────
  test('renders login form with all fields', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText(/sign in to your PublicBoard account/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('renders logo image', () => {
    renderWithProviders(<Login />);
    expect(screen.getByAltText('PublicBoard')).toBeInTheDocument();
  });

  test('renders link to registration page', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /create one/i });
    expect(link).toBeInTheDocument();
  });

  test('renders forgot password link', () => {
    renderWithProviders(<Login />);

    const link = screen.getByRole('link', { name: /forgot password/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  // ── Form interaction ─────────────────────────────────────
  test('accepts email and password input', async () => {
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('password123');
  });

  // ── Loading state ────────────────────────────────────────
  test('disables submit button while login request is in flight', async () => {
    authAPI.login.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
  });

  // ── Error display ─────────────────────────────────────────
  // FIX: removed DOM injection hack. Now properly mocks authAPI.login rejection
  // so the component's own error state is exercised.
  test('shows error message on invalid credentials', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  test('shows fallback error message when no server message', async () => {
    authAPI.login.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/login failed|check your credentials/i)
      ).toBeInTheDocument();
    });
  });

  test('shows suspended message for a banned user', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { message: 'Account suspended: spam' } },
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('Email'), 'banned@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Account suspended: spam')).toBeInTheDocument();
    });
  });

  // ── Successful login ──────────────────────────────────────
  test('stores token and navigates to /dashboard for regular users', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', name: 'Alice', email: 'alice@example.com', role: 'user' },
      },
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('pb_token')).toBe('access-token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('navigates to /admin for admin users', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        token: 'admin-token',
        refreshToken: 'refresh-token',
        user: { id: '2', name: 'Admin', email: 'admin@example.com', role: 'admin' },
      },
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });
});