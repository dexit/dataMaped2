import React from 'react';
import Modal from './Modal';
import { IconAlertTriangle, PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../constants';
import type { ConfirmationState } from '../../types';

interface ConfirmationModalProps {
  config: ConfirmationState;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ config, onClose, onConfirm }) => {
  const footer = (
    <>
      <button onClick={onConfirm} className={PRIMARY_BUTTON_CLASSES.replace('emerald', 'red')}>Confirm</button>
      <button onClick={onClose} className={SECONDARY_BUTTON_CLASSES}>Cancel</button>
    </>
  );

  return (
    <Modal
      isOpen={config.isOpen}
      onClose={onClose}
      title={config.title}
      size="md"
      footer={footer}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-600">
            <IconAlertTriangle />
        </div>
        <div className="mt-0 text-left flex-grow">
          <p className="mt-2 text-base text-slate-600">{config.message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
