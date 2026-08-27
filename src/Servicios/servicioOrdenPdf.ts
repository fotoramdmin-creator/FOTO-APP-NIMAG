import { jsPDF } from "jspdf";

export type ConceptoOrdenServicio = {
  cantidad: number;
  descripcion: string;
  medida: string | null;
  marco: string | null;
  especificaciones: string | null;
  precioUnitario: number;
  subtotal: number;
};

export type OrdenServicioParams = {
  folio: string;
  fechaCreacion: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  tipoEvento: string;
  fechaEvento: string;
  horarioEvento: string | null;
  lugarEvento: string | null;
  direccionEvento: string | null;
  fechaPruebas: string | null;
  horarioPruebas: string | null;
  fechaEntrega: string | null;
  horarioEntrega: string | null;
  fechaLimiteLiquidacion: string | null;
  notas: string | null;
  conceptos: ConceptoOrdenServicio[];
  totalBruto: number;
  descuento: number;
  totalFinal: number;
  pagoInicial: number;
  saldoInicial: number;
  metodosPagoInicial: string;
  cuentasPagoInicial: string;
  usuarioNombre: string;
};

type ImagenOrden = {
  dataUrl: string;
  width: number;
  height: number;
};

const ANCHO = 215.9;
const ALTO = 279.4;
const MARGEN = 14;
const LOGO_URL = "/negro.png";

const OLIVE: [number, number, number] = [54, 65, 46];
const GOLD: [number, number, number] = [184, 159, 84];
const TEXT: [number, number, number] = [28, 26, 21];
const SOFT: [number, number, number] = [105, 101, 93];
const LIGHT: [number, number, number] = [248, 245, 238];
const WHITE: [number, number, number] = [255, 255, 255];

let logoPreparado: ImagenOrden | null = null;
let recursosPreparados = false;
let promesaPreparacion: Promise<void> | null = null;

const money = (valor: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));

const formatearFecha = (fecha: string | null) => {
  if (!fecha) return "POR PROGRAMAR";

  return new Date(`${fecha}T12:00:00`).toLocaleDateString(
    "es-MX",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
};

const formatearHora = (hora: string | null) => {
  if (!hora) return "POR CONFIRMAR";

  const [horas, minutos] = hora.split(":");
  const fecha = new Date();

  fecha.setHours(
    Number(horas),
    Number(minutos || 0),
    0,
    0
  );

  return fecha.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatearFechaCreacion = (fecha: string) =>
  new Date(fecha).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const limpiarNombreArchivo = (valor: string) =>
  String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");

const cargarImagen = (
  url: string
): Promise<ImagenOrden> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(
          new Error("No se pudo preparar el logo.")
        );
        return;
      }

      context.drawImage(img, 0, 0);

      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };

    img.onerror = () =>
      reject(
        new Error("No se pudo cargar el logo.")
      );

    img.src = url;
  });

export const prepararOrdenServicioPdf =
  (): Promise<void> => {
    if (recursosPreparados) {
      return Promise.resolve();
    }

    if (promesaPreparacion) {
      return promesaPreparacion;
    }

    promesaPreparacion = cargarImagen(LOGO_URL)
      .then((logo) => {
        logoPreparado = logo;
      })
      .catch((error) => {
        console.warn(
          "La orden se generará sin logo:",
          error
        );
        logoPreparado = null;
      })
      .then(() => {
        recursosPreparados = true;
      });

    return promesaPreparacion;
  };

void prepararOrdenServicioPdf();

