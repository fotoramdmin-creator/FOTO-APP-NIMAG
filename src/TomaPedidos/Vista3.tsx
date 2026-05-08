import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  User,
  CalendarDays,
  Zap,
  ArrowLeft,
  CheckCircle2,
  FileText,
  BadgeDollarSign,
  Tag,
  X,
  Phone,
  Clock,
} from "lucide-react";

// --- TIPOS ---
type DatosCliente = {
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_entrega: string;
  horario_entrega: string;
};

type ItemCarrito = {
  id: number | string;
  tamano: string;
  cantidad: number;
  tipo?: string;
  papel?: string;
  esUrgente?: boolean;
  esKenfor?: boolean;
  especificaciones?: string;
  total?: number;
};

// --- TEMA ---
const THEME = {
  bg: "#F7F3EB",
  card: "rgba(255, 255, 255, 0.85)",
  cardSoft: "#fffdf8",
  text: "#1c1a15",
  textSoft: "#747169",
  olive: "#2e4d38",
  gold: "#b89f54",
  goldGradient: "linear-gradient(135deg, #D4B468 0%, #B08D3E 100%)",
  border: "rgba(184, 159, 84, 0.22)",
  line: "rgba(184, 159, 84, 0.12)",
  danger: "#b44a3f",
  shadow: "0 25px 60px rgba(50, 42, 32, 0.12)",
};

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n || 0);

const formatFecha = (fecha: string) => {
  if (!fecha) return "Sin fecha";
  const d = new Date(`${fecha}T12:00:00`);
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
  });
};

