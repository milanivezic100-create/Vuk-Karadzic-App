// ============================================================
// VUK KARADZIC PROBE
// V6
// ============================================================

"use strict";

const STORAGE_KEY = "vukProbeV4";
const OLD_STORAGE_KEY = "vukProbeV3";
const SELECTED_ENSEMBLE_KEY = "vukSelectedEnsemble";
const CLOUD_ROOT = "vukProbeV4";


// ============================================================
// DEFAULT DATA
// ============================================================

function createEnsemble(name, shortName) {
  return {
    name,
    shortName,
    dancers: [],
    dances: [],
    practices: [],
    instructorNotes: ""
  };
}

const defaultData = {
  ensembles: [
    createEnsemble("First Ensemble", "First"),
    createEnsemble("Second Ensemble", "Second"),
    createEnsemble("Third Ensemble", "Third"),
    createEnsemble("Fourth Ensemble", "Fourth"),
    createEnsemble("Fifth Ensemble", "Fifth")
  ]
};


// ============================================================
// LOAD DATA
// ============================================================

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLocalData() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(OLD_STORAGE_KEY);

    return saved
      ? JSON.parse(saved)
      : clone(defaultData);
  } catch (error) {
    console.error("Local data load failed:", error);
    return clone(defaultData);
  }
}

let data = loadLocalData();

let selectedEnsembleIndex = Number(
  localStorage.getItem(SELECTED_ENSEMBLE_KEY)
);

if (!Number.isInteger(selectedEnsembleIndex)) {
  selectedEnsembleIndex =
    Number.isInteger(data.selectedEnsemble)
      ? data.selectedEnsemble
      : 2;
}

let calendarDate = new Date();
let selectedCalendarDate = null;

let cloudReady = false;
let applyingCloud = false;
let firebaseSyncStarted = false;

let notesSaveTimer = null;


// ============================================================
// HELPERS
// ============================================================

function uid() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => value[key])
      .filter(Boolean);
  }

  return [];
}

function normalizeGender(value) {
  const gender = String(value || "").toLowerCase();

  if (
    gender === "male" ||
    gender === "boy" ||
    gender === "boys" ||
    gender === "m"
  ) {
    return "Male";
  }

  if (
    gender === "female" ||
    gender === "girl" ||
    gender === "girls" ||
    gender === "f"
  ) {
    return "Female";
  }

  return "Other";
}

function normalizeData() {
  if (!data || typeof data !== "object") {
    data = clone(defaultData);
  }

  data.ensembles = asArray(data.ensembles);

  const required = [
    ["First Ensemble", "First"],
    ["Second Ensemble", "Second"],
    ["Third Ensemble", "Third"],
    ["Fourth Ensemble", "Fourth"],
    ["Fifth Ensemble", "Fifth"]
  ];

  required.forEach(([name, shortName]) => {
    const exists = data.ensembles.some(
      item =>
        item &&
        (
          item.name === name ||
          item.shortName === shortName
        )
    );

    if (!exists) {
      data.ensembles.push(
        createEnsemble(name, shortName)
      );
    }
  });

  data.ensembles.forEach((ens, ensembleIndex) => {
    if (!ens.name) {
      ens.name = required[ensembleIndex]?.[0] ||
        `Ensemble ${ensembleIndex + 1}`;
    }

    if (!ens.shortName) {
      ens.shortName =
        required[ensembleIndex]?.[1] ||
        ens.name;
    }

    ens.instructorNotes =
      typeof ens.instructorNotes === "string"
        ? ens.instructorNotes
        : "";

    ens.dancers = asArray(ens.dancers);
    ens.dances = asArray(ens.dances);
    ens.practices = asArray(ens.practices);

    ens.dancers.forEach((dancer, index) => {
      if (dancer.id === undefined || dancer.id === null) {
        dancer.id = uid();
      }

      dancer.name = dancer.name || "Unnamed Dancer";
      dancer.gender = normalizeGender(dancer.gender);
      dancer.notes = dancer.notes || "";

      if (!Number.isFinite(Number(dancer.order))) {
        dancer.order = index;
      } else {
        dancer.order = Number(dancer.order);
      }
    });

    ["Male", "Female", "Other"].forEach(gender => {
      const group = ens.dancers
        .filter(d => d.gender === gender)
        .sort((a, b) => a.order - b.order);

      group.forEach((dancer, index) => {
        dancer.order = index;
      });
    });

    ens.dances.forEach((dance, index) => {
      if (dance.id === undefined || dance.id === null) {
        dance.id = uid();
      }

      dance.name = dance.name || "Unnamed Dance";
      dance.choreographer = dance.choreographer || "";
      dance.dancerIds = asArray(dance.dancerIds);
      dance.images = asArray(dance.images);
      dance.imageNames = asArray(dance.imageNames);
      dance.musicName = dance.musicName || "";

      if (
        !dance.music ||
        typeof dance.music !== "object"
      ) {
        dance.music = null;
      }

      /*
        NEW:
        All old dances automatically stay IN USE.
      */
      if (typeof dance.inUse !== "boolean") {
        dance.inUse = true;
      }

      if (!Number.isFinite(Number(dance.order))) {
        dance.order = index;
      } else {
        dance.order = Number(dance.order);
      }
    });

    [true, false].forEach(inUse => {
      const group = ens.dances
        .filter(d => d.inUse === inUse)
        .sort((a, b) => a.order - b.order);

      group.forEach((dance, index) => {
        dance.order = index;
      });
    });

    ens.practices.forEach(practice => {
      if (practice.id === undefined || practice.id === null) {
        practice.id = uid();
      }

      if (
        !practice.attendance ||
        typeof practice.attendance !== "object"
      ) {
        practice.attendance = {};
      }
    });
  });

  if (
    selectedEnsembleIndex < 0 ||
    selectedEnsembleIndex >= data.ensembles.length
  ) {
    selectedEnsembleIndex = 2;
  }

  /*
    Remove the old shared selection.
    Selection is now DEVICE-SPECIFIC.
  */
  delete data.selectedEnsemble;
}

normalizeData();


// ============================================================
// CURRENT ENSEMBLE
// ============================================================

function ensemble() {
  return data.ensembles[selectedEnsembleIndex];
}

function saveSelectedEnsemble() {
  localStorage.setItem(
    SELECTED_ENSEMBLE_KEY,
    String(selectedEnsembleIndex)
  );
}

function localBackup() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}


// ============================================================
// FIREBASE SAVE
// ============================================================

function saveData() {
  normalizeData();
  localBackup();

  if (
    !cloudReady ||
    applyingCloud ||
    !window.vukFirebase
  ) {
    return;
  }

  const {
    database,
    dbRef,
    set
  } = window.vukFirebase;

  set(
    dbRef(database, CLOUD_ROOT),
    data
  ).catch(error => {
    console.error("Firebase save failed:", error);

    showToast(
      "Saved on this device. Cloud sync failed."
    );
  });
}


// ============================================================
// TEXT / DATE HELPERS
// ============================================================

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function localDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function dateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  return localDate(dateString).toLocaleDateString(
    [],
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );
}

function shortDate(dateString) {
  return localDate(dateString).toLocaleDateString(
    [],
    {
      weekday: "short",
      month: "short",
      day: "numeric"
    }
  );
}

function formatTime(time) {
  if (!time) return "—";

  const [hours, minutes] = time.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes)
  );

  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}


// ============================================================
// TOAST / UPLOAD
// ============================================================

function showToast(message) {
  const toast =
    document.getElementById("appToast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function showUploading(
  visible,
  message = "Uploading..."
) {
  const overlay =
    document.getElementById("uploadOverlay");

  const label =
    document.getElementById("uploadMessage");

  if (!overlay) return;

  if (label) {
    label.textContent = message;
  }

  overlay.classList.toggle(
    "open",
    Boolean(visible)
  );

  overlay.setAttribute(
    "aria-hidden",
    visible ? "false" : "true"
  );
}


// ============================================================
// PAGE NAVIGATION
// ============================================================

const pages =
  document.querySelectorAll(".page");

const navButtons =
  document.querySelectorAll(".nav-button");

function openPage(pageId) {
  pages.forEach(page => {
    page.classList.toggle(
      "active",
      page.id === pageId
    );
  });

  navButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  renderAll();

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});


// ============================================================
// MODAL
// ============================================================

const modalOverlay =
  document.getElementById("modalOverlay");

const modalBody =
  document.getElementById("modalBody");

const modalTitle =
  document.getElementById("modalTitle");

const modalEyebrow =
  document.getElementById("modalEyebrow");

