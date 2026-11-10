import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { Invoice, Employee } from '../types';

// Initialize Firebase
const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
});

// Initialize Firestore with custom database ID from config
export const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

// Helper to strip undefined values for Firestore compatibility
const toPlain = <T>(obj: T): any => {
  return JSON.parse(JSON.stringify(obj));
};

// Sync Invoices - starts empty if database is empty
export const syncInvoices = (onUpdate: (invoices: Invoice[]) => void) => {
  const colRef = collection(db, 'invoices');
  
  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      onUpdate([]);
    } else {
      const invoicesList = snapshot.docs.map(doc => doc.data() as Invoice);
      invoicesList.sort((a, b) => {
        const dateA = new Date(a.createdAt || '').getTime();
        const dateB = new Date(b.createdAt || '').getTime();
        return dateB - dateA;
      });
      onUpdate(invoicesList);
    }
  }, (err) => {
    console.error('Firestore syncInvoices error:', err);
  });
};

// Save a single invoice
export const saveInvoiceToFirestore = async (invoice: Invoice) => {
  await setDoc(doc(db, 'invoices', invoice.id), toPlain(invoice));
};

export const deleteInvoiceFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, 'invoices', id));
};

// Sync Employees - starts empty if database is empty
export const syncEmployees = (onUpdate: (employees: Employee[]) => void) => {
  const colRef = collection(db, 'employees');
  
  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      onUpdate([]);
    } else {
      const employeesList = snapshot.docs.map(doc => doc.data() as Employee);
      onUpdate(employeesList);
    }
  }, (err) => {
    console.error('Firestore syncEmployees error:', err);
  });
};

export const saveEmployeeToFirestore = async (employee: Employee) => {
  await setDoc(doc(db, 'employees', employee.id), toPlain(employee));
};

export const deleteEmployeeFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, 'employees', id));
};

// Interface for Notes
export interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
}

// Sync Notes - starts empty if database is empty
export const syncNotes = (onUpdate: (notes: NoteItem[]) => void) => {
  const colRef = collection(db, 'notes');
  
  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      onUpdate([]);
    } else {
      const notesList = snapshot.docs.map(doc => doc.data() as NoteItem);
      notesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(notesList);
    }
  }, (err) => {
    console.error('Firestore syncNotes error:', err);
  });
};

export const saveNoteToFirestore = async (note: NoteItem) => {
  await setDoc(doc(db, 'notes', note.id), toPlain(note));
};

export const deleteNoteFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, 'notes', id));
};

// Livreur interface and sync
export interface LivreurItem {
  id: string;
  name: string;
  createdAt: string;
}

// Sync Livreurs - starts empty if database is empty
export const syncLivreurs = (onUpdate: (livreurs: string[]) => void) => {
  const colRef = collection(db, 'livreurs');
  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      onUpdate([]);
    } else {
      const list = snapshot.docs.map(doc => {
        const data = doc.data() as LivreurItem;
        return data.name;
      }).filter(Boolean);
      onUpdate(list);
    }
  }, (err) => {
    console.error('Firestore syncLivreurs error:', err);
  });
};

export const saveLivreurToFirestore = async (name: string) => {
  if (!name.trim()) return;
  const safeId = 'liv-' + encodeURIComponent(name.trim().toLowerCase()).replace(/[^a-zA-Z0-9_-]/g, '_');
  await setDoc(doc(db, 'livreurs', safeId), toPlain({
    id: safeId,
    name: name.trim(),
    createdAt: new Date().toISOString()
  }));
};

export const deleteLivreurFromFirestore = async (name: string) => {
  const safeId = 'liv-' + encodeURIComponent(name.trim().toLowerCase()).replace(/[^a-zA-Z0-9_-]/g, '_');
  await deleteDoc(doc(db, 'livreurs', safeId));
};

export const saveInvoicesToFirestoreBatch = async (newInvoices: Invoice[], oldInvoices: Invoice[]) => {
  if (newInvoices.length === 0) {
    for (const inv of oldInvoices) {
      await deleteInvoiceFromFirestore(inv.id);
    }
    return;
  }
  
  for (const inv of newInvoices) {
    const oldInv = oldInvoices.find(o => o.id === inv.id);
    if (!oldInv || JSON.stringify(oldInv) !== JSON.stringify(inv)) {
      await saveInvoiceToFirestore(inv);
    }
  }

  for (const inv of oldInvoices) {
    if (!newInvoices.find(n => n.id === inv.id)) {
      await deleteInvoiceFromFirestore(inv.id);
    }
  }
};

export const saveEmployeesToFirestoreBatch = async (newEmployees: Employee[], oldEmployees: Employee[]) => {
  if (newEmployees.length === 0) {
    for (const emp of oldEmployees) {
      await deleteEmployeeFromFirestore(emp.id);
    }
    return;
  }

  for (const emp of newEmployees) {
    const oldEmp = oldEmployees.find(o => o.id === emp.id);
    if (!oldEmp || JSON.stringify(oldEmp) !== JSON.stringify(emp)) {
      await saveEmployeeToFirestore(emp);
    }
  }

  for (const emp of oldEmployees) {
    if (!newEmployees.find(n => n.id === emp.id)) {
      await deleteEmployeeFromFirestore(emp.id);
    }
  }
};

export const saveNotesToFirestoreBatch = async (newNotes: NoteItem[], oldNotes: NoteItem[]) => {
  if (newNotes.length === 0) {
    for (const note of oldNotes) {
      await deleteNoteFromFirestore(note.id);
    }
    return;
  }

  for (const note of newNotes) {
    const oldNote = oldNotes.find(o => o.id === note.id);
    if (!oldNote || JSON.stringify(oldNote) !== JSON.stringify(note)) {
      await saveNoteToFirestore(note);
    }
  }

  for (const note of oldNotes) {
    if (!newNotes.find(n => n.id === note.id)) {
      await deleteNoteFromFirestore(note.id);
    }
  }
};

// Completely wipe all collections from Firestore
export const clearAllFirestoreData = async () => {
  const collections = ['invoices', 'employees', 'notes', 'livreurs'];
  for (const colName of collections) {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    for (const docSnap of snap.docs) {
      await deleteDoc(docSnap.ref);
    }
  }
};
