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
    description: 'Matte white ceramic finish. Your memories on your desk every morning.',
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handleOrder = async () => {
    if (!selectedProduct) return;
    setIsProcessing(true);

    try {
      const { paymentApi } = await import('../api/api');
      
      const orderData = {
        customerName: userName,
        customerMobile: userMobile,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        amount: selectedProduct.price,
        photoUrl: photoUrl
      };

      const { data } = await paymentApi.createOrder(orderData);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Dreamline Production',
        description: selectedProduct.name,
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            await paymentApi.verifyPayment({
              orderId: data.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setIsSuccess(true);
            
            // Optional: Still open WhatsApp to notify them immediately
            const businessNumber = '918240054002';
            const message = `Hello Dreamline Production! I just paid for custom merchandise:
*Product:* ${selectedProduct.name}
*Price:* ₹${selectedProduct.price}
*Payment ID:* ${response.razorpay_payment_id}
*Client Name:* ${userName}
*Mobile:* ${userMobile}`;
            const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            
          } catch (error) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userName,
          contact: userMobile
        },
        theme: {
          color: '#2563EB' // blue-600
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (error) {
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-outfit p-4 sm:p-8 pt-24 pb-20 overflow-hidden relative">
      <Navbar />

      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8 sm:mb-12 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900">Merchandise Salon</h1>
          <p className="text-xs sm:text-sm text-blue-600 font-bold uppercase tracking-[0.2em] mt-1">Personalized Keepsakes & Prints</p>
        </div>
        <div className="w-10" />
      </div>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 relative z-10">
        
        {/* Product Selection */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">1</div>
            <h2 className="text-lg font-bold uppercase text-slate-800">Select Product</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {products.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedProduct(p)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden shadow-sm ${
                  selectedProduct?.id === p.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.2)]' 
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-3 rounded-xl ${selectedProduct?.id === p.id ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                    <p.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm sm:text-base font-bold uppercase ${selectedProduct?.id === p.id ? 'text-white' : 'text-slate-800'}`}>{p.name}</h3>
                    <p className={`text-sm font-medium mt-0.5 ${selectedProduct?.id === p.id ? 'text-blue-100' : 'text-slate-500'}`}>₹{p.price}</p>
                  </div>
                  {selectedProduct?.id === p.id && (
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                      <Check className="text-blue-600" size={16} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">2</div>
            <h2 className="text-lg font-bold uppercase text-slate-800">Live Preview</h2>
          </div>

          <div className="aspect-square max-w-[380px] mx-auto rounded-3xl bg-white border border-slate-200 relative overflow-hidden flex items-center justify-center p-8 shadow-sm">
             <AnimatePresence mode="wait">
                {selectedProduct && (
                  <motion.div 
                    key={selectedProduct.id}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    {selectedProduct.id === 'frame' && (
                       <div className="w-full h-full border-[12px] border-slate-800 shadow-2xl p-3 bg-white">
                          <img src={photoUrl} className="w-full h-full object-cover" alt="Preview" />
                       </div>
                    )}
                    {selectedProduct.id === 'mug' && (
                       <div className="w-full h-full flex flex-col items-center justify-center">
                         <div className="w-36 h-48 bg-white rounded-t-[3rem] rounded-b-[1.5rem] border border-slate-200 relative overflow-hidden flex items-center justify-center shadow-lg">
                            <img src={photoUrl} className="w-full h-32 object-cover opacity-90" alt="Preview" />
                         </div>
                       </div>
                    )}
                    {selectedProduct.id === 'keyring' && (
                       <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="w-10 h-10 border-[5px] border-slate-300 rounded-full mb-2" />
                          <div className="w-28 h-40 bg-slate-300 rounded-xl p-1 shadow-xl">
                             <img src={photoUrl} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                          </div>
                       </div>
                    )}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {selectedProduct && (
            <div className="space-y-4 pt-2">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedProduct.description}</p>
                </div>
                
                <button 
                  onClick={handleOrder}
                  className="w-full py-4 bg-[#25D366] hover:bg-[#1ebd5b] text-white text-sm font-bold rounded-xl shadow-md shadow-green-600/20 transition-all flex items-center justify-center gap-2"
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
