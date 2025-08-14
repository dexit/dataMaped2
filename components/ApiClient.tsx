import React, { useState, useEffect } from 'react';
import type { ApiClient, Mapping, ApiClientHeader } from '../types';
import { API_METHODS, AUTH_TYPES } from '../constants';
import { IconPlay, IconPlus, IconTrash, IconChevronDown, IconSearch, IconPencil } from '../constants';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 my-8 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

const ApiClientForm: React.FC<{
    client: Omit<ApiClient, 'id'>,
    setClient: React.Dispatch<React.SetStateAction<Omit<ApiClient, 'id'>>>,
    mappings: Mapping[],
}> = ({ client, setClient, mappings }) => {
    
    const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
        const updatedHeaders = [...client.headers];
        updatedHeaders[index] = { ...updatedHeaders[index], [field]: value };
        setClient(prev => ({ ...prev, headers: updatedHeaders }));
    }
    const addHeader = () => setClient(prev => ({ ...prev, headers: [...prev.headers, { id: crypto.randomUUID(), key: '', value: '' }] }));
    const removeHeader = (id: string) => setClient(prev => ({ ...prev, headers: prev.headers.filter(h => h.id !== id) }));
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="URL (e.g., /api/users or https://...)" value={client.url} onChange={e => setClient({ ...client, url: e.target.value })} className="md:col-span-2 w-full text-sm rounded-md border-gray-300" />
                <select value={client.method} onChange={e => setClient({ ...client, method: e.target.value as any })} className="w-full text-sm rounded-md border-gray-300">{API_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                <select value={client.authType} onChange={e => setClient({ ...client, authType: e.target.value as any })} className="w-full text-sm rounded-md border-gray-300">{AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <select value={client.mappingId ?? ""} onChange={e => setClient({ ...client, mappingId: e.target.value || null })} className="md:col-span-2 w-full text-sm rounded-md border-gray-300"><option value="">No Mapping (for proxy testing)</option>{mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                <textarea placeholder="Request Body (JSON)" value={client.body} onChange={e => setClient({ ...client, body: e.target.value })} rows={4} className="md:col-span-2 w-full text-sm rounded-md border-gray-300 font-mono"></textarea>
            </div>
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Headers</h3>
                {client.headers.map((header, index) => (
                    <div key={header.id} className="flex items-center gap-2">
                        <input type="text" placeholder="Key" value={header.key} onChange={e => handleHeaderChange(index, 'key', e.target.value)} className="w-full text-sm rounded-md border-gray-300" />
                        <input type="text" placeholder="Value" value={header.value} onChange={e => handleHeaderChange(index, 'value', e.target.value)} className="w-full text-sm rounded-md border-gray-300" />
                        <button onClick={() => removeHeader(header.id)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><IconTrash /></button>
                    </div>
                ))}
                <button onClick={addHeader} className="text-sm text-sky-600 hover:text-sky-800">Add Header</button>
            </div>
        </div>
    );
};

interface ApiClientComponentProps {
  apiClients: ApiClient[];
  setApiClients: React.Dispatch<React.SetStateAction<ApiClient[]>>;
  mappings: Mapping[];
  showToast: (message: string, type: 'success' | 'error') => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

const ApiClientComponent: React.FC<ApiClientComponentProps> = ({ apiClients, setApiClients, mappings, showToast, showConfirmation }) => {
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [runningClientId, setRunningClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ApiClient | Omit<ApiClient, 'id'> | null>(null);

  const openAddModal = () => {
    setEditingClient({ url: '', method: 'GET', authType: 'NoAuth', headers: [], body: '', cache: false, timeout: 30000, retry: 0, mappingId: null });
    setIsModalOpen(true);
  };
  
  const openEditModal = (client: ApiClient) => {
      setEditingClient(client);
      setIsModalOpen(true);
  };

  const handleSaveClient = () => {
    if (!editingClient || !editingClient.url) { showToast('URL is required.', 'error'); return; }
    
    if ('id' in editingClient) {
        setApiClients(prev => prev.map(c => c.id === editingClient.id ? editingClient : c));
        showToast('API Client updated!', 'success');
    } else {
        const fullClient: ApiClient = { ...editingClient, id: crypto.randomUUID() };
        setApiClients(prev => [...prev, fullClient]);
        showToast('API Client added!', 'success');
    }
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const removeApiClient = (id: string) => showConfirmation('Delete API Client?', 'Are you sure you want to delete this client?', () => { setApiClients(prev => prev.filter(c => c.id !== id)); showToast('API Client removed.', 'success'); });
  
  const runTest = async (clientId: string) => {
    const client = apiClients.find(c => c.id === clientId); if (!client) return; setRunningClientId(clientId);
    try {
        const headers = client.headers.reduce((acc, h) => (h.key ? {...acc, [h.key]: h.value} : acc), {} as Record<string, string>);
        if(client.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        const response = await fetch(client.url, { method: client.method, headers, body: ['POST', 'PUT'].includes(client.method) ? client.body : undefined, });
        const responseBody = await response.text();
        setApiClients(prev => prev.map(c => c.id === clientId ? { ...c, status: response.status, responseBody, lastRun: new Date().toISOString() } : c));
        showToast(`Test finished with status ${response.status}`, response.ok ? 'success' : 'error');
    } catch(e: any) {
        setApiClients(prev => prev.map(c => c.id === clientId ? { ...c, status: 500, responseBody: e.message, lastRun: new Date().toISOString() } : c));
        showToast(`Test failed: ${e.message}`, 'error');
    } finally { setRunningClientId(null); setExpandedClientId(clientId); }
  };

  const filteredApiClients = apiClients.filter(c => c.url.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">API Clients</h1>
      <p className="text-gray-600 -mt-4">Use this to test your incoming routes or any external API.</p>
      
      <Modal isOpen={isModalOpen && editingClient !== null} onClose={() => setIsModalOpen(false)} title={(editingClient && 'id' in editingClient) ? 'Edit API Client' : 'Add New API Client'}>
          <ApiClientForm client={editingClient!} setClient={setEditingClient as any} mappings={mappings} />
          <div className="flex justify-end pt-6">
              <button onClick={handleSaveClient} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Save Client</button>
          </div>
      </Modal>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-sky-700 w-full md:w-auto"><IconPlus /> Add Client</button>
        <div className="relative flex-grow w-full md:w-auto">
            <input type="text" placeholder="Search by URL..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 shadow-sm"/>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconSearch /></div>
        </div>
      </div>
      
       {apiClients.length === 0 ? (
           <div className="text-center py-10 px-6 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800">No API Clients Created</h3>
                <p className="text-sm text-gray-500 mt-1">Add a client to test your local routes or any API endpoint.</p>
                <div className="mt-6"><button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-sky-700"><IconPlus /> Add Your First Client</button></div>
           </div>
       ) : (
       <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-6 py-3"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredApiClients.map(client => (
                <React.Fragment key={client.id}>
                    <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4"><button onClick={() => setExpandedClientId(prev => prev === client.id ? null : client.id)} className={`text-gray-400 hover:text-gray-700 transform ${expandedClientId === client.id ? 'rotate-180' : ''}`}><IconChevronDown/></button></td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-xs">{client.url}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{client.method}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{client.lastRun ? new Date(client.lastRun).toLocaleString() : 'Never'}</td>
                        <td className="px-6 py-4 text-sm font-bold">{client.status ? <span className={`${client.status >= 200 && client.status < 300 ? 'text-green-600' : 'text-red-600'}`}>{client.status}</span> : 'N/A'}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                            <button onClick={() => runTest(client.id)} disabled={runningClientId === client.id} className="text-green-600 hover:text-green-900 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait">
                                {runningClientId === client.id ? <div className="w-4 h-4 border-2 border-t-green-500 border-gray-200 rounded-full animate-spin"></div> : <IconPlay/>}
                                Run
                            </button>
                            <button onClick={() => openEditModal(client)} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"><IconPencil/> Edit</button>
                            <button onClick={() => removeApiClient(client.id)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"><IconTrash/> Delete</button>
                        </td>
                    </tr>
                    {expandedClientId === client.id && (
                        <tr>
                            <td colSpan={6} className="p-0"><div className="bg-slate-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div> <h4 className="font-semibold text-gray-700 mb-2">Request Body</h4> <pre className="bg-gray-800 text-white p-2 rounded-md text-xs max-h-40 overflow-auto">{client.body || 'No body'}</pre> </div>
                                <div> <h4 className="font-semibold text-gray-700 mb-2">Response Body</h4> <pre className="bg-gray-800 text-white p-2 rounded-md text-xs max-h-40 overflow-auto">{client.responseBody || 'No response yet'}</pre> </div>
                            </div></td>
                        </tr>
                    )}
                </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default ApiClientComponent;