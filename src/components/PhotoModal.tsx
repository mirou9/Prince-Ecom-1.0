/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ZoomIn, Download, FileText } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl?: string;
  title?: string;
}

export default function PhotoModal({ isOpen, onClose, photoUrl, title = 'Photo de la Facture' }: PhotoModalProps) {
  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[92vh] z-10">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-100">{title}</h3>
          </div>

          <div className="flex items-center space-x-1.5">
            <a
              href={photoUrl}
              download="facture-photo.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
              title="Télécharger / Ouvrir l'image en grand"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Content Container */}
        <div className="p-3 overflow-auto flex items-center justify-center bg-zinc-950/90 max-h-[calc(92vh-60px)]">
          <img 
            src={photoUrl} 
            alt="Facture / Bon" 
            className="w-auto h-auto max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg border border-zinc-850"
          />
        </div>
      </div>
    </div>
  );
}
