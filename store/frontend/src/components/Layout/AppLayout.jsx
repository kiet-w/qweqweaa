import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export const AppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default AppLayout;
