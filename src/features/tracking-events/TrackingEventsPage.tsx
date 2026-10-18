import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Search, 
  MapPin, 
  Clock, 
  RefreshCw
} from 'lucide-react';
import { TrackingEvent } from '../../types';
import { mendixClient } from '../../services/api/mendixClient';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const TrackingEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mendixClient.getTrackingEvents(undefined, user);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load tracking events from Mendix', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter((e) => {
    if (typeFilter !== 'ALL' && e.eventType !== typeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.trackingId.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      (e.recordedBy && e.recordedBy.toLowerCase().includes(q))
    );
  });

  const getEventBadge = (type: TrackingEvent['eventType']) => {
    switch (type) {
      case 'DELIVERED':
        return <Badge variant="delivered">Delivered</Badge>;
      case 'DELAY_REPORTED':
      case 'EXCEPTION_FLAGGED':
        return <Badge variant="critical">Exception</Badge>;
      case 'CUSTOMS_CLEARED':
        return <Badge variant="active">Customs</Badge>;
      case 'DISPATCHED':
        return <Badge variant="neutral">Dispatched</Badge>;
      default:
        return <Badge variant="loading">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-[#09104D]">
              Live Tracking Events Feed
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18217E]/10 text-[#18217E]">
              {events.length} Events Synced
            </span>
          </div>
          <p className="text-xs text-[#393A50] mt-0.5">
            Audit trail of milestone events, checkpoint scans, and carrier telematics updates.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={fetchEvents}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          className="text-xs"
        >
          Sync Events
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#D0D9DE] shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#424989] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tracking ID, location, or source..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg text-[#070724] placeholder-[#8A9995] focus:outline-none focus:border-[#18217E] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'DISPATCHED', 'CHECKPOINT', 'DELAY_REPORTED', 'CUSTOMS_CLEARED', 'DELIVERED'] as const).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[#18217E] text-white shadow-xs'
                    : 'bg-[#F4F7F9] text-[#393A50] hover:bg-[#E5EBEE] border border-[#D0D9DE]'
                }`}
              >
                {t === 'ALL' ? 'All Events' : t.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-[#D0D9DE]">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#D0D9DE] text-center text-xs text-[#8A9995]">
            No tracking events matching the specified criteria.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white p-4 rounded-xl border border-[#D0D9DE] shadow-card hover:border-[#18217E]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F7F9] border border-[#D0D9DE] flex items-center justify-center text-[#18217E] flex-shrink-0 mt-0.5">
                  <Activity className="w-5 h-5 text-[#18217E]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => navigate(`/shipments/${evt.shipmentId}`)}
                      className="font-mono font-bold text-xs text-[#18217E] hover:underline cursor-pointer"
                    >
                      {evt.trackingId}
                    </span>
                    {getEventBadge(evt.eventType)}
                    {evt.isMilestone && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#18217E]/10 text-[#18217E] uppercase">
                        Milestone
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[#09104D] mt-0.5">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-[#393A50] mt-0.5">
                    {evt.description}
                  </p>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between text-right text-[11px] text-[#8A9995] pt-2 md:pt-0 border-t md:border-t-0 border-[#D0D9DE]/50">
                <span className="flex items-center gap-1 font-mono text-[#070724]">
                  <Clock className="w-3.5 h-3.5 text-[#424989]" />
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-[#393A50]">
                  <MapPin className="w-3 h-3 text-[#18217E]" />
                  {evt.location}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
