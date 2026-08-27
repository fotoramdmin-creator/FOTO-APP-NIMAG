export type DatosServicio = {
  clienteNombre: string;
  clienteTelefono: string;
  tipoEvento: string;

  fechaEvento: string;
  horarioEvento: string;

  lugarEvento: string;
  direccionEvento: string;

  fechaPruebas: string;
  horarioPruebas: string;

  fechaEntrega: string;
  horarioEntrega: string;

  fechaLimiteLiquidacion: string;

  notas: string;
};

export type ConceptoServicio = {
  id: string;
  cantidad: number;
  descripcion: string;
  medida: string;
  marco: string;
  especificaciones: string;
  precioUnitario: number;
  subtotal: number;
  requiereSeleccionTomas: boolean;
  cantidadTomasRequeridas: number;
};

export type ServicioCreado = {
  servicioId: string;
  folio: string;
  clienteNombre: string;
  usuarioId?: string;
  totalBruto: number;
  descuento: number;
  totalFinal: number;
  pendiente: number;
};

export const datosServicioIniciales: DatosServicio = {
  clienteNombre: "",
  clienteTelefono: "",
  tipoEvento: "",

  fechaEvento: "",
  horarioEvento: "",

  lugarEvento: "",
  direccionEvento: "",

  fechaPruebas: "",
  horarioPruebas: "",

  fechaEntrega: "",
  horarioEntrega: "",

  fechaLimiteLiquidacion: "",

  notas: "",
};