import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { AuditResult } from '../types';

interface RequirementAuditorProps {
  audit: AuditResult;
}

export const RequirementAuditor: React.FC<RequirementAuditorProps> = ({ audit }) => {
  if (audit.isValid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1 }}
        className="mb-8 p-4 bg-green-50 border-2 border-green-600 shadow-[4px_4px_0px_0px_#166534] flex items-center gap-3"
      >
        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-green-800">Requirement Validated</h3>
          <p className="text-xs font-bold text-green-700">No major logic gaps or ambiguities detected. Ready for generation.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1 }}
      className="mb-8 p-6 bg-red-50 border-2 border-black shadow-[4px_4px_0px_0px_#000]"
    >
      <div className="flex items-center gap-3 mb-4">
        <ShieldAlert className="w-6 h-6 text-red-600" />
        <h3 className="text-lg font-black uppercase tracking-tighter text-black">Pre-Flight Audit Risks</h3>
      </div>
      
      <ul className="space-y-2">
        {audit.risks.map((risk, index) => (
          <li key={index} className="flex gap-2 text-sm font-bold text-slate-800">
            <span className="text-red-600">•</span>
            {risk}
          </li>
        ))}
      </ul>
      
      <div className="mt-4 pt-4 border-t-2 border-black/10">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          Recommendation: Refine requirement to resolve these risks
        </p>
      </div>
    </motion.div>
  );
};
