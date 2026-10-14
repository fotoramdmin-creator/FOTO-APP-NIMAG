import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArchiveRestore,
  ArrowLeft,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";

type RegistroPapelera = {
  tipo_registro: "PEDIDO" | "SERVICIO";
  registro_id: string;
  referencia: string | null;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  fecha_creacion: string | null;
  papelera_at: string | null;
  papelera_por_nombre: string | null;
  papelera_motivo: string | null;
  papelera_manejo_pagos:
  | "SIN_PAGOS"
  | "CONSERVAR"
  | "ANULAR"
  | "DEVOLVER"
  | null;
  total_final: number | null;
  total_pagado: number | null;
  pagos_activos: number | null;
  pagos_anulados: number | null;
  pagos_devueltos: number | null;
  monto_activo: number | null;
  monto_anulado: number | null;
  monto_devuelto: number | null;
};

type Props = {
  onBack: () => void;
};

const THEME = {
  bg: "#f7f3eb",
  card: "#ffffff",
  text: "#1b1a17",
  soft: "#777168",
  border: "#e8dfd2",
  olive: "#556b2f",
  oliveDark: "#3f5222",
  gold: "#b49d71",
  red: "#b42318",
  redSoft: "#fff1f0",
  green: "#237a4b",
  greenSoft: "#edf8f1",
};

const money = (value: number | null | undefined) =>
  Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

