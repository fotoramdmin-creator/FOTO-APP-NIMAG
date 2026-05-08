import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Award,
  User,
  ChevronDown,
  ShoppingBag,
  ArrowRight,
  Plus,
  X,
  Image as ImageIcon,
  FileText,
  Pencil,
} from "lucide-react";

type Perfil = {
  id?: string;
  nombre?: string;
  email?: string;
  puede_elegir_usuario?: boolean;
};

type UsuarioRow = {
  id: string;
  nombre: string;
  email?: string;
  activo?: boolean;
  puede_elegir_usuario?: boolean;
};

type CatalogoItem = {
  id: string;
  tamano: string;
  cantidad: number;
  tipo: string;
  papel: string;
  precio_base: number;
  aumento_urgente: number;
  aumento_kenfor: number;
  activo: boolean;
};

type SeleccionType = {
  usuarioId: string;
  usuarioNombre: string;
  tamano: string;
  cantidad: number;
  tipo: string;
  papel: string;
  esUrgente: boolean;
  esKenfor: boolean;
  especificaciones: string;
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
  bg: "#FAF7F0",
  bg2: "#F4EDE2",
  card: "rgba(255, 255, 252, 0.97)",
  cardSoft: "#FFFEFA",
  text: "#1c1a15",
  textSoft: "#747169",
  olive: "#2e4d38",
  olive2: "#3e634d",
  olive3: "#557463",
  gold: "#b89f54",
  gold2: "#d6bd7c",
  goldLight: "#fcf8eb",
  border: "rgba(225, 210, 175, 0.65)",
  line: "rgba(245, 235, 210, 0.85)",
  shadow: "0 24px 60px rgba(50, 42, 32, 0.12)",
  shadowStrong: "0 40px 90px rgba(34, 42, 30, 0.25)",
};

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n || 0);

const initialSeleccion = (perfil?: Perfil): SeleccionType => ({
  usuarioId: perfil?.id || "",
  usuarioNombre: perfil?.nombre || "",
  tamano: "",
  cantidad: 0,
  tipo: "",
  papel: "",
  esUrgente: false,
  esKenfor: false,
  especificaciones: "",
});

