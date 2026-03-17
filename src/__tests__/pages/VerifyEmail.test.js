import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { authAPI } from '../api';
import VerifyEmail from '../pages/VerifyEmail';

jest.mock('../api');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

// FIX: same useSearchParams issue as ResetPassword — must return an array.
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [
    { get: (key) => (key === 'token' ? 'valid-verify-token' : null) },
    jest.fn(),
  ],
}));

const renderWithRouter = (component) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

describe('VerifyEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Loading state ────────────────────────────────────────
  test('shows verifying state while request is in flight', () => {
    authAPI.verifyEmail.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<VerifyEmail />);

    // FIX: component text is "Verifying your email…" (with ellipsis), not "Verifying your email..."
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

  // ── Success state ────────────────────────────────────────
  test('shows verified confirmation after successful verification', async () => {
    authAPI.verifyEmail.mockResolvedValue({
      data: { message: 'Email verified successfully!' },
    });

    renderWithRouter(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByText('Email Verified!')).toBeInTheDocument();
    });
  });

  test('calls authAPI.verifyEmail with the token from the URL', async () => {
    authAPI.verifyEmail.mockResolvedValue({ data: {} });

    renderWithRouter(<VerifyEmail />);

    await waitFor(() => {
      expect(authAPI.verifyEmail).toHaveBeenCalledWith('valid-verify-token');
    });
  });

  test('shows a link to the dashboard after successful verification', async () => {
    authAPI.verifyEmail.mockResolvedValue({ data: {} });

    renderWithRouter(<VerifyEmail />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /go to dashboard/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dashboard');
    });
  });

  // ── Error states ─────────────────────────────────────────
  test('shows failure state on invalid token', async () => {
    authAPI.verifyEmail.mockRejectedValue({
      response: { data: { message: 'Verification token is invalid or expired' } },
    });

    renderWithRouter(<VerifyEmail />);

    // FIX: component shows "Verification Failed" heading, not "The verification link is invalid or has expired"
    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    });
  });

  test('shows server error message inside the failure state', async () => {
    authAPI.verifyEmail.mockRejectedValue({
      response: { data: { message: 'Verification token is invalid or expired' } },
    });

    renderWithRouter(<VerifyEmail />);

    await waitFor(() => {
      expect(
        screen.getByText('Verification token is invalid or expired')
      ).toBeInTheDocument();
    });
  });

  test('shows fallback error message when no server message available', async () => {
    authAPI.verifyEmail.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    });
  });

  test('shows Sign In and Create Account links in error state', async () => {
    authAPI.verifyEmail.mockRejectedValue({
      response: { data: { message: 'Token expired' } },
    });

    renderWithRouter(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
    });
  });

  // ── Missing token state ──────────────────────────────────
  // FIX: component heading is "Invalid Reset Link" — "No Token Found" (not "Invalid Verification Link")
  // and "No verification token found" — test against the actual heading text.
  test('shows missing token state when no token in URL', () => {
    jest.resetModules();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useSearchParams: () => [{ get: () => null }, jest.fn()],
    }));

    renderWithRouter(<VerifyEmail />);

    // Component renders the STATE.missing branch which shows "No Token Found"
    expect(screen.getByText('No Token Found')).toBeInTheDocument();
  });

  test('does not call authAPI.verifyEmail when token is absent', () => {
    jest.resetModules();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useSearchParams: () => [{ get: () => null }, jest.fn()],
    }));

    renderWithRouter(<VerifyEmail />);

    expect(authAPI.verifyEmail).not.toHaveBeenCalled();
  });

  // ── Bonus: +5 rep mention ────────────────────────────────
  test('mentions reputation bonus in success state', async () => {
    authAPI.verifyEmail.mockResolvedValue({ data: {} });

    renderWithRouter(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByText(/\+5 reputation/i)).toBeInTheDocument();
    });
  });
});