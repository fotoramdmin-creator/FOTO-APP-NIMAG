import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";

type Usuario = {
  id: string;
  nombre: string | null;
  email: string | null;
  admin: boolean | null;
  activo: boolean | null;
};

type Props = {
  onBack: () => void;
};

export default function ConfigAccesos({ onBack }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const cargarUsuarios = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("usuarios")
        .select("id,nombre,email,admin,activo")
        .order("nombre", { ascending: true });

      if (error) throw error;

      setUsuarios((Array.isArray(data) ? data : []) as Usuario[]);
    } catch (error: any) {
      alert(error?.message || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const filtrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return usuarios;

    return usuarios.filter((u) =>
      `${u.nombre || ""} ${u.email || ""}`.toLowerCase().includes(q)
    );
  }, [usuarios, search]);

  const enviarRecuperacion = async (usuario: Usuario) => {
    try {
      if (!usuario.email) {
        alert("Este usuario no tiene email");
        return;
      }

      setSendingId(usuario.id);

      const { error } = await supabase.auth.resetPasswordForEmail(
        usuario.email,
        {
          redirectTo: "https://57xqc5.csb.app",
        }
      );

      if (error) throw error;

      alert("Correo enviado correctamente");
    } catch (error: any) {
      alert(error?.message || "No se pudo enviar el correo");
    } finally {
      setSendingId(null);
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
            <button onClick={onBack} style={S.backBtn}>
              <ArrowLeft size={18} />
              Regresar
            </button>

            <button onClick={cargarUsuarios} style={S.refreshBtn}>
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>

          <div style={S.heroBody}>
            <ShieldCheck size={30} color="#fff" />
            <div>
              <h1 style={S.title}>Accesos</h1>
              <p style={S.subtitle}>
                Envía recuperación de contraseña segura vía correo.
              </p>
            </div>
          </div>
        </motion.div>

        <div style={S.searchCard}>
          <Search size={18} color="#b49d71" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario o email..."
            style={S.searchInput}
          />
        </div>

        <div style={S.list}>
          <AnimatePresence>
            {filtrados.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                style={S.card}
              >
                <div style={S.cardTop}>
                  <div>
                    <div style={S.name}>{u.nombre}</div>
                    <div style={S.email}>
                      <Mail size={14} /> {u.email || "Sin email"}
                    </div>
                  </div>

                  <button
                    onClick={() => enviarRecuperacion(u)}
                    style={S.btn}
                    disabled={sendingId === u.id}
                  >
                    <Send size={16} />
                    {sendingId === u.id ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const S: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#fdfbf7",
    padding: 20,
    fontFamily: "Montserrat",
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
  },
  hero: {
    background: "linear-gradient(135deg,#556b2f,#3f5222)",
    borderRadius: 28,
    padding: 20,
    color: "#fff",
    marginBottom: 20,
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: 10,
    padding: "6px 12px",
    color: "#fff",
    cursor: "pointer",
  },
  refreshBtn: {
    background: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "6px 12px",
    cursor: "pointer",
  },
  heroBody: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: 26,
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    opacity: 0.8,
  },
  searchCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    borderRadius: 20,
    padding: 12,
    border: "1px solid #ece4d8",
    marginBottom: 16,
  },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
  },
  list: {
    display: "grid",
    gap: 12,
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    border: "1px solid #ece4d8",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: 800,
    fontSize: 16,
  },
  email: {
    fontSize: 13,
    color: "#777",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  btn: {
    background: "#556b2f",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "8px 14px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
};
