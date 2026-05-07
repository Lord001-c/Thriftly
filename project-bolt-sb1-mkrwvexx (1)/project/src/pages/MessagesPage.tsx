import { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ConversationPartner {
  userId: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastAt: string;
}

export default function MessagesPage() {
  const { sellerId } = useParams<{ sellerId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<ConversationPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [convLoading, setConvLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    initializePage();
  }, [user, authLoading, sellerId]);

  async function initializePage() {
    const convList = await fetchConversations();
    if (sellerId) {
      await resolveAndActivateSeller(sellerId, convList);
    }
  }

  async function fetchConversations(): Promise<ConversationPartner[]> {
    if (!user) return [];

    const { data: msgs } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, created_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs || msgs.length === 0) {
      setConvLoading(false);
      return [];
    }

    const convMap = new Map<string, { lastMessage: string; lastAt: string }>();
    for (const m of msgs) {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { lastMessage: m.content, lastAt: m.created_at });
      }
    }

    const otherIds = [...convMap.keys()];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', otherIds);

    const convList: ConversationPartner[] = (profiles || []).map((p) => ({
      userId: p.id,
      name: p.full_name || 'User',
      avatarUrl: p.avatar_url || null,
      lastMessage: convMap.get(p.id)?.lastMessage || '',
      lastAt: convMap.get(p.id)?.lastAt || '',
    }));

    setConversations(convList);
    setConvLoading(false);
    return convList;
  }

  async function resolveAndActivateSeller(sId: string, convList: ConversationPartner[]) {
    const { data } = await supabase
      .from('seller_profiles')
      .select('user_id')
      .eq('seller_id', sId)
      .maybeSingle();

    if (data?.user_id) {
      const existing = convList.find((c) => c.userId === data.user_id);
      if (existing) {
        setActiveUserId(existing.userId);
        setActivePartner(existing);
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', data.user_id)
          .maybeSingle();

        if (profile) {
          const partner: ConversationPartner = {
            userId: profile.id,
            name: profile.full_name || 'Seller',
            avatarUrl: profile.avatar_url || null,
            lastMessage: '',
            lastAt: '',
          };
          setActiveUserId(profile.id);
          setActivePartner(partner);
        }
      }
    }
  }

  useEffect(() => {
    if (!activeUserId || !user) return;
    fetchMessages();
    setupRealtimeChannel();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [activeUserId, user]);

  async function fetchMessages() {
    if (!user || !activeUserId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${activeUserId}),and(sender_id.eq.${activeUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  function setupRealtimeChannel() {
    if (!user || !activeUserId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel(`conv-${[user.id, activeUserId].sort().join('-')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        if (
          (m.sender_id === user.id && m.receiver_id === activeUserId) ||
          (m.sender_id === activeUserId && m.receiver_id === user.id)
        ) {
          setMessages((prev) => [...prev, m]);
        }
      })
      .subscribe();
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!user || !activeUserId || !messageText.trim() || sending) return;
    setSending(true);
    const content = messageText.trim();
    setMessageText('');
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeUserId,
      content,
    });
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function selectConversation(conv: ConversationPartner) {
    setActiveUserId(conv.userId);
    setActivePartner(conv);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-black animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const allPartners = activePartner && !conversations.find((c) => c.userId === activePartner.userId)
    ? [activePartner, ...conversations]
    : conversations;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <h1 className="text-xl font-semibold text-zinc-950">Messages</h1>
      </div>

      <div className="bg-white rounded-[24px] border border-zinc-100 overflow-hidden flex h-[calc(100vh-180px)] min-h-[500px]">
        {/* Conversation list */}
        <div className={`w-full sm:w-72 sm:min-w-[280px] border-r border-zinc-100 flex flex-col ${activeUserId ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-3.5 border-b border-zinc-100">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Conversations</p>
          </div>

          {convLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="shimmer w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-3 w-24 rounded-full" />
                    <div className="shimmer h-3 w-36 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : allPartners.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <MessageCircle size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-400">No conversations yet</p>
              <p className="text-xs text-zinc-300 mt-1">Message a seller from a listing</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {allPartners.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => selectConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors ${
                    activeUserId === conv.userId ? 'bg-zinc-50' : ''
                  }`}
                >
                  {conv.avatarUrl ? (
                    <img
                      src={conv.avatarUrl}
                      alt={conv.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-600 shrink-0">
                      {conv.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-950 truncate">{conv.name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {conv.lastMessage || 'New conversation'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message thread */}
        <div className={`flex-1 flex flex-col ${!activeUserId ? 'hidden sm:flex' : 'flex'}`}>
          {!activeUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <MessageCircle size={24} className="text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-400">Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-100">
                <button
                  onClick={() => setActiveUserId(null)}
                  className="sm:hidden w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
                >
                  <ArrowLeft size={16} className="text-zinc-600" />
                </button>
                {activePartner?.avatarUrl ? (
                  <img
                    src={activePartner.avatarUrl}
                    alt={activePartner.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600">
                    {activePartner?.name[0]?.toUpperCase()}
                  </div>
                )}
                <p className="text-sm font-semibold text-zinc-950">{activePartner?.name}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-zinc-300 py-10">
                    No messages yet. Say hello!
                  </p>
                )}
                {messages.map((m) => {
                  const isMe = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-[18px] text-sm ${
                          isMe
                            ? 'bg-black text-white rounded-br-sm'
                            : 'bg-zinc-100 text-zinc-900 rounded-bl-sm'
                        }`}
                      >
                        <p>{m.content}</p>
                        <p className="text-[10px] mt-1 text-zinc-400">
                          {new Date(m.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="p-4 border-t border-zinc-100 flex gap-3 items-center">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-zinc-100 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending}
                  className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 disabled:bg-zinc-200 transition-colors shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
