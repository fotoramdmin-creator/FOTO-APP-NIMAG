import { supabase } from "../supabaseClient";

export type EstadoBorradorPedido =
    | "CAPTURANDO"
    | "PENDIENTE_PAGO"
    | "FINALIZADO"
    | "CANCELADO";

export type DatosClienteBorrador = {
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_email: string;
    fecha_entrega: string;
    horario_entrega: string;
};

export type ItemCarritoBorrador = {
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

export type PedidoBorrador = {
    id: string;
    pedido_id: string | null;
    creado_por: string | null;
    creado_por_nombre: string | null;
    estado: EstadoBorradorPedido;
    paso: string;
    datos_cliente: DatosClienteBorrador;
    carrito: ItemCarritoBorrador[];
    descuento: number;
    total_estimado: number;
    version: number;
    created_at: string;
    updated_at: string;
};

export type PedidoCreadoDesdeBorrador = {
    pedidoId: string;
    clienteNombre: string;
    usuarioId?: string;
    totalBruto: number;
    descuento: number;
    totalFinal: number;
    pendiente: number;
    pedidoYaExistia: boolean;
};

export type ContenidoBorrador = {
    datosCliente: DatosClienteBorrador;
    carrito: ItemCarritoBorrador[];
    descuento: number;
    paso: string;
};

const CAMPOS_BORRADOR = `
  id,
  pedido_id,
  creado_por,
  creado_por_nombre,
  estado,
  paso,
  datos_cliente,
  carrito,
  descuento,
  total_estimado,
  version,
  created_at,
  updated_at
`;

export const calcularTotalBorrador = (
    carrito: ItemCarritoBorrador[],
    descuento: number
) => {
    const totalBruto = carrito.reduce(
        (total, item) =>
            total + Number(item.total || 0),
        0
    );

    return Math.max(
        totalBruto - Number(descuento || 0),
        0
    );
};

export const listarBorradoresActivos =
    async (): Promise<PedidoBorrador[]> => {
        const { data, error } = await supabase
            .from("pedidos_borradores")
            .select(CAMPOS_BORRADOR)
            .in("estado", [
                "CAPTURANDO",
                "PENDIENTE_PAGO",
            ])
            .order("updated_at", {
                ascending: false,
            });

        if (error) throw error;

        return (data || []) as PedidoBorrador[];
    };

export const obtenerBorradorActivo = async (
    borradorId: string
): Promise<PedidoBorrador | null> => {
    const { data, error } = await supabase
        .from("pedidos_borradores")
        .select(CAMPOS_BORRADOR)
        .eq("id", borradorId)
        .in("estado", [
            "CAPTURANDO",
            "PENDIENTE_PAGO",
        ])
        .maybeSingle();

    if (error) throw error;

    return (data as PedidoBorrador | null) || null;
};

export const crearBorradorPedido = async ({
    usuarioId,
    usuarioNombre,
    contenido,
}: {
    usuarioId?: string;
    usuarioNombre?: string;
    contenido: ContenidoBorrador;
}): Promise<PedidoBorrador> => {
    const totalEstimado = calcularTotalBorrador(
        contenido.carrito,
        contenido.descuento
    );

    const { data, error } = await supabase
        .from("pedidos_borradores")
        .insert({
            creado_por: usuarioId || null,
            creado_por_nombre:
                usuarioNombre || null,
            estado: "CAPTURANDO",
            paso: contenido.paso,
            datos_cliente: {
                ...contenido.datosCliente,
                cliente_email:
                    contenido.datosCliente.cliente_email
                        .trim()
                        .toLowerCase(),
            },
            carrito: contenido.carrito,
            descuento: Number(
                contenido.descuento || 0
            ),
            total_estimado: totalEstimado,
        })
        .select(CAMPOS_BORRADOR)
        .single();

    if (error) throw error;

    return data as PedidoBorrador;
};

export const actualizarBorradorPedido =
    async ({
        borradorId,
        contenido,
        usuarioId,
        usuarioNombre,
    }: {
        borradorId: string;
        contenido: ContenidoBorrador;
        usuarioId?: string;
        usuarioNombre?: string;
    }): Promise<PedidoBorrador> => {
        const totalEstimado = calcularTotalBorrador(
            contenido.carrito,
            contenido.descuento
        );

        const { data, error } = await supabase
            .from("pedidos_borradores")
            .update({
                ...(usuarioId !== undefined
                    ? {
                        creado_por:
                            usuarioId || null,
                    }
                    : {}),
                ...(usuarioNombre !== undefined
                    ? {
                        creado_por_nombre:
                            usuarioNombre || null,
                    }
                    : {}),
                paso: contenido.paso,
                datos_cliente: {
                    ...contenido.datosCliente,
                    cliente_email:
                        contenido.datosCliente.cliente_email
                            .trim()
                            .toLowerCase(),
                },
                carrito: contenido.carrito,
                descuento: Number(
                    contenido.descuento || 0
                ),
                total_estimado: totalEstimado,
            })
            .eq("id", borradorId)
            .in("estado", [
                "CAPTURANDO",
                "PENDIENTE_PAGO",
            ])
            .select(CAMPOS_BORRADOR)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            throw new Error(
                "El borrador ya fue cerrado o eliminado."
            );
        }

        return data as PedidoBorrador;
    };

export const guardarPedidoDesdeBorrador =
    async ({
        borradorId,
        usuarioId,
        usuarioNombre,
    }: {
        borradorId: string;
        usuarioId?: string;
        usuarioNombre?: string;
    }): Promise<PedidoCreadoDesdeBorrador> => {
        const { data, error } = await supabase.rpc(
            "guardar_pedido_desde_borrador",
            {
                p_borrador_id: borradorId,
                p_usuario_id: usuarioId || null,
                p_usuario_nombre:
                    usuarioNombre || null,
            }
        );

        if (error) throw error;

        if (!data) {
            throw new Error(
                "Supabase no devolvió el pedido guardado."
            );
        }

        return data as PedidoCreadoDesdeBorrador;
    };
    export const cancelarPedidoBorrador = async (
    borradorId: string
): Promise<void> => {
    const { error } = await supabase.rpc(
        "cancelar_pedido_borrador",
        {
            p_borrador_id: borradorId,
        }
    );

    if (error) throw error;
};