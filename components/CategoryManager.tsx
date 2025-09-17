
import React, { useState } from 'react';
import type { Category } from '../types';
import { IconPlus, IconTrash, IconCategory } from '../constants';

const inputClasses = "block w-full text-sm rounded-md border-slate-300 bg-slate-50 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-slate-200 disabled:cursor-not-allowed";

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Manage Categories</h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Category</h2>
        <div className="flex items-start gap-4">
          <div className="flex-grow">
            <label htmlFor="new-category-name" className="block text-sm font-medium text-slate-700">Category Name <span className="text-red-500">*</span></label>
            <input
              id="new-category-name"
              type="text"
              value={newCategory}
              onChange={(e) => { setNewCategory(e.target.value); setError(null); }}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              placeholder="e.g., E-commerce, Healthcare"
              className={`mt-1 ${inputClasses} ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <button onClick={addCategory} className="self-end inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
            <IconPlus /> Add
          </button>
        </div>
      </div>
      
      {categories.length === 0 ? (
          <div className="text-center py-10 px-6 bg-white rounded-lg shadow-sm border border-dashed border-slate-300 max-w-2xl">
            <IconCategory />
            <h3 className="text-lg font-semibold text-slate-800 mt-4">No Categories Found</h3>
            <p className="text-sm text-slate-500 mt-1">Create categories to organize your data mappings.</p>
          </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden max-w-2xl">
            <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {categories.map((category) => (
                <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => removeCategory(category.id, category.name)} className="text-red-600 hover:text-red-800 inline-flex items-center gap-1 font-semibold">
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
