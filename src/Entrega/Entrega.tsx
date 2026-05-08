import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  MinusCircle,
  PackageCheck,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { supabase } from "../supabaseClient";

type EntregaProps = {
  usuarioId?: string | null;
};

type PedidoRow = {
  id: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  urgente: boolean | null;
  total_bruto: number | null;
  total_final: number | null;
  descuento: number | null;
  anticipo: number | null;
  liquidacion: number | null;
  total_pagado: number | null;
  resta: number | null;
  pagado: boolean | null;
  p_2listo: boolean | null;
  p3_concluido: boolean | null;
  entregado: boolean | null;
  fecha_inicio_urgente: string | null;
  created_at?: string | null;
};

type DetalleRow = {
  pedido_id: string;
  n_toma: string | null;
  tamano?: string | null;
  cantidad?: number | null;
  tipo?: string | null;
  papel?: string | null;
  especificaciones?: string | null;
};

type PedidoUI = PedidoRow & {
  n_toma_resumen: string;
  estado_ui: "EN_CURSO" | "EN_PRODUCCION" | "LISTO" | "ENTREGADO";
  detalles_resumen: string[];
};

type ToastState = {
  type: "success" | "error" | "warning";
  message: string;
} | null;

const THEME = {
  bg: "#F4F1EA",
  black: "#12110F",
  gold: "#B89F54",
  olive: "#2E4D38",
  white: "#FFFFFF",
  textSoft: "#747169",
  urgent: "#BE123C",
  creamCard: "#F6F0E0",
  creamBorder: "rgba(184,159,84,0.34)",
  greenBtn: "#12C861",
  greenBtnDark: "#0EA84F",
};

const STATUS_CONFIG: Record<
  PedidoUI["estado_ui"],
  { label: string; color: string; bg: string; border: string }
> = {
  ENTREGADO: {
    label: "ENTREGADO",
    color: "#64748b",
    bg: "rgba(100,116,139,0.10)",
    border: "rgba(100,116,139,0.16)",
  },
  LISTO: {
    label: "LISTO PARA ENTREGAR",
    color: THEME.olive,
    bg: "rgba(46,77,56,0.12)",
    border: "rgba(46,77,56,0.18)",
  },
  EN_PRODUCCION: {
    label: "EN PRODUCCIÓN",
    color: "#a16207",
    bg: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.20)",
  },
  EN_CURSO: {
    label: "EN CURSO",
    color: "#475569",
    bg: "rgba(100,116,139,0.10)",
    border: "rgba(100,116,139,0.16)",
  },
};

