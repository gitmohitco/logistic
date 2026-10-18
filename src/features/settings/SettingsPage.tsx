import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Palette, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Sun, 
  Moon, 
  Laptop,
  Check,
  Building,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTheme, ColorPalette } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { ROLE_CONFIGS } from '../../config/roles';

interface PaletteOption {
  id: ColorPalette;
  name: string;
  tagline: string;
  swatches: string[];
  accentColor: string;
}

const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: 'default',
    name: 'Executive Sapphire',
    tagline: 'Classic corporate navy & sapphire blue',
    swatches: ['#18217E', '#0284C7', '#E2E8F0'],
    accentColor: '#18217E',
  },
  {
    id: 'wine',
    name: 'Royal Wine',
    tagline: 'Velvet bordeaux & deep ruby rose',
    swatches: ['#881337', '#BE123C', '#FB7185'],
    accentColor: '#BE123C',
  },
  {
    id: 'frost-green',
    name: 'Frost Green',
    tagline: 'Arctic pine & frosted emerald aurora',
    swatches: ['#064E3B', '#059669', '#34D399'],
    accentColor: '#059669',
  },
  {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    tagline: 'Cool glacier ice & arctic cyan',
    swatches: ['#0369A1', '#0284C7', '#38BDF8'],
    accentColor: '#0284C7',
  },
  {
    id: 'amber-sunset',
    name: 'Amber Sunset',
    tagline: 'Warm desert copper & golden honey',
    swatches: ['#B45309', '#D97706', '#FCD34D'],
    accentColor: '#D97706',
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    tagline: 'Imperial purple & cyber violet',
    swatches: ['#5B21B6', '#7C3AED', '#C4B5FD'],
    accentColor: '#7C3AED',
  },
];

