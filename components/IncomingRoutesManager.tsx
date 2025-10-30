import React, { useState, useEffect } from 'react';
import type { IncomingRoute, OutgoingRoute, Condition, ConditionGroup, ConditionOperator, IncomingAuthentication, ApiClientHeader } from '../types';
import { INCOMING_METHODS, CONDITION_OPERATORS, IconPlus, IconTrash, IconPencil, INCOMING_AUTH_TYPES, API_KEY_LOCATIONS, IconSearch, IconIncoming, DEFAULT_INPUT_CLASSES, PRIMARY_BUTTON_CLASSES, ICON_BUTTON_BASE_CLASSES, ICON_BUTTON_HOVER_INFO_CLASSES, ICON_BUTTON_HOVER_DANGER_CLASSES } from '../constants';
import Modal from './common/Modal'; // Use common Modal
import EmptyState from './common/EmptyState'; // Use common EmptyState


// --- Authentication UI ---
const IncomingAuthEditor: React.FC<{auth: IncomingAuthentication, setAuth: (a: IncomingAuthentication) => void}> = ({ auth, setAuth }) => {
    const handleTypeChange = (type: IncomingAuthentication['type']) => {
        if (type === 'none') setAuth({ type: 'none' });
        else if (type === 'api-key') setAuth({ type: 'api-key', location: 'header', paramName: 'X-API-KEY', allowedKeys: [] });
        else if (type === 'bearer') setAuth({ type: 'bearer', allowedTokens: [] });
    };

    return (
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-base font-semibold text-slate-700">Authentication</h3>
            <select value={auth.type} onChange={e => handleTypeChange(e.target.value as any)} className={`${DEFAULT_INPUT_CLASSES} md:col-span-1`}>
                {INCOMING_AUTH_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {auth.type === 'api-key' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={auth.location} onChange={e => setAuth({...auth, location: e.target.value as any})} className={DEFAULT_INPUT_CLASSES}>
                        {API_KEY_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                    <input type="text" placeholder="Param Name (e.g., api_key)" value={auth.paramName} onChange={e => setAuth({...auth, paramName: e.target.value})} className={DEFAULT_INPUT_CLASSES}/>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Allowed Keys (one per line)</label>
                        <textarea value={auth.allowedKeys.join('\n')} onChange={e => setAuth({...auth, allowedKeys: e.target.value.split('\n').map(k => k.trim()).filter(Boolean)})} rows={3} className={`${DEFAULT_INPUT_CLASSES} font-mono`}></textarea>
                    </div>
                </div>
            )}
            {auth.type === 'bearer' && (
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Allowed Tokens (one per line)</label>
                    <textarea value={auth.allowedTokens.join('\n')} onChange={e => setAuth({...auth, allowedTokens: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)})} rows={3} className={`${DEFAULT_INPUT_CLASSES} font-mono`}></textarea>
                </div>
            )}
        </div>
    )
}

