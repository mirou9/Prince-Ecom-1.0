/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Info, Tag, TrendingUp } from 'lucide-react';
import { Invoice } from '../types';
import { formatDZD } from '../utils';

interface VendreModalProps {
  isOpen: boolean;
  onClose: () => void;
  preparationInvoices?: Invoice[];
  targetInvoice?: Invoice | null;
  onSubmit: (invoiceId: string, prixVente: number, prixAchat: number) => void;
}

export default function VendreModal({ 
  isOpen, 
  onClose, 
  preparationInvoices = [], 
  targetInvoice = null,
  onSubmit 
}: VendreModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [prixVente, setPrixVente] = useState<number | string>(0);
  const [prixAchat, setPrixAchat] = useState<number | string>(0);

  useEffect(() => {
    if (isOpen) {
      const inv = targetInvoice || (preparationInvoices.length > 0 ? preparationInvoices[0] : null);
      if (inv) {
        setSelectedInvoiceId(inv.id);
        const itemsTotal = inv.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const total = Math.max(0, itemsTotal - (inv.discount || 0));
        setPrixVente(inv.totalEncaisse ?? total);
        setPrixAchat(inv.prixAchat ?? 0);
      } else {
        setSelectedInvoiceId('');
        setPrixVente(0);
        setPrixAchat(0);
      }
    }
  }, [isOpen, targetInvoice, preparationInvoices]);

  if (!isOpen) return null;

  const activeInvoice = targetInvoice || preparationInvoices.find(inv => inv.id === selectedInvoiceId);

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = preparationInvoices.find(i => i.id === id);
    if (inv) {
      const itemsTotal = inv.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const total = Math.max(0, itemsTotal - (inv.discount || 0));
      setPrixVente(inv.totalEncaisse ?? total);
      setPrixAchat(inv.prixAchat ?? 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveInvoiceId = targetInvoice ? targetInvoice.id : selectedInvoiceId;
    if (!effectiveInvoiceId) {
      alert('Veuillez sélectionner une facture.');
      return;
    }
    const finalVente = Math.max(0, Number(prixVente) || 0);
    const finalAchat = Math.max(0, Number(prixAchat) || 0);

    onSubmit(effectiveInvoiceId, finalVente, finalAchat);
    onClose();
  };

  const venteNum = Math.max(0, Number(prixVente) || 0);
  const achatNum = Math.max(0, Number(prixAchat) || 0);
  const benefice = venteNum - achatNum;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col z-10 max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Paiement • Statut Payé
              </h2>
              <p className="text-xs text-zinc-500">
                Définir le prix d'achat et le prix de vente
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 px-1.5 py-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {!targetInvoice && preparationInvoices.length === 0 ? (
            <div className="text-center py-8 px-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <Info className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Aucune facture disponible.</p>
              <p className="text-xs text-zinc-400 mt-1">Veuillez d'abord créer une commande.</p>
            </div>
          ) : (
            <>
              {/* Target Invoice display or selection dropdown */}
              {targetInvoice ? (
                <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {targetInvoice.invoiceNumber}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                      Passage à Payé
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                    Client : <span className="font-semibold">{targetInvoice.clientName}</span> ({targetInvoice.clientPhone})
                  </p>
                  <p className="text-xs text-zinc-500 line-clamp-1">Adresse : {targetInvoice.clientAddress}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Sélectionner la Facture de vente *
                  </label>
                  <select
                    required
                    value={selectedInvoiceId}
                    onChange={(e) => handleSelectInvoice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                  >
                    <option value="">-- Choisir une facture --</option>
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
              )}

              {/* TWO REQUIRED AMOUNTS: Prix d'achat & Prix de vente */}
              <div className="space-y-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800/80 animate-fadeIn">
                
                {/* 1. Prix d'achat */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-500" />
                      <span>Prix d'achat (DA) *</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 lowercase font-normal">coût des articles</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="0"
                      value={prixAchat}
                      onChange={(e) => setPrixAchat(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                    <span className="absolute right-3.5 top-3 text-[11px] font-extrabold text-zinc-400">DZD (DA)</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">Montant déboursé pour l'achat de ces articles.</p>
                </div>

                {/* 2. Prix de vente */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Prix de vente (DA) *</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 lowercase font-normal">total encaissé</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="0"
                      value={prixVente}
                      onChange={(e) => setPrixVente(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-base text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                    <span className="absolute right-3.5 top-3 text-[11px] font-extrabold text-zinc-400">DZD (DA)</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">Montant total reçu pour la vente.</p>
                </div>

                {/* Live Marge / Bénéfice Summary */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Bénéfice estimé :</span>
                  </div>
                  <span className={`font-black font-mono text-sm ${benefice >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {formatDZD(benefice)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Action Footer */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/40 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            {(targetInvoice || (preparationInvoices.length > 0 && selectedInvoiceId)) && (
              <button
                type="submit"
                className="px-5 py-2.5 sm:py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/15 cursor-pointer transition flex items-center gap-1.5"
              >
                <span>Confirmer le statut Payé</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