export const SettingsPage: React.FC = () => {
  const { user, role, updateUserProfile, changePassword } = useAuth();
  const { theme, resolvedTheme, template, palette, setTheme, setTemplate, setPalette } = useTheme();
  const roleConfig = ROLE_CONFIGS[role];

  // Active Tab: 'profile' | 'security' | 'appearance' | 'template'
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'template'>('profile');

  // Personal Details State
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '+1 (555) 234-8901');
  const [department, setDepartment] = useState(user.department || roleConfig.label);
  const [title, setTitle] = useState(user.title || `${roleConfig.label} Lead`);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Profile Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      phone: phone.trim(),
      department: department.trim(),
      title: title.trim(),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 4000);
  };

  // Password Update Handler
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please re-enter.');
      return;
    }

    const res = changePassword(currentPassword, newPassword);
    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password.');
    } else {
      setPasswordSuccess('Password successfully updated and encrypted with SHA-256.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 5
  };
  const passScore = getPasswordStrength(newPassword);

  const navTabs = [
    { id: 'profile', label: 'Personal Details', icon: User, desc: 'Profile identity & contact info' },
    { id: 'security', label: 'Security & Password', icon: Lock, desc: 'Credentials & access controls' },
    { id: 'appearance', label: 'Application Theme', icon: Palette, desc: 'Light, dark & system palettes' },
    { id: 'template', label: 'Template Engine', icon: Sparkles, desc: 'Corporate vs. Glassmorphism' },
  ] as const;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#D0D9DE] shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#18217E]/10 border border-[#18217E]/20 flex items-center justify-center text-[#18217E] flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-[#09104D]">
                  System Preferences & Settings
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18217E]/10 text-[#18217E] border border-[#18217E]/20">
                  {roleConfig.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Persona
                </span>
              </div>
              <p className="text-xs text-[#393A50] mt-1">
                Configure user account profile, credential security, display themes, and UI aesthetic templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-xs text-[#8A9995] font-mono">
              Active: <strong className="text-[#18217E] font-sans">{template === 'glassmorphism' ? 'Aero Glass' : 'Corporate Clean'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Settings Sidebar Navigation Tabs (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#D0D9DE] shadow-card p-3 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-[#8A9995]">
            Preferences Menu
          </div>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? 'bg-[#18217E] text-white shadow-md font-semibold'
                    : 'text-[#393A50] hover:bg-[#F4F7F9] hover:text-[#09104D]'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/15 text-white' : 'bg-[#E5EBEE] text-[#18217E]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold leading-snug">{tab.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[#8A9995]'}`}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Quick Info Box */}
          <div className="mt-4 pt-4 border-t border-[#D0D9DE] p-3 rounded-xl bg-[#F4F7F9] text-xs space-y-1.5">
            <div className="font-bold text-[#09104D] flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Role-Governed Security</span>
            </div>
            <p className="text-[11px] text-[#393A50] leading-relaxed">
              All personal modifications and template engine settings are persisted to your local profile partition.
            </p>
          </div>
        </div>

        {/* Right Tab Content Panels (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-[#D0D9DE] shadow-card p-6 animate-fadeIn">
              <div className="border-b border-[#D0D9DE] pb-4 mb-5">
                <h2 className="text-base font-bold text-[#09104D] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#18217E]" />
                  <span>Personal Details & Identity</span>
                </h2>
                <p className="text-xs text-[#393A50] mt-1">
                  Manage your display name, official contact email, telephone, and business organization.
                </p>
              </div>

              {profileSaved && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">Profile details successfully updated and synchronized!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* User Avatar Badge Header */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F4F7F9] border border-[#D0D9DE]">
                  <div className="w-14 h-14 rounded-full bg-[#18217E] text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm border-2 border-white">
                    {name.charAt(0) || user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#09104D]">{name || user.name}</h3>
                    <p className="text-xs text-[#393A50] font-mono">{email || user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#18217E]/10 text-[#18217E] border border-[#18217E]/20">
                      {roleConfig.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#09104D] mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8A9995] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#09104D] mb-1">
                      Corporate Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#8A9995] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-[#09104D] mb-1">
                      Mobile / Direct Line
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#8A9995] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-xs font-bold text-[#09104D] mb-1">
                      Job Title / Division
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-[#8A9995] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-[#09104D] mb-1">
                      Department / Function
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[#8A9995] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Organization Affiliation */}
                  <div>
                    <label className="block text-xs font-bold text-[#09104D] mb-1">
                      Assigned Entity / Corridor
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user.carrierName || user.customerName || user.warehouseName || 'Global Enterprise Network (All Nodes)'}
                      className="w-full px-3 py-2 text-xs bg-[#E5EBEE] border border-[#D0D9DE] rounded-xl text-[#393A50] cursor-not-allowed opacity-90"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D0D9DE] flex justify-end">
                  <Button variant="primary" size="md" type="submit">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-[#D0D9DE] shadow-card p-6 animate-fadeIn">
              <div className="border-b border-[#D0D9DE] pb-4 mb-5">
                <h2 className="text-base font-bold text-[#09104D] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#18217E]" />
                  <span>Update Credentials & Password</span>
                </h2>
                <p className="text-xs text-[#393A50] mt-1">
                  Ensure your account is protected with strong password entropy and two-factor compliance standards.
                </p>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-[#09104D] mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password"
                      className="w-full pl-3 pr-10 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9995] hover:text-[#09104D] cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#09104D] mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-3 pr-10 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9995] hover:text-[#09104D] cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 h-1.5 w-full">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-full flex-1 rounded-full transition-all ${
                              passScore >= lvl
                                ? passScore <= 2
                                  ? 'bg-rose-500'
                                  : passScore <= 3
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                : 'bg-[#D0D9DE]'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] text-[#8A9995] flex justify-between font-semibold">
                        <span>Strength:</span>
                        <span className={passScore <= 2 ? 'text-rose-600' : passScore <= 3 ? 'text-amber-600' : 'text-emerald-600'}>
                          {passScore <= 2 ? 'Weak' : passScore <= 3 ? 'Moderate' : passScore <= 4 ? 'Strong' : 'Very Strong'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-[#09104D] mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-3 pr-10 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9995] hover:text-[#09104D] cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Policy Guidelines */}
                <div className="p-3 bg-[#F4F7F9] rounded-xl border border-[#D0D9DE] text-[11px] text-[#393A50] space-y-1">
                  <div className="font-bold text-[#09104D] text-[11px] mb-1">Password Requirements:</div>
                  <div className="flex items-center gap-1.5">
                    <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : 'text-[#8A9995]'}>
                      {newPassword.length >= 8 ? '✓' : '•'} Minimum 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-[#8A9995]'}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '•'} At least one uppercase letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-[#8A9995]'}>
                      {/[0-9]/.test(newPassword) ? '✓' : '•'} At least one numeral (0-9)
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" size="md" type="submit">
                    Update Security Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: APPLICATION THEME (LIGHT / DARK / SYSTEM) */}
          {activeTab === 'appearance' && (
            <div className="bg-white rounded-2xl border border-[#D0D9DE] shadow-card p-6 animate-fadeIn space-y-6">
              <div className="border-b border-[#D0D9DE] pb-4">
                <h2 className="text-base font-bold text-[#09104D] flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[#18217E]" />
                  <span>Application Theme & Color Palette</span>
                </h2>
                <p className="text-xs text-[#393A50] mt-1">
                  Choose your preferred light or dark ambiance for daylight operations or low-light control rooms.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Light Mode */}
                <div
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    theme === 'light'
                      ? 'border-[#18217E] bg-[#18217E]/5 shadow-sm ring-2 ring-[#18217E]/20'
                      : 'border-[#D0D9DE] bg-[#F4F7F9] hover:border-[#424989]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    {theme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-[#18217E] text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-[#09104D]">Daylight Enterprise (Light)</h3>
                  <p className="text-[11px] text-[#393A50] mt-1">
                    Crisp contrast with bright daylight surfaces, optimized for standard daytime office monitors.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#E5EBEE] border border-[#D0D9DE]" />
                    <span className="w-3 h-3 rounded-full bg-[#FFFFFF] border border-[#D0D9DE]" />
                    <span className="w-3 h-3 rounded-full bg-[#18217E]" />
                  </div>
                </div>

                {/* 2. Dark Mode */}
                <div
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    theme === 'dark'
                      ? 'border-indigo-500 bg-zinc-800/30 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-[#D0D9DE] bg-[#F4F7F9] hover:border-[#424989]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-100 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    {theme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-[#09104D]">Obsidian Charcoal (Dark)</h3>
                  <p className="text-[11px] text-[#393A50] mt-1">
                    Refined neutral charcoal & obsidian palette with crisp contrast, eliminating eye strain without blue hue saturation.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0D0F12] border border-[#272B35]" />
                    <span className="w-3 h-3 rounded-full bg-[#16181D] border border-[#272B35]" />
                    <span className="w-3 h-3 rounded-full bg-[#282C37]" />
                  </div>
                </div>

                {/* 3. System Sync */}
                <div
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    theme === 'system'
                      ? 'border-[#18217E] bg-[#18217E]/5 shadow-sm ring-2 ring-[#18217E]/20'
                      : 'border-[#D0D9DE] bg-[#F4F7F9] hover:border-[#424989]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    {theme === 'system' && (
                      <span className="w-5 h-5 rounded-full bg-[#18217E] text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-[#09104D]">System Auto Match</h3>
                  <p className="text-[11px] text-[#393A50] mt-1">
                    Automatically syncs with your operating system preferences (Active: <strong>{resolvedTheme}</strong>).
                  </p>
                  <div className="mt-3 text-[10px] text-[#8A9995] font-mono">
                    OS Sync Active
                  </div>
                </div>
              </div>

              {/* CURATED ACCENT COLOR PALETTES (MINIMUM 5 CURATED PRESETS) */}
              <div className="pt-6 border-t border-[#D0D9DE]/70 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#09104D] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#18217E]" />
                    <span>Curated Accent Color Palettes (6 Luxury Presets)</span>
                  </h3>
                  <p className="text-xs text-[#393A50] mt-0.5">
                    Select a distinctive color mood that dynamically shifts navigation accents, active highlight rings, and radiant wallpaper mesh illumination.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {PALETTE_OPTIONS.map((pal) => {
                    const isSelected = palette === pal.id;
                    return (
                      <div
                        key={pal.id}
                        onClick={() => setPalette(pal.id)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#18217E] bg-white shadow-md ring-2 ring-[#18217E]/20'
                            : 'border-[#D0D9DE] bg-[#F4F7F9] hover:border-[#424989]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[#09104D] flex items-center gap-1.5">
                              <span>{pal.name}</span>
                            </span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-[#18217E] text-white flex items-center justify-center text-[10px] shadow-xs">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#393A50] leading-snug">
                            {pal.tagline}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#D0D9DE]/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {pal.swatches.map((swatch, idx) => (
                              <span
                                key={idx}
                                className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                style={{ backgroundColor: swatch }}
                              />
                            ))}
                          </div>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${pal.accentColor}18`,
                              color: pal.accentColor,
                            }}
                          >
                            {isSelected ? 'Active' : 'Apply'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATE ENGINE (CORPORATE VS GLASSMORPHISM) */}
          {activeTab === 'template' && (
            <div className="bg-white rounded-2xl border border-[#D0D9DE] shadow-card p-6 animate-fadeIn space-y-6">
              <div className="border-b border-[#D0D9DE] pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#09104D] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#18217E]" />
                    <span>Template Style & UI Aesthetic Engine</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#18217E]/10 text-[#18217E]">
                    Dynamic Architecture
                  </span>
                </div>
                <p className="text-xs text-[#393A50] mt-1">
                  Switch the entire design architecture between the classic <strong>Corporate Standard</strong> template and the modern <strong>Glassmorphism (Aero Glass)</strong> aesthetic.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* TEMPLATE A: CORPORATE STANDARD */}
                <div
                  onClick={() => setTemplate('corporate')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    template === 'corporate'
                      ? 'border-[#18217E] bg-white shadow-lg ring-2 ring-[#18217E]/20'
                      : 'border-[#D0D9DE] bg-[#F4F7F9] hover:border-[#424989]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-800 uppercase tracking-wider">
                        Default Production
                      </span>
                      {template === 'corporate' && (
                        <span className="w-6 h-6 rounded-full bg-[#18217E] text-white flex items-center justify-center text-xs shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#09104D]">Corporate Standard</h3>
                    <p className="text-xs text-[#393A50] mt-1 leading-relaxed">
                      Classic enterprise operational styling. High-density solid white cards, geometric structured borders, and high contrast for maximum spreadsheet clarity.
                    </p>

                    <div className="mt-4 p-3 rounded-xl bg-[#F4F7F9] border border-[#D0D9DE] space-y-1.5 text-[11px] text-[#393A50]">
                      <div className="flex items-center gap-1.5 text-[#09104D] font-bold">
                        <span>• Solid opaque card backgrounds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>• High-contrast slate borders</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>• Zero-transparency performance mode</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#D0D9DE]">
                    <button
                      type="button"
                      onClick={() => setTemplate('corporate')}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        template === 'corporate'
                          ? 'bg-[#18217E] text-white shadow-xs'
                          : 'bg-[#E5EBEE] text-[#09104D] hover:bg-[#D0D9DE]'
                      }`}
                    >
                      {template === 'corporate' ? 'Active Template' : 'Switch to Corporate'}
                    </button>
                  </div>
                </div>

                {/* TEMPLATE B: APPLE LIQUID GLASS */}
                <div
                  onClick={() => setTemplate('glassmorphism')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden ${
                    template === 'glassmorphism'
                      ? 'border-[#0071E3] bg-white/70 backdrop-blur-xl shadow-xl ring-2 ring-[#0071E3]/40'
                      : 'border-[#D0D9DE] bg-[#F4F7F9] hover:border-[#0071E3]'
                  }`}
                  style={{
                    background: template === 'glassmorphism'
                      ? 'radial-gradient(circle at top right, rgba(0, 113, 227, 0.15), rgba(255, 255, 255, 0.75))'
                      : undefined
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0071E3]/15 text-[#0071E3] border border-[#0071E3]/30 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#0071E3]" />
                        <span>Apple Liquid Glass (macOS / visionOS)</span>
                      </span>
                      {template === 'glassmorphism' && (
                        <span className="w-6 h-6 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-xs shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#09104D] flex items-center gap-1.5">
                      <span>Apple Liquid Glass Aesthetic</span>
                    </h3>
                    <p className="text-xs text-[#393A50] mt-1 leading-relaxed">
                      Signature Apple frosted glass material with 28px ultra-high diffusion blur, dynamic wallpaper radiance, specular bevel edge reflections, and translucent frosted sidebar & navigation.
                    </p>

                    <div className="mt-4 p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs space-y-1.5 text-[11px] text-[#09104D]">
                      <div className="flex items-center gap-1.5 font-bold text-[#0071E3]">
                        <span>✓ 28px Liquid Retina backdrop diffusion & saturation</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>✓ Specular bevel edge highlights & inner rim reflection</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>✓ Apple macOS / visionOS translucent frosted sidebar</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#D0D9DE]/60">
                    <button
                      type="button"
                      onClick={() => setTemplate('glassmorphism')}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        template === 'glassmorphism'
                          ? 'bg-[#0071E3] text-white shadow-md'
                          : 'bg-[#E5EBEE] text-[#09104D] hover:bg-[#D0D9DE]'
                      }`}
                    >
                      {template === 'glassmorphism' ? 'Active: Apple Glass' : 'Switch to Apple Glass'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Sample */}
              <div className="p-4 rounded-xl border border-[#D0D9DE] bg-[#F4F7F9]">
                <div className="text-xs font-bold text-[#09104D] mb-2 flex items-center justify-between">
                  <span>Interactive Real-time Template Preview:</span>
                  <span className="text-[10px] text-[#8A9995] font-mono">Instant Canvas Application</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#D0D9DE] shadow-card flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#09104D]">TRK-US-89215 (Demo Preview)</h4>
                    <p className="text-[10px] text-[#393A50] mt-0.5">Chicago Central Hub → Newark Air Cargo Gateway</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#0284C7] text-white shadow-xs">
                    ● ON ROUTE
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
