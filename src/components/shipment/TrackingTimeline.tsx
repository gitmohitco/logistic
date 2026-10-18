import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Truck, 
  FileCheck 
} from 'lucide-react';
import { TrackingEvent } from '../../types';

export interface TrackingTimelineProps {
  events?: TrackingEvent[];
  currentStatus?: string;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  events = [],
}) => {
  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#8A9995] bg-[#F4F7F9] rounded-xl border border-[#D0D9DE]">
        No intermediate tracking milestones recorded for this shipment yet.
      </div>
    );
  }

  const getEventIcon = (eventType: TrackingEvent['eventType']) => {
    switch (eventType) {
      case 'DELIVERED':
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'DELAY_REPORTED':
      case 'EXCEPTION_FLAGGED':
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case 'CUSTOMS_CLEARED':
        return <FileCheck className="w-4 h-4 text-white" />;
      case 'DISPATCHED':
        return <Truck className="w-4 h-4 text-white" />;
      default:
        return <MapPin className="w-4 h-4 text-white" />;
    }
  };

  const getBadgeBg = (eventType: TrackingEvent['eventType']) => {
    switch (eventType) {
      case 'DELIVERED':
        return 'bg-[#107C41] border-[#107C41]';
      case 'DELAY_REPORTED':
      case 'EXCEPTION_FLAGGED':
        return 'bg-[#EA341F] border-[#EA341F]';
      case 'CUSTOMS_CLEARED':
        return 'bg-[#18217E] border-[#18217E]';
      case 'DISPATCHED':
        return 'bg-[#09104D] border-[#09104D]';
      default:
        return 'bg-[#424989] border-[#424989]';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D0D9DE]">
      {events.map((event, index) => {
        const isLatest = index === 0;
        return (
          <div key={event.id} className="relative group">
            {/* Timeline bullet */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 shadow-xs transition-transform group-hover:scale-110 ${getBadgeBg(
                event.eventType
              )}`}
            >
              {getEventIcon(event.eventType)}
            </div>

            {/* Event Content Card */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isLatest
                  ? 'bg-white border-[#18217E]/40 shadow-card ring-1 ring-[#18217E]/10'
                  : 'bg-[#F4F7F9] border-[#D0D9DE] hover:bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#09104D]">
                    {event.title}
                  </h4>
                  {event.isMilestone && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-[#18217E]/10 text-[#18217E] uppercase">
                      Milestone
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#8A9995] font-mono">
                  <Clock className="w-3 h-3 text-[#424989]" />
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-[#393A50] mb-2 leading-relaxed">
                {event.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#8A9995] pt-2 border-t border-[#D0D9DE]/60">
                <span className="flex items-center gap-1 font-medium text-[#070724]">
                  <MapPin className="w-3 h-3 text-[#18217E]" />
                  {event.location}
                </span>
                {event.recordedBy && (
                  <span className="font-mono">
                    Source: {event.recordedBy}
                  </span>
                )}
                <span className="ml-auto font-bold px-1.5 py-0.2 rounded bg-white text-[#393A50] border border-[#D0D9DE]">
                  Status: {event.statusAfterEvent}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