const Vista3 = ({
  datosCliente,
  carrito,
  onVolver,
  onConfirmar,
  guardando = false,
  descuentoManual,
  setDescuentoManual,
}: {
  datosCliente: DatosCliente;
  carrito: ItemCarrito[];
  onVolver: () => void;
  onConfirmar: () => void;
  guardando?: boolean;
  descuentoManual: number;
  setDescuentoManual: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mostrarDescuento, setMostrarDescuento] = useState(false);
  const [descuentoInput, setDescuentoInput] = useState(
    descuentoManual ? String(descuentoManual) : ""
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalBruto = useMemo(
    () => carrito.reduce((acc, item) => acc + Number(item.total || 0), 0),
    [carrito]
  );
  const descuentoAplicado = useMemo(
    () => Math.min(Number(descuentoManual || 0), totalBruto),
    [descuentoManual, totalBruto]
  );
  const totalFinal = useMemo(
    () => Math.max(0, totalBruto - descuentoAplicado),
    [totalBruto, descuentoAplicado]
  );
  const pedidoEsUrgente = useMemo(
    () => carrito.some((item) => item.esUrgente),
    [carrito]
  );

  const resumenValido =
    carrito.length > 0 && datosCliente.cliente_nombre.trim() !== "";

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowTop} />

      <div
        style={{
          ...styles.container,
          ...(isMobile ? styles.containerMobile : styles.containerDesktop),
        }}
      >
        <header style={styles.headerWrap}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={styles.kicker}>FOTO ESTUDIO RAMÍREZ</div>
            <h2 style={styles.title}>Confirmar Pedido</h2>
            <div style={styles.titleUnderline} />
          </motion.div>
        </header>

        <div
          style={{
            ...styles.layout,
            ...(isMobile ? styles.layoutMobile : styles.layoutDesktop),
          }}
        >
          {/* COLUMNA IZQUIERDA: DETALLES */}
          <section style={styles.mainColumn}>
            {/* CARD CLIENTE & ENTREGA */}
            <div style={styles.glassCard}>
              <div style={styles.dualGrid}>
                <div style={styles.infoGroup}>
                  <div style={styles.miniLabel}>
                    <User size={12} /> Cliente
                  </div>
                  <div style={styles.infoHighlight}>
                    {datosCliente.cliente_nombre || "Sin nombre"}
                  </div>
                  <div style={styles.subInfo}>
                    <Phone size={12} />{" "}
                    {datosCliente.cliente_telefono || "Sin Tel."}
                  </div>
                </div>
                <div style={styles.infoGroup}>
                  <div style={styles.miniLabel}>
                    <Clock size={12} /> Entrega Estimada
                  </div>
                  <div
                    style={{
                      ...styles.infoHighlight,
                      color: pedidoEsUrgente ? THEME.danger : THEME.text,
                    }}
                  >
                    {pedidoEsUrgente
                      ? "⚡ Urgente (15-25 min)"
                      : `${formatFecha(datosCliente.fecha_entrega)} - ${
                          datosCliente.horario_entrega
                        }`}
                  </div>
                </div>
              </div>
            </div>

            {/* LISTA DE ITEMS */}
            <div style={{ marginTop: "24px" }}>
              <div style={styles.sectionHeader}>
                <ShoppingBag size={18} color={THEME.gold} />
                <span style={styles.sectionTitle}>
                  Servicios en Carrito ({carrito.length})
                </span>
              </div>

              <div style={styles.itemsList}>
                {carrito.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={styles.itemRow}
                  >
                    <div style={styles.itemLeading}>
                      <div style={styles.itemQty}>{item.cantidad}</div>
                    </div>
                    <div style={styles.itemBody}>
                      <div style={styles.itemName}>
                        {item.tamano} {item.tipo}
                      </div>
                      <div style={styles.itemSub}>
                        {item.papel || "Papel Estándar"}
                      </div>
                      {item.especificaciones && (
                        <div style={styles.itemSpec}>
                          <FileText size={12} /> {item.especificaciones}
                        </div>
                      )}
                    </div>
                    <div style={styles.itemPrice}>
                      {money(item.total || 0)}
                      {item.esUrgente && (
                        <div style={styles.urgentTag}>Urgente</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* COLUMNA DERECHA: TOTALES (ESTILO TICKET NOCTURNO) */}
          <aside style={styles.sideColumn}>
            <div
              style={{
                ...styles.stickyCard,
                ...(isMobile ? styles.stickyCardMobile : {}),
              }}
            >
              <div style={styles.sideKicker}>RESUMEN DE PAGO</div>

              <div style={styles.priceRow}>
                <span>Subtotal</span>
                <span>{money(totalBruto)}</span>
              </div>

              <div style={styles.priceRow}>
                <button
                  onClick={() => setMostrarDescuento(!mostrarDescuento)}
                  style={styles.addDiscountBtn}
                >
                  <Tag size={14} />{" "}
                  {descuentoAplicado > 0
                    ? "Editar Descuento"
                    : "Agregar Descuento"}
                </button>
                {descuentoAplicado > 0 && (
                  <span style={{ color: THEME.gold }}>
                    - {money(descuentoAplicado)}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {mostrarDescuento && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={styles.discountInputBox}>
                      <input
                        type="number"
                        placeholder="Monto en pesos"
                        value={descuentoInput}
                        onChange={(e) => {
                          setDescuentoInput(e.target.value);
                          setDescuentoManual(Number(e.target.value));
                        }}
                        style={styles.minimalInput}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={styles.divider} />

              <div style={styles.totalFinalRow}>
                <div style={styles.totalLabel}>TOTAL FINAL</div>
                <div style={styles.totalAmount}>{money(totalFinal)}</div>
              </div>

              <div style={styles.buttonGroup}>
                <motion.button
                  whileHover={
                    resumenValido && !guardando ? { scale: 1.02 } : {}
                  }
                  whileTap={resumenValido && !guardando ? { scale: 0.98 } : {}}
                  onClick={onConfirmar}
                  disabled={!resumenValido || guardando}
                  style={{
                    ...styles.confirmBtn,
                    opacity: resumenValido ? 1 : 0.5,
                  }}
                >
                  {guardando ? "Guardando..." : "Confirmar Orden"}
                  <CheckCircle2 size={20} />
                </motion.button>

                <button onClick={onVolver} style={styles.backBtn}>
                  <ArrowLeft size={16} /> Volver a editar
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#F7F3EB",
    position: "relative",
    fontFamily: "'Inter', sans-serif",
    color: THEME.text,
  },
  bgGlowTop: {
    position: "fixed",
    top: 0,
    width: "100%",
    height: "400px",
    background:
      "radial-gradient(circle at top, rgba(184,159,84,0.1), transparent)",
    pointerEvents: "none",
  },
  container: { margin: "0 auto", position: "relative", zIndex: 1 },
  containerDesktop: { maxWidth: "1100px", padding: "60px 24px" },
  containerMobile: { padding: "30px 16px" },
  headerWrap: { textAlign: "center", marginBottom: "40px" },
  kicker: {
    fontSize: "11px",
    fontWeight: 900,
    color: THEME.gold,
    letterSpacing: "3px",
  },
  title: {
    fontSize: "38px",
    fontWeight: 850,
    margin: "10px 0",
    letterSpacing: "-1px",
  },
  titleUnderline: {
    width: "50px",
    height: "4px",
    background: THEME.goldGradient,
    margin: "0 auto",
    borderRadius: "10px",
  },

  layout: { display: "grid", gap: "30px" },
  layoutDesktop: { gridTemplateColumns: "1fr 380px" },
  layoutMobile: { gridTemplateColumns: "1fr" },

  glassCard: {
    background: THEME.card,
    padding: "24px",
    borderRadius: "24px",
    border: `1px solid ${THEME.border}`,
    boxShadow: THEME.shadow,
    backdropFilter: "blur(12px)",
  },
  dualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  miniLabel: {
    fontSize: "10px",
    fontWeight: 800,
    color: THEME.gold,
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px",
  },
  infoHighlight: { fontSize: "18px", fontWeight: 800 },
  subInfo: {
    fontSize: "13px",
    color: THEME.textSoft,
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
    paddingLeft: "8px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: THEME.textSoft,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  itemsList: { display: "flex", flexDirection: "column", gap: "12px" },
  itemRow: {
    background: "white",
    padding: "18px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: `1px solid ${THEME.line}`,
    boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
  },
  itemLeading: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#f9f6ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  itemQty: { fontWeight: 900, color: THEME.gold, fontSize: "16px" },
  itemBody: { flex: 1 },
  itemName: { fontWeight: 800, fontSize: "15px" },
  itemSub: { fontSize: "12px", color: THEME.textSoft, marginTop: "2px" },
  itemSpec: {
    fontSize: "12px",
    color: THEME.gold,
    marginTop: "6px",
    fontStyle: "italic",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  itemPrice: { textAlign: "right", fontWeight: 900, fontSize: "16px" },
  urgentTag: {
    fontSize: "9px",
    background: THEME.danger,
    color: "white",
    padding: "2px 6px",
    borderRadius: "4px",
    marginTop: "4px",
    textTransform: "uppercase",
  },

  stickyCard: {
    background: "#1a1814",
    color: "white",
    padding: "30px",
    borderRadius: "32px",
    position: "sticky",
    top: "20px",
    boxShadow: "0 30px 60px rgba(0,0,0,0.2)",
  },
  stickyCardMobile: { position: "relative", top: 0 },
  sideKicker: {
    fontSize: "10px",
    fontWeight: 900,
    opacity: 0.5,
    letterSpacing: "2px",
    marginBottom: "20px",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
    fontSize: "14px",
    opacity: 0.9,
  },
  addDiscountBtn: {
    background: "transparent",
    border: "none",
    color: THEME.gold,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: 700,
    padding: 0,
  },
  discountInputBox: { marginBottom: "15px" },
  minimalInput: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid rgba(255,255,255,0.1)`,
    padding: "12px",
    borderRadius: "12px",
    color: "white",
    outline: "none",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.1)",
    margin: "20px 0",
  },
  totalFinalRow: { marginBottom: "30px" },
  totalLabel: {
    fontSize: "11px",
    fontWeight: 800,
    opacity: 0.6,
    marginBottom: "5px",
  },
  totalAmount: { fontSize: "42px", fontWeight: 900, letterSpacing: "-1px" },

  confirmBtn: {
    background: THEME.goldGradient,
    color: "white",
    border: "none",
    padding: "20px",
    borderRadius: "18px",
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    width: "100%",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    opacity: 0.5,
    marginTop: "15px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
  },
  buttonGroup: { display: "flex", flexDirection: "column", gap: "5px" },
};

export default Vista3;
