import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type LucideIcon } from 'lucide-react';

interface HeaderProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    badge?: string;
    stats?: { label: string; value: string; color?: string }[];
    children?: React.ReactNode;
}

export default function Header({ title, subtitle, icon: Icon, badge, stats, children }: HeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            className="hidden md:block relative px-6 lg:px-8 py-6 border-b border-white/10 bg-black"
        >
            <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <motion.div
                        className="p-3 rounded-2xl bg-white/5 border border-white/10"
                        whileHover={{ scale: 1.05, rotate: 3 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Icon className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
                            {badge && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Badge className="bg-white/10 text-white border-white/20 text-[9px] font-bold uppercase tracking-wider">
                                        {badge}
                                    </Badge>
                                </motion.div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-white"
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">{subtitle}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Stats pills */}
                    {stats && stats.length > 0 && (
                        <motion.div
                            className="hidden xl:flex items-center gap-4 px-5 py-2.5 bg-white/[0.03] rounded-2xl border border-white/[0.05]"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {stats.map((stat, i) => (
                                <div key={stat.label} className="flex items-center gap-3">
                                    {i > 0 && <Separator orientation="vertical" className="h-4 bg-white/[0.06]" />}
                                    <div className="flex flex-col items-center">
                                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{stat.label}</span>
                                        <span className={`text-xs font-bold tracking-tight ${stat.color || 'text-white/70'}`}>{stat.value}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Action slot */}
                    {children}
                </div>
            </div>
        </motion.header>
    );
}
