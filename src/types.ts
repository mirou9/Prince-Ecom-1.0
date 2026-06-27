/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrderStatus = 'En préparation' | 'En livraison' | 'Livré' | 'Payé' | 'Annulé';

export type UserRole = 'Employé' | 'Employeur';

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number; // in DZD
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: OrderItem[];
  status: OrderStatus;
  
  // Delivery details (Page 2: Livraison action)
  livreur?: string;
  deliveryNote?: string;
  
  // Sale details (Page 2: Vendre action)
  totalEncaisse?: number; // in DZD
  
  // Custom discount / remise
  discount?: number; // in DZD
  
  // Tracking
  treatedBy: UserRole;
  treatedByName?: string;
  createdAt: string;
}

export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  'En préparation': {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900/30'
  },
  'En livraison': {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900/40'
  },
  'Livré': {
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-900/40'
  },
  'Payé': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-900/40'
  },
  'Annulé': {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-900/40'
  }
};

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: 'Actif' | 'Inactif';
  password?: string;
  createdAt: string;
}

