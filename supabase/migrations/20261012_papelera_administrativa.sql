    -- PAPELERA ADMINISTRATIVA
    -- Parte 1: columnas base para pedidos, servicios y pagos.

    begin;

    alter table public.pedidos
    add column if not exists en_papelera boolean not null default false,
    add column if not exists papelera_at timestamp with time zone,
    add column if not exists papelera_por uuid references public.usuarios(id) on delete set null,
    add column if not exists papelera_por_nombre text,
    add column if not exists papelera_motivo text,
    add column if not exists papelera_manejo_pagos text;

    alter table public.servicios
    add column if not exists en_papelera boolean not null default false,
    add column if not exists papelera_at timestamp with time zone,
    add column if not exists papelera_por uuid references public.usuarios(id) on delete set null,
    add column if not exists papelera_por_nombre text,
    add column if not exists papelera_motivo text,
    add column if not exists papelera_manejo_pagos text;

    alter table public.pagos
    add column if not exists estado_pago text not null default 'ACTIVO',
    add column if not exists estado_pago_at timestamp with time zone,
    add column if not exists estado_pago_por uuid references public.usuarios(id) on delete set null,
    add column if not exists estado_pago_por_nombre text,
    add column if not exists estado_pago_motivo text;

    update public.pedidos
    set en_papelera = false
    where en_papelera is null;

    update public.servicios
    set en_papelera = false
    where en_papelera is null;

    update public.pagos
    set estado_pago = 'ACTIVO'
    where estado_pago is null
    or btrim(estado_pago) = '';

    commit;


    -- Parte 2: validaciones, historial administrativo y devoluciones.

    begin;

    do $$
    begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'pedidos_papelera_manejo_pagos_check'
        and conrelid = 'public.pedidos'::regclass
    ) then
        alter table public.pedidos
        add constraint pedidos_papelera_manejo_pagos_check
        check (
            papelera_manejo_pagos is null
            or papelera_manejo_pagos in (
            'SIN_PAGOS',
            'CONSERVAR',
            'ANULAR',
            'DEVOLVER'
            )
        );
    end if;
    end
    $$;

    do $$
    begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'servicios_papelera_manejo_pagos_check'
        and conrelid = 'public.servicios'::regclass
    ) then
        alter table public.servicios
        add constraint servicios_papelera_manejo_pagos_check
        check (
            papelera_manejo_pagos is null
            or papelera_manejo_pagos in (
            'SIN_PAGOS',
            'CONSERVAR',
            'ANULAR',
            'DEVOLVER'
            )
        );
    end if;
    end
    $$;

    do $$
    begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'pagos_estado_pago_check'
        and conrelid = 'public.pagos'::regclass
    ) then
        alter table public.pagos
        add constraint pagos_estado_pago_check
        check (
            estado_pago in (
            'ACTIVO',
            'ANULADO',
            'DEVUELTO'
            )
        );
    end if;
    end
    $$;

    create table if not exists public.papelera_historial (
    id uuid primary key default gen_random_uuid(),
    tipo_registro text not null
        check (tipo_registro in ('PEDIDO', 'SERVICIO')),
    registro_id uuid not null,
    accion text not null
        check (accion in ('ENVIADO', 'RESTAURADO')),
    motivo text,
    manejo_pagos text
        check (
        manejo_pagos is null
        or manejo_pagos in (
            'SIN_PAGOS',
            'CONSERVAR',
            'ANULAR',
            'DEVOLVER'
        )
        ),
    usuario_id uuid references public.usuarios(id) on delete set null,
    usuario_nombre text not null,
    fecha timestamp with time zone not null default now(),
    datos_registro jsonb not null default '{}'::jsonb
    );

    create table if not exists public.devoluciones_pagos (
    id uuid primary key default gen_random_uuid(),
    pago_id uuid not null
        references public.pagos(id) on delete restrict,
    pedido_id uuid
        references public.pedidos(id) on delete restrict,
    servicio_id uuid
        references public.servicios(id) on delete restrict,
    monto numeric not null check (monto > 0),
    fecha_devolucion timestamp with time zone not null default now(),
    dia_mx date not null default
        ((now() at time zone 'America/Mexico_City')::date),
    metodo_pago text,
    cuenta_destino text,
    motivo text not null,
    usuario_id uuid references public.usuarios(id) on delete set null,
    usuario_nombre text not null,
    created_at timestamp with time zone not null default now(),
    constraint devoluciones_un_origen_check
        check (
        (pedido_id is not null and servicio_id is null)
        or
        (pedido_id is null and servicio_id is not null)
        ),
    constraint devoluciones_pago_unico unique (pago_id)
    );

    create index if not exists pedidos_en_papelera_idx
    on public.pedidos (en_papelera, fecha_creacion desc);

    create index if not exists servicios_en_papelera_idx
    on public.servicios (en_papelera, created_at desc);

    create index if not exists pagos_estado_pago_idx
    on public.pagos (estado_pago);

    create index if not exists papelera_historial_registro_idx
    on public.papelera_historial (
        tipo_registro,
        registro_id,
        fecha desc
    );

    create index if not exists devoluciones_fecha_idx
    on public.devoluciones_pagos (dia_mx, fecha_devolucion);

    commit;


    -- Parte 3: los saldos solamente consideran pagos activos.

    begin;

    create or replace function public.recalcular_pedido_totales(
    p_pid uuid
    )
    returns void
    language plpgsql
    as $function$
    declare
    v_total_bruto numeric := 0;
    v_descuento numeric := 0;
    v_descuento_monto numeric := 0;
    v_total_final numeric := 0;
    v_anticipo numeric := 0;
    v_liquidacion numeric := 0;
    v_total_pagado numeric := 0;
    v_resta numeric := 0;
    v_pagado boolean := false;
    begin
    if p_pid is null then
        return;
    end if;

    select coalesce(sum(coalesce(d.subtotal, 0)), 0)
    into v_total_bruto
    from public.detalles_pedido d
    where d.pedido_id = p_pid;

    select coalesce(p.descuento, 0)
    into v_descuento
    from public.pedidos p
    where p.id = p_pid;

    v_descuento_monto :=
        greatest(0, least(v_total_bruto, v_descuento));

    v_total_final :=
        greatest(0, v_total_bruto - v_descuento_monto);

    select
        coalesce(
        sum(
            case
            when tipo = 'A_CUENTA'
            then coalesce(monto, 0)
            else 0
            end
        ),
        0
        ),
        coalesce(
        sum(
            case
            when tipo = 'LIQUIDACION'
            then coalesce(monto, 0)
            else 0
            end
        ),
        0
        )
    into
        v_anticipo,
        v_liquidacion
    from public.pagos
    where pedido_id = p_pid
        and estado_pago = 'ACTIVO';

    v_total_pagado :=
        coalesce(v_anticipo, 0)
        + coalesce(v_liquidacion, 0);

    v_resta :=
        greatest(0, v_total_final - v_total_pagado);

    v_pagado := (v_resta = 0);

    update public.pedidos
    set
        total_bruto = v_total_bruto,
        descuento_monto = v_descuento_monto,
        total_final = v_total_final,
        anticipo = v_anticipo,
        liquidacion = v_liquidacion,
        total_pagado = v_total_pagado,
        resta = v_resta,
        pagado = v_pagado,
        updated_at = now()
    where id = p_pid;
    end;
    $function$;

    create or replace function public.recalcular_pagos_servicio()
    returns trigger
    language plpgsql
    as $function$
    declare
    v_servicio_id uuid;
    v_anticipo numeric := 0;
    v_liquidacion numeric := 0;
    v_total_pagado numeric := 0;
    v_total_final numeric := 0;
    v_resta numeric := 0;
    begin
    v_servicio_id :=
        coalesce(new.servicio_id, old.servicio_id);

    if v_servicio_id is null then
        return coalesce(new, old);
    end if;

    select
        coalesce(
        sum(
            case
            when tipo in ('A_CUENTA', 'ABONO')
            then coalesce(monto, 0)
            else 0
            end
        ),
        0
        ),
        coalesce(
        sum(
            case
            when tipo = 'LIQUIDACION'
            then coalesce(monto, 0)
            else 0
            end
        ),
        0
        ),
        coalesce(sum(coalesce(monto, 0)), 0)
    into
        v_anticipo,
        v_liquidacion,
        v_total_pagado
    from public.pagos
    where servicio_id = v_servicio_id
        and estado_pago = 'ACTIVO';

    select coalesce(total_final, 0)
    into v_total_final
    from public.servicios
    where id = v_servicio_id;

    v_resta :=
        greatest(v_total_final - v_total_pagado, 0);

    update public.servicios
    set
        anticipo = v_anticipo,
        liquidacion = v_liquidacion,
        total_pagado = v_total_pagado,
        resta = v_resta,
        pagado = (
        v_total_final > 0
        and v_resta = 0
        ),
        updated_at = now()
    where id = v_servicio_id;

    return coalesce(new, old);
    end;
    $function$;

    commit;


    -- Parte 4: seguridad de la papelera.

    begin;

    create or replace function public.obtener_admin_papelera_actual()
    returns table (
    usuario_id uuid,
    usuario_nombre text
    )
    language sql
    stable
    security definer
    set search_path = public
    as $function$
    select
        u.id,
        coalesce(nullif(btrim(u.nombre), ''), 'ADMINISTRADOR')
    from public.usuarios u
    where u.auth_user_id = auth.uid()
        and u.admin is true
        and coalesce(u.activo, true) is true
    limit 1;
    $function$;

    revoke all
    on function public.obtener_admin_papelera_actual()
    from public;

    grant execute
    on function public.obtener_admin_papelera_actual()
    to authenticated;

    alter table public.papelera_historial
    enable row level security;

    alter table public.devoluciones_pagos
    enable row level security;

    drop policy if exists papelera_historial_select_admin
    on public.papelera_historial;

    create policy papelera_historial_select_admin
    on public.papelera_historial
    for select
    to authenticated
    using (
    exists (
        select 1
        from public.usuarios u
        where u.auth_user_id = auth.uid()
        and u.admin is true
        and coalesce(u.activo, true) is true
    )
    );

    drop policy if exists devoluciones_pagos_select_admin
    on public.devoluciones_pagos;

    create policy devoluciones_pagos_select_admin
    on public.devoluciones_pagos
    for select
    to authenticated
    using (
    exists (
        select 1
        from public.usuarios u
        where u.auth_user_id = auth.uid()
        and u.admin is true
        and coalesce(u.activo, true) is true
    )
    );

    revoke insert, update, delete
    on public.papelera_historial
    from anon, authenticated;

    revoke insert, update, delete
    on public.devoluciones_pagos
    from anon, authenticated;

    grant select
    on public.papelera_historial
    to authenticated;

    grant select
    on public.devoluciones_pagos
    to authenticated;

    commit;


