import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader, TopHeaderProps } from './TopHeader';
import { MobileNavigation } from './MobileNavigation';

export interface AppLayoutProps {
  pageTitle?: string;
  breadcrumb?: string[];
  openExceptionCount?: number;
  headerProps?: Partial<TopHeaderProps>;
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  pageTitle = 'Logistics Control Tower Workspace',
  breadcrumb = ['Control Tower', 'Overview'],
  openExceptionCount = 0,
  headerProps = {},
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#E5EBEE] flex flex-col font-sans">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          openExceptionCount={openExceptionCount}
        />
      </div>

      {/* Top Header */}
      <TopHeader
        pageTitle={pageTitle}
        breadcrumb={breadcrumb}
        unreadAlertsCount={openExceptionCount}
        collapsed={collapsed}
        {...headerProps}
      />

      {/* Main Content Area */}
      <main
        className={`${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        } mt-16 p-4 sm:p-6 flex-1 pb-20 md:pb-8 transition-all duration-200`}
      >
        {children}
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation
        currentTab="dashboard"
        onSelectTab={() => {}}
        openExceptionCount={openExceptionCount}
      />
    </div>
  );
};
