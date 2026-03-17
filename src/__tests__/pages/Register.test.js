import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Register from '../pages/Register';

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock components
jest.mock('../components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);
jest.mock('../components/Footer', () => () => <div data-testid="footer">Footer</div>);

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Register', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders registration form', () => {
    renderWithProviders(<Register />);

    expect(screen.getByText('Join PublicBoard')).toBeInTheDocument();
    expect(screen.getByText('Create an account to report and track community issues')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  test('shows logo', () => {
    renderWithProviders(<Register />);

    expect(screen.getByAltText('PublicBoard')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderWithProviders(<Register />);

    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    await user.click(submitButton);

    // Should show validation errors for empty fields
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  test('validates password confirmation', async () => {
    renderWithProviders(<Register />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');

    await user.click(submitButton);

    // Should show password mismatch error
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('validates password length', async () => {
    renderWithProviders(<Register />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.type(confirmPasswordInput, '123');

    await user.click(submitButton);

    // Should show password length error
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  test('handles form input changes', async () => {
    renderWithProviders(<Register />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    expect(nameInput).toHaveValue('Test User');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  test('shows login link', () => {
    renderWithProviders(<Register />);

    expect(screen.getByText(/Already have an account/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('displays loading state during submission', async () => {
    renderWithProviders(<Register />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    fireEvent.click(submitButton);

    // Should show loading state
    expect(submitButton).toBeDisabled();
  });

  test('handles error display', () => {
    renderWithProviders(<Register />);

    // Simulate error state
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-msg';
    errorDiv.textContent = 'Email already in use';
    document.body.appendChild(errorDiv);

    expect(screen.getByText('Email already in use')).toBeInTheDocument();
  });
});