const Vista1 = ({
  perfil,
  setOcultarNavbar,
  onContinuar,
  carrito,
  setCarrito,
}: {
  perfil: Perfil;
  setOcultarNavbar: (valor: boolean) => void;
  onContinuar: () => void;
  carrito: ItemCarrito[];
  setCarrito: React.Dispatch<React.SetStateAction<ItemCarrito[]>>;
}) => {
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarTamanos, setMostrarTamanos] = useState(false);
  const [mostrarConfirmCerrar, setMostrarConfirmCerrar] = useState(false);
  const [mostrarConfirmEliminar, setMostrarConfirmEliminar] = useState(false);

  const [idAEliminar, setIdAEliminar] = useState<number | string | null>(null);
  const [precioFinal, setPrecioFinal] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [editandoId, setEditandoId] = useState<number | string | null>(null);

  const [seleccion, setSeleccion] = useState<SeleccionType>(
    initialSeleccion(perfil)
  );

  const puedeElegirUsuario = Boolean(perfil?.puede_elegir_usuario);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setSeleccion((prev) => ({
      ...prev,
      usuarioId: perfil?.id || prev.usuarioId || "",
      usuarioNombre: perfil?.nombre || prev.usuarioNombre || "",
    }));
  }, [perfil]);

  useEffect(() => {
    return () => {
      setOcultarNavbar(false);
    };
  }, [setOcultarNavbar]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: cat } = await supabase
          .from("catalogo_precios")
          .select("*")
          .eq("activo", true);

        const { data: usr } = await supabase
          .from("usuarios")
          .select("id, nombre, activo, puede_elegir_usuario")
          .eq("activo", true);

        const usuariosFiltrados = (usr || []).filter(
          (u: any) => !u.puede_elegir_usuario
        );

        setCatalogo(cat || []);
        setUsuarios(usuariosFiltrados || []);
      } catch (err) {
        console.error("Error al cargar datos", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tamanosUnicos = useMemo(() => {
    return Array.from(new Set(catalogo.map((i) => i.tamano))).sort();
  }, [catalogo]);

  const cantidadesDisponibles = useMemo(() => {
    if (!seleccion.tamano) return [];
    return Array.from(
      new Set(
        catalogo
          .filter((i) => i.tamano === seleccion.tamano)
          .map((i) => i.cantidad)
      )
    ).sort((a, b) => a - b);
  }, [catalogo, seleccion.tamano]);

  const tiposDisponibles = useMemo(() => {
    if (!seleccion.tamano || !seleccion.cantidad) return [];
    const lista = catalogo
      .filter(
        (i) =>
          i.tamano === seleccion.tamano &&
          i.cantidad === seleccion.cantidad &&
          i.tipo
      )
      .map((i) => i.tipo);

    const unicos = Array.from(new Set(lista.filter(Boolean)));
    return unicos.length > 0 ? unicos.sort() : ["BYN", "COLOR"];
  }, [catalogo, seleccion.tamano, seleccion.cantidad]);

  const papelesDisponibles = useMemo(() => {
    if (!seleccion.tamano || !seleccion.cantidad) return [];

    let base = catalogo.filter(
      (i) => i.tamano === seleccion.tamano && i.cantidad === seleccion.cantidad
    );

    if (seleccion.tipo) {
      const filtradoTipo = base.filter((i) => i.tipo === seleccion.tipo);
      if (filtradoTipo.length > 0) base = filtradoTipo;
    }

    const lista = base.map((i) => i.papel).filter(Boolean);
    const unicos = Array.from(new Set(lista));
    return unicos.sort();
  }, [catalogo, seleccion.tamano, seleccion.cantidad, seleccion.tipo]);

  useEffect(() => {
    if (seleccion.cantidad > 0) {
      const existeCantidad =
        cantidadesDisponibles.indexOf(seleccion.cantidad) !== -1;

      if (!existeCantidad) {
        setSeleccion((prev) => ({
          ...prev,
          cantidad: 0,
          tipo: "",
          papel: "",
        }));
      }
    }
  }, [cantidadesDisponibles, seleccion.cantidad]);

  useEffect(() => {
    if (seleccion.tipo && tiposDisponibles.indexOf(seleccion.tipo) === -1) {
      setSeleccion((prev) => ({
        ...prev,
        tipo: "",
        papel: "",
      }));
    }
  }, [tiposDisponibles, seleccion.tipo]);

  useEffect(() => {
    if (seleccion.papel && papelesDisponibles.indexOf(seleccion.papel) === -1) {
      setSeleccion((prev) => ({
        ...prev,
        papel: "",
      }));
    }
  }, [papelesDisponibles, seleccion.papel]);

  useEffect(() => {
    if (!seleccion.tamano || !seleccion.cantidad) {
      setPrecioFinal(0);
      return;
    }

    let candidatos = catalogo.filter(
      (i) => i.tamano === seleccion.tamano && i.cantidad === seleccion.cantidad
    );

    if (seleccion.tipo) {
      const filtradoTipo = candidatos.filter((i) => i.tipo === seleccion.tipo);
      if (filtradoTipo.length > 0) candidatos = filtradoTipo;
    }

    if (seleccion.papel) {
      const filtradoPapel = candidatos.filter(
        (i) => i.papel === seleccion.papel
      );
      if (filtradoPapel.length > 0) candidatos = filtradoPapel;
    }

    const item = candidatos[0];

    if (item) {
      let total = item.precio_base;
      if (seleccion.esUrgente) total += item.aumento_urgente;
      if (seleccion.esKenfor) total += item.aumento_kenfor;
      setPrecioFinal(total);
    } else {
      setPrecioFinal(0);
    }
  }, [seleccion, catalogo]);

  const requiereTipo = tiposDisponibles.length > 0;
  const requierePapel = papelesDisponibles.length > 0;

  const formularioValido =
    Boolean(seleccion.usuarioId) &&
    Boolean(seleccion.tamano) &&
    seleccion.cantidad > 0 &&
    (!requiereTipo || Boolean(seleccion.tipo)) &&
    (!requierePapel || Boolean(seleccion.papel));

  const subtotalCarrito = carrito.reduce(
    (acc, item) => acc + (item.total || 0),
    0
  );

  const hayCambiosSinGuardar =
    Boolean(seleccion.tamano) ||
    seleccion.cantidad > 0 ||
    Boolean(seleccion.tipo) ||
    Boolean(seleccion.papel) ||
    seleccion.esUrgente ||
    seleccion.esKenfor ||
    Boolean(seleccion.especificaciones);

  const abrirFormulario = () => {
    setEditandoId(null);
    setSeleccion((prev) => ({
      ...prev,
      usuarioId: prev.usuarioId || perfil?.id || "",
      usuarioNombre: prev.usuarioNombre || perfil?.nombre || "",
      tamano: "",
      cantidad: 0,
      tipo: "",
      papel: "",
      esUrgente: false,
      esKenfor: false,
      especificaciones: "",
    }));
    setMostrarTamanos(false);
    setMostrarConfirmCerrar(false);
    setMostrarFormulario(true);
    setOcultarNavbar(true);
  };

  const cerrarFormularioDirecto = () => {
    setMostrarFormulario(false);
    setMostrarTamanos(false);
    setMostrarConfirmCerrar(false);
    setOcultarNavbar(false);
    setEditandoId(null);
    setSeleccion((prev) => ({
      ...prev,
      tamano: "",
      cantidad: 0,
      tipo: "",
      papel: "",
      esUrgente: false,
      esKenfor: false,
      especificaciones: "",
    }));
    setPrecioFinal(0);
  };

  const intentarCerrarFormulario = () => {
    if (hayCambiosSinGuardar) {
      setMostrarConfirmCerrar(true);
      return;
    }
    cerrarFormularioDirecto();
  };

  const agregarAlCarrito = () => {
    if (!formularioValido) return;

    if (editandoId !== null) {
      setCarrito((prev) =>
        prev.map((item) =>
          item.id === editandoId
            ? { ...item, ...seleccion, total: precioFinal }
            : item
        )
      );
    } else {
      setCarrito((prev) => [
        ...prev,
        { ...seleccion, total: precioFinal, id: Date.now() },
      ]);
    }

    setSeleccion((prev) => ({
      ...prev,
      tamano: "",
      cantidad: 0,
      tipo: "",
      papel: "",
      esUrgente: false,
      esKenfor: false,
      especificaciones: "",
    }));
    setPrecioFinal(0);
    setMostrarTamanos(false);
    setMostrarFormulario(false);
    setMostrarConfirmCerrar(false);
    setOcultarNavbar(false);
    setEditandoId(null);
  };

  const editarRenglon = (item: ItemCarrito) => {
    setEditandoId(item.id);
    setSeleccion({
      usuarioId: item.usuarioId || "",
      usuarioNombre: item.usuarioNombre || "",
      tamano: item.tamano,
      cantidad: item.cantidad,
      tipo: item.tipo || "",
      papel: item.papel || "",
      esUrgente: Boolean(item.esUrgente),
      esKenfor: Boolean(item.esKenfor),
      especificaciones: item.especificaciones || "",
    });
    setMostrarTamanos(false);
    setMostrarConfirmCerrar(false);
    setMostrarFormulario(true);
    setOcultarNavbar(true);
  };

  const confirmarEliminar = (id: number | string) => {
    setIdAEliminar(id);
    setMostrarConfirmEliminar(true);
  };

  const eliminarRenglon = () => {
    if (idAEliminar === null) return;

    setCarrito((prev) => prev.filter((item) => item.id !== idAEliminar));

    if (editandoId === idAEliminar) {
      cerrarFormularioDirecto();
    }

    setMostrarConfirmEliminar(false);
    setIdAEliminar(null);
  };

  if (loading) {
    return (
      <div
        style={{
          ...styles.page,
          padding: "80px 20px",
          textAlign: "center",
          color: THEME.textSoft,
        }}
      >
        Cargando catálogo...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowTop} />

      <div style={styles.container}>
        <header style={styles.headerWrap}>
          <div>
            <div style={styles.kicker}>FOTO ESTUDIO RAMÍREZ</div>
            <h2 style={styles.title}>Nuevo Pedido</h2>
            <p style={styles.subtitle}>
              Captura renglones sin saturar la pantalla
            </p>
            <div style={styles.titleUnderline} />
          </div>

          <div style={styles.carritoBadge}>
            <div style={styles.cartIconCircle}>
              <ShoppingBag size={16} color="#fff" />
            </div>
            <span>{carrito.length} items</span>
          </div>
        </header>

        {puedeElegirUsuario && (
          <section style={styles.sectionCard}>
            <div style={styles.sectionHead}>
              <span style={styles.stepNumber}>01</span>
              <div style={styles.sectionLabel}>CAPTURISTA</div>
            </div>

            <button
              onClick={() => setMostrarUsuarios(!mostrarUsuarios)}
              style={styles.selectorUsuario}
              type="button"
            >
              <div style={styles.selectorUsuarioLeft}>
                <div style={styles.iconMiniWrap}>
                  <User size={18} color={THEME.gold} />
                </div>
                <span style={styles.selectorUsuarioText}>
                  {seleccion.usuarioNombre || "Seleccionar capturista"}
                </span>
              </div>
              <ChevronDown size={20} color={THEME.textSoft} />
            </button>

            <AnimatePresence>
              {mostrarUsuarios && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={styles.gridUsuarios}>
                    {usuarios.map((u) => (
                      <motion.button
                        key={u.id}
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => {
                          setSeleccion((prev) => ({
                            ...prev,
                            usuarioId: u.id,
                            usuarioNombre: u.nombre,
                          }));
                          setMostrarUsuarios(false);
                        }}
                        style={{
                          ...styles.userCard,
                          backgroundColor:
                            seleccion.usuarioId === u.id
                              ? THEME.olive
                              : THEME.card,
                          color:
                            seleccion.usuarioId === u.id ? "#fff" : THEME.text,
                          borderColor:
                            seleccion.usuarioId === u.id
                              ? THEME.olive
                              : THEME.border,
                        }}
                      >
                        {u.nombre}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {!puedeElegirUsuario && (
          <section style={styles.sectionCard}>
            <div style={styles.sectionHead}>
              <span style={styles.stepNumber}>01</span>
              <div style={styles.sectionLabel}>CAPTURISTA</div>
            </div>

            <div style={styles.userFixedCard}>
              <div style={styles.iconMiniWrap}>
                <User size={18} color={THEME.gold} />
              </div>
              <span style={styles.userFixedText}>
                {seleccion.usuarioNombre || "Usuario activo"}
              </span>
            </div>
          </section>
        )}

        <section style={styles.sectionCard}>
          <div style={styles.addRowTop}>
            <div>
              <div style={styles.sectionLabel}>RENGLONES DEL PEDIDO</div>
              <div style={styles.sectionHint}>
                Agrega uno por uno con un formulario limpio
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={abrirFormulario}
              style={{
                ...styles.addRowBtn,
                background: `linear-gradient(135deg, ${THEME.gold}, ${THEME.gold2})`,
                color: "#fff",
              }}
            >
              <Plus size={20} />
              Agregar renglón
            </motion.button>
          </div>
        </section>

        {carrito.length > 0 && (
          <section style={styles.sectionCard}>
            <div style={styles.sectionHead}>
              <span style={styles.stepNumber}>02</span>
              <div style={styles.sectionLabel}>RESUMEN</div>
            </div>

            <div style={styles.resumeList}>
              {carrito.map((item, idx) => (
                <motion.div
                  key={item.id}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                  }}
                  style={{
                    ...styles.resumeRow,
                    ...(isMobile ? styles.resumeRowMobile : {}),
                  }}
                >
                  <div
                    style={{
                      ...styles.resumeLeft,
                      ...(isMobile ? styles.resumeLeftMobile : {}),
                    }}
                  >
                    <div style={styles.resumeIndex}>{idx + 1}</div>

                    <div
                      style={{
                        ...styles.resumeContent,
                        ...(isMobile ? styles.resumeContentMobile : {}),
                      }}
                    >
                      <div
                        style={{
                          ...styles.resumeTitle,
                          ...(isMobile ? styles.resumeTitleMobile : {}),
                        }}
                      >
                        {item.cantidad} {item.tamano}
                        {item.tipo ? ` · ${item.tipo}` : ""}
                      </div>

                      <div
                        style={{
                          ...styles.resumeMeta,
                          ...(isMobile ? styles.resumeMetaMobile : {}),
                        }}
                      >
                        {item.papel ? `${item.papel} · ` : ""}
                        {item.esUrgente ? "Urgente · " : ""}
                        {item.esKenfor ? "Kenfor · " : ""}
                        {item.especificaciones || "Sin especificaciones"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.resumeRight,
                      ...(isMobile ? styles.resumeRightMobile : {}),
                    }}
                  >
                    <div
                      style={{
                        ...styles.resumePrice,
                        ...(isMobile ? styles.resumePriceMobile : {}),
                      }}
                    >
                      {money(item.total || 0)}
                    </div>

                    <div
                      style={{
                        ...styles.resumeActions,
                        ...(isMobile ? styles.resumeActionsMobile : {}),
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => editarRenglon(item)}
                        style={styles.actionBtnEdit}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => confirmarEliminar(item.id)}
                        style={styles.actionBtnDelete}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={styles.resumeFooter}>
              <span style={styles.resumeFooterLabel}>Subtotal actual</span>
              <span style={styles.resumeFooterValue}>
                {money(subtotalCarrito)}
              </span>
            </div>

            <div style={styles.continuarWrap}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinuar}
                style={styles.continuarBtn}
              >
                Continuar
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </section>
        )}

        <AnimatePresence>
          {mostrarFormulario && (
            <motion.div
              style={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={intentarCerrarFormulario}
            >
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring", damping: 25 }}
                style={{
                  ...styles.modalCard,
                  ...(isMobile
                    ? styles.modalCardMobile
                    : styles.modalCardDesktop),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={styles.modalHeader}>
                  <div>
                    <div style={styles.modalKicker}>
                      {editandoId !== null ? "EDITAR RENGLÓN" : "NUEVO RENGLÓN"}
                    </div>
                    <h3 style={styles.modalTitle}>Captura del renglón</h3>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={intentarCerrarFormulario}
                    style={{
                      ...styles.closeBtn,
                      background: THEME.card,
                      border: `1px solid ${THEME.gold}`,
                      color: THEME.gold,
                    }}
                  >
                    <X size={22} />
                  </motion.button>
                </div>

                <div style={styles.modalBody}>
                  <div style={styles.innerBlock}>
                    <div style={styles.innerLabel}>Tamaño</div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setMostrarTamanos(!mostrarTamanos)}
                      style={styles.selectorField}
                    >
                      <span
                        style={{
                          ...styles.selectorFieldText,
                          color: seleccion.tamano ? THEME.text : THEME.textSoft,
                        }}
                      >
                        {seleccion.tamano || "Seleccionar tamaño"}
                      </span>
                      <ChevronDown size={20} color={THEME.gold} />
                    </motion.button>

                    <AnimatePresence>
                      {mostrarTamanos && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={styles.selectorOptionsWrap}>
                            <div style={styles.selectorOptionsGrid}>
                              {tamanosUnicos.map((t) => {
                                const activo = seleccion.tamano === t;

                                return (
                                  <motion.button
                                    key={t}
                                    whileHover={{ scale: 1.06, y: -4 }}
                                    whileTap={{ scale: 0.96 }}
                                    type="button"
                                    onClick={() => {
                                      setSeleccion((prev) => ({
                                        ...prev,
                                        tamano: t,
                                        cantidad: 0,
                                        tipo: "",
                                        papel: "",
                                      }));
                                      setMostrarTamanos(false);
                                    }}
                                    style={{
                                      ...styles.selectorOptionBtn,
                                      backgroundColor: activo
                                        ? THEME.goldLight
                                        : THEME.card,
                                      borderColor: activo
                                        ? THEME.gold
                                        : THEME.border,
                                      color: activo ? THEME.olive : THEME.text,
                                      boxShadow: activo
                                        ? "0 12px 32px rgba(176,141,62,0.25)"
                                        : "0 6px 16px rgba(0,0,0,0.06)",
                                    }}
                                  >
                                    {t}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {seleccion.tamano && (
                    <div style={styles.innerBlock}>
                      <div style={styles.innerLabel}>Cantidad</div>
                      <div style={styles.chipsWrap}>
                        {cantidadesDisponibles.map((c) => (
                          <motion.button
                            key={c}
                            whileHover={{ scale: 1.06, y: -3 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={() =>
                              setSeleccion((prev) => ({
                                ...prev,
                                cantidad: c,
                                tipo: "",
                                papel: "",
                              }))
                            }
                            style={{
                              ...styles.chipBtn,
                              backgroundColor:
                                seleccion.cantidad === c
                                  ? THEME.olive
                                  : THEME.card,
                              color:
                                seleccion.cantidad === c ? "#fff" : THEME.text,
                              borderColor:
                                seleccion.cantidad === c
                                  ? THEME.olive
                                  : THEME.border,
                              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                            }}
                          >
                            {c} pzas
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {seleccion.tamano && seleccion.cantidad > 0 && (
                    <div style={styles.innerBlock}>
                      <div style={styles.innerLabel}>Tipo</div>
                      <div style={styles.chipsWrap}>
                        {tiposDisponibles.map((tipo) => (
                          <motion.button
                            key={tipo}
                            whileHover={{ scale: 1.06, y: -3 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={() =>
                              setSeleccion((prev) => ({
                                ...prev,
                                tipo,
                                papel: "",
                              }))
                            }
                            style={{
                              ...styles.optionBtn,
                              backgroundColor:
                                seleccion.tipo === tipo
                                  ? THEME.olive
                                  : THEME.card,
                              color:
                                seleccion.tipo === tipo ? "#fff" : THEME.text,
                              borderColor:
                                seleccion.tipo === tipo
                                  ? THEME.olive
                                  : THEME.border,
                              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                            }}
                          >
                            <ImageIcon size={18} />
                            {tipo}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {seleccion.tamano &&
                    seleccion.cantidad > 0 &&
                    papelesDisponibles.length > 0 && (
                      <div style={styles.innerBlock}>
                        <div style={styles.innerLabel}>Papel</div>
                        <div style={styles.chipsWrap}>
                          {papelesDisponibles.map((papel) => (
                            <motion.button
                              key={papel}
                              whileHover={{ scale: 1.06, y: -3 }}
                              whileTap={{ scale: 0.96 }}
                              type="button"
                              onClick={() =>
                                setSeleccion((prev) => ({
                                  ...prev,
                                  papel,
                                }))
                              }
                              style={{
                                ...styles.optionBtn,
                                backgroundColor:
                                  seleccion.papel === papel
                                    ? THEME.olive
                                    : THEME.card,
                                color:
                                  seleccion.papel === papel
                                    ? "#fff"
                                    : THEME.text,
                                borderColor:
                                  seleccion.papel === papel
                                    ? THEME.olive
                                    : THEME.border,
                                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                              }}
                            >
                              <FileText size={18} />
                              {papel}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                  <div style={styles.innerBlock}>
                    <div style={styles.innerLabel}>Adicionales</div>
                    <div style={styles.chipsWrap}>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() =>
                          setSeleccion((p) => ({
                            ...p,
                            esUrgente: !p.esUrgente,
                          }))
                        }
                        style={{
                          ...styles.extraToggleHorizontal,
                          borderColor: seleccion.esUrgente
                            ? THEME.gold
                            : THEME.border,
                          backgroundColor: seleccion.esUrgente
                            ? THEME.goldLight
                            : THEME.cardSoft,
                          boxShadow: seleccion.esUrgente
                            ? "0 10px 28px rgba(184,159,84,0.3)"
                            : "none",
                        }}
                      >
                        <Zap size={18} />
                        Urgente
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() =>
                          setSeleccion((p) => ({
                            ...p,
                            esKenfor: !p.esKenfor,
                          }))
                        }
                        style={{
                          ...styles.extraToggleHorizontal,
                          borderColor: seleccion.esKenfor
                            ? THEME.olive2
                            : THEME.border,
                          backgroundColor: seleccion.esKenfor
                            ? "#e8f1e6"
                            : THEME.cardSoft,
                          boxShadow: seleccion.esKenfor
                            ? "0 10px 28px rgba(46,99,77,0.25)"
                            : "none",
                        }}
                      >
                        <Award size={18} />
                        Kenfor
                      </motion.button>
                    </div>
                  </div>

                  <div style={styles.innerBlock}>
                    <div style={styles.innerLabel}>Especificaciones</div>
                    <textarea
                      style={{
                        ...styles.textarea,
                        border: `1px solid ${THEME.border}`,
                        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)",
                      }}
                      placeholder="Instrucciones especiales, acabados, detalles..."
                      value={seleccion.especificaciones}
                      onChange={(e) =>
                        setSeleccion((prev) => ({
                          ...prev,
                          especificaciones: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div style={styles.modalFooterGreen}>
                  <div>
                    <div style={styles.priceLabelGreen}>TOTAL DEL RENGLÓN</div>
                    <motion.div
                      animate={{ scale: precioFinal > 0 ? [1, 1.06, 1] : 1 }}
                      transition={{
                        duration: 1.8,
                        repeat: precioFinal > 0 ? Infinity : 0,
                      }}
                      style={styles.priceValueGreen}
                    >
                      {money(precioFinal)}
                    </motion.div>
                  </div>

                  <motion.button
                    type="button"
                    disabled={!formularioValido}
                    whileHover={formularioValido ? { scale: 1.08 } : {}}
                    whileTap={{ scale: 0.94 }}
                    onClick={agregarAlCarrito}
                    style={{
                      ...styles.mainActionBtnGreen,
                      opacity: formularioValido ? 1 : 0.6,
                      boxShadow: formularioValido
                        ? "0 12px 32px rgba(176,141,62,0.35)"
                        : "none",
                    }}
                  >
                    {editandoId !== null ? "Actualizar" : "Añadir"}
                    <ArrowRight size={20} />
                  </motion.button>
                </div>
              </motion.div>

              <AnimatePresence>
                {mostrarConfirmCerrar && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.25 }}
                    style={styles.confirmCard}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={styles.confirmTitle}>
                      ¿Quieres cerrar sin guardar cambios?
                    </div>

                    <div style={styles.confirmText}>
                      Se perderá la información capturada en este renglón.
                    </div>

                    <div style={styles.confirmActions}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => setMostrarConfirmCerrar(false)}
                        style={styles.confirmSecondaryBtn}
                      >
                        Cancelar
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={cerrarFormularioDirecto}
                        style={styles.confirmPrimaryBtn}
                      >
                        Cerrar sin guardar
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {mostrarConfirmEliminar && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.25 }}
                    style={styles.confirmCard}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={styles.confirmTitle}>
                      ¿Eliminar este renglón?
                    </div>

                    <div style={styles.confirmText}>
                      Esta acción no se puede deshacer.
                    </div>

                    <div style={styles.confirmActions}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => setMostrarConfirmEliminar(false)}
                        style={styles.confirmSecondaryBtn}
                      >
                        Cancelar
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={eliminarRenglon}
                        style={{
                          ...styles.confirmPrimaryBtn,
                          backgroundColor: "#c62828",
                        }}
                      >
                        Eliminar
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #E9DFC9 0%, #ECE4D6 45%, #F3EBDC 100%)",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
  },
  bgGlowTop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "220px",
    background:
      "radial-gradient(circle at top center, rgba(176,141,62,0.22), transparent 65%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "clamp(48px, 8vw, 80px) 24px 180px",
    position: "relative",
    zIndex: 1,
  },
  headerWrap: {
    marginBottom: "clamp(40px, 6vw, 60px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: "11px",
    fontWeight: 900,
    color: THEME.gold,
    letterSpacing: "5px",
    marginBottom: "10px",
  },
  title: {
    fontSize: "clamp(40px, 9vw, 52px)",
    fontWeight: 800,
    margin: 0,
    color: THEME.text,
    lineHeight: 1,
    letterSpacing: "-1.2px",
  },
  subtitle: {
    margin: "12px 0 0",
    fontSize: "15.5px",
    color: THEME.textSoft,
    fontWeight: 500,
  },
  titleUnderline: {
    width: "72px",
    height: "5px",
    background: "linear-gradient(90deg, #B08D3E 0%, #D6B36A 100%)",
    marginTop: "14px",
    borderRadius: "999px",
  },
  carritoBadge: {
    backgroundColor: THEME.card,
    padding: "10px 18px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    fontWeight: 800,
    boxShadow: THEME.shadow,
    border: `1px solid ${THEME.line}`,
  },
  cartIconCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: THEME.olive,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCard: {
    backgroundColor: THEME.card,
    borderRadius: "30px",
    padding: "28px",
    marginBottom: "24px",
    boxShadow: THEME.shadow,
    border: `1px solid ${THEME.line}`,
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
  },
  stepNumber: {
    fontSize: "14px",
    fontWeight: 900,
    color: THEME.gold,
    opacity: 0.75,
  },
  sectionLabel: {
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "1.8px",
    color: THEME.textSoft,
  },
  sectionHint: {
    fontSize: "14px",
    color: THEME.textSoft,
    fontWeight: 500,
    marginTop: "8px",
  },
  addRowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  addRowBtn: {
    border: "none",
    padding: "16px 24px",
    borderRadius: "20px",
    fontSize: "15px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(0,0,0,0.1)",
  },
  selectorUsuario: {
    width: "100%",
    padding: "18px 22px",
    borderRadius: "20px",
    border: `1px solid ${THEME.border}`,
    backgroundColor: THEME.card,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  selectorUsuarioLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  selectorUsuarioText: {
    fontSize: "15px",
    fontWeight: 700,
    color: THEME.text,
  },
  iconMiniWrap: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: THEME.goldLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userFixedCard: {
    width: "100%",
    padding: "18px 22px",
    borderRadius: "20px",
    border: `1px solid ${THEME.border}`,
    backgroundColor: THEME.card,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userFixedText: {
    fontSize: "15px",
    fontWeight: 700,
    color: THEME.text,
  },
  gridUsuarios: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
    paddingTop: "18px",
  },
  userCard: {
    padding: "14px",
    borderRadius: "16px",
    border: `1px solid ${THEME.border}`,
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  resumeList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  resumeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px 0",
    borderBottom: `1px solid ${THEME.line}`,
  },
  resumeLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
    flex: 1,
  },
  resumeContent: {
    minWidth: 0,
  },
  resumeIndex: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: THEME.goldLight,
    color: THEME.gold,
    fontSize: "13px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resumeTitle: {
    fontSize: "15px",
    fontWeight: 800,
    color: THEME.text,
  },
  resumeMeta: {
    fontSize: "13px",
    color: THEME.textSoft,
    marginTop: "6px",
  },
  resumeRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  resumeActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  actionBtnEdit: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#2e7d32",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(46,125,50,0.3)",
  },
  actionBtnDelete: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#c62828",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(198,40,40,0.3)",
  },
  resumePrice: {
    fontSize: "15px",
    fontWeight: 800,
    color: THEME.olive,
    whiteSpace: "nowrap",
  },
  resumeRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: "14px",
  },
  resumeLeftMobile: {
    width: "100%",
    alignItems: "flex-start",
  },
  resumeContentMobile: {
    minWidth: 0,
    flex: 1,
  },
  resumeTitleMobile: {
    lineHeight: 1.2,
    wordBreak: "break-word",
  },
  resumeMetaMobile: {
    lineHeight: 1.35,
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  resumeRightMobile: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: "48px",
    boxSizing: "border-box",
  },
  resumePriceMobile: {
    fontSize: "18px",
    lineHeight: 1,
  },
  resumeActionsMobile: {
    gap: "10px",
  },
  resumeFooter: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: `1px solid ${THEME.line}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumeFooterLabel: {
    fontSize: "14px",
    color: THEME.textSoft,
    fontWeight: 700,
  },
  resumeFooterValue: {
    fontSize: "22px",
    color: THEME.text,
    fontWeight: 900,
  },
  continuarWrap: {
    marginTop: "22px",
    display: "flex",
    justifyContent: "flex-end",
  },
  continuarBtn: {
    border: "none",
    background: "linear-gradient(135deg, #D1A84F 0%, #B08D3E 100%)",
    color: "#fff",
    padding: "16px 24px",
    borderRadius: "18px",
    fontSize: "15px",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(176,141,62,0.28)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(30, 28, 24, 0.5)",
    backdropFilter: "blur(8px)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modalCard: {
    backgroundColor: THEME.card,
    border: `1px solid ${THEME.line}`,
    boxShadow: THEME.shadowStrong,
    borderRadius: "32px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  modalCardMobile: {
    width: "100%",
    height: "calc(100vh - 40px)",
    maxHeight: "calc(100vh - 40px)",
  },
  modalCardDesktop: {
    width: "100%",
    maxWidth: "880px",
    maxHeight: "90vh",
  },
  modalHeader: {
    padding: "26px 28px 20px",
    borderBottom: `1px solid ${THEME.line}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    position: "sticky",
    top: 0,
    backgroundColor: THEME.card,
    zIndex: 30,
  },
  modalKicker: {
    fontSize: "11px",
    fontWeight: 900,
    color: THEME.gold,
    letterSpacing: "3px",
    marginBottom: "10px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.1,
    color: THEME.text,
    fontWeight: 800,
  },
  closeBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    border: `1px solid ${THEME.border}`,
    backgroundColor: THEME.card,
    color: THEME.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
  },
  modalBody: {
    padding: "24px 28px",
    overflowY: "auto",
  },
  modalFooterGreen: {
    padding: "20px 28px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    background: "linear-gradient(135deg, #2F4A34 0%, #3F5F46 100%)",
    boxShadow: "inset 0 2px 0 rgba(255,255,255,0.08)",
  },
  innerBlock: {
    marginBottom: "28px",
  },
  innerLabel: {
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "1.8px",
    color: THEME.gold,
    marginBottom: "16px",
    textTransform: "uppercase",
  },
  selectorField: {
    width: "100%",
    minHeight: "60px",
    borderRadius: "18px",
    border: `1px solid ${THEME.border}`,
    backgroundColor: THEME.card,
    padding: "0 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  selectorFieldText: {
    fontSize: "15px",
    fontWeight: 700,
  },
  selectorOptionsWrap: {
    marginTop: "12px",
  },
  selectorOptionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px",
  },
  selectorOptionBtn: {
    minHeight: "50px",
    borderRadius: "16px",
    border: `1px solid ${THEME.border}`,
    backgroundColor: THEME.card,
    padding: "0 16px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  chipsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  chipBtn: {
    padding: "14px 22px",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    border: "none",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },
  optionBtn: {
    padding: "14px 20px",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    border: `1px solid ${THEME.border}`,
    backgroundColor: THEME.card,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },
  extraToggleHorizontal: {
    padding: "14px 20px",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    border: `1px solid ${THEME.border}`,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  textarea: {
    width: "100%",
    border: "none",
    backgroundColor: THEME.cardSoft,
    borderRadius: "18px",
    padding: "18px",
    fontSize: "15px",
    minHeight: "120px",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  priceLabelGreen: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.75)",
    fontWeight: 800,
    letterSpacing: "1.6px",
  },
  priceValueGreen: {
    fontSize: "clamp(32px, 8vw, 44px)",
    color: "#fff",
    fontWeight: 900,
    marginTop: "6px",
    letterSpacing: "-0.8px",
    textShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  mainActionBtnGreen: {
    background: "linear-gradient(135deg, #D1A84F 0%, #B08D3E 100%)",
    color: "#fff",
    border: "none",
    padding: "16px 32px",
    borderRadius: "20px",
    fontSize: "16px",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
  },
  confirmCard: {
    position: "fixed",
    left: "20px",
    right: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "auto",
    maxWidth: "420px",
    margin: "0 auto",
    backgroundColor: THEME.card,
    borderRadius: "24px",
    border: `1px solid ${THEME.line}`,
    boxShadow: THEME.shadowStrong,
    padding: "22px",
    zIndex: 260,
    boxSizing: "border-box",
  },
  confirmTitle: {
    fontSize: "20px",
    lineHeight: 1.2,
    fontWeight: 800,
    color: THEME.text,
    wordBreak: "break-word",
  },
  confirmText: {
    marginTop: "12px",
    fontSize: "15px",
    color: THEME.textSoft,
    lineHeight: 1.5,
  },
  confirmActions: {
    marginTop: "24px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
  },
  confirmSecondaryBtn: {
    border: `1px solid ${THEME.border}`,
    backgroundColor: THEME.card,
    color: THEME.text,
    borderRadius: "16px",
    padding: "14px 24px",
    fontWeight: 800,
    cursor: "pointer",
  },
  confirmPrimaryBtn: {
    border: "none",
    backgroundColor: THEME.olive,
    color: "#fff",
    borderRadius: "16px",
    padding: "14px 24px",
    fontWeight: 800,
    cursor: "pointer",
  },
};

export default Vista1;
