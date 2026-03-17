import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReportIssue from '../../pages/ReportIssue';

// Mock dependencies
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../api', () => ({ issuesAPI: { create: jest.fn() } }));
jest.mock('react-hot-toast', () => ({ error: jest.fn(), success: jest.fn() }));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const { useAuth } = require('../../context/AuthContext');
const { issuesAPI } = require('../../api');
const toast = require('react-hot-toast');

function renderForm(authUser = null) {
  useAuth.mockReturnValue({ user: authUser });
  return render(<MemoryRouter><ReportIssue /></MemoryRouter>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
});

describe('ReportIssue — step 0 (Details)', () => {
  it('renders the Details step initially', () => {
    renderForm();
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/short, clear description/i)).toBeInTheDocument();
  });

  it('shows validation error when title is missing', async () => {
    renderForm();
    fireEvent.click(screen.getByText(/next: location/i));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/title/i));
  });

  it('shows validation error when category is missing', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/short, clear description/i), 'A title');
    fireEvent.click(screen.getByText(/next: location/i));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/category/i));
  });

  it('shows validation error when description is missing', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/short, clear description/i), 'A title');
    // Select category
    fireEvent.change(screen.getByRole('combobox', { name: '' }), { target: { value: 'Infrastructure' } });
    fireEvent.click(screen.getByText(/next: location/i));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/description/i));
  });

  it('advances to step 1 when all details are valid', async () => {
    renderForm();

    const titleInput = screen.getByPlaceholderText(/short, clear description/i);
    await userEvent.type(titleInput, 'Broken streetlight');

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Infrastructure' } });

    const descInput = screen.getByPlaceholderText(/describe the issue/i);
    await userEvent.type(descInput, 'It has been broken for two weeks causing safety issues');

    fireEvent.click(screen.getByText(/next: location/i));

    await waitFor(() => {
      expect(screen.getByText(/street address/i)).toBeInTheDocument();
    });
  });
});

describe('ReportIssue — step 1 (Location)', () => {
  async function advanceToStep1() {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/short, clear description/i), 'Broken streetlight');
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Infrastructure' } });
    await userEvent.type(screen.getByPlaceholderText(/describe the issue/i), 'Long enough description here for the validator');
    fireEvent.click(screen.getByText(/next: location/i));
    await waitFor(() => expect(screen.getByText(/street address/i)).toBeInTheDocument());
  }

  it('shows validation error when location is empty', async () => {
    await advanceToStep1();
    fireEvent.click(screen.getByText(/next: contact/i));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/location/i));
  });

  it('can go back to step 0', async () => {
    await advanceToStep1();
    fireEvent.click(screen.getByText(/← back/i));
    expect(screen.getByPlaceholderText(/short, clear description/i)).toBeInTheDocument();
  });
});

describe('ReportIssue — step 2 (Contact) — unauthenticated', () => {
  async function advanceToStep2() {
    renderForm(null);
    await userEvent.type(screen.getByPlaceholderText(/short, clear description/i), 'Broken streetlight');
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Infrastructure' } });
    await userEvent.type(screen.getByPlaceholderText(/describe the issue/i), 'Long enough description here');
    fireEvent.click(screen.getByText(/next: location/i));
    await waitFor(() => screen.getByText(/street address/i));
    await userEvent.type(screen.getByPlaceholderText(/oak ave/i), '123 Main St');
    fireEvent.click(screen.getByText(/next: contact/i));
    await waitFor(() => screen.getByText(/your name/i));
  }

  it('shows name and email fields for unauthenticated user', async () => {
    await advanceToStep2();
    expect(screen.getByPlaceholderText(/jane smith/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/jane@example\.com/i)).toBeInTheDocument();
  });

  it('shows validation error when name is missing', async () => {
    await advanceToStep2();
    fireEvent.click(screen.getByText(/review/i));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/name/i));
  });
});

describe('ReportIssue — step 3 (Review) and submit', () => {
  async function advanceToReview() {
    renderForm({ name: 'Alice', email: 'alice@test.com', _id: 'u1' });
    await userEvent.type(screen.getByPlaceholderText(/short, clear description/i), 'Broken streetlight');
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Infrastructure' } });
    await userEvent.type(screen.getByPlaceholderText(/describe the issue/i), 'Long enough description here');
    fireEvent.click(screen.getByText(/next: location/i));
    await waitFor(() => screen.getByText(/street address/i));
    await userEvent.type(screen.getByPlaceholderText(/oak ave/i), 'Oak Ave & 5th St');
    fireEvent.click(screen.getByText(/next: contact/i));
    await waitFor(() => screen.getByText(/review →/i));
    fireEvent.click(screen.getByText(/review →/i));
    await waitFor(() => screen.getByText(/review your submission/i));
  }

  it('shows the review summary with title and location', async () => {
    await advanceToReview();
    expect(screen.getByText('Broken streetlight')).toBeInTheDocument();
    expect(screen.getByText(/oak ave/i)).toBeInTheDocument();
  });

  it('calls issuesAPI.create on submit', async () => {
    issuesAPI.create.mockResolvedValue({ data: { issue: { _id: 'new-issue-1' } } });
    await advanceToReview();
    fireEvent.click(screen.getByText(/submit issue report/i));
    await waitFor(() => expect(issuesAPI.create).toHaveBeenCalledTimes(1));
  });

  it('navigates to the new issue on success', async () => {
    issuesAPI.create.mockResolvedValue({ data: { issue: { _id: 'new-issue-1' } } });
    await advanceToReview();
    fireEvent.click(screen.getByText(/submit issue report/i));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/issues/new-issue-1'));
  });

  it('shows error toast on API failure', async () => {
    issuesAPI.create.mockRejectedValue({ response: { data: { message: 'Server error' } } });
    await advanceToReview();
    fireEvent.click(screen.getByText(/submit issue report/i));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server error'));
  });
});
