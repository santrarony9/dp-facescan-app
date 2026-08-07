import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, ArrowLeft, Check, 
  Coffee, Key as KeyIcon, Frame, MessageCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';

const products = [
  {
    id: 'frame',
    name: 'Premium Teak Wood Frame',
    price: 999,
    description: 'Teak finish with anti-glare museum glass. Custom sized for your VIP portrait.',
    icon: Frame,
  },
  {
    id: 'mug',
    name: 'Artisan Ceramic Mug',
    price: 499,
    description: 'Matte black ceramic finish. Your memories on your desk every morning.',
    icon: Coffee,
  },
  {
    id: 'keyring',
    name: 'Polished Steel Key Ring',
    price: 299,
    description: 'Polished stainless steel frame with acrylic-sealed portrait.',
    icon: KeyIcon,
  }
];

const MerchandisePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const photoUrl = searchParams.get('photo');
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const userMobile = localStorage.getItem('userMobile') || '';
  const userName = localStorage.getItem('userName') || 'VIP Client';

  const handleOrder = () => {
    if (!selectedProduct) return;
    
    const businessNumber = '918240054002'; // Dreamline Official WhatsApp Number
    const message = `Hello Dreamline Production! I would like to order custom merchandise:
*Product:* ${selectedProduct.name}
*Price:* ₹${selectedProduct.price}
*Photo URL:* ${photoUrl}
*Client Name:* ${userName}
*Mobile:* ${userMobile}`;
    
    const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit p-4 sm:p-8 pt-24 pb-20 overflow-hidden relative">
      <Navbar />

      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8 sm:mb-12 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-white/5 border border-white/10 hover:border-[#c5a059] transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tight">Merchandise Salon</h1>
          <p className="text-xs sm:text-sm text-[#c5a059] font-bold uppercase tracking-[0.3em]">Personalized Keepsakes & Prints</p>
        </div>
        <div className="w-10" />
      </div>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 relative z-10">
        
        {/* Product Selection */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#c5a059] flex items-center justify-center text-black font-black text-xs">1</div>
            <h2 className="text-lg font-black uppercase italic">Select Product</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {products.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedProduct(p)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden ${
                  selectedProduct?.id === p.id 
                    ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-[0_0_30px_rgba(197,160,89,0.3)]' 
                    : 'bg-zinc-900/60 border-white/10 hover:border-[#c5a059]/40'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-3 rounded-xl ${selectedProduct?.id === p.id ? 'bg-black text-[#c5a059]' : 'bg-zinc-800 text-zinc-400'}`}>
                    <p.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm sm:text-base font-black uppercase italic ${selectedProduct?.id === p.id ? 'text-black' : 'text-white'}`}>{p.name}</h3>
                    <p className={`text-xs font-bold ${selectedProduct?.id === p.id ? 'text-black/70' : 'text-zinc-400'}`}>₹{p.price}</p>
                  </div>
                  {selectedProduct?.id === p.id && (
                    <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                      <Check className="text-[#c5a059]" size={14} />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#c5a059] flex items-center justify-center text-black font-black text-xs">2</div>
            <h2 className="text-lg font-black uppercase italic">Live Preview</h2>
          </div>

          <div className="aspect-square max-w-[340px] mx-auto rounded-3xl bg-zinc-900 border border-[#c5a059]/30 relative overflow-hidden flex items-center justify-center p-6 shadow-2xl">
             <AnimatePresence mode="wait">
                {selectedProduct && (
                  <motion.div 
                    key={selectedProduct.id}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    {selectedProduct.id === 'frame' && (
                       <div className="w-full h-full border-[10px] border-black shadow-2xl p-2 bg-white/5">
                          <img src={photoUrl} className="w-full h-full object-cover" alt="Preview" />
                       </div>
                    )}
                    {selectedProduct.id === 'mug' && (
                       <div className="w-full h-full flex flex-col items-center justify-center">
                         <div className="w-36 h-48 bg-zinc-800 rounded-t-[3rem] rounded-b-[1.5rem] border-4 border-zinc-700 relative overflow-hidden flex items-center justify-center">
                            <img src={photoUrl} className="w-full h-32 object-cover opacity-85" alt="Preview" />
                         </div>
                       </div>
                    )}
                    {selectedProduct.id === 'keyring' && (
                       <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="w-10 h-10 border-4 border-zinc-400 rounded-full mb-2" />
                          <div className="w-28 h-40 bg-zinc-400 rounded-xl p-1 shadow-2xl">
                             <img src={photoUrl} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                          </div>
                       </div>
                    )}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {selectedProduct && (
            <div className="space-y-4">
                <div className="bg-zinc-900/60 border border-white/10 p-4 rounded-2xl">
                   <p className="text-xs text-zinc-300 leading-relaxed font-medium">{selectedProduct.description}</p>
                </div>
                
                <button 
                  onClick={handleOrder}
                  className="btn-primary w-full py-4 text-xs rounded-full shadow-[0_10px_25px_rgba(197,160,89,0.35)] flex items-center justify-center gap-2"
                >
                   <MessageCircle size={18} />
                   <span>ORDER VIA WHATSAPP (₹{selectedProduct.price})</span>
                </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MerchandisePage;
