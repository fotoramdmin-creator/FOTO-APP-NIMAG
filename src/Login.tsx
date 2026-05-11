import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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

      if (authError) {
        throw new Error("Credenciales incorrectas");
      }

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
      <div style={styles.successContainer}>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          style={styles.successCard}
        >
          <CheckCircle2
            size={70}
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
    <div
      style={{
        ...styles.container,
        gridTemplateColumns: isMobile ? "1fr" : "50% 50%",
      }}
    >
      {/* PANEL IZQUIERDO */}
      {!isMobile && (
        <div style={styles.splitLeft}>
          <div style={styles.overlayDark} />
        </div>
      )}

      {/* PANEL DERECHO */}
      <div
        style={{
          ...styles.loginPanel,
          padding: isMobile ? "22px" : "40px 7%",
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          style={{
            ...styles.formContainer,
            maxWidth: isMobile ? "420px" : "500px",
            backgroundColor: isMobile ? "#fff" : "transparent",
            boxShadow: isMobile
              ? "0 15px 35px rgba(85, 107, 47, 0.12)"
              : "none",
            padding: isMobile ? "38px 28px" : "0",
          }}
        >
          <header style={styles.header}>
            <div
              style={{
                ...styles.logoPlaceholder,
                marginBottom: isMobile ? "22px" : "24px",
              }}
            >
              <img
                src="/LOGO.png?v=2"
                alt="Logo"
                style={{
                  width: isMobile ? "260px" : "340px",
                  maxWidth: "100%",
                  display: "block",
                }}
              />
            </div>

            <h1
              style={{
                ...styles.titlePrata,
                fontSize: isMobile ? "32px" : "42px",
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
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                backgroundColor: "#637d37",
              }}
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
  container: {
    display: "grid",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#f8f6f1",
    overflow: "hidden",
  },

  splitLeft: {
    position: "relative",
    minHeight: "100vh",

    /* NUEVA IMAGEN */
    backgroundImage: "url('/antua2.png')",

    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
  },

  overlayDark: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to right, rgba(0,0,0,0.10), rgba(0,0,0,0.05))",
    pointerEvents: "none",
  },

  loginPanel: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f6f1",
  },

  formContainer: {
    width: "100%",
    borderRadius: "28px",
  },

  header: {
    textAlign: "center",
    marginBottom: "30px",
  },

  logoPlaceholder: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  titlePrata: {
    fontFamily: "'Prata', serif",
    color: "#161616",
    fontStyle: "italic",
    margin: "0",
    lineHeight: 1.08,
    textAlign: "center",
  },

  subtitle: {
    fontSize: "15px",
    color: "#7b7b7b",
    marginTop: "12px",
    textAlign: "center",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
  },

  inputGroup: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  icon: {
    position: "absolute",
    left: "16px",
    color: "#556b2f",
  },

  input: {
    width: "100%",
    padding: "18px 18px 18px 50px",
    borderRadius: "16px",
    border: "1.5px solid #ececec",
    fontSize: "16px",
    outline: "none",
    backgroundColor: "#ffffff",
    transition: "0.3s",
    color: "#1a1a1a",
  },

  buttonSubmit: {
    background: "linear-gradient(135deg, #556b2f 0%, #6b8440 100%)",
    color: "#fff",
    padding: "18px",
    borderRadius: "16px",
    border: "none",
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "1px",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(85, 107, 47, 0.25)",
    marginTop: "12px",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#c53030",
    fontSize: "13px",
    backgroundColor: "#fff5f5",
    padding: "12px",
    borderRadius: "12px",
  },

  successContainer: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f6f1",
  },

  successCard: {
    backgroundColor: "#fff",
    padding: "50px",
    borderRadius: "28px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },

  sessionText: {
    fontSize: "20px",
    color: "#333",
    marginBottom: "20px",
  },

  buttonLogout: {
    backgroundColor: "#556b2f",
    color: "#fff",
    padding: "12px 24px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default Login;
