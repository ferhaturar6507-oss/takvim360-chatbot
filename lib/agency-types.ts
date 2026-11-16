export type WhatsAppStatus = "connected" | "pending" | "error";
export type PackageType = "Başlangıç" | "Ekip" | "İşletme";
export type ChannelType = "whatsapp" | "instagram" | "web";
export type ConversationStatus = "open" | "pending" | "resolved";

export interface ChatMessageItem {
  from: "customer" | "agent";
  text: string;
  at: string;
  ai?: boolean;
}

export interface Business {
  id: string;
  name: string;
  sector: string;
  phone: string;
  whatsapp_number: string;
  package_type: PackageType | string;
  whatsapp_status: WhatsAppStatus | string;
  bot_active: boolean;
  auto_reply: boolean;
  admin_name: string;
  ai_tone: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
  // Computed stats from /api/businesses
  article_count?: number;
  open_conversations?: number;
  intervention_count?: number;
}

export interface KnowledgeArticle {
  id: string;
  business_id: string;
  title: string;
  category: string;
  content: string;
  uses: number;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: string;
  business_id: string;
  customer_name: string;
  customer_initials: string;
  customer_phone: string;
  channel: ChannelType;
  status: ConversationStatus;
  needs_intervention: boolean;
  intent: string;
  last_message: string;
  waiting_min: number;
  unread: boolean;
  suggested_reply: string | null;
  suggested_source: string | null;
  confidence: number;
  messages: ChatMessageItem[];
  created_at: string;
  updated_at: string;
}
