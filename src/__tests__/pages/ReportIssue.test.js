import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { issuesAPI } from '../api';
import ReportIssue from '../pages/ReportIssue';

// Mock API
jest.mock('../api');
const mockIssuesAPI = issuesAPI;

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

describe('ReportIssue', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders report issue form', () => {
    renderWithRouter(<ReportIssue />);

    expect(screen.getByText('Report an Issue')).toBeInTheDocument();
    expect(screen.getByText('Help improve your community by reporting local problems')).toBeInTheDocument();
    expect(screen.getByLabelText('Issue Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Issue' })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderWithRouter(<ReportIssue />);

    const submitButton = screen.getByRole('button', { name: 'Submit Issue' });
    await user.click(submitButton);

    // Should show validation errors
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Location is required')).toBeInTheDocument();
  });

  test('validates title length', async () => {
    renderWithRouter(<ReportIssue />);

    const titleInput = screen.getByLabelText('Issue Title');
    await user.type(titleInput, 'A'.repeat(201)); // Over 200 characters

    const submitButton = screen.getByRole('button', { name: 'Submit Issue' });
    await user.click(submitButton);

    expect(screen.getByText('Title must be less than 200 characters')).toBeInTheDocument();
  });

  test('validates description length', async () => {
    renderWithRouter(<ReportIssue />);

    const descriptionInput = screen.getByLabelText('Description');
    await user.type(descriptionInput, 'A'.repeat(2001)); // Over 2000 characters

    const submitButton = screen.getByRole('button', { name: 'Submit Issue' });
    await user.click(submitButton);

    expect(screen.getByText('Description must be less than 2000 characters')).toBeInTheDocument();
  });

  test('handles form input changes', async () => {
    renderWithRouter(<ReportIssue />);

    const titleInput = screen.getByLabelText('Issue Title');
    const descriptionInput = screen.getByLabelText('Description');
    const locationInput = screen.getByLabelText('Location');

    await user.type(titleInput, 'Pothole on Main Street');
    await user.type(descriptionInput, 'There is a large pothole that needs immediate attention');
    await user.type(locationInput, 'Main Street, Downtown');

    expect(titleInput).toHaveValue('Pothole on Main Street');
    expect(descriptionInput).toHaveValue('There is a large pothole that needs immediate attention');
    expect(locationInput).toHaveValue('Main Street, Downtown');
  });

  test('handles category selection', async () => {
    renderWithRouter(<ReportIssue />);

    const categorySelect = screen.getByLabelText('Category');
    await user.selectOptions(categorySelect, 'Infrastructure');

    expect(categorySelect).toHaveValue('Infrastructure');
  });

  test('handles priority selection', async () => {
    renderWithRouter(<ReportIssue />);

    const prioritySelect = screen.getByLabelText('Priority');
    await user.selectOptions(prioritySelect, 'High');

    expect(prioritySelect).toHaveValue('High');
  });

  test('handles tags input', async () => {
    renderWithRouter(<ReportIssue />);

    const tagsInput = screen.getByPlaceholderText('Add tags (comma separated)');
    await user.type(tagsInput, 'pothole, road, dangerous');

    expect(tagsInput).toHaveValue('pothole, road, dangerous');
  });

  test('handles anonymous submission', async () => {
    renderWithRouter(<ReportIssue />);

    const anonymousCheckbox = screen.getByLabelText('Submit anonymously');
    await user.click(anonymousCheckbox);

    expect(anonymousCheckbox).toBeChecked();
  });

  test('submits form successfully', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Test Issue',
      description: 'Test Description',
      category: 'Infrastructure',
      location: 'Test Location',
      priority: 'Medium'
    };

    mockIssuesAPI.create.mockResolvedValue({ data: mockIssue });

    renderWithRouter(<ReportIssue />);

    const titleInput = screen.getByLabelText('Issue Title');
    const descriptionInput = screen.getByLabelText('Description');
    const categorySelect = screen.getByLabelText('Category');
    const locationInput = screen.getByLabelText('Location');
    const prioritySelect = screen.getByLabelText('Priority');
    const submitButton = screen.getByRole('button', { name: 'Submit Issue' });

    await user.type(titleInput, 'Test Issue');
    await user.type(descriptionInput, 'Test Description');
    await user.selectOptions(categorySelect, 'Infrastructure');
    await user.type(locationInput, 'Test Location');
    await user.selectOptions(prioritySelect, 'Medium');

    await user.click(submitButton);

    expect(mockIssuesAPI.create).toHaveBeenCalledWith({
      title: 'Test Issue',
      description: 'Test Description',
      category: 'Infrastructure',
      location: 'Test Location',
      priority: 'Medium',
      tags: [],
      reporter: {
        name: '',
        email: ''
      }
    });
  });

  test('displays loading state during submission', async () => {
    mockIssuesAPI.create.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithRouter(<ReportIssue />);

    const titleInput = screen.getByLabelText('Issue Title');
    const descriptionInput = screen.getByLabelText('Description');
    const locationInput = screen.getByLabelText('Location');
    const submitButton = screen.getByRole('button', { name: 'Submit Issue' });

    await user.type(titleInput, 'Test Issue');
    await user.type(descriptionInput, 'Test Description');
    await user.type(locationInput, 'Test Location');

    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  test('shows success message on successful submission', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Test Issue',
      description: 'Test Description'
    };

    mockIssuesAPI.create.mockResolvedValue({ data: mockIssue });

    renderWithRouter(<ReportIssue />);

    const titleInput = screen.getByLabelText('Issue Title');
    const descriptionInput = screen.getByLabelText('Description');
    const locationInput = screen.getByLabelText('Location');
    const submitButton = screen.getByRole('button', { name: 'Submit Issue' });

    await user.type(titleInput, 'Test Issue');
    await user.type(descriptionInput, 'Test Description');
    await user.type(locationInput, 'Test Location');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Issue submitted successfully!')).toBeInTheDocument();
    });
  });
});
