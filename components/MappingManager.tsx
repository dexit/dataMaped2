
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Mapping, DatamapEntry, Category } from '../types';
import { DATA_TYPES } from '../constants';
import { IconChevronDown, IconPlus, IconTrash, IconWand, IconPencil, IconSearch, IconSave, IconEdit } from '../constants';
import { suggestMappings } from '../services/geminiService';

const inputClasses = "block w-full text-sm rounded-md border-slate-300 bg-slate-50 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-slate-200 disabled:cursor-not-allowed";
const inputErrorClasses = "border-red-500 ring-red-500";
const inputDefaultClasses = "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500";


// Reusable Components
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl', footer?: React.ReactNode }> = ({ isOpen, onClose, title, children, size = 'lg', footer }) => {
  if (!isOpen) return null;
  const sizeClass = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start p-4 animate-fade-in-down" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClass} m-4 my-8 max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
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

const EmptyState: React.FC<{title: string; message: string; action?: React.ReactNode}> = ({title, message, action}) => (
    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-dashed border-slate-300">
        <h3 className="text-xl font-semibold text-slate-700">{title}</h3>
        <p className="text-base text-slate-500 mt-2">{message}</p>
        {action && <div className="mt-6">{action}</div>}
    </div>
);

// Main Component Logic starts here

const GeminiSuggestModal: React.FC<{ isOpen: boolean; onClose: () => void; onApply: (suggested: DatamapEntry[]) => void; showToast: (message: string, type: 'success' | 'error') => void; }> = ({ isOpen, onClose, onApply, showToast }) => {
    const [sourceSchema, setSourceSchema] = useState('');
    const [targetSchema, setTargetSchema] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSuggest = async () => {
        if (!sourceSchema || !targetSchema) { showToast('Both source and target schemas are required.', 'error'); return; }
        setIsLoading(true);
        try {
            const suggestions = await suggestMappings(JSON.parse(sourceSchema), JSON.parse(targetSchema));
            showToast(`AI suggested ${suggestions.length} mappings!`, 'success');
            onApply(suggestions);
            onClose();
        } catch (e: any) { showToast(e instanceof Error ? e.message : 'Invalid JSON format or AI error.', 'error'); } 
        finally { setIsLoading(false); }
    };
    
    const footer = <button onClick={handleSuggest} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-emerald-300"><IconWand /> {isLoading ? 'Thinking...' : 'Suggest Mappings'}</button>;

    return ( <Modal isOpen={isOpen} onClose={onClose} title="Get AI-Powered Mapping Suggestions" size="xl" footer={footer}><div className="space-y-4"><p className="text-sm text-slate-600">Paste example JSON objects for your source and target data. The AI will analyze the keys and suggest mappings. Provide valid JSON.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><textarea value={sourceSchema} onChange={e => setSourceSchema(e.target.value)} placeholder={`{\n  "user_id": 123,\n  "email_address": "test@example.com"\n}`} rows={10} className={`${inputClasses} font-mono`}></textarea><textarea value={targetSchema} onChange={e => setTargetSchema(e.target.value)} placeholder={`{\n  "userId": 123,\n  "email": "test@example.com"\n}`} rows={10} className={`${inputClasses} font-mono`}></textarea></div></div></Modal> );
};

const CsvImportModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (config: {name: string, category: string, datamap: DatamapEntry[]}) => void; csvData: { headers: string[], rows: string[][] } | null; categories: Category[]; showToast: (message: string, type: 'success' | 'error') => void; initialName: string; }> = ({ isOpen, onClose, onConfirm, csvData, categories, showToast, initialName }) => {
    type ColumnMap = { sourceField: string, sourceType: string, targetField: string, targetType: string };
    const [mappingName, setMappingName] = useState('');
    const [category, setCategory] = useState('');
    const [columnMap, setColumnMap] = useState<ColumnMap>({ sourceField: '', sourceType: '', targetField: '', targetType: '' });
    useEffect(() => {
        if(isOpen && csvData?.headers) {
            setMappingName(initialName.replace('.csv', ''));
            const headers = csvData.headers.map(h => h.toLowerCase());
            setColumnMap({
                sourceField: csvData.headers[headers.findIndex(h => h.includes('sourcefield'))] || csvData.headers[0] || '',
                sourceType: csvData.headers[headers.findIndex(h => h.includes('sourcetype'))] || csvData.headers[1] || '',
                targetField: csvData.headers[headers.findIndex(h => h.includes('targetfield'))] || csvData.headers[2] || '',
                targetType: csvData.headers[headers.findIndex(h => h.includes('targettype'))] || csvData.headers[3] || '',
            });
        }
    }, [isOpen, csvData, initialName]);
    if (!csvData) return null;
    const handleConfirm = () => {
        if (!mappingName) { showToast('Mapping Name is required', 'error'); return; }
        if (!columnMap.sourceField || !columnMap.targetField) { showToast('Source Field and Target Field must be mapped', 'error'); return; }
        const { headers, rows } = csvData;
        const sourceFieldIdx = headers.indexOf(columnMap.sourceField);
        const sourceTypeIdx = headers.indexOf(columnMap.sourceType);
        const targetFieldIdx = headers.indexOf(columnMap.targetField);
        const targetTypeIdx = headers.indexOf(columnMap.targetType);
        const datamap: DatamapEntry[] = rows.map(row => ({ id: crypto.randomUUID(), sourceField: row[sourceFieldIdx], sourceType: columnMap.sourceType && sourceTypeIdx > -1 ? row[sourceTypeIdx] : 'string', targetField: row[targetFieldIdx], targetType: columnMap.targetType && targetTypeIdx > -1 ? row[targetTypeIdx] : 'string' })).filter(entry => entry.sourceField && entry.targetField);
        onConfirm({ name: mappingName, category, datamap });
        onClose();
    };
    const renderSelect = (field: keyof ColumnMap) => <select value={columnMap[field]} onChange={e => setColumnMap(prev => ({...prev, [field]: e.target.value}))} className={inputClasses}><option value="">-- Not Mapped --</option>{csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}</select>;
    const footer = <><button onClick={onClose} className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button onClick={handleConfirm} className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">Import Mapping</button></>;
    return ( <Modal isOpen={isOpen} onClose={onClose} title="Import from CSV" size="xl" footer={footer}><div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700">Mapping Name <span className="text-red-500">*</span></label><input type="text" value={mappingName} onChange={e => setMappingName(e.target.value)} className={`mt-1 ${inputClasses}`} /></div><div><label className="block text-sm font-medium text-slate-700">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className={`mt-1 ${inputClasses}`}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div></div><div><h3 className="text-lg font-medium text-slate-800">Map CSV Columns</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2"><div><label className="block text-sm font-medium text-slate-700">Source Field <span className="text-red-500">*</span></label>{renderSelect('sourceField')}</div><div><label className="block text-sm font-medium text-slate-700">Source Type</label>{renderSelect('sourceType')}</div><div><label className="block text-sm font-medium text-slate-700">Target Field <span className="text-red-500">*</span></label>{renderSelect('targetField')}</div><div><label className="block text-sm font-medium text-slate-700">Target Type</label>{renderSelect('targetType')}</div></div></div><div><h3 className="text-lg font-medium text-slate-800">Data Preview (first 5 rows)</h3><div className="overflow-x-auto mt-2 border border-slate-200 rounded-lg"><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr className="text-left">{csvData.headers.map(h => <th key={h} className="p-2 font-semibold text-slate-600">{h}</th>)}</tr></thead><tbody className="bg-white divide-y divide-slate-200">{csvData.rows.slice(0, 5).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="p-2 truncate text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div></div></div></Modal> )
};

const MappingFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: {name: string, category: string}) => void; mapping: Pick<Mapping, 'name' | 'category'> | null; categories: Category[]; showToast: (message: string, type: 'success' | 'error') => void; }> = ({isOpen, onClose, onSave, mapping, categories, showToast}) => {
    const [formData, setFormData] = useState({name: '', category: ''});
    useEffect(() => { setFormData(mapping ? {name: mapping.name, category: mapping.category} : {name: '', category: ''}); }, [mapping, isOpen]);
    const handleSave = () => { if(!formData.name.trim()){ showToast("Mapping Name is required.", "error"); return; } onSave(formData); }
    const footer = <button onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">Save Mapping</button>;
    return ( <Modal isOpen={isOpen} onClose={onClose} title={mapping ? "Edit Mapping" : "Add New Mapping"} size="md" footer={footer}><div className="space-y-4"><div><label className="text-sm font-medium text-slate-700">Mapping Name <span className="text-red-500">*</span></label><input type="text" placeholder="e.g., User Profile V2" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={`mt-1 ${inputClasses}`}/></div><div><label className="text-sm font-medium text-slate-700">Category (optional)</label><select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className={`mt-1 ${inputClasses}`}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div></div></Modal> );
};

