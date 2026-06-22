(() => {
  "use strict";

  // Keeping one fixed project time zone guarantees that both writers receive
  // the same official prompt, even if one of them is traveling.
  const PROJECT_TIME_ZONE = "America/Denver";
  const LAUNCH_DATE = "2026-06-22";
  const STORAGE_PREFIX = "doe-tydo-daily-draft";
  const DAY_IN_MS = 86_400_000;
  const prompts = Array.isArray(window.WRITING_PROMPTS) ? window.WRITING_PROMPTS : [];

  const elements = {
    navButtons: [...document.querySelectorAll(".nav-button")],
    views: {
      today: document.querySelector("#today-view"),
      archive: document.querySelector("#archive-view"),
      about: document.querySelector("#about-view")
    },
    dateLine: document.querySelector("#date-line"),
    promptMode: document.querySelector("#prompt-mode"),
    promptCategory: document.querySelector("#prompt-category"),
    promptText: document.querySelector("#prompt-text"),
    copyPrompt: document.querySelector("#copy-prompt"),
    anotherPrompt: document.querySelector("#another-prompt"),
    backToToday: document.querySelector("#back-to-today"),
    responseInput: document.querySelector("#response-input"),
    wordCount: document.querySelector("#word-count"),
    saveStatus: document.querySelector("#save-status"),
    downloadResponse: document.querySelector("#download-response"),
    clearResponse: document.querySelector("#clear-response"),
    archiveSearch: document.querySelector("#archive-search"),
    archiveList: document.querySelector("#archive-list"),
    archiveEmpty: document.querySelector("#archive-empty")
  };

  let officialDateKey = getProjectDateKey();
  let officialPrompt = getPromptForDate(officialDateKey);
  let currentContext = null;
  let extraCursor = 0;
  let saveTimer = null;
  let archiveEntries = [];

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function getProjectDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: PROJECT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function isoToUtcDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  function formatProjectDate(dateKey, options = {}) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: PROJECT_TIME_ZONE,
      weekday: options.short ? undefined : "long",
      year: "numeric",
      month: options.short ? "short" : "long",
      day: "numeric"
    }).format(isoToUtcDate(dateKey));
  }

  function addDays(dateKey, amount) {
    const date = isoToUtcDate(dateKey);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }

  function dayOffsetFromLaunch(dateKey) {
    const launch = Date.parse(`${LAUNCH_DATE}T00:00:00Z`);
    const target = Date.parse(`${dateKey}T00:00:00Z`);
    return Math.floor((target - launch) / DAY_IN_MS);
  }

  function getPromptForDate(dateKey) {
    if (!prompts.length) return null;
    const index = positiveModulo(dayOffsetFromLaunch(dateKey), prompts.length);
    return prompts[index];
  }

  function getBonusPrompt() {
    if (prompts.length <= 1) return officialPrompt;

    // This seed makes the bonus sequence consistent for a given date while
    // still cycling through prompts that differ from the official selection.
    const dateSeed = [...officialDateKey].reduce(
      (total, character) => total + character.charCodeAt(0),
      0
    );

    let candidate;
    do {
      extraCursor += 1;
      candidate = prompts[positiveModulo(dateSeed + extraCursor * 17, prompts.length)];
    } while (candidate.id === officialPrompt.id && extraCursor < prompts.length * 2);

    return candidate;
  }

  function draftStorageKey(context) {
    return `${STORAGE_PREFIX}:draft:${context.dateKey}:${context.prompt.id}`;
  }

  function readDraft(context) {
    try {
      return localStorage.getItem(draftStorageKey(context)) || "";
    } catch (error) {
      console.warn("Local storage is unavailable.", error);
      return "";
    }
  }

  function saveCurrentDraft({ immediate = false } = {}) {
    if (!currentContext) return;

    window.clearTimeout(saveTimer);
    const save = () => {
      try {
        localStorage.setItem(draftStorageKey(currentContext), elements.responseInput.value);
        elements.saveStatus.textContent = "Saved on this device";
      } catch (error) {
        console.warn("Draft could not be saved.", error);
        elements.saveStatus.textContent = "Could not save locally";
      }
    };

    if (immediate) {
      save();
      return;
    }

    elements.saveStatus.textContent = "Saving…";
    saveTimer = window.setTimeout(save, 350);
  }

  function modeLabel(mode) {
    if (mode === "extra") return "Bonus practice prompt";
    if (mode === "archive") return "Archived daily prompt";
    return "Official daily prompt";
  }

  function renderPrompt(prompt, context) {
    if (!prompt) {
      elements.promptText.textContent = "No prompts are available yet. Add one in js/prompts.js.";
      return;
    }

    if (currentContext) saveCurrentDraft({ immediate: true });

    currentContext = { ...context, prompt };
    elements.promptMode.textContent = modeLabel(context.mode);
    elements.promptCategory.textContent = prompt.category;
    elements.promptText.textContent = prompt.text;
    elements.dateLine.textContent = formatProjectDate(context.dateKey);
    elements.backToToday.hidden = context.mode === "today";
    elements.anotherPrompt.hidden = context.mode === "archive";
    elements.responseInput.value = readDraft(currentContext);
    elements.saveStatus.textContent = "Saved on this device";
    updateWordCount();
  }

  function showView(viewName) {
    Object.entries(elements.views).forEach(([name, view]) => {
      view.hidden = name !== viewName;
    });

    elements.navButtons.forEach((button) => {
      const active = button.dataset.view === viewName;
      button.classList.toggle("is-active", active);
      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    if (viewName === "archive") {
      renderArchive();
      elements.archiveSearch.focus({ preventScroll: true });
    }
  }

  function updateWordCount() {
    const trimmed = elements.responseInput.value.trim();
    const count = trimmed ? trimmed.split(/\s+/u).length : 0;
    elements.wordCount.textContent = `${count} ${count === 1 ? "word" : "words"}`;
  }

  async function copyText(text, button) {
    const originalLabel = button.textContent;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      button.textContent = "Copied";
    } catch (error) {
      console.warn("Copy failed.", error);
      button.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      button.textContent = originalLabel;
    }, 1400);
  }

  function safeFilename(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function downloadDraft() {
    if (!currentContext) return;
    saveCurrentDraft({ immediate: true });

    const body = [
      "Lil Doe / Tydo Daily Draft",
      formatProjectDate(currentContext.dateKey),
      `${modeLabel(currentContext.mode)} — ${currentContext.prompt.category}`,
      "",
      currentContext.prompt.text,
      "",
      "--- RESPONSE ---",
      "",
      elements.responseInput.value
    ].join("\n");

    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentContext.dateKey}-${safeFilename(currentContext.prompt.id)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function createArchiveEntries() {
    const todayOffset = dayOffsetFromLaunch(officialDateKey);
    if (todayOffset < 0) return [];

    const entries = [];
    for (let offset = todayOffset; offset >= 0; offset -= 1) {
      const dateKey = addDays(LAUNCH_DATE, offset);
      entries.push({
        dateKey,
        prompt: getPromptForDate(dateKey)
      });
    }
    return entries;
  }

  function archiveItemMarkup(entry) {
    return `
      <article class="archive-item" data-search="${escapeAttribute(`${entry.prompt.category} ${entry.prompt.text}`.toLowerCase())}">
        <time class="archive-date" datetime="${entry.dateKey}">${formatProjectDate(entry.dateKey, { short: true })}</time>
        <div class="archive-prompt">
          <p>${escapeHtml(entry.prompt.text)}</p>
          <span>${escapeHtml(entry.prompt.category)}</span>
        </div>
        <div class="archive-actions">
          <button class="button button-secondary" type="button" data-archive-action="open" data-date="${entry.dateKey}">Open</button>
          <button class="button button-quiet" type="button" data-archive-action="copy" data-date="${entry.dateKey}">Copy</button>
        </div>
      </article>
    `;
  }

  function renderArchive() {
    const query = elements.archiveSearch.value.trim().toLowerCase();
    const matches = archiveEntries.filter((entry) => {
      const searchable = `${entry.prompt.category} ${entry.prompt.text}`.toLowerCase();
      return searchable.includes(query);
    });

    elements.archiveList.innerHTML = matches.map(archiveItemMarkup).join("");
    elements.archiveEmpty.hidden = matches.length > 0;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  function refreshAtNewProjectDate() {
    const newDateKey = getProjectDateKey();
    if (newDateKey === officialDateKey) return;

    saveCurrentDraft({ immediate: true });
    officialDateKey = newDateKey;
    officialPrompt = getPromptForDate(officialDateKey);
    extraCursor = 0;
    archiveEntries = createArchiveEntries();
    elements.archiveSearch.value = "";
    renderPrompt(officialPrompt, { mode: "today", dateKey: officialDateKey });
    renderArchive();
  }

  function initializeEvents() {
    elements.navButtons.forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.view));
    });

    elements.copyPrompt.addEventListener("click", () => {
      if (currentContext) copyText(currentContext.prompt.text, elements.copyPrompt);
    });

    elements.anotherPrompt.addEventListener("click", () => {
      renderPrompt(getBonusPrompt(), { mode: "extra", dateKey: officialDateKey });
    });

    elements.backToToday.addEventListener("click", () => {
      renderPrompt(officialPrompt, { mode: "today", dateKey: officialDateKey });
    });

    elements.responseInput.addEventListener("input", () => {
      updateWordCount();
      saveCurrentDraft();
    });

    elements.responseInput.addEventListener("blur", () => {
      saveCurrentDraft({ immediate: true });
    });

    elements.downloadResponse.addEventListener("click", downloadDraft);

    elements.clearResponse.addEventListener("click", () => {
      if (!elements.responseInput.value) return;
      const shouldClear = window.confirm("Clear this locally saved draft? This cannot be undone.");
      if (!shouldClear) return;

      elements.responseInput.value = "";
      updateWordCount();
      saveCurrentDraft({ immediate: true });
      elements.responseInput.focus();
    });

    elements.archiveSearch.addEventListener("input", renderArchive);

    elements.archiveList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-archive-action]");
      if (!button) return;

      const entry = archiveEntries.find((item) => item.dateKey === button.dataset.date);
      if (!entry) return;

      if (button.dataset.archiveAction === "copy") {
        copyText(entry.prompt.text, button);
        return;
      }

      renderPrompt(entry.prompt, { mode: "archive", dateKey: entry.dateKey });
      showView("today");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("beforeunload", () => saveCurrentDraft({ immediate: true }));
    window.setInterval(refreshAtNewProjectDate, 60_000);
  }

  function initialize() {
    if (!prompts.length) {
      renderPrompt(null, { mode: "today", dateKey: officialDateKey });
      elements.anotherPrompt.disabled = true;
      elements.responseInput.disabled = true;
      return;
    }

    archiveEntries = createArchiveEntries();
    renderPrompt(officialPrompt, { mode: "today", dateKey: officialDateKey });
    initializeEvents();
  }

  initialize();
})();
