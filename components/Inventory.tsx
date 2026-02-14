
import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, Category, SubscriptionTier } from '../types';
import { Plus, Trash2, Loader2, X, ScanLine, Search, Save, Activity, Filter, Receipt, Camera, ChevronDown } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { inventoryService, userService } from '../services/supabaseService';
import { useLanguage } from '../contexts/LanguageContext';

interface InventoryProps {
  items: InventoryItem[];
  onUpdate: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ items, onUpdate }) => {
  const { t } = useLanguage();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [userTier, setUserTier] = useState<SubscriptionTier>(SubscriptionTier.Free);
  const [analyzingNutritionId, setAnalyzingNutritionId] = useState<string | null>(null);
  
  // Scanning Mode
  const [scanMode, setScanMode] = useState<'food' | 'receipt'>('food');

  // Manual Add Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>(Category.Other);
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemExpiry, setNewItemExpiry] = useState('');

  useEffect(() => {
    userService.getProfile().then(p => {
        if(p) setUserTier(p.subscriptionTier);
    });
  }, []);

  const startCamera = async (mode: 'food' | 'receipt') => {
    if (userTier === SubscriptionTier.Free) {
        alert("Smart Scan is available on Standard, Pro, and Pro Max plans. Please upgrade.");
        return;
    }
    
    // Receipt scanning is Pro/ProMax only
    if (mode === 'receipt' && (userTier !== SubscriptionTier.Pro && userTier !== SubscriptionTier.ProMax)) {
        alert("Receipt Scanning is a Pro feature.");
        return;
    }

    setScanMode(mode);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      alert("System Error: Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
    stopCamera(); 
    setIsAnalyzing(true);
    
    try {
      let detectedItems: Partial<InventoryItem>[] = [];
      
      if (scanMode === 'receipt') {
          detectedItems = await geminiService.analyzeReceipt(base64);
      } else {
          detectedItems = await geminiService.analyzeImage(base64);
      }

      if (detectedItems.length === 0) {
          alert("No items detected. Try again.");
          setIsAnalyzing(false);
          return;
      }

      let count = 0;
      for (const item of detectedItems) {
        if (item.name && item.category) {
            await inventoryService.addItem({
                name: item.name,
                category: (item.category as Category) || Category.Other,
                quantity: item.quantity || '1',
                daysUntilExpiry: item.daysUntilExpiry || 7,
                addedDate: new Date().toISOString(),
                status: 'active'
            });
            count++;
        }
      }
      alert(`${t('inventory.analysisComplete')}: ${count} ${t('inventory.itemsAdded')}`);
      onUpdate(); 
    } catch (error) {
      alert("Analysis Protocol Failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleManualAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newItemName) return;
      let daysUntil = 7;
      if (newItemExpiry) {
          const diff = new Date(newItemExpiry).getTime() - new Date().getTime();
          daysUntil = Math.ceil(diff / (1000 * 3600 * 24));
      }
      await inventoryService.addItem({
          name: newItemName,
          category: newItemCategory,
          quantity: newItemQuantity || '1',
          daysUntilExpiry: daysUntil,
          expiryDate: newItemExpiry,
          addedDate: new Date().toISOString(),
          status: 'active'
      });
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemExpiry('');
      setIsAddModalOpen(false);
      onUpdate();
  };

  const handleDelete = async (id: string) => {
      await inventoryService.deleteItem(id);
      onUpdate();
  }

  const handleNutritionAnalysis = async (item: InventoryItem) => {
      if (userTier !== SubscriptionTier.ProMax) {
          alert("Deep Nutrition Analysis is a Pro Max feature.");
          return;
      }
      setAnalyzingNutritionId(item.id);
      try {
          const data = await geminiService.getNutritionAnalysis(item.name);
          alert(`Analysis for ${item.name}:\n\nEnergy: ${data.calories}\nBenefits: ${data.benefits}\n${data.warning ? `Note: ${data.warning}` : ''}`);
      } catch (e) {
          alert("Analysis failed.");
      } finally {
          setAnalyzingNutritionId(null);
      }
  }

  const filteredItems = items
    .filter(i => filter === 'All' || i.category === filter)
    .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-brand-900 tracking-tight">{t('inventory.title')}</h2>
        </div>
        <div className="flex w-full md:w-auto gap-3">
            {/* SCANNING OPTIONS */}
            <div className="flex gap-2">
                <button 
                    onClick={() => startCamera('food')}
                    disabled={isAnalyzing}
                    className={`flex items-center justify-center px-4 py-3 font-bold rounded-lg transition-all border border-brand-900 ${
                        userTier === SubscriptionTier.Free 
                        ? 'bg-transparent text-gray-500 border-gray-300 cursor-not-allowed'
                        : 'bg-brand-900 text-white hover:bg-brand-800 shadow-lg'
                    }`}
                >
                    {isAnalyzing ? <Loader2 className="animate-spin mr-2" size={18} /> : <ScanLine className="mr-2" size={18} />}
                    <span className="hidden md:inline">{t('inventory.scan')}</span>
                </button>
                <button 
                    onClick={() => startCamera('receipt')}
                    disabled={isAnalyzing}
                    className={`flex items-center justify-center px-4 py-3 font-bold rounded-lg transition-all border border-brand-900 ${
                        userTier === SubscriptionTier.Pro || userTier === SubscriptionTier.ProMax
                        ? 'bg-white text-brand-900 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                >
                    {isAnalyzing ? <Loader2 className="animate-spin mr-2" size={18} /> : <Receipt className="mr-2" size={18} />}
                    <span className="hidden md:inline">{t('inventory.scanReceipt')}</span>
                </button>
            </div>
            
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-12 h-12 bg-white text-brand-900 border border-brand-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
                <Plus size={24} />
            </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="glass-panel p-3 rounded-xl flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder={t('inventory.search')}
                className="w-full pl-12 pr-4 py-2 bg-transparent focus:outline-none text-brand-900 font-bold placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="w-px h-8 bg-gray-300 hidden md:block"></div>
        <div className="flex overflow-x-auto gap-2 w-full md:w-auto no-scrollbar">
            {['All', ...Object.values(Category)].map(cat => (
            <button
                key={cat}
                onClick={() => setFilter(cat as Category | 'All')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap uppercase tracking-wider border ${
                filter === cat 
                    ? 'bg-brand-900 text-white border-brand-900' 
                    : 'bg-transparent text-gray-500 border-transparent hover:bg-black/5'
                }`}
            >
                {cat === 'All' ? t('inventory.all') : cat}
            </button>
            ))}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="glass-card p-6 rounded-xl flex flex-col h-full group relative">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border border-brand-200 text-brand-500 bg-white/50">
                    {item.category}
                </span>
                <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
            
            <h3 className="font-bold text-xl text-brand-900 mb-1">{item.name}</h3>
            <p className="text-brand-500 text-sm font-bold font-mono">{t('inventory.qty')}: {item.quantity}</p>
            
            <div className="mt-auto pt-4 border-t border-brand-100/50 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                        (item.daysUntilExpiry || 0) < 3 ? 'bg-red-500' : 
                        (item.daysUntilExpiry || 0) < 7 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-xs font-bold uppercase text-brand-400">
                        {item.daysUntilExpiry} {t('inventory.days')}
                    </span>
                 </div>
                 
                 {userTier === SubscriptionTier.ProMax && (
                     <button 
                        onClick={() => handleNutritionAnalysis(item)}
                        disabled={analyzingNutritionId === item.id}
                        className="text-brand-400 hover:text-brand-900 p-1"
                     >
                        {analyzingNutritionId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                     </button>
                 )}
            </div>
          </div>
        ))}
      </div>
        
      {filteredItems.length === 0 && (
            <div className="py-20 text-center glass-panel rounded-2xl border-dashed border-2 border-brand-300">
                <Search className="mx-auto text-brand-300 mb-4" size={40} />
                <h3 className="text-xl font-bold text-brand-900">{t('inventory.noEntries')}</h3>
            </div>
      )}

      {/* Manual Add Modal - Industrial Style */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] bg-brand-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/20 animate-fade-in relative">
                  <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-brand-900"><X size={20} /></button>
                  <h3 className="text-2xl font-bold text-brand-900 mb-6 font-mono">{t('inventory.manualAdd')}</h3>
                  
                  <form onSubmit={handleManualAdd} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-brand-400 uppercase tracking-widest block mb-2">{t('inventory.itemName')}</label>
                          <input required type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-3 bg-brand-50 border border-brand-200 rounded-lg focus:outline-none focus:border-brand-900 font-bold text-brand-900" placeholder="Ex: Milk" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-brand-400 uppercase tracking-widest block mb-2">{t('inventory.category')}</label>
                            <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value as Category)} className="w-full p-3 bg-brand-50 border border-brand-200 rounded-lg focus:outline-none font-bold text-brand-900">
                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-brand-400 uppercase tracking-widest block mb-2">{t('inventory.quantity')}</label>
                            <input type="text" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} className="w-full p-3 bg-brand-50 border border-brand-200 rounded-lg focus:outline-none font-bold text-brand-900" placeholder="Ex: 1L" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-brand-400 uppercase tracking-widest block mb-2">{t('inventory.expiryDate')}</label>
                          <input type="date" value={newItemExpiry} onChange={e => setNewItemExpiry(e.target.value)} className="w-full p-3 bg-brand-50 border border-brand-200 rounded-lg focus:outline-none font-bold text-brand-900" />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-900 text-white font-bold rounded-lg mt-2 hover:bg-black transition-colors flex items-center justify-center gap-2">
                          <Save size={18} /> {t('inventory.confirmEntry')}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-0 md:p-8">
          <div className="relative w-full h-full md:max-w-lg md:h-auto md:aspect-[3/4] bg-black md:rounded-3xl overflow-hidden ring-1 ring-white/20">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
            
            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none border-[2px] border-white/30 m-8 rounded-2xl flex flex-col justify-between p-4">
                 <div className="flex justify-between text-xs font-mono text-white/70">
                     <span className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                         REC: ON
                     </span>
                     <span>ISO 800</span>
                 </div>
                 
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
                     {scanMode === 'receipt' ? (
                         <div className="border-t-2 border-b-2 border-white/30 h-64 w-4/5 mx-auto flex items-center justify-center">
                             <p className="bg-black/50 px-2 py-1 text-xs font-mono text-white">{t('inventory.receiptMode')}</p>
                         </div>
                     ) : (
                         <div className="border-2 border-white/30 w-48 h-48 mx-auto rounded-full flex items-center justify-center">
                             <p className="bg-black/50 px-2 py-1 text-xs font-mono text-white">{t('inventory.foodMode')}</p>
                         </div>
                     )}
                 </div>

                 <div className="text-center text-xs font-mono text-white/70">TARGET ACQUISITION</div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 z-10">
                <button onClick={stopCamera} className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all">
                    <X size={24} />
                </button>
                <button onClick={captureAndAnalyze} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 hover:bg-white/30 transition-all">
                    <div className="w-16 h-16 bg-white rounded-full"></div>
                </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[70] bg-brand-900/90 backdrop-blur-md flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-white mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white font-mono tracking-widest">{t('inventory.scanning')}</h3>
        </div>
      )}
    </div>
  );
};

export default Inventory;