const dibujarCopia = (
  doc: jsPDF,
  params: OrdenServicioParams,
  copia: "CLIENTE" | "ESTUDIO"
) => {
  let y = 12;

  const tituloSeccion = (
    titulo: string,
    x: number,
    yTitulo: number
  ) => {
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(titulo.toUpperCase(), x, yTitulo);
  };

  const campo = (
    etiqueta: string,
    valor: string,
    x: number,
    yCampo: number,
    anchoValor: number
  ) => {
    doc.setTextColor(...SOFT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.3);
    doc.text(etiqueta.toUpperCase(), x, yCampo);

    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);

    const texto = doc
      .splitTextToSize(
        String(valor || "-"),
        anchoValor
      )
      .slice(0, 2);

    doc.text(texto, x + 31, yCampo);
  };

  // ENCABEZADO
  if (logoPreparado) {
    const proporcion =
      logoPreparado.width / logoPreparado.height;

    const anchoLogo = 60;
    const altoLogo = anchoLogo / proporcion;

    doc.addImage(
      logoPreparado.dataUrl,
      "PNG",
      MARGEN,
      y,
      anchoLogo,
      altoLogo
    );
  } else {
    doc.setTextColor(...OLIVE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(
      "FOTO STUDIO RAMÍREZ",
      MARGEN,
      y + 9
    );
  }

  doc.setTextColor(...OLIVE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(
    "ORDEN DE SERVICIO",
    ANCHO - MARGEN,
    y + 7,
    { align: "right" }
  );

  doc.setTextColor(...GOLD);
  doc.setFontSize(9);
  doc.text(
    `COPIA DEL ${copia}`,
    ANCHO - MARGEN,
    y + 16,
    { align: "right" }
  );

  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    `Folio: ${params.folio}`,
    ANCHO - MARGEN,
    y + 23,
    { align: "right" }
  );

  doc.text(
    formatearFechaCreacion(
      params.fechaCreacion
    ),
    ANCHO - MARGEN,
    y + 29,
    { align: "right" }
  );

  y = 53;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(MARGEN, y, ANCHO - MARGEN, y);

  y += 6;

  // CLIENTE Y EVENTO EN DOS COLUMNAS
  const espacioColumnas = 5;
  const anchoCliente = 70;
  const xCliente = MARGEN;
  const xEvento =
    MARGEN + anchoCliente + espacioColumnas;
  const anchoEvento =
    ANCHO -
    MARGEN -
    xEvento;

  tituloSeccion(
    "Datos del cliente",
    xCliente,
    y
  );

  tituloSeccion(
    "Datos del evento",
    xEvento,
    y
  );

  y += 4;

  const altoDatos = 31;

  doc.setFillColor(...LIGHT);
  doc.roundedRect(
    xCliente,
    y,
    anchoCliente,
    altoDatos,
    3,
    3,
    "F"
  );

  doc.roundedRect(
    xEvento,
    y,
    anchoEvento,
    altoDatos,
    3,
    3,
    "F"
  );

  campo(
    "Cliente",
    params.clienteNombre,
    xCliente + 4,
    y + 7,
    anchoCliente - 40
  );

  campo(
    "Teléfono",
    params.clienteTelefono ||
      "SIN TELÉFONO",
    xCliente + 4,
    y + 18,
    anchoCliente - 40
  );

  campo(
    "Servicio",
    params.tipoEvento,
    xEvento + 4,
    y + 6,
    anchoEvento - 39
  );

  campo(
    "Fecha",
    formatearFecha(params.fechaEvento),
    xEvento + 4,
    y + 12,
    anchoEvento - 39
  );

  campo(
    "Horario",
    formatearHora(params.horarioEvento),
    xEvento + 4,
    y + 18,
    anchoEvento - 39
  );

  campo(
    "Lugar",
    params.lugarEvento ||
      "POR CONFIRMAR",
    xEvento + 4,
    y + 24,
    anchoEvento - 39
  );

  campo(
    "Dirección",
    params.direccionEvento ||
      "POR CONFIRMAR",
    xEvento + 4,
    y + 30,
    anchoEvento - 39
  );

  y += altoDatos + 7;

  // PRODUCTOS
  tituloSeccion(
    "Productos contratados",
    MARGEN,
    y
  );

  y += 4;

  doc.setFillColor(...OLIVE);
  doc.rect(
    MARGEN,
    y,
    ANCHO - MARGEN * 2,
    8,
    "F"
  );

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);

  doc.text("CANT.", MARGEN + 3, y + 5);
  doc.text(
    "DESCRIPCIÓN",
    MARGEN + 19,
    y + 5
  );
  doc.text(
    "P. UNITARIO",
    ANCHO - 64,
    y + 5
  );
  doc.text(
    "IMPORTE",
    ANCHO - MARGEN - 3,
    y + 5,
    { align: "right" }
  );

  y += 8;

  params.conceptos.forEach(
    (concepto, index) => {
      const descripcion = doc
        .splitTextToSize(
          concepto.descripcion,
          82
        )
        .slice(0, 2);

      const detallesTexto = [
        concepto.medida
          ? `Medida: ${concepto.medida}`
          : "",
        concepto.marco
          ? `Marco/acabado: ${concepto.marco}`
          : "",
        concepto.especificaciones || "",
      ]
        .filter(Boolean)
        .join(" · ");

      const detalles = detallesTexto
        ? doc
            .splitTextToSize(
              detallesTexto,
              82
            )
            .slice(0, 2)
        : [];

      const altoRenglon = Math.max(
        9,
        descripcion.length * 3.6 +
          detalles.length * 3 +
          3
      );

      if (index % 2 === 0) {
        doc.setFillColor(252, 250, 245);
        doc.rect(
          MARGEN,
          y,
          ANCHO - MARGEN * 2,
          altoRenglon,
          "F"
        );
      }

      doc.setTextColor(...TEXT);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);

      doc.text(
        String(concepto.cantidad),
        MARGEN + 6,
        y + 5
      );

      doc.text(
        descripcion,
        MARGEN + 19,
        y + 5
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.9);

      doc.text(
        money(concepto.precioUnitario),
        ANCHO - 64,
        y + 5
      );

      doc.setFont("helvetica", "bold");

      doc.text(
        money(concepto.subtotal),
        ANCHO - MARGEN - 3,
        y + 5,
        { align: "right" }
      );

      if (detalles.length > 0) {
        doc.setTextColor(...SOFT);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.2);

        doc.text(
          detalles,
          MARGEN + 19,
          y + 5 + descripcion.length * 3.6
        );
      }

      y += altoRenglon;
    }
  );

  y += 3;

  // TOTALES
  const xTotales = ANCHO - 88;

  const total = (
    etiqueta: string,
    valor: number,
    destacado = false
  ) => {
    doc.setTextColor(...SOFT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.text(etiqueta, xTotales, y);

    doc.setTextColor(
      ...(destacado ? OLIVE : TEXT)
    );
    doc.setFontSize(destacado ? 9 : 7.8);
    doc.text(
      money(valor),
      ANCHO - MARGEN,
      y,
      { align: "right" }
    );

    y += destacado ? 5.5 : 4.5;
  };

  total(
    "TOTAL BRUTO",
    params.totalBruto
  );
  total(
    "DESCUENTO",
    params.descuento
  );
  total(
    "TOTAL FINAL",
    params.totalFinal,
    true
  );

  y += 1;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.35);
  doc.line(MARGEN, y, ANCHO - MARGEN, y);

  y += 6;

  // PAGO Y FECHAS EN DOS COLUMNAS
  const anchoResumen =
    (ANCHO - MARGEN * 2 - 5) / 2;
  const xPago = MARGEN;
  const xFechas =
    MARGEN + anchoResumen + 5;

  tituloSeccion(
    "Pago inicial",
    xPago,
    y
  );

  tituloSeccion(
    "Fechas posteriores",
    xFechas,
    y
  );

  y += 4;

  const altoResumen = 37;

  doc.setFillColor(...LIGHT);

  doc.roundedRect(
    xPago,
    y,
    anchoResumen,
    altoResumen,
    3,
    3,
    "F"
  );

  doc.roundedRect(
    xFechas,
    y,
    anchoResumen,
    altoResumen,
    3,
    3,
    "F"
  );

  campo(
    "Pago",
    money(params.pagoInicial),
    xPago + 4,
    y + 6,
    anchoResumen - 39
  );

  campo(
    "Método",
    params.metodosPagoInicial ||
      "SIN MÉTODO",
    xPago + 4,
    y + 12,
    anchoResumen - 39
  );

  campo(
    "Cuenta",
    params.cuentasPagoInicial ||
      "NO APLICA",
    xPago + 4,
    y + 18,
    anchoResumen - 39
  );

  campo(
    "Saldo",
    money(params.saldoInicial),
    xPago + 4,
    y + 24,
    anchoResumen - 39
  );

  campo(
    "Límite",
    formatearFecha(
      params.fechaLimiteLiquidacion
    ),
    xPago + 4,
    y + 30,
    anchoResumen - 39
  );

  campo(
    "Pruebas",
    `${formatearFecha(
      params.fechaPruebas
    )} · ${formatearHora(
      params.horarioPruebas
    )}`,
    xFechas + 4,
    y + 7,
    anchoResumen - 39
  );

  campo(
    "Entrega",
    `${formatearFecha(
      params.fechaEntrega
    )} · ${formatearHora(
      params.horarioEntrega
    )}`,
    xFechas + 4,
    y + 17,
    anchoResumen - 39
  );

  if (params.notas) {
    doc.setTextColor(...SOFT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.3);
    doc.text(
      "NOTAS",
      xFechas + 4,
      y + 27
    );

    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);

    const notas = doc
      .splitTextToSize(
        params.notas,
        anchoResumen - 12
      )
      .slice(0, 2);

    doc.text(
      notas,
      xFechas + 4,
      y + 32
    );
  }

  y += altoResumen;

  // FIRMAS
  const yFirmas = Math.max(
    y + 11,
    ALTO - 24
  );

  doc.setDrawColor(...SOFT);
  doc.setLineWidth(0.25);

  doc.line(
    MARGEN + 5,
    yFirmas,
    MARGEN + 75,
    yFirmas
  );

  doc.line(
    ANCHO - MARGEN - 75,
    yFirmas,
    ANCHO - MARGEN - 5,
    yFirmas
  );

  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  doc.text(
    "FIRMA DEL CLIENTE",
    MARGEN + 40,
    yFirmas + 5,
    { align: "center" }
  );

  doc.text(
    "FOTO STUDIO RAMÍREZ",
    ANCHO - MARGEN - 40,
    yFirmas + 5,
    { align: "center" }
  );

  doc.setFontSize(6.3);

  doc.text(
    `Registró: ${
      params.usuarioNombre ||
      "SIN USUARIO"
    }`,
    MARGEN,
    ALTO - 7
  );

  doc.text(
    `Generado: ${formatearFechaCreacion(
      params.fechaCreacion
    )}`,
    ANCHO - MARGEN,
    ALTO - 7,
    { align: "right" }
  );
};

