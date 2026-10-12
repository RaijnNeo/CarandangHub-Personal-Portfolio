(function () {

  var ICONS = {
    bomb: '<circle cx="12" cy="14" r="6.2"/><path d="M12 8V4"/><path d="M12 4c1-1.2 2.4-1 3 0"/>',
    'heart-plus': '<path d="M12 19s-6.5-4-8.5-8C1.8 7.8 3.3 4.5 6.5 4.5c1.8 0 3 1 5.5 4 2.5-3 3.7-4 5.5-4 3.2 0 4.7 3.3 3 6.5-2 4-8.5 8-8.5 8z"/><path d="M12 9v4M10 11h4"/>',
    'eye-patch': '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><path d="M4.5 6l15 12"/>',
    book: '<path d="M12 6.2c-2-1.4-5-1.6-7-1v13c2-.6 5-.4 7 1 2-1.4 5-1.6 7-1v-13c-2-.6-5-.4-7 1z"/><path d="M12 6.2v13"/>',
    question: '<path d="M9.3 9.2a2.7 2.7 0 1 1 3.9 2.4c-1 .6-1.4 1.2-1.4 2.3"/><circle cx="11.8" cy="17.2" r="1" fill="currentColor" stroke="none"/>',
    bird: '<path d="M2.5 14.5c4-6 10-7 13-3 2-3 5-4 7-3-1 2-3 3-5 3 3 1 5 3 5 6-3-2-6-2-8 .5-1-3-4-5-7-5-2 0-4 1-5 1.5z"/>',
    fist: '<rect x="7" y="9.5" width="10" height="8" rx="2"/><path d="M9 9.5V6.5a2 2 0 0 1 4 0M13 9.5V5.5a2 2 0 0 1 4 0v4"/>',
    wing: '<path d="M4.5 18c4-1 8-4 9-10 2 5 1 10-3 13-2-2-4-2-6-3z"/><path d="M6.5 15c2-1 4-3 5-6M8.5 12c1.5-.5 3-2 3.5-4"/>',
    coffin: '<path d="M9 3h6l3 5v9l-3 4H9l-3-4V8z"/><path d="M9 3l-3 5M15 3l3 5"/>',
    dice: '<rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1" fill="currentColor" stroke="none"/>',
    ghost: '<path d="M6 20v-9a6 6 0 0 1 12 0v9l-2.5-2-2 2-2-2-2 2-1.5-1.5-2 1.5z"/><circle cx="9.5" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11" r="1" fill="currentColor" stroke="none"/>',
    horns: '<path d="M8 14c-2-3-2-7 1-9-1 3 0 5 1 6"/><path d="M16 14c2-3 2-7-1-9 1 3 0 5-1 6"/><circle cx="12" cy="16" r="4"/>',
    coin: '<circle cx="12" cy="12" r="7"/><path d="M12 8v8M10 9.6c0-1 1-1.6 2-1.6s2 .6 2 1.5c0 2-4 1.5-4 3.5 0 1 1 1.6 2 1.6s2-.5 2-1.6"/>',
    void: '<path d="M12 4a8 8 0 1 0 6 13"/><path d="M12 8a4 4 0 1 0 3 6.5"/>',
    bone: '<path d="M5 9a2 2 0 1 1 3.2-2.4L15 13.2a2 2 0 1 1 2.4 3.2 2 2 0 1 1-3.2 2.4L7.6 12a2 2 0 1 1-2.6-3z"/>',
    flame: '<path d="M12 3c1 3-1 4-2 6-1.5 2.5 0 4 2 4s3.5-1.5 2-4c1.5 1 2.5 3 2.5 5a4.5 4.5 0 1 1-9 0c0-3 1.5-5 2-7 .3-1.3.5-2.7 2.5-4z"/>',
    twins: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>'
  };

  var DATA = [
    // ---------------- REGULAR ----------------
    {
      id: 'isaac', icon: 'bomb', name: 'Isaac', kind: 'regular', tag: 'the basic character',
      stats: { hp: '3 Red Hearts', speed: '1.0', dmg: '3.5', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['1 Bomb', 'a single starting bomb'], ['The D6', 'unlockable — starts with it after beating ??? as Isaac'] ],
      unlock: 'Available from the start.',
      blurb: 'The default, perfectly average character — every other pick gets measured against him.',
      tip: 'Save your one bomb for a locked door or secret room instead of a random rock.'
    },
    {
      id: 'magdalene', icon: 'heart-plus', name: 'Magdalene', kind: 'regular', tag: 'the healer',
      stats: { hp: '5 Red Hearts (3+2)', speed: '1.0', dmg: '3.5', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['Yum Heart', 'active item, heals 2 hearts and recharges every few rooms'] ],
      unlock: 'Have 7 or more Red Heart Containers at once in a run.',
      blurb: 'A tanky healer built around soaking damage and topping herself back off.',
      tip: "Her extra health makes her the safest pick for Sacrifice Rooms — spend hearts freely."
    },
    {
      id: 'cain', icon: 'eye-patch', name: 'Cain', kind: 'regular', tag: 'the thief',
      stats: { hp: '2 Red Hearts', speed: '1.0', dmg: '4.4', range: '3.5', shot: '1.0', luck: '1' },
      loadout: [ ['Extra Key', 'starts with 1 key'], ['Lucky Foot', 'unlockable trinket — better luck and pill odds'] ],
      unlock: 'Have 55 cents at once in a run.',
      blurb: 'Fast, hard-hitting, and fragile — built to fight up close and get rich doing it.',
      tip: "His short range means closing distance on enemies beats trying to kite them."
    },
    {
      id: 'judas', icon: 'book', name: 'Judas', kind: 'regular', tag: 'the mage',
      stats: { hp: '2 Red Hearts', speed: '1.0', dmg: '4.7 (×1.35)', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['Book of Belial', 'passive — raises Devil/Angel Room odds and boosts damage further'] ],
      unlock: 'Defeat Satan.',
      blurb: 'A glass cannon whose innate damage multiplier makes every damage item hit harder.',
      tip: "Lean on Soul Hearts over Red — his low HP makes Devil Deals a real gamble."
    },
    {
      id: 'blue-baby', icon: 'question', name: '???', epithet: 'Blue Baby', kind: 'regular', tag: 'the secret one',
      stats: { hp: '2 Soul Hearts', speed: '1.05', dmg: '3.7', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['The Poop', 'active item; spawns a friendly Blue Fly whenever a poop is destroyed'] ],
      unlock: 'Defeat Mom\u2019s Heart 10 times.',
      blurb: "Can't take Red Heart damage, so Devil Deals only cost him 1–2 Soul Hearts.",
      tip: "Blow up your own poops with The Poop to build a small army of Blue Flies."
    },
    {
      id: 'eve', icon: 'bird', name: 'Eve', kind: 'regular', tag: 'the risk-taker',
      stats: { hp: '2 Red Hearts', speed: '1.0', dmg: '2.6 (×0.75)', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['Dead Bird', 'familiar attacks nearby enemies whenever Eve is hurt'], ['Whore of Babylon', 'unlockable — stat boost while at exactly 1 full heart'], ['Razor', 'unlockable — lets her deal Red Heart self-damage on demand'] ],
      unlock: 'Clear two floors in a row without picking up any hearts.',
      blurb: 'Built around getting hurt on purpose — low base damage that spikes hard at low health.',
      tip: "Take Devil Deals freely — parking at one heart keeps Whore of Babylon active for good."
    },
    {
      id: 'samson', icon: 'fist', name: 'Samson', kind: 'regular', tag: 'the berserker',
      stats: { hp: '3 Red Hearts', speed: '0.9', dmg: '3.5', range: '3.5', shot: '1.3', luck: '0' },
      loadout: [ ["Child's Heart", 'unlockable trinket'] ],
      unlock: 'Clear two floors in a row without taking damage.',
      blurb: 'Every hit he takes fuels Bloody Lust, a temporary damage boost that lasts the floor.',
      tip: "Curse Rooms and blood donation machines are free Bloody Lust triggers — use them."
    },
    {
      id: 'azazel', icon: 'wing', name: 'Azazel', kind: 'regular', tag: 'the fallen angel',
      stats: { hp: '3 Black Hearts', speed: '1.15', dmg: '4.5', range: 'short (charged laser)', shot: '1.0', luck: '0' },
      loadout: [ ['Fool', 'tarot card that teleports him out of the current room'] ],
      unlock: 'Take 3 Devil Deals in a single run.',
      blurb: 'Flies and fires a short-range charged laser instead of tears, on Black Hearts only.',
      tip: "His laser is short — Range upgrades matter more for him than they do for tear-users."
    },
    {
      id: 'lazarus', icon: 'coffin', name: 'Lazarus', kind: 'regular', tag: 'the revenant',
      stats: { hp: '3 Red Hearts + 1 extra life', speed: '1.0', dmg: '3.5', range: '4.5', shot: '1.0', luck: '-1' },
      loadout: [ ['Random Pill', 'one unidentified pill'], ['Anemic', 'unlockable — permanent range boost'] ],
      unlock: 'Have 4 Soul and/or Black Hearts at once.',
      blurb: 'Dies once per floor and comes back as Lazarus Risen with a permanent damage bump.',
      tip: "Spend the revive deliberately — take the risky fight on a floor you're about to leave."
    },
    {
      id: 'eden', icon: 'dice', name: 'Eden', kind: 'regular', tag: 'the wildcard',
      stats: { hp: 'Random', speed: 'Random', dmg: 'Random (Isaac-average overall)', range: 'Random', shot: 'Random', luck: 'Random' },
      loadout: [ ['1 random Passive Item', ''], ['1 random Active Item', ''] ],
      unlock: 'Defeat Mom\u2019s Heart once. Costs an Eden Token to play, earned from major boss kills.',
      blurb: 'Stats, hairstyle, and starting items are randomized fresh every single run.',
      tip: "Don't burn tokens re-rolling for a good start — she's meant to be played with whatever you get."
    },
    {
      id: 'the-lost', icon: 'ghost', name: 'The Lost', kind: 'regular', tag: 'the spirit',
      stats: { hp: 'None — dies in one hit', speed: '1.0', dmg: '3.5', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['Eternal D6', "rerolls or removes items he can't use"], ['Holy Mantle', 'unlockable — blocks one hit per room'] ],
      unlock: 'Kill yourself in a Sacrifice Room while holding the Missing Poster trinket.',
      blurb: 'No health bar at all. Flight and spectral tears exist to help him never get hit.',
      tip: "He gets one free Devil Room item at no cost — take it, there's nothing to lose."
    },
    {
      id: 'lilith', icon: 'horns', name: 'Lilith', kind: 'regular', tag: 'the first demon',
      stats: { hp: '1 Red Heart + 2 Black Hearts', speed: '1.0', dmg: '3.5', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['Incubus', "innate familiar that fires all of Lilith's tears for her"], ['Cambion Conception', 'spawns more demonic familiars as she takes damage'] ],
      unlock: 'Complete Greed Mode as Azazel.',
      blurb: "Doesn't shoot tears herself — her Incubus familiar does it, so familiar items are gold.",
      tip: "Box of Friends duplicates every familiar you have, Incubus included — prioritize it hard."
    },
    {
      id: 'keeper', icon: 'coin', name: 'Keeper', kind: 'regular', tag: 'the shopkeeper',
      stats: { hp: '3 Coin Hearts', speed: '1.0', dmg: '4.2 (×1.2)', range: '6.5', shot: '1.0 (triple shot)', luck: '-2' },
      loadout: [ ['Wooden Nickel', 'unlockable — extra coin most rooms'], ['Store Key', 'unlockable — helps with shop access'] ],
      unlock: 'Donate 1,000 coins to the Greed Donation Machine (this destroys it).',
      blurb: 'Uses coins as health — hearts turn into Blue Flies, and only coins can heal him.',
      tip: "Watch your change constantly. Loose coins on the floor are, literally, your health bar."
    },
    {
      id: 'apollyon', icon: 'void', name: 'Apollyon', kind: 'regular', tag: 'the destroyer',
      stats: { hp: '2 Red Hearts', speed: '1.0', dmg: '3.5', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['Void', 'active item — absorbs items into stat boosts and stored effects'] ],
      unlock: 'Defeat Mega Satan.',
      blurb: "Turns items you'd normally skip into raw stats or stacked active-item effects.",
      tip: "Rooms offering a choice of items let you Void every option — take those seriously."
    },
    {
      id: 'the-forgotten', icon: 'bone', name: 'The Forgotten', kind: 'regular', tag: 'the skeleton',
      stats: { hp: 'Bone Hearts (Forgotten) / Soul + Black Hearts (The Soul)', speed: '1.35 / 1.0', dmg: '5.25 (×1.5) / 3.5', range: '6.5 / 6.5', shot: '1.0 / 1.0', luck: '0 / 0' },
      loadout: [ ['Bone Club', 'melee attack that can also be thrown boomerang-style'] ],
      unlock: "Kill a floor's boss within a minute, bomb the starting room to spawn a Broken Shovel, clear the Boss Rush with it, then use it in the Dark Room.",
      blurb: 'Two characters sharing one health bar — swap between melee skeleton and flying soul with Drop.',
      tip: "Let The Soul tank hits while The Forgotten is invincible, then swap back to attack."
    },
    {
      id: 'bethany', icon: 'flame', name: 'Bethany', kind: 'regular', tag: 'the wisp-caller',
      stats: { hp: '3 Red Hearts', speed: '1.0', dmg: '3.5', range: '6.5', shot: '1.0', luck: '0' },
      loadout: [ ['Book of Virtues', 'spawns orbiting Wisps that fight alongside her'], ['4 Soul Charges', 'power active items instead of Soul/Black Hearts'] ],
      unlock: 'Defeat Mom\u2019s Heart / It Lives! as Lazarus on Hard Mode.',
      blurb: "Can't use Soul or Black Hearts as health — they fuel her active item instead.",
      tip: "Grab almost any active item — Book of Virtues turns its charge into a bonus Wisp too."
    },
    {
      id: 'jacob-esau', icon: 'twins', name: 'Jacob & Esau', kind: 'regular', tag: 'the brothers',
      stats: { hp: '3 Red Hearts (Jacob) + 1 Soul Heart (Esau)', speed: '1.0 shared', dmg: '2.75 / 3.75', range: '5.0 / 8.0', shot: '1.15 / 0.85', luck: '1 / -1' },
      loadout: [ ['No starting items', ''] ],
      unlock: 'Defeat Mother.',
      blurb: 'Two brothers moving and firing together — hold Drop to peel Jacob off and reposition alone.',
      tip: 'On floors with paired item choices, send one brother to each pedestal instead of just one item.'
    }
  ];

  var regularList = document.getElementById('regularList');
  var searchInput = document.getElementById('searchInput');
  var emptyState = document.getElementById('emptyState');
  var regularBox = document.getElementById('regularBox');
  var regularHeading = document.querySelectorAll('.section-heading')[0];

  function statChip(label, value) {
    if (!value) return '';
    return '<span class="stat-chip">' + label + ' <b>' + escapeHtml(value) + '</b></span>';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function buildRow(c) {
    var item = document.createElement('div');
    item.className = 'roster-item';
    item.setAttribute('data-kind', c.kind);
    item.setAttribute('data-search', (c.name + ' ' + (c.epithet || '') + ' ' + c.tag + ' ' + c.loadout.map(function(l){return l[0];}).join(' ')).toLowerCase());

    var loadoutHtml = c.loadout.map(function (pair) {
      if (!pair[1]) return '<li><b>' + escapeHtml(pair[0]) + '</b></li>';
      return '<li><b>' + escapeHtml(pair[0]) + '</b> — ' + escapeHtml(pair[1]) + '</li>';
    }).join('');

    item.innerHTML =
      '<button class="roster-head" aria-expanded="false">' +
        '<span class="roster-icon' + (c.kind === 'tainted' ? ' tainted' : '') + '" aria-hidden="true">' +
          '<img class="roster-portrait" src="images/' + c.id + '.png" alt="" loading="lazy" ' +
            'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' +
          '<span class="roster-icon-fallback">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[c.icon] || '') + '</svg>' +
          '</span>' +
        '</span>' +
        '<span class="roster-info">' +
          '<p class="roster-name">' + escapeHtml(c.name) + (c.epithet ? '<span class="roster-epithet">' + escapeHtml(c.epithet) + '</span>' : '') + '</p>' +
          '<p class="roster-tagline">' + escapeHtml(c.tag) + '</p>' +
        '</span>' +
        '<span class="roster-chevron" aria-hidden="true">+</span>' +
      '</button>' +
      '<div class="roster-body">' +
        '<div class="roster-body-inner">' +
          '<div class="stat-chip-row">' +
            statChip('HP', c.stats.hp) +
            statChip('Speed', c.stats.speed) +
            statChip('Damage', c.stats.dmg) +
            statChip('Range', c.stats.range) +
            statChip('Shot Speed', c.stats.shot) +
            statChip('Luck', c.stats.luck) +
          '</div>' +
          '<div class="detail-block">' +
            '<p class="detail-label">Starting loadout</p>' +
            '<ul class="loadout-mini-list">' + loadoutHtml + '</ul>' +
          '</div>' +
          '<div class="detail-block">' +
            '<p class="detail-label">Unlock</p>' +
            '<p class="detail-text">' + escapeHtml(c.unlock) + '</p>' +
          '</div>' +
          '<div class="detail-block">' +
            '<p class="detail-label">Playstyle</p>' +
            '<p class="detail-text">' + escapeHtml(c.blurb) + '</p>' +
          '</div>' +
          '<div class="detail-block">' +
            '<p class="detail-label">Tip</p>' +
            '<p class="detail-text">' + escapeHtml(c.tip) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    var head = item.querySelector('.roster-head');
    head.addEventListener('click', function () {
      var isOpen = item.classList.toggle('open');
      head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    return item;
  }

  DATA.forEach(function (c) {
    var row = buildRow(c);
    regularList.appendChild(row);
  });

  var allRows = Array.prototype.slice.call(document.querySelectorAll('.roster-item'));

  function applyFilters() {
    var q = searchInput.value.trim().toLowerCase();
    var visibleCount = 0;

    allRows.forEach(function (row) {
      var matchesSearch = !q || row.getAttribute('data-search').indexOf(q) !== -1;
      row.classList.toggle('hidden', !matchesSearch);
      if (matchesSearch) visibleCount++;
    });

    var regularVisible = regularList.querySelectorAll('.roster-item:not(.hidden)').length;
    regularBox.style.display = regularVisible ? '' : 'none';
    regularHeading.style.display = regularVisible ? '' : 'none';

    emptyState.classList.toggle('hidden', visibleCount !== 0);
  }

  searchInput.addEventListener('input', applyFilters);

})();