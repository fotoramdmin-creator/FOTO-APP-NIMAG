import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Factory,
  Loader2,
  PackageCheck,
  RefreshCcw,
} from "lucide-react";
import { supabase } from "../supabaseClient";

type ServicioRow = {
  id: string;
  folio: string;
  cliente_nombre: string;
  tipo_evento: string;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  estado: string;
};

type ConceptoRow = {
  id: string;
  cantidad: number;
  descripcion: string;
  medida: string | null;
  marco: string | null;
  especificaciones: string | null;
  tomas_seleccionadas: string[];
  orden: number;
};

type ItemRow = {
  id: string;
  concepto_id: string;
  estado: string;
};

type TareaRow = {
  id: string;
  item_id: string;
  tipo: string;
  nombre: string;
  orden: number;
  estado: string;
  proveedor_id: string | null;
  fecha_inicio: string | null;
  fecha_envio: string | null;
  fecha_estimada: string | null;
  fecha_recepcion: string | null;
  completado_at: string | null;
  notas: string | null;
};

type ProveedorRow = {
  id: string;
  nombre: string;
};

type FormularioTareaExterna = {
  proveedorNombre: string;
  fechaEstimada: string;
  notas: string;
};

type Props = {
  servicioId: string;
  usuarioId?: string;
  onVolver: () => void;
};

const etiquetaEstado = (estado: string) =>
  estado
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letra) =>
      letra.toUpperCase()
    );