interface MappingManagerProps {
  mappings: Mapping[];
  setMappings: React.Dispatch<React.SetStateAction<Mapping[]>>;
  categories: Category[];
  showToast: (message: string, type: 'success' | 'error') => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

const MappingManager: React.FC<MappingManagerProps> = ({ mappings, setMappings, categories, showToast, showConfirmation }) => {
  const [expandedMappingId, setExpandedMappingId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryData, setEditingEntryData] = useState<DatamapEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isCsvModalOpen, setCsvModalOpen] = useState(false);
  const [isMappingFormOpen, setMappingFormOpen] = useState(false);
  
  const [activeMappingForAi, setActiveMappingForAi] = useState<string|null>(null);
  const [csvData, setCsvData] = useState<{headers: string[], rows: string[][]} | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);
  
  const [newDatamapEntry, setNewDatamapEntry] = useState<Omit<DatamapEntry, 'id'>>({ sourceField: '', sourceType: 'string', targetField: '', targetType: 'string' });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (e) => {
      try { const text = e.target?.result as string; const rows = text.trim().split('\n').map(row => row.split(',').map(field => field.trim())); if (rows.length < 1) throw new Error("CSV cannot be empty."); setCsvData({ headers: rows[0], rows: rows.slice(1) }); setCsvFileName(file.name); setCsvModalOpen(true); } catch (error: any) { showToast(error.message, 'error'); } finally { if(fileInputRef.current) fileInputRef.current.value = ""; }
    }; reader.readAsText(file);
  };
  
  const handleConfirmCsvImport = (config: {name: string, category: string, datamap: DatamapEntry[]}) => {
    const newMapping: Mapping = { id: crypto.randomUUID(), createdOn: new Date().toISOString(), lastModified: new Date().toISOString(), ...config };
    setMappings(prev => [...prev, newMapping]); showToast('CSV imported successfully!', 'success');
  };

  const handleSaveMapping = (data: {name: string, category: string}) => {
      if (editingMapping) { setMappings(p => p.map(m => m.id === editingMapping.id ? {...m, ...data, lastModified: new Date().toISOString()} : m)); showToast('Mapping updated!', 'success'); } 
      else { const now = new Date().toISOString(); setMappings(prev => [...prev, { ...data, id: crypto.randomUUID(), datamap: [], createdOn: now, lastModified: now }]); showToast('Mapping added!', 'success'); }
      setMappingFormOpen(false); setEditingMapping(null);
  };
  
  const openAddModal = () => { setEditingMapping(null); setMappingFormOpen(true); };
  const openEditModal = (mapping: Mapping) => { setEditingMapping(mapping); setMappingFormOpen(true); };

  const removeMapping = (id: string) => showConfirmation( 'Delete Mapping?', `Are you sure you want to delete this mapping? This action cannot be undone.`, () => { setMappings(prev => prev.filter(m => m.id !== id)); showToast('Mapping removed.', 'success'); });

  const addDatamapEntry = (mappingId: string) => {
    if(!newDatamapEntry.sourceField.trim() || !newDatamapEntry.targetField.trim()) { showToast("Source and Target fields are required.", "error"); return; }
    setMappings(prev => prev.map(m => m.id === mappingId ? { ...m, datamap: [...m.datamap, { ...newDatamapEntry, id: crypto.randomUUID() }], lastModified: new Date().toISOString() } : m));
    setNewDatamapEntry({ sourceField: '', sourceType: 'string', targetField: '', targetType: 'string' });
  };
  
  const startEditingEntry = (entry: DatamapEntry) => { setEditingEntryId(entry.id); setEditingEntryData(entry); };
  const cancelEditingEntry = () => { setEditingEntryId(null); setEditingEntryData(null); };

  const saveEditingEntry = (mappingId: string) => {
      if (!editingEntryData || !editingEntryData.sourceField || !editingEntryData.targetField) { showToast("Source and Target fields cannot be empty.", "error"); return; }
      setMappings(p => p.map(m => m.id === mappingId ? {...m, datamap: m.datamap.map(e => e.id === editingEntryId ? editingEntryData : e), lastModified: new Date().toISOString()} : m));
      cancelEditingEntry();
  };

  const removeDatamapEntry = (mappingId: string, entryId: string) => showConfirmation('Delete Entry?', 'Are you sure you want to delete this datamap entry?', () => setMappings(prev => prev.map(m => m.id === mappingId ? { ...m, datamap: m.datamap.filter(d => d.id !== entryId), lastModified: new Date().toISOString() } : m)));

  const handleApplyAiSuggestions = useCallback((suggestions: DatamapEntry[]) => {
      if (!activeMappingForAi) return; setMappings(prev => prev.map(m => m.id === activeMappingForAi ? { ...m, datamap: [...m.datamap, ...suggestions], lastModified: new Date().toISOString() } : m)); setActiveMappingForAi(null);
  }, [activeMappingForAi, setMappings]);
  
  const filteredMappings = mappings.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.category.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderAddEntryRow = (mappingId: string) => (
    <tr className="bg-slate-50">
        <td className="p-2"><input type="text" placeholder="Source Field" value={newDatamapEntry.sourceField} onChange={e => setNewDatamapEntry({...newDatamapEntry, sourceField: e.target.value})} className={inputClasses} /></td>
        <td className="p-2"><select value={newDatamapEntry.sourceType} onChange={e => setNewDatamapEntry({...newDatamapEntry, sourceType: e.target.value})} className={inputClasses}>{DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
        <td className="p-2"><input type="text" placeholder="Target Field" value={newDatamapEntry.targetField} onChange={e => setNewDatamapEntry({...newDatamapEntry, targetField: e.target.value})} className={inputClasses} /></td>
        <td className="p-2"><select value={newDatamapEntry.targetType} onChange={e => setNewDatamapEntry({...newDatamapEntry, targetType: e.target.value})} className={inputClasses}>{DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
        <td className="p-2 text-right"><button onClick={() => addDatamapEntry(mappingId)} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-md shadow-sm"><IconPlus/></button></td>
    </tr>
  );

  const renderDatamapEntryRow = (mapping: Mapping, entry: DatamapEntry) => {
    const isEditing = editingEntryId === entry.id;
    if (isEditing && editingEntryData) {
        return (
            <tr key={entry.id} className="bg-emerald-50">
                <td className="p-2"><input type="text" value={editingEntryData.sourceField} onChange={e => setEditingEntryData({...editingEntryData, sourceField: e.target.value})} className={`${inputClasses} border-emerald-300`} /></td>
                <td className="p-2"><select value={editingEntryData.sourceType} onChange={e => setEditingEntryData({...editingEntryData, sourceType: e.target.value})} className={`${inputClasses} border-emerald-300`}>{DATA_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></td>
                <td className="p-2"><input type="text" value={editingEntryData.targetField} onChange={e => setEditingEntryData({...editingEntryData, targetField: e.target.value})} className={`${inputClasses} border-emerald-300`} /></td>
                <td className="p-2"><select value={editingEntryData.targetType} onChange={e => setEditingEntryData({...editingEntryData, targetType: e.target.value})} className={`${inputClasses} border-emerald-300`}>{DATA_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></td>
                <td className="p-2 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => saveEditingEntry(mapping.id)} className="text-green-600 p-2 rounded-full hover:bg-green-100"><IconSave/></button>
                        <button onClick={cancelEditingEntry} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 text-lg">&times;</button>
                    </div>
                </td>
            </tr>
        )
    }
    return (
      <tr key={entry.id} className="hover:bg-slate-50">
        <td className="py-3 px-4 text-sm text-slate-700">{entry.sourceField}</td>
        <td className="py-3 px-4 text-sm text-slate-500">{entry.sourceType}</td>
        <td className="py-3 px-4 text-sm text-slate-700">{entry.targetField}</td>
        <td className="py-3 px-4 text-sm text-slate-500">{entry.targetType}</td>
        <td className="py-3 px-4 text-right">
            <div className="flex justify-end items-center gap-1">
                <button onClick={() => startEditingEntry(entry)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-blue-600"><IconEdit/></button>
                <button onClick={() => removeDatamapEntry(mapping.id, entry.id)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-red-600"><IconTrash/></button>
            </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Manage Mappings</h1>
      
      <GeminiSuggestModal isOpen={isAiModalOpen} onClose={() => setAiModalOpen(false)} onApply={handleApplyAiSuggestions} showToast={showToast} />
      <CsvImportModal isOpen={isCsvModalOpen} onClose={() => setCsvModalOpen(false)} onConfirm={handleConfirmCsvImport} csvData={csvData} categories={categories} showToast={showToast} initialName={csvFileName} />
      <MappingFormModal isOpen={isMappingFormOpen} onClose={() => setMappingFormOpen(false)} onSave={handleSaveMapping} mapping={editingMapping} categories={categories} showToast={showToast} />

      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-grow w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div>
            <input type="text" placeholder="Search mappings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2 ${inputClasses}`}/>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import CSV
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
            </label>
            <button onClick={openAddModal} className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><IconPlus /> Add Mapping</button>
        </div>
      </div>
      
      {mappings.length === 0 ? (
        <EmptyState title="No Mappings Yet" message="Get started by adding a new mapping or importing one from a CSV file." action={<button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><IconPlus /> Add Your First Mapping</button>}/>
      ) : (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Entries</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Modified</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredMappings.map(mapping => (
              <React.Fragment key={mapping.id}>
                <tr className="hover:bg-emerald-50/50">
                  <td className="px-4 py-2 text-center"><button onClick={() => setExpandedMappingId(p => p === mapping.id ? null : mapping.id)} className={`text-slate-400 hover:text-slate-700 transform transition-transform duration-200 ${expandedMappingId === mapping.id ? 'rotate-180' : ''}`}><IconChevronDown /></button></td>
                  <td className="px-4 py-2 text-sm font-medium text-slate-800">{mapping.name}</td>
                  <td className="px-4 py-2 text-sm text-slate-600">{mapping.category || <span className="text-slate-400 italic">N/A</span>}</td>
                  <td className="px-4 py-2 text-sm text-slate-600">{mapping.datamap.length}</td>
                  <td className="px-4 py-2 text-sm text-slate-600">{new Date(mapping.lastModified).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setActiveMappingForAi(mapping.id); setAiModalOpen(true);}} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-purple-600" title="AI Suggestions"><IconWand/></button>
                      <button onClick={() => openEditModal(mapping)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-blue-600" title="Edit Mapping"><IconPencil/></button>
                      <button onClick={() => removeMapping(mapping.id)} className="text-slate-500 p-2 rounded-full hover:bg-slate-200 hover:text-red-600" title="Delete Mapping"><IconTrash/></button>
                    </div>
                  </td>
                </tr>
                {expandedMappingId === mapping.id && (
                  <tr>
                    <td colSpan={6} className="p-0"><div className="bg-slate-100 p-4">
                        <div className="overflow-x-auto border border-slate-200 rounded-md bg-white shadow-inner"><table className="min-w-full">
                            <thead className="bg-slate-200"><tr className="border-b border-slate-300">
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Source Field</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Source Type</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Target Field</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Target Type</th>
                                <th className="w-28 py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-200">
                                {mapping.datamap.map(entry => renderDatamapEntryRow(mapping, entry))}
                            </tbody>
                            <tfoot>{renderAddEntryRow(mapping.id)}</tfoot>
                        </table></div>
                    </div></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default MappingManager;
