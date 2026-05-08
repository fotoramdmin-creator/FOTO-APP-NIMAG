import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  Camera,
  Factory,
  Home,
  ArrowRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const Navbar = ({
  perfil,
  setVista,
  ocultarNavbar = false,
}: {
  perfil: any;
  setVista: (vista: string) => void;
  ocultarNavbar?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [badgeUrgentes, setBadgeUrgentes] = useState(0);
  const [badgeHoy, setBadgeHoy] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (ocultarNavbar) {
      setIsOpen(false);
    }
  }, [ocultarNavbar]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const obtenerFechaHoyLocal = () => {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, "0");
    const day = String(ahora.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const cargarBadgesProduccion = useCallback(async () => {
    try {
      const hoy = obtenerFechaHoyLocal();

      const { data, error } = await supabase
        .from("pedidos")
        .select("id, urgente, fecha_entrega")
        .eq("p_2listo", true)
        .or("p3_concluido.is.null,p3_concluido.eq.false");

      if (error) throw error;

      const pedidos = data || [];

      const urgentes = pedidos.filter((p: any) => p.urgente === true).length;

      const hoyCount = pedidos.filter(
        (p: any) =>
          p.urgente !== true &&
          p.fecha_entrega &&
          String(p.fecha_entrega).slice(0, 10) === hoy
      ).length;

      setBadgeUrgentes(urgentes);
      setBadgeHoy(hoyCount);
    } catch (error) {
      console.error("Error cargando badges de producción:", error);
      setBadgeUrgentes(0);
      setBadgeHoy(0);
    }
  }, []);

  useEffect(() => {
    cargarBadgesProduccion();

    const interval = window.setInterval(() => {
      cargarBadgesProduccion();
    }, 30000);

    const channel = supabase
      .channel("navbar-produccion-badges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          cargarBadgesProduccion();
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [cargarBadgesProduccion]);

  const menuItems = [
    { name: "Inicio", view: "Inicio", icon: <Home size={18} /> },
    {
      name: "Toma Pedidos",
      view: "Toma Pedidos",
      icon: <Plus size={18} />,
    },
    {
      name: "Orden en curso",
      view: "Orden en Curso",
      icon: <Camera size={18} />,
    },
    {
      name: "Producción",
      view: "Producción",
      icon: <Factory size={18} />,
      badgeUrgentes,
      badgeHoy,
    },
  ];

  return (
    <AnimatePresence>
      {!ocultarNavbar && (
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            ...styles.nav,
            height: scrolled ? "80px" : "100px",
            background: scrolled
              ? "rgba(54, 65, 46, 0.94)"
              : "linear-gradient(90deg, #36412e 0%, #2f3a28 100%)",
            backdropFilter: scrolled ? "blur(15px)" : "none",
            borderBottom: scrolled
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div style={styles.container}>
            <motion.div
              style={styles.logoSection}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setVista("Inicio")}
            >
              <img
                src="/CDR.png"
                alt="Foto Studio Ramírez"
                style={{
                  ...styles.logoImg,
                  height: scrolled ? "180px" : "240px",
                }}
              />
            </motion.div>

            {!isMobile && (
              <div style={styles.pcMenu}>
                {menuItems.map((item) => (
                  <motion.button
                    key={item.name}
                    onClick={() => setVista(item.view)}
                    style={styles.navLink}
                    whileHover={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      y: -2,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span style={styles.iconWrapper}>{item.icon}</span>
                    <span>{item.name}</span>

                    {item.view === "Producción" &&
                    ((item.badgeUrgentes ?? 0) > 0 ||
                      (item.badgeHoy ?? 0) > 0) ? (
                      <span style={styles.badgesWrapDesktop}>
                        {(item.badgeUrgentes ?? 0) > 0 ? (
                          <span style={styles.badgeUrgenteDesktop}>
                            {item.badgeUrgentes}
                          </span>
                        ) : null}

                        {(item.badgeHoy ?? 0) > 0 ? (
                          <span style={styles.badgeHoyDesktop}>
                            {item.badgeHoy}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </motion.button>
                ))}

                <div style={styles.divider} />

                <motion.div
                  style={styles.userInfoBadge}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div style={styles.avatarContainer}>
                    <div style={styles.avatarMini}>
                      {perfil?.nombre?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div style={styles.onlineStatus} />
                  </div>

                  <div style={styles.userText}>
                    <span style={styles.userName}>
                      {perfil?.nombre || "Usuario"}
                    </span>
                    <span style={styles.userRole}>Fotógrafo</span>
                  </div>

                  <motion.button
                    onClick={handleLogout}
                    style={styles.logoutBtn}
                    whileHover={{ rotate: 15, scale: 1.2, color: "#ff4d4d" }}
                  >
                    <LogOut size={20} />
                  </motion.button>
                </motion.div>
              </div>
            )}

            {isMobile && (
              <motion.button
                whileTap={{ scale: 0.8 }}
                style={styles.mobileBtn}
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X size={32} /> : <Menu size={32} />}
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {isMobile && isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                style={styles.mobileDrawer}
              >
                <div style={styles.drawerTop}>
                  <Sparkles size={20} color="#fff" />
                  <span style={styles.drawerTitle}>FOTO RAMÍREZ</span>
                  <X
                    size={24}
                    color="#fff"
                    style={{ cursor: "pointer" }}
                    onClick={() => setIsOpen(false)}
                  />
                </div>

                <div style={styles.mobileUserTag}>
                  <div style={styles.avatarLarge}>
                    {perfil?.nombre?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <p style={styles.mobileWelcome}>Sesión activa de:</p>
                  <h3 style={styles.mobileName}>
                    {perfil?.nombre || "Usuario"}
                  </h3>
                </div>

                <div style={styles.mobileLinksContainer}>
                  {menuItems.map((item, i) => (
                    <motion.button
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      style={styles.mobileLink}
                      onClick={() => {
                        setVista(item.view);
                        setIsOpen(false);
                      }}
                    >
                      <div style={styles.iconCircleMobile}>{item.icon}</div>

                      <span style={styles.mobileLinkText}>{item.name}</span>

                      {item.view === "Producción" &&
                      ((item.badgeUrgentes ?? 0) > 0 ||
                        (item.badgeHoy ?? 0) > 0) ? (
                        <span style={styles.badgesWrapMobile}>
                          {(item.badgeUrgentes ?? 0) > 0 ? (
                            <span style={styles.badgeUrgenteMobile}>
                              {item.badgeUrgentes}
                            </span>
                          ) : null}

                          {(item.badgeHoy ?? 0) > 0 ? (
                            <span style={styles.badgeHoyMobile}>
                              {item.badgeHoy}
                            </span>
                          ) : null}
                        </span>
                      ) : null}

                      <ArrowRight
                        size={16}
                        style={{ marginLeft: "auto", opacity: 0.5 }}
                      />
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={styles.mobileFooter}
                >
                  <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    padding: "0 22px 0 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    top: "4px",
    left: "-6px",
    cursor: "pointer",
    flexShrink: 0,
  },
  logoImg: {
    width: "auto",
    objectFit: "contain",
    transition: "height 0.4s ease",
    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
    display: "block",
  },
  pcMenu: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  navLink: {
    background: "none",
    border: "none",
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "12px",
    fontWeight: 700,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    cursor: "pointer",
    padding: "12px 18px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    position: "relative",
  },
  iconWrapper: {
    opacity: 0.8,
    display: "flex",
    alignItems: "center",
  },
  badgesWrapDesktop: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginLeft: "2px",
  },
  badgeUrgenteDesktop: {
    minWidth: "20px",
    height: "20px",
    padding: "0 6px",
    borderRadius: "999px",
    backgroundColor: "#ff4d4d",
    color: "#fff",
    fontSize: "10px",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 14px rgba(255,77,77,0.30)",
  },
  badgeHoyDesktop: {
    minWidth: "20px",
    height: "20px",
    padding: "0 6px",
    borderRadius: "999px",
    backgroundColor: "#eab308",
    color: "#111",
    fontSize: "10px",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 14px rgba(234,179,8,0.26)",
  },
  divider: {
    width: "1px",
    height: "40px",
    backgroundColor: "rgba(255,255,255,0.15)",
    margin: "0 18px",
  },
  userInfoBadge: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "8px 10px 8px 15px",
    borderRadius: "20px",
    gap: "15px",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarMini: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    backgroundColor: "#fff",
    color: "#36412e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: 800,
  },
  onlineStatus: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: "10px",
    height: "10px",
    backgroundColor: "#4ade80",
    borderRadius: "50%",
    border: "2px solid #36412e",
  },
  userText: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#fff",
    lineHeight: "1",
  },
  userRole: {
    fontSize: "9px",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginTop: "4px",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    padding: "5px",
    transition: "0.3s",
  },
  mobileBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileDrawer: {
    position: "fixed",
    top: 0,
    right: 0,
    height: "100vh",
    width: "100%",
    maxWidth: "340px",
    backgroundColor: "#1e241a",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    zIndex: 2000,
    boxShadow: "-15px 0 50px rgba(0,0,0,0.5)",
    boxSizing: "border-box",
  },
  drawerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  drawerTitle: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: 800,
    letterSpacing: "3px",
  },
  mobileUserTag: {
    textAlign: "center",
    marginBottom: "40px",
  },
  avatarLarge: {
    width: "70px",
    height: "70px",
    borderRadius: "25px",
    backgroundColor: "#fff",
    color: "#1e241a",
    fontSize: "28px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
  },
  mobileWelcome: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "14px",
    margin: 0,
  },
  mobileName: {
    color: "#fff",
    fontSize: "24px",
    margin: "5px 0 0 0",
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
  },
  mobileLinksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  mobileLink: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "16px",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "none",
    borderRadius: "18px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
  },
  mobileLinkText: {
    flex: 1,
  },
  badgesWrapMobile: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  badgeUrgenteMobile: {
    minWidth: "22px",
    height: "22px",
    padding: "0 6px",
    borderRadius: "999px",
    backgroundColor: "#ff4d4d",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 14px rgba(255,77,77,0.30)",
  },
  badgeHoyMobile: {
    minWidth: "22px",
    height: "22px",
    padding: "0 6px",
    borderRadius: "999px",
    backgroundColor: "#eab308",
    color: "#111",
    fontSize: "11px",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 14px rgba(234,179,8,0.26)",
  },
  iconCircleMobile: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileFooter: {
    marginTop: "auto",
  },
  mobileLogoutBtn: {
    width: "100%",
    padding: "18px",
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    border: "1px solid rgba(255, 77, 77, 0.2)",
    borderRadius: "20px",
    color: "#ff4d4d",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
  },
};

export default Navbar;
