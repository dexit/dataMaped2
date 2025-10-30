import React from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon, action }) => (
    <div className="text-center py-16 px-6 bg-white rounded-xl shadow-md border border-dashed border-slate-200">
        {icon && <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 mb-6">{icon}</div>}
        <h3 className="text-xl font-bold text-slate-700">{title}</h3>
        <p className="text-base text-slate-500 mt-2">{message}</p>
        {action && <div className="mt-8">{action}</div>}
    </div>
);

export default EmptyState;
