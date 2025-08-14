
import React, { useState, useEffect } from 'react';
import type { OutgoingRoute, Mapping, EgressTransform, OutgoingAuthentication } from '../types';
import { IconPlus, IconTrash, IconPencil, OUTGOING_AUTH_TYPES, API_KEY_LOCATIONS } from '../constants';

// --- Reusable Modal Component ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 my-8 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4 sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                {children}
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
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Egress Transformations (optional)</h3>
            <p className="text-xs text-gray-500 -mt-2">Apply final JSONPath modifications after mapping.</p>
            {transforms.map((transform, i) => (
                <div key={transform.id} className="flex items-center gap-2 p-2 bg-slate-100 rounded">
                    <select value={transform.action} onChange={e => updateTransform(i, {...transform, action: e.target.value as any})} className="text-sm rounded-md border-gray-300">
                        <option value="set">Set</option>
                        <option value="remove">Remove</option>
                    </select>
                    <input type="text" placeholder="body.metadata.timestamp" value={transform.path} onChange={e => updateTransform(i, {...transform, path: e.target.value})} className="flex-grow text-sm rounded-md border-gray-300 font-mono" />
                    {transform.action === 'set' && <input type="text" placeholder="Value" value={transform.value} onChange={e => updateTransform(i, {...transform, value: e.target.value})} className="flex-grow text-sm rounded-md border-gray-300" />}
                    <button onClick={() => removeTransform(transform.id)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><IconTrash/></button>
                </div>
            ))}
            <button onClick={addTransform} className="text-sm text-sky-600 hover:text-sky-800">+ Add Transform</button>
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
        <div className="p-3 rounded-lg bg-slate-50 border">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Authentication</h3>
            <select value={auth.type} onChange={e => handleTypeChange(e.target.value as any)} className="w-full text-sm rounded-md border-gray-300 mb-2">
                {OUTGOING_AUTH_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {auth.type === 'api-key' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select value={auth.location} onChange={e => setAuth({...auth, location: e.target.value as any})} className="text-sm rounded-md border-gray-300">
                        {API_KEY_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                    <input type="text" placeholder="Param Name" value={auth.paramName} onChange={e => setAuth({...auth, paramName: e.target.value})} className="text-sm rounded-md border-gray-300"/>
                    <input type="password" placeholder="API Key Value" value={auth.apiKey} onChange={e => setAuth({...auth, apiKey: e.target.value})} className="md:col-span-2 text-sm rounded-md border-gray-300"/>
                </div>
            )}
            {auth.type === 'bearer' && (
                <input type="password" placeholder="Bearer Token" value={auth.token} onChange={e => setAuth({...auth, token: e.target.value})} className="w-full text-sm rounded-md border-gray-300"/>
            )}
            {auth.type === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input type="text" placeholder="Username" value={auth.username} onChange={e => setAuth({...auth, username: e.target.value})} className="text-sm rounded-md border-gray-300"/>
                    <input type="password" placeholder="Password" value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} className="text-sm rounded-md border-gray-300"/>
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

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Outgoing Routes</h1>
            <p className="text-gray-600 -mt-4">Define where requests are sent after being processed by an incoming route.</p>

            <button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-sky-700">
                <IconPlus /> Add Outgoing Route
            </button>
            
            {isModalOpen && editingRoute && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={outgoingRoutes.some(r => r.id === editingRoute.id) ? 'Edit Outgoing Route' : 'Add Outgoing Route'}>
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700">Route Name</label><input type="text" placeholder="e.g., Forward to User Service" value={editingRoute.name} onChange={e => setEditingRoute({...editingRoute, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Target URL</label><input type="text" placeholder="https://api.example.com/v1/users" value={editingRoute.targetUrl} onChange={e => setEditingRoute({...editingRoute, targetUrl: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 font-mono"/></div>
                        
                        <OutgoingAuthEditor auth={editingRoute.authentication} setAuth={auth => setEditingRoute({...editingRoute, authentication: auth})} />

                        <div><label className="block text-sm font-medium text-gray-700">Apply Mapping (optional)</label><select value={editingRoute.mappingId ?? ""} onChange={e => setEditingRoute({...editingRoute, mappingId: e.target.value || null})} className="mt-1 block w-full rounded-md border-gray-300"><option value="">-- No Mapping --</option>{mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                        <EgressTransformEditor transforms={editingRoute.egressTransforms} setTransforms={t => setEditingRoute({...editingRoute, egressTransforms: t})} />
                        <div className="flex justify-end pt-4"><button onClick={handleSave} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Save Route</button></div>
                    </div>
                </Modal>
            )}

            {outgoingRoutes.length === 0 ? (
                <div className="text-center py-10 px-6 bg-white rounded-lg shadow"><h3 className="text-lg font-semibold text-gray-800">No Outgoing Routes</h3><p className="text-sm text-gray-500 mt-1">Add a route to define where to send processed requests.</p></div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target URL</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mapping Applied</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {outgoingRoutes.map(route => (
                                <tr key={route.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{route.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono truncate max-w-xs">{route.targetUrl}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{mappings.find(m => m.id === route.mappingId)?.name || <span className="text-gray-400 italic">None</span>}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                        <button onClick={() => openEditModal(route)} className="text-blue-600 hover:text-blue-900"><IconPencil/></button>
                                        <button onClick={() => removeRoute(route.id)} className="text-red-600 hover:text-red-900"><IconTrash/></button>
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