import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  RefreshCw,
  Search,
  CheckCircle2,
  CircleDashed,
  ArrowRight,
  Wallet,
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

type CorteRow = {
  dia: string;
  ingresos: number | null;
  retiros: number | null;
  neto: number | null;
};

type ContempladoRow = {
  dia: string;
  contemplado_at: string | null;
};

type Props = {
  onOpenDetalle: (dia: string) => void;
};

const THEME = {
  bg: "#fdfbf7",
  card: "#ffffff",
  soft: "#f7f3eb",
  olive: "#556b2f",
  oliveDark: "#3f5222",
  gold: "#b49d71",
  text: "#1a1a1a",
  textSoft: "#8b867d",
  border: "#ece4d8",
  success: "#2f7a46",
  warning: "#d07c12",
  danger: "#b64040",
};

const money = (n: number | null | undefined) => {
  const x = Number(n || 0);
  if (!isFinite(x)) return "$0.00";
  return x.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const monthKeyFromDate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

const fmtMonthLabel = (monthKey: string) => {
  try {
    const [y, m] = monthKey.split("-").map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return d.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return monthKey;
  }
};

const fmtDiaCorto = (v: string) => {
  if (!v) return "";
  try {
    const d = new Date(`${v}T00:00:00`);
    return d.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return String(v);
  }
};

const fmtDiaNumero = (v: string) => {
  if (!v) return "";
  try {
    const d = new Date(`${v}T00:00:00`);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
    });
  } catch {
    return "";
  }
};

const fmtMesCorto = (v: string) => {
  if (!v) return "";
  try {
    const d = new Date(`${v}T00:00:00`);
    return d
      .toLocaleDateString("es-MX", {
        month: "short",
      })
      .replace(".", "")
      .toUpperCase();
  } catch {
    return "";
  }
};

const fmtSemana = (v: string) => {
  if (!v) return "";
  try {
    const d = new Date(`${v}T00:00:00`);
    return d
      .toLocaleDateString("es-MX", {
        weekday: "short",
      })
      .replace(".", "");
  } catch {
    return "";
  }
};