const modalBack =
  document.getElementById("modalBack");

function openModal(
  title,
  eyebrow,
  html,
  backAction = null,
  extraClass = ""
) {
  modalTitle.textContent = title;
  modalEyebrow.textContent = eyebrow || "VUK";
  modalBody.innerHTML = html;

  const modal =
    modalOverlay.querySelector(".modal");

  if (modal) {
    modal.className =
      `modal ${extraClass}`.trim();
  }

  if (backAction) {
    modalBack.classList.remove("hidden");
    modalBack.onclick = backAction;
  } else {
    modalBack.classList.add("hidden");
    modalBack.onclick = null;
  }

  modalOverlay.classList.add("open");
}

function closeModal() {
  modalOverlay.classList.remove("open");

  const modal =
    modalOverlay.querySelector(".modal");

  if (modal) {
    modal.className = "modal";
  }

  modalBody.innerHTML = "";
}

document
  .getElementById("closeModal")
  .addEventListener("click", closeModal);

modalOverlay.addEventListener(
  "click",
  event => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  }
);


// ============================================================
// HEADER
// ============================================================

function renderHeader() {
  const current =
    document.getElementById(
      "currentEnsembleName"
    );

  if (current) {
    current.textContent =
      ensemble().shortName;
  }
}


// ============================================================
// ENSEMBLES
// ============================================================

function selectEnsemble(index) {
  selectedEnsembleIndex = index;

  saveSelectedEnsemble();

  selectedCalendarDate = null;

  renderAll();
}

function renderEnsembles() {
  const container =
    document.getElementById("ensembleList");

  if (!container) return;

  container.innerHTML = "";

  data.ensembles.forEach(
    (item, index) => {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "ensemble-card";

      if (
        index === selectedEnsembleIndex
      ) {
        button.classList.add("selected");
      }

      button.innerHTML = `
        <div class="ensemble-number">
          ${String(index + 1).padStart(2, "0")}
        </div>

        <div class="ensemble-card-text">
          <h3>${escapeHTML(item.name)}</h3>
          <p>
            ${item.dancers.length} dancers ·
            ${item.dances.length} dances
          </p>
        </div>

        <div class="radio"></div>
      `;

      button.onclick = () => {
        selectEnsemble(index);
      };

      container.appendChild(button);
    }
  );
}

document
  .getElementById("ensembleButton")
  .addEventListener("click", () => {
    openPage("homePage");
  });


// ============================================================
// TOUCH DRAG SYSTEM
// ============================================================

/*
  This is designed for iPhone/iPad.

  Press and hold briefly, then slide the row.
  Tapping normally still opens the dancer/dance.
*/

function enableTouchReorder({
  container,
  rowSelector,
  getGroup,
  onReorder
}) {
  if (!container) return;

  let activeRow = null;
  let startY = 0;
  let currentY = 0;
  let holdTimer = null;
  let dragging = false;
  let pointerId = null;

  const HOLD_TIME = 180;

  function clearHold() {
    clearTimeout(holdTimer);
    holdTimer = null;
  }

  function finishDrag() {
    clearHold();

    if (!activeRow) return;

    if (dragging) {
      activeRow.classList.remove(
        "dragging"
      );

      document.body.classList.remove(
        "reordering"
      );

      activeRow.style.transform = "";
      activeRow.style.zIndex = "";
      activeRow.style.position = "";

      const rows = [
        ...container.querySelectorAll(
          rowSelector
        )
      ];

      const group =
        getGroup(activeRow);

      const sameGroup = rows.filter(
        row => getGroup(row) === group
      );

      const orderedIds =
        sameGroup.map(
          row => row.dataset.reorderId
        );

      onReorder(group, orderedIds);
    }

    activeRow = null;
    dragging = false;
    pointerId = null;
  }

  container.addEventListener(
    "pointerdown",
    event => {
      const row =
        event.target.closest(rowSelector);

      if (!row) return;

      if (
        event.target.closest(
          "input, textarea, select, audio"
        )
      ) {
        return;
      }

      activeRow = row;
      startY = event.clientY;
      currentY = startY;
      pointerId = event.pointerId;

      holdTimer = setTimeout(() => {
        if (!activeRow) return;

        dragging = true;

        activeRow.classList.add(
          "dragging"
        );

        document.body.classList.add(
          "reordering"
        );

        if (
          activeRow.setPointerCapture &&
          pointerId !== null
        ) {
          try {
            activeRow.setPointerCapture(
              pointerId
            );
          } catch (_) {}
        }

        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      }, HOLD_TIME);
    }
  );

  container.addEventListener(
    "pointermove",
    event => {
      if (!activeRow) return;

      currentY = event.clientY;

      if (!dragging) {
        if (
          Math.abs(currentY - startY) > 8
        ) {
          clearHold();
          activeRow = null;
        }

        return;
      }

      event.preventDefault();

      const group =
        getGroup(activeRow);

      const rows = [
        ...container.querySelectorAll(
          rowSelector
        )
      ].filter(
        row =>
          row !== activeRow &&
          getGroup(row) === group
      );

      let target = null;

      for (const row of rows) {
        const rect =
          row.getBoundingClientRect();

        if (
          currentY <
          rect.top + rect.height / 2
        ) {
          target = row;
          break;
        }
      }

      if (target) {
        container.insertBefore(
          activeRow,
          target
        );
      } else {
        const sameGroupRows = [
          ...container.querySelectorAll(
            rowSelector
          )
        ].filter(
          row =>
            row !== activeRow &&
            getGroup(row) === group
        );

        const last =
          sameGroupRows[
            sameGroupRows.length - 1
          ];

        if (last) {
          last.after(activeRow);
        }
      }
    },
    { passive: false }
  );

  container.addEventListener(
    "pointerup",
    finishDrag
  );

  container.addEventListener(
    "pointercancel",
    finishDrag
  );
}


// ============================================================
// DANCER HELPERS
// ============================================================

function groupDancers(
  gender,
  search = ""
) {
  const query =
    search.trim().toLowerCase();

  return ensemble()
    .dancers
    .filter(
      dancer =>
        normalizeGender(dancer.gender) ===
        gender
    )
    .filter(
      dancer =>
        !query ||
        dancer.name
          .toLowerCase()
          .includes(query)
    )
    .sort(
      (a, b) =>
        Number(a.order) -
        Number(b.order)
    );
}

function saveDancerOrder(
  gender,
  orderedIds
) {
  orderedIds.forEach(
    (id, index) => {
      const dancer =
        ensemble().dancers.find(
          item =>
            String(item.id) === String(id)
        );

      if (
        dancer &&
        dancer.gender === gender
      ) {
        dancer.order = index;
      }
    }
  );

  saveData();
  renderDancers();

  showToast("Dancer order saved.");
}


// ============================================================
// ATTENDANCE CALCULATIONS
// ============================================================

function dancerAttendanceStats(
  dancerId
) {
  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;
  let recorded = 0;

  ensemble().practices.forEach(
    practice => {
      const status =
        practice.attendance?.[dancerId];

      if (!status) return;

      recorded++;

      if (status === "present") {
        present++;
      }

      if (status === "late") {
        late++;
      }

      if (status === "absent") {
        absent++;
      }

      if (status === "excused") {
        excused++;
      }
    }
  );

  /*
    ONLY PRESENT counts as present.

    Present + Present + Present + Late
    = 75% Present
    = 25% Not Present
  */

  const percentage =
    recorded === 0
      ? null
      : Math.round(
          (present / recorded) * 100
        );

  const notPresent =
    recorded - present;

  const notPresentPercentage =
    recorded === 0
      ? null
      : Math.round(
          (notPresent / recorded) * 100
        );

  return {
    present,
    late,
    absent,
    excused,
    recorded,
    percentage,
    notPresent,
    notPresentPercentage
  };
}


// ============================================================
// RENDER DANCERS
// ============================================================