export const generarOrdenServicioPdf = (
  params: OrdenServicioParams
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
    compress: true,
  });

  dibujarCopia(
    doc,
    params,
    "CLIENTE"
  );

  doc.addPage(
    "letter",
    "portrait"
  );

  dibujarCopia(
    doc,
    params,
    "ESTUDIO"
  );

  return doc;
};

const construirNombreArchivo = (
  params: OrdenServicioParams
) => {
  const cliente =
    limpiarNombreArchivo(
      params.clienteNombre
    ) || "cliente";

  return `orden_${params.folio}_${cliente}.pdf`;
};

export const compartirOrdenServicioPdf = async (
  params: OrdenServicioParams
) => {
  await prepararOrdenServicioPdf();

  const doc =
    generarOrdenServicioPdf(params);

  const blob = doc.output("blob");

  const nombreArchivo =
    construirNombreArchivo(params);

  const archivo = new File(
    [blob],
    nombreArchivo,
    {
      type: "application/pdf",
    }
  );

  const puedeCompartir =
    Boolean(navigator.share) &&
    Boolean(navigator.canShare) &&
    (() => {
      try {
        return navigator.canShare({
          files: [archivo],
        });
      } catch {
        return false;
      }
    })();

  if (puedeCompartir) {
    try {
      await navigator.share({
        title: "Orden de servicio",
        text: `Orden de servicio ${params.folio}`,
        files: [archivo],
      });

      return;
    } catch (error: any) {
      if (
        error?.name === "AbortError"
      ) {
        return;
      }

      console.warn(
        "No se pudo abrir Compartir; se descargará la orden:",
        error
      );
    }
  }

  const url =
    URL.createObjectURL(blob);

  const enlace =
    document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = "none";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
};