import { VNode, VEdge } from '../types';

export const TEMPLATES = [
  {
    name: 'Comando Simple: Ping',
    type: 'command',
    nodes: JSON.stringify([
      { id: 't1', type: 'triggerNode', position: { x: 100, y: 150 }, data: { label: 'Slash Command', type: 'trigger', icon: 'TerminalSquare', config: { commandName: 'ping', description: '¡Responde con Pong!' } } },
      { id: 'a1', type: 'actionNode', position: { x: 400, y: 150 }, data: { label: 'Reply to Command', type: 'action', icon: 'Reply', config: { messageContent: '¡Pong! 🏓', ephemeral: 'false' } } }
    ]),
    edges: JSON.stringify([
      { id: 'e1', source: 't1', target: 'a1' }
    ])
  },
  {
    name: 'Evento: Mensaje de Bienvenida',
    type: 'event',
    nodes: JSON.stringify([
      { id: 't1', type: 'triggerNode', position: { x: 100, y: 150 }, data: { label: 'Member Joined', type: 'trigger', icon: 'UserPlus', config: {} } },
      { id: 'a1', type: 'actionNode', position: { x: 400, y: 150 }, data: { label: 'Send Embed', type: 'action', icon: 'LayoutTemplate', config: { channelId: 'general', embedTitle: '¡Bienvenido al servidor!', embedDescription: '¡Me alegra tenerte aquí, {user.name}!', hexColor: '#5865F2' } } },
      { id: 'a2', type: 'actionNode', position: { x: 700, y: 150 }, data: { label: 'Add Role', type: 'action', icon: 'ShieldHalf', config: { roleId: 'RolUsuario', userId: '{user.id}' } } }
    ]),
    edges: JSON.stringify([
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 'a2' }
    ])
  },
  {
    name: 'Sistema de Tickets Básico',
    type: 'message',
    nodes: JSON.stringify([
      { id: 't1', type: 'triggerNode', position: { x: 100, y: 50 }, data: { label: 'Text Command', type: 'trigger', icon: 'MessageCircle', config: { trigger: '!ticket' } } },
      { id: 'a1', type: 'actionNode', position: { x: 400, y: 50 }, data: { label: 'Send Embed', type: 'action', icon: 'LayoutTemplate', config: { embedTitle: 'Ticket Creado', embedDescription: 'Un moderador estará contigo en breve.', hexColor: '#10b981' } } }
    ]),
    edges: JSON.stringify([
      { id: 'e1', source: 't1', target: 'a1' }
    ])
  },
  {
    name: 'Sistema de Tickets (Alta Seguridad)',
    type: 'ticket',
    nodes: JSON.stringify([
      { id: 't-panel', type: 'triggerNode', position: { x: 50, y: 50 }, data: { label: 'Panel de Tickets', type: 'trigger', icon: 'Ticket', config: { panelTitle: 'Soporte de Alta Seguridad', panelBody: 'Pulsa el botón de abajo para abrir un ticket privado auditado.', buttonLabel: 'Abrir Soporte', staffRoleId: '1234567890', categoryName: 'TICKETS' } } },
      { id: 't-audit', type: 'triggerNode', position: { x: 50, y: 300 }, data: { label: 'Comando Auditoría', type: 'trigger', icon: 'ShieldCheck', config: { commandName: 'ver-transcript', staffRoleId: '1234567890' } } }
    ]),
    edges: JSON.stringify([])
  }
];
