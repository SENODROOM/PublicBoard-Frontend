import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer';

describe('Footer', () => {
  test('renders logo and brand information', () => {
    render(<Footer />);
    
    expect(screen.getByAltText('PublicBoard')).toBeInTheDocument();
    expect(screen.getByText('PublicBoard')).toBeInTheDocument();
    expect(screen.getByText(/Community-powered issue tracking/)).toBeInTheDocument();
  });

  test('renders all link sections', () => {
    render(<Footer />);
    
    // Platform section
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
    expect(screen.getByText('Report Issue')).toBeInTheDocument();
    expect(screen.getByText('Advanced Search')).toBeInTheDocument();
    expect(screen.getByText('Donate')).toBeInTheDocument();
    
    // Account section
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
    
    // Categories section
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByText('Sanitation')).toBeInTheDocument();
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Community Resources')).toBeInTheDocument();
  });

  test('renders copyright information', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} PublicBoard — Open source civic tech`)).toBeInTheDocument();
  });

  test('renders system status indicator', () => {
    render(<Footer />);
    
    expect(screen.getByText('All systems operational')).toBeInTheDocument();
  });
});
