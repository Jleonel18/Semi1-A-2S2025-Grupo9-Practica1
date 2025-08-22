import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("all"); // "all" o "my" para la galería

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchObras = async () => {
      setLoading(true);
      try {
        const endpoint = view === "all" 
          ? "http://localhost:5000/api/gallery" 
          : "http://localhost:5000/api/my-art";
          
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        console.log("📌 Respuesta del backend:", data);

        if (res.ok) {
          setObras(data.obras || []);
        } else {
          setError(data.error || "Error al cargar la galería");
        }
      } catch (err) {
        console.error("⚠️ Error de conexión:", err);
        setError("Error en la conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchObras();
  }, [navigate, view]);

  const handlePurchase = async (id_obra) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/art/purchase/${id_obra}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage(
          `✅ Obra adquirida exitosamente. Saldo restante: ${data.saldo_restante}`
        );
        setObras(obras.filter((obra) => obra.id_obra !== id_obra));
      } else {
        setMessage(`❌ ${data.error || "Error al adquirir la obra"}`);
      }
    } catch (err) {
      console.error("⚠️ Error en compra:", err);
      setMessage("⚠️ Error en el servidor");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando galería...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Fondo */}
      <img
        src="https://st4.depositphotos.com/20659180/40404/i/450/depositphotos_404040348-stock-photo-gray-plaster-wall-texture-structure.jpg"
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/30"></div>

      <div className="relative z-10 min-h-screen">
        {/* Navbar */}
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">ArtGalleryCloud</h1>
          <div className="flex items-center">
            <button
              onClick={() => setView("all")}
              className={`mr-4 hover:underline ${
                view === "all" ? "underline font-bold" : ""
              }`}
            >
              Galería Completa
            </button>
            <button
              onClick={() => setView("my")}
              className={`mr-4 hover:underline ${
                view === "my" ? "underline font-bold" : ""
              }`}
            >
              Mis Obras
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="mr-4 hover:underline"
            >
              Perfil
            </button>
            <button onClick={handleLogout} className="hover:underline">
              Cerrar Sesión
            </button>
          </div>
        </nav>

        <div className="container mx-auto p-6">
          <h2 className="text-3xl font-semibold mb-6 text-center text-white">
            {view === "all" ? "Galería Completa" : "Mis Obras"}
          </h2>

          {message && (
            <p className="mb-4 text-center font-semibold text-white">
              {message}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {!obras || obras.length === 0 ? (
              <p className="col-span-full text-center text-gray-300 text-lg">
                {view === "all"
                  ? "No hay obras disponibles en este momento."
                  : "No tienes obras publicadas."}
              </p>
            ) : (
              obras.map((obra) => (
                <div
                  key={obra.id_obra}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:scale-105 transition-transform duration-200"
                >
                  {/* Imagen */}
                  <img
                    src={
                      obra.imagen && obra.imagen.startsWith("http")
                        ? obra.imagen
                        : `/uploads/${obra.imagen}`
                    }
                    alt={obra.titulo}
                    className="w-full h-48 object-cover rounded-xl"
                  />

                  <div className="p-4">
                    <h2 className="text-xl font-semibold">{obra.titulo}</h2>
                    <p className="text-gray-600">Autor: {obra.autor}</p>
                    <p className="text-gray-600">Creador: {obra.creador}</p>
                    <p className="text-gray-600">
                      Año:{" "}
                      {obra.anio_publicacion
                        ? new Date(obra.anio_publicacion).getFullYear()
                        : "Desconocido"}
                    </p>
                    <p className="text-gray-600">
                      Precio: $
                      {typeof obra.precio === "number"
                        ? obra.precio.toFixed(2)
                        : obra.precio}
                    </p>
                    <p className={`font-semibold ${obra.disponibilidad ? "text-green-500" : "text-red-500"}`}>
                        {obra.disponibilidad ? "Disponible" : "No disponible"}
                    </p>

                    {view === "all" && obra.disponibilidad && (
                      <button
                      onClick={() => handlePurchase(obra.id_obra)}
                      disabled={!obra.disponibilidad}
                      className={`mt-3 w-full py-2 rounded-xl ${
                        obra.disponibilidad
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-400 text-gray-200 cursor-not-allowed"
                      }`}
                    >
                      Comprar
                    </button>
                    
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
