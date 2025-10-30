import React, { useState, useEffect } from 'react';
import type { ApiClient, Mapping, ApiClientHeader } from '../types';
import { API_METHODS, AUTH_TYPES } from '../constants';
import { IconPlay, IconPlus, IconTrash, IconChevronDown, IconSearch, IconPencil, IconApiClient } from '../constants';
import Modal from './common/Modal'; // Use common Modal
import EmptyState from './common/EmptyState'; // Use common EmptyState

const inputClasses = "block w-full text-sm rounded-lg border-slate-300 bg-slate-50 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-slate-200 disabled:cursor-not-allowed";
const buttonPrimaryClasses = "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors";
const buttonSecondaryClasses = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors";
const iconButtonClasses = "text-slate-500 p-2 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors";
const dangerIconButtonClasses = "text-slate-500 p-2 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors";


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
                    <label className="block text-sm font-medium text-slate-700 mb-1">URL <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g., /api/users or https://..." value={client.url} onChange={e => setClient({ ...client, url: e.target.value })} className={`${inputClasses}`} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                    <select value={client.method} onChange={e => setClient({ ...client, method: e.target.value as any })} className={`${inputClasses}`}>{API_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Auth Type</label>
                    <select value={client.authType} onChange={e => setClient({ ...client, authType: e.target.value as any })} className={`${inputClasses}`}>{AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mapping</label>
                    <select value={client.mappingId ?? ""} onChange={e => setClient({ ...client, mappingId: e.target.value || null })} className={`${inputClasses}`}><option value="">No Mapping (for proxy testing)</option>{mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Request Body (JSON)</label>
                    <textarea placeholder="{}" value={client.body} onChange={e => setClient({ ...client, body: e.target.value })} rows={4} className={`font-mono ${inputClasses}`}></textarea>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Headers</h3>
                {client.headers.map((header, index) => (
                    <div key={header.id} className="flex items-center gap-2">
                        <input type="text" placeholder="Key" value={header.key} onChange={e => handleHeaderChange(index, 'key', e.target.value)} className={inputClasses} />
                        <input type="text" placeholder="Value" value={header.value} onChange={e => handleHeaderChange(index, 'value', e.target.value)} className={inputClasses} />
                        <button onClick={() => removeHeader(header.id)} className={dangerIconButtonClasses} title="Remove Header"><IconTrash /></button>
                    </div>
                ))}
                <button onClick={addHeader} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">+ Add Header</button>
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

  const modalFooter = <button onClick={handleSaveClient} className={buttonPrimaryClasses}>Save Client</button>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold text-slate-900">API Clients</h1>
        <p className="text-base text-slate-600 mt-2">Use this to test your incoming routes or any external API.</p>
      </header>
      
      <Modal isOpen={isModalOpen && editingClient !== null} onClose={() => setIsModalOpen(false)} title={(editingClient && 'id' in editingClient) ? 'Edit API Client' : 'Add New API Client'} footer={modalFooter}>
          <ApiClientForm client={editingClient!} setClient={setEditingClient as any} mappings={mappings} />
      </Modal>

      <div className="flex flex-col md:flex-row items-center gap-4 p-5 bg-white rounded-xl shadow-md border border-slate-200">
        <div className="relative flex-grow w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div>
            <input type="text" placeholder="Search by URL..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 ${inputClasses}`}/>
        </div>
        <button onClick={openAddModal} className={`${buttonPrimaryClasses} w-full md:w-auto`}><IconPlus /> Add Client</button>
      </div>
      
       {apiClients.length === 0 ? (
           <EmptyState 
                title="No API Clients Created" 
                message="Add a client to test your local routes or any API endpoint." 
                icon={<IconApiClient/>}
                action={<button onClick={openAddModal} className={buttonPrimaryClasses}><IconPlus /> Add Your First Client</button>}
           />
       ) : (
       <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
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
            {filteredApiClients.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                        No API clients match your search criteria.
                    </td>
                </tr>
            )}
            {filteredApiClients.map(client => (
                <React.Fragment key={client.id}>
                    <tr className="hover:bg-emerald-50/10 transition-colors">
                        <td className="px-4 py-3"><button onClick={() => setExpandedClientId(prev => prev === client.id ? null : client.id)} className={`text-slate-400 hover:text-slate-700 transform transition-transform ${expandedClientId === client.id ? 'rotate-180' : ''}`}><IconChevronDown/></button></td>
                        <td className="px-4 py-3 text-base font-medium text-slate-800 truncate max-w-xs">{client.url}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{client.method}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{client.lastRun ? new Date(client.lastRun).toLocaleString() : 'Never'}</td>
                        <td className="px-4 py-3 text-sm font-bold">{client.status ? <span className={`${client.status >= 200 && client.status < 300 ? 'text-emerald-600' : 'text-red-600'}`}>{client.status}</span> : <span className="text-slate-500">N/A</span>}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-2">
                            <button onClick={() => runTest(client.id)} disabled={runningClientId === client.id} className={`${buttonSecondaryClasses} disabled:opacity-50 disabled:cursor-wait`}>
                                {runningClientId === client.id ? <div className="w-4 h-4 border-2 border-t-emerald-500 border-slate-200 rounded-full animate-spin"></div> : <IconPlay/>}
                                Run
                            </button>
                            <button onClick={() => openEditModal(client)} className={iconButtonClasses} title="Edit Client"><IconPencil/></button>
                            <button onClick={() => removeApiClient(client.id)} className={dangerIconButtonClasses} title="Delete Client"><IconTrash/></button>
                          </div>
                        </td>
                    </tr>
                    {expandedClientId === client.id && (
                        <tr>
                            <td colSpan={6} className="p-0"><div className="bg-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200">
                                <div> <h4 className="font-semibold text-slate-700 mb-2 text-sm">Request Body</h4> <pre className="bg-slate-800 text-white p-3 rounded-lg text-xs max-h-40 overflow-auto border border-slate-700">{client.body || <span className="text-slate-400">No body</span>}</pre> </div>
                                <div> <h4 className="font-semibold text-slate-700 mb-2 text-sm">Response Body</h4> <pre className="bg-slate-800 text-white p-3 rounded-lg text-xs max-h-40 overflow-auto border border-slate-700">{client.responseBody || <span className="text-slate-400">No response yet</span>}</pre> </div>
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