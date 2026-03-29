import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { ArrowRight, Zap, Users, Sparkles, Star } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';

export default function Home() {
  const { currentUser, userData } = useAuth();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-surface text-on-surface font-body overflow-hidden relative">
        
        {/* Subtle Digital Background */}
        <div className="fixed inset-0 kinetic-grain z-0"></div>
        <div className="fixed -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary liquid-glow rounded-full z-0"></div>
        <div className="fixed -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary liquid-glow rounded-full z-0"></div>

        {/* Hero Section */}
        <section className="relative min-h-screen w-full flex items-center justify-center pt-8 pb-12 overflow-hidden">
          {/* Background Video */}
          <ThreeBackground />
          
          {/* Content */}
          <div className="relative z-20 container mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-3 px-5 py-2 rounded-full liquid-glass border border-outline-variant/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
              <span className="text-xs font-label font-bold tracking-[0.2em] uppercase text-secondary">Inner Circle Enrollment Open</span>
            </motion.div>
            
            <motion.h1 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="font-headline font-black text-5xl md:text-7xl lg:text-[7rem] leading-[1.05] md:leading-[0.95] tracking-tighter mb-8 max-w-5xl uppercase"
            >
              COMMAND THE <span className="text-gradient italic pr-2">ALGORITHM</span>
            </motion.h1>
            
            <motion.p 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-on-surface-variant text-lg md:text-2xl max-w-3xl mb-14 font-body leading-relaxed font-light"
            >
              Stop chasing trends. Master the mechanics of viral growth and transform your personal brand into an <span className="text-on-surface font-semibold">unstoppable digital asset</span>.
            </motion.p>
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto justify-center"
            >
              <Link to={currentUser ? "/dashboard" : "/login"} className="w-full sm:w-auto group">
                <button className="relative w-full overflow-hidden kinetic-gradient-primary text-on-primary-fixed px-12 py-6 rounded-2xl font-headline font-black tracking-[0.15em] text-lg uppercase shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3">
                  <span className="relative z-10">{currentUser ? "Dashboard" : "Sign In"}</span>
                  <Zap className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </button>
              </Link>
              <Link to={userData?.isPaid ? "/dashboard" : "/pricing"} className="w-full sm:w-auto group">
                <button className="w-full liquid-glass border border-outline-variant/40 text-on-surface px-12 py-6 rounded-2xl font-headline font-bold tracking-[0.15em] text-lg uppercase flex items-center justify-center gap-3 hover:bg-surface-container hover:border-outline-variant transition-all duration-300">
                  {userData?.isPaid ? "Start Learning" : "Unlock Now"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </Link>
            </motion.div>
          </div>
        </section>
        
        {/* Social Proof Bar */}
        {!currentUser && (
          <>
            <div className="border-y border-outline-variant/20 bg-surface-container-lowest/90 backdrop-blur-xl py-8 relative z-30 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
              <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">
                <div className="flex items-center gap-6 group">
                  <span className="font-headline font-black text-5xl text-primary leading-none group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(var(--color-primary),0.5)]">240+</span>
                  <span className="font-label text-sm tracking-widest uppercase text-on-surface-variant max-w-[120px] text-left leading-tight group-hover:text-on-surface transition-colors">Businesses Scaled</span>
                </div>
                <div className="hidden md:block w-px h-16 bg-gradient-to-b from-transparent via-outline-variant/40 to-transparent"></div>
                <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-70 hover:opacity-100 transition-opacity duration-500">
                  <div className="font-headline font-black text-2xl tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors cursor-default">Forbes</div>
                  <div className="font-headline font-black text-2xl tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors cursor-default">TechCrunch</div>
                  <div className="font-headline font-black text-2xl tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors cursor-default">Wired</div>
                  <div className="font-headline font-black text-2xl tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors cursor-default">GQ</div>
                </div>
              </div>
            </div>

            {/* Services Bento Grid */}
            <section className="py-24 md:py-32 container mx-auto px-6 md:px-12 relative z-20">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeIn}
                className="flex flex-col mb-16 md:mb-20"
              >
                <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tighter uppercase mb-4">
                  Precision <span className="text-secondary">Arsenal</span>
                </h2>
                <div className="h-1 w-24 kinetic-gradient-viral rounded-full"></div>
              </motion.div>

              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                {/* Viral Reels */}
                <motion.div variants={fadeIn} className="md:col-span-7 glass-panel rounded-[2rem] p-8 md:p-12 flex flex-col justify-between group overflow-hidden relative min-h-[400px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/20 transition-colors duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                      <Zap className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-headline font-bold text-3xl md:text-4xl mb-4">Viral Reels</h3>
                    <p className="text-on-surface-variant text-lg max-w-md">Engineered short-form content designed to capture attention in the first 0.5 seconds and drive exponential organic reach.</p>
                  </div>
                  <div className="relative z-10 mt-12 transform group-hover:-translate-y-2 transition-transform duration-500">
                    <img className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-2xl border border-outline-variant/20" alt="high quality vertical video interface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDVAlqbSKJgISsnBka1aoBS4EvvxVfvb1oIkQ37NKFDRJ9W7Hm3k5BHa48zVnCcBFfhiwWgaykJ56CS-rgeK6Mxz_id30Xl_Wcl7i4jNpNiICTQcpVUEP91-SywMuISCdcNJ5A3kuirNT-KJuXxeuHZ16cZvUXJBBavZbhy767AMyoVVywrQKWG3piVD0T_1KQb5QGWUlQaMKnI5y1qVqzankIi33SSXJ8GuAq1EtWeKlrAfPbWqGGWsCc38kx9sHQ-Vm6mIt37HrA"/>
                  </div>
                </motion.div>

                {/* UGC */}
                <motion.div variants={fadeIn} className="md:col-span-5 glass-panel rounded-[2rem] p-8 md:p-12 flex flex-col justify-center relative overflow-hidden group min-h-[400px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6">
                      <Users className="w-7 h-7 text-secondary" />
                    </div>
                    <h3 className="font-headline font-bold text-3xl mb-4">Authentic UGC</h3>
                    <p className="text-on-surface-variant text-lg mb-10 leading-relaxed">Leverage the power of human connection. We curate and create user-generated content that builds unshakeable trust.</p>
                    <div className="flex -space-x-4">
                      <img className="w-14 h-14 rounded-full border-4 border-surface-container object-cover" alt="portrait 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCZtH5AbusG4euWEw9bouVfIelzAy5IW6hIkSb71x3oY4YexxTOFwR0NAUb9_BRaR5_bxaSWEH35XMQtJviiC8CTC7ljsOokE4Nt_wiq4FCnh54GBCPuOELl9hq4AQqH39hoCx3zC2VVL8Jy9a2jiXmfXlBGdwkx_b32n2_HpS4vxNdxWsDhTS1AEDs75vkDZBfsvj1_5tfokJJnJ7e3BJEpFA2C0KZM0QAmoTEQqdi0V2Y6wdb7E9UOaYtTMSRk_v723JHEXHli_o"/>
                      <img className="w-14 h-14 rounded-full border-4 border-surface-container object-cover" alt="portrait 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZFgBaRVHqAboNL8OikexopjmjQlpdppalCHe1cuoNEw2EOkJvXnSF17Kbs3vTnaltFquGm8QB6EcqXiaSWwnSLhDnSaU1kAL6rkaXAkaB_RiEHm3_g_f9i4erwe80bD_eIyir7ALIP4EdUHl_eaRFfiYudB-oabOKkIhxcQHOLz_IJ_Xli8zKjziZRID08kJ-whIZv9jX_ely8MLl1qBfiiJb3-3dFRMqCHaOQGM2Iq8dhX3Qo4s3v9dRfnGT1P4NWBv1xB51c6xF"/>
                      <img className="w-14 h-14 rounded-full border-4 border-surface-container object-cover" alt="portrait 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl_4E91xlp0wSj3QTb2KmZnhbShAUVLI0cpPsMBH_BU1D95jCtoPJPKeudY9O843ARoSes0jZ0Kj1KY9b5hKlL20MNPWgWqvRSJ7T0WP_tyEDkWdz1_o5-j7fZtxjHp8Ab3L3n-W21hgBZ205dGnTkjyXC2X2QshhVrEa6PM6Jn_w6UdR4SbmwapSA4wSE6rUdxHibwsH8W4SQXp7ofQDGBvNJLwWIr7OQkLch53Y01sNDEodSZ5hBeVRnI47mh6n9-LJZWEXyuk9H"/>
                      <div className="w-14 h-14 rounded-full bg-surface-variant border-4 border-surface-container flex items-center justify-center text-xs font-bold text-on-surface">+240</div>
                    </div>
                  </div>
                </motion.div>

                {/* Branding */}
                <motion.div variants={fadeIn} className="md:col-span-12 glass-panel rounded-[2rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 group">
                  <div className="flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-tertiary/20 flex items-center justify-center mb-6">
                      <Sparkles className="w-7 h-7 text-tertiary" />
                    </div>
                    <h3 className="font-headline font-bold text-3xl md:text-4xl mb-4">Elite Personal Branding</h3>
                    <p className="text-on-surface-variant text-lg mb-8 max-w-xl">We don't just make you famous; we make you the authority. Complete ecosystem development from visual identity to digital architecture.</p>
                    <Link to="/pricing">
                      <button className="text-primary font-headline font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                        Explore Brand Strategy <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                  <div className="flex-1 w-full flex justify-center">
                    <div className="relative w-full max-w-md aspect-video rounded-2xl bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 kinetic-gradient-primary opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500"></div>
                      <span className="font-headline font-black text-8xl text-outline opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all duration-500 transform group-hover:scale-110">JK</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </section>

            {/* Numbers Section */}
            <section className="py-24 relative z-20 border-y border-outline-variant/10 bg-surface-container-lowest/30 backdrop-blur-sm">
              <div className="container mx-auto px-6 md:px-12">
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8"
                >
                  {[
                    { value: "1.2B+", label: "Total Views" },
                    { value: "85%", label: "Avg Growth" },
                    { value: "15k+", label: "Students" },
                    { value: "12M", label: "Ad Spend Managed" }
                  ].map((stat, i) => (
                    <motion.div key={i} variants={fadeIn} className="flex flex-col items-center text-center group">
                      <div className="font-headline font-black text-5xl md:text-6xl lg:text-7xl mb-3 text-on-surface tracking-tighter group-hover:text-primary transition-colors duration-300">{stat.value}</div>
                      <div className="h-1 w-12 bg-outline-variant/30 mb-4 group-hover:bg-primary/50 transition-colors duration-300"></div>
                      <div className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-bold opacity-80">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Testimonials Section (Glitch-Free Grid) */}
            <section className="py-24 md:py-32 relative z-20">
              <div className="container mx-auto px-6 md:px-12">
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="text-center mb-16 md:mb-24"
                >
                  <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tighter uppercase">
                    The <span className="text-primary">Kinetic</span> Response
                  </h2>
                </motion.div>
                
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                  {[
                    {
                      quote: "The viral mechanics JK taught us changed everything. We went from 200 views to 2.4M in three weeks.",
                      name: "Marcus Chen",
                      role: "Founder, Nexus AI",
                      color: "bg-primary/20"
                    },
                    {
                      quote: "Highest ROI of any marketing program I've ever joined. Period. The frameworks are plug-and-play.",
                      name: "Sarah Jenkins",
                      role: "CMO, BrandFlow",
                      color: "bg-secondary/20"
                    },
                    {
                      quote: "I was struggling to land brand deals. After taking the UGC lessons, I'm fully booked for the next two months.",
                      name: "Elena Rodriguez",
                      role: "UGC Creator",
                      color: "bg-tertiary/20"
                    }
                  ].map((testimonial, i) => (
                    <motion.div key={i} variants={fadeIn} className="glass-panel p-8 md:p-10 rounded-[2rem] flex flex-col justify-between h-full">
                      <div>
                        <div className="flex gap-1 mb-6">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                          ))}
                        </div>
                        <p className="text-on-surface text-lg mb-8 italic leading-relaxed">"{testimonial.quote}"</p>
                      </div>
                      <div className="flex items-center gap-4 mt-auto">
                        <div className={`w-12 h-12 rounded-full ${testimonial.color} flex items-center justify-center font-bold text-lg`}>
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-base">{testimonial.name}</div>
                          <div className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">{testimonial.role}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 md:py-32 container mx-auto px-6 md:px-12 relative z-20">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="glass-panel rounded-[3rem] p-10 md:p-24 relative overflow-hidden flex flex-col items-center text-center border-primary/30"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 w-full max-w-4xl">
                  <h2 className="font-headline font-black text-4xl md:text-6xl lg:text-7xl tracking-tighter uppercase mb-8">
                    READY TO <span className="text-primary">DOMINATE</span> THE ALGORITHM?
                  </h2>
                  <p className="text-on-surface-variant text-lg md:text-xl mb-12 max-w-2xl mx-auto">
                    Limited slots available for the next mastermind intake. Secure your position and start scaling.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center w-full">
                    <Link to={currentUser ? "/pricing" : "/login"} className="w-full sm:w-auto">
                      <button className="kinetic-gradient-primary text-on-primary-fixed px-10 py-5 rounded-xl font-headline font-black tracking-widest text-lg uppercase shadow-2xl hover:scale-105 transition-transform w-full">
                        Enroll Now
                      </button>
                    </Link>
                    <Link to="/dashboard" className="w-full sm:w-auto">
                      <button className="liquid-glass border border-outline-variant/30 text-on-surface px-10 py-5 rounded-xl font-headline font-black tracking-widest text-lg uppercase flex items-center justify-center gap-3 hover:bg-surface-container transition-colors w-full group">
                        Join Discord
                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </section>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
