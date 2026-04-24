# 🤖 DiscordVisualBot

<div align="center">

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.26-5865F2?logo=discord)](https://discord.js.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Crea bots de Discord profesionales sin escribir una sola línea de código.**

[Demo en vivo](https://ais-pre-ne2kzjzdaf6cud5tsefaip-491850047701.europe-west2.run.app) · [Reportar Bug](https://github.com/flekiwey-droid/DiscordVisualBot/issues) · [Solicitar Feature](https://github.com/flekiwey-droid/DiscordVisualBot/issues)

</div>

---

## ✨ ¿Qué es DiscordVisualBot?

DiscordVisualBot es una **plataforma no-code** que te permite diseñar, configurar y desplegar bots de Discord completos usando un **editor visual basado en nodos**. En lugar de programar comandos manualmente, simplemente arrastras y conectas bloques de lógica como si fuera un diagrama de flujo.

### 🎯 Características principales

| Característica | Descripción |
|----------------|-------------|
| 🧩 **Editor Visual** | Interfaz drag-and-drop con React Flow para crear lógica de bot sin código |
| 🎵 **Sistema de Música** | Reproductor completo con Discord Player 7 (play, skip, stop, colas) |
| 🎫 **Tickets de Soporte** | Sistema completo con transcripciones, estados visuales y encuestas DM |
| 🗣️ **Asistente de Voz IA** | Integración con Gemini Live para conversaciones por voz en canales de Discord |
| 🔨 **Moderación** | Timeout, kick, ban, gestión de roles y canales |
| 📊 **Auditoría** | Portal web protegido para revisar transcripts de tickets |
| 🔐 **Autenticación** | Login seguro con Firebase Auth |
| ⚡ **Despliegue Instantáneo** | Un clic para encender tu bot en Discord |

---

## 🖼️ Capturas de pantalla

### Editor Visual de Flujos
![Editor Visual](https://i.ibb.co/V0CMFQg1/Screenshot-2026-04-24-15-47-04-359-com-android-chrome-edit.jpg)

*Arrastra nodos, conecta la lógica y personaliza cada acción del bot*

https://i.ibb.co/cSw0hB29/Screenshot-2026-04-24-15-47-38-645-com-android-chrome-edit.jpg

### Panel de Control
![Dashboard](https://kimi-web-img.moonshot.cn/img/mir-s3-cdn-cf.behance.net/33e342ec869269b5dd1634e89c0744d7e6dcc0f3.png)
*Gestiona tus módulos, monitorea el estado del bot y controla el AI Voice Bridge*

### Sistema de Tickets
![Tickets](https://kimi-web-img.moonshot.cn/img/ticketsbot.org/50459bcb95da9caa5a2783de609dbb8511098e93.webp)
*Transcripciones automáticas, encuestas de satisfacción y portal de auditoría*

### Constructor de Embeds
![Embeds](https://kimi-web-img.moonshot.cn/img/raw.githubusercontent.com/4a1365d0c3b7bc313e47662f47263fd3f4ba07c9.png)
*Crea mensajes embed ricos con previsualización en tiempo real*

---

## 🚀 Demo Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/flekiwey-droid/DiscordVisualBot.git
cd DiscordVisualBot

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Iniciar servidor de desarrollo
npm run dev
