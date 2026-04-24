import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Readable } from "stream";
import { Server } from "socket.io";
import { Client, GatewayIntentBits, EmbedBuilder, Message, Interaction, BaseInteraction, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, TextChannel } from "discord.js";
import { 
   joinVoiceChannel, 
   createAudioPlayer, 
   createAudioResource, 
   StreamType, 
   AudioPlayerStatus, 
   VoiceConnectionStatus, 
   EndBehaviorType,
   AudioResource
} from "@discordjs/voice";
import { Player } from "discord-player";
import { DefaultExtractors } from "@discord-player/extractor";
import * as prism from "prism-media";
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection, setDoc } from 'firebase/firestore';
import { db } from './src/firebase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep track of the active bot client so we can restart it
let activeBot: Client | null = null;
let io: Server | null = null;
const voiceSessions = new Map<string, { audioPlayer: any, userId: string }>();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  io.on("connection", (socket) => {
    console.log("Dashboard connected for AI Voice Bridge");
    
    socket.on("ai-audio-chunk", (data: any) => {
       // Search for the session with this userId
       for (const [guildId, session] of voiceSessions.entries()) {
          if (session.userId === data.userId && data.audio) {
             const buffer = Buffer.from(data.audio, 'base64');
             const resource = createAudioResource(Readable.from(buffer), {
                inputType: StreamType.Raw,
             });
             session.audioPlayer.play(resource);
             break;
          }
       }
    });

    socket.on("disconnect", () => console.log("Dashboard disconnected"));
  });

  app.get("/api/status", (req, res) => {
    res.json({ isRunning: activeBot !== null, tag: activeBot?.user?.tag || null });
  });

  app.post("/api/stop", async (req, res) => {
    if (activeBot) {
       activeBot.destroy();
       activeBot = null;
    }
    res.json({ success: true });
  });

  // API Route to handle bot deployment
  app.post("/api/deploy", async (req, res) => {
    try {
      const { token, modules, nodes, edges } = req.body;

      if (!token) {
        return res.status(400).json({ error: "No bot token provided" });
      }

      // If there's an existing bot, destroy it to free resources and login fresh
      if (activeBot) {
        activeBot.destroy();
        activeBot = null;
      }

      const allNodes: any[] = [];
      const allEdges: any[] = [];
      let musicSettings: any = null;
      
      if (modules && Array.isArray(modules)) {
         const musicModule = modules.find(m => m.type === 'music');
         if (musicModule) {
            try {
               musicSettings = typeof musicModule.nodes === 'string' ? JSON.parse(musicModule.nodes) : musicModule.nodes;
            } catch(e) {}
         }
         
         for (const mod of modules) {
            let parsedNodes = typeof mod.nodes === 'string' ? JSON.parse(mod.nodes) : mod.nodes || [];
            let parsedEdges = typeof mod.edges === 'string' ? JSON.parse(mod.edges) : mod.edges || [];
            
            if (Array.isArray(parsedNodes)) {
               allNodes.push(...parsedNodes);
            }
            if (Array.isArray(parsedEdges)) {
               allEdges.push(...parsedEdges);
            }
         }
      }

      // Support direct nodes and edges from editor (for single module deployment)
      if (nodes && Array.isArray(nodes)) {
         allNodes.push(...nodes);
      }
      if (edges && Array.isArray(edges)) {
         allEdges.push(...edges);
      }

      // Initialize new client
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessageReactions,
          GatewayIntentBits.GuildVoiceStates,
        ],
      });

      activeBot = client;

      // --- VISUAL DISCORD BOT ENGINE ---
      
      const getOutgoingEdges = (nodeId: string, handleId?: string) => {
        return allEdges.filter((e: any) => {
           if (e.source !== nodeId) return false;
           if (handleId) return e.sourceHandle === handleId;
           return !e.sourceHandle || e.sourceHandle === 'default';
        });
      };
      
      const getNode = (nodeId: string) => allNodes.find((n: any) => n.id === nodeId);

      const substituteVariables = (text: string, context: any) => {
        if (!text) return "";
        let result = text;
        if (context.user) {
          result = result.replace(/\{user\.id\}/g, context.user.id);
          result = result.replace(/\{user\.name\}/g, context.user.username);
        }
        if (context.channel) {
          result = result.replace(/\{channel\.name\}/g, context.channel.name);
          result = result.replace(/\{channel\.id\}/g, context.channel.id);
        }
        if (context.message) {
          result = result.replace(/\{message\.content\}/g, context.message.content);
        }
        return result;
      };

      const executeNode = async (nodeId: string, context: any) => {
        const node = getNode(nodeId);
        if (!node) {
          console.log(`[Flow] Node ${nodeId} not found`);
          return;
        }

        console.log(`[Flow] Executing node: ${node.data.label} (${nodeId})`);
        const config = node.data?.config || {};
        let continueFlow = true;
        let nextHandle: string | undefined = undefined;

        try {
          // Helper to create buttons from connected ButtonNodes
          const createComponents = (currentId: string) => {
            const buttonEdges = allEdges.filter((e: any) => e.source === currentId && e.sourceHandle === 'buttons');
            if (buttonEdges.length === 0) return [];
            
            const row = new ActionRowBuilder<ButtonBuilder>();
            buttonEdges.forEach((edge: any) => {
               const targetNode = getNode(edge.target);
               if (targetNode && targetNode.data?.label === 'Boton') {
                  const btnConfig = targetNode.data.config || {};
                  const styleMap: Record<string, ButtonStyle> = {
                    'Primary': ButtonStyle.Primary,
                    'Secondary': ButtonStyle.Secondary,
                    'Success': ButtonStyle.Success,
                    'Danger': ButtonStyle.Danger,
                  };
                  row.addComponents(
                    new ButtonBuilder()
                       .setCustomId(`btn:${targetNode.id}`)
                       .setLabel(btnConfig.label || 'Botón')
                       .setStyle(styleMap[btnConfig.style] || ButtonStyle.Primary)
                  );
               }
            });
            
            return row.components.length > 0 ? [row] : [];
          };

          if (node.data.label === "Enviar Mensaje") {
            const content = substituteVariables(config.messageContent, context);
            const components = createComponents(nodeId);
            if (context.channel) await context.channel.send({ content, components });
          } 
          else if (node.data.label === "Enviar Embed") {
            const embed = new EmbedBuilder()
              .setTitle(substituteVariables(config.embedTitle || "", context))
              .setDescription(substituteVariables(config.embedDescription || "", context))
              .setColor((config.hexColor || "#5865F2") as any);
              
            if (config.imageUrl) embed.setImage(config.imageUrl);
            if (config.thumbnailUrl) embed.setThumbnail(config.thumbnailUrl);

            const components = createComponents(nodeId);
            if (context.channel) await context.channel.send({ embeds: [embed], components });
          }
          else if (node.data.label === "Reaccionar a Mensaje") {
            const emoji = substituteVariables(config.emoji, context);
             if (context.message && emoji) {
               await context.message.react(emoji).catch(() => {});
            }
          }
          else if (node.data.label === "Borrar Mensaje") {
             if (context.message && context.message.deletable) {
               await context.message.delete().catch(() => {});
            }
          }
          else if (node.data.label === "Responder Comando") {
             const content = substituteVariables(config.messageContent, context);
             const ephemeral = config.ephemeral === 'true';
             const components = createComponents(nodeId);
             
             if (context.interaction && context.interaction.isRepliable()) {
               await context.interaction.reply({ content, ephemeral, components });
             } else if (context.message) {
               await context.message.reply({ content, components });
             }
          }
          else if (node.data.label === "Delay") {
            const duration = parseFloat(config.duration) || 0;
            const ms = config.unit === 'seconds' ? duration * 1000 : duration * 60000;
            await new Promise(r => setTimeout(r, ms));
          }
          else if (node.data.label === "Condicion") {
             const val1 = substituteVariables(config.variable1, context);
             const val2 = substituteVariables(config.variable2, context);
             let result = false;
             
             if (config.operator === "contains") result = val1.includes(val2);
             else if (config.operator === "equals") result = val1 === val2;
             else if (config.operator === "not_equals") result = val1 !== val2;
             else if (config.operator === "starts_with") result = val1.startsWith(val2);

             nextHandle = result ? 'true' : 'false';
          }
          else if (node.data.label === "Añadir Rol") {
            const roleId = substituteVariables(config.roleId, context);
            if (context.member && roleId) {
               await context.member.roles.add(roleId).catch(() => {});
            }
          }
          else if (node.data.label === "Remover Rol") {
            const roleId = substituteVariables(config.roleId, context);
            if (context.member && roleId) {
               await context.member.roles.remove(roleId).catch(() => {});
            }
          }
          else if (node.data.label === "Aislar Usuario") {
            const mins = parseFloat(config.durationMinutes) || 10;
            const reason = substituteVariables(config.reason, context);
            if (context.member && context.member.moderatable) {
               await context.member.timeout(mins * 60 * 1000, reason).catch(() => {});
            }
          }
          else if (node.data.label === "Expulsar Usuario") {
            const reason = substituteVariables(config.reason, context);
             if (context.member && context.member.kickable) {
               await context.member.kick(reason).catch(() => {});
            }
          }
          else if (node.data.label === "Banear Usuario") {
            const reason = substituteVariables(config.reason, context);
             if (context.member && context.member.bannable) {
               await context.member.ban({ reason }).catch(() => {});
            }
          }
          else if (node.data.label === "Crear Canal") {
            const channelName = substituteVariables(config.channelName, context);
             if (context.message && context.message.guild && channelName) {
               await context.message.guild.channels.create({ name: channelName }).catch(() => {});
            }
          }
          else if (node.data.label === "Borrar Canal") {
             if (context.channel && context.channel.deletable) {
               await context.channel.delete().catch(() => {});
            }
          }
          else if (node.data.label === "HTTP Request") {
             const url = substituteVariables(config.url, context);
             // Basic implementation, ignored for safe sandboxing
             console.log(`[HTTP Request] ${config.method} ${url}`);
          }
        } catch (execErr) {
          console.error(`Error executing node ${node.data.label}:`, execErr);
        }

        if (continueFlow) {
          const outgoing = getOutgoingEdges(nodeId, nextHandle);
          for (const edge of outgoing) {
            await executeNode(edge.target, context);
          }
        }
      };

      // --- SETUP EVENTS ---
      
      const ticketMessages = new Map<string, { author: string, content: string, timestamp: number }[]>();

      let player: Player | null = null;
      if (musicSettings) {
         player = new Player(client);
         await player.extractors.loadMulti(DefaultExtractors);
      }

      client.on("interactionCreate", async (interaction) => {
        // --- TICKET SYSTEM LOGIC ---
        if (interaction.isButton()) {
           if (interaction.customId === 'open_ticket') {
              const staffRole = allNodes.find(n => n.data.label === 'Panel de Tickets')?.data?.config?.staffRoleId;
              const categoryName = allNodes.find(n => n.data.label === 'Panel de Tickets')?.data?.config?.categoryName || 'TICKETS';
              
              const guild = interaction.guild;
              if (!guild) return;

              const channel = await guild.channels.create({
                 name: `🟢-nuevo-${interaction.user.username.slice(0, 10)}`,
                 type: ChannelType.GuildText,
                 permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    ...(staffRole ? [{ id: staffRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : [])
                 ]
              });

              const embed = new EmbedBuilder()
                 .setTitle("🎫 Ticket Abierto")
                 .setDescription("Bienvenido al soporte técnico. Un miembro del equipo te atenderá pronto.")
                 .setColor("#10b981");

              const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                 new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reclamar').setStyle(ButtonStyle.Secondary).setEmoji('⚫'),
                 new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar').setStyle(ButtonStyle.Danger).setEmoji('🔒')
              );

              await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
              await interaction.reply({ content: `Ticket creado en <#${channel.id}>`, ephemeral: true });
           }

           if (interaction.customId === 'claim_ticket') {
              const staffRole = allNodes.find(n => n.data.label === 'Panel de Tickets')?.data?.config?.staffRoleId;
              if (staffRole && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && !(interaction.member?.roles as any).cache.has(staffRole)) {
                 return interaction.reply({ content: "Solo el Staff puede reclamar este ticket.", ephemeral: true });
              }

              const channel = interaction.channel as any;
              if (channel) {
                 await channel.setName(channel.name.replace('🟢-nuevo-', '⚫-reclamado-'));
                 await interaction.reply({ content: `✅ Ticket reclamado por **${interaction.user.username}**` });
              }
           }

           if (interaction.customId === 'close_ticket') {
              const channel = interaction.channel as TextChannel;
              if (!channel) return;

              await interaction.deferReply({ ephemeral: true });

              // Fetch history instead of reliance on memory
              const fetchedMessages = await channel.messages.fetch({ limit: 100 });
              const messages = Array.from(fetchedMessages.values()).reverse().map(m => ({
                 author: m.author.tag,
                 content: m.content,
                 timestamp: m.createdTimestamp
              }));

              // Survey DM
              const surveyEmbed = new EmbedBuilder()
                 .setTitle("📊 Encuesta de Satisfacción")
                 .setDescription("¿Cómo fue tu experiencia con nuestro soporte? (1-5)")
                 .setColor("#5865F2");

              const surveyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                 [1, 2, 3, 4, 5].map(v => new ButtonBuilder().setCustomId(`survey_${channel.id}_${v}`).setLabel(v.toString()).setStyle(ButtonStyle.Primary))
              );

              // Find the ticket owner from channel name or topic (simple way: send to the user who opened it)
              const userId = interaction.guild?.members.cache.find(m => channel.name.includes(m.user.username.slice(0, 10)))?.id;
              if (userId) {
                 const user = await client.users.fetch(userId);
                 await user.send({ embeds: [surveyEmbed], components: [surveyRow] }).catch(() => {});
              }

              await interaction.editReply({ content: "✅ Transcript guardado. El canal se eliminará en breve..." });
              setTimeout(async () => {
                 try {
                    // Save Transcript
                    await setDoc(doc(db, 'transcripts', channel.id), {
                      ticketId: channel.id,
                      creatorId: userId || 'unknown',
                      guildId: interaction.guildId,
                      messages: messages,
                      rating: 0, 
                      closedAt: serverTimestamp()
                    });
                    console.log(`[Transcript] Saved for ${channel.id}`);
                 } catch (fsErr) {
                    console.error("[Firestore Error] Failed to save transcript:", fsErr);
                 }

                 try {
                   console.log(`[Channel] Attempting to delete ticket channel: ${channel.name} (${channel.id})`);
                   await channel.delete();
                 } catch (err) {
                   console.error("[Discord Error] Failed to delete channel:", err);
                 }
              }, 2000);
           }

           if (interaction.customId.startsWith('survey_')) {
              const [, channelId, rating] = interaction.customId.split('_');
              // Update rating in Firestore
              // Logic to find the recent transcript for this user/channel...
              // For now, simple acknowledge
              await interaction.reply({ content: "¡Gracias por tu valoración!", ephemeral: true });
           }
        }

        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'ver-transcript') {
              const staffRole = allNodes.find(n => n.data.label === 'Comando Auditoría')?.data?.config?.staffRoleId;
              if (staffRole && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && !(interaction.member?.roles as any).cache.has(staffRole)) {
                 return interaction.reply({ content: "No tienes permiso para ver auditorías.", ephemeral: true });
              }

              // Create a general access session for this staff member
              const sessionId = `audit_${interaction.user.id}_${Math.random().toString(36).substr(2, 5)}`;
              const staffPassword = `VDB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

              try {
                await setDoc(doc(db, 'ticket_sessions', sessionId), {
                   sessionId,
                   staffId: interaction.user.tag,
                   staffAvatar: interaction.user.displayAvatarURL(),
                   passwordHash: staffPassword,
                   type: 'GENERAL_ACCESS',
                   expiresAt: Date.now() + (8 * 3600000) // 8 hours for general access
                });
              } catch (fsErr) {
                console.error("[Firestore Error] Failed to create session:", fsErr);
                return interaction.reply({ content: "❌ Error al generar la sesión de acceso en la base de datos.", ephemeral: true });
              }

              let baseUrl = process.env.APP_URL || 'https://ais-dev-ne2kzjzdaf6cud5tsefaip-491850047701.europe-west2.run.app';
              if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
              const link = `${baseUrl.replace(/\/$/, '')}/transcript`;
              
              await interaction.reply({ 
                 content: `🔐 **Acceso Maestro a Auditoría (Válido 8h)**\n\n🔗 [Ir al Portal de Transcripts](${link})\n🔑 Tu Clave de Acceso: \`${staffPassword}\`\n\n*Esta clave te identifica en el sistema de logs.*`, 
                 ephemeral: true 
              });
           }
        }
        if (!interaction.isButton()) return;
        
        const customId = interaction.customId;
        
        if (customId.startsWith('btn:')) {
           const nodeId = customId.split(':')[1];
           
           const context = {
             interaction,
             user: interaction.user,
             member: interaction.member,
             channel: interaction.channel,
             guild: interaction.guild,
             client: client
           };

           // Trigger the next nodes connected to THIS button node's output handle "out"
           const outgoing = getOutgoingEdges(nodeId, 'out');
           for (const edge of outgoing) {
             await executeNode(edge.target, context);
           }
        } else {
          // Legacy support or fallback
          const [nodeId, buttonId] = customId.split(":");
          if (!nodeId || !buttonId) return;

          const context = {
            interaction,
            user: interaction.user,
            member: interaction.member,
            channel: interaction.channel,
            guild: interaction.guild,
            client: client
          };

          // Trigger the next nodes connected to THIS specific button handle
          const outgoing = getOutgoingEdges(nodeId, buttonId);
          for (const edge of outgoing) {
            await executeNode(edge.target, context);
          }
        }

        // Acknowledge the interaction
        if (!interaction.replied && !interaction.deferred) {
           await interaction.deferUpdate().catch(() => {});
        }
      });

      client.on("ready", () => {
        console.log(`Bot logged in as ${client.user?.tag}`);

        // Register Ticket Audit Command
        client.application?.commands.create({
           name: 'ver-transcript',
           description: 'Genera un acceso maestro al portal de auditoría de tickets.',
           options: []
        });
        
        if (musicSettings && musicSettings.songInStatus && client.user) {
           client.user.setActivity('Silencio', { type: ActivityType.Listening });
        }
      });

      client.on("messageCreate", async (message) => {
        if (message.author.bot) return; // Prevent bot loops

        // --- TICKET SYSTEM MESSAGE LOGIC ---
        if (message.channel.type === ChannelType.GuildText) {
           const channel = message.channel as TextChannel;
           if (channel.name.includes('nuevo-') || channel.name.includes('reclamado-') || channel.name.includes('notif-')) {
              // Store for transcript
              const msgs = ticketMessages.get(channel.id) || [];
              msgs.push({ author: message.author.tag, content: message.content, timestamp: Date.now() });
              ticketMessages.set(channel.id, msgs);

              const staffRole = allNodes.find(n => n.data.label === 'Panel de Tickets')?.data?.config?.staffRoleId;
              const isStaff = staffRole && (message.member?.roles.cache.has(staffRole) || message.member?.permissions.has(PermissionFlagsBits.Administrator));
              
              const isUser = !isStaff;

              if (isUser && channel.name.includes('reclamado-')) {
                 await channel.setName(channel.name.replace('⚫-reclamado-', '🔵-notific-'));
              } 
              else if (isStaff && (channel.name.includes('notific-') || channel.name.includes('nuevo-'))) {
                 const newName = channel.name.includes('notific-') ? 
                    channel.name.replace('🔵-notific-', '⚫-reclamado-') : 
                    channel.name.replace('🟢-nuevo-', '⚫-reclamado-');
                 await channel.setName(newName);

                 // DM User about staff message
                 const ticketOwnerId = message.guild?.members.cache.find(m => channel.name.includes(m.user.username.slice(0, 10)))?.id;
                 if (ticketOwnerId) {
                    const user = await client.users.fetch(ticketOwnerId);
                    await user.send(`📩 **Tienes un nuevo mensaje en tu ticket:**\n${message.url}`).catch(() => {});
                 }
              }
           }
        }

        // MUSIC MODULE INTERCEPTION
        if (player && musicSettings) {
           let thePrefix = musicSettings.prefix || "!";
           if (thePrefix === "@mention") thePrefix = `<@${client.user?.id}> `;
           
           if (message.content.startsWith(thePrefix) || message.content.startsWith("/play") || message.content.startsWith("/music")) {
              const args = message.content.trim().split(/ +/g);
              const cmd = args.shift()?.toLowerCase();
              
              if ((cmd === `${thePrefix.trim()}play` || cmd === `${thePrefix}play` || cmd === '/play') && args.length > 0) {
                 const query = args.join(" ");
                 if (!message.member?.voice?.channel) {
                    await message.reply("¡Debes estar en un canal de voz para reproducir música!");
                    return;
                 }
                 await message.reply(`🎵 Buscando y reproduciendo: **${query}**...`);
                 try {
                   await player.play(message.member.voice.channel, query, {
                       nodeOptions: {
                           metadata: message
                       }
                   });
                 } catch (e) {
                   await message.reply("Hubo un error intentando unirse o tocar la canción.");
                   console.log("Player error:", e);
                 }
                 return;
              }
              
              if (cmd === `${thePrefix.trim()}stop` || cmd === `${thePrefix}stop` || cmd === '/stop') {
                 const queue = player.nodes.get(message.guildId!);
                 if (!queue || !queue.isPlaying()) {
                     await message.reply("No estoy tocando nada.");
                     return;
                 }
                 queue.delete();
                 await message.reply("⏹️ Música detenida.");
                 return;
              }
              
              if (cmd === `${thePrefix.trim()}skip` || cmd === `${thePrefix}skip` || cmd === '/skip') {
                 const queue = player.nodes.get(message.guildId!);
                 if (!queue || !queue.isPlaying()) {
                     await message.reply("No estoy tocando nada.");
                     return;
                 }
                 queue.node.skip();
                 await message.reply("⏭️ Canción saltada.");
                 return;
              }
           }
        }

        // AI VOICE HELP INTERCEPTION
        if (message.content.startsWith("/ayudavoz")) {
           if (!message.member?.voice?.channel) {
              return message.reply("❌ Debes estar en un canal de voz para usar la ayuda por voz.");
           }

           const voiceChannel = message.member.voice.channel;
           const connection = joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: voiceChannel.guild.id,
              adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
              selfDeaf: false,
              selfMute: false
           });

           const audioPlayer = createAudioPlayer();
           connection.subscribe(audioPlayer);

           message.reply("🎙️ **Asistente de Voz Activado.** Estoy escuchando... (Conectando con Gemini Live via Bridge)");

           connection.on(VoiceConnectionStatus.Ready, () => {
              console.log("Voice connection ready for AI");
              
              // Find the configuration for system prompt if it exists in nodes
              const aiNode = allNodes.find(n => n.data.label === "Ayuda por Voz");
              const systemPrompt = aiNode?.data?.config?.systemPrompt || "Eres un asistente de voz en Discord.";

              const receiver = connection.receiver;
              const userId = message.author.id;
              
              // Registers session for global socket listener
              voiceSessions.set(voiceChannel.guild.id, { audioPlayer, userId });

              const opusStream = receiver.subscribe(userId, {
                 end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 1000,
                 },
              });

              const pcmStream = opusStream.pipe(new prism.opus.Decoder({ rate: 16000, channels: 1, frameSize: 960 }));

              pcmStream.on('data', (chunk) => {
                 if (io) {
                    io.emit("user-audio-chunk", {
                       userId,
                       audio: chunk.toString('base64'),
                       systemPrompt
                    });
                 }
              });

              connection.on(VoiceConnectionStatus.Disconnected, () => {
                 voiceSessions.delete(voiceChannel.guild.id);
                 audioPlayer.stop();
              });
           });
           return;
        }

        const context = {
          message: message,
          user: message.author,
          member: message.member,
          channel: message.channel,
          client: client
        };

        // Find relevant triggers
        const startNodes = allNodes.filter((n: any) => n.data.type === 'trigger');

        for (const trigger of startNodes) {
           const config = trigger.data.config || {};
           let startFlow = false;

           if (trigger.data.label === "On Message") {
              if (!config.mustContain || message.content.includes(config.mustContain)) {
                 startFlow = true;
              }
           } 
           else if (trigger.data.label === "Text Command") {
              if (config.trigger && message.content.startsWith(config.trigger)) {
                 startFlow = true;
              }
           }
           // Basic Slash command impersonation for ease of use (treating as text command prefixed with /)
           // since we don't register REST commands here dynamically due to async complex flows.
           else if (trigger.data.label === "Slash Command") {
              if (config.commandName && message.content.startsWith(`/${config.commandName}`)) {
                 startFlow = true;
              }
           }

           if (startFlow) {
             const outgoing = getOutgoingEdges(trigger.id);
             for (const edge of outgoing) {
                executeNode(edge.target, context); // Don't await, let multiple paths run independently
             }
           }
        }
      });

      client.on("guildMemberAdd", async (member) => {
         const context = {
            user: member.user,
            member: member,
            client: client
         };

         const startNodes = allNodes.filter((n: any) => n.data.label === "Member Joined");
         for (const trigger of startNodes) {
             const outgoing = getOutgoingEdges(trigger.id);
             for (const edge of outgoing) {
                executeNode(edge.target, context);
             }
         }
      });
      
      client.on("messageReactionAdd", async (reaction, user) => {
          if (user.bot) return;
          const context = {
            user: user,
            message: reaction.message,
            channel: reaction.message.channel,
            client: client
          };
          const startNodes = allNodes.filter((n: any) => n.data.label === "Reaction Added");
          for (const trigger of startNodes) {
              const config = trigger.data.config || {};
              if (!config.emoji || reaction.emoji.name === config.emoji) {
                  const outgoing = getOutgoingEdges(trigger.id);
                  for (const edge of outgoing) {
                     executeNode(edge.target, context);
                  }
              }
          }
      });

      // Login
      await client.login(token);

      res.status(200).json({ success: true, botTag: client.user?.tag || "Bot" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to start bot" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
