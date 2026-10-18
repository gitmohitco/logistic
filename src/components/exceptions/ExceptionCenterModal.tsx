import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ExceptionItem, UserRole } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Bot, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Check, 
  X, 
  Edit3 
} from 'lucide-react';

export interface ExceptionCenterModalProps {
  exception: ExceptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onResolveException: (exceptionId: string, action: string, notes: string) => Promise<void>;
}

export const ExceptionCenterModal: React.FC<ExceptionCenterModalProps> = ({
  exception,
  isOpen,
  onClose,
  currentUserRole,
  onResolveException,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!exception) return null;

  const isMedium = exception.severity === 'MEDIUM';
  const isHigh = exception.severity === 'HIGH';

  const aiRec = exception.aiRecommendation;

  const handleAction = async (actionType: string) => {
    setIsSubmitting(true);
    try {
      await onResolveException(
        exception.id,
        actionType,
        resolutionNotes || `Analyst approved ${actionType} as recommended by Mendix AI.`
      );
      onClose();
    } catch (err) {
      console.error('Failed to resolve exception', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isHigh ? (
            <ShieldAlert className="w-5 h-5 text-[#8C2527]" />
          ) : (
            <AlertTriangle className={`w-5 h-5 ${isMedium ? 'text-[#18217E]' : 'text-[#424989]'}`} />
          )}
          <span>
            {isHigh ? 'CRITICAL WAR-ROOM INCIDENT' : 'Logistics Exception Review'}
          </span>
        </div>
      }
      subtitle={`Correlation ID: ${exception.correlationId} • Shipment: ${exception.trackingId}`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-[#8A9995]">
            Authorized Role: <strong className="text-[#09104D]">{currentUserRole}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Close
            </Button>

            {/* Analyst / Ops Manager Actions */}
            {exception.status !== 'RESOLVED' && (
              <>
                {isHigh && currentUserRole !== 'CARRIER' && (
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isSubmitting}
                    onClick={() => handleAction('ESCALATE_WAR_ROOM')}
                    className="bg-[#8C2527] hover:bg-[#6b1c1e]"
                  >
                    Acknowledge & Escalate
                  </Button>
                )}

                {aiRec && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    onClick={() => handleAction(aiRec.recommendedAction)}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Accept AI Recommendation ({aiRec.recommendedAction})
                  </Button>
                )}

                {isMedium && (
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isSubmitting}
                    onClick={() => handleAction('REJECT_RECOMMENDATION')}
                    leftIcon={<X className="w-4 h-4 text-[#EA341F]" />}
                  >
                    Reject
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Severity Header Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isHigh
            ? 'bg-[#8C2527]/10 border-[#8C2527]/40 text-[#8C2527]'
            : isMedium
            ? 'bg-[#18217E]/10 border-[#18217E]/30 text-[#18217E]'
            : 'bg-[#424989]/10 border-[#424989]/30 text-[#424989]'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm uppercase tracking-wider">
                {exception.exceptionType.replace('_', ' ')}
              </span>
              <Badge
                variant={isHigh ? 'critical' : isMedium ? 'severity_medium' : 'severity_low'}
                size="sm"
                pulse={isHigh}
              >
                {exception.severity} SEVERITY
              </Badge>
            </div>
            <p className="text-xs text-[#070724] mt-1 font-medium">{exception.description}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#8A9995] block">SLA Impact</span>
            <span className="text-base font-black text-[#EA341F]">+{exception.slaImpactMinutes} mins</span>
          </div>
        </div>

        {/* Mendix AI & RAG Orchestration Panel */}
        <div className="p-4 rounded-xl border border-[#18217E]/30 bg-gradient-to-br from-white to-[#F4F7F9] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#D0D9DE] pb-2.5">
            <div className="flex items-center gap-2 text-[#18217E] font-bold">
              <Bot className="w-5 h-5 text-[#18217E]" />
              <span className="text-sm">Mendix 11.12.3 RAG Intelligence Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8A9995] uppercase font-semibold">AI Confidence:</span>
              <span className="px-2 py-0.5 rounded-full bg-[#18217E] text-white text-[10px] font-bold">
                {aiRec ? `${Math.round(aiRec.confidence * 100)}%` : '92%'}
              </span>
            </div>
          </div>

          {aiRec ? (
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#393A50] block">
                  Recommended Primary Action
                </span>
                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18217E] text-white font-bold text-xs shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{aiRec.recommendedAction}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#393A50] block">
                  AI Synthesized Reasoning
                </span>
                <p className="mt-1 text-xs text-[#070724] bg-white p-3 rounded-lg border border-[#D0D9DE] leading-relaxed">
                  {aiRec.reasoningSummary}
                </p>
              </div>

              {/* RAG Knowledge Base References */}
              {aiRec.knowledgeReferences && aiRec.knowledgeReferences.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#393A50] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#18217E]" />
                    <span>Mendix PgVector Retrieved Policies & Historical SLA Rules</span>
                  </span>
                  <div className="mt-1.5 space-y-1.5">
                    {aiRec.knowledgeReferences.map((ref, i) => (
                      <div
                        key={`rag-ref-${i}`}
                        className="p-2.5 rounded-lg bg-white border border-[#D0D9DE]/80 text-[11px]"
                      >
                        <div className="font-bold text-[#09104D] flex items-center justify-between">
                          <span>{ref.documentTitle}</span>
                          <span className="text-[10px] text-[#8A9995]">{ref.section}</span>
                        </div>
                        <p className="text-[#393A50] mt-1 italic">"{ref.snippet}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-white rounded-lg border border-[#D0D9DE] text-center text-[#8A9995]">
              Connecting to Mendix AI endpoint...
            </div>
          )}
        </div>

        {/* Resolution Notes / Analyst Input */}
        {exception.status !== 'RESOLVED' && currentUserRole !== 'CARRIER' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#393A50] flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-[#18217E]" />
              <span>Analyst Decision Audit Log & Notes</span>
            </label>
            <textarea
              rows={2}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Enter operational rationale before approving or rejecting..."
              className="w-full p-2.5 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
