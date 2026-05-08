import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Printer,
  CalendarDays,
  Building2,
  TrendingUp,
  Sparkles,
  FileText,
} from "lucide-react";
import { imprimirTicketCorte } from "./ticketCortePdf";

const logoCuadro = "/LOGO.png";

const money = (n: any) => {
  const x = Number(n || 0);
  if (!isFinite(x)) return "$0.00";
  return x.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

const fmtDia = (v: any) => {
  if (!v) return "";
  try {
    const d = new Date(`${v}T00:00:00`);
    return d.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  } catch {
    return String(v);
  }
};

const fmtDT = (v: any) => {
  if (!v) return "";
  try {
    return new Date(v).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(v);
  }
};

type MovimientoRow = {
  fecha: string | null;
  dia_mx?: string | null;
  direccion: string | null;
  monto: number | null;
  tipo_mov: string | null;
  nota: string | null;
  cliente_nombre: string | null;
  n_toma: string | number | null;
  usuario_nombre: string | null;
};

type Props = {
  dia: string;
  onBack: () => void;
};

export default function CuentasDetalle({ dia, onBack }: Props) {
  const [rows, setRows] = useState<MovimientoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [err, setErr] = useState("");
  const [caja, setCaja] = useState("0");

  const fetchDetalle = async () => {
    if (!dia) return;
    setLoading(true);
    setErr("");

    try {
      const { data, error } = await supabase
        .from("cuentas_movs")
        .select(
          "fecha,dia_mx,direccion,monto,tipo_mov,nota,cliente_nombre,n_toma,usuario_nombre"
        )
        .eq("dia_mx", dia)
        .order("fecha", { ascending: true });

      if (error) throw error;
      setRows((Array.isArray(data) ? data : []) as MovimientoRow[]);
    } catch (e: any) {
      setErr(e?.message || "Error cargando detalle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
  }, [dia]);

  const resumen = useMemo(() => {
    const entradas = rows
      .filter((r) => r.direccion === "ENTRADA")
      .reduce((a, r) => a + Number(r.monto || 0), 0);

    const salidas = rows
      .filter((r) => r.direccion === "SALIDA")
      .reduce((a, r) => a + Math.abs(Number(r.monto || 0)), 0);

    const neto = entradas - salidas;
    return { entradas, salidas, neto };
  }, [rows]);

  const cajaNum = useMemo(() => {
    const x = Number(caja || 0);
    return isFinite(x) ? x : 0;
  }, [caja]);

  const aRetirar = useMemo(() => {
    const x = Number(resumen.neto || 0) - cajaNum;
    return isFinite(x) ? x : 0;
  }, [resumen.neto, cajaNum]);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      await imprimirTicketCorte({
        dia,
        entradas: resumen.entradas,
        salidas: resumen.salidas,
        neto: resumen.neto,
        caja: cajaNum,
        aRetirar,
        logoSrc: "/LOGO.png",
      });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={S.header}
        >
          <div className="cd-header-top" style={S.headerTop}>
            <div className="cd-brand-wrap" style={S.brandWrap}>
              <div style={S.logoContainer}>
                <img src={logoCuadro} alt="Logo" style={S.logo} />
              </div>

              <div style={S.brandTextWrap}>
                <h1 style={S.hTitle}>Corte de Caja</h1>
                <div style={S.hSub}>
                  <CalendarDays size={16} color="#b49d71" />
                  <span style={S.dateHighlight}>{fmtDia(dia)}</span>
                </div>
              </div>
            </div>

            <div className="cd-header-tools" style={S.headerTools}>
              <motion.button
                whileHover={{ x: -4 }}
                onClick={onBack}
                style={S.btnGhost}
                type="button"
              >
                <ArrowLeft size={18} /> Regresar
              </motion.button>

              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                onClick={fetchDetalle}
                style={S.btnGhostIcon}
                disabled={loading}
                type="button"
              >
                <RefreshCw size={18} className={loading ? "spin" : ""} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                style={S.btnCream}
                disabled={printing}
                type="button"
              >
                <Printer size={18} />
                {printing ? "Imprimiendo..." : "Imprimir Ticket"}
              </motion.button>
            </div>
          </div>

          {err ? <div style={S.err}>{err}</div> : null}
        </motion.div>

        <div className="cd-kpi-grid" style={S.kpiGrid}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={S.kpi}
          >
            <div style={S.kpiLabel}>Entradas de Hoy</div>
            <div style={{ ...S.kpiVal, color: "#2f7a46" }}>
              {money(resumen.entradas)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={S.kpi}
          >
            <div style={S.kpiLabel}>Salidas / Gastos</div>
            <div style={{ ...S.kpiVal, color: "#b64040" }}>
              {money(resumen.salidas)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={S.kpi}
          >
            <div style={S.kpiLabel}>Fondo en Caja (Cambio)</div>
            <input
              style={S.kpiInput}
              value={caja}
              onChange={(e) => setCaja(e.target.value)}
              inputMode="numeric"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring" }}
            style={S.kpiMain}
          >
            <div className="cd-kpi-main-content" style={S.kpiMainContent}>
              <div style={S.kpiMainTextWrap}>
                <div style={S.kpiMainLabel}>
                  <Sparkles size={14} /> Total Neto a Retirar
                </div>
                <div style={S.kpiMainVal}>{money(aRetirar)}</div>
              </div>

              <div style={S.kpiIconBox}>
                <TrendingUp size={40} />
              </div>
            </div>
          </motion.div>
        </div>

        <div style={S.list}>
          <h3 style={S.sectionLabel}>Movimientos del Día</h3>

          {rows.map((r, idx) => (
            <motion.div
              key={`${r.fecha || "mov"}-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 10, backgroundColor: "#fff" }}
              style={{
                ...S.item,
                borderLeft:
                  r.direccion === "ENTRADA"
                    ? "6px solid #556b2f"
                    : "6px solid #b64040",
              }}
            >
              <div className="cd-item-header" style={S.itemHeader}>
                <div style={S.itemMainInfo}>
                  <div style={S.itemPrice}>{money(r.monto)}</div>

                  <div style={S.itemMeta}>
                    <span style={S.itemType}>{r.tipo_mov || "SIN TIPO"}</span>
                    <span style={S.itemTime}>{fmtDT(r.fecha)}</span>
                  </div>
                </div>

                <div className="cd-item-badges" style={S.itemBadges}>
                  <div style={S.pill}>
                    <Building2 size={12} />
                    <span>{r.cliente_nombre || "Mostrador"}</span>
                  </div>

                  <div style={S.pillGold}>TOMA: {r.n_toma || "—"}</div>
                </div>
              </div>

              {r.nota ? (
                <div style={S.itemNote}>
                  <FileText size={14} color="#b49d71" />
                  <span style={S.itemNoteText}>{r.nota}</span>
                </div>
              ) : null}

              <div style={S.itemUser}>
                Realizado por: <strong>{r.usuario_nombre || "—"}</strong>
              </div>
            </motion.div>
          ))}

          {!loading && rows.length === 0 ? (
            <div style={S.emptyBox}>
              <div style={S.emptyTitle}>Sin movimientos para este día</div>
              <div style={S.emptySub}>
                No hay registros en <b>cuentas_movs</b> para {dia}.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800&family=Vidaloka&display=swap');

        .spin {
          animation: rotation 1.2s infinite linear;
        }

        @keyframes rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(359deg); }
        }

        @media (max-width: 920px) {
          .cd-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 720px) {
          .cd-header-top {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }

          .cd-header-tools {
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            gap: 10px !important;
            width: 100% !important;
          }

          .cd-header-tools > button:last-child {
            grid-column: 1 / -1 !important;
          }

          .cd-kpi-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .cd-kpi-main-content {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .cd-item-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
          }

          .cd-item-badges {
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }

        @media (max-width: 560px) {
          .cd-brand-wrap {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
          }

          .cd-header-tools {
            grid-template-columns: 1fr 1fr !important;
          }

          .cd-header-tools > button:first-child {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
}

const S: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#fdfbf7",
    padding: "30px 20px",
    fontFamily: "'Montserrat', sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    borderRadius: "30px",
    padding: "25px 35px",
    border: "1px solid rgba(236, 228, 216, 0.5)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.04)",
    marginBottom: "30px",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    minWidth: 0,
  },
  brandTextWrap: {
    minWidth: 0,
  },
  logoContainer: {
    width: "70px",
    height: "70px",
    minWidth: "70px",
    backgroundColor: "#fff",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  },
  logo: {
    width: "55px",
    height: "auto",
  },
  hTitle: {
    fontFamily: "'Vidaloka', serif",
    fontSize: "42px",
    fontStyle: "italic",
    margin: 0,
    color: "#1a1a1a",
    lineHeight: 1,
  },
  hSub: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "5px",
    flexWrap: "wrap",
  },
  dateHighlight: {
    fontWeight: 700,
    color: "#8b867d",
    fontSize: "15px",
    lineHeight: 1.4,
  },
  headerTools: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  btnCream: {
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    padding: "14px 28px",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 10px 25px rgba(63,82,34,0.3)",
    minHeight: "52px",
  },
  btnGhost: {
    background: "#fff",
    color: "#1a1a1a",
    border: "1px solid #ece4d8",
    borderRadius: "20px",
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "52px",
  },
  btnGhostIcon: {
    background: "#fff",
    color: "#1a1a1a",
    border: "1px solid #ece4d8",
    borderRadius: "20px",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "52px",
    minWidth: "56px",
  },
  err: {
    marginTop: "15px",
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: "rgba(182,64,64,0.08)",
    border: "1px solid rgba(182,64,64,0.12)",
    color: "#b64040",
    fontWeight: 600,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  kpi: {
    backgroundColor: "#fff",
    padding: "25px",
    borderRadius: "25px",
    border: "1px solid #ece4d8",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  kpiLabel: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#b49d71",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    marginBottom: "10px",
    lineHeight: 1.4,
  },
  kpiVal: {
    fontFamily: "'Vidaloka', serif",
    fontSize: "28px",
    fontStyle: "italic",
    fontWeight: 400,
    lineHeight: 1.1,
    wordBreak: "break-word",
  },
  kpiInput: {
    width: "100%",
    border: "none",
    borderBottom: "2px solid #ece4d8",
    fontSize: "24px",
    fontWeight: 800,
    color: "#556b2f",
    outline: "none",
    backgroundColor: "transparent",
    paddingBottom: "6px",
  },
  kpiMain: {
    gridColumn: "1 / -1",
    background: "linear-gradient(135deg, #556b2f 0%, #2f3d1a 100%)",
    padding: "35px",
    borderRadius: "30px",
    color: "#fff",
    boxShadow: "0 25px 50px rgba(85,107,47,0.2)",
  },
  kpiMainContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  kpiMainTextWrap: {
    minWidth: 0,
  },
  kpiMainLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    opacity: 0.8,
    textTransform: "uppercase",
    letterSpacing: "2px",
    flexWrap: "wrap",
  },
  kpiMainVal: {
    fontFamily: "'Vidaloka', serif",
    fontSize: "56px",
    fontStyle: "italic",
    marginTop: "10px",
    lineHeight: 1,
    wordBreak: "break-word",
  },
  kpiIconBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: "20px",
    borderRadius: "25px",
    flexShrink: 0,
  },
  sectionLabel: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#b49d71",
    textTransform: "uppercase",
    letterSpacing: "3px",
    marginBottom: "20px",
    textAlign: "center",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  item: {
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: "25px",
    borderRadius: "25px",
    border: "1px solid #ece4d8",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "15px",
    gap: "20px",
    flexWrap: "wrap",
  },
  itemMainInfo: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  itemPrice: {
    fontFamily: "'Vidaloka', serif",
    fontSize: "26px",
    fontStyle: "italic",
    color: "#1a1a1a",
    lineHeight: 1.05,
    wordBreak: "break-word",
  },
  itemMeta: {
    display: "flex",
    gap: "10px",
    marginTop: "5px",
    flexWrap: "wrap",
  },
  itemType: {
    backgroundColor: "#f0f0f0",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: 800,
    color: "#666",
    lineHeight: 1.3,
  },
  itemTime: {
    fontSize: "11px",
    color: "#999",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  itemBadges: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  pill: {
    border: "1px solid #eee",
    padding: "6px 12px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "5px",
    lineHeight: 1.4,
    minHeight: "34px",
  },
  pillGold: {
    backgroundColor: "#fcfaf5",
    border: "1px solid #d4c5a9",
    color: "#8b6f47",
    padding: "6px 12px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 800,
    lineHeight: 1.4,
    minHeight: "34px",
    display: "flex",
    alignItems: "center",
  },
  itemNote: {
    backgroundColor: "#fff",
    padding: "12px 18px",
    borderRadius: "15px",
    fontSize: "13px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    border: "1px solid #f0f0f0",
    color: "#555",
    lineHeight: 1.55,
  },
  itemNoteText: {
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  itemUser: {
    marginTop: "15px",
    fontSize: "11px",
    color: "#aaa",
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: "1px",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  emptyBox: {
    backgroundColor: "#fff",
    border: "1px solid #ece4d8",
    borderRadius: "25px",
    padding: "30px",
    textAlign: "center",
  },
  emptyTitle: {
    fontWeight: 800,
    fontSize: "18px",
    color: "#1a1a1a",
  },
  emptySub: {
    marginTop: "8px",
    color: "#8b867d",
    fontSize: "14px",
    lineHeight: 1.6,
  },
};
