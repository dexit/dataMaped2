import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg', footer }) => {
  if (!isOpen) return null;
  
  const sizeClass = {
    md: 'max-w-md',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }[size];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4 animate-fade-in-down" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClass} m-4 max-h-[90vh] flex flex-col transform transition-all sm:my-8`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-200 p-5 flex-shrink-0">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">{children}</div>
        {footer && <div className="bg-slate-50 border-t border-slate-200 p-5 flex justify-end gap-3 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
