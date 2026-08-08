import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, ArrowLeft, Check, 
  Coffee, Key as KeyIcon, Frame, MessageCircle, Shirt, Image as ImageIcon, QrCode,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import QRCode from 'react-qr-code';
import Navbar from '../components/Navbar';
import { galleryApi } from '../api/api';

const getIcon = (iconType) => {
  switch(iconType) {
    case 'frame': return Frame;
    case 'mug': return Coffee;
    case 'keyring': return KeyIcon;
    case 'shirt': return Shirt;
    case 'photo': return ImageIcon;
    default: return ShoppingBag;
  }
};

const MerchandisePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const photoUrl = searchParams.get('photo');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Customization state
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  
  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const userMobile = localStorage.getItem('userMobile') || '';
  const userName = localStorage.getItem('userName') || 'VIP Client';
  const upiId = '8240054002@yescred';

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedSize(selectedProduct.sizes?.[0] || null);
      setSelectedColor(selectedProduct.colors?.[0] || '');
      setCurrentImageIndex(0);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const res = await galleryApi.getPublicMerchandise();
      setProducts(res.data);
      if (res.data.length > 0) {
        setSelectedProduct(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch merchandise');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = () => {
    if (!selectedProduct) return;
    
    if (selectedProduct.sizes?.length > 0 && !selectedSize) {
      alert("Please select a size first.");
      return;
    }
    if (selectedProduct.colors?.length > 0 && !selectedColor) {
      alert("Please select a color first.");
      return;
    }
    
    setShowPaymentModal(true);
  };

  const currentPrice = selectedSize && selectedSize.price ? selectedSize.price : (selectedProduct?.basePrice || 0);

  const handleConfirmWhatsApp = (isPaid) => {
    const businessNumber = '918240054002'; // Dreamline Official WhatsApp Number
    
    const sizeText = selectedSize ? `\n*Size:* ${selectedSize.name}` : '';
    const colorText = selectedProduct.colors?.length > 0 ? `\n*Color:* ${selectedColor}` : '';
    const paymentText = isPaid ? `\n*Payment Status:* ✅ Paid via UPI` : `\n*Payment Status:* ❌ Pending (Will pay later)`;
    
    const message = `Hello Dreamline Production! I would like to order custom merchandise:
*Product:* ${selectedProduct.name}
*Price:* ₹${currentPrice}${sizeText}${colorText}
*Photo URL:* ${photoUrl}
*Client Name:* ${userName}
*Mobile:* ${userMobile}${paymentText}`;
    
    const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowPaymentModal(false);
  };

  const upiUri = selectedProduct ? `upi://pay?pa=${upiId}&pn=Dreamline%20Production&am=${currentPrice}&cu=INR` : '';

  const nextImage = () => {
    if (selectedProduct?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
    }
  };

  const prevImage = () => {
    if (selectedProduct?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-outfit p-4 sm:p-8 pt-24 pb-20 overflow-hidden relative">
      <Navbar />

      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8 sm:mb-12 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm text-slate-700"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900">Merchandise</h1>
          <p className="text-xs sm:text-sm text-blue-600 font-bold uppercase tracking-[0.2em] mt-1">Premium Quality Prints</p>
        </div>
        <div className="w-10" />
      </div>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 relative z-10">
        
        {/* Left Column: Product Selection */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">1</div>
              <h2 className="text-lg font-bold uppercase">Select Item</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
                <ShoppingBag className="mx-auto text-slate-400 mb-3" size={32} />
                <p className="text-slate-500 font-medium">No merchandise available right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {products.map((p) => {
                  const Icon = getIcon(p.iconType);
                  const isSelected = selectedProduct?._id === p._id;
                  
                  return (
                    <motion.button
                      key={p._id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedProduct(p)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        {p.images && p.images.length > 0 ? (
                           <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-200">
                             <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                           </div>
                        ) : (
                           <div className={`p-4 flex-shrink-0 rounded-xl shadow-sm ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                             <Icon size={24} />
                           </div>
                        )}
                        <div className="flex-1">
                          <h3 className={`text-sm sm:text-base font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{p.name}</h3>
                          <p className={`text-xs font-bold mt-0.5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>From ₹{p.basePrice}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                            <Check className="text-white" size={14} />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview & Options */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">2</div>
            <h2 className="text-lg font-bold uppercase">Customize & Preview</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Image Preview Carousel */}
            <div className="w-full md:w-1/2 relative bg-slate-100 min-h-[300px] flex items-center justify-center group">
               <AnimatePresence mode="wait">
                 {selectedProduct?.images?.length > 0 ? (
                    <motion.img 
                      key={currentImageIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      src={selectedProduct.images[currentImageIndex]}
                      className="w-full h-full object-cover absolute inset-0"
                      alt={`${selectedProduct.name} preview`}
                    />
                 ) : (
                   <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="relative w-full h-full flex flex-col items-center justify-center p-8"
                   >
                     {selectedProduct?.iconType === 'frame' && (
                        <div className="w-full max-w-[200px] aspect-[3/4] border-[12px] border-slate-900 shadow-2xl p-2 bg-white">
                           <img src={photoUrl} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                     )}
                     {selectedProduct?.iconType === 'mug' && (
                        <div className="w-36 h-48 rounded-t-[3rem] rounded-b-[1.5rem] border-4 bg-white border-slate-100 overflow-hidden shadow-lg">
                           <img src={photoUrl} className="w-full h-32 object-cover opacity-90 mix-blend-multiply" alt="Preview" />
                        </div>
                     )}
                     {(selectedProduct?.iconType === 'keyring' || selectedProduct?.iconType === 'photo' || selectedProduct?.iconType === 'shirt') && (
                        <img src={photoUrl} className="max-w-[80%] max-h-[80%] object-contain rounded-xl drop-shadow-xl" alt="Preview" />
                     )}
                     {(!selectedProduct) && <ImageIcon size={48} className="text-slate-300" />}
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Carousel Controls */}
               {selectedProduct?.images?.length > 1 && (
                 <>
                   <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronLeft size={18} />
                   </button>
                   <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronRight size={18} />
                   </button>
                   <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                     {selectedProduct.images.map((_, i) => (
                       <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-white/60'}`} />
                     ))}
                   </div>
                 </>
               )}
               
               {/* Selected Photo Thumbnail */}
               {selectedProduct?.images?.length > 0 && photoUrl && (
                 <div className="absolute top-4 right-4 w-16 h-16 rounded-xl border-2 border-white shadow-lg overflow-hidden bg-slate-900">
                    <img src={photoUrl} className="w-full h-full object-cover" alt="Selected" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[8px] text-white text-center py-0.5 font-bold uppercase tracking-wider">Your Photo</div>
                 </div>
               )}
            </div>

            {/* Options Panel */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col h-full bg-white">
               {selectedProduct ? (
                 <>
                   <div className="mb-6">
                     <h3 className="text-2xl font-black text-slate-900 mb-2">{selectedProduct.name}</h3>
                     <p className="text-sm text-slate-500 leading-relaxed font-medium">{selectedProduct.description}</p>
                     <div className="mt-4 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-lg font-black tracking-tight">
                       ₹{currentPrice}
                     </div>
                   </div>

                   {/* Dynamic Size Selection */}
                   {selectedProduct.sizes?.length > 0 && (
                     <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Size</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sizes.map((sizeObj, idx) => (
                             <button 
                               key={idx}
                               onClick={() => setSelectedSize(sizeObj)}
                               className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-start gap-0.5 ${
                                 selectedSize?.name === sizeObj.name 
                                   ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                                   : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                               }`}
                             >
                               <span>{sizeObj.name}</span>
                               {sizeObj.price && sizeObj.price !== selectedProduct.basePrice && (
                                  <span className={`text-[10px] ${selectedSize?.name === sizeObj.name ? 'text-blue-100' : 'text-slate-400'}`}>₹{sizeObj.price}</span>
                               )}
                             </button>
                          ))}
                        </div>
                     </div>
                   )}

                   {/* Dynamic Color Selection */}
                   {selectedProduct.colors?.length > 0 && (
                     <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Color</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.colors.map(color => (
                             <button 
                               key={color}
                               onClick={() => setSelectedColor(color)}
                               className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                 selectedColor === color 
                                   ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                   : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                               }`}
                             >
                               {color}
                             </button>
                          ))}
                        </div>
                     </div>
                   )}

                   <div className="mt-auto pt-4">
                     <button 
                       onClick={handleOpenPayment}
                       className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                     >
                        <QrCode size={18} />
                        <span>PROCEED TO PAYMENT (₹{currentPrice})</span>
                     </button>
                   </div>
                 </>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                   <ShoppingBag size={48} className="mb-4 opacity-50" />
                   <p className="font-medium">Select a product to customize</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative z-[110]"
             >
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div>
                   <h3 className="text-xl font-black text-slate-900">Complete Payment</h3>
                   <p className="text-sm text-slate-500 font-medium mt-1">Total Amount: <strong className="text-blue-600 text-base font-black">₹{currentPrice}</strong></p>
                 </div>
                 <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full border border-slate-200 shadow-sm">
                   <ArrowLeft size={18} />
                 </button>
               </div>
               
               <div className="p-6 sm:p-8 flex flex-col items-center">
                 <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider text-center">Scan to Pay via UPI</p>
                 
                 <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-lg mb-6 inline-block">
                    <QRCode value={upiUri} size={180} fgColor="#0f172a" />
                 </div>

                 <p className="text-xs font-bold text-slate-400 mb-6 text-center max-w-[200px] leading-relaxed">
                   Open GPay, PhonePe, or Paytm and scan this QR code.
                 </p>
                 
                 <div className="w-full flex flex-col gap-3">
                   <a 
                     href={upiUri}
                     className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm text-center shadow-md flex items-center justify-center gap-2 lg:hidden"
                   >
                     Pay via UPI App
                   </a>

                   <button 
                     onClick={() => handleConfirmWhatsApp(true)}
                     className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm text-center shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-colors"
                   >
                     <MessageCircle size={18} />
                     I've Paid — Send to WhatsApp
                   </button>

                   <button 
                     onClick={() => handleConfirmWhatsApp(false)}
                     className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-sm text-center mt-2"
                   >
                     Pay Later & Send Query
                   </button>
                 </div>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MerchandisePage;
