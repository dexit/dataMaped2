
import React, { useState, useEffect, useCallback } from 'react';
import { View, Mapping, Category, ApiClient, ConfirmationState, IncomingRoute, OutgoingRoute, LogEntry, ConditionGroup } from './types';
import { IconIncoming, IconOutgoing, IconMappings, IconCategory, IconJson, IconApiClient, IconLogs, IconAlertTriangle } from './constants';
import { usePersistentState } from './services/storageService';

// Import New Components
import IncomingRoutesManager from './components/IncomingRoutesManager';
import OutgoingRoutesManager from './components/OutgoingRoutesManager';
import MappingManager from './components/MappingManager';
import CategoryManager from './components/CategoryManager';
import JsonViewer from './components/JsonViewer';
import ApiClientComponent from './components/ApiClient';
import LogViewer from './components/LogViewer';


const ConfirmationModal: React.FC<{
  config: ConfirmationState;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ config, onClose, onConfirm }) => {
  if (!config.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <IconAlertTriangle />
            </div>
            <div className="mt-0 text-left">
              <h3 className="text-lg leading-6 font-bold text-gray-900">{config.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{config.message}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 rounded-b-lg">
          <button onClick={onConfirm} className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Confirm</button>
          <button onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">Cancel</button>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.INCOMING_ROUTES);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // --- Main Data State ---
  const [mappings, setMappings] = usePersistentState<Mapping[]>('data-mappings', []);
  const [categories, setCategories] = usePersistentState<Category[]>('data-categories', []);
  const [apiClients, setApiClients] = usePersistentState<ApiClient[]>('data-api-clients', []);
  const [incomingRoutes, setIncomingRoutes] = usePersistentState<IncomingRoute[]>('data-incoming-routes', []);
  const [outgoingRoutes, setOutgoingRoutes] = usePersistentState<OutgoingRoute[]>('data-outgoing-routes', []);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // --- Service Worker Communication ---
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_RULES',
        payload: { mappings, incomingRoutes, outgoingRoutes },
      });
    }
    
    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'LOG') {
            setLogs(prevLogs => [event.data.payload, ...prevLogs].slice(0, 100)); // Keep last 100 logs
        }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);

  }, [mappings, incomingRoutes, outgoingRoutes]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);
  
  const showConfirmation = useCallback((title: string, message: string, onConfirmAction: () => void) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, []);
  
  const sharedProps = { setLoading: () => {}, showToast, showConfirmation };

  const renderView = () => {
    switch (currentView) {
      case View.INCOMING_ROUTES:
        return <IncomingRoutesManager incomingRoutes={incomingRoutes} setIncomingRoutes={setIncomingRoutes} outgoingRoutes={outgoingRoutes} {...sharedProps} />;
      case View.OUTGOING_ROUTES:
          return <OutgoingRoutesManager outgoingRoutes={outgoingRoutes} setOutgoingRoutes={setOutgoingRoutes} mappings={mappings} {...sharedProps} />;
      case View.MANAGE_MAPPINGS:
        return <MappingManager mappings={mappings} setMappings={setMappings} categories={categories} {...sharedProps} />;
      case View.MANAGE_CATEGORIES:
        return <CategoryManager categories={categories} setCategories={setCategories} {...sharedProps} />;
      case View.VIEW_JSON:
        return <JsonViewer mappings={mappings} showToast={showToast} />;
      case View.API_CLIENTS:
        return <ApiClientComponent apiClients={apiClients} setApiClients={setApiClients} mappings={mappings} {...sharedProps} />;
      case View.LOGS:
        return <LogViewer logs={logs} setLogs={setLogs} />;
      default:
        return <IncomingRoutesManager incomingRoutes={incomingRoutes} setIncomingRoutes={setIncomingRoutes} outgoingRoutes={outgoingRoutes} {...sharedProps} />;
    }
  };

  const NavItem: React.FC<{ view: View; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
    <li>
      <button
        onClick={() => setCurrentView(view)}
        className={`w-full flex items-center text-left py-2.5 px-4 rounded-lg text-sm transition-colors duration-200 ${
          currentView === view
            ? 'bg-sky-600 text-white font-semibold shadow'
            : 'text-slate-300 hover:bg-slate-700/75 hover:text-white'
        }`}
      >
        {icon}
        {label}
      </button>
    </li>
  );

  return (
    <div className="flex h-screen font-sans text-slate-800">
      <ConfirmationModal config={confirmation} onClose={() => setConfirmation(prev => ({...prev, isOpen: false}))} onConfirm={confirmation.onConfirm} />
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in-down ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <aside className="bg-slate-800 text-white w-64 p-4 flex flex-col shrink-0">
        <div className="text-2xl font-bold text-white mb-8 flex items-center gap-3 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Data Mapper</span>
        </div>
        <nav className="flex-grow">
          <p className="px-4 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Proxy</p>
          <ul className="space-y-1.5">
            <NavItem view={View.INCOMING_ROUTES} label="Incoming Routes" icon={<IconIncoming />} />
            <NavItem view={View.OUTGOING_ROUTES} label="Outgoing Routes" icon={<IconOutgoing />} />
            <NavItem view={View.LOGS} label="Logs" icon={<IconLogs />} />
            <NavItem view={View.API_CLIENTS} label="API Clients" icon={<IconApiClient />} />
          </ul>
          <p className="mt-8 px-4 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Configuration</p>
          <ul className="space-y-1.5">
            <NavItem view={View.MANAGE_MAPPINGS} label="Manage Mappings" icon={<IconMappings />} />
            <NavItem view={View.MANAGE_CATEGORIES} label="Manage Categories" icon={<IconCategory />} />
            <NavItem view={View.VIEW_JSON} label="View Mappings JSON" icon={<IconJson />} />
          </ul>
        </nav>
        <div className="mt-auto text-xs text-slate-500 px-2">
            <p>&copy; 2024 Data Mapper Pro</p>
            <p>Version 2.1.0</p>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;