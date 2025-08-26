# **_Practica 1_**

## ArtGalleryCloud

### 2do Semestre del 2025

```js
Universidad San Carlos de Guatemala
Grupo 9
Nombre                                   Carnet
César Rolando Hernández Palacios         202000806
José Luis Espinoza Jolon                 202202182
José David Góngora Olmedo                202201444
Helen Janet Rodas Castro                 202200066
José Leonel Lopez Ajvix                  202201211
```

---

## **_Descripción de la arquitectura_**

La arquitectura implementada consiste en:

- **Servicio principal:** Aplicación desplegada en una instancia EC2.

- **Base de datos:** RDS con motor MySQL para el almacenamiento persistente.

- **Almacenamiento de objetos:** S3 para almacenar imágenes y archivos.

- **Balanceador de carga:** Elastic Load Balancer (ELB) para distribuir el tráfico.

El siguiente diagrama describe la arquitectura:

![imagen](/img/arquitectura.PNG)

---

## **_Descripción de los Usuarios IAM y Políticas_**

Se configuraron diferentes usuarios de **AWS IAM** con roles y permisos específicos:

1. **Usuario: `admin_ec2`**

   - **Rol:** Administrador de instancias EC2
   - **Política:**

     - `AmazonEC2FullAccess`: Permite crear, modificar, iniciar, detener y eliminar instancias EC2, además de gestionar volúmenes, snapshots, y redes asociadas a EC2.

     - `IAMFullAccess`: Permite crear y administrar usuarios, grupos, roles y políticas de IAM, incluyendo la asignación de permisos.

   - **Descripción:**
     Este usuario tiene privilegios administrativos completos sobre los servicios de **EC2** y sobre la gestión de **IAM**. Se utiliza principalmente para la administración de servidores y tambien para lo que es el balanceador de carga, Elastic Load Balancer (ELB).

2. **Usuario: `admin-s3-frontend`**

   - **Rol:** Administrador del bucket de la pagina web
   - **Política:**

     - `AmazonS3FullAccess`: Permite crear, modificar y eliminar buckets en S3, así como administrar objetos y configuraciones.

     - `IAMUserChangePassword`: Permite al usuario modificar su propia contraseña de inicio de sesion en la consola AWS.

   - **Descripción:**
     Este usuario tiene privilegios administrativos completos sobre el servicio de **S3**. Se utiliza principalmente para la administración del bucket practica1-g9-paginaweb-2s2025 que contiene la pagina web estatica.

3. **Usuario: `Admin_S3`**

   - **Rol:** Administrador del bucket para guardar imagenes.
   - **Política:**

     - `AmazonS3FullAccess`: Permite crear, modificar y eliminar buckets en S3, así como administrar objetos y configuraciones.

   - **Descripción:**
     Este usuario tiene privilegios administrativos completos sobre el servicio de **S3**. Se utiliza principalmente para la administración del bucket practica1-grupo9-imagenes que contiene las imagenes utilizadas en la pagina web.

4. **Usuario: `adminRDS`**

   - **Rol:** Administrador de la base de datos para la pagina web.
   - **Política:**

     - `AmazonRDSFullAccess`: Permite la creación, configuración, administración y eliminación de instancias de base de datos en Amazon RDS, incluyendo clústeres de Aurora.

   - **Descripción:**
     Usuario especializado en la administración de bases de datos. Tiene control completo sobre **Amazon RDS**.

---

## **_Capturas_**

Bucket pagina web estatica

![imagen](/img/S31.PNG)

Bucket para imagenes

![imagen](/img/S32.PNG)

Instancias EC2

![imagen](/img/EC2.PNG)

RDS

![imagen](/img/RDS.PNG)

Pagina web

![imagen](/img/WEB1.PNG)

![imagen](/img/WEB2.PNG)

![imagen](/img/WEB3.PNG)

![imagen](/img/WEB4.PNG)

![imagen](/img/WEB5.PNG)
