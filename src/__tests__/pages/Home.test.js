import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { issuesAPI, donationsAPI } from '../api';
import Home from '../pages/Home';

// Mock API
jest.mock('../api');
const mockIssuesAPI = issuesAPI;
const mockDonationsAPI = donationsAPI;

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

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders hero section', () => {
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 100, open: 50 } });
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [] } });
    mockDonationsAPI.getStats.mockResolvedValue({ data: { totalRaised: 1000, donationCount: 50 } });

    renderWithRouter(<Home />);

    expect(screen.getByText('PublicBoard')).toBeInTheDocument();
    expect(screen.getByText(/Community-powered issue tracking/)).toBeInTheDocument();
  });

  test('renders category cards', () => {
    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 100, open: 50 } });
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [] } });

    renderWithRouter(<Home />);

    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByText('Sanitation')).toBeInTheDocument();
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Community Resources')).toBeInTheDocument();
  });

  test('renders stats section', async () => {
    const mockStats = {
      total: 150,
      open: 75,
      resolved: 60,
      inProgress: 15
    };
    
    mockIssuesAPI.getStats.mockResolvedValue({ data: mockStats });
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: [] } });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
    });
  });

  test('renders recent issues', async () => {
    const mockIssues = [
      {
        _id: '1',
        title: 'Test Issue 1',
        category: 'Infrastructure',
        status: 'Open',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Test Issue 2',
        category: 'Safety',
        status: 'In Progress',
        createdAt: new Date().toISOString()
      }
    ];

    mockIssuesAPI.getStats.mockResolvedValue({ data: { total: 100, open: 50 } });
    mockIssuesAPI.getAll.mockResolvedValue({ data: { issues: mockIssues } });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
      expect(screen.getByText('Test Issue 2')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockIssuesAPI.getStats.mockRejectedValue(new Error('API Error'));
    mockIssuesAPI.getAll.mockRejectedValue(new Error('API Error'));

    renderWithRouter(<Home />);

    // Should still render the page structure even if API calls fail
    expect(screen.getByText('PublicBoard')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
  });
});
