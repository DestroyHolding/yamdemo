// Supabase ile konuşan her şey burada. Ekrana dokunmaz.
const chat = (() => {
  const db = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

  let msgChannel = null;
  let presenceChannel = null;

  /* ---- Mesajlar ---- */
  function fetchMessages() {
    return db.from('messages').select('*').order('created_at', { ascending: true }).limit(CONFIG.MESSAGE_LIMIT);
  }

  function sendMessage(username, text) {
    return db.from('messages').insert({ username, text });
  }

  function subscribeMessages({ onInsert, onError }) {
    msgChannel = db.channel('msgs-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => onInsert(p.new))
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onError();
      });
  }

  /* ---- Çevrimiçi kullanıcılar + "yazıyor" ---- */
  function joinPresence({ username, onUsers, onTyping }) {
    presenceChannel = db.channel('presence-room', { config: { presence: { key: username } } });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = {};
        for (const k in state) { const u = state[k][0]; users[u.username] = u; }
        onUsers(users);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => onTyping(payload.username, payload.typing))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await presenceChannel.track({ username });
      });
  }

  function sendTyping(username, active) {
    if (presenceChannel) {
      presenceChannel.send({ type: 'broadcast', event: 'typing', payload: { username, typing: active } });
    }
  }

  /* ---- Ayrılırken hepsini kapat ---- */
  function disconnect() {
    if (presenceChannel) { db.removeChannel(presenceChannel); presenceChannel = null; }
    if (msgChannel) { db.removeChannel(msgChannel); msgChannel = null; }
  }

  return { fetchMessages, sendMessage, subscribeMessages, joinPresence, sendTyping, disconnect };
})();
