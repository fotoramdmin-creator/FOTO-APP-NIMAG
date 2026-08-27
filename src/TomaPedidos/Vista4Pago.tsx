import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  BadgeDollarSign,
  Receipt,
  CreditCard,
  Banknote,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";

type TipoPago = "A_CUENTA" | "LIQUIDACION";
type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA";
type CuentaTransferencia = {
  id: string;
  nombre: string;
};

type PartePago = {
  id: string;
  metodo: MetodoPago;
  monto: string;
  cuentaDestino: string;
};

export type PagoGuardado = {
  id: string;
  fecha_pago: string;
  monto: number;
  metodo_pago: MetodoPago;
  cuenta_destino: string | null;
  tipo: TipoPago;
  usuario_id: string | null;
};

export type ResultadoPago = {
  pagos: PagoGuardado[];
  pedidoId?: string;
  servicioId?: string;
  clienteNombre: string;
  tipoPago: TipoPago;
  fechaPago: string;
  totalPagado: number;
  saldoAnterior: number;
  saldoPosterior: number;
  usuarioId?: string;
};

const crearPartePago = (
  metodo: MetodoPago = "EFECTIVO",
  monto = ""
): PartePago => ({
  id: `${Date.now()}-${Math.random()}`,
  metodo,
  monto,
  cuentaDestino: "",
});

const limpiarMontoInput = (valor: string) => {
  const limpio = valor.replace(/[^0-9.]/g, "");
  const [enteros, ...decimales] = limpio.split(".");

  if (decimales.length === 0) return enteros;

  return `${enteros}.${decimales.join("").slice(0, 2)}`;
};

type Props = {
  pedidoId?: string;
  servicioId?: string;
  clienteNombre: string;
  usuarioId?: string;
  totalBruto: number;
  descuento: number;
  totalFinal: number;
  pendiente: number;
  onVolver: () => void;
  onFinalizado: (resultado?: ResultadoPago) => void;
};

const THEME = {
  bg: "#F4F1EA",
  gold: "#b89f54",
  olive: "#556b2f",
  oliveSoft: "#6b7f3a",
  black: "#12110F",
  accentGray: "#475569",
  text: "#1c1a15",
  textSoft: "#747169",
  white: "#FFFFFF",
  border: "rgba(184, 159, 84, 0.2)",
  danger: "#be123c",
};

