/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Invoice, OrderItem, UserRole } from '../types';
import { formatDZD } from '../utils';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'createdAt'> & { manualInvoiceNumber?: string }) => void;
  currentRole: UserRole;
}

export default function CreateInvoiceModal({ isOpen, onClose, onSubmit, currentRole }: CreateInvoiceModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState('');
  
  // Custom items list representation
  const [items, setItems] = useState<Omit<OrderItem, 'id'>[]>([
    { name: '', qty: 1, price: 0 }
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { name: '', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return; // Must have at least one item
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Omit<OrderItem, 'id'>, value: string | number) => {
    const updated = [...items];
    if (field === 'qty') {
      updated[index].qty = Math.max(1, Number(value) || 1);
    } else if (field === 'price') {
      updated[index].price = Math.max(0, Number(value) || 0);
    } else {
      updated[index].name = String(value);
    }
    setItems(updated);
  };

  const totalDZD = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !clientAddress.trim()) {
      alert('Veuillez remplir tous les champs du client.');
      return;
    }

    const filteredItems = items.filter(item => item.name.trim() !== '');
    if (filteredItems.length === 0) {
      alert('Veuillez ajouter au moins un article avec un nom.');
      return;
    }

    const finalItems: OrderItem[] = filteredItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: item.name.trim(),
      qty: item.qty,
      price: item.price
    }));

    onSubmit({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      items: finalItems,
      treatedBy: currentRole,
      discount: discount,
      manualInvoiceNumber: manualInvoiceNumber.trim() ? manualInvoiceNumber.trim() : undefined
    });

    // Reset state
    setClientName('');
    setClientPhone('');
    setClientAddress('');
    setDiscount(0);
    setManualInvoiceNumber('');
    setItems([{ name: '', qty: 1, price: 0 }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Nouvelle Facture de Vente</h2>
              <p className="text-xs text-zinc-500">Statut initial : En préparation</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Client details section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
              Informations du Client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Nom Complet du Client *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mohamed Benali"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Numéro de Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 0550 12 34 56"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Numéro de Bon / Facture (Manuel - Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: PE-2026-9999 (Laisser vide pour une génération automatique)"
                  value={manualInvoiceNumber}
                  onChange={(e) => setManualInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Adresse de Livraison *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: 50 Logements, Bloc C N° 04, Cheraga, Alger"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Articles commandés
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline transition"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un article</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-end sm:items-center bg-zinc-50 dark:bg-zinc-950/30 p-3 sm:p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900">
                  <div className="flex-1 w-full">
                    <label className="block sm:hidden text-[10px] text-zinc-400 mb-1">Nom de l'article</label>
                    <input
                      type="text"
                      placeholder="Désignation de l'article"
                      value={item.name}
                      required
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="w-24 sm:w-20">
                    <label className="block sm:hidden text-[10px] text-zinc-400 mb-1">Quantité</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Qté"
                      value={item.qty}
                      required
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="w-36 sm:w-32">
                    <label className="block sm:hidden text-[10px] text-zinc-400 mb-1">Prix Unitaire (DA)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        placeholder="Prix"
                        value={item.price || ''}
                        required
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] font-semibold text-zinc-400">DA</span>
                    </div>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 px-1.5 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Remise Section */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded-xl">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Remise commerciale (Optionnelle)</h4>
              <p className="text-[10px] text-zinc-400">Appliquer une réduction sur le montant total de la facture.</p>
            </div>
            <div className="relative w-full sm:w-44">
              <input
                type="number"
                min={0}
                max={totalDZD}
                placeholder="Montant de la remise (ex: 500)"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-3 pr-10 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-950 text-zinc-905 dark:text-zinc-150 text-xs font-mono text-right focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              />
              <span className="absolute right-3 top-1.5 text-[10.5px] font-black text-amber-600 dark:text-amber-500 font-mono">DA</span>
            </div>
          </div>

          {/* Total & Action Footer */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="space-y-1">
              {discount > 0 && (
                <p className="text-[11px] text-zinc-400 line-through font-mono">
                  Total initial: {formatDZD(totalDZD)}
                </p>
              )}
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Général</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatDZD(Math.max(0, totalDZD - discount))}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-600/10 cursor-pointer transition"
              >
                Créer la Facture
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
