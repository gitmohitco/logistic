import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  ChevronDown,
  Database,
  Check,
  Settings
} from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../features/auth/AuthContext';
import { ROLE_CONFIGS } from '../config/roles';

export interface TopHeaderProps {
  pageTitle: string;
  breadcrumb?: string[];
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  reportingPeriod?: string;
  onReportingPeriodChange?: (p: string) => void;
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  unreadAlertsCount?: number;
  onOpenAlerts?: () => void;
  collapsed?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  pageTitle,
  breadcrumb = ['Control Tower', 'Overview'],
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  reportingPeriod = 'Today (Live)',
  onReportingPeriodChange,
  lastUpdated = 'Live',
  isRefreshing = false,
  onRefresh,
  unreadAlertsCount = 0,
  onOpenAlerts,
  collapsed = false,
}) => {
  const navigate = useNavigate();
  const { role, loginAsRole, user } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const rolesList: UserRole[] = [
    'ADMINISTRATOR',
    'CONTROL_TOWER_ANALYST',
    'DISPATCHER_PLANNER',
    'CARRIER',
    'WAREHOUSE_SUPERVISOR',
    'CUSTOMER_SERVICE',
    'CUSTOMER',
  ];

  const periods = [
    'Today (Live)',
    'Last 7 Days',
    'Last 30 Days (MTD)',
    'Current Quarter (Q4)',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(localSearch);
    } else if (localSearch.trim()) {
      navigate(`/shipments?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const isMockMode = import.meta.env.VITE_USE_MOCK !== 'false';

  return (
    <header
      className={`h-16 bg-white border-b border-[#D0D9DE] fixed top-0 right-0 ${
        collapsed ? 'left-20' : 'left-64'
      } z-40 px-6 flex items-center justify-between shadow-xs select-none transition-all duration-200`}
    >
      {/* Left: Title & Breadcrumbs */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-[11px] text-[#393A50]">
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && <span className="text-[#8A9995]">/</span>}
              <span className={idx === breadcrumb.length - 1 ? 'font-semibold text-[#18217E]' : ''}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
          <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-[#424989]/30 bg-[#424989]/10 text-[#18217E] flex items-center gap-1">
            <Database className="w-2.5 h-2.5" />
            {isMockMode ? 'Mendix Adapter: Active' : 'Mendix REST Connected'}
          </span>
        </div>
        <h1 className="text-base font-extrabold text-[#09104D] leading-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Middle: Global Search */}
      <div className="relative w-80 max-w-sm">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-[#424989] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            placeholder="Search tracking ID, carrier, hub..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg text-[#070724] placeholder-[#8A9995] focus:outline-none focus:border-[#18217E] focus:bg-white focus:ring-1 focus:ring-[#18217E] transition-all"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Reporting Period Selector */}
        {onReportingPeriodChange && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setPeriodMenuOpen(!periodMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#393A50] bg-[#F4F7F9] hover:bg-[#E5EBEE] rounded-lg border border-[#D0D9DE] transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#424989]" />
              <span>{reportingPeriod}</span>
              <ChevronDown className="w-3 h-3 text-[#8A9995]" />
            </button>
            {periodMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#D0D9DE] rounded-lg shadow-card py-1 z-30">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      onReportingPeriodChange(p);
                      setPeriodMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      reportingPeriod === p
                        ? 'bg-[#18217E]/10 text-[#18217E] font-bold'
                        : 'text-[#070724] hover:bg-[#F4F7F9]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data Refresh Indicator */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={`Last updated: ${lastUpdated}. Click to re-sync with Mendix.`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#393A50] hover:text-[#18217E] hover:bg-[#E5EBEE] rounded-lg border border-[#D0D9DE] transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#424989] ${
                isRefreshing ? 'animate-spin text-[#18217E]' : ''
              }`}
            />
            <span className="hidden xl:inline text-[11px] text-[#8A9995]">
              {isRefreshing ? 'Syncing...' : 'Live'}
            </span>
          </button>
        )}

        {/* Notification / Alert Indicator */}
        <button
          onClick={() => {
            if (onOpenAlerts) onOpenAlerts();
            else navigate('/exceptions');
          }}
          title="Open Shipment Exceptions"
          className="relative p-2 text-[#393A50] hover:text-[#09104D] hover:bg-[#E5EBEE] rounded-lg border border-[#D0D9DE] transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 text-[#424989]" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#EA341F] text-white text-[10px] font-bold rounded-full border-2 border-white">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          title="System Preferences & Profile Settings"
          className="p-2 text-[#393A50] hover:text-[#09104D] hover:bg-[#E5EBEE] rounded-lg border border-[#D0D9DE] transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#424989]" />
        </button>

        {/* Seven-Role Switcher (Crucial for test driving all perspectives!) */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 bg-[#09104D] text-white rounded-lg text-xs font-semibold hover:bg-[#18217E] transition-colors cursor-pointer border border-[#18217E]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#8A9995]" />
            <span className="truncate max-w-[130px]">{ROLE_CONFIGS[role]?.label}</span>
            <ChevronDown className="w-3 h-3 text-[#8A9995]" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1 w-72 bg-white border border-[#D0D9DE] rounded-xl shadow-modal py-1.5 z-40">
              <div className="px-3 py-2 border-b border-[#D0D9DE] bg-[#F4F7F9]">
                <p className="text-[10px] font-bold text-[#8A9995] uppercase tracking-wider">
                  Switch Active Role Persona (7 Roles)
                </p>
                <p className="text-xs text-[#070724] font-medium mt-0.5">
                  Currently: <strong className="text-[#18217E]">{user.name}</strong>
                </p>
              </div>
              <div className="py-1 max-h-80 overflow-y-auto">
                {rolesList.map((r) => {
                  const cfg = ROLE_CONFIGS[r];
                  const isCurrent = role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        loginAsRole(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-start justify-between ${
                        isCurrent ? 'bg-[#18217E]/10 text-[#18217E]' : 'text-[#070724] hover:bg-[#F4F7F9]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          {cfg.label}
                          {isCurrent && <Check className="w-3 h-3 text-[#18217E]" />}
                        </div>
                        <div className="text-[10px] text-[#393A50] font-normal leading-tight mt-0.5">
                          {cfg.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t border-[#D0D9DE] bg-[#F4F7F9]">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/settings');
                    setRoleMenuOpen(false);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold text-[#18217E] bg-white hover:bg-[#18217E]/10 border border-[#D0D9DE] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Profile Preferences & Themes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
