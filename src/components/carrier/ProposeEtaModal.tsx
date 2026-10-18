import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Shipment } from '../../types';
import { Button } from '../ui/Button';
import { Clock } from 'lucide-react';

export interface ProposeEtaModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitProposedEta: (shipmentId: string, proposedEta: string, reason: string) => Promise<void>;
}

export const ProposeEtaModal: React.FC<ProposeEtaModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onSubmitProposedEta,
}) => {
  const [proposedDate, setProposedDate] = useState('');
  const [reason, setReason] = useState('Traffic Congestion / Roadworks');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!shipment) return null;

  const currentEtaString = new Date(shipment.estimatedArrival).toLocaleString();

  const reasons = [
    'Traffic Congestion / Roadworks',
    'Adverse Weather Conditions',
    'Customs & Regulatory Clearance Hold',
    'Vehicle Maintenance / Mechanical Inspection',
    'Loading Bay Delay at Origin Hub',
    'Driver Rest Mandate Compliance',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedDate) {
      alert('Please select a proposed revised ETA.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fullReason = `${reason}${notes ? ` - ${notes}` : ''}`;
      await onSubmitProposedEta(shipment.id, new Date(proposedDate).toISOString(), fullReason);
      onClose();
    } catch (err) {
      console.error('Failed to submit proposed ETA', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Propose Revised Delivery ETA"
      subtitle={`Tracking ID: ${shipment.trackingId} • Current ETA: ${currentEtaString}`}
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Submit Proposed ETA
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-lg bg-[#18217E]/10 border border-[#18217E]/20 text-[#18217E]">
          <div className="flex items-center gap-1.5 font-bold">
            <Clock className="w-4 h-4" />
            <span>Current Committed ETA</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-[#070724]">{currentEtaString}</p>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#393A50] mb-1">
            New Proposed Estimated Arrival Time *
          </label>
          <input
            type="datetime-local"
            required
            value={proposedDate}
            onChange={(e) => setProposedDate(e.target.value)}
            className="w-full p-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#393A50] mb-1">
            Root Cause / Reason Code *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#393A50] mb-1">
            Additional Carrier Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Provide context regarding road conditions or telemetry..."
            className="w-full p-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg text-[#070724] focus:outline-none focus:border-[#18217E] focus:bg-white"
          />
        </div>

        <p className="text-[10px] text-[#8A9995] italic">
          Note: Proposed revisions will trigger automated Mendix SLA impact checks and alert the operations analyst desk for confirmation.
        </p>
      </form>
    </Modal>
  );
};
