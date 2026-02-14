
import React, { useState, useEffect } from 'react';
import { userService } from '../services/supabaseService';
import { UserProfile } from '../types';
import { Save, Users, Heart, Baby, ChefHat, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Family: React.FC = () => {
    const { t } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [familyName, setFamilyName] = useState('');
    const [householdSize, setHouseholdSize] = useState(1);
    const [dietaryInput, setDietaryInput] = useState('');
    const [restrictions, setRestrictions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const p = await userService.getProfile();
        if (p) {
            setProfile(p);
            setFamilyName(p.familyName || '');
            setHouseholdSize(p.preferences.householdSize || 1);
            setRestrictions(p.preferences.dietaryRestrictions || []);
        }
    };

    const addRestriction = () => {
        if (dietaryInput.trim() && !restrictions.includes(dietaryInput.trim())) {
            setRestrictions([...restrictions, dietaryInput.trim()]);
            setDietaryInput('');
        }
    };

    const removeRestriction = (tag: string) => {
        setRestrictions(restrictions.filter(r => r !== tag));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await userService.updateProfile({ familyName, householdSize, dietaryRestrictions: restrictions });
            await loadProfile();
            alert("Updated.");
        } catch (e) {
            alert("Error saving.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!profile) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand-900" /></div>;

    return (
        <div className="space-y-8 animate-fade-in pt-4 pb-20">
            <div className="glass-panel p-6 rounded-2xl">
                <h2 className="text-3xl font-bold text-brand-900 font-mono uppercase">{t('family.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Family Name */}
                <div className="glass-card p-8 rounded-xl relative overflow-hidden">
                     <Users size={60} className="absolute -bottom-4 -right-4 text-brand-900/5" />
                     <h3 className="text-sm font-bold text-brand-500 uppercase tracking-widest mb-4">{t('family.designation')}</h3>
                     <input 
                        type="text" 
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder="e.g. Anderson Residence"
                        className="w-full p-3 bg-brand-50 border border-brand-200 rounded-lg focus:outline-none focus:border-brand-900 font-bold text-brand-900 font-mono"
                     />
                </div>

                {/* Household Size */}
                <div className="glass-card p-8 rounded-xl relative overflow-hidden">
                     <Baby size={60} className="absolute -bottom-4 -right-4 text-brand-900/5" />
                     <h3 className="text-sm font-bold text-brand-500 uppercase tracking-widest mb-4">{t('family.occupants')}</h3>
                     <div className="flex items-center gap-4">
                        <button onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))} className="w-10 h-10 border border-brand-300 rounded hover:bg-brand-50">-</button>
                        <span className="text-4xl font-bold text-brand-900 font-mono">{householdSize}</span>
                         <button onClick={() => setHouseholdSize(householdSize + 1)} className="w-10 h-10 bg-brand-900 text-white rounded hover:bg-black">+</button>
                     </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="glass-card p-8 rounded-xl md:col-span-2 relative overflow-hidden">
                     <ChefHat size={60} className="absolute -bottom-4 -right-4 text-brand-900/5" />
                     <h3 className="text-sm font-bold text-brand-500 uppercase tracking-widest mb-4">{t('family.params')}</h3>
                     
                     <div className="flex flex-wrap gap-2 mb-6">
                         {restrictions.map(r => (
                             <span key={r} className="bg-brand-900 text-white px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-2">
                                 {r}
                                 <button onClick={() => removeRestriction(r)} className="hover:text-red-300">×</button>
                             </span>
                         ))}
                     </div>

                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={dietaryInput}
                            onChange={(e) => setDietaryInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addRestriction()}
                            placeholder={t('family.addFilter')}
                            className="flex-1 p-3 bg-brand-50 border border-brand-200 rounded-lg focus:outline-none focus:border-brand-900 font-bold text-brand-900 font-mono"
                        />
                        <button onClick={addRestriction} className="px-6 bg-brand-200 text-brand-900 font-bold rounded-lg hover:bg-brand-300 uppercase text-xs tracking-widest">{t('family.add')}</button>
                     </div>
                </div>
            </div>

            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-brand-900 text-white font-bold rounded-lg hover:bg-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-lg"
            >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                {t('family.commit')}
            </button>
        </div>
    );
};

export default Family;
