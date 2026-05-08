import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wallet,
  UserCircle2,
  FileText,
  StickyNote,
  CalendarDays,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock3,
  ChevronDown,
} from "lucide-react";

type RetiroRow = {
  id: string;
  fecha: string | null;
  monto: number | null;
  concepto: string | null;
  notas: string | null;
  usuario_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  estatus: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  dia_mx: string | null;
};

type UsuarioItem = {
  id: string;
  nombre: string | null;
  admin?: boolean | null;
  activo?: boolean | null;
};

const THEME = {
  bg: "#fdfbf7",
  card: "#ffffff",
  cardSoft: "#fcfaf5",
  olive: "#556b2f",
  oliveDark: "#3f5222",
  gold: "#b49d71",
  text: "#1a1a1a",
  textSoft: "#8b867d",
  border: "#ece4d8",
  borderSoft: "#f1ece2",
  success: "#2f7a46",
  danger: "#b64040",
};

const formatoDinero = (valor: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(valor || 0);

const hoyMx = () => {
  const ahora = new Date();
  const mx = new Date(
    ahora.toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
  const y = mx.getFullYear();
  const m = `${mx.getMonth() + 1}`.padStart(2, "0");
  const d = `${mx.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatearFechaBonita = (fecha: string) => {
  if (!fecha) return "—";
  const d = new Date(`${fecha}T12:00:00`);
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatearHora = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const RetirosCajaAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [perfilActual, setPerfilActual] = useState<UsuarioItem | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({});

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyMx());
  const [busqueda, setBusqueda] = useState("");

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [notas, setNotas] = useState("");

  const [retiros, setRetiros] = useState<RetiroRow[]>([]);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const cargarUsuarioActual = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.user?.id) throw new Error("No se encontró la sesión.");

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, admin, activo")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("No se encontró el usuario vinculado.");

    setPerfilActual(data);
    setEsAdmin(!!data.admin);

    if (!data.admin) {
      throw new Error("Esta vista es solo para administradores.");
    }

    return data;
  }, []);

  const cargarUsuarios = useCallback(async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, admin, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) throw error;

    const lista = (data || []) as UsuarioItem[];
    setUsuarios(lista);

    const mapa: Record<string, string> = {};
    lista.forEach((u) => {
      mapa[u.id] = u.nombre || "Sin nombre";
    });
    setUsuariosMap(mapa);

    return lista;
  }, []);

  const cargarRetiros = useCallback(async (fechaObjetivo: string) => {
    setRecargando(true);
    try {
      const { data, error } = await supabase
        .from("retiros_caja")
        .select(
          "id, fecha, monto, concepto, notas, usuario_id, created_at, updated_at, estatus, aprobado_por, fecha_aprobacion, dia_mx"
        )
        .eq("dia_mx", fechaObjetivo)
        .order("fecha", { ascending: false });

      if (error) throw error;
      setRetiros((data || []) as RetiroRow[]);
    } finally {
      setRecargando(false);
    }
  }, []);

  const inicializar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const usuarioActual = await cargarUsuarioActual();
      const listaUsuarios = await cargarUsuarios();
      await cargarRetiros(fechaSeleccionada);

      if (listaUsuarios.length > 0) {
        setUsuarioSeleccionado(usuarioActual.id);
      }
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la vista.");
    } finally {
      setLoading(false);
    }
  }, [cargarUsuarioActual, cargarUsuarios, cargarRetiros, fechaSeleccionada]);

  useEffect(() => {
    inicializar();
  }, [inicializar]);

  useEffect(() => {
    if (!loading && esAdmin) {
      cargarRetiros(fechaSeleccionada).catch((err: any) =>
        setError(err.message || "No se pudo actualizar el historial.")
      );
    }
  }, [fechaSeleccionada, esAdmin, loading, cargarRetiros]);

  useEffect(() => {
    if (!ok) return;
    const timer = setTimeout(() => setOk(""), 2600);
    return () => clearTimeout(timer);
  }, [ok]);

  const retirosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return retiros;

    return retiros.filter((r) => {
      const nombreUsuario = usuariosMap[r.usuario_id || ""] || "";
      const nombreAprobador = usuariosMap[r.aprobado_por || ""] || "";

      return (
        (r.concepto || "").toLowerCase().includes(q) ||
        (r.notas || "").toLowerCase().includes(q) ||
        (r.estatus || "").toLowerCase().includes(q) ||
        nombreUsuario.toLowerCase().includes(q) ||
        nombreAprobador.toLowerCase().includes(q)
      );
    });
  }, [retiros, busqueda, usuariosMap]);

  const totalDelDia = useMemo(() => {
    return retirosFiltrados.reduce((acc, r) => acc + Number(r.monto || 0), 0);
  }, [retirosFiltrados]);

  const registrosDelDia = retirosFiltrados.length;

  const guardarRetiro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");

    const montoNumero = Number(monto);

    if (!perfilActual?.id) {
      setError("No se encontró el administrador actual.");
      return;
    }

    if (!usuarioSeleccionado) {
      setError("Selecciona el usuario del retiro.");
      return;
    }

    if (!monto || Number.isNaN(montoNumero) || montoNumero <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }

    if (!concepto.trim()) {
      setError("Ingresa un concepto.");
      return;
    }

    setGuardando(true);

    try {
      const { error } = await supabase.from("retiros_caja").insert({
        monto: montoNumero,
        concepto: concepto.trim(),
        notas: notas.trim() || null,
        usuario_id: usuarioSeleccionado,
        estatus: "APROBADO",
        aprobado_por: perfilActual.id,
        fecha_aprobacion: new Date().toISOString(),
      });

      if (error) throw error;

      setMonto("");
      setConcepto("");
      setNotas("");
      setOk("Retiro registrado correctamente.");
      await cargarRetiros(fechaSeleccionada);
    } catch (err: any) {
      setError(err.message || "No se pudo guardar el retiro.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <RefreshCw size={28} style={styles.spinIcon} />
          <div style={styles.loadingTitle}>Cargando retiro de caja...</div>
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <XCircle size={30} color={THEME.danger} />
          <div style={styles.errorCardTitle}>Acceso restringido</div>
          <div style={styles.errorCardText}>
            Esta vista solo está disponible para administradores.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.hero}
        >
          <div style={styles.heroBadge}>
            <ShieldCheck size={16} />
            <span>Administración</span>
          </div>

          <div className="retiro-hero-top" style={styles.heroTop}>
            <div style={styles.heroTitleWrap}>
              <div style={styles.heroIcon}>
                <Wallet size={26} color="#fff" />
              </div>
              <div>
                <h1 style={styles.heroTitle}>Retiro de Caja</h1>
                <p style={styles.heroText}>
                  Primero captura el retiro y después revisa el historial del
                  día o de cualquier fecha.
                </p>
              </div>
            </div>

            <div style={styles.heroMeta}>
              <span style={styles.heroMetaPill}>
                {perfilActual?.nombre || "Administrador"}
              </span>
              <span style={styles.heroMetaPill}>
                {formatearFechaBonita(fechaSeleccionada)}
              </span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              style={styles.alertError}
            >
              <XCircle size={18} />
              <span>{error}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {ok ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              style={styles.alertOk}
            >
              <CheckCircle2 size={18} />
              <span>{ok}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="retiros-grid-main" style={styles.mainGrid}>
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            onSubmit={guardarRetiro}
            style={styles.formCard}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderIcon}>
                <Wallet size={20} color={THEME.olive} />
              </div>
              <div>
                <div style={styles.cardTitle}>Nuevo retiro</div>
                <div style={styles.cardSubtitle}>
                  Captura primero el movimiento.
                </div>
              </div>
            </div>

            <div className="retiros-form-grid" style={styles.formGrid}>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Usuario</label>
                <div style={styles.inputWrap}>
                  <UserCircle2 size={18} style={styles.inputIcon} />
                  <select
                    value={usuarioSeleccionado}
                    onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Selecciona un usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre || "Sin nombre"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} style={styles.chevronIcon} />
                </div>
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Monto</label>
                <div style={styles.inputWrap}>
                  <Wallet size={18} style={styles.inputIcon} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Concepto</label>
                <div style={styles.inputWrap}>
                  <FileText size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej. compra de material"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.fieldBlockFull}>
                <label style={styles.label}>Notas</label>
                <div style={styles.textareaWrap}>
                  <StickyNote size={18} style={styles.textareaIcon} />
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Detalles adicionales del retiro..."
                    rows={4}
                    style={styles.textarea}
                  />
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={guardando}
              style={styles.submitBtn}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {guardando ? (
                <>
                  <RefreshCw size={17} style={styles.spinInline} />
                  Guardando...
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  Registrar retiro
                </>
              )}
            </motion.button>
          </motion.form>

          <div style={styles.sideCol}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="retiros-summary-row"
              style={styles.summaryRow}
            >
              <motion.div
                whileHover={{ y: -3 }}
                style={{ ...styles.summaryCard, ...styles.summaryCardLarge }}
              >
                <div style={styles.summaryLabel}>Total retirado</div>
                <div style={styles.summaryValue}>
                  {formatoDinero(totalDelDia)}
                </div>
                <div style={styles.summaryMini}>
                  {formatearFechaBonita(fechaSeleccionada)}
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Registros</div>
                <div style={styles.summaryValueSmall}>{registrosDelDia}</div>
                <div style={styles.summaryMini}>Movimientos del filtro</div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              style={styles.historyCard}
            >
              <div style={styles.cardHeaderHistory}>
                <div style={styles.cardHeaderLeft}>
                  <div style={styles.cardHeaderIconGold}>
                    <CalendarDays size={20} color={THEME.gold} />
                  </div>
                  <div>
                    <div style={styles.cardTitle}>Historial</div>
                    <div style={styles.cardSubtitle}>
                      Consulta por fecha y busca movimientos.
                    </div>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={() => cargarRetiros(fechaSeleccionada)}
                  style={styles.reloadBtn}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw
                    size={16}
                    style={recargando ? styles.spinInline : undefined}
                  />
                  Recargar
                </motion.button>
              </div>

              <div className="retiros-filters-row" style={styles.filtersRow}>
                <div style={styles.filterDateWrap}>
                  <CalendarDays size={18} style={styles.inputIconStatic} />
                  <input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>

                <div style={styles.searchWrap}>
                  <Search size={18} style={styles.inputIconStatic} />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por usuario, concepto o notas"
                    style={styles.searchInput}
                  />
                </div>
              </div>

              {recargando ? (
                <div style={styles.emptyState}>
                  <RefreshCw size={24} style={styles.spinIcon} />
                  <div style={styles.emptyTitle}>Cargando historial...</div>
                </div>
              ) : retirosFiltrados.length === 0 ? (
                <div style={styles.emptyState}>
                  <CalendarDays size={26} color={THEME.gold} />
                  <div style={styles.emptyTitle}>
                    No hay retiros para esta fecha
                  </div>
                  <div style={styles.emptyText}>
                    Cambia la fecha o registra un nuevo retiro para verlo aquí.
                  </div>
                </div>
              ) : (
                <div style={styles.listWrap}>
                  {retirosFiltrados.map((item, index) => {
                    const capturo =
                      usuariosMap[item.usuario_id || ""] ||
                      "Usuario no encontrado";
                    const aprobo =
                      usuariosMap[item.aprobado_por || ""] ||
                      "Usuario no encontrado";

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ y: -2 }}
                        style={styles.listCard}
                      >
                        <div style={styles.listTop}>
                          <div>
                            <div style={styles.listAmount}>
                              {formatoDinero(Number(item.monto || 0))}
                            </div>
                            <div style={styles.listConcept}>
                              {item.concepto || "Sin concepto"}
                            </div>
                          </div>

                          <div style={styles.statusPill}>
                            {item.estatus || "SIN ESTATUS"}
                          </div>
                        </div>

                        {item.notas ? (
                          <div style={styles.listNotes}>{item.notas}</div>
                        ) : null}

                        <div style={styles.listMetaGrid}>
                          <div style={styles.metaItem}>
                            <Clock3 size={15} color={THEME.gold} />
                            <span>{formatearHora(item.fecha)}</span>
                          </div>

                          <div style={styles.metaItem}>
                            <UserCircle2 size={15} color={THEME.gold} />
                            <span>{capturo}</span>
                          </div>

                          <div style={styles.metaItem}>
                            <ShieldCheck size={15} color={THEME.gold} />
                            <span>{aprobo}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spinRetiro {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1080px) {
          .retiros-grid-main {
            grid-template-columns: 1fr !important;
          }

          .retiros-summary-row {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .retiro-hero-top {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .retiros-filters-row {
            grid-template-columns: 1fr !important;
          }

          .retiros-form-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 560px) {
          .retiros-grid-main {
            gap: 14px !important;
          }

          .retiros-summary-row {
            gap: 12px !important;
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
      "radial-gradient(circle at top left, rgba(85,107,47,0.05), transparent 28%), radial-gradient(circle at bottom right, rgba(180,157,113,0.08), transparent 24%), #fdfbf7",
    padding: "18px 14px 80px",
    fontFamily: "'Montserrat', sans-serif",
  },
  container: {
    maxWidth: 1320,
    margin: "0 auto",
  },
  hero: {
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    borderRadius: 34,
    padding: 24,
    color: "#fff",
    boxShadow: "0 24px 54px rgba(63,82,34,0.20)",
    marginBottom: 18,
    position: "relative",
    overflow: "hidden",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 18,
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "center",
  },
  heroTitleWrap: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    maxWidth: 760,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.10)",
  },
  heroTitle: {
    margin: 0,
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: "clamp(32px, 5vw, 44px)",
    lineHeight: 1,
  },
  heroText: {
    margin: "10px 0 0 0",
    color: "rgba(255,255,255,0.84)",
    fontSize: 15,
    lineHeight: 1.65,
    maxWidth: 620,
  },
  heroMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  heroMetaPill: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 700,
  },
  alertError: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(182,64,64,0.08)",
    border: "1px solid rgba(182,64,64,0.16)",
    color: THEME.danger,
    padding: "14px 16px",
    borderRadius: 18,
    marginBottom: 14,
    fontWeight: 700,
  },
  alertOk: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(47,122,70,0.08)",
    border: "1px solid rgba(47,122,70,0.16)",
    color: THEME.success,
    padding: "14px 16px",
    borderRadius: 18,
    marginBottom: 14,
    fontWeight: 700,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "0.95fr 1.2fr",
    gap: 18,
  },
  formCard: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 32,
    padding: 22,
    boxShadow: "0 18px 42px rgba(0,0,0,0.04)",
    alignSelf: "start",
  },
  sideCol: {
    display: "grid",
    gap: 18,
    alignSelf: "start",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  cardHeaderHistory: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  cardHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  cardHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: "rgba(85,107,47,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardHeaderIconGold: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: "rgba(180,157,113,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: THEME.text,
    lineHeight: 1.1,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: THEME.textSoft,
    lineHeight: 1.5,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  fieldBlock: {
    display: "flex",
    flexDirection: "column",
  },
  fieldBlockFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: 13,
    fontWeight: 800,
    color: THEME.text,
    marginBottom: 8,
  },
  inputWrap: {
    position: "relative",
  },
  textareaWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: THEME.gold,
    pointerEvents: "none",
  },
  inputIconStatic: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: THEME.gold,
    pointerEvents: "none",
  },
  chevronIcon: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: THEME.textSoft,
    pointerEvents: "none",
  },
  textareaIcon: {
    position: "absolute",
    left: 14,
    top: 15,
    color: THEME.gold,
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    border: `1px solid ${THEME.borderSoft}`,
    background: THEME.cardSoft,
    outline: "none",
    padding: "0 16px 0 42px",
    fontSize: 15,
    fontWeight: 600,
    color: THEME.text,
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    border: `1px solid ${THEME.borderSoft}`,
    background: THEME.cardSoft,
    outline: "none",
    padding: "0 42px 0 42px",
    fontSize: 15,
    fontWeight: 600,
    color: THEME.text,
    appearance: "none",
    WebkitAppearance: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 18,
    border: `1px solid ${THEME.borderSoft}`,
    background: THEME.cardSoft,
    outline: "none",
    padding: "14px 16px 14px 42px",
    fontSize: 15,
    fontWeight: 600,
    color: THEME.text,
    boxSizing: "border-box",
    resize: "vertical",
  },
  submitBtn: {
    marginTop: 18,
    width: "100%",
    height: 58,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(63,82,34,0.18)",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 14,
  },
  summaryCard: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 28,
    padding: 20,
    boxShadow: "0 14px 30px rgba(0,0,0,0.03)",
  },
  summaryCardLarge: {
    background:
      "linear-gradient(135deg, rgba(85,107,47,0.06) 0%, rgba(255,255,255,1) 100%)",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: THEME.textSoft,
    marginBottom: 10,
  },
  summaryValue: {
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: 36,
    lineHeight: 1,
    color: THEME.olive,
  },
  summaryValueSmall: {
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: 34,
    lineHeight: 1,
    color: THEME.text,
  },
  summaryMini: {
    marginTop: 10,
    fontSize: 13,
    color: THEME.textSoft,
  },
  historyCard: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 32,
    padding: 22,
    boxShadow: "0 18px 42px rgba(0,0,0,0.04)",
  },
  reloadBtn: {
    height: 44,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.olive,
    fontWeight: 800,
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  filtersRow: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1.2fr",
    gap: 12,
    marginBottom: 18,
  },
  filterDateWrap: {
    position: "relative",
  },
  dateInput: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    border: `1px solid ${THEME.borderSoft}`,
    background: THEME.cardSoft,
    outline: "none",
    padding: "0 14px 0 42px",
    fontSize: 14,
    fontWeight: 700,
    color: THEME.text,
    boxSizing: "border-box",
  },
  searchWrap: {
    position: "relative",
  },
  searchInput: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    border: `1px solid ${THEME.borderSoft}`,
    background: THEME.cardSoft,
    outline: "none",
    padding: "0 14px 0 42px",
    fontSize: 14,
    fontWeight: 600,
    color: THEME.text,
    boxSizing: "border-box",
  },
  listWrap: {
    display: "grid",
    gap: 12,
  },
  listCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #fcfaf5 100%)",
    border: `1px solid ${THEME.border}`,
    borderRadius: 24,
    padding: 16,
    boxShadow: "0 10px 22px rgba(0,0,0,0.03)",
  },
  listTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  listAmount: {
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: 30,
    lineHeight: 1,
    color: THEME.olive,
  },
  listConcept: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 800,
    color: THEME.text,
  },
  statusPill: {
    background: "rgba(85,107,47,0.08)",
    border: "1px solid rgba(85,107,47,0.12)",
    color: THEME.olive,
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 999,
    padding: "8px 12px",
  },
  listNotes: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.textSoft,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  listMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    border: `1px solid ${THEME.borderSoft}`,
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    color: THEME.textSoft,
    fontWeight: 700,
  },
  emptyState: {
    minHeight: 260,
    borderRadius: 24,
    background: THEME.cardSoft,
    border: `1px dashed ${THEME.border}`,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: 20,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 800,
    color: THEME.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: THEME.textSoft,
    maxWidth: 340,
    lineHeight: 1.6,
  },
  loadingCard: {
    maxWidth: 420,
    margin: "80px auto 0 auto",
    background: "#fff",
    borderRadius: 28,
    border: `1px solid ${THEME.border}`,
    padding: 28,
    boxShadow: "0 18px 40px rgba(0,0,0,0.04)",
    display: "grid",
    placeItems: "center",
    gap: 12,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: THEME.text,
  },
  errorCard: {
    maxWidth: 520,
    margin: "80px auto 0 auto",
    background: "#fff",
    borderRadius: 28,
    border: `1px solid rgba(182,64,64,0.16)`,
    padding: 28,
    boxShadow: "0 18px 40px rgba(0,0,0,0.04)",
    textAlign: "center",
  },
  errorCardTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 800,
    color: THEME.text,
  },
  errorCardText: {
    marginTop: 8,
    fontSize: 15,
    color: THEME.textSoft,
    lineHeight: 1.6,
  },
  spinIcon: {
    animation: "spinRetiro 1s linear infinite",
    color: THEME.olive,
  },
  spinInline: {
    animation: "spinRetiro 1s linear infinite",
  },
};

export default RetirosCajaAdmin;
