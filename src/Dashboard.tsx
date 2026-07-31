import React, { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import Vista1 from "./TomaPedidos/Vista1";
import Vista2 from "./TomaPedidos/Vista2";
import Vista3 from "./TomaPedidos/Vista3";
import Vista4Pago from "./TomaPedidos/Vista4Pago";
import OrdenEnCurso1 from "./OrdenCurso/OrdenEnCurso1";
import OrdenEnCursoDetalle from "./OrdenCurso/OrdenEnCursoDetalle";
import ProduccionLista from "./Produccion/ProduccionLista";
import ProduccionDetalle from "./Produccion/ProduccionDetalle";
import Entrega from "./Entrega/Entrega";
import RetirosCajaAdmin from "./Retiros/RetirosCajaAdmin";
import CuentasLista from "./Cuentas/CuentasLista";
import CuentasDetalle from "./Cuentas/CuentasDetalle";
import BusquedaPedidos from "./Busqueda/BusquedaPedidos";
import RecadosPanel from "./Recados/RecadosPanel";
import ConfigPrecios from "./Configuracion/ConfigPrecios";
import ConfigUsuarios from "./Configuracion/ConfigUsuarios";
import ConfigAccesos from "./Configuracion/ConfigAccesos";
import ConfigCuentasTransferencia from "./Configuracion/ConfigCuentasTransferencia";
import { supabase } from "./supabaseClient";
import EditarPedido from "./Editar/EditarPedido";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Package,
  Wallet,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CalendarCheck,
  Factory,
  Sparkles,
  MessageSquareText,
  Plus,
  X,
  Send,
  Settings,
  Users,
  Landmark,
  KeyRound,
  Search,
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

type PedidoCreado = {
  pedidoId: string;
  clienteNombre: string;
  usuarioId?: string;
  totalBruto: number;
  descuento: number;
  totalFinal: number;
  pendiente: number;
};

type AdminAccess = {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  color: string;
  view: string;
};

type DashboardCard = {
  label: string;
  title: string;
  detail: string;
  icon: React.ReactElement;
  color: string;
  bg: string;
  view?: string;
};

type DetalleResumen = {
  n_toma: string | null;
  retocado: boolean | null;
  impreso: boolean | null;
  calendario: boolean | null;
};

type PedidoResumen = {
  id: string;
  cliente_nombre: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  urgente: boolean | null;
  resta: number | null;
  entregado: boolean | null;
  p_2listo: boolean | null;
  p3_concluido: boolean | null;
  fecha_inicio_urgente: string | null;
  fecha_creacion: string | null;
  detalles_pedido?: DetalleResumen[];
};

type Recado = {
  id: string;
  mensaje: string | null;
  tipo: string | null;
  pedido_id: string | null;
  n_toma: string | null;
  creado_por: string | null;
  leido: boolean | null;
  created_at: string | null;
  usuario_nombre?: string | null;
};

type UsuarioRecado = {
  id: string;
  nombre: string | null;
};

const todayYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const ConfiguracionHome = ({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (view: string) => void;
}) => {
  const items = [
    {
      icon: <Package size={26} />,
      title: "Precios",
      subtitle: "Editar paquetes, cantidades y aumentos",
      color: "#556b2f",
      view: "Config Precios",
    },
    {
      icon: <Users size={26} />,
      title: "Usuarios",
      subtitle: "Administrar usuarios internos",
      color: "#2f5d50",
      view: "Config Usuarios",
    },
    {
      icon: <KeyRound size={26} />,
      title: "Accesos",
      subtitle: "Contraseñas y recuperación",
      color: "#8b6f47",
      view: "Config Accesos",
    },
    {
      icon: <Landmark size={26} />,
      title: "Cuentas transferencia",
      subtitle: "Activar, desactivar y ordenar cuentas",
      color: "#2f5d50",
      view: "Config Cuentas Transferencia",
    },
  ];

  return (
    <motion.div
      key="configuracion"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={styles.configPage}
    >
      <div style={styles.configHero}>
        <div style={styles.configHeroTop}>
          <button type="button" onClick={onBack} style={styles.configBackBtn}>
            <ArrowLeft size={18} />
            Regresar
          </button>
        </div>

        <div style={styles.configHeroBody}>
          <div style={styles.configHeroIcon}>
            <Settings size={32} color="#fff" />
          </div>

          <div>
            <h1 style={styles.configTitle}>Configuración</h1>
            <p style={styles.configSubtitle}>
              Administra precios, usuarios y accesos del sistema.
            </p>
          </div>
        </div>
      </div>

      <div style={styles.configGrid}>
        {items.map((item, index) => (
          <motion.button
            key={item.title}
            type="button"
            onClick={() => onOpen(item.view)}
            style={{
              ...styles.configCard,
              border: `1px solid ${item.color}18`,
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            whileHover={{
              y: -6,
              boxShadow: "0 22px 42px rgba(0,0,0,0.06)",
            }}
            whileTap={{ scale: 0.985 }}
          >
            <div
              style={{
                ...styles.configCardIcon,
                backgroundColor: `${item.color}12`,
              }}
            >
              {React.cloneElement(item.icon, { color: item.color })}
            </div>

            <div style={styles.configCardBody}>
              <div style={styles.configCardTitle}>{item.title}</div>
              <div style={styles.configCardSubtitle}>{item.subtitle}</div>
            </div>

            <ArrowUpRight size={20} style={styles.configCardArrow} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

const Dashboard = ({ session }: { session: any }) => {
  const [nombreParaMostrar, setNombreParaMostrar] =
    useState<string>("Cargando...");
  const [perfilComp, setPerfilComp] = useState<any>(null);
  const [vistaActiva, setVistaActiva] = useState(() => {
    return localStorage.getItem("vistaActiva") || "Inicio";
  });
  const [ocultarNavbar, setOcultarNavbar] = useState(false);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<string | null>(
    null
  );
  const [busquedaEntregaInicial, setBusquedaEntregaInicial] =
    useState<string>("");

  const [busquedaFlujoEntrega, setBusquedaFlujoEntrega] =
    useState<string>("");

  const [diaCuentaSeleccionado, setDiaCuentaSeleccionado] = useState<
    string | null
  >(null);

  const [datosCliente, setDatosCliente] = useState<DatosCliente>({
    cliente_nombre: "",
    cliente_telefono: "",
    fecha_entrega: "",
    horario_entrega: "",
  });

  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [descuentoManual, setDescuentoManual] = useState(0);
  const [pedidoCreado, setPedidoCreado] = useState<PedidoCreado | null>(null);

  const [pedidosResumen, setPedidosResumen] = useState<PedidoResumen[]>([]);
  const [recados, setRecados] = useState<Recado[]>([]);
  const [usuariosRecado, setUsuariosRecado] = useState<UsuarioRecado[]>([]);
  const [slideActual, setSlideActual] = useState(0);

  const [showRecado, setShowRecado] = useState(false);
  const [mensajeRecado, setMensajeRecado] = useState("");
  const [tipoRecado, setTipoRecado] = useState("GENERAL");
  const [nTomaRecado, setNTomaRecado] = useState("");
  const [usuarioRecado, setUsuarioRecado] = useState("");
  const [guardandoRecado, setGuardandoRecado] = useState(false);

  const puedeElegirUsuario = perfilComp?.puede_elegir_usuario === true;

  useEffect(() => {
    const obtenerNombreReal = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre, admin, puede_elegir_usuario")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (error) {
        setNombreParaMostrar(session.user.email || "Usuario");
        return;
      }

      if (data && data.nombre) {
        setPerfilComp(data);
        const formateado = data.nombre
          .toLowerCase()
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
        setNombreParaMostrar(formateado);
      } else {
        setNombreParaMostrar(session.user.email || "Usuario");
      }
    };

    obtenerNombreReal();
  }, [session]);

  const cargarResumenDashboard = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          "id, cliente_nombre, fecha_entrega, horario_entrega, urgente, resta, entregado, p_2listo, p3_concluido, fecha_inicio_urgente, fecha_creacion, detalles_pedido(n_toma, retocado, impreso, calendario)"
        )
        .order("fecha_creacion", { ascending: false })
        .limit(160);

      if (error) throw error;
      setPedidosResumen((Array.isArray(data) ? data : []) as PedidoResumen[]);
    } catch (error) {
      console.warn("No se pudo cargar resumen dashboard", error);
    }
  };

  const cargarRecados = async () => {
    try {
      const { data: recadosData, error: recadosError } = await supabase
        .from("recados")
        .select("id,mensaje,tipo,pedido_id,n_toma,creado_por,leido,created_at")
        .eq("leido", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recadosError) throw recadosError;

      const listaRecados = Array.isArray(recadosData) ? recadosData : [];
      const usuariosIds = listaRecados.map((r) => r.creado_por).filter(Boolean);

      let usuariosMap = new Map<string, string | null>();

      if (usuariosIds.length > 0) {
        const { data: usuariosData, error: usuariosError } = await supabase
          .from("usuarios")
          .select("id,nombre")
          .in("id", usuariosIds);

        if (usuariosError) throw usuariosError;

        usuariosMap = new Map(
          (usuariosData || []).map((u) => [u.id, u.nombre])
        );
      }

      const recadosConUsuario = listaRecados.map((r) => ({
        ...r,
        usuario_nombre: usuariosMap.get(r.creado_por) || "Usuario",
      }));

      setRecados(recadosConUsuario as Recado[]);
    } catch (error) {
      console.warn("No se pudieron cargar recados", error);
    }
  };

  const cargarUsuariosRecado = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setUsuariosRecado((Array.isArray(data) ? data : []) as UsuarioRecado[]);
    } catch (error) {
      console.warn("No se pudieron cargar usuarios para recado", error);
    }
  };

  useEffect(() => {
    cargarUsuariosRecado();
  }, []);

  useEffect(() => {
    if (vistaActiva !== "Inicio") return;

    cargarResumenDashboard();
    cargarRecados();
  }, [vistaActiva]);

  const crearRecado = async () => {
    if (!mensajeRecado.trim()) return;

    if (puedeElegirUsuario && !usuarioRecado) {
      alert("Selecciona quién dejó el recado");
      return;
    }

    try {
      setGuardandoRecado(true);

      const { error } = await supabase.from("recados").insert([
        {
          mensaje: mensajeRecado.trim(),
          tipo: tipoRecado,
          n_toma: nTomaRecado.trim() || null,
          creado_por: puedeElegirUsuario
            ? usuarioRecado
            : perfilComp?.id || null,
          leido: false,
        },
      ]);

      if (error) throw error;

      setMensajeRecado("");
      setTipoRecado("GENERAL");
      setNTomaRecado("");
      setUsuarioRecado("");
      setShowRecado(false);
      await cargarRecados();
    } catch (error: any) {
      alert(error?.message || "No se pudo guardar el recado");
    } finally {
      setGuardandoRecado(false);
    }
  };

  const obtenerSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const obtenerPendientesProduccion = (pedido: PedidoResumen) => {
    const detalles = pedido.detalles_pedido || [];
    const pendientes: string[] = [];

    if (detalles.some((detalle) => detalle.retocado !== true)) {
      pendientes.push("retoque");
    }

    if (detalles.some((detalle) => detalle.impreso !== true)) {
      pendientes.push("impresión");
    }

    if (detalles.some((detalle) => detalle.calendario !== true)) {
      pendientes.push("calendario");
    }

    return pendientes;
  };

  const obtenerTomasPedido = (pedido: PedidoResumen) => {
    const tomas = (pedido.detalles_pedido || [])
      .map((detalle) => String(detalle.n_toma || "").trim())
      .filter(Boolean);

    return Array.from(new Set(tomas));
  };


  const obtenerEstadoPedido = (pedido: PedidoResumen) => {
    const detalles = pedido.detalles_pedido || [];
    const tieneToma = detalles.some((detalle) =>
      Boolean(detalle.n_toma?.trim())
    );

    if (!tieneToma && pedido.p_2listo !== true) {
      return {
        etapa: "ORDEN",
        texto: "Esperando retrato",
        view: "Orden en Curso",
      };
    }

    if (pedido.p3_concluido !== true) {
      const pendientes = obtenerPendientesProduccion(pedido);

      return {
        etapa: "PRODUCCION",
        texto: pendientes.length
          ? `En Producción · falta ${pendientes.join(", ")}`
          : "En Producción",
        view: "Producción",
      };
    }

    return {
      etapa: "ENTREGA",
      texto: "Listo para entregar",
      view: "Entrega",
    };
  };

  const abrirPedidoDesdeFlujo = (pedido: PedidoResumen) => {
    const estado = obtenerEstadoPedido(pedido);

    if (estado.etapa === "ORDEN") {
      setPedidoSeleccionado(pedido.id);
      setVistaActiva("Orden en Curso Detalle");
      return;
    }

    if (estado.etapa === "PRODUCCION") {
      setPedidoSeleccionado(pedido.id);
      setVistaActiva("Producción Detalle");
      return;
    }

    const [primeraToma] = obtenerTomasPedido(pedido);

    setBusquedaEntregaInicial(
      primeraToma || String(pedido.cliente_nombre || "").trim()
    );
    setVistaActiva("Entrega");
  };

  useEffect(() => {
    if (vistaActiva !== "Entrega") {
      setBusquedaEntregaInicial("");
    }
  }, [vistaActiva]);


  const dashboardCards = useMemo<DashboardCard[]>(() => {
    const hoy = todayYMD();
    const noEntregados = pedidosResumen.filter((pedido) => !pedido.entregado);

    const urgentes = noEntregados.filter((pedido) => pedido.urgente === true);

    const urgentesOrdenados = [...urgentes].sort((a, b) => {
      const prioridades: Record<string, number> = {
        ORDEN: 1,
        PRODUCCION: 2,
        ENTREGA: 3,
      };

      const estadoA = obtenerEstadoPedido(a);
      const estadoB = obtenerEstadoPedido(b);

      return prioridades[estadoA.etapa] - prioridades[estadoB.etapa];
    });

    const entregasHoy = noEntregados.filter(
      (pedido) => pedido.fecha_entrega === hoy
    );

    const produccion = noEntregados.filter(
      (pedido) => obtenerEstadoPedido(pedido).etapa === "PRODUCCION"
    );

    const primerRecado = recados[0];
    const primerUrgente = urgentesOrdenados[0];
    const primeraEntrega = entregasHoy[0];

    const urgentesDetalle = urgentesOrdenados
      .slice(0, 2)
      .map((pedido) => {
        const estado = obtenerEstadoPedido(pedido);

        return `${pedido.cliente_nombre || "Sin nombre"} · ${estado.texto}`;
      });

    if (urgentesOrdenados.length > 2) {
      urgentesDetalle.push(
        `Y ${urgentesOrdenados.length - 2} urgente${urgentesOrdenados.length - 2 === 1 ? "" : "s"
        } más`
      );
    }

    const entregasListas = entregasHoy.filter(
      (pedido) => obtenerEstadoPedido(pedido).etapa === "ENTREGA"
    ).length;

    const entregasEnProduccion = entregasHoy.filter(
      (pedido) => obtenerEstadoPedido(pedido).etapa === "PRODUCCION"
    ).length;

    const entregasSinRetratar = entregasHoy.filter(
      (pedido) => obtenerEstadoPedido(pedido).etapa === "ORDEN"
    ).length;

    const resumenEntregasHoy = [
      entregasListas > 0
        ? `${entregasListas} lista${entregasListas === 1 ? "" : "s"}`
        : "",
      entregasEnProduccion > 0
        ? `${entregasEnProduccion} en Producción`
        : "",
      entregasSinRetratar > 0
        ? `${entregasSinRetratar} sin retratar`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const produccionConRetoquePendiente = produccion.filter((pedido) =>
      obtenerPendientesProduccion(pedido).includes("retoque")
    ).length;

    const produccionConImpresionPendiente = produccion.filter((pedido) =>
      obtenerPendientesProduccion(pedido).includes("impresión")
    ).length;

    const produccionConCalendarioPendiente = produccion.filter((pedido) =>
      obtenerPendientesProduccion(pedido).includes("calendario")
    ).length;

    const resumenProduccion = [
      produccionConRetoquePendiente > 0
        ? `${produccionConRetoquePendiente} con retoque pendiente`
        : "",
      produccionConImpresionPendiente > 0
        ? `${produccionConImpresionPendiente} con impresión pendiente`
        : "",
      produccionConCalendarioPendiente > 0
        ? `${produccionConCalendarioPendiente} con calendario pendiente`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");

    return [
      {
        label: "Recados activos",
        title: recados.length
          ? `${recados.length} recado${recados.length === 1 ? "" : "s"}`
          : "Sin recados",
        detail: primerRecado
          ? `${primerRecado.tipo || "GENERAL"} · ${primerRecado.usuario_nombre || "Usuario"
          }\n${primerRecado.mensaje || ""}${primerRecado.n_toma ? ` · TOMA ${primerRecado.n_toma}` : ""
          }`
          : "No hay indicaciones pendientes",
        icon: <MessageSquareText size={28} />,
        color: "#2f5d50",
        bg: "rgba(47,93,80,0.10)",
        view: "Recados",
      },
      {
        label: "Urgentes activos",
        title: urgentesOrdenados.length
          ? `${urgentesOrdenados.length} urgente${urgentesOrdenados.length === 1 ? "" : "s"
          } activo${urgentesOrdenados.length === 1 ? "" : "s"}`
          : "Sin urgentes",
        detail: urgentesOrdenados.length
          ? urgentesDetalle.join("\n")
          : "Todo tranquilo por ahora",
        icon: <AlertTriangle size={28} />,
        color: "#b64040",
        bg: "rgba(182,64,64,0.08)",
        view: primerUrgente
          ? obtenerEstadoPedido(primerUrgente).view
          : "Orden en Curso",
      },
      {
        label: "Entregas pendientes de hoy",
        title: `${entregasHoy.length} pedido${entregasHoy.length === 1 ? "" : "s"
          }`,
        detail: entregasHoy.length
          ? `${resumenEntregasHoy || "Pendientes de revisar"}${primeraEntrega
            ? `\n${primeraEntrega.cliente_nombre || "Sin nombre"} · ${primeraEntrega.horario_entrega || "Sin horario"
            }`
            : ""
          }`
          : "No hay entregas pendientes hoy",
        icon: <CalendarCheck size={28} />,
        color: "#556b2f",
        bg: "rgba(85,107,47,0.09)",
        view: "Entrega",
      },
      {
        label: "Estado de Producción",
        title: `${produccion.length} pedido${produccion.length === 1 ? "" : "s"
          } en proceso`,
        detail: produccion.length
          ? resumenProduccion || "Revisar avance de Producción"
          : "No hay pedidos pendientes en Producción",
        icon: <Factory size={28} />,
        color: "#8b6f47",
        bg: "rgba(139,111,71,0.10)",
        view: "Producción",
      },
    ].filter((card) => {
      if (card.label === "Recados activos") {
        return recados.length > 0;
      }

      if (card.label === "Urgentes activos") {
        return urgentesOrdenados.length > 0;
      }

      if (card.label === "Entregas pendientes de hoy") {
        return entregasHoy.length > 0;
      }

      return true;
    });
  }, [pedidosResumen, recados]);

  const obtenerMinutosHorario = (horario: string | null) => {
    if (!horario) return Number.MAX_SAFE_INTEGER;

    const horarioLimpio = horario
      .toUpperCase()
      .replace(/\./g, "")
      .replace(/\s+/g, "")
      .trim();

    const coincidencia = horarioLimpio.match(
      /^(\d{1,2})(?::(\d{1,2}))?(AM|PM)?$/
    );

    if (!coincidencia) return Number.MAX_SAFE_INTEGER;

    let horas = Number(coincidencia[1]);
    const minutos = Number(coincidencia[2] || 0);
    const periodo = coincidencia[3];

    if (periodo === "AM" && horas === 12) horas = 0;
    if (periodo === "PM" && horas < 12) horas += 12;

    return horas * 60 + minutos;
  };


  const pedidosPorEtapa = useMemo(() => {
    const hoy = todayYMD();

    const pedidosActivos = pedidosResumen.filter(
      (pedido) => pedido.entregado !== true
    );

    const ordenarPedidos = (pedidos: PedidoResumen[]) =>
      [...pedidos].sort((a, b) => {
        const prioridadUrgente =
          Number(b.urgente === true) - Number(a.urgente === true);

        if (prioridadUrgente !== 0) return prioridadUrgente;

        return String(a.fecha_entrega || "9999-12-31").localeCompare(
          String(b.fecha_entrega || "9999-12-31")
        );
      });

    const ordenarListosEntrega = (pedidos: PedidoResumen[]) =>
      [...pedidos].sort((a, b) => {
        const aEsUrgente = a.urgente === true;
        const bEsUrgente = b.urgente === true;

        if (aEsUrgente !== bEsUrgente) {
          return aEsUrgente ? -1 : 1;
        }

        if (aEsUrgente && bEsUrgente) {
          const fechaA = new Date(
            a.fecha_inicio_urgente || a.fecha_creacion || ""
          ).getTime();

          const fechaB = new Date(
            b.fecha_inicio_urgente || b.fecha_creacion || ""
          ).getTime();

          const fechaSeguraA = Number.isFinite(fechaA)
            ? fechaA
            : Number.MAX_SAFE_INTEGER;

          const fechaSeguraB = Number.isFinite(fechaB)
            ? fechaB
            : Number.MAX_SAFE_INTEGER;

          if (fechaSeguraA !== fechaSeguraB) {
            return fechaSeguraA - fechaSeguraB;
          }
        }

        const aEsHoy = a.fecha_entrega === hoy;
        const bEsHoy = b.fecha_entrega === hoy;

        if (aEsHoy !== bEsHoy) {
          return aEsHoy ? -1 : 1;
        }

        if (aEsHoy && bEsHoy) {
          const diferenciaHorario =
            obtenerMinutosHorario(a.horario_entrega) -
            obtenerMinutosHorario(b.horario_entrega);

          if (diferenciaHorario !== 0) {
            return diferenciaHorario;
          }
        }

        const diferenciaFecha = String(
          a.fecha_entrega || "9999-12-31"
        ).localeCompare(String(b.fecha_entrega || "9999-12-31"));

        if (diferenciaFecha !== 0) {
          return diferenciaFecha;
        }

        return (
          obtenerMinutosHorario(a.horario_entrega) -
          obtenerMinutosHorario(b.horario_entrega)
        );
      });

    const esperandoRetrato = pedidosActivos.filter(
      (pedido) => obtenerEstadoPedido(pedido).etapa === "ORDEN"
    );

    const produccion = pedidosActivos.filter(
      (pedido) => obtenerEstadoPedido(pedido).etapa === "PRODUCCION"
    );

    const listosEntrega = pedidosActivos.filter(
      (pedido) => obtenerEstadoPedido(pedido).etapa === "ENTREGA"
    );

    return {
      esperandoRetrato: ordenarPedidos(esperandoRetrato),
      produccion: ordenarPedidos(produccion),
      listosEntrega: ordenarListosEntrega(listosEntrega),
    };
  }, [pedidosResumen]);

  const pedidosEntregaFiltrados = useMemo(() => {
    const normalizarTexto = (valor: string) =>
      valor
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const termino = normalizarTexto(busquedaFlujoEntrega);

    if (!termino) {
      return pedidosPorEtapa.listosEntrega;
    }

    const pedidosActivos = pedidosResumen.filter(
      (pedido) => pedido.entregado !== true
    );

    return pedidosActivos.filter((pedido) => {
      const nombre = normalizarTexto(
        String(pedido.cliente_nombre || "")
      );

      const tomas = normalizarTexto(
        obtenerTomasPedido(pedido).join(" ")
      );

      return nombre.includes(termino) || tomas.includes(termino);
    });
  }, [
    busquedaFlujoEntrega,
    pedidosPorEtapa.listosEntrega,
    pedidosResumen,
  ]);


  const estadoEstudio = useMemo(() => {
    return [
      {
        label: "Esperando retrato",
        cantidad: pedidosPorEtapa.esperandoRetrato.length,
        detail: pedidosPorEtapa.esperandoRetrato.length
          ? "Clientes pendientes de retratar"
          : "Sin clientes esperando",
        pedidos: pedidosPorEtapa.esperandoRetrato,
        icon: <AlertTriangle size={23} />,
        color: "#b49d71",
        bg: "rgba(180,157,113,0.12)",
        view: "Orden en Curso",
      },
      {
        label: "En Producción",
        cantidad: pedidosPorEtapa.produccion.length,
        detail: pedidosPorEtapa.produccion.length
          ? "Pedidos con trabajo pendiente"
          : "Producción al corriente",
        pedidos: pedidosPorEtapa.produccion,
        icon: <Factory size={23} />,
        color: "#8b6f47",
        bg: "rgba(139,111,71,0.10)",
        view: "Producción",
      },
      {
        label: "Listos para entregar",
        cantidad: pedidosPorEtapa.listosEntrega.length,
        detail: pedidosPorEtapa.listosEntrega.length
          ? "Pedidos preparados para entregar"
          : "Sin pedidos pendientes",
        pedidos: pedidosEntregaFiltrados,
        icon: <Package size={23} />,
        color: "#556b2f",
        bg: "rgba(85,107,47,0.10)",
        view: "Entrega",
      },
    ];
  }, [pedidosPorEtapa, pedidosEntregaFiltrados]);


  useEffect(() => {
    if (!dashboardCards.length) return;

    const urgenteIndex = dashboardCards.findIndex(
      (card) =>
        card.label === "Urgentes activos" && card.title !== "Sin urgentes"
    );

    const entregasIndex = dashboardCards.findIndex(
      (card) =>
        card.label === "Entregas pendientes de hoy" &&
        !card.title.startsWith("0 ")
    );

    const recadosIndex = dashboardCards.findIndex(
      (card) =>
        card.label === "Recados activos" && card.title !== "Sin recados"
    );

    if (urgenteIndex >= 0) {
      setSlideActual(urgenteIndex);
      return;
    }

    if (entregasIndex >= 0) {
      setSlideActual(entregasIndex);
      return;
    }

    if (recadosIndex >= 0) {
      setSlideActual(recadosIndex);
      return;
    }

    setSlideActual(0);
  }, [dashboardCards]);


  useEffect(() => {
    if (!dashboardCards.length) return;

    const timer = window.setInterval(() => {
      setSlideActual((prev) => (prev + 1) % dashboardCards.length);
    }, 8500);

    return () => window.clearInterval(timer);
  }, [dashboardCards.length]);
  useEffect(() => {
    localStorage.setItem("vistaActiva", vistaActiva);
  }, [vistaActiva]);

  const currentCard = dashboardCards[slideActual] || dashboardCards[0];

  const accesosAdmin: AdminAccess[] = [
    {
      icon: <Settings size={24} />,
      title: "Configuración",
      subtitle: "Precios, usuarios y accesos",
      color: "#556b2f",
      view: "Configuracion",
    },
    {
      icon: <Wallet size={24} />,
      title: "Retiro de Caja",
      subtitle: "Movimientos y retiros",
      color: "#8b6f47",
      view: "Retiros Caja",
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Cuentas",
      subtitle: "Corte y revisión",
      color: "#2f5d50",
      view: "Cuentas",
    },
  ];

  const reiniciarFlujoPedido = () => {
    setDatosCliente({
      cliente_nombre: "",
      cliente_telefono: "",
      fecha_entrega: "",
      horario_entrega: "",
    });
    setCarrito([]);
    setDescuentoManual(0);
    setPedidoCreado(null);
  };

  const confirmarPedido = async () => {
    if (guardandoPedido) return;
    try {
      setGuardandoPedido(true);

      const ahora = new Date().toISOString();
      const hoyTurno = new Date().toLocaleDateString("en-CA");

      const { count, error: errorTurno } = await supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true })
        .gte("fecha_creacion", `${hoyTurno}T00:00:00`)
        .lt("fecha_creacion", `${hoyTurno}T23:59:59`);

      if (errorTurno) throw errorTurno;

      const turnoDia = `A${String((count || 0) + 1).padStart(3, "0")}`;

      const pedidoEsUrgente = carrito.some((item) => item.esUrgente);

      const itemConCapturista = carrito.find(
        (item) => item.usuarioId && item.usuarioNombre
      );

      const capturistaId =
        itemConCapturista?.usuarioId || perfilComp?.id || null;

      const capturistaNombre =
        itemConCapturista?.usuarioNombre || perfilComp?.nombre || null;

      const totalBruto = carrito.reduce(
        (acc, item) => acc + Number(item.total || 0),
        0
      );

      const descuento = Number(descuentoManual || 0);
      const totalFinal = Math.max(totalBruto - descuento, 0);

      const { data: pedidoInsertado, error: errorPedido } = await supabase
        .from("pedidos")
        .insert([
          {
            cliente_nombre: datosCliente.cliente_nombre,
            turno_dia: turnoDia,
            cliente_telefono: datosCliente.cliente_telefono || null,
            fecha_creacion: ahora,
            fecha_entrega: pedidoEsUrgente
              ? null
              : datosCliente.fecha_entrega || null,
            horario_entrega: pedidoEsUrgente
              ? "15 A 25 MINUTOS"
              : datosCliente.horario_entrega || null,
            urgente: pedidoEsUrgente,
            descuento,
            total_bruto: totalBruto,
            total_final: totalFinal,
            creado_por: capturistaId,
            creado_por_nombre: capturistaNombre,
            resta: totalFinal,
            pagado: false,
            p3_concluido: false,
            entregado: false,
            created_at: ahora,
            updated_at: ahora,
            anticipo: 0,
            liquidacion: 0,
            total_pagado: 0,
            fecha_inicio_urgente: pedidoEsUrgente ? ahora : null,
          },
        ])
        .select()
        .single();

      if (errorPedido) throw errorPedido;

      const detalles = carrito.map((item) => ({
        pedido_id: pedidoInsertado.id,
        cliente_nombre: datosCliente.cliente_nombre || null,
        tamano: item.tamano,
        tipo: item.tipo || null,
        cantidad: Number(item.cantidad || 0),
        papel: item.esKenfor ? "KENFOR" : "NORMAL",
        especificaciones: item.especificaciones || null,
        subtotal: Number(item.total || 0),
        precio_unitario:
          Number(item.cantidad || 0) > 0
            ? Number(item.total || 0) / Number(item.cantidad || 1)
            : Number(item.total || 0),
        urgente: item.esUrgente || false,
        retocado: false,
        impreso: false,
        calendario: false,
        creado_por: item.usuarioId || capturistaId,
        created_at: ahora,
        updated_at: ahora,
        n_toma: null,
      }));

      const { error: errorDetalles } = await supabase
        .from("detalles_pedido")
        .insert(detalles);

      if (errorDetalles) throw errorDetalles;

      setPedidoCreado({
        pedidoId: pedidoInsertado.id,
        clienteNombre: datosCliente.cliente_nombre,
        usuarioId: capturistaId || undefined,
        totalBruto,
        descuento,
        totalFinal,
        pendiente: totalFinal,
      });

      setVistaActiva("Vista4");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el pedido");
    } finally {
      setGuardandoPedido(false);
    }
  };

  const finalizarFlujoCompleto = () => {
    alert("Pedido finalizado correctamente");
    reiniciarFlujoPedido();
    setVistaActiva("Inicio");
    cargarResumenDashboard();
  };

  return (
    <div style={styles.dashboardWrapper}>
      <Navbar
        perfil={perfilComp}
        setVista={setVistaActiva}
        ocultarNavbar={ocultarNavbar}
      />

      <main style={styles.mainContent}>
        <AnimatePresence mode="wait">
          {vistaActiva === "Inicio" ? (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <header style={styles.header}>
                <div style={styles.headerTopRow}>
                  <p style={styles.dateText}>
                    {new Date().toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  {perfilComp?.admin ? (
                    <div style={styles.adminBadge}>
                      <Lock size={14} />
                      <span>Administrador</span>
                    </div>
                  ) : null}
                </div>

                <h1 style={styles.welcomeTitle}>
                  {obtenerSaludo()}, <br />
                  <span style={styles.highlightName}>{nombreParaMostrar}</span>
                </h1>
              </header>

              {currentCard ? (
                <section style={styles.carouselSection}>
                  <div style={styles.sectionTop}>
                    <h2 style={styles.sectionTitle}>Estado de hoy</h2>
                    <button
                      type="button"
                      onClick={() => {
                        cargarResumenDashboard();
                        cargarRecados();
                      }}
                      style={styles.refreshMiniBtn}
                    >
                      Actualizar
                    </button>
                  </div>

                  <motion.button
                    key={slideActual}
                    type="button"
                    onClick={() =>
                      currentCard.view && setVistaActiva(currentCard.view)
                    }
                    style={{
                      ...styles.reminderCard,
                      background: `linear-gradient(135deg, ${currentCard.bg} 0%, #ffffff 70%)`,
                    }}
                    initial={{ opacity: 0, x: 35, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -35, scale: 0.98 }}
                    transition={{ duration: 0.38 }}
                    whileHover={{
                      y: -5,
                      boxShadow: "0 24px 54px rgba(0,0,0,0.07)",
                    }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <div
                      style={{
                        ...styles.reminderIconBox,
                        backgroundColor: currentCard.bg,
                      }}
                    >
                      {React.cloneElement(currentCard.icon, {
                        color: currentCard.color,
                      })}
                    </div>

                    <div style={styles.reminderBody}>
                      <div style={styles.reminderLabel}>
                        <Sparkles size={13} color={currentCard.color} />
                        {currentCard.label}
                      </div>
                      <div style={styles.reminderTitle}>
                        {currentCard.title}
                      </div>
                      <div style={styles.reminderDetail}>
                        {currentCard.detail}
                      </div>
                    </div>

                    <ArrowUpRight
                      size={22}
                      style={{ color: currentCard.color, flexShrink: 0 }}
                    />
                  </motion.button>

                  <div style={styles.carouselDots}>
                    {dashboardCards.map((card, idx) => (
                      <button
                        key={card.label}
                        type="button"
                        onClick={() => setSlideActual(idx)}
                        style={{
                          ...styles.dot,
                          ...(idx === slideActual
                            ? {
                              width: 30,
                              backgroundColor: card.color,
                            }
                            : {}),
                        }}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section style={styles.workflowSection}>
                <h2 style={styles.sectionTitle}>Flujo del estudio</h2>

                <div style={styles.workflowGrid}>
                                  {estadoEstudio
                    .filter(
                      (item) =>
                        item.cantidad > 0 || item.view === "Entrega"
                    )
                    .map((item, index) => (
                    <motion.div
                      key={item.label}
                      style={{
                        ...styles.workflowCard,
                        borderColor:
                          item.view === "Entrega"
                            ? "rgba(85,107,47,0.48)"
                            : `${item.color}24`,
                        background:
                          item.view === "Entrega"
                            ? "linear-gradient(145deg, #f3f8ec 0%, #e6efd9 55%, #f7faf2 100%)"
                            : styles.workflowCard.background,
                      }}
                      initial={{ opacity: 0, y: 16 }}
                      animate={
                        item.view === "Entrega"
                          ? {
                            opacity: 1,
                            y: 0,
                            scale: [1, 1.008, 1],
                            borderColor: [
                              "rgba(85,107,47,0.34)",
                              "rgba(85,107,47,0.78)",
                              "rgba(85,107,47,0.34)",
                            ],
                            boxShadow: [
                              "0 14px 34px rgba(85,107,47,0.08)",
                              "0 19px 44px rgba(85,107,47,0.22)",
                              "0 14px 34px rgba(85,107,47,0.08)",
                            ],
                          }
                          : {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                          }
                      }
                      transition={
                        item.view === "Entrega"
                          ? {
                            opacity: {
                              duration: 0.3,
                              delay: index * 0.07,
                            },
                            y: {
                              duration: 0.3,
                              delay: index * 0.07,
                            },
                            scale: {
                              duration: 2.2,
                              repeat: Infinity,
                              repeatDelay: 2.5,
                              ease: "easeInOut",
                            },
                            borderColor: {
                              duration: 2.2,
                              repeat: Infinity,
                              repeatDelay: 2.5,
                              ease: "easeInOut",
                            },
                            boxShadow: {
                              duration: 2.2,
                              repeat: Infinity,
                              repeatDelay: 2.5,
                              ease: "easeInOut",
                            },
                          }
                          : {
                            duration: 0.3,
                            delay: index * 0.07,
                          }
                      }
                      whileHover={{
                        y: -4,
                        boxShadow:
                          item.view === "Entrega"
                            ? "0 22px 48px rgba(85,107,47,0.24)"
                            : "0 20px 42px rgba(0,0,0,0.065)",
                      }}
                    >

                      <div
                        style={{
                          ...styles.workflowCardTop,
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            ...styles.workflowIcon,
                            backgroundColor: item.bg,
                            color: item.color,
                          }}
                        >
                          {item.icon}
                        </div>

                        <div style={styles.workflowSummary}>
                          <div style={styles.workflowLabel}>{item.label}</div>

                          <div style={styles.workflowCountRow}>
                            <span
                              style={{
                                ...styles.workflowCount,
                                color: item.color,
                              }}
                            >
                              {item.cantidad}
                            </span>

                            <span style={styles.workflowDetail}>
                              {item.detail}
                            </span>
                          </div>
                        </div>
                      </div>

                      {item.view === "Entrega" ? (
                        <div style={styles.workflowSearch}>
                          <Search
                            size={16}
                            color="#8b6f47"
                            style={styles.workflowSearchIcon}
                          />

                          <input
                            type="search"
                            value={busquedaFlujoEntrega}
                            onChange={(event) =>
                              setBusquedaFlujoEntrega(event.target.value)
                            }
                            placeholder="Buscar nombre o número de toma..."
                            aria-label="Buscar pedido listo para entregar"
                            style={styles.workflowSearchInput}
                          />
                        </div>
                      ) : null}

                      {item.pedidos.length > 0 ? (
                        <div style={styles.workflowList}>
                          {item.pedidos
                            .slice(
                              0,
                              item.view === "Entrega" &&
                                busquedaFlujoEntrega.trim()
                                ? 5
                                : 3
                            )
                            .map((pedido) => {
                              const tomas = obtenerTomasPedido(pedido);
                              const estado = obtenerEstadoPedido(pedido);

                              const textoEstado =
                                estado.etapa === "PRODUCCION"
                                  ? estado.texto.replace(
                                    "En Producción · falta ",
                                    "Falta: "
                                  )
                                  : estado.texto;

                              let detalleFila = textoEstado;

                              if (item.view === "Entrega") {
                                if (estado.etapa === "ORDEN") {
                                  detalleFila = "Esperando retrato";
                                } else if (estado.etapa === "PRODUCCION") {
                                  detalleFila = textoEstado;
                                } else if (pedido.urgente === true) {
                                  const fechaLlegada = new Date(
                                    pedido.fecha_inicio_urgente ||
                                    pedido.fecha_creacion ||
                                    ""
                                  );

                                  const horaLlegada = Number.isNaN(
                                    fechaLlegada.getTime()
                                  )
                                    ? ""
                                    : fechaLlegada.toLocaleTimeString("es-MX", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    });

                                  detalleFila = horaLlegada
                                    ? `Urgente · llegó ${horaLlegada}`
                                    : "Urgente · listo para entregar";
                                } else if (
                                  pedido.fecha_entrega === todayYMD()
                                ) {
                                  detalleFila = `Hoy · ${pedido.horario_entrega || "sin horario"
                                    }`;
                                } else {
                                  detalleFila = pedido.fecha_entrega
                                    ? `Entrega ${new Date(
                                      `${pedido.fecha_entrega}T00:00:00`
                                    ).toLocaleDateString("es-MX", {
                                      day: "2-digit",
                                      month: "short",
                                    })}`
                                    : "Listo para entregar";
                                }
                              }

                              return (
                                <motion.button
                                  key={pedido.id}
                                  type="button"
                                  onClick={() => abrirPedidoDesdeFlujo(pedido)}
                                  style={{
                                    ...styles.workflowOrder,
                                    backgroundColor:
                                      item.view === "Entrega" &&
                                        estado.etapa !== "ENTREGA"
                                        ? "rgba(234,179,8,0.10)"
                                        : "transparent",
                                    border:
                                      item.view === "Entrega" &&
                                        estado.etapa !== "ENTREGA"
                                        ? "1px solid rgba(202,138,4,0.26)"
                                        : "none",
                                    borderBottom:
                                      item.view === "Entrega" &&
                                        estado.etapa !== "ENTREGA"
                                        ? "1px solid rgba(202,138,4,0.26)"
                                        : "1px solid rgba(139,111,71,0.09)",
                                    boxShadow:
                                      item.view === "Entrega" &&
                                        estado.etapa !== "ENTREGA"
                                        ? "0 7px 18px rgba(202,138,4,0.07)"
                                        : "none",
                                  }}
                                  whileHover={{
                                    x: 3,
                                    backgroundColor:
                                      item.view === "Entrega" &&
                                        estado.etapa !== "ENTREGA"
                                        ? "rgba(234,179,8,0.17)"
                                        : item.bg,
                                  }}
                                  whileTap={{ scale: 0.985 }}
                                >
                                  <div style={styles.workflowOrderText}>
                                    <div style={styles.workflowOrderNameRow}>
                                      <span style={styles.workflowOrderName}>
                                        {pedido.cliente_nombre || "Sin nombre"}
                                      </span>

                                      {item.view === "Entrega" &&
                                        estado.etapa !== "ENTREGA" ? (
                                        <span
                                          style={{
                                            ...styles.workflowUrgentBadge,
                                            backgroundColor:
                                              "rgba(234,179,8,0.16)",
                                            color: "#8a6200",
                                          }}
                                        >
                                          {estado.etapa === "ORDEN"
                                            ? "Esperando retrato"
                                            : "En producción"}
                                        </span>
                                      ) : null}

                                      {pedido.urgente === true ? (
                                        <span style={styles.workflowUrgentBadge}>
                                          Urgente
                                        </span>
                                      ) : null}
                                    </div>

                                    <div style={styles.workflowOrderMeta}>
                                      <span>
                                        {tomas.length
                                          ? `Toma: ${tomas.join(" · ")}`
                                          : "Sin número de toma"}
                                      </span>

                                      <span style={styles.workflowMetaSeparator}>
                                        ·
                                      </span>

                                      <span>{detalleFila}</span>
                                    </div>
                                  </div>

                                  <ArrowUpRight
                                    size={16}
                                    style={{
                                      ...styles.workflowOrderArrow,
                                      color: item.color,
                                    }}
                                  />
                                </motion.button>
                              );
                            })}
                        </div>
                      ) : (
                        <div style={styles.workflowEmpty}>
                          {item.view === "Entrega" &&
                            busquedaFlujoEntrega.trim()
                            ? "No encontramos pedidos con ese nombre o número de toma"
                            : "Todo está al corriente"}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setVistaActiva(item.view)}
                        style={{
                          ...styles.workflowFooter,
                          color: item.color,
                        }}
                      >
                        <span>
                          {item.pedidos.length > 3
                            ? `Ver los ${item.pedidos.length} pedidos`
                            : "Abrir sección"}
                        </span>
                        <ArrowRight size={15} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section style={styles.contentSection}>
                <h2 style={styles.sectionTitle}>Acceso rápido</h2>

                <div style={styles.quickAccessWrap}>
                  <motion.button
                    type="button"
                    onClick={() => setVistaActiva("Busqueda")}
                    style={styles.entregaBtn}
                    whileHover={{
                      y: -5,
                      scale: 1.02,
                      boxShadow: "0 24px 48px rgba(63,82,34,0.3)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={styles.entregaBtnLeft}>
                      <div style={styles.entregaBtnIconBox}>
                        <Search size={24} color="#556b2f" />
                      </div>

                      <div style={styles.entregaBtnTextWrap}>
                        <span style={styles.entregaBtnTitle}>Búsqueda</span>
                        <span style={styles.entregaBtnSubtitle}>
                          Consultar y editar pedidos
                        </span>
                      </div>
                    </div>

                    <ArrowUpRight size={24} style={styles.entregaBtnArrow} />
                  </motion.button>

                  <div style={styles.adminCardsGrid}>
                    {(perfilComp?.admin ? accesosAdmin : []).map(
                      (item, index) => (
                        <motion.button
                          key={item.title}
                          type="button"
                          onClick={() => setVistaActiva(item.view)}
                          style={{
                            ...styles.adminCard,
                            border: `1px solid ${item.color}18`,
                          }}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          whileHover={{
                            y: -6,
                            boxShadow: "0 22px 42px rgba(0,0,0,0.06)",
                          }}
                          whileTap={{ scale: 0.985 }}
                        >
                          <div
                            style={{
                              ...styles.adminCardIconBox,
                              backgroundColor: `${item.color}12`,
                            }}
                          >
                            {React.cloneElement(item.icon, {
                              color: item.color,
                            })}
                          </div>

                          <div style={styles.adminCardBody}>
                            <div style={styles.adminCardTitle}>{item.title}</div>
                            <div style={styles.adminCardSubtitle}>
                              {item.subtitle}
                            </div>
                          </div>

                          {perfilComp?.admin && (
                            <div style={styles.adminCardPill}>
                              <Lock size={12} />
                              <span>Admin</span>
                            </div>
                          )}

                          <ArrowUpRight size={18} style={styles.adminCardArrow} />
                        </motion.button>
                      ))}
                  </div>
                </div>
              </section>

              <motion.button
                type="button"
                onClick={() => setShowRecado(true)}
                style={styles.floatingRecadoBtn}
                whileHover={{ scale: 1.08, y: -3 }}
                whileTap={{ scale: 0.94 }}
              >
                <Plus size={28} />
              </motion.button>
            </motion.div>
          ) : vistaActiva === "Configuracion" ? (
            <ConfiguracionHome
              onBack={() => setVistaActiva("Inicio")}
              onOpen={(view) => setVistaActiva(view)}
            />
          ) : vistaActiva === "Config Precios" ? (
            <ConfigPrecios onBack={() => setVistaActiva("Configuracion")} />
          ) : vistaActiva === "Config Usuarios" ? (
            <ConfigUsuarios onBack={() => setVistaActiva("Configuracion")} />
          ) : vistaActiva === "Config Accesos" ? (
            <ConfigAccesos onBack={() => setVistaActiva("Configuracion")} />
          ) : vistaActiva === "Config Cuentas Transferencia" ? (
            <ConfigCuentasTransferencia
              onBack={() => setVistaActiva("Configuracion")}
            />
          ) : vistaActiva === "Recados" ? (
            <RecadosPanel
              recados={recados}
              onBack={() => setVistaActiva("Inicio")}
              onRefresh={cargarRecados}
            />
          ) : vistaActiva === "Toma Pedidos" ? (
            <Vista1
              perfil={perfilComp}
              setOcultarNavbar={setOcultarNavbar}
              onContinuar={() => setVistaActiva("Cliente")}
              carrito={carrito}
              setCarrito={setCarrito}
            />
          ) : vistaActiva === "Cliente" ? (
            <Vista2
              datosCliente={datosCliente}
              setDatosCliente={setDatosCliente}
              onVolver={() => setVistaActiva("Toma Pedidos")}
              onContinuar={() => setVistaActiva("Vista3")}
              carrito={carrito}
            />
          ) : vistaActiva === "Vista3" ? (
            <Vista3
              datosCliente={datosCliente}
              carrito={carrito}
              onVolver={() => setVistaActiva("Cliente")}
              onConfirmar={confirmarPedido}
              guardando={guardandoPedido}
              descuentoManual={descuentoManual}
              setDescuentoManual={setDescuentoManual}
            />
          ) : vistaActiva === "Vista4" && pedidoCreado ? (
            <Vista4Pago
              pedidoId={pedidoCreado.pedidoId}
              clienteNombre={pedidoCreado.clienteNombre}
              usuarioId={pedidoCreado.usuarioId}
              totalBruto={pedidoCreado.totalBruto}
              descuento={pedidoCreado.descuento}
              totalFinal={pedidoCreado.totalFinal}
              pendiente={pedidoCreado.pendiente}
              onVolver={() => setVistaActiva("Vista3")}
              onFinalizado={finalizarFlujoCompleto}
            />
          ) : vistaActiva === "Orden en Curso" ? (
            <OrdenEnCurso1
              setPedidoSeleccionado={setPedidoSeleccionado}
              setVistaActiva={setVistaActiva}
            />
          ) : vistaActiva === "Orden en Curso Detalle" && pedidoSeleccionado ? (
            <OrdenEnCursoDetalle
              pedidoId={pedidoSeleccionado}
              onBack={() => {
                setVistaActiva("Orden en Curso");
                setPedidoSeleccionado(null);
              }}
            />
          ) : vistaActiva === "Producción" ? (
            <ProduccionLista
              setPedidoSeleccionado={setPedidoSeleccionado}
              setVistaActiva={setVistaActiva}
            />
          ) : vistaActiva === "Producción Detalle" ? (
            pedidoSeleccionado ? (
              <ProduccionDetalle
                pedidoId={pedidoSeleccionado}
                onBack={() => {
                  setVistaActiva("Producción");
                  setPedidoSeleccionado(null);
                }}
              />
            ) : (
              <ProduccionLista
                setPedidoSeleccionado={setPedidoSeleccionado}
                setVistaActiva={setVistaActiva}
              />
            )
          ) : vistaActiva === "Busqueda" ? (
            <BusquedaPedidos />
          ) : vistaActiva === "Editar" ? (
            <EditarPedido perfil={perfilComp} />
          ) : vistaActiva === "Entrega" ? (
            <Entrega
              usuarioId={perfilComp?.id}
              busquedaInicial={busquedaEntregaInicial}
            />
          ) : vistaActiva === "Retiros Caja" ? (
            <RetirosCajaAdmin />
          ) : vistaActiva === "Cuentas" ? (
            <CuentasLista
              onOpenDetalle={(dia) => {
                setDiaCuentaSeleccionado(dia);
                setVistaActiva("Cuentas Detalle");
              }}
            />
          ) : vistaActiva === "Cuentas Detalle" && diaCuentaSeleccionado ? (
            <CuentasDetalle
              dia={diaCuentaSeleccionado}
              onBack={() => {
                setVistaActiva("Cuentas");
                setDiaCuentaSeleccionado(null);
              }}
            />
          ) : (
            <div style={{ paddingTop: "100px", textAlign: "center" }}>
              <h2 style={styles.sectionTitle}>Vista: {vistaActiva}</h2>
              <button onClick={() => setVistaActiva("Inicio")}>Volver</button>
            </div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showRecado ? (
          <motion.div
            style={styles.recadoOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRecado(false)}
          >
            <motion.div
              style={styles.recadoModal}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.recadoModalTop}>
                <div>
                  <h2 style={styles.recadoTitle}>Nuevo recado</h2>
                  <p style={styles.recadoSub}>
                    Deja una indicación visible para el equipo.
                  </p>
                </div>

                <button
                  type="button"
                  style={styles.closeBtn}
                  onClick={() => setShowRecado(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {puedeElegirUsuario ? (
                <select
                  value={usuarioRecado}
                  onChange={(e) => setUsuarioRecado(e.target.value)}
                  style={styles.recadoInput}
                >
                  <option value="">¿Quién deja el recado?</option>
                  {usuariosRecado.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre || "Sin nombre"}
                    </option>
                  ))}
                </select>
              ) : null}

              <select
                value={tipoRecado}
                onChange={(e) => setTipoRecado(e.target.value)}
                style={styles.recadoInput}
              >
                <option value="GENERAL">General</option>
                <option value="URGENTE">Urgente</option>
                <option value="PRODUCCION">Producción</option>
                <option value="ENTREGA">Entrega</option>
              </select>

              <input
                value={nTomaRecado}
                onChange={(e) => setNTomaRecado(e.target.value)}
                placeholder="Número de toma (opcional)"
                style={styles.recadoInput}
              />

              <textarea
                value={mensajeRecado}
                onChange={(e) => setMensajeRecado(e.target.value)}
                placeholder="Ej: La señora Marta viene por las fotos de su hijo..."
                style={styles.recadoTextarea}
              />

              <div style={styles.recadoActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowRecado(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={styles.saveBtn}
                  onClick={crearRecado}
                  disabled={guardandoRecado}
                >
                  <Send size={17} />
                  {guardandoRecado ? "Guardando..." : "Guardar recado"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  dashboardWrapper: {
    minHeight: "100vh",
    backgroundColor: "#fdfbf7",
    fontFamily: "'Montserrat', sans-serif",
  },
  mainContent: {
    paddingTop: "110px",
    paddingLeft: "6%",
    paddingRight: "6%",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: { marginBottom: "34px" },
  headerTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
  },
  dateText: {
    fontSize: "11px",
    letterSpacing: "4px",
    textTransform: "uppercase",
    color: "#b0b0b0",
    fontWeight: 600,
    marginBottom: "15px",
  },
  adminBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(85,107,47,0.08)",
    color: "#556b2f",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid rgba(85,107,47,0.12)",
    marginBottom: "10px",
  },
  welcomeTitle: {
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: 300,
    color: "#1a1a1a",
    margin: 0,
    lineHeight: "1.1",
  },
  highlightName: {
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    color: "#556b2f",
    display: "inline-block",
    marginTop: "5px",
    textShadow: "1px 1px 0px rgba(255,255,255,0.8)",
  },
  carouselSection: { marginBottom: "42px" },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "14px",
  },
  sectionTitle: {
    fontFamily: "'Vidaloka', serif",
    fontSize: "24px",
    fontStyle: "italic",
    color: "#1a1a1a",
    margin: 0,
  },
  refreshMiniBtn: {
    border: "1px solid #ece4d8",
    background: "#fff",
    borderRadius: "999px",
    height: "38px",
    padding: "0 14px",
    color: "#556b2f",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  reminderCard: {
    width: "100%",
    minHeight: "150px",
    borderRadius: "34px",
    border: "1px solid #ece4d8",
    padding: "26px",
    display: "flex",
    alignItems: "center",
    gap: "22px",
    cursor: "pointer",
    boxShadow: "0 16px 36px rgba(0,0,0,0.035)",
    textAlign: "left",
    overflow: "hidden",
  },
  reminderIconBox: {
    width: "72px",
    height: "72px",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reminderBody: { flex: 1, minWidth: 0 },
  reminderLabel: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "12px",
    fontWeight: 900,
    color: "#8b867d",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  reminderTitle: {
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: "clamp(34px, 5vw, 56px)",
    color: "#1a1a1a",
    lineHeight: 1,
  },
  reminderDetail: {
    marginTop: "10px",
    fontSize: "15px",
    color: "#8b867d",
    fontWeight: 600,
    lineHeight: 1.6,
    whiteSpace: "pre-line",
    wordBreak: "break-word",
  },

  workflowSection: {
    marginBottom: "42px",
  },
  workflowGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "18px",
    marginTop: "16px",
    alignItems: "stretch",
  },
  workflowCard: {
    width: "100%",
    minWidth: 0,
    minHeight: "310px",
    borderRadius: "28px",
    border: "1px solid",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(253,251,247,0.92))",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    position: "relative",
    textAlign: "left",
    boxShadow: "0 14px 34px rgba(37,44,28,0.045)",
    overflow: "hidden",
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: "border-box",
  },
  workflowCardTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
    paddingBottom: "17px",
    borderBottom: "1px solid rgba(139,111,71,0.10)",
  },
  workflowIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  workflowSummary: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  workflowLabel: {
    fontSize: "10px",
    fontWeight: 900,
    color: "#8b867d",
    letterSpacing: "1px",
    textTransform: "uppercase",
    lineHeight: 1.35,
  },
  workflowCountRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    minWidth: 0,
    marginTop: "4px",
  },
  workflowCount: {
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: "36px",
    lineHeight: 1,
    flexShrink: 0,
  },
  workflowDetail: {
    minWidth: 0,
    fontSize: "11px",
    fontWeight: 600,
    color: "#8b867d",
    lineHeight: 1.35,
  },

  workflowSearch: {
    width: "100%",
    minHeight: "42px",
    marginTop: "14px",
    padding: "0 13px",
    border: "1px solid rgba(139,111,71,0.16)",
    borderRadius: "14px",
    backgroundColor: "rgba(252,250,245,0.92)",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  workflowSearchIcon: {
    flexShrink: 0,
    opacity: 0.82,
  },
  workflowSearchInput: {
    width: "100%",
    minWidth: 0,
    height: "40px",
    padding: 0,
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    color: "#25231f",
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "11px",
    fontWeight: 700,
  },
  workflowList: {
    display: "flex",
    flexDirection: "column",
    marginTop: "10px",
    flex: 1,
    minWidth: 0,
  },
  workflowOrder: {
    width: "100%",
    minWidth: 0,
    minHeight: "66px",
    padding: "11px 9px",
    border: "none",
    borderBottom: "1px solid rgba(139,111,71,0.09)",
    borderRadius: "12px",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "'Montserrat', sans-serif",
    transition: "background-color 0.2s ease",
    boxSizing: "border-box",
  },
  workflowOrderText: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  workflowOrderNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    minWidth: 0,
  },
  workflowOrderName: {
    minWidth: 0,
    fontSize: "12px",
    fontWeight: 900,
    color: "#25231f",
    lineHeight: 1.25,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  workflowUrgentBadge: {
    padding: "3px 6px",
    borderRadius: "999px",
    backgroundColor: "rgba(190,18,60,0.09)",
    color: "#a41436",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    flexShrink: 0,
  },
  workflowOrderMeta: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "5px",
    color: "#8b867d",
    fontSize: "9.5px",
    fontWeight: 700,
    lineHeight: 1.35,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  workflowMetaSeparator: {
    color: "#c6b992",
    flexShrink: 0,
  },
  workflowOrderArrow: {
    flexShrink: 0,
    opacity: 0.72,
  },
  workflowEmpty: {
    flex: 1,
    minHeight: "130px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    color: "#a39e94",
    fontSize: "11px",
    fontWeight: 700,
    textAlign: "center",
  },
  workflowFooter: {
    width: "100%",
    minHeight: "38px",
    marginTop: "10px",
    padding: "8px 4px 0",
    border: "none",
    borderTop: "1px solid rgba(139,111,71,0.10)",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  workflowArrow: {
    position: "absolute",
    top: "18px",
    right: "18px",
    color: "#c8c0b4",
  },

  carouselDots: {
    marginTop: "14px",
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    border: "none",
    backgroundColor: "#ded6ca",
    cursor: "pointer",
    transition: "all 0.25s ease",
  },
  contentSection: { paddingBottom: "100px" },
  quickAccessWrap: {
    display: "grid",
    gap: "22px",
    marginTop: "22px",
  },
  entregaBtn: {
    width: "100%",
    minHeight: "110px",
    borderRadius: "30px",
    border: "none",
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(63,82,34,0.2)",
  },
  entregaBtnLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  entregaBtnIconBox: {
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    flexShrink: 0,
  },
  entregaBtnTextWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "6px",
  },
  entregaBtnTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "0.4px",
    lineHeight: 1.1,
  },
  entregaBtnSubtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.82)",
    fontWeight: 500,
    lineHeight: 1.4,
  },
  entregaBtnArrow: { color: "#b49d71", flexShrink: 0 },
  adminCardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  adminCard: {
    width: "100%",
    minHeight: "150px",
    background: "#fff",
    borderRadius: "28px",
    padding: "22px",
    cursor: "pointer",
    position: "relative",
    textAlign: "left",
    boxShadow: "0 14px 32px rgba(0,0,0,0.03)",
    overflow: "hidden",
  },
  adminCardIconBox: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "18px",
  },
  adminCardBody: { display: "flex", flexDirection: "column", gap: "6px" },
  adminCardTitle: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#1a1a1a",
    lineHeight: 1.1,
  },
  adminCardSubtitle: {
    fontSize: "14px",
    color: "#8b867d",
    lineHeight: 1.5,
  },
  adminCardPill: {
    position: "absolute",
    right: "20px",
    bottom: "18px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#f7f3eb",
    color: "#6f695f",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid #ece4d8",
  },
  adminCardArrow: {
    position: "absolute",
    top: "20px",
    right: "20px",
    color: "#cdc5ba",
  },
  floatingRecadoBtn: {
    position: "fixed",
    right: 28,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: "22px",
    border: "none",
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 18px 36px rgba(63,82,34,0.30)",
    zIndex: 60,
  },
  configPage: {
    paddingBottom: "100px",
  },
  configHero: {
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    borderRadius: 34,
    padding: 24,
    color: "#fff",
    boxShadow: "0 24px 54px rgba(63,82,34,0.20)",
    marginBottom: 22,
  },
  configHeroTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 22,
  },
  configBackBtn: {
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  configHeroBody: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  configHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.12)",
  },
  configTitle: {
    margin: 0,
    fontFamily: "'Vidaloka', serif",
    fontStyle: "italic",
    fontSize: "clamp(36px, 5vw, 54px)",
    lineHeight: 1,
  },
  configSubtitle: {
    margin: "10px 0 0 0",
    color: "rgba(255,255,255,0.84)",
    fontSize: 15,
    lineHeight: 1.55,
  },
  configGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18,
  },
  configCard: {
    minHeight: 160,
    background: "#fff",
    borderRadius: 28,
    padding: 22,
    cursor: "pointer",
    position: "relative",
    textAlign: "left",
    boxShadow: "0 14px 32px rgba(0,0,0,0.035)",
    overflow: "hidden",
  },
  configCardIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  configCardBody: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  configCardTitle: {
    fontSize: 23,
    fontWeight: 900,
    color: "#1a1a1a",
    lineHeight: 1.1,
  },
  configCardSubtitle: {
    fontSize: 14,
    color: "#8b867d",
    lineHeight: 1.5,
    fontWeight: 600,
  },
  configCardArrow: {
    position: "absolute",
    top: 20,
    right: 20,
    color: "#cdc5ba",
  },
  recadoOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(18,18,18,0.34)",
    backdropFilter: "blur(5px)",
    zIndex: 90,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  recadoModal: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 30,
    padding: 24,
    border: "1px solid #ece4d8",
    boxShadow: "0 28px 70px rgba(0,0,0,0.18)",
  },
  recadoModalTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  recadoTitle: {
    margin: 0,
    fontSize: 28,
    color: "#1a1a1a",
    fontWeight: 900,
  },
  recadoSub: {
    margin: "6px 0 0 0",
    color: "#8b867d",
    fontSize: 14,
    lineHeight: 1.5,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: "1px solid #ece4d8",
    background: "#f7f3eb",
    color: "#1a1a1a",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  recadoInput: {
    width: "100%",
    height: 50,
    borderRadius: 16,
    border: "1px solid #ece4d8",
    background: "#f7f3eb",
    padding: "0 14px",
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 700,
    outline: "none",
    boxSizing: "border-box",
  },
  recadoTextarea: {
    width: "100%",
    minHeight: 130,
    borderRadius: 18,
    border: "1px solid #ece4d8",
    background: "#f7f3eb",
    padding: 14,
    marginBottom: 14,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  recadoActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: 10,
  },
  cancelBtn: {
    height: 50,
    borderRadius: 16,
    border: "1px solid #ece4d8",
    background: "#fff",
    color: "#1a1a1a",
    fontWeight: 800,
    cursor: "pointer",
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #556b2f 0%, #3f5222 100%)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    boxShadow: "0 12px 24px rgba(63,82,34,0.20)",
  },
};

export default Dashboard;
