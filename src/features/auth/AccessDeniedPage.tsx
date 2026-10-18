import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, UserCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { ROLE_CONFIGS } from '../../config/roles';

export const AccessDeniedPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, loginAsRole } = useAuth();
  const attemptedPath = (location.state as any)?.from || 'the requested resource';

  return (
    <div className="min-h-screen bg-[#E5EBEE] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card border border-[#D0D9DE] p-8 text-center">
        <div className="w-16 h-16 bg-[#EA341F]/10 text-[#EA341F] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#EA341F]/20">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#8C2527]/10 text-[#8C2527] border border-[#8C2527]/20">
          HTTP 403 Forbidden
        </span>

        <h1 className="text-xl font-extrabold text-[#09104D] mt-3 mb-2">
          Access Restricted by Policy
        </h1>

        <p className="text-xs text-[#393A50] leading-relaxed mb-6">
          Your active role (<strong className="text-[#18217E]">{ROLE_CONFIGS[role]?.label}</strong>) does not have authorization to access <code className="bg-[#E5EBEE] px-1.5 py-0.5 rounded text-[#070724] font-mono">{attemptedPath}</code>.
        </p>

        <div className="bg-[#F4F7F9] p-3.5 rounded-xl border border-[#D0D9DE] text-left mb-6 text-xs text-[#393A50] space-y-1">
          <p className="font-semibold text-[#09104D]">Security Boundary Note:</p>
          <p className="text-[11px] text-[#8A9995]">
            Access privileges are synchronized with Mendix enterprise role entitlements. Switch to an authorized role below to test permitted workflows.
          </p>
        </div>

        {/* Switch Role Fast Tester */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-[#8A9995] uppercase tracking-wider mb-2 text-left">
            Switch Role to Grant Access:
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              onClick={() => {
                loginAsRole('ADMINISTRATOR');
                navigate('/dashboard');
              }}
              className="p-2 rounded-lg border border-[#D0D9DE] hover:border-[#18217E] bg-white text-xs font-medium text-[#070724] hover:bg-[#F4F7F9] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#18217E]" />
              <span>Administrator</span>
            </button>
            <button
              onClick={() => {
                loginAsRole('CONTROL_TOWER_ANALYST');
                navigate('/dashboard');
              }}
              className="p-2 rounded-lg border border-[#D0D9DE] hover:border-[#18217E] bg-white text-xs font-medium text-[#070724] hover:bg-[#F4F7F9] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#424989]" />
              <span>Analyst</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[#D0D9DE] text-xs font-bold text-[#393A50] hover:bg-[#F4F7F9] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#18217E] text-white text-xs font-bold hover:bg-[#121860] transition-colors shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
