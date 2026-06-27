/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Invoice } from './types';

/**
 * Perform a fuzzy-like case-insensitive search across client information,
 * invoice number, phone number, address, and item list of invoices.
 */
export function fuzzySearchInvoices(invoices: Invoice[], query: string): Invoice[] {
  if (!query.trim()) return invoices;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return invoices.filter(invoice => {
    // Check invoice number
    if (invoice.invoiceNumber.toLowerCase().includes(normalizedQuery)) return true;
    
    // Check client details
    if (invoice.clientName.toLowerCase().includes(normalizedQuery)) return true;
    if (invoice.clientPhone.toLowerCase().includes(normalizedQuery)) return true;
    if (invoice.clientAddress.toLowerCase().includes(normalizedQuery)) return true;
    
    // Check items
    const hasMatchingItem = invoice.items.some(item => 
      item.name.toLowerCase().includes(normalizedQuery)
    );
    if (hasMatchingItem) return true;
    
    // Check livreur label
    if (invoice.livreur && invoice.livreur.toLowerCase().includes(normalizedQuery)) return true;
    
    // Check treated by employee/employer name or role
    if (invoice.treatedByName && invoice.treatedByName.toLowerCase().includes(normalizedQuery)) return true;
    if (invoice.treatedBy.toLowerCase().includes(normalizedQuery)) return true;
    
    return false;
  });
}

/**
 * Format currency nicely as DZD (Dinar Algérien)
 */
export function formatDZD(amount: number): string {
  // Algerian format: e.g. "12 500,00 DA" or "12 500 DA"
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('DZD', 'DA');
}
