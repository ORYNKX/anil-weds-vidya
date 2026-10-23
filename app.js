/* ==========================================================================
   Anil & Vidya — invitation interactions
   Vanilla JS, no dependencies. All media is served locally.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Optional: set this to a form endpoint (Formspree, Basin, Netlify, etc.)
     to also send RSVPs to the couple. Leave empty for local-only storage. */
  const RSVP_ENDPOINT = '';
  const RSVP_STORAGE_KEY = 'anil-vidya-rsvp-v1';

  const WEDDING = {
    date: new Date('2026-11-25T10:30:00+05:30'),
    icsStart: '20261125T050000Z',
    icsEnd: '20261125T090000Z',
    googleDates: '20261125T050000Z%2F20261125T090000Z',
    title: "Anil & Vidya's Wedding",
    location: 'Grand Hotel, Kovalam, Kerala, India',
  };

  const entry = $('#entry');
  const enterBtn = $('#enterBtn');
  const enterSilent = $('#enterSilent');
  const heroTitle = $('#hero-title');
  const nav = $('#siteNav');
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  const main = $('#main');
  const footer = $('.site-footer');
  const audio = $('#bgMusic');
  const musicToggle = $('#musicToggle');
  const toast = $('#toast');

  let entered = false;
  let toastTimer = 0;

  const showToast = (message, duration = 3400) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
  };

  /* ==========================================================================
     Entry gate + music
     ========================================================================== */

  const inertTargets = [nav, main, footer, musicToggle].filter(Boolean);

  const setPageInert = (state) => {
    inertTargets.forEach((element) => {
      element.inert = state;
    });
  };

  const setMusicUI = (playing) => {
    if (!musicToggle) return;
    musicToggle.classList.toggle('is-playing', playing);
    musicToggle.setAttribute('aria-pressed', String(playing));
    musicToggle.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  };

  const fadeTo = (target, duration = 1400) => {
    if (!audio) return;
    const start = audio.volume;
    const startedAt = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      audio.volume = start + (target - start) * progress;
      if (progress < 1 && !audio.paused) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  const startMusic = () => {
    if (!audio) return;
    if (!audio.paused) return;
    audio.volume = 0;
    const playback = audio.play();
    if (playback && typeof playback.then === 'function') {
      playback
        .then(() => fadeTo(0.42, 1800))
        .catch(() => {
          setMusicUI(false);
          showToast('Your browser blocked the music. Tap the floating music button to start it.');
        });
    }
  };

  const enterInvitation = (withMusic) => {
    if (entered) return;
    entered = true;

    if (withMusic) startMusic();

    document.documentElement.classList.add('is-entered');
    document.body.classList.remove('entry-open');
    setPageInert(false);

    entry.classList.add('is-leaving');
    entry.setAttribute('aria-hidden', 'true');

    const delay = reducedMotion.matches ? 60 : 850;
    window.setTimeout(() => {
      entry.hidden = true;
      if (heroTitle) heroTitle.focus({ preventScroll: true });
    }, delay);
  };

  if (entry) {
    document.body.classList.add('entry-open');
    setPageInert(true);
    window.setTimeout(() => enterBtn && enterBtn.focus({ preventScroll: true }), 250);

    enterBtn?.addEventListener('click', () => enterInvitation(true));
    enterSilent?.addEventListener('click', () => enterInvitation(false));

    entry.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') enterInvitation(false);
    });
  }

  if (audio) {
    audio.volume = 0.42;
    audio.addEventListener('play', () => setMusicUI(true));
    audio.addEventListener('pause', () => setMusicUI(false));
    audio.addEventListener('error', () => {
      setMusicUI(false);
      showToast('The soundtrack could not be loaded right now.');
    });

    musicToggle?.addEventListener('click', () => {
      if (audio.paused) {
        startMusic();
      } else {
        audio.pause();
      }
    });
  }

  /* ==========================================================================
     Navigation + scroll progress
     ========================================================================== */

  let scrollQueued = false;

  const updateScrollUI = () => {
    scrollQueued = false;
    const scrolled = window.scrollY > 40;
    nav?.classList.toggle('is-scrolled', scrolled);

    const progress = $('#scrollProgress');
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }
  };

  const queueScrollUI = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener('scroll', queueScrollUI, { passive: true });
  window.addEventListener('resize', queueScrollUI, { passive: true });
  updateScrollUI();

  let menuTimer = 0;
  let menuIsOpen = false;

  const closeMenu = () => {
    if (!menuIsOpen || !mobileMenu) return;
    menuIsOpen = false;
    nav?.classList.remove('menu-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Open menu');
    mobileMenu.classList.remove('is-open');
    document.removeEventListener('click', onDocumentClick);
    window.clearTimeout(menuTimer);
    menuTimer = window.setTimeout(() => {
      if (!menuIsOpen) mobileMenu.hidden = true;
    }, 320);
  };

  const openMenu = () => {
    if (menuIsOpen || !mobileMenu) return;
    menuIsOpen = true;
    mobileMenu.hidden = false;
    nav?.classList.add('menu-open');
    navToggle?.setAttribute('aria-expanded', 'true');
    navToggle?.setAttribute('aria-label', 'Close menu');
    window.clearTimeout(menuTimer);
    window.requestAnimationFrame(() => mobileMenu.classList.add('is-open'));
    // Defer so the opening click does not immediately close the panel.
    window.setTimeout(() => document.addEventListener('click', onDocumentClick), 0);
  };

  function onDocumentClick(event) {
    if (!menuIsOpen) return;
    const target = event.target;
    if (mobileMenu?.contains(target) || navToggle?.contains(target)) return;
    closeMenu();
  }

  navToggle?.addEventListener('click', () => {
    if (menuIsOpen) closeMenu();
    else openMenu();
  });

  $$('#mobileMenu a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuIsOpen) {
      closeMenu();
      navToggle?.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) closeMenu();
  }, { passive: true });

  // Highlight the section currently in view.
  const navLinks = $$('.nav-links a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entryItem) => {
          if (!entryItem.isIntersecting) return;
          const hash = `#${entryItem.target.id}`;
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === hash);
          });
        });
      },
      { rootMargin: '-42% 0px -52% 0px', threshold: 0 }
    );
    ['story', 'countdown', 'schedule', 'venue'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ==========================================================================
     Countdown
     ========================================================================== */

  const timer = $('#countdown-timer');
  const unitNodes = {
    days: $('[data-unit="days"]'),
    hours: $('[data-unit="hours"]'),
    minutes: $('[data-unit="minutes"]'),
    seconds: $('[data-unit="seconds"]'),
  };
  const countdownNote = $('#countdownNote');
  const pad = (value, size = 2) => String(value).padStart(size, '0');

  let countdownInterval = 0;

  const renderCountdown = () => {
    const remaining = WEDDING.date.getTime() - Date.now();

    if (remaining <= 0) {
      if (unitNodes.days) unitNodes.days.textContent = '000';
      if (unitNodes.hours) unitNodes.hours.textContent = '00';
      if (unitNodes.minutes) unitNodes.minutes.textContent = '00';
      if (unitNodes.seconds) unitNodes.seconds.textContent = '00';
      if (countdownNote) countdownNote.textContent = 'Today is the day — let the celebration begin!';
      timer?.setAttribute('aria-label', 'The wedding day has arrived');
      window.clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(remaining / 86_400_000);
    const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1000);

    if (unitNodes.days) unitNodes.days.textContent = pad(days, 3);
    if (unitNodes.hours) unitNodes.hours.textContent = pad(hours);
    if (unitNodes.minutes) unitNodes.minutes.textContent = pad(minutes);
    if (unitNodes.seconds) unitNodes.seconds.textContent = pad(seconds);
  };

  if (timer) {
    renderCountdown();
    countdownInterval = window.setInterval(renderCountdown, 1000);
  }

  /* ==========================================================================
     Reveal on scroll
     ========================================================================== */

  const revealItems = $$('[data-reveal]');

  revealItems.forEach((item) => {
    const delay = item.dataset.delay;
    if (delay) item.style.setProperty('--reveal-delay', delay);
  });

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entryItem) => {
          if (!entryItem.isIntersecting) return;
          entryItem.target.classList.add('is-visible');
          observer.unobserve(entryItem.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* ==========================================================================
     Calendar dialog + .ics
     ========================================================================== */

  const calendarDialog = $('#calendarDialog');
  const calendarClose = $('#calendarClose');
  const calendarDone = $('#calendarDone');
  const icsButton = $('#icsButton');
  const calendarOpeners = $$('[data-calendar-open]');
  let lastCalendarTrigger = null;

  const openCalendar = (event) => {
    if (!calendarDialog) return;
    lastCalendarTrigger = event?.currentTarget || null;
    document.body.classList.add('modal-open');
    if (typeof calendarDialog.showModal === 'function') {
      if (!calendarDialog.open) calendarDialog.showModal();
    } else {
      calendarDialog.setAttribute('open', '');
    }
  };

  const closeCalendar = () => {
    if (!calendarDialog) return;
    if (typeof calendarDialog.close === 'function' && calendarDialog.open) {
      calendarDialog.close();
    } else {
      calendarDialog.removeAttribute('open');
    }
    document.body.classList.remove('modal-open');
    if (lastCalendarTrigger && typeof lastCalendarTrigger.focus === 'function') {
      lastCalendarTrigger.focus({ preventScroll: true });
    }
  };

  calendarOpeners.forEach((button) => button.addEventListener('click', openCalendar));
  calendarClose?.addEventListener('click', closeCalendar);
  calendarDone?.addEventListener('click', closeCalendar);

  calendarDialog?.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });

  calendarDialog?.addEventListener('click', (event) => {
    if (event.target !== calendarDialog) return;
    const rect = calendarDialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) closeCalendar();
  });

  const foldLine = (line) => {
    if (line.length <= 73) return line;
    const parts = [];
    let rest = line;
    while (rest.length > 73) {
      parts.push(rest.slice(0, 73));
      rest = rest.slice(73);
    }
    parts.push(rest);
    return parts.join('\r\n ');
  };

  const buildIcs = () => {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Anil and Vidya//Wedding Invitation//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:anil-vidya-wedding-${WEDDING.icsStart}@grand-hotel-kovalam`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${WEDDING.icsStart}`,
      `DTEND:${WEDDING.icsEnd}`,
      'SUMMARY:Anil & Vidya\'s Wedding',
      'DESCRIPTION:Join us for the wedding of Anil & Vidya at Grand Hotel\\, Kovalam. Muhurtham at 10:30 AM IST\\, followed by the reception and feast.',
      `LOCATION:${WEDDING.location.replace(/,/g, '\\,')}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Anil & Vidya are getting married tomorrow',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    return `${lines.map(foldLine).join('\r\n')}\r\n`;
  };

  icsButton?.addEventListener('click', () => {
    const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Anil-and-Vidya-Wedding.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    closeCalendar();
    showToast('Calendar file downloaded — we can’t wait to see you.');
  });

  // Keep the Google Calendar link fresh even if the page stays open across days.
  const googleCalendar = $('#googleCalendar');
  if (googleCalendar) {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: WEDDING.title,
      dates: `${WEDDING.icsStart}/${WEDDING.icsEnd}`,
      details: 'Join us for the wedding of Anil & Vidya at Grand Hotel, Kovalam, Kerala.',
      location: WEDDING.location,
      ctz: 'Asia/Kolkata',
    });
    googleCalendar.href = `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /* ==========================================================================
     RSVP
     ========================================================================== */

  const form = $('#rsvpForm');
  const nameInput = $('#guestName');
  const guestsSelect = $('#guestCount');
  const messageInput = $('#message');
  const messageCount = $('#messageCount');
  const submitButton = $('#rsvpSubmit');
  const successPanel = $('#rsvpSuccess');
  const successTitle = $('#successTitle');
  const successText = $('#successText');
  const editButton = $('#editRsvp');
  const rsvpCard = $('.rsvp__card');
  const attendanceRadios = $$('input[name="attending"]');
  const nameError = $('#nameError');
  const guestsError = $('#guestsError');
  const attendanceError = $('#attendanceError');

  const updateMessageCount = () => {
    if (!messageInput || !messageCount) return;
    messageCount.textContent = `${messageInput.value.length} / 500`;
  };

  const clearFieldState = (element, errorElement) => {
    element?.classList.remove('is-invalid');
    const input = element?.querySelector('input, select, textarea');
    if (input) input.removeAttribute('aria-invalid');
    if (errorElement) errorElement.hidden = true;
  };

  const setFieldState = (element, errorElement, input) => {
    element?.classList.add('is-invalid');
    if (input) input.setAttribute('aria-invalid', 'true');
    if (errorElement) errorElement.hidden = false;
  };

  const clearAllErrors = () => {
    clearFieldState($('#guestName')?.closest('.field'), nameError);
    clearFieldState($('#guestCount')?.closest('.field'), guestsError);
    clearFieldState($('.attendance'), attendanceError);
    attendanceRadios.forEach((radio) => radio.removeAttribute('aria-invalid'));
    form?.classList.remove('has-error');
  };

  const fillForm = (data) => {
    if (nameInput) nameInput.value = data.name || '';
    if (guestsSelect) guestsSelect.value = data.guests || '';
    if (messageInput) messageInput.value = data.message || '';
    const matchingRadio = attendanceRadios.find((radio) => radio.value === data.attending);
    if (matchingRadio) matchingRadio.checked = true;
    updateMessageCount();
  };

  const createPetals = () => {
    if (!rsvpCard || reducedMotion.matches) return;
    const colors = ['#ecd4cb', '#e6d2a6', '#c6a664', '#c9d6c9'];
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 14; index += 1) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.setAttribute('aria-hidden', 'true');
      petal.style.setProperty('--x', `${5 + Math.random() * 90}%`);
      petal.style.setProperty('--drift', `${-70 + Math.random() * 140}px`);
      petal.style.setProperty('--spin', `${180 + Math.random() * 420}deg`);
      petal.style.setProperty('--duration', `${2.3 + Math.random() * 1.3}s`);
      petal.style.setProperty('--delay', `${Math.random() * 0.45}s`);
      petal.style.setProperty('--petal-color', colors[index % colors.length]);
      fragment.appendChild(petal);
      window.setTimeout(() => petal.remove(), 4200);
    }

    rsvpCard.appendChild(fragment);
  };

  const renderSuccess = (data, { focus = true, petals = true } = {}) => {
    if (!form || !successPanel) return;

    const firstName = (data.name || 'friend').trim().split(/\s+/)[0];
    const attending = data.attending === 'yes';
    const guestLabel = data.guests === '7+' ? 'your party' : `${data.guests} ${data.guests === '1' ? 'guest' : 'guests'}`;

    if (successTitle) successTitle.textContent = `Thank you, ${firstName}!`;
    if (successText) {
      successText.textContent = attending
        ? `Your place at our table is saved for ${guestLabel}. We are overjoyed that you will be celebrating with us in Kovalam — it would not be the same without you.`
        : 'We will miss you at the celebration, but we are so grateful for your love and warm wishes. We will raise a glass to you from Kovalam.';
    }

    form.hidden = true;
    successPanel.hidden = false;

    if (petals) createPetals();

    if (focus) {
      window.setTimeout(() => successPanel.focus({ preventScroll: true }), 60);
    }
  };

  const hideSuccess = () => {
    if (!form || !successPanel) return;
    successPanel.hidden = true;
    form.hidden = false;
    nameInput?.focus({ preventScroll: true });
    rsvpCard?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
  };

  const readSavedRsvp = () => {
    try {
      const raw = window.localStorage.getItem(RSVP_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.name !== 'string' || !parsed.attending) return null;
      if (!parsed.guests) parsed.guests = '1';
      return parsed;
    } catch {
      return null;
    }
  };

  const saveRsvp = (data) => {
    try {
      window.localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Private browsing or storage disabled — the confirmation still works.
    }
  };

  const submitRsvp = async (data) => {
    if (!RSVP_ENDPOINT) return true;

    const response = await fetch(RSVP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });

    return response.ok;
  };

  if (form) {
    updateMessageCount();

    messageInput?.addEventListener('input', updateMessageCount);
    nameInput?.addEventListener('input', () => clearFieldState(nameInput.closest('.field'), nameError));
    guestsSelect?.addEventListener('change', () => clearFieldState(guestsSelect.closest('.field'), guestsError));
    attendanceRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        clearFieldState($('.attendance'), attendanceError);
        attendanceRadios.forEach((item) => item.removeAttribute('aria-invalid'));
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAllErrors();

      const name = nameInput ? nameInput.value.trim() : '';
      const guests = guestsSelect ? guestsSelect.value : '';
      const attendingRadio = attendanceRadios.find((radio) => radio.checked);
      let firstInvalid = null;

      if (name.length < 2) {
        setFieldState(nameInput?.closest('.field'), nameError, nameInput);
        firstInvalid = firstInvalid || nameInput;
      }

      if (!guests) {
        setFieldState(guestsSelect?.closest('.field'), guestsError, guestsSelect);
        firstInvalid = firstInvalid || guestsSelect;
      }

      if (!attendingRadio) {
        setFieldState($('.attendance'), attendanceError, null);
        attendanceRadios.forEach((radio) => radio.setAttribute('aria-invalid', 'true'));
        firstInvalid = firstInvalid || attendanceRadios[0];
      }

      if (firstInvalid) {
        form.classList.add('has-error');
        window.setTimeout(() => form.classList.remove('has-error'), 450);
        firstInvalid.focus({ preventScroll: false });
        return;
      }

      const data = {
        name,
        guests,
        attending: attendingRadio.value,
        message: messageInput ? messageInput.value.trim() : '',
        submittedAt: new Date().toISOString(),
      };

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
      }

      try {
        const delivered = await submitRsvp(data);
        if (!delivered) throw new Error('RSVP could not be delivered');
        saveRsvp(data);
        renderSuccess(data);
      } catch {
        showToast('We could not send your RSVP just now. Please try again.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.removeAttribute('aria-busy');
        }
      }
    });
  }

  editButton?.addEventListener('click', hideSuccess);

  const saved = readSavedRsvp();
  if (saved) {
    fillForm(saved);
    renderSuccess(saved, { focus: false, petals: false });
  }

  /* ==========================================================================
     Tiny niceties
     ========================================================================== */

  // No-JS fallback for the entry gate: if scripts load late, never leave the
  // page locked behind an invisible overlay.
  window.addEventListener('pageshow', () => {
    if (!entered && entry && entry.hidden) setPageInert(false);
  });
})();
