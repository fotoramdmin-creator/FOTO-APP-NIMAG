import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { DatosServicio } from "./serviciosTypes";

type ServicioDatosFormProps = {
  datos: DatosServicio;
  setDatos: React.Dispatch<React.SetStateAction<DatosServicio>>;
  onCancelar: () => void;
  onContinuar: () => void;
};

const THEME = {
  bg: "#f6f1e8",
  card: "#fffdf8",
  text: "#1c1a15",
  textSoft: "#777168",
  olive: "#36412e",
  gold: "#b89f54",
  goldSoft: "#f8f0dc",
  border: "rgba(184, 159, 84, 0.25)",
  red: "#b42318",
};

const ServicioDatosForm = ({
  datos,
  setDatos,
  onCancelar,
  onContinuar,
}: ServicioDatosFormProps) => {
  const [mostrarError, setMostrarError] = useState(false);

  const formularioValido = useMemo(
    () =>
      datos.clienteNombre.trim() !== "" &&
      datos.clienteTelefono.trim() !== "" &&
      datos.tipoEvento.trim() !== "" &&
      datos.fechaEvento !== "",
    [
      datos.clienteNombre,
      datos.clienteTelefono,
      datos.tipoEvento,
      datos.fechaEvento,
    ]
  );

  const actualizarCampo = (
    campo: keyof DatosServicio,
    valor: string
  ) => {
    setDatos((prev) => {
      if (campo === "fechaEvento") {
        const limiteSeguíaAlEvento =
          !prev.fechaLimiteLiquidacion ||
          prev.fechaLimiteLiquidacion === prev.fechaEvento;

        return {
          ...prev,
          fechaEvento: valor,
          fechaLimiteLiquidacion: limiteSeguíaAlEvento
            ? valor
            : prev.fechaLimiteLiquidacion,
        };
      }

      return {
        ...prev,
        [campo]: valor,
      };
    });

    setMostrarError(false);
  };

  const continuar = () => {
    if (!formularioValido) {
      setMostrarError(true);
      return;
    }

    onContinuar();
  };

  return (
    <main style={styles.page}>
      <div style={styles.glow} />

      <div style={styles.container}>
        <header style={styles.header}>
          <button
            type="button"
            onClick={onCancelar}
            style={styles.backButton}
          >
            <ArrowLeft size={17} />
            Cancelar
          </button>

          <p style={styles.eyebrow}>NUEVO SERVICIO · PASO 1 DE 3</p>
          <h1 style={styles.title}>Cliente y evento</h1>
          <p style={styles.subtitle}>
            Registra primero los datos principales. La fecha de pruebas
            puede quedar pendiente y asignarse después del evento.
          </p>
        </header>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>
              <User size={21} />
            </div>

            <div>
              <h2 style={styles.sectionTitle}>Datos del cliente</h2>
              <p style={styles.sectionText}>
                Información para identificar y contactar al cliente.
              </p>
            </div>
          </div>

          <div style={styles.twoColumns}>
            <label style={styles.field}>
              <span style={styles.label}>
                Nombre del cliente <b style={styles.required}>*</b>
              </span>

              <div style={styles.inputWrap}>
                <User size={18} color={THEME.textSoft} />

                <input
                  type="text"
                  value={datos.clienteNombre}
                  onChange={(event) =>
                    actualizarCampo(
                      "clienteNombre",
                      event.target.value
                    )
                  }
                  placeholder="Ej. María López y José García"
                  style={styles.input}
                />
              </div>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>
                Teléfono <b style={styles.required}>*</b>
              </span>

              <div style={styles.inputWrap}>
                <Phone size={18} color={THEME.textSoft} />

                <input
                  type="tel"
                  inputMode="tel"
                  value={datos.clienteTelefono}
                  onChange={(event) =>
                    actualizarCampo(
                      "clienteTelefono",
                      event.target.value
                    )
                  }
                  placeholder="722 000 0000"
                  style={styles.input}
                />
              </div>
            </label>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>
              <CalendarDays size={21} />
            </div>

            <div>
              <h2 style={styles.sectionTitle}>Datos del evento</h2>
              <p style={styles.sectionText}>
                Fecha, horario y lugar donde se realizará el servicio.
              </p>
            </div>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>
              Tipo de evento o servicio{" "}
              <b style={styles.required}>*</b>
            </span>

            <input
              type="text"
              value={datos.tipoEvento}
              onChange={(event) =>
                actualizarCampo("tipoEvento", event.target.value)
              }
              placeholder="Ej. Boda, XV años, graduación o cobertura"
              style={styles.inputStandalone}
            />
          </label>

          <div style={styles.twoColumns}>
            <label style={styles.field}>
              <span style={styles.label}>
                Fecha del evento <b style={styles.required}>*</b>
              </span>

              <div style={styles.inputWrap}>
                <CalendarDays size={18} color={THEME.textSoft} />

                <input
                  type="date"
                  value={datos.fechaEvento}
                  onChange={(event) =>
                    actualizarCampo(
                      "fechaEvento",
                      event.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Horario del evento</span>

              <div style={styles.inputWrap}>
                <Clock3 size={18} color={THEME.textSoft} />

                <input
                  type="time"
                  value={datos.horarioEvento}
                  onChange={(event) =>
                    actualizarCampo(
                      "horarioEvento",
                      event.target.value
                    )
                  }
                  style={styles.input}
                />
              </div>
            </label>
          </div>

          <div style={styles.twoColumns}>
            <label style={styles.field}>
              <span style={styles.label}>Lugar del evento</span>

              <div style={styles.inputWrap}>
                <MapPin size={18} color={THEME.textSoft} />

                <input
                  type="text"
                  value={datos.lugarEvento}
                  onChange={(event) =>
                    actualizarCampo(
                      "lugarEvento",
                      event.target.value
                    )
                  }
                  placeholder="Ej. Salón Jardín Real"
                  style={styles.input}
                />
              </div>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Dirección</span>

              <div style={styles.inputWrap}>
                <MapPin size={18} color={THEME.textSoft} />

                <input
                  type="text"
                  value={datos.direccionEvento}
                  onChange={(event) =>
                    actualizarCampo(
                      "direccionEvento",
                      event.target.value
                    )
                  }
                  placeholder="Calle, número, colonia o referencia"
                  style={styles.input}
                />
              </div>
            </label>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIconGold}>
              <Clock3 size={21} />
            </div>

            <div>
              <h2 style={styles.sectionTitle}>Fechas posteriores</h2>
              <p style={styles.sectionText}>
                Pruebas y entrega pueden programarse ahora o completarse
                después.
              </p>
            </div>
          </div>

          <div style={styles.twoColumns}>
            <label style={styles.field}>
              <span style={styles.label}>
                Fecha de pruebas o selección
              </span>

              <input
                type="date"
                value={datos.fechaPruebas}
                onChange={(event) =>
                  actualizarCampo(
                    "fechaPruebas",
                    event.target.value
                  )
                }
                style={styles.inputStandalone}
              />

              <small style={styles.helpText}>
                Déjala vacía si todavía no está acordada.
              </small>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Horario de pruebas</span>

              <input
                type="time"
                value={datos.horarioPruebas}
                onChange={(event) =>
                  actualizarCampo(
                    "horarioPruebas",
                    event.target.value
                  )
                }
                disabled={!datos.fechaPruebas}
                style={{
                  ...styles.inputStandalone,
                  opacity: datos.fechaPruebas ? 1 : 0.5,
                }}
              />
            </label>
          </div>

          <div style={styles.twoColumns}>
            <label style={styles.field}>
              <span style={styles.label}>Fecha de entrega final</span>

              <input
                type="date"
                value={datos.fechaEntrega}
                onChange={(event) =>
                  actualizarCampo(
                    "fechaEntrega",
                    event.target.value
                  )
                }
                style={styles.inputStandalone}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Horario de entrega</span>

              <input
                type="time"
                value={datos.horarioEntrega}
                onChange={(event) =>
                  actualizarCampo(
                    "horarioEntrega",
                    event.target.value
                  )
                }
                disabled={!datos.fechaEntrega}
                style={{
                  ...styles.inputStandalone,
                  opacity: datos.fechaEntrega ? 1 : 0.5,
                }}
              />
            </label>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>
              Fecha límite para liquidar
            </span>

            <input
              type="date"
              value={datos.fechaLimiteLiquidacion}
              onChange={(event) =>
                actualizarCampo(
                  "fechaLimiteLiquidacion",
                  event.target.value
                )
              }
              style={styles.inputStandalone}
            />

            <small style={styles.helpText}>
              Se coloca automáticamente la fecha del evento, pero puedes
              cambiarla si el acuerdo es diferente.
            </small>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Notas generales</span>

            <textarea
              value={datos.notas}
              onChange={(event) =>
                actualizarCampo("notas", event.target.value)
              }
              placeholder="Indicaciones del cliente, horarios especiales o información importante"
              rows={4}
              style={styles.textarea}
            />
          </label>
        </section>

        {mostrarError ? (
          <div style={styles.errorBox}>
            Completa nombre, teléfono, tipo de evento y fecha del evento.
          </div>
        ) : null}

        <footer style={styles.footer}>
          <button
            type="button"
            onClick={onCancelar}
            style={styles.secondaryButton}
          >
            <ArrowLeft size={18} />
            Cancelar
          </button>

          <motion.button
            type="button"
            onClick={continuar}
            style={{
              ...styles.primaryButton,
              opacity: formularioValido ? 1 : 0.72,
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Continuar al carrito
            <ArrowRight size={18} />
          </motion.button>
        </footer>
      </div>
    </main>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: THEME.bg,
    padding: "130px 20px 60px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: "50%",
    background: "rgba(184,159,84,0.11)",
    filter: "blur(45px)",
    top: -220,
    right: -160,
    pointerEvents: "none",
  },
  container: {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: THEME.textSoft,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 0,
    marginBottom: 22,
    cursor: "pointer",
    fontWeight: 800,
  },
  eyebrow: {
    margin: "0 0 8px",
    color: THEME.gold,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2,
  },
  title: {
    margin: 0,
    color: THEME.text,
    fontSize: "clamp(34px, 6vw, 54px)",
    lineHeight: 1,
    letterSpacing: "-2px",
  },
  subtitle: {
    margin: "14px 0 0",
    color: THEME.textSoft,
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 700,
  },
  card: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 27,
    boxShadow: "0 20px 55px rgba(61,51,39,0.08)",
    padding: "clamp(20px, 4vw, 32px)",
    marginBottom: 16,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    marginBottom: 24,
  },
  sectionIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    background: "rgba(54,65,46,0.10)",
    color: THEME.olive,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionIconGold: {
    width: 45,
    height: 45,
    borderRadius: 15,
    background: THEME.goldSoft,
    color: "#806527",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionTitle: {
    margin: 0,
    color: THEME.text,
    fontSize: 21,
  },
  sectionText: {
    margin: "4px 0 0",
    color: THEME.textSoft,
    fontSize: 13,
    lineHeight: 1.4,
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 17,
  },
  label: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: 900,
  },
  required: {
    color: THEME.red,
  },
  inputWrap: {
    minHeight: 54,
    borderRadius: 16,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    padding: "0 15px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: THEME.text,
    fontSize: 15,
  },
  inputStandalone: {
    width: "100%",
    minHeight: 54,
    borderRadius: 16,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.text,
    padding: "0 15px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    borderRadius: 16,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.text,
    padding: 15,
    fontSize: 15,
    lineHeight: 1.5,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  helpText: {
    color: THEME.textSoft,
    fontSize: 11,
    lineHeight: 1.4,
  },
  errorBox: {
    borderRadius: 16,
    background: "#fff1f0",
    border: "1px solid rgba(180,35,24,0.22)",
    color: THEME.red,
    padding: 15,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },
   footer: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: 12,
    marginTop: 20,
  },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 18,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.textSoft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontWeight: 900,
    cursor: "pointer",
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    border: "none",
    background: THEME.olive,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(54,65,46,0.23)",
  },
};

export default ServicioDatosForm;