const fechaHora = (value: string | null) => {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const etiquetaManejo = (
  manejo: RegistroPapelera["papelera_manejo_pagos"]
) => {
  switch (manejo) {
    case "CONSERVAR":
      return "Pagos conservados";
    case "ANULAR":
      return "Pagos anulados";
    case "DEVOLVER":
      return "Pagos devueltos";
    case "SIN_PAGOS":
      return "Sin pagos";
    default:
      return "Sin información";
  }
};

export default function PapeleraAdministrativa({ onBack }: Props) {
  const [registros, setRegistros] = useState<RegistroPapelera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [restaurando, setRestaurando] =
    useState<RegistroPapelera | null>(null);
  const [motivoRestauracion, setMotivoRestauracion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarPapelera = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: rpcError } = await supabase.rpc(
        "listar_papelera_administrativa"
      );

      if (rpcError) throw rpcError;

      setRegistros(
        (Array.isArray(data) ? data : []) as RegistroPapelera[]
      );
    } catch (err: any) {
      console.error("Error cargando papelera:", err);
      setError(
        err?.message ||
        "No se pudo cargar la papelera administrativa."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarPapelera();
  }, [cargarPapelera]);

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return registros;

    return registros.filter((registro) => {
      const contenido = [
        registro.tipo_registro,
        registro.referencia,
        registro.cliente_nombre,
        registro.cliente_telefono,
        registro.papelera_por_nombre,
        registro.papelera_motivo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [busqueda, registros]);

  const cerrarRestauracion = () => {
    if (guardando) return;

    setRestaurando(null);
    setMotivoRestauracion("");
  };

  const confirmarRestauracion = async () => {
    if (!restaurando || guardando) return;

    const motivo = motivoRestauracion.trim();

    if (motivo.length < 5) {
      setError(
        "Escribe un motivo de restauración de al menos 5 caracteres."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const { error: rpcError } = await supabase.rpc(
        "restaurar_registro_papelera",
        {
          p_tipo_registro: restaurando.tipo_registro,
          p_registro_id: restaurando.registro_id,
          p_motivo: motivo,
        }
      );

      if (rpcError) throw rpcError;

      setRegistros((actuales) =>
        actuales.filter(
          (registro) =>
            registro.registro_id !== restaurando.registro_id ||
            registro.tipo_registro !== restaurando.tipo_registro
        )
      );

      setRestaurando(null);
      setMotivoRestauracion("");

      window.alert(
        `${restaurando.tipo_registro === "PEDIDO"
          ? "Pedido"
          : "Servicio"
        } restaurado correctamente.`
      );
    } catch (err: any) {
      console.error("Error restaurando registro:", err);
      setError(
        err?.message || "No se pudo restaurar el registro."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.header}
        >
          <div style={styles.headerTop}>
            <button type="button" onClick={onBack} style={styles.backBtn}>
              <ArrowLeft size={18} />
              Regresar
            </button>

            <button
              type="button"
              onClick={() => void cargarPapelera()}
              disabled={loading}
              style={styles.refreshBtn}
            >
              <RefreshCw
                size={17}
                className={loading ? "papelera-spin" : ""}
              />
              {loading ? "Cargando..." : "Recargar"}
            </button>
          </div>

          <div style={styles.hero}>
            <div style={styles.heroIcon}>
              <Trash2 size={30} />
            </div>

            <div>
              <p style={styles.kicker}>EXCLUSIVO PARA ADMINISTRADORES</p>
              <h1 style={styles.title}>Papelera administrativa</h1>
              <p style={styles.subtitle}>
                Consulta pedidos y servicios retirados de las vistas
                operativas, con su motivo, responsable y manejo de pagos.
              </p>
            </div>
          </div>
        </motion.header>

        <section style={styles.warning}>
          <AlertTriangle size={21} color={THEME.red} />

          <div>
            <strong style={styles.warningTitle}>
              Los registros aquí no están eliminados físicamente
            </strong>

            <p style={styles.warningText}>
              Al restaurarlos volverán a las vistas correspondientes. Las
              devoluciones de dinero registradas no se revierten
              automáticamente.
            </p>
          </div>
        </section>

        <div style={styles.tools}>
          <div style={styles.searchBox}>
            <Search size={18} color={THEME.soft} />

            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar cliente, teléfono, referencia o motivo..."
              style={styles.searchInput}
            />

            {busqueda ? (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                style={styles.clearSearch}
                aria-label="Limpiar búsqueda"
              >
                <X size={17} />
              </button>
            ) : null}
          </div>

          <div style={styles.counter}>
            {registrosFiltrados.length}{" "}
            {registrosFiltrados.length === 1
              ? "registro"
              : "registros"}
          </div>
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}

        {loading ? (
          <div style={styles.stateBox}>
            <Loader2
              size={38}
              color={THEME.olive}
              className="papelera-spin"
            />
            <strong>Cargando papelera...</strong>
          </div>
        ) : registros.length === 0 ? (
          <div style={styles.stateBox}>
            <ArchiveRestore size={48} color={THEME.gold} />
            <strong style={styles.emptyTitle}>La papelera está vacía</strong>
            <span style={styles.emptyText}>
              No hay pedidos ni servicios retirados.
            </span>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div style={styles.stateBox}>
            <Search size={45} color={THEME.gold} />
            <strong style={styles.emptyTitle}>Sin resultados</strong>
            <span style={styles.emptyText}>
              No encontramos registros con esa búsqueda.
            </span>
          </div>
        ) : (
          <div style={styles.grid}>
            {registrosFiltrados.map((registro, index) => (
              <motion.article
                key={`${registro.tipo_registro}-${registro.registro_id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                style={styles.card}
              >
                <div style={styles.cardTop}>
                  <div
                    style={{
                      ...styles.typeBadge,
                      background:
                        registro.tipo_registro === "PEDIDO"
                          ? "#f6f0de"
                          : "#edf4ea",
                      color:
                        registro.tipo_registro === "PEDIDO"
                          ? "#806527"
                          : THEME.oliveDark,
                    }}
                  >
                    <Package size={14} />
                    {registro.tipo_registro}
                  </div>

                  <span style={styles.reference}>
                    {registro.referencia || "Sin referencia"}
                  </span>
                </div>

                <h2 style={styles.clientName}>
                  {registro.cliente_nombre || "SIN NOMBRE"}
                </h2>

                <p style={styles.phone}>
                  {registro.cliente_telefono || "Sin teléfono"}
                </p>

                <div style={styles.infoGrid}>
                  <Info
                    label="Enviado a papelera"
                    value={fechaHora(registro.papelera_at)}
                  />

                  <Info
                    label="Enviado por"
                    value={
                      registro.papelera_por_nombre ||
                      "Administrador no identificado"
                    }
                  />

                  <Info
                    label="Total"
                    value={money(registro.total_final)}
                  />

                  <Info
                    label="Pago recibido original"
                    value={money(registro.total_pagado)}
                  />
                </div>

                <div style={styles.reasonBox}>
                  <span style={styles.reasonLabel}>MOTIVO</span>
                  <p style={styles.reasonText}>
                    {registro.papelera_motivo || "Sin motivo registrado"}
                  </p>
                </div>

                <div style={styles.paymentState}>
                  <strong style={styles.paymentTitle}>
                    {etiquetaManejo(
                      registro.papelera_manejo_pagos
                    )}
                  </strong>

                  {registro.papelera_manejo_pagos === "DEVOLVER" ? (
                    <>
                      <div style={styles.paymentRow}>
                        <span>Monto devuelto al cliente</span>
                        <strong>
                          {money(registro.monto_devuelto)}
                        </strong>
                      </div>

                      <div style={styles.paymentImpact}>
                        Impacto en caja: salida de{" "}
                        <strong>
                          {money(registro.monto_devuelto)}
                        </strong>
                      </div>
                    </>
                  ) : registro.papelera_manejo_pagos === "ANULAR" ? (
                    <>
                      <div style={styles.paymentRow}>
                        <span>Monto anulado</span>
                        <strong>
                          {money(registro.monto_anulado)}
                        </strong>
                      </div>

                      <div style={styles.paymentImpact}>
                        Impacto contable: este pago dejó de contar como
                        ingreso. No se registró una devolución.
                      </div>
                    </>
                  ) : registro.papelera_manejo_pagos === "CONSERVAR" ? (
                    <>
                      <div style={styles.paymentRow}>
                        <span>Monto conservado</span>
                        <strong>
                          {money(registro.monto_activo)}
                        </strong>
                      </div>

                      <div style={styles.paymentImpact}>
                        Impacto contable: el dinero permanece registrado
                        como ingreso.
                      </div>
                    </>
                  ) : (
                    <div style={styles.paymentImpact}>
                      Este registro no tenía pagos activos.
                    </div>
                  )}

                  <span style={styles.paymentCounts}>
                    Pagos activos: {Number(registro.pagos_activos || 0)} ·
                    Anulados: {Number(registro.pagos_anulados || 0)} ·
                    Devueltos: {Number(registro.pagos_devueltos || 0)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMotivoRestauracion("");
                    setRestaurando(registro);
                  }}
                  style={styles.restoreBtn}
                >
                  <ArchiveRestore size={18} />
                  Restaurar registro
                </button>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {restaurando ? (
        <div style={styles.overlay} onClick={cerrarRestauracion}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalTop}>
              <div>
                <p style={styles.kicker}>CONFIRMAR RESTAURACIÓN</p>
                <h2 style={styles.modalTitle}>
                  {restaurando.cliente_nombre || "SIN NOMBRE"}
                </h2>
              </div>

              <button
                type="button"
                onClick={cerrarRestauracion}
                disabled={guardando}
                style={styles.modalClose}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalNotice}>
              <AlertTriangle size={19} />

              <span>
                El {restaurando.tipo_registro.toLowerCase()} volverá a las
                vistas operativas. Si hubo una devolución real, esa salida
                de dinero permanecerá registrada.
              </span>
            </div>

            <label style={styles.label}>
              Motivo de restauración
              <textarea
                value={motivoRestauracion}
                onChange={(event) =>
                  setMotivoRestauracion(event.target.value)
                }
                placeholder="Ejemplo: El cliente decidió continuar con el pedido."
                rows={4}
                maxLength={300}
                style={styles.textarea}
                disabled={guardando}
                autoFocus
              />
            </label>

            <div style={styles.characters}>
              {motivoRestauracion.trim().length}/300 · mínimo 5
              caracteres
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={cerrarRestauracion}
                disabled={guardando}
                style={styles.cancelBtn}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void confirmarRestauracion()}
                disabled={
                  guardando ||
                  motivoRestauracion.trim().length < 5
                }
                style={{
                  ...styles.confirmBtn,
                  opacity:
                    guardando ||
                      motivoRestauracion.trim().length < 5
                      ? 0.55
                      : 1,
                }}
              >
                {guardando ? (
                  <Loader2
                    size={18}
                    className="papelera-spin"
                  />
                ) : (
                  <ArchiveRestore size={18} />
                )}

                {guardando ? "Restaurando..." : "Sí, restaurar"}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}

      <style>{`
        .papelera-spin {
          animation: papeleraRotation 1s linear infinite;
        }

        @keyframes papeleraRotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 720px) {
          .papelera-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: THEME.bg,
    padding: "115px 18px 50px",
    fontFamily: "'Montserrat', sans-serif",
    color: THEME.text,
  },
  container: {
    width: "100%",
    maxWidth: 1120,
    margin: "0 auto",
  },
  header: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 28,
    padding: "22px clamp(18px, 4vw, 34px) 30px",
    boxShadow: "0 18px 45px rgba(50, 44, 34, 0.06)",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 16px",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.card,
    color: THEME.text,
    fontWeight: 800,
    cursor: "pointer",
  },
  refreshBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 16px",
    borderRadius: 14,
    border: 0,
    background: THEME.olive,
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginTop: 27,
  },
  heroIcon: {
    width: 64,
    height: 64,
    minWidth: 64,
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: THEME.redSoft,
    color: THEME.red,
  },
  kicker: {
    margin: "0 0 7px",
    color: THEME.gold,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.12em",
  },
  title: {
    margin: 0,
    fontSize: "clamp(29px, 5vw, 46px)",
    lineHeight: 1.05,
    fontFamily: "'Vidaloka', serif",
  },
  subtitle: {
    maxWidth: 760,
    margin: "9px 0 0",
    color: THEME.soft,
    lineHeight: 1.55,
  },
  warning: {
    display: "flex",
    gap: 13,
    alignItems: "flex-start",
    marginTop: 20,
    padding: "17px 19px",
    borderRadius: 18,
    background: THEME.redSoft,
    border: "1px solid rgba(180,35,24,0.15)",
  },
  warningTitle: {
    color: THEME.red,
  },
  warningText: {
    margin: "5px 0 0",
    color: "#75504c",
    fontSize: 13,
    lineHeight: 1.5,
  },
  tools: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    margin: "22px 0",
    flexWrap: "wrap",
  },
  searchBox: {
    flex: "1 1 420px",
    minHeight: 52,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 15px",
    borderRadius: 17,
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    fontSize: 14,
    color: THEME.text,
  },
  clearSearch: {
    border: 0,
    background: "transparent",
    color: THEME.soft,
    cursor: "pointer",
    padding: 5,
  },
  counter: {
    padding: "12px 16px",
    borderRadius: 15,
    background: "#eee8dc",
    color: THEME.oliveDark,
    fontSize: 13,
    fontWeight: 900,
  },
  error: {
    marginBottom: 18,
    padding: "14px 17px",
    borderRadius: 14,
    background: THEME.redSoft,
    border: "1px solid rgba(180,35,24,0.2)",
    color: THEME.red,
    fontWeight: 700,
  },
  stateBox: {
    minHeight: 280,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
    padding: 30,
    textAlign: "center",
    borderRadius: 25,
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
  },
  emptyTitle: {
    fontSize: 20,
  },
  emptyText: {
    color: THEME.soft,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    padding: 21,
    borderRadius: 22,
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    boxShadow: "0 12px 30px rgba(50, 44, 34, 0.05)",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.06em",
  },
  reference: {
    color: THEME.soft,
    fontSize: 12,
    fontWeight: 800,
  },
  clientName: {
    margin: "17px 0 4px",
    fontSize: 22,
  },
  phone: {
    margin: 0,
    color: THEME.soft,
    fontSize: 13,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 11,
    marginTop: 18,
  },
  infoItem: {
    padding: 11,
    borderRadius: 13,
    background: "#faf8f3",
  },
  infoLabel: {
    display: "block",
    color: THEME.soft,
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  infoValue: {
    display: "block",
    marginTop: 5,
    fontSize: 12,
    overflowWrap: "anywhere",
  },
  reasonBox: {
    marginTop: 15,
    padding: 14,
    borderRadius: 14,
    background: THEME.redSoft,
  },
  reasonLabel: {
    color: THEME.red,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.09em",
  },
  reasonText: {
    margin: "6px 0 0",
    color: "#68433f",
    fontSize: 13,
    lineHeight: 1.45,
  },
  paymentState: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#f6f3ea",
    color: THEME.oliveDark,
    fontSize: 12,
    border: `1px solid ${THEME.border}`,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  paymentRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 11,
    background: THEME.card,
    fontSize: 13,
  },
  paymentImpact: {
    padding: "10px 12px",
    borderRadius: 11,
    background: "#fff8e8",
    color: "#765d25",
    fontSize: 12,
    lineHeight: 1.45,
  },
  paymentCounts: {
    color: THEME.soft,
    fontSize: 11,
    lineHeight: 1.45,
  },
  restoreBtn: {
    width: "100%",
    minHeight: 47,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 17,
    border: 0,
    borderRadius: 15,
    background: `linear-gradient(135deg, ${THEME.olive}, ${THEME.oliveDark})`,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    background: "rgba(18,17,15,0.65)",
    backdropFilter: "blur(6px)",
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    padding: 24,
    borderRadius: 24,
    background: THEME.card,
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
  },
  modalTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 15,
  },
  modalTitle: {
    margin: 0,
    fontSize: 25,
  },
  modalClose: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: THEME.card,
    cursor: "pointer",
  },
  modalNotice: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    background: "#fff8e8",
    color: "#765d25",
    fontSize: 13,
    lineHeight: 1.45,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 18,
    fontSize: 13,
    fontWeight: 900,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    padding: 13,
    outline: 0,
    fontFamily: "inherit",
    fontSize: 14,
    lineHeight: 1.5,
  },
  characters: {
    marginTop: 6,
    textAlign: "right",
    color: THEME.soft,
    fontSize: 11,
  },
  modalActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 11,
    marginTop: 20,
  },
  cancelBtn: {
    minHeight: 48,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.card,
    color: THEME.text,
    fontWeight: 900,
    cursor: "pointer",
  },
  confirmBtn: {
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    border: 0,
    background: THEME.olive,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
};