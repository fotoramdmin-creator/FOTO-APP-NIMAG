import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, RefreshCcw, User, Smartphone } from "lucide-react";

type FiltroProduccion = "URGENTES" | "HOY" | "GENERAL";

type Props = {
  setPedidoSeleccionado: (pedidoId: string) => void;
  setVistaActiva: (vista: string) => void;
};

export default function ProduccionLista({
  setPedidoSeleccionado,
  setVistaActiva,
}: Props) {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroActivo, setFiltroActivo] =
    useState<FiltroProduccion>("URGENTES");
  const [ahora, setAhora] = useState(Date.now());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const cargarPedidos = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      else setRefreshing(true);

      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `
          id,
          cliente_nombre,
          fecha_creacion,
          fecha_entrega,
          horario_entrega,
          urgente,
          p_2listo,
          p3_concluido,
          fecha_inicio_urgente,
          detalles_pedido ( id, n_toma )
          `
        )
        .eq("p_2listo", true)
        .or("p3_concluido.is.null,p3_concluido.eq.false")
        .order("fecha_creacion", { ascending: true });

      if (error) throw error;

      const preparados = (data || [])
        .map((pedido: any) => {
          const tomas = Array.from(
            new Set(
              pedido.detalles_pedido
                ?.map((d: any) => String(d.n_toma || "").trim())
                .filter(Boolean)
            )
          );

          const resumen =
            tomas.length > 1
              ? `${tomas[0]} +${tomas.length - 1}`
              : tomas[0] || "S/T";

          return { ...pedido, resumenTomas: resumen };
        })
        .filter((pedido: any) => pedido.resumenTomas !== "S/T");

      setPedidos(preparados);
    } catch (err) {
      console.error("Error cargando producción:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const hoyStr = new Date().toISOString().slice(0, 10);

  const listas = useMemo(
    () => ({
      URGENTES: [...pedidos].filter((p) => p.urgente),
      HOY: [...pedidos]
        .filter((p) => !p.urgente && p.fecha_entrega?.slice(0, 10) === hoyStr)
        .sort((a, b) => {
          const ha = a.horario_entrega || "99:99";
          const hb = b.horario_entrega || "99:99";
          return ha.localeCompare(hb);
        }),
      GENERAL: [...pedidos].filter(
        (p) => !p.urgente && p.fecha_entrega?.slice(0, 10) !== hoyStr
      ),
    }),
    [pedidos, hoyStr]
  );

  const renderTimer = (fechaInicio: string) => {
    const restante = new Date(fechaInicio).getTime() + 30 * 60 * 1000 - ahora;

    const absMs = Math.abs(restante);
    const min = Math.floor(absMs / 60000);
    const seg = Math.floor((absMs % 60000) / 1000);

    return {
      text: `${min}:${String(seg).padStart(2, "0")}`,
      isOver: restante <= 0,
    };
  };

  const listaActual = listas[filtroActivo];

  return (
    <div style={{ ...styles.container, padding: isMobile ? "16px" : "30px" }}>
      <header style={styles.header}>
        <div>
          <span style={styles.liveTag}>● PRODUCCIÓN ACTIVA</span>

          <h1
            style={{
              ...styles.mainTitle,
              fontSize: isMobile ? "34px" : "48px",
            }}
          >
            Producción
          </h1>

          <p
            style={{
              ...styles.subTitle,
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            Selecciona el pedido que se va a trabajar
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => cargarPedidos(true)}
          style={styles.syncBtn}
        >
          <RefreshCcw
            size={isMobile ? 18 : 22}
            className={refreshing ? "animate-spin" : ""}
          />
        </motion.button>
      </header>

      <div
        style={{
          ...styles.tabs,
          overflowX: isMobile ? "auto" : "visible",
          paddingBottom: isMobile ? "10px" : "0",
        }}
      >
        {[
          {
            id: "URGENTES",
            label: "URGENTE",
            count: listas.URGENTES.length,
            color: "#ff4d4d",
          },
          {
            id: "HOY",
            label: "HOY",
            count: listas.HOY.length,
            color: "#eab308",
          },
          {
            id: "GENERAL",
            label: "GENERAL",
            count: listas.GENERAL.length,
            color: "#a1a1aa",
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFiltroActivo(item.id as FiltroProduccion)}
            style={{
              ...styles.tabItem,
              minWidth: isMobile ? "110px" : "auto",
              backgroundColor:
                filtroActivo === item.id ? "#111111" : "rgba(255,255,255,0.65)",
              border:
                filtroActivo === item.id
                  ? `2px solid ${item.color}`
                  : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <span
              style={{
                color: item.color,
                fontWeight: 900,
                fontSize: "20px",
                lineHeight: 1,
              }}
            >
              {item.count}
            </span>
            <span style={styles.tabLabel}>{item.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.scrollArea}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={styles.loadingCard} />
          ))}
        </div>
      ) : (
        <div style={styles.scrollArea}>
          <AnimatePresence mode="popLayout">
            {listaActual.map((pedido) => {
              const timer = pedido.urgente
                ? renderTimer(pedido.fecha_inicio_urgente)
                : null;

              return (
                <motion.div
                  key={pedido.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    ...styles.card,
                    borderLeft: pedido.urgente
                      ? "10px solid #ff4d4d"
                      : filtroActivo === "HOY"
                      ? "10px solid #eab308"
                      : "10px solid #6b7280",
                    padding: isMobile ? "18px" : "24px",
                  }}
                >
                  <div
                    style={{
                      ...styles.cardHeader,
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "flex-start" : "center",
                      gap: "10px",
                    }}
                  >
                    <div style={styles.tomaWrapper}>
                      <h2
                        style={{
                          ...styles.tomaText,
                          fontSize: isMobile ? "30px" : "38px",
                        }}
                      >
                        {pedido.resumenTomas}
                      </h2>

                      {pedido.urgente && (
                        <div style={styles.urgenteLabel}>URGENTE</div>
                      )}
                    </div>

                    {timer && (
                      <div
                        style={{
                          ...styles.timerBox,
                          color: timer.isOver ? "#ff4d4d" : "#eab308",
                        }}
                      >
                        <Clock size={14} />
                        {timer.isOver ? `+${timer.text}` : timer.text} MIN
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      ...styles.clientInfo,
                      flexDirection: isMobile ? "column" : "row",
                      gap: isMobile ? "8px" : "20px",
                    }}
                  >
                    <div style={styles.infoRow}>
                      <User size={14} />
                      {pedido.cliente_nombre || "SIN NOMBRE"}
                    </div>

                    <div style={styles.infoRow}>
                      <Smartphone size={14} />
                      {pedido.horario_entrega || "SIN HORA"}
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    style={{
                      ...styles.callBtn,
                      padding: isMobile ? "18px" : "15px",
                    }}
                    onClick={() => {
                      setPedidoSeleccionado(pedido.id);
                      setVistaActiva("Producción Detalle");
                    }}
                  >
                    ELEGIR ESTE PEDIDO
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!loading && listaActual.length === 0 && (
            <div style={styles.emptyBox}>
              <p style={styles.emptyTitle}>No hay pedidos en esta bandeja</p>
              <span style={styles.emptySub}>
                Cuando lleguen pedidos listos para trabajar aparecerán aquí.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f7f5f0 0%, #f1eee8 100%)",
    fontFamily: "'Montserrat', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "22px",
    gap: "16px",
  },
  liveTag: {
    backgroundColor: "#111",
    color: "#b49d71",
    padding: "5px 12px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1px",
    display: "inline-block",
  },
  mainTitle: {
    fontWeight: 800,
    margin: "10px 0 2px 0",
    letterSpacing: "-1px",
    color: "#111",
    fontFamily: "'Montserrat', sans-serif",
  },
  subTitle: {
    color: "#6b7280",
    margin: 0,
    fontWeight: 500,
  },
  syncBtn: {
    backgroundColor: "#111",
    color: "white",
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
    flexShrink: 0,
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "25px",
    scrollbarWidth: "none",
  },
  tabItem: {
    flex: 1,
    padding: "12px",
    borderRadius: "18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    transition: "0.2s",
    backdropFilter: "blur(8px)",
    boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
  },
  tabLabel: {
    fontSize: "9px",
    fontWeight: 800,
    marginTop: "4px",
    letterSpacing: "1px",
    color: "#d4d4d8",
    textTransform: "uppercase",
  },
  scrollArea: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  loadingCard: {
    height: "165px",
    borderRadius: "28px",
    background: "rgba(0,0,0,0.06)",
    animation: "pulse 1.2s ease-in-out infinite",
  },
  card: {
    background: "linear-gradient(180deg, #111111 0%, #1a1a1a 100%)",
    borderRadius: "28px",
    color: "white",
    boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  tomaWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  tomaText: {
    fontWeight: 900,
    fontStyle: "italic",
    textTransform: "uppercase",
    margin: 0,
    letterSpacing: "-1px",
    fontFamily: "'Vidaloka', serif",
    lineHeight: 1,
  },
  urgenteLabel: {
    backgroundColor: "#ff4d4d",
    fontSize: "9px",
    fontWeight: 900,
    padding: "5px 9px",
    borderRadius: "8px",
    letterSpacing: "0.8px",
  },
  timerBox: {
    fontSize: "11px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(255,255,255,0.04)",
    padding: "8px 10px",
    borderRadius: "12px",
  },
  clientInfo: {
    display: "flex",
    marginBottom: "20px",
    opacity: 0.82,
  },
  infoRow: {
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    letterSpacing: "0.2px",
  },
  callBtn: {
    width: "100%",
    backgroundColor: "#f3f4f6",
    color: "#111",
    border: "none",
    borderRadius: "16px",
    fontWeight: 900,
    fontSize: "12px",
    letterSpacing: "0.5px",
    cursor: "pointer",
    textTransform: "uppercase",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  },
  emptyBox: {
    background: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: "24px",
    padding: "28px",
    textAlign: "center",
  },
  emptyTitle: {
    margin: "0 0 6px 0",
    fontWeight: 700,
    color: "#111",
    fontSize: "16px",
  },
  emptySub: {
    color: "#6b7280",
    fontSize: "14px",
  },
};
