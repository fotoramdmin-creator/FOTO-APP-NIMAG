import React, { useEffect, useState } from "react";
import {
  Camera,
  PartyPopper,
} from "lucide-react";
import ProduccionLista from "./ProduccionLista";
import ProduccionServiciosLista from "./ProduccionServiciosLista";

type TipoProduccion =
  | "CREDENCIALES"
  | "SERVICIOS";

type Props = {
  setPedidoSeleccionado: (
    pedidoId: string
  ) => void;
  setVistaActiva: (vista: string) => void;
  onAbrirServicio: (
    servicioId: string
  ) => void;
};

const ProduccionHub = ({
  setPedidoSeleccionado,
  setVistaActiva,
  onAbrirServicio,
}: Props) => {
  const [tipoActivo, setTipoActivo] =
    useState<TipoProduccion>(() => {
      const guardado = localStorage.getItem(
        "tipoProduccionActivo"
      );

      return guardado === "SERVICIOS"
        ? "SERVICIOS"
        : "CREDENCIALES";
    });

  useEffect(() => {
    localStorage.setItem(
      "tipoProduccionActivo",
      tipoActivo
    );
  }, [tipoActivo]);

  return (
    <main style={styles.page}>
      <div style={styles.tabsWrap}>
        <button
          type="button"
          onClick={() =>
            setTipoActivo("CREDENCIALES")
          }
          style={{
            ...styles.tabButton,
            ...(tipoActivo === "CREDENCIALES"
              ? styles.tabActive
              : {}),
          }}
        >
          <Camera size={19} />
          Credenciales
        </button>

        <button
          type="button"
          onClick={() =>
            setTipoActivo("SERVICIOS")
          }
          style={{
            ...styles.tabButton,
            ...(tipoActivo === "SERVICIOS"
              ? styles.tabActive
              : {}),
          }}
        >
          <PartyPopper size={19} />
          Servicios
        </button>
      </div>

      {tipoActivo === "CREDENCIALES" ? (
        <ProduccionLista
          setPedidoSeleccionado={
            setPedidoSeleccionado
          }
          setVistaActiva={setVistaActiva}
        />
      ) : (
        <div style={styles.servicesContent}>
          <ProduccionServiciosLista
            onAbrirServicio={onAbrirServicio}
          />
        </div>
      )}
    </main>
  );
};

const styles: {
  [key: string]: React.CSSProperties;
} = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7f5f0 0%, #f1eee8 100%)",
  },
  tabsWrap: {
    position: "sticky",
    top: 76,
    zIndex: 50,
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 9,
    padding: "14px 16px 4px",
    background:
      "linear-gradient(180deg, rgba(247,245,240,0.98) 70%, rgba(247,245,240,0))",
    backdropFilter: "blur(9px)",
  },
  tabButton: {
    minHeight: 49,
    borderRadius: 16,
    border:
      "1px solid rgba(184,159,84,0.25)",
    background: "#fff",
    color: "#777168",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  tabActive: {
    background: "#36412e",
    color: "#fff",
    borderColor: "#36412e",
    boxShadow:
      "0 12px 25px rgba(54,65,46,0.20)",
  },
  servicesContent: {
    padding: "22px 16px 45px",
    maxWidth: 1180,
    margin: "0 auto",
    boxSizing: "border-box",
  },
};

export default ProduccionHub;