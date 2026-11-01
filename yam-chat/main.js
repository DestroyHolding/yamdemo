// Durum + olay bağlama. Diğer dosyaları birbirine bağlar.
(() => {
  const $ = (id) => document.getElementById(id);

  let username = '';
  let isTyping = false;
  let typingTimeout = null;

  /* ---- Giriş / çıkış ---- */
  async function login() {
    const name = ui.readUsername();
    if (name.length < CONFIG.MIN_USERNAME_LENGTH) {
      ui.toast(`En az ${CONFIG.MIN_USERNAME_LENGTH} karakter yaz!`);
      return;
    }
    username = name;
    ui.setProfile(username);
    ui.showApp();

    const { data, error } = await chat.fetchMessages();
    if (error) ui.toast('Yüklenemedi: ' + error.message);
    else ui.renderMessages(data, username);

    chat.subscribeMessages({
      onInsert: (m) => { ui.removeEmptyHint(); ui.appendMessage(m, username); ui.scrollToBottom(); },
      onError: () => ui.toast('Canlı bağlantı kurulamadı'),
    });

    chat.joinPresence({
      username,
      onUsers: (users) => ui.renderOnline(users, username),
      onTyping: (who, active) => { if (who !== username) ui.updateTyping(who, active); },
    });
  }

  function logout() {
    chat.disconnect();
    ui.resetChatUI();
    ui.showLogin();
    username = '';
  }

  /* ---- Mesaj gönderme ---- */
  async function send() {
    const input = $('msgInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    clearTimeout(typingTimeout);
    isTyping = false;
    chat.sendTyping(username, false);

    const { error } = await chat.sendMessage(username, text);
    if (error) ui.toast('Gönderilemedi: ' + error.message);
  }

  function onInput() {
    const input = $('msgInput');
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, CONFIG.INPUT_MAX_HEIGHT_PX) + 'px';

    if (!isTyping) { isTyping = true; chat.sendTyping(username, true); }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => { isTyping = false; chat.sendTyping(username, false); }, CONFIG.TYPING_TIMEOUT_MS);
  }

  /* ---- İlk açılışta hoş geldin yazısı (bir kez) ---- */
  const WELCOME_KEY = 'yam_welcome_seen';

  function welcomeSeen() {
    try { return localStorage.getItem(WELCOME_KEY) === '1'; } catch (e) { return false; }
  }

  function closeWelcome() {
    $('welcomeModal').style.display = 'none';
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch (e) {}
  }

  if (!welcomeSeen()) $('welcomeModal').style.display = 'flex';
  $('welcomeCloseBtn').addEventListener('click', closeWelcome);

  /* ---- Olayları bağla ---- */
  $('loginBtn').addEventListener('click', login);
  $('usernameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
  $('logoutBtn').addEventListener('click', logout);
  $('sendBtn').addEventListener('click', send);
  $('msgInput').addEventListener('input', onInput);
  $('msgInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  document.querySelectorAll('.tbtn').forEach((b) => b.addEventListener('click', () => ui.showTab(b.dataset.tab)));
})();
