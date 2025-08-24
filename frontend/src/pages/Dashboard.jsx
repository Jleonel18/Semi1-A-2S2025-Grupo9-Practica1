import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

function Dashboard() {
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Titulo: "",
    Id_Autor: "",
    Anio_Publicacion: "",
    Precio: 0, // Initialize as number
    Imagen: "",
  });

  // Custom styles for react-select
  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: "0.75rem",
      border: "1px solid #e5e7eb",
      padding: "0.25rem",
      backgroundColor: "#fff",
      color: "#1f2937", // text-gray-700
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#2563eb" : "#fff", // bg-blue-600 when selected
      color: state.isSelected ? "#fff" : "#1f2937", // white when selected, text-gray-700 otherwise
      "&:hover": {
        backgroundColor: "#f3f4f6", // bg-gray-100 on hover
        color: "#1f2937",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#1f2937", // text-gray-700
    }),
    input: (provided) => ({
      ...provided,
      color: "#1f2937", // text-gray-700
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af", // text-gray-400
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#fff",
    }),
  };

  // Fetch artworks
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchObras = async () => {
      setLoading(true);
      try {
        const endpoint =
          view === "all"
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
        console.log("📌 Respuesta del backend (obras):", data);

        if (res.ok) {
          setObras(data.obras || []);
        } else {
          toast.error(data.error || "Error al cargar la galería", {
            position: "top-right",
            autoClose: 3000,
          });
          setError(data.error || "Error al cargar la galería");
        }
      } catch (err) {
        console.error("⚠️ Error de conexión (obras):", err);
        toast.error("Error en la conexión con el servidor", {
          position: "top-right",
          autoClose: 3000,
        });
        setError("Error en la conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchObras();
  }, [navigate, view]);

  // Fetch authors when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const fetchAuthors = async () => {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch("http://localhost:5000/api/authors", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const data = await res.json();
          if (res.ok) {
            console.log("📌 Authors fetched:", data.authors);
            const uniqueIds = new Set(data.authors?.map((a) => a.id_autor));
            if (uniqueIds.size !== data.authors?.length) {
              console.warn("⚠️ Duplicate id_autor values detected:", data.authors);
            }
            setAuthors(data.authors || []);
          } else {
            toast.error(data.error || "Error al cargar los autores", {
              position: "top-right",
              autoClose: 3000,
            });
          }
        } catch (err) {
          console.error("⚠️ Error al cargar autores:", err);
          toast.error("Error en la conexión con el servidor", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      };
      fetchAuthors();
    }
  }, [isModalOpen]);

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
        toast.success("Obra comprada exitosamente", {
          position: "top-right",
          autoClose: 3000,
        });
        setObras(obras.filter((obra) => obra.id_obra !== id_obra));
      } else {
        toast.error(data.error || "Error al adquirir la obra", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("⚠️ Error en compra:", err);
      toast.error("Error en el servidor", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "Precio" ? parseFloat(value) || 0 : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/jpeg")) {
        toast.error("Solo se permiten imágenes JPEG", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, Imagen: reader.result.split(",")[1] });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuthorChange = (selectedOption) => {
    setFormData({
      ...formData,
      Id_Autor: selectedOption ? selectedOption.value : "",
    });
  };

  const handleCreateArtwork = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (
      !formData.Titulo ||
      !formData.Id_Autor ||
      !formData.Anio_Publicacion ||
      !Number.isFinite(formData.Precio) ||
      formData.Precio < 0 ||
      !formData.Imagen
    ) {
      toast.error("Todos los campos son obligatorios y el precio debe ser un número válido", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      console.log("📌 Form data before submission:", formData);
      const res = await fetch("http://localhost:5000/api/art/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Obra creada exitosamente", {
          position: "top-right",
          autoClose: 3000,
        });
        setIsModalOpen(false);
        setFormData({
          Titulo: "",
          Id_Autor: "",
          Anio_Publicacion: "",
          Precio: 0,
          Imagen: "",
        });
        if (view === "my") {
          const res = await fetch("http://localhost:5000/api/my-art", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const data = await res.json();
          if (res.ok) setObras(data.obras || []);
        }
      } else {
        toast.error(data.error || "Error al crear la obra", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("⚠️ Error al crear obra:", err);
      toast.error("Error en el servidor", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      Titulo: "",
      Id_Autor: "",
      Anio_Publicacion: "",
      Precio: 0,
      Imagen: "",
    });
  };

  // Format authors for react-select
  const authorOptions = authors.map((author) => ({
    value: author.id_autor,
    label: author.nombre,
  }));

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
      {/* Toast Container */}
      <ToastContainer />

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold text-center text-white">
              {view === "all" ? "Galería Completa" : "Mis Obras"}
            </h2>
            <button
              onClick={handleOpenModal}
              className="bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700"
            >
              Agregar Obra
            </button>
          </div>

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
                  <img
                    src={
                      obra.imagen && obra.imagen.startsWith("http")
                        ? obra.imagen
                        : `/uploads/${obra.imagen}`
                    }
                    alt={obra.titulo}
                    className="w-full h-48 object-cover rounded-xl"
                    onError={(e) => {
                      e.target.src = "/placeholder-image.jpg";
                    }}
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
                    <p
                      className={`font-semibold ${
                        obra.disponibilidad ? "text-green-500" : "text-red-500"
                      }`}
                    >
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

      {/* Modal para agregar obra */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Agregar Nueva Obra</h2>
            <form onSubmit={handleCreateArtwork}>
              <div className="mb-4">
                <label className="block text-gray-700">Título</label>
                <input
                  type="text"
                  name="Titulo"
                  value={formData.Titulo}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-xl text-gray-700"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Autor</label>
                <Select
                  options={authorOptions}
                  onChange={handleAuthorChange}
                  placeholder="Busca un autor..."
                  isClearable
                  isSearchable
                  className="w-full"
                  classNamePrefix="select"
                  styles={customStyles}
                  noOptionsMessage={() => "No hay autores disponibles"}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Año de Publicación</label>
                <input
                  type="date"
                  name="Anio_Publicacion"
                  value={formData.Anio_Publicacion}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-xl"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Precio</label>
                <input
                  type="number"
                  name="Precio"
                  value={formData.Precio}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border rounded-xl text-gray-700 appearance-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Imagen (JPEG)</label>
                <input
                  type="file"
                  accept="image/jpeg"
                  onChange={handleImageChange}
                  className="w-full p-2 border rounded-xl"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="py-2 px-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={authors.length === 0}
                  className={`py-2 px-4 rounded-xl ${
                    authors.length === 0
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Crear Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;