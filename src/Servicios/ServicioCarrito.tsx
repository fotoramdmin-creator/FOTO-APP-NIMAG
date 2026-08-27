import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Image as ImageIcon,
    Pencil,
    Plus,
    ShoppingBag,
    Trash2,
    X,
} from "lucide-react";
import { ConceptoServicio } from "./serviciosTypes";

type ServicioCarritoProps = {
    carrito: ConceptoServicio[];
    setCarrito: React.Dispatch<
        React.SetStateAction<ConceptoServicio[]>
    >;
    onVolver: () => void;
    onContinuar: () => void;
};

type ConceptoForm = {
    cantidad: string;
    descripcion: string;
    medida: string;
    marco: string;
    especificaciones: string;
    precioUnitario: string;
    requiereSeleccionTomas: boolean;
    cantidadTomasRequeridas: string;
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
};

const money = (value: number) =>
    new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const formularioInicial = (): ConceptoForm => ({
    cantidad: "1",
    descripcion: "",
    medida: "",
    marco: "",
    especificaciones: "",
    precioUnitario: "",
    requiereSeleccionTomas: false,
    cantidadTomasRequeridas: "0",
});

const limpiarNumero = (valor: string) => {
    const limpio = valor.replace(/[^0-9.]/g, "");
    const [enteros, ...decimales] = limpio.split(".");

    if (decimales.length === 0) return enteros;

    return `${enteros}.${decimales.join("").slice(0, 2)}`;
};

