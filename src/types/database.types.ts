// Bu dosya Supabase projesinden otomatik üretilmiştir.
// Elle düzenlemeyin — şema değiştikçe `mcp__supabase__generate_typescript_types`
// (veya `supabase gen types typescript`) ile yeniden üretin.

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
      ders_programlari: {
        Row: {
          aktif: boolean
          baslangic_saati: string
          baslangic_tarihi: string
          bitis_saati: string
          bitis_tarihi: string | null
          created_at: string
          grup_id: string
          haftanin_gunu: number
          hoca_id: string
          id: string
        }
        Insert: {
          aktif?: boolean
          baslangic_saati: string
          baslangic_tarihi: string
          bitis_saati: string
          bitis_tarihi?: string | null
          created_at?: string
          grup_id: string
          haftanin_gunu: number
          hoca_id: string
          id?: string
        }
        Update: {
          aktif?: boolean
          baslangic_saati?: string
          baslangic_tarihi?: string
          bitis_saati?: string
          bitis_tarihi?: string | null
          created_at?: string
          grup_id?: string
          haftanin_gunu?: number
          hoca_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ders_programlari_grup_id_fkey"
            columns: ["grup_id"]
            isOneToOne: false
            referencedRelation: "gruplar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ders_programlari_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "profiller"
            referencedColumns: ["id"]
          },
        ]
      }
      dersler: {
        Row: {
          baslangic_saati: string
          bitis_saati: string
          created_at: string
          durum: string
          grup_id: string
          hoca_id: string
          id: string
          konu: string | null
          program_id: string | null
          program_tarihi: string | null
          tarih: string
        }
        Insert: {
          baslangic_saati: string
          bitis_saati: string
          created_at?: string
          durum?: string
          grup_id: string
          hoca_id: string
          id?: string
          konu?: string | null
          program_id?: string | null
          program_tarihi?: string | null
          tarih: string
        }
        Update: {
          baslangic_saati?: string
          bitis_saati?: string
          created_at?: string
          durum?: string
          grup_id?: string
          hoca_id?: string
          id?: string
          konu?: string | null
          program_id?: string | null
          program_tarihi?: string | null
          tarih?: string
        }
        Relationships: [
          {
            foreignKeyName: "dersler_grup_id_fkey"
            columns: ["grup_id"]
            isOneToOne: false
            referencedRelation: "gruplar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dersler_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "profiller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dersler_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "ders_programlari"
            referencedColumns: ["id"]
          },
        ]
      }
      gruplar: {
        Row: {
          aciklama: string | null
          ad: string
          arsivlendi_at: string | null
          created_at: string
          hoca_id: string
          id: string
          renk: string
          saatlik_ucret: number | null
        }
        Insert: {
          aciklama?: string | null
          ad: string
          arsivlendi_at?: string | null
          created_at?: string
          hoca_id: string
          id?: string
          renk?: string
          saatlik_ucret?: number | null
        }
        Update: {
          aciklama?: string | null
          ad?: string
          arsivlendi_at?: string | null
          created_at?: string
          hoca_id?: string
          id?: string
          renk?: string
          saatlik_ucret?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gruplar_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "profiller"
            referencedColumns: ["id"]
          },
        ]
      }
      hoca_ayarlari: {
        Row: {
          saatlik_ucret: number
          hoca_id: string
          updated_at: string
        }
        Insert: {
          saatlik_ucret: number
          hoca_id: string
          updated_at?: string
        }
        Update: {
          saatlik_ucret?: number
          hoca_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoca_ayarlari_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: true
            referencedRelation: "profiller"
            referencedColumns: ["id"]
          },
        ]
      }
      odemeler: {
        Row: {
          aciklama: string | null
          created_at: string
          hoca_id: string
          id: string
          odeme_yontemi: string
          ogrenci_id: string
          tarih: string
          tutar: number
        }
        Insert: {
          aciklama?: string | null
          created_at?: string
          hoca_id: string
          id?: string
          odeme_yontemi: string
          ogrenci_id: string
          tarih: string
          tutar: number
        }
        Update: {
          aciklama?: string | null
          created_at?: string
          hoca_id?: string
          id?: string
          odeme_yontemi?: string
          ogrenci_id?: string
          tarih?: string
          tutar?: number
        }
        Relationships: [
          {
            foreignKeyName: "odemeler_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "profiller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odemeler_ogrenci_id_fkey"
            columns: ["ogrenci_id"]
            isOneToOne: false
            referencedRelation: "ogrenci_bakiyeleri"
            referencedColumns: ["ogrenci_id"]
          },
          {
            foreignKeyName: "odemeler_ogrenci_id_fkey"
            columns: ["ogrenci_id"]
            isOneToOne: false
            referencedRelation: "ogrenciler"
            referencedColumns: ["id"]
          },
        ]
      }
      ogrenciler: {
        Row: {
          ad_soyad: string
          arsivlendi_at: string | null
          created_at: string
          grup_id: string | null
          hoca_id: string
          id: string
          notlar: string | null
          saatlik_ucret: number | null
          telefon: string | null
          veli_ad: string | null
          veli_telefon: string | null
        }
        Insert: {
          ad_soyad: string
          arsivlendi_at?: string | null
          created_at?: string
          grup_id?: string | null
          hoca_id: string
          id?: string
          notlar?: string | null
          saatlik_ucret?: number | null
          telefon?: string | null
          veli_ad?: string | null
          veli_telefon?: string | null
        }
        Update: {
          ad_soyad?: string
          arsivlendi_at?: string | null
          created_at?: string
          grup_id?: string | null
          hoca_id?: string
          id?: string
          notlar?: string | null
          saatlik_ucret?: number | null
          telefon?: string | null
          veli_ad?: string | null
          veli_telefon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ogrenciler_grup_id_fkey"
            columns: ["grup_id"]
            isOneToOne: false
            referencedRelation: "gruplar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ogrenciler_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "profiller"
            referencedColumns: ["id"]
          },
        ]
      }
      profiller: {
        Row: {
          ad_soyad: string
          aktif: boolean
          created_at: string
          id: string
          kullanici_adi: string
          rol: string
        }
        Insert: {
          ad_soyad: string
          aktif?: boolean
          created_at?: string
          id: string
          kullanici_adi: string
          rol: string
        }
        Update: {
          ad_soyad?: string
          aktif?: boolean
          created_at?: string
          id?: string
          kullanici_adi?: string
          rol?: string
        }
        Relationships: []
      }
      yoklamalar: {
        Row: {
          created_at: string
          ders_id: string
          durum: string
          hoca_id: string
          id: string
          ogrenci_id: string
          ucret: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          ders_id: string
          durum: string
          hoca_id: string
          id?: string
          ogrenci_id: string
          ucret: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          ders_id?: string
          durum?: string
          hoca_id?: string
          id?: string
          ogrenci_id?: string
          ucret?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yoklamalar_ders_id_fkey"
            columns: ["ders_id"]
            isOneToOne: false
            referencedRelation: "dersler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yoklamalar_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "profiller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yoklamalar_ogrenci_id_fkey"
            columns: ["ogrenci_id"]
            isOneToOne: false
            referencedRelation: "ogrenci_bakiyeleri"
            referencedColumns: ["ogrenci_id"]
          },
          {
            foreignKeyName: "yoklamalar_ogrenci_id_fkey"
            columns: ["ogrenci_id"]
            isOneToOne: false
            referencedRelation: "ogrenciler"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ogrenci_bakiyeleri: {
        Row: {
          bakiye: number | null
          hoca_id: string | null
          ogrenci_id: string | null
          toplam_odeme: number | null
          toplam_tahakkuk: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ogrenciler_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "profiller"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      dersleri_uret: {
        Args: { p_baslangic: string; p_bitis: string }
        Returns: undefined
      }
      grubu_arsivle: {
        Args: { p_grup_id: string; p_ogrencileri_de_arsivle: boolean }
        Returns: undefined
      }
      is_yonetici: { Args: never; Returns: boolean }
      program_derslerini_temizle: {
        Args: { p_program_id: string; p_tarihten: string }
        Returns: number
      }
      programi_sonlandir: {
        Args: { p_program_id: string; p_son_tarih: string }
        Returns: string
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
    Enums: {},
  },
} as const
