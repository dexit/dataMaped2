
import React, { useState, useEffect } from 'react';
import type { ApiClient, Mapping, ApiClientHeader } from '../types';
import { API_METHODS, AUTH_TYPES } from '../constants';
import { IconPlay, IconPlus, IconTrash, IconChevronDown, IconSearch, IconPencil } from '../constants';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; }> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 my-8 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-slate-200 p-4 flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
                {footer && <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3 rounded-b-lg">{footer}</div>}
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">URL</label>
                    <input type="text" placeholder="e.g., /api/users or https://..." value={client.url} onChange={e => setClient({ ...client, url: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Method</label>
                    <select value={client.method} onChange={e => setClient({ ...client, method: e.target.value as any })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm">{API_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Auth Type</label>
                    <select value={client.authType} onChange={e => setClient({ ...client, authType: e.target.value as any })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm">{AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Mapping</label>
                    <select value={client.mappingId ?? ""} onChange={e => setClient({ ...client, mappingId: e.target.value || null })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"><option value="">No Mapping (for proxy testing)</option>{mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Request Body (JSON)</label>
                    <textarea placeholder="{}" value={client.body} onChange={e => setClient({ ...client, body: e.target.value })} rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-mono"></textarea>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Headers</h3>
                {client.headers.map((header, index) => (
                    <div key={header.id} className="flex items-center gap-2">
                        <input type="text" placeholder="Key" value={header.key} onChange={e => handleHeaderChange(index, 'key', e.target.value)} className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />
                        <input type="text" placeholder="Value" value={header.value} onChange={e => handleHeaderChange(index, 'value', e.target.value)} className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />
                        <button onClick={() => removeHeader(header.id)} className="text-slate-500 p-2 rounded-full hover:bg-slate-100 hover:text-red-600"><IconTrash /></button>
                    </div>
                ))}
                <button onClick={addHeader} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">+ Add Header</button>
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

  const modalFooter = <button onClick={handleSaveClient} className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">Save Client</button>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">API Clients</h1>
        <p className="text-slate-600 mt-1">Use this to test your incoming routes or any external API.</p>
      </header>
      
      <Modal isOpen={isModalOpen && editingClient !== null} onClose={() => setIsModalOpen(false)} title={(editingClient && 'id' in editingClient) ? 'Edit API Client' : 'Add New API Client'} footer={modalFooter}>
          <ApiClientForm client={editingClient!} setClient={setEditingClient as any} mappings={mappings} />
      </Modal>

      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-grow w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div>
            <input type="text" placeholder="Search by URL..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"/>
        </div>
        <button onClick={openAddModal} className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><IconPlus /> Add Client</button>
      </div>
      
       {apiClients.length === 0 ? (
           <div className="text-center py-10 px-6 bg-white rounded-lg shadow-sm border border-dashed border-slate-300">
                <h3 className="text-lg font-semibold text-slate-800">No API Clients Created</h3>
                <p className="text-sm text-slate-500 mt-1">Add a client to test your local routes or any API endpoint.</p>
                <div className="mt-6"><button onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><IconPlus /> Add Your First Client</button></div>
           </div>
       ) : (
       <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">URL</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Method</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Last Run</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredApiClients.map(client => (
                <React.Fragment key={client.id}>
                    <tr className="hover:bg-emerald-50/50">
                        <td className="px-4 py-2"><button onClick={() => setExpandedClientId(prev => prev === client.id ? null : client.id)} className={`text-slate-400 hover:text-slate-700 transform ${expandedClientId === client.id ? 'rotate-180' : ''}`}><IconChevronDown/></button></td>
                        <td className="px-4 py-2 text-sm font-medium text-slate-800 truncate max-w-xs">{client.url}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{client.method}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{client.lastRun ? new Date(client.lastRun).toLocaleString() : 'Never'}</td>
                        <td className="px-4 py-2 text-sm font-bold">{client.status ? <span className={`${client.status >= 200 && client.status < 300 ? 'text-emerald-600' : 'text-red-600'}`}>{client.status}</span> : <span className="text-slate-500">N/A</span>}</td>
                        <td className="px-4 py-2 text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-2">
                            <button onClick={() => runTest(client.id)} disabled={runningClientId === client.id} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-wait">
                                {runningClientId === client.id ? <div className="w-4 h-4 border-2 border-t-emerald-500 border-slate-200 rounded-full animate-spin"></div> : <IconPlay/>}
                                Run
                            </button>
                            <button onClick={() => openEditModal(client)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-blue-600"><IconPencil/></button>
                            <button onClick={() => removeApiClient(client.id)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-red-600"><IconTrash/></button>
                          </div>
                        </td>
                    </tr>
                    {expandedClientId === client.id && (
                        <tr>
                            <td colSpan={6} className="p-0"><div className="bg-slate-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div> <h4 className="font-semibold text-slate-700 mb-2">Request Body</h4> <pre className="bg-slate-800 text-white p-3 rounded-md text-xs max-h-40 overflow-auto">{client.body || <span className="text-slate-400">No body</span>}</pre> </div>
                                <div> <h4 className="font-semibold text-slate-700 mb-2">Response Body</h4> <pre className="bg-slate-800 text-white p-3 rounded-md text-xs max-h-40 overflow-auto">{client.responseBody || <span className="text-slate-400">No response yet</span>}</pre> </div>
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