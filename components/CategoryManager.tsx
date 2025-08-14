
import React, { useState } from 'react';
import type { Category } from '../types';
import { IconPlus, IconTrash, IconCategory } from '../constants';

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
      <h1 className="text-3xl font-bold text-gray-800">Manage Categories</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Category</h2>
        <div className="flex items-start gap-4">
          <div className="flex-grow">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => { setNewCategory(e.target.value); setError(null); }}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              placeholder="e.g., E-commerce, Healthcare"
              className={`block w-full rounded-md shadow-sm sm:text-sm ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'}`}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <button onClick={addCategory} className="inline-flex items-center gap-2 rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
            <IconPlus /> Add
          </button>
        </div>
      </div>
      
      {categories.length === 0 ? (
          <div className="text-center py-10 px-6 bg-white rounded-lg shadow max-w-2xl">
            <IconCategory />
            <h3 className="text-lg font-semibold text-gray-800 mt-4">No Categories Found</h3>
            <p className="text-sm text-gray-500 mt-1">Create categories to organize your data mappings.</p>
          </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => removeCategory(category.id, category.name)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1">
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
