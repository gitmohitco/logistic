import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#E5EBEE] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card border border-[#D0D9DE] p-8 text-center">
        <div className="w-16 h-16 bg-[#18217E]/10 text-[#18217E] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#18217E]/20">
          <FileQuestion className="w-9 h-9" />
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#18217E]/10 text-[#18217E] border border-[#18217E]/20">
          HTTP 404 Not Found
        </span>

        <h1 className="text-xl font-extrabold text-[#09104D] mt-3 mb-2">
          Page Not Found
        </h1>

        <p className="text-xs text-[#393A50] leading-relaxed mb-6">
          The requested URL path does not exist in the Shipment Exception Control Tower directory.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#D0D9DE] text-xs font-bold text-[#393A50] hover:bg-[#F4F7F9] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#18217E] text-white text-xs font-bold hover:bg-[#121860] transition-colors shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
