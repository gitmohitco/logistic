import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Database, 
  Bot, 
  Radio, 
  RefreshCw,
  Send 
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';

export interface ConnectionHealthViewProps {
  onRefresh: () => void;
}

export const ConnectionHealthView: React.FC<ConnectionHealthViewProps> = ({ onRefresh }) => {
  const [testGpsLoading, setTestGpsLoading] = useState(false);
  const [gpsResponse, setGpsResponse] = useState<string | null>(null);

  const handleSendTestGps = async () => {
    setTestGpsLoading(true);
    setGpsResponse(null);
    try {
      const res: any = await trackingService.simulateGpsTelemetry({
        eventId: `test-gps-${Date.now()}`,
        vehicleId: 'VEH-1042',
        latitude: 17.3850 + (Math.random() - 0.5) * 0.05,
        longitude: 78.4867 + (Math.random() - 0.5) * 0.05,
        speedKph: 55.4,
        recordedAt: new Date().toISOString(),
        temperatureCelsius: 4.2,
      });
      setGpsResponse(`GPS Webhook Accepted: ${JSON.stringify(res, null, 2)}`);
      onRefresh();
    } catch (err: any) {
      setGpsResponse(`Error sending GPS: ${err.message}`);
    } finally {
      setTestGpsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-[#D0D9DE] shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#09104D] flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#18217E]" />
            <span>Enterprise Gateway & Integration Health</span>
          </h2>
          <p className="text-xs text-[#393A50] mt-1">
            Status of external enterprise connectors: Headless Mendix AI RAG, Neon PostgreSQL pool, and GPS Telematics Ingestion.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={onRefresh} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Poll Connections
        </Button>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mendix AI Card */}
        <div className="p-5 rounded-xl bg-white border border-[#D0D9DE] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#18217E] text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#09104D]">Mendix 11.12.3 AI</h3>
                <p className="text-[10px] text-[#8A9995]">Headless RAG Microflow</p>
              </div>
            </div>
            <Badge variant="active" size="sm">
              ONLINE
            </Badge>
          </div>

          <div className="text-xs text-[#393A50] space-y-2 border-t border-[#D0D9DE]/60 pt-3">
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Auth Protocol:</span>
              <strong className="text-[#070724]">OAuth 2.0 Client Credentials</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Knowledge Base:</span>
              <strong className="text-[#070724]">PgVector Logistics DB</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Endpoint:</span>
              <span className="font-mono text-[10px] text-[#18217E]">/rest/logistics/v1/analyze</span>
            </div>
          </div>
        </div>

        {/* Neon PostgreSQL Card */}
        <div className="p-5 rounded-xl bg-white border border-[#D0D9DE] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#09104D] text-white flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#09104D]">Neon PostgreSQL</h3>
                <p className="text-[10px] text-[#8A9995]">Serverless Connection Pool</p>
              </div>
            </div>
            <Badge variant="active" size="sm">
              CONNECTED
            </Badge>
          </div>

          <div className="text-xs text-[#393A50] space-y-2 border-t border-[#D0D9DE]/60 pt-3">
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Pool Driver:</span>
              <strong className="text-[#070724]">node-postgres (pg) with SSL</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Active Migrations:</span>
              <strong className="text-[#107C41]">001_initial_schema (Applied)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Mode:</span>
              <strong className="text-[#18217E]">Resilient Dual-Mode Pool</strong>
            </div>
          </div>
        </div>

        {/* GPS Telematics Webhook Card */}
        <div className="p-5 rounded-xl bg-white border border-[#D0D9DE] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#424989] text-white flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#09104D]">GPS Ingestion</h3>
                <p className="text-[10px] text-[#8A9995]">Idempotent Webhook</p>
              </div>
            </div>
            <Badge variant="active" size="sm">
              LISTENING
            </Badge>
          </div>

          <div className="text-xs text-[#393A50] space-y-2 border-t border-[#D0D9DE]/60 pt-3">
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Route:</span>
              <span className="font-mono text-[10px] text-[#18217E]">POST /api/v1/webhooks/gps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Security:</span>
              <strong className="text-[#070724]">HMAC SHA-256 Signatures</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A9995]">Deduplication:</span>
              <strong className="text-[#107C41]">Active (EventId)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Webhook Simulator */}
      <div className="p-5 rounded-xl bg-white border border-[#D0D9DE] shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#09104D]">Interactive GPS Telematics Simulation</h3>
          <p className="text-xs text-[#393A50] mt-0.5">
            Test the live end-to-end telemetry pipeline: emit a real GPS coordinate event to the Express gateway, trigger rule evaluation, and invoke Mendix AI anomaly analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            isLoading={testGpsLoading}
            onClick={handleSendTestGps}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Emit GPS Telemetry Webhook Event
          </Button>
        </div>

        {gpsResponse && (
          <div className="mt-3 p-3 rounded-lg bg-[#F4F7F9] border border-[#D0D9DE] font-mono text-[11px] text-[#070724] overflow-x-auto">
            <pre>{gpsResponse}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
