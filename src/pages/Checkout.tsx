import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { X } from 'lucide-react';

export default function Checkout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [showWhishModal, setShowWhishModal] = useState(false);

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method === 'whish') {
      setShowWhishModal(true);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send user details to admin panel
      await addDoc(collection(db, 'checkout_requests'), {
        name,
        email,
        paymentMethod,
        userId: currentUser?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      if (paymentMethod === 'whish') {
        navigate('/thank-you');
      } else {
        // Mock card payment
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/thank-you');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout. Please try again.');
      handleFirestoreError(error, OperationType.CREATE, 'checkout_requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface text-on-surface py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-surface-container rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10">
          <h1 className="font-headline font-black text-4xl mb-8 text-center uppercase tracking-tighter">
            Secure <span className="text-primary">Checkout</span>
          </h1>

          <form onSubmit={handleCheckout} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-outline-variant/20 pb-2">Personal Information</h2>
              <div>
                <label className="block text-sm font-bold mb-2 text-on-surface-variant uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-on-surface-variant uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-outline-variant/20 pb-2">Payment Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-outline-variant'}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="card" 
                    checked={paymentMethod === 'card'}
                    onChange={() => handlePaymentMethodChange('card')}
                    className="sr-only"
                  />
                  <div className="font-bold mb-1">Visa / Mastercard</div>
                  <div className="text-sm text-on-surface-variant">Pay securely with your card</div>
                </label>
                
                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-colors ${paymentMethod === 'whish' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-outline-variant'}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="whish" 
                    checked={paymentMethod === 'whish'}
                    onChange={() => handlePaymentMethodChange('whish')}
                    className="sr-only"
                  />
                  <div className="font-bold mb-1">Whish / OMT</div>
                  <div className="text-sm text-on-surface-variant">Manual transfer</div>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full kinetic-gradient-primary text-on-primary-fixed px-6 py-4 rounded-xl font-headline font-black tracking-widest uppercase shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Processing...' : 'Complete Checkout'}
            </button>
          </form>
        </div>
      </div>
    </div>

    {/* Whish Modal */}
    {showWhishModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-surface-container rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
          <button 
            onClick={() => setShowWhishModal(false)}
            className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center space-y-4 pt-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">💸</span>
            </div>
            <h3 className="text-2xl font-bold font-headline">Whish / OMT Transfer</h3>
            <p className="text-on-surface-variant">
              Please send the amount via this number:
            </p>
            <div className="text-3xl font-black tracking-widest py-4 text-primary">
              70 999 999
            </div>
            <p className="text-sm text-on-surface-variant bg-surface-container-high p-4 rounded-xl border border-outline-variant/20">
              <strong className="text-on-surface block mb-1">Important:</strong>
              Add your email in the message box when transferring. Activation takes up to 1 hour.
            </p>
            <button 
              onClick={() => setShowWhishModal(false)}
              className="w-full mt-6 bg-primary text-on-primary-fixed px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    )}

    <Footer />
    </>
  );
}