function renderDancers() {
  const label =
    document.getElementById(
      "dancerEnsemble"
    );

  if (label) {
    label.textContent = ensemble().name;
  }

  const container =
    document.getElementById(
      "dancerList"
    );

  if (!container) return;

  const search =
    document.getElementById(
      "dancerSearch"
    )?.value || "";

  container.innerHTML = "";

  const groups = [
    {
      gender: "Male",
      title: "BOYS",
      css: "boys",
      numberCSS: "boy"
    },
    {
      gender: "Female",
      title: "GIRLS",
      css: "girls",
      numberCSS: "girl"
    },
    {
      gender: "Other",
      title: "OTHER",
      css: "other",
      numberCSS: "other"
    }
  ];

  let found = false;

  groups.forEach(group => {
    const dancers =
      groupDancers(
        group.gender,
        search
      );

    if (!dancers.length) return;

    found = true;

    const section =
      document.createElement("section");

    section.className =
      `roster-section ${group.css}`;

    section.dataset.gender =
      group.gender;

    section.innerHTML = `
      <div class="roster-section-heading">
        <span class="roster-title ${group.css}">
          ${group.title}
        </span>

        ${
          !search
            ? `<span class="drag-hint">
                 Hold + drag to reorder
               </span>`
            : ""
        }
      </div>

      <div class="roster-list"></div>
    `;

    const list =
      section.querySelector(
        ".roster-list"
      );

    dancers.forEach(
      (dancer, index) => {
        const row =
          document.createElement("div");

        row.className =
          "dancer-row draggable-row";

        row.dataset.reorderId =
          String(dancer.id);

        row.dataset.group =
          group.gender;

        row.innerHTML = `
          <button
            class="dancer-open"
            type="button"
          >
            <span
              class="dancer-number ${group.numberCSS}"
            >
              ${String(index + 1).padStart(2, "0")}
            </span>

            <span class="dancer-name">
              ${escapeHTML(dancer.name)}
            </span>

            <span class="dancer-height">
              ${
                dancer.height
                  ? `${escapeHTML(dancer.height)} cm`
                  : "—"
              }
            </span>

            <span class="chevron">
              ›
            </span>
          </button>
        `;

        let pressedAt = 0;

        row.addEventListener(
          "pointerdown",
          () => {
            pressedAt = Date.now();
          }
        );

        row
          .querySelector(".dancer-open")
          .addEventListener(
            "click",
            event => {
              /*
                If it was a hold/drag,
                don't open profile.
              */
              if (
                Date.now() - pressedAt >
                170
              ) {
                event.preventDefault();
                return;
              }

              showDancer(dancer.id);
            }
          );

        list.appendChild(row);
      }
    );

    container.appendChild(section);

    if (!search) {
      enableTouchReorder({
        container: list,
        rowSelector: ".dancer-row",
        getGroup: row =>
          row.dataset.group,
        onReorder: (
          gender,
          orderedIds
        ) => {
          saveDancerOrder(
            gender,
            orderedIds
          );
        }
      });
    }
  });

  if (!found) {
    container.innerHTML = `
      <div class="empty">
        ${
          search
            ? "No dancers match your search."
            : "No dancers yet.<br>Tap + to add your first dancer."
        }
      </div>
    `;
  }
}

document
  .getElementById("dancerSearch")
  .addEventListener(
    "input",
    renderDancers
  );


// ============================================================
// DANCER PROFILE
// ============================================================

function showDancer(dancerId) {
  const dancer =
    ensemble().dancers.find(
      item =>
        String(item.id) ===
        String(dancerId)
    );

  if (!dancer) return;

  const stats =
    dancerAttendanceStats(dancer.id);

  const percentText =
    stats.percentage === null
      ? "—"
      : `${stats.percentage}%`;

  const notPresentText =
    stats.notPresentPercentage === null
      ? "—"
      : `${stats.notPresentPercentage}%`;

  openModal(
    dancer.name,
    "DANCER PROFILE",
    `
      <div class="profile-card">
        <div class="profile-name">
          ${escapeHTML(dancer.name)}
        </div>

        <div class="profile-grid">
          <div class="profile-stat">
            <span>Gender</span>
            <strong>
              ${escapeHTML(dancer.gender || "—")}
            </strong>
          </div>

          <div class="profile-stat">
            <span>Height</span>
            <strong>
              ${
                dancer.height
                  ? `${escapeHTML(dancer.height)} cm`
                  : "—"
              }
            </strong>
          </div>

          <div class="profile-stat">
            <span>Shoe Size</span>
            <strong>
              ${escapeHTML(dancer.shoeSize || "—")}
            </strong>
          </div>

          <div class="profile-stat">
            <span>Ensemble</span>
            <strong>
              ${escapeHTML(ensemble().shortName)}
            </strong>
          </div>
        </div>

        <button
          id="attendanceProfile"
          class="attendance-profile-card"
          type="button"
        >
          <div>
            <div class="detail-label">
              Attendance
            </div>

            <div class="attendance-percent">
              <strong>${percentText}</strong>
              <span>Present</span>
            </div>

            <div class="not-present-percent">
              ${notPresentText} Not Present
            </div>
          </div>

          <div class="attendance-mini">
            <span>Present</span>
            <strong class="present">
              ${stats.present}
            </strong>

            <span>Late</span>
            <strong class="late">
              ${stats.late}
            </strong>

            <span>No Show</span>
            <strong class="absent">
              ${stats.absent}
            </strong>

            <span>Excused</span>
            <strong class="excused">
              ${stats.excused}
            </strong>
          </div>
        </button>
      </div>

      <div class="notes-card">
        <h3>Notes</h3>

        <p>
          ${
            dancer.notes
              ? escapeHTML(dancer.notes)
              : "No notes added."
          }
        </p>
      </div>

      <button
        id="editDancer"
        class="primary-button"
        type="button"
      >
        Edit Dancer
      </button>

      <button
        id="deleteDancer"
        class="danger-button"
        type="button"
      >
        Delete Dancer
      </button>
    `
  );

  document
    .getElementById("attendanceProfile")
    .onclick = () => {
      showDancerAttendance(dancer.id);
    };

  document
    .getElementById("editDancer")
    .onclick = () => {
      dancerForm(dancer, true);
    };

  document
    .getElementById("deleteDancer")
    .onclick = () => {
      if (
        !confirm(
          `Delete ${dancer.name}?`
        )
      ) {
        return;
      }

      ensemble().dancers =
        ensemble().dancers.filter(
          item =>
            String(item.id) !==
            String(dancer.id)
        );

      ensemble().dances.forEach(
        dance => {
          dance.dancerIds =
            dance.dancerIds.filter(
              id =>
                String(id) !==
                String(dancer.id)
            );
        }
      );

      ensemble().practices.forEach(
        practice => {
          delete practice.attendance[
            dancer.id
          ];
        }
      );

      saveData();
      closeModal();
      renderAll();
    };
}


// ============================================================
// DANCER ATTENDANCE HISTORY
// ============================================================

function attendanceStatusLabel(status) {
  if (status === "present") {
    return "Present";
  }

  if (status === "late") {
    return "Late";
  }

  if (status === "absent") {
    return "No Show";
  }

  if (status === "excused") {
    return "Excused";
  }

  return status;
}

function showDancerAttendance(dancerId) {
  const dancer =
    ensemble().dancers.find(
      item =>
        String(item.id) ===
        String(dancerId)
    );

  if (!dancer) return;

  const stats =
    dancerAttendanceStats(dancer.id);

  const history =
    [...ensemble().practices]
      .filter(
        practice =>
          practice.attendance?.[
            dancer.id
          ]
      )
      .sort(
        (a, b) =>
          localDate(b.date) -
          localDate(a.date)
      );

  openModal(
    "Attendance",
    "DANCER HISTORY",
    `
      <div class="history-hero">
        <div class="history-percent">
          ${
            stats.percentage === null
              ? "—"
              : `${stats.percentage}%`
          }
        </div>

        <div class="history-caption">
          Present
        </div>

        <div class="history-not-present">
          ${
            stats.notPresentPercentage === null
              ? "—"
              : `${stats.notPresentPercentage}%`
          }
          Not Present
        </div>
      </div>

      <div class="attendance-summary four">
        <div class="summary-box present">
          <strong>${stats.present}</strong>
          <span>PRESENT</span>
        </div>

        <div class="summary-box late">
          <strong>${stats.late}</strong>
          <span>LATE</span>
        </div>

        <div class="summary-box absent">
          <strong>${stats.absent}</strong>
          <span>NO SHOW</span>
        </div>

        <div class="summary-box excused">
          <strong>${stats.excused}</strong>
          <span>EXCUSED</span>
        </div>
      </div>

      <h3 class="detail-heading">
        Individual History
      </h3>

      ${
        history.length
          ? history.map(practice => {
              const status =
                practice.attendance[
                  dancer.id
                ];

              return `
                <div class="history-row">
                  <div>
                    <strong>
                      ${escapeHTML(practice.name)}
                    </strong>

                    <p>
                      ${formatDate(practice.date)}
                    </p>
                  </div>

                  <span
                    class="history-status ${status}"
                  >
                    ${attendanceStatusLabel(status)}
                  </span>
                </div>
              `;
            }).join("")
          : `
              <div class="empty">
                No attendance recorded yet.
              </div>
            `
      }
    `,
    () => showDancer(dancer.id)
  );
}


