import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  Save,
  Hash,
  Layers,
  ChevronLeft,
  Send,
  ChevronDown,
  MessageCircle,
  Receipt,
} from "lucide-react";
import { enviarWhatsApp } from "../Ticket/enviarWhatsApp";
import {
  compartirTicketPdf,
  prepararTicketPdf,
} from "../Ticket/generarTicket";

type Detalle = {
  id: string;
  tamano: string;
  cantidad: number;
  tipo: string;
  papel: string | null;
  especificaciones: string | null;
  n_toma?: string | null;
};

type Pedido = {
  id: string;
  cliente_nombre: string | null;
  cliente_telefono?: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  urgente: boolean | null;
  p_2listo?: boolean | null;
  total_final?: number | null;
  total_bruto?: number | null;
  descuento?: number | null;
  anticipo?: number | null;
  liquidacion?: number | null;
  total_pagado?: number | null;
  resta?: number | null;
  fecha_creacion?: string | null;
  detalles_pedido: Detalle[];
};

const THEME = {
  bg: "#F4F1EA",
  black: "#12110F",
  gold: "#b89f54",
  olive: "#2e4d38",
  white: "#FFFFFF",
  textSoft: "#747169",
  urgent: "#be123c",
};

export default function OrdenEnCursoDetalle({
  pedidoId,
  onBack,
}: {
  pedidoId: string;
  onBack?: () => void;
}) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [isSharingTicket, setIsSharingTicket] = useState(false);
  const [ticketPreparado, setTicketPreparado] = useState(false);
  const [tomasPorRenglon, setTomasPorRenglon] = useState<
    Record<string, string>
  >({});

  const [
    firmaTomasAvisada,
    setFirmaTomasAvisada,
  ] = useState("");

  const [
    confirmacionWhatsApp,
    setConfirmacionWhatsApp,
  ] = useState<{
    tomasCompletadasAt: string;
  } | null>(null);

  const cargarPedido = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `id, cliente_nombre, cliente_telefono, fecha_entrega, horario_entrega, urgente, p_2listo,
                     total_final, total_bruto, descuento, anticipo, liquidacion, total_pagado, resta, fecha_creacion,
           detalles_pedido ( id, tamano, cantidad, tipo, papel, especificaciones, n_toma )`
        )
        .eq("id", pedidoId)
        .single();

      if (error) throw error;

      setPedido(data);

      const iniciales: Record<string, string> = {};
      (data?.detalles_pedido || []).forEach((detalle: Detalle) => {
        iniciales[detalle.id] = detalle.n_toma || "";
      });

      setTomasPorRenglon(iniciales);

      setFirmaTomasAvisada(
        (data?.detalles_pedido || [])
          .map(
            (detalle: Detalle) =>
              `${detalle.id}:${(
                iniciales[detalle.id] || ""
              ).trim()}`
          )
          .join("|")
      );
    } catch (err) {
      console.error("Error cargando pedido:", err);
      alert("No se pudo cargar el detalle del pedido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pedidoId) {
      cargarPedido();
    }
  }, [pedidoId]);

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

  const guardarTomasInterno = async () => {
    const detalles = pedido?.detalles_pedido || [];
    let totalActualizados = 0;

    for (const detalle of detalles) {
      const valor = (tomasPorRenglon[detalle.id] || "").trim();

      const { data, error } = await supabase
        .from("detalles_pedido")
        .update({ n_toma: valor || null })
        .eq("id", detalle.id)
        .select("id");

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        totalActualizados += data.length;
      }
    }

    if (totalActualizados === 0) {
      throw new Error(
        "No se actualizó ningún renglón. Revisa permisos de Supabase (RLS)."
      );
    }

    return totalActualizados;
  };

  const guardarTomas = async () => {
    try {
      setIsSaving(true);

      await guardarTomasInterno();

      const detalles =
        pedido?.detalles_pedido || [];

      const todasCompletas =
        detalles.length > 0 &&
        detalles.every(
          (detalle) =>
            String(
              tomasPorRenglon[
                detalle.id
              ] || ""
            ).trim() !== ""
        );

      const firmaActual = detalles
        .map(
          (detalle) =>
            `${detalle.id}:${String(
              tomasPorRenglon[
                detalle.id
              ] || ""
            ).trim()}`
        )
        .join("|");

      const debeOfrecerWhatsApp =
        todasCompletas &&
        firmaActual !==
          firmaTomasAvisada;

      if (debeOfrecerWhatsApp) {
        await revisarTomasCompletas();
      } else {
        alert("Guardado correctamente");
      }

      await cargarPedido();
    } catch (err: any) {
      console.error(
        "Error guardando números de toma:",
        err
      );

      alert(
        "Error al guardar: " +
          (err?.message || "desconocido")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const enviarAProduccion = async () => {
    try {
      setIsSending(true);

      await guardarTomasInterno();

      const { data, error } = await supabase
        .from("pedidos")
        .update({ p_2listo: true })
        .eq("id", pedidoId)
        .select("id, p_2listo");

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error(
          "No se actualizó el pedido. Revisa permisos de UPDATE en pedidos."
        );
      }

      if (data[0].p_2listo !== true) {
        throw new Error(
          "El pedido no quedó marcado como listo para producción."
        );
      }

      alert("Mandado a producción correctamente");

      if (onBack) {
        onBack();
      }
    } catch (err: any) {
      console.error("Error enviando a producción:", err);
      alert("Error al enviar a producción: " + (err?.message || "desconocido"));
    } finally {
      setIsSending(false);
    }
  };

  const manejarWhatsApp = async (
    tomasCompletadasAt?: string
  ) => {
    const ventanaWhatsApp = window.open(
      "about:blank",
      "_blank"
    );

    if (!ventanaWhatsApp) {
      alert(
        "El navegador bloqueó la ventana de WhatsApp. Permite las ventanas emergentes para esta aplicación e inténtalo nuevamente."
      );
      return;
    }

    try {
      if (!pedido) {
        ventanaWhatsApp.close();
        return;
      }

      await guardarTomasInterno();

      const pedidoConTomas = {
        ...pedido,
        tomas_completadas_at:
          tomasCompletadasAt || null,
        detalles_pedido:
          pedido.detalles_pedido.map(
            (d) => ({
              ...d,
              n_toma:
                tomasPorRenglon[d.id] ||
                "",
            })
          ),
      };

      enviarWhatsApp(
        pedidoConTomas,
        ventanaWhatsApp
      );
    } catch (err: any) {
      ventanaWhatsApp.close();

      console.error(
        "Error preparando WhatsApp:",
        err
      );

      alert(
        "Error al preparar WhatsApp: " +
        (err?.message || "desconocido")
      );
    }
  };

  const revisarTomasCompletas = async () => {
    if (!pedido) return;

    const detalles =
      pedido.detalles_pedido || [];

    if (detalles.length === 0) {
      return;
    }

    const todasCompletas =
      detalles.every(
        (detalle) =>
          String(
            tomasPorRenglon[detalle.id] || ""
          ).trim() !== ""
      );

    if (!todasCompletas) {
      return;
    }

    const firmaActual = detalles
      .map(
        (detalle) =>
          `${detalle.id}:${String(
            tomasPorRenglon[detalle.id] || ""
          ).trim()}`
      )
      .join("|");

    if (
      firmaActual === firmaTomasAvisada
    ) {
      return;
    }

    setFirmaTomasAvisada(firmaActual);

    setConfirmacionWhatsApp({
      tomasCompletadasAt:
        new Date().toISOString(),
    });
  };


  const manejarCompartirTicket = async () => {
    try {
      if (!pedido || !ticketPreparado) return;

      setIsSharingTicket(true);

      const pedidoConTomas = {
        ...pedido,
        detalles_pedido: pedido.detalles_pedido.map((d) => ({
          ...d,
          n_toma: tomasPorRenglon[d.id] || "",
        })),
      };

      const guardadoPromise = guardarTomasInterno().then(
        () => null,
        (error) => error
      );

      await compartirTicketPdf(pedidoConTomas);

      const errorGuardando = await guardadoPromise;

      if (errorGuardando) {
        throw errorGuardando;
      }
    } catch (err: any) {
      console.error("Error compartiendo ticket:", err);
      alert("Error al compartir ticket: " + (err?.message || "desconocido"));
    } finally {
      setIsSharingTicket(false);
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
    });
  };

  const hayAlgoParaGuardar = useMemo(() => {
    return Object.values(tomasPorRenglon).some((v) => String(v).trim() !== "");
  }, [tomasPorRenglon]);

  if (loading) {
    return (
      <div style={styles.center}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Clock size={40} color={THEME.gold} />
        </motion.div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div style={styles.center}>
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>No se encontró el pedido</p>
          <button
            onClick={() => {
              if (onBack) onBack();
            }}
            style={styles.backBtn}
          >
            <ChevronLeft size={20} /> VOLVER AL SET
          </button>
        </div>
      </div>
    );
  }

  const esCortesia =
    Number(pedido.total_bruto || 0) > 0 &&
    Number(pedido.total_final || 0) === 0 &&
    Number(pedido.descuento || 0) >=
    Number(pedido.total_bruto || 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={styles.container}
    >
      <AnimatePresence>
        {confirmacionWhatsApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 3000,
              padding: 20,
              background:
                "rgba(18,17,15,0.72)",
              backdropFilter: "blur(7px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 18,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.97,
              }}
              style={{
                width: "100%",
                maxWidth: 470,
                borderRadius: 26,
                background: THEME.white,
                padding: 26,
                boxSizing: "border-box",
                boxShadow:
                  "0 28px 80px rgba(0,0,0,0.28)",
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  background: "#e9f9ef",
                  color: "#128c4a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <MessageCircle size={30} />
              </div>

              <h2
                style={{
                  margin: 0,
                  color: THEME.black,
                  fontSize: 25,
                  fontWeight: 950,
                }}
              >
                Tomas completas
              </h2>

              <p
                style={{
                  margin: "10px 0 0",
                  color: THEME.textSoft,
                  fontSize: 15,
                  lineHeight: 1.55,
                }}
              >
                Todos los renglones tienen
                número de toma. ¿Deseas enviar
                el ticket al cliente?
              </p>

              {pedido.urgente && (
                <div
                  style={{
                    marginTop: 16,
                    borderRadius: 15,
                    background: "#fff7df",
                    border:
                      "1px solid rgba(184,159,84,0.32)",
                    color: "#715a19",
                    padding: 13,
                    fontSize: 13,
                    fontWeight: 800,
                    lineHeight: 1.45,
                  }}
                >
                  El mensaje incluirá la hora
                  actual y la entrega estimada
                  de 20 a 30 minutos.
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginTop: 22,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const horaCompletado =
                      confirmacionWhatsApp
                        .tomasCompletadasAt;

                    setConfirmacionWhatsApp(
                      null
                    );

                    void manejarWhatsApp(
                      horaCompletado
                    );
                  }}
                  style={{
                    width: "100%",
                    minHeight: 54,
                    border: "none",
                    borderRadius: 15,
                    background: "#25D366",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 950,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 9,
                  }}
                >
                  <MessageCircle size={20} />
                  ENVIAR WHATSAPP
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmacionWhatsApp(
                      null
                    )
                  }
                  style={{
                    width: "100%",
                    minHeight: 46,
                    border: "none",
                    borderRadius: 14,
                    background: "#f3f1ec",
                    color: THEME.textSoft,
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  AHORA NO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (onBack) onBack();
        }}
        style={styles.backBtn}
      >
        <ChevronLeft size={20} /> VOLVER AL SET
      </button>

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.nombreBlock}>
            <h1 style={styles.nombre}>
              {pedido.cliente_nombre?.toUpperCase() || "SIN NOMBRE"}
            </h1>

            {esCortesia && (
              <div
                style={{
                  width: "fit-content",
                  marginTop: 8,
                  marginBottom: 10,
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "#edf8f1",
                  border: "1px solid rgba(35,122,75,0.28)",
                  color: "#237a4b",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                }}
              >
                CORTESÍA · 100% DESCUENTO · SIN PAGO
              </div>
            )}

            <div style={styles.nombreMetaInline}>
              <div style={styles.metaItem}>
                <CalendarDays size={16} color={THEME.gold} />
                <span>{formatFecha(pedido.fecha_entrega)}</span>
              </div>

              <div style={styles.metaItem}>
                <Clock size={16} color={THEME.gold} />
                <span>{pedido.horario_entrega || "PENDIENTE"}</span>
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            {pedido.urgente && (
              <div style={styles.urgenteBadge}>
                <AlertTriangle size={14} /> ENTREGA INMEDIATA
              </div>
            )}

            <button
              onClick={() => setTicketOpen((prev) => !prev)}
              style={styles.ticketToggle}
            >
              <Receipt size={14} />
              TICKET
              <ChevronDown
                size={14}
                style={{
                  transform: ticketOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "0.2s",
                }}
              />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {ticketOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              style={styles.ticketPanel}
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                style={styles.ticketActionBtn}
                onClick={() => {
                  void manejarWhatsApp();
                }}
              >
                <MessageCircle size={16} />
                ENVIAR WHATSAPP
              </motion.button>

              <motion.button
                whileTap={
                  ticketPreparado && !isSharingTicket
                    ? { scale: 0.98 }
                    : undefined
                }
                style={{
                  ...styles.ticketActionBtn,
                  opacity: ticketPreparado && !isSharingTicket ? 1 : 0.6,
                  cursor:
                    ticketPreparado && !isSharingTicket
                      ? "pointer"
                      : "not-allowed",
                }}
                onClick={manejarCompartirTicket}
                disabled={isSharingTicket || !ticketPreparado}
              >
                <Receipt size={16} />
                {!ticketPreparado
                  ? "PREPARANDO TICKET..."
                  : isSharingTicket
                    ? "ABRIENDO..."
                    : "COMPARTIR TICKET PDF"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={styles.metaGrid}>
          <div style={styles.metaItem}>
            <Layers size={16} color={THEME.gold} />
            <span>{pedido.detalles_pedido.length} RENGLONES</span>
          </div>
        </div>
      </header>

      <section style={styles.listaSeccion}>
        <h3 style={styles.seccionTitle}>ESPECIFICACIONES DEL PEDIDO</h3>

        <div style={styles.lista}>
          {pedido.detalles_pedido.map((d, idx) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              style={styles.card}
            >
              <div style={styles.renglonHead}>
                <span style={styles.renglonLabel}>RENGLÓN {idx + 1}</span>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <div style={styles.infoTitle}>Cantidad</div>
                  <div style={styles.infoValue}>{d.cantidad}</div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.infoTitle}>Tamaño</div>
                  <div style={styles.infoValue}>{d.tamano}</div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.infoTitle}>Tipo</div>
                  <div style={styles.infoValue}>{d.tipo}</div>
                </div>
              </div>

              {(d.papel || d.especificaciones) && (
                <div style={styles.detallesExtra}>
                  {d.papel && (
                    <span style={styles.tag}>
                      PAPEL: {d.papel.toUpperCase()}
                    </span>
                  )}

                  {d.especificaciones && (
                    <p style={styles.espText}>
                      <strong>NOTAS:</strong> {d.especificaciones}
                    </p>
                  )}
                </div>
              )}

              <div style={styles.renglonForm}>
                <label style={styles.label}>
                  <Hash size={18} color={THEME.gold} /> NÚMERO DE TOMA
                </label>

                <input
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  value={tomasPorRenglon[d.id] || ""}
                  onChange={(e) =>
                    setTomasPorRenglon((prev) => ({
                      ...prev,
                      [d.id]: e.target.value.toUpperCase(),
                    }))
                  }

                  placeholder="0000"
                  style={styles.input}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div style={styles.bottomActions}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={!hayAlgoParaGuardar || isSaving || isSending}
          style={{
            ...styles.botonSecundario,
            opacity: hayAlgoParaGuardar ? 1 : 0.5,
            background: isSaving ? THEME.gold : THEME.black,
          }}
          onClick={guardarTomas}
        >
          {isSaving ? (
            "GUARDANDO..."
          ) : (
            <>
              <Save size={18} /> GUARDAR NÚMEROS DE TOMA
            </>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={isSaving || isSending}
          style={{
            ...styles.boton,
            opacity: isSaving ? 0.7 : 1,
            background: isSending ? THEME.gold : THEME.olive,
          }}
          onClick={enviarAProduccion}
        >
          {isSending ? (
            "ENVIANDO..."
          ) : (
            <>
              <Send size={18} /> ENVIAR A PRODUCCIÓN
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "20px 20px 60px 20px",
    background: THEME.bg,
    minHeight: "100vh",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
  },
  emptyState: {
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: 900,
    color: THEME.black,
    marginBottom: "20px",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: THEME.textSoft,
    fontWeight: 900,
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  header: {
    marginBottom: "40px",
    borderBottom: `2px solid ${THEME.black}`,
    paddingBottom: "20px",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "15px",
    flexWrap: "wrap",
    gap: "14px",
  },
  nombreBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  nombre: {
    fontSize: "48px",
    fontWeight: 900,
    margin: 0,
    color: THEME.black,
    fontStyle: "italic",
    lineHeight: 0.9,
    letterSpacing: "-2px",
  },
  nombreMetaInline: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  headerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
  urgenteBadge: {
    background: THEME.urgent,
    color: THEME.white,
    padding: "8px 15px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  ticketToggle: {
    background: THEME.black,
    color: THEME.white,
    border: "none",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "11px",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    letterSpacing: "1px",
  },
  ticketPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  ticketActionBtn: {
    width: "100%",
    background: THEME.white,
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: "14px",
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: 900,
    color: THEME.black,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
  },
  metaGrid: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 700,
    color: THEME.black,
  },
  seccionTitle: {
    fontSize: "12px",
    fontWeight: 900,
    color: THEME.gold,
    letterSpacing: "2px",
    marginBottom: "15px",
  },
  listaSeccion: {
    marginBottom: "30px",
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  card: {
    background: THEME.white,
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
  },
  renglonHead: {
    marginBottom: "14px",
  },
  renglonLabel: {
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "1px",
    color: THEME.gold,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px",
  },
  infoBox: {
    background: "#faf8f2",
    borderRadius: "14px",
    padding: "12px 14px",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  infoTitle: {
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "1px",
    color: THEME.textSoft,
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: 900,
    color: THEME.black,
  },
  detallesExtra: {
    marginTop: "15px",
    paddingTop: "15px",
    borderTop: "1px dashed #eee",
  },
  tag: {
    background: "#f0f0f0",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 900,
    color: THEME.black,
    marginRight: "10px",
    display: "inline-block",
  },
  espText: {
    fontSize: "13px",
    color: THEME.textSoft,
    marginTop: "8px",
    marginInline: 0,
  },
  renglonForm: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(0,0,0,0.06)",
  },
  label: {
    color: THEME.black,
    fontWeight: 900,
    fontSize: "12px",
    letterSpacing: "1px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  input: {
    width: "100%",
    background: "#fbfaf7",
    border: `1px solid ${THEME.gold}`,
    borderRadius: "15px",
    padding: "15px",
    color: THEME.black,
    fontSize: "22px",
    fontWeight: 900,
    textAlign: "center",
    boxSizing: "border-box",
  },
  bottomActions: {
    marginTop: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  botonSecundario: {
    width: "100%",
    padding: "18px",
    border: "none",
    borderRadius: "15px",
    color: THEME.white,
    fontWeight: 900,
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    transition: "0.3s",
  },
  boton: {
    width: "100%",
    padding: "18px",
    border: "none",
    borderRadius: "15px",
    color: THEME.white,
    fontWeight: 900,
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    transition: "0.3s",
  },
};
