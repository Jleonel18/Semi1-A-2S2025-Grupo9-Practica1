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
    Anio_Publicacion  DATE NOT NULL,
    Disponibilidad BOOLEAN NOT NULL DEFAULT TRUE,
    Precio NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    Imagen VARCHAR(150) NOT NULL,
    Id_Usuario INT NOT NULL,
    FOREIGN KEY (Id_Autor) REFERENCES Autor(Id_Autor),
    FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
);

CREATE TABLE Adquisicion(
    Id_Adquisicion SERIAL PRIMARY KEY,
    Id_Usuario INT NOT NULL,
    Id_Obra INT NOT NULL,
    Fecha_Adquisicion  DATE NOT NULL,
    FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario),
    FOREIGN KEY (Id_Obra)  REFERENCES Obra(Id_Obra)
);

-- AUTORES

INSERT INTO Autor (Nombre) VALUES
('Leonardo da Vinci'),
('Vincent van Gogh'),
('Pablo Picasso'),
('Claude Monet'),
('Michelangelo Buonarroti'),
('Rembrandt van Rijn'),
('Johannes Vermeer'),
('Gustav Klimt'),
('Frida Kahlo'),
('Diego Rivera'),
('Sandro Botticelli'),
('Raphael Sanzio'),
('Caravaggio'),
('Edvard Munch'),
('Henri Matisse'),
('Wassily Kandinsky'),
('Paul Cézanne'),
('Georgia O''Keeffe'),
('Jackson Pollock'),
('Andy Warhol'),
('Jean-Michel Basquiat'),
('Mary Cassatt'),
('Édouard Manet'),
('Pierre-Auguste Renoir'),
('Mark Rothko'),
('Banksy'),
('Yayoi Kusama'),
('Kehinde Wiley'),
('Cindy Sherman'),
('Damien Hirst');

--Obras
INSERT INTO Obra (Titulo, Id_Autor, Anio_Publicacion, Disponibilidad, Precio, Imagen, Id_Usuario) VALUES
('Mona Lisa', 1, '1503-01-01', TRUE, 1000.00, 'https://hips.hearstapps.com/hmg-prod/images/mona-lisa-also-called-la-gioconda-or-la-joconde-c1503-1506-news-photo-1652350725.jpg?resize=980:*', 1),
('La Noche Estrellada', 2, '1889-06-01', TRUE, 800.00, 'Fotos_Publicadas/noche_estrellada.jpg', 1),
('Guernica', 3, '1937-04-26', TRUE, 1200.00, 'Fotos_Publicadas/guernica.jpg', 1),
('Impresión, Sol Naciente', 4, '1872-01-01', TRUE, 600.00, 'Fotos_Publicadas/sol_naciente.jpg', 1),
('La Creación de Adán', 5, '1512-01-01', TRUE, 900.00, 'Fotos_Publicadas/creacion_adan.jpg', 1),
('El Grito', 13, '1503-01-01', TRUE, 1000.00, 'https://hips.hearstapps.com/hmg-prod/images/one-of-several-versions-of-the-painting-the-scream-by-the-news-photo-1652351980.jpg?resize=980:*', 1);
