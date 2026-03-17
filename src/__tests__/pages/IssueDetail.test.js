import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { issuesAPI } from '../api';
import IssueDetail from '../pages/IssueDetail';

// Mock API
jest.mock('../api');
const mockIssuesAPI = issuesAPI;

// Mock components
jest.mock('../components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);
jest.mock('../components/Footer', () => () => <div data-testid="footer">Footer</div>);
jest.mock('../components/IssueCard', () => ({ issue }) => (
  <div data-testid="issue-card">{issue.title}</div>
));

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('IssueDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders issue details', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Pothole on Main Street',
      description: 'Large pothole causing traffic issues',
      category: 'Infrastructure',
      status: 'Open',
      priority: 'High',
      location: 'Main Street, Downtown',
      reporter: { name: 'John Doe', email: 'john@example.com' },
      createdAt: new Date().toISOString(),
      supportCount: 15,
      views: 100,
      comments: [
        {
          _id: '1',
          author: { name: 'Jane Smith', userId: '2' },
          text: 'This needs immediate attention',
          createdAt: new Date().toISOString()
        }
      ],
      tags: ['pothole', 'road', 'dangerous']
    };

    mockIssuesAPI.getOne.mockResolvedValue({ data: { issue: mockIssue } });
    mockIssuesAPI.getRelated.mockResolvedValue({ data: { issues: [] } });

    renderWithRouter(<IssueDetail />);

    await screen.findByText('Pothole on Main Street');
    expect(screen.getByText('Large pothole causing traffic issues')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Main Street, Downtown')).toBeInTheDocument();
    expect(screen.getByText('Reported by John Doe')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // support count
    expect(screen.getByText('100')).toBeInTheDocument(); // views
  });

  test('renders comments section', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Test Issue',
      description: 'Test description',
      category: 'Infrastructure',
      status: 'Open',
      priority: 'Medium',
      location: 'Test Location',
      reporter: { name: 'John Doe' },
      createdAt: new Date().toISOString(),
      supportCount: 5,
      views: 20,
      comments: [
        {
          _id: '1',
          author: { name: 'Jane Smith', userId: '2', role: 'user' },
          text: 'First comment',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          _id: '2',
          author: { name: 'Admin User', userId: '3', role: 'admin' },
          text: 'Admin response',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        }
      ]
    };

    mockIssuesAPI.getOne.mockResolvedValue({ data: { issue: mockIssue } });
    mockIssuesAPI.getRelated.mockResolvedValue({ data: { issues: [] } });

    renderWithRouter(<IssueDetail />);

    await screen.findByText('Test Issue');
    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Admin response')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  test('renders related issues', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Main Issue',
      description: 'Description',
      category: 'Infrastructure',
      status: 'Open',
      priority: 'Medium',
      location: 'Location',
      reporter: { name: 'John Doe' },
      createdAt: new Date().toISOString(),
      supportCount: 5,
      views: 20,
      comments: []
    };

    const mockRelatedIssues = [
      {
        _id: '2',
        title: 'Related Issue 1',
        category: 'Infrastructure',
        supportCount: 3
      },
      {
        _id: '3',
        title: 'Related Issue 2',
        category: 'Safety',
        supportCount: 7
      }
    ];

    mockIssuesAPI.getOne.mockResolvedValue({ data: { issue: mockIssue } });
    mockIssuesAPI.getRelated.mockResolvedValue({ data: { issues: mockRelatedIssues } });

    renderWithRouter(<IssueDetail />);

    await screen.findByText('Main Issue');
    expect(screen.getByText('Related Issues')).toBeInTheDocument();
    expect(screen.getByTestId('issue-card')).toHaveTextContent('Related Issue 1');
    expect(screen.getByTestId('issue-card')).toHaveTextContent('Related Issue 2');
  });

  test('shows support button', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Test Issue',
      description: 'Test description',
      category: 'Infrastructure',
      status: 'Open',
      priority: 'Medium',
      location: 'Test Location',
      reporter: { name: 'John Doe' },
      createdAt: new Date().toISOString(),
      supportCount: 5,
      views: 20,
      comments: []
    };

    mockIssuesAPI.getOne.mockResolvedValue({ data: { issue: mockIssue } });
    mockIssuesAPI.getRelated.mockResolvedValue({ data: { issues: [] } });

    renderWithRouter(<IssueDetail />);

    await screen.findByText('Test Issue');
    const supportButton = screen.getByRole('button', { name: /Support/i });
    expect(supportButton).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // current support count
  });

  test('shows bookmark button', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Test Issue',
      description: 'Test description',
      category: 'Infrastructure',
      status: 'Open',
      priority: 'Medium',
      location: 'Test Location',
      reporter: { name: 'John Doe' },
      createdAt: new Date().toISOString(),
      supportCount: 5,
      views: 20,
      comments: []
    };

    mockIssuesAPI.getOne.mockResolvedValue({ data: { issue: mockIssue } });
    mockIssuesAPI.getRelated.mockResolvedValue({ data: { issues: [] } });

    renderWithRouter(<IssueDetail />);

    await screen.findByText('Test Issue');
    const bookmarkButton = screen.getByRole('button', { name: /Bookmark/i });
    expect(bookmarkButton).toBeInTheDocument();
  });

  test('displays tags', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Test Issue',
      description: 'Test description',
      category: 'Infrastructure',
      status: 'Open',
      priority: 'Medium',
      location: 'Test Location',
      reporter: { name: 'John Doe' },
      createdAt: new Date().toISOString(),
      supportCount: 5,
      views: 20,
      comments: [],
      tags: ['infrastructure', 'road', 'urgent', 'city-council']
    };

    mockIssuesAPI.getOne.mockResolvedValue({ data: { issue: mockIssue } });
    mockIssuesAPI.getRelated.mockResolvedValue({ data: { issues: [] } });

    renderWithRouter(<IssueDetail />);

    await screen.findByText('Test Issue');
    expect(screen.getByText('infrastructure')).toBeInTheDocument();
    expect(screen.getByText('road')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
    expect(screen.getByText('city-council')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockIssuesAPI.getOne.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<IssueDetail />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows error state when issue not found', async () => {
    mockIssuesAPI.getOne.mockRejectedValue(new Error('Issue not found'));

    renderWithRouter(<IssueDetail />);

    await screen.findByText('Issue not found');
    expect(screen.getByRole('link', { name: '← Back to Dashboard' })).toBeInTheDocument();
  });

  test('shows status updates', async () => {
    const mockIssue = {
      _id: '1',
      title: 'Test Issue',
      description: 'Test description',
      category: 'Infrastructure',
      status: 'In Progress',
      priority: 'Medium',
      location: 'Test Location',
      reporter: { name: 'John Doe' },
      createdAt: new Date().toISOString(),
      supportCount: 5,
      views: 20,
      comments: [],
      updates: [
        {
          message: 'We are working on this issue',
          status: 'In Progress',
          updatedBy: 'Admin User',
          updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        }
      ]
    };

    mockIssuesAPI.getOne.mockResolvedValue({ data: { issue: mockIssue } });
    mockIssuesAPI.getRelated.mockResolvedValue({ data: { issues: [] } });

    renderWithRouter(<IssueDetail />);

    await screen.findByText('Test Issue');
    expect(screen.getByText('Status Updates')).toBeInTheDocument();
    expect(screen.getByText('We are working on this issue')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });
});
