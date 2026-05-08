import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  Zap,
} from "lucide-react";

type DatosCliente = {
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_entrega: string;
  horario_entrega: string;
};

type ItemCarrito = {
  id: number | string;
  usuarioId?: string;
  usuarioNombre?: string;
  tamano: string;
  cantidad: number;
  tipo?: string;
  papel?: string;
  esUrgente?: boolean;
  esKenfor?: boolean;
  especificaciones?: string;
  total?: number;
};

const THEME = {
  card: "rgba(255, 255, 255, 0.82)",
  text: "#1c1a15",
  textSoft: "#747169",
  gold: "#b89f54",
  goldGradient: "linear-gradient(135deg, #D4B468 0%, #B08D3E 100%)",
  border: "rgba(184, 159, 84, 0.25)",
  shadow: "0 20px 50px rgba(50, 42, 32, 0.1)",
  urgentBg: "rgba(184, 159, 84, 0.10)",
};

const Vista2 = ({
  datosCliente,
  setDatosCliente,
  onVolver,
  onContinuar,
  carrito,
}: {
  datosCliente: DatosCliente;
  setDatosCliente: React.Dispatch<React.SetStateAction<DatosCliente>>;
  onVolver: () => void;
  onContinuar: () => void;
  carrito: ItemCarrito[];
}) => {
  const [isMobile, setIsMobile] = useState(false);

  const [hSel, setHSel] = useState("12");
  const [mSel, setMSel] = useState("00");
  const [pSel, setPSel] = useState("PM");

  const horas = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
  const minutos = ["00", "30"];

  const pedidoEsUrgente = useMemo(() => {
    return carrito.some((item) => item.esUrgente);
  }, [carrito]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (datosCliente.horario_entrega) {
      const match = datosCliente.horario_entrega.match(
        /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i
      );

      if (match) {
        setHSel(match[1]);
        setMSel(match[2]);
        setPSel(match[3].toUpperCase());
      }
    }
  }, [datosCliente.horario_entrega]);

  useEffect(() => {
    if (pedidoEsUrgente) {
      setDatosCliente((prev) => ({
        ...prev,
        fecha_entrega: "",
        horario_entrega: "",
      }));
    }
  }, [pedidoEsUrgente, setDatosCliente]);

  const formularioValido =
    datosCliente.cliente_nombre.trim() !== "" &&
    datosCliente.cliente_telefono.trim() !== "";

  const actualizarCampo = (campo: keyof DatosCliente, valor: string) => {
    setDatosCliente((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleTimeClick = (h: string, m: string, p: string) => {
    setHSel(h);
    setMSel(m);
    setPSel(p);
    actualizarCampo("horario_entrega", `${h}:${m} ${p}`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowTop} />

      <div
        style={{
          ...styles.container,
          ...(isMobile ? styles.containerMobile : styles.containerDesktop),
        }}
      >
        <header style={styles.headerWrap}>
          <div style={styles.kicker}>FOTO ESTUDIO RAMÍREZ</div>
          <h2 style={styles.title}>Datos del cliente</h2>
          <div style={styles.titleUnderline} />
        </header>

        <section
          style={{
            ...styles.sectionCard,
            ...(isMobile
              ? styles.sectionCardMobile
              : styles.sectionCardDesktop),
          }}
        >
          <div
            style={{
              ...styles.formGrid,
              ...(isMobile ? styles.formGridMobile : styles.formGridDesktop),
            }}
          >
            <div style={styles.inputBlock}>
              <div style={styles.inputLabel}>Nombre</div>
              <div style={styles.inputWrap}>
                <User size={18} color={THEME.gold} strokeWidth={2.5} />
                <input
                  type="text"
                  value={datosCliente.cliente_nombre}
                  onChange={(e) =>
                    actualizarCampo("cliente_nombre", e.target.value)
                  }
                  placeholder="Ej. María López"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputBlock}>
              <div style={styles.inputLabel}>Teléfono</div>
              <div style={styles.inputWrap}>
                <Phone size={18} color={THEME.gold} strokeWidth={2.5} />
                <input
                  type="tel"
                  value={datosCliente.cliente_telefono}
                  onChange={(e) =>
                    actualizarCampo("cliente_telefono", e.target.value)
                  }
                  placeholder="722 123 4567"
                  style={styles.input}
                />
              </div>
            </div>

            {pedidoEsUrgente ? (
              <div
                style={{
                  ...styles.urgentBox,
                  ...(isMobile ? {} : styles.urgentBoxDesktop),
                }}
              >
                <div style={styles.urgentHeader}>
                  <Zap size={18} color={THEME.gold} />
                  <span style={styles.urgentTitle}>Entrega urgente</span>
                </div>
                <p style={styles.urgentText}>
                  Este pedido contiene renglones urgentes.
                </p>
                <p style={styles.urgentTextStrong}>
                  Tiempo estimado de entrega: 15 a 25 minutos
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    ...styles.inputBlock,
                    ...(isMobile ? {} : styles.fechaBlockDesktop),
                  }}
                >
                  <div style={styles.inputLabel}>Fecha de Entrega</div>
                  <div style={styles.inputWrap}>
                    <CalendarDays
                      size={18}
                      color={THEME.gold}
                      strokeWidth={2.5}
                    />
                    <input
                      type="date"
                      value={datosCliente.fecha_entrega}
                      onChange={(e) =>
                        actualizarCampo("fecha_entrega", e.target.value)
                      }
                      style={styles.input}
                    />
                  </div>
                </div>

                <div
                  style={{
                    ...styles.inputBlock,
                    ...(isMobile ? {} : styles.horarioBlockDesktop),
                  }}
                >
                  <div style={styles.inputLabel}>
                    Horario (Toque para elegir)
                  </div>

                  <div
                    style={{
                      ...styles.timeMasterContainer,
                      ...(isMobile
                        ? styles.timeMasterContainerMobile
                        : styles.timeMasterContainerDesktop),
                    }}
                  >
                    <div
                      style={{
                        ...styles.scrollRow,
                        ...(isMobile
                          ? styles.scrollRowMobile
                          : styles.scrollRowDesktop),
                      }}
                    >
                      {horas.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleTimeClick(h, mSel, pSel)}
                          style={{
                            ...styles.timeCircle,
                            ...(isMobile
                              ? styles.timeCircleMobile
                              : styles.timeCircleDesktop),
                            backgroundColor: hSel === h ? THEME.gold : "white",
                            color: hSel === h ? "white" : THEME.text,
                            borderColor: hSel === h ? THEME.gold : THEME.border,
                          }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>

                    <div
                      style={{
                        ...styles.timeFlexControl,
                        ...(isMobile
                          ? styles.timeFlexControlMobile
                          : styles.timeFlexControlDesktop),
                      }}
                    >
                      <div style={styles.toggleGroup}>
                        {minutos.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleTimeClick(hSel, m, pSel)}
                            style={{
                              ...styles.toggleBtn,
                              backgroundColor:
                                mSel === m ? THEME.text : "transparent",
                              color: mSel === m ? "white" : THEME.text,
                            }}
                          >
                            :{m}
                          </button>
                        ))}
                      </div>

                      <div style={styles.toggleGroup}>
                        {["AM", "PM"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleTimeClick(hSel, mSel, p)}
                            style={{
                              ...styles.toggleBtn,
                              backgroundColor:
                                pSel === p ? THEME.gold : "transparent",
                              color: pSel === p ? "white" : THEME.text,
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={styles.timeDisplay}>
                      Seleccionado:{" "}
                      <span style={styles.timeSelected}>
                        {hSel}:{mSel} {pSel}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <footer
          style={{
            ...styles.footer,
            ...(isMobile ? styles.footerMobile : styles.footerDesktop),
          }}
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onVolver}
            style={{
              ...styles.secondaryBtn,
              ...(isMobile ? styles.secondaryBtnMobile : {}),
            }}
          >
            <ArrowLeft size={18} /> Volver
          </motion.button>

          <motion.button
            type="button"
            whileHover={formularioValido ? { scale: 1.02 } : {}}
            whileTap={{ scale: 0.97 }}
            onClick={onContinuar}
            disabled={!formularioValido}
            style={{
              ...styles.mainBtn,
              ...(isMobile ? styles.mainBtnMobile : {}),
              opacity: formularioValido ? 1 : 0.5,
            }}
          >
            Continuar <ArrowRight size={18} />
          </motion.button>
        </footer>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#F7F3EB",
    position: "relative",
    fontFamily: "'Inter', sans-serif",
  },

  bgGlowTop: {
    position: "fixed",
    top: 0,
    width: "100%",
    height: "300px",
    background:
      "radial-gradient(circle at top, rgba(184,159,84,0.15), transparent)",
    pointerEvents: "none",
  },

  container: {
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  containerDesktop: {
    maxWidth: "980px",
    padding: "48px 24px 120px",
  },
  containerMobile: {
    maxWidth: "100%",
    padding: "32px 16px 110px",
  },

  headerWrap: {
    textAlign: "center",
    marginBottom: "30px",
  },

  kicker: {
    fontSize: "10px",
    fontWeight: 900,
    color: THEME.gold,
    letterSpacing: "4px",
    marginBottom: "8px",
  },

  title: {
    fontSize: "clamp(30px, 6vw, 42px)",
    fontWeight: 800,
    color: THEME.text,
    margin: 0,
    lineHeight: 1.05,
  },

  titleUnderline: {
    width: "40px",
    height: "4px",
    background: THEME.goldGradient,
    margin: "12px auto",
    borderRadius: "10px",
  },

  sectionCard: {
    background: THEME.card,
    borderRadius: "30px",
    boxShadow: THEME.shadow,
    backdropFilter: "blur(10px)",
    border: "1px solid white",
  },
  sectionCardDesktop: {
    padding: "26px",
  },
  sectionCardMobile: {
    padding: "18px 14px",
    borderRadius: "24px",
  },

  formGrid: {
    display: "grid",
    gap: "20px",
  },
  formGridDesktop: {
    gridTemplateColumns: "1fr 1fr",
    alignItems: "start",
  },
  formGridMobile: {
    gridTemplateColumns: "1fr",
  },

  fechaBlockDesktop: {
    gridColumn: "1 / 2",
  },

  horarioBlockDesktop: {
    gridColumn: "2 / 3",
    gridRow: "1 / span 2",
  },

  inputBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },

  inputLabel: {
    fontSize: "11px",
    fontWeight: 800,
    color: THEME.gold,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  inputWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "white",
    padding: "15px 18px",
    borderRadius: "18px",
    border: `1px solid ${THEME.border}`,
    boxSizing: "border-box",
    minHeight: "56px",
  },

  input: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "16px",
    fontWeight: 600,
    width: "100%",
    minWidth: 0,
    color: THEME.text,
  },

  urgentBox: {
    background: THEME.urgentBg,
    border: `1px solid ${THEME.border}`,
    borderRadius: "22px",
    padding: "20px",
  },

  urgentBoxDesktop: {
    gridColumn: "1 / -1",
  },

  urgentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  urgentTitle: {
    fontSize: "18px",
    fontWeight: 900,
    color: THEME.text,
  },

  urgentText: {
    margin: "0 0 8px 0",
    color: THEME.textSoft,
    fontSize: "15px",
    lineHeight: 1.5,
  },

  urgentTextStrong: {
    margin: 0,
    color: THEME.gold,
    fontSize: "16px",
    fontWeight: 900,
    lineHeight: 1.5,
  },

  timeMasterContainer: {
    background: "rgba(0,0,0,0.03)",
    borderRadius: "24px",
    marginTop: "5px",
    boxSizing: "border-box",
  },
  timeMasterContainerDesktop: {
    padding: "20px",
    minHeight: "100%",
  },
  timeMasterContainerMobile: {
    padding: "16px 12px",
  },

  scrollRow: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  scrollRowDesktop: {
    padding: "10px 5px",
  },
  scrollRowMobile: {
    padding: "6px 2px 10px",
  },

  timeCircle: {
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    cursor: "pointer",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  timeCircleDesktop: {
    minWidth: "52px",
    width: "52px",
    height: "52px",
    fontSize: "16px",
  },
  timeCircleMobile: {
    minWidth: "46px",
    width: "46px",
    height: "46px",
    fontSize: "15px",
  },

  timeFlexControl: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  },
  timeFlexControlDesktop: {
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  timeFlexControlMobile: {
    flexDirection: "column",
  },

  toggleGroup: {
    display: "flex",
    background: "white",
    padding: "5px",
    borderRadius: "15px",
    border: `1px solid ${THEME.border}`,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  toggleBtn: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    transition: "0.2s",
  },

  timeDisplay: {
    textAlign: "center",
    marginTop: "15px",
    fontSize: "13px",
    color: THEME.textSoft,
    lineHeight: 1.4,
  },

  timeSelected: {
    fontWeight: 900,
    color: THEME.gold,
  },

  footer: {
    display: "flex",
    marginTop: "30px",
    gap: "15px",
  },
  footerDesktop: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerMobile: {
    flexDirection: "column-reverse",
    alignItems: "stretch",
  },

  secondaryBtn: {
    padding: "18px 25px",
    borderRadius: "20px",
    border: `1px solid ${THEME.border}`,
    background: "white",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: THEME.text,
  },
  secondaryBtnMobile: {
    width: "100%",
  },

  mainBtn: {
    padding: "18px 30px",
    borderRadius: "20px",
    border: "none",
    background: THEME.goldGradient,
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 10px 20px rgba(184, 159, 84, 0.2)",
  },
  mainBtnMobile: {
    width: "100%",
  },
};

export default Vista2;
