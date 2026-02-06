import React from 'react';
// Imports corrected to avoid circular dependency
import Button from './Button';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {title}
                    </h4>
                    <p className="text-gray-600">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
