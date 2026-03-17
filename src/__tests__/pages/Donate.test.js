import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { donationsAPI } from '../api';
import Donate from '../pages/Donate';

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    confirmCardPayment: jest.fn(),
  })),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => children,
  CardElement: ({ onChange }) => (
    <input
      data-testid="card-element"
      onChange={(e) => onChange({ error: e.target.value ? { message: 'Card error' } : null })}
    />
  ),
  useStripe: () => ({
    confirmCardPayment: jest.fn(),
  }),
  useElements: () => ({
    getElement: jest.fn(() => ({ value: '4242424242424242' })),
  }),
}));

// Mock API
jest.mock('../api');
const mockDonationsAPI = donationsAPI;

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

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Donate', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders donation page', async () => {
    const mockStats = { totalRaised: 1000, donationCount: 20 };
    const mockDonations = [
      {
        _id: '1',
        donor: { name: 'John Doe' },
        amount: 50,
        message: 'Great cause!',
        createdAt: new Date().toISOString()
      }
    ];

    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: mockDonations } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: mockStats });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      expect(screen.getByText('Support Your Community')).toBeInTheDocument();
      expect(screen.getByText('$1,000')).toBeInTheDocument();
      expect(screen.getByText('20 contributions')).toBeInTheDocument();
    });
  });

  test('renders donation form', async () => {
    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 0, donationCount: 0 } });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      expect(screen.getByText('Make a Contribution')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Message (optional)')).toBeInTheDocument();
    });
  });

  test('shows preset amount buttons', async () => {
    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 0, donationCount: 0 } });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      expect(screen.getByText('$5')).toBeInTheDocument();
      expect(screen.getByText('$10')).toBeInTheDocument();
      expect(screen.getByText('$25')).toBeInTheDocument();
      expect(screen.getByText('$50')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });
  });

  test('handles preset amount selection', async () => {
    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 0, donationCount: 0 } });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      const presetButton = screen.getByText('$25');
      user.click(presetButton);
      expect(presetButton).toHaveClass('selected');
    });
  });

  test('handles custom amount input', async () => {
    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 0, donationCount: 0 } });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      const customButton = screen.getByText('Custom');
      user.click(customButton);
      
      const customInput = screen.getByPlaceholderText('Enter amount');
      user.type(customInput, '75');
      
      expect(customInput).toHaveValue('75');
    });
  });

  test('validates donation amount', async () => {
    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 0, donationCount: 0 } });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Donate/i });
      user.click(submitButton);

      expect(screen.getByText('Minimum donation is $1')).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 0, donationCount: 0 } });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      const customButton = screen.getByText('Custom');
      user.click(customButton);
      
      const customInput = screen.getByPlaceholderText('Enter amount');
      user.type(customInput, '10');
      
      const emailInput = screen.getByLabelText('Email');
      user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /Donate/i });
      user.click(submitButton);

      expect(screen.getByText('Valid email is required')).toBeInTheDocument();
    });
  });

  test('handles anonymous donation checkbox', async () => {
    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 0, donationCount: 0 } });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      const anonymousCheckbox = screen.getByLabelText('Donate anonymously');
      user.click(anonymousCheckbox);
      
      expect(anonymousCheckbox).toBeChecked();
    });
  });

  test('shows recent donations', async () => {
    const mockDonations = [
      {
        _id: '1',
        donor: { name: 'John Doe' },
        amount: 50,
        message: 'Great cause!',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        _id: '2',
        donor: { name: 'Jane Smith' },
        amount: 25,
        message: 'Happy to help',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      }
    ];

    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: mockDonations } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 75, donationCount: 2 } });

    renderWithRouter(<Donate />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('$50')).toBeInTheDocument();
      expect(screen.getByText('$25')).toBeInTheDocument();
      expect(screen.getByText('"Great cause!"')).toBeInTheDocument();
      expect(screen.getByText('"Happy to help"')).toBeInTheDocument();
    });
  });

  test('shows success state after donation', async () => {
    mockDonationsAPI.getAll.mockResolvedValue({ data: { donations: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 0, donationCount: 0 } });

    // Mock successful payment
    const mockConfirmCardPayment = jest.fn().mockResolvedValue({
      paymentIntent: { status: 'succeeded' }
    });

    jest.doMock('@stripe/react-stripe-js', () => ({
      Elements: ({ children }) => children,
      CardElement: () => <input data-testid="card-element" />,
      useStripe: () => ({ confirmCardPayment: mockConfirmCardPayment }),
      useElements: () => ({ getElement: () => ({ value: '4242424242424242' }) }),
    }));

    renderWithRouter(<Donate />);

    await waitFor(() => {
      const customButton = screen.getByText('Custom');
      user.click(customButton);
      
      const customInput = screen.getByPlaceholderText('Enter amount');
      user.type(customInput, '25');
      
      const nameInput = screen.getByLabelText('Your Name');
      user.type(nameInput, 'Test User');
      
      const emailInput = screen.getByLabelText('Email');
      user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /Donate/i });
      user.click(submitButton);

      // Should show success state
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('Your donation of $25 has been processed successfully')).toBeInTheDocument();
    });
  });
});
