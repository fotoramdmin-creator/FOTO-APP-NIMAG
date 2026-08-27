import React from "react";
import {
  ArrowRight,
  Clock3,
  PackageOpen,
    Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  PedidoBorrador,
} from "./pedidosBorradores";

type Props = {
  borradores: PedidoBorrador[];
  procesandoId: string | null;
  onContinuar: (
    borrador: PedidoBorrador
  ) => void;
  onNuevo: () => void;
  onCancelar?: (
    borrador: PedidoBorrador
  ) => void;
  onCerrar: () => void;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const fechaUltimoCambio = (fecha: string) =>
  new Date(fecha).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export default function PedidosPendientesModal({
  borradores,
  procesandoId,
   onContinuar,
  onNuevo,
  onCancelar,
  onCerrar,
}: Props) {
  return (
    <div style={styles.overlay}>
      <section style={styles.modal}>
        <header style={styles.header}>
          <div style={styles.iconBox}>
            <PackageOpen size={25} />
          </div>

          <div style={styles.headerText}>
            <span style={styles.eyebrow}>
              CAPTURAS RECUPERABLES
            </span>

            <h2 style={styles.title}>
              Tienes{" "}
              {borradores.length === 1
                ? "un pedido inconcluso"
                : `${borradores.length} pedidos inconclusos`}
            </h2>

            <p style={styles.subtitle}>
              Puedes continuar exactamente donde se
              quedó, sin crear otro registro.
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={procesandoId !== null}
            style={styles.closeButton}
            aria-label="Revisar después"
          >
            <X size={19} />
          </button>
        </header>

        <div style={styles.list}>
          {borradores.map((borrador) => {
            const nombre =
              borrador.datos_cliente
                ?.cliente_nombre?.trim() ||
              "Pedido sin nombre";

            const tienePedido =
              Boolean(borrador.pedido_id);

            const cargando =
              procesandoId === borrador.id;

            return (
              <article
                key={borrador.id}
                style={styles.card}
              >
                <div style={styles.cardTop}>
                  <div>
                    <span style={styles.status}>
                      {tienePedido
                        ? "PENDIENTE DE PAGO"
                        : "CAPTURA INCONCLUSA"}
                    </span>

                    <h3 style={styles.clientName}>
                      {nombre}
                    </h3>
                  </div>

                  <strong style={styles.total}>
                    {money(
                      borrador.total_estimado
                    )}
                  </strong>
                </div>

                <div style={styles.meta}>
                  <span style={styles.metaItem}>
                    <Clock3 size={14} />
                    Último cambio:{" "}
                    {fechaUltimoCambio(
                      borrador.updated_at
                    )}
                  </span>

                  {borrador.creado_por_nombre ? (
                    <span style={styles.metaItem}>
                      <User size={14} />
                      {
                        borrador.creado_por_nombre
                      }
                    </span>
                  ) : null}
                </div>

                <div style={styles.products}>
                  {borrador.carrito.length}{" "}
                  {borrador.carrito.length === 1
                    ? "producto"
                    : "productos"}
                  {" · "}
                  Paso:{" "}
                  {tienePedido
                    ? "Pago"
                    : borrador.paso}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onContinuar(borrador)
                  }
                  disabled={procesandoId !== null}
                  style={{
                    ...styles.continueButton,
                    opacity:
                      procesandoId !== null &&
                      !cargando
                        ? 0.55
                        : 1,
                  }}
                >
                  {cargando
                    ? "RECUPERANDO…"
                    : tienePedido
                      ? "CONTINUAR AL PAGO"
                      : "CONTINUAR PEDIDO"}

                  {!cargando ? (
                    <ArrowRight size={17} />
                  ) : null}
                                </button>

                {onCancelar ? (
                  <button
                    type="button"
                    onClick={() =>
                      onCancelar(borrador)
                    }
                    disabled={procesandoId !== null}
                    style={{
                      width: "100%",
                      minHeight: 38,
                      marginTop: 8,
                      borderRadius: 12,
                      border:
                        "1px solid rgba(180,35,24,0.24)",
                      background: "#fff5f4",
                      color: "#a61b12",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 0.5,
                      cursor:
                        procesandoId !== null
                          ? "wait"
                          : "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                    CANCELAR PEDIDO
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>

        <footer style={styles.footer}>
          <button
            type="button"
            onClick={onNuevo}
            disabled={procesandoId !== null}
            style={styles.newButton}
          >
            <Plus size={17} />
            COMENZAR OTRO PEDIDO
          </button>

          <button
            type="button"
            onClick={onCerrar}
            disabled={procesandoId !== null}
            style={styles.laterButton}
          >
            Revisar después
          </button>
        </footer>
      </section>
    </div>
  );
}

const styles: {
  [key: string]: React.CSSProperties;
} = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    background: "rgba(18,17,15,0.58)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    boxSizing: "border-box",
  },
  modal: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    borderRadius: 28,
    background:
      "linear-gradient(180deg, #fffdf8 0%, #f7f3eb 100%)",
    border:
      "1px solid rgba(184,159,84,0.30)",
    boxShadow:
      "0 30px 90px rgba(18,17,15,0.28)",
    padding: 22,
    boxSizing: "border-box",
    fontFamily: "'Montserrat', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: 13,
    marginBottom: 18,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: "#36412e",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    display: "block",
    color: "#b89f54",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  title: {
    margin: 0,
    color: "#1c1a15",
    fontSize: 22,
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "7px 0 0",
    color: "#777168",
    fontSize: 12,
    lineHeight: 1.5,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fff",
    color: "#777168",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  list: {
    display: "grid",
    gap: 11,
  },
  card: {
    borderRadius: 20,
    border:
      "1px solid rgba(184,159,84,0.24)",
    background: "#fff",
    padding: 16,
    boxShadow:
      "0 10px 25px rgba(61,51,39,0.06)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  status: {
    display: "inline-block",
    borderRadius: 999,
    background: "#f8f0dc",
    color: "#806527",
    padding: "5px 8px",
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: 0.8,
  },
  clientName: {
    margin: "8px 0 0",
    color: "#1c1a15",
    fontSize: 18,
    textTransform: "uppercase",
  },
  total: {
    color: "#237a4b",
    fontSize: 18,
    whiteSpace: "nowrap",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px 14px",
    marginTop: 12,
    color: "#777168",
  },
  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    fontWeight: 700,
  },
  products: {
    marginTop: 10,
    borderRadius: 11,
    background: "#f7f4ee",
    color: "#555047",
    padding: "9px 11px",
    fontSize: 11,
    fontWeight: 700,
  },
  continueButton: {
    width: "100%",
    minHeight: 45,
    marginTop: 12,
    border: "none",
    borderRadius: 14,
    background: "#36412e",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  footer: {
    display: "grid",
    gap: 9,
    marginTop: 16,
  },
  newButton: {
    minHeight: 46,
    borderRadius: 14,
    border:
      "1px solid rgba(184,159,84,0.38)",
    background: "#f8f0dc",
    color: "#806527",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  laterButton: {
    minHeight: 38,
    border: "none",
    background: "transparent",
    color: "#777168",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
};