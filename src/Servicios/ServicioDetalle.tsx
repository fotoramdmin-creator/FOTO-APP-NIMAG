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
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Factory,
  Loader2,
  MapPin,
  Printer,
  ReceiptText,
  RefreshCw,
  Save,
  User,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { ServicioCreado } from "./serviciosTypes";
import type {
  PagoGuardado,
  ResultadoPago,
} from "../TomaPedidos/Vista4Pago";
import { compartirTicketPagoServicio } from "./servicioPagoTicket";
import { compartirOrdenServicioPdf } from "./servicioOrdenPdf";
import ServicioEnviarProduccion from "./ServicioEnviarProduccion";

type ConceptoRow = {
  id: string;
  cantidad: number;
  descripcion: string;
  medida: string | null;
  marco: string | null;
  especificaciones: string | null;
  precio_unitario: number;
  subtotal: number;
  requiere_seleccion_tomas: boolean;
  cantidad_tomas_requeridas: number;
  tomas_seleccionadas: string[];
  orden: number;
};

type PagoRow = {
  id: string;
  fecha_pago: string;
  monto: number;
  tipo: string;
  metodo_pago: string | null;
  cuenta_destino: string | null;
  nota: string | null;
  usuario_id: string | null;
};

type GrupoPago = {
  clave: string;
  fechaPago: string;
  tipoPago: "A_CUENTA" | "LIQUIDACION";
  pagos: PagoRow[];
  totalPagado: number;
  saldoAnterior: number;
  saldoPosterior: number;
  usuarioId: string | null;
};

type AgendaEditable = "PRUEBAS" | "ENTREGA";

type ServicioRow = {
  id: string;
  folio: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  tipo_evento: string;
  fecha_evento: string;
  horario_evento: string | null;
  lugar_evento: string | null;
  direccion_evento: string | null;
  fecha_pruebas: string | null;
  horario_pruebas: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  fecha_limite_liquidacion: string | null;
  estado: string;
  notas: string | null;
  descuento: number;
  total_bruto: number;
  total_final: number;
  anticipo: number;
  liquidacion: number;
  total_pagado: number;
  resta: number;
  pagado: boolean;
  seleccion_completada_at: string | null;
  seleccion_completada_por: string | null;
  enviado_produccion_at: string | null;
  enviado_produccion_por: string | null;
  listo_entrega_at: string | null;
  listo_entrega_por: string | null;
  entregado_at: string | null;
  entregado_por: string | null;
  creado_por: string | null;
  creado_por_nombre: string | null;
  created_at: string;
};

type ServicioDetalleProps = {
  servicioId: string;
  onVolver: () => void;
  onRegistrarPago: (servicio: ServicioCreado) => void;
  resultadoPago?: ResultadoPago | null;
  origenPago?: "CONTRATACION" | "ABONO" | null;
  usuarioActualId?: string;
  usuarioActualNombre?: string;
  onCerrarComprobante?: () => void;
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
  green: "#237a4b",
  greenSoft: "#edf8f1",
};

const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatearFecha = (fecha: string | null) => {
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

const formatearFechaHora = (fecha: string) =>
  new Date(fecha).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatearHorario = (horario: string | null) => {
  if (!horario) return "Horario por confirmar";

  const [hora, minuto] = horario.split(":");
  const fecha = new Date();
  fecha.setHours(Number(hora), Number(minuto || 0), 0, 0);

  return fecha.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const etiquetaEstado = (estado: string) =>
  estado
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letra) => letra.toUpperCase());

