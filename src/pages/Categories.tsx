import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CATEGORIES } from '../config/constants';

export default function Categories() {
  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-2">Categories</h1>
            <p className="text-on-surface-variant text-lg">Explore our curriculum by topic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORIES.map((category, idx) => (
              <Link key={category.id} to={`/categories/${category.title}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl aspect-[4/3] cursor-pointer"
                >
                  <img 
                    src={category.image} 
                    alt={category.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8">
                    <h2 className="text-2xl font-bold text-white mb-2">{category.title}</h2>
                    <p className="text-white/80">{category.description}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
