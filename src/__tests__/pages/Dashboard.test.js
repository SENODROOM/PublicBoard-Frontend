import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { issuesAPI } from '../api';
import Dashboard from '../pages/Dashboard';

// Mock API
jest.mock('../api');
const mockIssuesAPI = issuesAPI;

// Mock components
jest.mock('../components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);
jest.mock('../components/Footer', () => () => <div data-testid="footer">Footer</div>);
jest.mock('../components/AnnouncementBanner', () => () => <div data-testid="announcement-banner">AnnouncementBanner</div>);

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with filters', () => {
    const mockIssues = [
      {
        _id: '1',
        title: 'Test Issue',
        category: 'Infrastructure',
        status: 'Open',
        priority: 'High',
        createdAt: new Date().toISOString()
      }
    ];

    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: mockIssues, total: 1, page: 1, pages: 1 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 1, open: 1 } });

    renderWithRouter(<Dashboard />);

    expect(screen.getByText('Issues Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Filter by Category')).toBeInTheDocument();
    expect(screen.getByText('Filter by Status')).toBeInTheDocument();
    expect(screen.getByText('Filter by Priority')).toBeInTheDocument();
  });

  test('displays issue cards', async () => {
    const mockIssues = [
      {
        _id: '1',
        title: 'Pothole on Main Street',
        category: 'Infrastructure',
        status: 'Open',
        priority: 'High',
        location: 'Main Street',
        supportCount: 5,
        views: 20,
        comments: [],
        createdAt: new Date().toISOString()
      }
    ];

    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: mockIssues, total: 1, page: 1, pages: 1 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 1, open: 1 } });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pothole on Main Street')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Main Street')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [], total: 0, page: 1, pages: 1 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 0, open: 0 } });

    renderWithRouter(<Dashboard />);

    const searchInput = screen.getByPlaceholderText('Search issues...');
    await user.type(searchInput, 'pothole');

    // Should trigger search
    expect(searchInput).toHaveValue('pothole');
  });

  test('handles category filter', async () => {
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [], total: 0, page: 1, pages: 1 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 0, open: 0 } });

    renderWithRouter(<Dashboard />);

    const categorySelect = screen.getByLabelText('Filter by Category');
    await user.selectOptions(categorySelect, 'Infrastructure');

    expect(categorySelect).toHaveValue('Infrastructure');
  });

  test('handles status filter', async () => {
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [], total: 0, page: 1, pages: 1 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 0, open: 0 } });

    renderWithRouter(<Dashboard />);

    const statusSelect = screen.getByLabelText('Filter by Status');
    await user.selectOptions(statusSelect, 'Open');

    expect(statusSelect).toHaveValue('Open');
  });

  test('handles priority filter', async () => {
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [], total: 0, page: 1, pages: 1 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 0, open: 0 } });

    renderWithRouter(<Dashboard />);

    const prioritySelect = screen.getByLabelText('Filter by Priority');
    await user.selectOptions(prioritySelect, 'High');

    expect(prioritySelect).toHaveValue('High');
  });

  test('shows empty state when no issues', async () => {
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [], total: 0, page: 1, pages: 1 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 0, open: 0 } });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No issues found')).toBeInTheDocument();
    });
  });

  test('handles pagination', async () => {
    const mockIssues = Array(20).fill(null).map((_, i) => ({
      _id: String(i + 1),
      title: `Issue ${i + 1}`,
      category: 'Infrastructure',
      status: 'Open',
      priority: 'Medium',
      createdAt: new Date().toISOString()
    }));

    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: mockIssues, total: 50, page: 1, pages: 3 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 50, open: 50 } });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  test('shows report issue button', () => {
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [], total: 0, page: 1, pages: 1 } });
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 0, open: 0 } });

    renderWithRouter(<Dashboard />);

    const reportButton = screen.getByRole('button', { name: 'Report New Issue' });
    expect(reportButton).toBeInTheDocument();
  });
});
