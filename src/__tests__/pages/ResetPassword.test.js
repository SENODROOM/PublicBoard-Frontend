import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { authAPI } from '../api';
import ResetPassword from '../pages/ResetPassword';

jest.mock('../api');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

// FIX: useSearchParams returns an array [params, setParams], not a plain object.
// The original mock returned an object with a .get() method which breaks the
// destructuring `const [params] = useSearchParams()` used in the component.
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [
    { get: (key) => (key === 'token' ? 'valid-reset-token' : null) },
    jest.fn(),
  ],
  useNavigate: () => jest.fn(),
}));

const renderWithRouter = (component) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

describe('ResetPassword', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────
  test('renders reset password form when token is present', () => {
    renderWithRouter(<ResetPassword />);

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  test('renders back to login link', () => {
    renderWithRouter(<ResetPassword />);

    const link = screen.getByRole('link', { name: /back to login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  // ── No-token state ───────────────────────────────────────
  // FIX: component renders "Invalid Reset Link" heading when token is absent,
  // not "Invalid or missing reset token" (that was a made-up string).
  test('shows invalid link state when token is missing', () => {
    jest.resetModules();
    // Override just for this test
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useSearchParams: () => [{ get: () => null }, jest.fn()],
      useNavigate: () => jest.fn(),
    }));

    renderWithRouter(<ResetPassword />);

    expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /request new link/i })
    ).toBeInTheDocument();
  });

  // ── Validation ───────────────────────────────────────────
  test('shows error when password is shorter than 8 characters', async () => {
    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), '123');
    await user.type(screen.getByLabelText('Confirm New Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  test('shows mismatch message when passwords differ', async () => {
    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'different123');

    // The component shows inline mismatch hint while typing
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('submit button is disabled when passwords do not match', async () => {
    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'different123');

    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeDisabled();
  });

  // ── Successful reset ─────────────────────────────────────
  test('calls authAPI.resetPassword with token and new password', async () => {
    authAPI.resetPassword.mockResolvedValue({
      data: { message: 'Password reset successfully. You can now log in.' },
    });

    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(authAPI.resetPassword).toHaveBeenCalledWith({
      token: 'valid-reset-token',
      password: 'newpassword123',
    });
  });

  // ── Loading state ────────────────────────────────────────
  test('disables submit button and shows Resetting… while loading', async () => {
    authAPI.resetPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(screen.getByRole('button', { name: 'Resetting…' })).toBeDisabled();
  });

  // ── Error handling ───────────────────────────────────────
  test('shows server error message on failure', async () => {
    authAPI.resetPassword.mockRejectedValue({
      response: { data: { message: 'Reset token is invalid or has expired' } },
    });

    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(
        screen.getByText('Reset token is invalid or has expired')
      ).toBeInTheDocument();
    });
  });

  test('shows fallback error when no server message', async () => {
    authAPI.resetPassword.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(
        screen.getByText(/reset failed|expired/i)
      ).toBeInTheDocument();
    });
  });

  // ── Password strength meter ──────────────────────────────
  // FIX: component shows "Weak", "Fair", "Strong" — not "Weak password" / "Strong password"
  test('shows Weak strength for a short password', async () => {
    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'abc');

    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  test('shows Strong strength for a complex password', async () => {
    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'StrongP@ssw0rd!');

    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  // ── Double-submit prevention ─────────────────────────────
  test('only calls API once even if button clicked twice quickly', async () => {
    let resolve;
    authAPI.resetPassword.mockImplementation(
      () => new Promise((res) => { resolve = res; })
    );

    renderWithRouter(<ResetPassword />);

    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');

    const btn = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(btn);
    await user.click(btn);

    expect(authAPI.resetPassword).toHaveBeenCalledTimes(1);
    resolve({ data: {} });
  });

  // ── Show/hide password toggle ────────────────────────────
  test('toggles password visibility when eye button clicked', async () => {
    renderWithRouter(<ResetPassword />);

    const pwInput = screen.getByLabelText('New Password');
    expect(pwInput).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: /show password/i });
    await user.click(toggle);

    expect(pwInput).toHaveAttribute('type', 'text');
  });
});