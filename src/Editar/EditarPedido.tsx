import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { compartirTicketPdf } from "../Ticket/generarTicket";
import { enviarWhatsApp } from "../Ticket/enviarWhatsApp";
import {
  Search,
  User,
  Phone,
  Camera,
  Save,
  MessageCircle,
  AlertTriangle,
  Printer,
} from "lucide-react";

type Props = {
  perfil: any;
};

export default function EditarPedido({ perfil }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nToma, setNToma] = useState("");
  const [motivo, setMotivo] = useState("");

  const cargarPedidos = async () => {
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        `
        id,
        cliente_nombre,
        cliente_telefono,
        fecha_entrega,
        horario_entrega,
        urgente,
        total_final,
        total_bruto,
        anticipo,
        liquidacion,
        total_pagado,
        resta,
        pagado,
        editado,
        fecha_creacion,
        detalles_pedido (
          id,
          n_toma,
          tamano,
          cantidad,
          tipo,
          papel,
          especificaciones,
          subtotal
        )
      `
      )
      .order("fecha_creacion", { ascending: false })
      .limit(50);

    if (!error && data) setPedidos(data);
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return [];

    const texto = busqueda.toLowerCase();

    return pedidos.filter((p) => {
      const nombreCliente = (p.cliente_nombre || "").toLowerCase();
      const telefonoCliente = String(p.cliente_telefono || "").toLowerCase();
      const tomas = (p.detalles_pedido || [])
        .map((d: any) => d.n_toma || "")
        .join(" ")
        .toLowerCase();

      return (
        nombreCliente.includes(texto) ||
        telefonoCliente.includes(texto) ||
        tomas.includes(texto)
      );
    });
  }, [busqueda, pedidos]);

  const abrirPedido = (pedido: any) => {
    setPedidoSeleccionado(pedido);
    setNombre(pedido.cliente_nombre || "");
    setTelefono(pedido.cliente_telefono || "");
    setNToma(pedido.detalles_pedido?.[0]?.n_toma || "");
  };

  const guardarCambios = async () => {
    if (!pedidoSeleccionado) return;

    try {
      const nombreAnterior = pedidoSeleccionado.cliente_nombre || "";
      const telefonoAnterior = pedidoSeleccionado.cliente_telefono || "";
      const tomaAnterior =
        pedidoSeleccionado.detalles_pedido?.[0]?.n_toma || "";

      await supabase
        .from("pedidos")
        .update({
          cliente_nombre: nombre,
          cliente_telefono: telefono,
          editado: true,
          ultima_edicion: new Date().toISOString(),
        })
        .eq("id", pedidoSeleccionado.id);

      if (pedidoSeleccionado.detalles_pedido?.[0]?.id) {
        await supabase
          .from("detalles_pedido")
          .update({ n_toma: nToma })
          .eq("id", pedidoSeleccionado.detalles_pedido[0].id);
      }

      const cambios = [
        { campo: "NOMBRE", anterior: nombreAnterior, nuevo: nombre },
        { campo: "TELÉFONO", anterior: telefonoAnterior, nuevo: telefono },
        { campo: "N. TOMA", anterior: tomaAnterior, nuevo: nToma },
      ];

      for (const cambio of cambios) {
        if (cambio.anterior !== cambio.nuevo) {
          await supabase.from("historial_ediciones").insert({
            pedido_id: pedidoSeleccionado.id,
            campo_editado: cambio.campo,
            valor_anterior: cambio.anterior,
            valor_nuevo: cambio.nuevo,
            editado_por: perfil?.id || null,
            motivo,
          });
        }
      }

      alert("Pedido actualizado correctamente");
      cargarPedidos();
    } catch (error) {
      console.error(error);
      alert("Error actualizando pedido");
    }
  };

  const pedidoConDatosActualizados = () => {
    if (!pedidoSeleccionado) return null;

    return {
      ...pedidoSeleccionado,
      cliente_nombre: nombre,
      cliente_telefono: telefono,
      detalles_pedido: (pedidoSeleccionado.detalles_pedido || []).map(
        (d: any, index: number) => ({
          ...d,
          n_toma: index === 0 ? nToma : d.n_toma,
        })
      ),
    };
  };

  const reenviarWhats = () => {
    const pedidoParaWhats = pedidoConDatosActualizados();
    if (!pedidoParaWhats) return;

    enviarWhatsApp(pedidoParaWhats);
  };

  const compartirTicket = async () => {
    const pedidoParaTicket = pedidoConDatosActualizados();
    if (!pedidoParaTicket) return;

    await compartirTicketPdf(pedidoParaTicket);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Editar Pedido</h1>
        <p style={styles.sub}>Correcciones y reenvío de ticket</p>
      </div>

      <div style={styles.searchBox}>
        <Search size={18} />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar nombre, teléfono o N. de toma..."
          style={styles.input}
        />
      </div>

      <div style={styles.list}>
        {resultados.map((pedido) => (
          <motion.div
            whileHover={{ scale: 1.01 }}
            key={pedido.id}
            style={styles.card}
            onClick={() => abrirPedido(pedido)}
          >
            <div>
              <h3 style={styles.cardTitle}>{pedido.cliente_nombre}</h3>
              <p style={styles.cardText}>
                {pedido.detalles_pedido?.[0]?.n_toma || "SIN TOMA"}
              </p>
            </div>

            {pedido.editado && (
              <div style={styles.badge}>
                <AlertTriangle size={14} />
                EDITADO
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {pedidoSeleccionado && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.editor}
          >
            <h2 style={styles.editorTitle}>Editar información</h2>

            <div style={styles.field}>
              <User size={16} />
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <Phone size={16} />
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <Camera size={16} />
              <input
                value={nToma}
                onChange={(e) => setNToma(e.target.value.toUpperCase())}
                placeholder="N. de toma"
                style={styles.input}
              />
            </div>

            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo de corrección..."
              style={styles.textarea}
            />

            <div style={styles.actions}>
              <button onClick={guardarCambios} style={styles.saveBtn}>
                <Save size={16} />
                Guardar cambios
              </button>

              <button onClick={reenviarWhats} style={styles.whatsBtn}>
                <MessageCircle size={16} />
                Reenviar WhatsApp
              </button>

              <button onClick={compartirTicket} style={styles.ticketBtn}>
                <Printer size={16} />
                Compartir Ticket
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#f5f2eb",
    padding: window.innerWidth < 768 ? "18px" : "30px",
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: "border-box",
  },

  header: {
    marginBottom: "20px",
  },

  title: {
    fontSize: window.innerWidth < 768 ? "32px" : "42px",
    margin: 0,
    color: "#111",
    fontWeight: 800,
    letterSpacing: "-1px",
  },

  sub: {
    color: "#666",
    marginTop: "8px",
    fontSize: "15px",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fff",
    padding: window.innerWidth < 768 ? "14px 16px" : "16px",
    borderRadius: "18px",
    marginBottom: "20px",
    maxWidth: "900px",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    color: "#111",
    minWidth: 0,
  },

  list: {
    display: "grid",
    gap: "12px",
    maxWidth: "900px",
  },

  card: {
    background: "#111",
    color: "#fff",
    padding: "18px",
    borderRadius: "22px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
  },

  cardTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
  },

  cardText: {
    margin: "4px 0 0 0",
    opacity: 0.7,
    fontSize: "14px",
  },

  badge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#ffcc00",
    color: "#111",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    flexShrink: 0,
  },

  editor: {
    marginTop: "30px",
    background: "#fff",
    borderRadius: "28px",
    padding: window.innerWidth < 768 ? "18px" : "24px",
    maxWidth: "900px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
    boxSizing: "border-box",
  },

  editorTitle: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: window.innerWidth < 768 ? "24px" : "30px",
    color: "#111",
  },

  field: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f3f3f3",
    padding: "14px",
    borderRadius: "16px",
    marginBottom: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    borderRadius: "16px",
    border: "none",
    padding: "16px",
    background: "#f3f3f3",
    resize: "none",
    marginTop: "10px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "'Montserrat', sans-serif",
  },

  actions: {
    display: "flex",
    flexDirection: window.innerWidth < 768 ? "column" : "row",
    gap: "12px",
    marginTop: "20px",
  },

  saveBtn: {
    flex: 1,
    width: "100%",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
  },

  whatsBtn: {
    flex: 1,
    width: "100%",
    background: "#25D366",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
  },

  ticketBtn: {
    flex: 1,
    width: "100%",
    background: "#b89f54",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
  },
};
