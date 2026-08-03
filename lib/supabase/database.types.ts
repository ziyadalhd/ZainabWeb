export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: { created_at: string; user_id: string };
        Insert: { created_at?: string; user_id: string };
        Update: { created_at?: string; user_id?: string };
        Relationships: [];
      };
      events: {
        Row: {
          audience: string;
          availability: string;
          capacity: number;
          created_at: string;
          event_type_label: string;
          id: string;
          publication_status: string;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          audience: string;
          availability?: string;
          capacity: number;
          created_at?: string;
          event_type_label: string;
          id?: string;
          publication_status?: string;
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          audience?: string;
          availability?: string;
          capacity?: number;
          created_at?: string;
          event_type_label?: string;
          id?: string;
          publication_status?: string;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
