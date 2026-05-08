type DetallePedido = {
  cantidad: number;
  tamano: string;
  tipo: string;
  papel?: string | null;
  especificaciones?: string | null;
  n_toma?: string | null;
};

type PedidoWhatsApp = {
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

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return "Sin fecha";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const limpiarTelefono = (telefono?: string | null) => {
  if (!telefono) return "";
  return telefono.replace(/\D/g, "");
};

export const construirMensajeWhatsApp = (pedido: PedidoWhatsApp) => {
  const nombre = pedido.cliente_nombre || "Cliente";
  const fechaEntrega = formatearFecha(pedido.fecha_entrega);
  const horario = pedido.horario_entrega || "Pendiente";
  const urgente = pedido.urgente ? "Sí" : "No";
  const total = Number(pedido.total_final ?? pedido.total_bruto ?? 0);
  const anticipo = Number(pedido.anticipo ?? 0);
  const liquidacion = Number(pedido.liquidacion ?? 0);
  const totalPagado = Number(
    pedido.total_pagado ?? anticipo + liquidacion ?? 0
  );
  const resta = Number(pedido.resta ?? Math.max(total - totalPagado, 0));

  const renglones =
    pedido.detalles_pedido && pedido.detalles_pedido.length > 0
      ? pedido.detalles_pedido
          .map((d, i) => {
            const extras = [
              d.papel ? `PAPEL: ${d.papel}` : "",
              d.especificaciones ? `ESP: ${d.especificaciones}` : "",
              d.n_toma ? `N. TOMA: ${d.n_toma}` : "",
            ]
              .filter(Boolean)
              .join(" · ");

            return `${i + 1}. CANTIDAD: ${d.cantidad} | TAMAÑO: ${
              d.tamano
            } | TIPO: ${d.tipo}${extras ? ` | ${extras}` : ""}`;
          })
          .join("\n")
      : "Sin renglones";

  return `Hola ${nombre} 👋

Te compartimos los datos de tu pedido en Foto Ramírez:

${renglones}

📅 ENTREGA: ${fechaEntrega}
⏰ HORARIO: ${horario}
⚡ URGENTE: ${urgente}

💰 TOTAL: $${total.toFixed(2)}
💵 ANTICIPO: $${anticipo.toFixed(2)}
💳 LIQUIDACIÓN: $${liquidacion.toFixed(2)}
✅ PAGADO: $${totalPagado.toFixed(2)}
🧾 RESTA: $${resta.toFixed(2)}

Gracias por tu compra 📸`;
};

export const enviarWhatsApp = (pedido: PedidoWhatsApp) => {
  const mensaje = construirMensajeWhatsApp(pedido);
  const telefono = limpiarTelefono(pedido.cliente_telefono);
  const texto = encodeURIComponent(mensaje);

  let url = `https://wa.me/?text=${texto}`;

  if (telefono) {
    const numeroConPais = telefono.length === 10 ? `52${telefono}` : telefono;
    url = `https://wa.me/${numeroConPais}?text=${texto}`;
  }

  window.open(url, "_blank");
};