// --- Condition Builder Components ---
const ConditionComponent: React.FC<{condition: Condition, onChange: (c: Condition) => void, onRemove: () => void}> = ({condition, onChange, onRemove}) => {
    const showValueInput = condition.operator !== 'exists';
    return (
        <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
            <input type="text" placeholder="body.user.id" value={condition.path} onChange={e => onChange({...condition, path: e.target.value})} className={`flex-grow font-mono ${DEFAULT_INPUT_CLASSES}`} />
            <select value={condition.operator} onChange={e => onChange({...condition, operator: e.target.value as ConditionOperator})} className={DEFAULT_INPUT_CLASSES}>
                {CONDITION_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
            </select>
            {showValueInput && <input type="text" placeholder="Value" value={condition.value} onChange={e => onChange({...condition, value: e.target.value})} className={`flex-grow ${DEFAULT_INPUT_CLASSES}`} />}
            <button onClick={onRemove} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_DANGER_CLASSES}`} title="Remove Condition"><IconTrash/></button>
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
        <div className={`p-4 rounded-xl ${isRoot ? 'bg-white' : 'bg-slate-200/70 border border-slate-300'} shadow-sm`}>
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <label className={`font-bold text-base ${group.type === 'AND' ? 'text-blue-600' : 'text-emerald-600'}`}>Match</label>
                    <select value={group.type} onChange={e => onChange({...group, type: e.target.value as 'AND' | 'OR'})} className={`${DEFAULT_INPUT_CLASSES} font-bold w-auto py-1`}>
                        <option value="AND">ALL</option>
                        <option value="OR">ANY</option>
                    </select>
                    <label className="font-bold text-base text-slate-700">of the following:</label>
                </div>
                {!isRoot && <button onClick={onRemove} className={`${ICON_BUTTON_BASE_CLASSES} hover:bg-slate-300 ${ICON_BUTTON_HOVER_DANGER_CLASSES}`} title="Remove Group"><IconTrash/></button>}
            </div>
            <div className="space-y-3 pl-4 border-l-2 border-slate-300">
                {group.conditions.map((cond, i) => (
                    'conditions' in cond
                        ? <ConditionGroupComponent key={cond.id} group={cond} onChange={(g) => updateCondition(i, g)} onRemove={() => removeCondition(i)} />
                        : <ConditionComponent key={cond.id} condition={cond} onChange={(c) => updateCondition(i, c)} onRemove={() => removeCondition(i)} />
                ))}
                 <div className="flex items-center gap-3 pt-2">
                    <button onClick={addCondition} className="text-base font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">+ Add Condition</button>
                    <button onClick={addGroup} className="text-base font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">+ Add Group</button>
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
    const [searchTerm, setSearchTerm] = useState('');

    const openAddModal = () => {
        setEditingRoute({
            id: crypto.randomUUID(),
            name: '',
            path: '/',
            method: 'ANY',
            responseMode: 'proxy',
            outgoingRouteId: null,
            authentication: { type: 'none' },
            conditions: { id: crypto.randomUUID(), type: 'AND', conditions: [] },
            mockResponseStatusCode: 200,
            mockResponseHeaders: [],
            mockResponseBody: '{}'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (route: IncomingRoute) => {
        const routeWithDefaults = {
            mockResponseStatusCode: 200,
            mockResponseHeaders: [],
            mockResponseBody: '{}',
            ...route,
            responseMode: route.responseMode || 'proxy',
            authentication: route.authentication || { type: 'none' }
        };
        setEditingRoute(JSON.parse(JSON.stringify(routeWithDefaults))); // Deep copy
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingRoute || !editingRoute.name || !editingRoute.path) {
            showToast('Route Name and Path are required.', 'error');
            return;
        }

        if (!editingRoute.path.startsWith('/')) {
            showToast('Path must start with a forward slash (/).', 'error');
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
    
    const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
        if (!editingRoute || !editingRoute.mockResponseHeaders) return;
        const updatedHeaders = [...editingRoute.mockResponseHeaders];
        updatedHeaders[index] = { ...updatedHeaders[index], [field]: value };
        setEditingRoute(prev => prev ? ({ ...prev, mockResponseHeaders: updatedHeaders }) : null);
    };

    const addHeader = () => {
        if (!editingRoute) return;
        const newHeaders: ApiClientHeader[] = [...(editingRoute.mockResponseHeaders || []), { id: crypto.randomUUID(), key: '', value: '' }];
        setEditingRoute(prev => prev ? { ...prev, mockResponseHeaders: newHeaders } : null);
    };
    
    const removeHeader = (id: string) => {
        if (!editingRoute || !editingRoute.mockResponseHeaders) return;
        const filteredHeaders = editingRoute.mockResponseHeaders.filter(h => h.id !== id);
        setEditingRoute(prev => prev ? { ...prev, mockResponseHeaders: filteredHeaders } : null);
    };


    const removeRoute = (id: string) => {
        showConfirmation('Delete Incoming Route?', 'Are you sure you want to delete this route?', () => {
            setIncomingRoutes(prev => prev.filter(r => r.id !== id));
            showToast('Route removed.', 'success');
        });
    };
    
    const filteredRoutes = incomingRoutes.filter(route =>
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.path.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const modalFooter = <button onClick={handleSave} className={PRIMARY_BUTTON_CLASSES}>Save Route</button>;
    
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-extrabold text-slate-900">Incoming Routes</h1>
                <p className="text-base text-slate-600 mt-2">Define endpoints for the proxy to intercept. Requests are matched from top to bottom.</p>
            </header>
            
            <div className="flex flex-col md:flex-row items-center gap-4 p-5 bg-white rounded-xl shadow-md border border-slate-200">
                <div className="relative flex-grow w-full md:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div>
                    <input 
                        type="text" 
                        placeholder="Search by name or path..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 ${DEFAULT_INPUT_CLASSES}`}
                    />
                </div>
                <button onClick={openAddModal} className={`${PRIMARY_BUTTON_CLASSES} w-full md:w-auto`}>
                    <IconPlus /> Add Incoming Route
                </button>
            </div>
            
            {isModalOpen && editingRoute && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={incomingRoutes.some(r => r.id === editingRoute.id) ? 'Edit Incoming Route' : 'Add Incoming Route'} footer={modalFooter}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Route Name <span className="text-red-500">*</span></label><input type="text" placeholder="e.g., Get User Profile" value={editingRoute.name} onChange={e => setEditingRoute({...editingRoute, name: e.target.value})} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`}/></div>
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Method</label><select value={editingRoute.method} onChange={e => setEditingRoute({...editingRoute, method: e.target.value as any})} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`}>{INCOMING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Path <span className="text-red-500">*</span></label><input type="text" placeholder="/users/:id" value={editingRoute.path} onChange={e => setEditingRoute({...editingRoute, path: e.target.value})} className={`mt-1 font-mono ${DEFAULT_INPUT_CLASSES}`}/></div>
                        
                        <IncomingAuthEditor auth={editingRoute.authentication} setAuth={auth => setEditingRoute({...editingRoute, authentication: auth})} />

                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Conditions</label><p className="text-xs text-slate-500 mb-2">Define additional rules to match the request. Use JSONPath for paths (e.g., `body.user.role`, `query.page`, `headers.x-api-key`).</p><ConditionGroupComponent group={editingRoute.conditions} onChange={c => setEditingRoute({...editingRoute, conditions: c})} isRoot /></div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Response Mode</label>
                            <div className="flex rounded-lg shadow-sm">
                                <button onClick={() => setEditingRoute({...editingRoute, responseMode: 'proxy'})} className={`flex-1 px-5 py-2.5 text-sm font-semibold border rounded-l-lg transition-colors ${editingRoute.responseMode === 'proxy' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}>Proxy to Outgoing Route</button>
                                <button onClick={() => setEditingRoute({...editingRoute, responseMode: 'mock'})} className={`flex-1 px-5 py-2.5 text-sm font-semibold border rounded-r-lg -ml-px transition-colors ${editingRoute.responseMode === 'mock' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}>Return Mock Response</button>
                            </div>
                        </div>

                        {editingRoute.responseMode === 'proxy' && (
                           <div><label className="block text-sm font-medium text-slate-700 mb-1">Route To</label><select value={editingRoute.outgoingRouteId ?? ""} onChange={e => setEditingRoute({...editingRoute, outgoingRouteId: e.target.value || null})} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`}><option value="">-- Select Outgoing Route --</option>{outgoingRoutes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                        )}

                        {editingRoute.responseMode === 'mock' && (
                            <div className="space-y-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
                                <h3 className="text-base font-semibold text-slate-800">Mock Response Configuration</h3>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Status Code</label><input type="number" value={editingRoute.mockResponseStatusCode} onChange={e => setEditingRoute({...editingRoute, mockResponseStatusCode: parseInt(e.target.value, 10) || 200})} className={`mt-1 max-w-xs ${DEFAULT_INPUT_CLASSES}`}/></div>
                                
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-slate-700">Headers</h4>
                                    {(editingRoute.mockResponseHeaders || []).map((header, index) => (
                                        <div key={header.id} className="flex items-center gap-2">
                                            <input type="text" placeholder="Key" value={header.key} onChange={e => handleHeaderChange(index, 'key', e.target.value)} className={DEFAULT_INPUT_CLASSES} />
                                            <input type="text" placeholder="Value" value={header.value} onChange={e => handleHeaderChange(index, 'value', e.target.value)} className={DEFAULT_INPUT_CLASSES} />
                                            <button onClick={() => removeHeader(header.id)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_DANGER_CLASSES}`} title="Remove Header"><IconTrash /></button>
                                        </div>
                                    ))}
                                    <button onClick={addHeader} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">+ Add Header</button>
                                </div>

                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Response Body</label><textarea value={editingRoute.mockResponseBody} onChange={e => setEditingRoute({...editingRoute, mockResponseBody: e.target.value})} rows={8} className={`mt-1 font-mono ${DEFAULT_INPUT_CLASSES}`}></textarea></div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {incomingRoutes.length === 0 ? (
                <EmptyState 
                    title="No Incoming Routes" 
                    message="Add a route to start intercepting requests." 
                    icon={<IconIncoming/>}
                    action={<button onClick={openAddModal} className={PRIMARY_BUTTON_CLASSES}><IconPlus /> Add Your First Incoming Route</button>}
                />
            ) : (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Method & Path</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Auth</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Routes To</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredRoutes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-500">
                                        No routes match your search criteria.
                                    </td>
                                </tr>
                            )}
                            {filteredRoutes.map(route => (
                                <tr key={route.id} className="hover:bg-emerald-50/10 transition-colors">
                                    <td className="px-6 py-4 text-base font-medium text-slate-800">{route.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600"><span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full text-xs">{route.method}</span> <span className="font-mono ml-2">{route.path}</span></td>
                                    <td className="px-6 py-4 text-sm">
                                        {route.responseMode === 'mock' 
                                            ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Mock</span>
                                            : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Proxy</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">{route.authentication?.type.replace('-', ' ') || 'None'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{outgoingRoutes.find(r => r.id === route.outgoingRouteId)?.name || <span className="text-slate-400 italic">N/A</span>}</td>
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

export default IncomingRoutesManager;