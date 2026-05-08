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
  Users,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type UsuarioRow = {
  id: string;
  nombre: string | null;
  admin: boolean | null;
  puede_elegir_usuario: boolean | null;
  auth_user_id?: string | null;
  activo: boolean | null;
};

type Props = {
  onBack: () => void;
};

const nuevoVacio = {
  nombre: "",
  admin: false,
  puede_elegir_usuario: false,
  activo: true,
};

export default function ConfigUsuarios({ onBack }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevo, setNuevo] = useState(nuevoVacio);
  const [creando, setCreando] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("usuarios")
        .select("id,nombre,admin,puede_elegir_usuario,auth_user_id,activo")
        .order("nombre", { ascending: true });

      if (error) throw error;

      setUsuarios((Array.isArray(data) ? data : []) as UsuarioRow[]);
    } catch (error: any) {
      alert(error?.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const filteredUsuarios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usuarios;

    return usuarios.filter((u) =>
      `${u.nombre || ""} ${u.admin ? "admin" : ""} ${
        u.puede_elegir_usuario ? "empresa" : ""
      } ${u.activo ? "activo" : "inactivo"}`
        .toLowerCase()
        .includes(q)
    );
  }, [usuarios, search]);

  const actualizarLocal = (
    id: string,
    campo: keyof UsuarioRow,
    valor: string | boolean | null
  ) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [campo]: valor } : u))
    );
  };

  const guardarUsuario = async (usuario: UsuarioRow) => {
    try {
      if (!usuario.nombre?.trim()) {
        alert("El usuario necesita nombre");
        return;
      }

      setSavingId(usuario.id);

      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre: usuario.nombre.trim().toUpperCase(),
          admin: usuario.admin === true,
          puede_elegir_usuario: usuario.puede_elegir_usuario === true,
          activo: usuario.activo === true,
        })
        .eq("id", usuario.id);

      if (error) throw error;

      await cargarUsuarios();
    } catch (error: any) {
      alert(error?.message || "No se pudo guardar el usuario");
    } finally {
      setSavingId(null);
    }
  };

  const crearUsuario = async () => {
    try {
      if (!nuevo.nombre.trim()) {
        alert("Escribe el nombre del usuario");
        return;
      }

      setCreando(true);

      const { error } = await supabase.from("usuarios").insert({
        nombre: nuevo.nombre.trim().toUpperCase(),
        admin: nuevo.admin,
        puede_elegir_usuario: nuevo.puede_elegir_usuario,
        activo: nuevo.activo,
      });

      if (error) throw error;

      setNuevo(nuevoVacio);
      setModalNuevo(false);
      await cargarUsuarios();
    } catch (error: any) {
      alert(error?.message || "No se pudo crear el usuario");
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
              onClick={cargarUsuarios}
              style={S.refreshBtn}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          <div style={S.heroBody}>
            <div style={S.heroIcon}>
              <Users size={30} color="#fff" />
            </div>

            <div>
              <h1 style={S.title}>Usuarios</h1>
              <p style={S.subtitle}>
                Crea usuarios internos y controla permisos sin borrar historial.
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
              placeholder="Buscar usuario, admin, activo..."
              style={S.searchInput}
            />
          </div>

          <button
            type="button"
            style={S.newBtn}
            onClick={() => setModalNuevo(true)}
          >
            <Plus size={18} />
            Nuevo usuario
          </button>
        </div>

        <div style={S.list}>
          <AnimatePresence>
            {filteredUsuarios.map((usuario, index) => {
              const activo = usuario.activo === true;
              const admin = usuario.admin === true;
              const puedeElegir = usuario.puede_elegir_usuario === true;

              return (
                <motion.div
                  key={usuario.id}
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
                        {usuario.nombre || "SIN NOMBRE"}
                      </div>
                      <div style={S.cardSub}>
                        {admin ? "ADMIN" : "USUARIO"} ·{" "}
                        {puedeElegir
                          ? "EMPRESA / ELIGE USUARIO"
                          : "USUARIO FIJO"}{" "}
                        · {activo ? "ACTIVO" : "INACTIVO"}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        ...S.statusBtn,
                        background: activo
                          ? "rgba(85,107,47,0.10)"
                          : "rgba(182,64,64,0.08)",
                        color: activo ? "#556b2f" : "#b64040",
                      }}
                      onClick={() =>
                        actualizarLocal(usuario.id, "activo", !activo)
                      }
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
                      <span style={S.label}>Nombre</span>
                      <input
                        value={usuario.nombre || ""}
                        onChange={(e) =>
                          actualizarLocal(usuario.id, "nombre", e.target.value)
                        }
                        style={S.input}
                      />
                    </label>

                    <button
                      type="button"
                      style={{
                        ...S.optionBtn,
                        background: admin ? "rgba(85,107,47,0.10)" : "#fff",
                        color: admin ? "#556b2f" : "#8b867d",
                      }}
                      onClick={() =>
                        actualizarLocal(usuario.id, "admin", !admin)
                      }
                    >
                      <ShieldCheck size={18} />
                      Admin
                      {admin ? (
                        <ToggleRight size={20} />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>

                    <button
                      type="button"
                      style={{
                        ...S.optionBtn,
                        background: puedeElegir
                          ? "rgba(47,93,80,0.10)"
                          : "#fff",
                        color: puedeElegir ? "#2f5d50" : "#8b867d",
                      }}
                      onClick={() =>
                        actualizarLocal(
                          usuario.id,
                          "puede_elegir_usuario",
                          !puedeElegir
                        )
                      }
                    >
                      <Users size={18} />
                      Puede elegir
                      {puedeElegir ? (
                        <ToggleRight size={20} />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>

                    <div style={S.infoBox}>
                      <span style={S.label}>Auth</span>
                      <strong>
                        {usuario.auth_user_id ? "Vinculado" : "Sin login"}
                      </strong>
                    </div>
                  </div>

                  <div style={S.footer}>
                    <button
                      type="button"
                      onClick={() => guardarUsuario(usuario)}
                      disabled={savingId === usuario.id}
                      style={S.saveBtn}
                    >
                      <Save size={17} />
                      {savingId === usuario.id
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!loading && filteredUsuarios.length === 0 ? (
            <div style={S.empty}>No encontré usuarios con esa búsqueda.</div>
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
                  <h2 style={S.modalTitle}>Nuevo usuario</h2>
                  <p style={S.modalSub}>
                    Esto crea un usuario interno. Si necesita iniciar sesión,
                    después lo vinculamos a Supabase Auth.
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
                    placeholder="Ej. IVAN"
                    style={S.input}
                  />
                </label>

                <button
                  type="button"
                  style={{
                    ...S.optionBtn,
                    background: nuevo.admin ? "rgba(85,107,47,0.10)" : "#fff",
                    color: nuevo.admin ? "#556b2f" : "#8b867d",
                  }}
                  onClick={() => setNuevo((p) => ({ ...p, admin: !p.admin }))}
                >
                  <ShieldCheck size={18} />
                  Admin
                  {nuevo.admin ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                </button>

                <button
                  type="button"
                  style={{
                    ...S.optionBtn,
                    background: nuevo.puede_elegir_usuario
                      ? "rgba(47,93,80,0.10)"
                      : "#fff",
                    color: nuevo.puede_elegir_usuario ? "#2f5d50" : "#8b867d",
                  }}
                  onClick={() =>
                    setNuevo((p) => ({
                      ...p,
                      puede_elegir_usuario: !p.puede_elegir_usuario,
                    }))
                  }
                >
                  <Users size={18} />
                  Puede elegir
                  {nuevo.puede_elegir_usuario ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                </button>

                <button
                  type="button"
                  style={{
                    ...S.optionBtn,
                    background: nuevo.activo
                      ? "rgba(85,107,47,0.10)"
                      : "rgba(182,64,64,0.08)",
                    color: nuevo.activo ? "#556b2f" : "#b64040",
                  }}
                  onClick={() => setNuevo((p) => ({ ...p, activo: !p.activo }))}
                >
                  {nuevo.activo ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
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
                  onClick={crearUsuario}
                  disabled={creando}
                >
                  <Save size={17} />
                  {creando ? "Guardando..." : "Guardar usuario"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .spin { animation: spinUsuarios 1s linear infinite; }
        @keyframes spinUsuarios {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 760px) {
          .usuarios-grid {
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
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
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
  infoBox: {
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
    width: "min(720px, 100%)",
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
    boxShadow: "0 12px 24px rgba(63,82,34,0.18)",
  },
};