// ============================================================
// ADD / EDIT DANCER
// ============================================================

function dancerForm(
  dancer = null,
  fromProfile = false
) {
  const editing = Boolean(dancer);

  openModal(
    editing
      ? "Edit Dancer"
      : "Add Dancer",
    "ROSTER",
    `
      <div class="form-group">
        <label>Full Name</label>

        <input
          id="dName"
          value="${
            editing
              ? escapeHTML(dancer.name)
              : ""
          }"
          placeholder="Full name"
        >
      </div>

      <div class="form-group">
        <label>Gender</label>

        <select id="dGender">
          <option value="">
            Select
          </option>

          <option
            value="Male"
            ${
              dancer?.gender === "Male"
                ? "selected"
                : ""
            }
          >
            Male
          </option>

          <option
            value="Female"
            ${
              dancer?.gender === "Female"
                ? "selected"
                : ""
            }
          >
            Female
          </option>

          <option
            value="Other"
            ${
              dancer?.gender === "Other"
                ? "selected"
                : ""
            }
          >
            Other
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Height (cm)</label>

          <input
            id="dHeight"
            type="number"
            inputmode="decimal"
            value="${
              editing
                ? escapeHTML(
                    dancer.height || ""
                  )
                : ""
            }"
          >
        </div>

        <div class="form-group">
          <label>Shoe Size</label>

          <input
            id="dShoe"
            value="${
              editing
                ? escapeHTML(
                    dancer.shoeSize || ""
                  )
                : ""
            }"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Personal Notes</label>

        <textarea
          id="dNotes"
          placeholder="Notes about this dancer..."
        >${
          editing
            ? escapeHTML(
                dancer.notes || ""
              )
            : ""
        }</textarea>
      </div>

      <button
        id="saveDancer"
        class="primary-button"
        type="button"
      >
        ${
          editing
            ? "Save Changes"
            : "Add Dancer"
        }
      </button>
    `,
    fromProfile && dancer
      ? () => showDancer(dancer.id)
      : null
  );

  document
    .getElementById("saveDancer")
    .onclick = () => {
      const name =
        document
          .getElementById("dName")
          .value
          .trim();

      const gender =
        document
          .getElementById("dGender")
          .value;

      if (!name || !gender) {
        alert(
          "Please enter the dancer's name and gender."
        );
        return;
      }

      const height =
        document
          .getElementById("dHeight")
          .value;

      const shoeSize =
        document
          .getElementById("dShoe")
          .value
          .trim();

      const notes =
        document
          .getElementById("dNotes")
          .value
          .trim();

      if (editing) {
        const oldGender =
          dancer.gender;

        dancer.name = name;
        dancer.gender = gender;
        dancer.height = height;
        dancer.shoeSize = shoeSize;
        dancer.notes = notes;

        if (oldGender !== gender) {
          const group =
            ensemble().dancers.filter(
              item =>
                item.gender === gender &&
                item !== dancer
            );

          dancer.order =
            group.length;
        }
      } else {
        const group =
          ensemble().dancers.filter(
            item =>
              item.gender === gender
          );

        ensemble().dancers.push({
          id: uid(),
          name,
          gender,
          height,
          shoeSize,
          notes,
          order: group.length
        });
      }

      saveData();
      renderAll();

      if (editing) {
        showDancer(dancer.id);
      } else {
        closeModal();
      }
    };
}

document
  .getElementById("addDancerButton")
  .onclick = () => dancerForm();


// ============================================================
// DANCE HELPERS
// ============================================================

function orderedDances(inUse) {
  return ensemble()
    .dances
    .filter(
      dance =>
        dance.inUse === inUse
    )
    .sort(
      (a, b) =>
        Number(a.order) -
        Number(b.order)
    );
}

function saveDanceOrder(
  inUse,
  orderedIds
) {
  orderedIds.forEach(
    (id, index) => {
      const dance =
        ensemble().dances.find(
          item =>
            String(item.id) === String(id)
        );

      if (
        dance &&
        dance.inUse === inUse
      ) {
        dance.order = index;
      }
    }
  );

  saveData();
  renderDances();

  showToast("Dance order saved.");
}


// ============================================================
// RENDER DANCES
// ============================================================

function renderDances() {
  const label =
    document.getElementById(
      "danceEnsemble"
    );

  if (label) {
    label.textContent = ensemble().name;
  }

  const container =
    document.getElementById(
      "danceList"
    );

  if (!container) return;

  container.innerHTML = "";

  if (!ensemble().dances.length) {
    container.innerHTML = `
      <div class="empty">
        No dances yet.
        <br>
        Tap + to add your first dance.
      </div>
    `;

    return;
  }

  const groups = [
    {
      inUse: true,
      title: "IN USE",
      css: "in-use",
      description:
        "Dances currently being used"
    },
    {
      inUse: false,
      title: "NOT IN USE",
      css: "not-in-use",
      description:
        "Stored dances not currently being used"
    }
  ];

  groups.forEach(group => {
    const dances =
      orderedDances(group.inUse);

    const section =
      document.createElement("section");

    section.className =
      `dance-section ${group.css}`;

    section.innerHTML = `
      <div class="dance-section-heading">
        <div>
          <div
            class="dance-status-title ${group.css}"
          >
            <span class="status-dot"></span>
            ${group.title}
          </div>

          <p>
            ${group.description}
          </p>
        </div>

        ${
          dances.length > 1
            ? `<span class="drag-hint">
                 Hold + drag
               </span>`
            : ""
        }
      </div>

      <div class="dance-group-list"></div>
    `;

    const list =
      section.querySelector(
        ".dance-group-list"
      );

    if (!dances.length) {
      list.innerHTML = `
        <div class="dance-group-empty">
          ${
            group.inUse
              ? "No dances currently in use."
              : "No unused dances."
          }
        </div>
      `;
    }

    dances.forEach(dance => {
      const row =
        document.createElement("div");

      row.className =
        `dance-row draggable-row ${group.css}`;

      row.dataset.reorderId =
        String(dance.id);

      row.dataset.group =
        String(group.inUse);

      row.innerHTML = `
        <button
          class="dance-open"
          type="button"
        >
          <span class="dance-status-bar"></span>

          <span class="dance-card-content">
            <strong>
              ${escapeHTML(dance.name)}
            </strong>

            <small>
              ${
                escapeHTML(
                  dance.choreographer ||
                  "No choreographer"
                )
              }
              ·
              ${dance.dancerIds.length}
              dancers
            </small>
          </span>

          <span class="chevron">
            ›
          </span>
        </button>
      `;

      let pressedAt = 0;

      row.addEventListener(
        "pointerdown",
        () => {
          pressedAt = Date.now();
        }
      );

      row
        .querySelector(".dance-open")
        .addEventListener(
          "click",
          event => {
            if (
              Date.now() - pressedAt >
              170
            ) {
              event.preventDefault();
              return;
            }

            showDance(dance.id);
          }
        );

      list.appendChild(row);
    });

    if (dances.length) {
      enableTouchReorder({
        container: list,
        rowSelector: ".dance-row",
        getGroup: row =>
          row.dataset.group,
        onReorder: (
          groupValue,
          orderedIds
        ) => {
          saveDanceOrder(
            groupValue === "true",
            orderedIds
          );
        }
      });
    }

    container.appendChild(section);
  });
}


// ============================================================
// ADD / EDIT DANCE
// ============================================================

