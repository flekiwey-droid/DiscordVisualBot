# DiscordVisualBot

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="80" alt="DiscordVisualBot" />
</p>

<h1 align="center">DiscordVisualBot</h1>

<p align="center">
  <strong>Crea bots de Discord profesionales sin escribir una sola linea de codigo.</strong>
</p>

<p align="center">
  <a href="https://ais-pre-ne2kzjzdaf6cud5tsefaip-491850047701.europe-west2.run.app" target="_blank">
    <img src="https://img.shields.io/badge/Demo-en%20vivo-5865F2?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Demo en vivo" />
  </a>
  <a href="https://github.com/flekiwey-droid/DiscordVisualBot/issues" target="_blank">
    <img src="https://img.shields.io/badge/Issues-Reportar%20Bug-EB459E?style=for-the-badge&logo=github&logoColor=white" alt="Reportar Bug" />
  </a>
  <a href="https://github.com/flekiwey-droid/DiscordVisualBot/issues" target="_blank">
    <img src="https://img.shields.io/badge/Feature-Solicitar%20Funcion-FEE75C?style=for-the-badge&logo=github&logoColor=black" alt="Solicitar funcion" />
  </a>
  <img src="https://img.shields.io/badge/version-0.0.0-57F287?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-FAA61A?style=for-the-badge" alt="License" />
</p>

---

## Tabla de Contenidos

