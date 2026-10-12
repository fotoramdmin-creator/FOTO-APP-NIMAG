import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  HandCoins,
  ShieldAlert,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

export type ManejoPagosPapelera =
  | "SIN_PAGOS"
  | "CONSERVAR"
  | "ANULAR"
  | "DEVOLVER";

type Props = {
  tipoRegistro: "PEDIDO" | "SERVICIO";
  referencia: string;
  clienteNombre: string;
  totalPagado: number;
  procesando?: boolean;
  onCancelar: () => void;
  onConfirmar: (
    motivo: string,
    manejoPagos: ManejoPagosPapelera
  ) => void | Promise<void>;
};

const money = (valor: number) =>
  Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

export default function PapeleraConfirmacion({
  tipoRegistro,
  referencia,
  clienteNombre,
  totalPagado,
  procesando = false,
  onCancelar,
  onConfirmar,
}: Props) {
  const tienePagos = Number(totalPagado || 0) > 0.009;

  const [motivo, setMotivo] = useState("");
  const [manejoPagos, setManejoPagos] =
    useState<ManejoPagosPapelera>(
      tienePagos ? "CONSERVAR" : "SIN_PAGOS"
    );
  const [error, setError] = useState("");

  useEffect(() => {
    setMotivo("");
    setManejoPagos(
      tienePagos ? "CONSERVAR" : "SIN_PAGOS"
    );
    setError("");
  }, [tipoRegistro, referencia, tienePagos]);

  const confirmar = async () => {
    const motivoLimpio = motivo.trim();

    if (motivoLimpio.length < 5) {
      setError(
        "Escribe un motivo claro de al menos 5 caracteres."
      );
      return;
    }

    if (
      tienePagos &&
      !["CONSERVAR", "ANULAR", "DEVOLVER"].includes(
        manejoPagos
      )
    ) {
      setError("Selecciona qué sucederá con el dinero.");
      return;
    }

    setError("");
    await onConfirmar(
      motivoLimpio,
      tienePagos ? manejoPagos : "SIN_PAGOS"
    );
  };

  return (
    <div
      style={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Enviar a papelera"
      onClick={() => {
        if (!procesando) onCancelar();
      }}
    >
      <div
        style={styles.modal}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div style={styles.header}>
          <div style={styles.iconBox}>
            <Trash2 size={25} />
          </div>

          <div style={styles.headerText}>
            <div style={styles.eyebrow}>
              ACCIÓN ADMINISTRATIVA
            </div>
            <h2 style={styles.title}>
              Enviar a papelera
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            style={styles.closeButton}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div style={styles.recordCard}>
          <strong style={styles.recordType}>
            {tipoRegistro}
          </strong>
          <span style={styles.recordName}>
            {clienteNombre || "SIN NOMBRE"}
          </span>
          <span style={styles.recordReference}>
            Referencia: {referencia}
          </span>
        </div>

        <div style={styles.warning}>
          <ShieldAlert size={21} />
          <div>
            <strong>
              El registro desaparecerá de las vistas de trabajo.
            </strong>
            <p style={styles.warningText}>
              No se borrará físicamente. Permanecerá en la
              Papelera con el motivo, fecha y administrador
              responsable.
            </p>
          </div>
        </div>

        <label style={styles.label}>
          Motivo de cancelación
        </label>

        <textarea
          value={motivo}
          onChange={(evento) => {
            setMotivo(evento.target.value);
            setError("");
          }}
          disabled={procesando}
          placeholder="Ejemplo: El cliente canceló el pedido y solicitó devolución."
          style={styles.textarea}
          maxLength={500}
          autoFocus
        />

        <div style={styles.counter}>
          {motivo.trim().length}/500
        </div>

        {tienePagos ? (
          <>
            <div style={styles.paymentHeader}>
              <div>
                <div style={styles.label}>
                  Tratamiento del dinero
                </div>
                <div style={styles.paymentTotal}>
                  Registrado: {money(totalPagado)}
                </div>
              </div>

              <Wallet size={22} color="#8b6f47" />
            </div>

            <div style={styles.options}>
              <PaymentOption
                selected={manejoPagos === "CONSERVAR"}
                title="Conservar el anticipo"
                description="El negocio conserva el dinero y seguirá apareciendo como ingreso."
                color="#556b2f"
                icon={<Wallet size={19} />}
                disabled={procesando}
                onClick={() =>
                  setManejoPagos("CONSERVAR")
                }
              />

              <PaymentOption
                selected={manejoPagos === "ANULAR"}
                title="Anular pago erróneo"
                description="Úsalo solamente si el cobro nunca ocurrió. Se excluirá de Cuentas."
                color="#b7791f"
                icon={<Ban size={19} />}
                disabled={procesando}
                onClick={() =>
                  setManejoPagos("ANULAR")
                }
              />

              <PaymentOption
                selected={manejoPagos === "DEVOLVER"}
                title="Registrar devolución"
                description="El pago original permanece como entrada y se registra una salida por devolución."
                color="#b42318"
                icon={<HandCoins size={19} />}
                disabled={procesando}
                onClick={() =>
                  setManejoPagos("DEVOLVER")
                }
              />
            </div>

            {manejoPagos === "DEVOLVER" ? (
              <div style={styles.refundWarning}>
                <AlertTriangle size={18} />
                Confirma esta opción únicamente cuando el dinero
                realmente se devolverá al cliente.
              </div>
            ) : null}
          </>
        ) : (
          <div style={styles.noPayments}>
            Este registro no tiene pagos activos. No habrá
            movimientos de dinero.
          </div>
        )}

        {error ? (
          <div style={styles.error}>
            <AlertTriangle size={17} />
            {error}
          </div>
        ) : null}

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            style={styles.cancelButton}
          >
            Regresar
          </button>

          <button
            type="button"
            onClick={() => void confirmar()}
            disabled={procesando}
            style={{
              ...styles.confirmButton,
              opacity: procesando ? 0.65 : 1,
              cursor: procesando
                ? "not-allowed"
                : "pointer",
            }}
          >
            <Trash2 size={18} />
            {procesando
              ? "Procesando..."
              : "Confirmar y enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentOption({
  selected,
  title,
  description,
  color,
  icon,
  disabled,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...styles.option,
        borderColor: selected ? color : "#e8e0d4",
        background: selected ? `${color}0d` : "#fff",
        boxShadow: selected
          ? `0 0 0 2px ${color}18`
          : "none",
      }}
    >
      <span
        style={{
          ...styles.optionIcon,
          background: selected ? color : "#f3eee6",
          color: selected ? "#fff" : "#766f65",
        }}
      >
        {icon}
      </span>

      <span style={styles.optionText}>
        <strong style={styles.optionTitle}>
          {title}
        </strong>
        <span style={styles.optionDescription}>
          {description}
        </span>
      </span>

      <span
        style={{
          ...styles.radio,
          borderColor: selected ? color : "#cfc6b9",
        }}
      >
        {selected ? (
          <span
            style={{
              ...styles.radioDot,
              background: color,
            }}
          />
        ) : null}
      </span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 5000,
    background: "rgba(18, 17, 15, 0.68)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    overflowY: "auto",
  },
  modal: {
    width: "min(620px, 100%)",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    borderRadius: 28,
    background: "#fffdf8",
    border: "1px solid rgba(184,159,84,0.28)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
    padding: "24px clamp(18px, 4vw, 32px)",
    boxSizing: "border-box",
    fontFamily: "'Montserrat', sans-serif",
    color: "#1c1a15",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: "#fff1f0",
    color: "#b42318",
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
    color: "#b42318",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.13em",
  },
  title: {
    margin: "3px 0 0",
    fontSize: 27,
    lineHeight: 1.1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: "1px solid #e8e0d4",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  recordCard: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: 16,
    marginBottom: 16,
    borderRadius: 18,
    background: "#f7f3eb",
    border: "1px solid #ece4d8",
  },
  recordType: {
    color: "#8b6f47",
    fontSize: 11,
    letterSpacing: "0.1em",
  },
  recordName: {
    fontWeight: 900,
    fontSize: 18,
  },
  recordReference: {
    color: "#777168",
    fontSize: 12,
    wordBreak: "break-all",
  },
  warning: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    padding: 15,
    background: "#fff7ed",
    color: "#9a4c13",
    border: "1px solid #fed7aa",
    marginBottom: 18,
  },
  warningText: {
    margin: "5px 0 0",
    fontSize: 13,
    lineHeight: 1.5,
  },
  label: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.07em",
    color: "#5f594f",
    textTransform: "uppercase",
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    resize: "vertical",
    boxSizing: "border-box",
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    border: "1px solid #dcd2c4",
    background: "#fff",
    color: "#1c1a15",
    font: "inherit",
    outline: "none",
  },
  counter: {
    textAlign: "right",
    color: "#999187",
    fontSize: 11,
    marginTop: 4,
  },
  paymentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "17px 0 10px",
  },
  paymentTotal: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 800,
    color: "#8b6f47",
  },
  options: {
    display: "grid",
    gap: 9,
  },
  option: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "left",
    border: "1px solid",
    borderRadius: 17,
    padding: 13,
    cursor: "pointer",
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  optionTitle: {
    fontSize: 14,
  },
  optionDescription: {
    color: "#777168",
    fontSize: 12,
    lineHeight: 1.4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  refundWarning: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    background: "#fff1f0",
    color: "#b42318",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.45,
  },
  noPayments: {
    marginTop: 16,
    padding: 14,
    borderRadius: 15,
    background: "#edf8f1",
    color: "#237a4b",
    fontSize: 13,
    fontWeight: 700,
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    background: "#fff1f0",
    color: "#b42318",
    fontSize: 13,
    fontWeight: 800,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    minHeight: 50,
    borderRadius: 16,
    border: "1px solid #dcd2c4",
    background: "#fff",
    color: "#1c1a15",
    fontWeight: 800,
    cursor: "pointer",
  },
  confirmButton: {
    minHeight: 50,
    borderRadius: 16,
    border: "none",
    background: "#b42318",
    color: "#fff",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};