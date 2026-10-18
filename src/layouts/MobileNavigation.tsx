import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, AlertTriangle, Bot, Layers } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

export interface MobileNavigationProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  openExceptionCount?: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  openExceptionCount = 0,
}) => {
  const { role } = useAuth();
  const isCustomer = role === 'CUSTOMER';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09104D] border-t border-[#18217E] z-40 px-2 py-2 flex justify-around items-center text-white">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-white font-bold' : 'text-[#8A9995]'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/shipments"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-white font-bold' : 'text-[#8A9995]'
          }`
        }
      >
        <Package className="w-5 h-5" />
        <span>Shipments</span>
      </NavLink>

      {!isCustomer && (
        <NavLink
          to="/bulk-track"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-white font-bold' : 'text-[#8A9995]'
            }`
          }
        >
          <Layers className="w-5 h-5" />
          <span>Bulk Track</span>
        </NavLink>
      )}

      {!isCustomer && (
        <NavLink
          to="/exceptions"
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#EA341F] font-bold' : 'text-[#EA341F]/80'
            }`
          }
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Exceptions</span>
          {openExceptionCount > 0 && (
            <span className="absolute top-0 right-1 px-1.5 py-0.2 bg-[#EA341F] text-white text-[9px] rounded-full">
              {openExceptionCount}
            </span>
          )}
        </NavLink>
      )}

      <NavLink
        to="/ai-assistant"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-white font-bold' : 'text-[#8A9995]'
          }`
        }
      >
        <Bot className="w-5 h-5" />
        <span>AI Copilot</span>
      </NavLink>
    </div>
  );
};
