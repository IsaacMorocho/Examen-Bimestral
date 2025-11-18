export interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  segmento: 'Básico' | 'Medio' | 'Premium';
  datos_moviles: string;
  minutos_voz: string;
  sms: string;
  velocidad_4g: string;
  velocidad_5g?: string;
  redes_sociales: string;
  whatsapp: string;
  llamadas_internacionales: string;
  roaming: string;
  imagen_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PlanDetalle {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  segmento: string;
  caracteristicas: PlanCaracteristica[];
  imagen_url?: string;
  activo: boolean;
}

export interface PlanCaracteristica {
  nombre: string;
  valor: string;
}
