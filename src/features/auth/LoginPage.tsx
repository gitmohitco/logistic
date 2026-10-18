import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, ArrowRight, Lock, CheckCircle2, Building, User } from 'lucide-react';
import { useAuth, ROLE_PRESET_USERS } from './AuthContext';
import { UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../config/roles';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { role: currentRole, loginAsRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const rolesList: UserRole[] = [
    'ADMINISTRATOR',
    'CONTROL_TOWER_ANALYST',
    'DISPATCHER_PLANNER',
    'CARRIER',
    'WAREHOUSE_SUPERVISOR',
    'CUSTOMER_SERVICE',
    'CUSTOMER',
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      loginAsRole(selectedRole);
      setIsAuthenticating(false);
      navigate('/dashboard');
    }, 400);
  };

  const activePreset = ROLE_PRESET_USERS[selectedRole];
  const activeConfig = ROLE_CONFIGS[selectedRole];

  return (
    <div className="min-h-screen bg-[#E5EBEE] flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#18217E] flex items-center justify-center text-white shadow-md border border-[#424989]">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-xl font-extrabold text-[#09104D] tracking-wide block leading-none">
            SHIPMENT EXCEPTION CONTROL TOWER
          </span>
          <span className="text-xs text-[#424989] font-semibold tracking-wider uppercase">
            Enterprise Logistics & Mendix AI Visibility
          </span>
        </div>
      </div>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-modal border border-[#D0D9DE] overflow-hidden">
        {/* Banner */}
        <div className="bg-[#09104D] p-6 text-white border-b border-[#18217E]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white">Authorized Access Portal</h2>
              <p className="text-xs text-[#8A9995] mt-0.5">
                Role-Based Entitlement Handoff via Mendix Published REST Services
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[#18217E]/60 border border-[#424989]/40 text-[#8A9995]">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-6">
          {/* Role Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-[#09104D] uppercase tracking-wider mb-2">
              Select Enterprise Role Persona:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rolesList.map((r) => {
                const cfg = ROLE_CONFIGS[r];
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-[#18217E] bg-[#18217E]/5 ring-2 ring-[#18217E]/20'
                        : 'border-[#D0D9DE] hover:border-[#424989] bg-white hover:bg-[#F4F7F9]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border transition-colors flex-shrink-0 ${
                        isSelected
                          ? 'border-[#18217E] bg-[#18217E] text-white'
                          : 'border-[#D0D9DE] bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#070724] leading-tight">
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-[#393A50] mt-0.5 line-clamp-1">
                        {cfg.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Persona Context Card */}
          <div className="bg-[#F4F7F9] p-4 rounded-xl border border-[#D0D9DE] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#09104D] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#18217E]" />
                {activePreset.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18217E] text-white uppercase">
                {activeConfig.label}
              </span>
            </div>
            <p className="text-[11px] text-[#393A50] font-mono">
              {activePreset.email}
            </p>
            {activePreset.carrierName && (
              <p className="text-[11px] text-[#18217E] font-medium flex items-center gap-1">
                <Building className="w-3 h-3" />
                Carrier Org: {activePreset.carrierName} ({activePreset.carrierId})
              </p>
            )}
            {activePreset.customerName && (
              <p className="text-[11px] text-[#107C41] font-medium flex items-center gap-1">
                <Building className="w-3 h-3" />
                Customer Account: {activePreset.customerName}
              </p>
            )}
            {activePreset.warehouseName && (
              <p className="text-[11px] text-[#424989] font-medium flex items-center gap-1">
                <Building className="w-3 h-3" />
                Warehouse Hub: {activePreset.warehouseName}
              </p>
            )}
            <p className="text-[10px] text-[#8A9995] pt-1 border-t border-[#D0D9DE]">
              Entitlement scope: {activeConfig.allowedRoutes.length} route areas permitted • Mendix security enforced
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#18217E] hover:bg-[#121860] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isAuthenticating ? (
              <span>Authenticating with Mendix...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Enter Control Tower as {activeConfig.label}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="px-6 py-3 bg-[#F4F7F9] border-t border-[#D0D9DE] text-center">
          <p className="text-[10px] text-[#8A9995]">
            Mendix OAuth2/Session handoff boundary • RBAC & entity permissions enforced by backend microflows
          </p>
        </div>
      </div>
    </div>
  );
};
