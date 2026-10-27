import React from 'react';
import { Toast } from '@/shared/ui/Toast';

export interface AttackToastProps {
  message: string | null;
  onClose: () => void;
}

export const AttackToast: React.FC<AttackToastProps> = ({ message, onClose }) => {
  return <Toast message={message} onClose={onClose} type="error" duration={5000} />;
};
