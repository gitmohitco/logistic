import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Bot, 
  RefreshCw 
} from 'lucide-react';
import { ExceptionItem, ExceptionSeverity } from '../../types';
import { mendixClient } from '../../services/api/mendixClient';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

export const ShipmentExceptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();

  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [activeExceptionModal, setActiveExceptionModal] = useState<ExceptionItem | null>(null);

  // Resolution Form
  const [resolutionAction, setResolutionAction] = useState('REROUTE');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const fetchExceptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mendixClient.getExceptions(user);
      setExceptions(data);
    } catch (err) {
      console.error('Failed to load exceptions from Mendix', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExceptionModal) return;

    setIsResolving(true);
    try {
      await mendixClient.resolveException(
        {
          exceptionId: activeExceptionModal.id,
          action: resolutionAction,
          notes: resolutionNotes,
        },
        user
      );
      setActiveExceptionModal(null);
      await fetchExceptions();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const filtered = exceptions.filter((e) => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    return true;
  });

  const getSeverityBadge = (sev: ExceptionSeverity) => {
    switch (sev) {
      case 'HIGH':
        return <Badge variant="critical">High Severity</Badge>;
      case 'MEDIUM':
        return <Badge variant="delayed">Medium Severity</Badge>;
      case 'LOW':
        return <Badge variant="neutral">Low Severity</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-[#09104D]">
              Shipment Exception War Room & Governance
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EA341F]/10 text-[#EA341F]">
              {exceptions.filter((e) => e.status !== 'RESOLVED').length} Active Issues
            </span>
          </div>
          <p className="text-xs text-[#393A50] mt-0.5">
            Operational bottlenecks, telematics alarms, and Mendix AI-orchestrated mitigation plans.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={fetchExceptions}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          className="text-xs"
        >
          Refresh Queue
        </Button>
      </div>

      {/* Severity Filter Chips */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#8A9995] uppercase tracking-wider">
          Filter Severity:
        </span>
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              severityFilter === sev
                ? 'bg-[#18217E] text-white shadow-xs'
                : 'bg-white text-[#393A50] hover:bg-[#F4F7F9] border border-[#D0D9DE]'
            }`}
          >
            {sev === 'ALL' ? 'All Severities' : `${sev} Priority`}
          </button>
        ))}
      </div>

      {/* Exceptions List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-[#D0D9DE]">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#D0D9DE] text-center text-xs text-[#8A9995]">
            <CheckCircle2 className="w-8 h-8 text-[#107C41] mx-auto mb-2" />
            <p className="font-bold text-[#09104D]">All operational exceptions resolved.</p>
            <p>The control tower network is operating within baseline parameters.</p>
          </div>
        ) : (
          filtered.map((exc) => {
            const isResolved = exc.status === 'RESOLVED';
            const aiRec = exc.aiRecommendation;

            return (
              <div
                key={exc.id}
                className={`bg-white rounded-2xl border shadow-card transition-all overflow-hidden ${
                  exc.severity === 'HIGH' && !isResolved
                    ? 'border-[#EA341F]/40 ring-1 ring-[#EA341F]/10'
                    : 'border-[#D0D9DE]'
                }`}
              >
                {/* Exception Top Bar */}
                <div className="p-5 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#D0D9DE]/60">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(exc.severity)}
                    <span
                      onClick={() => navigate(`/shipments/${exc.shipmentId}`)}
                      className="font-mono font-bold text-xs text-[#18217E] hover:underline cursor-pointer"
                    >
                      {exc.trackingId}
                    </span>
                    <span className="text-xs text-[#8A9995]">
                      • Detected {exc.ageHours || 1}h ago
                    </span>
                    {exc.owner && (
                      <span className="text-xs text-[#393A50] font-medium">
                        • Owner: {exc.owner}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isResolved
                          ? 'bg-[#107C41]/10 text-[#107C41]'
                          : 'bg-[#EA341F]/10 text-[#EA341F]'
                      }`}
                    >
                      Status: {exc.status}
                    </span>

                    {!isResolved && checkPermission('canResolveExceptions') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActiveExceptionModal(exc);
                          if (aiRec) setResolutionAction(aiRec.recommendedAction);
                        }}
                        className="text-xs"
                      >
                        Action Dossier
                      </Button>
                    )}
                  </div>
                </div>

                {/* Exception Details & Description */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#09104D]">
                      {exc.exceptionType}
                    </h3>
                    <p className="text-xs text-[#393A50] mt-1 leading-relaxed">
                      {exc.description}
                    </p>
                  </div>

                  {/* Mendix AI Recommendation Box */}
                  {aiRec && (
                    <div className="bg-[#18217E]/5 border border-[#18217E]/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#18217E]">
                          <Bot className="w-4 h-4 text-[#18217E]" />
                          <span>Mendix AI Recommended Action: {aiRec.recommendedAction}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#8A9995] uppercase">
                          Confidence: {(aiRec.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      <p className="text-xs text-[#070724] leading-relaxed">
                        {aiRec.reasoningSummary}
                      </p>

                      {aiRec.knowledgeReferences && aiRec.knowledgeReferences.length > 0 && (
                        <div className="pt-2 border-t border-[#18217E]/20 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#8A9995]">
                            Knowledge Citations (RAG Retrieval):
                          </span>
                          {aiRec.knowledgeReferences.map((ref, idx) => (
                            <div key={idx} className="text-[11px] text-[#393A50] bg-white/70 p-2 rounded border border-[#D0D9DE]">
                              <strong className="text-[#09104D]">{ref.documentTitle}</strong> — {ref.section}:
                              <span className="italic block mt-0.5 text-[#393A50]">"{ref.snippet}"</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resolution Notes if already resolved */}
                  {isResolved && (
                    <div className="bg-[#107C41]/10 p-3 rounded-xl border border-[#107C41]/20 text-xs text-[#107C41] flex items-center justify-between">
                      <div>
                        <strong>Resolved by:</strong> {exc.resolvedBy}
                        <p className="text-[11px] mt-0.5">{exc.resolutionNotes}</p>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9995]">
                        {exc.resolvedAt && new Date(exc.resolvedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={!!activeExceptionModal}
        onClose={() => setActiveExceptionModal(null)}
        title="Execute Exception Remediation"
        maxWidth="lg"
      >
        {activeExceptionModal && (
          <form onSubmit={handleResolveSubmit} className="space-y-4 p-1">
            <div className="bg-[#F4F7F9] p-3 rounded-xl border border-[#D0D9DE] text-xs">
              <span className="font-bold text-[#09104D] block">
                {activeExceptionModal.trackingId} — {activeExceptionModal.exceptionType}
              </span>
              <p className="text-[#393A50] mt-0.5">{activeExceptionModal.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09104D] mb-1">
                Authorized Mitigation Action:
              </label>
              <select
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
                className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg bg-white focus:outline-none focus:border-[#18217E]"
              >
                <option value="REROUTE">REROUTE (Approve Alternate Highway Bypass)</option>
                <option value="HOLD">HOLD (Enforce Temperature Stabilization Assay)</option>
                <option value="NOTIFY_CARRIER">NOTIFY_CARRIER (Dispatch Expedited Telematics Notice)</option>
                <option value="EXPEDITE">EXPEDITE (Authorize Priority Dock Offloading)</option>
                <option value="INSPECT_CARGO">INSPECT_CARGO (Order Physical Cargo Integrity Audit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09104D] mb-1">
                Remediation Audit Notes & Justification:
              </label>
              <textarea
                required
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter justification recorded into Mendix operational audit log..."
                className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setActiveExceptionModal(null)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isResolving}>
                {isResolving ? 'Executing in Mendix...' : 'Confirm Resolution'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
