export type UserRole = 'asesor_comercial' | 'usuario_registrado';

export interface User {
  id: string;
  email: string | null;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user?: User | null;
  session?: any;
  error?: string | null;
}
