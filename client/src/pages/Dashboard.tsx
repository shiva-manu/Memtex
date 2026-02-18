import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { TooltipProvider } from '@/components/ui/tooltip';
import Navbar from '@/components/layout/Navbar';

import ChatMain from '@/components/main/ChatMain';
import UserProfile from '@/components/profile/UserProfile';

export default function Dashboard() {
    const [view, setView] = useState<'chat' | 'profile'>('chat');
    const [userEmail, setUserEmail] = useState<string | undefined>();

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUserEmail(session?.user?.email ?? undefined);
        };
        getUser();
    }, []);

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex flex-col h-screen bg-black text-white font-sans antialiased overflow-hidden">
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                    {/* Top Navbar */}
                    <Navbar view={view} setView={setView} userEmail={userEmail} />

                    {/* Main Content Area */}
                    <main className="flex-1 flex flex-col min-h-0">
                        <AnimatePresence mode="wait">
                            {view === 'chat' ? (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                                    className="flex-1 flex flex-col min-h-0"
                                >
                                    <ChatMain />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                                    className="flex-1 flex flex-col min-h-0"
                                >
                                    <UserProfile />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>

                    {/* Footer - REMOVED */}
                </div>
            </div>
        </TooltipProvider>
    );
}