function Vista4Pago({
  pedidoId,
  servicioId,
  clienteNombre,
  usuarioId,
  totalBruto,
  descuento,
  totalFinal,
  pendiente,
  onVolver,
  onFinalizado,
}: Props) {
  const [tipoPago, setTipoPago] = useState<TipoPago>("A_CUENTA");
  const [cuentasTransferencia, setCuentasTransferencia] = useState<
    CuentaTransferencia[]
  >([]);

  const [partesPago, setPartesPago] = useState<PartePago[]>(() => [
    crearPartePago(),
  ]);

  const [conCuantoPaga, setConCuantoPaga] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const conCuantoPagaNum = Number(conCuantoPaga || 0);

  const totalDistribuido = useMemo(
    () =>
      partesPago.reduce(
        (total, parte) => total + Number(parte.monto || 0),
        0
      ),
    [partesPago]
  );

  const totalEfectivo = useMemo(
    () =>
      partesPago
        .filter((parte) => parte.metodo === "EFECTIVO")
        .reduce(
          (total, parte) => total + Number(parte.monto || 0),
          0
        ),
    [partesPago]
  );

  const incluyeEfectivo = partesPago.some(
    (parte) => parte.metodo === "EFECTIVO"
  );

  const cambio = incluyeEfectivo
    ? conCuantoPagaNum - totalEfectivo
    : 0;

  const saldoDespuesPago = Math.max(
    Number(pendiente || 0) - totalDistribuido,
    0
  );

  const esCortesia =
    Boolean(pedidoId) &&
    Number(totalBruto || 0) > 0 &&
    Number(totalFinal || 0) === 0 &&
    Number(descuento || 0) >=
      Number(totalBruto || 0) &&
    Number(pendiente || 0) === 0;

  const diferenciaLiquidacion =
    Number(pendiente || 0) - totalDistribuido;

  const montosValidos = partesPago.every((parte) => {
    const monto = Number(parte.monto || 0);
    return Number.isFinite(monto) && monto > 0;
  });

  const transferenciasValidas = partesPago.every(
    (parte) =>
      parte.metodo !== "TRANSFERENCIA" ||
      Boolean(parte.cuentaDestino)
  );

  const metodosSinDuplicar =
    new Set(partesPago.map((parte) => parte.metodo)).size ===
    partesPago.length;

  const totalDentroDelSaldo =
    totalDistribuido > 0 &&
    totalDistribuido <= Number(pendiente || 0) + 0.009;

  const tipoPagoValido =
    tipoPago === "LIQUIDACION"
      ? Math.abs(diferenciaLiquidacion) <= 0.009
      : totalDistribuido < Number(pendiente || 0) - 0.009;

  const efectivoValido =
    !incluyeEfectivo ||
    (conCuantoPagaNum > 0 &&
      conCuantoPagaNum + 0.009 >= totalEfectivo);

  const pagoValido =
    montosValidos &&
    transferenciasValidas &&
    metodosSinDuplicar &&
    totalDentroDelSaldo &&
    tipoPagoValido &&
    efectivoValido;

  useEffect(() => {
    const cargarCuentasTransferencia = async () => {
      const { data, error } = await supabase
        .from("cuentas_transferencia")
        .select("id, nombre")
        .eq("activa", true)
        .order("orden", { ascending: true });

      if (!error) {
        setCuentasTransferencia(data || []);
      }
    };

    cargarCuentasTransferencia();
  }, []);

  const formatoMoneda = (valor: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(valor || 0));

  const limpiarError = () => setError("");

  const actualizarPartePago = (
    id: string,
    cambios: Partial<PartePago>
  ) => {
    setPartesPago((prev) =>
      prev.map((parte) =>
        parte.id === id ? { ...parte, ...cambios } : parte
      )
    );
    limpiarError();
  };

  const agregarPartePago = () => {
    const metodosDisponibles: MetodoPago[] = [
      "EFECTIVO",
      "TRANSFERENCIA",
      "TARJETA",
    ];

    const metodosUsados = new Set(
      partesPago.map((parte) => parte.metodo)
    );

    const siguienteMetodo = metodosDisponibles.find(
      (metodo) => !metodosUsados.has(metodo)
    );

    if (!siguienteMetodo) {
      setError("Ya agregaste todos los métodos disponibles.");
      return;
    }

    setPartesPago((prev) => [
      ...prev,
      crearPartePago(siguienteMetodo),
    ]);
    limpiarError();
  };

  const eliminarPartePago = (id: string) => {
    setPartesPago((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((parte) => parte.id !== id);
    });
    limpiarError();
  };

  const guardarPago = async () => {
    limpiarError();

    const cantidadOrigenes =
      Number(Boolean(pedidoId)) + Number(Boolean(servicioId));

    if (cantidadOrigenes !== 1) {
      setError(
        "No se pudo identificar si el cobro pertenece a un pedido o a un servicio."
      );
      return;
    }

    const partesNormalizadas = partesPago.map((parte) => ({
      ...parte,
      montoNumero: Number(parte.monto || 0),
    }));

    const hayMontoInvalido = partesNormalizadas.some(
      (parte) =>
        !Number.isFinite(parte.montoNumero) ||
        parte.montoNumero <= 0
    );

    if (hayMontoInvalido) {
      setError("Todos los métodos deben tener un monto mayor a cero.");
      return;
    }

    const metodosRegistrados = partesNormalizadas.map(
      (parte) => parte.metodo
    );

    if (
      new Set(metodosRegistrados).size !==
      metodosRegistrados.length
    ) {
      setError("No puedes repetir el mismo método de pago.");
      return;
    }

    if (totalDistribuido <= 0) {
      setError("Ingresa al menos un monto para registrar.");
      return;
    }

    if (totalDistribuido > Number(pendiente || 0) + 0.009) {
      setError("El total capturado no puede ser mayor al pendiente.");
      return;
    }

    if (
      tipoPago === "A_CUENTA" &&
      totalDistribuido >= Number(pendiente || 0) - 0.009
    ) {
      setError(
        "Si el pago cubre todo el saldo, selecciona Liquidación."
      );
      return;
    }

    if (
      tipoPago === "LIQUIDACION" &&
      Math.abs(diferenciaLiquidacion) > 0.009
    ) {
      setError(
        `Falta distribuir ${formatoMoneda(
          Math.abs(diferenciaLiquidacion)
        )} para completar la liquidación.`
      );
      return;
    }

    const transferenciaSinCuenta = partesNormalizadas.some(
      (parte) =>
        parte.metodo === "TRANSFERENCIA" &&
        !parte.cuentaDestino
    );

    if (transferenciaSinCuenta) {
      setError("Selecciona la cuenta destino de cada transferencia.");
      return;
    }

    if (incluyeEfectivo) {
      if (conCuantoPagaNum <= 0) {
        setError("Ingresa el efectivo recibido.");
        return;
      }

      if (conCuantoPagaNum + 0.009 < totalEfectivo) {
        setError("El efectivo recibido es menor al efectivo aplicado.");
        return;
      }
    }

    try {
      setGuardando(true);

      const fechaPago = new Date().toISOString();

      const pagosAInsertar = partesNormalizadas.map((parte) => ({
        pedido_id: pedidoId || null,
        servicio_id: servicioId || null,
        fecha_pago: fechaPago,
        monto: parte.montoNumero,
        metodo_pago: parte.metodo,
        cuenta_destino:
          parte.metodo === "TRANSFERENCIA"
            ? parte.cuentaDestino
            : null,
        tipo: tipoPago,
        nota:
          parte.metodo === "EFECTIVO"
            ? `Pago ${tipoPago}. Efectivo aplicado ${parte.montoNumero
            }. Cliente entregó ${conCuantoPagaNum}`
            : `Pago ${tipoPago}. ${parte.metodo} por ${parte.montoNumero
            }`,
        usuario_id: usuarioId || null,
      }));

         const { data: pagosGuardados, error } = await supabase
        .from("pagos")
        .insert(pagosAInsertar)
        .select(
          `
            id,
            fecha_pago,
            monto,
            metodo_pago,
            cuenta_destino,
            tipo,
            usuario_id
          `
        );

      if (error) throw error;

      onFinalizado({
        pagos: (pagosGuardados || []) as PagoGuardado[],
        pedidoId,
        servicioId,
        clienteNombre,
        tipoPago,
        fechaPago,
        totalPagado: totalDistribuido,
        saldoAnterior: Number(pendiente || 0),
        saldoPosterior: saldoDespuesPago,
        usuarioId: usuarioId || undefined,
      });
    } catch (err: any) {
      setError(err?.message || "Error al procesar el pago.");
    } finally {
      setGuardando(false);
    }
  };

  const finalizarCortesia = async () => {
    if (!pedidoId || guardando) return;

    try {
      setGuardando(true);
      limpiarError();

      const { error: errorCortesia } =
        await supabase.rpc(
          "finalizar_pedido_cortesia",
          {
            p_pedido_id: pedidoId,
          }
        );

      if (errorCortesia) {
        throw errorCortesia;
      }

      onFinalizado();
    } catch (err: any) {
      setError(
        err?.message ||
          "No se pudo finalizar la cortesía."
      );
    } finally {
      setGuardando(false);
    }
  };

  const textoCambio = cambio >= 0 ? "CAMBIO A ENTREGAR" : "FALTA DINERO";
  const colorCambio = cambio >= 0 ? THEME.olive : THEME.danger;
  const bgCambio =
    cambio >= 0 ? "rgba(85,107,47,0.08)" : "rgba(190,18,60,0.06)";

  if (esCortesia) {
    return (
      <div style={styles.wrapper}>
        <motion.div
          style={styles.container}
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.28,
          }}
        >
          <div style={styles.headerRow}>
            <button
              type="button"
              onClick={onVolver}
              disabled={guardando}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              <span>VOLVER</span>
            </button>
          </div>

          <div style={styles.titleWrap}>
            <div style={styles.badge}>
              <Sparkles size={12} />
              CORTESÍA AUTORIZADA
            </div>

            <h1 style={styles.title}>
              Pedido de cortesía
            </h1>

            <p style={styles.subtitle}>
              Cliente:{" "}
              <strong
                style={{
                  color: THEME.gold,
                }}
              >
                {clienteNombre}
              </strong>
            </p>
          </div>

          <motion.div
            style={styles.glassCard}
            whileHover={{
              y: -4,
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.iconCircle}>
                <CheckCircle2
                  size={24}
                  color="#fff"
                />
              </div>

              <div>
                <p
                  style={
                    styles.smallLabelLight
                  }
                >
                  CORTESÍA / 100% DESCUENTO
                </p>

                <h2 style={styles.mainPrice}>
                  {formatoMoneda(0)}
                </h2>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.summaryGrid}>
              <div
                style={styles.summaryMiniCard}
              >
                <span
                  style={
                    styles.smallLabelLight
                  }
                >
                  TOTAL BRUTO
                </span>

                <span
                  style={
                    styles.summaryMiniValue
                  }
                >
                  {formatoMoneda(totalBruto)}
                </span>
              </div>

              <div
                style={styles.summaryMiniCard}
              >
                <span
                  style={
                    styles.smallLabelLight
                  }
                >
                  DESCUENTO
                </span>

                <span
                  style={{
                    ...styles.summaryMiniValue,
                    color: THEME.gold,
                  }}
                >
                  - {formatoMoneda(descuento)}
                </span>
              </div>

              <div
                style={styles.summaryMiniCard}
              >
                <span
                  style={
                    styles.smallLabelLight
                  }
                >
                  PENDIENTE
                </span>

                <span
                  style={{
                    ...styles.summaryMiniValue,
                    color: THEME.gold,
                  }}
                >
                  {formatoMoneda(0)}
                </span>
              </div>
            </div>
          </motion.div>

          <section style={styles.section}>
            <div
              style={{
                borderRadius: 18,
                padding: 20,
                background:
                  "rgba(85,107,47,0.09)",
                border:
                  "1px solid rgba(85,107,47,0.22)",
                textAlign: "center",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: THEME.olive,
                  marginBottom: 8,
                }}
              >
                No se registrará ningún pago
              </strong>

              <span
                style={{
                  color: THEME.textSoft,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                El pedido podrá continuar porque
                el descuento cubre la totalidad.
              </span>
            </div>

            {error ? (
              <div
                style={{
                  marginTop: 14,
                  color: THEME.danger,
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={finalizarCortesia}
              disabled={guardando}
              style={{
                width: "100%",
                minHeight: 58,
                marginTop: 18,
                border: "none",
                borderRadius: 17,
                background: THEME.olive,
                color: THEME.white,
                fontSize: 13,
                fontWeight: 900,
                cursor: guardando
                  ? "wait"
                  : "pointer",
                opacity: guardando
                  ? 0.7
                  : 1,
              }}
            >
              {guardando
                ? "FINALIZANDO…"
                : "FINALIZAR CORTESÍA"}
            </button>
          </section>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <motion.div
        style={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div style={styles.headerRow}>
          <button type="button" onClick={onVolver} style={styles.backButton}>
            <ArrowLeft size={16} />
            <span>VOLVER</span>
          </button>
        </div>

        <div style={styles.titleWrap}>
          <div style={styles.badge}>
            <Sparkles size={12} />
            FOTO ESTUDIO RAMÍREZ
          </div>

          <h1 style={styles.title}>Confirmar Pago</h1>

          <p style={styles.subtitle}>
            Cliente:{" "}
            <strong style={{ color: THEME.gold }}>{clienteNombre}</strong>
          </p>
        </div>

        <motion.div style={styles.glassCard} whileHover={{ y: -4 }}>
          <div style={styles.cardHeader}>
            <div style={styles.iconCircle}>
              <Receipt size={24} color="#fff" />
            </div>

            <div>
              <p style={styles.smallLabelLight}>TOTAL FINAL DEL PEDIDO</p>
              <h2 style={styles.mainPrice}>{formatoMoneda(totalFinal)}</h2>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.summaryGrid}>
            <div style={styles.summaryMiniCard}>
              <span style={styles.smallLabelLight}>TOTAL BRUTO</span>
              <span style={styles.summaryMiniValue}>
                {formatoMoneda(totalBruto)}
              </span>
            </div>

            <div style={styles.summaryMiniCard}>
              <span style={styles.smallLabelLight}>DESCUENTO</span>
              <span style={{ ...styles.summaryMiniValue, color: THEME.gold }}>
                - {formatoMoneda(descuento)}
              </span>
            </div>

            <div style={styles.summaryMiniCard}>
              <span style={styles.smallLabelLight}>PENDIENTE</span>
              <span style={{ ...styles.summaryMiniValue, color: THEME.gold }}>
                {formatoMoneda(pendiente)}
              </span>
            </div>
          </div>
        </motion.div>

        <section style={styles.section}>
          <h3 style={styles.sectionLabel}>¿CÓMO PAGA EL CLIENTE?</h3>

          <div style={styles.flexGrid}>
            {[
              {
                id: "A_CUENTA",
                label: "A cuenta",
                icon: Wallet,
                color: THEME.black,
              },
              {
                id: "LIQUIDACION",
                label: "Liquidación",
                icon: BadgeDollarSign,
                color: THEME.gold,
              },
            ].map((opt) => {
              const active = tipoPago === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const nuevoTipo = opt.id as TipoPago;

                    setTipoPago(nuevoTipo);
                    setConCuantoPaga("");

                    if (
                      nuevoTipo === "LIQUIDACION" &&
                      partesPago.length === 1
                    ) {
                      setPartesPago((prev) =>
                        prev.map((parte, index) =>
                          index === 0
                            ? {
                              ...parte,
                              monto: String(Number(pendiente || 0)),
                            }
                            : parte
                        )
                      );
                    }

                    if (
                      nuevoTipo === "A_CUENTA" &&
                      partesPago.length === 1
                    ) {
                      setPartesPago((prev) =>
                        prev.map((parte, index) =>
                          index === 0
                            ? { ...parte, monto: "" }
                            : parte
                        )
                      );
                    }

                    limpiarError();
                  }}
                  style={{
                    ...styles.optionBtn,
                    borderColor: active ? opt.color : "rgba(0,0,0,0.1)",
                    background: active ? "#fff" : "transparent",
                  }}
                >
                  <div
                    style={{
                      ...styles.optIcon,
                      background: active ? opt.color : "#999",
                    }}
                  >
                    <opt.icon size={18} color="#fff" />
                  </div>

                  <span
                    style={{
                      fontWeight: 800,
                      color: active ? opt.color : THEME.textSoft,
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
          <h3 style={{ ...styles.sectionLabel, marginTop: 24 }}>
            DISTRIBUCIÓN DEL PAGO
          </h3>

          <div>
            {partesPago.map((parte, index) => (
              <div key={parte.id} style={styles.partePagoCard}>
                <div style={styles.partePagoHeader}>
                  <div style={styles.partePagoTitle}>
                    MÉTODO {index + 1}
                  </div>

                  {partesPago.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarPartePago(parte.id)}
                      style={styles.deleteParteBtn}
                      aria-label={`Eliminar método ${index + 1}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>

                <div style={styles.flexGrid}>
                  {[
                    {
                      id: "EFECTIVO",
                      label: "Efectivo",
                      icon: Banknote,
                      color: "#2e7d32",
                    },
                    {
                      id: "TRANSFERENCIA",
                      label: "Transferencia",
                      icon: Receipt,
                      color: "#1565c0",
                    },
                    {
                      id: "TARJETA",
                      label: "Tarjeta",
                      icon: CreditCard,
                      color: "#7b1fa2",
                    },
                  ].map((opt) => {
                    const active = parte.metodo === opt.id;

                    const usadoEnOtraParte = partesPago.some(
                      (otraParte) =>
                        otraParte.id !== parte.id &&
                        otraParte.metodo === opt.id
                    );

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={usadoEnOtraParte}
                        onClick={() =>
                          actualizarPartePago(parte.id, {
                            metodo: opt.id as MetodoPago,
                            cuentaDestino:
                              opt.id === "TRANSFERENCIA"
                                ? parte.cuentaDestino
                                : "",
                          })
                        }
                        style={{
                          ...styles.optionBtn,
                          borderColor: active
                            ? opt.color
                            : "rgba(0,0,0,0.1)",
                          background: active ? "#fff" : "transparent",
                          opacity: usadoEnOtraParte ? 0.35 : 1,
                          cursor: usadoEnOtraParte
                            ? "not-allowed"
                            : "pointer",
                        }}
                      >
                        <div
                          style={{
                            ...styles.optIcon,
                            background: active ? opt.color : "#999",
                          }}
                        >
                          <opt.icon size={18} color="#fff" />
                        </div>

                        <span
                          style={{
                            fontWeight: 800,
                            color: active
                              ? opt.color
                              : THEME.textSoft,
                          }}
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={styles.parteMontoWrap}>
                  <label style={styles.smallLabel}>
                    MONTO CON ESTE MÉTODO
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    style={styles.input}
                    value={parte.monto}
                    onChange={(e) =>
                      actualizarPartePago(parte.id, {
                        monto: limpiarMontoInput(e.target.value),
                      })
                    }
                    placeholder="$ 0.00"
                    autoComplete="off"
                  />
                </div>

                {parte.metodo === "TRANSFERENCIA" && (
                  <div style={{ marginTop: 18 }}>
                    <h3 style={styles.sectionLabel}>
                      ¿A QUIÉN TRANSFIRIERON?
                    </h3>

                    <div style={styles.flexGrid}>
                      {cuentasTransferencia.map((cuenta) => {
                        const active =
                          parte.cuentaDestino === cuenta.nombre;

                        return (
                          <button
                            key={cuenta.id}
                            type="button"
                            onClick={() =>
                              actualizarPartePago(parte.id, {
                                cuentaDestino: cuenta.nombre,
                              })
                            }
                            style={{
                              ...styles.optionBtn,
                              borderColor: active
                                ? THEME.gold
                                : "rgba(0,0,0,0.1)",
                              background: active
                                ? "#fff"
                                : "transparent",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 900,
                                color: active
                                  ? THEME.gold
                                  : THEME.textSoft,
                              }}
                            >
                              {cuenta.nombre}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {partesPago.length < 3 && (
            <button
              type="button"
              onClick={agregarPartePago}
              style={styles.addMetodoBtn}
            >
              <Plus size={18} />
              AGREGAR OTRO MÉTODO
            </button>
          )}
        </section>

        <div style={styles.paymentSummary}>
          <div style={styles.paymentSummaryRow}>
            <span>Saldo pendiente</span>
            <strong>{formatoMoneda(pendiente)}</strong>
          </div>

          <div style={styles.paymentSummaryRow}>
            <span>Total distribuido</span>
            <strong>{formatoMoneda(totalDistribuido)}</strong>
          </div>

          <div style={styles.paymentSummaryRow}>
            <span>
              {tipoPago === "LIQUIDACION"
                ? "Falta por distribuir"
                : "Saldo después del abono"}
            </span>
            <strong
              style={{
                color:
                  tipoPago === "LIQUIDACION" &&
                    Math.abs(diferenciaLiquidacion) > 0.009
                    ? THEME.danger
                    : THEME.olive,
              }}
            >
              {formatoMoneda(
                tipoPago === "LIQUIDACION"
                  ? Math.abs(diferenciaLiquidacion)
                  : saldoDespuesPago
              )}
            </strong>
          </div>
        </div>

        {incluyeEfectivo && (
          <div style={styles.cashReceivedBox}>
            <label style={styles.smallLabel}>EFECTIVO RECIBIDO</label>

            <div style={styles.inputWrapper}>
              <Banknote size={20} color={THEME.gold} />

              <input
                type="text"
                inputMode="decimal"
                style={styles.inputClean}
                value={conCuantoPaga}
                onChange={(e) => {
                  setConCuantoPaga(
                    limpiarMontoInput(e.target.value)
                  );
                  limpiarError();
                }}
                placeholder="0.00"
              />
            </div>

            <div style={styles.cashAppliedText}>
              Efectivo aplicado: {formatoMoneda(totalEfectivo)}
            </div>
          </div>
        )}

        <AnimatePresence>
          {incluyeEfectivo && conCuantoPaga !== "" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                boxShadow:
                  cambio >= 0
                    ? [
                      "0 0 0 rgba(85,107,47,0.10)",
                      "0 0 0 rgba(85,107,47,0.22)",
                      "0 0 0 rgba(85,107,47,0.10)",
                    ]
                    : "none",
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                boxShadow:
                  cambio >= 0 ? { repeat: Infinity, duration: 1.4 } : undefined,
              }}
              style={{
                ...styles.changeHero,
                borderColor: colorCambio,
                background: bgCambio,
              }}
            >
              <p style={{ ...styles.changeLabel, color: colorCambio }}>
                {textoCambio}
              </p>

              <motion.h2
                style={{ ...styles.changeText, color: colorCambio }}
                animate={cambio >= 0 ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={
                  cambio >= 0
                    ? { repeat: Infinity, duration: 1.2 }
                    : { duration: 0.2 }
                }
              >
                {formatoMoneda(Math.abs(cambio))}
              </motion.h2>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? <p style={styles.errorText}>{error}</p> : null}

        <div style={styles.footer}>
          <button type="button" onClick={onVolver} style={styles.btnCancel}>
            REGRESAR
          </button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={guardarPago}
            disabled={guardando || !pagoValido}
            style={{
              ...styles.btnConfirm,
              opacity: guardando || !pagoValido ? 0.5 : 1,
              cursor:
                guardando || !pagoValido
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {guardando ? "PROCESANDO..." : "CONFIRMAR REGISTRO"}
            <CheckCircle2 size={20} />

            <motion.div
              style={styles.shimmer}
              animate={{ x: ["-100%", "220%"] }}
              transition={{ repeat: Infinity, duration: 2.1, ease: "linear" }}
            />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    width: "100%",
    minHeight: "100vh",
    background: THEME.bg,
    padding: "96px 16px 16px 16px",
    boxSizing: "border-box",
    position: "relative",
  },
  container: {
    width: "100%",
    maxWidth: "640px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },
  headerRow: {
    marginBottom: "18px",
    position: "relative",
    zIndex: 50,
  },
  backButton: {
    background: "transparent",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 900,
    color: THEME.textSoft,
    padding: "4px 0",
    position: "relative",
    zIndex: 60,
    pointerEvents: "auto",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: THEME.black,
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 900,
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  titleWrap: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "clamp(30px, 8vw, 42px)",
    margin: 0,
    fontWeight: 900,
    letterSpacing: "-1.2px",
    color: THEME.black,
    lineHeight: 1,
  },
  subtitle: {
    fontSize: "16px",
    color: THEME.textSoft,
    marginTop: "10px",
    lineHeight: 1.4,
  },

  glassCard: {
    background: THEME.black,
    padding: "22px",
    borderRadius: "24px",
    color: "#fff",
    boxShadow: "0 20px 40px rgba(0,0,0,0.16)",
    marginBottom: "24px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  iconCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "15px",
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mainPrice: {
    fontSize: "clamp(30px, 7vw, 42px)",
    margin: 0,
    fontWeight: 900,
    color: THEME.white,
    lineHeight: 1,
  },
  smallLabel: {
    fontSize: "10px",
    fontWeight: 900,
    color: THEME.textSoft,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  smallLabelLight: {
    fontSize: "10px",
    fontWeight: 900,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    margin: "18px 0",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
  },
  summaryMiniCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  summaryMiniValue: {
    fontSize: "18px",
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.2,
    wordBreak: "break-word",
  },

  section: {
    marginBottom: "22px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 900,
    color: THEME.gold,
    marginBottom: "14px",
    letterSpacing: "1px",
  },
  flexGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "10px",
    padding: "16px",
    borderRadius: "18px",
    border: "2px solid",
    cursor: "pointer",
    transition: "0.2s",
    minHeight: "64px",
  },
  optIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  partePagoCard: {
    background: "#fff",
    border: `1px solid ${THEME.border}`,
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "14px",
    boxShadow: "0 10px 24px rgba(18,17,15,0.05)",
  },
  partePagoHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
  },
  partePagoTitle: {
    fontSize: "11px",
    fontWeight: 900,
    color: THEME.gold,
    letterSpacing: "1px",
  },
  deleteParteBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    border: "1px solid rgba(190,18,60,0.18)",
    background: "rgba(190,18,60,0.06)",
    color: THEME.danger,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  parteMontoWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "16px",
  },
  addMetodoBtn: {
    width: "100%",
    minHeight: "52px",
    borderRadius: "18px",
    border: `2px dashed ${THEME.gold}70`,
    background: "rgba(184,159,84,0.06)",
    color: THEME.olive,
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    marginTop: "4px",
  },

  paymentSummary: {
    background: THEME.black,
    color: "#fff",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "0 14px 30px rgba(18,17,15,0.12)",
  },
  paymentSummaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    fontSize: "13px",
    lineHeight: 1.4,
  },
  cashReceivedBox: {
    background: "#fff",
    border: `1px solid ${THEME.border}`,
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  cashAppliedText: {
    fontSize: "12px",
    fontWeight: 800,
    color: THEME.olive,
    textAlign: "right",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },
  input: {
    padding: "16px",
    borderRadius: "16px",
    border: "2px solid rgba(0,0,0,0.1)",
    fontSize: "18px",
    fontWeight: 700,
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  readOnlyInput: {
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.05)",
    fontSize: "18px",
    fontWeight: 800,
    color: THEME.textSoft,
    width: "100%",
    boxSizing: "border-box",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: `2px solid ${THEME.gold}40`,
    borderRadius: "16px",
    padding: "0 14px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  inputClean: {
    border: "none",
    padding: "16px 0",
    fontSize: "18px",
    fontWeight: 700,
    outline: "none",
    width: "100%",
    background: "transparent",
  },

  changeHero: {
    padding: "22px 18px",
    borderRadius: "24px",
    border: "2px dashed",
    textAlign: "center",
    marginBottom: "22px",
  },
  changeLabel: {
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  changeText: {
    fontSize: "clamp(36px, 10vw, 52px)",
    fontWeight: 900,
    margin: 0,
    lineHeight: 1,
    wordBreak: "break-word",
  },
  errorText: {
    color: THEME.danger,
    textAlign: "center",
    fontWeight: 800,
    fontSize: "14px",
    marginBottom: "15px",
  },

  footer: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: "12px",
    marginTop: "10px",
    alignItems: "stretch",
  },
  btnCancel: {
    width: "100%",
    padding: "18px 16px",
    background: "transparent",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "18px",
    fontWeight: 800,
    color: THEME.textSoft,
    cursor: "pointer",
    minHeight: "58px",
  },
  btnConfirm: {
    width: "100%",
    minWidth: 0,
    padding: "18px 16px",
    background: THEME.olive,
    color: "#fff",
    borderRadius: "20px",
    border: "none",
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    position: "relative",
    overflow: "hidden",
    minHeight: "58px",
    boxShadow: "0 12px 30px rgba(85,107,47,0.28)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "30%",
    height: "100%",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
    transform: "skewX(-25deg)",
    pointerEvents: "none",
  },
};

export default Vista4Pago;
