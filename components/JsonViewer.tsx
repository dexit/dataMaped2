
import React, { useState } from 'react';
import type { Mapping } from '../types';
import { IconJson } from '../constants';

const inputClasses = "block w-full text-sm rounded-md border-slate-300 bg-slate-50 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-slate-200 disabled:cursor-not-allowed";

interface JsonViewerProps {
  mappings: Mapping[];
  showToast: (message: string, type: 'success' | 'error') => void;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ mappings, showToast }) => {
  const [selectedMappingId, setSelectedMappingId] = useState<string>('');

  const selectedMapping = mappings.find(m => m.id === selectedMappingId) || null;
  const jsonString = selectedMapping ? JSON.stringify(selectedMapping, null, 2) : "Select a mapping to view its JSON structure.";

  const copyToClipboard = () => {
    if (selectedMapping) {
      navigator.clipboard.writeText(jsonString);
      showToast("JSON copied to clipboard!", 'success');
    }
  };

  if (mappings.length === 0) {
      return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">View Mappings as JSON</h1>
            <div className="text-center py-10 px-6 bg-white rounded-lg shadow-sm border border-dashed border-slate-300">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                    <IconJson />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mt-4">No Mappings Available</h3>
                <p className="text-sm text-slate-500 mt-1">Create a mapping first to see its JSON representation here.</p>
            </div>
        </div>
      )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">View Mappings as JSON</h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <select
            onChange={(e) => setSelectedMappingId(e.target.value)}
            value={selectedMappingId ?? ""}
            className={`max-w-xs ${inputClasses}`}
          >
            <option value="">-- Select a Mapping --</option>
            {mappings.map((mapping) => (
              <option key={mapping.id} value={mapping.id}>
                {mapping.name}
              </option>
            ))}
          </select>
          <button
            onClick={copyToClipboard}
            disabled={!selectedMapping}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Copy JSON
          </button>
        </div>

        <pre className="bg-slate-800 text-white p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
          <code>
            {jsonString}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default JsonViewer;
