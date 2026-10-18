import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserPlus, 
  Building, 
  CheckCircle2, 
  Activity, 
  Search, 
  RefreshCw,
  Edit2,
  Truck,
  PlusCircle,
  Phone,
  Mail,
  Plane,
  Ship,
  Award
} from 'lucide-react';
import { ManagedUser, UserRole, CarrierOrganization, TransportMode } from '../../types';
import { mendixClient } from '../../services/api/mendixClient';
import { useAuth } from '../auth/AuthContext';
import { ROLE_CONFIGS } from '../../config/roles';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';

export const UserManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'carriers'>('users');

  // Users State
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [carriers, setCarriers] = useState<CarrierOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Edit / Add User Modal state
  const [activeUserModal, setActiveUserModal] = useState<Partial<ManagedUser> | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Add / Edit Carrier Modal state
  const [activeCarrierModal, setActiveCarrierModal] = useState<Partial<CarrierOrganization> | null>(null);
  const [isSavingCarrier, setIsSavingCarrier] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userList, carrierList, health] = await Promise.all([
        mendixClient.getManagedUsers(user),
        mendixClient.getCarriers(user),
        mendixClient.getSystemHealth(user),
      ]);
      setUsers(userList);
      setCarriers(carrierList);
      setHealthStatus(health);
    } catch (err) {
      console.error('Failed to load user and carrier management data', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserModal || !activeUserModal.name || !activeUserModal.email) return;

    setIsSavingUser(true);
    try {
      await mendixClient.updateManagedUser(
        activeUserModal as ManagedUser,
        user
      );
      setActiveUserModal(null);
      await fetchData();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSavingUser(false);
    }
  };

  // Save New / Edited Carrier
  const handleSaveCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCarrierModal || !activeCarrierModal.name) return;

    setIsSavingCarrier(true);
    try {
      await mendixClient.createCarrier(activeCarrierModal, user);
      setActiveCarrierModal(null);
      await fetchData();
    } catch (err: any) {
      alert(`Carrier registration failed: ${err.message}`);
    } finally {
      setIsSavingCarrier(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.carrierName && u.carrierName.toLowerCase().includes(q))
    );
  });

  const filteredCarriers = carriers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.carrierCode.toLowerCase().includes(q) ||
      c.contactEmail.toLowerCase().includes(q) ||
      (c.primaryHub && c.primaryHub.toLowerCase().includes(q))
    );
  });

  const rolesList: UserRole[] = [
    'ADMINISTRATOR',
    'CONTROL_TOWER_ANALYST',
    'DISPATCHER_PLANNER',
    'CARRIER',
    'WAREHOUSE_SUPERVISOR',
    'CUSTOMER_SERVICE',
    'CUSTOMER',
  ];

  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'AIR':
        return <Plane className="w-3.5 h-3.5 text-[#18217E]" />;
      case 'SEA':
        return <Ship className="w-3.5 h-3.5 text-[#424989]" />;
      case 'GROUND':
      default:
        return <Truck className="w-3.5 h-3.5 text-[#09104D]" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-[#09104D]">
              Administrator Governance & Partner Directory
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18217E]/10 text-[#18217E]">
              {users.length} Users • {carriers.length} Carriers
            </span>
          </div>
          <p className="text-xs text-[#393A50] mt-0.5">
            Manage user roles across 7 personas and register authorized carrier partner organizations.
          </p>
        </div>

        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            Sync
          </Button>

          {/* New Carrier Add Option */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setActiveCarrierModal({
                name: '',
                carrierCode: `CAR-${String(carriers.length + 1).padStart(3, '0')}`,
                contactEmail: '',
                contactPhone: '',
                transportModes: ['GROUND'],
                slaTier: 'TIER_1_ENTERPRISE',
                status: 'ACTIVE',
                fleetCount: 15,
                primaryHub: 'Chicago Central Logistics Hub',
              })
            }
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="text-xs border-[#18217E] text-[#18217E] hover:bg-[#18217E]/10"
          >
            Add New Carrier
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setActiveUserModal({
                name: '',
                email: '',
                role: 'CONTROL_TOWER_ANALYST',
                status: 'ACTIVE',
              })
            }
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="text-xs"
          >
            Invite User
          </Button>
        </div>
      </div>

      {/* Operational System Health Banner */}
      {healthStatus && (
        <div className="bg-[#09104D] text-white p-4 rounded-xl border border-[#18217E] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#18217E]">
              <Activity className="w-4 h-4 text-[#107C41]" />
            </span>
            <div>
              <span className="text-[10px] text-[#8A9995] uppercase font-bold block">
                Mendix Backend Connector
              </span>
              <span className="font-bold text-white">
                Status: {healthStatus.status} • Service {healthStatus.mendixServiceVersion}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px] text-[#8A9995]">
            <span>Database: <strong className="text-white">{healthStatus.database}</strong></span>
            <span>AI Latency: <strong className="text-white">{healthStatus.aiOrchestrationLatencyMs}ms</strong></span>
            <span>Active Sessions: <strong className="text-white">{healthStatus.activeSessions}</strong></span>
          </div>
        </div>
      )}

      {/* Tabs & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#D0D9DE] shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b sm:border-b-0 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-[#18217E] text-white shadow-xs'
                : 'bg-[#F4F7F9] text-[#393A50] hover:bg-[#E5EBEE]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>User Accounts ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('carriers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'carriers'
                ? 'bg-[#18217E] text-white shadow-xs'
                : 'bg-[#F4F7F9] text-[#393A50] hover:bg-[#E5EBEE]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Carrier Organizations ({carriers.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#424989] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'users'
                ? 'Search users by name, email, role...'
                : 'Search carriers by code, name, hub...'
            }
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg text-[#070724] placeholder-[#8A9995] focus:outline-none focus:border-[#18217E] focus:bg-white"
          />
        </div>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-[#D0D9DE] shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#09104D] text-white font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Organization / Hub Scope</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0D9DE]">
                  {filteredUsers.map((u) => {
                    const roleCfg = ROLE_CONFIGS[u.role];
                    return (
                      <tr key={u.id} className="hover:bg-[#F4F7F9] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#09104D]">{u.name}</div>
                          <div className="font-mono text-[11px] text-[#8A9995]">{u.email}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18217E]/10 text-[#18217E]">
                            {roleCfg?.label || u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#393A50]">
                          {u.carrierName ? (
                            <div className="flex items-center gap-1 font-medium text-[#18217E]">
                              <Building className="w-3.5 h-3.5" />
                              <span>Carrier: {u.carrierName}</span>
                            </div>
                          ) : u.customerName ? (
                            <div className="flex items-center gap-1 font-medium text-[#107C41]">
                              <Building className="w-3.5 h-3.5" />
                              <span>Account: {u.customerName}</span>
                            </div>
                          ) : u.warehouseName ? (
                            <div className="flex items-center gap-1 font-medium text-[#424989]">
                              <Building className="w-3.5 h-3.5" />
                              <span>Hub: {u.warehouseName}</span>
                            </div>
                          ) : (
                            <span className="text-[#8A9995] italic">Enterprise Global</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#107C41]/10 text-[#107C41] flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            {u.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#8A9995] font-mono text-[11px]">
                          {u.lastActive}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setActiveUserModal(u)}
                            className="p-1.5 rounded-lg text-[#18217E] hover:bg-[#18217E]/10 transition-colors inline-flex items-center gap-1 font-semibold text-xs cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CARRIER ORGANIZATIONS DIRECTORY */}
      {activeTab === 'carriers' && (
        <div className="bg-white rounded-xl border border-[#D0D9DE] shadow-card overflow-hidden">
          <div className="p-4 bg-[#F4F7F9] border-b border-[#D0D9DE] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#09104D] uppercase tracking-wider">
                Authorized Logistics Carrier Organizations
              </h3>
              <p className="text-[11px] text-[#393A50]">
                Registered freight carriers with contractual SLAs and telemetry integration.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                setActiveCarrierModal({
                  name: '',
                  carrierCode: `CAR-${String(carriers.length + 1).padStart(3, '0')}`,
                  contactEmail: '',
                  contactPhone: '',
                  transportModes: ['GROUND'],
                  slaTier: 'TIER_1_ENTERPRISE',
                  status: 'ACTIVE',
                  fleetCount: 15,
                  primaryHub: 'Chicago Central Logistics Hub',
                })
              }
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="text-xs"
            >
              Register New Carrier
            </Button>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#09104D] text-white font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Carrier Code</th>
                    <th className="py-3 px-4">Organization Name</th>
                    <th className="py-3 px-4">Operating Modes</th>
                    <th className="py-3 px-4">SLA Tier</th>
                    <th className="py-3 px-4">Primary Hub</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0D9DE]">
                  {filteredCarriers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F4F7F9] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#18217E]">
                        {c.carrierCode}
                      </td>

                      <td className="py-3 px-4 font-bold text-[#09104D]">
                        {c.name}
                        {c.fleetCount && (
                          <span className="block text-[10px] text-[#8A9995] font-normal">
                            Fleet Capacity: {c.fleetCount} Units
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {c.transportModes.map((m) => (
                            <span
                              key={m}
                              className="p-1 rounded bg-[#F4F7F9] border border-[#D0D9DE] inline-flex items-center"
                              title={m}
                            >
                              {getTransportIcon(m)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#18217E]/10 text-[#18217E] flex items-center gap-1 w-max">
                          <Award className="w-3 h-3 text-[#18217E]" />
                          {c.slaTier.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#393A50]">
                        {c.primaryHub || 'Multi-Regional'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-[#070724]">
                          <Mail className="w-3 h-3 text-[#8A9995]" />
                          <span>{c.contactEmail}</span>
                        </div>
                        {c.contactPhone && (
                          <div className="flex items-center gap-1 text-[10px] text-[#8A9995]">
                            <Phone className="w-3 h-3 text-[#8A9995]" />
                            <span>{c.contactPhone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            c.status === 'ACTIVE'
                              ? 'delivered'
                              : c.status === 'ONBOARDING'
                              ? 'loading'
                              : 'critical'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveCarrierModal(c)}
                          className="p-1.5 rounded-lg text-[#18217E] hover:bg-[#18217E]/10 transition-colors inline-flex items-center gap-1 font-semibold text-xs cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT / INVITE USER */}
      <Modal
        isOpen={!!activeUserModal}
        onClose={() => setActiveUserModal(null)}
        title={activeUserModal?.id ? 'Edit User Entitlement' : 'Invite Authorized User'}
        maxWidth="md"
      >
        {activeUserModal && (
          <form onSubmit={handleSaveUser} className="space-y-4 p-1">
            <div>
              <label className="block text-xs font-bold text-[#09104D] mb-1">Full Name:</label>
              <input
                type="text"
                required
                value={activeUserModal.name || ''}
                onChange={(e) =>
                  setActiveUserModal({ ...activeUserModal, name: e.target.value })
                }
                className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09104D] mb-1">Email Address:</label>
              <input
                type="email"
                required
                value={activeUserModal.email || ''}
                onChange={(e) =>
                  setActiveUserModal({ ...activeUserModal, email: e.target.value })
                }
                className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09104D] mb-1">Assigned Business Role:</label>
              <select
                value={activeUserModal.role || 'CONTROL_TOWER_ANALYST'}
                onChange={(e) =>
                  setActiveUserModal({
                    ...activeUserModal,
                    role: e.target.value as UserRole,
                  })
                }
                className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg bg-white focus:outline-none focus:border-[#18217E]"
              >
                {rolesList.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_CONFIGS[r].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Carrier Association if role is Carrier */}
            {activeUserModal.role === 'CARRIER' && (
              <div className="bg-[#F4F7F9] p-3 rounded-xl border border-[#D0D9DE] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#09104D]">
                    Associated Carrier Organization:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCarrierModal({
                        name: '',
                        carrierCode: `CAR-${String(carriers.length + 1).padStart(3, '0')}`,
                        contactEmail: '',
                        contactPhone: '',
                        transportModes: ['GROUND'],
                        slaTier: 'TIER_1_ENTERPRISE',
                        status: 'ACTIVE',
                        fleetCount: 10,
                      });
                    }}
                    className="text-[11px] font-bold text-[#18217E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Add New Carrier</span>
                  </button>
                </div>

                <select
                  value={activeUserModal.carrierId || (carriers[0]?.carrierCode || 'CAR-001')}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    const match = carriers.find((c) => c.carrierCode === selectedCode);
                    setActiveUserModal({
                      ...activeUserModal,
                      carrierId: selectedCode,
                      carrierName: match?.name || selectedCode,
                    });
                  }}
                  className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg bg-white focus:outline-none focus:border-[#18217E]"
                >
                  {carriers.map((c) => (
                    <option key={c.id} value={c.carrierCode}>
                      {c.name} ({c.carrierCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setActiveUserModal(null)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSavingUser}>
                {isSavingUser ? 'Saving...' : 'Save User Entitlement'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: REGISTER / ADD NEW CARRIER */}
      <Modal
        isOpen={!!activeCarrierModal}
        onClose={() => setActiveCarrierModal(null)}
        title={activeCarrierModal?.id ? 'Edit Carrier Organization' : 'Register New Carrier Organization'}
        maxWidth="lg"
      >
        {activeCarrierModal && (
          <form onSubmit={handleSaveCarrier} className="space-y-4 p-1">
            <p className="text-xs text-[#393A50]">
              Register a partner carrier organization in the Mendix Enterprise Registry. This carrier will become selectable for carrier users and shipment assignment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#09104D] mb-1">Carrier Code / ID:</label>
                <input
                  type="text"
                  required
                  value={activeCarrierModal.carrierCode || ''}
                  onChange={(e) =>
                    setActiveCarrierModal({ ...activeCarrierModal, carrierCode: e.target.value })
                  }
                  placeholder="e.g. CAR-004"
                  className="w-full p-2 text-xs font-mono border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#09104D] mb-1">Carrier Legal Name:</label>
                <input
                  type="text"
                  required
                  value={activeCarrierModal.name || ''}
                  onChange={(e) =>
                    setActiveCarrierModal({ ...activeCarrierModal, name: e.target.value })
                  }
                  placeholder="e.g. Vanguard Intermodal Logistics"
                  className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#09104D] mb-1">Dispatch Contact Email:</label>
                <input
                  type="email"
                  required
                  value={activeCarrierModal.contactEmail || ''}
                  onChange={(e) =>
                    setActiveCarrierModal({ ...activeCarrierModal, contactEmail: e.target.value })
                  }
                  placeholder="e.g. ops@vanguardlogistics.com"
                  className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#09104D] mb-1">Dispatch Hotline Phone:</label>
                <input
                  type="text"
                  value={activeCarrierModal.contactPhone || ''}
                  onChange={(e) =>
                    setActiveCarrierModal({ ...activeCarrierModal, contactPhone: e.target.value })
                  }
                  placeholder="e.g. +1-800-555-0188"
                  className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#09104D] mb-1">Contractual SLA Tier:</label>
                <select
                  value={activeCarrierModal.slaTier || 'TIER_1_ENTERPRISE'}
                  onChange={(e) =>
                    setActiveCarrierModal({
                      ...activeCarrierModal,
                      slaTier: e.target.value as any,
                    })
                  }
                  className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg bg-white focus:outline-none focus:border-[#18217E]"
                >
                  <option value="TIER_1_ENTERPRISE">Tier-1 Enterprise</option>
                  <option value="TIER_2_PREFERRED">Tier-2 Preferred</option>
                  <option value="TIER_3_STANDARD">Tier-3 Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#09104D] mb-1">Primary Operating Hub:</label>
                <select
                  value={activeCarrierModal.primaryHub || 'Chicago Central Logistics Hub'}
                  onChange={(e) =>
                    setActiveCarrierModal({
                      ...activeCarrierModal,
                      primaryHub: e.target.value,
                    })
                  }
                  className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg bg-white focus:outline-none focus:border-[#18217E]"
                >
                  <option value="Chicago Central Logistics Hub">Chicago Central Hub</option>
                  <option value="Newark Air Cargo Gateway">Newark Air Gateway</option>
                  <option value="Dallas Multi-Modal Freight Hub">Dallas Multi-Modal</option>
                  <option value="Los Angeles Port Logistics Facility">Los Angeles Port</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#09104D] mb-1">Partner Status:</label>
                <select
                  value={activeCarrierModal.status || 'ACTIVE'}
                  onChange={(e) =>
                    setActiveCarrierModal({
                      ...activeCarrierModal,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg bg-white focus:outline-none focus:border-[#18217E]"
                >
                  <option value="ACTIVE">ACTIVE (Authorized)</option>
                  <option value="ONBOARDING">ONBOARDING (Compliance Review)</option>
                  <option value="SUSPENDED">SUSPENDED (SLA Review)</option>
                </select>
              </div>
            </div>

            {/* Operating Modes */}
            <div>
              <label className="block text-xs font-bold text-[#09104D] mb-1.5">
                Authorized Operating Freight Modes:
              </label>
              <div className="flex items-center gap-4 text-xs">
                {(['GROUND', 'AIR', 'SEA'] as const).map((mode) => {
                  const currentModes = activeCarrierModal.transportModes || ['GROUND'];
                  const isChecked = currentModes.includes(mode);
                  return (
                    <label key={mode} className="flex items-center gap-1.5 cursor-pointer font-medium text-[#070724]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...currentModes, mode]
                            : currentModes.filter((m) => m !== mode);
                          setActiveCarrierModal({
                            ...activeCarrierModal,
                            transportModes: updated.length > 0 ? updated : ['GROUND'],
                          });
                        }}
                        className="rounded border-[#D0D9DE] text-[#18217E] focus:ring-[#18217E]"
                      />
                      <span>{mode} Freight</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D0D9DE]">
              <Button variant="ghost" onClick={() => setActiveCarrierModal(null)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSavingCarrier}>
                {isSavingCarrier ? 'Registering with Mendix...' : 'Save Carrier Organization'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
