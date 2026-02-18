import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import {
    Send, User, Brain,
    Zap, Copy, Terminal
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp?: Date;
}

const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const toolbarVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3 } }
};

interface ChatMainProps {
    conversationId?: string | null;
    onConversationCreated?: (id: string) => void;
}

export default function ChatMain({ conversationId, onConversationCreated }: ChatMainProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            content: "Welcome to Memtex. I've synced your context from ChatGPT, Gemini, and Claude.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load conversation messages if ID changes
    useEffect(() => {
        const loadConversation = async () => {
            if (!conversationId) {
                setMessages([{
                    role: 'ai',
                    content: "Welcome to Memtex. I've synced your context from ChatGPT, Gemini, and Claude.",
                    timestamp: new Date()
                }]);
                return;
            }

            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/chat/${conversationId}`, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.messages) {
                        setMessages(data.messages.map((m: any) => ({
                            role: m.role === 'assistant' ? 'ai' : 'user',
                            content: m.content,
                            timestamp: new Date() // Ideally use actual timestamp from DB if available
                        })));
                    }
                }
            } catch (error) {
                toast.error('Failed to load history');
            } finally {
                setLoading(false);
            }
        };

        loadConversation();
    }, [conversationId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    message: userMsg,
                    conversationId // Send existing ID if any
                })
            });

            if (!response.ok) {
                const data = await response.json();
                toast.error(data.error || 'Convergence failed');
                setLoading(false);
                return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            // Add initial empty AI message for streaming
            setMessages(prev => [...prev, { role: 'ai', content: '', timestamp: new Date() }]);

            let accumulatedContent = '';
            let buffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.chunk) {
                                    accumulatedContent += parsed.chunk;
                                    setMessages(prev => {
                                        const newMsgs = [...prev];
                                        const last = newMsgs[newMsgs.length - 1];
                                        if (last.role === 'ai') {
                                            last.content = accumulatedContent;
                                        }
                                        return newMsgs;
                                    });
                                } else if (parsed.conversationId && onConversationCreated) {
                                    // New conversation was created, notify dashboard
                                    onConversationCreated(parsed.conversationId);
                                } else if (parsed.error) {
                                    toast.error(parsed.error);
                                }
                            } catch (e) {
                                console.error('Error parsing stream chunk:', e);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            toast.error('Identity server offline');
        } finally {
            setLoading(false);
        }
    };

    const copyMessage = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-black">


            {/* Messages Area - Full Width */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8"
            >
                <div className="w-full lg:w-[60%] mx-auto space-y-8">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                layout
                                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 w-full group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <motion.div
                                        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 mt-1 ${msg.role === 'ai'
                                            ? 'bg-white text-black'
                                            : 'bg-white/5 text-white/50'
                                            }`}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {msg.role === 'ai' ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </motion.div>

                                    {/* Message Bubble - Markdown and Width */}
                                    <div className={`flex flex-col gap-1.5 flex-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <motion.div
                                            className={`relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai'
                                                ? 'w-full bg-white/5 text-white/90 rounded-tl-sm'
                                                : 'max-w-[85%] bg-white/[0.07] text-white rounded-tr-sm text-right self-end'
                                                }`}
                                            whileHover={{ scale: 1.001 }}
                                        >
                                            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-code:text-white/80">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>

                                            {/* Copy button on hover */}
                                            <div className={`absolute top-2 ${msg.role === 'ai' ? 'right-2' : 'left-2'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => copyMessage(msg.content)}
                                                            className={`p-1.5 rounded-lg transition-all ${msg.role === 'ai' ? 'bg-black/40 hover:bg-black/60 text-white/60 hover:text-white' : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white'}`}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="bg-black border-white/10 text-white">
                                                        <p className="text-[10px]">Copy</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </motion.div>

                                        <span className={`text-[9px] font-semibold text-white/20 uppercase tracking-wider ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Loading indicator */}
                    <AnimatePresence>
                        {loading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user' || messages[messages.length - 1]?.content === '') && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex gap-3 justify-start"
                            >
                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Terminal className="w-4 h-4 text-white" />
                                    </motion.div>
                                </div>
                                <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-white/5 flex items-center gap-2">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-white/70 rounded-full"
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input Area - Full Width */}
            <motion.div
                variants={toolbarVariants}
                initial="hidden"
                animate="visible"
                className="px-4 sm:px-6 lg:px-8 pb-6 bg-black"
            >
                <div className="w-full lg:w-[60%] mx-auto">
                    <div className="relative">
                        <div className="relative bg-black border border-white/20 rounded-2xl overflow-hidden focus-within:border-white/40 transition-colors">


                            {/* Input row */}
                            <div className="flex items-center p-2 gap-2">
                                <Input
                                    placeholder="Type instructions..."
                                    className="h-14 border-0 bg-transparent focus-visible:ring-0 text-[15px] placeholder:text-white/20 px-4 font-medium text-white"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    disabled={loading}
                                />
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        onClick={handleSend}
                                        disabled={loading || !input.trim()}
                                        className="h-11 px-5 rounded-xl bg-white hover:bg-white/90 text-black transition-all disabled:opacity-30 disabled:bg-white/20"
                                    >
                                        {loading ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                                <Zap className="w-4 h-4" />
                                            </motion.div>
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Keyboard hints */}
                    <div className="mt-3 flex items-center justify-center gap-6">
                        {[
                            { keys: 'ENTER', label: 'Send' },
                            { keys: '⌘ K', label: 'Search' },
                        ].map((hint) => (
                            <div key={hint.keys} className="flex items-center gap-2 opacity-30">
                                <kbd className="px-1.5 py-0.5 rounded border border-white/20 text-[9px] font-bold bg-white/5 text-white tracking-wider">
                                    {hint.keys}
                                </kbd>
                                <span className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">{hint.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

