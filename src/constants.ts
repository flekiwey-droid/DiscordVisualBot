
import { NodeCategory } from './types';

export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'commands',
    label: 'Comandos Personalizados',
    nodes: [
      {
        type: 'triggerNode',
        label: 'Comando Slash',
        description: 'Crea un comando /slash de Discord. Se activa cuando un usuario lo ejecuta.',
        defaultData: {
          label: 'Comando Slash',
          type: 'trigger',
          icon: 'TerminalSquare',
          description: 'Se ejecuta cuando un usuario usa un /comando',
          config: {
            commandName: 'ayuda',
            description: 'Muestra el menú de ayuda',
            isEphemeral: 'false'
          }
        }
      },
      {
        type: 'triggerNode',
        label: 'Comando de Texto',
        description: 'Comando legado !comando. Se activa cuando un mensaje empieza con el prefijo.',
        defaultData: {
          label: 'Comando de Texto',
          type: 'trigger',
          icon: 'MessageCircle',
          description: 'Se activa al empezar un mensaje con prefijo',
          config: {
            trigger: '!ping',
            ignoreBots: 'true'
          }
        }
      }
    ]
  },
  {
    id: 'events',
    label: 'Eventos de Discord',
    nodes: [
      {
        type: 'triggerNode',
        label: 'Al Recibir Mensaje',
        description: 'Se ejecuta cuando se recibe cualquier mensaje en el servidor.',
        defaultData: {
          label: 'Al Recibir Mensaje',
          type: 'trigger',
          icon: 'MessageSquare',
          description: 'Se ejecuta cuando se recibe un mensaje',
          config: {
            mustContain: '',
            ignoreBots: 'true'
          }
        }
      },
      {
        type: 'triggerNode',
        label: 'Miembro Nuevo',
        description: 'Se ejecuta cuando un usuario entra al servidor.',
        defaultData: {
          label: 'Miembro Nuevo',
          type: 'trigger',
          icon: 'UserPlus',
          description: 'Da la bienvenida a nuevos miembros',
          config: {
            sendWelcomeMessage: 'true'
          }
        }
      },
      {
        type: 'triggerNode',
        label: 'Reaccion a Mensaje',
        description: 'Se ejecuta cuando un usuario reacciona a un mensaje.',
        defaultData: {
          label: 'Reaccion a Mensaje',
          type: 'trigger',
          icon: 'SmilePlus',
          description: 'Ejecutado por reacciones',
          config: {
            emoji: '👍',
            messageId: ''
          }
        }
      }
    ]
  },
  {
    id: 'messages',
    label: 'Mensajes y Embeds',
    nodes: [
      {
        type: 'actionNode',
        label: 'Enviar Mensaje',
        description: 'Envía un mensaje de texto plano a un canal.',
        defaultData: {
          label: 'Enviar Mensaje',
          type: 'action',
          icon: 'Send',
          description: 'Envía texto a un canal',
          config: {
            channelId: 'Canal Actual',
            messageContent: '¡Hola !',
            buttons: []
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Enviar Embed',
        description: 'Construye y envía un mensaje embed enriquecido.',
        defaultData: {
          label: 'Enviar Embed',
          type: 'action',
          icon: 'LayoutTemplate',
          description: 'Construye un embed de Discord',
          config: {
            channelId: 'Canal Actual',
            embedTitle: 'Título del Embed',
            embedDescription: 'La descripción del embed aquí...',
            hexColor: '#5865F2',
            thumbnailUrl: '',
            imageUrl: '',
            buttons: []
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Reaccionar a Mensaje',
        description: 'Añade una reacción al mensaje que ejecutó el evento.',
        defaultData: {
          label: 'Reaccionar a Mensaje',
          type: 'action',
          icon: 'SmilePlus',
          description: 'Reacciona con un emoji',
          config: {
            emoji: '👍'
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Borrar Mensaje',
        description: 'Borra el mensaje que activó este evento.',
        defaultData: {
          label: 'Borrar Mensaje',
          type: 'action',
          icon: 'Trash',
          description: 'Borra el mensaje detonador',
          config: {}
        }
      },
      {
        type: 'actionNode',
        label: 'Responder Interaccion',
        description: 'Responde directamente al usuario que usó el comando slash.',
        defaultData: {
          label: 'Responder Comando',
          type: 'action',
          icon: 'Reply',
          description: 'Responde a interacciones slash',
          config: {
            messageContent: '¡Comando ejecutado con éxito!',
            ephemeral: 'true',
            buttons: []
          }
        }
      }
    ]
  },
  {
    id: 'moderation',
    label: 'Moderación',
    nodes: [
      {
        type: 'actionNode',
        label: 'Añadir Rol',
        description: 'Asigna un rol de Discord a un miembro.',
        defaultData: {
          label: 'Añadir Rol',
          type: 'action',
          icon: 'ShieldHalf',
          description: 'Da un rol a un usuario',
          config: {
            roleId: '',
            userId: '{user.id}'
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Remover Rol',
        description: 'Quita un rol de Discord a un miembro.',
        defaultData: {
          label: 'Remover Rol',
          type: 'action',
          icon: 'ShieldMinus',
          description: 'Quita un rol a un usuario',
          config: {
            roleId: '',
            userId: '{user.id}'
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Aislar Usuario (Timeout)',
        description: 'Inhabilita al usuario para chatear temporalmente.',
        defaultData: {
          label: 'Aislar Usuario',
          type: 'action',
          icon: 'Clock4',
          description: 'Aísla a un usuario',
          config: {
            userId: '{user.id}',
            durationMinutes: '10',
            reason: 'Violación de las normas'
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Expulsar Usuario (Kick)',
        description: 'Expulsa a un usuario del servidor.',
        defaultData: {
          label: 'Expulsar Usuario',
          type: 'action',
          icon: 'UserMinus',
          description: 'Expulsa a un usuario',
          config: {
            userId: '{user.id}',
            reason: ''
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Banear Usuario (Ban)',
        description: 'Banea a un usuario del servidor.',
        defaultData: {
          label: 'Banear Usuario',
          type: 'action',
          icon: 'Hammer',
          description: 'Banea a un usuario',
          config: {
            userId: '{user.id}',
            reason: ''
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Crear Canal',
        description: 'Crea un nuevo canal de texto en el servidor.',
        defaultData: {
          label: 'Crear Canal',
          type: 'action',
          icon: 'Hash',
          description: 'Crea un nuevo canal',
          config: {
            channelName: 'nuevo-canal',
            categoryName: ''
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Borrar Canal',
        description: 'Borra un canal de texto.',
        defaultData: {
          label: 'Borrar Canal',
          type: 'action',
          icon: 'Trash2',
          description: 'Borra un canal',
          config: {
            channelId: '{channel.id}'
          }
        }
      }
    ]
  },
  {
    id: 'logic',
    label: 'Logica y Utilidad',
    nodes: [
      {
        type: 'logicNode',
        label: '¿Tiene Rol?',
        description: 'Verifica si el usuario tiene un rol especifico.',
        defaultData: {
          label: '¿Tiene Rol?',
          type: 'logic',
          icon: 'ShieldQuestion',
          description: 'Divide en flujo si lo tiene',
          config: {
            roleId: '',
            userId: '{user.id}'
          }
        }
      },
      {
        type: 'logicNode',
        label: 'Condicion (If/Else)',
        description: 'Divide el flujo de logica a base de una condicion personalizada.',
        defaultData: {
          label: 'Condicion',
          type: 'logic',
          icon: 'GitBranch',
          description: 'Logica If/Else',
          config: {
            variable1: '{message.content}',
            operator: 'contains',
            variable2: 'hola'
          }
        }
      },
      {
        type: 'actionNode',
        label: 'Esperar / Delay',
        description: 'Pausa la ejecución para un tiempo especifico.',
        defaultData: {
          label: 'Delay',
          type: 'action',
          icon: 'Hourglass',
          description: 'Pausa la ejecucion',
          config: {
            duration: '5',
            unit: 'seconds'
          }
        }
      },
      {
        type: 'variableNode',
        label: 'Peticion HTTP',
        description: 'Hace una peticion API externa (GET, POST, etc.)',
        defaultData: {
          label: 'Peticion HTTP',
          type: 'variable',
          icon: 'Globe',
          description: 'Adquiere datos de una API',
          config: {
            method: 'GET',
            url: 'https://api.example.com/data',
            headers: '{}'
          }
        }
      }
    ]
  },
  {
    id: 'ai',
    label: 'IA & Voz',
    nodes: [
      {
        type: 'triggerNode',
        label: 'Ayuda por Voz',
        description: 'Se activa al usar /ayudavoz. El bot se une al canal e inicia una sesión con Gemini Live.',
        defaultData: {
          label: 'Ayuda por Voz',
          type: 'trigger',
          icon: 'Mic',
          description: 'Activa asistencia de voz con IA',
          config: {
            commandName: 'ayudavoz',
            systemPrompt: 'Eres un asistente de voz servicial en Discord. Responde de forma concisa.'
          }
        }
      }
    ]
  },
  {
    id: 'tickets',
    label: 'Sistema de Tickets (Seguro)',
    nodes: [
      {
        type: 'triggerNode',
        label: 'Panel de Tickets',
        description: 'Crea un botón para que los usuarios abran tickets.',
        defaultData: {
          label: 'Panel de Tickets',
          type: 'trigger',
          icon: 'Ticket',
          description: 'Panel de apertura de soporte',
          config: {
            panelTitle: 'Soporte Técnico',
            panelBody: 'Pulsa el botón de abajo para abrir un ticket.',
            buttonLabel: 'Abrir Ticket',
            staffRoleId: '',
            categoryName: 'TICKETS'
          }
        }
      },
      {
        type: 'triggerNode',
        label: 'Audit Log Viewer',
        description: 'Comando /ver-transcript exclusivo para Staff.',
        defaultData: {
          label: 'Comando Auditoría',
          type: 'trigger',
          icon: 'ShieldCheck',
          description: 'Comando de seguridad /ver-transcript',
          config: {
            commandName: 'ver-transcript',
            staffRoleId: ''
          }
        }
      }
    ]
  }
];
