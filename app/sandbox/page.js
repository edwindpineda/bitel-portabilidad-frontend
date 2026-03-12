"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Settings,
  Plus,
  Send,
  MessageSquare,
  Bot,
  User,
  Trash2,
  Image as ImageIcon,
  Paperclip,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import {
  getConfiguracion,
  saveConfiguracion,
  updateConfiguracion,
  getChats,
  createChat,
  deleteChat,
  getMessages,
  sendMessage,
} from "@/lib/sandboxService";

// ==================== Componente ConfigDialog ====================
function ConfigDialog({ open, onOpenChange, config, onSave }) {
  const [urlBot, setUrlBot] = useState("");
  const [canal, setCanal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && config) {
      setUrlBot(config.url_bot_service || "");
      setCanal(config.canal || "");
    }
  }, [open, config]);

  const handleSave = async () => {
    if (!urlBot.trim() || !canal.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const data = { url_bot_service: urlBot.trim(), canal: canal.trim() };
      if (config?.id) {
        await updateConfiguracion(config.id, data);
      } else {
        await saveConfiguracion(data);
      }
      toast.success("Configuración guardada");
      onSave({ ...config, ...data });
      onOpenChange(false);
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración del Sandbox</DialogTitle>
          <DialogDescription>
            Configura la URL del bot y el canal para las pruebas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL del Bot Service</label>
            <Input
              placeholder="https://mi-bot.example.com/webhook"
              value={urlBot}
              onChange={(e) => setUrlBot(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Endpoint que recibirá los mensajes enviados
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Canal</label>
            <Input
              placeholder="sandbox-test"
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Identificador del canal para el historial de chats
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Componente NewChatDialog ====================
function NewChatDialog({ open, onOpenChange, onCreate }) {
  const [channel, setChannel] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) setChannel("");
  }, [open]);

  const handleCreate = async () => {
    if (!channel.trim()) {
      toast.error("El canal es obligatorio");
      return;
    }
    setCreating(true);
    try {
      const chat = await createChat({ channel: channel.trim() });
      toast.success("Chat creado");
      onCreate(chat);
      onOpenChange(false);
    } catch {
      toast.error("Error al crear el chat");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Chat</DialogTitle>
          <DialogDescription>
            Crea una nueva conversación de prueba con el bot.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Canal</label>
            <Input
              placeholder="mi-canal-test"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creando..." : "Crear Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Componente MediaContent ====================
function MediaContent({ message, isUser }) {
  const { type, url, message: text } = message;

  if (type === "image" && url) {
    return (
      <div className="space-y-1">
        <img src={url} alt="imagen" className="max-w-[280px] rounded-lg" />
        {text && <p className="mt-1">{text}</p>}
      </div>
    );
  }

  if (type === "video" && url) {
    return (
      <div className="space-y-1">
        <video
          src={url}
          controls
          className="max-w-[280px] rounded-lg"
          preload="metadata"
        />
        {text && <p className="mt-1">{text}</p>}
      </div>
    );
  }

  if (type === "pdf" && url) {
    const fileName = url.split("/").pop() || "documento.pdf";
    return (
      <div className="space-y-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
            isUser
              ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
              : "border-border hover:bg-accent"
          }`}
        >
          <div
            className={`shrink-0 w-10 h-10 rounded flex items-center justify-center text-xs font-bold ${
              isUser ? "bg-primary-foreground/20" : "bg-destructive/10 text-destructive"
            }`}
          >
            PDF
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p
              className={`text-[10px] ${
                isUser ? "text-primary-foreground/60" : "text-muted-foreground"
              }`}
            >
              Abrir documento
            </p>
          </div>
        </a>
        {text && <p className="mt-1">{text}</p>}
      </div>
    );
  }

  return <p className="whitespace-pre-wrap">{text}</p>;
}

// ==================== Componente ChatBubble ====================
function ChatBubble({ message }) {
  const isUser = message.direction === "outgoing";
  const hasMedia = ["image", "video", "pdf"].includes(message.type) && message.url;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className="flex items-end gap-2 max-w-[75%]">
        {!isUser && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          }`}
        >
          <MediaContent message={message} isUser={isUser} />
          <p
            className={`text-[10px] mt-1 ${
              isUser
                ? "text-primary-foreground/60"
                : "text-muted-foreground"
            }`}
          >
            {message.fecha_hora
              ? new Date(message.fecha_hora).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </p>
        </div>
        {isUser && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

// ==================== Componente Principal ====================
export default function SandboxPage() {
  const [config, setConfig] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cargar configuración al montar
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getConfiguracion();
        setConfig(data);
      } catch {
        // Sin configuración aún
      }
    };
    loadConfig();
  }, []);

  // Cargar chats cuando hay config con canal
  useEffect(() => {
    if (config?.canal) {
      loadChats(config.canal);
    }
  }, [config?.canal]);

  const loadChats = async (canal) => {
    setLoadingChats(true);
    try {
      const data = await getChats(canal);
      setChats(Array.isArray(data) ? data : []);
    } catch {
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId) => {
    setLoadingMessages(true);
    try {
      const data = await getMessages(chatId);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || sending) return;
    if (!config?.url_bot_service) {
      toast.error("Configura la URL del bot primero");
      setConfigOpen(true);
      return;
    }

    setSending(true);
    setInputMessage("");

    // Mensaje optimista del usuario
    const tempMsg = {
      id: Date.now(),
      direction: "outgoing",
      message: text,
      type: "text",
      fecha_hora: new Date().toISOString(),
      id_chat_sandbox: selectedChat.id,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await sendMessage(selectedChat.id, {
        message: text,
        type: "text",
        direction: "outgoing",
      });
      // Recargar mensajes para obtener respuesta del bot
      setTimeout(() => loadMessages(selectedChat.id), 1500);
    } catch {
      toast.error("Error al enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
      toast.success("Chat eliminado");
    } catch {
      toast.error("Error al eliminar el chat");
    }
  };

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
  };

  const handleNewChat = (chat) => {
    setChats((prev) => [chat, ...prev]);
    setSelectedChat(chat);
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ===== Sidebar de Chats ===== */}
      <div className="w-[360px] border-r flex flex-col bg-card">
        {/* Header sidebar */}
        <div className="h-16 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfigOpen(true)}
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold text-lg">Sandbox</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNewChatOpen(true)}
            title="Nuevo chat"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Lista de chats */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Cargando chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground px-6 text-center">
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No hay chats aún</p>
              <p className="text-xs mt-1">
                {config?.canal
                  ? 'Presiona "+" para crear uno'
                  : "Configura el canal primero"}
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-colors hover:bg-accent/50 group ${
                  selectedChat?.id === chat.id ? "bg-accent" : ""
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    Chat #{chat.id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.channel || chat.canal || "Sin canal"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    {chat.fecha_hora
                      ? new Date(chat.fecha_hora).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== Área de Chat ===== */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header del chat */}
            <div className="h-16 border-b flex items-center px-6 bg-card shrink-0">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  Chat #{selectedChat.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedChat.channel || selectedChat.canal || "Bot sandbox"}
                </p>
              </div>
            </div>

            {/* Mensajes */}
            <div
              className="flex-1 overflow-y-auto px-6 py-4"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Cargando mensajes...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bot className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-sm font-medium">Sin mensajes</p>
                  <p className="text-xs mt-1">
                    Envía un mensaje para iniciar la conversación
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="border-t bg-card px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSendMessage()
                  }
                  disabled={sending}
                  className="flex-1 rounded-full bg-background"
                />
                <Button
                  size="icon"
                  className="rounded-full shrink-0"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Estado vacío - sin chat seleccionado */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-accent/20">
            <div className="bg-card p-8 rounded-2xl shadow-sm text-center max-w-sm">
              <Bot className="h-20 w-20 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sandbox de Chatbot
              </h3>
              <p className="text-sm mb-6">
                Prueba tus bots sin necesidad de un número real. Selecciona un
                chat o crea uno nuevo.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
                <Button size="sm" onClick={() => setNewChatOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Chat
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== Diálogos ===== */}
      <ConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        config={config}
        onSave={handleConfigSave}
      />
      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onCreate={handleNewChat}
      />
    </div>
  );
}