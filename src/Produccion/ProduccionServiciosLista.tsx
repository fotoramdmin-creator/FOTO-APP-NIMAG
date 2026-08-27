import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Factory,
  RefreshCcw,
  Search,
  User,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";

type ServicioProduccionRow = {
  id: string;
  folio: string;
  cliente_nombre: string;
  tipo_evento: string;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  estado: string;
  created_at: string;
};

type ItemProduccionRow = {
  id: string;
  servicio_id: string;
  estado: string;
};

type TareaProduccionRow = {
  id: string;
  item_id: string;
  estado: string;
};

type ServicioPreparado = ServicioProduccionRow & {
  totalItems: number;
  itemsListos: number;
  totalTareas: number;
  tareasTerminadas: number;
  progreso: number;
};

type Props = {
  onAbrirServicio: (servicioId: string) => void;
};

const formatearFecha = (fecha: string | null) => {
  if (!fecha) return "Sin fecha";

  return new Date(`${fecha}T12:00:00`).toLocaleDateString(
    "es-MX",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

const normalizar = (texto: string) =>
  String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const ProduccionServiciosLista = ({
  onAbrirServicio,
}: Props) => {
  const [servicios, setServicios] = useState<
    ServicioPreparado[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  const cargarServicios = useCallback(
    async (silencioso = false) => {
      try {
        if (silencioso) {
          setActualizando(true);
        } else {
          setCargando(true);
        }

        setError("");

        const {
          data: serviciosData,
          error: errorServicios,
        } = await supabase
          .from("servicios")
          .select(
            `
              id,
              folio,
              cliente_nombre,
              tipo_evento,
              fecha_entrega,
              horario_entrega,
              estado,
              created_at
            `
          )
          .in("estado", [
            "EN_PRODUCCION",
            "LISTO_ENTREGA",
          ])
          .order("fecha_entrega", {
            ascending: true,
            nullsFirst: false,
          });

        if (errorServicios) {
          throw errorServicios;
        }

        const serviciosBase =
          (serviciosData || []) as ServicioProduccionRow[];

        if (serviciosBase.length === 0) {
          setServicios([]);
          return;
        }

        const serviciosIds = serviciosBase.map(
          (servicio) => servicio.id
        );

        const {
          data: itemsData,
          error: errorItems,
        } = await supabase
          .from("servicios_produccion_items")
          .select("id, servicio_id, estado")
          .in("servicio_id", serviciosIds);

        if (errorItems) {
          throw errorItems;
        }

        const items =
          (itemsData || []) as ItemProduccionRow[];

        const itemsIds = items.map((item) => item.id);

        let tareas: TareaProduccionRow[] = [];

        if (itemsIds.length > 0) {
          const {
            data: tareasData,
            error: errorTareas,
          } = await supabase
            .from("servicios_produccion_tareas")
            .select("id, item_id, estado")
            .in("item_id", itemsIds);

          if (errorTareas) {
            throw errorTareas;
          }

          tareas =
            (tareasData || []) as TareaProduccionRow[];
        }

        const preparados = serviciosBase.map(
          (servicio): ServicioPreparado => {
            const itemsServicio = items.filter(
              (item) =>
                item.servicio_id === servicio.id
            );

            const idsItemsServicio = new Set(
              itemsServicio.map((item) => item.id)
            );

            const tareasServicio = tareas.filter(
              (tarea) =>
                idsItemsServicio.has(tarea.item_id)
            );

            const tareasTerminadas =
              tareasServicio.filter((tarea) =>
                ["COMPLETADO", "OMITIDO"].includes(
                  tarea.estado
                )
              ).length;

            const totalTareas =
              tareasServicio.length;

            const progreso =
              totalTareas > 0
                ? Math.round(
                    (tareasTerminadas /
                      totalTareas) *
                      100
                  )
                : 0;

            return {
              ...servicio,
              totalItems: itemsServicio.length,
              itemsListos: itemsServicio.filter(
                (item) => item.estado === "LISTO"
              ).length,
              totalTareas,
              tareasTerminadas,
              progreso,
            };
          }
        );

        setServicios(preparados);
      } catch (err: any) {
        console.error(
          "Error cargando producción de servicios:",
          err
        );

        setError(
          err?.message ||
            "No se pudo cargar la producción de servicios."
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const serviciosFiltrados = useMemo(() => {
    const texto = normalizar(busqueda);

    if (!texto) return servicios;

    return servicios.filter((servicio) =>
      normalizar(
        [
          servicio.folio,
          servicio.cliente_nombre,
          servicio.tipo_evento,
        ].join(" ")
      ).includes(texto)
    );
  }, [busqueda, servicios]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <section style={styles.container}>
      <div style={styles.toolbar}>
        <div>
          <span style={styles.eyebrow}>
            SERVICIOS EN PROCESO
          </span>

          <h2 style={styles.title}>
            Producción de servicios
          </h2>

          <p style={styles.subtitle}>
            Seguimiento de cada producto hasta que
            regrese terminado al estudio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => cargarServicios(true)}
          disabled={actualizando}
          style={styles.refreshButton}
        >
          <RefreshCcw size={18} />
          {actualizando
            ? "Actualizando…"
            : "Actualizar"}
        </button>
      </div>

      <div style={styles.searchBox}>
        <Search size={18} />

        <input
          type="text"
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
          placeholder="Buscar cliente, folio o evento"
          style={styles.searchInput}
        />

        {busqueda ? (
          <button
            type="button"
            onClick={() => setBusqueda("")}
            style={styles.clearButton}
          >
            <X size={17} />
          </button>
        ) : null}
      </div>

      {error ? (
        <div style={styles.errorBox}>{error}</div>
      ) : null}

      {cargando ? (
        <div style={styles.loadingList}>
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <div
                key={index}
                style={styles.loadingCard}
              />
            )
          )}
        </div>
      ) : serviciosFiltrados.length === 0 ? (
        <div style={styles.emptyBox}>
          <Factory size={36} color="#b89f54" />
          <strong>
            {busqueda
              ? "No encontramos ese servicio"
              : "No hay servicios en producción"}
          </strong>
          <span>
            Los servicios aparecerán aquí después de
            seleccionar sus tareas y enviarlos.
          </span>
        </div>
      ) : (
        <div style={styles.list}>
          {serviciosFiltrados.map(
            (servicio, index) => {
              const fechaEntrega =
                servicio.fecha_entrega
                  ? new Date(
                      `${servicio.fecha_entrega}T12:00:00`
                    )
                  : null;

              const atrasado =
                Boolean(fechaEntrega) &&
                fechaEntrega!.getTime() <
                  hoy.getTime() &&
                servicio.estado !== "LISTO_ENTREGA";

              const listo =
                servicio.estado === "LISTO_ENTREGA";

              return (
                <motion.article
                  key={servicio.id}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.03,
                  }}
                  style={{
                    ...styles.card,
                    borderLeft: `7px solid ${
                      listo
                        ? "#237a4b"
                        : atrasado
                          ? "#b42318"
                          : "#b89f54"
                    }`,
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div>
                      <div style={styles.folioRow}>
                        <span style={styles.folio}>
                          {servicio.folio}
                        </span>

                        <span
                          style={{
                            ...styles.status,
                            background: listo
                              ? "#edf8f1"
                              : atrasado
                                ? "#fff1f0"
                                : "#f8f0dc",
                            color: listo
                              ? "#237a4b"
                              : atrasado
                                ? "#b42318"
                                : "#806527",
                          }}
                        >
                          {listo
                            ? "LISTO PARA ENTREGA"
                            : atrasado
                              ? "ATRASADO"
                              : "EN PRODUCCIÓN"}
                        </span>
                      </div>

                      <h3 style={styles.clientName}>
                        {servicio.cliente_nombre}
                      </h3>

                      <span style={styles.eventType}>
                        {servicio.tipo_evento}
                      </span>
                    </div>

                    {listo ? (
                      <CheckCircle2
                        size={27}
                        color="#237a4b"
                      />
                    ) : (
                      <Clock3
                        size={25}
                        color={
                          atrasado
                            ? "#b42318"
                            : "#b89f54"
                        }
                      />
                    )}
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoBox}>
                      <CalendarDays size={17} />

                      <div>
                        <span>
                          Entrega prometida
                        </span>
                        <strong>
                          {formatearFecha(
                            servicio.fecha_entrega
                          )}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.infoBox}>
                      <Factory size={17} />

                      <div>
                        <span>Productos</span>
                        <strong>
                          {servicio.itemsListos}/
                          {servicio.totalItems} listos
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div style={styles.progressSection}>
                    <div style={styles.progressHeader}>
                      <span>
                        {servicio.tareasTerminadas} de{" "}
                        {servicio.totalTareas} tareas
                      </span>

                      <strong>
                        {servicio.progreso}%
                      </strong>
                    </div>

                    <div style={styles.progressTrack}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${servicio.progreso}%`,
                          background: listo
                            ? "#237a4b"
                            : "#b89f54",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onAbrirServicio(servicio.id)
                    }
                    style={styles.openButton}
                  >
                    Ver seguimiento
                    <ChevronRight size={18} />
                  </button>
                </motion.article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
};

const styles: {
  [key: string]: React.CSSProperties;
} = {
  container: {
    width: "100%",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#b89f54",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.6,
  },
  title: {
    margin: "6px 0",
    color: "#1c1a15",
    fontSize: "clamp(27px, 5vw, 38px)",
  },
  subtitle: {
    margin: 0,
    color: "#777168",
    fontSize: 14,
    lineHeight: 1.5,
  },
  refreshButton: {
    minHeight: 44,
    borderRadius: 14,
    border:
      "1px solid rgba(184,159,84,0.25)",
    background: "#fff",
    color: "#36412e",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
  },
  searchBox: {
    minHeight: 54,
    borderRadius: 17,
    border:
      "1px solid rgba(184,159,84,0.25)",
    background: "#fff",
    padding: "0 15px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    boxSizing: "border-box",
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#1c1a15",
    WebkitTextFillColor: "#1c1a15",
    fontSize: 15,
  },
  clearButton: {
    border: "none",
    background: "transparent",
    color: "#777168",
    cursor: "pointer",
    display: "flex",
  },
  errorBox: {
    borderRadius: 15,
    background: "#fff1f0",
    color: "#b42318",
    padding: 14,
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 15,
  },
  loadingList: {
    display: "flex",
    flexDirection: "column",
    gap: 13,
  },
  loadingCard: {
    height: 230,
    borderRadius: 24,
    background: "rgba(0,0,0,0.06)",
  },
  emptyBox: {
    minHeight: 240,
    borderRadius: 24,
    border:
      "1px dashed rgba(184,159,84,0.35)",
    background: "#fffdf8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    color: "#777168",
    textAlign: "center",
    padding: 24,
  },
  list: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: 15,
  },
  card: {
    borderRadius: 24,
    border:
      "1px solid rgba(184,159,84,0.25)",
    background: "#fffdf8",
    padding: 19,
    boxShadow:
      "0 14px 35px rgba(61,51,39,0.08)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 13,
  },
  folioRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  folio: {
    borderRadius: 9,
    background: "#36412e",
    color: "#fff",
    padding: "5px 8px",
    fontSize: 9,
    fontWeight: 900,
  },
  status: {
    borderRadius: 9,
    padding: "5px 8px",
    fontSize: 9,
    fontWeight: 900,
  },
  clientName: {
    margin: "12px 0 4px",
    color: "#1c1a15",
    fontSize: 21,
  },
  eventType: {
    color: "#777168",
    fontSize: 12,
    fontWeight: 700,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 9,
    marginTop: 17,
  },
  infoBox: {
    minHeight: 65,
    borderRadius: 15,
    background: "#f8f5ee",
    padding: 11,
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    color: "#36412e",
    boxSizing: "border-box",
  },
  progressSection: {
    marginTop: 17,
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: "#777168",
    fontSize: 11,
    marginBottom: 7,
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    background: "#eee9df",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.25s ease",
  },
  openButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: 15,
    border: "none",
    background: "#36412e",
    color: "#fff",
    marginTop: 17,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
  },
};

export default ProduccionServiciosLista;