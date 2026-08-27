import { jsPDF } from "jspdf";
import type { ResultadoPago } from "../TomaPedidos/Vista4Pago";

export type TicketPagoServicioParams = {
  folio: string;
  clienteNombre: string;
  totalServicio: number;
  usuarioNombre: string;
  pago: ResultadoPago;
  reimpresion?: boolean;
};

type ImagenTicket = {
  dataUrl: string;
  width: number;
  height: number;
};

const ANCHO = 80;
const ALTO = 135;
const LOGO_URL = "/negro.png";

let logoPreparado: ImagenTicket | null = null;
let recursosPreparados = false;
let promesaPreparacion: Promise<void> | null = null;

const money = (valor: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));

const formatearFechaHora = (fecha: string) =>
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

const obtenerNumeroRecibo = (
  folio: string,
  fechaPago: string
) => {
  const fechaClave = fechaPago.replace(/\D/g, "").slice(0, 14);
  return `${folio}-${fechaClave}`;
};

const cargarImagen = (url: string): Promise<ImagenTicket> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("No se pudo preparar el logo."));
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
      reject(new Error("No se pudo cargar el logo."));

    img.src = url;
  });

export const prepararTicketPagoServicio = (): Promise<void> => {
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
        "El comprobante se generará sin logo:",
        error
      );
      logoPreparado = null;
    })
    .then(() => {
      recursosPreparados = true;
    });

  return promesaPreparacion;
};

void prepararTicketPagoServicio();

const dibujarCopia = (
  doc: jsPDF,
  params: TicketPagoServicioParams,
  copia: "CLIENTE" | "ESTUDIO"
) => {
  let y = 7;

  const linea = (grosor = 0.2) => {
    doc.setLineWidth(grosor);
    doc.line(5, y, ANCHO - 5, y);
    y += 5;
  };

  const centrar = (
    texto: string,
    tamano = 8,
    estilo: "normal" | "bold" = "normal"
  ) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamano);

    const lineas = doc.splitTextToSize(
      String(texto || "").toUpperCase(),
      ANCHO - 12
    );

    lineas.forEach((lineaTexto: string) => {
      const anchoTexto = doc.getTextWidth(lineaTexto);
      doc.text(lineaTexto, (ANCHO - anchoTexto) / 2, y);
      y += tamano / 2 + 1.5;
    });
  };

  const renglon = (
    etiqueta: string,
    valor: string,
    destacado = false
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(etiqueta.toUpperCase(), 6, y);

    doc.setFont(
      "helvetica",
      destacado ? "bold" : "normal"
    );
    doc.setFontSize(destacado ? 8.5 : 7.5);

    const texto = String(valor || "-");
    const anchoTexto = doc.getTextWidth(texto);

    doc.text(texto, ANCHO - 6 - anchoTexto, y);
    y += 4;
  };

  if (logoPreparado) {
    const proporcion =
      logoPreparado.width / logoPreparado.height;
    const anchoLogo = 24;
    const altoLogo = anchoLogo / proporcion;

    doc.addImage(
      logoPreparado.dataUrl,
      "PNG",
      (ANCHO - anchoLogo) / 2,
      y,
      anchoLogo,
      altoLogo
    );

    y += altoLogo + 4;
  } else {
    centrar("FOTO STUDIO RAMÍREZ", 11, "bold");
    y += 1;
  }

  centrar("COMPROBANTE DE PAGO", 9, "bold");
  centrar(`COPIA DEL ${copia}`, 7, "bold");

  if (params.reimpresion) {
    centrar("REIMPRESIÓN", 8, "bold");
  }

  linea(0.5);

  renglon("SERVICIO", params.folio);
  renglon(
    "RECIBO",
    obtenerNumeroRecibo(
      params.folio,
      params.pago.fechaPago
    )
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  const cliente = doc.splitTextToSize(
    params.clienteNombre.toUpperCase(),
    ANCHO - 12
  );

  doc.text(cliente, 6, y);
  y += cliente.length * 4.5 + 2;

  renglon(
    "FECHA",
    formatearFechaHora(params.pago.fechaPago)
  );

  renglon(
    "TIPO",
    params.pago.tipoPago === "LIQUIDACION"
      ? "LIQUIDACIÓN"
      : "ABONO A CUENTA"
  );

  linea();

  centrar("DESGLOSE DEL PAGO", 7, "bold");
  y += 1;

  params.pago.pagos.forEach((parte) => {
    renglon(
      parte.metodo_pago || "SIN MÉTODO",
      money(Number(parte.monto || 0)),
      true
    );

    if (parte.cuenta_destino) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);

      const cuenta = doc.splitTextToSize(
        `CUENTA: ${parte.cuenta_destino}`.toUpperCase(),
        ANCHO - 16
      );

      doc.text(cuenta, 8, y);
      y += cuenta.length * 3.5;
    }
  });

  linea();

  renglon(
    "TOTAL SERVICIO",
    money(params.totalServicio)
  );

  renglon(
    "SALDO ANTERIOR",
    money(params.pago.saldoAnterior)
  );

  renglon(
    "PAGO RECIBIDO",
    money(params.pago.totalPagado),
    true
  );

  renglon(
    "NUEVO SALDO",
    money(params.pago.saldoPosterior),
    true
  );

  linea(0.5);

  if (params.pago.saldoPosterior <= 0.009) {
    centrar("SERVICIO LIQUIDADO", 10, "bold");
    y += 1;
  }

  centrar(
    `RECIBIÓ: ${params.usuarioNombre || "SIN USUARIO"}`,
    7,
    "bold"
  );

  centrar("GRACIAS POR SU PREFERENCIA", 7, "bold");
  centrar("FOTO STUDIO RAMÍREZ", 6);
};

export const generarTicketPagoServicio = (
  params: TicketPagoServicioParams
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [ANCHO, ALTO],
    compress: true,
  });

  dibujarCopia(doc, params, "CLIENTE");

  doc.addPage([ANCHO, ALTO], "portrait");
  dibujarCopia(doc, params, "ESTUDIO");

  return doc;
};

const construirNombreArchivo = (
  params: TicketPagoServicioParams
) => {
  const cliente =
    limpiarNombreArchivo(params.clienteNombre) ||
    "cliente";

  return `recibo_${params.folio}_${cliente}.pdf`;
};

export const compartirTicketPagoServicio = async (
  params: TicketPagoServicioParams
) => {
  await prepararTicketPagoServicio();

  const doc = generarTicketPagoServicio(params);
  const blob = doc.output("blob");
  const nombreArchivo = construirNombreArchivo(params);
  const archivo = new File([blob], nombreArchivo, {
    type: "application/pdf",
  });

  const puedeCompartir =
    Boolean(navigator.share) &&
    Boolean(navigator.canShare) &&
    (() => {
      try {
        return navigator.canShare({ files: [archivo] });
      } catch {
        return false;
      }
    })();

  if (puedeCompartir) {
    try {
      await navigator.share({
        title: "Comprobante de pago",
        text: `Comprobante de pago ${params.folio}`,
        files: [archivo],
      });
      return;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return;
      }

      console.warn(
        "No se pudo abrir Compartir; se descargará el PDF:",
        error
      );
    }
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

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