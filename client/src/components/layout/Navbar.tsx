import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Brain, LogOut, User, Settings, Menu,
    MessageSquare, Shield, Search,
    Bell, Sparkles, ChevronDown, PanelLeft

} from 'lucide-react';

import { toast } from 'sonner';

interface NavbarProps {
    view: 'chat' | 'profile';
    setView: (view: 'chat' | 'profile') => void;
    userEmail?: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export default function Navbar({ view, setView, userEmail, isSidebarOpen, onToggleSidebar }: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);


    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) toast.error("Error signing out");
    };

    const navItems = [
        { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
        { id: 'profile' as const, label: 'Profile', icon: Shield },
    ];

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="sticky top-0 z-50 w-full"
        >
            {/* Minimal border bottom, no blur/glass needed for strict minimal */}
            <div className="absolute inset-0 bg-black border-b border-white/10" />

            <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo + Nav Links */}
                    <div className="flex items-center gap-6">
                        {/* Sidebar Toggle - Only for Chat */}
                        {view === 'chat' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onToggleSidebar}
                                        className={`h-9 w-9 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.1] transition-all ${isSidebarOpen ? 'text-white' : 'text-white/30'}`}
                                    >
                                        <PanelLeft className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-black border-white/10 text-white">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">{isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* Logo */}

                        <motion.div
                            className="flex items-center gap-3 cursor-default"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="relative">
                                <motion.div
                                    className="p-2 bg-white/10 rounded-xl"
                                    whileHover={{ rotate: [0, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Brain className="w-5 h-5 text-white" />
                                </motion.div>
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-sm font-bold tracking-tight text-white">Memtex</span>
                            </div>
                        </motion.div>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setView(item.id)}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === item.id ? 'text-white' : 'text-white/40 hover:text-white'
                                        }`}
                                >
                                    {view === item.id && (
                                        <motion.div
                                            layoutId="navbar-active"
                                            className="absolute inset-0 bg-white/10 rounded-lg"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Status + Actions + Profile */}
                    <div className="flex items-center gap-3">
                        {/* Status Indicator */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Online</span>
                        </div>

                        {/* Search */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex h-9 w-9 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.1] text-white/40 hover:text-white"
                        >
                            <Search className="w-4 h-4" />
                        </Button>

                        {/* Notifications */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex h-9 w-9 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.1] text-white/40 hover:text-white"
                        >
                            <Bell className="w-4 h-4" />
                        </Button>

                        {/* Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <motion.button
                                    className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.1] transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Avatar className="h-7 w-7 border border-white/10">
                                        <AvatarFallback className="bg-white/10 text-white text-[10px] font-bold">
                                            {userEmail?.charAt(0).toUpperCase() || 'M'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <ChevronDown className="w-3 h-3 text-white/30" />
                                </motion.button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-56 bg-black border-white/10 rounded-xl p-1.5 mt-2 text-white"
                            >
                                <DropdownMenuLabel className="px-3 py-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-semibold capitalize">{userEmail?.split('@')[0]}</span>
                                        <span className="text-[10px] text-white/40 font-medium">{userEmail}</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    onClick={() => setView('profile')}
                                    className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10"
                                >
                                    <User className="w-4 h-4 mr-2" /> Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10">
                                    <Settings className="w-4 h-4 mr-2" /> Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 hover:text-white"
                                >
                                    <LogOut className="w-4 h-4 mr-2" /> Disconnect
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mobile Menu */}
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden h-9 w-9 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] text-white/50"
                                >
                                    <Menu className="w-4 h-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[280px] bg-black border-l border-white/10 p-0">
                                <SheetHeader className="p-6 pb-4">
                                    <SheetTitle className="flex items-center gap-3 text-white">
                                        <div className="p-2 bg-white/10 rounded-xl">
                                            <Brain className="w-4 h-4 text-white" />
                                        </div>
                                        Memtex
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="px-4 space-y-2">
                                    {navItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setView(item.id); setMobileOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === item.id
                                                ? 'bg-white/10 text-white'
                                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
