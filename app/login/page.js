'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login for now - transition to Auth later
    setTimeout(() => {
      if (email === "admin@coinflow.lk" && password === "admin123") {
        toast.success("Welcome back to CoinFlow!");
        router.push('/');
      } else {
        toast.error("Invalid credentials. Try admin@coinflow.lk / admin123");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="ambient-bg" />
      <Toaster position="top-center" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card glow-border p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <span className="text-white text-3xl font-bold">₵</span>
          </motion.div>
          <h1 className="font-heading text-3xl font-bold neon-text mb-2">CoinFlow</h1>
          <p className="text-text-secondary text-sm">Secure access to your smart vault</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-text-secondary ml-1 mb-1 block">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="e.g., saver@coinflow.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-text-secondary ml-1 mb-1 block">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-primary" />
              <span className="text-xs text-text-secondary">Remember me</span>
            </label>
            <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : "Connect Passport"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-xs text-text-secondary">Or continue with</p>
          <div className="flex gap-4">
            <button className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.901 3.387-2.012 4.499C17.135 19.898 15.109 21 12 21 7.03 21 3 16.97 3 12s4.03-9 9-9c2.614 0 4.887 1.011 6.549 2.651l2.308-2.308C18.665 1.139 15.65 0 12 0 5.373 0 0 5.373 0 12s5.373 12 12 12c3.58 0 6.601-1.181 8.815-3.321 2.29-2.21 3.208-5.32 3.208-7.76 0-.58-.046-1.14-.14-1.68l-11.403-.02z"/></svg>
              Google
            </button>
          </div>
          <p className="text-xs text-text-secondary pt-4">
            {"Don't"} have an account? <Link href="#" className="text-primary font-bold">Register Now</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
