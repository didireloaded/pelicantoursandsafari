export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      proposals: {
        Row: {
          id: string;
          traveller_id: string;
          enquiry_id: string | null;
          title: string;
          created_at: string;
        };
        Insert: { traveller_id: string; enquiry_id?: string | null; title: string };
        Update: { [key: string]: never };
        Relationships: [];
      };
      proposal_versions: {
        Row: {
          id: string;
          proposal_id: string;
          version: number;
          itinerary: string;
          accommodation: string;
          inclusions: string;
          exclusions: string;
          currency: string;
          total: number;
          terms: string;
          valid_until: string;
          published_by: string;
          created_at: string;
        };
        Insert: { [key: string]: never };
        Update: { [key: string]: never };
        Relationships: [];
      };
      proposal_requests: {
        Row: {
          id: string;
          version_id: string;
          traveller_id: string;
          message: string;
          created_at: string;
        };
        Insert: { version_id: string; traveller_id: string; message: string };
        Update: { [key: string]: never };
        Relationships: [];
      };
      travel_details: {
        Row: {
          id: string;
          category: string;
          title: string;
          body: string;
          source_url: string;
          photo_url: string | null;
          approved: boolean;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          category: string;
          title: string;
          body: string;
          source_url: string;
          photo_url?: string | null;
          approved: boolean;
          updated_by: string;
        };
        Update: {
          category?: string;
          title?: string;
          body?: string;
          source_url?: string;
          photo_url?: string | null;
          approved?: boolean;
          updated_by?: string;
        };
        Relationships: [];
      };
      enquiry_events: {
        Row: {
          id: string;
          enquiry_id: string;
          actor_id: string | null;
          created_at: string;
          previous_status: string;
          next_status: string;
          notes_changed: boolean;
          previous_assignee: string | null;
          next_assignee: string | null;
          previous_follow_up: string | null;
          next_follow_up: string | null;
        };
        Insert: { [key: string]: never };
        Update: { [key: string]: never };
        Relationships: [];
      };

      trips: {
        Row: {
          id: string;
          traveller_id: string;
          title: string;
          status: "draft" | "confirmed" | "cancelled";
          starts_on: string;
          stops: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          traveller_id: string;
          title: string;
          status?: "draft" | "confirmed" | "cancelled";
          starts_on: string;
          stops: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          traveller_id?: string;
          title?: string;
          status?: "draft" | "confirmed" | "cancelled";
          starts_on?: string;
          stops?: Json;
        };
        Relationships: [];
      };
      enquiries: {
        Row: {
          assigned_to: string | null;
          follow_up_on: string | null;
          brief: string;
          contact_preference: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          residence: string | null;
          safari_slug: string | null;
          staff_notes: string | null;
          status: Database["public"]["Enums"]["enquiry_status"];
          updated_at: string;
        };
        Insert: {
          brief: string;
          contact_preference?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          residence?: string | null;
          safari_slug?: string | null;
          staff_notes?: string | null;
          status?: Database["public"]["Enums"]["enquiry_status"];
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          follow_up_on?: string | null;
          brief?: string;
          contact_preference?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          residence?: string | null;
          safari_slug?: string | null;
          staff_notes?: string | null;
          status?: Database["public"]["Enums"]["enquiry_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      staff_directory: {
        Args: Record<string, never>;
        Returns: { user_id: string; email: string }[];
      };
      publish_proposal: {
        Args: { _proposal_id: string; _expected_version: number; _details: Json };
        Returns: string;
      };

      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "staff";
      enquiry_status:
        "new" | "contacted" | "building_itinerary" | "quote_sent" | "confirmed" | "closed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      enquiry_status: [
        "new",
        "contacted",
        "building_itinerary",
        "quote_sent",
        "confirmed",
        "closed",
      ],
    },
  },
} as const;
