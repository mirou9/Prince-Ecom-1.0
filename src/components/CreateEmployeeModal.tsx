import React, { useState } from 'react';
import { X, User, Phone, Briefcase, ToggleLeft, ShieldCheck, Lock } from 'lucide-react';
import { Employee } from '../types';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: Omit<Employee, 'id' | 'createdAt'>) => void;
}

export default function CreateEmployeeModal({ isOpen, onClose, onSubmit }: CreateEmployeeModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Vendeur');
  const [status, setStatus] = useState<'Actif' | 'Inactif'>('Actif');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Veuillez entrer le nom complet de l’employé.');
      return;
    }
    if (!phone.trim()) {
      setError('Veuillez entrer le numéro de téléphone de l’employé.');
      return;
    }
    if (!password.trim()) {
      setError('Veuillez entrer un mot de passe pour cet employé.');
      return;
    }

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      role,
      status,
      password: password.trim()
    });

    // Reset Form
    setName('');
    setPhone('');
    setRole('Vendeur');
    setStatus('Actif');
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop overlay with blur */}
      <div 
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-2xl bg-white p-6 shadow-2xl transition-all border border-zinc-150 animate-scaleIn">
          
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#171b34] text-[#f8ef1d] flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black tracking-tight text-zinc-900">
                Nouveau Personnel / Employé
              </h3>
            </div>
            
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Message */}
            {error && (
              <div className="p-2 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-red-100">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Field: Full Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Nom Complet <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Hichem Gherbi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#171b34]/15 focus:border-[#171b34] transition"
                />
              </div>
            </div>

            {/* Field: Phone Number */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Numéro de Téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="tel"
                  required
                  placeholder="Ex: 0555 12 34 56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#171b34]/15 focus:border-[#171b34] transition"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Mot de Passe de Connexion <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  placeholder="Créer un mot de passe d'accès"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#171b34]/15 focus:border-[#171b34] transition"
                />
              </div>
            </div>

            {/* Grid for Role and Status */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Field: Position Role */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Poste Occupé
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-2 top-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-7 pr-1 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#171b34]/15 focus:border-[#171b34] transition cursor-pointer"
                  >
                    <option value="Vendeur">Vendeur</option>
                    <option value="Livreur">Livreur</option>
                    <option value="Préparateur">Préparateur</option>
                    <option value="Manager & Gestion">Manager & Gestion</option>
                  </select>
                </div>
              </div>

              {/* Field: Account / Job Status */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Statut
                </label>
                <div className="relative">
                  <ToggleLeft className="absolute left-2 top-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Actif' | 'Inactif')}
                    className="w-full pl-7 pr-1 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#171b34]/15 focus:border-[#171b34] transition cursor-pointer"
                  >
                    <option value="Actif">🟢 Actif</option>
                    <option value="Inactif">🔴 Inactif</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Information Tips */}
            <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-500 leading-normal">
                Cet employé est autorisé à effectuer des ventes et s'identifier lors de l’encaissement des transactions.
              </p>
            </div>

            {/* Actions Footer */}
            <div className="flex space-x-2 justify-end pt-2 border-t border-zinc-100 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 text-zinc-650 hover:bg-zinc-50 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#171b34] hover:bg-[#171b34]/90 text-white transition cursor-pointer shadow-sm"
              >
                Valider & Enregistrer
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