function danceForm(dance = null) {
  const editing = Boolean(dance);

  const currentInUse =
    editing
      ? dance.inUse !== false
      : true;

  openModal(
    editing
      ? "Edit Dance"
      : "Add Dance",
    "REPERTOIRE",
    `
      <div class="form-group">
        <label>Dance Name</label>

        <input
          id="danceName"
          value="${
            editing
              ? escapeHTML(dance.name)
              : ""
          }"
          placeholder="Dance name"
        >
      </div>

      <div class="form-group">
        <label>Choreographer</label>

        <input
          id="danceChoreographer"
          value="${
            editing
              ? escapeHTML(
                  dance.choreographer || ""
                )
              : ""
          }"
          placeholder="Choreographer"
        >
      </div>

      <div class="form-group">
        <label>Dance Status</label>

        <div class="dance-status-selector">
          <button
            id="statusInUse"
            class="dance-status-option in-use ${
              currentInUse
                ? "selected"
                : ""
            }"
            type="button"
          >
            <span class="status-dot"></span>

            <span>
              <strong>In Use</strong>
              <small>
                Currently in the repertoire
              </small>
            </span>
          </button>

          <button
            id="statusNotInUse"
            class="dance-status-option not-in-use ${
              !currentInUse
                ? "selected"
                : ""
            }"
            type="button"
          >
            <span class="status-dot"></span>

            <span>
              <strong>Not In Use</strong>
              <small>
                Keep it stored for later
              </small>
            </span>
          </button>
        </div>
      </div>

      <button
        id="saveDance"
        class="primary-button"
        type="button"
      >
        ${
          editing
            ? "Save Changes"
            : "Add Dance"
        }
      </button>
    `,
    editing
      ? () => showDance(dance.id)
      : null
  );

  let draftInUse =
    currentInUse;

  const inUseButton =
    document.getElementById(
      "statusInUse"
    );

  const notInUseButton =
    document.getElementById(
      "statusNotInUse"
    );

  function updateStatusUI() {
    inUseButton.classList.toggle(
      "selected",
      draftInUse
    );

    notInUseButton.classList.toggle(
      "selected",
      !draftInUse
    );
  }

  inUseButton.onclick = () => {
    draftInUse = true;
    updateStatusUI();
  };

  notInUseButton.onclick = () => {
    draftInUse = false;
    updateStatusUI();
  };

  document
    .getElementById("saveDance")
    .onclick = () => {
      const name =
        document
          .getElementById("danceName")
          .value
          .trim();

      const choreographer =
        document
          .getElementById(
            "danceChoreographer"
          )
          .value
          .trim();

      if (!name) {
        alert(
          "Please enter a dance name."
        );
        return;
      }

      if (editing) {
        const statusChanged =
          dance.inUse !== draftInUse;

        dance.name = name;
        dance.choreographer =
          choreographer;
        dance.inUse = draftInUse;

        if (statusChanged) {
          dance.order =
            orderedDances(
              draftInUse
            ).filter(
              item =>
                item.id !== dance.id
            ).length;
        }
      } else {
        ensemble().dances.push({
          id: uid(),
          name,
          choreographer,
          inUse: draftInUse,
          order:
            orderedDances(
              draftInUse
            ).length,
          dancerIds: [],
          images: [],
          music: null,
          imageNames: [],
          musicName: ""
        });
      }

      saveData();
      renderAll();

      if (editing) {
        showDance(dance.id);
      } else {
        closeModal();
      }
    };
}

document
  .getElementById("addDanceButton")
  .onclick = () => danceForm();


// ============================================================
// DANCE DANCERS
// ============================================================

function danceDancers(dance) {
  return dance.dancerIds
    .map(id =>
      ensemble().dancers.find(
        dancer =>
          String(dancer.id) ===
          String(id)
      )
    )
    .filter(Boolean);
}


// ============================================================
// SHOW DANCE
// ============================================================

function showDance(danceId) {
  const dance =
    ensemble().dances.find(
      item =>
        String(item.id) ===
        String(danceId)
    );

  if (!dance) return;

  const selectedDancers =
    danceDancers(dance);

  function dancerGroupHTML(
    gender,
    title
  ) {
    const group =
      selectedDancers.filter(
        dancer =>
          dancer.gender === gender
      );

    if (!group.length) return "";

    return `
      <div class="mini-group-title">
        ${title}
      </div>

      <div class="selected-dancer-list">
        ${group.map(
          (dancer, index) => `
            <div class="selected-dancer">
              <span>
                ${index + 1}.
              </span>

              <strong>
                ${escapeHTML(dancer.name)}
              </strong>
            </div>
          `
        ).join("")}
      </div>
    `;
  }

  const dancersHTML =
    dancerGroupHTML("Male", "BOYS") +
    dancerGroupHTML("Female", "GIRLS") +
    dancerGroupHTML("Other", "OTHER");

  const photoHTML =
    dance.images.length
      ? `
          <div class="media-grid">
            ${dance.images.map(
              (image, index) => `
                <div class="media-tile">
                  <img
                    src="${escapeHTML(image.url)}"
                    alt="Dance photo"
                  >

                  <button
                    class="media-delete"
                    type="button"
                    data-image-index="${index}"
                    aria-label="Delete photo"
                  >
                    ×
                  </button>
                </div>
              `
            ).join("")}
          </div>
        `
      : `
          <div class="file-box">
            No photos uploaded yet.
          </div>
        `;

  const musicHTML =
    dance.music?.url
      ? `
          <div class="audio-card">
            <strong>
              ${escapeHTML(
                dance.music.name ||
                "Dance music"
              )}
            </strong>

            <audio
              controls
              preload="metadata"
              src="${escapeHTML(
                dance.music.url
              )}"
            ></audio>

            <button
              id="deleteMusic"
              class="danger-button compact"
              type="button"
            >
              Delete Music
            </button>
          </div>
        `
      : `
          <div class="file-box">
            No music uploaded yet.
          </div>
        `;

  openModal(
    dance.name,
    dance.inUse
      ? "IN USE"
      : "NOT IN USE",
    `
      <div
        class="dance-detail-status ${
          dance.inUse
            ? "in-use"
            : "not-in-use"
        }"
      >
        <span class="status-dot"></span>

        ${
          dance.inUse
            ? "Currently In Use"
            : "Not Currently In Use"
        }
      </div>

      <div class="detail-card">
        <div class="detail-label">
          Choreographer
        </div>

        <div class="detail-value">
          ${escapeHTML(
            dance.choreographer || "—"
          )}
        </div>
      </div>

      <h3 class="detail-heading">
        Dancers
      </h3>

      ${
        dancersHTML ||
        `
          <div class="empty compact-empty">
            No dancers selected.
          </div>
        `
      }

      <button
        id="editDanceDancers"
        class="secondary-button"
        type="button"
      >
        Select / Order Dancers
      </button>

      <h3 class="detail-heading">
        Photos
      </h3>

      ${photoHTML}

      <label class="upload-button">
        + Upload Photo

        <input
          id="photoUpload"
          type="file"
          accept="image/*"
          multiple
          hidden
        >
      </label>

      <h3 class="detail-heading">
        Music
      </h3>

      ${musicHTML}

      <label class="upload-button">
        ${
          dance.music?.url
            ? "Replace Music"
            : "+ Upload Music"
        }

        <input
          id="musicUpload"
          type="file"
          accept="audio/*"
          hidden
        >
      </label>

      <button
        id="editDance"
        class="primary-button"
        type="button"
      >
        Edit Dance Details
      </button>

      <button
        id="deleteDance"
        class="danger-button"
        type="button"
      >
        Delete Dance
      </button>
    `
  );

  document
    .getElementById(
      "editDanceDancers"
    )
    .onclick = () => {
      editDanceDancers(dance.id);
    };

  document
    .getElementById("editDance")
    .onclick = () => {
      danceForm(dance);
    };

  document
    .querySelectorAll(
      "[data-image-index]"
    )
    .forEach(button => {
      button.onclick = () => {
        deleteDanceImage(
          dance,
          Number(
            button.dataset.imageIndex
          )
        );
      };
    });

  document
    .getElementById("photoUpload")
    .onchange = event => {
      uploadDancePhotos(
        dance,
        [...event.target.files]
      );
    };

  document
    .getElementById("musicUpload")
    .onchange = event => {
      const file =
        event.target.files[0];

      if (file) {
        uploadDanceMusic(
          dance,
          file
        );
      }
    };

  const deleteMusic =
    document.getElementById(
      "deleteMusic"
    );

  if (deleteMusic) {
    deleteMusic.onclick = () => {
      deleteDanceMusic(dance);
    };
  }

  document
    .getElementById("deleteDance")
    .onclick = async () => {
      if (
        !confirm(
          `Delete ${dance.name}?`
        )
      ) {
        return;
      }

      showUploading(
        true,
        "Deleting dance..."
      );

      try {
        for (
          const image of dance.images
        ) {
          if (image.path) {
            await deleteStoragePath(
              image.path
            );
          }
        }

        if (dance.music?.path) {
          await deleteStoragePath(
            dance.music.path
          );
        }
      } catch (error) {
        console.error(error);
      }

      ensemble().dances =
        ensemble().dances.filter(
          item =>
            String(item.id) !==
            String(dance.id)
        );

      saveData();

      showUploading(false);
      closeModal();
      renderAll();
    };
}


// ============================================================
// SELECT / ORDER DANCE DANCERS
// ============================================================

