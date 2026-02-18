import { supabase } from "../../config/supabase.js";

export async function signup(req, res) {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
}

export async function login(req, res) {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
}

export async function socialLogin(req, res) {
    const { provider } = req.body; // 'google' or 'github'
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${req.protocol}://${req.get('host')}/api/auth/callback`
        }
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ url: data.url });
}

export async function callback(req, res) {
    // Supabase handles the session via cookie or URL fragment on the client side usually
    // For server side redirect:
    res.redirect('/');
}
