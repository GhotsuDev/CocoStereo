# 🎧 CocoStereo

CocoStereo es un ecosistema musical offline de primer nivel. Diseñado con una arquitectura moderna en React Native y Node.js, la aplicación destaca por su estética **Dark Neumorphism** y **Glassmorphism**, combinada con un entorno gráfico que reacciona a la música mediante ecualizadores radiales animados.

## Características Principales
* **Reproductor Integrado:** Motor de audio real utilizando `expo-av` con barra de progreso y controles responsivos.
* **Gestión de Playlists:** Creación, edición, eliminación y visualización de listas de reproducción personalizadas.
* **Interfaz Skeumórfica Oscura:** Controles que simulan hardware físico, botones elevados y pantallas hundidas translúcidas.
* **Fondos Dinámicos (Aurora/Sonic Core):** Animaciones de anillos radiales que reaccionan al estado de reproducción de la música.
* **Carga de Archivos Locales:** Subida de archivos de audio directamente al servidor mediante `multer`.
* **Base de Datos SQLite:** Persistencia total de usuarios, canciones, calificaciones y listas de reproducción.

---

## Tecnologías Utilizadas

**Frontend:**
* [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
* Expo AV (Motor de audio)
* Expo Document Picker / Image Picker
* Animaciones nativas (Animated API)

**Backend:**
* [Node.js](https://nodejs.org/) con [Express](https://expressjs.com/)
* [SQLite3](https://www.sqlite.org/) (Base de datos relacional)
* Multer (Gestor de subida de archivos multiplataforma)

---

## Guía de Instalación y Ejecución

Sigue estos pasos para correr el proyecto en tu entorno local. 

### 1. Requisitos Previos
Asegúrate de tener instalados:
* Node.js (v16 o superior)
* npm o yarn
* Aplicación **Expo Go** en tu dispositivo móvil (iOS/Android) o un emulador configurado.

### 2. Clonar el Repositorio
```bash
git clone [https://github.com/TU_USUARIO/CocoStereo.git](https://github.com/TU_USUARIO/CocoStereo.git)
cd CocoStereo
```

### 3. Iniciar el Backend (Servidor y Base de Datos)
**Navega a la carpeta del backend**
```bash
cd backend
```
**Instala las dependencias del servidor**
```bash
npm install
```
**Inicia el servidor**
```bash
node server.js
```

## 4. Iniciar el Frontend (Aplicación React Native)
Abre una nueva terminal (sin cerrar la del backend) y navega a la raíz del proyecto.
**Instala dependencias**
```bash
npm install
```
**Inicia la app**
```bash
npx expo start
```
