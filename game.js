// Letter Match: game logic only. Letters and distractors live in languages/*.js.
(function () {
  'use strict';

  // ---------- Difficulty settings ----------
  const CONFIG = {
    untimedRounds: 10,   // rounds 1 to 10 have no timer
    timerStart: 10,      // seconds for the first timed round (round 11)
    timerStep: 1.5,      // seconds removed each time the timer steps down
    timerStepEvery: 10,  // rounds between timer steps
    timerFloor: 2,       // shortest allowed time limit, in seconds
    fourWayFrom: 31,     // from this round the left and right arms are used
    feedbackMs: 500      // how long the result shows before the next round
  };

  function limitFor(n) {
    if (n <= CONFIG.untimedRounds) return null;
    const steps = Math.floor((n - CONFIG.untimedRounds - 1) / CONFIG.timerStepEvery);
    return Math.max(CONFIG.timerFloor, CONFIG.timerStart - CONFIG.timerStep * steps);
  }

  // ---------- Language selection ----------
  const LANGS = window.LETTER_LANGS || {};
  const codes = Object.keys(LANGS);
  if (!codes.length) {
    document.getElementById('msg').textContent = 'No language files loaded.';
    return;
  }
  const requested = new URLSearchParams(location.search).get('lang');
  const code = LANGS[requested] ? requested : (LANGS.kn ? 'kn' : codes[0]);
  const LANG = LANGS[code];

  LANG.letters.forEach(function (l) {
    const d = LANG.distractors[l] || [];
    if (d.length < 3) console.warn('Letter ' + l + ' has only ' + d.length + ' distractors.');
  });

  // ---------- Font and page setup ----------
  (function applyLanguage() {
    const family = LANG.font;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' +
      family.replace(/ /g, '+') + ':wght@400;700&display=swap';
    document.head.appendChild(link);
    document.documentElement.lang = LANG.code;
    document.body.style.fontFamily = "'" + family + "', sans-serif";
    document.title = 'Letter Match · ' + LANG.name;
  })();

  const langSelect = document.getElementById('langSelect');
  codes.forEach(function (c) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = LANGS[c].name;
    if (c === code) opt.selected = true;
    langSelect.appendChild(opt);
  });
  langSelect.addEventListener('change', function () {
    location.href = location.pathname + '?lang=' + encodeURIComponent(langSelect.value);
  });

  // ---------- Helpers ----------
  const $ = function (id) { return document.getElementById(id); };
  const cells = {
    top: $('c-top'), bottom: $('c-bottom'), left: $('c-left'),
    right: $('c-right'), center: $('c-center')
  };
  const target = $('target');
  const timerWrap = $('timerWrap');
  const timerBar = $('timerBar');
  const msg = $('msg');

  // Positions of each arm, as left/top within the grid.
  const POS = {
    top:    ['33.33%', '0%'],
    bottom: ['33.33%', '66.66%'],
    left:   ['0%', '33.33%'],
    right:  ['66.66%', '33.33%'],
    center: ['33.33%', '33.33%']
  };

  function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- State ----------
  let turn = 0;
  let answered = 0;
  let score = 0;
  let locked = false;
  let matchArm = 'top';
  let timerId = null;
  let fourWay = false;

  function renderStatus() {
    $('turnTxt').textContent = 'Round ' + turn;
    $('scoreTxt').textContent = 'Score ' + score + ' / ' + answered;
  }

  function setTargetPos(arm) {
    target.style.left = POS[arm][0];
    target.style.top = POS[arm][1];
  }

  function startTimer(limit) {
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + limit + 's linear';
    timerBar.style.width = '0%';
    timerId = setTimeout(function () { resolve(null); }, limit * 1000);
  }

  function stopTimer() {
    clearTimeout(timerId);
    timerBar.style.transition = 'none';
    timerBar.style.width = getComputedStyle(timerBar).width;
  }

  function newRound() {
    turn++;
    locked = false;
    msg.textContent = '';
    fourWay = turn >= CONFIG.fourWayFrom;

    const t = pickOne(LANG.letters);
    const distractors = shuffle(LANG.distractors[t]);

    Object.keys(cells).forEach(function (k) {
      const c = cells[k];
      c.textContent = '';
      c.classList.remove('correct');
      c.hidden = false;
    });

    if (fourWay) {
      const arms = ['top', 'bottom', 'left', 'right'];
      matchArm = pickOne(arms);
      const others = arms.filter(function (a) { return a !== matchArm; });
      others.forEach(function (a, i) { cells[a].textContent = distractors[i]; });
      cells[matchArm].textContent = t;
    } else {
      cells.left.hidden = true;
      cells.right.hidden = true;
      matchArm = pickOne(['top', 'bottom']);
      const other = matchArm === 'top' ? 'bottom' : 'top';
      cells[other].textContent = distractors[0];
      cells[matchArm].textContent = t;
    }

    target.style.transition = 'none';
    setTargetPos('center');
    void target.offsetWidth;
    target.style.transition = 'left 0.15s ease, top 0.15s ease';
    target.textContent = t;

    const limit = limitFor(turn);
    if (limit === null) {
      timerWrap.style.visibility = 'hidden';
    } else {
      timerWrap.style.visibility = 'visible';
      startTimer(limit);
    }

    renderStatus();
  }

  // arm = 'top' | 'bottom' | 'left' | 'right', or null when time runs out
  function resolve(arm) {
    if (locked) return;
    locked = true;
    stopTimer();

    if (arm !== null) setTargetPos(arm);

    answered++;
    const correct = arm === matchArm;
    if (correct) score++;

    cells[matchArm].classList.add('correct');
    msg.innerHTML = correct ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>';

    renderStatus();
    setTimeout(newRound, CONFIG.feedbackMs);
  }

  const KEY_TO_ARM = { ArrowUp: 'top', ArrowDown: 'bottom', ArrowLeft: 'left', ArrowRight: 'right' };

  function move(arm) {
    if (locked) return;
    if (!fourWay && (arm === 'left' || arm === 'right')) return;
    resolve(arm);
  }

  // ---------- Keyboard ----------
  // If the language menu has focus (after it was used), the arrows should play the game,
  // so hand focus back to the page first.
  document.addEventListener('keydown', function (e) {
    const arm = KEY_TO_ARM[e.key];
    if (!arm) return;
    if (document.activeElement === langSelect) langSelect.blur();
    e.preventDefault();
    move(arm);
  });

  // ---------- Touch swipe ----------
  let touchStart = null;
  document.addEventListener('touchstart', function (e) {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (e.target !== langSelect) e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', function (e) {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) <= 30) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 'left' : 'right');
    else move(dy < 0 ? 'top' : 'bottom');
  });

  // ---------- Start ----------
  newRound();
})();
