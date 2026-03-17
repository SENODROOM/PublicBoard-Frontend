import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../../components/Footer';

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
}

describe('Footer', () => {
  it('renders the PublicBoard brand name', () => {
    renderFooter();
    expect(screen.getAllByText(/publicboard/i).length).toBeGreaterThan(0);
  });

  it('renders Platform section heading', () => {
    renderFooter();
    expect(screen.getByText('Platform')).toBeInTheDocument();
  });

  it('renders Account section heading', () => {
    renderFooter();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders Categories section heading', () => {
    renderFooter();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('renders the current year in copyright', () => {
    renderFooter();
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('includes a link to /report', () => {
    renderFooter();
    const links = screen.getAllByRole('link', { name: /report/i });
    expect(links.some(l => l.getAttribute('href') === '/report')).toBe(true);
  });

  it('includes a link to /donate', () => {
    renderFooter();
    const links = screen.getAllByRole('link', { name: /donate/i });
    expect(links.some(l => l.getAttribute('href') === '/donate')).toBe(true);
  });

  it('includes the status indicator', () => {
    renderFooter();
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument();
  });
});
