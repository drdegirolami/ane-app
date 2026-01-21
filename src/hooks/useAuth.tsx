import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'patient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return data?.role as UserRole | null;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Check if this is a fresh browser session that shouldn't have remembered the user
        const sessionOnlyFlag = sessionStorage.getItem('session_only');
        const wasSessionOnly = localStorage.getItem('was_session_only');
        
        if (wasSessionOnly === 'true' && !sessionOnlyFlag && session) {
          // Browser was closed and user didn't want to be remembered
          localStorage.removeItem('was_session_only');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id).then(setRole);
          }, 0);
        } else {
          setRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Check if this is a fresh browser session that shouldn't have remembered the user
      const sessionOnlyFlag = sessionStorage.getItem('session_only');
      const wasSessionOnly = localStorage.getItem('was_session_only');
      
      if (wasSessionOnly === 'true' && !sessionOnlyFlag && session) {
        // Browser was closed and user didn't want to be remembered
        localStorage.removeItem('was_session_only');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id).then(setRole);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && !rememberMe) {
      // Mark this session as "session only" - will be cleared when browser closes
      sessionStorage.setItem('session_only', 'true');
      localStorage.setItem('was_session_only', 'true');
    } else if (!error && rememberMe) {
      // Clear any previous "session only" flags
      sessionStorage.removeItem('session_only');
      localStorage.removeItem('was_session_only');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const value = {
    user,
    session,
    role,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin: role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
