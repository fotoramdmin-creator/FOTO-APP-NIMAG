import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (authError) throw new Error("Credenciales incorrectas");

      const { data: profile } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single();

      setUserData(profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (userData) {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          style={styles.successCard}
        >
          <CheckCircle2
            size={isMobile ? 60 : 80}
            color="#556b2f"
            style={{ margin: "0 auto 20px" }}
          />
          <h2 style={styles.titlePrata}>¡Bienvenido!</h2>
          <p style={styles.sessionText}>{userData.nombre}</p>
          <button
            onClick={() => window.location.reload()}
            style={styles.buttonLogout}
          >
            CERRAR SESIÓN
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* PANEL IZQUIERDO SOLO EN PC */}
      {!isMobile && (
        <div style={styles.splitLeft}>
          <div style={styles.leftContent}>
            <Camera
              size={40}
              color="#fffcf0"
              style={{ marginBottom: "20px" }}
            />
            <h2 style={styles.leftTitle}>Capturando la Esencia</h2>
            <p style={styles.leftSubtitle}>
              Desde 1990, transformando momentos en legado.
            </p>
          </div>
          <div style={styles.gradientOverlay} />
        </div>
      )}

      {/* PANEL DE FORMULARIO */}
      <div
        style={{
          ...styles.loginPanel,
          width: isMobile ? "100%" : "50%",
          padding: isMobile ? "20px" : "60px 8%",
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          style={{
            ...styles.formContainer,
            maxWidth: isMobile ? "420px" : "480px",
            backgroundColor: isMobile ? "#fff" : "transparent",
            boxShadow: isMobile
              ? "0 15px 35px rgba(85, 107, 47, 0.12)"
              : "none",
            padding: isMobile ? "40px 30px" : "0",
          }}
        >
          <header
            style={{
              textAlign: isMobile ? "center" : "left",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                ...styles.logoPlaceholder,
                margin: isMobile ? "0 auto 15px" : "0 0 20px 0",
              }}
            >
              <img
                src="/CDR.png"
                alt="Logo"
                style={{ width: isMobile ? "240px" : "300px" }}
              />
            </div>
            <h1
              style={{
                ...styles.titlePrata,
                fontSize: isMobile ? "26px" : "32px",
              }}
            >
              Foto Estudio Ramírez
            </h1>
            <p style={styles.subtitle}>Inicia sesión para continuar</p>
          </header>

          <form onSubmit={handleLogin} style={styles.form}>
            <motion.div variants={itemVariants} style={styles.inputGroup}>
              <Mail size={18} style={styles.icon} />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} style={styles.inputGroup}>
              <Lock size={18} style={styles.icon} />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={styles.errorBox}
                >
                  <AlertCircle size={16} /> <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02, backgroundColor: "#637d37" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              style={styles.buttonSubmit}
            >
              {loading ? (
                <Loader2 className="spinner" size={20} />
              ) : (
                "INICIAR SESIÓN"
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: "flex", minHeight: "100vh", width: "100vw" },
  splitLeft: {
    width: "50%",
    backgroundColor: "#1a1a1a",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1470')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(135deg, rgba(184, 134, 11, 0.4) 0%, rgba(85, 107, 47, 0.6) 100%)",
    zIndex: 1,
  },
  leftContent: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    color: "#fffcf0",
    padding: "40px",
  },
  leftTitle: {
    fontFamily: "'Prata', serif",
    fontSize: "40px",
    fontStyle: "italic",
    marginBottom: "10px",
  },
  leftSubtitle: { fontSize: "16px", fontWeight: 300, opacity: 0.9 },
  loginPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: { width: "100%", borderRadius: "28px" },
  logoPlaceholder: { display: "flex" },
  titlePrata: {
    fontFamily: "'Prata', serif",
    color: "#1a1a1a",
    fontStyle: "italic",
    margin: "5px 0",
  },
  subtitle: { fontSize: "14px", color: "#888" },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    width: "100%",
  },
  inputGroup: { position: "relative", display: "flex", alignItems: "center" },
  icon: { position: "absolute", left: "15px", color: "#556b2f" },
  input: {
    width: "100%",
    padding: "16px 16px 16px 45px",
    borderRadius: "12px",
    border: "1.5px solid #eee",
    fontSize: "16px",
    outline: "none",
    backgroundColor: "#fafafa",
    transition: "0.3s",
  },
  buttonSubmit: {
    backgroundColor: "#556b2f",
    color: "#fff",
    padding: "16px",
    borderRadius: "12px",
    border: "none",
    fontSize: "15px",
    fontWeight: 600,
    letterSpacing: "1px",
    cursor: "pointer",
    boxShadow: "0 5px 15px rgba(85, 107, 47, 0.2)",
    marginTop: "10px",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#c53030",
    fontSize: "13px",
    backgroundColor: "#fff5f5",
    padding: "10px",
    borderRadius: "10px",
  },
  successCard: {
    backgroundColor: "#fff",
    padding: "50px",
    borderRadius: "28px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  sessionText: { fontSize: "20px", color: "#333", marginBottom: "20px" },
  buttonLogout: {
    backgroundColor: "#4B0082",
    color: "#fff",
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Login;
