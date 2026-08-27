import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ReceiptText,
  Tag,
  User,
} from "lucide-react";
import {
  ConceptoServicio,
  DatosServicio,
} from "./serviciosTypes";

type ServicioConfirmacionProps = {
  datos: DatosServicio;
  carrito: ConceptoServicio[];
  descuento: number;
  setDescuento: React.Dispatch<React.SetStateAction<number>>;
  guardando: boolean;
  onVolver: () => void;
  onConfirmar: () => void;
};

const THEME = {
  bg: "#f6f1e8",
  card: "#fffdf8",
  text: "#1c1a15",
  textSoft: "#777168",
  olive: "#36412e",
  gold: "#b89f54",
  goldSoft: "#f8f0dc",
  border: "rgba(184,159,84,0.25)",
  red: "#b42318",
  redSoft: "#fff1f0",
  white: "#fff",
};

const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatearFecha = (fecha: string) => {
  if (!fecha) return "Por programar";

  return new Date(`${fecha}T12:00:00`).toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

const formatearHorario = (horario: string) => {
  if (!horario) return "Horario por confirmar";

  const [hora, minuto] = horario.split(":");
  const fecha = new Date();
  fecha.setHours(Number(hora), Number(minuto || 0), 0, 0);

  return fecha.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const limpiarMonto = (valor: string) => {
  const limpio = valor.replace(/[^0-9.]/g, "");
  const [enteros, ...decimales] = limpio.split(".");

  if (decimales.length === 0) return enteros;

  return `${enteros}.${decimales.join("").slice(0, 2)}`;
};

const ServicioConfirmacion = ({
  datos,
  carrito,
  descuento,
  setDescuento,
  guardando,
  onVolver,
  onConfirmar,
}: ServicioConfirmacionProps) => {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 820
  );
  const [descuentoInput, setDescuentoInput] = useState(
    descuento > 0 ? String(descuento) : ""
  );

  useEffect(() => {
    const revisarPantalla = () => {
      setIsMobile(window.innerWidth < 820);
    };

    window.addEventListener("resize", revisarPantalla);

    return () => {
      window.removeEventListener("resize", revisarPantalla);
    };
  }, []);

  const totalBruto = useMemo(
    () =>
      carrito.reduce(
        (total, concepto) =>
          total + Number(concepto.subtotal || 0),
        0
      ),
    [carrito]
  );

  const descuentoAplicado = Math.min(
    Math.max(0, Number(descuento || 0)),
    totalBruto
  );

  const totalFinal = Math.max(
    0,
    totalBruto - descuentoAplicado
  );

  const aplicarDescuento = (valor: string) => {
    const limpio = limpiarMonto(valor);
    const numero = Number(limpio || 0);
    const limitado = Math.min(
      Math.max(0, numero),
      totalBruto
    );

    setDescuentoInput(limpio);
    setDescuento(limitado);
  };

  return (
    <main
      style={{
        ...styles.page,
        padding: isMobile
          ? "112px 12px 35px"
          : "130px 20px 60px",
      }}
    >
      <div style={styles.glow} />

      <div style={styles.container}>
        <header style={styles.header}>
          <button
            type="button"
            onClick={onVolver}
            style={styles.backButton}
            disabled={guardando}
          >
            <ArrowLeft size={17} />
            Volver al carrito
          </button>

          <p style={styles.eyebrow}>
            NUEVO SERVICIO · PASO 3 DE 3
          </p>

          <h1
            style={{
              ...styles.title,
              fontSize: isMobile ? 34 : "clamp(38px, 6vw, 54px)",
            }}
          >
            Confirmar contratación
          </h1>

          <p style={styles.subtitle}>
            Revisa con el cliente todos los datos antes de crear el
            servicio y pasar al cobro.
          </p>
        </header>

        <div
          style={{
            ...styles.layout,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
          }}
        >
          <div style={styles.mainColumn}>
            <section
              style={{
                ...styles.card,
                padding: isMobile ? 16 : 26,
              }}
            >
              <div style={styles.sectionHeader}>
                <div style={styles.sectionIcon}>
                  <User size={20} />
                </div>

                <div>
                  <p style={styles.sectionEyebrow}>CLIENTE</p>
                  <h2 style={styles.sectionTitle}>
                    {datos.clienteNombre}
                  </h2>
                  <span style={styles.sectionText}>
                    {datos.clienteTelefono}
                  </span>
                </div>
              </div>

              <div
                style={{
                  ...styles.infoGrid,
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(2, minmax(0, 1fr))",
                }}
              >
                <div style={styles.infoBox}>
                  <CalendarDays size={18} color={THEME.gold} />
                  <div>
                    <span style={styles.infoLabel}>
                      Evento
                    </span>
                    <strong style={styles.infoValue}>
                      {datos.tipoEvento}
                    </strong>
                    <span style={styles.infoText}>
                      {formatearFecha(datos.fechaEvento)}
                    </span>
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <Clock3 size={18} color={THEME.gold} />
                  <div>
                    <span style={styles.infoLabel}>
                      Horario
                    </span>
                    <strong style={styles.infoValue}>
                      {formatearHorario(datos.horarioEvento)}
                    </strong>
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <MapPin size={18} color={THEME.gold} />
                  <div>
                    <span style={styles.infoLabel}>
                      Lugar
                    </span>
                    <strong style={styles.infoValue}>
                      {datos.lugarEvento ||
                        "Lugar por confirmar"}
                    </strong>
                    {datos.direccionEvento ? (
                      <span style={styles.infoText}>
                        {datos.direccionEvento}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <CalendarDays size={18} color={THEME.gold} />
                  <div>
                    <span style={styles.infoLabel}>
                      Pruebas
                    </span>
                    <strong style={styles.infoValue}>
                      {formatearFecha(datos.fechaPruebas)}
                    </strong>
                    {datos.fechaPruebas ? (
                      <span style={styles.infoText}>
                        {formatearHorario(
                          datos.horarioPruebas
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section
              style={{
                ...styles.card,
                padding: isMobile ? 16 : 26,
              }}
            >
              <div style={styles.sectionHeader}>
                <div style={styles.sectionIcon}>
                  <ReceiptText size={20} />
                </div>

                <div>
                  <p style={styles.sectionEyebrow}>
                    PRODUCTOS CONTRATADOS
                  </p>
                  <h2 style={styles.sectionTitle}>
                    {carrito.length}{" "}
                    {carrito.length === 1
                      ? "concepto"
                      : "conceptos"}
                  </h2>
                </div>
              </div>

              <div style={styles.itemsList}>
                {carrito.map((concepto, index) => (
                  <article
                    key={concepto.id}
                    style={styles.itemCard}
                  >
                    <div style={styles.itemNumber}>
                      {index + 1}
                    </div>

                    <div style={styles.itemInfo}>
                      <strong style={styles.itemTitle}>
                        {concepto.cantidad} ×{" "}
                        {concepto.descripcion}
                      </strong>

                      <div style={styles.itemDetails}>
                        {concepto.medida ? (
                          <span>
                            Medida: {concepto.medida}
                          </span>
                        ) : null}

                        {concepto.marco ? (
                          <span>
                            Marco: {concepto.marco}
                          </span>
                        ) : null}

                        {concepto.requiereSeleccionTomas ? (
                          <span style={styles.tomasText}>
                            Requiere seleccionar{" "}
                            {concepto.cantidadTomasRequeridas}{" "}
                            {concepto.cantidadTomasRequeridas === 1
                              ? "toma"
                              : "tomas"}
                          </span>
                        ) : null}
                      </div>

                      {concepto.especificaciones ? (
                        <p style={styles.specs}>
                          {concepto.especificaciones}
                        </p>
                      ) : null}
                    </div>

                    <strong style={styles.itemPrice}>
                      {money(concepto.subtotal)}
                    </strong>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside
            style={{
              ...styles.summaryCard,
              position: isMobile ? "static" : "sticky",
              top: isMobile ? undefined : 115,
              padding: isMobile ? 17 : 22,
            }}
          >
            <div style={styles.summaryTitleRow}>
              <Tag size={19} />
              <strong>Resumen de contratación</strong>
            </div>

            <div style={styles.amountRow}>
              <span>Subtotal</span>
              <strong>{money(totalBruto)}</strong>
            </div>

            <label style={styles.discountField}>
              <span style={styles.discountLabel}>
                Descuento en pesos
              </span>

              <div style={styles.discountInputWrap}>
                <span>$</span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={descuentoInput}
                  onChange={(event) =>
                    aplicarDescuento(event.target.value)
                  }
                  placeholder="0.00"
                  style={styles.discountInput}
                />
              </div>
            </label>

            {descuentoAplicado > 0 ? (
              <div style={styles.discountRow}>
                <span>Descuento aplicado</span>
                <strong>
                  - {money(descuentoAplicado)}
                </strong>
              </div>
            ) : null}

            <div style={styles.divider} />

            <div style={styles.totalBlock}>
              <span style={styles.totalLabel}>
                TOTAL DEL SERVICIO
              </span>
              <strong style={styles.totalValue}>
                {money(totalFinal)}
              </strong>
            </div>

            <div style={styles.limitBox}>
              <CalendarDays size={17} />

              <div>
                <span style={styles.limitLabel}>
                  Fecha límite para liquidar
                </span>
                <strong style={styles.limitValue}>
                  {formatearFecha(
                    datos.fechaLimiteLiquidacion ||
                      datos.fechaEvento
                  )}
                </strong>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={onConfirmar}
              disabled={guardando || totalFinal <= 0}
              style={{
                ...styles.confirmButton,
                opacity:
                  guardando || totalFinal <= 0 ? 0.65 : 1,
              }}
              whileHover={
                guardando ? undefined : { y: -2 }
              }
              whileTap={
                guardando ? undefined : { scale: 0.98 }
              }
            >
              <CheckCircle2 size={20} />
              {guardando
                ? "Creando servicio…"
                : "Crear y pasar al cobro"}
            </motion.button>

            <button
              type="button"
              onClick={onVolver}
              disabled={guardando}
              style={styles.summaryBackButton}
            >
              <ArrowLeft size={16} />
              Corregir carrito
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: THEME.bg,
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
    maxWidth: 1240,
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
    lineHeight: 1,
    letterSpacing: "-2px",
  },
  subtitle: {
    margin: "14px 0 0",
    color: THEME.textSoft,
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 760,
  },
  layout: {
    display: "grid",
    gap: 18,
    alignItems: "start",
  },
  mainColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },
  card: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 25,
    boxShadow: "0 20px 55px rgba(61,51,39,0.08)",
    minWidth: 0,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  sectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    background: "rgba(54,65,46,0.10)",
    color: THEME.olive,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionEyebrow: {
    margin: "0 0 3px",
    color: THEME.gold,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.5,
  },
  sectionTitle: {
    margin: 0,
    color: THEME.text,
    fontSize: 20,
    wordBreak: "break-word",
  },
  sectionText: {
    color: THEME.textSoft,
    fontSize: 12,
  },
  infoGrid: {
    display: "grid",
    gap: 10,
  },
  infoBox: {
    borderRadius: 16,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    padding: 14,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    minWidth: 0,
  },
  infoLabel: {
    display: "block",
    color: THEME.textSoft,
    fontSize: 9,
    fontWeight: 900,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoValue: {
    display: "block",
    color: THEME.text,
    fontSize: 13,
    wordBreak: "break-word",
  },
  infoText: {
    display: "block",
    color: THEME.textSoft,
    fontSize: 11,
    lineHeight: 1.4,
    marginTop: 3,
    wordBreak: "break-word",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  itemCard: {
    borderRadius: 17,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    padding: 14,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    minWidth: 0,
  },
  itemNumber: {
    width: 27,
    height: 27,
    borderRadius: 9,
    background: THEME.goldSoft,
    color: "#806527",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    color: THEME.text,
    fontSize: 14,
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  itemDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    color: THEME.textSoft,
    fontSize: 11,
    marginTop: 5,
  },
  tomasText: {
    color: THEME.olive,
    fontWeight: 900,
  },
  specs: {
    margin: "7px 0 0",
    color: THEME.textSoft,
    fontSize: 11,
    lineHeight: 1.4,
  },
  itemPrice: {
    color: THEME.text,
    fontSize: 14,
    flexShrink: 0,
  },
  summaryCard: {
    background: THEME.olive,
    color: THEME.white,
    borderRadius: 25,
    boxShadow: "0 24px 60px rgba(54,65,46,0.25)",
    boxSizing: "border-box",
  },
  summaryTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 22,
  },
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    marginBottom: 16,
  },
  discountField: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    marginBottom: 13,
  },
  discountLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: "rgba(255,255,255,0.70)",
  },
  discountInputWrap: {
    minHeight: 51,
    borderRadius: 15,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
  },
  discountInput: {
    width: "100%",
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#fff",
    WebkitTextFillColor: "#fff",
    fontSize: 17,
    fontWeight: 900,
    marginLeft: 7,
  },
  discountRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#f6d98d",
    fontSize: 12,
    marginBottom: 13,
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.13)",
    margin: "18px 0",
  },
  totalBlock: {
    display: "flex",
    flexDirection: "column",
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.5,
    opacity: 0.65,
  },
  totalValue: {
    fontSize: 34,
    marginTop: 4,
    wordBreak: "break-word",
  },
  limitBox: {
    borderRadius: 15,
    background: "rgba(255,255,255,0.09)",
    padding: 13,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    margin: "18px 0",
  },
  limitLabel: {
    display: "block",
    fontSize: 9,
    opacity: 0.65,
    marginBottom: 3,
  },
  limitValue: {
    fontSize: 11,
    lineHeight: 1.4,
    textTransform: "capitalize",
  },
  confirmButton: {
    width: "100%",
    minHeight: 57,
    borderRadius: 17,
    border: "none",
    background: THEME.gold,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontWeight: 900,
    cursor: "pointer",
  },
  summaryBackButton: {
    width: "100%",
    minHeight: 44,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontWeight: 800,
    cursor: "pointer",
    marginTop: 7,
  },
};

export default ServicioConfirmacion;
