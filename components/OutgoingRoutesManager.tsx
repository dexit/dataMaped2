
import React, { useState, useEffect } from 'react';
import type { OutgoingRoute, Mapping, EgressTransform, OutgoingAuthentication } from '../types';
import { IconPlus, IconTrash, IconPencil, OUTGOING_AUTH_TYPES, API_KEY_LOCATIONS } from '../constants';

// --- Reusable Modal Component ---
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

// --- Egress Transforms UI ---
const EgressTransformEditor: React.FC<{transforms: EgressTransform[], setTransforms: (t: EgressTransform[]) => void}> = ({ transforms, setTransforms }) => {
    const updateTransform = (index: number, newTransform: EgressTransform) => {
        const newTransforms = [...transforms];
        newTransforms[index] = newTransform;
        setTransforms(newTransforms);
    };

    const addTransform = () => setTransforms([...transforms, {id: crypto.randomUUID(), path: '', action: 'set', value: ''}]);
    const removeTransform = (id: string) => setTransforms(transforms.filter(t => t.id !== id));
    
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-medium text-slate-700">Egress Transformations (optional)</h3>
                <p className="text-xs text-slate-500">Apply final JSONPath modifications after mapping.</p>
            </div>
            {transforms.map((transform, i) => (
                <div key={transform.id} className="flex items-center gap-2 p-2 bg-slate-100 rounded">
                    <select value={transform.action} onChange={e => updateTransform(i, {...transform, action: e.target.value as any})} className="text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                        <option value="set">Set</option>
                        <option value="remove">Remove</option>
                    </select>
                    <input type="text" placeholder="body.metadata.timestamp" value={transform.path} onChange={e => updateTransform(i, {...transform, path: e.target.value})} className="flex-grow text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 font-mono" />
                    {transform.action === 'set' && <input type="text" placeholder="Value" value={transform.value} onChange={e => updateTransform(i, {...transform, value: e.target.value})} className="flex-grow text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />}
                    <button onClick={() => removeTransform(transform.id)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-red-600"><IconTrash/></button>
                </div>
            ))}
            <button onClick={addTransform} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">+ Add Transform</button>
        </div>
    );
};

// --- Outgoing Authentication UI ---
const OutgoingAuthEditor: React.FC<{auth: OutgoingAuthentication, setAuth: (a: OutgoingAuthentication) => void}> = ({ auth, setAuth }) => {
    const handleTypeChange = (type: OutgoingAuthentication['type']) => {
        if (type === 'none') setAuth({ type: 'none' });
        else if (type === 'api-key') setAuth({ type: 'api-key', location: 'header', paramName: 'X-API-KEY', apiKey: '' });
        else if (type === 'bearer') setAuth({ type: 'bearer', token: '' });
        else if (type === 'basic') setAuth({ type: 'basic', username: '', password: '' });
    };

    return (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Authentication</h3>
            <select value={auth.type} onChange={e => handleTypeChange(e.target.value as any)} className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 mb-3">
                {OUTGOING_AUTH_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {auth.type === 'api-key' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select value={auth.location} onChange={e => setAuth({...auth, location: e.target.value as any})} className="text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                        {API_KEY_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                    <input type="text" placeholder="Param Name" value={auth.paramName} onChange={e => setAuth({...auth, paramName: e.target.value})} className="text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"/>
                    <input type="password" placeholder="API Key Value" value={auth.apiKey} onChange={e => setAuth({...auth, apiKey: e.target.value})} className="md:col-span-2 text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"/>
                </div>
            )}
            {auth.type === 'bearer' && (
                <input type="password" placeholder="Bearer Token" value={auth.token} onChange={e => setAuth({...auth, token: e.target.value})} className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"/>
            )}
            {auth.type === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Username" value={auth.username} onChange={e => setAuth({...auth, username: e.target.value})} className="text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"/>
                    <input type="password" placeholder="Password" value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} className="text-sm rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"/>
                </div>
            )}
        </div>
    )
}

