import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">PublicBoard</span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering communities to solve local issues together. Report, track, and resolve issues affecting your neighborhood.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="/report" className="text-sm text-gray-400 hover:text-white transition-colors">Report Issue</a></li>
                <li><a href="/statistics" className="text-sm text-gray-400 hover:text-white transition-colors">Statistics</a></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Community</h3>
              <p className="text-sm text-gray-400 mb-2">Have questions or suggestions?</p>
              <a href="mailto:community@publicboard.local" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                community@publicboard.local
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} PublicBoard. Built for communities, by communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
