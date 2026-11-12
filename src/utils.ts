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

/**
 * Compress an image file to a lightweight data URL JPEG for instant storage and display.
 */
export function compressImageFile(file: File, maxWidth = 1000, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
