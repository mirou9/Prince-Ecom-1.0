/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Truck, 
  DollarSign, 
  Clock, 
  Smartphone, 
  AlertCircle,
  History,
  TrendingUp, 
  CheckCircle, 
  RotateCcw,
  SlidersHorizontal,
  ShieldCheck,
  User,
  Info,
  Settings,
  Users,
  BarChart3,
  UserPlus,
  StickyNote,
  Trash2,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

import { Invoice, OrderStatus, UserRole, Employee } from './types';
import { INITIAL_INVOICES } from './data';
import { fuzzySearchInvoices, formatDZD } from './utils';

import InvoiceCard from './components/InvoiceCard';
import CreateInvoiceModal from './components/CreateInvoiceModal';
import LivraisonModal from './components/LivraisonModal';
import VendreModal from './components/VendreModal';
import CreateEmployeeModal from './components/CreateEmployeeModal';

import {
  syncInvoices,
  saveInvoicesToFirestoreBatch,
  syncEmployees,
  saveEmployeesToFirestoreBatch,
  syncNotes,
  saveNotesToFirestoreBatch,
  NoteItem
} from './lib/firebase';


// ----------------------------------------------------
// Core Settings Pane Component
// ----------------------------------------------------
interface SettingsPaneProps {
  employees: Employee[];
  invoices: Invoice[];
  setIsCreateEmployeeOpen: (open: boolean) => void;
  activeSettingsTab: 'Employé' | 'Statistique';
  setActiveSettingsTab: (tab: 'Employé' | 'Statistique') => void;
  setShowSettings: (show: boolean) => void;
  formatDZD: (val: number) => string;
  onClearAllData: () => void;
  saveEmployees: (newEmployees: Employee[]) => void;
}