function editDanceDancers(danceId) {
  const dance =
    ensemble().dances.find(
      item =>
        String(item.id) ===
        String(danceId)
    );

  if (!dance) return;

  function pickerGroup(
    gender,
    title
  ) {
    const dancers =
      groupDancers(gender);

    if (!dancers.length) {
      return "";
    }

    return `
      <h3 class="detail-heading">
        ${title}
      </h3>

      <div class="dance-picker">
        ${dancers.map(dancer => `
          <button
            type="button"
            class="edit-dancer-row ${
              dance.dancerIds.some(
                id =>
                  String(id) ===
                  String(dancer.id)
              )
                ? "selected"
                : ""
            }"
            data-pick-dancer="${dancer.id}"
          >
            <span>
              ${escapeHTML(dancer.name)}
            </span>

            <span class="checkmark">
              ✓
            </span>
          </button>
        `).join("")}
      </div>
    `;
  }

  const selected =
    danceDancers(dance);

  openModal(
    "Select Dancers",
    "DANCE ROSTER",
    `
      <div class="file-box">
        Select the dancers for this dance.
        Their order follows the order shown
        in the main Boys/Girls roster.
      </div>

      ${pickerGroup("Male", "BOYS")}
      ${pickerGroup("Female", "GIRLS")}
      ${pickerGroup("Other", "OTHER")}

      <h3 class="detail-heading">
        Selected Dancers
      </h3>

      ${
        selected.length
          ? selected.map(
              dancer => `
                <div class="selected-dancer">
                  <strong>
                    ${escapeHTML(dancer.name)}
                  </strong>
                </div>
              `
            ).join("")
          : `
              <div class="empty compact-empty">
                No dancers selected.
              </div>
            `
      }

      <button
        id="doneDanceDancers"
        class="primary-button"
        type="button"
      >
        Done
      </button>
    `,
    () => showDance(dance.id)
  );

  document
    .querySelectorAll(
      "[data-pick-dancer]"
    )
    .forEach(button => {
      button.onclick = () => {
        const dancerId =
          button.dataset.pickDancer;

        const existingIndex =
          dance.dancerIds.findIndex(
            id =>
              String(id) ===
              String(dancerId)
          );

        if (existingIndex >= 0) {
          dance.dancerIds.splice(
            existingIndex,
            1
          );
        } else {
          const dancer =
            ensemble().dancers.find(
              item =>
                String(item.id) ===
                String(dancerId)
            );

          if (dancer) {
            dance.dancerIds.push(
              dancer.id
            );
          }
        }

        /*
          Sort selected dancers according
          to main roster order, boys then girls.
        */

        const genderRank = {
          Male: 0,
          Female: 1,
          Other: 2
        };

        dance.dancerIds.sort(
          (a, b) => {
            const dancerA =
              ensemble().dancers.find(
                d =>
                  String(d.id) ===
                  String(a)
              );

            const dancerB =
              ensemble().dancers.find(
                d =>
                  String(d.id) ===
                  String(b)
              );

            if (!dancerA || !dancerB) {
              return 0;
            }

            const genderDifference =
              genderRank[dancerA.gender] -
              genderRank[dancerB.gender];

            if (genderDifference !== 0) {
              return genderDifference;
            }

            return (
              dancerA.order -
              dancerB.order
            );
          }
        );

        saveData();
        editDanceDancers(dance.id);
      };
    });

  document
    .getElementById(
      "doneDanceDancers"
    )
    .onclick = () => {
      showDance(dance.id);
    };
}


// ============================================================
// FIREBASE STORAGE
// ============================================================

function safeFileName(name) {
  return name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );
}

async function uploadFile(
  file,
  path
) {
  if (
    !window.vukFirebase?.storage
  ) {
    throw new Error(
      "Firebase Storage is unavailable."
    );
  }

  const {
    storage,
    storageRef,
    uploadBytes,
    getDownloadURL
  } = window.vukFirebase;

  const reference =
    storageRef(storage, path);

  await uploadBytes(
    reference,
    file,
    {
      contentType:
        file.type || undefined
    }
  );

  return getDownloadURL(reference);
}

async function deleteStoragePath(
  path
) {
  if (
    !path ||
    !window.vukFirebase?.storage
  ) {
    return;
  }

  const {
    storage,
    storageRef,
    deleteObject
  } = window.vukFirebase;

  try {
    await deleteObject(
      storageRef(storage, path)
    );
  } catch (error) {
    console.warn(
      "Storage delete failed:",
      error
    );
  }
}

async function uploadDancePhotos(
  dance,
  files
) {
  if (!files.length) return;

  showUploading(
    true,
    files.length > 1
      ? "Uploading photos..."
      : "Uploading photo..."
  );

  try {
    for (const file of files) {
      const path =
        `dance-media/ensemble-${selectedEnsembleIndex}` +
        `/dance-${dance.id}` +
        `/photos/${uid()}-${safeFileName(file.name)}`;

      const url =
        await uploadFile(
          file,
          path
        );

      dance.images.push({
        url,
        path,
        name: file.name,
        type:
          file.type || "image"
      });
    }

    saveData();

    showToast(
      files.length > 1
        ? "Photos uploaded."
        : "Photo uploaded."
    );

    showDance(dance.id);
  } catch (error) {
    console.error(
      "Photo upload failed:",
      error
    );

    alert(
      "The photo could not be uploaded. Firebase Storage may need to be enabled."
    );
  } finally {
    showUploading(false);
  }
}

async function deleteDanceImage(
  dance,
  imageIndex
) {
  const image =
    dance.images[imageIndex];

  if (!image) return;

  if (
    !confirm(
      "Delete this photo?"
    )
  ) {
    return;
  }

  showUploading(
    true,
    "Deleting photo..."
  );

  try {
    if (image.path) {
      await deleteStoragePath(
        image.path
      );
    }

    dance.images.splice(
      imageIndex,
      1
    );

    saveData();
    showDance(dance.id);
  } finally {
    showUploading(false);
  }
}

async function uploadDanceMusic(
  dance,
  file
) {
  showUploading(
    true,
    "Uploading music..."
  );

  try {
    /*
      Upload replacement FIRST.
      Only remove old file after
      new upload succeeds.
    */

    const path =
      `dance-media/ensemble-${selectedEnsembleIndex}` +
      `/dance-${dance.id}` +
      `/music/${uid()}-${safeFileName(file.name)}`;

    const url =
      await uploadFile(
        file,
        path
      );

    const oldMusic =
      dance.music;

    dance.music = {
      url,
      path,
      name: file.name,
      type:
        file.type || "audio"
    };

    saveData();

    if (oldMusic?.path) {
      await deleteStoragePath(
        oldMusic.path
      );
    }

    showToast("Music uploaded.");

    showDance(dance.id);
  } catch (error) {
    console.error(
      "Music upload failed:",
      error
    );

    alert(
      "The music could not be uploaded. Firebase Storage may need to be enabled."
    );
  } finally {
    showUploading(false);
  }
}

async function deleteDanceMusic(
  dance
) {
  if (
    !confirm(
      "Delete this music file?"
    )
  ) {
    return;
  }

  showUploading(
    true,
    "Deleting music..."
  );

  try {
    if (dance.music?.path) {
      await deleteStoragePath(
        dance.music.path
      );
    }

    dance.music = null;

    saveData();
    showDance(dance.id);
  } finally {
    showUploading(false);
  }
}


// ============================================================
// PRACTICES
// ============================================================

function createWeeklyPractices(
  name,
  startDate,
  endDate,
  startTime,
  endTime
) {
  let current =
    localDate(startDate);

  const finalDate =
    localDate(endDate);

  const seriesId = uid();

  while (current <= finalDate) {
    ensemble().practices.push({
      id: uid(),
      seriesId,
      name,
      date: dateKey(current),
      startTime,
      endTime,
      attendance: {}
    });

    current.setDate(
      current.getDate() + 7
    );
  }
}