-- Parte 5: enviar un pedido a la papelera.

begin;

create or replace function public.enviar_pedido_papelera(
  p_pedido_id uuid,
  p_motivo text,
  p_manejo_pagos text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_admin_id uuid;
  v_admin_nombre text;
  v_pedido public.pedidos%rowtype;
  v_motivo text;
  v_manejo text;
  v_pagos_activos integer := 0;
  v_snapshot jsonb;
begin
  select
    admin_actual.usuario_id,
    admin_actual.usuario_nombre
  into
    v_admin_id,
    v_admin_nombre
  from public.obtener_admin_papelera_actual()
    as admin_actual;

  if v_admin_id is null then
    raise exception
      'Esta acción es exclusiva para administradores.'
      using errcode = '42501';
  end if;

  v_motivo := btrim(coalesce(p_motivo, ''));

  if char_length(v_motivo) < 5 then
    raise exception
      'Escribe un motivo de al menos 5 caracteres.';
  end if;

  select pedido.*
  into v_pedido
  from public.pedidos as pedido
  where pedido.id = p_pedido_id
  for update;

  if not found then
    raise exception 'No se encontró el pedido.';
  end if;

  if v_pedido.en_papelera then
    raise exception 'El pedido ya está en la papelera.';
  end if;

  select count(*)
  into v_pagos_activos
  from public.pagos
  where pedido_id = p_pedido_id
    and estado_pago = 'ACTIVO';

  if v_pagos_activos = 0 then
    v_manejo := 'SIN_PAGOS';
  else
    v_manejo :=
      upper(btrim(coalesce(p_manejo_pagos, '')));

    if v_manejo not in (
      'CONSERVAR',
      'ANULAR',
      'DEVOLVER'
    ) then
      raise exception
        'Selecciona qué sucederá con los pagos.';
    end if;
  end if;

  select jsonb_build_object(
    'pedido',
    to_jsonb(v_pedido),
    'detalles',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(detalle)
          order by detalle.id
        )
        from public.detalles_pedido as detalle
        where detalle.pedido_id = p_pedido_id
      ),
      '[]'::jsonb
    ),
    'pagos',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(pago)
          order by pago.fecha_pago, pago.id
        )
        from public.pagos as pago
        where pago.pedido_id = p_pedido_id
      ),
      '[]'::jsonb
    )
  )
  into v_snapshot;

  if v_manejo = 'ANULAR' then
    update public.pagos
    set
      estado_pago = 'ANULADO',
      estado_pago_at = now(),
      estado_pago_por = v_admin_id,
      estado_pago_por_nombre = v_admin_nombre,
      estado_pago_motivo = v_motivo
    where pedido_id = p_pedido_id
      and estado_pago = 'ACTIVO';
  elsif v_manejo = 'DEVOLVER' then
    insert into public.devoluciones_pagos (
      pago_id,
      pedido_id,
      servicio_id,
      monto,
      fecha_devolucion,
      dia_mx,
      metodo_pago,
      cuenta_destino,
      motivo,
      usuario_id,
      usuario_nombre
    )
    select
      pago.id,
      p_pedido_id,
      null,
      pago.monto,
      now(),
      (now() at time zone 'America/Mexico_City')::date,
      pago.metodo_pago,
      pago.cuenta_destino,
      v_motivo,
      v_admin_id,
      v_admin_nombre
    from public.pagos as pago
    where pago.pedido_id = p_pedido_id
      and pago.estado_pago = 'ACTIVO'
      and coalesce(pago.monto, 0) > 0
    on conflict (pago_id) do nothing;

    update public.pagos
    set
      estado_pago = 'DEVUELTO',
      estado_pago_at = now(),
      estado_pago_por = v_admin_id,
      estado_pago_por_nombre = v_admin_nombre,
      estado_pago_motivo = v_motivo
    where pedido_id = p_pedido_id
      and estado_pago = 'ACTIVO';
  end if;

  update public.pedidos
  set
    en_papelera = true,
    papelera_at = now(),
    papelera_por = v_admin_id,
    papelera_por_nombre = v_admin_nombre,
    papelera_motivo = v_motivo,
    papelera_manejo_pagos = v_manejo,
    updated_at = now()
  where id = p_pedido_id;

  insert into public.papelera_historial (
    tipo_registro,
    registro_id,
    accion,
    motivo,
    manejo_pagos,
    usuario_id,
    usuario_nombre,
    datos_registro
  )
  values (
    'PEDIDO',
    p_pedido_id,
    'ENVIADO',
    v_motivo,
    v_manejo,
    v_admin_id,
    v_admin_nombre,
    v_snapshot
  );

  return jsonb_build_object(
    'ok',
    true,
    'tipo',
    'PEDIDO',
    'id',
    p_pedido_id,
    'manejo_pagos',
    v_manejo,
    'pagos_afectados',
    v_pagos_activos
  );
