import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ThankYou() {
  return (
    <>
      <Navbar />
      <div className="bg-surface text-on-surface font-body min-h-screen selection:bg-secondary selection:text-on-secondary-fixed overflow-x-hidden relative">
        {/* Subtle Digital Background */}
        <div className="fixed inset-0 kinetic-grain z-0"></div>
        <div className="fixed -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary liquid-glow rounded-full z-0"></div>
        <div className="fixed -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary liquid-glow rounded-full z-0"></div>
        
        {/* Success Canvas */}
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
          {/* JK Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <span className="font-headline font-black text-[40vw] leading-none tracking-tighter">JK</span>
          </div>
          
          <div className="max-w-2xl w-full text-center space-y-12">
            {/* Icon/Mark */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-[64px] rounded-full scale-150"></div>
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dim shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-on-primary-fixed" />
              </div>
            </div>
            
            {/* Content Shell */}
            <div className="space-y-6">
              <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface">
                Welcome to the <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-tertiary">Inner Circle</span>
              </h1>
              <p className="text-on-surface-variant text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                Your account is now fully activated. You have lifetime access to the <span className="text-on-surface font-medium">Viral Loop</span> curriculum and the AI Studio.
              </p>
            </div>
            
            {/* Action Cluster */}
            <div className="flex flex-col items-center gap-6 pt-4">
              <Link to="/dashboard" className="group relative px-10 py-5 bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed font-headline font-bold text-xl rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center gap-3">
                Go to Dashboard
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="text-on-surface-variant hover:text-secondary transition-colors duration-300 flex items-center gap-2 font-medium tracking-wide">
                <Mail className="w-5 h-5" />
                Check your email for receipt
              </button>
            </div>
            
            {/* Kinetic Divider */}
            <div className="pt-12">
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-surface-container rounded-full border border-outline-variant/15 backdrop-blur-md">
                <div className="flex -space-x-3">
                  <img className="w-8 h-8 rounded-full border-2 border-surface-container object-cover" alt="User 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2djxay8p3E-__b5GBVGgC7afXwrtqGmK6yd01iTQFj2DyYDMdXSscRMIeusMnQF8hGDePuzNHOe9-utobsC2gmkfJqIIn4MHF-1X1cVXMJFP2hDEo9CxwqBTTKAwfUWsU7LoD0iCADBrDkPIBWyuAcXHphKfztx6n5X17QKTPQWlX6ejb9d1QOtXRURBeNM89vOfEr_uuDkkexSz30oV10aiFs1c6UYdFZ50fkbWkpJBEiHo7a1gh3Rltyp6ouG5ZnPhHP9heas_N"/>
                  <img className="w-8 h-8 rounded-full border-2 border-surface-container object-cover" alt="User 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS5aRkfg2tb7xAHdfSCeodoL6WFbTj5K91KJouzRC654_mh79F9UCvrRP_neOlZuP3A_z_husoCOqS_-rlPbiqw3mg9P4Tl75NFewJ83wkdP-paAvgy3ZygNnd8CKWjAx7bWkK_G7eDoCeGxaqENuSTfkg10XVvHpgT5x_CC4OCT1V70oWv4f7B_uRlwCLoONBpe5wwgOTEu7o7EMVYpvLqLM-wdwi2eIDY0oU97GnHa4QKQoEKmG17EcX4Fkd4OMXeDk7FTuqxwUo"/>
                  <img className="w-8 h-8 rounded-full border-2 border-surface-container object-cover" alt="User 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBclQmEjQ91Ubo69GaUYXFm1r0g1TiX2Pnlsqao1Vk3PWSlxBMpiSTAvHudmyNk14LxWiUEUTD3oKUaWHslfWITRM-E11n99OLtBucE4LPHa8aX2ciz7zBPqxWRcejaNajx-pVGYNQGD81XGAs1ZurYPND5XZcJ6URq8kcYr3nqn2lK9DmvReDiOfscoKAxBV8fGFR2sCOltAUANZj5remh3LeGYLhZs7lVRwdTe9Iz-6mBRzKkmFA3wRo7bqfTlb6qIFgLNNiQigt1"/>
                </div>
                <p className="text-sm font-label text-on-surface-variant">Joined by <span className="text-secondary font-bold">12,400+</span> authorities today</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
