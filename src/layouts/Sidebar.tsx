import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Activity, 
  AlertTriangle, 
  Bot, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Truck,
  Shield,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { ROLE_CONFIGS } from '../config/roles';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  openExceptionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  openExceptionCount = 0,
}) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const roleConfig = ROLE_CONFIGS[role];

  // Navigation Items defined with required permission or role filters
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      allowed: true, // Everyone has a role-aware dashboard
    },
    {
      to: '/shipments',
      label: 'Shipments',
      icon: Package,
      allowed: true,
    },
    {
      to: '/bulk-track',
      label: 'Bulk Tracking',
      icon: Layers,
      allowed: roleConfig.permissions.canBulkTrack,
    },
    {
      to: '/tracking-events',
      label: 'Tracking Events',
      icon: Activity,
      allowed: true,
    },
    {
      to: '/exceptions',
      label: 'Exceptions',
      icon: AlertTriangle,
      badge: openExceptionCount > 0 ? openExceptionCount : undefined,
      badgeColor: 'bg-[#EA341F]',
      allowed: role !== 'CUSTOMER', // Customer does not view internal exception war room
    },
    {
      to: '/ai-assistant',
      label: 'AI Assistant',
      icon: Bot,
      allowed: roleConfig.permissions.canUseAiAssistant,
    },
    {
      to: '/admin/users',
      label: 'User Management',
      icon: Users,
      allowed: roleConfig.permissions.canManageUsers,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      allowed: true,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-[#09104D] text-white flex flex-col h-screen fixed left-0 top-0 z-40 select-none shadow-xl border-r border-[#18217E] transition-all duration-200`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#18217E]/60 bg-[#070724]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-[#18217E] flex items-center justify-center text-white font-bold text-lg shadow-sm border border-[#424989]/50 flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-sm font-extrabold tracking-wider text-white uppercase block leading-tight truncate">
                CONTROL TOWER
              </span>
              <span className="text-[10px] text-[#8A9995] font-medium tracking-widest uppercase block truncate">
                Mendix AI Visibility
              </span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 rounded-md text-[#8A9995] hover:text-white hover:bg-[#18217E]/40 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Role Badge Pill */}
      {!collapsed && (
        <div className="px-4 py-2 bg-[#18217E]/20 border-b border-[#18217E]/30 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#8A9995]" />
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#8A9995]">Active Role</p>
            <p className="text-xs font-semibold text-white truncate">{roleConfig.label}</p>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-[#8A9995] uppercase">
            Navigation
          </div>
        )}

        {navItems
          .filter((item) => item.allowed)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `w-full flex items-center ${
                  collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                } rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#18217E] text-white shadow-md'
                    : 'text-[#E5EBEE]/80 hover:bg-[#18217E]/40 hover:text-white'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-[#8A9995] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white ${
                    item.badgeColor || 'bg-[#EA341F]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

        {/* Mendix API Docs link */}
        <div className="pt-4 mt-4 border-t border-[#18217E]/40">
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-[#8A9995] uppercase">
              Integration
            </div>
          )}
          <a
            href="#mendix-api-info"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard#mendix-contract');
            }}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2'
            } text-xs text-[#8A9995] hover:text-white rounded-lg hover:bg-[#18217E]/20 transition-all`}
            title="Mendix REST Contracts"
          >
            <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
            {!collapsed && <span>Mendix Endpoints</span>}
          </a>
        </div>
      </nav>

      {/* User Profile at Bottom */}
      <div className="p-3 border-t border-[#18217E]/60 bg-[#070724]/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#18217E] border border-[#424989] flex items-center justify-center font-bold text-xs text-white uppercase flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-[#8A9995] truncate">
                  {user.carrierName || user.customerName || user.warehouseName || roleConfig.label}
                </p>
              </div>
            )}
          </div>
          <button
            title="Switch Persona / Log Out"
            className="p-1.5 text-[#8A9995] hover:text-[#EA341F] transition-colors rounded hover:bg-[#18217E]/30 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