function practiceForm() {
  openModal(
    "Add Practice",
    "SCHEDULE",
    `
      <div class="form-group">
        <label>Practice Name</label>

        <input
          id="practiceName"
          placeholder="Monday Rehearsal"
        >
      </div>

      <div class="form-group">
        <label>Start Date</label>

        <input
          id="practiceStart"
          type="date"
        >
      </div>

      <div class="form-group">
        <label>End Date</label>

        <input
          id="practiceEnd"
          type="date"
        >
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Start Time</label>

          <input
            id="practiceStartTime"
            type="time"
          >
        </div>

        <div class="form-group">
          <label>End Time</label>

          <input
            id="practiceEndTime"
            type="time"
          >
        </div>
      </div>

      <div class="file-box">
        The practice repeats every week
        through the end date.
      </div>

      <button
        id="savePractice"
        class="primary-button"
        type="button"
      >
        Create Practices
      </button>
    `
  );

  document
    .getElementById("savePractice")
    .onclick = () => {
      const name =
        document
          .getElementById(
            "practiceName"
          )
          .value
          .trim();

      const start =
        document
          .getElementById(
            "practiceStart"
          )
          .value;

      const end =
        document
          .getElementById(
            "practiceEnd"
          )
          .value;

      const startTime =
        document
          .getElementById(
            "practiceStartTime"
          )
          .value;

      const endTime =
        document
          .getElementById(
            "practiceEndTime"
          )
          .value;

      if (!name || !start || !end) {
        alert(
          "Please enter a name, start date and end date."
        );
        return;
      }

      if (
        localDate(end) <
        localDate(start)
      ) {
        alert(
          "The end date must be after the start date."
        );
        return;
      }

      createWeeklyPractices(
        name,
        start,
        end,
        startTime,
        endTime
      );

      saveData();
      closeModal();
      renderAll();
    };
}

document
  .getElementById("addPracticeButton")
  .onclick = practiceForm;


// ============================================================
// CALENDAR
// ============================================================

function renderCalendar() {
  const ensembleLabel =
    document.getElementById(
      "calendarEnsemble"
    );

  if (ensembleLabel) {
    ensembleLabel.textContent =
      ensemble().name;
  }

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  const monthLabel =
    document.getElementById(
      "calendarMonth"
    );

  if (monthLabel) {
    monthLabel.textContent =
      calendarDate.toLocaleDateString(
        [],
        {
          month: "long",
          year: "numeric"
        }
      );
  }

  const grid =
    document.getElementById(
      "calendarGrid"
    );

  if (!grid) return;

  grid.innerHTML = "";

  const firstDay =
    new Date(year, month, 1);

  const start =
    new Date(firstDay);

  start.setDate(
    start.getDate() -
    firstDay.getDay()
  );

  const today =
    dateKey(new Date());

  for (
    let index = 0;
    index < 42;
    index++
  ) {
    const date =
      new Date(start);

    date.setDate(
      start.getDate() + index
    );

    const key =
      dateKey(date);

    const practices =
      ensemble().practices.filter(
        practice =>
          practice.date === key
      );

    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "calendar-day";

    if (
      date.getMonth() !== month
    ) {
      button.classList.add(
        "other-month"
      );
    }

    if (
      key === selectedCalendarDate
    ) {
      button.classList.add(
        "selected"
      );
    }

    if (key === today) {
      button.classList.add("today");
    }

    button.innerHTML = `
      <div class="day-number">
        ${date.getDate()}
      </div>

      <div class="event-dots">
        ${practices
          .slice(0, 3)
          .map(
            () =>
              `<span class="event-dot"></span>`
          )
          .join("")}
      </div>
    `;

    button.onclick = () => {
      selectedCalendarDate = key;
      calendarDate = new Date(date);

      renderCalendar();
      renderPractices();
    };

    grid.appendChild(button);
  }
}

document
  .getElementById("previousMonth")
  .onclick = () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() - 1,
      1
    );

    selectedCalendarDate = null;

    renderCalendar();
    renderPractices();
  };

document
  .getElementById("nextMonth")
  .onclick = () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() + 1,
      1
    );

    selectedCalendarDate = null;

    renderCalendar();
    renderPractices();
  };

document
  .getElementById("todayButton")
  .onclick = () => {
    calendarDate = new Date();

    selectedCalendarDate =
      dateKey(new Date());

    renderCalendar();
    renderPractices();
  };


// ============================================================
// PRACTICE LIST
// ============================================================

function renderPractices() {
  const container =
    document.getElementById(
      "practiceList"
    );

  if (!container) return;

  let practices =
    [...ensemble().practices]
      .sort(
        (a, b) =>
          localDate(a.date) -
          localDate(b.date)
      );

  if (selectedCalendarDate) {
    practices =
      practices.filter(
        practice =>
          practice.date ===
          selectedCalendarDate
      );
  }

  container.innerHTML = "";

  if (!practices.length) {
    container.innerHTML = `
      <div class="empty">
        ${
          selectedCalendarDate
            ? "No practices on this date."
            : "No practices scheduled yet."
        }
      </div>
    `;

    return;
  }

  practices.forEach(practice => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "item-card practice-card";

    button.innerHTML = `
      <div class="practice-date">
        ${shortDate(practice.date)}
      </div>

      <div class="item-main">
        <h3>
          ${escapeHTML(practice.name)}
        </h3>

        <p>
          ${formatTime(practice.startTime)}
          –
          ${formatTime(practice.endTime)}
        </p>
      </div>

      <span class="item-arrow">
        ›
      </span>
    `;

    button.onclick = () => {
      showPractice(practice.id);
    };

    container.appendChild(button);
  });
}


// ============================================================
// PRACTICE ATTENDANCE
// ============================================================

function showPractice(
  practiceId,
  search = ""
) {
  const practice =
    ensemble().practices.find(
      item =>
        String(item.id) ===
        String(practiceId)
    );

  if (!practice) return;

  const query =
    search.trim().toLowerCase();

  const genderRank = {
    Male: 0,
    Female: 1,
    Other: 2
  };

  const allDancers =
    [...ensemble().dancers]
      .sort((a, b) => {
        const genderDifference =
          genderRank[a.gender] -
          genderRank[b.gender];

        if (genderDifference !== 0) {
          return genderDifference;
        }

        return a.order - b.order;
      });

  const dancers =
    allDancers.filter(
      dancer =>
        !query ||
        dancer.name
          .toLowerCase()
          .includes(query)
    );

  const counts = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0
  };

  Object.values(
    practice.attendance
  ).forEach(status => {
    if (
      counts[status] !== undefined
    ) {
      counts[status]++;
    }
  });

  const rows =
    dancers.length
      ? dancers.map(dancer => {
          const status =
            practice.attendance[
              dancer.id
            ] || "";

          return `
            <div class="attendance-row">
              <h4>
                ${escapeHTML(dancer.name)}
              </h4>

              <div
                class="attendance-buttons four"
                data-dancer="${dancer.id}"
              >
                <button
                  type="button"
                  class="present ${
                    status === "present"
                      ? "selected"
                      : ""
                  }"
                  data-status="present"
                >
                  Present
                </button>

                <button
                  type="button"
                  class="late ${
                    status === "late"
                      ? "selected"
                      : ""
                  }"
                  data-status="late"
                >
                  Late
                </button>

                <button
                  type="button"
                  class="absent ${
                    status === "absent"
                      ? "selected"
                      : ""
                  }"
                  data-status="absent"
                >
                  No Show
                </button>

                <button
                  type="button"
                  class="excused ${
                    status === "excused"
                      ? "selected"
                      : ""
                  }"
                  data-status="excused"
                >
                  Excused
                </button>
              </div>
            </div>
          `;
        }).join("")
      : `
          <div class="empty">
            ${
              query
                ? "No dancers match your search."
                : "Add dancers before taking attendance."
            }
          </div>
        `;

  openModal(
    practice.name,
    "PRACTICE",
    `
      <div class="detail-card">
        <div class="detail-value">
          ${formatDate(practice.date)}
        </div>

        <div class="practice-time">
          ${formatTime(practice.startTime)}
          –
          ${formatTime(practice.endTime)}
        </div>
      </div>

      <button
        id="markAllPresent"
        class="mark-all-button"
        type="button"
      >
        ✓ Mark All Present
      </button>

      <div class="attendance-summary four">
        <div class="summary-box present">
          <strong id="countPresent">
            ${counts.present}
          </strong>
          <span>PRESENT</span>
        </div>

        <div class="summary-box late">
          <strong id="countLate">
            ${counts.late}
          </strong>
          <span>LATE</span>
        </div>

        <div class="summary-box absent">
          <strong id="countAbsent">
            ${counts.absent}
          </strong>
          <span>NO SHOW</span>
        </div>

        <div class="summary-box excused">
          <strong id="countExcused">
            ${counts.excused}
          </strong>
          <span>EXCUSED</span>
        </div>
      </div>

      <div class="search-box">
        <span>⌕</span>

        <input
          id="attendanceSearch"
          type="search"
          placeholder="Search dancers..."
          value="${escapeHTML(search)}"
        >
      </div>

      <h3 class="detail-heading">
        Attendance
      </h3>

      <div id="attendanceRows">
        ${rows}
      </div>

      <button
        id="deletePractice"
        class="danger-button"
        type="button"
      >
        Delete This Practice
      </button>
    `
  );

  function refreshCounts() {
    const newCounts = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0
    };

    Object.values(
      practice.attendance
    ).forEach(status => {
      if (
        newCounts[status] !==
        undefined
      ) {
        newCounts[status]++;
      }
    });

    document.getElementById(
      "countPresent"
    ).textContent =
      newCounts.present;

    document.getElementById(
      "countLate"
    ).textContent =
      newCounts.late;

    document.getElementById(
      "countAbsent"
    ).textContent =
      newCounts.absent;

    document.getElementById(
      "countExcused"
    ).textContent =
      newCounts.excused;
  }

  document
    .querySelectorAll(
      ".attendance-buttons button"
    )
    .forEach(button => {
      button.onclick = () => {
        const group =
          button.closest(
            ".attendance-buttons"
          );

        const dancerId =
          group.dataset.dancer;

        const dancer =
          ensemble().dancers.find(
            item =>
              String(item.id) ===
              String(dancerId)
          );

        if (!dancer) return;

        const status =
          button.dataset.status;

        practice.attendance[
          dancer.id
        ] = status;

        group
          .querySelectorAll("button")
          .forEach(statusButton => {
            statusButton.classList.toggle(
              "selected",
              statusButton === button
            );
          });

        refreshCounts();

        /*
          UI changes FIRST.
          Firebase save happens after.
        */
        saveData();
      };
    });

  document
    .getElementById(
      "markAllPresent"
    )
    .onclick = () => {
      if (!allDancers.length) {
        alert(
          "There are no dancers in this ensemble yet."
        );
        return;
      }

      allDancers.forEach(dancer => {
        practice.attendance[
          dancer.id
        ] = "present";
      });

      document
        .querySelectorAll(
          ".attendance-buttons"
        )
        .forEach(group => {
          group
            .querySelectorAll("button")
            .forEach(button => {
              button.classList.toggle(
                "selected",
                button.dataset.status ===
                  "present"
              );
            });
        });

      refreshCounts();
      saveData();

      showToast(
        "Everyone marked Present."
      );
    };

  const searchInput =
    document.getElementById(
      "attendanceSearch"
    );

  searchInput.addEventListener(
    "input",
    event => {
      const value =
        event.target.value;

      showPractice(
        practice.id,
        value
      );

      requestAnimationFrame(() => {
        const input =
          document.getElementById(
            "attendanceSearch"
          );

        if (input) {
          input.focus();

          input.setSelectionRange(
            value.length,
            value.length
          );
        }
      });
    }
  );

  document
    .getElementById(
      "deletePractice"
    )
    .onclick = () => {
      if (
        !confirm(
          "Delete this practice?"
        )
      ) {
        return;
      }

      ensemble().practices =
        ensemble().practices.filter(
          item =>
            String(item.id) !==
            String(practice.id)
        );

      saveData();
      closeModal();
      renderAll();
    };
}


