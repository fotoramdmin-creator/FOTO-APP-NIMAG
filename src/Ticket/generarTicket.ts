import { jsPDF } from "jspdf";

// --- 1. DEFINICIÓN DE TIPOS ---
export type DetallePedido = {
  cantidad: number;
  tamano: string;
  tipo: string;
  papel?: string | null;
  especificaciones?: string | null;
  n_toma?: string | null;
};

export type PedidoTicket = {
  id?: string | null;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  fecha_entrega?: string | null;
  horario_entrega?: string | null;
  urgente?: boolean | null;
  fecha_creacion?: string | null;
  total_final?: number | null;
  total_bruto?: number | null;
  anticipo?: number | null;
  liquidacion?: number | null;
  total_pagado?: number | null;
  resta?: number | null;
  detalles_pedido?: DetallePedido[];
};

// --- 2. FUNCIONES AUXILIARES ---
const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return "Sin fecha";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatearFechaHoraCreacion = (fecha?: string | null) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleString("es-MX");
};

const money = (n?: number | null) => `$${Number(n ?? 0).toFixed(2)}`;

const construirNombreArchivo = (pedido: PedidoTicket) => {
  const nombre = (pedido.cliente_nombre || "cliente")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "");
  return `ticket_${nombre || "pedido"}.pdf`;
};

const cargarImagen = (
  url: string
): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => reject(new Error("Logo error"));
    img.src = url;
  });
};

// --- 3. GENERACIÓN DEL DISEÑO DEL PDF ---
export const generarTicketPdf = async (pedido: PedidoTicket) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 230],
  });

  const width = 80;
  let y = 8;

  const drawLine = (yPos: number, thickness = 0.2) => {
    doc.setLineWidth(thickness);
    doc.line(5, yPos, width - 5, yPos);
  };

  const centerText = (
    text: string,
    size = 9,
    style: "normal" | "bold" = "normal"
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const safeText = String(text || "").toUpperCase();
    const textWidth = doc.getTextWidth(safeText);
    doc.text(safeText, (width - textWidth) / 2, y);
    y += size / 2 + 2;
  };

  const renderRow = (
    label: string,
    value: string,
    size = 8,
    isBold = false
  ) => {
    const safeValue = String(value || "-");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(size - 1);
    doc.text(label.toUpperCase(), 6, y);

    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(size);

    const textWidth = doc.getTextWidth(safeValue);
    doc.text(safeValue, width - 6 - textWidth, y);

    y += 4;
  };

  // LOGO
  try {
    const logo = await cargarImagen("/negro.png");
    const ratio = logo.width / logo.height;
    const logoW = 35;
    const logoH = logoW / ratio;
    doc.addImage(logo.dataUrl, "PNG", (width - logoW) / 2, y, logoW, logoH);
    y += logoH + 8;
  } catch (err) {
    centerText("FOTO RAMIREZ", 14, "bold");
    y += 2;
  }

  centerText("TICKET DE SERVICIO", 8, "bold");
  drawLine(y, 0.5);
  y += 6;

  // CLIENTE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const nombre = (pedido.cliente_nombre || "SIN NOMBRE").toUpperCase();
  const splitNombre = doc.splitTextToSize(nombre, width - 12);
  doc.text(splitNombre, 6, y);
  y += splitNombre.length * 5 + 3;

  renderRow("ENTREGA", formatearFecha(pedido.fecha_entrega));
  renderRow("HORARIO", pedido.horario_entrega || "PENDIENTE");

  if (pedido.urgente) {
    y += 1;
    doc.setFillColor(0, 0, 0);
    doc.rect(6, y - 3, 22, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text("URGENTE", 8, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  if (pedido.fecha_creacion) {
    renderRow("CREADO", formatearFechaHoraCreacion(pedido.fecha_creacion), 7);
    y += 1;
  }

  drawLine(y, 0.1);
  y += 5;

  // PRODUCTOS / RENGLONES
  centerText("DETALLES DEL PEDIDO", 7, "bold");
  y += 3;

  (pedido.detalles_pedido || []).forEach((d: DetallePedido, index: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`RENGLON ${index + 1}`, 6, y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${d.cantidad}x ${d.tamano}`, 6, y);
    y += 3.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`${d.tipo || "-"}`, 6, y);
    y += 3.5;

    if (d.papel) {
      doc.text(`PAPEL: ${String(d.papel).toUpperCase()}`, 8, y);
      y += 3.5;
    }

    if (d.especificaciones) {
      const notes = doc.splitTextToSize(
        `NOTAS: ${d.especificaciones}`,
        width - 15
      );
      doc.text(notes, 8, y);
      y += notes.length * 3.5;
    }

    if (d.n_toma) {
      doc.setFont("helvetica", "bold");
      doc.text(`N. DE TOMA: ${d.n_toma}`, 8, y);
      y += 3.5;
    }

    y += 2;

    if (index < (pedido.detalles_pedido || []).length - 1) {
      drawLine(y, 0.1);
      y += 4;
    }
  });

  y += 1;
  drawLine(y, 0.1);
  y += 6;

  // PAGOS
  const total = Number(pedido.total_final ?? pedido.total_bruto ?? 0);
  const anticipo = Number(pedido.anticipo ?? 0);
  const liquidacion = Number(pedido.liquidacion ?? 0);
  const totalPagado = Number(
    pedido.total_pagado ?? anticipo + liquidacion ?? 0
  );
  const resta = Number(pedido.resta ?? total - totalPagado);

  renderRow("TOTAL", money(total), 9, true);

  if (anticipo > 0) {
    renderRow("ANTICIPO", money(anticipo));
  }

  if (liquidacion > 0) {
    renderRow("LIQUIDACION", money(liquidacion));
  }

  if (totalPagado > 0) {
    renderRow("PAGADO", money(totalPagado));
  }

  y += 2;
  drawLine(y, 0.5);
  y += 6;

  if (resta > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("RESTA", 6, y);
    const restaStr = money(resta);
    doc.text(restaStr, width - 6 - doc.getTextWidth(restaStr), y);
    y += 7;
  } else {
    centerText("PAGADO", 10, "bold");
    y += 2;
  }

  centerText("GRACIAS POR SU PREFERENCIA", 7, "bold");
  centerText("FOTO RAMIREZ", 6);
  centerText(formatearFechaHoraCreacion(pedido.fecha_creacion), 6);

  return doc;
};

// --- 4. EXPORTACIONES FINALES ---
export const descargarTicketPdf = async (pedido: PedidoTicket) => {
  const doc = await generarTicketPdf(pedido);
  doc.save(construirNombreArchivo(pedido));
};

export const compartirTicketPdf = async (pedido: PedidoTicket) => {
  const doc = await generarTicketPdf(pedido);
  const blob = doc.output("blob");
  const filename = construirNombreArchivo(pedido);
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.share) {
    try {
      await navigator.share({ title: "Ticket", files: [file] });
      return;
    } catch (e) {
      console.error(e);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};
