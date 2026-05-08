import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Wand2,
  Printer,
  CalendarDays,
  BadgeInfo,
} from "lucide-react";

type DetallePedido = {
  id: string;
  pedido_id: string;
  tamano: string | null;
  cantidad: number | null;
  tipo: string | null;
  papel: string | null;
  especificaciones: string | null;
  n_toma: string | null;
  urgente: boolean | null;
  retocado: boolean | null;
  impreso: boolean | null;
  calendario: boolean | null;
  subtotal: number | null;
  precio_unitario: number | null;
};

type Pedido = {
  id: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  urgente: boolean | null;
  fecha_inicio_urgente: string | null;
  p3_concluido: boolean | null;
};

type Props = {
  pedidoId: string;
  onBack: () => void;
};

export default function ProduccionDetalle({ pedidoId, onBack }: Props) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [guardandoTodo, setGuardandoTodo] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const cargarDetalle = useCallback(async () => {
    try {
      setLoading(true);

      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .select(
          "id,cliente_nombre,cliente_telefono,fecha_entrega,horario_entrega,urgente,fecha_inicio_urgente,p3_concluido"
        )
        .eq("id", pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      const { data: detallesData, error: detallesError } = await supabase
        .from("detalles_pedido")
        .select(
          "id,pedido_id,tamano,cantidad,tipo,papel,especificaciones,n_toma,urgente,retocado,impreso,calendario,subtotal,precio_unitario"
        )
        .eq("pedido_id", pedidoId)
        .order("id", { ascending: true });

      if (detallesError) throw detallesError;

      setPedido(pedidoData);
      setDetalles(detallesData || []);
    } catch (err: any) {
      console.error("Error cargando detalle de producción:", err.message);
      alert("No se pudo cargar el detalle del pedido");
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return "Sin fecha";
    const d = new Date(`${fecha}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderTimerUrgente = (fechaInicio?: string | null) => {
    if (!fechaInicio) return "00:00";

    const restante = new Date(fechaInicio).getTime() + 30 * 60 * 1000 - ahora;
    const absMs = Math.abs(restante);
    const min = Math.floor(absMs / 60000);
    const seg = Math.floor((absMs % 60000) / 1000);
    const base = `${min}:${String(seg).padStart(2, "0")}`;

    return restante <= 0 ? `+${base}` : base;
  };

  const getTimerColor = (fechaInicio?: string | null) => {
    if (!fechaInicio) return "#b8860b";

    const restante = new Date(fechaInicio).getTime() + 30 * 60 * 1000 - ahora;
    const min = restante / 60000;

    if (min > 15) return "#556b2f";
    if (min > 5) return "#b8860b";
    return "#ff4d4d";
  };

  const actualizarDetalleLocal = (
    detalleId: string,
    campo: "retocado" | "impreso" | "calendario",
    valor: boolean
  ) => {
    setDetalles((prev) =>
      prev.map((d) => {
        if (d.id !== detalleId) return d;

        const actualizado = { ...d, [campo]: valor };

        if (actualizado.urgente) {
          actualizado.calendario = true;
        }

        return actualizado;
      })
    );
  };

  const pedidoCompletoLocal = (lista: DetallePedido[]) => {
    if (lista.length === 0) return false;

    return lista.every((d) => {
      const calendarioFinal = d.urgente ? true : d.calendario === true;
      return d.retocado === true && d.impreso === true && calendarioFinal;
    });
  };

  const guardarRenglon = async (detalle: DetallePedido) => {
    try {
      setGuardandoId(detalle.id);

      const payload = {
        retocado: detalle.retocado === true,
        impreso: detalle.impreso === true,
        calendario: detalle.urgente ? true : detalle.calendario === true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("detalles_pedido")
        .update(payload)
        .eq("id", detalle.id)
        .select(
          "id,pedido_id,tamano,cantidad,tipo,papel,especificaciones,n_toma,urgente,retocado,impreso,calendario,subtotal,precio_unitario"
        )
        .single();

      if (error) throw error;

      const nuevosDetalles = detalles.map((d) =>
        d.id === detalle.id ? (data as DetallePedido) : d
      );

      setDetalles(nuevosDetalles);

      if (pedidoCompletoLocal(nuevosDetalles)) {
        setMostrarConfirmacion(true);
      }
    } catch (err: any) {
      console.error("Error guardando renglón:", err.message);
      alert("No se pudo guardar el renglón");
    } finally {
      setGuardandoId(null);
    }
  };

  const guardarTodoAvance = async () => {
    try {
      setGuardandoTodo(true);

      const resultados = await Promise.all(
        detalles.map((d) =>
          supabase
            .from("detalles_pedido")
            .update({
              retocado: d.retocado === true,
              impreso: d.impreso === true,
              calendario: d.urgente ? true : d.calendario === true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", d.id)
        )
      );

      const error = resultados.find((r) => r.error)?.error;
      if (error) throw error;

      await cargarDetalle();

      if (pedidoCompletoLocal(detalles)) {
        setMostrarConfirmacion(true);
      }
    } catch (err: any) {
      console.error("Error guardando todo:", err.message);
      alert("No se pudo guardar todo el avance");
    } finally {
      setGuardandoTodo(false);
    }
  };

  const concluirPedido = async () => {
    try {
      setGuardandoCierre(true);

      const { error } = await supabase
        .from("pedidos")
        .update({
          p3_concluido: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedidoId);

      if (error) throw error;

      setMostrarConfirmacion(false);
      onBack();
    } catch (err: any) {
      console.error("Error concluyendo pedido:", err.message);
      alert("No se pudo concluir el pedido");
    } finally {
      setGuardandoCierre(false);
    }
  };

  const progreso = useMemo(() => {
    if (detalles.length === 0) return 0;

    const completos = detalles.filter((d) => {
      const calendarioFinal = d.urgente ? true : d.calendario === true;
      return d.retocado && d.impreso && calendarioFinal;
    }).length;

    return Math.round((completos / detalles.length) * 100);
  }, [detalles]);

  const getDetalleEstado = (detalle: DetallePedido) => {
    const calendarioFinal = detalle.urgente
      ? true
      : detalle.calendario === true;

    const hechos = [
      detalle.retocado === true,
      detalle.impreso === true,
      calendarioFinal === true,
    ].filter(Boolean).length;

    const faltantes: string[] = [];
    if (detalle.retocado !== true) faltantes.push("retocado");
    if (detalle.impreso !== true) faltantes.push("impreso");
    if (!calendarioFinal) faltantes.push("calendario");

    const completo = hechos === 3;

    let estadoTexto = "Renglón completo";
    if (!completo) {
      if (faltantes.length === 1) {
        estadoTexto = `Falta: ${faltantes[0]}`;
      } else if (faltantes.length === 2) {
        estadoTexto = `Falta: ${faltantes[0]} y ${faltantes[1]}`;
      } else {
        estadoTexto = `Falta: ${faltantes[0]}, ${faltantes[1]} y ${faltantes[2]}`;
      }
    }

    return {
      hechos,
      completo,
      renglonCompleto: completo,
      estadoTexto,
      calendarioFinal,
    };
  };

  const esKenfor = (papel?: string | null) =>
    String(papel || "")
      .toUpperCase()
      .includes("KENFOR");

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingCard} />
        <div style={styles.loadingCard} />
        <div style={styles.loadingCard} />
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.topBar}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={18} />
          Volver
        </button>
      </div>

      <div style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div>
            <p style={styles.kicker}>PRODUCCIÓN</p>
            <h1 style={styles.mainTitle}>
              {pedido?.cliente_nombre || "Sin nombre"}
            </h1>

            <div style={styles.metaRow}>
              <span style={styles.metaPill}>
                Entrega: {formatearFecha(pedido?.fecha_entrega)}
              </span>

              {pedido?.horario_entrega ? (
                <span style={styles.metaPill}>
                  Horario: {pedido.horario_entrega}
                </span>
              ) : null}

              {pedido?.urgente ? (
                <span style={styles.metaUrgente}>
                  <AlertTriangle size={13} />
                  URGENTE
                </span>
              ) : null}
            </div>
          </div>

          {pedido?.urgente ? (
            <div
              style={{
                ...styles.timerBox,
                color: getTimerColor(pedido.fecha_inicio_urgente),
              }}
            >
              <Clock3 size={16} />
              {renderTimerUrgente(pedido.fecha_inicio_urgente)} MIN
            </div>
          ) : null}
        </div>

        <div style={styles.progressWrap}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Avance de producción</span>
            <span style={styles.progressValue}>{progreso}%</span>
          </div>

          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${progreso}%`,
              }}
            />
          </div>
        </div>

        {detalles.length > 1 ? (
          <button
            type="button"
            onClick={guardarTodoAvance}
            style={styles.saveAllBtn}
            disabled={guardandoTodo}
          >
            <Save size={16} />
            {guardandoTodo ? "Guardando todo..." : "Guardar todo el avance"}
          </button>
        ) : null}
      </div>

      <div style={styles.listWrap}>
        {detalles.map((detalle, index) => {
          const estado = getDetalleEstado(detalle);

          const cardToneStyle =
            estado.hechos === 0
              ? styles.detalleCardState0
              : estado.hechos === 1
              ? styles.detalleCardState1
              : estado.hechos === 2
              ? styles.detalleCardState2
              : styles.detalleCardState3;

          return (
            <motion.div
              key={detalle.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              style={{
                ...styles.detalleCard,
                ...cardToneStyle,
              }}
            >
              <div style={styles.detalleTop}>
                <div>
                  <div style={styles.tomaRow}>
                    <div style={styles.tomaBox}>{detalle.n_toma || "S/T"}</div>

                    {detalle.urgente ? (
                      <span style={styles.smallUrgente}>URGENTE</span>
                    ) : null}

                    {estado.completo ? (
                      <span style={styles.smallCompleto}>
                        <CheckCircle2 size={13} />
                        COMPLETO
                      </span>
                    ) : null}
                  </div>

                  <h3 style={styles.detalleTitle}>
                    {[detalle.cantidad, detalle.tamano, detalle.tipo]
                      .filter(Boolean)
                      .join(" · ")}
                  </h3>

                  <div style={styles.specsWrap}>
                    <div
                      style={{
                        ...styles.specPillStrong,
                        ...(esKenfor(detalle.papel)
                          ? styles.specPillKenfor
                          : styles.specPillNormal),
                      }}
                    >
                      <BadgeInfo size={14} />
                      {esKenfor(detalle.papel)
                        ? "PAPEL: KENFOR"
                        : "PAPEL: NORMAL"}
                    </div>

                    {detalle.especificaciones ? (
                      <div style={styles.specPillMain}>
                        <BadgeInfo size={14} />
                        <span>{detalle.especificaciones}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div style={styles.checkGrid}>
                <div
                  onClick={() =>
                    actualizarDetalleLocal(
                      detalle.id,
                      "retocado",
                      !(detalle.retocado === true)
                    )
                  }
                  style={{
                    ...styles.checkCardPro,
                    ...(detalle.retocado ? styles.checkActive : {}),
                  }}
                >
                  <Wand2 size={18} />
                  <span style={styles.checkTextPro}>Retocado</span>
                </div>

                <div
                  onClick={() =>
                    actualizarDetalleLocal(
                      detalle.id,
                      "impreso",
                      !(detalle.impreso === true)
                    )
                  }
                  style={{
                    ...styles.checkCardPro,
                    ...(detalle.impreso ? styles.checkActive : {}),
                  }}
                >
                  <Printer size={18} />
                  <span style={styles.checkTextPro}>Impreso</span>
                </div>

                <div
                  onClick={() => {
                    if (detalle.urgente) return;

                    actualizarDetalleLocal(
                      detalle.id,
                      "calendario",
                      !(detalle.calendario === true)
                    );
                  }}
                  style={{
                    ...styles.checkCardPro,
                    ...(detalle.urgente || detalle.calendario
                      ? styles.checkActive
                      : {}),
                    opacity: detalle.urgente ? 0.72 : 1,
                    cursor: detalle.urgente ? "not-allowed" : "pointer",
                  }}
                >
                  <CalendarDays size={18} />
                  <span style={styles.checkTextPro}>
                    {detalle.urgente ? "Calendario auto" : "Calendario"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  ...styles.estadoChip,
                  ...(estado.hechos === 0
                    ? styles.estadoChip0
                    : estado.hechos === 1
                    ? styles.estadoChip1
                    : estado.hechos === 2
                    ? styles.estadoChip2
                    : styles.estadoChip3),
                }}
              >
                {estado.estadoTexto}
              </div>

              <button
                type="button"
                onClick={() => guardarRenglon(detalle)}
                style={{
                  ...styles.saveBtn,
                  ...(estado.renglonCompleto
                    ? styles.saveBtnComplete
                    : styles.saveBtnPartial),
                }}
                disabled={guardandoId === detalle.id}
              >
                <Save size={16} />
                {guardandoId === detalle.id
                  ? "Guardando..."
                  : estado.renglonCompleto
                  ? "Guardar renglón"
                  : "Guardar avance"}
              </button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {mostrarConfirmacion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalStyles.overlay}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              style={modalStyles.modal}
            >
              <div style={modalStyles.iconWrap}>
                <CheckCircle2 size={30} color="#556b2f" />
              </div>

              <h2 style={modalStyles.title}>Pedido listo</h2>

              <p style={modalStyles.text}>
                Este pedido ya cumple con todos los pasos de producción.
              </p>

              <p style={modalStyles.text2}>¿Deseas marcarlo como concluido?</p>

              <div style={modalStyles.buttons}>
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(false)}
                  style={modalStyles.cancel}
                  disabled={guardandoCierre}
                >
                  Seguir revisando
                </button>

                <button
                  type="button"
                  onClick={concluirPedido}
                  style={modalStyles.confirm}
                  disabled={guardandoCierre}
                >
                  {guardandoCierre ? "Guardando..." : "Sí, concluir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    minHeight: "100vh",
    padding: "18px",
    background: "linear-gradient(180deg, #f7f5f0 0%, #f1eee8 100%)",
    fontFamily: "'Montserrat', sans-serif",
  },
  topBar: { marginBottom: "14px" },
  backBtn: {
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius: "14px",
    padding: "12px 16px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },
  heroCard: {
    background: "linear-gradient(180deg, #111111 0%, #1a1a1a 100%)",
    color: "#fff",
    borderRadius: "28px",
    padding: "22px",
    marginBottom: "18px",
    boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  kicker: {
    margin: 0,
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#b49d71",
    fontWeight: 900,
  },
  mainTitle: {
    margin: "8px 0 10px 0",
    fontSize: "32px",
    lineHeight: 1.05,
    color: "#fff",
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontWeight: 400,
  },
  metaRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  metaPill: {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.88)",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },
  metaUrgente: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,77,77,0.16)",
    color: "#ff8a8a",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
  },
  timerBox: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "10px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  progressWrap: { marginTop: "8px" },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  progressLabel: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
    fontWeight: 700,
  },
  progressValue: {
    fontSize: "13px",
    color: "#fff",
    fontWeight: 800,
  },
  progressBarBg: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #556b2f 0%, #7b8f4f 100%)",
    transition: "width 0.25s ease",
  },
  saveAllBtn: {
    width: "100%",
    marginTop: "18px",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "16px",
    padding: "14px",
    background: "linear-gradient(135deg, #b49d71 0%, #927a4f 100%)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  listWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  detalleCard: {
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
    borderLeft: "8px solid transparent",
    transition: "background 0.2s ease, border-color 0.2s ease",
  },
  detalleCardState0: {
    background: "linear-gradient(180deg, #fff4f3 0%, #fffafa 100%)",
    borderLeft: "8px solid #ffb4ad",
  },
  detalleCardState1: {
    background: "linear-gradient(180deg, #fff8ea 0%, #fffdf7 100%)",
    borderLeft: "8px solid #f0c66b",
  },
  detalleCardState2: {
    background: "linear-gradient(180deg, #f5f7ec 0%, #fcfdf8 100%)",
    borderLeft: "8px solid #98a96b",
  },
  detalleCardState3: {
    background: "linear-gradient(180deg, #edf7ec 0%, #f9fdf8 100%)",
    borderLeft: "8px solid #6f975f",
  },
  detalleTop: { marginBottom: "14px" },
  tomaRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  tomaBox: {
    background: "#111",
    color: "#fff",
    borderRadius: "14px",
    padding: "10px 14px",
    fontSize: "22px",
    fontWeight: 900,
    lineHeight: 1,
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
  },
  smallUrgente: {
    background: "rgba(255,77,77,0.14)",
    color: "#c62828",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },
  smallCompleto: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(85,107,47,0.12)",
    color: "#556b2f",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },
  detalleTitle: {
    margin: 0,
    color: "#111",
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: 1.3,
  },
  specsWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
  },
  specPillStrong: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    width: "fit-content",
    maxWidth: "100%",
    borderRadius: "16px",
    padding: "11px 14px",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.6px",
    textTransform: "uppercase",
    boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
  },
  specPillKenfor: {
    background: "linear-gradient(135deg, #111111 0%, #2a2a2a 100%)",
    color: "#fff",
    border: "1px solid rgba(0,0,0,0.16)",
  },
  specPillNormal: {
    background: "linear-gradient(135deg, #f3efe7 0%, #ebe5d9 100%)",
    color: "#1f1f1f",
    border: "1px solid rgba(0,0,0,0.08)",
  },
  specPillMain: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    width: "100%",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(248,244,236,0.98) 100%)",
    color: "#2d2d2d",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "16px",
    padding: "12px 14px",
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.5,
    boxShadow: "0 8px 18px rgba(0,0,0,0.04)",
  },
  checkGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
    marginBottom: "12px",
  },
  checkCardPro: {
    background: "#f7f5f0",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: 700,
    transition: "all 0.2s ease",
    minHeight: "56px",
    userSelect: "none",
  },
  checkActive: {
    background: "linear-gradient(135deg, #556b2f, #7b8f4f)",
    color: "#fff",
    border: "none",
    boxShadow: "0 8px 18px rgba(85,107,47,0.25)",
    transform: "scale(1.02)",
  },
  checkTextPro: {
    fontSize: "13px",
    fontWeight: 800,
    textAlign: "center",
  },
  estadoChip: {
    marginBottom: "14px",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "13px",
    fontWeight: 700,
    lineHeight: 1.45,
  },
  estadoChip0: {
    background: "rgba(255,77,77,0.08)",
    color: "#b43a2d",
  },
  estadoChip1: {
    background: "rgba(234,179,8,0.12)",
    color: "#8f6a05",
  },
  estadoChip2: {
    background: "rgba(85,107,47,0.10)",
    color: "#556b2f",
  },
  estadoChip3: {
    background: "rgba(85,107,47,0.14)",
    color: "#3f5725",
  },
  saveBtn: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    padding: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    minHeight: "52px",
    transition: "all 0.2s ease",
  },
  saveBtnPartial: {
    background: "#111",
    color: "#fff",
  },
  saveBtnComplete: {
    background: "linear-gradient(135deg, #556b2f, #7b8f4f)",
    color: "#fff",
    boxShadow: "0 10px 22px rgba(85,107,47,0.22)",
  },
  loadingCard: {
    height: "160px",
    borderRadius: "24px",
    background: "rgba(0,0,0,0.06)",
    marginBottom: "12px",
  },
};

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "26px",
    padding: "28px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
    textAlign: "center",
    fontFamily: "'Montserrat', sans-serif",
  },
  iconWrap: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "rgba(85,107,47,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px auto",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "30px",
    color: "#111",
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontWeight: 400,
  },
  text: {
    margin: "0 0 6px 0",
    fontSize: "15px",
    color: "#444",
    lineHeight: 1.6,
  },
  text2: {
    margin: "0 0 22px 0",
    fontSize: "14px",
    color: "#777",
    lineHeight: 1.5,
  },
  buttons: {
    display: "flex",
    gap: "10px",
  },
  cancel: {
    flex: 1,
    padding: "13px 12px",
    borderRadius: "14px",
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    cursor: "pointer",
    fontWeight: 700,
  },
  confirm: {
    flex: 1,
    padding: "13px 12px",
    borderRadius: "14px",
    border: "none",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
};
