import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Mapping, DatamapEntry, Category } from '../types';
import { DATA_TYPES, DEFAULT_INPUT_CLASSES, PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES, TEXT_DANGER_BUTTON_CLASSES, ICON_BUTTON_BASE_CLASSES, ICON_BUTTON_HOVER_INFO_CLASSES, ICON_BUTTON_HOVER_DANGER_CLASSES, ICON_BUTTON_HOVER_PURPLE_CLASSES, ICON_BUTTON_HOVER_SLATE_CLASSES } from '../constants';
import { IconChevronDown, IconPlus, IconTrash, IconWand, IconPencil, IconSearch, IconSave, IconEdit, IconMappings } from '../constants';
import { suggestMappings } from '../services/geminiService';
import Modal from './common/Modal'; // Use common Modal
import EmptyState from './common/EmptyState'; // Use common EmptyState

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
    
    const footer = (
        <button onClick={handleSuggest} disabled={isLoading} className={`${PRIMARY_BUTTON_CLASSES} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <IconWand /> {isLoading ? 'Thinking...' : 'Suggest Mappings'}
        </button>
    );

    return ( <Modal isOpen={isOpen} onClose={onClose} title="Get AI-Powered Mapping Suggestions" size="xl" footer={footer}><div className="space-y-4"><p className="text-base text-slate-600">Paste example JSON objects for your source and target data. The AI will analyze the keys and suggest mappings. Provide valid JSON.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><textarea value={sourceSchema} onChange={e => setSourceSchema(e.target.value)} placeholder={`{\n  "user_id": 123,\n  "email_address": "test@example.com"\n}`} rows={10} className={`${DEFAULT_INPUT_CLASSES} font-mono`}></textarea><textarea value={targetSchema} onChange={e => setTargetSchema(e.target.value)} placeholder={`{\n  "userId": 123,\n  "email": "test@example.com"\n}`} rows={10} className={`${DEFAULT_INPUT_CLASSES} font-mono`}></textarea></div></div></Modal> );
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
    const renderSelect = (field: keyof ColumnMap) => <select value={columnMap[field]} onChange={e => setColumnMap(prev => ({...prev, [field]: e.target.value}))} className={DEFAULT_INPUT_CLASSES}><option value="">-- Not Mapped --</option>{csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}</select>;
    const footer = <><button onClick={onClose} className={SECONDARY_BUTTON_CLASSES}>Cancel</button><button onClick={handleConfirm} className={PRIMARY_BUTTON_CLASSES}>Import Mapping</button></>;
    return ( <Modal isOpen={isOpen} onClose={onClose} title="Import from CSV" size="xl" footer={footer}><div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700">Mapping Name <span className="text-red-500">*</span></label><input type="text" value={mappingName} onChange={e => setMappingName(e.target.value)} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`} /></div><div><label className="block text-sm font-medium text-slate-700">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div></div><div><h3 className="text-lg font-bold text-slate-800">Map CSV Columns</h3><p className="text-sm text-slate-600 mt-1 mb-3">Select which CSV columns correspond to the mapping fields.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2"><div><label className="block text-sm font-medium text-slate-700">Source Field <span className="text-red-500">*</span></label>{renderSelect('sourceField')}</div><div><label className="block text-sm font-medium text-slate-700">Source Type</label>{renderSelect('sourceType')}</div><div><label className="block text-sm font-medium text-slate-700">Target Field <span className="text-red-500">*</span></label>{renderSelect('targetField')}</div><div><label className="block text-sm font-medium text-slate-700">Target Type</label>{renderSelect('targetType')}</div></div></div><div><h3 className="text-lg font-bold text-slate-800">Data Preview (first 5 rows)</h3><div className="overflow-x-auto mt-2 border border-slate-200 rounded-lg"><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr className="text-left">{csvData.headers.map(h => <th key={h} className="p-3 font-semibold text-slate-600"> {h}</th>)}</tr></thead><tbody className="bg-white divide-y divide-slate-200">{csvData.rows.slice(0, 5).map((row, i) => <tr key={i} className="hover:bg-slate-50">{row.map((cell, j) => <td key={j} className="p-3 truncate text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div></div></div></Modal> )
};

const MappingFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: {name: string, category: string}) => void; mapping: Pick<Mapping, 'name' | 'category'> | null; categories: Category[]; showToast: (message: string, type: 'success' | 'error') => void; }> = ({isOpen, onClose, onSave, mapping, categories, showToast}) => {
    const [formData, setFormData] = useState({name: '', category: ''});
    useEffect(() => { setFormData(mapping ? {name: mapping.name, category: mapping.category} : {name: '', category: ''}); }, [mapping, isOpen]);
    const handleSave = () => { if(!formData.name.trim()){ showToast("Mapping Name is required.", "error"); return; } onSave(formData); }
    const footer = <button onClick={handleSave} className={PRIMARY_BUTTON_CLASSES}>Save Mapping</button>;
    return ( <Modal isOpen={isOpen} onClose={onClose} title={mapping ? "Edit Mapping" : "Add New Mapping"} size="md" footer={footer}><div className="space-y-5"><div><label className="block text-sm font-medium text-slate-700">Mapping Name <span className="text-red-500">*</span></label><input type="text" placeholder="e.g., User Profile V2" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`}/></div><div><label className="block text-sm font-medium text-slate-700">Category (optional)</label><select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className={`mt-1 ${DEFAULT_INPUT_CLASSES}`}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div></div></Modal> );
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
        <td className="p-3"><input type="text" placeholder="Source Field" value={newDatamapEntry.sourceField} onChange={e => setNewDatamapEntry({...newDatamapEntry, sourceField: e.target.value})} className={DEFAULT_INPUT_CLASSES} /></td>
        <td className="p-3"><select value={newDatamapEntry.sourceType} onChange={e => setNewDatamapEntry({...newDatamapEntry, sourceType: e.target.value})} className={DEFAULT_INPUT_CLASSES}>{DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
        <td className="p-3"><input type="text" placeholder="Target Field" value={newDatamapEntry.targetField} onChange={e => setNewDatamapEntry({...newDatamapEntry, targetField: e.target.value})} className={DEFAULT_INPUT_CLASSES} /></td>
        <td className="p-3"><select value={newDatamapEntry.targetType} onChange={e => setNewDatamapEntry({...newDatamapEntry, targetType: e.target.value})} className={DEFAULT_INPUT_CLASSES}>{DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
        <td className="p-3 text-right"><button onClick={() => addDatamapEntry(mappingId)} className={`bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg shadow-sm transition-colors`}><IconPlus/></button></td>
    </tr>
  );

  const renderDatamapEntryRow = (mapping: Mapping, entry: DatamapEntry) => {
    const isEditing = editingEntryId === entry.id;
    if (isEditing && editingEntryData) {
        return (
            <tr key={entry.id} className="bg-emerald-50">
                <td className="p-3"><input type="text" value={editingEntryData.sourceField} onChange={e => setEditingEntryData({...editingEntryData, sourceField: e.target.value})} className={`${DEFAULT_INPUT_CLASSES} border-emerald-300`} /></td>
                <td className="p-3"><select value={editingEntryData.sourceType} onChange={e => setEditingEntryData({...editingEntryData, sourceType: e.target.value})} className={`${DEFAULT_INPUT_CLASSES} border-emerald-300`}>{DATA_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></td>
                <td className="p-3"><input type="text" value={editingEntryData.targetField} onChange={e => setEditingEntryData({...editingEntryData, targetField: e.target.value})} className={`${DEFAULT_INPUT_CLASSES} border-emerald-300`} /></td>
                <td className="p-3"><select value={editingEntryData.targetType} onChange={e => setEditingEntryData({...editingEntryData, targetType: e.target.value})} className={`${DEFAULT_INPUT_CLASSES} border-emerald-300`}>{DATA_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></td>
                <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                        {/* Fix: Replaced ICON_BUTTON_HOVER_PRIMARY_CLASSES with ICON_BUTTON_HOVER_INFO_CLASSES */}
                        <button onClick={() => saveEditingEntry(mapping.id)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_INFO_CLASSES}`} title="Save"><IconSave/></button>
                        <button onClick={cancelEditingEntry} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_SLATE_CLASSES} text-xl`} title="Cancel">&times;</button>
                    </div>
                </td>
            </tr>
        )
    }
    return (
      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
        <td className="py-3 px-4 text-sm text-slate-700">{entry.sourceField}</td>
        <td className="py-3 px-4 text-sm text-slate-500">{entry.sourceType}</td>
        <td className="py-3 px-4 text-sm text-slate-700">{entry.targetField}</td>
        <td className="py-3 px-4 text-sm text-slate-500">{entry.targetType}</td>
        <td className="py-3 px-4 text-right">
            <div className="flex justify-end items-center gap-1">
                <button onClick={() => startEditingEntry(entry)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_INFO_CLASSES}`} title="Edit Entry"><IconEdit/></button>
                <button onClick={() => removeDatamapEntry(mapping.id, entry.id)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_DANGER_CLASSES}`} title="Delete Entry"><IconTrash/></button>
            </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold text-slate-900">Manage Mappings</h1>
      
      <GeminiSuggestModal isOpen={isAiModalOpen} onClose={() => setAiModalOpen(false)} onApply={handleApplyAiSuggestions} showToast={showToast} />
      <CsvImportModal isOpen={isCsvModalOpen} onClose={() => setCsvModalOpen(false)} onConfirm={handleConfirmCsvImport} csvData={csvData} categories={categories} showToast={showToast} initialName={csvFileName} />
      <MappingFormModal isOpen={isMappingFormOpen} onClose={() => setMappingFormOpen(false)} onSave={handleSaveMapping} mapping={editingMapping} categories={categories} showToast={showToast} />

      <div className="flex flex-col md:flex-row items-center gap-4 p-5 bg-white rounded-xl shadow-md border border-slate-200">
        <div className="relative flex-grow w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div>
            <input type="text" placeholder="Search mappings by name or category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 ${DEFAULT_INPUT_CLASSES}`}/>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <label className={`flex-1 md:flex-none ${SECONDARY_BUTTON_CLASSES} cursor-pointer`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import CSV
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
            </label>
            <button onClick={openAddModal} className={`${PRIMARY_BUTTON_CLASSES} flex-1 md:flex-none`}><IconPlus /> Add Mapping</button>
        </div>
      </div>
      
      {mappings.length === 0 ? (
        <EmptyState 
            title="No Mappings Yet" 
            message="Get started by adding a new mapping or importing one from a CSV file." 
            icon={<IconMappings/>}
            action={<button onClick={openAddModal} className={PRIMARY_BUTTON_CLASSES}><IconPlus /> Add Your First Mapping</button>}/>
      ) : (
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="w-12 px-4 py-3 text-left"></th> {/* For expand button */}
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Entries</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Modified</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredMappings.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                        No mappings match your search criteria.
                    </td>
                </tr>
            )}
            {filteredMappings.map(mapping => (
              <React.Fragment key={mapping.id}>
                <tr className="hover:bg-emerald-50/10 transition-colors">
                  {/* Fix: ICON_BUTTON_HOVER_SLATE_CLASSES should be correctly imported after this fix */}
                  <td className="px-4 py-2 text-center"><button onClick={() => setExpandedMappingId(p => p === mapping.id ? null : mapping.id)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_SLATE_CLASSES} transform ${expandedMappingId === mapping.id ? 'rotate-180' : ''}`}><IconChevronDown /></button></td>
                  <td className="px-4 py-3 text-base font-medium text-slate-800">{mapping.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{mapping.category || <span className="text-slate-400 italic">N/A</span>}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{mapping.datamap.length}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(mapping.lastModified).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setActiveMappingForAi(mapping.id); setAiModalOpen(true);}} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_PURPLE_CLASSES}`} title="AI Suggestions"><IconWand/></button>
                      <button onClick={() => openEditModal(mapping)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_INFO_CLASSES}`} title="Edit Mapping"><IconPencil/></button>
                      <button onClick={() => removeMapping(mapping.id)} className={`${ICON_BUTTON_BASE_CLASSES} ${ICON_BUTTON_HOVER_DANGER_CLASSES}`} title="Delete Mapping"><IconTrash/></button>
                    </div>
                  </td>
                </tr>
                {expandedMappingId === mapping.id && (
                  <tr>
                    <td colSpan={6} className="p-0"><div className="bg-slate-100 p-5 border-t border-slate-200">
                        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-inner">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-200"><tr className="border-b border-slate-300">
                                    <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Source Field</th>
                                    <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Source Type</th>
                                    <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Target Field</th>
                                    <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Target Type</th>
                                    <th className="w-28 py-2.5 px-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-200">
                                    {mapping.datamap.map(entry => renderDatamapEntryRow(mapping, entry))}
                                </tbody>
                                <tfoot>{renderAddEntryRow(mapping.id)}</tfoot>
                            </table>
                        </div>
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