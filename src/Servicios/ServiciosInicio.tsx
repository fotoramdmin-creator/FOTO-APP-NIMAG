import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Users,
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
    estado: string;
    total_final: number;
    total_pagado: number;
    resta: number;
    pagado: boolean;
};

type ServiciosInicioProps = {
    onVolver: () => void;
    onNuevoServicio: () => void;
    onAbrirCalendario: () => void;
    onAbrirServicio: (servicioId: string) => void;
};

const THEME = {
    bg: "#f6f1e8",
    card: "#fffdf8",
    text: "#1c1a15",
    textSoft: "#777168",
    olive: "#36412e",
    oliveLight: "#56674b",
    gold: "#b89f54",
    goldSoft: "#f7efd9",
    border: "rgba(184, 159, 84, 0.22)",
    red: "#b42318",
    redSoft: "#fff1f0",
    green: "#237a4b",
    greenSoft: "#edf8f1",
    shadow: "0 22px 60px rgba(61, 51, 39, 0.10)",
};

const money = (value: number) =>
    new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const obtenerHoyLocal = () => {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, "0");
    const day = String(ahora.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatearFecha = (fecha: string) => {
    if (!fecha) return "Sin fecha";

    return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-MX", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatearHorario = (horario: string | null) => {
    if (!horario) return "Horario por confirmar";

    const [horaTexto, minutoTexto] = horario.split(":");
    const fecha = new Date();
    fecha.setHours(Number(horaTexto), Number(minutoTexto || 0), 0, 0);

    return fecha.toLocaleTimeString("es-MX", {
        hour: "numeric",
        minute: "2-digit",
    });
};

const diasHastaEvento = (fecha: string) => {
    const hoy = new Date(`${obtenerHoyLocal()}T12:00:00`);
    const evento = new Date(`${fecha}T12:00:00`);
    return Math.round(
        (evento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );
};

const etiquetaEstado = (estado: string) =>
    estado
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) => letra.toUpperCase());

