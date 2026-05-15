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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contracts: {
        Row: {
          contractor_name: string
          created_at: string | null
          id: string
          road_segments: unknown
          warranty_expiry: string | null
        }
        Insert: {
          contractor_name: string
          created_at?: string | null
          id?: string
          road_segments?: unknown
          warranty_expiry?: string | null
        }
        Update: {
          contractor_name?: string
          created_at?: string | null
          id?: string
          road_segments?: unknown
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          address: string | null
          assigned_officer_id: string | null
          category: string
          contract_id: string | null
          created_at: string | null
          description: string | null
          exif_data: Json | null
          geom: unknown
          id: string
          image_path: string | null
          image_url: string
          location: Json
          status: string
          updated_at: string | null
          urgency_score: number
          user_id: string
          ward_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_officer_id?: string | null
          category: string
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          exif_data?: Json | null
          geom: unknown
          id?: string
          image_path?: string | null
          image_url: string
          location: Json
          status?: string
          updated_at?: string | null
          urgency_score?: number
          user_id: string
          ward_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_officer_id?: string | null
          category?: string
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          exif_data?: Json | null
          geom?: unknown
          id?: string
          image_path?: string | null
          image_url?: string
          location?: Json
          status?: string
          updated_at?: string | null
          urgency_score?: number
          user_id?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          last_activity: string | null
          reputation_score: number
          streak_count: number
          user_id: string
          xp_total: number
        }
        Insert: {
          last_activity?: string | null
          reputation_score?: number
          streak_count?: number
          user_id: string
          xp_total?: number
        }
        Update: {
          last_activity?: string | null
          reputation_score?: number
          streak_count?: number
          user_id?: string
          xp_total?: number
        }
        Relationships: []
      }
      wards: {
        Row: {
          assigned_officer_id: string | null
          created_at: string | null
          geom: unknown
          id: string
          ward_name: string
        }
        Insert: {
          assigned_officer_id?: string | null
          created_at?: string | null
          geom: unknown
          id?: string
          ward_name: string
        }
        Update: {
          assigned_officer_id?: string | null
          created_at?: string | null
          geom?: unknown
          id?: string
          ward_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_nearby_reports: {
        Args: {
          category_text: string
          lat: number
          lng: number
          radius_meters: number
        }
        Returns: {
          distance: number
          id: string
        }[]
      }
      get_report_clusters: {
        Args: { radius_meters: number }
        Returns: {
          center: unknown
          cluster_id: number
          report_ids: string[]
        }[]
      }
      get_reports_in_radius: {
        Args: { lat: number; lng: number; radius_meters: number }
        Returns: {
          address: string | null
          assigned_officer_id: string | null
          category: string
          contract_id: string | null
          created_at: string | null
          description: string | null
          exif_data: Json | null
          geom: unknown
          id: string
          image_path: string | null
          image_url: string
          location: Json
          status: string
          updated_at: string | null
          urgency_score: number
          user_id: string
          ward_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