end;
$function$;

revoke all
on function public.enviar_pedido_papelera(
  uuid,
  text,
  text
)
from public;

grant execute
on function public.enviar_pedido_papelera(
  uuid,
  text,
  text
)
to authenticated;

commit;


-- Parte 6: enviar un servicio a la papelera.

begin;

create or replace function public.enviar_servicio_papelera(
  p_servicio_id uuid,
  p_motivo text,
  p_manejo_pagos text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_admin_id uuid;
  v_admin_nombre text;
  v_servicio public.servicios%rowtype;
  v_motivo text;
  v_manejo text;
  v_pagos_activos integer := 0;
  v_snapshot jsonb;
begin
  select
    admin_actual.usuario_id,
    admin_actual.usuario_nombre
  into
    v_admin_id,
    v_admin_nombre
  from public.obtener_admin_papelera_actual()
    as admin_actual;

  if v_admin_id is null then
    raise exception
      'Esta acción es exclusiva para administradores.'
      using errcode = '42501';
  end if;

  v_motivo := btrim(coalesce(p_motivo, ''));

  if char_length(v_motivo) < 5 then
    raise exception
      'Escribe un motivo de al menos 5 caracteres.';
  end if;

  select servicio.*
  into v_servicio
  from public.servicios as servicio
  where servicio.id = p_servicio_id
  for update;

  if not found then
    raise exception 'No se encontró el servicio.';
  end if;

  if v_servicio.en_papelera then
    raise exception 'El servicio ya está en la papelera.';
  end if;

  select count(*)
  into v_pagos_activos
  from public.pagos
  where servicio_id = p_servicio_id
    and estado_pago = 'ACTIVO';

  if v_pagos_activos = 0 then
    v_manejo := 'SIN_PAGOS';
  else
    v_manejo :=
      upper(btrim(coalesce(p_manejo_pagos, '')));

    if v_manejo not in (
      'CONSERVAR',
      'ANULAR',
      'DEVOLVER'
    ) then
      raise exception
        'Selecciona qué sucederá con los pagos.';
    end if;
  end if;

  select jsonb_build_object(
    'servicio',
    to_jsonb(v_servicio),
    'conceptos',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(concepto)
          order by concepto.orden, concepto.id
        )
        from public.servicios_conceptos as concepto
        where concepto.servicio_id = p_servicio_id
      ),
      '[]'::jsonb
    ),
    'pagos',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(pago)
          order by pago.fecha_pago, pago.id
        )
        from public.pagos as pago
        where pago.servicio_id = p_servicio_id
      ),
      '[]'::jsonb
    )
  )
  into v_snapshot;

  if v_manejo = 'ANULAR' then
    update public.pagos
    set
      estado_pago = 'ANULADO',
      estado_pago_at = now(),
      estado_pago_por = v_admin_id,
      estado_pago_por_nombre = v_admin_nombre,
      estado_pago_motivo = v_motivo
    where servicio_id = p_servicio_id
      and estado_pago = 'ACTIVO';
  elsif v_manejo = 'DEVOLVER' then
    insert into public.devoluciones_pagos (
      pago_id,
      pedido_id,
      servicio_id,
      monto,
      fecha_devolucion,
      dia_mx,
      metodo_pago,
      cuenta_destino,
      motivo,
      usuario_id,
      usuario_nombre
    )
    select
      pago.id,
      null,
      p_servicio_id,
      pago.monto,
      now(),
      (now() at time zone 'America/Mexico_City')::date,
      pago.metodo_pago,
      pago.cuenta_destino,
      v_motivo,
      v_admin_id,
      v_admin_nombre
    from public.pagos as pago
    where pago.servicio_id = p_servicio_id
      and pago.estado_pago = 'ACTIVO'
      and coalesce(pago.monto, 0) > 0
    on conflict (pago_id) do nothing;

    update public.pagos
    set
      estado_pago = 'DEVUELTO',
      estado_pago_at = now(),
      estado_pago_por = v_admin_id,
      estado_pago_por_nombre = v_admin_nombre,
      estado_pago_motivo = v_motivo
    where servicio_id = p_servicio_id
      and estado_pago = 'ACTIVO';
  end if;

  update public.servicios
  set
    en_papelera = true,
    papelera_at = now(),
    papelera_por = v_admin_id,
    papelera_por_nombre = v_admin_nombre,
    papelera_motivo = v_motivo,
    papelera_manejo_pagos = v_manejo,
    updated_at = now()
  where id = p_servicio_id;

  insert into public.papelera_historial (
    tipo_registro,
    registro_id,
    accion,
    motivo,
    manejo_pagos,
    usuario_id,
    usuario_nombre,
    datos_registro
  )
  values (
    'SERVICIO',
    p_servicio_id,
    'ENVIADO',
    v_motivo,
    v_manejo,
    v_admin_id,
    v_admin_nombre,
    v_snapshot
  );

  return jsonb_build_object(
    'ok',
    true,
    'tipo',
    'SERVICIO',
    'id',
    p_servicio_id,
    'manejo_pagos',
    v_manejo,
    'pagos_afectados',
    v_pagos_activos
  );