const ServiciosInicio = ({
    onVolver,
    onNuevoServicio,
    onAbrirCalendario,
    onAbrirServicio,
}: ServiciosInicioProps) => {
    const [servicios, setServicios] = useState<ServicioRow[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState("");

    const cargarServicios = useCallback(async (esActualizacion = false) => {
        try {
            if (esActualizacion) {
                setActualizando(true);
            } else {
                setCargando(true);
            }

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
            estado,
            total_final,
            total_pagado,
            resta,
            pagado
          `
                )
                .order("fecha_evento", { ascending: true });

            if (errorConsulta) throw errorConsulta;

            setServicios((data || []) as ServicioRow[]);
        } catch (err: any) {
            console.error("Error cargando servicios:", err);
            setError(
                err?.message ||
                "No se pudieron cargar los servicios. Intenta nuevamente."
            );
            setServicios([]);
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    }, []);

    useEffect(() => {
        cargarServicios();
    }, [cargarServicios]);

    const hoy = obtenerHoyLocal();

    const serviciosActivos = useMemo(
        () =>
            servicios.filter(
                (servicio) =>
                    servicio.estado !== "ENTREGADO" &&
                    servicio.estado !== "CANCELADO"
            ),
        [servicios]
    );

    const eventosHoy = useMemo(
        () =>
            serviciosActivos.filter(
                (servicio) => servicio.fecha_evento === hoy
            ),
        [serviciosActivos, hoy]
    );

    const eventosProximos = useMemo(
        () =>
            serviciosActivos.filter((servicio) => {
                const dias = diasHastaEvento(servicio.fecha_evento);
                return dias >= 0 && dias <= 7;
            }),
        [serviciosActivos]
    );

    const saldoPendiente = useMemo(
        () =>
            serviciosActivos.reduce(
                (total, servicio) => total + Number(servicio.resta || 0),
                0
            ),
        [serviciosActivos]
    );

    const serviciosFiltrados = useMemo(() => {
        const normalizar = (valor: string) =>
            String(valor || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();

        const termino = normalizar(busqueda);

        const base = [
            ...(termino ? servicios : serviciosActivos),
        ].sort((a, b) =>
            a.fecha_evento.localeCompare(b.fecha_evento)
        );

        if (!termino) return base;

        return base.filter((servicio) =>
            [
                servicio.folio,
                servicio.cliente_nombre,
                servicio.cliente_telefono || "",
                servicio.tipo_evento,
                servicio.lugar_evento || "",
                servicio.estado,
            ].some((valor) =>
                normalizar(valor).includes(termino)
            )
        );
    }, [
        busqueda,
        servicios,
        serviciosActivos,
    ]);

    return (
        <main style={styles.page}>
            <div style={styles.glowTop} />
            <div style={styles.glowBottom} />

            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <button type="button" onClick={onVolver} style={styles.backButton}>
                            <ArrowLeft size={17} />
                            Volver a Inicio
                        </button>

                        <p style={styles.eyebrow}>SERVICIOS Y EVENTOS</p>
                        <h1 style={styles.title}>Agenda, cobros y producción</h1>
                        <p style={styles.subtitle}>
                            Controla bodas, XV años y trabajos especiales desde la
                            contratación hasta la entrega.
                        </p>
                    </div>

                    <div style={styles.headerActions}>
                        <motion.button
                            type="button"
                            onClick={onAbrirCalendario}
                            style={styles.calendarButton}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <CalendarDays size={19} />
                            Calendario
                        </motion.button>

                        <motion.button
                            type="button"
                            onClick={onNuevoServicio}
                            style={styles.newButton}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus size={20} />
                            Nuevo servicio
                        </motion.button>
                    </div>
                </header>

                <section style={styles.kpiGrid}>
                    <article style={styles.kpiCard}>
                        <div style={styles.kpiIconOlive}>
                            <Users size={20} />
                        </div>
                        <div>
                            <span style={styles.kpiLabel}>Servicios activos</span>
                            <strong style={styles.kpiValue}>{serviciosActivos.length}</strong>
                        </div>
                    </article>

                    <article
                        style={{
                            ...styles.kpiCard,
                            ...(eventosHoy.length > 0 ? styles.kpiCardUrgent : {}),
                        }}
                    >
                        <div
                            style={
                                eventosHoy.length > 0
                                    ? styles.kpiIconRed
                                    : styles.kpiIconGold
                            }
                        >
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <span style={styles.kpiLabel}>Eventos hoy</span>
                            <strong style={styles.kpiValue}>{eventosHoy.length}</strong>
                        </div>
                    </article>

                    <article style={styles.kpiCard}>
                        <div style={styles.kpiIconGold}>
                            <Clock3 size={20} />
                        </div>
                        <div>
                            <span style={styles.kpiLabel}>Próximos 7 días</span>
                            <strong style={styles.kpiValue}>
                                {eventosProximos.length}
                            </strong>
                        </div>
                    </article>

                    <article style={styles.kpiCard}>
                        <div style={styles.kpiIconGreen}>
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <span style={styles.kpiLabel}>Saldo por cobrar</span>
                            <strong style={styles.kpiMoney}>{money(saldoPendiente)}</strong>
                        </div>
                    </article>
                </section>

                <section style={styles.listCard}>
                    <div style={styles.listHeader}>
                        <div>
                            <p style={styles.sectionEyebrow}>SEGUIMIENTO</p>
                            <h2 style={styles.sectionTitle}>Servicios activos</h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => cargarServicios(true)}
                            style={styles.refreshButton}
                            disabled={actualizando}
                        >
                            <RefreshCw
                                size={17}
                                className={actualizando ? "spin" : undefined}
                            />
                            Actualizar
                        </button>
                    </div>

                    <div style={styles.searchWrap}>
                        <Search size={19} color={THEME.textSoft} />
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                            placeholder="Buscar por cliente, teléfono, folio o evento"
                            style={styles.searchInput}
                        />
                    </div>

                    {cargando ? (
                        <div style={styles.stateBox}>
                            <Loader2 size={34} color={THEME.olive} />
                            <strong>Cargando servicios…</strong>
                        </div>
                    ) : error ? (
                        <div style={styles.errorBox}>
                            <AlertTriangle size={28} />
                            <strong>No se pudieron cargar los servicios</strong>
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={() => cargarServicios()}
                                style={styles.retryButton}
                            >
                                Intentar nuevamente
                            </button>
                        </div>
                    ) : serviciosFiltrados.length === 0 ? (
                        <div style={styles.stateBox}>
                            <CalendarDays size={38} color={THEME.gold} />
                            <strong>
                                {busqueda
                                    ? "No encontramos coincidencias"
                                    : "Todavía no hay servicios activos"}
                            </strong>
                            <span>
                                {busqueda
                                    ? "Prueba con otro nombre, folio o teléfono."
                                    : "El primer servicio aparecerá aquí después de registrarlo."}
                            </span>
                        </div>
                    ) : (
                        <div style={styles.servicesList}>
                            {serviciosFiltrados.map((servicio) => {
                                const dias = diasHastaEvento(servicio.fecha_evento);
                                const esHoy = dias === 0;
                                const esCercano = dias > 0 && dias <= 3;
                                const esEntregado =
                                    servicio.estado === "ENTREGADO";
                                const esCancelado =
                                    servicio.estado === "CANCELADO";

                                return (
                                    <motion.button
                                        key={servicio.id}
                                        type="button"
                                        onClick={() => onAbrirServicio(servicio.id)}
                                        style={{
                                            ...styles.serviceRow,
                                            ...(esHoy
                                                ? styles.serviceRowToday
                                                : {}),
                                            ...(esEntregado
                                                ? styles.serviceRowDelivered
                                                : {}),
                                            ...(esCancelado
                                                ? styles.serviceRowCancelled
                                                : {}),
                                        }}
                                        whileHover={{ x: 3 }}
                                        whileTap={{ scale: 0.992 }}
                                    >
                                        <div
                                            style={{
                                                ...styles.dateBlock,
                                                ...(esHoy
                                                    ? styles.dateBlockToday
                                                    : {}),
                                                ...(esEntregado
                                                    ? styles.dateBlockDelivered
                                                    : {}),
                                                ...(esCancelado
                                                    ? styles.dateBlockCancelled
                                                    : {}),
                                            }}
                                        >
                                            <strong style={styles.dateDay}>
                                                {new Date(
                                                    `${servicio.fecha_evento}T12:00:00`
                                                ).getDate()}
                                            </strong>
                                            <span style={styles.dateMonth}>
                                                {new Date(
                                                    `${servicio.fecha_evento}T12:00:00`
                                                )
                                                    .toLocaleDateString("es-MX", { month: "short" })
                                                    .replace(".", "")
                                                    .toUpperCase()}
                                            </span>
                                        </div>

                                        <div style={styles.serviceInfo}>
                                            <div style={styles.serviceTitleRow}>
                                                <strong style={styles.clientName}>
                                                    {servicio.cliente_nombre}
                                                </strong>

                                                <span style={styles.folioBadge}>
                                                    {servicio.folio}
                                                </span>

                                                {esHoy ? (
                                                    <span style={styles.todayBadge}>HOY</span>
                                                ) : esCercano ? (
                                                    <span style={styles.soonBadge}>
                                                        EN {dias} {dias === 1 ? "DÍA" : "DÍAS"}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <span style={styles.eventType}>
                                                {servicio.tipo_evento}
                                            </span>

                                            <span style={styles.eventMeta}>
                                                {formatearFecha(servicio.fecha_evento)}
                                                {" · "}
                                                {formatearHorario(servicio.horario_evento)}
                                                {servicio.lugar_evento
                                                    ? ` · ${servicio.lugar_evento}`
                                                    : ""}
                                            </span>

                                            <span style={styles.statusText}>
                                                {etiquetaEstado(servicio.estado)}
                                            </span>
                                        </div>

                                        <div style={styles.moneyBlock}>
                                            <span style={styles.balanceLabel}>Saldo</span>
                                            <strong
                                                style={{
                                                    ...styles.balanceValue,
                                                    color:
                                                        Number(servicio.resta || 0) > 0
                                                            ? THEME.red
                                                            : THEME.green,
                                                }}
                                            >
                                                {money(servicio.resta)}
                                            </strong>
                                            <span style={styles.totalText}>
                                                Pagado {money(servicio.total_pagado)}
                                            </span>

                                            <span style={styles.totalText}>
                                                Total {money(servicio.total_final)}
                                            </span>
                                        </div>

                                        <ArrowRight size={20} color={THEME.textSoft} />
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        minHeight: "100vh",
        background: THEME.bg,
        padding: "130px 20px 60px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
    },
    glowTop: {
        position: "absolute",
        width: 420,
        height: 420,
        borderRadius: "50%",
        background: "rgba(184,159,84,0.12)",
        filter: "blur(35px)",
        top: -180,
        right: -130,
        pointerEvents: "none",
    },
    glowBottom: {
        position: "absolute",
        width: 360,
        height: 360,
        borderRadius: "50%",
        background: "rgba(54,65,46,0.10)",
        filter: "blur(40px)",
        bottom: -180,
        left: -150,
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
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 24,
        flexWrap: "wrap",
        marginBottom: 28,
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
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 2,
    },
    title: {
        margin: 0,
        color: THEME.text,
        fontSize: "clamp(32px, 5vw, 54px)",
        lineHeight: 1,
        letterSpacing: "-2px",
    },
    subtitle: {
        margin: "14px 0 0",
        color: THEME.textSoft,
        fontSize: 16,
        maxWidth: 650,
        lineHeight: 1.6,
    },
    headerActions: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
    },
    calendarButton: {
        minHeight: 52,
        padding: "0 20px",
        borderRadius: 17,
        border: `1px solid ${THEME.border}`,
        background: THEME.card,
        color: THEME.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        fontWeight: 900,
        cursor: "pointer",
    },
    newButton: {
        minHeight: 52,
        padding: "0 22px",
        borderRadius: 17,
        border: "none",
        background: THEME.olive,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 14px 30px rgba(54,65,46,0.24)",
    },
    kpiGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 14,
        marginBottom: 20,
    },
    kpiCard: {
        minHeight: 108,
        padding: 18,
        borderRadius: 22,
        background: THEME.card,
        border: `1px solid ${THEME.border}`,
        boxShadow: "0 12px 30px rgba(61,51,39,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 15,
        boxSizing: "border-box",
    },
    kpiCardUrgent: {
        border: "1px solid rgba(180,35,24,0.30)",
        background: THEME.redSoft,
    },
    kpiIconOlive: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: "rgba(54,65,46,0.10)",
        color: THEME.olive,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    kpiIconGold: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: THEME.goldSoft,
        color: "#8b6f2f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    kpiIconRed: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: "rgba(180,35,24,0.12)",
        color: THEME.red,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    kpiIconGreen: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: THEME.greenSoft,
        color: THEME.green,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    kpiLabel: {
        color: THEME.textSoft,
        fontSize: 12,
        fontWeight: 800,
        display: "block",
        marginBottom: 5,
    },
    kpiValue: {
        color: THEME.text,
        fontSize: 29,
        lineHeight: 1,
    },
    kpiMoney: {
        color: THEME.text,
        fontSize: 20,
        lineHeight: 1.1,
    },
    listCard: {
        background: THEME.card,
        border: `1px solid ${THEME.border}`,
        borderRadius: 28,
        boxShadow: THEME.shadow,
        padding: 22,
    },
    listHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 18,
    },
    sectionEyebrow: {
        margin: "0 0 5px",
        color: THEME.gold,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 1.8,
    },
    sectionTitle: {
        margin: 0,
        color: THEME.text,
        fontSize: 25,
    },
    refreshButton: {
        border: `1px solid ${THEME.border}`,
        borderRadius: 14,
        background: "#fff",
        color: THEME.textSoft,
        minHeight: 42,
        padding: "0 15px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        fontWeight: 800,
    },
    searchWrap: {
        minHeight: 54,
        borderRadius: 17,
        border: `1px solid ${THEME.border}`,
        background: "#fff",
        padding: "0 17px",
        display: "flex",
        alignItems: "center",
        gap: 11,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        color: THEME.text,
        fontSize: 15,
    },
    stateBox: {
        minHeight: 230,
        borderRadius: 22,
        border: `1px dashed ${THEME.border}`,
        background: "rgba(255,255,255,0.55)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 10,
        color: THEME.textSoft,
        padding: 24,
    },
    errorBox: {
        minHeight: 230,
        borderRadius: 22,
        background: THEME.redSoft,
        color: THEME.red,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 10,
        padding: 24,
    },
    retryButton: {
        marginTop: 8,
        minHeight: 42,
        padding: "0 16px",
        borderRadius: 13,
        border: "none",
        background: THEME.red,
        color: "#fff",
        fontWeight: 900,
        cursor: "pointer",
    },
    servicesList: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    serviceRow: {
        width: "100%",
        border: `1px solid ${THEME.border}`,
        borderRadius: 20,
        background: "#fff",
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 15,
        textAlign: "left",
        cursor: "pointer",
        boxSizing: "border-box",
    },
    serviceRowToday: {
        border: "1px solid rgba(180,35,24,0.34)",
        background: THEME.redSoft,
    },

        serviceRowDelivered: {
        border: "2px solid rgba(35,122,75,0.42)",
        background:
            "linear-gradient(135deg, #edf8f1 0%, #f8fcf9 100%)",
        boxShadow:
            "0 12px 28px rgba(35,122,75,0.10)",
    },
    serviceRowCancelled: {
        border: "2px solid rgba(180,35,24,0.32)",
        background: THEME.redSoft,
        opacity: 0.82,
    },
    dateBlock: {
        width: 58,
        height: 62,
        borderRadius: 17,
        background: THEME.goldSoft,
        color: "#806527",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    dateBlockToday: {
        background: THEME.red,
        color: "#fff",
    },

        dateBlockDelivered: {
        background: THEME.green,
        color: "#fff",
    },
    dateBlockCancelled: {
        background: THEME.red,
        color: "#fff",
    },
    dateDay: {
        fontSize: 24,
        lineHeight: 1,
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: 900,
        marginTop: 4,
    },
    serviceInfo: {
        minWidth: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    serviceTitleRow: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 7,
    },
    clientName: {
        color: THEME.text,
        fontSize: 17,
    },
    folioBadge: {
        borderRadius: 999,
        background: "rgba(54,65,46,0.08)",
        color: THEME.olive,
        padding: "4px 8px",
        fontSize: 9,
        fontWeight: 900,
    },
    todayBadge: {
        borderRadius: 999,
        background: THEME.red,
        color: "#fff",
        padding: "4px 8px",
        fontSize: 9,
        fontWeight: 900,
    },
    soonBadge: {
        borderRadius: 999,
        background: THEME.goldSoft,
        color: "#806527",
        padding: "4px 8px",
        fontSize: 9,
        fontWeight: 900,
    },
    eventType: {
        color: THEME.olive,
        fontSize: 13,
        fontWeight: 900,
    },
    eventMeta: {
        color: THEME.textSoft,
        fontSize: 12,
        lineHeight: 1.4,
    },
    statusText: {
        color: THEME.textSoft,
        fontSize: 11,
        fontWeight: 800,
    },
    moneyBlock: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        flexShrink: 0,
    },
    balanceLabel: {
        color: THEME.textSoft,
        fontSize: 10,
        fontWeight: 800,
    },
    balanceValue: {
        fontSize: 17,
        marginTop: 2,
    },
    totalText: {
        color: THEME.textSoft,
        fontSize: 10,
        marginTop: 3,
    },
};

export default ServiciosInicio;