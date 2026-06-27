/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Info } from 'lucide-react';
import { Invoice } from '../types';
import { formatDZD } from '../utils';

interface VendreModalProps {
  isOpen: boolean;
  onClose: () => void;
  preparationInvoices: Invoice[];
  onSubmit: (invoiceId: string, totalEncaisse: number) => void;
}

export default function VendreModal({ isOpen, onClose, preparationInvoices, onSubmit }: VendreModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [totalEncaisse, setTotalEncaisse] = useState<number>(0);

  // Auto-set the total encaisse when client selects an invoice to make their job easier
  useEffect(() => {
    if (selectedInvoiceId) {
      const selected = preparationInvoices.find(inv => inv.id === selectedInvoiceId);
      if (selected) {
        const itemsTotal = selected.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const total = Math.max(0, itemsTotal - (selected.discount || 0));
        setTotalEncaisse(total);
      }
    } else {
      setTotalEncaisse(0);
    }
  }, [selectedInvoiceId, preparationInvoices]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert('Veuillez sélectionner une facture.');
      return;
    }
    if (totalEncaisse < 0) {
      alert('Le montant encaissé doit être supérieur ou égal à 0.');
      return;
    }

    onSubmit(selectedInvoiceId, totalEncaisse);
    
    // Reset state
    setSelectedInvoiceId('');
    setTotalEncaisse(0);
    onClose();
  };

  const selectedInvoice = preparationInvoices.find(inv => inv.id === selectedInvoiceId);
  const originalTotal = selectedInvoice ? selectedInvoice.items.reduce((s, it) => s + (it.price * it.qty), 0) : 0;

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
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Encaisser & Vendre</h2>
              <p className="text-xs text-zinc-500">Enregistrer le paiement direct d'une facture</p>
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
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="">-- Choisir une facture "En préparation" --</option>
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
              </div>

              {/* Amount input fields appeared dynamically */}
              {selectedInvoiceId !== '' && (
                <div className="space-y-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-900 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs py-1 text-zinc-500">
                    <span>Montant total initial :</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">{formatDZD(originalTotal)}</span>
                  </div>
                  {selectedInvoice?.discount ? (
                    <div className="flex items-center justify-between text-xs py-1 text-red-500">
                      <span>Remise appliquée :</span>
                      <span className="font-semibold font-mono">-{formatDZD(selectedInvoice.discount)}</span>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Total Encaissé (en DZD) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        required
                        value={totalEncaisse || ''}
                        onChange={(e) => setTotalEncaisse(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full pl-5 pr-14 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-lg text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-extrabold text-zinc-400">DZD (DA)</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">Vous pouvez ajuster le montant si l'encaissement est partiel/différent.</p>
                  </div>
                </div>
              )}
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
            {preparationInvoices.length > 0 && selectedInvoiceId && (
              <button
                type="submit"
                className="px-5 py-2.5 sm:py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/15 cursor-pointer transition"
              >
                Valider l'encaissement
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
