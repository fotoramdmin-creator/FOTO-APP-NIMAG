import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Clock3,
  Facebook,
  Gift,
  ImageIcon,
  Instagram,
  MonitorPlay,
  QrCode,
  Smartphone,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

type PantallaContenido = {
  id: string;
  titulo: string | null;
  tipo: "imagen" | "video" | "catalogo";
  url: string | null;
  miniatura: string | null;
  activo: boolean | null;
  orden: number | null;
  duracion: number | null;
  categoria: string | null;
  subcategoria: string | null;
};

type PedidoTurno = {
  id: string;
  cliente_nombre: string | null;
  fecha_creacion: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  urgente: boolean | null;
  cerrado?: boolean | null;
  entregado?: boolean | null;
  detalles_pedido?: {
    id: string;
    n_toma: string | null;
    tamano: string | null;
    tipo: string | null;
    cantidad: number | null;
  }[];
};

export default function PantallaTV() {
  const [contenido, setContenido] = useState<PantallaContenido[]>([]);
  const [turnos, setTurnos] = useState<PedidoTurno[]>([]);
  const [indexActivo, setIndexActivo] = useState(0);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [hora, setHora] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const contenidoFiltrado = categoriaActiva
    ? contenido.filter((item) => item.categoria === categoriaActiva)
    : contenido;
  const contenidoActivo = contenidoFiltrado[indexActivo];

  const categorias = [
    { titulo: "GRADUACIONES", img: "" },
    { titulo: "BODAS", img: "" },
    { titulo: "XV AÑOS", img: "" },
    { titulo: "RECIÉN NACIDOS", img: "" },
    { titulo: "PROMOCIONES", img: "" },
    { titulo: "COMUNION", img: "" },
  ];

  const cargarContenido = async () => {
    const { data, error } = await supabase
      .from("pantalla_contenido")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (!error && data) {
      setContenido(data as PantallaContenido[]);
    }
  };

  const cargarTurnos = async () => {
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        `
        id,
        cliente_nombre,
        fecha_creacion,
        fecha_entrega,
        horario_entrega,
        urgente,
        cerrado,
        entregado,
        detalles_pedido (
          id,
          n_toma,
          tamano,
          tipo,
          cantidad
        )
      `
      )
      .eq("cerrado", false)
      .eq("entregado", false)
      .order("fecha_creacion", { ascending: true })
      .limit(12);

    if (!error && data) {
      const pendientes = (data as PedidoTurno[]).filter((pedido) =>
        pedido.detalles_pedido?.some((detalle) => !detalle.n_toma)
      );

      setTurnos(pendientes);
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      setLoading(true);
      await Promise.all([cargarContenido(), cargarTurnos()]);
      setLoading(false);
    };

    iniciar();

    const turnosInterval = setInterval(cargarTurnos, 10000);
    const horaInterval = setInterval(() => setHora(new Date()), 1000);

    return () => {
      clearInterval(turnosInterval);
      clearInterval(horaInterval);
    };
  }, []);

  useEffect(() => {
    if (contenidoFiltrado.length <= 1) return;

    const duracion = (contenidoActivo?.duracion || 25) * 1000;

    const timer = setInterval(() => {
      setIndexActivo((prev) => (prev + 1) % contenidoFiltrado.length);
    }, duracion);

    return () => clearInterval(timer);
  }, [contenidoFiltrado.length, contenidoActivo?.id]);

  useEffect(() => {
    setIndexActivo(0);
  }, [categoriaActiva]);

  const turnoActual = turnos[0];
  const espera = useMemo(() => turnos.slice(1, 6), [turnos]);

  const horaTexto = hora.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={styles.screen}>
      <div style={styles.shell}>
        <section style={styles.leftPanel}>
          <div>
            <div style={styles.logoRealWrap}>
              <img
                src="/logo-pantalla.png"
                alt="Foto Studio Ramírez"
                style={styles.logoReal}
              />
            </div>
          </div>

          <div style={styles.sloganBox}>
            <div style={styles.sloganSmall}>RECUERDOS QUE DURAN</div>
            <div style={styles.sloganGold}>TODA LA VIDA</div>
          </div>

          <div style={styles.services}>
            <div style={styles.serviceItem}>
              <Camera size={26} />
              <span>FOTOGRAFÍA PROFESIONAL</span>
            </div>
          </div>
        </section>

        <main style={styles.center}>
          <section style={styles.hero}>
            <AnimatePresence mode="wait">
              <motion.div
                key={contenidoActivo?.id || "empty"}
                style={styles.heroMediaWrap}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 1 }}
              >
                {loading ? (
                  <div style={styles.emptyHero}>Cargando contenido...</div>
                ) : contenidoActivo?.url ? (
                  contenidoActivo.tipo === "video" ? (
                    <video
                      src={contenidoActivo.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={styles.heroMedia}
                    />
                  ) : contenidoActivo?.url?.toLowerCase().endsWith(".mp4") ? (
                    <video
                      src={contenidoActivo.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={styles.heroMedia}
                    />
                  ) : (
                    <img
                      src={contenidoActivo.url}
                      alt={contenidoActivo.titulo || "Pantalla"}
                      style={styles.heroMedia}
                    />
                  )
                ) : (
                  <div style={styles.previewHero}>
                    <Sparkles size={64} />
                    <h1>Foto Studio Ramírez</h1>
                    <p>
                      Vista lista. Sube imágenes o videos a Supabase para llenar
                      el carrusel.
                    </p>
                  </div>
                )}

                <div style={styles.heroGradient} />
              </motion.div>
            </AnimatePresence>

            <div style={styles.dots}>
              {(contenido.length ? contenido : [1, 2, 3, 4, 5])
                .slice(0, 5)
                .map((item: any, i) => (
                  <span
                    key={item.id || i}
                    style={{
                      ...styles.dot,
                      background:
                        i === indexActivo
                          ? "#d7b65d"
                          : "rgba(255,255,255,0.55)",
                    }}
                  />
                ))}
            </div>
          </section>

          <section style={styles.categoryGrid}>
            {categorias.map((cat) => (
              <motion.button
                key={cat.titulo}
                type="button"
                onClick={() => {
                  setCategoriaActiva(cat.titulo);
                  setIndexActivo(0);

                  setTimeout(() => {
                    setCategoriaActiva(null);
                    setIndexActivo(0);
                  }, 60000);
                }}
                style={{
                  ...styles.categoryCard,
                  border:
                    categoriaActiva === cat.titulo
                      ? "2px solid #f4d67a"
                      : "1px solid rgba(215,182,93,0.13)",
                  boxShadow:
                    categoriaActiva === cat.titulo
                      ? "0 0 28px rgba(244,214,122,0.35)"
                      : "none",
                  cursor: "pointer",
                }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.96 }}
              >
                <div style={styles.categoryImage}>
                  <MonitorPlay size={34} />
                </div>

                <div style={styles.categoryTitle}>{cat.titulo}</div>

                <div style={styles.categoryLine} />
              </motion.button>
            ))}
          </section>

          <footer style={styles.footer}>
            <div style={styles.footerItem}>
              <Clock3 size={24} />
              <div>
                <span>AGENDA TU CITA</span>
                <strong>(722) 2-15-27-11</strong>
              </div>
            </div>

            <div style={styles.social}>
              <span>SÍGUENOS EN NUESTRAS REDES</span>
              <Facebook size={24} />
              <Instagram size={24} />
              <span style={styles.tiktok}>♪</span>
            </div>
          </footer>
        </main>

        <aside style={styles.rightPanel}>
          <section style={styles.turnosBox}>
            <div style={styles.turnosHeader}>
              <Clock3 size={32} />
              <div>
                <h2>TURNOS</h2>
                <p>EN ORDEN DE LLEGADA</p>
              </div>
            </div>

            <motion.div
              style={styles.turnoActualBox}
              animate={{
                boxShadow: [
                  "0 0 18px rgba(215,182,93,0.18)",
                  "0 0 50px rgba(244,214,122,0.65)",
                  "0 0 18px rgba(215,182,93,0.18)",
                ],
                scale: [1, 1.025, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <p>TURNO ACTUAL</p>

              <h1
                style={{
                  fontSize: "72px",
                  margin: "10px 0",
                  color: "#f4d67a",
                  fontWeight: 900,
                  letterSpacing: 2,
                  textShadow: "0 0 25px rgba(244,214,122,0.35)",
                }}
              >
                {turnoActual ? "A001" : "---"}
              </h1>

              <h3
                style={{
                  fontSize: "30px",
                  color: "#fff",
                  marginTop: 10,
                  fontWeight: 700,
                }}
              >
                {turnoActual?.cliente_nombre || "Sin turno activo"}
              </h3>
            </motion.div>

            <div style={styles.esperaTitle}>EN ESPERA</div>

            <div style={styles.esperaList}>
              {espera.length > 0 ? (
                espera.map((pedido, i) => (
                  <div key={pedido.id} style={styles.esperaRow}>
                    <strong>A{String(i + 2).padStart(3, "0")}</strong>
                    <span>{pedido.cliente_nombre || "Cliente"}</span>
                  </div>
                ))
              ) : (
                <div style={styles.noTurnos}>No hay clientes en espera.</div>
              )}
            </div>
          </section>

          <section style={styles.qrBox}>
            <h3>
              ESCANEA PARA VER <br />
              <span>NUESTROS CATÁLOGOS</span>
            </h3>

            <div style={styles.qrFake}>
              <QrCode size={130} />
            </div>

            <div style={styles.qrBenefits}>
              <div>
                <Gift size={18} /> PAQUETES
              </div>
              <div>
                <Sparkles size={18} /> PROMOCIONES
              </div>
              <div>
                <ImageIcon size={18} /> CATÁLOGOS
              </div>
            </div>

            <div style={styles.phoneLine}>
              <Smartphone size={24} />
              <span>Desde tu celular fácil y rápido</span>
            </div>
          </section>

          <section style={styles.bottomInfo}>
            <span>☁️ 28°C</span>
            <span>|</span>
            <span>{horaTexto}</span>
          </section>
        </aside>
      </div>
    </div>
  );
}

const gold = "#d7b65d";
const softGold = "#f1d589";

const styles: { [key: string]: React.CSSProperties } = {
  screen: {
    height: "100vh",
    width: "100vw",
    background: "#1b1b1b",
    color: "#fff",
    fontFamily: "'Montserrat', sans-serif",
    overflow: "hidden",
    padding: 0,
    margin: 0,
    boxSizing: "border-box",
  },

  shell: {
    height: "100vh",
    width: "100vw",
    display: "grid",
    gridTemplateColumns: "12% 73% 15%",
    background: "#020202",
    border: "1px solid rgba(215,182,93,0.18)",
    boxShadow: "0 28px 70px rgba(0,0,0,0.7)",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  leftPanel: {
    padding: "2vh 1.5vw",
    borderRight: "1px solid rgba(215,182,93,0.18)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    background:
      "radial-gradient(circle at center, rgba(215,182,93,0.22), transparent 35%), linear-gradient(135deg, #0a0a0a 0%, #000000 35%, #141414 100%)",
  },

  logoRealWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "3vh",
    paddingBottom: "1vh",
  },

  logoReal: {
    width: "100%",
    maxWidth: "92%",
    objectFit: "contain",
    filter: "drop-shadow(0 0 20px rgba(215,182,93,0.22))",
  },

  sloganBox: {
    borderLeft: `1px solid rgba(215,182,93,0.28)`,
    paddingLeft: "1vw",
    marginTop: "-2vh",
    marginBottom: "3vh",
  },

  sloganSmall: {
    fontSize: "clamp(10px, 0.75vw, 14px)",
    letterSpacing: "0.12vw",
    color: "#d8d8d8",
    lineHeight: 1.3,
  },

  sloganGold: {
    color: gold,
    fontFamily: "'Vidaloka', serif",
    fontSize: "clamp(17px, 1.35vw, 28px)",
    lineHeight: 1.1,
    marginTop: "0.4vh",
  },

  services: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1.2vh",
    color: gold,
  },

  serviceItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.7vw",
    fontSize: "clamp(10px, 0.75vw, 14px)",
    letterSpacing: "0.08vw",
    color: "#ddd",
  },

  center: {
    display: "grid",
    gridTemplateRows: "1fr 18% 7%",
    minWidth: 0,
    overflow: "hidden",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid rgba(215,182,93,0.18)",
    background: "#000",
  },

  heroMediaWrap: {
    position: "absolute",
    inset: 0,
  },

  heroMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  heroGradient: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(90deg, rgba(0,0,0,0.10), transparent 40%), linear-gradient(0deg, rgba(0,0,0,0.22), transparent 35%)",
  },

  heroText: {
    position: "absolute",
    left: "2.5vw",
    bottom: "4vh",
  },

  emptyHero: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: gold,
    fontSize: "clamp(16px, 1.2vw, 24px)",
  },

  previewHero: {
    height: "100%",
    background:
      "radial-gradient(circle at center, rgba(215,182,93,0.22), transparent 45%), linear-gradient(135deg, #111, #000)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: softGold,
    textAlign: "center",
    padding: "4vh 4vw",
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    padding: "1vh 0.8vw",
    gap: "0.5vw",
    background: "#050505",
    borderBottom: "1px solid rgba(215,182,93,0.18)",
    overflow: "hidden",
  },

  categoryCard: {
    background: "linear-gradient(180deg, #151515, #070707)",
    border: "1px solid rgba(215,182,93,0.13)",
    borderRadius: "0.6vw",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryImage: {
    width: "100%",
    flex: 1,
    minHeight: "8vh",
    background:
      "radial-gradient(circle at center, rgba(215,182,93,0.18), transparent 55%), #111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: gold,
  },

  categoryTitle: {
    paddingTop: "0.8vh",
    fontSize: "clamp(11px, 0.85vw, 16px)",
    color: "#fff",
    textAlign: "center",
  },

  categoryLine: {
    width: "1.6vw",
    height: "0.3vh",
    background: gold,
    margin: "0.8vh 0 1vh",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2vw",
    background: "#030303",
    overflow: "hidden",
  },

  footerItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.8vw",
    color: gold,
    fontSize: "clamp(10px, 0.8vw, 15px)",
  },

  social: {
    display: "flex",
    alignItems: "center",
    gap: "1vw",
    color: gold,
    fontSize: "clamp(10px, 0.8vw, 15px)",
    letterSpacing: "0.12vw",
  },

  tiktok: {
    fontSize: "clamp(18px, 1.5vw, 28px)",
    color: gold,
    fontWeight: 800,
  },

  rightPanel: {
    borderLeft: "1px solid rgba(215,182,93,0.18)",
    padding: "1vh 0.8vw",
    display: "grid",
    gridTemplateRows: "1fr 23% 6%",
    gap: "1vh",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, #3f5222 0%, #2c3a17 45%, #121212 100%)",
  },

  turnosBox: {
    background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.65))",
    border: "1px solid rgba(215,182,93,0.28)",
    borderRadius: "0.9vw",
    padding: "1.5vh 1vw",
    boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
    backdropFilter: "blur(12px)",
    overflow: "hidden",
  },

  turnosHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.7vw",
    color: gold,
    marginBottom: "1.5vh",
  },

  turnoActualBox: {
    border: `1px solid ${gold}`,
    borderRadius: "0.7vw",
    padding: "1vh 0.8vw",
    textAlign: "center",
    marginBottom: "1.2vh",
  },

  esperaTitle: {
    textAlign: "center",
    color: "#ddd",
    fontSize: "clamp(10px, 0.75vw, 14px)",
    marginBottom: "0.8vh",
  },

  esperaList: {
    background: "#0b0b0b",
    borderRadius: "0.5vw",
    overflow: "hidden",
  },

  esperaRow: {
    display: "grid",
    gridTemplateColumns: "28% 1fr",
    padding: "0.8vh 0.6vw",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontSize: "clamp(11px, 0.8vw, 15px)",
  },

  noTurnos: {
    padding: "1vh 0.6vw",
    color: "#999",
    fontSize: "clamp(10px, 0.75vw, 14px)",
    textAlign: "center",
  },

  qrBox: {
    background: "linear-gradient(180deg, #0d0d0d, #040404)",
    border: "1px solid rgba(215,182,93,0.18)",
    borderRadius: "0.6vw",
    padding: "1vh 0.8vw",
    overflow: "hidden",
  },

  qrFake: {
    width: "7vw",
    height: "7vw",
    minWidth: 80,
    minHeight: 80,
    background: "#fff",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    float: "left",
    marginRight: "0.8vw",
  },

  qrBenefits: {
    color: "#ddd",
    fontSize: "clamp(9px, 0.65vw, 12px)",
    display: "grid",
    gap: "0.6vh",
  },

  phoneLine: {
    clear: "both",
    display: "flex",
    alignItems: "center",
    gap: "0.6vw",
    color: "#ddd",
    marginTop: "1vh",
    fontSize: "clamp(10px, 0.75vw, 14px)",
  },

  bottomInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1vw",
    fontSize: "clamp(13px, 1vw, 20px)",
    color: "#ddd",
  },

  dot: {
    width: "0.55vw",
    height: "0.55vw",
    minWidth: 7,
    minHeight: 7,
    borderRadius: 20,
    display: "block",
  },

  dots: {
    position: "absolute",
    bottom: "2vh",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "0.6vw",
    zIndex: 3,
  },
};
