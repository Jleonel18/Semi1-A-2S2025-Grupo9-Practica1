CREATE TABLE Usuario(
    Id_Usuario SERIAL PRIMARY KEY,
    Usuario VARCHAR(50) NOT NULL,
    Nombre VARCHAR(70) NOT NULL,
    Contrasena VARCHAR(200) NOT NULL,
    Foto VARCHAR(150) NOT NULL,
    Saldo NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE Autor(
    Id_Autor SERIAL PRIMARY KEY,
    Nombre VARCHAR(70) NOT NULL
);

CREATE TABLE Obra(
    Id_Obra SERIAL PRIMARY KEY,
    Titulo VARCHAR(50) NOT NULL,
    Id_Autor INT NOT NULL,
    Año_Publicacion  DATE NOT NULL,
    Disponibilidad BOOLEAN NOT NULL DEFAULT TRUE,
    Precio NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    Id_Usuario INT NOT NULL,
    FOREIGN KEY (Id_Autor) REFERENCES Autor(Id_Autor),
    FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
);

CREATE TABLE Aquisicion(
    Id_Aquisicion SERIAL PRIMARY KEY,
    Id_Usuario INT NOT NULL,
    Id_Obra INT NOT NULL,
    Fecha_Adquisicion  DATE NOT NULL,
    FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario),
    FOREIGN KEY (Id_Obra)  REFERENCES Obra(Id_Obra)
);