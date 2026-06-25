import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Sparkles,
  Hash,
  Layers,
  Palette,
  FileText,
  Banknote,
  PlusCircle,
} from "lucide-react";

type ItemManual = {
  id: number | string;
  tamano: string;
  cantidad: number;
  tipo?: string;
  papel?: string;
  especificaciones?: string;
  total?: number;
  esManual?: boolean;
  esUrgente?: boolean;
};

type Props = {
  onBack: () => void;
  onAgregar: (item: ItemManual) => void;
  itemEditando?: ItemManual | null;
};

const THEME = {
  bg: "#F4F1EA",
  black: "#12110F",
  gold: "#b89f54",
  olive: "#2e4d38",
  white: "#FFFFFF",
  soft: "#747169",
  danger: "#be123c",
};

export default function PedidoEspecial({
  onBack,
  onAgregar,
  itemEditando,
}: Props) {
  const [tamano, setTamano] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [tipo, setTipo] = useState("COLOR");
  const [papel, setPapel] = useState("");
  const [precio, setPrecio] = useState("");
  const [especificaciones, setEspecificaciones] = useState("");
  const [esUrgente, setEsUrgente] = useState(false);
  useEffect(() => {
    if (!itemEditando) return;

    setTamano(itemEditando.tamano || "");
    setCantidad(String(itemEditando.cantidad || 1));
    setTipo(itemEditando.tipo || "COLOR");
    setPapel(itemEditando.papel || "");
    setPrecio(String(itemEditando.total || ""));
    setEspecificaciones(itemEditando.especificaciones || "");
    setEsUrgente(Boolean(itemEditando.esUrgente));
  }, [itemEditando]);
  const totalCalculado = useMemo(() => {
    const p = Number(precio || 0);

    if (Number.isNaN(p)) return 0;

    return p;
  }, [precio]);

  const agregarPedidoEspecial = () => {
    const cantidadNum = Number(cantidad);
    const precioNum = Number(precio);

    if (!tamano.trim()) {
      alert("Escribe el tamaño o descripción del trabajo especial");
      return;
    }

    if (!cantidadNum || cantidadNum <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    if (!precioNum || precioNum <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    const item: ItemManual = {
      id: itemEditando?.id || `manual-${Date.now()}`,
      tamano: tamano.trim().toUpperCase(),
      cantidad: cantidadNum,
      tipo: tipo.trim().toUpperCase(),
      papel: papel.trim() ? papel.trim().toUpperCase() : undefined,
      especificaciones: especificaciones.trim()
        ? especificaciones.trim().toUpperCase()
        : "PEDIDO ESPECIAL",
      total: totalCalculado,
      esManual: true,
      esUrgente,
    };

    onAgregar(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      style={styles.container}
    >
      <button type="button" onClick={onBack} style={styles.backBtn}>
        <ChevronLeft size={20} />
        VOLVER
      </button>

      <header style={styles.header}>
        <div style={styles.iconHero}>
          <Sparkles size={30} />
        </div>

        <div>
          <p style={styles.kicker}>RENGLÓN LIBRE</p>
          <h1 style={styles.title}>Pedido especial</h1>
          <p style={styles.subtitle}>
            Captura un trabajo que no existe en paquetes guardados.
          </p>
        </div>
      </header>

      <section style={styles.card}>
        <div style={styles.sectionTitle}>
          <Layers size={18} color={THEME.gold} />
          Datos del trabajo
        </div>

        <div style={styles.grid}>
          <Field
            label="Tamaño o descripción"
            icon={<Hash size={16} color={THEME.gold} />}
            value={tamano}
            onChange={(v) => setTamano(v.toUpperCase())}
            placeholder="Ej. 8X10 ESPECIAL / RESTAURACIÓN"
          />

          <Field
            label="Cantidad"
            icon={<Layers size={16} color={THEME.gold} />}
            value={cantidad}
            onChange={setCantidad}
            type="number"
            inputMode="numeric"
            placeholder="1"
          />
        </div>

        <div style={styles.tipoBox}>
          <button
            type="button"
            onClick={() => setTipo("COLOR")}
            style={{
              ...styles.tipoBtn,
              background: tipo === "COLOR" ? THEME.black : THEME.white,
              color: tipo === "COLOR" ? THEME.white : THEME.black,
            }}
          >
            <Palette size={16} />
            COLOR
          </button>

          <button
            type="button"
            onClick={() => setTipo("B/N")}
            style={{
              ...styles.tipoBtn,
              background: tipo === "B/N" ? THEME.black : THEME.white,
              color: tipo === "B/N" ? THEME.white : THEME.black,
            }}
          >
            B/N
          </button>
        </div>
        <button
          type="button"
          onClick={() => setEsUrgente((prev) => !prev)}
          style={{
            ...styles.urgentBtn,
            background: esUrgente ? THEME.danger : THEME.white,
            color: esUrgente ? THEME.white : THEME.black,
            borderColor: esUrgente ? THEME.danger : "rgba(0,0,0,0.08)",
          }}
        >
          ⚡ Urgente
        </button>

        <div style={styles.grid}>
          <Field
            label="Papel"
            icon={<FileText size={16} color={THEME.gold} />}
            value={papel}
            onChange={(v) => setPapel(v.toUpperCase())}
            placeholder="MATE / BRILLANTE / KENFOR"
          />

          <Field
            label="Precio total"
            icon={<Banknote size={16} color={THEME.gold} />}
            value={precio}
            onChange={setPrecio}
            type="number"
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        <div style={styles.textareaWrap}>
          <label style={styles.label}>
            <FileText size={16} color={THEME.gold} />
            Especificaciones
          </label>

          <textarea
            value={especificaciones}
            onChange={(e) => setEspecificaciones(e.target.value.toUpperCase())}
            placeholder="Ej. fondo blanco, retoque extra, entregar digital, etc."
            style={styles.textarea}
          />
        </div>
      </section>

      <section style={styles.totalCard}>
        <span style={styles.totalLabel}>Total del renglón</span>
        <strong style={styles.totalValue}>${totalCalculado}</strong>
      </section>

      <div style={styles.bottomBar}>
        <button type="button" onClick={onBack} style={styles.cancelBtn}>
          Cancelar
        </button>

        <button
          type="button"
          onClick={agregarPedidoEspecial}
          style={styles.addBtn}
        >
          <PlusCircle size={19} />
          Agregar al pedido
        </button>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}) {
  return (
    <div>
      <label style={styles.label}>
        {icon}
        {label}
      </label>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "820px",
    margin: "0 auto",
    padding: "20px 20px 110px",
    minHeight: "100vh",
    background: THEME.bg,
  },
  backBtn: {
    border: "none",
    background: "transparent",
    color: THEME.soft,
    fontWeight: 900,
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    marginBottom: 18,
    padding: "14px 18px",
    minHeight: 44,
    borderRadius: 14,
    position: "relative",
    zIndex: 100,
  },
  header: {
    background: THEME.black,
    color: THEME.white,
    borderRadius: 28,
    padding: 22,
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
    boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
  },
  iconHero: {
    width: 62,
    height: 62,
    borderRadius: 22,
    background: THEME.gold,
    color: THEME.black,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 900,
    color: THEME.gold,
    letterSpacing: 2,
  },
  title: {
    margin: "4px 0",
    fontSize: "clamp(30px, 7vw, 50px)",
    fontWeight: 900,
    lineHeight: 0.95,
    textTransform: "uppercase",
  },
  subtitle: {
    margin: 0,
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: 700,
  },
  card: {
    background: THEME.white,
    borderRadius: 24,
    padding: 18,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 6px 12px rgba(0,0,0,0.03)",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 900,
    color: THEME.black,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 14,
    marginBottom: 14,
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 11,
    fontWeight: 900,
    color: THEME.soft,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 7,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fbfaf7",
    borderRadius: 15,
    padding: "14px 15px",
    fontSize: 16,
    fontWeight: 800,
    color: THEME.black,
    outline: "none",
  },
  tipoBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 14,
  },
  tipoBtn: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: "15px 14px",
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "0.2s",
  },
  textareaWrap: {
    marginTop: 4,
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    boxSizing: "border-box",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fbfaf7",
    borderRadius: 15,
    padding: 15,
    fontSize: 15,
    fontWeight: 700,
    color: THEME.black,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  totalCard: {
    marginTop: 16,
    background: "#faf8f2",
    borderRadius: 22,
    padding: 18,
    border: "1px dashed rgba(0,0,0,0.15)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  totalLabel: {
    color: THEME.soft,
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 900,
    color: THEME.black,
  },
  urgentBtn: {
    width: "100%",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: "15px 14px",
    fontWeight: 900,
    cursor: "pointer",
    marginBottom: 14,
    transition: "0.2s",
  },
  bottomBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(244,241,234,0.96)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(0,0,0,0.08)",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "center",
    gap: 10,
    zIndex: 50,
  },
  cancelBtn: {
    width: "min(170px, 35%)",
    border: "none",
    borderRadius: 16,
    padding: "15px",
    background: THEME.white,
    color: THEME.black,
    fontWeight: 900,
    cursor: "pointer",
  },
  addBtn: {
    width: "min(430px, 65%)",
    border: "none",
    borderRadius: 16,
    padding: "15px",
    background: THEME.black,
    color: THEME.white,
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};
