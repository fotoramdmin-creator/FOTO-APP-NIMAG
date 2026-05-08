import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  // Estado para guardar la sesión del usuario
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar si hay una sesión activa al abrir la app
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios en la autenticación (Login o Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mientras revisa la sesión, no mostramos nada para evitar parpadeos
  if (loading) return null;

  return (
    <div className="App">
      {!session ? (
        /* Si no hay sesión, mostramos el Login con diseño split/móvil */
        <Login />
      ) : (
        /* Si hay sesión, entramos al Dashboard que ya tiene la Navbar integrada */
        <Dashboard session={session} />
      )}
    </div>
  );
}

export default App;
