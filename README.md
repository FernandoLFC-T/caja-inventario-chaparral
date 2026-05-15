# 🛒 Sistema de Caja e Inventario - El Chaparral

Sistema de Punto de Venta (POS) y control de inventario desarrollado para el fundo y restaurante campestre "El Chaparral". Este sistema permite gestionar ventas, control de stock mediante Kardex, roles de usuario y flujo de caja diario.

## 🛠️ Tecnologías Utilizadas

* **Backend:** Node.js, Express.js
* **Base de Datos:** MySQL (con paquete `mysql2` para pool de conexiones)
* **Frontend:** HTML5, CSS3 puro, JavaScript Vanilla y jQuery (para animaciones de interfaz)
* **Autenticación:** Sistema propio basado en Roles (RBAC)

---

## 🚀 Manual de Instalación Rápida

Sigue estos pasos para levantar el proyecto en un nuevo equipo de desarrollo.

### 1. Requisitos Previos
Asegúrate de tener instalado en la nueva PC:
* [Node.js](https://nodejs.org/) (Versión 18 o superior)
* [Git](https://git-scm.com/)
* XAMPP (o cualquier servidor local de MySQL)

### 2. Clonar el Repositorio
Abre tu terminal en la carpeta donde deseas guardar el proyecto y ejecuta:
```bash
git clone [https://github.com/FernandoLFC-T/caja-inventario-chaparral.git](https://github.com/FernandoLFC-T/caja-inventario-chaparral.git)
cd caja-inventario-chaparral
```

### 3. Instalar Dependencias
Instala los módulos de Node requeridos (Express, CORS, dotenv, mysql2):
```bash
npm install
```

### 4. Configurar Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto y pega las siguientes credenciales (ajusta los valores si tu MySQL local tiene contraseña):
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=el_chaparral_db
```

### 5. Configurar la Base de Datos
1. Inicia **MySQL** desde el panel de control de XAMPP.
2. Entra a `http://localhost/phpmyadmin/`.
3. Ejecuta el script SQL maestro de la base de datos para crear las tablas.

### 6. Levantar el Servidor
Una vez conectada la base de datos, enciende el servidor de Node:
```bash
node app.js
```
El sistema estará disponible en `http://localhost:3000`.

---

## 🔑 Accesos por Defecto
Para las pruebas de desarrollo, utiliza las siguientes credenciales en el login:
* **Usuario:** `admin`
* **Contraseña:** `123456`

---
*Created by KingF*