// --- Main Component ---
interface OutgoingRoutesManagerProps {
  outgoingRoutes: OutgoingRoute[];
  setOutgoingRoutes: React.Dispatch<React.SetStateAction<OutgoingRoute[]>>;
  mappings: Mapping[];
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const OutgoingRoutesManager: React.FC<OutgoingRoutesManagerProps> = ({ outgoingRoutes, setOutgoingRoutes, mappings, showConfirmation, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<OutgoingRoute | null>(null);

    const openAddModal = () => {
        setEditingRoute({ id: crypto.randomUUID(), name: '', targetUrl: '', mappingId: null, egressTransforms: [], authentication: {type: 'none'} });
        setIsModalOpen(true);
    };

    const openEditModal = (route: OutgoingRoute) => {
        const routeWithAuth = {
            ...route,
            authentication: route.authentication || { type: 'none' }
        };
        setEditingRoute(JSON.parse(JSON.stringify(routeWithAuth)));
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingRoute || !editingRoute.name || !editingRoute.targetUrl) {
            showToast('Route Name and Target URL are required.', 'error');
            return;
        }

        const isEditing = outgoingRoutes.some(r => r.id === editingRoute.id);
        if (isEditing) {
            setOutgoingRoutes(prev => prev.map(r => r.id === editingRoute.id ? editingRoute : r));
            showToast('Outgoing Route updated!', 'success');
        } else {
            setOutgoingRoutes(prev => [...prev, editingRoute]);
            showToast('Outgoing Route added!', 'success');
        }
        setIsModalOpen(false);
        setEditingRoute(null);
    };

    const removeRoute = (id: string) => {
        showConfirmation('Delete Outgoing Route?', 'Are you sure you want to delete this route? Incoming routes using it will need to be updated.', () => {
            setOutgoingRoutes(prev => prev.filter(r => r.id !== id));
            showToast('Route removed.', 'success');
        });
    };

    const modalFooter = <button onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">Save Route</button>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Outgoing Routes</h1>
                <p className="text-slate-600 mt-1">Define where requests are sent after being processed by an incoming route.</p>
            </header>

            <button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                <IconPlus /> Add Outgoing Route
            </button>
            
            {isModalOpen && editingRoute && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={outgoingRoutes.some(r => r.id === editingRoute.id) ? 'Edit Outgoing Route' : 'Add Outgoing Route'} footer={modalFooter}>
                    <div className="space-y-6">
                        <div><label className="block text-sm font-medium text-slate-700">Route Name</label><input type="text" placeholder="e.g., Forward to User Service" value={editingRoute.name} onChange={e => setEditingRoute({...editingRoute, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"/></div>
                        <div><label className="block text-sm font-medium text-slate-700">Target URL</label><input type="text" placeholder="https://api.example.com/v1/users" value={editingRoute.targetUrl} onChange={e => setEditingRoute({...editingRoute, targetUrl: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-mono"/></div>
                        
                        <OutgoingAuthEditor auth={editingRoute.authentication} setAuth={auth => setEditingRoute({...editingRoute, authentication: auth})} />

                        <div><label className="block text-sm font-medium text-slate-700">Apply Mapping (optional)</label><select value={editingRoute.mappingId ?? ""} onChange={e => setEditingRoute({...editingRoute, mappingId: e.target.value || null})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"><option value="">-- No Mapping --</option>{mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                        <EgressTransformEditor transforms={editingRoute.egressTransforms} setTransforms={t => setEditingRoute({...editingRoute, egressTransforms: t})} />
                    </div>
                </Modal>
            )}

            {outgoingRoutes.length === 0 ? (
                <div className="text-center py-10 px-6 bg-white rounded-lg shadow-sm border border-dashed border-slate-300"><h3 className="text-lg font-semibold text-slate-800">No Outgoing Routes</h3><p className="text-sm text-slate-500 mt-1">Add a route to define where to send processed requests.</p></div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100"><tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Target URL</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mapping Applied</th><th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {outgoingRoutes.map(route => (
                                <tr key={route.id} className="hover:bg-emerald-50/50">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{route.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono truncate max-w-xs">{route.targetUrl}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{mappings.find(m => m.id === route.mappingId)?.name || <span className="text-slate-400 italic">None</span>}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-1">
                                            <button onClick={() => openEditModal(route)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-blue-600"><IconPencil/></button>
                                            <button onClick={() => removeRoute(route.id)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-red-600"><IconTrash/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OutgoingRoutesManager;