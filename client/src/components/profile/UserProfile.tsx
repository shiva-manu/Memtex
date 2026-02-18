import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import {
    Key, Copy, Trash2, ShieldCheck,
    RefreshCw, Layers, Shield,
    Globe, Terminal, ExternalLink,
    Clock, CheckCircle2, Zap, ArrowUpRight, Brain, Sparkles,
    Mail, Activity
} from 'lucide-react';
import { toast } from 'sonner';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1, y: 0,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
    }
};

const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.01, y: -2, transition: { duration: 0.3, ease: 'easeOut' as const } }
};

export default function UserProfile() {
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user);
            if (session) fetchKeys();
        };
        getSession();
    }, []);

    const fetchKeys = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/keys`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            setKeys(data.keys || []);
        } catch (err) {
            toast.error("Bridge failure: Could not fetch identifiers");
        }
    };

    const generateKey = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/keys`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            if (data.apiKey) {
                toast.success("Identity Token Generated", {
                    description: "Your session has been augmented with a new convergence key."
                });
                fetchKeys();
            }
        } catch (err) {
            toast.error("Generation error");
        } finally {
            setLoading(false);
        }
    };

    const deleteKey = async (key: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/keys/${key}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            toast.info("Token Revoked", {
                description: "Security layers updated successfully."
            });
            fetchKeys();
        } catch (err) {
            toast.error("Revocation failed");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied", {
            description: "Token ready for injection."
        });
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-black">


            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    className="max-w-6xl mx-auto space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Profile Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-white/[0.02] border-white/10 rounded-2xl overflow-hidden">
                            {/* Profile Banner - Minimal */}
                            <div className="h-32 bg-white/5 relative border-b border-white/5">
                                <motion.div
                                    className="absolute top-6 right-8"
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Sparkles className="w-6 h-6 text-white/20" />
                                </motion.div>
                            </div>

                            <CardContent className="p-6 sm:p-8 -mt-16 relative">
                                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                                    {/* Avatar */}
                                    <motion.div
                                        className="relative"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <Avatar className="h-28 w-28 border-4 border-black shadow-2xl bg-black">
                                            <AvatarFallback className="bg-white/10 text-white text-3xl font-bold border border-white/10">
                                                {user?.email?.charAt(0).toUpperCase() || 'M'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <motion.div
                                            className="absolute -bottom-1 -right-1 bg-white text-black p-2 rounded-xl shadow-lg border-4 border-black"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                        </motion.div>
                                    </motion.div>

                                    {/* Info */}
                                    <div className="flex-1 text-center sm:text-left pb-2">
                                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                                            <h2 className="text-2xl font-bold tracking-tight text-white capitalize">
                                                {user?.email?.split('@')[0] || 'Neural Identity'}
                                            </h2>
                                            <Badge className="bg-white/10 text-white border-white/20 text-[9px] font-bold uppercase tracking-wider hover:bg-white/20">
                                                PRO NODE
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-white/40 font-medium flex items-center justify-center sm:justify-start gap-2">
                                            <Mail className="w-3.5 h-3.5" />
                                            {user?.email}
                                        </p>
                                    </div>

                                    {/* Quick Stats - Monochrome */}
                                    <div className="flex items-center gap-3">
                                        {[
                                            { icon: Clock, label: 'Last Sync', value: '12m ago' },
                                            { icon: Layers, label: 'Bridges', value: '3 Active' },
                                            { icon: Activity, label: 'Uptime', value: '99.9%' },
                                        ].map((stat) => (
                                            <motion.div
                                                key={stat.label}
                                                className="flex flex-col items-center px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl"
                                                whileHover={{ y: -2, borderColor: 'rgba(255, 255, 255, 0.2)' }}
                                            >
                                                <stat.icon className={`w-4 h-4 text-white/60 mb-1.5`} />
                                                <span className="text-xs font-bold text-white/80">{stat.value}</span>
                                                <span className="text-[8px] font-semibold text-white/20 uppercase tracking-wider">{stat.label}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: API Keys */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div variants={itemVariants}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-0.5">Convergence Keys</h3>
                                        <p className="text-[11px] font-semibold text-white/20 uppercase tracking-wider">Secure tokens for browser extension</p>
                                    </div>
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                        <Button
                                            onClick={generateKey}
                                            disabled={loading}
                                            className="bg-white hover:bg-white/90 text-black px-5 rounded-xl h-10 font-semibold text-xs uppercase tracking-wider shadow-none flex gap-2"
                                        >
                                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                            Generate Token
                                        </Button>
                                    </motion.div>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {keys.length === 0 ? (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-12 border-2 border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center text-center"
                                        >
                                            <motion.div
                                                className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4"
                                            >
                                                <Key className="w-8 h-8 text-white/20" />
                                            </motion.div>
                                            <h4 className="text-base font-bold text-white/40">No Identity Tokens</h4>
                                            <p className="text-[11px] font-medium text-white/20 max-w-xs mt-1.5">
                                                Generate a key to begin cross-platform synchronization
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-3">
                                            {keys.map((k, idx) => (
                                                <motion.div
                                                    key={k.key}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    whileHover="hover"
                                                    initial-="rest"
                                                    variants={cardHover}
                                                >
                                                    <Card className="bg-white/[0.02] border-white/[0.06] hover:border-white/20 transition-colors rounded-xl overflow-hidden">
                                                        <CardContent className="p-5">
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                                <div className="flex-1 space-y-2.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <Shield className="w-3.5 h-3.5 text-white/60" />
                                                                        <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">Production Bridge Key</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2.5">
                                                                        <code className="px-3.5 py-2 bg-black/40 rounded-lg text-white/80 font-mono text-sm tracking-tight border border-white/[0.05]">
                                                                            {k.key}
                                                                        </code>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <motion.button
                                                                                    onClick={() => copyToClipboard(k.key)}
                                                                                    className="p-2.5 bg-white/[0.03] hover:bg-white/10 hover:text-white rounded-lg transition-all text-white/30"
                                                                                    whileTap={{ scale: 0.9 }}
                                                                                >
                                                                                    <Copy className="w-3.5 h-3.5" />
                                                                                </motion.button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top" className="bg-black border-white/10 text-white">
                                                                                <p className="text-[10px]">Copy Key</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="w-3 h-3 text-white/15" />
                                                                        <span className="text-[10px] font-medium text-white/15">
                                                                            Active since {new Date(k.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <motion.div whileTap={{ scale: 0.9 }}>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => deleteKey(k.key)}
                                                                                className="rounded-xl hover:bg-red-500/10 hover:text-red-400 text-white/15 transition-all border border-transparent hover:border-red-500/20 h-10 w-10"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </motion.div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="left" className="bg-black border-white/10 text-white">
                                                                        <p className="text-[10px]">Revoke Key</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        {/* Right: Status & Help */}
                        <div className="space-y-6">
                            {/* System Status */}
                            <motion.div variants={itemVariants}>
                                <Card className="bg-white/[0.02] border-white/10 rounded-2xl overflow-hidden">
                                    <CardContent className="p-6 space-y-5">
                                        <div>
                                            <h4 className="text-base font-bold text-white mb-0.5">System Status</h4>
                                            <p className="text-[10px] font-bold text-white/15 uppercase tracking-wider">Real-time Node Health</p>
                                        </div>

                                        <div className="space-y-2.5">
                                            {[
                                                { name: 'Identity Server', status: 'Online', icon: Globe },
                                                { name: 'Vector DB', status: 'Optimal', icon: Brain },
                                                { name: 'Extension Bridge', status: 'Active', icon: Terminal }
                                            ].map((item, idx) => (
                                                <motion.div
                                                    key={item.name}
                                                    className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                                    whileHover={{ x: 2 }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-black/30 rounded-lg border border-white/[0.04]">
                                                            <item.icon className="w-3.5 h-3.5 text-white/60" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-white/60">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/10">
                                                        <motion.div
                                                            className="w-1 h-1 rounded-full bg-white"
                                                            animate={{ opacity: [1, 0.4, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                                                        />
                                                        <span className="text-[9px] font-bold text-white uppercase">{item.status}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <Separator className="bg-white/[0.04]" />

                                        {/* Extension CTA */}
                                        <motion.div
                                            className="p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden"
                                            whileHover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                                        >
                                            <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">Extension Ready</h5>
                                            <p className="text-[11px] text-white/30 leading-relaxed font-medium">
                                                Paste your convergence key into the Memtex extension to begin neural syncing.
                                            </p>
                                            <motion.button
                                                className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-wider hover:underline"
                                                whileHover={{ x: 3 }}
                                            >
                                                Download Extension <ArrowUpRight className="w-3 h-3" />
                                            </motion.button>
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Documentation Card */}
                            <motion.div variants={itemVariants}>
                                <motion.div whileHover={{ y: -2 }}>
                                    <Card className="bg-white/[0.02] border-white/10 hover:border-white/20 rounded-2xl cursor-pointer transition-all">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                </div>
                                                <ExternalLink className="w-3.5 h-3.5 text-white/15" />
                                            </div>
                                            <h4 className="text-sm font-bold text-white/80 mb-1">Documentation</h4>
                                            <p className="text-[11px] text-white/20 leading-relaxed font-medium">
                                                Learn how to manage your identity nodes and expand your neural memory structure.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