const fmtDT = (v?: string | null) => {
  if (!v) return "";
  try {
    const d = new Date(v);
    return d.toLocaleString("es-MX", {
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

const CuentasLista = ({ onOpenDetalle }: Props) => {
  const [rows, setRows] = useState<CorteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [contemplados, setContemplados] = useState<
    Record<string, { contemplado: true; contemplado_at: string | null }>
  >({});
  const [savingDia, setSavingDia] = useState<Record<string, boolean>>({});

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [showContemplados, setShowContemplados] = useState(false);
  const [monthKey, setMonthKey] = useState(monthKeyFromDate(new Date()));

  const [confirmDia, setConfirmDia] = useState<string | null>(null);

  const fetchContemplados = useCallback(async (dias: string[]) => {
    try {
      if (!dias?.length) {
        setContemplados({});
        return;
      }

      const { data, error } = await supabase
        .from("corte_contemplado")
        .select("dia, contemplado_at")
        .in("dia", dias);

      if (error) throw error;

      const map: Record<
        string,
        { contemplado: true; contemplado_at: string | null }
      > = {};

      (data as ContempladoRow[] | null)?.forEach((x) => {
        if (x?.dia) {
          map[x.dia] = {
            contemplado: true,
            contemplado_at: x.contemplado_at || null,
          };
        }
      });

      setContemplados(map);
    } catch (e) {
      console.warn("No se pudieron cargar contemplados", e);
    }
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const { data, error } = await supabase
        .from("corte_diario")
        .select("dia, ingresos, retiros, neto")
        .order("dia", { ascending: false })
        .limit(400);

      if (error) throw error;

      const list = (Array.isArray(data) ? data : []) as CorteRow[];
      setRows(list);

      const dias = list.map((r) => r.dia).filter(Boolean);
      await fetchContemplados(dias);
    } catch (e: any) {
      setErr(e?.message || "Error cargando corte diario");
    } finally {
      setLoading(false);
    }
  }, [fetchContemplados]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const selectedDias = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const resumen = useMemo(() => {
    if (!selectedDias.length) {
      return { count: 0, neto: 0 };
    }

    const setSel = new Set(selectedDias);
    const pick = rows.filter((r) => setSel.has(r.dia));

    return {
      count: pick.length,
      neto: pick.reduce((a, r) => a + Number(r.neto || 0), 0),
    };
  }, [rows, selectedDias]);

  const filteredRows = useMemo(() => {
    const q = search.trim();

    return rows.filter((r) => {
      const dia = r.dia || "";
      const isCont = !!contemplados[dia]?.contemplado;

      if (q) {
        if (!dia.includes(q)) return false;
      } else {
        if (!dia.startsWith(monthKey)) return false;
      }

      if (showContemplados) {
        if (!isCont) return false;
      } else {
        if (isCont) return false;
      }

      return true;
    });
  }, [rows, contemplados, search, monthKey, showContemplados]);

  const toggleDia = (dia: string) => {
    setSelected((s) => ({ ...s, [dia]: !s[dia] }));
  };

  const clearSelection = () => setSelected({});

  const moveMonth = (dir: -1 | 1) => {
    const [y, m] = monthKey.split("-").map(Number);
    const d = new Date(y, (m || 1) - 1 + dir, 1);
    setMonthKey(monthKeyFromDate(d));
  };

  const toggleContemplado = async (dia: string) => {
    if (!dia) return;

    setSavingDia((m) => ({ ...m, [dia]: true }));
    const ya = !!contemplados[dia]?.contemplado;

    try {
      if (ya) {
        const { error } = await supabase
          .from("corte_contemplado")
          .delete()
          .eq("dia", dia);

        if (error) throw error;

        setContemplados((m) => {
          const copy = { ...m };
          delete copy[dia];
          return copy;
        });
      } else {
        const { data, error } = await supabase
          .from("corte_contemplado")
          .insert([{ dia, contemplado: true }])
          .select("dia, contemplado_at")
          .single();

        if (error) throw error;

        setContemplados((m) => ({
          ...m,
          [dia]: {
            contemplado: true,
            contemplado_at: data?.contemplado_at || null,
          },
        }));

        setSelected((prev) => {
          const copy = { ...prev };
          delete copy[dia];
          return copy;
        });
      }
    } catch (e: any) {
      window.alert(e?.message || "No se pudo actualizar contemplado");
    } finally {
      setSavingDia((m) => ({ ...m, [dia]: false }));
      setConfirmDia(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.header}
        >
          <div style={styles.headerTop}>
            <div>
              <div style={styles.title}>Cuentas</div>
              <div style={styles.subtitle}>
                {search
                  ? "Modo búsqueda histórica"
                  : `Mostrando ${fmtMonthLabel(monthKey)}`}
              </div>
            </div>

            <button style={styles.reloadBtn} onClick={fetchRows}>
              {loading ? (
                <>
                  <RefreshCw size={16} style={styles.spinInline} />
                  Cargando
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Recargar
                </>
              )}
            </button>
          </div>

          <div style={styles.monthBar}>
            <button
              type="button"
              style={styles.monthArrow}
              onClick={() => moveMonth(-1)}
            >
              <ArrowLeft size={16} />
            </button>

            <div style={styles.monthCenter}>
              <CalendarDays size={16} color={THEME.gold} />
              <span style={styles.monthLabel}>{fmtMonthLabel(monthKey)}</span>
              <ChevronDown size={15} color={THEME.textSoft} />
            </div>

            <button
              type="button"
              style={styles.monthArrow}
              onClick={() => moveMonth(1)}
            >
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="cuentas-tools" style={styles.toolsRow}>
            <div style={styles.searchWrap}>
              <Search size={16} style={styles.searchIcon} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por fecha: 2026-01 o 2026-01-15"
                style={styles.search}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowContemplados((v) => !v)}
              style={{
                ...styles.filterBtn,
                ...(showContemplados ? styles.filterBtnActive : {}),
              }}
            >
              {showContemplados ? (
                <>
                  <Eye size={16} />
                  Contemplados
                </>
              ) : (
                <>
                  <EyeOff size={16} />
                  Pendientes
                </>
              )}
            </button>
          </div>
        </motion.div>

        {err ? <div style={styles.err}>{err}</div> : null}

        <div style={styles.helperCard}>
          <div style={styles.helperTitle}>Vista simplificada</div>
          <div style={styles.helperText}>
            {showContemplados
              ? "Aquí ves los días ya contemplados del mes o de la búsqueda que hagas."
              : "Aquí ves solo los días pendientes. Cuando contemplas uno, desaparece de la lista principal."}
          </div>
        </div>

        <div style={styles.listWrap}>
          {filteredRows.map((r, index) => {
            const dia = r.dia;
            const isCont = !!contemplados[dia]?.contemplado;
            const isSaving = !!savingDia[dia];
            const isSel = !!selected[dia];
            const neto = Number(r.neto || 0);

            return (
              <motion.div
                key={dia}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                style={{
                  ...styles.dayCard,
                  ...(isSel ? styles.dayCardSelected : {}),
                  ...(isCont ? styles.dayCardCont : {}),
                }}
              >
                <div style={styles.dayCardMain}>
                  <div style={styles.dayCardTop}>
                    <div style={styles.dayDateBox}>
                      <div style={styles.dayWeek}>{fmtSemana(dia)}</div>
                      <div style={styles.dayNumber}>{fmtDiaNumero(dia)}</div>
                      <div style={styles.dayMonth}>{fmtMesCorto(dia)}</div>
                    </div>

                    <div style={styles.dayMain}>
                      <div style={styles.dayMainTop}>
                        <div style={styles.dayDateText}>{fmtDiaCorto(dia)}</div>

                        {isCont ? (
                          <div style={styles.stateDone}>
                            <CheckCircle2 size={14} />
                            <span>Contemplado</span>
                          </div>
                        ) : (
                          <div style={styles.statePending}>
                            <CircleDashed size={14} />
                            <span>No contemplado</span>
                          </div>
                        )}
                      </div>

                      <div style={styles.netoLabel}>Neto del día</div>
                      <div style={styles.netoValue}>{money(neto)}</div>

                      {isCont && contemplados[dia]?.contemplado_at ? (
                        <div style={styles.contAt}>
                          {fmtDT(contemplados[dia]?.contemplado_at || "")}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className="cuentas-day-actions"
                    style={styles.dayActions}
                  >
                    <label style={styles.checkboxWrap}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleDia(dia)}
                        style={styles.checkbox}
                      />
                    </label>

                    <button
                      type="button"
                      style={
                        isCont
                          ? styles.contemplateOffBtn
                          : styles.contemplateBtn
                      }
                      onClick={() => {
                        if (!isSaving) {
                          if (isCont) {
                            toggleContemplado(dia);
                          } else {
                            setConfirmDia(dia);
                          }
                        }
                      }}
                    >
                      {isSaving
                        ? "Guardando..."
                        : isCont
                        ? "Quitar"
                        : "Contemplar"}
                    </button>

                    <button
                      type="button"
                      style={styles.detailBtn}
                      onClick={() => onOpenDetalle(dia)}
                    >
                      Detalle
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {!loading && filteredRows.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={styles.emptyTitle}>No hay días para mostrar</div>
              <div style={styles.emptyText}>
                {showContemplados
                  ? "No hay días contemplados en este filtro."
                  : "Todo lo visible ya está contemplado o no hay registros del mes actual."}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {confirmDia ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setConfirmDia(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              style={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalTitle}>Confirmar contemplado</div>
              <div style={styles.modalText}>
                ¿Seguro que quieres marcar como contemplado el día{" "}
                <b>{confirmDia}</b>?
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.modalBtnGhost}
                  onClick={() => setConfirmDia(null)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={styles.modalBtnPrimary}
                  onClick={() => toggleContemplado(confirmDia)}
                >
                  Sí, contemplar
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          style={styles.bottomBar}
        >
          <div style={styles.bottomInfo}>
            <div style={styles.bottomCount}>
              {resumen.count} día{resumen.count === 1 ? "" : "s"}
            </div>
            <div style={styles.bottomTotal}>
              <Wallet size={15} />
              <span>{money(resumen.neto)}</span>
            </div>
          </div>

          <div style={styles.bottomActions}>
            <button
              type="button"
              onClick={clearSelection}
              style={{
                ...styles.bottomGhost,
                opacity: resumen.count ? 1 : 0.45,
                cursor: resumen.count ? "pointer" : "not-allowed",
              }}
            >
              Limpiar
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        @media (max-width: 760px) {
          .cuentas-tools {
            grid-template-columns: 1fr !important;
          }

          .cuentas-day-actions {
            display: grid !important;
            grid-template-columns: 44px 1fr !important;
            gap: 8px !important;
            margin-top: 12px !important;
          }

          .cuentas-day-actions > button:last-child {
            grid-column: 1 / -1 !important;
          }
        }

        @media (max-width: 520px) {
          .cuentas-day-actions {
            grid-template-columns: 44px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(85,107,47,0.05), transparent 28%), #fdfbf7",
    padding: "16px 14px 110px",
    fontFamily: "'Montserrat', sans-serif",
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
  },
  header: {
    background: "#fff",
    border: `1px solid ${THEME.border}`,
    borderRadius: 28,
    padding: 18,
    boxShadow: "0 14px 32px rgba(0,0,0,0.03)",
    marginBottom: 14,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  title: {
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: 34,
    color: THEME.text,
    lineHeight: 1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: THEME.textSoft,
    lineHeight: 1.5,
  },
  reloadBtn: {
    height: 44,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.soft,
    color: THEME.text,
    fontSize: 13,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  monthBar: {
    display: "grid",
    gridTemplateColumns: "44px 1fr 44px",
    gap: 10,
    marginBottom: 12,
  },
  monthArrow: {
    height: 44,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.soft,
    color: THEME.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  monthCenter: {
    height: 44,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 800,
  },
  monthLabel: {
    textTransform: "capitalize",
    fontSize: 14,
  },
  toolsRow: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.9fr",
    gap: 10,
  },
  searchWrap: {
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: THEME.gold,
  },
  search: {
    width: "100%",
    height: 48,
    padding: "0 14px 0 42px",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.soft,
    outline: "none",
    fontSize: 14,
    fontWeight: 600,
    boxSizing: "border-box",
  },
  filterBtn: {
    height: 48,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.soft,
    color: THEME.text,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  filterBtnActive: {
    background: "rgba(85,107,47,0.08)",
    color: THEME.olive,
    border: "1px solid rgba(85,107,47,0.18)",
  },
  helperCard: {
    background: "rgba(85,107,47,0.05)",
    border: "1px solid rgba(85,107,47,0.10)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },
  helperTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: THEME.olive,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: THEME.textSoft,
    lineHeight: 1.55,
  },
  err: {
    marginBottom: 12,
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(182,64,64,0.08)",
    border: "1px solid rgba(182,64,64,0.16)",
    color: THEME.danger,
    fontSize: 13,
    fontWeight: 700,
  },
  listWrap: {
    display: "grid",
    gap: 12,
  },
  dayCard: {
    background: "#fff",
    border: `1px solid ${THEME.border}`,
    borderRadius: 24,
    padding: 14,
    boxShadow: "0 12px 24px rgba(0,0,0,0.03)",
  },
  dayCardSelected: {
    border: "1px solid rgba(180,157,113,0.45)",
    boxShadow: "0 12px 24px rgba(180,157,113,0.08)",
  },
  dayCardCont: {
    background: "rgba(47,122,70,0.05)",
    border: "1px dashed rgba(47,122,70,0.30)",
  },
  dayCardMain: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  dayCardTop: {
    display: "grid",
    gridTemplateColumns: "78px 1fr",
    gap: 14,
    alignItems: "center",
  },
  dayDateBox: {
    height: 94,
    borderRadius: 20,
    background: THEME.soft,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  dayWeek: {
    fontSize: 13,
    color: THEME.textSoft,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  dayNumber: {
    fontSize: 36,
    lineHeight: 1,
    fontWeight: 900,
    color: THEME.text,
    margin: "4px 0",
  },
  dayMonth: {
    fontSize: 12,
    color: THEME.textSoft,
    fontWeight: 800,
    letterSpacing: 1,
  },
  dayMain: {
    minWidth: 0,
  },
  dayMainTop: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8,
  },
  dayDateText: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: 800,
    textTransform: "capitalize",
  },
  statePending: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(208,124,18,0.08)",
    color: THEME.warning,
    border: "1px solid rgba(208,124,18,0.16)",
    fontSize: 12,
    fontWeight: 800,
    maxWidth: "100%",
  },
  stateDone: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(47,122,70,0.08)",
    color: THEME.success,
    border: "1px solid rgba(47,122,70,0.16)",
    fontSize: 12,
    fontWeight: 800,
    maxWidth: "100%",
  },
  netoLabel: {
    fontSize: 12,
    color: THEME.textSoft,
    marginBottom: 4,
  },
  netoValue: {
    fontSize: 18,
    fontWeight: 900,
    color: THEME.olive,
    lineHeight: 1.1,
  },
  contAt: {
    marginTop: 7,
    fontSize: 11,
    color: THEME.textSoft,
    lineHeight: 1.4,
  },
  dayActions: {
    display: "grid",
    gridTemplateColumns: "44px 1fr 1fr",
    gap: 8,
    alignItems: "center",
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: THEME.soft,
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer",
    margin: 0,
  },
  contemplateBtn: {
    height: 36,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    padding: "0 12px",
    whiteSpace: "nowrap",
  },
  contemplateOffBtn: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(47,122,70,0.20)",
    background: "rgba(47,122,70,0.08)",
    color: THEME.success,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    padding: "0 12px",
    whiteSpace: "nowrap",
  },
  detailBtn: {
    height: 36,
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.text,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    padding: "0 12px",
    whiteSpace: "nowrap",
  },
  emptyBox: {
    background: "#fff",
    border: `1px solid ${THEME.border}`,
    borderRadius: 24,
    padding: 24,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: THEME.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.textSoft,
    lineHeight: 1.6,
  },
  bottomBar: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: 12,
    background: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(14px)",
    border: `1px solid ${THEME.border}`,
    borderRadius: 22,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
    zIndex: 40,
    maxWidth: 960,
    margin: "0 auto",
  },
  bottomInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },
  bottomCount: {
    fontSize: 13,
    fontWeight: 800,
    color: THEME.textSoft,
  },
  bottomTotal: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 19,
    fontWeight: 900,
    color: THEME.olive,
    lineHeight: 1.1,
  },
  bottomActions: {
    display: "flex",
    gap: 8,
  },
  bottomGhost: {
    height: 42,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.soft,
    color: THEME.text,
    fontSize: 13,
    fontWeight: 800,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,15,15,0.32)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 80,
  },
  modalCard: {
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    borderRadius: 26,
    padding: 22,
    border: `1px solid ${THEME.border}`,
    boxShadow: "0 24px 55px rgba(0,0,0,0.14)",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: THEME.text,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: THEME.textSoft,
    lineHeight: 1.7,
  },
  modalActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 18,
  },
  modalBtnGhost: {
    height: 46,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.soft,
    color: THEME.text,
    fontWeight: 800,
    cursor: "pointer",
  },
  modalBtnPrimary: {
    height: 46,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(63,82,34,0.18)",
  },
  spinInline: {
    animation: "spinCuentas 1s linear infinite",
  },
};

export default CuentasLista;
