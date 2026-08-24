import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  compartirTicketPdf,
  prepararTicketPdf,
} from "../Ticket/generarTicket";
import { enviarWhatsApp } from "../Ticket/enviarWhatsApp";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  Clock,
  Hash,
  Save,
  User,
  Mail,
  Wallet,
  Layers,
  MessageCircle,
  Printer,
  FileText,
} from "lucide-react";

type Detalle = {
  id: string;
  pedido_id?: string | null;
  tamano: string | null;
  cantidad: number | null;
  tipo: string | null;
  papel: string | null;
  especificaciones: string | null;
  n_toma: string | null;
  subtotal?: number | null;
  precio_unitario?: number | null;
};

type Pago = {
  id: string;
  pedido_id: string | null;
  fecha_pago: string | null;
  monto: number | null;
  tipo: "A_CUENTA" | "LIQUIDACION" | string | null;
  metodo_pago?: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | string | null;
  cuenta_destino?: string | null;
};

type CuentaTransferencia = {
  id: string;
  nombre: string;
  activa: boolean | null;
  orden: number | null;
};

type Pedido = {
  id: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  urgente: boolean | null;
  pagado?: boolean | null;
  entregado?: boolean | null;
  p_2listo?: boolean | null;
  total_bruto: number | null;
  total_final: number | null;
  anticipo: number | null;
  liquidacion: number | null;
  total_pagado: number | null;
  resta: number | null;
  fecha_creacion?: string | null;
  detalles_pedido: Detalle[];
};

type Props = {
  pedidoId: string;
  onBack: () => void;
  onSaved?: () => void;
};

const THEME = {
  bg: "#F4F1EA",
  black: "#12110F",
  gold: "#b89f54",
  olive: "#2e4d38",
  white: "#FFFFFF",
  soft: "#747169",
  urgent: "#be123c",
  card: "#FFFFFF",
};

const DOMINIOS_CORREO = [
  "@gmail.com",
  "@hotmail.com",
  "@outlook.com",
  "@yahoo.com",
  "@icloud.com",
];

