export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      enquiries: {
        Row: {
          assigned_to: string | null
          brief: string
          contact_preference: string | null
          created_at: string
          email: string | null
          follow_up_on: string | null
          id: string
          name: string
          phone: string | null
          request_hash: string | null
          request_id: string | null
          residence: string | null
          safari_slug: string | null
          staff_notes: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          brief: string
          contact_preference?: string | null
          created_at?: string
          email?: string | null
          follow_up_on?: string | null
          id?: string
          name: string
          phone?: string | null
          request_hash?: string | null
          request_id?: string | null
          residence?: string | null
          safari_slug?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          brief?: string
          contact_preference?: string | null
          created_at?: string
          email?: string | null
          follow_up_on?: string | null
          id?: string
          name?: string
          phone?: string | null
          request_hash?: string | null
          request_id?: string | null
          residence?: string | null
          safari_slug?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
        }
        Relationships: []
      }
      enquiry_events: {
        Row: {
          actor_id: string | null
          created_at: string
          enquiry_id: string
          id: string
          next_assignee: string | null
          next_follow_up: string | null
          next_status: Database["public"]["Enums"]["enquiry_status"] | null
          notes_changed: boolean
          previous_assignee: string | null
          previous_follow_up: string | null
          previous_status: Database["public"]["Enums"]["enquiry_status"] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          enquiry_id: string
          id?: string
          next_assignee?: string | null
          next_follow_up?: string | null
          next_status?: Database["public"]["Enums"]["enquiry_status"] | null
          notes_changed?: boolean
          previous_assignee?: string | null
          previous_follow_up?: string | null
          previous_status?: Database["public"]["Enums"]["enquiry_status"] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          enquiry_id?: string
          id?: string
          next_assignee?: string | null
          next_follow_up?: string | null
          next_status?: Database["public"]["Enums"]["enquiry_status"] | null
          notes_changed?: boolean
          previous_assignee?: string | null
          previous_follow_up?: string | null
          previous_status?: Database["public"]["Enums"]["enquiry_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_events_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          traveller_id: string
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          traveller_id: string
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          traveller_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_requests_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "proposal_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_versions: {
        Row: {
          accommodation: string
          created_at: string
          currency: string
          exclusions: string
          id: string
          inclusions: string
          itinerary: string
          proposal_id: string
          published_by: string
          terms: string
          total: number
          valid_until: string
          version: number
        }
        Insert: {
          accommodation: string
          created_at?: string
          currency: string
          exclusions: string
          id?: string
          inclusions: string
          itinerary: string
          proposal_id: string
          published_by: string
          terms: string
          total: number
          valid_until: string
          version: number
        }
        Update: {
          accommodation?: string
          created_at?: string
          currency?: string
          exclusions?: string
          id?: string
          inclusions?: string
          itinerary?: string
          proposal_id?: string
          published_by?: string
          terms?: string
          total?: number
          valid_until?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string
          enquiry_id: string | null
          id: string
          title: string
          traveller_id: string
        }
        Insert: {
          created_at?: string
          enquiry_id?: string | null
          id?: string
          title: string
          traveller_id: string
        }
        Update: {
          created_at?: string
          enquiry_id?: string | null
          id?: string
          title?: string
          traveller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          draft: Json
          id: string
          kind: string
          published: Json | null
          published_at: string | null
          revision: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          draft: Json
          id: string
          kind: string
          published?: Json | null
          published_at?: string | null
          revision?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          draft?: Json
          id?: string
          kind?: string
          published?: Json | null
          published_at?: string | null
          revision?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      site_content_history: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          content_id: string
          draft: Json
          id: number
          published: Json | null
          revision: number
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by: string
          content_id: string
          draft: Json
          id?: never
          published?: Json | null
          revision: number
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          content_id?: string
          draft?: Json
          id?: never
          published?: Json | null
          revision?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_content_history_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "site_content"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_details: {
        Row: {
          approved: boolean
          body: string
          category: string
          id: string
          package_details: Json | null
          photo_url: string | null
          safari_slug: string | null
          source_url: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          approved?: boolean
          body: string
          category: string
          id?: string
          package_details?: Json | null
          photo_url?: string | null
          safari_slug?: string | null
          source_url: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          approved?: boolean
          body?: string
          category?: string
          id?: string
          package_details?: Json | null
          photo_url?: string | null
          safari_slug?: string | null
          source_url?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          id: string
          starts_on: string
          status: string
          stops: Json
          title: string
          traveller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          starts_on: string
          status?: string
          stops: Json
          title: string
          traveller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          starts_on?: string
          status?: string
          stops?: Json
          title?: string
          traveller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_site: { Args: never; Returns: boolean }
      consume_ai_draft_request: { Args: never; Returns: boolean }
      consume_routing_request: {
        Args: { network_hash: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      publish_proposal: {
        Args: {
          _details: Json
          _expected_version: number
          _proposal_id: string
        }
        Returns: string
      }
      published_site_content: {
        Args: { _kind: string }
        Returns: {
          data: Json
          id: string
          kind: string
          updated_at: string
        }[]
      }
      save_site_content: {
        Args: {
          _action: string
          _draft: Json
          _id: string
          _kind: string
          _revision: number
        }
        Returns: Json
      }
      staff_directory: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      submit_enquiry: {
        Args: { network_hash: string; payload: Json }
        Returns: string
      }
      valid_trip_stops: { Args: { stops: Json }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff"
      enquiry_status:
        | "new"
        | "contacted"
        | "building_itinerary"
        | "quote_sent"
        | "confirmed"
        | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

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
} as const