const formatearFecha = (
  fecha: string | null
) => {
  if (!fecha) return "Sin fecha";

  return new Date(
    `${fecha.slice(0, 10)}T12:00:00`
  ).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatearFechaHora = (
  fecha: string | null
) => {
  if (!fecha) return "";

  return new Date(fecha).toLocaleString(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};

const ProduccionServicioDetalle = ({
  servicioId,
  usuarioId,
  onVolver,
}: Props) => {
  const [servicio, setServicio] =
    useState<ServicioRow | null>(null);
  const [conceptos, setConceptos] =
    useState<ConceptoRow[]>([]);
  const [items, setItems] =
    useState<ItemRow[]>([]);
  const [tareas, setTareas] =
    useState<TareaRow[]>([]);
  const [proveedores, setProveedores] =
    useState<ProveedorRow[]>([]);
  const [cargando, setCargando] =
    useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [guardandoTareaId, setGuardandoTareaId] =
    useState<string | null>(null);
  const [
    formulariosTareasExternas,
    setFormulariosTareasExternas,
  ] = useState<
    Record<string, FormularioTareaExterna>
  >({});
  const [error, setError] = useState("");

  const cargarDetalle = useCallback(
    async (silencioso = false) => {
      try {
        if (silencioso) {
          setActualizando(true);
        } else {
          setCargando(true);
        }

        setError("");

        const [
          {
            data: servicioData,
            error: errorServicio,
          },
          {
            data: conceptosData,
            error: errorConceptos,
          },
          {
            data: itemsData,
            error: errorItems,
          },
          {
            data: proveedoresData,
            error: errorProveedores,
          },
        ] = await Promise.all([
          supabase
            .from("servicios")
            .select(
              `
                id,
                folio,
                cliente_nombre,
                tipo_evento,
                fecha_entrega,
                horario_entrega,
                estado
              `
            )
            .eq("id", servicioId)
            .single(),

          supabase
            .from("servicios_conceptos")
            .select(
              `
                id,
                cantidad,
                descripcion,
                medida,
                marco,
                especificaciones,
                tomas_seleccionadas,
                orden
              `
            )
            .eq("servicio_id", servicioId)
            .order("orden", {
              ascending: true,
            }),

          supabase
            .from(
              "servicios_produccion_items"
            )
            .select(
              "id, concepto_id, estado"
            )
            .eq("servicio_id", servicioId),

          supabase
            .from("proveedores_produccion")
            .select("id, nombre")
            .eq("activo", true)
            .order("nombre", {
              ascending: true,
            }),
        ]);

        if (errorServicio) {
          throw errorServicio;
        }

        if (errorConceptos) {
          throw errorConceptos;
        }

        if (errorItems) {
          throw errorItems;
        }

        if (errorProveedores) {
          throw errorProveedores;
        }

        const itemsActuales =
          (itemsData || []) as ItemRow[];

        let tareasActuales: TareaRow[] = [];

        if (itemsActuales.length > 0) {
          const {
            data: tareasData,
            error: errorTareas,
          } = await supabase
            .from(
              "servicios_produccion_tareas"
            )
            .select(
              `
                id,
                item_id,
                tipo,
                nombre,
                orden,
                estado,
                proveedor_id,
                fecha_inicio,
                fecha_envio,
                fecha_estimada,
                fecha_recepcion,
                completado_at,
                notas
              `
            )
            .in(
              "item_id",
              itemsActuales.map(
                (item) => item.id
              )
            )
            .order("orden", {
              ascending: true,
            });

          if (errorTareas) {
            throw errorTareas;
          }

          tareasActuales =
            (tareasData || []) as TareaRow[];
        }

        setServicio(
          servicioData as ServicioRow
        );
        setConceptos(
          (conceptosData || []) as ConceptoRow[]
        );
        setItems(itemsActuales);
        setTareas(tareasActuales);
        setProveedores(
          (proveedoresData ||
            []) as ProveedorRow[]
        );
      } catch (err: any) {
        console.error(
          "Error cargando producción del servicio:",
          err
        );

        setError(
          err?.message ||
            "No se pudo cargar el seguimiento."
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [servicioId]
  );

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const tareasTerminadas = useMemo(
    () =>
      tareas.filter((tarea) =>
        [
          "COMPLETADO",
          "OMITIDO",
        ].includes(tarea.estado)
      ).length,
    [tareas]
  );

  const progreso =
    tareas.length > 0
      ? Math.round(
          (tareasTerminadas /
            tareas.length) *
            100
        )
      : 0;

  const proveedorNombre = (
    proveedorId: string | null
  ) =>
    proveedores.find(
      (proveedor) =>
        proveedor.id === proveedorId
    )?.nombre || "";

  const cambiarEstadoTarea = async (
    tarea: TareaRow,
    nuevoEstado: string
  ) => {
    if (guardandoTareaId) return;

    if (!usuarioId) {
      alert(
        "No se pudo identificar al usuario actual."
      );
      return;
    }

    try {
      setGuardandoTareaId(tarea.id);

      const { error: errorActualizacion } =
        await supabase.rpc(
          "actualizar_tarea_produccion",
          {
            p_tarea_id: tarea.id,
            p_estado: nuevoEstado,
            p_usuario_id: usuarioId,
            p_proveedor_id:
              tarea.proveedor_id || null,
            p_fecha_estimada:
              tarea.fecha_estimada
                ? tarea.fecha_estimada.slice(0, 10)
                : null,
            p_notas: tarea.notas || null,
          }
        );

      if (errorActualizacion) {
        throw errorActualizacion;
      }

      await cargarDetalle(true);
    } catch (err: any) {
      console.error(
        "Error actualizando tarea:",
        err
      );

      alert(
        err?.message ||
          "No se pudo actualizar la tarea."
      );
    } finally {
      setGuardandoTareaId(null);
    }
  };

    const actualizarFormularioExterno = (
    tareaId: string,
    cambios: Partial<FormularioTareaExterna>
  ) => {
    setFormulariosTareasExternas((prev) => ({
      ...prev,
      [tareaId]: {
        proveedorNombre:
          prev[tareaId]?.proveedorNombre || "",
        fechaEstimada:
          prev[tareaId]?.fechaEstimada || "",
        notas: prev[tareaId]?.notas || "",
        ...cambios,
      },
    }));
  };

  const enviarTareaProveedor = async (
    tarea: TareaRow
  ) => {
    if (guardandoTareaId) return;

    if (!usuarioId) {
      alert(
        "No se pudo identificar al usuario actual."
      );
      return;
    }

    const formulario =
      formulariosTareasExternas[tarea.id] || {
        proveedorNombre: "",
        fechaEstimada: "",
        notas: "",
      };

    const proveedorEscrito =
      formulario.proveedorNombre
        .trim()
        .toUpperCase();

    try {
      setGuardandoTareaId(tarea.id);

      let proveedorId: string | null = null;

      if (proveedorEscrito) {
        const {
          data: proveedorExistente,
          error: errorBusqueda,
        } = await supabase
          .from("proveedores_produccion")
          .select("id, nombre")
          .ilike("nombre", proveedorEscrito)
          .limit(1)
          .maybeSingle();

        if (errorBusqueda) {
          throw errorBusqueda;
        }

        if (proveedorExistente?.id) {
          proveedorId = proveedorExistente.id;
        } else {
          const {
            data: proveedorCreado,
            error: errorProveedor,
          } = await supabase
            .from("proveedores_produccion")
            .insert({
              nombre: proveedorEscrito,
              activo: true,
              creado_por: usuarioId,
            })
            .select("id, nombre")
            .single();

          if (errorProveedor) {
            throw errorProveedor;
          }

          proveedorId = proveedorCreado.id;
        }
      }

      const { error: errorActualizacion } =
        await supabase.rpc(
          "actualizar_tarea_produccion",
          {
            p_tarea_id: tarea.id,
            p_estado: "ENVIADO_PROVEEDOR",
            p_usuario_id: usuarioId,
            p_proveedor_id: proveedorId,
            p_fecha_estimada:
              formulario.fechaEstimada || null,
            p_notas:
              formulario.notas.trim() || null,
          }
        );

      if (errorActualizacion) {
        throw errorActualizacion;
      }

      setFormulariosTareasExternas((prev) => {
        const siguiente = { ...prev };
        delete siguiente[tarea.id];
        return siguiente;
      });

      await cargarDetalle(true);
    } catch (err: any) {
      console.error(
        "Error enviando tarea al proveedor:",
        err
      );

      alert(
        err?.message ||
          "No se pudo registrar el envío."
      );
    } finally {
      setGuardandoTareaId(null);
    }
  };

  if (cargando) {
    return (
      <main style={styles.centerPage}>
        <Loader2 size={36} />
        <strong>
          Cargando seguimiento…
        </strong>
      </main>
    );
  }

  if (error || !servicio) {
    return (
      <main style={styles.centerPage}>
        <strong>
          No se pudo abrir el servicio
        </strong>
        <span>{error}</span>

        <button
          type="button"
          onClick={onVolver}
          style={styles.backButton}
        >
          Volver
        </button>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <button
            type="button"
            onClick={onVolver}
            style={styles.backLink}
          >
            <ArrowLeft size={17} />
            Volver a Producción
          </button>

          <div style={styles.folioRow}>
            <span style={styles.folio}>
              {servicio.folio}
            </span>

            <span
              style={{
                ...styles.status,
                background:
                  servicio.estado ===
                  "LISTO_ENTREGA"
                    ? "#edf8f1"
                    : "#f8f0dc",
                color:
                  servicio.estado ===
                  "LISTO_ENTREGA"
                    ? "#237a4b"
                    : "#806527",
              }}
            >
              {etiquetaEstado(
                servicio.estado
              )}
            </span>
          </div>

          <h1 style={styles.title}>
            {servicio.cliente_nombre}
          </h1>

          <p style={styles.subtitle}>
            {servicio.tipo_evento}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            cargarDetalle(true)
          }
          disabled={actualizando}
          style={styles.refreshButton}
        >
          <RefreshCcw size={17} />
          {actualizando
            ? "Actualizando…"
            : "Actualizar"}
        </button>
      </header>

      <section style={styles.hero}>
        <div style={styles.heroTop}>
          <div>
            <span style={styles.heroLabel}>
              AVANCE GENERAL
            </span>
            <strong style={styles.heroValue}>
              {progreso}%
            </strong>
          </div>

          <div style={styles.deliveryBox}>
            <CalendarDays size={19} />

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
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progreso}%`,
            }}
          />
        </div>

        <span style={styles.progressText}>
          {tareasTerminadas} de{" "}
          {tareas.length} tareas terminadas
        </span>
      </section>

      <div style={styles.productsList}>
        {items.map((item, index) => {
          const concepto = conceptos.find(
            (actual) =>
              actual.id === item.concepto_id
          );

          const tareasItem = tareas.filter(
            (tarea) =>
              tarea.item_id === item.id
          );

          if (!concepto) return null;

          return (
            <motion.article
              key={item.id}
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
              style={styles.productCard}
            >
              <div style={styles.productHeader}>
                <div>
                  <span style={styles.productNumber}>
                    PRODUCTO {index + 1}
                  </span>

                  <h2 style={styles.productTitle}>
                    {concepto.cantidad} ×{" "}
                    {concepto.descripcion}
                  </h2>

                  <div style={styles.productMeta}>
                    {concepto.medida ? (
                      <span>
                        Medida:{" "}
                        {concepto.medida}
                      </span>
                    ) : null}

                    {concepto.marco ? (
                      <span>
                        Marco:{" "}
                        {concepto.marco}
                      </span>
                    ) : null}

                    {concepto
                      .tomas_seleccionadas
                      .length > 0 ? (
                      <span style={styles.tomas}>
                        Tomas:{" "}
                        {concepto.tomas_seleccionadas.join(
                          ", "
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>

                {item.estado === "LISTO" ? (
                  <PackageCheck
                    size={27}
                    color="#237a4b"
                  />
                ) : (
                  <Factory
                    size={25}
                    color="#b89f54"
                  />
                )}
              </div>

              <div style={styles.timeline}>
                {tareasItem.map(
                  (tarea, tareaIndex) => {
                    const terminada = [
                      "COMPLETADO",
                      "OMITIDO",
                    ].includes(
                      tarea.estado
                    );

                                    const proveedor =
                      proveedorNombre(
                        tarea.proveedor_id
                      );

                    const esTareaExterna = [
                      "IMPRESION",
                      "ENMARCADO",
                      "ARMADO_ALBUM",
                    ].includes(tarea.tipo);

                    return (
                      <div
                        key={tarea.id}
                        style={styles.taskRow}
                      >
                        <div
                          style={{
                            ...styles.taskIcon,
                            background: terminada
                              ? "#237a4b"
                              : tarea.estado ===
                                  "PENDIENTE"
                                ? "#eee9df"
                                : "#b89f54",
                            color: terminada
                              ? "#fff"
                              : "#36412e",
                          }}
                        >
                          {terminada ? (
                            <CheckCircle2
                              size={16}
                            />
                          ) : (
                            <Clock3 size={16} />
                          )}
                        </div>

                        <div style={styles.taskInfo}>
                          <div
                            style={
                              styles.taskHeading
                            }
                          >
                            <strong>
                              {tareaIndex + 1}.{" "}
                              {tarea.nombre}
                            </strong>

                            <span>
                              {etiquetaEstado(
                                tarea.estado
                              )}
                            </span>
                          </div>

                          {proveedor ? (
                            <small>
                              Proveedor:{" "}
                              {proveedor}
                            </small>
                          ) : null}

                          {tarea.fecha_estimada ? (
                            <small>
                              Estimado:{" "}
                              {formatearFecha(
                                tarea.fecha_estimada
                              )}
                            </small>
                          ) : null}

                          {tarea.fecha_envio ? (
                            <small>
                              Enviado:{" "}
                              {formatearFechaHora(
                                tarea.fecha_envio
                              )}
                            </small>
                          ) : null}

                          {tarea.fecha_recepcion ? (
                            <small>
                              Recibido:{" "}
                              {formatearFechaHora(
                                tarea.fecha_recepcion
                              )}
                            </small>
                          ) : null}

                          {tarea.completado_at ? (
                            <small>
                              Terminado:{" "}
                              {formatearFechaHora(
                                tarea.completado_at
                              )}
                            </small>
                          ) : null}

                                                {tarea.notas ? (
                            <small>
                              Nota: {tarea.notas}
                            </small>
                          ) : null}

                          {!esTareaExterna &&
                          !terminada ? (
                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstadoTarea(
                                  tarea,
                                  tarea.estado ===
                                    "PENDIENTE"
                                    ? "EN_PROCESO"
                                    : "COMPLETADO"
                                )
                              }
                              disabled={
                                guardandoTareaId !== null
                              }
                              style={{
                                width: "100%",
                                minHeight: 43,
                                marginTop: 10,
                                borderRadius: 13,
                                border: "none",
                                background:
                                  tarea.estado ===
                                  "PENDIENTE"
                                    ? "#b89f54"
                                    : "#36412e",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 7,
                                fontSize: 12,
                                fontWeight: 900,
                                cursor:
                                  guardandoTareaId !==
                                  null
                                    ? "wait"
                                    : "pointer",
                                opacity:
                                  guardandoTareaId !==
                                    null &&
                                  guardandoTareaId !==
                                    tarea.id
                                    ? 0.55
                                    : 1,
                              }}
                            >
                              {guardandoTareaId ===
                              tarea.id
                                ? "Guardando…"
                                : tarea.estado ===
                                    "PENDIENTE"
                                  ? "Iniciar tarea"
                                  : "Marcar completada"}
                                                    </button>
                          ) : null}

                          {esTareaExterna &&
                          tarea.estado ===
                            "PENDIENTE" ? (
                            <div
                              style={{
                                marginTop: 12,
                                padding: 13,
                                borderRadius: 14,
                                background: "#f8f5ee",
                                border:
                                  "1px solid rgba(184,159,84,0.25)",
                                display: "grid",
                                gap: 10,
                              }}
                            >
                              <strong
                                style={{
                                  color: "#36412e",
                                  fontSize: 12,
                                }}
                              >
                                Registrar envío
                              </strong>

                              <input
                                type="text"
                                list={`proveedores-${tarea.id}`}
                                value={
                                  formulariosTareasExternas[
                                    tarea.id
                                  ]?.proveedorNombre ||
                                  ""
                                }
                                onChange={(event) =>
                                  actualizarFormularioExterno(
                                    tarea.id,
                                    {
                                      proveedorNombre:
                                        event.target
                                          .value,
                                    }
                                  )
                                }
                                placeholder="Proveedor (opcional)"
                                disabled={
                                  guardandoTareaId !==
                                  null
                                }
                                style={{
                                  width: "100%",
                                  minHeight: 45,
                                  boxSizing:
                                    "border-box",
                                  borderRadius: 12,
                                  border:
                                    "1px solid rgba(0,0,0,0.10)",
                                  background: "#fff",
                                  color: "#1c1a15",
                                  WebkitTextFillColor:
                                    "#1c1a15",
                                  padding: "0 12px",
                                  fontSize: 13,
                                  outline: "none",
                                }}
                              />

                              <datalist
                                id={`proveedores-${tarea.id}`}
                              >
                                {proveedores.map(
                                  (proveedorOpcion) => (
                                    <option
                                      key={
                                        proveedorOpcion.id
                                      }
                                      value={
                                        proveedorOpcion.nombre
                                      }
                                    />
                                  )
                                )}
                              </datalist>

                              <label
                                style={{
                                  display: "grid",
                                  gap: 6,
                                  color: "#777168",
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              >
                                Fecha estimada de regreso
                                <input
                                  type="date"
                                  value={
                                    formulariosTareasExternas[
                                      tarea.id
                                    ]?.fechaEstimada ||
                                    ""
                                  }
                                  onChange={(event) =>
                                    actualizarFormularioExterno(
                                      tarea.id,
                                      {
                                        fechaEstimada:
                                          event.target
                                            .value,
                                      }
                                    )
                                  }
                                  disabled={
                                    guardandoTareaId !==
                                    null
                                  }
                                  style={{
                                    width: "100%",
                                    minHeight: 45,
                                    boxSizing:
                                      "border-box",
                                    borderRadius: 12,
                                    border:
                                      "1px solid rgba(0,0,0,0.10)",
                                    background: "#fff",
                                    color: "#1c1a15",
                                    WebkitTextFillColor:
                                      "#1c1a15",
                                    padding: "0 12px",
                                    fontSize: 13,
                                    outline: "none",
                                  }}
                                />
                              </label>

                              <textarea
                                value={
                                  formulariosTareasExternas[
                                    tarea.id
                                  ]?.notas || ""
                                }
                                onChange={(event) =>
                                  actualizarFormularioExterno(
                                    tarea.id,
                                    {
                                      notas:
                                        event.target
                                          .value,
                                    }
                                  )
                                }
                                placeholder="Nota opcional"
                                rows={2}
                                maxLength={300}
                                disabled={
                                  guardandoTareaId !==
                                  null
                                }
                                style={{
                                  width: "100%",
                                  boxSizing:
                                    "border-box",
                                  resize: "vertical",
                                  borderRadius: 12,
                                  border:
                                    "1px solid rgba(0,0,0,0.10)",
                                  background: "#fff",
                                  color: "#1c1a15",
                                  WebkitTextFillColor:
                                    "#1c1a15",
                                  padding: 12,
                                  fontSize: 13,
                                  fontFamily: "inherit",
                                  outline: "none",
                                }}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  enviarTareaProveedor(
                                    tarea
                                  )
                                }
                                disabled={
                                  guardandoTareaId !==
                                  null
                                }
                                style={{
                                  minHeight: 45,
                                  borderRadius: 13,
                                  border: "none",
                                  background: "#b89f54",
                                  color: "#fff",
                                  fontSize: 12,
                                  fontWeight: 900,
                                  cursor:
                                    guardandoTareaId !==
                                    null
                                      ? "wait"
                                      : "pointer",
                                }}
                              >
                                {guardandoTareaId ===
                                tarea.id
                                  ? "Guardando envío…"
                                  : "Marcar enviada"}
                              </button>
                            </div>
                          ) : null}

                          {esTareaExterna &&
                          tarea.estado ===
                            "ENVIADO_PROVEEDOR" ? (
                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstadoTarea(
                                  tarea,
                                  "RECIBIDO_PROVEEDOR"
                                )
                              }
                              disabled={
                                guardandoTareaId !== null
                              }
                              style={{
                                width: "100%",
                                minHeight: 43,
                                marginTop: 10,
                                borderRadius: 13,
                                border: "none",
                                background: "#b89f54",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 900,
                                cursor:
                                  guardandoTareaId !==
                                  null
                                    ? "wait"
                                    : "pointer",
                              }}
                            >
                              {guardandoTareaId ===
                              tarea.id
                                ? "Guardando…"
                                : "Marcar recibida"}
                            </button>
                          ) : null}

                          {esTareaExterna &&
                          tarea.estado ===
                            "RECIBIDO_PROVEEDOR" ? (
                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstadoTarea(
                                  tarea,
                                  "COMPLETADO"
                                )
                              }
                              disabled={
                                guardandoTareaId !== null
                              }
                              style={{
                                width: "100%",
                                minHeight: 43,
                                marginTop: 10,
                                borderRadius: 13,
                                border: "none",
                                background: "#36412e",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 900,
                                cursor:
                                  guardandoTareaId !==
                                  null
                                    ? "wait"
                                    : "pointer",
                              }}
                            >
                              {guardandoTareaId ===
                              tarea.id
                                ? "Guardando…"
                                : "Completar revisión"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </main>
  );
};

const styles: {
  [key: string]: React.CSSProperties;
} = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7f5f0 0%, #f1eee8 100%)",
    padding: "105px 16px 45px",
    boxSizing: "border-box",
  },
  centerPage: {
    minHeight: "100vh",
    background: "#f6f1e8",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "#1c1a15",
    textAlign: "center",
  },
  header: {
    maxWidth: 1100,
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  backLink: {
    border: "none",
    background: "transparent",
    color: "#777168",
    padding: 0,
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    fontWeight: 900,
    marginBottom: 17,
  },
  backButton: {
    minHeight: 45,
    borderRadius: 14,
    border: "none",
    background: "#36412e",
    color: "#fff",
    padding: "0 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  folioRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  folio: {
    borderRadius: 9,
    background: "#36412e",
    color: "#fff",
    padding: "5px 9px",
    fontSize: 9,
    fontWeight: 900,
  },
  status: {
    borderRadius: 9,
    padding: "5px 9px",
    fontSize: 9,
    fontWeight: 900,
  },
  title: {
    margin: "12px 0 5px",
    color: "#1c1a15",
    fontSize: "clamp(34px, 7vw, 52px)",
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    color: "#777168",
    fontSize: 15,
  },
  refreshButton: {
    minHeight: 45,
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
  hero: {
    maxWidth: 1100,
    margin: "0 auto 18px",
    borderRadius: 24,
    background: "#36412e",
    color: "#fff",
    padding: 20,
    boxSizing: "border-box",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
    flexWrap: "wrap",
  },
  heroLabel: {
    display: "block",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.4,
    opacity: 0.65,
  },
  heroValue: {
    display: "block",
    fontSize: 36,
    marginTop: 3,
  },
  deliveryBox: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    color: "#fff",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginTop: 17,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "#b89f54",
    transition: "width 0.25s ease",
  },
  progressText: {
    display: "block",
    marginTop: 8,
    fontSize: 11,
    opacity: 0.72,
  },
  productsList: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  productCard: {
    borderRadius: 24,
    border:
      "1px solid rgba(184,159,84,0.25)",
    background: "#fffdf8",
    padding: 19,
    boxShadow:
      "0 14px 35px rgba(61,51,39,0.07)",
  },
  productHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 13,
    marginBottom: 17,
  },
  productNumber: {
    color: "#b89f54",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.4,
  },
  productTitle: {
    margin: "6px 0",
    color: "#1c1a15",
    fontSize: 20,
  },
  productMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    color: "#777168",
    fontSize: 11,
  },
  tomas: {
    color: "#237a4b",
    fontWeight: 900,
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  taskRow: {
    borderRadius: 16,
    border:
      "1px solid rgba(184,159,84,0.20)",
    background: "#fff",
    padding: 12,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  taskIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  taskInfo: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    color: "#777168",
    fontSize: 11,
  },
  taskHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    color: "#1c1a15",
    flexWrap: "wrap",
  },
};

export default ProduccionServicioDetalle;
