import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export default function ImagePreviewModal({ isOpen, onClose, imageUrl }: ImagePreviewModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative max-w-4xl w-full">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img src={imageUrl} alt="Preview" className="w-full rounded-lg" />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