function SettingsPane({
  employees,
  invoices,
  setIsCreateEmployeeOpen,
  activeSettingsTab,
  setActiveSettingsTab,
  setShowSettings,
  formatDZD,
  onClearAllData,
  saveEmployees
}: SettingsPaneProps) {
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [selectedEmployeeForPassword, setSelectedEmployeeForPassword] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalError, setModalError] = useState('');

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNote, setNewNote] = useState('');

  // Local Stats filters
  const [statEmployeeFilter, setStatEmployeeFilter] = useState<string>('tous');
  const [statDurationFilter, setStatDurationFilter] = useState<string>('tous'); // 'tous', 'today', '7days', '30days', 'this_month', 'custom'
  const [statStartDate, setStatStartDate] = useState<string>('');
  const [statEndDate, setStatEndDate] = useState<string>('');

  useEffect(() => {
    const unsubscribe = syncNotes(setNotes);
    return () => unsubscribe();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const item: NoteItem = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date().toISOString()
    };
    const updatedNotes = [item, ...notes];
    setNotes(updatedNotes);
    await saveNotesToFirestoreBatch(updatedNotes, notes);
    setNewNote('');
  };

  const handleDeleteNote = async (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    await saveNotesToFirestoreBatch(updatedNotes, notes);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForPassword) return;
    if (!newPassword.trim()) {
      setModalError('Le mot de passe ne peut pas être vide.');
      return;
    }
    const updatedEmployees = employees.map(emp => {
      if (emp.id === selectedEmployeeForPassword.id) {
        return {
          ...emp,
          password: newPassword.trim()
        };
      }
      return emp;
    });
    saveEmployees(updatedEmployees);
    setSelectedEmployeeForPassword(null);
    alert(`Le mot de passe de ${selectedEmployeeForPassword.name} a été enregistré avec succès !`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header of Settings Panel */}
      <div className="bg-[#171b34] text-white rounded-2xl p-5 border border-[#f8ef1d]/30 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[#f8ef1d] flex items-center gap-2">
            <Settings className="w-5 h-5 animate-spin text-[#f8ef1d]" style={{ animationDuration: '6s' }} />
            <span>Paramètres • {activeSettingsTab}</span>
          </h2>
          <p className="text-xs text-zinc-300 mt-1">
            Gérez vos employés et consultez les statistiques de performance de Prince Ecom.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
            {!showPasswordInput ? (
              <button
                type="button"
                id="btn-clear-all-data-trigger"
                onClick={() => {
                  setShowPasswordInput(true);
                  setPwdError('');
                  setPassword('');
                }}
                className="px-2.5 py-1 bg-red-650 hover:bg-red-700 active:bg-red-800 text-[10px] font-black uppercase text-white rounded-lg transition tracking-wider flex items-center space-x-1 cursor-pointer shadow-sm border border-red-500/20"
              >
                <Trash2 className="w-3 h-3 text-red-100" />
                <span>Effacer les données</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 bg-black/45 p-1.5 rounded-lg border border-red-500/35">
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPwdError('');
                  }}
                  className="bg-[#171b34] text-white text-[10px] px-2 py-1 rounded border border-white/10 outline-none w-44 font-mono focus:border-[#f8ef1d]/50"
                />
                <button
                  type="button"
                  id="btn-clear-all-data-confirm"
                  onClick={() => {
                    if (password === 'PrinceEcom') {
                      onClearAllData();
                      setNotes([]); // clears state notes
                      setShowPasswordInput(false);
                      setPassword('');
                      alert('Toutes les données de l\'application ont été effacées avec succès !');
                    } else {
                      setPwdError('Mot de passe incorrect !');
                    }
                  }}
                  className="px-2 py-1 bg-[#f8ef1d] hover:bg-[#d8cf12] text-[#171b34] text-[9.5px] font-black rounded cursor-pointer transition uppercase"
                >
                  Valider
                </button>
                <button
                  type="button"
                  id="btn-clear-all-data-cancel"
                  onClick={() => {
                    setShowPasswordInput(false);
                    setPassword('');
                    setPwdError('');
                  }}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 text-white text-[9.5px] font-bold rounded cursor-pointer transition uppercase"
                >
                  Annuler
                </button>
                {pwdError && (
                  <span className="text-[10px] text-red-400 font-bold ml-1">{pwdError}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sub-tabs switch: (employé, statistique) */}
        <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/10">
          <button
            type="button"
            id="tab-settings-employee"
            onClick={() => setActiveSettingsTab('Employé')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
              activeSettingsTab === 'Employé'
                ? 'bg-[#f8ef1d] text-[#171b34] shadow-xs'
                : 'text-zinc-350 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employé</span>
          </button>
          <button
            type="button"
            id="tab-settings-statistics"
            onClick={() => setActiveSettingsTab('Statistique')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
              activeSettingsTab === 'Statistique'
                ? 'bg-[#f8ef1d] text-[#171b34] shadow-xs'
                : 'text-zinc-350 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistique</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: Employé */}
      {activeSettingsTab === 'Employé' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
            <div className="space-y-0.5 justify-start self-start">
              <h3 className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Gestion d'Équipe ({employees.length} employés)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Membres enregistrés ayant accès à l'application Prince Ecom
              </p>
            </div>

            {/* Bouton Ajouter un nouvel employé */}
            <button
              type="button"
              id="add-employee-btn"
              onClick={() => setIsCreateEmployeeOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs font-black transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajouter un nouveau employé</span>
            </button>
          </div>

          {/* Employees list cards list */}
          {employees.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-zinc-200 dark:border-zinc-850">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Aucun employé pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {employees.map((emp) => (
                <div 
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployeeForPassword(emp);
                    setNewPassword(emp.password || '123');
                    setShowPassword(false);
                    setModalError('');
                  }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs hover:shadow-xs cursor-pointer hover:border-amber-500/55 dark:hover:border-amber-400/50 hover:bg-amber-500/[0.01] dark:hover:bg-amber-400/[0.01] transition duration-150 flex flex-col justify-between"
                  title="Cliquez pour changer le mot de passe"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {emp.role}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/40 rounded-md font-black">
                        🟢 {emp.status}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">{emp.name}</h4>
                      <p className="text-[11px] font-mono text-zinc-500">{emp.phone}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400">
                    <span>Date d’entrée :</span>
                    <span>{new Date(emp.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Statistique */}
      {activeSettingsTab === 'Statistique' && (() => {
        // Compute dynamic statistics based on applied filters
        const filteredInvoicesForStats = invoices.filter(inv => {
          // 1. Employee filter
          if (statEmployeeFilter !== 'tous') {
            if (statEmployeeFilter === 'PrinceEcom') {
              if (inv.treatedBy !== 'Employeur' && inv.treatedByName !== 'PrinceEcom') {
                return false;
              }
            } else {
              if (inv.treatedByName !== statEmployeeFilter) {
                return false;
              }
            }
          }

          // 2. Date / Duration filter
          if (statDurationFilter !== 'tous') {
            const invDate = new Date(inv.createdAt);
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (statDurationFilter === 'today') {
              if (invDate < todayStart) return false;
            } else if (statDurationFilter === '7days') {
              const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (invDate < sevenDaysAgo) return false;
            } else if (statDurationFilter === '30days') {
              const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (invDate < thirtyDaysAgo) return false;
            } else if (statDurationFilter === 'this_month') {
              const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              if (invDate < firstOfMonth) return false;
            } else if (statDurationFilter === 'custom') {
              if (statStartDate) {
                const start = new Date(statStartDate);
                start.setHours(0, 0, 0, 0);
                if (invDate < start) return false;
              }
              if (statEndDate) {
                const end = new Date(statEndDate);
                end.setHours(23, 59, 59, 999);
                if (invDate > end) return false;
              }
            }
          }
          return true;
        });

        return (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Filters Bar for Statistics */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-zinc-150 dark:border-zinc-800">
                <SlidersHorizontal className="w-4 h-4 text-[#f8ef1d]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Filtres de recherche et de période
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filter 1: Nom d'employé */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Filtrer par collaborateur
                  </label>
                  <select
                    value={statEmployeeFilter}
                    onChange={(e) => setStatEmployeeFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="tous">Tous les intervenants</option>
                    <option value="PrinceEcom">PrinceEcom (Employeur)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Filter 2: Date ou Durée */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Période temporelle
                  </label>
                  <select
                    value={statDurationFilter}
                    onChange={(e) => setStatDurationFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="tous">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="7days">7 derniers jours</option>
                    <option value="30days">30 derniers jours</option>
                    <option value="this_month">Ce mois-ci</option>
                    <option value="custom">Période personnalisée 📅</option>
                  </select>
                </div>

                {/* Filter 3: Custom Date Range (Conditional) */}
                {statDurationFilter === 'custom' && (
                  <div className="space-y-1 grid grid-cols-2 gap-2 animate-fadeIn">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-widest mb-1">
                        Date début
                      </label>
                      <input
                        type="date"
                        value={statStartDate}
                        onChange={(e) => setStatStartDate(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-widest mb-1">
                        Date fin
                      </label>
                      <input
                        type="date"
                        value={statEndDate}
                        onChange={(e) => setStatEndDate(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {(statEmployeeFilter !== 'tous' || statDurationFilter !== 'tous') && (
                <div className="pt-2 flex justify-between items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                  <span>📌 Filtres actifs : {filteredInvoicesForStats.length} facture(s) correspondante(s)</span>
                  <button
                    onClick={() => {
                      setStatEmployeeFilter('tous');
                      setStatDurationFilter('tous');
                      setStatStartDate('');
                      setStatEndDate('');
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer uppercase tracking-wider transition"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>

            {/* Visual statistics dashboard grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Revenue Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xs space-y-1">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Chiffre d’Affaires</span>
                  <DollarSign className="w-4 h-4 text-emerald-555" />
                </div>
                <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-450">
                  {formatDZD(filteredInvoicesForStats.reduce((acc, curr) => {
                    if (curr.status !== 'Payé') return acc;
                    const itemsTotal = curr.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                    const total = Math.max(0, itemsTotal - (curr.discount || 0));
                    return acc + (curr.totalEncaisse ?? total);
                  }, 0))}
                </p>
                <p className="text-[10px] text-zinc-400">Total payé réel (DA)</p>
              </div>

              {/* Volume orders */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xs space-y-1">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Factures</span>
                  <Users className="w-4 h-4 text-[#171b34] dark:text-[#f8ef1d]" />
                </div>
                <p className="text-lg font-black text-zinc-800 dark:text-zinc-200 font-mono">
                  {filteredInvoicesForStats.length} PE
                </p>
                <p className="text-[10px] text-zinc-400">Commandes filtrées</p>
              </div>

              {/* Average order price */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xs space-y-1">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Panier Moyen</span>
                  <TrendingUp className="w-4 h-4 text-[#f8ef1d]" />
                </div>
                <p className="text-lg font-black text-zinc-800 dark:text-zinc-200 font-mono">
                  {formatDZD(filteredInvoicesForStats.length > 0 ? (filteredInvoicesForStats.reduce((acc, curr) => {
                    const itemsTotal = curr.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                    return acc + Math.max(0, itemsTotal - (curr.discount || 0));
                  }, 0) / filteredInvoicesForStats.length) : 0)}
                </p>
                <p className="text-[10px] text-zinc-400">Panier moyen brut</p>
              </div>

              {/* Status checklist metrics */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xs space-y-1">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Taux d'encaissement</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-450">
                  {filteredInvoicesForStats.filter(inv => inv.status === 'Payé').length} réglées
                </p>
                <p className="text-[10px] text-zinc-450">
                  {filteredInvoicesForStats.length > 0 ? Math.round((filteredInvoicesForStats.filter(inv => inv.status === 'Payé').length / filteredInvoicesForStats.length) * 100) : 0}% des ventes closes
                </p>
              </div>
            </div>

            {/* Additional detailed metrics */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-850">
                Contribution et répartition par membre traitant
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Treated by Employé */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/30 rounded-lg border border-zinc-100 dark:border-zinc-800 space-y-2">
                  <p className="text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-widest">
                    🤵 Actions de l'Employé
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Factures prises en charge:</span>
                    <span className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200">{filteredInvoicesForStats.filter(i => i.treatedBy === 'Employé').length}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500">Volume généré:</span>
                    <span className="text-xs font-bold font-mono text-emerald-600">
                      {formatDZD(filteredInvoicesForStats.filter(i => i.treatedBy === 'Employé').reduce((acc, curr) => {
                        const itemsTotal = curr.items.reduce((s, item) => s + (item.price * item.qty), 0);
                        return acc + Math.max(0, itemsTotal - (curr.discount || 0));
                      }, 0))}
                    </span>
                  </div>
                </div>

                {/* Treated by Employeur */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/30 rounded-lg border border-zinc-100 dark:border-zinc-800 space-y-2">
                  <p className="text-[10px] font-black text-[#171b34] dark:text-[#f8ef1d] uppercase tracking-widest">
                    👑 Actions de l'Employeur
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Factures prises en charge:</span>
                    <span className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200">{filteredInvoicesForStats.filter(i => i.treatedBy === 'Employeur').length}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500">Volume généré:</span>
                    <span className="text-xs font-bold font-mono text-emerald-600 font-black">
                      {formatDZD(filteredInvoicesForStats.filter(i => i.treatedBy === 'Employeur').reduce((acc, curr) => {
                        const itemsTotal = curr.items.reduce((s, item) => s + (item.price * item.qty), 0);
                        return acc + Math.max(0, itemsTotal - (curr.discount || 0));
                      }, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ----------------- SECTON NOTES (EN BAS DU PANNEAU) ----------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#f8ef1d]/30">
          <StickyNote className="w-4 h-4 text-[#cbd5e1] dark:text-[#a1a1aa]" />
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            Notes & Mémos de l'établissement (classés par date)
          </h4>
        </div>

        {/* Form to Add Note */}
        <form onSubmit={handleAddNote} className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Écrire une petite note ici (ex: Horaires de travail, consignes de livraison...)"
            className="flex-1 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#f8ef1d]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
          </button>
        </form>

        {/* Notes list sorted by date */}
        {notes.length === 0 ? (
          <p className="text-[11px] text-zinc-400 italic">Aucune note enregistrée pour le moment.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {[...notes]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((note) => {
                const dateObj = new Date(note.createdAt);
                const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div
                    key={note.id}
                    className="flex justify-between items-start p-2.5 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-100 dark:border-zinc-800"
                  >
                    <div className="space-y-1 pr-4">
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <span className="block text-[9px] font-mono text-zinc-400">
                        {formattedDate}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-zinc-400 hover:text-rose-500 p-1 rounded-md transition cursor-pointer"
                      title="Supprimer la note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setShowSettings(false)}
          className="px-6 py-2 bg-[#171b34] text-white text-xs font-black tracking-wider uppercase rounded-xl shadow-xs cursor-pointer hover:bg-[#171b34]/90 transition"
        >
          ◀ Retourner au Tableau de Bord
        </button>
      </div>

      {/* Pop-up de modification de mot de passe de l'employé */}
      {selectedEmployeeForPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedEmployeeForPassword(null)}
          />
          
          {/* Container */}
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-fadeIn text-zinc-950 dark:text-zinc-50">
            {/* Header */}
            <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    Modifier le Mot de Passe
                  </h3>
                  <p className="text-[10px] text-zinc-500">
                    Employé : {selectedEmployeeForPassword.name}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEmployeeForPassword(null)} 
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePassword} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-650 dark:text-zinc-400">
                  Nouveau Mot de Passe
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Entrez le nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setModalError('');
                    }}
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-550/60 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350 transition"
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {modalError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">{modalError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeForPassword(null)}
                  className="w-1/2 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-750 text-xs font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#f8ef1d] hover:bg-[#d8cf12] text-[#171b34] rounded-lg text-xs font-black transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


// ----------------------------------------------------
// Secure Login Screen
// ----------------------------------------------------
interface LoginScreenProps {
  onLogin: (username: string, pass: string) => boolean;
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorError, setErrorError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorError('Veuillez remplir tous les champs.');
      return;
    }
    const success = onLogin(username, password);
    if (!success) {
      setErrorError('Identifiants incorrects ou compte inactif !');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        
        {/* Brand Logo Container */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center bg-[#171b34] px-6 py-4 rounded-2xl border-2 border-[#f8ef1d] shadow-xl shadow-[#171b34]/55 select-none">
            <div className="flex flex-col select-none leading-none text-left font-sans">
              <span className="text-[18px] font-sans font-black tracking-[0.25em] text-white uppercase leading-none">
                PRINCE
              </span>
              <span className="text-[13px] font-black tracking-[0.16em] text-[#f8ef1d] uppercase mt-1 leading-none">
                ECOM
              </span>
            </div>
          </div>
          <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mt-4">
            Connexion au Logiciel
          </h2>
        </div>

        {/* Content Card */}
        <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 p-6 shadow-2xl space-y-5 animate-scaleIn">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {errorError && (
              <div className="p-2.5 bg-red-950/45 text-red-400 rounded-lg text-xs font-bold border border-red-900/50 flex items-center space-x-1">
                <span>⚠️ {errorError}</span>
              </div>
            )}

            {/* Username field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="Ex: PrinceEcom"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorError('');
                  }}
                  className="w-full pl-10 pr-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-100 text-xs placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="Entrer votre mot de passe"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorError('');
                  }}
                  className="w-full pl-10 pr-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-100 text-xs placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#f8ef1d] hover:bg-[#d8cf12] text-[#171b34] font-black tracking-wider uppercase text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  // ----------------------------------------------------
  // Core App State
  // ----------------------------------------------------
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'En préparation' | 'En livraison' | 'Livré' | 'Historique'>('En préparation');
  
  // High-Security Auth states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('prince_is_logged_in') === 'true';
  });
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('prince_logged_role') as UserRole) || 'Employé';
  });
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    return localStorage.getItem('prince_logged_username') || '';
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLivraisonOpen, setIsLivraisonOpen] = useState(false);
  const [isVendreOpen, setIsVendreOpen] = useState(false);
  
  // Settings and Staff Management States
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'Employé' | 'Statistique'>('Employé');
 
  // Page-2 Floating Sub-menu UI
  const [showPage2SubMenu, setShowPage2SubMenu] = useState(false);
 
  // ----------------------------------------------------
  // Filters State
  // ----------------------------------------------------
  // Page 1 filter
  const [p1SortOrder, setP1SortOrder] = useState<'desc' | 'asc'>('desc');
  const [p1TreatedByFilter, setP1TreatedByFilter] = useState<string>('tous');
  
  // Page 2 filters
  const [p2FilterType, setP2FilterType] = useState<'tous' | 'En livraison' | 'Livré'>('tous');
  const [p2TreatedByFilter, setP2TreatedByFilter] = useState<string>('tous');
  
  // Page 3 filter (REQUIRED: choose and filter by employee/employer who treated the order)
  const [p3TreatedByFilter, setP3TreatedByFilter] = useState<string>('tous');

  // Page 4 filter (Historique)
  const [p4TreatedByFilter, setP4TreatedByFilter] = useState<string>('tous');

  // Load / Save invoices and employees via Firebase sync
  useEffect(() => {
    const unsubscribe = syncInvoices((data) => {
      setInvoices(data);
      localStorage.setItem('prince_ecom_invoices', JSON.stringify(data));
    }, INITIAL_INVOICES);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fallbackEmployees = [
      { id: 'emp-1', name: 'Sofiane Zitouni', phone: '0662 44 55 66', role: 'Vendeur', status: 'Actif', password: '123', createdAt: '2026-05-24T10:00:00Z' },
      { id: 'emp-2', name: 'Amine Belkacem', phone: '0550 12 34 56', role: 'Livreur', status: 'Actif', password: '123', createdAt: '2026-05-23T11:30:00Z' },
      { id: 'emp-3', name: 'Karim Othmani', phone: '0770 45 67 89', role: 'Préparateur', status: 'Actif', password: '123', createdAt: '2026-05-22T08:15:00Z' }
    ] as Employee[];

    const unsubscribe = syncEmployees((data) => {
      setEmployees(data);
      localStorage.setItem('prince_ecom_employees', JSON.stringify(data));
    }, fallbackEmployees);
    return () => unsubscribe();
  }, []);

  const saveInvoices = async (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    localStorage.setItem('prince_ecom_invoices', JSON.stringify(newInvoices));
    await saveInvoicesToFirestoreBatch(newInvoices, invoices);
  };

  const saveEmployees = async (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    localStorage.setItem('prince_ecom_employees', JSON.stringify(newEmployees));
    await saveEmployeesToFirestoreBatch(newEmployees, employees);
  };

  const handleLogin = (username: string, pass: string): boolean => {
    // Check employer
    if (username.trim() === 'PrinceEcom' && pass.trim() === 'PrinceEcomm9877') {
      setIsLoggedIn(true);
      setCurrentRole('Employeur');
      setCurrentUserName('PrinceEcom');
      localStorage.setItem('prince_is_logged_in', 'true');
      localStorage.setItem('prince_logged_role', 'Employeur');
      localStorage.setItem('prince_logged_username', 'PrinceEcom');
      return true;
    }
    
    // Check active employees
    const matched = employees.find(
      (emp) => emp.name.toLowerCase() === username.trim().toLowerCase() && 
               emp.status === 'Actif' && 
               (emp.password === pass.trim() || (!emp.password && pass.trim() === '123'))
    );
    if (matched) {
      setIsLoggedIn(true);
      setCurrentRole('Employé');
      setCurrentUserName(matched.name);
      localStorage.setItem('prince_is_logged_in', 'true');
      localStorage.setItem('prince_logged_role', 'Employé');
      localStorage.setItem('prince_logged_username', matched.name);
      return true;
    }
    
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentRole('Employé');
    setCurrentUserName('');
    localStorage.removeItem('prince_is_logged_in');
    localStorage.removeItem('prince_logged_role');
    localStorage.removeItem('prince_logged_username');
  };

  const handleCreateEmployeeSubmit = (data: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...data,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newEmp, ...employees];
    saveEmployees(updated);
  };

  // Reset helper
  const handleResetData = () => {
    if (window.confirm('Voulez-vous réinitialiser l\'application avec les données de démonstration d\'origine ?')) {
      saveInvoices(INITIAL_INVOICES);
    }
  };

  const handleClearAllData = () => {
    saveInvoices([]);
    saveEmployees([]);
    localStorage.removeItem('prince_ecom_settings_notes');
  };


  // ----------------------------------------------------
  // CRUD & Status Operations
  // ----------------------------------------------------
  // Create manual Invoice (Page 1 "+" clicked)
  const handleCreateInvoiceSubmit = (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'createdAt'> & { manualInvoiceNumber?: string }) => {
    // Determine last invoice sequence
    const nextNum = invoices.length + 1;
    const paddingNum = String(nextNum).padStart(3, '0');
    const invoiceNumber = data.manualInvoiceNumber?.trim() || `PE-2026-${paddingNum}`;
    
    const { manualInvoiceNumber, ...restData } = data;
    
    const newInvoice: Invoice = {
      ...restData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      status: 'En préparation',
      treatedByName: currentUserName || currentRole,
      createdAt: new Date().toISOString()
    };

    const updated = [newInvoice, ...invoices];
    saveInvoices(updated);
  };

  // Change individual order status from card dropdown
  const handleStatusChange = (id: string, newStatus: OrderStatus) => {
    const updated = invoices.map(inv => {
      if (inv.id === id) {
        // If status changes to Paye, default totalEncaisse if not yet set
        const itemsTotal = inv.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const totalAmount = Math.max(0, itemsTotal - (inv.discount || 0));
        return {
          ...inv,
          status: newStatus,
          // Propagate treatedBy to current role of the active user
          treatedBy: currentRole,
          treatedByName: currentUserName || currentRole,
          totalEncaisse: newStatus === 'Payé' ? (inv.totalEncaisse ?? totalAmount) : inv.totalEncaisse
        };
      }
      return inv;
    });
    saveInvoices(updated);
  };

  // Page 2 -> "Livraison" handler
  const handleLivraisonSubmit = (invoiceId: string, livreur: string, note: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'En livraison' as OrderStatus,
          livreur: livreur,
          deliveryNote: note,
          treatedBy: currentRole,
          treatedByName: currentUserName || currentRole
        };
      }
      return inv;
    });
    saveInvoices(updated);
  };

  // Page 2 -> "Vendre" handler
  const handleVendreSubmit = (invoiceId: string, totalEncaisse: number) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'Payé' as OrderStatus,
          totalEncaisse: totalEncaisse,
          treatedBy: currentRole,
          treatedByName: currentUserName || currentRole
        };
      }
      return inv;
    });
    saveInvoices(updated);
  };

  // ----------------------------------------------------
  // Filtered List computations
  // ----------------------------------------------------
  const matchFilter = (inv: Invoice, filterVal: string): boolean => {
    if (!filterVal || filterVal === 'tous') return true;
    if (inv.treatedByName === filterVal) return true;
    if (inv.treatedBy === filterVal) return true;
    return false;
  };

  // First, fuzzy search the complete collection
  const visibleInvoices = currentRole === 'Employé'
    ? invoices.filter(inv => inv.treatedByName === currentUserName)
    : invoices;

  const searchedInvoices = fuzzySearchInvoices(visibleInvoices, searchQuery);

  // Invoices currently under En préparation
  const preparationList = searchedInvoices.filter(inv => inv.status === 'En préparation');
  
  // Sort Page 1 dynamically and apply employee filter
  const sortedPage1List = [...preparationList]
    .filter(inv => matchFilter(inv, p1TreatedByFilter))
    .sort((a, b) => {
      const itemsTotalA = a.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const totalA = Math.max(0, itemsTotalA - (a.discount || 0));
      const itemsTotalB = b.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const totalB = Math.max(0, itemsTotalB - (b.discount || 0));
      return p1SortOrder === 'desc' ? totalB - totalA : totalA - totalB;
    });

  // Invoices currently under En livraison
  const livraisonList = searchedInvoices.filter(inv => 
    inv.status === 'En livraison'
  );
  // Refine Page 2 list with submenu filters
  const filteredPage2List = livraisonList
    .filter(inv => matchFilter(inv, p2TreatedByFilter));

  // Invoices currently under Livré
  const livreList = searchedInvoices.filter(inv => inv.status === 'Livré');
  // Sort or filter Page 3 dynamically
  const filteredPage3List = livreList.filter(inv => matchFilter(inv, p3TreatedByFilter));

  // Invoices currently in Historique (Payé ou Annulé)
  const historiqueList = searchedInvoices.filter(inv => inv.status === 'Payé' || inv.status === 'Annulé');
  const filteredPage4List = historiqueList.filter(inv => matchFilter(inv, p4TreatedByFilter));

  // Current page counter badges
  const badgePrep = visibleInvoices.filter(inv => inv.status === 'En préparation').length;
  const badgeLiv = visibleInvoices.filter(inv => inv.status === 'En livraison').length;
  const badgeLivre = visibleInvoices.filter(inv => inv.status === 'Livré').length;
  const badgeHistorique = visibleInvoices.filter(inv => inv.status === 'Payé' || inv.status === 'Annulé').length;

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-28 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      
      {/* 1. Main Header with Role Selection Controls */}
      <header className="sticky top-0 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 z-40 transition-all duration-150 shadow-xs">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-1.5 sm:py-2.5">
          <div className="flex flex-row justify-between items-center gap-1.5 sm:gap-3">
            
            {/* Logo and Name with literal title as logo */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <div className="flex items-center bg-[#171b34] px-2 py-1.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-[#f8ef1d]/85 shadow-md shadow-[#171b34]/25 select-none shrink-0">
                {/* Text design matching logo structure */}
                <div className="flex flex-col select-none leading-none">
                  <span className="text-[10px] sm:text-[14px] font-sans font-black tracking-[0.2em] text-white uppercase leading-none">
                    PRINCE
                  </span>
                  <span className="text-[8px] sm:text-[11px] font-black tracking-[0.14em] text-[#f8ef1d] uppercase mt-0.5 sm:mt-1 leading-none">
                    ECOM
                  </span>
                </div>
              </div>
              
              <div className="hidden sm:block">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                  Gestion des Commandes
                </span>
              </div>
            </div>

            {/* Role Switcher & System Reset Actions */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-1 min-w-0">
              {/* Reset action button */}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-amber-500 bg-zinc-100 dark:bg-zinc-900/40 hover:bg-zinc-200 dark:hover:bg-zinc-850 rounded-lg sm:rounded-xl transition cursor-pointer shrink-0"
                title="Actualiser l'application"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Main Settings button displayed ONLY to the Employer */}
              {currentRole === 'Employeur' && (
                <button
                  type="button"
                  id="btn-settings-toggle"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`px-2 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition flex items-center space-x-1 cursor-pointer border shadow-3xs shrink-0 ${
                    showSettings 
                      ? 'bg-[#171b34] text-[#f8ef1d] border-[#f8ef1d]/80' 
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50'
                  }`}
                >
                  <Settings className={`w-3.5 h-3.5 ${showSettings ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                  <span className="hidden min-[480px]:inline">Paramètres</span>
                </button>
              )}

              {/* Secure Logged Identity User Info Block */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                <div className="flex items-center space-x-1 sm:space-x-1.5 bg-zinc-100 dark:bg-zinc-900/40 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-zinc-200 dark:border-zinc-850">
                  {currentRole === 'Employeur' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate max-w-[90px] min-[400px]:max-w-[140px]">
                    {currentUserName}
                  </span>
                </div>

                <button
                  type="button"
                  id="header-logout-btn"
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg sm:rounded-xl transition cursor-pointer shrink-0 flex items-center space-x-1"
                  title="Se déconnecter"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black hidden sm:inline">Quitter</span>
                </button>
              </div>
            </div>

          </div>


        </div>
      </header>

      {/* 2. Page Area Container */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">

        {showSettings && currentRole === 'Employeur' ? (
          <SettingsPane
            employees={employees}
            invoices={visibleInvoices}
            setIsCreateEmployeeOpen={setIsCreateEmployeeOpen}
            activeSettingsTab={activeSettingsTab}
            setActiveSettingsTab={setActiveSettingsTab}
            setShowSettings={setShowSettings}
            formatDZD={formatDZD}
            onClearAllData={handleClearAllData}
            saveEmployees={saveEmployees}
          />
        ) : (
          <>
            {/* ----------------- SEARCH & FILTERS ROW ----------------- */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 shadow-2xs space-y-2.5">
          
          {/* Universal Fuzzy Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher (Ex: Sofiane, Karim, Mohamed, PE-2026, Article...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-550/60 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-[10px] text-zinc-400 hover:text-zinc-650 cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Page Specific Basic Filters Row */}
          {currentRole === 'Employeur' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center space-x-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtres de tri & filtrage :</span>
            </div>

            {/* Filter widget display changes depending on Active Tab */}
            <div>
              {activeTab === 'En préparation' && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-zinc-400 font-medium">Filtrer par employé :</span>
                  <select
                    value={p1TreatedByFilter}
                    onChange={(e) => setP1TreatedByFilter(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none font-medium"
                  >
                    {currentRole === 'Employé' ? (
                      <>
                        <option value="tous">📌 Toutes les factures</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                        <option value="PrinceEcom">PrinceEcom (Employeur)</option>
                      </>
                    ) : (
                      <>
                        <option value="tous">Tous les intervenants</option>
                        <option value="Employé">Employé uniquement</option>
                        <option value="Employeur">Employeur uniquement</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {activeTab === 'En livraison' && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-zinc-400 font-medium">Filtrer par employé :</span>
                  <select
                    value={p2TreatedByFilter}
                    onChange={(e) => setP2TreatedByFilter(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none font-medium"
                  >
                    {currentRole === 'Employé' ? (
                      <>
                        <option value="tous">📌 Toutes les factures</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                        <option value="PrinceEcom">PrinceEcom (Employeur)</option>
                      </>
                    ) : (
                      <>
                        <option value="tous">Tous les intervenants</option>
                        <option value="Employé">Employé uniquement</option>
                        <option value="Employeur">Employeur uniquement</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {activeTab === 'Livré' && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-zinc-400 font-medium">Filtrer par employé :</span>
                  <select
                    value={p3TreatedByFilter}
                    onChange={(e) => setP3TreatedByFilter(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-955 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none"
                  >
                    {currentRole === 'Employé' ? (
                      <>
                        <option value="tous">📌 Toutes les factures</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                        <option value="PrinceEcom">PrinceEcom (Employeur)</option>
                      </>
                    ) : (
                      <>
                        <option value="tous">Tous les intervenants</option>
                        <option value="Employé">Employé uniquement</option>
                        <option value="Employeur">Employeur uniquement</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {activeTab === 'Historique' && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-zinc-400 font-medium">Filtrer par employé :</span>
                  <select
                    value={p4TreatedByFilter}
                    onChange={(e) => setP4TreatedByFilter(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-955 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none"
                  >
                    {currentRole === 'Employé' ? (
                      <>
                        <option value="tous">📌 Toutes les factures</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                        <option value="PrinceEcom">PrinceEcom (Employeur)</option>
                      </>
                    ) : (
                      <>
                        <option value="tous">Tous les intervenants</option>
                        <option value="Employé">Employé uniquement</option>
                        <option value="Employeur">Employeur uniquement</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>
          )}

        </div>

        {/* ----------------- PAGE CONTENTS ----------------- */}

        {/* PAGE 1: En préparation */}
        {activeTab === 'En préparation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">En cours de préparation</h2>
                <span className="text-xs bg-amber-100 dark:bg-amber-955 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg font-bold font-mono">
                  {preparationList.length}
                </span>
              </div>
              {searchQuery && (
                <p className="text-xs text-zinc-400">Filtre actif : "{searchQuery}"</p>
              )}
            </div>

            {sortedPage1List.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Aucune commande en préparation trouvée.</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Cliquez sur le bouton "+" en bas à droite pour créer votre première facture !</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedPage1List.map((invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    onStatusChange={handleStatusChange}
                    currentRole={currentRole}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAGE 2: En livraison */}
        {activeTab === 'En livraison' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Suivi des Livraisons</h2>
                <span className="text-xs bg-blue-100 dark:bg-blue-955 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-lg font-bold font-mono">
                  {livraisonList.length}
                </span>
              </div>
            </div>

            {filteredPage2List.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Aucune facture en cours de livraison trouvée.</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Associez un livreur à une facture "En préparation" à l'aide du bouton "+" pour la faire basculer ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPage2List.map((invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    onStatusChange={handleStatusChange}
                    currentRole={currentRole}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAGE 3: Livré */}
        {activeTab === 'Livré' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Commandes Livrées (Livré)</h2>
                <span className="text-xs bg-blue-50 dark:bg-zinc-900 text-blue-600 dark:text-blue-450 px-2 py-0.5 rounded-lg font-bold font-mono border border-blue-200 dark:border-zinc-800">
                  {livreList.length}
                </span>
              </div>
              
              {p3TreatedByFilter !== 'tous' && (
                <p className="text-xs text-zinc-400">Traité par : <span className="font-bold">{p3TreatedByFilter}</span></p>
              )}
            </div>

            {filteredPage3List.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Aucune commande livrée trouvée.</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Changez le statut d'une commande "En livraison" à "Livré" pour l'afficher ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPage3List.map((invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    onStatusChange={handleStatusChange}
                    currentRole={currentRole}
                    isPayPage={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAGE 4: Historique */}
        {activeTab === 'Historique' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-zinc-550 dark:text-zinc-400" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Historique des Factures (Payé & Annulé)</h2>
                <span className="text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-lg font-bold font-mono border border-zinc-200 dark:border-zinc-850">
                  {historiqueList.length}
                </span>
              </div>
              
              {p4TreatedByFilter !== 'tous' && (
                <p className="text-xs text-zinc-400">Traité par : <span className="font-bold">{p4TreatedByFilter}</span></p>
              )}
            </div>

            {/* Total summary board for Historique */}
            {filteredPage4List.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center space-x-2.5">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Chiffre d'Affaires Réglé ({p4TreatedByFilter === 'tous' ? 'Général' : `Filtre ${p4TreatedByFilter}`})</p>
                    <p className="text-xs text-zinc-400">Calculé en Dinar Algérien (DZD/DA)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-450">
                    {formatDZD(filteredPage4List.reduce((acc, curr) => {
                      if (curr.status !== 'Payé') return acc;
                      const itemsTotal = curr.items.reduce((s, it) => s + (it.price * it.qty), 0);
                      const computedTotal = Math.max(0, itemsTotal - (curr.discount || 0));
                      return acc + (curr.totalEncaisse ?? computedTotal);
                    }, 0))}
                  </p>
                </div>
              </div>
            )}

            {filteredPage4List.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Aucune facture archivée dans l'historique.</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Les factures annulées ou payées s'afficheront directement ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPage4List.map((invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    onStatusChange={handleStatusChange}
                    currentRole={currentRole}
                    isPayPage={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </>
    )}
      </main>

      {/* ----------------- 3. FLOATING ACTION BUTTONS (FAB) ----------------- */}
      
      {/* Page 1 (En préparation): Bottom-right FAB button */}
      {activeTab === 'En préparation' && !showSettings && (
        <div className="fixed bottom-24 right-6 z-30">
          <button
            type="button"
            id="fab-create-invoice"
            onClick={() => setIsCreateOpen(true)}
            className="w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shadow-lg shadow-amber-600/35 hover:scale-105 active:scale-95 transition duration-200 cursor-pointer"
            title="Créer une Facture de Vente"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* Page 2 (En livraison): Bottom-right FAB button */}
      {/* ROLE RESTRICTION: This button gives option to initiate Delivery or Direct Sale. */}
      {activeTab === 'En livraison' && !showSettings && (
        <div className="fixed bottom-24 right-6 z-30 flex flex-col items-end space-y-3">
          
          {/* Expandable sub-buttons overlay */}
          {showPage2SubMenu && (
            <div className="flex flex-col items-end space-y-2 mb-2 animate-fadeIn">
              {/* Option 1: Livraison */}
              <button
                type="button"
                id="fab-livraison"
                onClick={() => {
                  setIsLivraisonOpen(true);
                  setShowPage2SubMenu(false);
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md text-xs font-bold transition duration-150 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Livraison (Prép ➔ Livrer)</span>
              </button>

              {/* Option 2: Vendre */}
              <button
                type="button"
                id="fab-vendre"
                onClick={() => {
                  setIsVendreOpen(true);
                  setShowPage2SubMenu(false);
                }}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-md text-xs font-bold transition duration-150 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Vendre (Prép ➔ Payé)</span>
              </button>
            </div>
          )}

          {/* Core Toggle FAB button */}
          <button
            type="button"
            id="fab-page2-toggle"
            onClick={() => setShowPage2SubMenu(!showPage2SubMenu)}
            className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition duration-200 cursor-pointer"
            title="Options de livraison et vente"
          >
            <Plus className={`w-7 h-7 transition-transform duration-200 ${showPage2SubMenu ? 'rotate-45' : ''}`} />
          </button>
        </div>
      )}


      {/* ----------------- 4. PINNED BOTTOM NAVIGATION BAR ----------------- */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800 backdrop-blur-md flex items-center justify-around px-4 z-40 shadow-xl transition-all duration-200">
        <div className="w-full max-w-lg mx-auto flex justify-between items-center">
          
          {/* Tab 1: En préparation */}
          <button
            type="button"
            id="nav-tab-prep"
            onClick={() => {
              setActiveTab('En préparation');
              setShowPage2SubMenu(false);
              setShowSettings(false); // Return from Settings to Dashboard
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-3 rounded-2xl transition cursor-pointer relative ${
              activeTab === 'En préparation' && !showSettings
                ? 'text-amber-600 dark:text-amber-400 font-bold' 
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
            }`}
          >
            <div className="relative">
              <Clock className="w-5 h-5 mb-1" />
              {badgePrep > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.2 min-w-[16px] text-center">
                  {badgePrep}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">En préparation</span>
            {activeTab === 'En préparation' && !showSettings && (
              <span className="absolute bottom-0 w-8 h-0.75 bg-amber-550 rounded-full" />
            )}
          </button>

          {/* Tab 2: En livraison */}
          <button
            type="button"
            id="nav-tab-livr"
            onClick={() => {
              setActiveTab('En livraison');
              setShowPage2SubMenu(false);
              setShowSettings(false); // Return from Settings to Dashboard
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-3 rounded-2xl transition cursor-pointer relative ${
              activeTab === 'En livraison' && !showSettings
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
            }`}
          >
            <div className="relative">
              <Truck className="w-5 h-5 mb-1" />
              {badgeLiv > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.2 min-w-[16px] text-center">
                  {badgeLiv}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">En livraison</span>
            {activeTab === 'En livraison' && !showSettings && (
              <span className="absolute bottom-0 w-8 h-0.75 bg-blue-550 rounded-full" />
            )}
          </button>

          {/* Tab 3: Livré */}
          <button
            type="button"
            id="nav-tab-livre"
            onClick={() => {
              setActiveTab('Livré');
              setShowPage2SubMenu(false);
              setShowSettings(false); // Return from Settings to Dashboard
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-3 rounded-2xl transition cursor-pointer relative ${
              activeTab === 'Livré' && !showSettings
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
            }`}
          >
            <div className="relative">
              <CheckCircle className="w-5 h-5 mb-1" />
              {badgeLivre > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.2 min-w-[16px] text-center">
                  {badgeLivre}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Livré</span>
            {activeTab === 'Livré' && !showSettings && (
              <span className="absolute bottom-0 w-8 h-0.75 bg-blue-550 rounded-full" />
            )}
          </button>

          {/* Tab 4: Historique */}
          <button
            type="button"
            id="nav-tab-historique"
            onClick={() => {
              setActiveTab('Historique');
              setShowPage2SubMenu(false);
              setShowSettings(false); // Return from Settings to Dashboard
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-3 rounded-2xl transition cursor-pointer relative ${
              activeTab === 'Historique' && !showSettings
                ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
            }`}
          >
            <div className="relative">
              <History className="w-5 h-5 mb-1" />
              {badgeHistorique > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.2 min-w-[16px] text-center">
                  {badgeHistorique}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Historique</span>
            {activeTab === 'Historique' && !showSettings && (
              <span className="absolute bottom-0 w-8 h-0.75 bg-emerald-555 rounded-full" />
            )}
          </button>

        </div>
      </nav>

      {/* ----------------- 5. DIALOGS / POP-UPS MODALS ----------------- */}
      
      {/* 5.1 Create Invoice Dialog (Page 1 FAB "+" click) */}
      <CreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateInvoiceSubmit}
        currentRole={currentRole}
      />

      {/* 5.2 Expédier livraison dialog (Page 2 FAB sub "+" click -> Livraison) */}
      <LivraisonModal
        isOpen={isLivraisonOpen}
        onClose={() => setIsLivraisonOpen(false)}
        preparationInvoices={visibleInvoices.filter(i => i.status === 'En préparation')}
        onSubmit={handleLivraisonSubmit}
      />

      {/* 5.3 Encaisser vente dialog (Page 2 FAB sub "+" click -> Vendre) */}
      <VendreModal
        isOpen={isVendreOpen}
        onClose={() => setIsVendreOpen(false)}
        preparationInvoices={visibleInvoices.filter(i => i.status === 'En préparation')}
        onSubmit={handleVendreSubmit}
      />

      {/* 5.4. Create Employee Dialog Popup */}
      <CreateEmployeeModal
        isOpen={isCreateEmployeeOpen}
        onClose={() => setIsCreateEmployeeOpen(false)}
        onSubmit={handleCreateEmployeeSubmit}
      />

    </div>
  );
}
