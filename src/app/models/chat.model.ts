export interface MensajeChat {
  id: string;
  contratacion_id: string;
  usuario_id: string;
  asesor_id: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
}

export interface ConversacionChat {
  contratacion_id: string;
  usuario_id: string;
  usuario_nombre: string;
  asesor_id: string;
  asesor_nombre: string;
  plan_nombre: string;
  ultimo_mensaje: string;
  timestamp_ultimo: string;
  no_leidos: number;
}

export interface ConversacionUI extends ConversacionChat {
  avatar_url?: string;
  online?: boolean;
}