export default function Entrega({ usuarioId }: EntregaProps) {
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [pedidos, setPedidos] = useState<PedidoUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [liquidandoId, setLiquidandoId] = useState<string | null>(null);
  const [entregandoId, setEntregandoId] = useState<string | null>(null);
  const [montoRecibido, setMontoRecibido] = useState<Record<string, string>>(
    {}
  );
  const [openPagoId, setOpenPagoId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda.trim()), 280);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const money = (v?: number | null) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2,
    }).format(Number(v || 0));

  const getEstado = (pedido: PedidoRow): PedidoUI["estado_ui"] => {
    if (pedido.entregado) return "ENTREGADO";
    if (!pedido.p_2listo) return "EN_CURSO";
    if (pedido.p_2listo && !pedido.p3_concluido) return "EN_PRODUCCION";
    return "LISTO";
  };

  const formatNtomSummary = (nTomas: string[]) => {
    if (!nTomas.length) return "S/T";
    if (nTomas.length === 1) return nTomas[0];
    return `${nTomas[0]} +${nTomas.length - 1}`;
  };

  const buildDetalleResumen = (detalle: DetalleRow) => {
    const parts = [
      detalle.cantidad ? `${detalle.cantidad}` : "",
      detalle.tamano || "",
      detalle.tipo || "",
      detalle.papel || "",
      detalle.especificaciones || "",
    ]
      .map((x) => String(x).trim())
      .filter(Boolean);

    return parts.join(" · ").toUpperCase();
  };

  const buscarPedidos = useCallback(async (texto: string) => {
    if (!texto) {
      setPedidos([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [pedidosByCliente, detallesByToma] = await Promise.all([
        supabase
          .from("pedidos")
          .select(
            `
            id,
            cliente_nombre,
            cliente_telefono,
            fecha_entrega,
            horario_entrega,
            urgente,
            total_bruto,
            total_final,
            descuento,
            anticipo,
            liquidacion,
            total_pagado,
            resta,
            pagado,
            p_2listo,
            p3_concluido,
            entregado,
            fecha_inicio_urgente,
            created_at
          `
          )
          .ilike("cliente_nombre", `%${texto}%`)
          .limit(30),
        supabase
          .from("detalles_pedido")
          .select(
            `
            pedido_id,
            n_toma,
            tamano,
            cantidad,
            tipo,
            papel,
            especificaciones
          `
          )
          .ilike("n_toma", `%${texto}%`)
          .limit(80),
      ]);

      if (pedidosByCliente.error) throw pedidosByCliente.error;
      if (detallesByToma.error) throw detallesByToma.error;

      const pedidosMap = new Map<string, PedidoRow>();

      (pedidosByCliente.data || []).forEach((p) => {
        pedidosMap.set(p.id, p as PedidoRow);
      });

      const idsPorToma = Array.from(
        new Set((detallesByToma.data || []).map((d) => d.pedido_id))
      );

      if (idsPorToma.length) {
        const { data: pedidosExtra, error: pedidosExtraError } = await supabase
          .from("pedidos")
          .select(
            `
            id,
            cliente_nombre,
            cliente_telefono,
            fecha_entrega,
            horario_entrega,
            urgente,
            total_bruto,
            total_final,
            descuento,
            anticipo,
            liquidacion,
            total_pagado,
            resta,
            pagado,
            p_2listo,
            p3_concluido,
            entregado,
            fecha_inicio_urgente,
            created_at
          `
          )
          .in("id", idsPorToma);

        if (pedidosExtraError) throw pedidosExtraError;

        (pedidosExtra || []).forEach((p) => {
          pedidosMap.set(p.id, p as PedidoRow);
        });
      }

      const allPedidos = Array.from(pedidosMap.values());

      if (!allPedidos.length) {
        setPedidos([]);
        setLoading(false);
        return;
      }

      const pedidoIds = allPedidos.map((p) => p.id);

      const { data: detallesRows, error: detallesError } = await supabase
        .from("detalles_pedido")
        .select(
          `
          pedido_id,
          n_toma,
          tamano,
          cantidad,
          tipo,
          papel,
          especificaciones
        `
        )
        .in("pedido_id", pedidoIds);

      if (detallesError) throw detallesError;

      const detallesPorPedido = new Map<string, DetalleRow[]>();
      (detallesRows || []).forEach((detalle) => {
        const arr = detallesPorPedido.get(detalle.pedido_id) || [];
        arr.push(detalle as DetalleRow);
        detallesPorPedido.set(detalle.pedido_id, arr);
      });

      const enriched: PedidoUI[] = allPedidos
        .map((pedido) => {
          const detalles = detallesPorPedido.get(pedido.id) || [];
          const tomas = Array.from(
            new Set(
              detalles
                .map((d) => (d.n_toma || "").trim())
                .filter((x) => x.length > 0)
            )
          );

          return {
            ...pedido,
            n_toma_resumen: formatNtomSummary(tomas),
            estado_ui: getEstado(pedido),
            detalles_resumen: detalles
              .map(buildDetalleResumen)
              .filter(Boolean)
              .slice(0, 8),
          };
        })
        .sort((a, b) => {
          if (!!a.entregado !== !!b.entregado) return a.entregado ? 1 : -1;
          if (!!a.urgente !== !!b.urgente) return a.urgente ? -1 : 1;
          const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bd - ad;
        });

      setPedidos(enriched);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setToast({
        type: "error",
        message: "No se pudieron cargar los pedidos",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarPedidos(busquedaDebounced);
  }, [busquedaDebounced, buscarPedidos]);

  const onLiquidar = async (pedido: PedidoUI) => {
    try {
      if (!usuarioId) {
        setToast({
          type: "error",
          message: "Falta usuarioId para registrar el pago",
        });
        return;
      }

      const resta = Number(pedido.resta || 0);
      const recibido = Number(montoRecibido[pedido.id] || 0);

      if (resta <= 0) {
        setToast({
          type: "warning",
          message: "Este pedido ya no tiene saldo pendiente",
        });
        return;
      }

      if (!recibido || recibido < resta) {
        setToast({
          type: "warning",
          message: "El monto recibido debe cubrir la resta",
        });
        return;
      }

      setLiquidandoId(pedido.id);

      const { error } = await supabase.from("pagos").insert({
        pedido_id: pedido.id,
        monto: resta,
        tipo: "LIQUIDACION",
        usuario_id: usuarioId,
      });

      if (error) throw error;

      setToast({
        type: "success",
        message: "Liquidación registrada correctamente",
      });

      setMontoRecibido((prev) => ({ ...prev, [pedido.id]: "" }));
      setOpenPagoId(null);
      await buscarPedidos(busquedaDebounced);
    } catch (error) {
      console.error("Error al liquidar:", error);
      setToast({
        type: "error",
        message: "No se pudo registrar la liquidación",
      });
    } finally {
      setLiquidandoId(null);
    }
  };

  const onEntregar = async (pedido: PedidoUI) => {
    try {
      if (!pedido.p3_concluido) {
        setToast({
          type: "warning",
          message: "Pedido aún en producción",
        });
        return;
      }

      if (Number(pedido.resta || 0) > 1) {
        setToast({
          type: "warning",
          message: "Primero debes liquidar el pedido",
        });
        return;
      }

      setEntregandoId(pedido.id);

      const { error } = await supabase
        .from("pedidos")
        .update({ entregado: true })
        .eq("id", pedido.id);

      if (error) throw error;

      setToast({
        type: "success",
        message: "Pedido entregado correctamente",
      });

      await buscarPedidos(busquedaDebounced);
    } catch (error) {
      console.error("Error al entregar:", error);
      setToast({
        type: "error",
        message: "No se pudo marcar como entregado",
      });
    } finally {
      setEntregandoId(null);
    }
  };

  return (
    <div style={styles.container} className="entrega-container">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.header}
        className="entrega-header"
      >
        <div style={styles.headerBadge}>
          <Sparkles size={12} />
          ESTUDIO EN VIVO
        </div>

        <h1 style={styles.mainTitle} className="entrega-title">
          Entrega de Pedidos
        </h1>

        <p style={styles.subTitle}>
          Busca por nombre del cliente o número de toma.
        </p>

        <div style={styles.searchBox}>
          <Search size={22} color={THEME.gold} style={styles.searchIcon} />
          <input
            style={styles.input}
            className="entrega-input"
            placeholder="Buscar por cliente o número de toma..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </motion.header>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              ...styles.toast,
              ...(toast.type === "success"
                ? styles.toastSuccess
                : toast.type === "warning"
                ? styles.toastWarning
                : styles.toastError),
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : toast.type === "warning" ? (
              <ShieldAlert size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.resultsArea}>
        {loading ? (
          <div style={styles.emptyState}>
            <div style={styles.searchCircle}>
              <Loader2 size={30} color={THEME.gold} style={styles.spin} />
            </div>
            <h3 style={styles.emptyTitle}>Buscando pedidos</h3>
            <p style={styles.emptyText}>
              Estamos sincronizando la información del estudio.
            </p>
          </div>
        ) : pedidos.length > 0 ? (
          <div style={styles.grid}>
            {pedidos.map((pedido) => (
              <CardPedido
                key={pedido.id}
                pedido={pedido}
                montoPaga={montoRecibido[pedido.id] || ""}
                setMontoPaga={(v: string) =>
                  setMontoRecibido((prev) => ({
                    ...prev,
                    [pedido.id]: v.replace(/[^0-9.]/g, ""),
                  }))
                }
                isOpen={openPagoId === pedido.id}
                toggleOpen={() =>
                  setOpenPagoId((prev) =>
                    prev === pedido.id ? null : pedido.id
                  )
                }
                liquidando={liquidandoId === pedido.id}
                entregando={entregandoId === pedido.id}
                onLiquidar={() => onLiquidar(pedido)}
                onEntregar={() => onEntregar(pedido)}
                money={money}
              />
            ))}
          </div>
        ) : busqueda.length > 0 ? (
          <div style={styles.emptyState}>
            <AlertCircle size={40} color={THEME.gold} />
            <h3 style={styles.emptyTitle}>No encontramos pedidos</h3>
            <p style={styles.emptyText}>
              No encontramos pedidos con esa información.
            </p>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.searchCircle}>
              <Search size={30} color={THEME.gold} />
            </div>
            <h3 style={styles.emptyTitle}>Busca un pedido</h3>
            <p style={styles.emptyText}>
              Escribe el nombre del cliente o el número de toma.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .entrega-card-header {
            grid-template-columns: 1fr !important;
          }
          .entrega-right-top {
            min-width: 0 !important;
            text-align: left !important;
          }
          .entrega-finance-box {
            align-items: flex-start !important;
          }
          .entrega-finance-title {
            justify-content: flex-start !important;
          }
          .entrega-finance-mini {
            text-align: left !important;
          }
        }

        @media (max-width: 760px) {
          .entrega-container {
            padding: 14px !important;
          }
          .entrega-header {
            padding: 24px 18px !important;
            border-radius: 22px !important;
            margin-bottom: 22px !important;
          }
          .entrega-title {
            font-size: 30px !important;
            margin-bottom: 12px !important;
          }
          .entrega-input {
            font-size: 15px !important;
            padding: 16px 16px 16px 52px !important;
            border-radius: 18px !important;
          }
          .entrega-card {
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .entrega-client-name {
            font-size: 16px !important;
          }
          .entrega-toma-line {
            font-size: 15px !important;
          }
          .entrega-detail-line {
            font-size: 11px !important;
          }
          .entrega-calc-row {
            grid-template-columns: 1fr !important;
          }
          .entrega-actions-row {
            grid-template-columns: 1fr 1fr !important;
            justify-content: stretch !important;
          }
          .entrega-btn {
            min-height: 44px !important;
            padding: 11px 12px !important;
            font-size: 11px !important;
          }
        }

        @media (max-width: 560px) {
          .entrega-actions-row {
            grid-template-columns: 1fr !important;
          }
          .entrega-btn {
            width: 100% !important;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function CardPedido({
  pedido,
  montoPaga,
  setMontoPaga,
  isOpen,
  toggleOpen,
  liquidando,
  entregando,
  onLiquidar,
  onEntregar,
  money,
}: {
  pedido: PedidoUI;
  montoPaga: string;
  setMontoPaga: (val: string) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  liquidando: boolean;
  entregando: boolean;
  onLiquidar: () => void;
  onEntregar: () => void;
  money: (v?: number | null) => string;
}) {
  const resta = Number(pedido.resta || 0);
  const recibido = Number(montoPaga || 0);
  const cambio = recibido > 0 ? recibido - resta : 0;
  const config = STATUS_CONFIG[pedido.estado_ui];
  const estaPagado = Number(pedido.resta || 0) <= 1;
  const total = Number(pedido.total_final || pedido.total_bruto || 0);
  const anticipo = Number(pedido.total_pagado || pedido.anticipo || 0);

  const puedeEntregar =
    !!pedido.p3_concluido &&
    Number(pedido.resta || 0) <= 1 &&
    !pedido.entregado;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      style={{
        ...styles.card,
        border: estaPagado
          ? "2px solid rgba(18,200,97,0.45)"
          : "2px solid rgba(190,18,60,0.30)",
        background: estaPagado
          ? "linear-gradient(135deg, #f0fff5 0%, #e4faec 100%)"
          : "linear-gradient(135deg, #fff1f2 0%, #fff8f8 100%)",
        boxShadow: estaPagado
          ? "0 18px 40px rgba(18,200,97,0.16)"
          : "0 18px 40px rgba(190,18,60,0.10)",
      }}
      className="entrega-card"
    >
      <div style={styles.cardHeader} className="entrega-card-header">
        <div style={styles.cardMainInfo}>
          <h2 style={styles.clienteName} className="entrega-client-name">
            {pedido.cliente_nombre || "SIN NOMBRE"}
          </h2>

          <div style={styles.tomaLine} className="entrega-toma-line">
            N. TOMA: {pedido.n_toma_resumen}
          </div>

          <div style={styles.entregaLine}>
            Entrega: {pedido.fecha_entrega || "S/F"} ·{" "}
            {pedido.horario_entrega || "S/H"}
          </div>
        </div>

        <div style={styles.rightTop} className="entrega-right-top">
          <div style={styles.financeBox} className="entrega-finance-box">
            <div
              style={{
                ...styles.financeTitle,
                color: estaPagado ? "#16a34a" : "#dc2626",
              }}
              className="entrega-finance-title"
            >
              {estaPagado ? (
                <>
                  <CheckCircle2
                    size={15}
                    color={estaPagado ? "#16a34a" : "#dc2626"}
                  />
                  PAGADO
                </>
              ) : (
                <>
                  <MinusCircle size={15} />
                  DEBE
                </>
              )}
            </div>

            <div style={styles.financeResta}>
              Resta: <b>{money(resta)}</b>
            </div>

            <div style={styles.financeMini} className="entrega-finance-mini">
              Total: {money(total)} · A/C: {money(anticipo)}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.badgesRow}>
        <span
          style={{
            ...styles.statusBadge,
            color: config.color,
            backgroundColor: config.bg,
            borderColor: config.border,
          }}
        >
          {config.label}
          {pedido.p3_concluido && <CheckCircle2 size={13} />}
        </span>

        {pedido.urgente && (
          <div style={styles.urgenteTag}>
            <Sparkles size={12} />
            URGENTE
          </div>
        )}
      </div>

      {pedido.detalles_resumen.length > 0 && (
        <div style={styles.detallesBox}>
          {pedido.detalles_resumen.map((detalle, index) => (
            <div
              key={index}
              style={styles.detalleLine}
              className="entrega-detail-line"
            >
              {detalle}
            </div>
          ))}
        </div>
      )}

      {resta > 0 && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={styles.pagoSection}>
                <div style={styles.calcRow} className="entrega-calc-row">
                  <input
                    type="number"
                    placeholder="¿Con cuánto paga?"
                    style={styles.pagoInput}
                    value={montoPaga}
                    onChange={(e) => setMontoPaga(e.target.value)}
                  />

                  <div style={styles.cambioDisplay}>
                    <label style={styles.cambioLabel}>CAMBIO</label>
                    <span style={styles.cambioValue}>
                      {money(cambio > 0 ? cambio : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {!pedido.p3_concluido && (
        <div style={styles.warningPill}>PEDIDO AÚN EN PRODUCCIÓN</div>
      )}

      <div style={styles.actionsRow} className="entrega-actions-row">
        {resta > 0 ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={isOpen ? onLiquidar : toggleOpen}
            disabled={
              liquidando ||
              !pedido.p3_concluido ||
              (isOpen && (!montoPaga || Number(montoPaga) < resta))
            }
            style={{
              ...styles.btnBase,
              ...styles.btnCobrar,
              opacity:
                liquidando ||
                !pedido.p3_concluido ||
                (isOpen && (!montoPaga || Number(montoPaga) < resta))
                  ? 0.55
                  : 1,
            }}
            className="entrega-btn"
          >
            {liquidando ? (
              <>
                <Loader2 size={16} style={styles.spin} />
                PROCESANDO
              </>
            ) : (
              <>
                <CreditCard size={16} />
                {isOpen ? "Confirmar Cobro" : "Cobrar"}
              </>
            )}
          </motion.button>
        ) : (
          <button
            type="button"
            disabled
            style={{
              ...styles.btnBase,
              ...styles.btnCobrarDisabled,
            }}
            className="entrega-btn"
          >
            <CheckCircle2 size={16} />
            Pagado
          </button>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onEntregar}
          disabled={!puedeEntregar || entregando}
          style={{
            ...styles.btnBase,
            ...styles.btnEntregar,
            opacity: !puedeEntregar || entregando ? 0.55 : 1,
          }}
          className="entrega-btn"
        >
          {entregando ? (
            <>
              <Loader2 size={16} style={styles.spin} />
              ENTREGANDO
            </>
          ) : pedido.entregado ? (
            <>
              <CheckCircle2 size={16} />
              ENTREGADO
            </>
          ) : (
            <>
              <PackageCheck size={16} />
              Entregar
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: THEME.bg,
    padding: "20px",
    fontFamily: "'Montserrat', system-ui, sans-serif",
  },

  header: {
    background: THEME.white,
    borderRadius: "28px",
    padding: "34px 30px",
    marginBottom: "30px",
    boxShadow: "0 20px 40px rgba(18,17,15,0.08)",
    border: `1px solid rgba(18,17,15,0.04)`,
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(184,159,84,0.12)",
    color: THEME.gold,
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1px",
    marginBottom: "10px",
  },
  mainTitle: {
    fontSize: "40px",
    fontWeight: 900,
    margin: "0 0 6px 0",
    color: THEME.black,
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    letterSpacing: "-1px",
  },
  subTitle: {
    color: THEME.textSoft,
    fontSize: "15px",
    margin: "0 0 18px 0",
    fontWeight: 500,
  },
  searchBox: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "18px",
    zIndex: 2,
  },
  input: {
    width: "100%",
    padding: "18px 18px 18px 52px",
    borderRadius: "18px",
    border: `1px solid rgba(18,17,15,0.06)`,
    background: "#F8F5EE",
    color: THEME.black,
    fontSize: "17px",
    fontWeight: 600,
    outline: "none",
    boxSizing: "border-box",
  },

  resultsArea: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "18px",
  },

  card: {
    background: THEME.creamCard,
    borderRadius: "22px",
    padding: "16px",
    border: `1px solid ${THEME.creamBorder}`,
    boxShadow: "0 10px 24px rgba(18,17,15,0.06)",
    width: "100%",
    boxSizing: "border-box",
  },
  cardHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) auto",
    gap: "16px",
    marginBottom: "12px",
    alignItems: "start",
  },
  cardMainInfo: {
    minWidth: 0,
  },
  clienteName: {
    fontSize: "16px",
    fontWeight: 900,
    margin: 0,
    color: THEME.black,
    textTransform: "uppercase",
    wordBreak: "break-word",
    lineHeight: 1.15,
  },
  tomaLine: {
    marginTop: "8px",
    fontSize: "17px",
    fontWeight: 1000,
    color: "#000",
    letterSpacing: "0.2px",
    wordBreak: "break-word",
  },
  entregaLine: {
    marginTop: "8px",
    fontSize: "12px",
    color: THEME.textSoft,
    fontWeight: 700,
    wordBreak: "break-word",
  },

  rightTop: {
    minWidth: "180px",
    textAlign: "right",
  },
  financeBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  },
  financeTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "6px",
    color: THEME.urgent,
    fontSize: "12px",
    fontWeight: 1000,
    letterSpacing: "0.4px",
    flexWrap: "wrap",
  },
  financeResta: {
    color: THEME.black,
    fontSize: "12px",
    fontWeight: 800,
  },
  financeMini: {
    color: THEME.textSoft,
    fontSize: "11px",
    fontWeight: 700,
    textAlign: "right",
    lineHeight: 1.3,
  },

  badgesRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  statusBadge: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 950,
    letterSpacing: "0.25px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid transparent",
    flexWrap: "wrap",
  },
  urgenteTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    color: THEME.urgent,
    fontWeight: 950,
    fontSize: "10px",
    letterSpacing: "0.5px",
  },

  detallesBox: {
    background: THEME.black,
    color: THEME.white,
    borderRadius: "18px",
    padding: "12px 14px",
    marginBottom: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  detalleLine: {
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1.55,
    textTransform: "uppercase",
    wordBreak: "break-word",
  },

  pagoSection: {
    marginBottom: "14px",
  },
  calcRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  pagoInput: {
    padding: "13px",
    borderRadius: "14px",
    border: `1px solid rgba(18,17,15,0.08)`,
    backgroundColor: THEME.white,
    color: THEME.black,
    fontSize: "14px",
    fontWeight: 800,
    outline: "none",
    minWidth: 0,
    boxSizing: "border-box",
    width: "100%",
  },
  cambioDisplay: {
    background: THEME.white,
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
    border: `1px solid rgba(18,17,15,0.06)`,
    minWidth: 0,
    boxSizing: "border-box",
  },
  cambioLabel: {
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "1px",
    color: THEME.textSoft,
  },
  cambioValue: {
    fontSize: "20px",
    fontWeight: 1000,
    color: THEME.olive,
    lineHeight: 1.1,
    wordBreak: "break-word",
    textAlign: "right",
  },

  warningPill: {
    marginBottom: "14px",
    backgroundColor: "rgba(190,18,60,0.10)",
    color: THEME.urgent,
    border: "1px solid rgba(190,18,60,0.14)",
    borderRadius: "14px",
    padding: "11px 14px",
    fontSize: "12px",
    fontWeight: 900,
    textAlign: "center",
  },

  actionsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(180px, 280px))",
    gap: "10px",
    justifyContent: "start",
    alignItems: "stretch",
  },
  btnBase: {
    minHeight: "44px",
    padding: "11px 18px",
    borderRadius: "14px",
    border: "none",
    fontWeight: 950,
    fontSize: "11px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    letterSpacing: "0.4px",
    width: "100%",
    boxSizing: "border-box",
  },
  btnCobrar: {
    background: THEME.black,
    color: THEME.white,
    boxShadow: "0 6px 14px rgba(18,17,15,0.10)",
  },
  btnCobrarDisabled: {
    background: "linear-gradient(180deg, #48443f 0%, #302d29 100%)",
    color: "rgba(255,255,255,0.78)",
    opacity: 0.95,
    cursor: "default",
    boxShadow: "0 6px 14px rgba(18,17,15,0.08)",
  },
  btnEntregar: {
    background: `linear-gradient(180deg, ${THEME.greenBtn} 0%, ${THEME.greenBtnDark} 100%)`,
    color: "#06210f",
    boxShadow: "0 8px 16px rgba(18,200,97,0.18)",
  },

  emptyState: {
    textAlign: "center",
    padding: "56px 20px",
    color: THEME.textSoft,
    backgroundColor: THEME.white,
    borderRadius: "24px",
    boxShadow: "0 12px 24px rgba(18,17,15,0.04)",
  },
  searchCircle: {
    width: "68px",
    height: "68px",
    backgroundColor: "rgba(184,159,84,0.10)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: 900,
    color: THEME.black,
    fontFamily: "'Vidaloka', serif",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: THEME.textSoft,
  },

  toast: {
    marginBottom: "16px",
    padding: "14px 16px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    fontWeight: 800,
  },
  toastSuccess: {
    backgroundColor: "rgba(34,197,94,0.12)",
    color: "#166534",
    border: "1px solid rgba(34,197,94,0.18)",
  },
  toastWarning: {
    backgroundColor: "rgba(245,158,11,0.12)",
    color: "#92400e",
    border: "1px solid rgba(245,158,11,0.18)",
  },
  toastError: {
    backgroundColor: "rgba(239,68,68,0.12)",
    color: "#b91c1c",
    border: "1px solid rgba(239,68,68,0.18)",
  },
  spin: {
    animation: "spin 1s linear infinite",
  },
};
