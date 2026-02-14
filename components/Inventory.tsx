import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, Category, SubscriptionTier } from '../types';
import { Plus, Trash2, Loader2, X, ScanLine, Search, Save } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { inventoryService, userService } from '../services/supabaseService';

interface InventoryProps {
  items: InventoryItem[];
  onUpdate: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ items, onUpdate }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [userTier, setUserTier] = useState<SubscriptionTier>(SubscriptionTier.Free);

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

  const startCamera = async () => {
    if (userTier === SubscriptionTier.Free) {
        alert("Smart Scan is available on Standard, Pro, and Pro Max plans. Please upgrade to scan items automatically.");
        return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
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
      const detectedItems = await geminiService.analyzeImage(base64);
      
      for (const item of detectedItems) {
        if (item.name && item.category) {
            await inventoryService.addItem({
                name: item.name,
                category: item.category as Category,
                quantity: item.quantity || '1',
                daysUntilExpiry: item.daysUntilExpiry || 7,
                addedDate: new Date().toISOString(),
                status: 'active'
            });
        }
      }
      onUpdate(); 
    } catch (error) {
      alert("Analysis Protocol Failed. Retrying...");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleManualAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newItemName) return;

      // Simple day calc
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

  const filteredItems = items
    .filter(i => filter === 'All' || i.category === filter)
    .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in pt-2">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
        <div>
            <h2 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tight">My Kitchen</h2>
            <p className="text-brand-500 mt-2 md:mt-3 font-bold text-base md:text-lg">Manage your ingredients intelligently.</p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
            <button 
                onClick={startCamera}
                disabled={isAnalyzing}
                className={`flex-1 md:flex-none flex items-center justify-center px-6 md:px-8 py-4 md:py-5 font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
                    userTier === SubscriptionTier.Free 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#003385] text-white shadow-blue-900/30 hover:bg-[#00255c] hover:scale-[1.02]'
                }`}
            >
                {isAnalyzing ? <Loader2 className="animate-spin mr-2 md:mr-3" size={20} /> : <ScanLine className="mr-2 md:mr-3" size={20} />}
                {isAnalyzing ? 'Scanning...' : 'Smart Scan'}
            </button>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-14 h-14 md:w-16 md:h-16 bg-white border-2 border-brand-100 text-brand-700 rounded-2xl shadow-sm hover:shadow-lg flex items-center justify-center transition-all hover:scale-[1.05]"
            >
                <Plus size={24} strokeWidth={3} className="md:w-7 md:h-7" />
            </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center bg-white p-3 rounded-[2rem] shadow-sm border border-brand-50">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search items..." 
                className="w-full pl-14 pr-6 py-3 md:py-4 bg-transparent focus:outline-none text-brand-900 font-bold placeholder-gray-300 text-base md:text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex overflow-x-auto gap-2 md:gap-3 p-1 w-full md:w-auto scrollbar-hide no-scrollbar">
            {['All', ...Object.values(Category)].map(cat => (
            <button
                key={cat}
                onClick={() => setFilter(cat as Category | 'All')}
                className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all uppercase tracking-wide flex-shrink-0 ${
                filter === cat 
                    ? 'bg-brand-100 text-brand-900 shadow-inner' 
                    : 'bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
            >
                {cat}
            </button>
            ))}
        </div>
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-soft border border-brand-50 hover:shadow-xl hover:-translate-y-2 transition-all group relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <span className={`text-[10px] md:text-[11px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-100`}>
                    {item.category}
                </span>
                <button onClick={() => handleDelete(item.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-100 hover:text-red-600">
                    <Trash2 size={18} />
                </button>
            </div>
            
            <h3 className="font-bold text-xl md:text-2xl text-brand-900 mb-2 leading-tight">{item.name}</h3>
            <p className="text-gray-400 text-sm mb-6 md:mb-8 font-bold">Qty: <span className="text-brand-600">{item.quantity}</span></p>
            
            <div className="mt-auto pt-4 border-t border-gray-50">
                 <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${
                        (item.daysUntilExpiry || 0) < 3 ? 'bg-red-500 animate-pulse shadow-red-200' : 
                        (item.daysUntilExpiry || 0) < 7 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                        (item.daysUntilExpiry || 0) < 3 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                        {item.daysUntilExpiry} days left
                    </span>
                 </div>
            </div>
          </div>
        ))}
        
        {filteredItems.length === 0 && (
            <div className="col-span-full py-16 md:py-24 text-center bg-white/50 rounded-[2.5rem] border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="text-brand-300" size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-brand-900">No items found</h3>
                <p className="text-gray-400 mt-2 font-medium text-sm md:text-base">Try adding some items or adjusting your search.</p>
            </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] bg-[#00163b]/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white w-full max-w-lg p-6 md:p-10 rounded-[2.5rem] shadow-2xl animate-fade-in my-auto">
                  <div className="flex justify-between items-center mb-6 md:mb-8">
                      <h3 className="text-2xl md:text-3xl font-bold text-brand-900">Add Item</h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleManualAdd} className="space-y-4 md:space-y-6">
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Name</label>
                          <input required type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-4 md:p-5 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#003385] font-bold text-brand-900" placeholder="e.g., Cheddar Cheese" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:gap-6">
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Category</label>
                            <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value as Category)} className="w-full p-4 md:p-5 bg-gray-50 rounded-2xl focus:outline-none appearance-none font-bold text-brand-900">
                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Qty</label>
                            <input type="text" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} className="w-full p-4 md:p-5 bg-gray-50 rounded-2xl focus:outline-none font-bold text-brand-900" placeholder="e.g. 500g" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Expiry Date</label>
                          <input type="date" value={newItemExpiry} onChange={e => setNewItemExpiry(e.target.value)} className="w-full p-4 md:p-5 bg-gray-50 rounded-2xl focus:outline-none font-bold text-brand-900" />
                      </div>
                      <button type="submit" className="w-full py-4 md:py-5 bg-[#003385] text-white font-bold rounded-2xl mt-4 hover:bg-[#00255c] flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-900/20">
                          <Save size={20} /> Save Item
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-0 md:p-10">
          <div className="relative w-full h-full md:max-w-xl md:h-auto md:aspect-[3/4] bg-black md:rounded-[3rem] overflow-hidden shadow-2xl ring-4 ring-white/10">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-12 z-10 pb-safe-bottom">
                <button 
                    onClick={stopCamera} 
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                    <X size={28} />
                </button>
                <button 
                    onClick={captureAndAnalyze} 
                    className="w-24 h-24 rounded-full bg-white border-[8px] border-gray-300 hover:scale-105 transition-transform flex items-center justify-center"
                >
                    <div className="w-20 h-20 rounded-full border-2 border-black/10" />
                </button>
            </div>
            
            <div className="absolute top-10 left-0 right-0 text-center pt-safe-top">
                 <span className="bg-black/40 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-bold tracking-wide border border-white/10">
                    ALIGN FOOD ITEMS
                 </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Analysis Loader Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[70] bg-white/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#003385] blur-3xl opacity-20 animate-pulse rounded-full"></div>
                <Loader2 className="animate-spin text-[#003385] relative z-10" size={60} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-brand-900">Analyzing</h3>
            <p className="text-gray-500 mt-3 font-medium tracking-wide">Gemini AI is identifying ingredients...</p>
        </div>
      )}
    </div>
  );
};

export default Inventory;