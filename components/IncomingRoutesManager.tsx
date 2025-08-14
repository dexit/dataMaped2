
import React, { useState, useEffect } from 'react';
import type { IncomingRoute, OutgoingRoute, Condition, ConditionGroup, ConditionOperator, IncomingAuthentication, ApiKeyIncomingAuth } from '../types';
import { INCOMING_METHODS, CONDITION_OPERATORS, IconPlus, IconTrash, IconPencil, INCOMING_AUTH_TYPES, API_KEY_LOCATIONS } from '../constants';

// --- Reusable Modal Component ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 my-8 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4 sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- Authentication UI ---
const IncomingAuthEditor: React.FC<{auth: IncomingAuthentication, setAuth: (a: IncomingAuthentication) => void}> = ({ auth, setAuth }) => {
    const handleTypeChange = (type: IncomingAuthentication['type']) => {
        if (type === 'none') setAuth({ type: 'none' });
        else if (type === 'api-key') setAuth({ type: 'api-key', location: 'header', paramName: 'X-API-KEY', allowedKeys: [] });
        else if (type === 'bearer') setAuth({ type: 'bearer', allowedTokens: [] });
    };

    return (
        <div className="p-3 rounded-lg bg-slate-50 border">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Authentication</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={auth.type} onChange={e => handleTypeChange(e.target.value as any)} className="md:col-span-1 text-sm rounded-md border-gray-300">
                    {INCOMING_AUTH_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                {auth.type === 'api-key' && (
                    <>
                        <select value={auth.location} onChange={e => setAuth({...auth, location: e.target.value as any})} className="text-sm rounded-md border-gray-300">
                            {API_KEY_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                        </select>
                        <input type="text" placeholder="Param Name" value={auth.paramName} onChange={e => setAuth({...auth, paramName: e.target.value})} className="text-sm rounded-md border-gray-300"/>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Allowed Keys (one per line)</label>
                            <textarea value={auth.allowedKeys.join('\n')} onChange={e => setAuth({...auth, allowedKeys: e.target.value.split('\n').map(k => k.trim()).filter(Boolean)})} rows={3} className="w-full text-sm rounded-md border-gray-300 font-mono"></textarea>
                        </div>
                    </>
                )}
                {auth.type === 'bearer' && (
                    <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Allowed Tokens (one per line)</label>
                        <textarea value={auth.allowedTokens.join('\n')} onChange={e => setAuth({...auth, allowedTokens: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)})} rows={3} className="w-full text-sm rounded-md border-gray-300 font-mono"></textarea>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Condition Builder Components ---
const ConditionComponent: React.FC<{condition: Condition, onChange: (c: Condition) => void, onRemove: () => void}> = ({condition, onChange, onRemove}) => {
    const showValueInput = condition.operator !== 'exists';
    return (
        <div className="flex items-center gap-2 p-2 bg-slate-100 rounded">
            <input type="text" placeholder="body.user.id" value={condition.path} onChange={e => onChange({...condition, path: e.target.value})} className="flex-grow text-sm rounded-md border-gray-300 font-mono" />
            <select value={condition.operator} onChange={e => onChange({...condition, operator: e.target.value as ConditionOperator})} className="text-sm rounded-md border-gray-300">
                {CONDITION_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
            </select>
            {showValueInput && <input type="text" placeholder="Value" value={condition.value} onChange={e => onChange({...condition, value: e.target.value})} className="flex-grow text-sm rounded-md border-gray-300" />}
            <button onClick={onRemove} className="text-red-500 p-1 rounded-full hover:bg-red-100"><IconTrash/></button>
        </div>
    )
}

const ConditionGroupComponent: React.FC<{group: ConditionGroup, onChange: (g: ConditionGroup) => void, onRemove?: () => void, isRoot?: boolean}> = ({group, onChange, onRemove, isRoot=false}) => {
    
    const updateCondition = (index: number, newCond: Condition | ConditionGroup) => {
        const newConditions = [...group.conditions];
        newConditions[index] = newCond;
        onChange({...group, conditions: newConditions});
    }

    const removeCondition = (index: number) => {
        const newConditions = group.conditions.filter((_, i) => i !== index);
        onChange({...group, conditions: newConditions});
    }

    const addCondition = () => {
        const newCond: Condition = {id: crypto.randomUUID(), path: '', operator: 'eq', value: ''};
        onChange({...group, conditions: [...group.conditions, newCond]});
    }

    const addGroup = () => {
        const newGroup: ConditionGroup = {id: crypto.randomUUID(), type: 'AND', conditions: []};
        onChange({...group, conditions: [...group.conditions, newGroup]});
    }

    return (
        <div className={`p-3 rounded-lg ${isRoot ? 'bg-white' : 'bg-slate-200 border border-slate-300'}`}>
            <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                    <label className={`font-bold text-sm ${group.type === 'AND' ? 'text-blue-600' : 'text-green-600'}`}>Match</label>
                    <select value={group.type} onChange={e => onChange({...group, type: e.target.value as 'AND' | 'OR'})} className="text-sm rounded-md border-gray-300 font-bold">
                        <option value="AND">ALL</option>
                        <option value="OR">ANY</option>
                    </select>
                    <label className="font-bold text-sm text-gray-600">of the following:</label>
                </div>
                {!isRoot && <button onClick={onRemove} className="ml-auto text-red-500 p-1 rounded-full hover:bg-red-100"><IconTrash/></button>}
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-slate-300">
                {group.conditions.map((cond, i) => (
                    'conditions' in cond
                        ? <ConditionGroupComponent key={cond.id} group={cond} onChange={(g) => updateCondition(i, g)} onRemove={() => removeCondition(i)} />
                        : <ConditionComponent key={cond.id} condition={cond} onChange={(c) => updateCondition(i, c)} onRemove={() => removeCondition(i)} />
                ))}
                 <div className="flex items-center gap-2 pt-2">
                    <button onClick={addCondition} className="text-sm text-sky-600 hover:text-sky-800">+ Add Condition</button>
                    <button onClick={addGroup} className="text-sm text-sky-600 hover:text-sky-800">+ Add Group</button>
                </div>
            </div>
        </div>
    )
}

// --- Main Component ---
interface IncomingRoutesManagerProps {
  incomingRoutes: IncomingRoute[];
  setIncomingRoutes: React.Dispatch<React.SetStateAction<IncomingRoute[]>>;
  outgoingRoutes: OutgoingRoute[];
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const IncomingRoutesManager: React.FC<IncomingRoutesManagerProps> = ({ incomingRoutes, setIncomingRoutes, outgoingRoutes, showConfirmation, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<IncomingRoute | null>(null);

    const openAddModal = () => {
        setEditingRoute({
            id: crypto.randomUUID(),
            name: '',
            path: '',
            method: 'ANY',
            outgoingRouteId: null,
            authentication: { type: 'none' },
            conditions: { id: crypto.randomUUID(), type: 'AND', conditions: [] }
        });
        setIsModalOpen(true);
    };

    const openEditModal = (route: IncomingRoute) => {
        const routeWithAuth = {
            ...route,
            authentication: route.authentication || { type: 'none' }
        };
        setEditingRoute(JSON.parse(JSON.stringify(routeWithAuth))); // Deep copy
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingRoute || !editingRoute.name || !editingRoute.path) {
            showToast('Route Name and Path are required.', 'error');
            return;
        }

        const isEditing = incomingRoutes.some(r => r.id === editingRoute.id);
        if (isEditing) {
            setIncomingRoutes(prev => prev.map(r => r.id === editingRoute.id ? editingRoute : r));
            showToast('Incoming Route updated!', 'success');
        } else {
            setIncomingRoutes(prev => [...prev, editingRoute]);
            showToast('Incoming Route added!', 'success');
        }
        setIsModalOpen(false);
        setEditingRoute(null);
    };

    const removeRoute = (id: string) => {
        showConfirmation('Delete Incoming Route?', 'Are you sure you want to delete this route?', () => {
            setIncomingRoutes(prev => prev.filter(r => r.id !== id));
            showToast('Route removed.', 'success');
        });
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Incoming Routes</h1>
            <p className="text-gray-600 -mt-4">Define endpoints for the proxy to intercept. Requests are matched from top to bottom.</p>

            <button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-sky-700">
                <IconPlus /> Add Incoming Route
            </button>
            
            {isModalOpen && editingRoute && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={incomingRoutes.some(r => r.id === editingRoute.id) ? 'Edit Incoming Route' : 'Add Incoming Route'}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">Route Name</label><input type="text" placeholder="e.g., Get User Profile" value={editingRoute.name} onChange={e => setEditingRoute({...editingRoute, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300"/></div>
                            <div><label className="block text-sm font-medium text-gray-700">Method</label><select value={editingRoute.method} onChange={e => setEditingRoute({...editingRoute, method: e.target.value as any})} className="mt-1 block w-full rounded-md border-gray-300">{INCOMING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700">Path</label><input type="text" placeholder="/users/:id" value={editingRoute.path} onChange={e => setEditingRoute({...editingRoute, path: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 font-mono"/></div>
                        
                        <IncomingAuthEditor auth={editingRoute.authentication} setAuth={auth => setEditingRoute({...editingRoute, authentication: auth})} />

                        <div><label className="block text-sm font-medium text-gray-700">Conditions</label><p className="text-xs text-gray-500">Define additional rules to match the request. Use JSONPath for paths (e.g., `body.user.role`, `query.page`, `headers.x-api-key`).</p><ConditionGroupComponent group={editingRoute.conditions} onChange={c => setEditingRoute({...editingRoute, conditions: c})} isRoot /></div>
                        
                        <div><label className="block text-sm font-medium text-gray-700">Route To</label><select value={editingRoute.outgoingRouteId ?? ""} onChange={e => setEditingRoute({...editingRoute, outgoingRouteId: e.target.value || null})} className="mt-1 block w-full rounded-md border-gray-300"><option value="">-- Select Outgoing Route --</option>{outgoingRoutes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                        <div className="flex justify-end pt-4"><button onClick={handleSave} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Save Route</button></div>
                    </div>
                </Modal>
            )}

            {incomingRoutes.length === 0 ? (
                <div className="text-center py-10 px-6 bg-white rounded-lg shadow"><h3 className="text-lg font-semibold text-gray-800">No Incoming Routes</h3><p className="text-sm text-gray-500 mt-1">Add a route to start intercepting requests.</p></div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method & Path</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auth</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Routes To</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {incomingRoutes.map(route => (
                                <tr key={route.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{route.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500"><span className="font-bold text-sky-700 bg-sky-100 px-2 py-1 rounded-full text-xs">{route.method}</span> <span className="font-mono">{route.path}</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{route.authentication?.type.replace('-', ' ') || 'None'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{outgoingRoutes.find(r => r.id === route.outgoingRouteId)?.name || <span className="text-gray-400 italic">None</span>}</td>
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

export default IncomingRoutesManager;