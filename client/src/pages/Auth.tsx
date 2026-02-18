import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Github, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailAuth = async (type: 'login' | 'signup') => {
        setLoading(true);
        try {
            const { error } = type === 'login'
                ? await supabase.auth.signInWithPassword({ email, password })
                : await supabase.auth.signUp({ email, password });

            if (error) throw error;

            if (type === 'signup') {
                toast.success('Check your email for the confirmation link!');
            } else {
                toast.success('Logged in successfully!');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-500">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">Memtex</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Your unified AI memory dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        {['login', 'signup'].map((tab) => (
                            <TabsContent key={tab} value={tab} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`${tab}-email`}>Email</Label>
                                    <Input
                                        id={`${tab}-email`}
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${tab}-password`}>Password</Label>
                                    <Input
                                        id={`${tab}-password`}
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <Button
                                    className="w-full mt-2 font-semibold"
                                    onClick={() => handleEmailAuth(tab as any)}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}
                                </Button>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="w-full hover:bg-accent transition-colors" onClick={() => handleOAuth('github')}>
                            <Github className="mr-2 h-4 w-4" />
                            GitHub
                        </Button>
                        <Button variant="outline" className="w-full hover:bg-accent transition-colors" onClick={() => handleOAuth('google')}>
                            <Mail className="mr-2 h-4 w-4 text-red-500" />
                            Google
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-center text-xs text-muted-foreground w-full">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
