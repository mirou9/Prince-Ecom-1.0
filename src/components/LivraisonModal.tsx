/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Truck, Info } from 'lucide-react';
import { Invoice } from '../types';
import { AVAILABLE_LIVREURS } from '../data';
import { formatDZD } from '../utils';

interface LivraisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  preparationInvoices: Invoice[];
  onSubmit: (invoiceId: string, livreur: string, note: string) => void;
}

export default function LivraisonModal({ isOpen, onClose, preparationInvoices, onSubmit }: LivraisonModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [livreur, setLivreur] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert('Veuillez sélectionner une facture.');
      return;
    }
    if (!livreur.trim()) {
      alert('Veuillez spécifier un livreur.');
      return;
    }

    onSubmit(selectedInvoiceId, livreur.trim(), note.trim());
    
    // Reset state
    setSelectedInvoiceId('');
    setLivreur('');
    setNote('');
    onClose();
  };

  const selectedInvoice = preparationInvoices.find(inv => inv.id === selectedInvoiceId);
  const totalAmountItems = selectedInvoice ? selectedInvoice.items.reduce((s, it) => s + (it.price * it.qty), 0) : 0;
  const totalAmount = selectedInvoice ? Math.max(0, totalAmountItems - (selectedInvoice.discount || 0)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Expédier pour Livraison</h2>
              <p className="text-xs text-zinc-500">Passer une facture "En préparation" à "En livraison"</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 px-1.5 py-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {preparationInvoices.length === 0 ? (
            <div className="text-center py-8 px-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <Info className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Aucune facture "En préparation" disponible.</p>
              <p className="text-xs text-zinc-400 mt-1">Veuillez d'abord en créer une sur la page "En préparation".</p>
            </div>
          ) : (
            <>
              {/* Select target invoice */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Sélectionner la Facture de vente *
                </label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="">-- Choisir une facture en attente --</option>
                  {preparationInvoices.map((inv) => {
                    const itemsTotal = inv.items.reduce((s, it) => s + (it.price * it.qty), 0);
                    const total = Math.max(0, itemsTotal - (inv.discount || 0));
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.clientName} ({formatDZD(total)})
                      </option>
                    );
                  })}
                </select>

                {/* Display chosen invoice summary if any */}
                {selectedInvoice && (
                  <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-900 rounded-xl space-y-1">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Détails de l'expédition :</p>
                    <p className="text-xs text-zinc-500">Client : <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedInvoice.clientName}</span>, Tél : {selectedInvoice.clientPhone}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">Adresse : {selectedInvoice.clientAddress}</p>
                    {selectedInvoice.discount ? (
                      <p className="text-xs text-red-500 font-bold font-mono">
                        Montant : {formatDZD(totalAmountItems)} | Remise : -{formatDZD(selectedInvoice.discount)} | Total : {formatDZD(totalAmount)}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-amber-600 font-mono">
                        Total : {formatDZD(totalAmount)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Driver input (Livreur) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Nom du Livreur / Service de livraison *
                </label>
                
                {/* We'll offer a selectable datalist-like input so they can easily type a name or choose from standard agencies */}
                <input
                  type="text"
                  required
                  list="livreurs-list"
                  placeholder="Saisissez ou choisissez un livreur"
                  value={livreur}
                  onChange={(e) => setLivreur(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                
                <datalist id="livreurs-list">
                  {AVAILABLE_LIVREURS.map((l, i) => (
                    <option key={i} value={l} />
                  ))}
                </datalist>
                <p className="text-[10px] text-zinc-400 mt-1">Exemples : Ahmed, Yalidine Express, Mourad etc.</p>
              </div>

              {/* Delivery Note (Note) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Rajouter une Note de Livraison
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes de livraison, instructions spéciales pour le livreur..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </>
          )}

          {/* Action Footer */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/40 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl transition cursor-pointer"
            >
              Fermer
            </button>
            {preparationInvoices.length > 0 && (
              <button
                type="submit"
                className="px-5 py-2.5 sm:py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/15 cursor-pointer transition"
              >
                Confirmer l'expédition
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
