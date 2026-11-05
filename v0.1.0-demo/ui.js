// Sadece DOM'u günceller. Supabase'i bilmez.
const ui = (() => {
  const $ = (id) => document.getElementById(id);

  /* ---- Yardımcılar ---- */
  const AVATAR_COUNT = 8;
  const colorCache = {};

  function avatarClass(name) {
    if (!colorCache[name]) {
      let h = 0;
      for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COUNT;
      colorCache[name] = 'av' + h;
    }
    return colorCache[name];
  }
  const initials = (name) => name.slice(0, 2).toUpperCase();
  const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  const timeStr = (ts) => {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  };

  /* ---- Ekranlar, sekmeler, toast ---- */
  function readUsername() { return $('usernameInput').value.trim(); }

  function showApp() {
    $('loginScreen').style.display = 'none';
    $('app').style.display = 'flex';
  }

  function showLogin() {
    $('loginScreen').style.display = 'flex';
    $('app').style.display = 'none';
  }

  function showTab(tab) {
    document.querySelectorAll('.tbtn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $('sidebar').classList.toggle('open', tab === 'users');
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), CONFIG.TOAST_DURATION_MS);
  }

  /* ---- Yan panel ---- */
  function setProfile(username) {
    $('myName').textContent = username;
    const av = $('myAvatar');
    av.textContent = initials(username);
    av.className = 'mav ' + avatarClass(username);
  }

  function renderOnline(users, me) {
    const el = $('onlineList');
    el.innerHTML = '';
    const list = Object.values(users);
    $('onlineNum').textContent = list.length;
    for (const u of list) {
      const row = document.createElement('div');
      row.className = 'ou';
      row.innerHTML = `<div class="ouav ${avatarClass(u.username)}">${initials(u.username)}</div>` +
        `<div class="ouname">${esc(u.username)}${u.username === me ? ' <span class="ou-me">(sen)</span>' : ''}</div>`;
      el.appendChild(row);
    }
  }

  /* ---- "Yazıyor..." çubuğu ---- */
  let typingUsers = {};

  function updateTyping(username, active) {
    if (active) typingUsers[username] = true; else delete typingUsers[username];
    const names = Object.keys(typingUsers);
    $('typingBar').innerHTML = names.length
      ? `<div class="tdots"><span></span><span></span><span></span></div> ${esc(names.join(', '))} yazıyor...`
      : '';
  }

  /* ---- Mesaj listesi ---- */
  let lastDate = '';

  function appendMessage(m, me) {
    const el = $('messages');
    const date = new Date(m.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    if (date !== lastDate) {
      lastDate = date;
      const sep = document.createElement('div');
      sep.className = 'dsep';
      sep.innerHTML = `<span>${date}</span>`;
      el.appendChild(sep);
    }
    const mine = m.username === me;
    const row = document.createElement('div');
    row.className = 'mrow' + (mine ? ' mine' : '');
    row.innerHTML = `
      <div class="mav2 ${avatarClass(m.username)}">${initials(m.username)}</div>
      <div class="bcol">
        ${!mine ? `<div class="msender">${esc(m.username)}</div>` : ''}
        <div class="bubble">${esc(m.text)}</div>
        <div class="btime">${timeStr(m.created_at)}</div>
      </div>`;
    el.appendChild(row);
  }

  function renderMessages(messages, me) {
    const el = $('messages');
    el.innerHTML = '';
    lastDate = '';
    if (!messages.length) {
      el.innerHTML = '<div class="dsep" id="emptyHint"><span>İlk mesajı sen gönder! 👋</span></div>';
      return;
    }
    messages.forEach((m) => appendMessage(m, me));
    scrollToBottom();
  }

  function removeEmptyHint() { $('emptyHint')?.remove(); }

  function scrollToBottom() {
    const el = $('messages');
    setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
  }

  /* ---- Çıkışta ekranı temizle ---- */
  function resetChatUI() {
    typingUsers = {};
    lastDate = '';
    $('typingBar').innerHTML = '';
    $('messages').innerHTML = '';
    $('onlineList').innerHTML = '';
  }

  return {
    readUsername, showApp, showLogin, showTab, toast,
    setProfile, renderOnline, updateTyping,
    appendMessage, renderMessages, removeEmptyHint, scrollToBottom, resetChatUI,
  };
})();
