import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../supabaseClient";

type ServicioRow = {
  id: string;
  folio: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  tipo_evento: string;
  fecha_evento: string;
  horario_evento: string | null;
  lugar_evento: string | null;
  fecha_pruebas: string | null;
  horario_pruebas: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  fecha_limite_liquidacion: string | null;
  estado: string;
  total_final: number;
  total_pagado: number;
  resta: number;
  pagado: boolean;
};

type TipoAgenda = "EVENTO" | "PRUEBAS" | "ENTREGA" | "LIQUIDACION";

type AgendaItem = {
  id: string;
  servicioId: string;
  folio: string;
  cliente: string;
  tipoEvento: string;
  fecha: string;
  horario: string | null;
  lugar: string | null;
  tipo: TipoAgenda;
  saldo: number;
};

type ServiciosCalendarioProps = {
  onVolver: () => void;
  onAbrirServicio: (servicioId: string) => void;
};

const COLORES: Record<TipoAgenda, string> = {
  EVENTO: "#36412e",
  PRUEBAS: "#b89f54",
  ENTREGA: "#237a4b",
  LIQUIDACION: "#b42318",
};

const FONDOS: Record<TipoAgenda, string> = {
  EVENTO: "#edf1e9",
  PRUEBAS: "#faf3df",
  ENTREGA: "#edf8f1",
  LIQUIDACION: "#fff1f0",
};

const obtenerFechaLocal = (fecha: Date) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const obtenerHoyLocal = () => obtenerFechaLocal(new Date());

const crearFechaLocal = (fecha: string) =>
  new Date(`${fecha}T12:00:00`);

