import { Invoice } from './types';

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'PE-2026-001',
    clientName: 'Amine Belkacem',
    clientPhone: '0550 12 34 56',
    clientAddress: '12 Rue Didouche Mourad, Alger',
    items: [
      { id: 'item-1', name: 'Smartphone Prince Pro 128Go', qty: 1, price: 42000 },
      { id: 'item-2', name: 'Écouteurs Sans Fil Bass+', qty: 2, price: 3500 }
    ],
    status: 'En préparation',
    createdAt: '2026-05-24T14:30:00Z',
    treatedBy: 'Employé',
    treatedByName: 'Sofiane Zitouni'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'PE-2026-002',
    clientName: 'Yasmine Mansouri',
    clientPhone: '0661 98 76 54',
    clientAddress: 'Cité 500 Logements, Oran',
    items: [
      { id: 'item-3', name: 'Machine à café Prince Barista', qty: 1, price: 18500 }
    ],
    status: 'En livraison',
    livreur: 'Mourad Express',
    deliveryNote: 'Appeler avant de livrer l\'après-midi',
    createdAt: '2026-05-23T09:15:00Z',
    treatedBy: 'Employeur',
    treatedByName: 'PrinceEcom'
  },
  {
    id: 'inv-3',
    invoiceNumber: 'PE-2026-003',
    clientName: 'Karim Othmani',
    clientPhone: '0770 45 67 89',
    clientAddress: 'Boulevard de la Soummam, Constantine',
    items: [
      { id: 'item-4', name: 'Montre Bluetooth Active Pro', qty: 1, price: 7900 },
      { id: 'item-5', name: 'Câble Chargeur Rapide USB-C', qty: 3, price: 1200 }
    ],
    status: 'Payé',
    totalEncaisse: 11500,
    createdAt: '2026-05-22T11:00:00Z',
    treatedBy: 'Employé',
    treatedByName: 'Karim Othmani'
  },
  {
    id: 'inv-4',
    invoiceNumber: 'PE-2026-004',
    clientName: 'Fatiha Merah',
    clientPhone: '0555 33 22 11',
    clientAddress: 'Quartier Salam, Setif',
    items: [
      { id: 'item-6', name: 'Mini Aspirateur Portable Rechargeable', qty: 1, price: 6500 }
    ],
    status: 'En préparation',
    createdAt: '2026-05-24T18:20:00Z',
    treatedBy: 'Employé',
    treatedByName: 'Amine Belkacem'
  },
  {
    id: 'inv-5',
    invoiceNumber: 'PE-2026-005',
    clientName: 'Sofiane Zitouni',
    clientPhone: '0662 44 55 66',
    clientAddress: 'Route de Tizi Ouzou, Boumerdes',
    items: [
      { id: 'item-7', name: 'Casque Réducteur de Bruit Elite', qty: 1, price: 14000 }
    ],
    status: 'Payé',
    totalEncaisse: 14000,
    createdAt: '2026-05-21T16:45:00Z',
    treatedBy: 'Employeur',
    treatedByName: 'PrinceEcom'
  }
];

export const AVAILABLE_LIVREURS = [
  'Ahmed Livraison (Alger & environs)',
  'Yassir Celer',
  'Mourad Express',
  'Kazi Tours Est/Ouest',
  'Yalidine Express'
];
