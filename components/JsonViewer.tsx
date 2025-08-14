
import React, { useState } from 'react';
import type { Mapping } from '../types';
import { IconJson } from '../constants';

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
            <h1 className="text-3xl font-bold text-gray-800">View Mappings as JSON</h1>
            <div className="text-center py-10 px-6 bg-white rounded-lg shadow">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-sky-100">
                    <IconJson />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mt-4">No Mappings Available</h3>
                <p className="text-sm text-gray-500 mt-1">Create a mapping first to see its JSON representation here.</p>
            </div>
        </div>
      )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">View Mappings as JSON</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <select
            onChange={(e) => setSelectedMappingId(e.target.value)}
            value={selectedMappingId ?? ""}
            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
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
            className="inline-flex items-center gap-2 rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Copy JSON
          </button>
        </div>

        <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
          <code>
            {jsonString}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default JsonViewer;
