import React, { useState } from 'react';
import type { Category } from '../types';
import { IconPlus, IconTrash, IconCategory } from '../constants';
import EmptyState from './common/EmptyState'; // Use common EmptyState

const inputClasses = "block w-full text-sm rounded-lg border-slate-300 bg-slate-50 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-slate-200 disabled:cursor-not-allowed";
const buttonPrimaryClasses = "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors";
const buttonDangerClasses = "inline-flex items-center gap-1.5 rounded-lg border border-transparent text-red-600 px-3 py-1.5 text-sm font-semibold hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors";


interface CategoryManagerProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  showToast: (message: string, type: 'success' | 'error') => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, setCategories, showToast, showConfirmation }) => {
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addCategory = () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      setError('Category name must be unique.');
      return;
    }
    setError(null);
    setCategories(prev => [...prev, { id: crypto.randomUUID(), name: newCategory.trim() }]);
    setNewCategory('');
    showToast('Category added!', 'success');
  };

  const removeCategory = (id: string, name: string) => {
    showConfirmation(
      'Delete Category?',
      `Are you sure you want to delete the "${name}" category? This will not delete mappings using it, but they will become uncategorized.`,
      () => {
        setCategories(prev => prev.filter(c => c.id !== id));
        showToast('Category removed.', 'success');
      }
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold text-slate-900">Manage Categories</h1>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-slate-800 mb-5">Add New Category</h2>
        <div className="flex items-start gap-4">
          <div className="flex-grow">
            <label htmlFor="new-category-name" className="block text-sm font-medium text-slate-700 mb-1">Category Name <span className="text-red-500">*</span></label>
            <input
              id="new-category-name"
              type="text"
              value={newCategory}
              onChange={(e) => { setNewCategory(e.target.value); setError(null); }}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              placeholder="e.g., E-commerce, Healthcare"
              className={`${inputClasses} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "category-error" : undefined}
            />
            {error && <p id="category-error" className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <button onClick={addCategory} className="self-end inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors">
            <IconPlus /> Add
          </button>
        </div>
      </div>
      
      {categories.length === 0 ? (
          <EmptyState 
            title="No Categories Found" 
            message="Create categories to organize your data mappings." 
            icon={<IconCategory/>}
            action={<button onClick={addCategory} className={buttonPrimaryClasses}><IconPlus /> Add Your First Category</button>}
          />
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden max-w-2xl">
            <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {categories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-slate-800">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => removeCategory(category.id, category.name)} className={buttonDangerClasses}>
                        <IconTrash /> Delete
                    </button>
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

export default CategoryManager;