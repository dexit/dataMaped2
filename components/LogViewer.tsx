import React, { useState } from 'react';
import type { LogEntry } from '../types';
import { IconSearch, IconChevronDown, IconTrash } from '../constants';

const LogDetail: React.FC<{ log: LogEntry }> = ({ log }) => {
    const renderJson = (data: any) => {
        if (typeof data === 'string') return <pre className="bg-gray-800 text-white p-2 rounded-md text-xs whitespace-pre-wrap break-all">{data}</pre>;
        return <pre className="bg-gray-800 text-white p-2 rounded-md text-xs whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2) || 'empty'}</pre>;
    };

    return (
        <div className="bg-slate-100 p-4 space-y-4">
            {log.error && <div className="p-2 bg-red-100 text-red-800 rounded-md"><strong>Error:</strong> {log.error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h4 className="font-semibold text-gray-700 mb-1">Request</h4>{renderJson(log.request)}</div>
                <div><h4 className="font-semibold text-gray-700 mb-1">Response</h4>{renderJson(log.response)}</div>
                {log.incomingRoute && <div><h4 className="font-semibold text-gray-700 mb-1">Matched Incoming Route</h4>{renderJson(log.incomingRoute)}</div>}
                {log.outgoingRoute && <div><h4 className="font-semibold text-gray-700 mb-1">Matched Outgoing Route</h4>{renderJson(log.outgoingRoute)}</div>}
                {log.mappingApplied && <div><h4 className="font-semibold text-gray-700 mb-1">Mapping Applied</h4>{renderJson(log.mappingApplied)}</div>}
                {log.bodyAfterTransforms && <div><h4 className="font-semibold text-gray-700 mb-1">Body After Transforms</h4>{renderJson(log.bodyAfterTransforms)}</div>}
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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Logs</h1>
            <p className="text-gray-600 -mt-4">Real-time stream of requests handled by the proxy.</p>
            
            <div className="flex items-center gap-4">
                <div className="relative flex-grow">
                    <input type="text" placeholder="Search by URL or method..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 shadow-sm"/>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconSearch /></div>
                </div>
                <button onClick={() => setLogs([])} className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800"><IconTrash/> Clear Logs</button>
            </div>
            
            {logs.length === 0 ? (
                <div className="text-center py-10 px-6 bg-white rounded-lg shadow"><h3 className="text-lg font-semibold text-gray-800">No Logs Yet</h3><p className="text-sm text-gray-500 mt-1">Make a request with the API Client to see logs here.</p></div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-10 px-6 py-3"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLogs.map(log => {
                                const status = log.response.status || 0;
                                const statusColor = status >= 500 ? 'text-red-600' : status >= 400 ? 'text-orange-500' : status >= 200 ? 'text-green-600' : 'text-gray-500';
                                return (
                                <React.Fragment key={log.id}>
                                    <tr className="hover:bg-slate-50">
                                        <td className="px-6 py-2"><button onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)} className={`text-gray-400 hover:text-gray-700 transform ${expandedLogId === log.id ? 'rotate-180' : ''}`}><IconChevronDown/></button></td>
                                        <td className="px-6 py-2 text-sm text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                        <td className={`px-6 py-2 text-sm font-bold ${statusColor}`}>{status || 'ERR'}</td>
                                        <td className="px-6 py-2 text-sm font-mono">{log.request.method}</td>
                                        <td className="px-6 py-2 text-sm text-gray-900 truncate max-w-md">{log.request.url}</td>
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
