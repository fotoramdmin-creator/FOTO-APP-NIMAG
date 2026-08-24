import React, { useEffect, useState } from "react";
import BusquedaDetalle from "./BusquedaDetalle";
import { supabase } from "../supabaseClient";
import {
  Search,
  CalendarDays,
  Clock,
  Mail,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

type Detalle = {
  id: string;
  n_toma: string | null;
  tamano: string | null;
  cantidad: number | null;
  tipo: string | null;
};

type Pedido = {
  id: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  fecha_creacion: string | null;
  fecha_entrega: string | null;
  horario_entrega: string | null;
  urgente: boolean | null;
  pagado?: boolean | null;
  entregado?: boolean | null;
  total_final?: number | null;
  resta?: number | null;
  detalles_pedido: Detalle[];
};

const LIMITE = 20;

export default function BusquedaPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pedidoDetalleId, setPedidoDetalleId] = useState<string | null>(null);
  const [hayMas, setHayMas] = useState(true);

  const cargarPedidos = async (reset = false) => {
    try {
      setLoading(true);

      const paginaActual = reset ? 0 : pagina;
      const desde = paginaActual * LIMITE;
      const hasta = desde + LIMITE - 1;

      const texto = busqueda.trim();

      let idsPorToma: string[] = [];

      if (texto) {
        const { data: detalles } = await supabase
          .from("detalles_pedido")
          .select("pedido_id")
          .ilike("n_toma", `%${texto}%`)
          .limit(50);

        idsPorToma = Array.from(
          new Set((detalles || []).map((d: any) => d.pedido_id).filter(Boolean))
        );
      }

      let query = supabase
        .from("pedidos")
        .select(
          `
          id,
                  cliente_nombre,
          cliente_telefono,
          cliente_email,
          fecha_creacion,
          fecha_entrega,
          horario_entrega,
          urgente,
          pagado,
          entregado,
          total_final,
          resta,
          detalles_pedido (
            id,
            n_toma,
            tamano,
            cantidad,
            tipo
          )
        `
        )
        .order("fecha_creacion", { ascending: false })
        .range(desde, hasta);

      if (texto) {
        const filtros = [
          `cliente_nombre.ilike.%${texto}%`,
          `cliente_telefono.ilike.%${texto}%`,
          `cliente_email.ilike.%${texto.toLowerCase()}%`,
        ];

        if (idsPorToma.length > 0) {
          filtros.push(`id.in.(${idsPorToma.join(",")})`);
        }

        query = query.or(filtros.join(","));
      }

      const { data, error } = await query;

      if (error) throw error;

      const nuevos = (data || []) as Pedido[];

      if (reset) {
        setPedidos(nuevos);
        setPagina(1);
      } else {
        setPedidos((prev) => [...prev, ...nuevos]);
        setPagina((prev) => prev + 1);
      }

      setHayMas(nuevos.length === LIMITE);
    } catch (err) {
      console.error("Error cargando búsqueda:", err);
      alert("No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos(true);
  }, []);

  const buscar = () => {
    setPagina(0);
    setHayMas(true);
    cargarPedidos(true);
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  if (pedidoDetalleId) {
    return (
      <BusquedaDetalle
        pedidoId={pedidoDetalleId}
        onBack={() => setPedidoDetalleId(null)}
        onSaved={() => cargarPedidos(true)}
      />
    );
  }
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Búsqueda</h1>
        <p style={styles.subtitle}>Consulta y edita pedidos</p>
      </header>

      <div style={styles.searchBox}>
        <Search size={20} color="#b89f54" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar nombre, teléfono o toma..."
          style={styles.input}
          onKeyDown={(e) => {
            if (e.key === "Enter") buscar();
          }}
        />
        <button onClick={buscar} style={styles.searchBtn} disabled={loading}>
          Buscar
        </button>
      </div>

      <div style={styles.lista}>
        {pedidos.map((p) => {
          const tomas = p.detalles_pedido
            ?.map((d) => d.n_toma)
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={p.id}
              style={styles.card}
              onClick={() => {
                setPedidoDetalleId(p.id);
              }}
            >
              <div style={styles.cardTop}>
                <div>
                  {p.urgente && (
                    <div style={styles.urgente}>
                      <AlertTriangle size={13} />
                      URGENTE
                    </div>
                  )}

                                   <h2 style={styles.nombre}>
                    {p.cliente_nombre || "SIN NOMBRE"}
                  </h2>

                  {p.cliente_email ? (
                    <p
                      style={{
                        ...styles.toma,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        textTransform: "lowercase",
                      }}
                    >
                      <Mail size={14} />
                      {p.cliente_email}
                    </p>
                  ) : null}

                  <p style={styles.toma}>
                    Toma: {tomas || "Sin toma"}
                  </p>
                </div>

                <ChevronRight size={22} color="#b89f54" />
              </div>

              <div style={styles.metaRow}>
                <span style={styles.meta}>
                  <CalendarDays size={15} />
                  {formatFecha(p.fecha_entrega)}
                </span>

                <span style={styles.meta}>
                  <Clock size={15} />
                  {p.horario_entrega || "Sin horario"}
                </span>
              </div>

              <div style={styles.footerRow}>
                <span style={styles.estado}>
                  {p.entregado
                    ? "Entregado"
                    : p.pagado
                      ? "Pagado"
                      : "Pendiente"}
                </span>

                {typeof p.resta === "number" && p.resta > 0 && (
                  <span style={styles.resta}>Resta: ${p.resta}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hayMas && (
        <button
          onClick={() => cargarPedidos(false)}
          style={styles.loadMore}
          disabled={loading}
        >
          {loading ? "Cargando..." : "Cargar 20 más"}
        </button>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "20px",
    minHeight: "100vh",
    background: "#F4F1EA",
  },
  header: {
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "38px",
    fontWeight: 900,
    color: "#12110F",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#747169",
    fontWeight: 700,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fff",
    borderRadius: "18px",
    padding: "10px",
    border: "1px solid rgba(0,0,0,0.06)",
    marginBottom: "18px",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "16px",
    background: "transparent",
    color: "#12110F",
  },
  searchBtn: {
    border: "none",
    background: "#12110F",
    color: "#fff",
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  card: {
    width: "100%",
    textAlign: "left",
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: "20px",
    padding: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.03)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },
  urgente: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#be123c",
    color: "#fff",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: 900,
    marginBottom: "8px",
  },
  nombre: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 900,
    color: "#12110F",
    textTransform: "uppercase",
  },
  toma: {
    margin: "5px 0 0",
    color: "#747169",
    fontWeight: 800,
  },
  metaRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#12110F",
    fontSize: "13px",
    fontWeight: 800,
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "12px",
    borderTop: "1px dashed #eee",
    paddingTop: "10px",
  },
  estado: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#2e4d38",
  },
  resta: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#be123c",
  },
  loadMore: {
    width: "100%",
    marginTop: "18px",
    border: "none",
    background: "#b89f54",
    color: "#12110F",
    borderRadius: "16px",
    padding: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },
};
