import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Save,
  Plus,
  X,
  Landmark,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type CuentaRow = {
  id: string;
  nombre: string | null;
  activa: boolean | null;
  orden: number | null;
};

type Props = {
  onBack: () => void;
};

const nuevoVacio = {
  nombre: "",
  activa: true,
  orden: 1,
};

export default function ConfigCuentasTransferencia({ onBack }: Props) {
  const [cuentas, setCuentas] = useState<CuentaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevo, setNuevo] = useState(nuevoVacio);
  const [creando, setCreando] = useState(false);

  const cargarCuentas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("cuentas_transferencia")
        .select("id,nombre,activa,orden")
        .order("orden", { ascending: true });

      if (error) throw error;

      setCuentas((Array.isArray(data) ? data : []) as CuentaRow[]);
    } catch (error: any) {
      alert(error?.message || "No se pudieron cargar las cuentas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const filteredCuentas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cuentas;

    return cuentas.filter((c) =>
      `${c.nombre || ""} ${c.activa ? "activa" : "inactiva"} ${c.orden || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [cuentas, search]);

  const actualizarLocal = (
    id: string,
    campo: keyof CuentaRow,
    valor: string | boolean | number | null
  ) => {
    setCuentas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    );
  };

  const guardarCuenta = async (cuenta: CuentaRow) => {
    try {
      if (!cuenta.nombre?.trim()) {
        alert("La cuenta necesita nombre");
        return;
      }

      setSavingId(cuenta.id);

      const { error } = await supabase
        .from("cuentas_transferencia")
        .update({
          nombre: cuenta.nombre.trim().toUpperCase(),
          activa: cuenta.activa === true,
          orden: Number(cuenta.orden || 1),
        })
        .eq("id", cuenta.id);

      if (error) throw error;

      await cargarCuentas();
    } catch (error: any) {
      alert(error?.message || "No se pudo guardar la cuenta");
    } finally {
      setSavingId(null);
    }
  };

  const crearCuenta = async () => {
    try {
      if (!nuevo.nombre.trim()) {
        alert("Escribe el nombre de la cuenta");
        return;
      }

      setCreando(true);

      const { error } = await supabase.from("cuentas_transferencia").insert({
        nombre: nuevo.nombre.trim().toUpperCase(),
        activa: nuevo.activa,
        orden: Number(nuevo.orden || 1),
      });

      if (error) throw error;

      setNuevo(nuevoVacio);
      setModalNuevo(false);
      await cargarCuentas();
    } catch (error: any) {
      alert(error?.message || "No se pudo crear la cuenta");
    } finally {
      setCreando(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          style={S.hero}
        >
          <div style={S.heroTop}>
            <button type="button" onClick={onBack} style={S.backBtn}>
              <ArrowLeft size={18} />
              Regresar
            </button>

            <button
              type="button"
              onClick={cargarCuentas}
              style={S.refreshBtn}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          <div style={S.heroBody}>
            <div style={S.heroIcon}>
              <Landmark size={30} color="#fff" />
            </div>

            <div>
              <h1 style={S.title}>Cuentas transferencia</h1>
              <p style={S.subtitle}>
                Agrega, ordena, activa o desactiva cuentas para pagos por
                transferencia.
              </p>
            </div>
          </div>
        </motion.div>

        <div style={S.actionsRow}>
          <div style={S.searchCard}>
            <Search size={18} color="#b49d71" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cuenta, activa, inactiva..."
              style={S.searchInput}
            />
          </div>

          <button
            type="button"
            style={S.newBtn}
            onClick={() => setModalNuevo(true)}
          >
            <Plus size={18} />
            Nueva cuenta
          </button>
        </div>

        <div style={S.list}>
          <AnimatePresence>
            {filteredCuentas.map((cuenta, index) => {
              const activa = cuenta.activa === true;

              return (
                <motion.div
                  key={cuenta.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.025 }}
                  style={{
                    ...S.card,
                    opacity: activa ? 1 : 0.62,
                    border: activa
                      ? "1px solid #ece4d8"
                      : "1px solid rgba(182,64,64,0.18)",
                  }}
                >
                  <div style={S.cardHeader}>
                    <div>
                      <div style={S.cardTitle}>
                        {cuenta.nombre || "SIN NOMBRE"}
                      </div>
                      <div style={S.cardSub}>
                        ORDEN {cuenta.orden || 1} ·{" "}
                        {activa ? "ACTIVA" : "INACTIVA"}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        ...S.statusBtn,
                        background: activa
                          ? "rgba(85,107,47,0.10)"
                          : "rgba(182,64,64,0.08)",
                        color: activa ? "#556b2f" : "#b64040",
                      }}
                      onClick={() =>
                        actualizarLocal(cuenta.id, "activa", !activa)
                      }
                    >
                      {activa ? (
                        <ToggleRight size={20} />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                      {activa ? "Activa" : "Inactiva"}
                    </button>
                  </div>

                  <div style={S.grid}>
                    <label style={S.field}>
                      <span style={S.label}>Nombre</span>
                      <input
                        value={cuenta.nombre || ""}
                        onChange={(e) =>
                          actualizarLocal(cuenta.id, "nombre", e.target.value)
                        }
                        style={S.input}
                      />
                    </label>

                    <label style={S.field}>
                      <span style={S.label}>Orden</span>
                      <input
                        type="number"
                        value={String(cuenta.orden ?? 1)}
                        onChange={(e) =>
                          actualizarLocal(
                            cuenta.id,
                            "orden",
                            Number(e.target.value || 1)
                          )
                        }
                        style={S.input}
                      />
                    </label>
                  </div>

                  <div style={S.footer}>
                    <button
                      type="button"
                      onClick={() => guardarCuenta(cuenta)}
                      disabled={savingId === cuenta.id}
                      style={S.saveBtn}
                    >
                      <Save size={17} />
                      {savingId === cuenta.id
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!loading && filteredCuentas.length === 0 ? (
            <div style={S.empty}>No encontré cuentas con esa búsqueda.</div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {modalNuevo && (
          <motion.div
            style={S.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={S.modal}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
            >
              <div style={S.modalHeader}>
                <div>
                  <h2 style={S.modalTitle}>Nueva cuenta</h2>
                  <p style={S.modalSub}>
                    Esta cuenta aparecerá en Confirmar Pago cuando el método sea
                    transferencia.
                  </p>
                </div>

                <button
                  type="button"
                  style={S.closeBtn}
                  onClick={() => {
                    setNuevo(nuevoVacio);
                    setModalNuevo(false);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={S.modalGrid}>
                <label style={S.field}>
                  <span style={S.label}>Nombre</span>
                  <input
                    value={nuevo.nombre}
                    onChange={(e) =>
                      setNuevo((p) => ({ ...p, nombre: e.target.value }))
                    }
                    placeholder="Ej. TOÑO"
                    style={S.input}
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>Orden</span>
                  <input
                    type="number"
                    value={String(nuevo.orden)}
                    onChange={(e) =>
                      setNuevo((p) => ({
                        ...p,
                        orden: Number(e.target.value || 1),
                      }))
                    }
                    style={S.input}
                  />
                </label>

                <button
                  type="button"
                  style={{
                    ...S.optionBtn,
                    background: nuevo.activa
                      ? "rgba(85,107,47,0.10)"
                      : "rgba(182,64,64,0.08)",
                    color: nuevo.activa ? "#556b2f" : "#b64040",
                  }}
                  onClick={() =>
                    setNuevo((p) => ({ ...p, activa: !p.activa }))
                  }
                >
                  {nuevo.activa ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                  {nuevo.activa ? "Activa" : "Inactiva"}
                </button>
              </div>

              <div style={S.modalFooter}>
                <button
                  type="button"
                  style={S.cancelBtn}
                  onClick={() => {
                    setNuevo(nuevoVacio);
                    setModalNuevo(false);
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={S.createBtn}
                  onClick={crearCuenta}
                  disabled={creando}
                >
                  <Save size={17} />
                  {creando ? "Guardando..." : "Guardar cuenta"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .spin { animation: spinCuentas 1s linear infinite; }
        @keyframes spinCuentas {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const S: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(85,107,47,0.06), transparent 28%), #fdfbf7",
    fontFamily: "'Montserrat', sans-serif",
    padding: "22px 14px 90px",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  hero: {
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    borderRadius: 34,
    padding: 24,
    color: "#fff",
    boxShadow: "0 24px 54px rgba(63,82,34,0.20)",
    marginBottom: 18,
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 22,
    flexWrap: "wrap",
  },
  backBtn: {
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  refreshBtn: {
    height: 44,
    borderRadius: 16,
    border: "none",
    background: "#fff",
    color: "#556b2f",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  heroBody: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: "clamp(34px, 5vw, 48px)",
    lineHeight: 1,
  },
  subtitle: {
    margin: "10px 0 0 0",
    color: "rgba(255,255,255,0.84)",
    fontSize: 15,
    lineHeight: 1.55,
  },
  actionsRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "center",
    marginBottom: 18,
  },
  searchCard: {
    height: 58,
    borderRadius: 22,
    background: "#fff",
    border: "1px solid #ece4d8",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 18px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontWeight: 700,
    color: "#1a1a1a",
    background: "transparent",
    minWidth: 0,
  },
  newBtn: {
    height: 58,
    borderRadius: 22,
    border: "none",
    background: "linear-gradient(135deg, #b49d71 0%, #927a4f 100%)",
    color: "#fff",
    padding: "0 18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  list: {
    display: "grid",
    gap: 16,
  },
  card: {
    background: "linear-gradient(135deg, #ffffff 0%, #fcfaf5 100%)",
    borderRadius: 28,
    padding: 20,
    boxShadow: "0 16px 36px rgba(0,0,0,0.035)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "#1a1a1a",
    textTransform: "uppercase",
  },
  cardSub: {
    marginTop: 5,
    fontSize: 13,
    color: "#8b867d",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  statusBtn: {
    height: 42,
    borderRadius: 999,
    border: "1px solid #ece4d8",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    fontSize: 11,
    fontWeight: 900,
    color: "#b49d71",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  input: {
    height: 48,
    borderRadius: 15,
    border: "1px solid #ece4d8",
    background: "#fff",
    padding: "0 12px",
    fontSize: 14,
    fontWeight: 800,
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
  },
  optionBtn: {
    height: 48,
    borderRadius: 15,
    border: "1px solid #ece4d8",
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
    alignSelf: "end",
    whiteSpace: "nowrap",
  },
  footer: {
    marginTop: 18,
    display: "flex",
    justifyContent: "flex-end",
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: "0 18px",
    cursor: "pointer",
  },
  empty: {
    padding: 24,
    borderRadius: 24,
    background: "#fff",
    border: "1px solid #ece4d8",
    color: "#8b867d",
    fontWeight: 800,
    textAlign: "center",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(18,17,15,0.42)",
    backdropFilter: "blur(8px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  modal: {
    width: "min(620px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "linear-gradient(135deg, #ffffff 0%, #fcfaf5 100%)",
    borderRadius: 32,
    border: "1px solid #ece4d8",
    boxShadow: "0 28px 70px rgba(0,0,0,0.22)",
    padding: 22,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  modalTitle: {
    margin: 0,
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: 34,
    color: "#1a1a1a",
  },
  modalSub: {
    margin: "6px 0 0",
    color: "#8b867d",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.5,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    border: "1px solid #ece4d8",
    background: "#fff",
    color: "#1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
    flexWrap: "wrap",
  },
  cancelBtn: {
    height: 50,
    borderRadius: 16,
    border: "1px solid #ece4d8",
    background: "#fff",
    color: "#8b867d",
    fontWeight: 900,
    padding: "0 18px",
    cursor: "pointer",
  },
  createBtn: {
    height: 50,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    color: "#fff",
    fontWeight: 900,
    padding: "0 18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    cursor: "pointer",
  },
};