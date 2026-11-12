/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Pencil, ShoppingBag, Camera } from 'lucide-react';
import { Invoice, OrderItem } from '../types';
import { formatDZD, compressImageFile } from '../utils';
import PhotoModal from './PhotoModal';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onConfirm: (updatedInvoice: Invoice) => void;
}

export default function EditInvoiceModal({ isOpen, onClose, invoice, onConfirm }: EditInvoiceModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Custom items list representation
  const [items, setItems] = useState<{ id?: string; name: string; qty: number; price: number }[]>([
    { name: '', qty: 1, price: 0 }
  ]);
  const [prixAchat, setPrixAchat] = useState<number | ''>('');
  const [totalEncaisse, setTotalEncaisse] = useState<number | ''>('');
  const [hasModifiedArticles, setHasModifiedArticles] = useState(false);
  const [totalEncaisseManuallyEdited, setTotalEncaisseManuallyEdited] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      setClientName(invoice.clientName || '');
      setClientPhone(invoice.clientPhone || '');
      setClientAddress(invoice.clientAddress || '');
      setDiscount(invoice.discount || 0);
      setInvoiceNumber(invoice.invoiceNumber || '');
      setPrixAchat(typeof invoice.prixAchat === 'number' ? invoice.prixAchat : '');
      setTotalEncaisse(typeof invoice.totalEncaisse === 'number' ? invoice.totalEncaisse : '');
      setPhotoUrl(invoice.photoUrl || '');
      setHasModifiedArticles(false);
      setTotalEncaisseManuallyEdited(false);

      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items.map(it => ({ 
          id: it.id, 
          name: it.name, 
          qty: Number(it.qty) || 1, 
          price: Number(it.price) || 0 
        })));
      } else {
        setItems([{ name: '', qty: 1, price: 0 }]);
      }
    }
  }, [isOpen, invoice]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Erreur compression image:', err);
    } finally {
      e.target.value = '';
    }
  };

  const totalArticlesQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalDZD = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
  const computedNetTotal = Math.max(0, totalDZD - (Number(discount) || 0));

  useEffect(() => {
    if (hasModifiedArticles && !totalEncaisseManuallyEdited) {
      setTotalEncaisse(computedNetTotal);
    }
  }, [computedNetTotal, hasModifiedArticles, totalEncaisseManuallyEdited]);

  const handleAddItem = () => {
    setHasModifiedArticles(true);
    setItems([...items, { name: '', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return; // Must have at least one item
    setHasModifiedArticles(true);
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'qty' | 'price', value: string | number) => {
    setHasModifiedArticles(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

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
      id: item.id || `item-${Date.now()}-${idx}`,
      name: item.name.trim(),
      qty: Math.max(1, Number(item.qty) || 1),
      price: Math.max(0, Number(item.price) || 0)
    }));

    const finalItemsTotal = finalItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const newNetTotal = Math.max(0, finalItemsTotal - (discount || 0));

    const updatedInvoice: Invoice = {
      ...invoice,
      invoiceNumber: invoiceNumber.trim() ? invoiceNumber.trim() : invoice.invoiceNumber,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      items: finalItems,
      discount: discount,
      photoUrl: photoUrl || undefined,
      // If the invoice is Payé or had totalEncaisse, update totalEncaisse with the new calculated total (or custom override)
      ...(invoice.status === 'Payé' || invoice.totalEncaisse !== undefined
        ? {
            totalEncaisse: totalEncaisse !== '' && Number(totalEncaisse) >= 0 ? Number(totalEncaisse) : newNetTotal,
            prixAchat: prixAchat !== '' && Number(prixAchat) >= 0 ? Number(prixAchat) : (invoice.prixAchat || 0)
          }
        : {})
    };

    onConfirm(updatedInvoice);
    onClose();
  };

  if (!isOpen || !invoice) return null;

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
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Modifier la Facture {invoice.invoiceNumber}
              </h2>
              <p className="text-xs text-zinc-500">
                Modification administrateur • Statut actuel : {invoice.status}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Hidden Camera Input */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />
            {/* Very Small Camera Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={photoUrl ? "Changer la photo de la facture" : "Prendre / ajouter une photo de la facture"}
              className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                photoUrl 
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <Camera className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={onClose} 
              className="p-1 px-1.5 py-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Photo Preview Strip if attached */}
          {photoUrl && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsPhotoPreviewOpen(true)}
                  className="relative group cursor-pointer"
                  title="Agrandir la photo de la facture"
                >
                  <img
                    src={photoUrl}
                    alt="Aperçu facture"
                    className="w-10 h-10 object-cover rounded-lg border border-amber-400 shadow-2xs group-hover:opacity-90 transition"
                  />
                  <span className="absolute inset-0 bg-black/30 group-hover:bg-black/50 rounded-lg flex items-center justify-center text-white text-[9px] font-black opacity-0 group-hover:opacity-100 transition">
                    VOIR
                  </span>
                </button>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                    <span>📸 Photo de facture jointe</span>
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Enregistrée avec la facture
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setIsPhotoPreviewOpen(true)}
                  className="px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 rounded-lg transition cursor-pointer"
                >
                  Aperçu
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 text-zinc-400 hover:text-amber-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="Reprendre la photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="p-1 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="Supprimer la photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

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
                  Numéro de Bon / Facture
                </label>
                <input
                  type="text"
                  placeholder="Ex: PE-2026-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
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
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Articles commandés
                </h3>
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-mono">
                  {totalArticlesQty} article{totalArticlesQty > 1 ? 's' : ''} ({items.filter(i => i.name.trim()).length} réf.)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline transition cursor-pointer"
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
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer self-center"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Discount and Summary Section */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Remise / Réduction (DA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => {
                    setHasModifiedArticles(true);
                    setDiscount(Math.max(0, Number(e.target.value) || 0));
                  }}
                  className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] font-semibold text-zinc-400">DA</span>
              </div>
            </div>

            <div className="text-right w-full sm:w-auto space-y-0.5">
              <p className="text-[11px] text-zinc-500 font-medium">
                Total articles : <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{totalArticlesQty} pièce{totalArticlesQty > 1 ? 's' : ''}</span>
              </p>
              {discount > 0 && (
                <p className="text-[11px] text-zinc-400 line-through font-mono">
                  Total initial: {formatDZD(totalDZD)}
                </p>
              )}
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Général Net</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatDZD(computedNetTotal)}
              </p>
            </div>
          </div>

          {/* Section conditionnelle pour facture Payée : Prix de vente et Prix d'achat */}
          {(invoice.status === 'Payé' || invoice.totalEncaisse !== undefined) && (
            <div className="border-t border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 rounded-xl space-y-3 mt-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span>💰 Paramètres financiers (Statut : Payé)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono">
                  Bénéfice : {formatDZD(
                    (totalEncaisse !== '' && Number(totalEncaisse) >= 0 ? Number(totalEncaisse) : computedNetTotal) - 
                    (prixAchat !== '' && Number(prixAchat) >= 0 ? Number(prixAchat) : 0)
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Prix de vente total encaissé (DA)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTotalEncaisse(computedNetTotal);
                        setTotalEncaisseManuallyEdited(false);
                      }}
                      className="text-[10px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold underline cursor-pointer"
                    >
                      ⚡ Aligner ({formatDZD(computedNetTotal)})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={totalEncaisse !== '' ? totalEncaisse : ''}
                    onChange={(e) => {
                      setTotalEncaisseManuallyEdited(true);
                      setTotalEncaisse(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)));
                    }}
                    placeholder={String(computedNetTotal)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Nouveau total calculé des articles : {formatDZD(computedNetTotal)}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Prix d'achat total (DA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={prixAchat !== '' ? prixAchat : ''}
                    onChange={(e) => setPrixAchat(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Coût de revient pour le calcul du bénéfice net
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col-reverse sm:flex-row justify-end items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-600/10 cursor-pointer transition flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              <span>Confirmer la Modification</span>
            </button>
          </div>

        </form>
      </div>

      {/* Photo Preview Modal */}
      <PhotoModal
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        photoUrl={photoUrl}
        title={`Photo de la Facture ${invoice.invoiceNumber}`}
      />
    </div>
  );
}
