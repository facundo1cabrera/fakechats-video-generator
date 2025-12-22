export interface Participant {
  id: string;
  name: string;
}

export interface Message {
  from: string;
  text: string;
}

export interface ChatConfig {
  theme: string;
  participants: Participant[];
  messages: Message[];
}

export interface Resolution {
  w: number;
  h: number;
}

export interface Overlay {
  messageIndex: number;      // Starting message index
  endMessageIndex: number;    // Ending message index (inclusive)
  start: number;
  end: number;
  x: number;
  y: number;
  w: number;
}

export interface Project {
  bgVideo: string;
  output: string;
  fps: number;
  resolution: Resolution;
  chat: ChatConfig;
  overlays: Overlay[];
}

export function validateProject(project: any): project is Project {
  if (!project || typeof project !== 'object') {
    throw new Error('Project must be an object');
  }

  if (typeof project.bgVideo !== 'string' || !project.bgVideo) {
    throw new Error('bgVideo must be a non-empty string');
  }

  if (typeof project.output !== 'string' || !project.output) {
    throw new Error('output must be a non-empty string');
  }

  if (typeof project.fps !== 'number' || project.fps <= 0) {
    throw new Error('fps must be a positive number');
  }

  if (!project.resolution || typeof project.resolution.w !== 'number' || typeof project.resolution.h !== 'number') {
    throw new Error('resolution must have w and h as numbers');
  }

  if (!project.chat || typeof project.chat !== 'object') {
    throw new Error('chat must be an object');
  }

  if (typeof project.chat.theme !== 'string') {
    throw new Error('chat.theme must be a string');
  }

  if (!Array.isArray(project.chat.participants)) {
    throw new Error('chat.participants must be an array');
  }

  for (const p of project.chat.participants) {
    if (typeof p.id !== 'string' || typeof p.name !== 'string') {
      throw new Error('Each participant must have id and name as strings');
    }
  }

  if (!Array.isArray(project.chat.messages)) {
    throw new Error('chat.messages must be an array');
  }

  for (const m of project.chat.messages) {
    if (typeof m.from !== 'string' || typeof m.text !== 'string') {
      throw new Error('Each message must have from and text as strings');
    }
  }

  if (!Array.isArray(project.overlays)) {
    throw new Error('overlays must be an array');
  }

  for (const o of project.overlays) {
    if (
      typeof o.messageIndex !== 'number' ||
      typeof o.endMessageIndex !== 'number' ||
      typeof o.start !== 'number' ||
      typeof o.end !== 'number' ||
      typeof o.x !== 'number' ||
      typeof o.y !== 'number' ||
      typeof o.w !== 'number'
    ) {
      throw new Error('Each overlay must have messageIndex, endMessageIndex, start, end, x, y, w as numbers');
    }
    if (o.messageIndex < 0 || o.messageIndex >= project.chat.messages.length) {
      throw new Error(`Overlay messageIndex ${o.messageIndex} is out of bounds`);
    }
    if (o.endMessageIndex < 0 || o.endMessageIndex >= project.chat.messages.length) {
      throw new Error(`Overlay endMessageIndex ${o.endMessageIndex} is out of bounds`);
    }
    if (o.messageIndex > o.endMessageIndex) {
      throw new Error(`Overlay messageIndex ${o.messageIndex} must be <= endMessageIndex ${o.endMessageIndex}`);
    }
  }

  return true;
}