const ServicioCarrito = ({
    carrito,
    setCarrito,
    onVolver,
    onContinuar,
}: ServicioCarritoProps) => {
    const [form, setForm] = useState<ConceptoForm>(
        formularioInicial()
    );
    const [editandoId, setEditandoId] = useState<string | null>(
        null
    );
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

    const cantidadNumero = Math.max(
        0,
        Math.floor(Number(form.cantidad || 0))
    );

    const precioNumero = Number(form.precioUnitario || 0);

    const subtotalActual =
        cantidadNumero > 0 && Number.isFinite(precioNumero)
            ? cantidadNumero * precioNumero
            : 0;

    const totalCarrito = useMemo(
        () =>
            carrito.reduce(
                (total, concepto) =>
                    total + Number(concepto.subtotal || 0),
                0
            ),
        [carrito]
    );

    const actualizarForm = <K extends keyof ConceptoForm>(
        campo: K,
        valor: ConceptoForm[K]
    ) => {
        setForm((prev) => {
            const siguiente = {
                ...prev,
                [campo]: valor,
            };

            if (
                campo === "cantidad" &&
                prev.requiereSeleccionTomas
            ) {
                siguiente.cantidadTomasRequeridas = String(
                    Math.max(1, Math.floor(Number(valor || 1)))
                );
            }

            return siguiente;
        });

        setError("");
    };

    const limpiarFormulario = () => {
        setForm(formularioInicial());
        setEditandoId(null);
        setError("");
    };

    const guardarConcepto = () => {
        const descripcion = form.descripcion.trim();

        const tomasRequeridas = form.requiereSeleccionTomas
            ? cantidadNumero
            : 0;

        if (!descripcion) {
            setError("Escribe la descripción del producto o servicio.");
            return;
        }

        if (cantidadNumero <= 0) {
            setError("La cantidad debe ser mayor a cero.");
            return;
        }

        if (!Number.isFinite(precioNumero) || precioNumero < 0) {
            setError("Ingresa un precio unitario válido.");
            return;
        }

        const concepto: ConceptoServicio = {
            id:
                editandoId ||
                `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            cantidad: cantidadNumero,
            descripcion,
            medida: form.medida.trim(),
            marco: form.marco.trim(),
            especificaciones: form.especificaciones.trim(),
            precioUnitario: precioNumero,
            subtotal: subtotalActual,
            requiereSeleccionTomas: form.requiereSeleccionTomas,
            cantidadTomasRequeridas: tomasRequeridas,
        };

        setCarrito((prev) => {
            if (editandoId) {
                return prev.map((item) =>
                    item.id === editandoId ? concepto : item
                );
            }

            return [...prev, concepto];
        });

        limpiarFormulario();
    };

    const editarConcepto = (concepto: ConceptoServicio) => {
        setEditandoId(concepto.id);

        setForm({
            cantidad: String(concepto.cantidad),
            descripcion: concepto.descripcion,
            medida: concepto.medida,
            marco: concepto.marco,
            especificaciones: concepto.especificaciones,
            precioUnitario: String(concepto.precioUnitario),
            requiereSeleccionTomas:
                concepto.requiereSeleccionTomas,
            cantidadTomasRequeridas: String(
                concepto.cantidadTomasRequeridas
            ),
        });

        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const eliminarConcepto = (id: string) => {
        setCarrito((prev) =>
            prev.filter((concepto) => concepto.id !== id)
        );

        if (editandoId === id) {
            limpiarFormulario();
        }
    };

    const continuar = () => {
        if (carrito.length === 0) {
            setError("Añade al menos un concepto antes de continuar.");
            return;
        }

        onContinuar();
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
                    >
                        <ArrowLeft size={17} />
                        Volver a datos
                    </button>

                    <p style={styles.eyebrow}>
                        NUEVO SERVICIO · PASO 2 DE 3
                    </p>

                    <h1
                        style={{
                            ...styles.title,
                            fontSize: isMobile ? 34 : "clamp(38px, 6vw, 54px)",
                        }}
                    >
                        Productos contratados
                    </h1>

                    <p style={styles.subtitle}>
                        Agrega fotografías, ampliaciones, marcos, álbumes,
                        cobertura, video o cualquier concepto acordado.
                    </p>
                </header>

                <div
                    style={{
                        ...styles.layout,
                        gridTemplateColumns: isMobile
                            ? "minmax(0, 1fr)"
                            : "minmax(0, 1.45fr) minmax(320px, 0.75fr)",
                    }}
                >
                    <section
                        style={{
                            ...styles.formCard,
                            padding: isMobile ? 16 : 28,
                            borderRadius: isMobile ? 22 : 27,
                        }}
                    >
                        <div style={styles.cardHeader}>
                            <div style={styles.cardIcon}>
                                {editandoId ? (
                                    <Pencil size={21} />
                                ) : (
                                    <Plus size={22} />
                                )}
                            </div>

                            <div>
                                <h2 style={styles.cardTitle}>
                                    {editandoId
                                        ? "Editar concepto"
                                        : "Añadir al servicio"}
                                </h2>

                                <p style={styles.cardText}>
                                    Medida y marco son opcionales.
                                </p>
                            </div>
                        </div>

                        <div
                            style={{
                                ...styles.quantityDescriptionGrid,
                                gridTemplateColumns: isMobile
                                    ? "1fr"
                                    : "130px minmax(0, 1fr)",
                                gap: isMobile ? 0 : 14,
                            }}
                        >
                            <label style={styles.field}>
                                <span style={styles.label}>Cantidad</span>

                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.cantidad}
                                    onChange={(event) =>
                                        actualizarForm(
                                            "cantidad",
                                            event.target.value
                                        )
                                    }
                                    style={styles.input}
                                />
                            </label>

                            <label style={styles.field}>
                                <span style={styles.label}>
                                    Descripción <b style={styles.required}>*</b>
                                </span>

                                <input
                                    type="text"
                                    value={form.descripcion}
                                    onChange={(event) =>
                                        actualizarForm(
                                            "descripcion",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ej. Ampliación de novios"
                                    style={styles.input}
                                />
                            </label>
                        </div>

                        <div
                            style={{
                                ...styles.twoColumns,
                                gridTemplateColumns: isMobile
                                    ? "1fr"
                                    : "repeat(2, minmax(0, 1fr))",
                                gap: isMobile ? 0 : 14,
                            }}
                        >
                            <label style={styles.field}>
                                <span style={styles.label}>Medida</span>

                                <input
                                    type="text"
                                    value={form.medida}
                                    onChange={(event) =>
                                        actualizarForm("medida", event.target.value)
                                    }
                                    placeholder="Ej. 16x20 pulgadas"
                                    style={styles.input}
                                />
                            </label>

                            <label style={styles.field}>
                                <span style={styles.label}>Marco o acabado</span>

                                <input
                                    type="text"
                                    value={form.marco}
                                    onChange={(event) =>
                                        actualizarForm("marco", event.target.value)
                                    }
                                    placeholder="Ej. Marco negro de madera"
                                    style={styles.input}
                                />
                            </label>
                        </div>

                        <label style={styles.field}>
                            <span style={styles.label}>Especificaciones</span>

                            <textarea
                                rows={3}
                                value={form.especificaciones}
                                onChange={(event) =>
                                    actualizarForm(
                                        "especificaciones",
                                        event.target.value
                                    )
                                }
                                placeholder="Indicaciones especiales, acabado u orientación"
                                style={styles.textarea}
                            />
                        </label>

                        <div
                            style={{
                                ...styles.priceGrid,
                                gridTemplateColumns: isMobile
                                    ? "1fr"
                                    : "repeat(2, minmax(0, 1fr))",
                                gap: isMobile ? 0 : 14,
                            }}
                        >
                            <label style={styles.field}>
                                <span style={styles.label}>
                                    Precio unitario <b style={styles.required}>*</b>
                                </span>

                                <div style={styles.moneyInputWrap}>
                                    <span style={styles.currencySymbol}>$</span>

                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={form.precioUnitario}
                                        onChange={(event) =>
                                            actualizarForm(
                                                "precioUnitario",
                                                limpiarNumero(event.target.value)
                                            )
                                        }
                                        placeholder="0.00"
                                        style={styles.moneyInput}
                                    />
                                </div>
                            </label>

                            <div style={styles.subtotalBox}>
                                <span style={styles.subtotalLabel}>
                                    IMPORTE DEL RENGLÓN
                                </span>

                                <strong style={styles.subtotalValue}>
                                    {money(subtotalActual)}
                                </strong>
                            </div>
                        </div>

                        <div style={styles.selectionBox}>
                            <label style={styles.checkRow}>
                                <input
                                    type="checkbox"
                                    checked={form.requiereSeleccionTomas}
                                    onChange={(event) => {
                                        const activo = event.target.checked;
                                        setForm((prev) => ({
                                            ...prev,
                                            requiereSeleccionTomas: activo,
                                            cantidadTomasRequeridas: activo
                                                ? String(
                                                    Math.max(
                                                        1,
                                                        Math.floor(
                                                            Number(prev.cantidad || 1)
                                                        )
                                                    )
                                                )
                                                : "0",
                                        }));

                                        setError("");
                                    }}
                                    style={styles.checkbox}
                                />

                                <div style={styles.checkIcon}>
                                    <ImageIcon size={19} />
                                </div>

                                <div>
                                    <strong style={styles.checkTitle}>
                                        Requiere seleccionar números de toma
                                    </strong>

                                    <span style={styles.checkText}>
                                        Para fotografías que el cliente elegirá durante
                                        las pruebas.
                                    </span>
                                </div>
                            </label>
                            {form.requiereSeleccionTomas ? (
                                <div style={styles.tomasField}>
                                    <span style={styles.label}>
                                        Selección automática
                                    </span>

                                    <span
                                        style={{
                                            color: THEME.olive,
                                            fontSize: 13,
                                            fontWeight: 900,
                                        }}
                                    >
                                        El cliente deberá seleccionar{" "}
                                        {Math.max(1, cantidadNumero)}{" "}
                                        {Math.max(1, cantidadNumero) === 1
                                            ? "toma"
                                            : "tomas"}
                                        .
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        {error ? (
                            <div style={styles.errorBox}>{error}</div>
                        ) : null}

                        <div
                            style={{
                                ...styles.formActions,
                                flexDirection: isMobile ? "column-reverse" : "row",
                            }}
                        >
                            {editandoId ? (
                                <button
                                    type="button"
                                    onClick={limpiarFormulario}
                                    style={{
                                        ...styles.cancelEditButton,
                                        width: isMobile ? "100%" : "auto",
                                    }}
                                >
                                    <X size={17} />
                                    Cancelar edición
                                </button>
                            ) : null}

                            <motion.button
                                type="button"
                                onClick={guardarConcepto}
                                style={{
                                    ...styles.addButton,
                                    width: isMobile ? "100%" : "auto",
                                }}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {editandoId ? (
                                    <>
                                        <Check size={19} />
                                        Guardar cambios
                                    </>
                                ) : (
                                    <>
                                        <Plus size={19} />
                                        Añadir al carrito
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </section>

                    <aside
                        style={{
                            ...styles.summaryCard,
                            position: isMobile ? "static" : "sticky",
                            top: isMobile ? undefined : 115,
                            padding: isMobile ? 16 : 20,
                            borderRadius: isMobile ? 22 : 27,
                        }}
                    >
                        <div style={styles.summaryHeader}>
                            <div style={styles.summaryIcon}>
                                <ShoppingBag size={21} />
                            </div>

                            <div>
                                <span style={styles.summaryLabel}>
                                    CARRITO DEL SERVICIO
                                </span>

                                <strong style={styles.summaryCount}>
                                    {carrito.length}{" "}
                                    {carrito.length === 1
                                        ? "concepto"
                                        : "conceptos"}
                                </strong>
                            </div>
                        </div>

                        {carrito.length === 0 ? (
                            <div style={styles.emptyCart}>
                                <ShoppingBag size={34} color={THEME.gold} />
                                <strong>El carrito está vacío</strong>
                                <span>Añade el primer producto o servicio.</span>
                            </div>
                        ) : (
                            <div
                                style={{
                                    ...styles.itemsList,
                                    maxHeight: isMobile ? "none" : 470,
                                }}
                            >
                                {carrito.map((concepto, index) => (
                                    <article
                                        key={concepto.id}
                                        style={styles.itemCard}
                                    >
                                        <div style={styles.itemTop}>
                                            <span style={styles.itemNumber}>
                                                {index + 1}
                                            </span>

                                            <div style={styles.itemActions}>
                                                <button
                                                    type="button"
                                                    onClick={() => editarConcepto(concepto)}
                                                    style={styles.iconButton}
                                                    aria-label="Editar concepto"
                                                >
                                                    <Pencil size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminarConcepto(concepto.id)
                                                    }
                                                    style={styles.deleteButton}
                                                    aria-label="Eliminar concepto"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        <strong style={styles.itemTitle}>
                                            {concepto.cantidad} × {concepto.descripcion}
                                        </strong>

                                        <div style={styles.itemDetails}>
                                            {concepto.medida ? (
                                                <span>Medida: {concepto.medida}</span>
                                            ) : null}

                                            {concepto.marco ? (
                                                <span>Marco: {concepto.marco}</span>
                                            ) : null}

                                            {concepto.requiereSeleccionTomas ? (
                                                <span style={styles.tomasBadge}>
                                                    {concepto.cantidadTomasRequeridas}{" "}
                                                    {concepto.cantidadTomasRequeridas === 1
                                                        ? "toma"
                                                        : "tomas"}{" "}
                                                    por seleccionar
                                                </span>
                                            ) : null}
                                        </div>

                                        {concepto.especificaciones ? (
                                            <p style={styles.itemSpecs}>
                                                {concepto.especificaciones}
                                            </p>
                                        ) : null}

                                        <div style={styles.itemPriceRow}>
                                            <span>
                                                {money(concepto.precioUnitario)} c/u
                                            </span>

                                            <strong>{money(concepto.subtotal)}</strong>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        <div style={styles.totalBox}>
                            <span style={styles.totalLabel}>TOTAL ACTUAL</span>

                            <strong style={styles.totalValue}>
                                {money(totalCarrito)}
                            </strong>

                            <span style={styles.totalHelp}>
                                El descuento se aplicará en la confirmación.
                            </span>
                        </div>
                    </aside>
                </div>

                <footer
                    style={{
                        ...styles.footer,
                        gridTemplateColumns: isMobile
                            ? "1fr"
                            : "minmax(160px, 0.8fr) minmax(220px, 1.2fr)",
                    }}
                >
                    <button
                        type="button"
                        onClick={onVolver}
                        style={styles.secondaryButton}
                    >
                        <ArrowLeft size={18} />
                        Volver a datos
                    </button>

                    <motion.button
                        type="button"
                        onClick={continuar}
                        style={{
                            ...styles.primaryButton,
                            opacity: carrito.length > 0 ? 1 : 0.7,
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Revisar servicio
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
    formCard: {
        background: THEME.card,
        border: `1px solid ${THEME.border}`,
        boxShadow: "0 20px 55px rgba(61,51,39,0.08)",
        boxSizing: "border-box",
        minWidth: 0,
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        gap: 13,
        marginBottom: 24,
    },
    cardIcon: {
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
    cardTitle: {
        margin: 0,
        color: THEME.text,
        fontSize: 21,
    },
    cardText: {
        margin: "4px 0 0",
        color: THEME.textSoft,
        fontSize: 13,
    },
    quantityDescriptionGrid: {
        display: "grid",
    },
    twoColumns: {
        display: "grid",
    },
    priceGrid: {
        display: "grid",
        alignItems: "end",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 16,
        minWidth: 0,
    },
    label: {
        color: THEME.text,
        fontSize: 12,
        fontWeight: 900,
    },
    required: {
        color: THEME.red,
    },
    input: {
        width: "100%",
        minWidth: 0,
        minHeight: 52,
        borderRadius: 15,
        border: `1px solid ${THEME.border}`,
        background: "#fff",
        color: THEME.text,
        WebkitTextFillColor: THEME.text,
        padding: "0 14px",
        fontSize: 16,
        outline: "none",
        boxSizing: "border-box",
    },
    textarea: {
        width: "100%",
        minWidth: 0,
        borderRadius: 15,
        border: `1px solid ${THEME.border}`,
        background: "#fff",
        color: THEME.text,
        WebkitTextFillColor: THEME.text,
        padding: 14,
        fontSize: 16,
        lineHeight: 1.5,
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
    },
    moneyInputWrap: {
        minHeight: 52,
        borderRadius: 15,
        border: `1px solid ${THEME.border}`,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        boxSizing: "border-box",
    },
    currencySymbol: {
        color: THEME.textSoft,
        fontWeight: 900,
        marginRight: 7,
    },
    moneyInput: {
        width: "100%",
        minWidth: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        color: THEME.text,
        WebkitTextFillColor: THEME.text,
        fontSize: 18,
        fontWeight: 800,
    },
    subtotalBox: {
        minHeight: 76,
        borderRadius: 17,
        background: THEME.goldSoft,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
        marginBottom: 16,
    },
    subtotalLabel: {
        color: "#806527",
        fontSize: 10,
        fontWeight: 900,
    },
    subtotalValue: {
        color: THEME.text,
        fontSize: 23,
        marginTop: 3,
    },
    selectionBox: {
        borderRadius: 18,
        border: `1px solid ${THEME.border}`,
        background: "rgba(248,240,220,0.45)",
        padding: 16,
        marginBottom: 16,
    },
    checkRow: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        cursor: "pointer",
    },
    checkbox: {
        width: 21,
        height: 21,
        accentColor: THEME.olive,
        flexShrink: 0,
    },
    checkIcon: {
        width: 40,
        height: 40,
        borderRadius: 13,
        background: "#fff",
        color: THEME.olive,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    checkTitle: {
        color: THEME.text,
        fontSize: 13,
        display: "block",
    },
    checkText: {
        color: THEME.textSoft,
        fontSize: 11,
        lineHeight: 1.4,
        display: "block",
        marginTop: 3,
    },
    tomasField: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 14,
    },
    errorBox: {
        borderRadius: 14,
        background: THEME.redSoft,
        border: "1px solid rgba(180,35,24,0.20)",
        color: THEME.red,
        padding: 13,
        fontSize: 12,
        fontWeight: 800,
        marginBottom: 14,
    },
    formActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        flexWrap: "wrap",
    },
    cancelEditButton: {
        minHeight: 50,
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
        boxSizing: "border-box",
    },
    addButton: {
        minHeight: 50,
        borderRadius: 15,
        border: "none",
        background: THEME.olive,
        color: "#fff",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontWeight: 900,
        cursor: "pointer",
        boxSizing: "border-box",
    },
    summaryCard: {
        background: THEME.card,
        border: `1px solid ${THEME.border}`,
        boxShadow: "0 20px 55px rgba(61,51,39,0.08)",
        boxSizing: "border-box",
        minWidth: 0,
    },
    summaryHeader: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    summaryIcon: {
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
    summaryLabel: {
        display: "block",
        color: THEME.gold,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: 1.5,
    },
    summaryCount: {
        color: THEME.text,
        fontSize: 17,
        display: "block",
    },
    emptyCart: {
        minHeight: 190,
        borderRadius: 18,
        border: `1px dashed ${THEME.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 8,
        color: THEME.textSoft,
        padding: 20,
    },
    itemsList: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        paddingRight: 3,
    },
    itemCard: {
        borderRadius: 17,
        border: `1px solid ${THEME.border}`,
        background: "#fff",
        padding: 14,
        minWidth: 0,
    },
    itemTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    itemNumber: {
        width: 25,
        height: 25,
        borderRadius: 9,
        background: THEME.goldSoft,
        color: "#806527",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 900,
    },
    itemActions: {
        display: "flex",
        gap: 6,
    },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        border: `1px solid ${THEME.border}`,
        background: "#fff",
        color: THEME.olive,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    deleteButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        border: "1px solid rgba(180,35,24,0.16)",
        background: THEME.redSoft,
        color: THEME.red,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
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
        gap: 4,
        color: THEME.textSoft,
        fontSize: 11,
        marginTop: 7,
    },
    tomasBadge: {
        color: THEME.olive,
        fontWeight: 900,
    },
    itemSpecs: {
        color: THEME.textSoft,
        fontSize: 11,
        lineHeight: 1.4,
        margin: "8px 0 0",
        wordBreak: "break-word",
    },
    itemPriceRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        color: THEME.textSoft,
        fontSize: 11,
        borderTop: `1px solid ${THEME.border}`,
        marginTop: 11,
        paddingTop: 10,
    },
    totalBox: {
        borderRadius: 18,
        background: THEME.olive,
        color: "#fff",
        padding: 17,
        marginTop: 15,
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
        fontSize: 30,
        marginTop: 3,
        wordBreak: "break-word",
    },
    totalHelp: {
        fontSize: 10,
        opacity: 0.62,
        marginTop: 4,
    },
    footer: {
        display: "grid",
        gap: 12,
        marginTop: 18,
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

export default ServicioCarrito;