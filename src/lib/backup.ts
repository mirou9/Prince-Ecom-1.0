import { Invoice, OrderItem, OrderStatus, UserRole, Employee } from '../types';
import { NoteItem } from './firebase';

export interface AppBackupData {
  invoices: Invoice[];
  employees: Employee[];
  notes: NoteItem[];
  livreurs: string[];
  sourceType?: 'json' | 'csv';
}

export interface BackupFileEnvelope {
  app: string;
  version: number;
  exportedAt: string;
  data: AppBackupData;
}

const VALID_STATUSES: OrderStatus[] = ['En préparation', 'En livraison', 'Livré', 'Payé', 'Annulé'];
const VALID_ROLES: UserRole[] = ['Employé', 'Employeur'];

const sanitizeDocId = (rawId: unknown, prefix: string, index: number): string => {
  if (typeof rawId === 'string' && rawId.trim()) {
    const cleaned = rawId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    if (cleaned.length > 0) return cleaned;
  }
  return `${prefix}-${Date.now()}-${index}`;
};

const triggerFileDownload = (content: string, mimeType: string, filename: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const getDateSlug = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}_${hh}h${mm}`;
};

export function exportAppBackupJSON(data: AppBackupData): string {
  const payload: BackupFileEnvelope = {
    app: 'Prince Ecom',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      invoices: data.invoices || [],
      employees: data.employees || [],
      notes: data.notes || [],
      livreurs: data.livreurs || []
    }
  };
  const filename = `prince-ecom-sauvegarde-${getDateSlug()}.json`;
  triggerFileDownload(JSON.stringify(payload, null, 2), 'application/json;charset=utf-8', filename);
  return filename;
}

const escapeCsvField = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function exportInvoicesCSV(invoices: Invoice[]): string {
  const headers = [
    'id',
    'numero_facture',
    'date',
    'client_nom',
    'client_telephone',
    'client_adresse',
    'statut',
    'traite_par_role',
    'traite_par_nom',
    'livreur',
    'note_livraison',
    'articles_resume',
    'remise',
    'total_articles',
    'total_net',
    'prix_vente_encaisse',
    'prix_achat',
    'benefice',
    'articles_json',
    'photo_url'
  ];

  const rows = invoices.map((inv) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    const itemsTotal = items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.qty) || 1)), 0);
    const discount = Number(inv.discount) || 0;
    const totalNet = Math.max(0, itemsTotal - discount);
    const totalEncaisse = inv.totalEncaisse !== undefined ? Number(inv.totalEncaisse) : '';
    const prixAchat = inv.prixAchat !== undefined ? Number(inv.prixAchat) : '';
    const benefice =
      inv.status === 'Payé'
        ? (inv.totalEncaisse !== undefined ? Number(inv.totalEncaisse) : totalNet) - (Number(inv.prixAchat) || 0)
        : '';

    const itemsSummary = items
      .map((it) => `${Number(it.qty) || 1}x ${it.name || ''} (${Number(it.price) || 0} DA)`)
      .join(' | ');

    return [
      inv.id,
      inv.invoiceNumber,
      inv.createdAt,
      inv.clientName,
      inv.clientPhone,
      inv.clientAddress,
      inv.status,
      inv.treatedBy,
      inv.treatedByName || '',
      inv.livreur || '',
      inv.deliveryNote || '',
      itemsSummary,
      discount || 0,
      itemsTotal,
      totalNet,
      totalEncaisse,
      prixAchat,
      benefice,
      JSON.stringify(items),
      inv.photoUrl || ''
    ]
      .map(escapeCsvField)
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const filename = `prince-ecom-factures-${getDateSlug()}.csv`;
  triggerFileDownload(csvContent, 'text/csv;charset=utf-8', filename);
  return filename;
}

function normalizeInvoice(raw: any, index: number): Invoice | null {
  if (!raw || typeof raw !== 'object') return null;

  const clientName = String(raw.clientName ?? raw.client_nom ?? '').trim();
  const invoiceNumber = String(raw.invoiceNumber ?? raw.numero_facture ?? '').trim();
  if (!clientName && !invoiceNumber) return null;

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: OrderItem[] = rawItems
    .filter((it: any) => it && typeof it === 'object')
    .map((it: any, idx: number) => ({
      id: typeof it.id === 'string' && it.id.trim() ? it.id : `item-${Date.now()}-${index}-${idx}`,
      name: String(it.name || 'Article'),
      qty: Math.max(1, Number(it.qty) || 1),
      price: Math.max(0, Number(it.price) || 0)
    }));

  const status: OrderStatus = VALID_STATUSES.includes(raw.status) ? raw.status : 'En préparation';
  const treatedBy: UserRole = VALID_ROLES.includes(raw.treatedBy) ? raw.treatedBy : 'Employeur';

  const normalized: Invoice = {
    id: sanitizeDocId(raw.id, 'inv', index),
    invoiceNumber: invoiceNumber || `PE-IMP-${String(index + 1).padStart(3, '0')}`,
    clientName: clientName || 'Client',
    clientPhone: String(raw.clientPhone ?? raw.client_telephone ?? ''),
    clientAddress: String(raw.clientAddress ?? raw.client_adresse ?? ''),
    items,
    status,
    treatedBy,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt : new Date().toISOString()
  };

  if (raw.treatedByName) normalized.treatedByName = String(raw.treatedByName);
  if (raw.livreur) normalized.livreur = String(raw.livreur);
  if (raw.deliveryNote) normalized.deliveryNote = String(raw.deliveryNote);
  if (raw.totalEncaisse !== undefined && raw.totalEncaisse !== '' && !Number.isNaN(Number(raw.totalEncaisse))) {
    normalized.totalEncaisse = Number(raw.totalEncaisse);
  }
  if (raw.prixAchat !== undefined && raw.prixAchat !== '' && !Number.isNaN(Number(raw.prixAchat))) {
    normalized.prixAchat = Number(raw.prixAchat);
  }
  if (raw.discount !== undefined && raw.discount !== '' && !Number.isNaN(Number(raw.discount))) {
    normalized.discount = Number(raw.discount);
  }
  if (typeof raw.photoUrl === 'string' && raw.photoUrl.trim()) {
    normalized.photoUrl = raw.photoUrl;
  }

  return normalized;
}

function normalizeEmployee(raw: any, index: number): Employee | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  if (!name) return null;

  const emp: Employee = {
    id: sanitizeDocId(raw.id, 'emp', index),
    name,
    phone: String(raw.phone || ''),
    role: String(raw.role || 'Vendeur'),
    status: raw.status === 'Inactif' ? 'Inactif' : 'Actif',
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt : new Date().toISOString()
  };

  if (typeof raw.password === 'string' && raw.password) {
    emp.password = raw.password;
  }
  return emp;
}

function normalizeNote(raw: any, index: number): NoteItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const content = String(raw.content || '').trim();
  if (!content) return null;

  return {
    id: sanitizeDocId(raw.id, 'note', index),
    content,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt : new Date().toISOString()
  };
}

function parseCsvRows(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '');
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function parseSummaryItemsFallback(summary: string, rowIdx: number): OrderItem[] {
  if (!summary.trim()) return [];
  return summary
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, idx) => {
      const match = part.match(/^(\d+)\s*x\s*(.+?)\s*\((\d+(?:[.,]\d+)?)\s*DA\)$/i);
      if (match) {
        return {
          id: `item-${Date.now()}-${rowIdx}-${idx}`,
          qty: Math.max(1, Number(match[1]) || 1),
          name: match[2].trim(),
          price: Math.max(0, Number(match[3].replace(',', '.')) || 0)
        };
      }
      return {
        id: `item-${Date.now()}-${rowIdx}-${idx}`,
        qty: 1,
        name: part,
        price: 0
      };
    });
}

export async function parseBackupFile(file: File): Promise<AppBackupData> {
  const rawText = (await file.text()).trim();
  if (!rawText) {
    throw new Error('Le fichier sélectionné est vide.');
  }

  const isJsonLike = file.name.toLowerCase().endsWith('.json') || rawText.startsWith('{') || rawText.startsWith('[');

  if (isJsonLike) {
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error('Fichier JSON invalide ou corrompu.');
    }

    const source = parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object'
      ? parsed.data
      : parsed;

    if (Array.isArray(source)) {
      const invoices = source
        .map((item, idx) => normalizeInvoice(item, idx))
        .filter((x): x is Invoice => x !== null);
      if (invoices.length === 0) {
        throw new Error('Aucune facture valide trouvée dans ce fichier JSON.');
      }
      return { invoices, employees: [], notes: [], livreurs: [], sourceType: 'json' };
    }

    if (!source || typeof source !== 'object') {
      throw new Error('Format de sauvegarde JSON non reconnu.');
    }

    const hasRecognizedKey =
      'invoices' in source || 'employees' in source || 'notes' in source || 'livreurs' in source;
    if (!hasRecognizedKey) {
      throw new Error('Ce fichier JSON ne contient pas de données Prince Ecom valides.');
    }

    const invoices = Array.isArray(source.invoices)
      ? source.invoices.map((item: any, idx: number) => normalizeInvoice(item, idx)).filter((x: Invoice | null): x is Invoice => x !== null)
      : [];
    const employees = Array.isArray(source.employees)
      ? source.employees.map((item: any, idx: number) => normalizeEmployee(item, idx)).filter((x: Employee | null): x is Employee => x !== null)
      : [];
    const notes = Array.isArray(source.notes)
      ? source.notes.map((item: any, idx: number) => normalizeNote(item, idx)).filter((x: NoteItem | null): x is NoteItem => x !== null)
      : [];
    const livreurs: string[] = Array.isArray(source.livreurs)
      ? Array.from(new Set<string>(source.livreurs.map((l: any) => String(l || '').trim()).filter(Boolean)))
      : [];

    return { invoices, employees, notes, livreurs, sourceType: 'json' };
  }

  // CSV Import
  const rows = parseCsvRows(rawText);
  if (rows.length < 2) {
    throw new Error('Le fichier CSV ne contient aucune ligne de facture.');
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const hasKnownCsvHeader =
    headers.includes('numero_facture') || headers.includes('client_nom') || headers.includes('invoicenumber');
  if (!hasKnownCsvHeader) {
    throw new Error('En-têtes CSV non reconnus. Veuillez utiliser un fichier CSV exporté depuis Prince Ecom.');
  }

  const getCol = (row: string[], key: string): string => {
    const idx = headers.indexOf(key);
    return idx >= 0 && idx < row.length ? row[idx] : '';
  };

  const invoices: Invoice[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const itemsJsonRaw = getCol(row, 'articles_json');
    let parsedItems: any[] = [];
    if (itemsJsonRaw.trim()) {
      try {
        const candidate = JSON.parse(itemsJsonRaw);
        if (Array.isArray(candidate)) parsedItems = candidate;
      } catch {
        parsedItems = [];
      }
    }
    if (parsedItems.length === 0) {
      parsedItems = parseSummaryItemsFallback(getCol(row, 'articles_resume'), i);
    }

    const inv = normalizeInvoice(
      {
        id: getCol(row, 'id'),
        invoiceNumber: getCol(row, 'numero_facture') || getCol(row, 'invoicenumber'),
        createdAt: getCol(row, 'date') || getCol(row, 'createdat'),
        clientName: getCol(row, 'client_nom') || getCol(row, 'clientname'),
        clientPhone: getCol(row, 'client_telephone') || getCol(row, 'clientphone'),
        clientAddress: getCol(row, 'client_adresse') || getCol(row, 'clientaddress'),
        status: getCol(row, 'statut') || getCol(row, 'status'),
        treatedBy: getCol(row, 'traite_par_role') || getCol(row, 'treatedby'),
        treatedByName: getCol(row, 'traite_par_nom') || getCol(row, 'treatedbyname'),
        livreur: getCol(row, 'livreur'),
        deliveryNote: getCol(row, 'note_livraison') || getCol(row, 'deliverynote'),
        discount: getCol(row, 'remise') || getCol(row, 'discount'),
        totalEncaisse: getCol(row, 'prix_vente_encaisse') || getCol(row, 'totalencaisse'),
        prixAchat: getCol(row, 'prix_achat') || getCol(row, 'prixachat'),
        photoUrl: getCol(row, 'photo_url') || getCol(row, 'photourl'),
        items: parsedItems
      },
      i
    );

    if (inv) {
      invoices.push(inv);
    }
  }

  if (invoices.length === 0) {
    throw new Error('Aucune facture valide trouvée dans le fichier CSV.');
  }

  return { invoices, employees: [], notes: [], livreurs: [], sourceType: 'csv' };
}
