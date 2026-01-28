
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Key missing!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const saveUserToDb = async (user: UserProfile) => {
    try {
        const { data, error } = await supabase
            .from('app_users')
            .upsert({
                email: user.email,
                name: user.name,
                gender: user.gender,
                profile_data: user, // Store the whole object for redundancy
                updated_at: new Date().toISOString()
            }, { onConflict: 'email' })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving user to Supabase:', error);
        return null;
    }
};

export const getUserByEmail = async (email: string) => {
    try {
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            // It's normal to not find a user if they are new, so we handle 406/Not Found gracefully
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
};

export const logActivityToDb = async (userId: string | undefined, type: string, details: any) => {
    // If no user email/id, we might rely on the one in local storage or passed in.
    // For now, let's assume we find the user by email stored in the details or user profile
    if (!userId) return;

    try {
        // First find the user UUID if we only have email
        // Ideally we pass the UUID. But 'user' object in App.tsx doesn't have the DB ID yet unless we add it.
        // Let's assume we pass the Supabase UUID or lookup by email.

        const { error } = await supabase
            .from('activities')
            .insert({
                user_id: userId,
                activity_type: type,
                details: details
            });

        if (error) console.error("Error logging activity:", error);
    } catch (e) {
        console.error("Exception logging activity:", e);
    }
}
