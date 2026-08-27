import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Factory,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  ConceptoParaProduccion,
  OPCIONES_TAREAS_PRODUCCION,
  TipoTareaProduccion,
} from "./serviciosProduccionTypes";

type Props = {
  servicioId: string;
  conceptos: ConceptoParaProduccion[];
  usuarioId?: string;
  onCancelar: () => void;
  onEnviado: () => void;
};

const THEME = {
  card: "#fffdf8",
  text: "#1c1a15",
  textSoft: "#777168",
  olive: "#36412e",
  gold: "#b89f54",
  goldSoft: "#f8f0dc",
  border: "rgba(184,159,84,0.25)",
  red: "#b42318",
  redSoft: "#fff1f0",
  green: "#237a4b",
  greenSoft: "#edf8f1",
};

const sugerirTareas = (
  concepto: ConceptoParaProduccion
): TipoTareaProduccion[] => {
  const texto = [
    concepto.descripcion,
    concepto.marco,
    concepto.especificaciones,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  const sugeridas: TipoTareaProduccion[] = [];

  if (/VIDEO|DRON/.test(texto)) {
    sugeridas.push("EDICION_DISENO");
  } else if (/ALBUM|ÁLBUM/.test(texto)) {
    sugeridas.push(
      "EDICION_DISENO",
      "ARMADO_ALBUM"
    );
  } else {
    if (concepto.tomasSeleccionadas.length > 0) {
      sugeridas.push("RETOQUE");
    }

    if (/FONDO/.test(texto)) {
      sugeridas.push("CAMBIO_FONDO");
    }

    if (!/DIGITAL/.test(texto)) {
      sugeridas.push("IMPRESION");
    }

    if (
      Boolean(concepto.marco) ||
      /MARCO|ENMARC/.test(texto)
    ) {
      sugeridas.push("ENMARCADO");
    }
  }

  sugeridas.push("REVISION_FINAL");

  return Array.from(new Set(sugeridas));
};

const crearConfiguracionInicial = (
  conceptos: ConceptoParaProduccion[]
) =>
  Object.fromEntries(
    conceptos.map((concepto) => [
      concepto.id,
      sugerirTareas(concepto),
    ])
  ) as Record<string, TipoTareaProduccion[]>;

const ServicioEnviarProduccion = ({
  servicioId,
  conceptos,
  usuarioId,
  onCancelar,
  onEnviado,
}: Props) => {
  const [configuracion, setConfiguracion] = useState<
    Record<string, TipoTareaProduccion[]>
  >(() => crearConfiguracionInicial(conceptos));
  const [nombresTareaExtra, setNombresTareaExtra] =
    useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const totalTareas = useMemo(
    () =>
      Object.values(configuracion).reduce(
        (total, tareas) => total + tareas.length,
        0
      ),
    [configuracion]
  );

  const alternarTarea = (
    conceptoId: string,
    tipo: TipoTareaProduccion
  ) => {
    const estabaSeleccionada = (
      configuracion[conceptoId] || []
    ).includes(tipo);

    setConfiguracion((prev) => {
      const actuales = prev[conceptoId] || [];

      return {
        ...prev,
        [conceptoId]: estabaSeleccionada
          ? actuales.filter((tarea) => tarea !== tipo)
          : [...actuales, tipo],
      };
    });

    if (tipo === "OTRO" && estabaSeleccionada) {
      setNombresTareaExtra((prev) => {
        const siguiente = { ...prev };
        delete siguiente[conceptoId];
        return siguiente;
      });
    }

    setError("");
  };

  const enviarProduccion = async () => {
    if (guardando) return;

    if (!usuarioId) {
      setError(
        "No se pudo identificar al usuario actual."
      );
      return;
    }

    const productoSinTareas = conceptos.find(
      (concepto) =>
        (configuracion[concepto.id] || []).length === 0
    );

    if (productoSinTareas) {
      setError(
        `Selecciona al menos una tarea para ${productoSinTareas.descripcion}.`
      );
      return;
    }

    const productoExtraSinNombre = conceptos.find(
      (concepto) =>
        (configuracion[concepto.id] || []).includes(
          "OTRO"
        ) &&
        !String(
          nombresTareaExtra[concepto.id] || ""
        ).trim()
    );

    if (productoExtraSinNombre) {
      setError(
        `Escribe qué trabajo adicional se realizará para ${productoExtraSinNombre.descripcion}.`
      );
      return;
    }

    const configuracionRpc = conceptos.map(
      (concepto) => ({
        concepto_id: concepto.id,
        tareas: (
          configuracion[concepto.id] || []
        ).map((tipo, index) => {
          const opcion =
            OPCIONES_TAREAS_PRODUCCION.find(
              (item) => item.tipo === tipo
            );

          return {
            tipo,
            nombre: opcion?.nombre || tipo,
            orden: index + 1,
          };
        }),
      })
    );

    try {
      setGuardando(true);
      setError("");

      const { error: errorProduccion } =
        await supabase.rpc(
          "iniciar_produccion_servicio",
          {
            p_servicio_id: servicioId,
            p_usuario_id: usuarioId,
            p_configuracion: configuracionRpc,
          }
        );

      if (errorProduccion) {
        throw errorProduccion;
      }

      onEnviado();
    } catch (err: any) {
      console.error(
        "Error enviando servicio a producción:",
        err
      );

      setError(
        err?.message ||
        "No se pudo enviar el servicio a producción."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={() => {
        if (!guardando) onCancelar();
      }}
      style={styles.overlay}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        style={styles.modal}
      >
        <header style={styles.header}>
          <div style={styles.headerText}>
            <span style={styles.eyebrow}>
              PREPARAR PRODUCCIÓN
            </span>

            <h2 style={styles.title}>
              Configurar productos
            </h2>

            <p style={styles.subtitle}>
              Selecciona únicamente los procesos que
              necesita cada producto.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            aria-label="Cerrar"
            style={styles.closeButton}
          >
            <X size={19} />
          </button>
        </header>

        <div style={styles.summary}>
          <Factory size={20} />

          <div>
            <strong>
              {conceptos.length}{" "}
              {conceptos.length === 1
                ? "producto"
                : "productos"}
            </strong>

            <span>
              {totalTareas}{" "}
              {totalTareas === 1
                ? "tarea seleccionada"
                : "tareas seleccionadas"}
            </span>
          </div>
        </div>

        <div style={styles.productsList}>
          {conceptos.map((concepto, index) => {
            const tareasSeleccionadas =
              configuracion[concepto.id] || [];

            return (
              <article
                key={concepto.id}
                style={styles.productCard}
              >
                <div style={styles.productHeader}>
                  <span style={styles.numberBadge}>
                    {index + 1}
                  </span>

                  <div>
                    <h3 style={styles.productTitle}>
                      {concepto.cantidad} ×{" "}
                      {concepto.descripcion}
                    </h3>

                    <div style={styles.productMeta}>
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

                      {concepto.tomasSeleccionadas
                        .length > 0 ? (
                        <span style={styles.tomasText}>
                          Tomas:{" "}
                          {concepto.tomasSeleccionadas.join(
                            ", "
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div style={styles.tasksGrid}>
                  {OPCIONES_TAREAS_PRODUCCION.map(
                    (opcion) => {
                      const activa =
                        tareasSeleccionadas.includes(
                          opcion.tipo
                        );

                      return (
                        <button
                          key={opcion.tipo}
                          type="button"
                          onClick={() =>
                            alternarTarea(
                              concepto.id,
                              opcion.tipo
                            )
                          }
                          style={{
                            ...styles.taskButton,
                            ...(activa
                              ? styles.taskButtonActive
                              : {}),
                          }}
                        >
                          <span
                            style={{
                              ...styles.checkBox,
                              ...(activa
                                ? styles.checkBoxActive
                                : {}),
                            }}
                          >
                            {activa ? (
                              <Check size={14} />
                            ) : null}
                          </span>

                          <span style={styles.taskContent}>
                            <strong>
                              {opcion.nombre}
                            </strong>

                            <small>
                              {opcion.descripcion}
                            </small>
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                {tareasSeleccionadas.includes("OTRO") ? (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginTop: 14,
                    }}
                  >
                    <span
                      style={{
                        color: THEME.text,
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      ¿Qué trabajo adicional se realizará? *
                    </span>

                    <input
                      type="text"
                      value={
                        nombresTareaExtra[concepto.id] || ""
                      }
                      onChange={(event) => {
                        setNombresTareaExtra((prev) => ({
                          ...prev,
                          [concepto.id]:
                            event.target.value,
                        }));
                        setError("");
                      }}
                      placeholder="Ej. Restaurar fotografía, montaje especial…"
                      maxLength={100}
                      disabled={guardando}
                      style={{
                        width: "100%",
                        minHeight: 52,
                        boxSizing: "border-box",
                        borderRadius: 15,
                        border: `1px solid ${THEME.border}`,
                        background: "#fff",
                        color: THEME.text,
                        WebkitTextFillColor: THEME.text,
                        padding: "0 14px",
                        fontSize: 15,
                        fontWeight: 700,
                        outline: "none",
                      }}
                    />

                    <small
                      style={{
                        color: THEME.textSoft,
                        fontSize: 11,
                        lineHeight: 1.4,
                      }}
                    >
                      Este nombre aparecerá como una tarea
                      independiente durante la producción.
                    </small>
                  </label>
                ) : null}
              </article>
            );
          })}
        </div>

        {error ? (
          <div style={styles.errorBox}>{error}</div>
        ) : null}

        <footer style={styles.footer}>
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            style={styles.cancelButton}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={enviarProduccion}
            disabled={guardando}
            style={{
              ...styles.sendButton,
              opacity: guardando ? 0.7 : 1,
              cursor: guardando
                ? "wait"
                : "pointer",
            }}
          >
            {guardando ? (
              <Loader2 size={18} />
            ) : (
              <Factory size={18} />
            )}

            {guardando
              ? "Enviando…"
              : "Enviar a producción"}
          </button>
        </footer>
      </motion.section>
    </div>
  );
};

const styles: {
  [key: string]: React.CSSProperties;
} = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 11000,
    background: "rgba(18,17,15,0.76)",
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  modal: {
    width: "100%",
    maxWidth: 880,
    maxHeight: "92vh",
    overflowY: "auto",
    background: THEME.card,
    borderRadius: 26,
    border: `1px solid ${THEME.border}`,
    boxShadow: "0 30px 90px rgba(0,0,0,0.32)",
    padding: 22,
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 18,
  },
  headerText: {
    minWidth: 0,
  },
  eyebrow: {
    color: THEME.gold,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.7,
  },
  title: {
    margin: "6px 0",
    color: THEME.text,
    fontSize: "clamp(25px, 5vw, 34px)",
  },
  subtitle: {
    margin: 0,
    color: THEME.textSoft,
    fontSize: 13,
    lineHeight: 1.5,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.textSoft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  summary: {
    borderRadius: 18,
    background: THEME.olive,
    color: "#fff",
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  productsList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  productCard: {
    borderRadius: 20,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    padding: 17,
  },
  productHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 15,
  },
  numberBadge: {
    width: 29,
    height: 29,
    borderRadius: 10,
    background: THEME.goldSoft,
    color: "#806527",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    flexShrink: 0,
  },
  productTitle: {
    margin: 0,
    color: THEME.text,
    fontSize: 15,
  },
  productMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginTop: 6,
    color: THEME.textSoft,
    fontSize: 11,
  },
  tomasText: {
    color: THEME.green,
    fontWeight: 900,
  },
  tasksGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(205px, 1fr))",
    gap: 9,
  },
  taskButton: {
    minHeight: 74,
    borderRadius: 15,
    border: `1px solid ${THEME.border}`,
    background: "#fffdf8",
    color: THEME.text,
    padding: 11,
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    textAlign: "left",
    cursor: "pointer",
  },
  taskButtonActive: {
    background: THEME.greenSoft,
    border: "1px solid rgba(35,122,75,0.30)",
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkBoxActive: {
    background: THEME.green,
    borderColor: THEME.green,
  },
  taskContent: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },
  errorBox: {
    marginTop: 16,
    borderRadius: 14,
    background: THEME.redSoft,
    color: THEME.red,
    padding: 13,
    fontSize: 12,
    fontWeight: 800,
  },
  footer: {
    display: "grid",
    gridTemplateColumns:
      "minmax(120px, 0.75fr) minmax(190px, 1.25fr)",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    minHeight: 54,
    borderRadius: 16,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.textSoft,
    fontWeight: 900,
    cursor: "pointer",
  },
  sendButton: {
    minHeight: 54,
    borderRadius: 16,
    border: "none",
    background: THEME.olive,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 900,
  },
};

export default ServicioEnviarProduccion;