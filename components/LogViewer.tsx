import React, { useState } from 'react';
import type { LogEntry } from '../types';
import { IconSearch, IconChevronDown, IconTrash, DEFAULT_INPUT_CLASSES, TEXT_DANGER_BUTTON_CLASSES, ICON_BUTTON_BASE_CLASSES, ICON_BUTTON_HOVER_SLATE_CLASSES } from '../constants';
import EmptyState from './common/EmptyState'; // Use common EmptyState

const LogDetail: React.FC<{ log: LogEntry }> = ({ log }) => {
    const renderJson = (data: any) => {
        if (typeof data === 'string') return <pre className="bg-slate-800 text-white p-3 rounded-lg text-xs whitespace-pre-wrap break-all border border-slate-700">{data}</pre>;
        return <pre className="bg-slate-800 text-white p-3 rounded-lg text-xs whitespace-pre-wrap break-all border border-slate-700">{JSON.stringify(data, null, 2) || 'empty'}</pre>;
    };

    return (
        <div className="bg-slate-100 p-5 space-y-5 border-t border-slate-200">
            {log.error && <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm font-medium border border-red-200"><strong>Error:</strong> {log.error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h4 className="font-semibold text-slate-700 mb-2 text-sm">Request</h4>{renderJson(log.request)}</div>
                <div><h4 className="font-semibold text-slate-700 mb-2 text-sm">Response</h4>{renderJson(log.response)}</div>
                {log.incomingRoute && <div><h4 className="font-semibold text-slate-700 mb-2 text-sm">Matched Incoming Route</h4>{renderJson(log.incomingRoute)}</div>}
                {log.outgoingRoute && <div><h4 className="font-semibold text-slate-700 mb-2 text-sm">Matched Outgoing Route</h4>{renderJson(log.outgoingRoute)}</div>}
                {log.mappingApplied && <div><h4 className="font-semibold text-slate-700 mb-2 text-sm">Mapping Applied</h4>{renderJson(log.mappingApplied)}</div>}
                {log.bodyAfterTransforms && <div><h4 className="font-semibold text-slate-700 mb-2 text-sm">Body After Transforms</h4>{renderJson(log.bodyAfterTransforms)}</div>}
            </div>
        </div>
    );
};


interface LogViewerProps {
    logs: LogEntry[];
    setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, setLogs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const filteredLogs = logs.filter(log => 
        log.request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.request.method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-extrabold text-slate-900">Logs</h1>
                <p className="text-base text-slate-600 mt-2">Real-time stream of requests handled by the proxy.</p>
            </header>
            
            <div className="flex flex-col md:flex-row items-center gap-4 p-5 bg-white rounded-xl shadow-md border border-slate-200">
                <div className="relative flex-grow w-full md:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div>
                    <input type="text" placeholder="Search by URL or method..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 ${DEFAULT_INPUT_CLASSES}`}/>
                </div>
                <button onClick={() => setLogs([])} className={TEXT_DANGER_BUTTON_CLASSES}><IconTrash/> Clear Logs</button>
            </div>
            
            {logs.length === 0 ? (
                <EmptyState 
                    title="No Logs Yet" 
                    message="Make a request with the API Client to see logs here." 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                />
            ) : (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="w-10 px-4 py-3"></th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Method</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">URL</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-500">
                                        No logs match your search criteria.
                                    </td>
                                </tr>
                            )}
                            {filteredLogs.map(log => {
                                const status = log.response.status || 0;
                                const statusColor = status >= 500 ? 'text-red-600' : status >= 400 ? 'text-orange-500' : status >= 200 && status < 300 ? 'text-emerald-600' : 'text-slate-500';
                                return (
                                <React.Fragment key={log.id}>
                                    <tr className="hover:bg-emerald-50/10 transition-colors">
                                        <td className="px-4 py-3"><button onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_SLATE_CLASSES} transform ${expandedLogId === log.id ? 'rotate-180' : ''}`}><IconChevronDown/></button></td>
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                        <td className={`px-4 py-3 text-sm font-bold ${statusColor}`}>{status || 'ERR'}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-slate-600">{log.request.method}</td>
                                        <td className="px-4 py-3 text-base text-slate-800 truncate max-w-md">{log.request.url}</td>
                                    </tr>
                                    {expandedLogId === log.id && (
                                        <tr><td colSpan={5} className="p-0"><LogDetail log={log} /></td></tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LogViewer;