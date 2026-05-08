import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Save,
  Package,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
} from "lucide-react";

type PrecioRow = {
  id: string;
  tamano: string | null;
  cantidad: number | null;
  tipo: string | null;
  papel: string | null;
  precio_base: number | null;
  aumento_urgente: number | null;
  aumento_kenfor: number | null;
  activo: boolean | null;
};

type NuevoPrecio = {
  tamano: string;
  cantidad: string;
  tipo: string;
  papel: string;
  precio_base: string;
  aumento_urgente: string;
  aumento_kenfor: string;
  activo: boolean;
};

type Props = {
  onBack: () => void;
};

const nuevoVacio: NuevoPrecio = {
  tamano: "",
  cantidad: "",
  tipo: "",
  papel: "",
  precio_base: "",
  aumento_urgente: "0",
  aumento_kenfor: "0",
  activo: true,
};

const money = (n: any) => {
  const x = Number(n || 0);
  if (!isFinite(x)) return "$0.00";
  return x.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

export default function ConfigPrecios({ onBack }: Props) {
  const [rows, setRows] = useState<PrecioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevo, setNuevo] = useState<NuevoPrecio>(nuevoVacio);
  const [creando, setCreando] = useState(false);

  const cargarPrecios = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("catalogo_precios")
        .select(
          "id,tamano,cantidad,tipo,papel,precio_base,aumento_urgente,aumento_kenfor,activo"
        )
        .order("tamano", { ascending: true })
        .order("cantidad", { ascending: true });

      if (error) throw error;

      setRows((Array.isArray(data) ? data : []) as PrecioRow[]);
    } catch (error: any) {
      alert(error?.message || "No se pudieron cargar los precios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPrecios();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((r) => {
      const texto = `${r.tamano || ""} ${r.cantidad || ""} ${r.tipo || ""} ${
        r.papel || ""
      }`.toLowerCase();

      return texto.includes(q);
    });
  }, [rows, search]);

  const actualizarLocal = (
    id: string,
    campo: keyof PrecioRow,
    valor: string | number | boolean | null
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r))
    );
  };

  const guardarPrecio = async (row: PrecioRow) => {
    try {
      setSavingId(row.id);

      const payload = {
        tamano: row.tamano ? row.tamano.trim().toUpperCase() : null,
        cantidad: row.cantidad ?? null,
        tipo: row.tipo ? row.tipo.trim().toUpperCase() : null,
        papel: row.papel ? row.papel.trim().toUpperCase() : null,
        precio_base: row.precio_base ?? 0,
        aumento_urgente: row.aumento_urgente ?? 0,
        aumento_kenfor: row.aumento_kenfor ?? 0,
        activo: row.activo === true,
      };

      const { error } = await supabase
        .from("catalogo_precios")
        .update(payload)
        .eq("id", row.id);

      if (error) throw error;

      await cargarPrecios();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo guardar el precio");
    } finally {
      setSavingId(null);
    }
  };

  const crearPaquete = async () => {
    try {
      if (!nuevo.tamano.trim()) {
        alert("Escribe el tamaño del paquete");
        return;
      }

      if (!nuevo.cantidad.trim()) {
        alert("Escribe la cantidad");
        return;
      }

      if (!nuevo.precio_base.trim()) {
        alert("Escribe el precio base");
        return;
      }

      setCreando(true);

      const { error } = await supabase.from("catalogo_precios").insert({
        tamano: nuevo.tamano.trim().toUpperCase(),
        cantidad: Number(nuevo.cantidad || 0),
        tipo: nuevo.tipo.trim() ? nuevo.tipo.trim().toUpperCase() : null,
        papel: nuevo.papel.trim() ? nuevo.papel.trim().toUpperCase() : null,
        precio_base: Number(nuevo.precio_base || 0),
        aumento_urgente: Number(nuevo.aumento_urgente || 0),
        aumento_kenfor: Number(nuevo.aumento_kenfor || 0),
        activo: nuevo.activo,
      });

      if (error) throw error;

      setNuevo(nuevoVacio);
      setModalNuevo(false);
      await cargarPrecios();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo crear el paquete");
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
              onClick={cargarPrecios}
              style={S.refreshBtn}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          <div style={S.heroBody}>
            <div style={S.heroIcon}>
              <Package size={30} color="#fff" />
            </div>

            <div>
              <h1 style={S.title}>Precios y paquetes</h1>
              <p style={S.subtitle}>
                Cambia precios, aumentos y crea nuevos paquetes sin tocar
                código.
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
              placeholder="Buscar por tamaño, cantidad, tipo o papel..."
              style={S.searchInput}
            />
          </div>

          <button
            type="button"
            style={S.newBtn}
            onClick={() => setModalNuevo(true)}
          >
            <Plus size={18} />
            Nuevo paquete
          </button>
        </div>

        <div style={S.list}>
          <AnimatePresence>
            {filteredRows.map((row, index) => {
              const activo = row.activo === true;

              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.025 }}
                  style={{
                    ...S.card,
                    opacity: activo ? 1 : 0.62,
                    border: activo
                      ? "1px solid #ece4d8"
                      : "1px solid rgba(182,64,64,0.18)",
                  }}
                >
                  <div style={S.cardHeader}>
                    <div>
                      <div style={S.cardTitle}>
                        {row.tamano || "SIN TAMAÑO"}
                      </div>
                      <div style={S.cardSub}>
                        {row.cantidad || 0} fotos · {row.tipo || "SIN TIPO"} ·{" "}
                        {row.papel || "SIN PAPEL"}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        ...S.activeBtn,
                        background: activo
                          ? "rgba(85,107,47,0.10)"
                          : "rgba(182,64,64,0.08)",
                        color: activo ? "#556b2f" : "#b64040",
                      }}
                      onClick={() => actualizarLocal(row.id, "activo", !activo)}
                    >
                      {activo ? (
                        <ToggleRight size={20} />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                      {activo ? "Activo" : "Inactivo"}
                    </button>
                  </div>

                  <div style={S.grid}>
                    <label style={S.field}>
                      <span style={S.label}>Tamaño</span>
                      <input
                        value={row.tamano || ""}
                        onChange={(e) =>
                          actualizarLocal(row.id, "tamano", e.target.value)
                        }
                        style={S.input}
                      />
                    </label>

                    <label style={S.field}>
                      <span style={S.label}>Cantidad</span>
                      <input
                        type="number"
                        value={row.cantidad ?? ""}
                        onChange={(e) =>
                          actualizarLocal(
                            row.id,
                            "cantidad",
                            e.target.value === ""
                              ? null
                              : Number(e.target.value)
                          )
                        }
                        style={S.input}
                      />
                    </label>

                    <label style={S.field}>
                      <span style={S.label}>Tipo</span>
                      <input
                        value={row.tipo || ""}
                        onChange={(e) =>
                          actualizarLocal(row.id, "tipo", e.target.value)
                        }
                        style={S.input}
                      />
                    </label>

                    <label style={S.field}>
                      <span style={S.label}>Papel</span>
                      <input
                        value={row.papel || ""}
                        onChange={(e) =>
                          actualizarLocal(row.id, "papel", e.target.value)
                        }
                        style={S.input}
                      />
                    </label>

                    <label style={S.field}>
                      <span style={S.label}>Precio base</span>
                      <div style={S.moneyInputWrap}>
                        <DollarSign size={16} color="#b49d71" />
                        <input
                          type="number"
                          value={row.precio_base ?? ""}
                          onChange={(e) =>
                            actualizarLocal(
                              row.id,
                              "precio_base",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          style={S.moneyInput}
                        />
                      </div>
                    </label>

                    <label style={S.field}>
                      <span style={S.label}>Aumento urgente</span>
                      <div style={S.moneyInputWrap}>
                        <DollarSign size={16} color="#b49d71" />
                        <input
                          type="number"
                          value={row.aumento_urgente ?? ""}
                          onChange={(e) =>
                            actualizarLocal(
                              row.id,
                              "aumento_urgente",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          style={S.moneyInput}
                        />
                      </div>
                    </label>

                    <label style={S.field}>
                      <span style={S.label}>Aumento Kenfor</span>
                      <div style={S.moneyInputWrap}>
                        <DollarSign size={16} color="#b49d71" />
                        <input
                          type="number"
                          value={row.aumento_kenfor ?? ""}
                          onChange={(e) =>
                            actualizarLocal(
                              row.id,
                              "aumento_kenfor",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          style={S.moneyInput}
                        />
                      </div>
                    </label>

                    <div style={S.totalBox}>
                      <span style={S.label}>Vista rápida</span>
                      <strong>{money(row.precio_base)}</strong>
                    </div>
                  </div>

                  <div style={S.footer}>
                    <button
                      type="button"
                      onClick={() => guardarPrecio(row)}
                      disabled={savingId === row.id}
                      style={S.saveBtn}
                    >
                      <Save size={17} />
                      {savingId === row.id ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!loading && filteredRows.length === 0 ? (
            <div style={S.empty}>No encontré precios con esa búsqueda.</div>
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
                  <h2 style={S.modalTitle}>Nuevo paquete</h2>
                  <p style={S.modalSub}>
                    Agrega un tamaño o variante nueva al catálogo.
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
                  <span style={S.label}>Tamaño</span>
                  <input
                    value={nuevo.tamano}
                    onChange={(e) =>
                      setNuevo((p) => ({ ...p, tamano: e.target.value }))
                    }
                    placeholder="Ej. INFANTIL"
                    style={S.input}
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>Cantidad</span>
                  <input
                    type="number"
                    value={nuevo.cantidad}
                    onChange={(e) =>
                      setNuevo((p) => ({ ...p, cantidad: e.target.value }))
                    }
                    placeholder="Ej. 6"
                    style={S.input}
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>Tipo</span>
                  <input
                    value={nuevo.tipo}
                    onChange={(e) =>
                      setNuevo((p) => ({ ...p, tipo: e.target.value }))
                    }
                    placeholder="Ej. COLOR"
                    style={S.input}
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>Papel</span>
                  <input
                    value={nuevo.papel}
                    onChange={(e) =>
                      setNuevo((p) => ({ ...p, papel: e.target.value }))
                    }
                    placeholder="Ej. MATE"
                    style={S.input}
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>Precio base</span>
                  <div style={S.moneyInputWrap}>
                    <DollarSign size={16} color="#b49d71" />
                    <input
                      type="number"
                      value={nuevo.precio_base}
                      onChange={(e) =>
                        setNuevo((p) => ({
                          ...p,
                          precio_base: e.target.value,
                        }))
                      }
                      placeholder="0"
                      style={S.moneyInput}
                    />
                  </div>
                </label>

                <label style={S.field}>
                  <span style={S.label}>Aumento urgente</span>
                  <div style={S.moneyInputWrap}>
                    <DollarSign size={16} color="#b49d71" />
                    <input
                      type="number"
                      value={nuevo.aumento_urgente}
                      onChange={(e) =>
                        setNuevo((p) => ({
                          ...p,
                          aumento_urgente: e.target.value,
                        }))
                      }
                      placeholder="0"
                      style={S.moneyInput}
                    />
                  </div>
                </label>

                <label style={S.field}>
                  <span style={S.label}>Aumento Kenfor</span>
                  <div style={S.moneyInputWrap}>
                    <DollarSign size={16} color="#b49d71" />
                    <input
                      type="number"
                      value={nuevo.aumento_kenfor}
                      onChange={(e) =>
                        setNuevo((p) => ({
                          ...p,
                          aumento_kenfor: e.target.value,
                        }))
                      }
                      placeholder="0"
                      style={S.moneyInput}
                    />
                  </div>
                </label>

                <button
                  type="button"
                  style={{
                    ...S.modalActiveBtn,
                    background: nuevo.activo
                      ? "rgba(85,107,47,0.10)"
                      : "rgba(182,64,64,0.08)",
                    color: nuevo.activo ? "#556b2f" : "#b64040",
                  }}
                  onClick={() => setNuevo((p) => ({ ...p, activo: !p.activo }))}
                >
                  {nuevo.activo ? (
                    <ToggleRight size={21} />
                  ) : (
                    <ToggleLeft size={21} />
                  )}
                  {nuevo.activo ? "Activo" : "Inactivo"}
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
                  onClick={crearPaquete}
                  disabled={creando}
                >
                  <Save size={17} />
                  {creando ? "Guardando..." : "Guardar paquete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .spin { animation: spinConfig 1s linear infinite; }
        @keyframes spinConfig {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 760px) {
          .config-price-grid {
            grid-template-columns: 1fr !important;
          }
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
    maxWidth: 1200,
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
    border: "1px solid rgba(255,255,255,0.12)",
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
    boxShadow: "0 14px 30px rgba(0,0,0,0.035)",
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
    boxShadow: "0 14px 28px rgba(180,157,113,0.24)",
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
  activeBtn: {
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
    gridTemplateColumns: "repeat(4, 1fr)",
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
  moneyInputWrap: {
    height: 48,
    borderRadius: 15,
    border: "1px solid #ece4d8",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0 10px",
    boxSizing: "border-box",
  },
  moneyInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 14,
    fontWeight: 900,
    color: "#1a1a1a",
    background: "transparent",
    minWidth: 0,
  },
  totalBox: {
    minHeight: 48,
    borderRadius: 15,
    border: "1px solid rgba(85,107,47,0.18)",
    background: "rgba(85,107,47,0.07)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
    padding: "8px 12px",
    color: "#556b2f",
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
    boxShadow: "0 12px 24px rgba(63,82,34,0.18)",
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
    width: "min(760px, 100%)",
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
  modalActiveBtn: {
    height: 48,
    borderRadius: 15,
    border: "1px solid #ece4d8",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
    alignSelf: "end",
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
    boxShadow: "0 12px 24px rgba(63,82,34,0.18)",
  },
};
