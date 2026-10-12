/* marketplace.js
   A small marketplace that runs inside a desktop window.
  - Anyone with an account can sell an item (photo + details).
   - Anyone signed in can like an item (one like each, click again to unlike).
   - Anyone signed in can comment on an item.
   Data lives in Firebase Firestore (see js/firebase-init.js), so it IS shared between
  everyone who opens this site in real time. Accounts use Firebase Authentication;
  the UI only asks for a username and password, never an email address.
*/
(function () {
  'use strict';

  var h = window.Hub.h;
  var Icons = window.Hub.Icons;

  var CATEGORIES = ['Gadgets', 'Books', 'Clothes', 'Games', 'Other'];
  var COLLECTION = 'listings';
  var CONVERSATIONS = 'conversations';

  /* ---------- wait for js/firebase-init.js to be ready ---------- */
  function withFB(cb) {
    if (window.FB) { cb(window.FB); return; }
    window.addEventListener('firebase-ready', function once() {
      window.removeEventListener('firebase-ready', once);
      cb(window.FB);
    });
  }

  /* ---------- small helpers ---------- */
  function keyOf(name) { return String(name || '').trim().toLowerCase(); }
  function same(a, b) { return keyOf(a) === keyOf(b) && keyOf(a) !== ''; }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function peso(n) { return Number(n) === 0 ? 'Free' : '\u20B1' + Number(n).toLocaleString('en-PH'); }
  function timeAgo(ts) {
    var s = (Date.now() - ts) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 2592000) return Math.floor(s / 86400) + 'd ago';
    return new Date(ts).toLocaleDateString();
  }
  function avatarColor(name) {
    var hash = 0, n = keyOf(name);
    for (var i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
    return ['#2f66d6', '#3fae5a', '#d8433f', '#8a5a2b', '#7b55c9', '#0e7c86'][hash % 6];
  }

  // Resize the picked photo so it fits comfortably in localStorage
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('Could not read that file.')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('That file is not a picture the browser can open.')); };
        img.onload = function () {
          var max = 720, sc = Math.min(1, max / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * sc)), hh = Math.max(1, Math.round(img.height * sc));
          var c = document.createElement('canvas'); c.width = w; c.height = hh;
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hh);
          ctx.drawImage(img, 0, 0, w, hh);
          resolve(c.toDataURL('image/jpeg', 0.78));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* ---------- the app ---------- */
  function mount(host, ctx) {
    var state = { listings: [] };
    var listingsById = {};
    var cardApi = {}; // id -> { paintLike, paintComments }, so a live update can repaint just one card
    var firstLoad = true;
    var me = '';
    var isAdmin = false;
    var sort = 'new', query = '';

    var root = h('div', { class: 'mk' });
    host.appendChild(root);

    /* toolbar */
    var userBtn = h('button', { class: 'btn', type: 'button', onclick: function () { askAccount(function () {}); } });
    var sellBtn = h('button', { class: 'btn primary', type: 'button', onclick: function () { requireUser(openSellForm); } }, 'Sell an item');
    var inboxBtn = h('button', { class: 'btn', type: 'button', onclick: function () { requireUser(openInbox); } }, 'Messages');
    var search = h('input', {
      class: 'mk-input', type: 'search', placeholder: 'Search listings', 'aria-label': 'Search listings',
      oninput: function () { query = search.value.trim(); renderFeed(); }
    });
    var sortSel = h('select', {
      class: 'mk-input', 'aria-label': 'Sort listings',
      onchange: function () { sort = sortSel.value; renderFeed(); }
    },
      h('option', { value: 'new' }, 'Newest first'),
      h('option', { value: 'liked' }, 'Most liked'),
      h('option', { value: 'low' }, 'Price: low to high'),
      h('option', { value: 'high' }, 'Price: high to low'));
    var resetBtn = h('button', { class: 'btn', type: 'button', hidden: true, onclick: confirmReset }, 'Clear listings');

    var bar = h('div', { class: 'mk-toolbar' }, sellBtn, inboxBtn, userBtn, search, sortSel, resetBtn);
    var feed = h('div', { class: 'mk-feed', tabindex: '0', 'aria-label': 'Listings' });
    root.append(bar, feed);

    /* dialogs shown inside the marketplace window */
    function modal(title, content, buttons, footer) {
      var overlay = h('div', { class: 'mk-overlay' });
      function close() { overlay.remove(); }
      var box = h('div', { class: 'mk-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        h('div', { class: 'mk-dtitle' }, h('span', {}, title),
          h('button', { class: 'tb tb-close', type: 'button', 'aria-label': 'Close', onclick: close })),
        h('div', { class: 'mk-dbody' }, content),
        footer ? h('div', { class: 'mk-derr' }, footer) : null,
        h('div', { class: 'mk-dbtns' }, buttons.map(function (b) {
          return h('button', { class: 'btn' + (b.primary ? ' primary' : ''), type: 'button', onclick: function () { b.onClick(close); } }, b.label);
        })));
      overlay.appendChild(box);
      overlay.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
      root.appendChild(overlay);
      var first = box.querySelector('input, textarea, select, .btn.primary, .btn');
      if (first) first.focus();
      return close;
    }

    function authError(e) {
      var messages = {
        'auth/invalid-credential': 'That username or password is incorrect.',
        'auth/email-already-in-use': 'That username is already taken.',
        'auth/weak-password': 'Use a password with at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/operation-not-allowed': 'Email/Password sign-in is disabled in Firebase Console.',
        'auth/network-request-failed': 'Could not reach Firebase. Check your internet connection or use Live Server.'
      };
      return messages[e.code] || 'Could not sign in right now. Please try again.';
    }
    function accountEmail(username) { return username.toLowerCase() + '@accounts.carandang-hub.local'; }
    function askAccount(done) {
      if (me) {
        var profileErr = h('p', { class: 'mk-err', role: 'alert' });
        modal('Profile', h('div', {},
          h('p', { class: 'mk-note' }, 'Signed in as ' + me + '.')),
          [{ label: 'Sign out', primary: true, onClick: function (close) {
            withFB(function (FB) {
              FB.signOut(FB.auth).then(function () { close(); done(); })
                .catch(function () { profileErr.textContent = 'Could not sign out. Try again.'; });
            });
          } }, { label: 'Cancel', onClick: function (close) { close(); } }], profileErr);
        return;
      }
      var input = h('input', { class: 'mk-input', type: 'text', maxlength: '20', value: me, placeholder: 'Username', 'aria-label': 'Username', autocomplete: 'username' });
      var password = h('input', { class: 'mk-input', type: 'password', placeholder: 'Password', 'aria-label': 'Password', autocomplete: 'current-password' });
      var err = h('p', { class: 'mk-err', role: 'alert' });
      var busy = false;
      function submit(mode, close) {
        var name = input.value.trim();
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) { err.textContent = 'Use 3-20 letters, numbers, or underscores.'; input.focus(); return; }
        if (password.value.length < 6) { err.textContent = 'Use a password with at least 6 characters.'; password.focus(); return; }
        if (busy) return;
        busy = true; err.textContent = mode === 'create' ? 'Creating account...' : 'Signing in...';
        withFB(function (FB) {
          var email = accountEmail(name);
          var action = mode === 'create' ? FB.createUserWithEmailAndPassword(FB.auth, email, password.value) : FB.signInWithEmailAndPassword(FB.auth, email, password.value);
          action.then(function () { close(); done(); }).catch(function (e) { busy = false; err.textContent = authError(e); });
        });
      }
      var closer;
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit('signIn', closer); } });
      password.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit('signIn', closer); } });
      var accountButtons = [
        { label: 'Sign in', primary: true, onClick: function (c) { submit('signIn', c); } },
        { label: 'Create account', onClick: function (c) { submit('create', c); } }
      ];
      accountButtons.push({ label: 'Cancel', onClick: function (c) { c(); } });
      closer = modal('Account', h('div', { class: 'mk-form' },
        h('p', { class: 'mk-note' }, 'Create an account or sign in.'),
        h('label', {}, 'Username', input),
        h('label', {}, 'Password', password)),
        accountButtons, err);
    }
    function requireUser(cb) { if (me) cb(); else askAccount(cb); }

    function confirmBox(title, text, okLabel, onOk) {
      modal(title, h('p', { class: 'mk-note' }, text), [
        { label: okLabel, primary: true, onClick: function (close) { close(); onOk(); } },
        { label: 'Cancel', onClick: function (c) { c(); } }]);
    }
    function confirmReset() {
      if (!isAdmin) return;
      confirmBox('Clear listings', 'This removes every listing, like and comment for everyone.', 'Clear', function () {
        withFB(function (FB) {
          var batch = FB.writeBatch(FB.db);
          state.listings.forEach(function (L) { batch.delete(FB.doc(FB.db, COLLECTION, L.id)); });
          batch.commit().catch(function (e) { ctx.setStatus('Could not clear listings: ' + e.message); });
        });
      });
    }

    function conversationId(listing, buyerUid) { return listing.id + '_' + buyerUid; }

    function openThread(listing) {
      withFB(function (FB) {
        var user = FB.auth.currentUser;
        if (!user || !listing.ownerUid) return;
        var sellerUid = listing.ownerUid;
        var buyerUid = listing.buyerUid || user.uid;
        if (user.uid === sellerUid && !listing.buyerUid) return;
        var id = conversationId(listing, buyerUid);
        var thread = h('div', { class: 'mk-thread' });
        var messages = h('div', { class: 'mk-messages', 'aria-live': 'polite' },
          h('p', { class: 'mk-empty' }, 'Loading messages...'));
        var input = h('input', { class: 'mk-input', type: 'text', maxlength: '500', placeholder: 'Write a private message', 'aria-label': 'Private message' });
        var err = h('p', { class: 'mk-err', role: 'alert' });
        var form = h('form', { class: 'mk-cform' }, input, h('button', { class: 'btn primary', type: 'submit' }, 'Send'));
        thread.append(messages, form);

        function paint(snap) {
          if (!snap.size) {
            messages.replaceChildren(h('p', { class: 'mk-empty' }, 'No messages yet. Say hello.'));
            return;
          }
          messages.replaceChildren.apply(messages, snap.docs.map(function (item) {
            var message = item.data();
            return h('p', { class: 'mk-message' + (message.senderUid === user.uid ? ' mine' : '') },
              h('strong', {}, message.sender || 'User'), h('span', {}, message.text));
          }));
          messages.scrollTop = messages.scrollHeight;
        }

        var closeThread = modal('Message about ' + listing.title, thread,
          [{ label: 'Close', onClick: function (close) { close(); } }], err);
        FB.setDoc(FB.doc(FB.db, CONVERSATIONS, id), {
          listingId: listing.id, listingTitle: listing.title,
          sellerUid: sellerUid, seller: listing.seller,
          buyerUid: buyerUid, buyer: listing.buyer || (buyerUid === user.uid ? me : ''),
          participants: [sellerUid, buyerUid], updatedAt: Date.now()
        }, { merge: true }).then(function () {
          FB.onSnapshot(FB.query(FB.collection(FB.db, CONVERSATIONS, id, 'messages'), FB.orderBy('ts', 'asc')), paint,
            function () { err.textContent = 'Could not load messages.'; });
        }).catch(function () { err.textContent = 'Could not open this conversation.'; });

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var text = input.value.trim();
          if (!text) return;
          input.disabled = true;
          var conversation = FB.doc(FB.db, CONVERSATIONS, id);
          FB.addDoc(FB.collection(FB.db, CONVERSATIONS, id, 'messages'), {
            senderUid: user.uid, sender: me, text: text, ts: Date.now()
          }).then(function () {
            return FB.updateDoc(conversation, { lastMessage: text, updatedAt: Date.now() });
          }).then(function () {
            input.value = ''; input.disabled = false; input.focus();
          }).catch(function () {
            input.disabled = false; err.textContent = 'Could not send that message.';
          });
        });
        input.focus();
      });
    }

    function openInbox() {
      withFB(function (FB) {
        var user = FB.auth.currentUser;
        if (!user) return;
        var list = h('div', { class: 'mk-inbox' }, h('p', { class: 'mk-empty' }, 'Loading conversations...'));
        var closeInbox = modal('Messages', list, [{ label: 'Close', onClick: function (close) { close(); } }]);
        FB.onSnapshot(FB.query(FB.collection(FB.db, CONVERSATIONS), FB.where('participants', 'array-contains', user.uid)), function (snap) {
          if (!snap.size) {
            list.replaceChildren(h('p', { class: 'mk-empty' }, 'No private conversations yet.'));
            return;
          }
          var rows = snap.docs.map(function (item) { return { id: item.id, data: item.data() }; });
          rows.sort(function (a, b) { return (b.data.updatedAt || 0) - (a.data.updatedAt || 0); });
          list.replaceChildren.apply(list, rows.map(function (row) {
            var data = row.data;
            var other = data.sellerUid === user.uid ? data.buyer : data.seller;
            return h('button', { class: 'mk-conversation', type: 'button', onclick: function () {
              closeInbox();
              openThread({ id: data.listingId, title: data.listingTitle, ownerUid: data.sellerUid,
                seller: data.seller, buyerUid: data.buyerUid, buyer: data.buyer });
            } }, h('strong', {}, data.listingTitle || 'Listing'), h('span', {}, 'with ' + (other || 'User')),
              data.lastMessage ? h('small', {}, data.lastMessage) : null);
          }));
        }, function () { list.replaceChildren(h('p', { class: 'mk-empty' }, 'Could not load conversations.')); });
      });
    }

    /* sell form */
    function openSellForm() {
      var pending = { img: '', busy: false };
      var preview = h('img', { class: 'mk-preview', alt: 'Preview of the photo you picked', hidden: true });
      var fileIn = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Item photo' });
      var titleIn = h('input', { class: 'mk-input', type: 'text', maxlength: '60', placeholder: 'What are you selling?', 'aria-label': 'Title' });
      var priceIn = h('input', { class: 'mk-input', type: 'number', min: '0', step: '1', placeholder: '0', 'aria-label': 'Price in pesos' });
      var catSel = h('select', { class: 'mk-input', 'aria-label': 'Category' }, CATEGORIES.map(function (c) { return h('option', { value: c }, c); }));
      var descIn = h('textarea', { class: 'mk-input', rows: '4', maxlength: '500', placeholder: 'Condition, what is included, where to meet', 'aria-label': 'Description' });
      var err = h('p', { class: 'mk-err', role: 'alert' });

      fileIn.addEventListener('change', function () {
        var f = fileIn.files && fileIn.files[0];
        pending.img = ''; preview.hidden = true; err.textContent = '';
        if (!f) return;
        if (f.type.indexOf('image/') !== 0) { err.textContent = 'Pick an image file (JPG, PNG, WEBP).'; fileIn.value = ''; return; }
        if (f.size > 15 * 1024 * 1024) { err.textContent = 'That picture is over 15 MB. Pick a smaller one.'; fileIn.value = ''; return; }
        pending.busy = true;
        readImage(f).then(function (data) {
          pending.img = data; preview.src = data; preview.hidden = false; pending.busy = false;
        }).catch(function (e) { pending.busy = false; err.textContent = e.message; fileIn.value = ''; });
      });

      function submit(close) {
        err.textContent = '';
        if (pending.busy) { err.textContent = 'Still loading the photo. Try again in a second.'; return; }
        if (!pending.img) { err.textContent = 'Add a photo of the item.'; return; }
        var title = titleIn.value.trim();
        if (!title) { err.textContent = 'Add a title.'; titleIn.focus(); return; }
        var price = Number(priceIn.value);
        if (priceIn.value === '' || !isFinite(price) || price < 0) { err.textContent = 'Enter a price of 0 or more.'; priceIn.focus(); return; }
        var desc = descIn.value.trim();
        if (!desc) { err.textContent = 'Add a short description.'; descIn.focus(); return; }
        var L = {
          title: title, price: Math.round(price), category: catSel.value, desc: desc,
          img: pending.img, seller: me, ownerUid: window.FB.auth.currentUser.uid,
          ts: Date.now(), likes: [], comments: []
        };
        pending.busy = true;
        err.textContent = 'Posting…';
        withFB(function (FB) {
          FB.addDoc(FB.collection(FB.db, COLLECTION), L).then(function () {
            pending.busy = false;
            close();
            sort = 'new'; sortSel.value = 'new'; query = ''; search.value = '';
            feed.scrollTop = 0;
          }).catch(function (e) {
            pending.busy = false;
            err.textContent = 'Could not post the listing (' + e.message + '). If the photo is large, try a smaller one.';
          });
        });
      }

      modal('Sell an item', h('div', { class: 'mk-form' },
        h('label', {}, 'Photo', fileIn), preview,
        h('label', {}, 'Title', titleIn),
        h('div', { class: 'mk-row' },
          h('label', {}, 'Price (PHP)', priceIn),
          h('label', {}, 'Category', catSel)),
        h('label', {}, 'Description', descIn)),
        [{ label: 'Post listing', primary: true, onClick: submit }, { label: 'Cancel', onClick: function (c) { c(); } }], err);
    }

    /* one listing card */
    function card(L) {
      var likeBtn = h('button', { class: 'btn mk-like', type: 'button' });
      var messageBtn = h('button', { class: 'btn', type: 'button' }, 'Message seller');
      var commentList = h('div', { class: 'mk-clist' });
      var commentTitle = h('h3', { class: 'mk-ctitle' });
      var cInput = h('input', { class: 'mk-input', type: 'text', maxlength: '200', placeholder: 'Write a comment', 'aria-label': 'Write a comment on ' + L.title });
      var cForm = h('form', { class: 'mk-cform' }, cInput, h('button', { class: 'btn', type: 'submit' }, 'Post'));

      function likedByMe() { return me && L.likes.indexOf(keyOf(me)) !== -1; }

      function paintLike() {
        var on = likedByMe();
        likeBtn.classList.toggle('on', !!on);
        likeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        likeBtn.replaceChildren(Icons.el(on ? 'heart-on' : 'heart-off', 16), h('span', {}, on ? 'Liked' : 'Like'),
          h('span', { class: 'mk-count' }, String(L.likes.length)));
        likeBtn.setAttribute('aria-label', (on ? 'Unlike' : 'Like') + ' ' + L.title + '. ' + L.likes.length + ' likes');
      }
      function paintComments() {
        commentTitle.replaceChildren(Icons.el('bubble', 16), 'Comments (' + L.comments.length + ')');
        if (!L.comments.length) {
          commentList.replaceChildren(h('p', { class: 'mk-empty' }, 'No comments yet. Ask the seller a question.'));
          return;
        }
        commentList.replaceChildren.apply(commentList, L.comments.map(function (c) {
          var canDelete = me && (same(me, c.author) || same(me, L.seller));
          return h('div', { class: 'mk-comment' },
            h('div', { class: 'mk-chead' },
              h('strong', {}, c.author),
              same(c.author, L.seller) ? h('span', { class: 'mk-badge' }, 'Seller') : null,
              h('span', { class: 'mk-time' }, timeAgo(c.ts)),
              canDelete ? h('button', {
                class: 'mk-x', type: 'button', 'aria-label': 'Delete comment by ' + c.author,
                onclick: function () {
                  withFB(function (FB) {
                    FB.updateDoc(FB.doc(FB.db, COLLECTION, L.id), { comments: FB.arrayRemove(c) })
                      .catch(function (e) { ctx.setStatus('Could not delete the comment: ' + e.message); });
                  });
                }
              }, 'Delete') : null),
            h('p', {}, c.text));
        }));
        commentList.scrollTop = commentList.scrollHeight;
      }

      likeBtn.addEventListener('click', function () {
        requireUser(function () {
          var k = keyOf(me), on = L.likes.indexOf(k) !== -1;
          withFB(function (FB) {
            FB.updateDoc(FB.doc(FB.db, COLLECTION, L.id), { likes: on ? FB.arrayRemove(k) : FB.arrayUnion(k) })
              .catch(function (e) { ctx.setStatus('Could not update your like: ' + e.message); });
          });
        });
      });
      messageBtn.addEventListener('click', function () { requireUser(function () { openThread(L); }); });
      cForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = cInput.value.trim();
        if (!text) return;
        requireUser(function () {
          var c = { id: uid('c'), author: me, text: text, ts: Date.now() };
          withFB(function (FB) {
            FB.updateDoc(FB.doc(FB.db, COLLECTION, L.id), { comments: FB.arrayUnion(c) })
              .then(function () { cInput.value = ''; })
              .catch(function (e) { ctx.setStatus('Could not post the comment: ' + e.message); });
          });
        });
      });

      paintLike(); paintComments();
      cardApi[L.id] = { paintLike: paintLike, paintComments: paintComments };

      var canRemove = me && same(me, L.seller);
      return h('article', { class: 'mk-card' },
        h('header', { class: 'mk-head' },
          h('span', { class: 'mk-avatar', style: 'background:' + avatarColor(L.seller), 'aria-hidden': 'true' }, (L.seller || '?').charAt(0).toUpperCase()),
          h('div', { class: 'mk-who' }, h('strong', {}, L.seller), h('span', { class: 'mk-time' }, timeAgo(L.ts))),
          canRemove ? h('button', {
            class: 'btn mk-del', type: 'button',
            onclick: function () {
              confirmBox('Delete listing', 'Delete "' + L.title + '"? Its likes and comments go with it.', 'Delete', function () {
                withFB(function (FB) {
                  FB.deleteDoc(FB.doc(FB.db, COLLECTION, L.id))
                    .catch(function (e) { ctx.setStatus('Could not delete the listing: ' + e.message); });
                });
              });
            }
          }, 'Delete') : null),
        h('img', { class: 'mk-photo', src: L.img, alt: L.title }),
        h('div', { class: 'mk-body' },
          h('div', { class: 'mk-titleline' }, h('h2', {}, L.title), h('span', { class: 'mk-price' }, peso(L.price))),
          h('p', { class: 'mk-cat' }, L.category),
          h('p', { class: 'mk-desc' }, L.desc)),
        h('div', { class: 'mk-actions' }, likeBtn, L.ownerUid && !same(me, L.seller) ? messageBtn : null),
        h('section', { class: 'mk-comments', 'aria-label': 'Comments' }, commentTitle, commentList, cForm));
    }

    function visible() {
      var arr = state.listings.slice();
      if (query) {
        var q = query.toLowerCase();
        arr = arr.filter(function (L) { return (L.title + ' ' + L.desc + ' ' + L.seller + ' ' + L.category).toLowerCase().indexOf(q) !== -1; });
      }
      if (sort === 'liked') arr.sort(function (a, b) { return b.likes.length - a.likes.length || b.ts - a.ts; });
      else if (sort === 'low') arr.sort(function (a, b) { return a.price - b.price; });
      else if (sort === 'high') arr.sort(function (a, b) { return b.price - a.price; });
      else arr.sort(function (a, b) { return b.ts - a.ts; });
      return arr;
    }

    function renderFeed() {
      var list = visible();
      feed.replaceChildren();
      if (!list.length) {
        feed.appendChild(h('p', { class: 'mk-none' }, state.listings.length
          ? 'No listings match that search.'
          : 'Nothing is listed yet. Click "Sell an item" to post the first one.'));
      } else {
        list.forEach(function (L) { feed.appendChild(card(L)); });
      }
      userBtn.textContent = me ? 'Signed in as ' + me : 'Sign in / Create account';
      resetBtn.hidden = !isAdmin;
      ctx.setStatus(state.listings.length + ' listing' + (state.listings.length === 1 ? '' : 's') +
        (me ? '   |   Signed in as ' + me : '   |   Not signed in'));
    }

    /* ---------- live connection to Firestore ---------- */
    feed.replaceChildren(h('p', { class: 'mk-none' }, 'Connecting to the marketplace\u2026'));
    withFB(function (FB) {
      FB.onAuthStateChanged(FB.auth, function (user) {
        me = user ? user.email.split('@')[0] : '';
        isAdmin = !!user && user.uid === FB.adminUid;
        renderFeed();
      });
      var q = FB.query(FB.collection(FB.db, COLLECTION), FB.orderBy('ts', 'desc'));
      FB.onSnapshot(q, function (snap) {
        var structural = false;
        snap.docChanges().forEach(function (change) {
          var id = change.doc.id;
          if (change.type === 'added') {
            var data = change.doc.data();
            data.id = id;
            if (!data.likes) data.likes = [];
            if (!data.comments) data.comments = [];
            listingsById[id] = data;
            structural = true;
          } else if (change.type === 'removed') {
            delete listingsById[id];
            delete cardApi[id];
            structural = true;
          } else { // modified: only likes/comments change after a listing is created
            var fresh = change.doc.data();
            var L = listingsById[id];
            if (L) {
              L.likes = fresh.likes || [];
              L.comments = fresh.comments || [];
              var api = cardApi[id];
              if (api) { api.paintLike(); api.paintComments(); }
            }
          }
        });
        if (structural || firstLoad) {
          firstLoad = false;
          state.listings = Object.keys(listingsById).map(function (id) { return listingsById[id]; });
          renderFeed();
        }
      }, function (err) {
        feed.replaceChildren(h('p', { class: 'mk-none' }, 'Could not connect to the marketplace (' + err.message + ').'));
        ctx.setStatus('Marketplace offline: ' + err.message);
      });
    });
  }

  window.Marketplace = { mount: mount };
})();
