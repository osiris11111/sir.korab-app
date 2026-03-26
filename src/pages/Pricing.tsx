import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Pricing() {
  const { userData } = useAuth();

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Invest in Your <span className="text-gradient">Growth</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-on-surface-variant"
          >
            Get instant access to all courses, resources, and the private community.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-xl mx-auto mb-32">
          
          {/* Lifetime Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden border-primary/30 shadow-[0_0_40px_rgba(189,157,255,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 -z-10"></div>
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-gradient-to-r from-primary to-secondary text-on-primary-fixed text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Best Value
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Lifetime Access</h3>
            <p className="text-on-surface-variant mb-6">Pay once, learn forever.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold">$50</span>
              <span className="text-on-surface-variant"> one-time</span>
            </div>
            
            <ul className="space-y-4 mb-10">
              {[
                "Full access to all current courses",
                "Viral Reels & Marketing modules",
                "UGC & Branding Photoshoot guides",
                "Private Discord Community",
                "Quarterly Q&A calls",
                "Lifetime access to all future updates",
                "Direct DM access for feedback",
                "Advanced monetization templates",
                "No recurring fees ever"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-on-surface-variant">
                  <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-on-surface">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/checkout" className="block w-full glow-primary">
              <button 
                disabled={userData?.isPaid}
                className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary-fixed font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {userData?.isPaid ? 'Already Subscribed' : 'Get Lifetime Access'}
              </button>
            </Link>
          </motion.div>

        </div>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Don't just take my word for it</h2>
            <p className="text-on-surface-variant text-lg">Join creators who are already seeing massive results.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Jenkins",
                role: "Content Creator",
                content: "Applying Sir Korab's viral hooks completely changed my trajectory. I went from 2k to 50k followers in exactly 3 weeks. The ROI on this is insane.",
                rating: 5
              },
              {
                name: "Marcus T.",
                role: "Brand Owner",
                content: "The marketing reels module alone is worth 10x the price. We implemented the frameworks and saw a 300% increase in conversions from organic social.",
                rating: 5
              },
              {
                name: "Elena Rodriguez",
                role: "UGC Creator",
                content: "I was struggling to land brand deals. After taking the UGC and branding photoshoot lessons, I'm now fully booked for the next two months.",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-3xl"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-on-surface-variant mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-bold text-on-surface">{testimonial.name}</p>
                  <p className="text-sm text-on-surface-variant">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
    <Footer />
    </>
  );
}
