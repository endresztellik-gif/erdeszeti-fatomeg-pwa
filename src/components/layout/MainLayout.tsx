import React from 'react';
import Header from './Header';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Fő layout komponens
 * Minden oldalt ez a layout wrapper keretez be
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">{children}</main>
    </div>
  );
}
