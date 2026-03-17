import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { authAPI } from '../api';
import ForgotPassword from '../pages/ForgotPassword';

jest.mock('../api');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const renderWithRouter = (component) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

describe('ForgotPassword', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────
  test('renders the page heading and form', () => {
    renderWithRouter(<ForgotPassword />);

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  test('renders back to login link pointing to /login', () => {
    renderWithRouter(<ForgotPassword />);

    const link = screen.getByRole('link', { name: /back to login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  // ── Validation ───────────────────────────────────────────
  // FIX: component checks !email.trim() and shows "Email is required" —
  // the old test checked for a format error message that doesn't exist.
  test('shows "Email is required" when submitting empty form', async () => {
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  test('email input accepts typed value', async () => {
    renderWithRouter(<ForgotPassword />);

    const input = screen.getByLabelText('Email Address');
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
  });

  // ── Successful submission ────────────────────────────────
  test('calls authAPI.forgotPassword with the email on submit', async () => {
    authAPI.forgotPassword.mockResolvedValue({
      data: { message: 'If that email exists, a reset link has been sent.' },
    });

    renderWithRouter(<ForgotPassword />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(authAPI.forgotPassword).toHaveBeenCalledWith('test@example.com');
  });

  test('shows inbox confirmation UI after successful submission', async () => {
    authAPI.forgotPassword.mockResolvedValue({
      data: { message: 'If that email exists, a reset link has been sent.' },
    });

    renderWithRouter(<ForgotPassword />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Check your inbox')).toBeInTheDocument();
    });
    // Back to Login link still present in the success state
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  // ── Loading / disabled state ─────────────────────────────
  test('disables submit button while request is in flight', async () => {
    authAPI.forgotPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    renderWithRouter(<ForgotPassword />);

    const btn = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(btn);

    expect(btn).toBeDisabled();
  });

  test('shows "Sending…" label while loading', async () => {
    authAPI.forgotPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    renderWithRouter(<ForgotPassword />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(screen.getByText('Sending…')).toBeInTheDocument();
  });

  // ── Error handling ───────────────────────────────────────
  test('shows error message on API failure', async () => {
    authAPI.forgotPassword.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<ForgotPassword />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Please try again.')
      ).toBeInTheDocument();
    });
  });

  test('shows server-provided error message if available', async () => {
    authAPI.forgotPassword.mockRejectedValue({
      response: { data: { message: 'Rate limit exceeded' } },
    });

    renderWithRouter(<ForgotPassword />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });

  // ── Double-submit prevention ─────────────────────────────
  test('only calls API once even if button clicked multiple times', async () => {
    let resolve;
    authAPI.forgotPassword.mockImplementation(
      () => new Promise((res) => { resolve = res; })
    );

    renderWithRouter(<ForgotPassword />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    const btn = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(btn);
    await user.click(btn); // second click should be ignored

    expect(authAPI.forgotPassword).toHaveBeenCalledTimes(1);
    resolve({ data: {} });
  });
});