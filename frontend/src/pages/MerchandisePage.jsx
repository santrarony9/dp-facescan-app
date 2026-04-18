import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, ArrowLeft, Check, 
  Trash2, MessageCircle, Info, Frame, 
  Coffee, Key as KeyIcon, ChevronRight
} from 'lucide-react';

const products = [
  {
    id: 'frame',
    name: 'Premium Wood Frame',
    price: 999,
    description: 'High-quality teak finish with anti-glare glass. Perfect for your VIP portrait.',
    icon: Frame,
    image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'mug',
    name: 'Artisan Coffee Mug',
    price: 499,
    description: 'Ceramic matte finish. Your memory, every morning.',
    icon: Coffee,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'keyring',
    name: 'Artisan Key Ring',
    price: 299,
    description: 'Polished steel with a miniature version of your capture.',
    icon: KeyIcon,
    image: 'https://images.unsplash.com/photo-1584622781564-1d9876a13d1e?auto=format&fit=crop&q=80&w=400'
  }
];

const MerchandisePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const photoUrl = searchParams.get('photo');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const userMobile = localStorage.getItem('userMobile') || '';
  const userName = localStorage.getItem('userName') || 'VIP Client';

  const handleOrder = () => {
    if (!selectedProduct) return;
    
    const businessNumber = '919000000000'; // Placeholder - replace with actual number
    const message = `Hello Dreamline AI! I'd like to order:
*Product:* ${selectedProduct.name}
*Price:* ₹${selectedProduct.price}
*Photo URL:* ${photoUrl}
*Name:* ${userName}
*Mobile:* ${userMobile}`;
    
    const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit p-4 lg:p-12 pb-32 overflow-hidden relative">
      <div className="bg-blob w-full h-[500px] bg-primary/5 top-0 left-0 opacity-50 blur-[120px]" />
      
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-16 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-primary/40 transition-all group"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="text-center">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Shopping Salon</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em]">Merchandise & Prints</p>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
        
        {/* Left: Product Selection */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-black text-xs">1</div>
            <h2 className="text-xl font-black uppercase italic">Choose Your Product</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {products.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedProduct(p)}
                className={`p-6 rounded-3xl border text-left transition-all duration-500 relative overflow-hidden group ${
                  selectedProduct?.id === p.id 
                    ? 'bg-primary border-primary shadow-[0_0_40px_rgba(212,175,55,0.3)]' 
                    : 'bg-zinc-900/50 border-white/10 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`p-4 rounded-2xl transition-colors ${selectedProduct?.id === p.id ? 'bg-black text-primary' : 'bg-zinc-800 text-zinc-400 group-hover:text-primary'}`}>
                    <p.icon size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-black uppercase italic ${selectedProduct?.id === p.id ? 'text-black' : 'text-white'}`}>{p.name}</h3>
                    <p className={`text-xs font-bold ${selectedProduct?.id === p.id ? 'text-black/60' : 'text-zinc-500'}`}>₹{p.price}</p>
                  </div>
                  {selectedProduct?.id === p.id && (
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <Check className="text-primary" size={16} />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-black text-xs">2</div>
            <h2 className="text-xl font-black uppercase italic">Live Rendering</h2>
          </div>

          <div className="aspect-square rounded-[3rem] bg-zinc-900 border border-primary/20 relative overflow-hidden flex items-center justify-center p-12 luxury-shine shadow-2xl">
             <AnimatePresence mode="wait">
                {!selectedProduct ? (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center space-y-4"
                  >
                    <ShoppingBag className="w-16 h-16 text-zinc-800 mx-auto" />
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Select a product to preview</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key={selectedProduct.id}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                     {/* Dynamic Mockup Content */}
                     <div className="relative z-10 w-full h-full">
                        {selectedProduct.id === 'frame' && (
                           <div className="w-full h-full border-[12px] border-black shadow-2xl p-4 bg-white/5">
                              <img src={photoUrl} className="w-full h-full object-cover grayscale-[0.2]" alt="Preview" />
                           </div>
                        )}
                        {selectedProduct.id === 'mug' && (
                           <div className="w-full h-full flex flex-col items-center justify-center">
                             <div className="w-48 h-64 bg-zinc-800 rounded-t-[4rem] rounded-b-[2rem] border-4 border-zinc-700 relative overflow-hidden flex items-center justify-center">
                                <img src={photoUrl} className="w-full h-40 object-cover opacity-80" alt="Preview" />
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/20 via-transparent to-black/20" />
                             </div>
                             <div className="w-16 h-24 border-r-8 border-t-8 border-b-8 border-zinc-700 rounded-r-full -mr-40 -mt-48 z-0" />
                           </div>
                        )}
                        {selectedProduct.id === 'keyring' && (
                           <div className="w-full h-full flex flex-col items-center justify-center">
                              <div className="w-12 h-12 border-4 border-zinc-400 rounded-full mb-2" />
                              <div className="w-32 h-48 bg-zinc-400 rounded-2xl p-1 shadow-2xl">
                                 <img src={photoUrl} className="w-full h-full object-cover rounded-xl" alt="Preview" />
                              </div>
                           </div>
                        )}
                     </div>
                     <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full" />
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {selectedProduct && (
            <div className="space-y-6">
                <div className="bg-zinc-900/80 border border-white/5 p-6 rounded-3xl">
                   <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Item Specifications</h4>
                   <p className="text-sm text-white/80 leading-relaxed font-medium">{selectedProduct.description}</p>
                </div>
                
                <button 
                  onClick={handleOrder}
                  className="w-full btn-primary py-6 rounded-3xl shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-4 group"
                >
                   <span className="text-sm font-black italic">ORDER VIA WHATSAPP (₹{selectedProduct.price})</span>
                   <MessageCircle size={22} className="group-hover:rotate-12 transition-transform" />
                </button>
                <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Secure Direct-to-Artist Ordering</p>
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default MerchandisePage;
