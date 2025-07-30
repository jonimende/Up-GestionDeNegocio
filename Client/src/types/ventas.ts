export interface Venta {
  id: number;
  cantidad: number;
  total: number;
  fecha: string;
  celularId?: number | null;
  accesorioId?: number | null;
  reparacionId?: number | null;
  metodoPago?: string | null;
  descuento?: number | null;
  comprador?: string | null;
}
