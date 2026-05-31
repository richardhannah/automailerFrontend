import { useEffect, useRef, useState, useCallback } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { API_URL } from '../config';

export interface ChatMsg {
  chatMessageId: number;
  senderName: string;
  isAdmin: boolean;
  text: string;
  sentAt: string;
}

export function useChatConnection(senderName: string | null, isAdmin: boolean) {
  const connectionRef = useRef<HubConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  useEffect(() => {
    if (!senderName) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveMessage', (msg: ChatMsg) => {
      setMessages(prev => [...prev.slice(-499), msg]);
    });

    connection.on('ChatHistory', (history: ChatMsg[]) => {
      setMessages(history);
    });

    connection.onclose(() => setConnected(false));
    connection.onreconnected(() => {
      setConnected(true);
      connection.invoke('GetHistory').catch(console.error);
    });

    connection.start().then(() => {
      setConnected(true);
      connection.invoke('GetHistory').catch(console.error);
    }).catch((err) => console.error('Chat connection failed:', err));

    return () => {
      connection.stop();
    };
  }, [senderName]);

  const sendMessage = useCallback((text: string) => {
    if (!connectionRef.current || !senderName) return;
    connectionRef.current.invoke('SendMessage', senderName, isAdmin, text).catch(console.error);
  }, [senderName, isAdmin]);

  return { connected, messages, sendMessage };
}