// ============================================================
// SETTINGS
// ============================================================

function renderSettings() {
  const label =
    document.getElementById(
      "settingsEnsemble"
    );

  if (label) {
    label.textContent =
      ensemble().name;
  }

  /*
    Convert the existing Instructor Notes
    block in index.html into a clean settings
    row without needing another HTML replacement.
  */

  const notesSection =
    document
      .getElementById(
        "instructorNotes"
      )
      ?.closest(
        ".settings-section"
      );

  if (notesSection) {
    notesSection.innerHTML = `
      <div class="settings-section-heading">
        <div class="eyebrow">
          SHARED
        </div>
      </div>

      <div class="settings-card">
        <button
          id="openInstructorNotes"
          class="settings-row-button"
          type="button"
        >
          <span class="settings-row-copy">
            <strong>
              Instructor Notes
            </strong>

            <small>
              ${escapeHTML(
                ensemble().shortName
              )} Ensemble
            </small>
          </span>

          <span class="settings-chevron">
            ›
          </span>
        </button>
      </div>
    `;

    document
      .getElementById(
        "openInstructorNotes"
      )
      .onclick =
        openInstructorNotes;
  }
}


// ============================================================
// INSTRUCTOR NOTES FULL WRITING SCREEN
// ============================================================

function openInstructorNotes() {
  openModal(
    "Instructor Notes",
    ensemble().name.toUpperCase(),
    `
      <div class="notes-editor-shell">
        <div class="notes-editor-top">
          <span class="notes-live-dot"></span>

          <span id="notesEditorStatus">
            Saved
          </span>
        </div>

        <textarea
          id="instructorNotesEditor"
          class="instructor-notes-editor"
          placeholder="Start typing..."
          spellcheck="true"
          autocomplete="off"
        >${escapeHTML(
          ensemble().instructorNotes || ""
        )}</textarea>
      </div>
    `,
    null,
    "notes-modal"
  );

  const editor =
    document.getElementById(
      "instructorNotesEditor"
    );

  const status =
    document.getElementById(
      "notesEditorStatus"
    );

  editor.addEventListener(
    "input",
    () => {
      ensemble().instructorNotes =
        editor.value;

      /*
        Save locally immediately.
      */
      localBackup();

      status.textContent =
        "Saving...";

      clearTimeout(
        notesSaveTimer
      );

      notesSaveTimer =
        setTimeout(() => {
          saveData();

          status.textContent =
            "Saved";
        }, 350);
    }
  );

  /*
    Put cursor in editor.
  */
  setTimeout(() => {
    editor.focus();

    editor.setSelectionRange(
      editor.value.length,
      editor.value.length
    );
  }, 100);
}


// ============================================================
// SETTINGS BUTTONS
// ============================================================

document
  .getElementById(
    "manageEnsembles"
  )
  .onclick = () => {
    openPage("homePage");
  };

document
  .getElementById(
    "accountsButton"
  )
  .onclick = () => {
    alert(
      "Instructor Accounts will be enabled with the sign-in/security setup."
    );
  };

document
  .getElementById(
    "permissionsButton"
  )
  .onclick = () => {
    alert(
      "Permissions will be available when instructor sign-in is enabled."
    );
  };


// ============================================================
// RENDER EVERYTHING
// ============================================================

function renderAll() {
  normalizeData();

  renderHeader();
  renderEnsembles();
  renderDancers();
  renderDances();
  renderCalendar();
  renderPractices();
  renderSettings();
}


// ============================================================
// FIREBASE SHARED SYNC
// ============================================================

function startFirebaseSync() {
  if (
    firebaseSyncStarted ||
    !window.vukFirebase
  ) {
    return;
  }

  firebaseSyncStarted = true;

  const {
    database,
    dbRef,
    set,
    onValue
  } = window.vukFirebase;

  const sharedDataRef =
    dbRef(
      database,
      CLOUD_ROOT
    );

  let firstFirebaseLoad = true;

  onValue(
    sharedDataRef,

    snapshot => {
      const cloudData =
        snapshot.val();

      if (
        firstFirebaseLoad &&
        cloudData === null
      ) {
        firstFirebaseLoad = false;
        cloudReady = true;

        /*
          Firebase empty:
          upload existing local data.
        */

        const cloudCopy =
          clone(data);

        delete cloudCopy.selectedEnsemble;

        set(
          sharedDataRef,
          cloudCopy
        ).catch(error => {
          console.error(
            "Initial Firebase upload failed:",
            error
          );
        });

        return;
      }

      firstFirebaseLoad = false;
      cloudReady = true;

      if (cloudData) {
        /*
          IMPORTANT:
          Ignore the old shared
          selectedEnsemble value.
        */

        applyingCloud = true;

        data = cloudData;

        delete data.selectedEnsemble;

        normalizeData();
        localBackup();

        applyingCloud = false;

        /*
          Don't destroy an open modal
          while someone is typing notes
          or filling in a form.
        */

        if (
          !modalOverlay.classList.contains(
            "open"
          )
        ) {
          renderAll();
        } else {
          renderHeader();
          renderEnsembles();
          renderDancers();
          renderDances();
          renderCalendar();
          renderPractices();
        }
      }
    },

    error => {
      console.error(
        "Firebase sync failed:",
        error
      );

      cloudReady = false;
    }
  );
}


// ============================================================
// START APP
// ============================================================

normalizeData();
saveSelectedEnsemble();
localBackup();

renderAll();
openPage("homePage");

if (window.vukFirebase) {
  startFirebaseSync();
}

window.addEventListener(
  "vukFirebaseReady",
  startFirebaseSync
);