export default function BusquedaDetalle({ pedidoId, onBack, onSaved }: Props) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cuentasTransferencia, setCuentasTransferencia] = useState<
    CuentaTransferencia[]
  >([]);

  const [pagoEditando, setPagoEditando] = useState<Pago | null>(null);
  const [montoPagoEditando, setMontoPagoEditando] = useState("");
  const [tipoPagoEditando, setTipoPagoEditando] = useState<
    "A_CUENTA" | "LIQUIDACION"
  >("A_CUENTA");
  const [metodoPagoEditando, setMetodoPagoEditando] = useState<
    "EFECTIVO" | "TRANSFERENCIA" | "TARJETA"
  >("EFECTIVO");
  const [cuentaDestinoEditando, setCuentaDestinoEditando] = useState("");

  const [guardandoPago, setGuardandoPago] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ticketPreparado, setTicketPreparado] = useState(false);
  const [compartiendoTicket, setCompartiendoTicket] = useState(false);

  const numero = (valor: any) => {
    if (valor === "" || valor === null || valor === undefined) return 0;
    const n = Number(valor);
    return Number.isNaN(n) ? 0 : n;
  };

  const cargarCuentasTransferencia = async () => {
    const { data, error } = await supabase
      .from("cuentas_transferencia")
      .select("id,nombre,activa,orden")
      .eq("activa", true)
      .order("orden", { ascending: true });

    if (error) {
      console.error("Error cargando cuentas_transferencia:", error);
      return;
    }

    setCuentasTransferencia((data || []) as CuentaTransferencia[]);
  };

  const cargarPedido = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `
          id,
                  cliente_nombre,
          cliente_telefono,
          cliente_email,
          fecha_entrega,
          horario_entrega,
          urgente,
          pagado,
          entregado,
          p_2listo,
          total_bruto,
          total_final,
          anticipo,
          liquidacion,
          total_pagado,
          resta,
          fecha_creacion,
          detalles_pedido (
            id,
            pedido_id,
            tamano,
            cantidad,
            tipo,
            papel,
            especificaciones,
            n_toma,
            subtotal,
            precio_unitario
          )
        `
        )
        .eq("id", pedidoId)
        .single();

      if (error) throw error;

      const { data: pagosData, error: pagosError } = await supabase
        .from("pagos")
        .select("id,pedido_id,fecha_pago,monto,tipo,metodo_pago,cuenta_destino")
        .eq("pedido_id", pedidoId)
        .order("fecha_pago", { ascending: true });

      if (pagosError) throw pagosError;

      setPedido(data as Pedido);
      setDetalles(((data as Pedido)?.detalles_pedido || []) as Detalle[]);
      setPagos((Array.isArray(pagosData) ? pagosData : []) as Pago[]);
    } catch (err) {
      console.error("Error cargando detalle:", err);
      alert("No se pudo cargar el pedido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCuentasTransferencia();
  }, []);
  useEffect(() => {
    let componenteActivo = true;

    prepararTicketPdf().then(
      () => {
        if (componenteActivo) {
          setTicketPreparado(true);
        }
      },
      () => {
        if (componenteActivo) {
          setTicketPreparado(true);
        }
      }
    );

    return () => {
      componenteActivo = false;
    };
  }, []);

  useEffect(() => {
    if (pedidoId) cargarPedido();
  }, [pedidoId]);

  const cambiarPedido = (campo: keyof Pedido, valor: any) => {
    setPedido((prev) => {
      if (!prev) return prev;
      return { ...prev, [campo]: valor };
    });
  };

  const cambiarDetalle = (id: string, campo: keyof Detalle, valor: any) => {
    setDetalles((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [campo]: valor } : d))
    );
  };

  const totalPagadoCalculado = useMemo(() => {
    if (!pedido) return 0;
    return numero(pedido.anticipo) + numero(pedido.liquidacion);
  }, [pedido?.anticipo, pedido?.liquidacion]);

  const restaCalculada = useMemo(() => {
    if (!pedido) return 0;
    return numero(pedido.total_final) - totalPagadoCalculado;
  }, [pedido?.total_final, totalPagadoCalculado]);

  const pedidoParaTicket = () => {
    if (!pedido) return null;

    return {
      ...pedido,
      cliente_nombre: pedido.cliente_nombre || "",
      cliente_telefono: pedido.cliente_telefono || "",
      cliente_email: pedido.cliente_email || "",
      fecha_entrega: pedido.fecha_entrega || "",
      horario_entrega: pedido.horario_entrega || "",
      total_bruto: numero(pedido.total_bruto),
      total_final: numero(pedido.total_final),
      total_pagado: totalPagadoCalculado,
      resta: restaCalculada,
      detalles_pedido: detalles.map((d) => ({
        ...d,
        id: d.id,
        pedido_id: d.pedido_id || "",
        tamano: d.tamano || "",
        cantidad: numero(d.cantidad),
        tipo: d.tipo || "",
        papel: d.papel || "",
        especificaciones: d.especificaciones || "",
        n_toma: d.n_toma || "",
      })),
    };
  };

  const reenviarWhats = () => {
    const pedidoActualizado = pedidoParaTicket();
    if (!pedidoActualizado) return;
    enviarWhatsApp(pedidoActualizado);
  };

  const compartirTicket = async () => {
    const pedidoActualizado = pedidoParaTicket();

    if (!pedidoActualizado || !ticketPreparado || compartiendoTicket) {
      return;
    }

    try {
      setCompartiendoTicket(true);
      await compartirTicketPdf(pedidoActualizado);
    } catch (error: any) {
      console.error("Error compartiendo ticket:", error);
      alert(
        "No se pudo compartir el ticket: " +
        (error?.message || "error desconocido")
      );
    } finally {
      setCompartiendoTicket(false);
    }
  };

  const abrirEditarPago = (pago: Pago) => {
    const metodoSeguro =
      pago.metodo_pago === "TRANSFERENCIA" || pago.metodo_pago === "TARJETA"
        ? pago.metodo_pago
        : "EFECTIVO";

    setPagoEditando(pago);
    setMontoPagoEditando(String(pago.monto ?? ""));
    setTipoPagoEditando(
      pago.tipo === "LIQUIDACION" ? "LIQUIDACION" : "A_CUENTA"
    );
    setMetodoPagoEditando(metodoSeguro);
    setCuentaDestinoEditando(
      metodoSeguro === "TRANSFERENCIA" ? pago.cuenta_destino || "" : ""
    );
  };

  const cerrarEditarPago = () => {
    setPagoEditando(null);
    setMontoPagoEditando("");
    setTipoPagoEditando("A_CUENTA");
    setMetodoPagoEditando("EFECTIVO");
    setCuentaDestinoEditando("");
  };

  const guardarEdicionPago = async () => {
    if (!pagoEditando) return;

    const montoNuevo = numero(montoPagoEditando);

    if (montoNuevo <= 0) {
      alert("El monto del pago debe ser mayor a 0");
      return;
    }

    if (metodoPagoEditando === "TRANSFERENCIA" && !cuentaDestinoEditando) {
      alert("Selecciona la cuenta destino de la transferencia");
      return;
    }

    try {
      setGuardandoPago(true);

      const cuentaDestinoFinal =
        metodoPagoEditando === "TRANSFERENCIA"
          ? cuentaDestinoEditando
          : null;

      const { error } = await supabase
        .from("pagos")
        .update({
          monto: montoNuevo,
          tipo: tipoPagoEditando,
          metodo_pago: metodoPagoEditando,
          cuenta_destino: cuentaDestinoFinal,
        })
        .eq("id", pagoEditando.id);

      if (error) throw error;

      const { error: rpcError } = await supabase.rpc(
        "recalcular_pedido_totales",
        {
          p_pid: pagoEditando.pedido_id || pedidoId,
        }
      );

      if (rpcError) throw rpcError;

      cerrarEditarPago();
      await cargarPedido();
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error("Error editando pago:", err);
      alert("No se pudo editar el pago: " + (err?.message || "desconocido"));
    } finally {
      setGuardandoPago(false);
    }
  };

  const guardarCambios = async () => {
    if (!pedido) return;

    try {
      setSaving(true);

      const { error: pedidoError } = await supabase
        .from("pedidos")
        .update({
          cliente_nombre:
            pedido.cliente_nombre || null,
          cliente_telefono:
            pedido.cliente_telefono || null,
          cliente_email:
            pedido.cliente_email
              ?.trim()
              .toLowerCase() || null,
          fecha_entrega:
            pedido.fecha_entrega || null,
          horario_entrega: pedido.horario_entrega || null,
          urgente: !!pedido.urgente,
          entregado: !!pedido.entregado,
        })
        .eq("id", pedido.id);

      if (pedidoError) throw pedidoError;

      for (const d of detalles) {
        const cantidad = numero(d.cantidad);
        const subtotal = numero(d.subtotal);

        const { error: detalleError } = await supabase
          .from("detalles_pedido")
          .update({
            tamano: d.tamano || null,
            cantidad,
            tipo: d.tipo || null,
            papel: d.papel || null,
            especificaciones: d.especificaciones || null,
            n_toma: d.n_toma || null,
            subtotal,
            precio_unitario: cantidad > 0 ? subtotal / cantidad : subtotal,
          })
          .eq("id", d.id);

        if (detalleError) throw detalleError;
      }

      const { error: rpcError } = await supabase.rpc(
        "recalcular_pedido_totales",
        {
          p_pid: pedido.id,
        }
      );

      if (rpcError) throw rpcError;

      alert("Cambios guardados correctamente");

      if (onSaved) onSaved();
      await cargarPedido();
    } catch (err: any) {
      console.error("Error guardando cambios:", err);
      alert("Error al guardar: " + (err?.message || "desconocido"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <Clock size={36} color={THEME.gold} />
        <p style={styles.loadingText}>Cargando pedido...</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div style={styles.center}>
        <p>No se encontró el pedido</p>
        <button style={styles.backBtn} onClick={onBack}>
          <ChevronLeft size={18} />
          Volver
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={onBack}>
        <ChevronLeft size={18} />
        Volver a búsqueda
      </button>

      <header style={styles.header}>
        <div>
          <p style={styles.kicker}>DETALLE EDITABLE</p>
          <h1 style={styles.title}>{pedido.cliente_nombre || "SIN NOMBRE"}</h1>
          <p style={styles.subtitle}>ID: {pedido.id}</p>
        </div>

        {pedido.urgente && (
          <div style={styles.urgentBadge}>
            <AlertTriangle size={15} />
            URGENTE
          </div>
        )}
      </header>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>
          <User size={18} color={THEME.gold} />
          Cliente
        </div>

        <div style={styles.grid}>
          <Field
            label="Nombre"
            value={pedido.cliente_nombre || ""}
            onChange={(v) => cambiarPedido("cliente_nombre", v.toUpperCase())}
          />

                 <Field
            label="Teléfono"
            value={pedido.cliente_telefono || ""}
            onChange={(v) => cambiarPedido("cliente_telefono", v)}
            inputMode="tel"
          />

          <div
            style={{
              gridColumn: "1 / -1",
              display: "grid",
              gap: 9,
            }}
          >
            <label
              style={{
                ...styles.label,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Mail size={15} color={THEME.gold} />
              Correo electrónico (opcional)
            </label>

            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={pedido.cliente_email || ""}
              onChange={(e) =>
                cambiarPedido(
                  "cliente_email",
                  e.target.value
                    .replace(/\s+/g, "")
                    .toLowerCase()
                )
              }
              style={styles.input}
              placeholder="cliente@gmail.com"
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
              }}
            >
              {DOMINIOS_CORREO.map((dominio) => {
                const usuarioCorreo = (
                  pedido.cliente_email || ""
                )
                  .split("@")[0]
                  .trim()
                  .toLowerCase();

                return (
                  <button
                    key={dominio}
                    type="button"
                    disabled={!usuarioCorreo}
                    onClick={() =>
                      cambiarPedido(
                        "cliente_email",
                        `${usuarioCorreo}${dominio}`
                      )
                    }
                    style={{
                      minHeight: 34,
                      borderRadius: 10,
                      border: `1px solid ${THEME.gold}`,
                      background: THEME.white,
                      color: THEME.olive,
                      padding: "0 10px",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: usuarioCorreo
                        ? "pointer"
                        : "not-allowed",
                      opacity: usuarioCorreo ? 1 : 0.45,
                    }}
                  >
                    {dominio}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>
          <CalendarDays size={18} color={THEME.gold} />
          Entrega
        </div>

        <div style={styles.grid}>
          <Field
            label="Fecha entrega"
            type="date"
            value={pedido.fecha_entrega || ""}
            onChange={(v) => cambiarPedido("fecha_entrega", v)}
          />

          <Field
            label="Horario entrega"
            type={pedido.urgente ? "text" : "time"}
            value={pedido.horario_entrega || ""}
            onChange={(v) => cambiarPedido("horario_entrega", v)}
          />
        </div>

        <div style={styles.switchGrid}>
          <SwitchBox
            label="Urgente"
            checked={!!pedido.urgente}
            onChange={(v) => {
              cambiarPedido("urgente", v);

              if (v) {
                cambiarPedido("horario_entrega", "15 A 25 MINUTOS");
              } else {
                cambiarPedido("horario_entrega", "");
              }
            }}
          />

          <SwitchBox
            label="Pagado"
            checked={!!pedido.pagado}
            onChange={() => { }}
          />

          <SwitchBox
            label="Entregado"
            checked={!!pedido.entregado}
            onChange={(v) => cambiarPedido("entregado", v)}
          />
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>
          <Wallet size={18} color={THEME.gold} />
          Pago
        </div>

        <div style={styles.grid}>
          <ReadOnlyField
            label="Total bruto"
            value={`$${numero(pedido.total_bruto)}`}
          />
          <ReadOnlyField
            label="Total final"
            value={`$${numero(pedido.total_final)}`}
          />
          <ReadOnlyField
            label="Anticipo"
            value={`$${numero(pedido.anticipo)}`}
          />
          <ReadOnlyField
            label="Liquidación"
            value={`$${numero(pedido.liquidacion)}`}
          />
        </div>

        <div style={styles.calcBox}>
          <div>
            <span style={styles.calcLabel}>Total pagado</span>
            <strong style={styles.calcValue}>${totalPagadoCalculado}</strong>
          </div>

          <div>
            <span style={styles.calcLabel}>Resta</span>
            <strong
              style={{
                ...styles.calcValue,
                color: restaCalculada > 0 ? THEME.urgent : THEME.olive,
              }}
            >
              ${restaCalculada}
            </strong>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>
          <Wallet size={18} color={THEME.gold} />
          Pagos registrados
        </div>

        {pagos.length === 0 ? (
          <p style={styles.emptyText}>
            Este pedido todavía no tiene pagos registrados.
          </p>
        ) : (
          <div style={styles.detallesList}>
            {pagos.map((pago) => (
              <div key={pago.id} style={styles.detalleCard}>
                <div style={styles.detalleHeader}>
                  <span style={styles.detalleTitle}>
                    {pago.tipo === "A_CUENTA" ? "A CUENTA" : "LIQUIDACIÓN"}
                  </span>

                  <strong>${numero(pago.monto)}</strong>
                </div>

                <p style={styles.pagoMeta}>
                  {pago.metodo_pago || "SIN MÉTODO"}
                  {pago.cuenta_destino ? ` · ${pago.cuenta_destino}` : ""}
                </p>

                <button
                  type="button"
                  style={styles.editPagoBtn}
                  onClick={() => abrirEditarPago(pago)}
                >
                  Editar pago
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>
          <Layers size={18} color={THEME.gold} />
          Renglones del pedido
        </div>

        <div style={styles.detallesList}>
          {detalles.map((d, index) => (
            <div key={d.id} style={styles.detalleCard}>
              <div style={styles.detalleHeader}>
                <span style={styles.detalleTitle}>Renglón {index + 1}</span>
                <Hash size={17} color={THEME.gold} />
              </div>

              <div style={styles.grid}>
                <Field
                  label="N. de toma"
                  value={d.n_toma || ""}
                  onChange={(v) =>
                    cambiarDetalle(d.id, "n_toma", v.toUpperCase())
                  }
                />

                <Field
                  label="Tamaño"
                  value={d.tamano || ""}
                  onChange={(v) =>
                    cambiarDetalle(d.id, "tamano", v.toUpperCase())
                  }
                />

                <Field
                  label="Cantidad"
                  type="number"
                  value={String(d.cantidad ?? "")}
                  onChange={(v) => cambiarDetalle(d.id, "cantidad", v)}
                  inputMode="numeric"
                />

                <Field
                  label="Precio renglón"
                  type="number"
                  value={String(d.subtotal ?? "")}
                  onChange={(v) => cambiarDetalle(d.id, "subtotal", v)}
                  inputMode="decimal"
                />

                <Field
                  label="Tipo"
                  value={d.tipo || ""}
                  onChange={(v) =>
                    cambiarDetalle(d.id, "tipo", v.toUpperCase())
                  }
                />

                <Field
                  label="Papel"
                  value={d.papel || ""}
                  onChange={(v) =>
                    cambiarDetalle(d.id, "papel", v.toUpperCase())
                  }
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={styles.label}>
                  <FileText size={15} color={THEME.gold} />
                  Especificaciones
                </label>

                <textarea
                  value={d.especificaciones || ""}
                  onChange={(e) =>
                    cambiarDetalle(
                      d.id,
                      "especificaciones",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="Notas o especificaciones..."
                  style={styles.textarea}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={styles.bottomBar}>
        <button style={styles.cancelBtn} onClick={onBack} disabled={saving}>
          Volver
        </button>

        <button
          style={styles.whatsBtn}
          onClick={reenviarWhats}
          disabled={saving}
        >
          <MessageCircle size={18} />
          WhatsApp
        </button>

        <button
          style={{
            ...styles.ticketBtn,
            opacity:
              !saving && ticketPreparado && !compartiendoTicket ? 1 : 0.6,
            cursor:
              !saving && ticketPreparado && !compartiendoTicket
                ? "pointer"
                : "not-allowed",
          }}
          onClick={compartirTicket}
          disabled={saving || !ticketPreparado || compartiendoTicket}
        >
          <Printer size={18} />
          {!ticketPreparado
            ? "Preparando..."
            : compartiendoTicket
              ? "Abriendo..."
              : "Ticket"}
        </button>

        <button
          style={styles.saveBtn}
          onClick={guardarCambios}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {pagoEditando && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalPago}>
            <h2 style={styles.modalTitle}>Editar pago</h2>

            <p style={styles.pagoMeta}>
              Actual:
              {" "}
              {pagoEditando.metodo_pago || "SIN MÉTODO"}
              {pagoEditando.cuenta_destino
                ? ` · ${pagoEditando.cuenta_destino}`
                : ""}
            </p>

            <div style={styles.tipoPagoEditGrid}>
              <button
                type="button"
                style={{
                  ...styles.tipoPagoEditBtn,
                  background:
                    tipoPagoEditando === "A_CUENTA" ? THEME.black : THEME.white,
                  color:
                    tipoPagoEditando === "A_CUENTA" ? THEME.white : THEME.black,
                }}
                onClick={() => setTipoPagoEditando("A_CUENTA")}
              >
                A cuenta
              </button>

              <button
                type="button"
                style={{
                  ...styles.tipoPagoEditBtn,
                  background:
                    tipoPagoEditando === "LIQUIDACION"
                      ? THEME.black
                      : THEME.white,
                  color:
                    tipoPagoEditando === "LIQUIDACION"
                      ? THEME.white
                      : THEME.black,
                }}
                onClick={() => setTipoPagoEditando("LIQUIDACION")}
              >
                Liquidación
              </button>
            </div>

            <label style={styles.label}>Monto</label>
            <input
              type="number"
              inputMode="decimal"
              value={montoPagoEditando}
              onChange={(e) => setMontoPagoEditando(e.target.value)}
              style={styles.input}
            />

            <div style={{ marginTop: 14 }}>
              <label style={styles.label}>Método de pago</label>
              <select
                value={metodoPagoEditando}
                onChange={(e) => {
                  const nuevoMetodo = e.target.value as
                    | "EFECTIVO"
                    | "TRANSFERENCIA"
                    | "TARJETA";

                  setMetodoPagoEditando(nuevoMetodo);

                  if (nuevoMetodo !== "TRANSFERENCIA") {
                    setCuentaDestinoEditando("");
                  }
                }}
                style={styles.input}
              >
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="TARJETA">TARJETA</option>
              </select>
            </div>

            {metodoPagoEditando === "TRANSFERENCIA" && (
              <div style={{ marginTop: 14 }}>
                <label style={styles.label}>Cuenta destino</label>
                <select
                  value={cuentaDestinoEditando}
                  onChange={(e) => setCuentaDestinoEditando(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Selecciona cuenta</option>

                  {cuentasTransferencia.map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.nombre}>
                      {cuenta.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={cerrarEditarPago}
                disabled={guardandoPago}
              >
                Cancelar
              </button>

              <button
                type="button"
                style={styles.saveBtn}
                onClick={guardarEdicionPago}
                disabled={guardandoPago}
              >
                <Save size={18} />
                {guardandoPago ? "Guardando..." : "Guardar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <div style={styles.readOnlyInput}>{value}</div>
    </div>
  );
}

function SwitchBox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        ...styles.switchBox,
        background: checked ? THEME.black : THEME.white,
        color: checked ? THEME.white : THEME.black,
        borderColor: checked ? THEME.black : "rgba(0,0,0,0.08)",
      }}
    >
      <span>{label}</span>
      <strong>{checked ? "SÍ" : "NO"}</strong>
    </button>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px 20px 110px",
    minHeight: "100vh",
    background: THEME.bg,
  },
  center: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: THEME.black,
    fontWeight: 800,
  },
  loadingText: {
    margin: 0,
    color: THEME.soft,
    fontWeight: 800,
  },
  backBtn: {
    border: "none",
    background: "transparent",
    color: THEME.soft,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    marginBottom: 16,
    padding: 0,
  },
  header: {
    background: THEME.black,
    color: THEME.white,
    borderRadius: 28,
    padding: 22,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 18,
    boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
  },
  kicker: {
    margin: 0,
    color: THEME.gold,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
  },
  title: {
    margin: "6px 0 4px",
    fontSize: "clamp(28px, 6vw, 48px)",
    fontWeight: 900,
    lineHeight: 0.95,
    textTransform: "uppercase",
  },
  subtitle: {
    margin: 0,
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: 700,
    wordBreak: "break-all",
  },
  urgentBadge: {
    background: THEME.urgent,
    color: THEME.white,
    borderRadius: 999,
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  section: {
    background: THEME.card,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 6px 12px rgba(0,0,0,0.03)",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 900,
    color: THEME.black,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 900,
    color: THEME.soft,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fbfaf7",
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 16,
    fontWeight: 800,
    color: THEME.black,
    outline: "none",
  },
  readOnlyInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f1eee7",
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 16,
    fontWeight: 900,
    color: THEME.black,
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    boxSizing: "border-box",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fbfaf7",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontWeight: 700,
    color: THEME.black,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  switchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  switchBox: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: "14px 15px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 900,
  },
  calcBox: {
    marginTop: 14,
    background: "#faf8f2",
    borderRadius: 18,
    padding: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    border: "1px dashed rgba(0,0,0,0.12)",
  },
  calcLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 900,
    color: THEME.soft,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  calcValue: {
    fontSize: 24,
    color: THEME.black,
    fontWeight: 900,
  },
  detallesList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  detalleCard: {
    background: "#faf8f2",
    borderRadius: 20,
    padding: 15,
    border: "1px solid rgba(0,0,0,0.05)",
  },
  detalleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detalleTitle: {
    color: THEME.gold,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bottomBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(244,241,234,0.96)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(0,0,0,0.08)",
    padding: "10px 12px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 8,
    zIndex: 50,
  },
  cancelBtn: {
    border: "none",
    borderRadius: 16,
    padding: "14px 16px",
    fontWeight: 900,
    background: THEME.white,
    color: THEME.black,
    cursor: "pointer",
  },
  saveBtn: {
    border: "none",
    borderRadius: 16,
    padding: "14px 16px",
    fontWeight: 900,
    background: THEME.black,
    color: THEME.white,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  whatsBtn: {
    border: "none",
    borderRadius: 16,
    padding: "14px 16px",
    fontWeight: 900,
    background: "#25D366",
    color: THEME.white,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ticketBtn: {
    border: "none",
    borderRadius: 16,
    padding: "14px 16px",
    fontWeight: 900,
    background: THEME.gold,
    color: THEME.black,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    margin: 0,
    color: THEME.soft,
    fontWeight: 800,
  },
  pagoMeta: {
    margin: 0,
    color: THEME.soft,
    fontSize: 13,
    fontWeight: 800,
  },
  editPagoBtn: {
    marginTop: 10,
    border: "none",
    borderRadius: 12,
    padding: "10px 12px",
    background: THEME.black,
    color: THEME.white,
    fontWeight: 900,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },
  modalPago: {
    width: "100%",
    maxWidth: 420,
    background: THEME.card,
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },
  modalTitle: {
    margin: "0 0 18px",
    fontSize: 24,
    fontWeight: 900,
    color: THEME.black,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  tipoPagoEditGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    margin: "18px 0",
  },
  tipoPagoEditBtn: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: "12px 10px",
    fontWeight: 900,
    cursor: "pointer",
  },
};