- [Descripcion](#descripcion)
- [Caracteristicas Principales](#caracteristicas-principales)
- [Stack Tecnologico](#stack-tecnologico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalacion](#instalacion)
- [Configuracion de Variables de Entorno](#configuracion-de-variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)
- [Arquitectura del Editor Visual](#arquitectura-del-editor-visual)
- [Despliegue](#despliegue)
- [Roadmap](#roadmap)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Descripcion

**DiscordVisualBot** es una plataforma **no-code** que te permite disenar, configurar y desplegar bots de Discord completos usando un **editor visual basado en nodos**. En lugar de programar comandos manualmente, simplemente arrastras y conectas bloques de logica como si fuera un diagrama de flujo.

El proyecto esta construido con **React 19**, **TypeScript**, **Tailwind CSS v4** y **Firebase**, utilizando **React Flow** para el editor visual de nodos y **Discord.js v14** para la integracion con la API de Discord.

---

## Caracteristicas Principales

| Caracteristica | Descripcion |
|----------------|-------------|
| :jigsaw: **Editor Visual** | Interfaz drag-and-drop con React Flow para crear logica de bot sin codigo |
| :musical_note: **Sistema de Musica** | Reproductor completo con Discord Player 7 (play, skip, stop, colas) |
| :ticket: **Tickets de Soporte** | Sistema completo con transcripciones, estados visuales y encuestas DM |
| :speaking_head: **Asistente de Voz IA** | Integracion con Gemini Live para conversaciones por voz en canales de Discord |
| :hammer: **Moderacion** | Timeout, kick, ban, gestion de roles y canales |
| :bar_chart: **Auditoria** | Portal web protegido para revisar transcripts de tickets |
| :closed_lock_with_key: **Autenticacion** | Login seguro con Firebase Auth |
| :zap: **Despliegue Instantaneo** | Un clic para encender tu bot en Discord |

---

## Stack Tecnologico

### Frontend
- **React 19** - Framework UI moderno con Concurrent Features
- **TypeScript ~5.8** - Tipado estatico para codigo robusto
- **Tailwind CSS v4** - Utilidades CSS de ultima generacion con `@tailwindcss/vite`
- **Vite v6** - Bundler ultrarrapido para desarrollo y produccion
- **React Flow (@xyflow/react) v12** - Editor visual de nodos drag-and-drop
- **Motion v12** - Animaciones fluidas y transiciones
- **shadcn/ui v4** - Componentes UI accesibles y personalizables
- **Lucide React** - Iconografia vectorial moderna

### Backend & Servidor
- **Express v4** - Servidor web para API y runtime del bot
- **tsx** - Ejecucion de TypeScript sin compilacion previa
- **CORS** - Habilitacion de peticiones cruzadas

### Integracion Discord
- **Discord.js v14.26** - Libreria oficial para bots de Discord
- **Discord Player v7.2** - Framework completo para reproduccion de musica
- **@discordjs/voice v0.19** - Conexiones de voz en canales
- **@discord-player/extractor v7.2** - Extractores de audio de multiples fuentes
- **ffmpeg-static** - Codificacion de audio para streaming
- **opusscript & prism-media** - Codecs de audio para Discord

### Inteligencia Artificial
- **@google/genai v1.29** - API de Gemini para el asistente de voz IA

### Base de Datos & Autenticacion
- **Firebase v12** - Autenticacion, Firestore Database y hosting
- **Firestore Rules** - Seguridad granular en la base de datos

### Comunicacion en Tiempo Real
- **Socket.IO v4.8** - WebSockets bidireccionales para actualizaciones en vivo

### Tipografia
- **Geist (variable font)** - Fuente moderna de Vercel

---

## Estructura del Proyecto

```
DiscordVisualBot/
|-- components/
|   |-- ui/                       # Componentes shadcn/ui base
|   |-- nodes/
|   |   |-- CustomNodes.tsx       # Nodos personalizados del editor visual
|   |-- Loading.tsx               # Componente de carga
|-- lib/
|   |-- utils.ts                  # Utilidades (cn, etc.)
|-- src/
|   |-- components/               # Componentes reutilizables
|   |-- contexts/                 # Contextos de React (estado global)
|   |-- data/                     # Datos estaticos y configuraciones
|   |-- pages/
|   |   |-- Landing.tsx           # Pagina de inicio / landing
|   |   |-- Dashboard.tsx         # Panel principal del bot
|   |   |-- Editor.tsx            # Editor visual de flujos
|   |   |-- MusicConfig.tsx       # Configuracion del sistema de musica
|   |   |-- TranscriptPortal.tsx  # Portal de auditoria de tickets
|   |-- App.tsx                   # Router principal y layout
|   |-- constants.ts              # Constantes de la aplicacion
|   |-- firebase.ts               # Configuracion e inicializacion de Firebase
|   |-- index.css                 # Estilos globales con Tailwind
|   |-- main.tsx                  # Punto de entrada de React
|   |-- types.ts                  # Definiciones de tipos TypeScript
|-- .env.example                  # Variables de entorno de ejemplo
|-- components.json               # Configuracion de shadcn/ui
|-- firebase-applet-config.json   # Configuracion del applet de Firebase
|-- firebase-blueprint.json       # Blueprint de la infraestructura Firebase
|-- firestore.rules               # Reglas de seguridad de Firestore
|-- index.html                    # HTML de entrada
|-- metadata.json                 # Metadatos del proyecto
|-- package.json                  # Dependencias y scripts
|-- server.ts                     # Servidor Express + runtime del bot
|-- tsconfig.json                 # Configuracion de TypeScript
|-- vite.config.ts                # Configuracion de Vite
```

---

## Requisitos Previos

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- Cuenta en **Google AI Studio** (para Gemini API)
- Cuenta en **Firebase** (para Auth y Firestore)
- Aplicacion de bot en **[Discord Developer Portal](https://discord.com/developers/applications)**

---

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/flekiwey-droid/DiscordVisualBot.git
cd DiscordVisualBot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y rellena tus credenciales:

```bash
cp .env.example .env
```

### 4. Iniciar en modo desarrollo

```bash
npm run dev
```

La aplicacion estara disponible en `http://localhost:3000`.

---

## Configuracion de Variables de Entorno

Crea un archivo `.env` en la raiz del proyecto con las siguientes variables:

| Variable | Descripcion | Obligatorio |
|----------|-------------|-------------|
| `GEMINI_API_KEY` | Clave de API de Google Gemini para el asistente IA | Si |
| `APP_URL` | URL donde se aloja la aplicacion (usada para OAuth y callbacks) | Si |

> :bulb: Si usas **Google AI Studio**, estas variables se inyectan automaticamente en tiempo de ejecucion desde los secretos del panel de AI Studio.

---

## Scripts Disponibles

| Script | Descripcion |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente |
| `npm start` | Inicia el servidor en modo produccion |
| `npm run build` | Compila la aplicacion para produccion en `/dist` |
| `npm run preview` | Previsualiza la build de produccion localmente |
| `npm run clean` | Elimina la carpeta `/dist` |
| `npm run lint` | Ejecuta el chequeo de tipos de TypeScript sin emitir archivos |

---

## Arquitectura del Editor Visual

El editor visual esta construido sobre **React Flow** y soporta cuatro tipos de nodos:

| Tipo | Proposito |
|------|-----------|
| **trigger** | Eventos que inician un flujo (ej: mensaje recibido, usuario se une) |
| **action** | Acciones que ejecuta el bot (ej: enviar mensaje, asignar rol) |
| **logic** | Condiciones y ramificaciones (ej: si/entonces, bucles) |
| **variable** | Almacenamiento y manipulacion de datos temporales |

Cada nodo contiene:
- `label`: Nombre visible
- `type`: Categoria del nodo
- `description`: Descripcion de su funcion
- `config`: Parametros configurables
- `icon`: Icono representativo

### Flujo de Datos

```
[Trigger Node] --> [Logic Node] --> [Action Node]
                      |
                      +--> [Variable Node] --> [Action Node]
```

---

## Despliegue

### Google AI Studio (Recomendado)

Este proyecto fue generado desde la plantilla de **Google AI Studio**. Para desplegar:

1. Conecta tu repositorio a AI Studio
2. Configura los secretos en el panel de AI Studio:
   - `GEMINI_API_KEY`
   - `APP_URL`
3. El despliegue en **Cloud Run** es automatico

### Manual (Cloud Run / VPS)

```bash
# Build de produccion
npm run build

# Iniciar servidor
npm start
```

El servidor escucha en el puerto configurado por la variable de entorno `PORT` (por defecto 3000).

---

## Roadmap

- [ ] Exportacion de flujos a codigo JavaScript
- [ ] Biblioteca de plantillas predefinidas
- [ ] Sistema de plugins y nodos personalizados
- [ ] Dashboard analitico con metricas del bot
- [ ] Soporte para multiples bots simultaneos
- [ ] Integracion con webhooks externos
- [ ] Modulo de economia/currency
- [ ] Sistema de niveles y experiencia (XP)

---

## Contribuir

Las contribuciones son bienvenidas. Para contribuir:

1. Haz fork del repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Add: nueva caracteristica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

Por favor, asegurate de seguir las guias de contribucion y de que tu codigo pase el linter antes de enviarlo.

---

## Licencia

Este proyecto esta licenciado bajo la **Licencia MIT** - ver el archivo [LICENSE](LICENSE) para mas detalles.

---

<p align="center">
  Creado con :heart: por <a href="https://github.com/flekiwey-droid">@flekiwey-droid</a>
</p>
