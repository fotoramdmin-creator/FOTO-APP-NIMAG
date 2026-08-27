export type EstadoItemProduccion =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "LISTO";

export type TipoTareaProduccion =
  | "RETOQUE"
  | "CAMBIO_FONDO"
  | "EDICION_DISENO"
  | "IMPRESION"
  | "ENMARCADO"
  | "ARMADO_ALBUM"
  | "REVISION_FINAL"
  | "OTRO";

export type EstadoTareaProduccion =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "ENVIADO_PROVEEDOR"
  | "RECIBIDO_PROVEEDOR"
  | "COMPLETADO"
  | "OMITIDO";

export type OpcionTareaProduccion = {
  tipo: TipoTareaProduccion;
  nombre: string;
  descripcion: string;
  aceptaProveedor: boolean;
};

export const OPCIONES_TAREAS_PRODUCCION: OpcionTareaProduccion[] = [
  {
    tipo: "RETOQUE",
    nombre: "Retoque",
    descripcion: "Corrección de color, piel y detalles de la fotografía.",
    aceptaProveedor: false,
  },
  {
    tipo: "CAMBIO_FONDO",
    nombre: "Cambio de fondo",
    descripcion: "Recorte y sustitución del fondo original.",
    aceptaProveedor: false,
  },
  {
    tipo: "EDICION_DISENO",
    nombre: "Edición o diseño",
    descripcion: "Edición de video, diseño de álbum o composición.",
    aceptaProveedor: false,
  },
  {
    tipo: "IMPRESION",
    nombre: "Impresión",
    descripcion: "Envío de fotografías a un proveedor de impresión.",
    aceptaProveedor: true,
  },
  {
    tipo: "ENMARCADO",
    nombre: "Enmarcado",
    descripcion: "Envío del producto terminado al proveedor de marcos.",
    aceptaProveedor: true,
  },
  {
    tipo: "ARMADO_ALBUM",
    nombre: "Armado de álbum",
    descripcion: "Fabricación o armado del álbum con un proveedor.",
    aceptaProveedor: true,
  },
  {
    tipo: "REVISION_FINAL",
    nombre: "Revisión final",
    descripcion: "Comprobar medidas, acabados y calidad antes de entregar.",
    aceptaProveedor: false,
  },
  {
    tipo: "OTRO",
    nombre: "Otra tarea",
    descripcion: "Actividad especial necesaria para este producto.",
    aceptaProveedor: true,
  },
];

export type ConceptoParaProduccion = {
  id: string;
  cantidad: number;
  descripcion: string;
  medida: string | null;
  marco: string | null;
  especificaciones: string | null;
  tomasSeleccionadas: string[];
};

export type ConfiguracionProductoProduccion = {
  conceptoId: string;
  tareas: TipoTareaProduccion[];
};