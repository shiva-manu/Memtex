import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';
import {
    Brain, Shield, Sparkles,
    Globe, Eye, EyeOff, Github
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    }
};

const GoogleIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(isSignUp ? "Account Created" : "Connection Established", {
                description: isSignUp
                    ? "Please verify your email."
                    : "Identity verified. Welcome back."
            });
        }
        setLoading(false);
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
        });
        if (error) toast.error(error.message);
    };

    return (
        <div className="min-h-screen bg-black flex selection:bg-white/20 antialiased overflow-hidden text-white font-sans">
            {/* Left: Minimal Brand Section */}
            <motion.div
                className="hidden lg:flex w-1/2 relative bg-black border-r border-white/10 items-center justify-center p-16 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className="relative z-10 max-w-lg space-y-12">
                    <motion.div
                        className="space-y-8"
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div
                            variants={fadeUp}
                            custom={0}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Memtex v2.4</span>
                        </motion.div>

                        <motion.h1
                            variants={fadeUp}
                            custom={1}
                            className="text-6xl font-black tracking-tighter text-white leading-[1.05]"
                        >
                            Unified <br />
                            <span className="text-white/50 italic">Memory</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            custom={2}
                            className="text-lg font-medium text-white/40 leading-relaxed max-w-md"
                        >
                            Converge ChatGPT, Gemini, and Claude into a single monochrome interface. Simple. Private. Powerful.
                        </motion.p>
                    </motion.div>

                    {/* Minimal Feature List */}
                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                    >
                        {[
                            { title: "Unified Index", desc: "Cross-platform retrieval.", icon: Brain },
                            { title: "Encrypted", desc: "Bank-grade isolation.", icon: Shield },
                            { title: "Sync", desc: "Real-time bridge.", icon: Globe }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                custom={3 + i}
                                className="flex gap-5 group items-center"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                    <item.icon className="w-5 h-5 text-white/70" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                                    <p className="text-[11px] font-medium text-white/30">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Right: Auth Form Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 relative bg-black">
                <motion.div
                    className="w-full max-w-sm space-y-8"
                    initial="hidden"
                    animate="visible"
                    variants={scaleIn}
                >
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                            {isSignUp ? "Create an account" : "Welcome back"}
                        </h2>
                        <p className="text-sm text-white/40">
                            Enter your details to access your memory.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => handleOAuth('google')} className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white/80 h-11">
                            <GoogleIcon />
                            <span className="ml-2">Google</span>
                        </Button>
                        <Button variant="outline" onClick={() => handleOAuth('github')} className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white/80 h-11">
                            <Github className="w-4 h-4" />
                            <span className="ml-2">GitHub</span>
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black px-2 text-white/30 font-mono">Or continue with</span>
                        </div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="bg-white/5 border-white/10 focus:border-white/30 text-white rounded-lg h-11 placeholder:text-white/20"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="bg-white/5 border-white/10 focus:border-white/30 text-white rounded-lg h-11 pr-10 placeholder:text-white/20"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-white hover:bg-white/90 text-black font-bold rounded-lg transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <Sparkles className="w-4 h-4 animate-spin" />
                            ) : (
                                isSignUp ? "Create Account" : "Sign In"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-white/30">
                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-white hover:underline underline-offset-4"
                        >
                            {isSignUp ? "Sign in" : "Sign up"}
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
