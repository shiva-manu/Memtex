import { motion } from 'framer-motion';
import { Brain, Github, Twitter, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        { label: 'Documentation', href: '#' },
        { label: 'API Reference', href: '#' },
        { label: 'Extension', href: '#' },
        { label: 'Status', href: '#' },
    ];

    return (
        <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hidden md:block relative border-t border-white/10 bg-black"
        >
            <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Left: Logo + Copyright */}
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="flex items-center gap-2.5"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg">
                                <Brain className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-white/40">
                                Memtex Intelligence
                            </span>
                        </motion.div>

                        <Separator orientation="vertical" className="h-4 bg-white/10 hidden md:block" />

                        <span className="text-[10px] text-white/20 font-medium">
                            © {currentYear} All rights reserved
                        </span>
                    </div>

                    {/* Center: Links */}
                    <div className="flex items-center gap-6">
                        {footerLinks.map((link) => (
                            <motion.a
                                key={link.label}
                                href={link.href}
                                className="text-[10px] font-semibold text-white/30 hover:text-white uppercase tracking-wider transition-colors"
                                whileHover={{ y: -1 }}
                            >
                                {link.label}
                            </motion.a>
                        ))}
                    </div>

                    {/* Right: Socials + Status */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <motion.a
                                href="#"
                                className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Github className="w-3.5 h-3.5" />
                            </motion.a>
                            <motion.a
                                href="#"
                                className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Twitter className="w-3.5 h-3.5" />
                            </motion.a>
                        </div>

                        <Separator orientation="vertical" className="h-3 bg-white/10" />

                        <motion.div
                            className="flex items-center gap-1.5 text-[10px] text-white/20 font-medium"
                            whileHover={{ color: 'rgba(255,255,255,0.5)' }}
                        >
                            Made with <Heart className="w-3 h-3 text-white/30 fill-white/10" /> by Memtex
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
}
