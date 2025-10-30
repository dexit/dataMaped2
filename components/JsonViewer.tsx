import React, { useState } from 'react';
import type { Mapping } from '../types';
import { IconJson, DEFAULT_INPUT_CLASSES, PRIMARY_BUTTON_CLASSES } from '../constants';
import EmptyState from './common/EmptyState'; // Use common EmptyState


interface JsonViewerProps {
  mappings: Mapping[];
  showToast: (message: string, type: 'success' | 'error') => void;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ mappings, showToast }) => {
  const [selectedMappingId, setSelectedMappingId] = useState<string>('');

  const selectedMapping = mappings.find(m => m.id === selectedMappingId) || null;
  const jsonString = selectedMapping ? JSON.stringify(selectedMapping, null, 2) : "Select a mapping from the dropdown to view its JSON structure.";

  const copyToClipboard = () => {
    if (selectedMapping) {
      navigator.clipboard.writeText(jsonString);
      showToast("JSON copied to clipboard!", 'success');
    }
  };

  if (mappings.length === 0) {
      return (
        <div className="space-y-8">
            <h1 className="text-4xl font-extrabold text-slate-900">View Mappings as JSON</h1>
            <EmptyState 
                title="No Mappings Available" 
                message="Create a mapping first to see its JSON representation here." 
                icon={<IconJson/>}
            />
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold text-slate-900">View Mappings as JSON</h1>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <select
            onChange={(e) => setSelectedMappingId(e.target.value)}
            value={selectedMappingId ?? ""}
            className={`flex-grow sm:max-w-xs ${DEFAULT_INPUT_CLASSES}`}
            aria-label="Select a mapping to view"
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
            className={`${PRIMARY_BUTTON_CLASSES} ${!selectedMapping ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            Copy JSON
          </button>
        </div>

        <pre className="bg-slate-800 text-white p-5 rounded-lg overflow-x-auto text-sm leading-relaxed border border-slate-700">
          <code>
            {jsonString}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default JsonViewer;