const ServicioDetalle = ({
  servicioId,
  onVolver,
  onRegistrarPago,
  resultadoPago,
  origenPago,
  usuarioActualId,
  usuarioActualNombre,
  onCerrarComprobante,
}: ServicioDetalleProps) => {
  const [servicio, setServicio] = useState<ServicioRow | null>(
    null
  );
  const [conceptos, setConceptos] = useState<ConceptoRow[]>([]);
  const [pagos, setPagos] = useState<PagoRow[]>([]);
  const [usuariosPagos, setUsuariosPagos] = useState<
    Record<string, string>
  >({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [compartiendoTicket, setCompartiendoTicket] =
    useState(false);
  const [reimprimiendoPago, setReimprimiendoPago] =
    useState<string | null>(null);
  const [generandoOrden, setGenerandoOrden] =
    useState(false);
  const [
    mostrarEnviarProduccion,
    setMostrarEnviarProduccion,
  ] = useState(false);

  const [conceptoTomasEditando, setConceptoTomasEditando] =
    useState<ConceptoRow | null>(null);
  const [tomasEditadas, setTomasEditadas] = useState<string[]>(
    []
  );
  const [guardandoTomas, setGuardandoTomas] =
    useState(false);
  const [errorTomas, setErrorTomas] = useState("");
  const [
    confirmandoTomasRepetidas,
    setConfirmandoTomasRepetidas,
  ] = useState(false);

  const [agendaEditando, setAgendaEditando] =
    useState<AgendaEditable | null>(null);
  const [fechaAgenda, setFechaAgenda] = useState("");
  const [horarioAgenda, setHorarioAgenda] =
    useState("");
  const [guardandoAgenda, setGuardandoAgenda] =
    useState(false);
  const [errorAgenda, setErrorAgenda] = useState("");

  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 820
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

  const cargarDetalle = useCallback(
    async (esActualizacion = false) => {
      try {
        if (esActualizacion) {
          setActualizando(true);
        } else {
          setCargando(true);
        }

        setError("");

        const [
          { data: servicioData, error: servicioError },
          { data: conceptosData, error: conceptosError },
          { data: pagosData, error: pagosError },
        ] = await Promise.all([
          supabase
            .from("servicios")
            .select("*")
            .eq("id", servicioId)
            .single(),

          supabase
            .from("servicios_conceptos")
            .select("*")
            .eq("servicio_id", servicioId)
            .order("orden", { ascending: true }),

          supabase
            .from("pagos")
            .select(
              `
                id,
                fecha_pago,
                monto,
                tipo,
                metodo_pago,
                               cuenta_destino,
                nota,
                usuario_id
              `
            )
            .eq("servicio_id", servicioId)
            .order("fecha_pago", { ascending: false }),
        ]);

        if (servicioError) throw servicioError;
        if (conceptosError) throw conceptosError;
        if (pagosError) throw pagosError;

        const pagosCargados =
          (pagosData || []) as PagoRow[];

        setServicio(servicioData as ServicioRow);
        setConceptos((conceptosData || []) as ConceptoRow[]);
        setPagos(pagosCargados);

        const usuariosIds = Array.from(
          new Set(
            pagosCargados
              .map((pago) => pago.usuario_id)
              .filter(
                (usuarioId): usuarioId is string =>
                  Boolean(usuarioId)
              )
          )
        );

        if (usuariosIds.length > 0) {
          const {
            data: usuariosData,
            error: usuariosError,
          } = await supabase
            .from("usuarios")
            .select("id, nombre")
            .in("id", usuariosIds);

          if (usuariosError) {
            console.warn(
              "No se pudieron cargar los usuarios de los pagos:",
              usuariosError
            );
            setUsuariosPagos({});
          } else {
            const mapaUsuarios: Record<string, string> = {};

            (usuariosData || []).forEach((usuario: any) => {
              mapaUsuarios[usuario.id] =
                usuario.nombre || "SIN USUARIO";
            });

            setUsuariosPagos(mapaUsuarios);
          }
        } else {
          setUsuariosPagos({});
        }
      } catch (err: any) {
        console.error("Error cargando servicio:", err);
        setError(
          err?.message ||
          "No se pudo cargar la información del servicio."
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

  const abrirEditorAgenda = (
    tipo: AgendaEditable
  ) => {
    if (!servicio) return;

    setAgendaEditando(tipo);
    setFechaAgenda(
      tipo === "PRUEBAS"
        ? servicio.fecha_pruebas || ""
        : servicio.fecha_entrega || ""
    );
    setHorarioAgenda(
      tipo === "PRUEBAS"
        ? servicio.horario_pruebas || ""
        : servicio.horario_entrega || ""
    );
    setErrorAgenda("");
  };

  const cerrarEditorAgenda = () => {
    if (guardandoAgenda) return;

    setAgendaEditando(null);
    setFechaAgenda("");
    setHorarioAgenda("");
    setErrorAgenda("");
  };

  const guardarAgenda = async () => {
    if (
      !servicio ||
      !agendaEditando ||
      guardandoAgenda
    ) {
      return;
    }

    if (!fechaAgenda) {
      setErrorAgenda(
        "Selecciona una fecha antes de guardar."
      );
      return;
    }

    try {
      setGuardandoAgenda(true);
      setErrorAgenda("");

      const cambios =
        agendaEditando === "PRUEBAS"
          ? {
            fecha_pruebas: fechaAgenda,
            horario_pruebas:
              horarioAgenda || null,
          }
          : {
            fecha_entrega: fechaAgenda,
            horario_entrega:
              horarioAgenda || null,
          };

      const { error: errorActualizacion } =
        await supabase
          .from("servicios")
          .update(cambios)
          .eq("id", servicio.id);

      if (errorActualizacion) {
        throw errorActualizacion;
      }

      await cargarDetalle(true);
      cerrarEditorAgenda();
    } catch (err: any) {
      console.error(
        "Error actualizando agenda del servicio:",
        err
      );

      setErrorAgenda(
        err?.message ||
        "No se pudo guardar la fecha."
      );
    } finally {
      setGuardandoAgenda(false);
    }
  };
  const abrirEditorTomas = (concepto: ConceptoRow) => {
    const cantidadRequerida = Math.max(
      1,
      Number(concepto.cantidad_tomas_requeridas || 1)
    );

    const tomasExistentes = Array.isArray(
      concepto.tomas_seleccionadas
    )
      ? concepto.tomas_seleccionadas.slice(
        0,
        cantidadRequerida
      )
      : [];

    const tomasPreparadas = Array.from(
      { length: cantidadRequerida },
      (_, index) => tomasExistentes[index] || ""
    );

    setConceptoTomasEditando(concepto);
    setTomasEditadas(tomasPreparadas);
    setErrorTomas("");
    setConfirmandoTomasRepetidas(false);
  };

  const cerrarEditorTomas = () => {
    if (guardandoTomas) return;

    setConceptoTomasEditando(null);
    setTomasEditadas([]);
    setErrorTomas("");
    setConfirmandoTomasRepetidas(false);
  };

  const actualizarToma = (
    index: number,
    valor: string
  ) => {
    const valorLimpio = valor
      .replace(/\s+/g, "")
      .toUpperCase();

    setTomasEditadas((prev) =>
      prev.map((toma, posicion) =>
        posicion === index ? valorLimpio : toma
      )
    );

    setErrorTomas("");
    setConfirmandoTomasRepetidas(false);
  };

  const guardarTomas = async () => {
    if (
      !conceptoTomasEditando ||
      guardandoTomas
    ) {
      return;
    }

    const tomasNormalizadas = tomasEditadas.map(
      (toma) => toma.trim().toUpperCase()
    );

    if (tomasNormalizadas.some((toma) => !toma)) {
      setErrorTomas(
        "Captura todos los números de toma requeridos."
      );
      return;
    }

    const tomasRepetidas = Array.from(
      new Set(
        tomasNormalizadas.filter(
          (toma, index) =>
            tomasNormalizadas.indexOf(toma) !== index
        )
      )
    );
    if (
      tomasRepetidas.length > 0 &&
      !confirmandoTomasRepetidas
    ) {
      setConfirmandoTomasRepetidas(true);
      setErrorTomas(
        `Advertencia: la ${tomasRepetidas.length === 1
          ? "toma"
          : "tomas"
        } ${tomasRepetidas.join(
          ", "
        )} está repetida. Si realmente deseas varias copias de la misma fotografía, presiona nuevamente “Sí, guardar repetidas”.`
      );
      return;
    }

    setConfirmandoTomasRepetidas(false);

    try {
      setGuardandoTomas(true);
      setErrorTomas("");

      const { error: errorActualizacion } =
        await supabase
          .from("servicios_conceptos")
          .update({
            tomas_seleccionadas: tomasNormalizadas,
          })
          .eq("id", conceptoTomasEditando.id);

      if (errorActualizacion) {
        throw errorActualizacion;
      }

      const conceptosActualizados = conceptos.map(
        (concepto) =>
          concepto.id === conceptoTomasEditando.id
            ? {
              ...concepto,
              tomas_seleccionadas: tomasNormalizadas,
            }
            : concepto
      );

      const conceptosQueRequierenTomas =
        conceptosActualizados.filter(
          (concepto) =>
            concepto.requiere_seleccion_tomas
        );

      const seleccionCompleta =
        conceptosQueRequierenTomas.length > 0 &&
        conceptosQueRequierenTomas.every(
          (concepto) =>
            concepto.tomas_seleccionadas.length ===
            concepto.cantidad_tomas_requeridas
        );

      if (seleccionCompleta && servicio) {
        const { error: errorEstado } = await supabase
          .from("servicios")
          .update({
            estado: "TOMAS_SELECCIONADAS",
            seleccion_completada_at:
              new Date().toISOString(),
            seleccion_completada_por:
              usuarioActualId || null,
          })
          .eq("id", servicio.id);

        if (errorEstado) {
          throw errorEstado;
        }
      }

      await cargarDetalle(true);
      cerrarEditorTomas();
    } catch (err: any) {
      console.error(
        "Error guardando tomas del servicio:",
        err
      );

      setErrorTomas(
        err?.message ||
        "No se pudieron guardar los números de toma."
      );
    } finally {
      setGuardandoTomas(false);
    }
  };


  const pagosAgrupados = useMemo<GrupoPago[]>(() => {
    const gruposPorFecha = new Map<string, PagoRow[]>();

    pagos.forEach((pago) => {
      const existentes =
        gruposPorFecha.get(pago.fecha_pago) || [];

      gruposPorFecha.set(pago.fecha_pago, [
        ...existentes,
        pago,
      ]);
    });

    const gruposOrdenados = Array.from(
      gruposPorFecha.entries()
    )
      .map(([clave, pagosDelGrupo]) => ({
        clave,
        fechaPago: clave,
        pagos: pagosDelGrupo,
      }))
      .sort((a, b) =>
        a.fechaPago.localeCompare(b.fechaPago)
      );

    const totalServicio = Number(
      servicio?.total_final || 0
    );

    let totalPagadoAnteriormente = 0;

    return gruposOrdenados
      .map((grupo) => {
        const totalPagado = grupo.pagos.reduce(
          (total, pago) =>
            total + Number(pago.monto || 0),
          0
        );

        const saldoAnterior = Math.max(
          totalServicio - totalPagadoAnteriormente,
          0
        );

        totalPagadoAnteriormente += totalPagado;

        const saldoPosterior = Math.max(
          totalServicio - totalPagadoAnteriormente,
          0
        );

        const tipoPago:
          | "A_CUENTA"
          | "LIQUIDACION" = grupo.pagos.some(
            (pago) => pago.tipo === "LIQUIDACION"
          )
            ? "LIQUIDACION"
            : "A_CUENTA";

        const usuarioId =
          grupo.pagos.find((pago) => pago.usuario_id)
            ?.usuario_id || null;

        return {
          ...grupo,
          tipoPago,
          totalPagado,
          saldoAnterior,
          saldoPosterior,
          usuarioId,
        };
      })
      .reverse();
  }, [pagos, servicio?.total_final]);



  const imprimirTicketPago = async () => {
    if (!resultadoPago || !servicio || compartiendoTicket) {
      return;
    }

    try {
      setCompartiendoTicket(true);

      await compartirTicketPagoServicio({
        folio: servicio.folio,
        clienteNombre: servicio.cliente_nombre,
        totalServicio: Number(servicio.total_final || 0),
        usuarioNombre:
          usuarioActualNombre ||
          servicio.creado_por_nombre ||
          "SIN USUARIO",
        pago: resultadoPago,
      });
    } catch (err: any) {
      console.error(
        "Error generando comprobante del servicio:",
        err
      );

      alert(
        err?.message ||
        "No se pudo generar el comprobante de pago."
      );
    } finally {
      setCompartiendoTicket(false);
    }
  };

  const reimprimirTicketPago = async (
    grupo: GrupoPago
  ) => {
    if (!servicio || reimprimiendoPago) {
      return;
    }

    try {
      setReimprimiendoPago(grupo.clave);

      const pagosGuardados: PagoGuardado[] =
        grupo.pagos.map((pago) => ({
          id: pago.id,
          fecha_pago: pago.fecha_pago,
          monto: Number(pago.monto || 0),
          metodo_pago: (pago.metodo_pago ||
            "EFECTIVO") as PagoGuardado["metodo_pago"],
          cuenta_destino: pago.cuenta_destino,
          tipo: grupo.tipoPago,
          usuario_id: pago.usuario_id,
        }));

      const resultadoHistorico: ResultadoPago = {
        pagos: pagosGuardados,
        servicioId: servicio.id,
        clienteNombre: servicio.cliente_nombre,
        tipoPago: grupo.tipoPago,
        fechaPago: grupo.fechaPago,
        totalPagado: grupo.totalPagado,
        saldoAnterior: grupo.saldoAnterior,
        saldoPosterior: grupo.saldoPosterior,
        usuarioId: grupo.usuarioId || undefined,
      };

      await compartirTicketPagoServicio({
        folio: servicio.folio,
        clienteNombre: servicio.cliente_nombre,
        totalServicio: Number(
          servicio.total_final || 0
        ),
        usuarioNombre:
          (grupo.usuarioId
            ? usuariosPagos[grupo.usuarioId]
            : "") ||
          servicio.creado_por_nombre ||
          "SIN USUARIO",
        pago: resultadoHistorico,
        reimpresion: true,
      });
    } catch (err: any) {
      console.error(
        "Error reimprimiendo comprobante:",
        err
      );

      alert(
        err?.message ||
        "No se pudo reimprimir el comprobante."
      );
    } finally {
      setReimprimiendoPago(null);
    }
  };

  const generarOrdenServicio = async () => {
    if (!servicio || generandoOrden) {
      return;
    }

    try {
      setGenerandoOrden(true);

      const pagoInicial =
        pagosAgrupados.length > 0
          ? pagosAgrupados[
          pagosAgrupados.length - 1
          ]
          : null;

      const metodosPagoInicial = pagoInicial
        ? Array.from(
          new Set(
            pagoInicial.pagos.map(
              (pago) =>
                pago.metodo_pago ||
                "SIN MÉTODO"
            )
          )
        ).join(" + ")
        : "SIN PAGO INICIAL";

      const cuentasPagoInicial = pagoInicial
        ? Array.from(
          new Set(
            pagoInicial.pagos
              .map(
                (pago) =>
                  pago.cuenta_destino
              )
              .filter(Boolean)
          )
        ).join(" + ")
        : "";

      const usuarioPagoInicial =
        (pagoInicial?.usuarioId
          ? usuariosPagos[
          pagoInicial.usuarioId
          ]
          : "") ||
        servicio.creado_por_nombre ||
        usuarioActualNombre ||
        "SIN USUARIO";

      await compartirOrdenServicioPdf({
        folio: servicio.folio,
        fechaCreacion: servicio.created_at,
        clienteNombre:
          servicio.cliente_nombre,
        clienteTelefono:
          servicio.cliente_telefono,
        tipoEvento: servicio.tipo_evento,
        fechaEvento: servicio.fecha_evento,
        horarioEvento:
          servicio.horario_evento,
        lugarEvento: servicio.lugar_evento,
        direccionEvento:
          servicio.direccion_evento,
        fechaPruebas:
          servicio.fecha_pruebas,
        horarioPruebas:
          servicio.horario_pruebas,
        fechaEntrega:
          servicio.fecha_entrega,
        horarioEntrega:
          servicio.horario_entrega,
        fechaLimiteLiquidacion:
          servicio.fecha_limite_liquidacion,
        notas: servicio.notas,
        conceptos: conceptos.map(
          (concepto) => ({
            cantidad: Number(
              concepto.cantidad || 0
            ),
            descripcion:
              concepto.descripcion,
            medida: concepto.medida,
            marco: concepto.marco,
            especificaciones:
              concepto.especificaciones,
            precioUnitario: Number(
              concepto.precio_unitario || 0
            ),
            subtotal: Number(
              concepto.subtotal || 0
            ),
          })
        ),
        totalBruto: Number(
          servicio.total_bruto || 0
        ),
        descuento: Number(
          servicio.descuento || 0
        ),
        totalFinal: Number(
          servicio.total_final || 0
        ),
        pagoInicial: Number(
          pagoInicial?.totalPagado || 0
        ),
        saldoInicial: pagoInicial
          ? Number(
            pagoInicial.saldoPosterior || 0
          )
          : Number(
            servicio.total_final || 0
          ),
        metodosPagoInicial,
        cuentasPagoInicial,
        usuarioNombre:
          usuarioPagoInicial,
      });
    } catch (err: any) {
      console.error(
        "Error generando orden de servicio:",
        err
      );

      alert(
        err?.message ||
        "No se pudo generar la orden de servicio."
      );
    } finally {
      setGenerandoOrden(false);
    }
  };

  const tieneTomasPendientes = conceptos.some(
    (concepto) =>
      concepto.requiere_seleccion_tomas &&
      concepto.tomas_seleccionadas.length !==
      concepto.cantidad_tomas_requeridas
  );

  const yaEstaEnProduccion = Boolean(
    servicio &&
    [
      "EN_PRODUCCION",
      "LISTO_ENTREGA",
      "ENTREGADO",
    ].includes(servicio.estado)
  );

  const puedeEnviarProduccion = Boolean(
    servicio &&
    servicio.pagado &&
    servicio.fecha_entrega &&
    !tieneTomasPendientes &&
    !yaEstaEnProduccion
  );

  const motivoBloqueoProduccion = !servicio
    ? ""
    : !servicio.pagado
      ? "El servicio debe estar liquidado."
      : !servicio.fecha_entrega
        ? "Primero programa la entrega final."
        : tieneTomasPendientes
          ? "Falta completar la selección de tomas."
          : yaEstaEnProduccion
            ? "El servicio ya fue enviado a producción."
            : "";

  if (cargando) {
    return (
      <main style={styles.centerPage}>
        <Loader2 size={38} color={THEME.olive} />
        <strong>Cargando servicio…</strong>
      </main>
    );
  }

  if (error || !servicio) {
    return (
      <main style={styles.centerPage}>
        <AlertTriangle size={38} color={THEME.red} />
        <strong>No se pudo abrir el servicio</strong>
        <span style={styles.centerText}>{error}</span>

        <button
          type="button"
          onClick={onVolver}
          style={styles.simpleButton}
        >
          Volver
        </button>
      </main>
    );
  }

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
          <div>
            <button
              type="button"
              onClick={onVolver}
              style={styles.backButton}
            >
              <ArrowLeft size={17} />
              Volver a Servicios
            </button>

            <div style={styles.folioRow}>
              <span style={styles.folioBadge}>
                {servicio.folio}
              </span>

              <span
                style={{
                  ...styles.statusBadge,
                  background: servicio.pagado
                    ? THEME.greenSoft
                    : THEME.goldSoft,
                  color: servicio.pagado
                    ? THEME.green
                    : "#806527",
                }}
              >
                {etiquetaEstado(servicio.estado)}
              </span>
            </div>

            <h1
              style={{
                ...styles.title,
                fontSize: isMobile
                  ? 33
                  : "clamp(38px, 6vw, 54px)",
              }}
            >
              {servicio.cliente_nombre}
            </h1>

            <p style={styles.subtitle}>
              {servicio.tipo_evento} ·{" "}
              {servicio.cliente_telefono || "Sin teléfono"}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile
                ? "column"
                : "row",
              gap: 9,
            }}
          >
            <button
              type="button"
              onClick={generarOrdenServicio}
              style={{
                ...styles.refreshButton,
                background: THEME.olive,
                color: "#fff",
              }}
              disabled={generandoOrden}
            >
              <FileText size={17} />

              {generandoOrden
                ? "Preparando…"
                : "Orden de servicio"}
            </button>

            <button
              type="button"
              onClick={() => cargarDetalle(true)}
              style={styles.refreshButton}
              disabled={actualizando}
            >
              <RefreshCw size={17} />
              {actualizando
                ? "Actualizando…"
                : "Actualizar"}
            </button>
          </div>
        </header>

        {resultadoPago && origenPago === "ABONO" ? (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: THEME.olive,
              color: "#fff",
              borderRadius: isMobile ? 20 : 24,
              padding: isMobile ? 18 : 22,
              marginBottom: 20,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "space-between",
              gap: 16,
              boxShadow:
                "0 18px 42px rgba(54,65,46,0.20)",
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  opacity: 0.7,
                  marginBottom: 5,
                }}
              >
                PAGO REGISTRADO CORRECTAMENTE
              </span>

              <strong
                style={{
                  display: "block",
                  fontSize: 21,
                  marginBottom: 5,
                }}
              >
                {resultadoPago.tipoPago === "LIQUIDACION"
                  ? "Imprimir comprobante de liquidación"
                  : "Imprimir comprobante de abono"}
              </strong>

              <span
                style={{
                  fontSize: 13,
                  opacity: 0.78,
                }}
              >
                Se generarán dos copias: cliente y estudio.
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 9,
              }}
            >
              <button
                type="button"
                onClick={imprimirTicketPago}
                disabled={compartiendoTicket}
                style={{
                  minHeight: 50,
                  border: "none",
                  borderRadius: 15,
                  background: THEME.gold,
                  color: "#fff",
                  padding: "0 18px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontWeight: 900,
                  cursor: compartiendoTicket
                    ? "wait"
                    : "pointer",
                  opacity: compartiendoTicket ? 0.7 : 1,
                }}
              >
                <Printer size={18} />
                {compartiendoTicket
                  ? "Preparando…"
                  : "Imprimir 2 tickets"}
              </button>

              <button
                type="button"
                onClick={() => onCerrarComprobante?.()}
                style={{
                  minHeight: 50,
                  borderRadius: 15,
                  border:
                    "1px solid rgba(255,255,255,0.22)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  padding: "0 16px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </motion.section>
        ) : null}

        <section
          style={{
            ...styles.kpiGrid,
            gridTemplateColumns: isMobile
              ? "1fr 1fr"
              : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <article style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Total</span>
            <strong style={styles.kpiValue}>
              {money(servicio.total_final)}
            </strong>
          </article>

          <article style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Pagado</span>
            <strong
              style={{
                ...styles.kpiValue,
                color: THEME.green,
              }}
            >
              {money(servicio.total_pagado)}
            </strong>
          </article>

          <article style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Saldo</span>
            <strong
              style={{
                ...styles.kpiValue,
                color:
                  servicio.resta > 0
                    ? THEME.red
                    : THEME.green,
              }}
            >
              {money(servicio.resta)}
            </strong>
          </article>

          <article style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Descuento</span>
            <strong style={styles.kpiValue}>
              {money(servicio.descuento)}
            </strong>
          </article>
        </section>

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
                padding: isMobile ? 16 : 25,
              }}
            >
              <div style={styles.sectionHeader}>
                <CalendarDays size={21} color={THEME.gold} />
                <h2 style={styles.sectionTitle}>
                  Agenda del servicio
                </h2>
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
                  <CalendarDays size={18} />
                  <div>
                    <span style={styles.infoLabel}>Evento</span>
                    <strong style={styles.infoValue}>
                      {formatearFecha(servicio.fecha_evento)}
                    </strong>
                    <span style={styles.infoText}>
                      {formatearHorario(
                        servicio.horario_evento
                      )}
                    </span>
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <MapPin size={18} />
                  <div>
                    <span style={styles.infoLabel}>Lugar</span>
                    <strong style={styles.infoValue}>
                      {servicio.lugar_evento ||
                        "Por confirmar"}
                    </strong>
                    {servicio.direccion_evento ? (
                      <span style={styles.infoText}>
                        {servicio.direccion_evento}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    abrirEditorAgenda("PRUEBAS")
                  }
                  style={{
                    ...styles.infoBox,
                    width: "100%",
                    textAlign: "left",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <Clock3 size={18} />

                  <div>
                    <span style={styles.infoLabel}>
                      Pruebas
                    </span>

                    <strong style={styles.infoValue}>
                      {formatearFecha(
                        servicio.fecha_pruebas
                      )}
                    </strong>

                    {servicio.fecha_pruebas ? (
                      <>
                        <span style={styles.infoText}>
                          {formatearHorario(
                            servicio.horario_pruebas
                          )}
                        </span>

                        <span style={styles.pendingText}>
                          Toca para editar
                        </span>
                      </>
                    ) : (
                      <span style={styles.pendingText}>
                        Toca para programar
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    abrirEditorAgenda("ENTREGA")
                  }
                  style={{
                    ...styles.infoBox,
                    width: "100%",
                    textAlign: "left",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <CheckCircle2 size={18} />

                  <div>
                    <span style={styles.infoLabel}>
                      Entrega final
                    </span>

                    <strong style={styles.infoValue}>
                      {formatearFecha(
                        servicio.fecha_entrega
                      )}
                    </strong>

                    {servicio.fecha_entrega ? (
                      <>
                        <span style={styles.infoText}>
                          {formatearHorario(
                            servicio.horario_entrega
                          )}
                        </span>

                        <span style={styles.pendingText}>
                          Toca para editar
                        </span>
                      </>
                    ) : (
                      <span style={styles.pendingText}>
                        Toca para programar
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </section>

            <section
              style={{
                ...styles.card,
                padding: isMobile ? 16 : 25,
              }}
            >
              <div style={styles.sectionHeader}>
                <ReceiptText size={21} color={THEME.gold} />
                <h2 style={styles.sectionTitle}>
                  Productos contratados
                </h2>
              </div>

              <div style={styles.conceptsList}>
                {conceptos.map((concepto, index) => (
                  <article
                    key={concepto.id}
                    style={styles.conceptRow}
                  >
                    <span style={styles.numberBadge}>
                      {index + 1}
                    </span>

                    <div style={styles.conceptInfo}>
                      <strong style={styles.conceptTitle}>
                        {concepto.cantidad} ×{" "}
                        {concepto.descripcion}
                      </strong>

                      {concepto.medida ? (
                        <span style={styles.conceptText}>
                          Medida: {concepto.medida}
                        </span>
                      ) : null}

                      {concepto.marco ? (
                        <span style={styles.conceptText}>
                          Marco: {concepto.marco}
                        </span>
                      ) : null}

                      {concepto.requiere_seleccion_tomas ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: isMobile
                              ? "stretch"
                              : "center",
                            flexDirection: isMobile
                              ? "column"
                              : "row",
                            flexWrap: "wrap",
                            gap: 9,
                            marginTop: 3,
                          }}
                        >
                          <span
                            style={{
                              ...styles.tomasText,
                              color:
                                concepto.tomas_seleccionadas
                                  ?.length ===
                                  concepto.cantidad_tomas_requeridas
                                  ? THEME.green
                                  : THEME.gold,
                            }}
                          >
                            {concepto.tomas_seleccionadas
                              ?.length ===
                              concepto.cantidad_tomas_requeridas
                              ? `Tomas seleccionadas: ${concepto.tomas_seleccionadas.join(
                                ", "
                              )}`
                              : `Pendiente seleccionar ${concepto.cantidad_tomas_requeridas
                              } ${concepto.cantidad_tomas_requeridas ===
                                1
                                ? "toma"
                                : "tomas"
                              }`}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              abrirEditorTomas(concepto)
                            }
                            style={{
                              minHeight: 34,
                              borderRadius: 11,
                              border: `1px solid ${THEME.border}`,
                              background:
                                concepto.tomas_seleccionadas
                                  ?.length > 0
                                  ? THEME.greenSoft
                                  : THEME.goldSoft,
                              color:
                                concepto.tomas_seleccionadas
                                  ?.length > 0
                                  ? THEME.green
                                  : "#806527",
                              padding: "0 12px",
                              fontSize: 11,
                              fontWeight: 900,
                              cursor: "pointer",
                              alignSelf: isMobile
                                ? "flex-start"
                                : "auto",
                            }}
                          >
                            {concepto.tomas_seleccionadas
                              ?.length > 0
                              ? "Editar tomas"
                              : "Capturar tomas"}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <strong style={styles.conceptPrice}>
                      {money(concepto.subtotal)}
                    </strong>
                  </article>
                ))}
              </div>

              <div
                style={{
                  marginTop: 18,
                  borderTop: `1px solid ${THEME.border}`,
                  paddingTop: 18,
                }}
              >
                {yaEstaEnProduccion ? (
                  <div
                    style={{
                      minHeight: 56,
                      borderRadius: 17,
                      background: THEME.greenSoft,
                      color: THEME.green,
                      padding: "13px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      fontWeight: 900,
                      boxSizing: "border-box",
                    }}
                  >
                    <CheckCircle2 size={20} />

                    Estado de producción:{" "}
                    {etiquetaEstado(servicio.estado)}
                  </div>
                ) : (
                  <>
                    <motion.button
                      type="button"
                      onClick={() =>
                        setMostrarEnviarProduccion(true)
                      }
                      disabled={!puedeEnviarProduccion}
                      style={{
                        width: "100%",
                        minHeight: 58,
                        borderRadius: 18,
                        border: "none",
                        background: THEME.olive,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 9,
                        fontSize: 13,
                        fontWeight: 900,
                        cursor: puedeEnviarProduccion
                          ? "pointer"
                          : "not-allowed",
                        opacity: puedeEnviarProduccion
                          ? 1
                          : 0.5,
                        boxShadow: puedeEnviarProduccion
                          ? "0 14px 28px rgba(54,65,46,0.20)"
                          : "none",
                      }}
                      whileHover={
                        puedeEnviarProduccion
                          ? { y: -2 }
                          : undefined
                      }
                      whileTap={
                        puedeEnviarProduccion
                          ? { scale: 0.98 }
                          : undefined
                      }
                    >
                      <Factory size={20} />
                      Enviar a producción
                    </motion.button>

                    {motivoBloqueoProduccion ? (
                      <span
                        style={{
                          display: "block",
                          marginTop: 9,
                          color: THEME.textSoft,
                          fontSize: 11,
                          textAlign: "center",
                        }}
                      >
                        {motivoBloqueoProduccion}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </section>
          </div>

          <aside style={styles.sideColumn}>
            <section style={styles.paymentCard}>
              <div style={styles.paymentHeader}>
                <Wallet size={21} />
                <div>
                  <span style={styles.paymentEyebrow}>
                    ESTADO DE CUENTA
                  </span>
                  <strong style={styles.paymentTitle}>
                    {servicio.pagado
                      ? "Servicio liquidado"
                      : "Saldo pendiente"}
                  </strong>
                </div>
              </div>

              <span style={styles.balanceLabel}>
                RESTA POR PAGAR
              </span>

              <strong style={styles.balanceValue}>
                {money(servicio.resta)}
              </strong>

              <span style={styles.limitText}>
                Límite:{" "}
                {formatearFecha(
                  servicio.fecha_limite_liquidacion
                )}
              </span>

              {servicio.resta > 0 ? (
                <motion.button
                  type="button"
                  onClick={() =>
                    onRegistrarPago({
                      servicioId: servicio.id,
                      folio: servicio.folio,
                      clienteNombre:
                        servicio.cliente_nombre,
                      usuarioId:
                        servicio.creado_por || undefined,
                      totalBruto: Number(
                        servicio.total_bruto || 0
                      ),
                      descuento: Number(
                        servicio.descuento || 0
                      ),
                      totalFinal: Number(
                        servicio.total_final || 0
                      ),
                      pendiente: Number(
                        servicio.resta || 0
                      ),
                    })
                  }
                  style={styles.paymentButton}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CreditCard size={19} />
                  Registrar abono o liquidación
                </motion.button>
              ) : (
                <div style={styles.paidBox}>
                  <CheckCircle2 size={20} />
                  Sin saldo pendiente
                </div>
              )}
            </section>

            <section style={styles.historyCard}>
              <div style={styles.sectionHeader}>
                <ReceiptText size={20} color={THEME.gold} />
                <h2 style={styles.sectionTitle}>
                  Historial de pagos
                </h2>
              </div>

              {pagosAgrupados.length === 0 ? (
                <div style={styles.emptyHistory}>
                  Todavía no hay pagos registrados.
                </div>
              ) : (
                <div style={styles.historyList}>
                  {pagosAgrupados.map((grupo) => {
                    const metodos = Array.from(
                      new Set(
                        grupo.pagos.map(
                          (pago) =>
                            pago.metodo_pago ||
                            "Sin método"
                        )
                      )
                    ).join(" + ");

                    const cuentas = Array.from(
                      new Set(
                        grupo.pagos
                          .map(
                            (pago) =>
                              pago.cuenta_destino
                          )
                          .filter(Boolean)
                      )
                    );

                    const nombreUsuario =
                      (grupo.usuarioId
                        ? usuariosPagos[
                        grupo.usuarioId
                        ]
                        : "") ||
                      servicio.creado_por_nombre ||
                      "SIN USUARIO";

                    return (
                      <article
                        key={grupo.clave}
                        style={{
                          ...styles.paymentRow,
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={styles.paymentAmount}
                          >
                            {money(
                              grupo.totalPagado
                            )}
                          </strong>

                          <span
                            style={styles.paymentMeta}
                          >
                            {grupo.tipoPago} ·{" "}
                            {metodos}
                          </span>

                          {cuentas.map((cuenta) => (
                            <span
                              key={String(cuenta)}
                              style={
                                styles.paymentMeta
                              }
                            >
                              {String(cuenta)}
                            </span>
                          ))}

                          <span
                            style={styles.paymentMeta}
                          >
                            Recibió: {nombreUsuario}
                          </span>

                          <span
                            style={styles.paymentDate}
                          >
                            {formatearFechaHora(
                              grupo.fechaPago
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            reimprimirTicketPago(
                              grupo
                            )
                          }
                          disabled={
                            reimprimiendoPago !== null
                          }
                          style={{
                            minWidth: 44,
                            minHeight: 44,
                            borderRadius: 13,
                            border:
                              "1px solid rgba(184,159,84,0.28)",
                            background:
                              reimprimiendoPago ===
                                grupo.clave
                                ? THEME.goldSoft
                                : "#fff",
                            color: THEME.olive,
                            padding: "0 12px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 7,
                            fontSize: 11,
                            fontWeight: 900,
                            cursor:
                              reimprimiendoPago !== null
                                ? "wait"
                                : "pointer",
                            flexShrink: 0,
                          }}
                        >
                          <Printer size={16} />

                          {isMobile
                            ? ""
                            : reimprimiendoPago ===
                              grupo.clave
                              ? "Preparando…"
                              : "Reimprimir"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {agendaEditando ? (
        <div
          role="presentation"
          onMouseDown={cerrarEditorAgenda}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(18,17,15,0.72)",
            padding: isMobile ? 14 : 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: 520,
              background: THEME.card,
              borderRadius: isMobile ? 22 : 27,
              border: `1px solid ${THEME.border}`,
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.28)",
              padding: isMobile ? 18 : 26,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
                marginBottom: 22,
              }}
            >
              <div>
                <span
                  style={{
                    color: THEME.gold,
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                  }}
                >
                  AGENDA DEL SERVICIO
                </span>

                <h2
                  style={{
                    margin: "6px 0 5px",
                    color: THEME.text,
                    fontSize: isMobile ? 24 : 29,
                  }}
                >
                  {agendaEditando === "PRUEBAS"
                    ? "Programar pruebas"
                    : "Programar entrega"}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: THEME.textSoft,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {agendaEditando === "PRUEBAS"
                    ? "Indica cuándo regresará el cliente para seleccionar sus fotografías."
                    : "Indica la fecha prometida para entregar el trabajo terminado."}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarEditorAgenda}
                disabled={guardandoAgenda}
                aria-label="Cerrar"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  border: `1px solid ${THEME.border}`,
                  background: "#fff",
                  color: THEME.textSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: guardandoAgenda
                    ? "wait"
                    : "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "1fr 1fr",
                gap: 14,
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color: THEME.text,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  Fecha *
                </span>

                <input
                  type="date"
                  value={fechaAgenda}
                  min={
                    agendaEditando === "PRUEBAS"
                      ? servicio.fecha_evento
                      : servicio.fecha_pruebas ||
                      servicio.fecha_evento
                  }
                  onChange={(event) => {
                    setFechaAgenda(
                      event.target.value
                    );
                    setErrorAgenda("");
                  }}
                  style={{
                    width: "100%",
                    minHeight: 54,
                    borderRadius: 15,
                    border: `1px solid ${THEME.border}`,
                    background: "#fff",
                    color: THEME.text,
                    WebkitTextFillColor: THEME.text,
                    padding: "0 14px",
                    fontSize: 16,
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color: THEME.text,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  Horario
                </span>

                <input
                  type="time"
                  value={horarioAgenda}
                  onChange={(event) => {
                    setHorarioAgenda(
                      event.target.value
                    );
                    setErrorAgenda("");
                  }}
                  style={{
                    width: "100%",
                    minHeight: 54,
                    borderRadius: 15,
                    border: `1px solid ${THEME.border}`,
                    background: "#fff",
                    color: THEME.text,
                    WebkitTextFillColor: THEME.text,
                    padding: "0 14px",
                    fontSize: 16,
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </label>
            </div>

            {errorAgenda ? (
              <div
                style={{
                  marginTop: 16,
                  borderRadius: 14,
                  background: THEME.redSoft,
                  color: THEME.red,
                  padding: 13,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {errorAgenda}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "0.8fr 1.2fr",
                gap: 10,
                marginTop: 22,
              }}
            >
              <button
                type="button"
                onClick={cerrarEditorAgenda}
                disabled={guardandoAgenda}
                style={{
                  minHeight: 52,
                  borderRadius: 16,
                  border: `1px solid ${THEME.border}`,
                  background: "#fff",
                  color: THEME.textSoft,
                  fontWeight: 900,
                  cursor: guardandoAgenda
                    ? "wait"
                    : "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarAgenda}
                disabled={guardandoAgenda}
                style={{
                  minHeight: 52,
                  borderRadius: 16,
                  border: "none",
                  background: THEME.olive,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontWeight: 900,
                  cursor: guardandoAgenda
                    ? "wait"
                    : "pointer",
                  opacity: guardandoAgenda ? 0.7 : 1,
                }}
              >
                <Save size={18} />

                {guardandoAgenda
                  ? "Guardando…"
                  : "Guardar fecha"}
              </button>
            </div>
          </motion.section>
        </div>
      ) : null}

      {conceptoTomasEditando ? (
        <div
          role="presentation"
          onMouseDown={cerrarEditorTomas}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(18,17,15,0.72)",
            padding: isMobile ? 14 : 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: 540,
              maxHeight: "90vh",
              overflowY: "auto",
              background: THEME.card,
              borderRadius: isMobile ? 22 : 27,
              border: `1px solid ${THEME.border}`,
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.28)",
              padding: isMobile ? 18 : 26,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div>
                <span
                  style={{
                    color: THEME.gold,
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                  }}
                >
                  SELECCIÓN DE FOTOGRAFÍAS
                </span>

                <h2
                  style={{
                    margin: "6px 0 5px",
                    color: THEME.text,
                    fontSize: isMobile ? 23 : 28,
                  }}
                >
                  {conceptoTomasEditando.descripcion}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: THEME.textSoft,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {conceptoTomasEditando.medida
                    ? `Medida: ${conceptoTomasEditando.medida}. `
                    : ""}
                  Captura{" "}
                  {
                    conceptoTomasEditando.cantidad_tomas_requeridas
                  }{" "}
                  {conceptoTomasEditando
                    .cantidad_tomas_requeridas === 1
                    ? "número de toma."
                    : "números de toma."}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarEditorTomas}
                disabled={guardandoTomas}
                aria-label="Cerrar"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  border: `1px solid ${THEME.border}`,
                  background: "#fff",
                  color: THEME.textSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: guardandoTomas
                    ? "wait"
                    : "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {tomasEditadas.map((toma, index) => (
                <label
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      color: THEME.text,
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    Toma {index + 1} *
                  </span>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={toma}
                    onChange={(event) =>
                      actualizarToma(
                        index,
                        event.target.value
                      )
                    }
                    placeholder={`Ej. ${1500 + index}`}
                    autoFocus={index === 0}
                    style={{
                      width: "100%",
                      minHeight: 54,
                      borderRadius: 15,
                      border: `1px solid ${THEME.border}`,
                      background: "#fff",
                      color: THEME.text,
                      WebkitTextFillColor: THEME.text,
                      padding: "0 14px",
                      fontSize: 18,
                      fontWeight: 800,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </label>
              ))}
            </div>

            {errorTomas ? (
              <div
                style={{
                  marginTop: 16,
                  borderRadius: 14,
                  background: THEME.redSoft,
                  color: THEME.red,
                  padding: 13,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {errorTomas}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "0.8fr 1.2fr",
                gap: 10,
                marginTop: 22,
              }}
            >
              <button
                type="button"
                onClick={cerrarEditorTomas}
                disabled={guardandoTomas}
                style={{
                  minHeight: 52,
                  borderRadius: 16,
                  border: `1px solid ${THEME.border}`,
                  background: "#fff",
                  color: THEME.textSoft,
                  fontWeight: 900,
                  cursor: guardandoTomas
                    ? "wait"
                    : "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarTomas}
                disabled={guardandoTomas}
                style={{
                  minHeight: 52,
                  borderRadius: 16,
                  border: "none",
                  background: THEME.olive,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontWeight: 900,
                  cursor: guardandoTomas
                    ? "wait"
                    : "pointer",
                  opacity: guardandoTomas ? 0.7 : 1,
                }}
              >
                <Save size={18} />

                {guardandoTomas
                  ? "Guardando…"
                  : confirmandoTomasRepetidas
                    ? "Sí, guardar repetidas"
                    : "Guardar tomas"}
              </button>
            </div>
          </motion.section>
        </div>
      ) : null}

      {mostrarEnviarProduccion ? (
        <ServicioEnviarProduccion
          servicioId={servicio.id}
          usuarioId={usuarioActualId}
          conceptos={conceptos.map((concepto) => ({
            id: concepto.id,
            cantidad: Number(concepto.cantidad || 0),
            descripcion: concepto.descripcion,
            medida: concepto.medida,
            marco: concepto.marco,
            especificaciones:
              concepto.especificaciones,
            tomasSeleccionadas:
              concepto.tomas_seleccionadas || [],
          }))}
          onCancelar={() =>
            setMostrarEnviarProduccion(false)
          }
          onEnviado={async () => {
            setMostrarEnviarProduccion(false);
            await cargarDetalle(true);

            alert(
              "El servicio fue enviado a producción correctamente."
            );
          }}
        />
      ) : null}
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
  centerPage: {
    minHeight: "100vh",
    padding: "130px 20px 50px",
    background: THEME.bg,
    color: THEME.text,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    textAlign: "center",
    boxSizing: "border-box",
  },
  centerText: {
    color: THEME.textSoft,
    maxWidth: 500,
  },
  simpleButton: {
    minHeight: 45,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: THEME.olive,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
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
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 22,
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: THEME.textSoft,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 0,
    marginBottom: 20,
    cursor: "pointer",
    fontWeight: 800,
  },
  folioRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 9,
  },
  folioBadge: {
    borderRadius: 999,
    background: THEME.olive,
    color: "#fff",
    padding: "6px 10px",
    fontSize: 10,
    fontWeight: 900,
  },
  statusBadge: {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 10,
    fontWeight: 900,
  },
  title: {
    margin: 0,
    color: THEME.text,
    lineHeight: 1,
    letterSpacing: "-2px",
    wordBreak: "break-word",
  },
  subtitle: {
    margin: "10px 0 0",
    color: THEME.textSoft,
    fontSize: 15,
  },
  refreshButton: {
    minHeight: 46,
    borderRadius: 15,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    color: THEME.textSoft,
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
  },
  kpiGrid: {
    display: "grid",
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    minWidth: 0,
    borderRadius: 18,
    border: `1px solid ${THEME.border}`,
    background: THEME.card,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  kpiLabel: {
    color: THEME.textSoft,
    fontSize: 10,
    fontWeight: 900,
  },
  kpiValue: {
    color: THEME.text,
    fontSize: 20,
    wordBreak: "break-word",
  },
  layout: {
    display: "grid",
    gap: 16,
    alignItems: "start",
  },
  mainColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },
  sideColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },
  card: {
    borderRadius: 24,
    border: `1px solid ${THEME.border}`,
    background: THEME.card,
    boxShadow: "0 18px 45px rgba(61,51,39,0.07)",
    minWidth: 0,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 17,
  },
  sectionTitle: {
    margin: 0,
    color: THEME.text,
    fontSize: 19,
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
    color: THEME.gold,
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
    fontSize: 12,
    lineHeight: 1.4,
    textTransform: "capitalize",
  },
  infoText: {
    display: "block",
    color: THEME.textSoft,
    fontSize: 11,
    marginTop: 3,
  },
  pendingText: {
    display: "block",
    color: THEME.red,
    fontSize: 10,
    fontWeight: 900,
    marginTop: 3,
  },
  conceptsList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  conceptRow: {
    borderRadius: 16,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    padding: 13,
    display: "flex",
    alignItems: "flex-start",
    gap: 11,
    minWidth: 0,
  },
  numberBadge: {
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
  conceptInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  conceptTitle: {
    color: THEME.text,
    fontSize: 13,
    wordBreak: "break-word",
  },
  conceptText: {
    color: THEME.textSoft,
    fontSize: 11,
  },
  tomasText: {
    color: THEME.olive,
    fontSize: 11,
    fontWeight: 900,
  },
  conceptPrice: {
    color: THEME.text,
    fontSize: 13,
    flexShrink: 0,
  },
  paymentCard: {
    borderRadius: 24,
    background: THEME.olive,
    color: "#fff",
    padding: 21,
    boxShadow: "0 22px 50px rgba(54,65,46,0.22)",
  },
  paymentHeader: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    marginBottom: 22,
  },
  paymentEyebrow: {
    display: "block",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  paymentTitle: {
    display: "block",
    fontSize: 16,
  },
  balanceLabel: {
    display: "block",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.4,
    opacity: 0.65,
  },
  balanceValue: {
    display: "block",
    fontSize: 35,
    marginTop: 3,
    wordBreak: "break-word",
  },
  limitText: {
    display: "block",
    fontSize: 11,
    opacity: 0.67,
    marginTop: 6,
    textTransform: "capitalize",
  },
  paymentButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 17,
    border: "none",
    background: THEME.gold,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
    marginTop: 19,
  },
  paidBox: {
    minHeight: 52,
    borderRadius: 16,
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    fontWeight: 900,
  },
  historyCard: {
    borderRadius: 24,
    border: `1px solid ${THEME.border}`,
    background: THEME.card,
    padding: 20,
  },
  emptyHistory: {
    borderRadius: 15,
    border: `1px dashed ${THEME.border}`,
    color: THEME.textSoft,
    padding: 18,
    textAlign: "center",
    fontSize: 12,
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  paymentRow: {
    borderRadius: 15,
    border: `1px solid ${THEME.border}`,
    background: "#fff",
    padding: 13,
  },
  paymentAmount: {
    display: "block",
    color: THEME.green,
    fontSize: 16,
  },
  paymentMeta: {
    display: "block",
    color: THEME.text,
    fontSize: 10,
    fontWeight: 800,
    marginTop: 3,
  },
  paymentDate: {
    display: "block",
    color: THEME.textSoft,
    fontSize: 9,
    marginTop: 4,
  },
};

export default ServicioDetalle;