const formatearHora = (hora: string | null) => {
  if (!hora) return "Horario por confirmar";

  const partes = hora.split(":");
  const fecha = new Date();
  fecha.setHours(Number(partes[0]), Number(partes[1] || 0), 0, 0);

  return fecha.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatearFechaCompleta = (fecha: string) =>
  crearFechaLocal(fecha).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const obtenerEtiqueta = (tipo: TipoAgenda) => {
  if (tipo === "EVENTO") return "Evento";
  if (tipo === "PRUEBAS") return "Pruebas y selección";
  if (tipo === "ENTREGA") return "Entrega final";
  return "Límite de pago";
};

const ServiciosCalendario = ({
  onVolver,
  onAbrirServicio,
}: ServiciosCalendarioProps) => {
  const hoy = obtenerHoyLocal();

  const [servicios, setServicios] = useState<ServicioRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [mesVisible, setMesVisible] = useState(() => {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  });
  const [anchoPantalla, setAnchoPantalla] = useState(
    window.innerWidth
  );

  const isMobile = anchoPantalla < 700;

  useEffect(() => {
    const actualizarAncho = () => setAnchoPantalla(window.innerWidth);
    window.addEventListener("resize", actualizarAncho);

    return () => {
      window.removeEventListener("resize", actualizarAncho);
    };
  }, []);

  const cargarServicios = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const { data, error: errorConsulta } = await supabase
        .from("servicios")
        .select(
          `
            id,
            folio,
            cliente_nombre,
            cliente_telefono,
            tipo_evento,
            fecha_evento,
            horario_evento,
            lugar_evento,
            fecha_pruebas,
            horario_pruebas,
            fecha_entrega,
            horario_entrega,
            fecha_limite_liquidacion,
            estado,
            total_final,
            total_pagado,
            resta,
            pagado
          `
        )
        .order("fecha_evento", { ascending: true });

      if (errorConsulta) throw errorConsulta;

      setServicios(
        ((data || []) as ServicioRow[]).filter(
          (servicio) =>
            String(servicio.estado || "").toUpperCase() !== "CANCELADO"
        )
      );
    } catch (err: any) {
      console.error("Error cargando calendario:", err);
      setError(
        err?.message ||
        "No se pudo cargar el calendario de servicios."
      );
      setServicios([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const agenda = useMemo<AgendaItem[]>(() => {
    const items: AgendaItem[] = [];

    servicios.forEach((servicio) => {
      if (servicio.fecha_evento) {
        items.push({
          id: `${servicio.id}-evento`,
          servicioId: servicio.id,
          folio: servicio.folio,
          cliente: servicio.cliente_nombre,
          tipoEvento: servicio.tipo_evento,
          fecha: servicio.fecha_evento,
          horario: servicio.horario_evento,
          lugar: servicio.lugar_evento,
          tipo: "EVENTO",
          saldo: Number(servicio.resta || 0),
        });
      }

      if (servicio.fecha_pruebas) {
        items.push({
          id: `${servicio.id}-pruebas`,
          servicioId: servicio.id,
          folio: servicio.folio,
          cliente: servicio.cliente_nombre,
          tipoEvento: servicio.tipo_evento,
          fecha: servicio.fecha_pruebas,
          horario: servicio.horario_pruebas,
          lugar: null,
          tipo: "PRUEBAS",
          saldo: Number(servicio.resta || 0),
        });
      }

      if (servicio.fecha_entrega) {
        items.push({
          id: `${servicio.id}-entrega`,
          servicioId: servicio.id,
          folio: servicio.folio,
          cliente: servicio.cliente_nombre,
          tipoEvento: servicio.tipo_evento,
          fecha: servicio.fecha_entrega,
          horario: servicio.horario_entrega,
          lugar: null,
          tipo: "ENTREGA",
          saldo: Number(servicio.resta || 0),
        });
      }

      if (
        servicio.fecha_limite_liquidacion &&
        Number(servicio.resta || 0) > 0
      ) {
        items.push({
          id: `${servicio.id}-liquidacion`,
          servicioId: servicio.id,
          folio: servicio.folio,
          cliente: servicio.cliente_nombre,
          tipoEvento: servicio.tipo_evento,
          fecha: servicio.fecha_limite_liquidacion,
          horario: null,
          lugar: null,
          tipo: "LIQUIDACION",
          saldo: Number(servicio.resta || 0),
        });
      }
    });

    return items.sort((a, b) => {
      const fechaComparada = a.fecha.localeCompare(b.fecha);
      if (fechaComparada !== 0) return fechaComparada;

      return String(a.horario || "99:99").localeCompare(
        String(b.horario || "99:99")
      );
    });
  }, [servicios]);

  const diasCalendario = useMemo(() => {
    const year = mesVisible.getFullYear();
    const month = mesVisible.getMonth();
    const primerDia = new Date(year, month, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const inicio = new Date(year, month, 1 - desplazamiento);

    return Array.from({ length: 42 }, (_, index) => {
      const fecha = new Date(
        inicio.getFullYear(),
        inicio.getMonth(),
        inicio.getDate() + index
      );

      return {
        fecha,
        iso: obtenerFechaLocal(fecha),
        perteneceAlMes: fecha.getMonth() === month,
      };
    });
  }, [mesVisible]);

  const agendaPorFecha = useMemo(() => {
    const mapa = new Map<string, AgendaItem[]>();

    agenda.forEach((item) => {
      const existentes = mapa.get(item.fecha) || [];
      mapa.set(item.fecha, [...existentes, item]);
    });

    return mapa;
  }, [agenda]);

  const agendaSeleccionada =
    agendaPorFecha.get(fechaSeleccionada) || [];

  const proximosEventos = useMemo(
    () =>
      agenda
        .filter(
          (item) => item.tipo === "EVENTO" && item.fecha >= hoy
        )
        .slice(0, 5),
    [agenda, hoy]
  );

  const cambiarMes = (cantidad: number) => {
    const nuevoMes = new Date(
      mesVisible.getFullYear(),
      mesVisible.getMonth() + cantidad,
      1
    );

    setMesVisible(nuevoMes);
    setFechaSeleccionada(obtenerFechaLocal(nuevoMes));
  };

  const irAHoy = () => {
    const ahora = new Date();
    setMesVisible(
      new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    );
    setFechaSeleccionada(hoy);
  };

  const tituloMes = mesVisible.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, #f4eedb 0%, #f6f1e8 44%, #f8f5ef 100%)",
        padding: isMobile ? "112px 14px 40px" : "138px 28px 60px",
        boxSizing: "border-box",
        color: "#1c1a15",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1380px",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          onClick={onVolver}
          style={{
            border: "none",
            background: "transparent",
            color: "#716b61",
            fontSize: "15px",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            padding: "8px 0",
            marginBottom: "14px",
          }}
        >
          <ArrowLeft size={18} />
          Volver a Servicios
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "flex-end",
            gap: "18px",
            marginBottom: "26px",
          }}
        >
          <div>
            <div
              style={{
                color: "#a68d3f",
                fontSize: "13px",
                fontWeight: 900,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Agenda de servicios
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? "36px" : "56px",
                lineHeight: 1,
                letterSpacing: "-2px",
              }}
            >
              Calendario
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                color: "#777168",
                fontSize: isMobile ? "15px" : "17px",
              }}
            >
              Eventos, pruebas, entregas y fechas límite de pago.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={irAHoy}
              style={styles.botonSecundario}
            >
              <CalendarCheck size={18} />
              Hoy
            </button>

            <button
              type="button"
              onClick={cargarServicios}
              style={styles.botonSecundario}
            >
              <RefreshCw size={18} />
              Actualizar
            </button>
          </div>
        </div>

        {error ? (
          <div
            style={{
              ...styles.tarjeta,
              color: "#b42318",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <AlertTriangle size={20} />
            {error}
          </div>
        ) : null}

        {cargando ? (
          <div
            style={{
              ...styles.tarjeta,
              minHeight: "360px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <Loader2
              size={34}
              color="#b89f54"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ color: "#777168", fontWeight: 700 }}>
              Cargando agenda...
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "minmax(0, 1fr)"
                : "minmax(0, 1.65fr) minmax(320px, 0.75fr)",
              gap: "22px",
              alignItems: "start",
            }}
          >
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.tarjeta}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr 48px",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => cambiarMes(-1)}
                  aria-label="Mes anterior"
                  style={styles.botonIcono}
                >
                  <ChevronLeft size={22} />
                </button>

                <h2
                  style={{
                    margin: 0,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    fontSize: isMobile ? "17px" : "25px",
                  }}
                >
                  {tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1)}
                </h2>

                <button
                  type="button"
                  onClick={() => cambiarMes(1)}
                  aria-label="Mes siguiente"
                  style={styles.botonIcono}
                >
                  <ChevronRight size={22} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: isMobile ? "3px" : "7px",
                  marginBottom: "6px",
                }}
              >
                {["L", "M", "M", "J", "V", "S", "D"].map(
                  (dia, index) => (
                    <div
                      key={`${dia}-${index}`}
                      style={{
                        textAlign: "center",
                        color: "#8b857b",
                        fontSize: "11px",
                        fontWeight: 900,
                        padding: "7px 0",
                      }}
                    >
                      {isMobile
                        ? dia
                        : [
                          "LUN",
                          "MAR",
                          "MIÉ",
                          "JUE",
                          "VIE",
                          "SÁB",
                          "DOM",
                        ][index]}
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: isMobile ? "3px" : "7px",
                }}
              >
                {diasCalendario.map((dia) => {
                  const items = agendaPorFecha.get(dia.iso) || [];
                  const seleccionado =
                    fechaSeleccionada === dia.iso;
                  const esHoy = dia.iso === hoy;

                  return (
                    <button
                      type="button"
                      key={dia.iso}
                      onClick={() =>
                        setFechaSeleccionada(dia.iso)
                      }
                      style={{
                        minWidth: 0,
                        minHeight: isMobile ? "55px" : "104px",
                        borderRadius: isMobile ? "11px" : "16px",
                        border: seleccionado
                          ? "2px solid #b89f54"
                          : esHoy
                            ? "1px solid #36412e"
                            : "1px solid rgba(184,159,84,0.18)",
                        background: seleccionado
                          ? "#fff9e9"
                          : "#fff",
                        padding: isMobile ? "6px 3px" : "9px",
                        textAlign: "left",
                        cursor: "pointer",
                        opacity: dia.perteneceAlMes ? 1 : 0.38,
                        overflow: "hidden",
                        boxSizing: "border-box",
                      }}
                    >
                      <span
                        style={{
                          width: isMobile ? "23px" : "28px",
                          height: isMobile ? "23px" : "28px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: esHoy ? "#36412e" : "transparent",
                          color: esHoy ? "#fff" : "#343129",
                          fontSize: isMobile ? "11px" : "13px",
                          fontWeight: 900,
                          marginBottom: "5px",
                        }}
                      >
                        {dia.fecha.getDate()}
                      </span>

                      {isMobile ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "3px",
                            paddingLeft: "2px",
                          }}
                        >
                          {items.slice(0, 5).map((item) => (
                            <span
                              key={item.id}
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: COLORES[item.tipo],
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                          }}
                        >
                          {items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              style={{
                                borderRadius: "7px",
                                background: FONDOS[item.tipo],
                                color: COLORES[item.tipo],
                                padding: "4px 6px",
                                fontSize: "9px",
                                fontWeight: 900,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {obtenerEtiqueta(item.tipo)} ·{" "}
                              {item.cliente}
                            </div>
                          ))}

                          {items.length > 3 ? (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                color: "#777168",
                              }}
                            >
                              +{items.length - 3} más
                            </span>
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px 18px",
                  marginTop: "20px",
                  paddingTop: "18px",
                  borderTop: "1px solid rgba(184,159,84,0.20)",
                }}
              >
                {(
                  [
                    "EVENTO",
                    "PRUEBAS",
                    "ENTREGA",
                    "LIQUIDACION",
                  ] as TipoAgenda[]
                ).map((tipo) => (
                  <div
                    key={tipo}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      color: "#69645b",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    <span
                      style={{
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: COLORES[tipo],
                      }}
                    />
                    {obtenerEtiqueta(tipo)}
                  </div>
                ))}
              </div>
            </motion.section>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px",
              }}
            >
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={styles.tarjeta}
              >
                <div
                  style={{
                    color: "#a68d3f",
                    fontSize: "11px",
                    fontWeight: 900,
                    letterSpacing: "1.7px",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Día seleccionado
                </div>

                <h2
                  style={{
                    margin: "0 0 18px",
                    fontSize: "21px",
                    textTransform: "capitalize",
                  }}
                >
                  {formatearFechaCompleta(fechaSeleccionada)}
                </h2>

                {agendaSeleccionada.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed rgba(184,159,84,0.35)",
                      borderRadius: "16px",
                      padding: "26px 18px",
                      textAlign: "center",
                      color: "#777168",
                    }}
                  >
                    No hay actividades programadas este día.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {agendaSeleccionada.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() =>
                          onAbrirServicio(item.servicioId)
                        }
                        style={{
                          border: `1px solid ${COLORES[item.tipo]}22`,
                          background: FONDOS[item.tipo],
                          borderRadius: "16px",
                          padding: "15px",
                          textAlign: "left",
                          cursor: "pointer",
                          color: "#1c1a15",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              color: COLORES[item.tipo],
                              fontSize: "11px",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            {obtenerEtiqueta(item.tipo)}
                          </span>

                          <span
                            style={{
                              color: "#777168",
                              fontSize: "10px",
                              fontWeight: 800,
                            }}
                          >
                            {item.folio}
                          </span>
                        </div>

                        <strong
                          style={{
                            display: "block",
                            fontSize: "16px",
                            marginBottom: "4px",
                          }}
                        >
                          {item.cliente}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            color: "#686259",
                            fontSize: "12px",
                            fontWeight: 700,
                            marginBottom: "7px",
                          }}
                        >
                          {item.tipoEvento}
                        </span>

                        {item.tipo === "LIQUIDACION" ? (
                          <div
                            style={{
                              color: "#b42318",
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                              fontSize: "13px",
                              fontWeight: 900,
                            }}
                          >
                            <CreditCard size={15} />
                            Saldo: {money(item.saldo)}
                          </div>
                        ) : (
                          <>
                            <div style={styles.lineaDato}>
                              <Clock3 size={15} />
                              {formatearHora(item.horario)}
                            </div>

                            {item.lugar ? (
                              <div style={styles.lineaDato}>
                                <MapPin size={15} />
                                {item.lugar}
                              </div>
                            ) : null}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={styles.tarjeta}
              >
                <div
                  style={{
                    color: "#a68d3f",
                    fontSize: "11px",
                    fontWeight: 900,
                    letterSpacing: "1.7px",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Próximos eventos
                </div>

                <h2
                  style={{
                    margin: "0 0 16px",
                    fontSize: "21px",
                  }}
                >
                  Lo que viene
                </h2>

                {proximosEventos.length === 0 ? (
                  <p
                    style={{
                      color: "#777168",
                      margin: 0,
                    }}
                  >
                    No hay próximos eventos registrados.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {proximosEventos.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setMesVisible(
                            new Date(
                              crearFechaLocal(item.fecha).getFullYear(),
                              crearFechaLocal(item.fecha).getMonth(),
                              1
                            )
                          );
                          setFechaSeleccionada(item.fecha);
                        }}
                        style={{
                          border: "1px solid rgba(184,159,84,0.20)",
                          background: "#fff",
                          borderRadius: "14px",
                          padding: "13px",
                          display: "grid",
                          gridTemplateColumns: "48px minmax(0, 1fr)",
                          gap: "12px",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "14px",
                            background: "#f7efd9",
                            color: "#8d752d",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                          }}
                        >
                          <span style={{ fontSize: "17px" }}>
                            {crearFechaLocal(item.fecha).getDate()}
                          </span>
                          <span
                            style={{
                              fontSize: "8px",
                              textTransform: "uppercase",
                            }}
                          >
                            {crearFechaLocal(item.fecha).toLocaleDateString(
                              "es-MX",
                              { month: "short" }
                            )}
                          </span>
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginBottom: "4px",
                            }}
                          >
                            {item.cliente}
                          </strong>

                          <span
                            style={{
                              display: "block",
                              color: "#777168",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {item.tipoEvento} ·{" "}
                            {formatearHora(item.horario)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tarjeta: {
    background: "#fffdf8",
    border: "1px solid rgba(184,159,84,0.22)",
    borderRadius: "25px",
    padding: "clamp(17px, 2.5vw, 27px)",
    boxShadow: "0 22px 60px rgba(61,51,39,0.10)",
    boxSizing: "border-box",
    minWidth: 0,
  },
  botonSecundario: {
    minHeight: "48px",
    border: "1px solid rgba(184,159,84,0.28)",
    background: "#fffdf8",
    color: "#403c34",
    borderRadius: "15px",
    padding: "0 18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  botonIcono: {
    width: "46px",
    height: "46px",
    border: "1px solid rgba(184,159,84,0.24)",
    background: "#fff",
    color: "#36412e",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  lineaDato: {
    color: "#686259",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "12px",
    fontWeight: 700,
    marginTop: "5px",
  },
};

export default ServiciosCalendario;