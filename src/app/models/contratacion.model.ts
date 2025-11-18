export type ContratacionStatus = 'pendiente' | 'activa' | 'cancelada' | 'renovacion';

export interface Contratacion {
  id: string;
  usuario_id: string;
  plan_id: string;
  estado: ContratacionStatus;
  fecha_inicio: string;
  fecha_fin?: string;
  precio_mensual: number;
  numero_linea?: string;
  created_at: string;
  updated_at: string;
}

export interface ContratacionDetalle extends Contratacion {
  usuario_nombre?: string;
  plan_nombre?: string;
}
