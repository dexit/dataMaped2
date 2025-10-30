import React, { useState, useEffect } from 'react';
import type { OutgoingRoute, Mapping, EgressTransform, OutgoingAuthentication } from '../types';
import { IconPlus, IconTrash, IconPencil, OUTGOING_AUTH_TYPES, API_KEY_LOCATIONS, IconOutgoing, DEFAULT_INPUT_CLASSES, PRIMARY_BUTTON_CLASSES, ICON_BUTTON_BASE_CLASSES, ICON_BUTTON_HOVER_INFO_CLASSES, ICON_BUTTON_HOVER_DANGER_CLASSES } from '../constants';
import Modal from './common/Modal'; // Use common Modal
import EmptyState from './common/EmptyState'; // Use common EmptyState


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
        <div className="space-y-3 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
                <h3 className="text-base font-semibold text-slate-700">Egress Transformations (optional)</h3>
                <p className="text-xs text-slate-500 mt-1">Apply final JSONPath modifications after mapping, before sending to target.</p>
            </div>
            {transforms.map((transform, i) => (
                <div key={transform.id} className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
                    <select value={transform.action} onChange={e => updateTransform(i, {...transform, action: e.target.value as any})} className={DEFAULT_INPUT_CLASSES}>
                        <option value="set">Set</option>
                        <option value="remove">Remove</option>
                    </select>
                    <input type="text" placeholder="body.metadata.timestamp" value={transform.path} onChange={e => updateTransform(i, {...transform, path: e.target.value})} className={`flex-grow font-mono ${DEFAULT_INPUT_CLASSES}`} />
                    {transform.action === 'set' && <input type="text" placeholder="Value" value={transform.value} onChange={e => updateTransform(i, {...transform, value: e.target.value})} className={`flex-grow ${DEFAULT_INPUT_CLASSES}`} />}
                    <button onClick={() => removeTransform(transform.id)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_DANGER_CLASSES}`} title="Remove Transform"><IconTrash/></button>
                </div>
            ))}
            <button onClick={addTransform} className="text-base font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">+ Add Transform</button>
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
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-base font-semibold text-slate-700">Authentication</h3>
            <select value={auth.type} onChange={e => handleTypeChange(e.target.value as any)} className={`${DEFAULT_INPUT_CLASSES}`}>
                {OUTGOING_AUTH_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {auth.type === 'api-key' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select value={auth.location} onChange={e => setAuth({...auth, location: e.target.value as any})} className={DEFAULT_INPUT_CLASSES}>
                        {API_KEY_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                    <input type="text" placeholder="Param Name (e.g., api_key)" value={auth.paramName} onChange={e => setAuth({...auth, paramName: e.target.value})} className={DEFAULT_INPUT_CLASSES}/>
                    <input type="password" placeholder="API Key Value" value={auth.apiKey} onChange={e => setAuth({...auth, apiKey: e.target.value})} className={`md:col-span-2 ${DEFAULT_INPUT_CLASSES}`}/>
                </div>
            )}
            {auth.type === 'bearer' && (
                <input type="password" placeholder="Bearer Token" value={auth.token} onChange={e => setAuth({...auth, token: e.target.value})} className={DEFAULT_INPUT_CLASSES}/>
            )}
            {auth.type === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Username" value={auth.username} onChange={e => setAuth({...auth, username: e.target.value})} className={DEFAULT_INPUT_CLASSES}/>
                    <input type="password" placeholder="Password" value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} className={DEFAULT_INPUT_CLASSES}/>
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
        
        try {
            const url = new URL(editingRoute.targetUrl);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                throw new Error("Invalid protocol");
            }
        } catch (_) {
            showToast('Please enter a valid Target URL (e.g., https://api.example.com).', 'error');
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

    const modalFooter = <button onClick={handleSave} className={PRIMARY_BUTTON_CLASSES}>Save Route</button>;

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-extrabold text-slate-900">Outgoing Routes</h1>
                <p className="text-base text-slate-600 mt-2">Define where requests are sent after being processed by an incoming route.</p>
            </header>

            <div className="flex justify-end"> {/* Added container for button alignment */}
                <button onClick={openAddModal} className={PRIMARY_BUTTON_CLASSES}>
                    <IconPlus /> Add Outgoing Route
                </button>
            </div>
            
            {isModalOpen && editingRoute && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={outgoingRoutes.some(r => r.id === editingRoute.id) ? 'Edit Outgoing Route' : 'Add Outgoing Route'} footer={modalFooter}>
                    <div className="space-y-6">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Route Name <span className="text-red-500">*</span></label><input type="text" placeholder="e.g., Forward to User Service" value={editingRoute.name} onChange={e => setEditingRoute({...editingRoute, name: e.target.value})} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`}/></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Target URL <span className="text-red-500">*</span></label><input type="text" placeholder="https://api.example.com/v1/users" value={editingRoute.targetUrl} onChange={e => setEditingRoute({...editingRoute, targetUrl: e.target.value})} className={`mt-1 font-mono ${DEFAULT_INPUT_CLASSES}`}/></div>
                        
                        <OutgoingAuthEditor auth={editingRoute.authentication} setAuth={auth => setEditingRoute({...editingRoute, authentication: auth})} />

                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Apply Mapping (optional)</label><select value={editingRoute.mappingId ?? ""} onChange={e => setEditingRoute({...editingRoute, mappingId: e.target.value || null})} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`}><option value="">-- No Mapping --</option>{mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                        <EgressTransformEditor transforms={editingRoute.egressTransforms} setTransforms={t => setEditingRoute({...editingRoute, egressTransforms: t})} />
                    </div>
                </Modal>
            )}

            {outgoingRoutes.length === 0 ? (
                <EmptyState 
                    title="No Outgoing Routes" 
                    message="Add a route to define where to send processed requests." 
                    icon={<IconOutgoing/>}
                    action={<button onClick={openAddModal} className={PRIMARY_BUTTON_CLASSES}><IconPlus /> Add Your First Outgoing Route</button>}
                />
            ) : (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100"><tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Target URL</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mapping Applied</th><th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {outgoingRoutes.map(route => (
                                <tr key={route.id} className="hover:bg-emerald-50/10 transition-colors">
                                    <td className="px-6 py-4 text-base font-medium text-slate-800">{route.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono truncate max-w-xs">{route.targetUrl}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{mappings.find(m => m.id === route.mappingId)?.name || <span className="text-slate-400 italic">None</span>}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-1">
                                            <button onClick={() => openEditModal(route)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_INFO_CLASSES}`} title="Edit Route"><IconPencil/></button>
                                            <button onClick={() => removeRoute(route.id)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_DANGER_CLASSES}`} title="Delete Route"><IconTrash/></button>
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