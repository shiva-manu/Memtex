import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
    Plus, MessageSquare, Trash2,
    History
} from 'lucide-react';


import { toast } from 'sonner';

interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
}

interface ChatSidebarProps {
    activeConversationId?: string | null;
    onSelect: (id: string | null) => void;
    refreshTrigger: number;
}

export default function ChatSidebar({ activeConversationId, onSelect, refreshTrigger }: ChatSidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/chat`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [refreshTrigger]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/chat/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.ok) {
                toast.success('Conversation deleted');
                setConversations(prev => prev.filter(c => c.id !== id));
                if (activeConversationId === id) onSelect(null);
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="flex flex-col bg-black h-full w-full">

            {/* New Chat Button */}
            <div className="p-4">
                <Button
                    onClick={() => onSelect(null)}
                    className="w-full h-11 bg-white text-black hover:bg-white/90 rounded-xl flex items-center gap-2 font-bold"
                >
                    <Plus className="w-4 h-4" />
                    NEW MEMORY
                </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                    <History className="w-3 h-3" />
                    Past Convergences
                </div>

                <div className="space-y-1">
                    {conversations.map((convo) => (
                        <motion.div
                            key={convo.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onSelect(convo.id)}
                            className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${activeConversationId === convo.id
                                ? 'bg-white/10 border-white/10'
                                : 'hover:bg-white/5'
                                }`}
                        >
                            <MessageSquare className={`w-4 h-4 transition-colors ${activeConversationId === convo.id ? 'text-white' : 'text-white/20'
                                }`} />

                            <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-medium truncate ${activeConversationId === convo.id ? 'text-white' : 'text-white/60'
                                    }`}>
                                    {convo.title}
                                </p>
                            </div>

                            <button
                                onClick={(e) => handleDelete(e, convo.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all text-white/20"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    ))}

                    {conversations.length === 0 && !loading && (
                        <div className="py-12 px-6 text-center">
                            <p className="text-[11px] font-bold text-white/20 uppercase tracking-wider">No history found</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

