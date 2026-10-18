import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Package, 
  ShieldCheck, 
  AlertCircle, 
  Database
} from 'lucide-react';
import { mendixClient } from '../../services/api/mendixClient';
import { useAuth } from '../auth/AuthContext';
import { AiChatMessage } from '../../types';
import { Button } from '../../components/ui/Button';

export const AiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'init-01',
      sender: 'ASSISTANT',
      text: `Hello ${user.name}. I am the Mendix AI Operations Assistant. I analyze telemetry, SLA risk projections, and carrier SOP documentation across your authorized shipments.\n\nHow can I assist your logistics analysis today?`,
      timestamp: new Date().toLocaleTimeString(),
      isOperationalData: true,
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickQuestions = [
    'Which shipments are at risk of missing their delivery SLA?',
    'Summarize the latest tracking events for a shipment.',
    'Explain why a shipment was classified as delayed.',
    'Which exceptions require immediate operational attention?',
  ];

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: q,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await mendixClient.aiChat({ query: q }, user);

      const aiMsg: AiChatMessage = {
        id: res.messageId,
        sender: 'ASSISTANT',
        text: res.replyText,
        timestamp: new Date(res.timestamp).toLocaleTimeString(),
        sourceReferences: res.relatedShipments.map((s) => ({
          shipmentId: s.shipmentId,
          trackingId: s.trackingId,
          details: s.details,
        })),
        isAiExplanation: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'SYSTEM',
        text: `Error communicating with Mendix AI Orchestrator: ${err.message || 'Service unavailable'}`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'ERROR',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-[#09104D] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#18217E]" />
              Mendix AI Operations Copilot
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18217E]/10 text-[#18217E] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              RAG Orchestrated
            </span>
          </div>
          <p className="text-xs text-[#393A50] mt-0.5">
            Operational reasoning powered by Mendix Published REST Services, vector embeddings, and real-time telematics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8A9995]">
          <ShieldCheck className="w-4 h-4 text-[#107C41]" />
          <span>Role context & credentials enforced at backend</span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-[#8A9995] tracking-wider block">
          Suggested Operational Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white border border-[#D0D9DE] hover:border-[#18217E] hover:bg-[#F4F7F9] text-[#09104D] rounded-xl text-xs font-medium transition-all text-left cursor-pointer shadow-xs disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Canvas */}
      <div className="bg-white rounded-2xl border border-[#D0D9DE] shadow-card flex flex-col h-[520px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'USER';
            const isSystem = m.sender === 'SYSTEM';

            if (isSystem) {
              return (
                <div
                  key={m.id}
                  className="p-3 bg-[#EA341F]/10 border border-[#EA341F]/20 rounded-xl text-xs text-[#EA341F] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{m.text}</span>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
                    isUser ? 'bg-[#09104D]' : 'bg-[#18217E]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Content Bubble */}
                <div className="space-y-2">
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#18217E] text-white shadow-xs rounded-tr-none'
                        : 'bg-[#F4F7F9] text-[#070724] border border-[#D0D9DE] rounded-tl-none shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                    <div
                      className={`flex items-center justify-between text-[10px] mt-2 pt-1 border-t ${
                        isUser ? 'border-white/20 text-white/70' : 'border-[#D0D9DE]/60 text-[#8A9995]'
                      }`}
                    >
                      <span>{m.timestamp}</span>
                      {!isUser && (
                        <span className="font-semibold text-[#18217E] flex items-center gap-1">
                          <Database className="w-2.5 h-2.5" />
                          Mendix AI Orchestrator
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Related Shipments Cards */}
                  {m.sourceReferences && m.sourceReferences.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-[#D0D9DE] shadow-xs space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A9995] block">
                        Referenced Shipment Records:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {m.sourceReferences.map((ref, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigate(`/shipments/${ref.shipmentId}`)}
                            className="px-2.5 py-1 rounded-lg bg-[#F4F7F9] hover:bg-[#E5EBEE] border border-[#D0D9DE] text-left text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Package className="w-3 h-3 text-[#18217E]" />
                            <span className="font-mono font-bold text-[#18217E]">
                              {ref.trackingId}
                            </span>
                            <span className="text-[10px] text-[#393A50]">
                              ({ref.details})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-full bg-[#18217E] text-white flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-[#F4F7F9] rounded-2xl rounded-tl-none border border-[#D0D9DE] text-xs text-[#393A50] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#18217E] animate-pulse" />
                <span>Mendix AI is synthesizing knowledge references and telematics...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-[#D0D9DE] bg-[#F4F7F9] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Mendix AI about SLA breach projections, telematics alerts, or carrier SOPs..."
            disabled={isLoading}
            className="flex-1 p-2.5 text-xs bg-white border border-[#D0D9DE] rounded-xl text-[#070724] placeholder-[#8A9995] focus:outline-none focus:border-[#18217E] disabled:opacity-50"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
};
