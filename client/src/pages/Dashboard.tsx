import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { TooltipProvider } from '@/components/ui/tooltip';
import Navbar from '@/components/layout/Navbar';

import ChatMain from '@/components/main/ChatMain';
import ChatSidebar from '@/components/main/ChatSidebar';
import UserProfile from '@/components/profile/UserProfile';

export default function Dashboard() {
    const [view, setView] = useState<'chat' | 'profile'>('chat');
    const [userEmail, setUserEmail] = useState<string | undefined>();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUserEmail(session?.user?.email ?? undefined);
        };
        getUser();
    }, []);

    const handleConversationCreated = (id: string) => {
        setActiveConversationId(id);
        setRefreshTrigger(prev => prev + 1); // Refresh sidebar list
    };

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex flex-col h-screen bg-black text-white font-sans antialiased overflow-hidden">
                {/* Top Navbar */}
                <Navbar
                    view={view}
                    setView={setView}
                    userEmail={userEmail}
                    isSidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Main Content Area */}
                <div className="relative z-10 flex flex-1 min-h-0">
                    <AnimatePresence mode="wait">
                        {view === 'chat' ? (
                            <motion.div
                                key="chat-container"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex min-h-0"
                            >
                                <AnimatePresence initial={false}>
                                    {sidebarOpen && (
                                        <motion.div
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: 288, opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                            className="overflow-hidden border-r border-white/10"
                                        >
                                            <div className="w-[288px]">
                                                <ChatSidebar
                                                    activeConversationId={activeConversationId}
                                                    onSelect={setActiveConversationId}
                                                    refreshTrigger={refreshTrigger}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="flex-1 flex flex-col min-h-0">
                                    <ChatMain
                                        conversationId={activeConversationId}
                                        onConversationCreated={handleConversationCreated}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 flex flex-col min-h-0"
                            >
                                <UserProfile />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </TooltipProvider>
    );
}

