/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Phone, MapPin, Package, Calendar, User, ChevronDown, ChevronUp, Truck, DollarSign, Award } from 'lucide-react';
import { Invoice, OrderStatus, STATUS_COLORS, UserRole } from '../types';
import { formatDZD } from '../utils';

interface InvoiceCardProps {
  key?: string;
  invoice: Invoice;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
  // To show role info if relevant or audit trail
  currentRole?: UserRole;
  isPayPage?: boolean;
}

export default function InvoiceCard({ invoice, onStatusChange, currentRole, isPayPage = false }: InvoiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const itemsTotal = invoice.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalAmount = Math.max(0, itemsTotal - (invoice.discount || 0));
  const initials = invoice.clientName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const formattedDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const statuses: OrderStatus[] = invoice.status === 'En préparation' 
    ? ['En préparation', 'En livraison', 'Payé', 'Annulé'] 
    : invoice.status === 'En livraison' || invoice.status === 'Livré'
      ? ['En livraison', 'Livré', 'Payé', 'Annulé']
      : ['En préparation', 'En livraison', 'Livré', 'Payé', 'Annulé'];

  const handleStatusSelect = (status: OrderStatus) => {
    onStatusChange(invoice.id, status);
    setDropdownOpen(false);
  };

  const activeColors = STATUS_COLORS[invoice.status];

  return (
    <div 
      id={`invoice-${invoice.id}`}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-xs hover:shadow-xs hover:border-zinc-300 dark:hover:border-zinc-750 transition duration-150 flex flex-col space-y-2.5 relative"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-805 pb-2">
        {/* Invoice Number, Date and User Badge */}
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
            <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded shrink-0 font-sans">
              {formattedDate}
            </span>
            <span className="text-[11px] font-mono font-bold text-zinc-400 dark:text-zinc-500">
              {invoice.invoiceNumber}
            </span>
            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-semibold shrink-0">
              {invoice.treatedByName || invoice.treatedBy}
            </span>
          </div>
          
          <h3 className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 leading-tight truncate">
            <span className="w-5.5 h-5.5 rounded bg-[#171b34] text-[#f8ef1d] flex items-center justify-center font-bold text-[10px] shrink-0 border border-[#f8ef1d]/20 shadow-xs">
              {initials}
            </span>
            <span className="truncate">{invoice.clientName}</span>
          </h3>
        </div>

        {/* Custom Pinned Dropdown Status Button Selector */}
        <div className="relative shrink-0 z-20">
          {invoice.status === 'Payé' ? (
            <div
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border ${activeColors.bg} ${activeColors.text} ${activeColors.border} text-[11px] font-black shadow-2xs`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{invoice.status}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center justify-between space-x-1 px-2 py-1 rounded-lg border ${activeColors.bg} ${activeColors.text} ${activeColors.border} text-[11px] font-bold hover:opacity-90 transition shadow-2xs cursor-pointer focus:outline-none`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{invoice.status}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

          {dropdownOpen && invoice.status !== 'Payé' && (
            <>
              {/* Overlay background to dismiss */}
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              
              <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 shadow-xl overflow-hidden z-20">
                <div className="p-1 space-y-0.5">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 px-2 py-0.5">
                    Statut
                  </div>
                  {statuses.map((s) => {
                    const sc = STATUS_COLORS[s];
                    const isSelected = invoice.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusSelect(s)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded transition text-left cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100' 
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.text} bg-current`} />
                          <span>{s === 'Annulé' ? 'Annuler' : s}</span>
                        </div>
                        {isSelected && <span className="text-[9px] text-zinc-400">Actif</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Client Contact Info Section */}
      <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-805 rounded-lg p-2.5 space-y-1.5 text-[11px]">
        <div className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
          <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
          <a href={`tel:${invoice.clientPhone}`} className="hover:underline hover:text-amber-500 font-mono">
            {invoice.clientPhone}
          </a>
        </div>
        <div className="flex items-start space-x-2 text-zinc-700 dark:text-zinc-300">
          <MapPin className="w-3 h-3 text-zinc-400 mt-0.5 shrink-0" />
          <span className="line-clamp-1">{invoice.clientAddress}</span>
        </div>
      </div>

      {/* Conditionally Display Delivery details if En livraison / Livré */}
      {(invoice.livreur || invoice.deliveryNote) && (
        <div className="p-2 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-105 dark:border-blue-950/25 rounded-lg flex items-start gap-2">
          <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-[11px]">
            <p className="font-semibold text-blue-800 dark:text-blue-300">
              Livreur : <span className="font-bold">{invoice.livreur}</span>
            </p>
            {invoice.deliveryNote && (
              <p className="text-blue-600 dark:text-blue-400 italic text-[10px] leading-tight line-clamp-1">
                "{invoice.deliveryNote}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Conditionally Display Sale details if Paye */}
      {invoice.status === 'Payé' && (
        <div className="p-2 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-150/50 dark:border-emerald-950/25 rounded-lg flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-emerald-800 dark:text-emerald-300 font-semibold">Total encaissé :</span>
          </div>
          <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-xs">
            {formatDZD(invoice.totalEncaisse ?? totalAmount)}
          </span>
        </div>
      )}

      {/* Collapsible Order Items Container */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition focus:outline-none py-0.5 cursor-pointer"
        >
          <div className="flex items-center space-x-1.5">
            <Package className="w-3 h-3 text-zinc-400 shadow-3xs" />
            <span>
              {invoice.items.length} article{invoice.items.length > 1 ? 's' : ''} ({formatDZD(totalAmount)})
            </span>
          </div>
          {isExpanded ? (
            <div className="flex items-center space-x-0.5 text-[10px]">
              <span>Cacher</span>
              <ChevronUp className="w-3 h-3" />
            </div>
          ) : (
            <div className="flex items-center space-x-0.5 text-[10px]">
              <span>Détails</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          )}
        </button>

        {isExpanded && (
          <div className="mt-1 bg-zinc-50/40 dark:bg-zinc-950/25 p-2 rounded-lg border border-zinc-100 dark:border-zinc-805 divide-y divide-zinc-100/60 dark:divide-zinc-800/40">
            {invoice.items.map((item, idx) => (
              <div key={item.id ?? idx} className="py-1 flex justify-between items-center text-[11px] text-zinc-700 dark:text-zinc-400">
                <div className="space-y-0.5 pr-2 truncate">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.name}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {item.qty} x {formatDZD(item.price)}
                  </p>
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-200 font-mono shrink-0">
                  {formatDZD(item.price * item.qty)}
                </span>
              </div>
            ))}
            
            {invoice.discount ? (
              <div className="py-1 flex justify-between items-center text-[11px] text-zinc-500 font-medium">
                <span>Remise</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">-{formatDZD(invoice.discount)}</span>
              </div>
            ) : null}
            
            <div className="py-1.5 flex justify-between items-center text-[11px] font-black text-zinc-900 dark:text-zinc-100 border-t border-zinc-100 dark:border-zinc-800 mt-1">
              <span>Total</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{formatDZD(totalAmount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
