import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import ServicioDatosForm from "./ServicioDatosForm";
import ServicioCarrito from "./ServicioCarrito";
import ServicioConfirmacion from "./ServicioConfirmacion";
import {
  ConceptoServicio,
  DatosServicio,
  ServicioCreado,
  datosServicioIniciales,
} from "./serviciosTypes";

type PasoServicio = "DATOS" | "CARRITO" | "CONFIRMACION";

type PerfilServicio = {
  id?: string;
  nombre?: string;
};

type NuevoServicioProps = {
  perfil?: PerfilServicio;
  onCancelar: () => void;
  onServicioCreado: (servicio: ServicioCreado) => void;
};

type ServicioRpcRow = {
  servicio_id: string;
  folio: string;
  cliente_nombre: string;
  total_bruto: number;
  descuento: number;
  total_final: number;
  resta: number;
};

const NuevoServicio = ({
  perfil,
  onCancelar,
  onServicioCreado,
}: NuevoServicioProps) => {
  const [paso, setPaso] = useState<PasoServicio>("DATOS");

  const [datos, setDatos] = useState<DatosServicio>({
    ...datosServicioIniciales,
  });

  const [carrito, setCarrito] = useState<ConceptoServicio[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paso]);

  const totalBruto = useMemo(
    () =>
      carrito.reduce(
        (total, concepto) =>
          total + Number(concepto.subtotal || 0),
        0
      ),
    [carrito]
  );

  const descuentoAplicado = Math.min(
    Math.max(0, Number(descuento || 0)),
    totalBruto
  );

  const crearServicio = async () => {
    if (guardando) return;

    if (
      !datos.clienteNombre.trim() ||
      !datos.clienteTelefono.trim() ||
      !datos.tipoEvento.trim() ||
      !datos.fechaEvento
    ) {
      alert(
        "Faltan datos obligatorios del cliente o del evento."
      );
      setPaso("DATOS");
      return;
    }

    if (carrito.length === 0) {
      alert("Añade al menos un concepto al servicio.");
      setPaso("CARRITO");
      return;
    }

    try {
      setGuardando(true);

      const datosRpc = {
        cliente_nombre: datos.clienteNombre.trim(),
        cliente_telefono: datos.clienteTelefono.trim(),
        tipo_evento: datos.tipoEvento.trim(),

        fecha_evento: datos.fechaEvento,
        horario_evento: datos.horarioEvento || null,

        lugar_evento: datos.lugarEvento.trim() || null,
        direccion_evento:
          datos.direccionEvento.trim() || null,

        fecha_pruebas: datos.fechaPruebas || null,
        horario_pruebas: datos.horarioPruebas || null,

        fecha_entrega: datos.fechaEntrega || null,
        horario_entrega: datos.horarioEntrega || null,

        fecha_limite_liquidacion:
          datos.fechaLimiteLiquidacion ||
          datos.fechaEvento,

        notas: datos.notas.trim() || null,
      };

      const conceptosRpc = carrito.map(
        (concepto, index) => ({
          cantidad: concepto.cantidad,
          descripcion: concepto.descripcion,
          medida: concepto.medida || null,
          marco: concepto.marco || null,
          especificaciones:
            concepto.especificaciones || null,
          precio_unitario: concepto.precioUnitario,
          requiere_seleccion_tomas:
            concepto.requiereSeleccionTomas,
          cantidad_tomas_requeridas:
            concepto.cantidadTomasRequeridas,
          orden: index + 1,
        })
      );

      const { data, error } = await supabase.rpc(
        "crear_servicio_completo",
        {
          p_datos: datosRpc,
          p_conceptos: conceptosRpc,
          p_descuento: descuentoAplicado,
          p_creado_por: perfil?.id || null,
          p_creado_por_nombre: perfil?.nombre || null,
        }
      );

      if (error) throw error;

      const servicio = (
        Array.isArray(data) ? data[0] : data
      ) as ServicioRpcRow | null;

      if (!servicio?.servicio_id) {
        throw new Error(
          "Supabase no devolvió el servicio creado."
        );
      }

      onServicioCreado({
        servicioId: servicio.servicio_id,
        folio: servicio.folio,
        clienteNombre:
          servicio.cliente_nombre ||
          datos.clienteNombre.trim(),
        usuarioId: perfil?.id,
        totalBruto: Number(
          servicio.total_bruto || totalBruto
        ),
        descuento: Number(
          servicio.descuento || descuentoAplicado
        ),
        totalFinal: Number(servicio.total_final || 0),
        pendiente: Number(servicio.resta || 0),
      });
    } catch (error: any) {
      console.error("Error creando servicio:", error);

      alert(
        error?.message ||
          "No se pudo crear el servicio. No se guardó ningún registro."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (paso === "DATOS") {
    return (
      <ServicioDatosForm
        datos={datos}
        setDatos={setDatos}
        onCancelar={onCancelar}
        onContinuar={() => setPaso("CARRITO")}
      />
    );
  }

  if (paso === "CARRITO") {
    return (
      <ServicioCarrito
        carrito={carrito}
        setCarrito={setCarrito}
        onVolver={() => setPaso("DATOS")}
        onContinuar={() => setPaso("CONFIRMACION")}
      />
    );
  }

  return (
    <ServicioConfirmacion
      datos={datos}
      carrito={carrito}
      descuento={descuento}
      setDescuento={setDescuento}
      guardando={guardando}
      onVolver={() => setPaso("CARRITO")}
      onConfirmar={crearServicio}
    />
  );
};

export default NuevoServicio;