import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  BadgeDollarSign,
  Receipt,
  Banknote,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

type TipoPago = "A_CUENTA" | "LIQUIDACION";

type Props = {
  pedidoId: string;
  clienteNombre: string;
  usuarioId?: string;
  totalBruto: number;
  descuento: number;
  totalFinal: number;
  pendiente: number;
  onVolver: () => void;
  onFinalizado: () => void;
};

const THEME = {
  bg: "#F4F1EA",
  gold: "#b89f54",
  olive: "#556b2f",
  oliveSoft: "#6b7f3a",
  black: "#12110F",
  accentGray: "#475569",
  text: "#1c1a15",
  textSoft: "#747169",
  white: "#FFFFFF",
  border: "rgba(184, 159, 84, 0.2)",
  danger: "#be123c",
};

function Vista4Pago({
  pedidoId,
  clienteNombre,
  usuarioId,
  totalBruto,
  descuento,
  totalFinal,
  pendiente,
  onVolver,
  onFinalizado,
}: Props) {
  const [tipoPago, setTipoPago] = useState<TipoPago>("A_CUENTA");
  const [montoRegistrar, setMontoRegistrar] = useState("");
  const [conCuantoPaga, setConCuantoPaga] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const montoRegistrarNum = Number(montoRegistrar || 0);
  const conCuantoPagaNum = Number(conCuantoPaga || 0);

  const montoRealARegistrar = useMemo(() => {
    if (tipoPago === "LIQUIDACION") return Number(pendiente || 0);
    return montoRegistrarNum;
  }, [tipoPago, pendiente, montoRegistrarNum]);

  const cambio = useMemo(() => {
    return conCuantoPagaNum - montoRealARegistrar;
  }, [conCuantoPagaNum, montoRealARegistrar]);

  const formatoMoneda = (valor: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(valor || 0));

  const limpiarError = () => setError("");

  const guardarPago = async () => {
    limpiarError();

    if (tipoPago === "A_CUENTA" && montoRealARegistrar <= 0) {
      setError("Ingresa un monto válido para registrar.");
      return;
    }

    if (tipoPago === "A_CUENTA" && montoRealARegistrar > pendiente) {
      setError("El monto a cuenta no puede ser mayor al pendiente.");
      return;
    }

    if (montoRealARegistrar <= 0) {
      setError("No hay monto válido para registrar.");
      return;
    }

    if (conCuantoPagaNum <= 0) {
      setError("Ingresa el efectivo recibido.");
      return;
    }

    if (conCuantoPagaNum < montoRealARegistrar) {
      setError("El monto recibido es insuficiente.");
      return;
    }

    try {
      setGuardando(true);

      const { error } = await supabase.from("pagos").insert({
        pedido_id: pedidoId,
        fecha_pago: new Date().toISOString(),
        monto: montoRealARegistrar,
        tipo: tipoPago,
        nota:
          tipoPago === "A_CUENTA"
            ? `Pago A_CUENTA. Cliente entregó ${conCuantoPagaNum}`
            : `Pago LIQUIDACION. Cliente entregó ${conCuantoPagaNum}`,
        usuario_id: usuarioId || null,
      });

      if (error) throw error;

      onFinalizado();
    } catch (err: any) {
      setError(err?.message || "Error al procesar el pago.");
    } finally {
      setGuardando(false);
    }
  };

  const textoCambio = cambio >= 0 ? "CAMBIO A ENTREGAR" : "FALTA DINERO";
  const colorCambio = cambio >= 0 ? THEME.olive : THEME.danger;
  const bgCambio =
    cambio >= 0 ? "rgba(85,107,47,0.08)" : "rgba(190,18,60,0.06)";

  return (
    <div style={styles.wrapper}>
      <motion.div
        style={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div style={styles.headerRow}>
          <button type="button" onClick={onVolver} style={styles.backButton}>
            <ArrowLeft size={16} />
            <span>VOLVER</span>
          </button>
        </div>

        <div style={styles.titleWrap}>
          <div style={styles.badge}>
            <Sparkles size={12} />
            FOTO ESTUDIO RAMÍREZ
          </div>

          <h1 style={styles.title}>Confirmar Pago</h1>

          <p style={styles.subtitle}>
            Cliente:{" "}
            <strong style={{ color: THEME.gold }}>{clienteNombre}</strong>
          </p>
        </div>

        <motion.div style={styles.glassCard} whileHover={{ y: -4 }}>
          <div style={styles.cardHeader}>
            <div style={styles.iconCircle}>
              <Receipt size={24} color="#fff" />
            </div>

            <div>
              <p style={styles.smallLabelLight}>TOTAL FINAL DEL PEDIDO</p>
              <h2 style={styles.mainPrice}>{formatoMoneda(totalFinal)}</h2>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.summaryGrid}>
            <div style={styles.summaryMiniCard}>
              <span style={styles.smallLabelLight}>TOTAL BRUTO</span>
              <span style={styles.summaryMiniValue}>
                {formatoMoneda(totalBruto)}
              </span>
            </div>

            <div style={styles.summaryMiniCard}>
              <span style={styles.smallLabelLight}>DESCUENTO</span>
              <span style={{ ...styles.summaryMiniValue, color: THEME.gold }}>
                - {formatoMoneda(descuento)}
              </span>
            </div>

            <div style={styles.summaryMiniCard}>
              <span style={styles.smallLabelLight}>PENDIENTE</span>
              <span style={{ ...styles.summaryMiniValue, color: THEME.gold }}>
                {formatoMoneda(pendiente)}
              </span>
            </div>
          </div>
        </motion.div>

        <section style={styles.section}>
          <h3 style={styles.sectionLabel}>¿CÓMO PAGA EL CLIENTE?</h3>

          <div style={styles.flexGrid}>
            {[
              {
                id: "A_CUENTA",
                label: "A cuenta",
                icon: Wallet,
                color: THEME.black,
              },
              {
                id: "LIQUIDACION",
                label: "Liquidación",
                icon: BadgeDollarSign,
                color: THEME.gold,
              },
            ].map((opt) => {
              const active = tipoPago === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTipoPago(opt.id as TipoPago);
                    limpiarError();
                  }}
                  style={{
                    ...styles.optionBtn,
                    borderColor: active ? opt.color : "rgba(0,0,0,0.1)",
                    background: active ? "#fff" : "transparent",
                  }}
                >
                  <div
                    style={{
                      ...styles.optIcon,
                      background: active ? opt.color : "#999",
                    }}
                  >
                    <opt.icon size={18} color="#fff" />
                  </div>

                  <span
                    style={{
                      fontWeight: 800,
                      color: active ? opt.color : THEME.textSoft,
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.smallLabel}>MONTO A REGISTRAR</label>

            {tipoPago === "A_CUENTA" ? (
              <input
                type="number"
                inputMode="decimal"
                style={styles.input}
                value={montoRegistrar}
                onChange={(e) => {
                  setMontoRegistrar(e.target.value);
                  limpiarError();
                }}
                placeholder="$ 0.00"
              />
            ) : (
              <div style={styles.readOnlyInput}>{formatoMoneda(pendiente)}</div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.smallLabel}>EFECTIVO RECIBIDO</label>

            <div style={styles.inputWrapper}>
              <Banknote size={20} color={THEME.gold} />
              <input
                type="number"
                inputMode="decimal"
                style={styles.inputClean}
                value={conCuantoPaga}
                onChange={(e) => {
                  setConCuantoPaga(e.target.value);
                  limpiarError();
                }}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {conCuantoPaga !== "" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                boxShadow:
                  cambio >= 0
                    ? [
                        "0 0 0 rgba(85,107,47,0.10)",
                        "0 0 0 rgba(85,107,47,0.22)",
                        "0 0 0 rgba(85,107,47,0.10)",
                      ]
                    : "none",
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                boxShadow:
                  cambio >= 0 ? { repeat: Infinity, duration: 1.4 } : undefined,
              }}
              style={{
                ...styles.changeHero,
                borderColor: colorCambio,
                background: bgCambio,
              }}
            >
              <p style={{ ...styles.changeLabel, color: colorCambio }}>
                {textoCambio}
              </p>

              <motion.h2
                style={{ ...styles.changeText, color: colorCambio }}
                animate={cambio >= 0 ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={
                  cambio >= 0
                    ? { repeat: Infinity, duration: 1.2 }
                    : { duration: 0.2 }
                }
              >
                {formatoMoneda(Math.abs(cambio))}
              </motion.h2>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? <p style={styles.errorText}>{error}</p> : null}

        <div style={styles.footer}>
          <button type="button" onClick={onVolver} style={styles.btnCancel}>
            REGRESAR
          </button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={guardarPago}
            disabled={guardando}
            style={{
              ...styles.btnConfirm,
              opacity: guardando ? 0.85 : 1,
            }}
          >
            {guardando ? "PROCESANDO..." : "CONFIRMAR REGISTRO"}
            <CheckCircle2 size={20} />

            <motion.div
              style={styles.shimmer}
              animate={{ x: ["-100%", "220%"] }}
              transition={{ repeat: Infinity, duration: 2.1, ease: "linear" }}
            />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    width: "100%",
    minHeight: "100vh",
    background: THEME.bg,
    padding: "96px 16px 16px 16px",
    boxSizing: "border-box",
    position: "relative",
  },
  container: {
    width: "100%",
    maxWidth: "640px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },
  headerRow: {
    marginBottom: "18px",
    position: "relative",
    zIndex: 50,
  },
  backButton: {
    background: "transparent",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 900,
    color: THEME.textSoft,
    padding: "4px 0",
    position: "relative",
    zIndex: 60,
    pointerEvents: "auto",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: THEME.black,
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 900,
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  titleWrap: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "clamp(30px, 8vw, 42px)",
    margin: 0,
    fontWeight: 900,
    letterSpacing: "-1.2px",
    color: THEME.black,
    lineHeight: 1,
  },
  subtitle: {
    fontSize: "16px",
    color: THEME.textSoft,
    marginTop: "10px",
    lineHeight: 1.4,
  },

  glassCard: {
    background: THEME.black,
    padding: "22px",
    borderRadius: "24px",
    color: "#fff",
    boxShadow: "0 20px 40px rgba(0,0,0,0.16)",
    marginBottom: "24px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  iconCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "15px",
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mainPrice: {
    fontSize: "clamp(30px, 7vw, 42px)",
    margin: 0,
    fontWeight: 900,
    color: THEME.white,
    lineHeight: 1,
  },
  smallLabel: {
    fontSize: "10px",
    fontWeight: 900,
    color: THEME.textSoft,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  smallLabelLight: {
    fontSize: "10px",
    fontWeight: 900,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    margin: "18px 0",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
  },
  summaryMiniCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  summaryMiniValue: {
    fontSize: "18px",
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.2,
    wordBreak: "break-word",
  },

  section: {
    marginBottom: "22px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 900,
    color: THEME.gold,
    marginBottom: "14px",
    letterSpacing: "1px",
  },
  flexGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "10px",
    padding: "16px",
    borderRadius: "18px",
    border: "2px solid",
    cursor: "pointer",
    transition: "0.2s",
    minHeight: "64px",
  },
  optIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },
  input: {
    padding: "16px",
    borderRadius: "16px",
    border: "2px solid rgba(0,0,0,0.1)",
    fontSize: "18px",
    fontWeight: 700,
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  readOnlyInput: {
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.05)",
    fontSize: "18px",
    fontWeight: 800,
    color: THEME.textSoft,
    width: "100%",
    boxSizing: "border-box",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: `2px solid ${THEME.gold}40`,
    borderRadius: "16px",
    padding: "0 14px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  inputClean: {
    border: "none",
    padding: "16px 0",
    fontSize: "18px",
    fontWeight: 700,
    outline: "none",
    width: "100%",
    background: "transparent",
  },

  changeHero: {
    padding: "22px 18px",
    borderRadius: "24px",
    border: "2px dashed",
    textAlign: "center",
    marginBottom: "22px",
  },
  changeLabel: {
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  changeText: {
    fontSize: "clamp(36px, 10vw, 52px)",
    fontWeight: 900,
    margin: 0,
    lineHeight: 1,
    wordBreak: "break-word",
  },
  errorText: {
    color: THEME.danger,
    textAlign: "center",
    fontWeight: 800,
    fontSize: "14px",
    marginBottom: "15px",
  },

  footer: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: "12px",
    marginTop: "10px",
    alignItems: "stretch",
  },
  btnCancel: {
    width: "100%",
    padding: "18px 16px",
    background: "transparent",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "18px",
    fontWeight: 800,
    color: THEME.textSoft,
    cursor: "pointer",
    minHeight: "58px",
  },
  btnConfirm: {
    width: "100%",
    minWidth: 0,
    padding: "18px 16px",
    background: THEME.olive,
    color: "#fff",
    borderRadius: "20px",
    border: "none",
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    position: "relative",
    overflow: "hidden",
    minHeight: "58px",
    boxShadow: "0 12px 30px rgba(85,107,47,0.28)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "30%",
    height: "100%",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
    transform: "skewX(-25deg)",
    pointerEvents: "none",
  },
};

export default Vista4Pago;
