import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Bell, User, Hash, Zap } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function RecadosPanel({ recados, onBack, onRefresh }: any) {
  const marcarLeido = async (id: string) => {
    const { error } = await supabase
      .from("recados")
      .update({ leido: true })
      .eq("id", id);

    if (error) return;
    await onRefresh();
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND ELEMENTS PARA MAS VISTA */}
      <div style={styles.bgGlow} />

      <header style={styles.header}>
        <motion.button
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#b49d71" />
        </motion.button>
        <div style={styles.titleGroup}>
          <h2 style={styles.title}>
            Panel de <span style={styles.italic}>Recados</span>
          </h2>
          <div style={styles.statusLine}>
            <div style={styles.pulseDot} />
            <span style={styles.statusText}>{recados.length} pendientes</span>
          </div>
        </div>
      </header>

      <div style={styles.scrollArea}>
        <AnimatePresence mode="popLayout">
          {recados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.emptyCard}
            >
              <Zap size={40} color="#b49d71" />
              <p style={styles.emptyText}>¡Todo listo!</p>
            </motion.div>
          ) : (
            recados.map((r: any, i: number) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  x: 50,
                  scale: 0.9,
                  transition: { duration: 0.2 },
                }}
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 18,
                  delay: i * 0.08,
                }}
                style={styles.card}
              >
                {/* EFECTO DE LUZ QUE PASA POR LA TARJETA */}
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear",
                    repeatDelay: 1,
                  }}
                  style={styles.shimmer}
                />

                <div style={styles.cardTop}>
                  <span style={styles.badgeTipo}>{r.tipo || "RECADITO"}</span>
                  <div style={styles.userSection}>
                    <User size={14} />
                    <span>{r.usuario_nombre}</span>
                  </div>
                </div>

                <div style={styles.bodyGrid}>
                  <div style={styles.mensajeBox}>
                    <p style={styles.mensajeText}>{r.mensaje}</p>
                  </div>

                  {r.n_toma && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      style={styles.tomaBigContainer}
                    >
                      <span style={styles.tomaLabel}>TOMA</span>
                      <span style={styles.tomaNumber}>{r.n_toma}</span>
                    </motion.div>
                  )}
                </div>

                <div style={styles.footer}>
                  <div style={styles.timeTag}>Hoy, ahora</div>
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "#4a5d29" }}
                    whileTap={{ scale: 0.8 }}
                    style={styles.checkBtn}
                    onClick={() => marcarLeido(r.id)}
                  >
                    <Check size={22} strokeWidth={3} />
                    <span style={styles.checkLabel}>COMPLETAR</span>
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    padding: "25px 20px",
    background: "#fdfcf9", // Fondo aún más premium
    minHeight: "100vh",
    position: "relative",
    overflowX: "hidden",
    fontFamily: "'Inter', sans-serif",
  },
  bgGlow: {
    position: "fixed",
    top: "-100px",
    left: "-100px",
    width: "400px",
    height: "400px",
    background:
      "radial-gradient(circle, rgba(85,107,47,0.08) 0%, rgba(253,252,249,0) 70%)",
    zIndex: 0,
  },
  header: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "40px",
  },
  backBtn: {
    background: "#fff",
    border: "2px solid #f0ede4",
    padding: "12px",
    borderRadius: "18px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
    display: "flex",
  },
  titleGroup: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#1a1a1a",
    margin: 0,
    letterSpacing: "-1px",
  },
  italic: {
    fontStyle: "italic",
    color: "#b49d71",
    fontWeight: "400",
  },
  statusLine: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
  },
  pulseDot: {
    width: "8px",
    height: "8px",
    background: "#556b2f",
    borderRadius: "50%",
    boxShadow: "0 0 0 0 rgba(85,107,47, 0.7)",
    animation: "pulse 2s infinite", // Requiere CSS keyframes o animar con framer
  },
  statusText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  scrollArea: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "30px",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    border: "1px solid #f0ede4",
    boxShadow: "0 10px 30px rgba(180,157,113,0.1)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    width: "50%",
    height: "100%",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
    zIndex: 1,
    pointerEvents: "none",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  badgeTipo: {
    background: "#556b2f",
    color: "#fff",
    padding: "5px 12px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1px",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "13px",
    color: "#999",
    fontWeight: "600",
  },
  bodyGrid: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },
  mensajeBox: {
    flex: 1,
  },
  mensajeText: {
    fontSize: "17px",
    lineHeight: "1.4",
    color: "#333",
    fontWeight: "500",
    margin: 0,
  },
  tomaBigContainer: {
    background: "#1a1a1a",
    padding: "10px 15px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "80px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
  },
  tomaLabel: {
    fontSize: "9px",
    color: "#b49d71",
    fontWeight: "800",
    letterSpacing: "1px",
  },
  tomaNumber: {
    fontSize: "36px",
    fontWeight: "900",
    color: "#fff",
    lineHeight: "1",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f5f5f5",
    paddingTop: "15px",
  },
  timeTag: {
    fontSize: "12px",
    color: "#ccc",
    fontStyle: "italic",
  },
  checkBtn: {
    background: "#556b2f",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow: "0 5px 15px rgba(85,107,47,0.3)",
  },
  checkLabel: {
    fontSize: "12px",
    letterSpacing: "1px",
  },
  emptyCard: {
    padding: "100px 20px",
    textAlign: "center",
    background: "rgba(180,157,113,0.05)",
    borderRadius: "40px",
    border: "2px dashed #e5dec9",
  },
  emptyText: {
    marginTop: "15px",
    fontWeight: "700",
    color: "#b49d71",
    fontSize: "18px",
  },
};
