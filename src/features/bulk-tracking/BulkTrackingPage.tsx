import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCw, 
  ArrowRight,
  Info,
  Trash2
} from 'lucide-react';
import { mendixClient } from '../../services/api/mendixClient';
import { useAuth } from '../auth/AuthContext';
import { BulkTrackResponse, BulkTrackItemResult } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const BulkTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rawInput, setRawInput] = useState('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<BulkTrackResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper to parse and deduplicate input IDs
  const parseIds = (text: string): { valid: string[]; duplicatesCount: number } => {
    const rawTokens = text
      .split(/[\n,;\r]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const uniqueSet = new Set<string>();
    let duplicatesCount = 0;

    for (const token of rawTokens) {
      if (uniqueSet.has(token.toUpperCase())) {
        duplicatesCount++;
      } else {
        uniqueSet.add(token.toUpperCase());
      }
    }

    return {
      valid: Array.from(uniqueSet),
      duplicatesCount,
    };
  };

  const { valid: parsedIds, duplicatesCount } = parseIds(rawInput);

  // Handle CSV Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        // Simple robust CSV parser for 1st column or header 'trackingId'
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const extracted: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
          const candidate = cols[0];
          // Skip header row if it resembles 'tracking_id' or 'id'
          if (i === 0 && (candidate.toLowerCase().includes('id') || candidate.toLowerCase().includes('tracking'))) {
            continue;
          }
          if (candidate) extracted.push(candidate);
        }

        setRawInput((prev) => {
          const combined = prev ? `${prev}\n${extracted.join('\n')}` : extracted.join('\n');
          return combined;
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (parsedIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await mendixClient.bulkTrack({ shipmentIds: parsedIds }, user);
      setResponse(res);
    } catch (err: any) {
      setSubmitError(err.message || 'Mendix bulk tracking batch failed to process');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryEligible = async () => {
    if (!response) return;
    const retryableIds = response.results
      .filter((r) => r.canRetry && r.queryId)
      .map((r) => r.queryId);

    if (retryableIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await mendixClient.bulkTrack({ shipmentIds: retryableIds }, user);
      // Merge results
      setResponse((prev) => {
        if (!prev) return res;
        const newResultsMap = new Map(res.results.map((r) => [r.queryId, r]));
        const updatedList = prev.results.map((old) => newResultsMap.get(old.queryId) || old);
        return {
          ...prev,
          results: updatedList,
          successfulCount: updatedList.filter((r) => r.outcome === 'SUCCESS').length,
          notFoundCount: updatedList.filter((r) => r.outcome === 'NOT_FOUND').length,
        };
      });
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOutcomeBadge = (outcome: BulkTrackItemResult['outcome']) => {
    switch (outcome) {
      case 'SUCCESS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#107C41]/10 text-[#107C41] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'NOT_FOUND':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EA341F]/10 text-[#EA341F] flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Not Found
          </span>
        );
      case 'UNAUTHORIZED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8C2527]/10 text-[#8C2527] flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Restricted Record
          </span>
        );
      case 'MALFORMED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#424989]/10 text-[#424989] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Malformed ID
          </span>
        );
      default:
        return <Badge variant="neutral">{outcome}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-[#09104D]">
              Bulk Shipment Tracking Interface
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18217E]/10 text-[#18217E]">
              Mendix REST Engine
            </span>
          </div>
          <p className="text-xs text-[#393A50] mt-0.5">
            Ingest tracking IDs via multiline entry or validated CSV file. Per-record entitlement verification.
          </p>
        </div>

        {/* Sample preset filler for fast evaluation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRawInput(`TRK-US-89214\nTRK-US-89215\nTRK-US-89216\nTRK-US-89217\nTRK-INVALID-000\nTRK-US-89214`);
            }}
            className="text-xs text-[#18217E] hover:underline font-semibold cursor-pointer"
          >
            Load Sample Query Batch
          </button>
        </div>
      </div>

      {/* Main Ingest Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Multiline Form + CSV Upload (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#09104D] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#18217E]" />
              Input Tracking Manifest:
            </label>
            {parsedIds.length > 0 && (
              <span className="text-[11px] font-semibold text-[#18217E]">
                {parsedIds.length} Valid IDs {duplicatesCount > 0 && `(${duplicatesCount} deduped)`}
              </span>
            )}
          </div>

          <textarea
            rows={7}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste tracking IDs here (one per line, comma or semicolon separated)...&#10;e.g.&#10;TRK-US-89214&#10;TRK-US-89215&#10;TRK-US-89216"
            className="w-full p-3 text-xs font-mono bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] placeholder-[#8A9995] focus:outline-none focus:border-[#18217E] focus:bg-white resize-y"
          />

          {/* CSV File Upload Section */}
          <div className="border border-dashed border-[#D0D9DE] rounded-xl p-3 bg-[#F4F7F9] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#393A50]">
              <Upload className="w-4 h-4 text-[#424989]" />
              <div className="overflow-hidden">
                <span className="font-semibold block truncate max-w-[200px]">
                  {csvFileName || 'Upload CSV Manifest'}
                </span>
                <span className="text-[10px] text-[#8A9995] block">
                  Column 1 or 'trackingId' header
                </span>
              </div>
            </div>
            <label className="px-3 py-1.5 bg-white border border-[#D0D9DE] hover:border-[#18217E] text-[#09104D] rounded-lg text-xs font-bold cursor-pointer transition-colors">
              Browse CSV
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSubmit()}
              disabled={parsedIds.length === 0 || isSubmitting}
              className="flex-1 text-xs"
            >
              {isSubmitting ? (
                <span>Querying Mendix REST Service...</span>
              ) : (
                <>
                  <span>Submit {parsedIds.length} IDs</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
            {rawInput && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setRawInput('');
                  setCsvFileName(null);
                  setResponse(null);
                }}
                title="Clear input"
              >
                <Trash2 className="w-4 h-4 text-[#8A9995]" />
              </Button>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-[#EA341F]/10 text-[#EA341F] rounded-xl text-xs flex items-center gap-2 border border-[#EA341F]/20">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Right: Results Workspace (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#D0D9DE] pb-3">
            <div>
              <h3 className="text-xs font-bold text-[#09104D] uppercase tracking-wider">
                Batch Verification Results
              </h3>
              <p className="text-[11px] text-[#8A9995]">
                {response
                  ? `Job ID: ${response.jobId} • Processed at ${new Date(response.processedAt).toLocaleTimeString()}`
                  : 'Awaiting submission'}
              </p>
            </div>

            {response && response.results.some((r) => r.canRetry) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryEligible}
                disabled={isSubmitting}
                leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Retry Eligible ({response.notFoundCount})
              </Button>
            )}
          </div>

          {response ? (
            <div className="space-y-4">
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#107C41]/10 p-2.5 rounded-xl border border-[#107C41]/20 text-center">
                  <span className="text-[10px] text-[#107C41] uppercase font-bold block">
                    Confirmed
                  </span>
                  <span className="text-lg font-black text-[#107C41]">
                    {response.successfulCount}
                  </span>
                </div>

                <div className="bg-[#EA341F]/10 p-2.5 rounded-xl border border-[#EA341F]/20 text-center">
                  <span className="text-[10px] text-[#EA341F] uppercase font-bold block">
                    Not Found
                  </span>
                  <span className="text-lg font-black text-[#EA341F]">
                    {response.notFoundCount}
                  </span>
                </div>

                <div className="bg-[#8C2527]/10 p-2.5 rounded-xl border border-[#8C2527]/20 text-center">
                  <span className="text-[10px] text-[#8C2527] uppercase font-bold block">
                    Unauthorized
                  </span>
                  <span className="text-lg font-black text-[#8C2527]">
                    {response.unauthorizedCount}
                  </span>
                </div>

                <div className="bg-[#424989]/10 p-2.5 rounded-xl border border-[#424989]/20 text-center">
                  <span className="text-[10px] text-[#424989] uppercase font-bold block">
                    Malformed
                  </span>
                  <span className="text-lg font-black text-[#424989]">
                    {response.failedCount}
                  </span>
                </div>
              </div>

              {/* Per-Record Results Table */}
              <div className="border border-[#D0D9DE] rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F7F9] text-[#393A50] font-bold text-[10px] uppercase border-b border-[#D0D9DE] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Submitted Query</th>
                      <th className="py-2.5 px-3">Outcome</th>
                      <th className="py-2.5 px-3">Status / Destination</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D0D9DE]">
                    {response.results.map((r, i) => (
                      <tr key={`${r.queryId}-${i}`} className="hover:bg-[#F4F7F9]/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#09104D]">
                          {r.queryId}
                        </td>
                        <td className="py-2.5 px-3">
                          {getOutcomeBadge(r.outcome)}
                        </td>
                        <td className="py-2.5 px-3">
                          {r.outcome === 'SUCCESS' ? (
                            <div>
                              <span className="font-semibold text-[#070724]">
                                {r.status}
                              </span>
                              <span className="text-[10px] text-[#8A9995] block truncate max-w-[160px]">
                                {r.destinationHubName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#EA341F]">
                              {r.errorMessage}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {r.shipmentId && (
                            <button
                              onClick={() => navigate(`/shipments/${r.shipmentId}`)}
                              className="text-xs font-semibold text-[#18217E] hover:underline cursor-pointer"
                            >
                              Inspect
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#8A9995] flex flex-col items-center justify-center">
              <Info className="w-8 h-8 text-[#8A9995] mb-2 opacity-60" />
              <p>Submit shipment IDs to inspect real-time Mendix tracking outcomes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
