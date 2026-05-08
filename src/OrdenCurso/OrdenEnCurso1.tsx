import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CalendarDays,
  Clock,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Film,
  Sparkles,
  Search,
  X,
} from "lucide-react";

type Pedido = {
  id: string;
  cliente_nombre: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  urgente: boolean | null;
  fecha_creacion: string;
  p_2listo: boolean | null;
  detalles_pedido: { n_toma: string | null }[];
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

export default function OrdenEnCurso1({
  setPedidoSeleccionado,
  setVistaActiva,
}: {
  setPedidoSeleccionado: (pedidoId: string) => void;
  setVistaActiva: (vista: string) => void;
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoActivoId, setPedidoActivoId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const cargarPedidos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `id, cliente_nombre, fecha_entrega, horario_entrega, urgente, fecha_creacion, p_2listo,
           detalles_pedido ( n_toma )`
        )
        .order("fecha_creacion", { ascending: true });

      if (error) throw error;

      const pendientes = ((data || []) as Pedido[]).filter(
        (p) => p.p_2listo !== true
      );

      setPedidos(pendientes);

      if (pendientes.length === 0) {
        setPedidoActivoId(null);
        return;
      }

      const activoSigueExistiendo = pendientes.some(
        (p: Pedido) => p.id === pedidoActivoId
      );

      if (!activoSigueExistiendo) {
        setPedidoActivoId(pendientes[0].id);
      }
    } catch (err) {
      console.error("Error cargando orden en curso:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });
  };

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return pedidos;

    return pedidos.filter((pedido) =>
      (pedido.cliente_nombre || "").toLowerCase().includes(texto)
    );
  }, [pedidos, busqueda]);

  const pedidoActivo = useMemo(() => {
    return pedidosFiltrados.find((p) => p.id === pedidoActivoId) || null;
  }, [pedidosFiltrados, pedidoActivoId]);

  useEffect(() => {
    if (pedidosFiltrados.length === 0) {
      setPedidoActivoId(null);
      return;
    }

    const existeEnFiltrados = pedidosFiltrados.some(
      (p) => p.id === pedidoActivoId
    );

    if (!existeEnFiltrados) {
      setPedidoActivoId(pedidosFiltrados[0].id);
    }
  }, [pedidosFiltrados, pedidoActivoId]);

  if (loading) {
    return (
      <div style={styles.center}>
        <RefreshCw className="animate-spin" size={40} color={THEME.gold} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <div style={styles.badge}>
            <Film size={12} /> ESTUDIO EN VIVO
          </div>
          <h1 style={styles.title}>Orden en Curso</h1>
          <p style={styles.subtitle}>
            Selecciona al cliente para iniciar sesión
          </p>
        </div>
        <button style={styles.refresh} onClick={cargarPedidos}>
          <RefreshCw size={20} color={THEME.white} />
        </button>
      </header>

      <div style={styles.searchWrap}>
        <div style={styles.searchBox}>
          <Search size={18} color={THEME.textSoft} />
          <input
            type="text"
            placeholder="Buscar cliente por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
          {busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              style={styles.clearBtn}
            >
              <X size={16} color={THEME.textSoft} />
            </button>
          ) : null}
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div style={styles.empty}>
          <Camera size={56} color={THEME.gold} />
          <h3 style={styles.emptyTitle}>Set disponible</h3>
          <p style={styles.emptyText}>No hay clientes pendientes por ahora.</p>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div style={styles.empty}>
          <Search size={56} color={THEME.gold} />
          <h3 style={styles.emptyTitle}>Sin resultados</h3>
          <p style={styles.emptyText}>
            No encontramos clientes con ese nombre.
          </p>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {pedidoActivo && (
              <motion.div
                key={pedidoActivo.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.activeBanner}
              >
                <div style={styles.activeBannerLeft}>
                  <UserCheck size={20} color={THEME.gold} />
                  <span style={styles.activeBannerLabel}>EN SET</span>
                </div>
                <div style={styles.activeBannerMain}>
                  <span style={styles.activeBannerName}>
                    {pedidoActivo.cliente_nombre?.toUpperCase() || "SIN NOMBRE"}
                  </span>
                  <span style={styles.activeBannerMeta}>
                    {pedidoActivo.horario_entrega || "SIN HORARIO"} ·{" "}
                    {formatFecha(pedidoActivo.fecha_entrega)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={styles.grid}>
            {pedidosFiltrados.map((pedido, index) => {
              const esActivo = pedido.id === pedidoActivoId;
              const esPrimero = index === 0;

              return (
                <motion.div
                  key={pedido.id}
                  layout
                  onClick={() => setPedidoActivoId(pedido.id)}
                  style={{
                    ...styles.card,
                    ...(esActivo ? styles.cardActivo : styles.cardInactivo),
                    ...(esPrimero && !esActivo ? styles.cardPrimeroCola : {}),
                  }}
                >
                  <div style={styles.cardContent}>
                    <div style={styles.infoSide}>
                      {esActivo ? (
                        <div style={styles.indicator}>
                          <Sparkles size={12} /> SELECCIONADO
                        </div>
                      ) : esPrimero ? (
                        <div style={styles.indicatorCola}>
                          <Sparkles size={12} /> SIGUE EN COLA
                        </div>
                      ) : null}

                      <h2
                        style={{
                          ...styles.nombre,
                          color: esActivo ? THEME.white : THEME.black,
                          fontSize: esActivo ? "32px" : "22px",
                        }}
                      >
                        {pedido.cliente_nombre?.toUpperCase() || "SIN NOMBRE"}
                      </h2>

                      <div
                        style={{
                          ...styles.metaRow,
                          color: esActivo ? THEME.gold : THEME.textSoft,
                        }}
                      >
                        <Clock size={16} />
                        <span>{pedido.horario_entrega || "SIN HORARIO"}</span>
                        <CalendarDays size={16} />
                        <span>{formatFecha(pedido.fecha_entrega)}</span>
                      </div>
                    </div>

                    {pedido.urgente && (
                      <div style={styles.urgenteBadge}>
                        <AlertTriangle size={14} /> URGENTE
                      </div>
                    )}
                  </div>

                  <motion.button
                    style={{
                      ...styles.actionButton,
                      background: esActivo ? THEME.olive : "#EAE7DD",
                      color: esActivo ? THEME.white : THEME.black,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (esActivo) {
                        setPedidoSeleccionado(pedido.id);
                        setVistaActiva("Orden en Curso Detalle");
                        return;
                      }

                      setPedidoActivoId(pedido.id);
                    }}
                  >
                    {esActivo ? "LLAMAR" : "LLAMAR A ESTE CLIENTE"}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px",
    background: THEME.bg,
    minHeight: "100vh",
  },
  center: {
    height: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "16px",
  },
  badge: {
    background: THEME.gold,
    color: THEME.white,
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: 900,
    marginBottom: "8px",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
  },
  title: {
    fontSize: "42px",
    fontWeight: 900,
    margin: 0,
    color: THEME.black,
    letterSpacing: "-1px",
  },
  subtitle: {
    color: THEME.textSoft,
    fontSize: "16px",
  },
  refresh: {
    background: THEME.black,
    border: "none",
    padding: "12px",
    borderRadius: "50%",
    cursor: "pointer",
    flexShrink: 0,
  },
  searchWrap: {
    marginBottom: "22px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: THEME.white,
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "18px",
    padding: "0 14px",
    minHeight: "58px",
    boxShadow: "0 10px 22px rgba(0,0,0,0.04)",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    color: THEME.black,
    fontFamily: "'Montserrat', sans-serif",
  },
  clearBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  activeBanner: {
    display: "flex",
    gap: "20px",
    background: THEME.black,
    color: THEME.white,
    padding: "20px",
    borderRadius: "20px",
    marginBottom: "25px",
    border: `1px solid ${THEME.gold}`,
  },
  activeBannerLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "10px",
    fontWeight: 900,
  },
  activeBannerLabel: {
    color: THEME.gold,
  },
  activeBannerMain: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  activeBannerName: {
    fontSize: "20px",
    fontWeight: 900,
    display: "block",
  },
  activeBannerMeta: {
    fontSize: "14px",
    color: THEME.textSoft,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  card: {
    borderRadius: "24px",
    padding: "25px",
    cursor: "pointer",
    transition: "0.2s",
    overflow: "hidden",
  },
  cardActivo: {
    background: THEME.black,
    color: THEME.white,
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  cardInactivo: {
    background: THEME.white,
    border: "1px solid rgba(0,0,0,0.05)",
  },
  cardPrimeroCola: {
    borderLeft: `6px solid ${THEME.gold}`,
  },
  indicator: {
    color: THEME.gold,
    fontSize: "11px",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginBottom: "10px",
  },
  indicatorCola: {
    color: THEME.gold,
    fontSize: "11px",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginBottom: "10px",
  },
  nombre: {
    margin: 0,
    fontWeight: 900,
    fontStyle: "italic",
  },
  metaRow: {
    display: "flex",
    gap: "15px",
    marginTop: "10px",
    alignItems: "center",
    fontSize: "14px",
    flexWrap: "wrap",
  },
  urgenteBadge: {
    background: THEME.urgent,
    color: THEME.white,
    padding: "5px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: "5px",
    whiteSpace: "nowrap",
  },
  actionButton: {
    marginTop: "20px",
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "15px",
    fontSize: "14px",
    fontWeight: 900,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  cardContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },
  infoSide: {
    display: "flex",
    flexDirection: "column",
  },
  empty: {
    textAlign: "center",
    padding: "80px 20px",
    color: THEME.textSoft,
  },
  emptyTitle: {
    margin: "18px 0 8px 0",
    color: THEME.black,
    fontSize: "24px",
    fontWeight: 900,
  },
  emptyText: {
    margin: 0,
    fontSize: "15px",
  },
};