end;
$function$;

revoke all
on function public.enviar_servicio_papelera(
  uuid,
  text,
  text
)
from public;

grant execute
on function public.enviar_servicio_papelera(
  uuid,
  text,
  text
)
to authenticated;

commit;


-- Parte 7: restaurar pedidos o servicios desde la papelera.

begin;

create or replace function public.restaurar_registro_papelera(
  p_tipo_registro text,
  p_registro_id uuid,
  p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_admin_id uuid;
  v_admin_nombre text;
  v_tipo text;
  v_motivo text;
  v_manejo text;
  v_motivo_cancelacion text;
  v_snapshot jsonb;
  v_pedido public.pedidos%rowtype;
  v_servicio public.servicios%rowtype;
begin
  select
    admin_actual.usuario_id,
    admin_actual.usuario_nombre
  into
    v_admin_id,
    v_admin_nombre
  from public.obtener_admin_papelera_actual()
    as admin_actual;

  if v_admin_id is null then
    raise exception
      'Esta acción es exclusiva para administradores.'
      using errcode = '42501';
  end if;

  v_tipo :=
    upper(btrim(coalesce(p_tipo_registro, '')));

  if v_tipo not in ('PEDIDO', 'SERVICIO') then
    raise exception
      'El tipo de registro no es válido.';
  end if;

  v_motivo := btrim(coalesce(p_motivo, ''));

  if char_length(v_motivo) < 5 then
    raise exception
      'Escribe un motivo de restauración de al menos 5 caracteres.';
  end if;

  if v_tipo = 'PEDIDO' then
    select pedido.*
    into v_pedido
    from public.pedidos as pedido
    where pedido.id = p_registro_id
    for update;

    if not found then
      raise exception 'No se encontró el pedido.';
    end if;

    if not v_pedido.en_papelera then
      raise exception
        'El pedido ya está fuera de la papelera.';
    end if;

    v_manejo := v_pedido.papelera_manejo_pagos;
    v_motivo_cancelacion := v_pedido.papelera_motivo;
    v_snapshot := to_jsonb(v_pedido);

    if v_manejo = 'ANULAR' then
      update public.pagos
      set
        estado_pago = 'ACTIVO',
        estado_pago_at = now(),
        estado_pago_por = v_admin_id,
        estado_pago_por_nombre = v_admin_nombre,
        estado_pago_motivo =
          'REACTIVADO AL RESTAURAR: ' || v_motivo
      where pedido_id = p_registro_id
        and estado_pago = 'ANULADO'
        and estado_pago_motivo =
          v_motivo_cancelacion;
    end if;

    update public.pedidos
    set
      en_papelera = false,
      papelera_at = null,
      papelera_por = null,
      papelera_por_nombre = null,
      papelera_motivo = null,
      papelera_manejo_pagos = null,
      updated_at = now()
    where id = p_registro_id;
  else
    select servicio.*
    into v_servicio
    from public.servicios as servicio
    where servicio.id = p_registro_id
    for update;

    if not found then
      raise exception 'No se encontró el servicio.';
    end if;

    if not v_servicio.en_papelera then
      raise exception
        'El servicio ya está fuera de la papelera.';
    end if;

    v_manejo := v_servicio.papelera_manejo_pagos;
    v_motivo_cancelacion :=
      v_servicio.papelera_motivo;

    v_snapshot := to_jsonb(v_servicio);

    if v_manejo = 'ANULAR' then
      update public.pagos
      set
        estado_pago = 'ACTIVO',
        estado_pago_at = now(),
        estado_pago_por = v_admin_id,
        estado_pago_por_nombre = v_admin_nombre,
        estado_pago_motivo =
          'REACTIVADO AL RESTAURAR: ' || v_motivo
      where servicio_id = p_registro_id
        and estado_pago = 'ANULADO'
        and estado_pago_motivo =
          v_motivo_cancelacion;
    end if;

    update public.servicios
    set
      en_papelera = false,
      papelera_at = null,
      papelera_por = null,
      papelera_por_nombre = null,
      papelera_motivo = null,
      papelera_manejo_pagos = null,
      updated_at = now()
    where id = p_registro_id;
  end if;

  insert into public.papelera_historial (
    tipo_registro,
    registro_id,
    accion,
    motivo,
    manejo_pagos,
    usuario_id,
    usuario_nombre,
    datos_registro
  )
  values (
    v_tipo,
    p_registro_id,
    'RESTAURADO',
    v_motivo,
    v_manejo,
    v_admin_id,
    v_admin_nombre,
    v_snapshot
  );

  return jsonb_build_object(
    'ok',
    true,
    'tipo',
    v_tipo,
    'id',
    p_registro_id,
    'manejo_pagos_original',
    v_manejo,
    'devolucion_revertida',
    false
  );
end;
$function$;

revoke all
on function public.restaurar_registro_papelera(
  text,
  uuid,
  text
)
from public;

grant execute
on function public.restaurar_registro_papelera(
  text,
  uuid,
  text
)
to authenticated;

commit;


-- Parte 8: corte diario y movimientos con anulaciones y devoluciones.

begin;

create or replace view public.corte_diario as
with ingresos_por_dia as (
  select
    (
      pago.created_at
      at time zone 'America/Mexico_City'
    )::date as dia,
    coalesce(sum(pago.monto), 0)::numeric(10, 2)
      as ingresos
  from public.pagos as pago
  where coalesce(pago.estado_pago, 'ACTIVO')
    in ('ACTIVO', 'DEVUELTO')
  group by (
    pago.created_at
    at time zone 'America/Mexico_City'
  )::date
),
salidas_unificadas as (
  select
    retiro.dia_mx as dia,
    retiro.monto
  from public.retiros_caja as retiro
  where retiro.estatus = 'APROBADO'

  union all

  select
    devolucion.dia_mx as dia,
    devolucion.monto
  from public.devoluciones_pagos as devolucion
),
salidas_por_dia as (
  select
    salida.dia,
    coalesce(sum(salida.monto), 0)::numeric(10, 2)
      as retiros
  from salidas_unificadas as salida
  group by salida.dia
)
select
  coalesce(
    ingreso.dia,
    salida.dia
  ) as dia,
  coalesce(
    ingreso.ingresos,
    0
  )::numeric(10, 2) as ingresos,
  coalesce(
    salida.retiros,
    0
  )::numeric(10, 2) as retiros,
  (
    coalesce(ingreso.ingresos, 0)
    - coalesce(salida.retiros, 0)
  )::numeric(10, 2) as neto
from ingresos_por_dia as ingreso
full join salidas_por_dia as salida
  using (dia)
order by coalesce(
  ingreso.dia,
  salida.dia
) desc;

create or replace view public.cuentas_movs as
select
  pago.id as pago_id,
  pago.pedido_id,
  coalesce(
    pedido.cliente_nombre,
    servicio.cliente_nombre
  ) as cliente_nombre,
  pedido.n_toma,
  case
    when usuario_pago.nombre is null
      or upper(btrim(usuario_pago.nombre)) = 'EMPRESA'
    then coalesce(
      nullif(btrim(pedido.creado_por_nombre), ''),
      nullif(btrim(servicio.creado_por_nombre), ''),
      usuario_pedido.nombre,
      usuario_servicio.nombre,
      usuario_pago.nombre,
      '—'
    )
    else usuario_pago.nombre
  end as usuario_nombre,
  pago.fecha_pago as fecha,
  (
    pago.fecha_pago
    at time zone 'America/Mexico_City'
  )::date as dia_mx,
  pago.monto::numeric(10, 2) as monto,
  'ENTRADA'::text as direccion,
  coalesce(pago.tipo, 'PAGO') as tipo_mov,
  case
    when pago.estado_pago = 'DEVUELTO'
    then btrim(
      'PAGO DEVUELTO POSTERIORMENTE'
      ||
      case
        when coalesce(pago.nota, '') <> ''
        then ' - ' || pago.nota
        else ''
      end
    )
    else coalesce(pago.nota, '')
  end as nota,
  pago.metodo_pago,
  case
    when upper(
      coalesce(pago.metodo_pago, '')
    ) = 'TRANSFERENCIA'
    then pago.cuenta_destino
    else null
  end as cuenta_destino,
  pago.servicio_id
from public.pagos as pago
left join public.pedidos as pedido
  on pedido.id = pago.pedido_id
left join public.servicios as servicio
  on servicio.id = pago.servicio_id
left join public.usuarios as usuario_pago
  on usuario_pago.id = pago.usuario_id
left join public.usuarios as usuario_pedido
  on usuario_pedido.id = pedido.creado_por
left join public.usuarios as usuario_servicio
  on usuario_servicio.id = servicio.creado_por
where coalesce(pago.estado_pago, 'ACTIVO')
  in ('ACTIVO', 'DEVUELTO')

union all

select
  devolucion.id as pago_id,
  devolucion.pedido_id,
  coalesce(
    pedido.cliente_nombre,
    servicio.cliente_nombre
  ) as cliente_nombre,
  pedido.n_toma,
  devolucion.usuario_nombre,
  devolucion.fecha_devolucion as fecha,
  devolucion.dia_mx,
  devolucion.monto::numeric(10, 2) as monto,
  'SALIDA'::text as direccion,
  'DEVOLUCION'::text as tipo_mov,
  btrim(
    'DEVOLUCIÓN AL CLIENTE'
    ||
    case
      when coalesce(devolucion.motivo, '') <> ''
      then ' - ' || devolucion.motivo
      else ''
    end
  ) as nota,
  devolucion.metodo_pago,
  case
    when upper(
      coalesce(devolucion.metodo_pago, '')
    ) = 'TRANSFERENCIA'
    then devolucion.cuenta_destino
    else null
  end as cuenta_destino,
  devolucion.servicio_id
from public.devoluciones_pagos as devolucion
left join public.pedidos as pedido
  on pedido.id = devolucion.pedido_id
left join public.servicios as servicio
  on servicio.id = devolucion.servicio_id

union all

select
  retiro.id as pago_id,
  null::uuid as pedido_id,
  null::text as cliente_nombre,
  null::text as n_toma,
  usuario_retiro.nombre as usuario_nombre,
  retiro.fecha,
  retiro.dia_mx,
  retiro.monto::numeric(10, 2) as monto,
  'SALIDA'::text as direccion,
  'RETIRO'::text as tipo_mov,
  btrim(
    coalesce(retiro.concepto, '')
    ||
    case
      when coalesce(retiro.notas, '') <> ''
      then ' - ' || retiro.notas
      else ''
    end
  ) as nota,
  null::text as metodo_pago,
  null::text as cuenta_destino,
  null::uuid as servicio_id
from public.retiros_caja as retiro
left join public.usuarios as usuario_retiro
  on usuario_retiro.id = retiro.usuario_id
where retiro.estatus = 'APROBADO';

commit;


-- Parte 9: impedir borrados físicos y cambios directos de papelera.

begin;

create or replace function public.proteger_borrado_registros_operativos()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if current_user not in (
    'postgres',
    'service_role',
    'supabase_admin'
  ) then
    raise exception
      'No se permite eliminar físicamente este registro. Usa la papelera administrativa.'
      using errcode = '42501';
  end if;

  return old;
end;
$function$;

create or replace function public.proteger_campos_papelera_pedido()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if current_user not in (
    'postgres',
    'service_role',
    'supabase_admin'
  )
  and (
    new.en_papelera is distinct from old.en_papelera
    or new.papelera_at is distinct from old.papelera_at
    or new.papelera_por is distinct from old.papelera_por
    or new.papelera_por_nombre
      is distinct from old.papelera_por_nombre
    or new.papelera_motivo
      is distinct from old.papelera_motivo
    or new.papelera_manejo_pagos
      is distinct from old.papelera_manejo_pagos
  ) then
    raise exception
      'Los campos de papelera solo pueden modificarse mediante la función administrativa.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

create or replace function public.proteger_campos_papelera_servicio()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if current_user not in (
    'postgres',
    'service_role',
    'supabase_admin'
  )
  and (
    new.en_papelera is distinct from old.en_papelera
    or new.papelera_at is distinct from old.papelera_at
    or new.papelera_por is distinct from old.papelera_por
    or new.papelera_por_nombre
      is distinct from old.papelera_por_nombre
    or new.papelera_motivo
      is distinct from old.papelera_motivo
    or new.papelera_manejo_pagos
      is distinct from old.papelera_manejo_pagos
  ) then
    raise exception
      'Los campos de papelera solo pueden modificarse mediante la función administrativa.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

create or replace function public.proteger_estado_administrativo_pago()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if current_user not in (
    'postgres',
    'service_role',
    'supabase_admin'
  )
  and (
    new.estado_pago is distinct from old.estado_pago
    or new.estado_pago_at
      is distinct from old.estado_pago_at
    or new.estado_pago_por
      is distinct from old.estado_pago_por
    or new.estado_pago_por_nombre
      is distinct from old.estado_pago_por_nombre
    or new.estado_pago_motivo
      is distinct from old.estado_pago_motivo
  ) then
    raise exception
      'El estado administrativo del pago solo puede modificarse mediante la papelera.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists proteger_borrado_pedidos
  on public.pedidos;

create trigger proteger_borrado_pedidos
before delete on public.pedidos
for each row
execute function public.proteger_borrado_registros_operativos();

drop trigger if exists proteger_borrado_servicios
  on public.servicios;

create trigger proteger_borrado_servicios
before delete on public.servicios
for each row
execute function public.proteger_borrado_registros_operativos();

drop trigger if exists proteger_borrado_pagos
  on public.pagos;

create trigger proteger_borrado_pagos
before delete on public.pagos
for each row
execute function public.proteger_borrado_registros_operativos();

drop trigger if exists proteger_papelera_pedidos
  on public.pedidos;

create trigger proteger_papelera_pedidos
before update on public.pedidos
for each row
execute function public.proteger_campos_papelera_pedido();

drop trigger if exists proteger_papelera_servicios
  on public.servicios;

create trigger proteger_papelera_servicios
before update on public.servicios
for each row
execute function public.proteger_campos_papelera_servicio();

drop trigger if exists proteger_estado_pagos
  on public.pagos;

create trigger proteger_estado_pagos
before update on public.pagos
for each row
execute function public.proteger_estado_administrativo_pago();

commit;


-- Parte 10: listado administrativo de la papelera.

begin;

create or replace function public.listar_papelera_administrativa()
returns table (
  tipo_registro text,
  registro_id uuid,
  referencia text,
  cliente_nombre text,
  cliente_telefono text,
  fecha_creacion timestamp with time zone,
  papelera_at timestamp with time zone,
  papelera_por_nombre text,
  papelera_motivo text,
  papelera_manejo_pagos text,
  total_final numeric,
  total_pagado numeric,
  pagos_activos bigint,
  pagos_anulados bigint,
  pagos_devueltos bigint
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_admin_id uuid;
begin
  select admin_actual.usuario_id
  into v_admin_id
  from public.obtener_admin_papelera_actual()
    as admin_actual;

  if v_admin_id is null then
    raise exception
      'Esta vista es exclusiva para administradores.'
      using errcode = '42501';
  end if;

  return query
  select *
  from (
    select
      'PEDIDO'::text as tipo_registro,
      pedido.id as registro_id,
      left(pedido.id::text, 8) as referencia,
      pedido.cliente_nombre,
      pedido.cliente_telefono,
      pedido.fecha_creacion,
      pedido.papelera_at,
      pedido.papelera_por_nombre,
      pedido.papelera_motivo,
      pedido.papelera_manejo_pagos,
      pedido.total_final,
      pedido.total_pagado,
      (
        select count(*)
        from public.pagos as pago
        where pago.pedido_id = pedido.id
          and pago.estado_pago = 'ACTIVO'
      ) as pagos_activos,
      (
        select count(*)
        from public.pagos as pago
        where pago.pedido_id = pedido.id
          and pago.estado_pago = 'ANULADO'
      ) as pagos_anulados,
      (
        select count(*)
        from public.pagos as pago
        where pago.pedido_id = pedido.id
          and pago.estado_pago = 'DEVUELTO'
      ) as pagos_devueltos
    from public.pedidos as pedido
    where pedido.en_papelera is true

    union all

    select
      'SERVICIO'::text as tipo_registro,
      servicio.id as registro_id,
      servicio.folio as referencia,
      servicio.cliente_nombre,
      servicio.cliente_telefono,
      servicio.created_at as fecha_creacion,
      servicio.papelera_at,
      servicio.papelera_por_nombre,
      servicio.papelera_motivo,
      servicio.papelera_manejo_pagos,
      servicio.total_final,
      servicio.total_pagado,
      (
        select count(*)
        from public.pagos as pago
        where pago.servicio_id = servicio.id
          and pago.estado_pago = 'ACTIVO'
      ) as pagos_activos,
      (
        select count(*)
        from public.pagos as pago
        where pago.servicio_id = servicio.id
          and pago.estado_pago = 'ANULADO'
      ) as pagos_anulados,
      (
        select count(*)
        from public.pagos as pago
        where pago.servicio_id = servicio.id
          and pago.estado_pago = 'DEVUELTO'
      ) as pagos_devueltos
    from public.servicios as servicio
    where servicio.en_papelera is true
  ) as registros
  order by registros.papelera_at desc;
end;
$function$;

revoke all
on function public.listar_papelera_administrativa()
from public;

grant execute
on function public.listar_papelera_administrativa()
to authenticated;

commit;
-- Parte 11: bloquear operaciones sobre registros en papelera.

begin;

create or replace function public.proteger_actualizacion_en_papelera()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if current_user not in (
    'postgres',
    'service_role',
    'supabase_admin'
  )
  and old.en_papelera is true then
    raise exception
      'Este registro está en la papelera administrativa y no puede modificarse.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

create or replace function public.proteger_pago_registro_en_papelera()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_pedido_id uuid;
  v_servicio_id uuid;
  v_en_papelera boolean := false;
begin
  if current_user in (
    'postgres',
    'service_role',
    'supabase_admin'
  ) then
    return new;
  end if;

  v_pedido_id := new.pedido_id;
  v_servicio_id := new.servicio_id;

  if v_pedido_id is not null then
    select pedido.en_papelera
    into v_en_papelera
    from public.pedidos as pedido
    where pedido.id = v_pedido_id;

    if coalesce(v_en_papelera, false) is true then
      raise exception
        'No se pueden registrar ni modificar pagos de un pedido que está en la papelera.'
        using errcode = '42501';
    end if;
  end if;

  v_en_papelera := false;

  if v_servicio_id is not null then
    select servicio.en_papelera
    into v_en_papelera
    from public.servicios as servicio
    where servicio.id = v_servicio_id;

    if coalesce(v_en_papelera, false) is true then
      raise exception
        'No se pueden registrar ni modificar pagos de un servicio que está en la papelera.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists proteger_actualizacion_pedido_en_papelera
  on public.pedidos;

create trigger proteger_actualizacion_pedido_en_papelera
before update on public.pedidos
for each row
execute function public.proteger_actualizacion_en_papelera();

drop trigger if exists proteger_actualizacion_servicio_en_papelera
  on public.servicios;

create trigger proteger_actualizacion_servicio_en_papelera
before update on public.servicios
for each row
execute function public.proteger_actualizacion_en_papelera();

drop trigger if exists proteger_pago_de_registro_en_papelera
  on public.pagos;

create trigger proteger_pago_de_registro_en_papelera
before insert or update on public.pagos
for each row
execute function public.proteger_pago_registro_en_papelera();

commit;