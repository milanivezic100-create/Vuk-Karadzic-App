/* ============================================================
   VUK KARADZIC PROBE
   SCRIPT.JS — V11
   Clean complete rebuild
   ============================================================ */

const STORAGE_KEY = "vukProbeV4";
const OLD_STORAGE_KEY = "vukProbeV3";
const CLOUD_ROOT = "vukProbeV4";

const ENSEMBLE_NAMES = [
  "First Ensemble",
  "Second Ensemble",
  "Third Ensemble",
  "Fourth Ensemble",
  "Fifth Ensemble"
];


/* ============================================================
   DOM
   ============================================================ */

const app = document.getElementById("app");
const ensembleButton = document.getElementById("ensembleButton");
const ensembleList = document.getElementById("ensembleList");

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-button");

const danceEnsemble = document.getElementById("danceEnsemble");
const dancerEnsemble = document.getElementById("dancerEnsemble");
const settingsEnsemble = document.getElementById("settingsEnsemble");

const danceList = document.getElementById("danceList");
const dancerList = document.getElementById("dancerList");
const dancerSearch = document.getElementById("dancerSearch");

const addDanceButton = document.getElementById("addDanceButton");
const addDancerButton = document.getElementById("addDancerButton");

const calendarMonth = document.getElementById("calendarMonth");
const calendarGrid = document.getElementById("calendarGrid");
const todayButton = document.getElementById("todayButton");
const practiceList = document.getElementById("practiceList");
const addPracticeButton = document.getElementById("addPracticeButton");

const modalOverlay = document.getElementById("modalOverlay");
const modal = modalOverlay?.querySelector(".modal");
const modalBack = document.getElementById("modalBack");
const modalEyebrow = document.getElementById("modalEyebrow");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalButton = document.getElementById("closeModal");

const appToast = document.getElementById("appToast");

const uploadOverlay = document.getElementById("uploadOverlay");
const uploadMessage = document.getElementById("uploadMessage");
const cancelUploadButton = document.getElementById("cancelUploadButton");

const manageEnsemblesButton =
  document.getElementById("manageEnsembles");

const accountsButton =
  document.getElementById("accountsButton");

const permissionsButton =
  document.getElementById("permissionsButton");


/* ============================================================
   DEFAULT DATA
   ============================================================ */

function blankEnsemble(name) {
  return {
    name,
    dancers: [],
    dances: [],
    practices: [],
    instructorNotes: ""
  };
}

const defaultData = {
  selectedEnsemble: 0,
  ensembles: ENSEMBLE_NAMES.map(name => blankEnsemble(name))
};


/* ============================================================
   GENERAL HELPERS
   ============================================================ */

function uid(prefix = "id") {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 9)
  );
}

function sameId(a, b) {
  return String(a) === String(b);
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function titleCase(value = "") {
  return String(value).replace(
    /\b\w/g,
    char => char.toUpperCase()
  );
}

function normalGender(gender) {
  const value = String(gender || "")
    .trim()
    .toLowerCase();

  if (
    value === "male" ||
    value === "boy" ||
    value === "boys"
  ) {
    return "Male";
  }

  if (
    value === "female" ||
    value === "girl" ||
    value === "girls"
  ) {
    return "Female";
  }

  return "Other";
}

function dancerName(dancer) {
  if (!dancer) return "";

  if (dancer.name) {
    return dancer.name;
  }

  return [
    dancer.firstName,
    dancer.lastName
  ]
    .filter(Boolean)
    .join(" ");
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(
    dateString + "T12:00:00"
  );

  return date.toLocaleDateString(
    "en-CA",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );
}

function formatTime(time) {
  if (!time) return "";

  const [hour, minute] =
    time.split(":");

  const date = new Date();

  date.setHours(
    Number(hour),
    Number(minute),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-CA",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

function dateToInputValue(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysToDateString(
  dateString,
  numberOfDays
) {
  const date = new Date(
    dateString + "T12:00:00"
  );

  date.setDate(
    date.getDate() + numberOfDays
  );

  return dateToInputValue(date);
}

function showToast(message) {
  if (!appToast) return;

  appToast.textContent = message;
  appToast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(
    () => {
      appToast.classList.remove("show");
    },
    1800
  );
}

function showUpload(message) {
  if (!uploadOverlay) return;

  if (uploadMessage) {
    uploadMessage.textContent = message;
  }

  uploadOverlay.classList.add("open");

  uploadOverlay.setAttribute(
    "aria-hidden",
    "false"
  );
}

function hideUpload() {
  uploadOverlay?.classList.remove("open");

  uploadOverlay?.setAttribute(
    "aria-hidden",
    "true"
  );
}


/* ============================================================
   DATA NORMALIZATION
   ============================================================ */

function normalizeData(raw) {
  if (
    !raw ||
    !Array.isArray(raw.ensembles)
  ) {
    return structuredClone(defaultData);
  }

  const normalized = {
    ...raw
  };

  let selected =
    Number(normalized.selectedEnsemble);

  if (!Number.isInteger(selected)) {
    selected = 0;
  }

  normalized.selectedEnsemble =
    Math.max(
      0,
      Math.min(4, selected)
    );

  normalized.ensembles =
    ENSEMBLE_NAMES.map(
      (fallbackName, index) => {

        const old =
          raw.ensembles[index] || {};

        const dancers =
          Array.isArray(old.dancers)
            ? old.dancers
            : [];

        const dances =
          Array.isArray(old.dances)
            ? old.dances
            : [];

        const practices =
          Array.isArray(old.practices)
            ? old.practices
            : [];

        return {
          ...old,

          name:
            old.name ||
            fallbackName,

          dancers:
            dancers.map(
              dancer => ({
                ...dancer,

                id:
                  dancer.id ??
                  uid("dancer"),

                gender:
                  normalGender(
                    dancer.gender
                  ),

                notes:
                  dancer.notes || ""
              })
            ),

          dances:
            dances.map(
              dance => {

                const dancerIds =
                  Array.isArray(
                    dance.dancerIds
                  )
                    ? dance.dancerIds
                    : Array.isArray(
                        dance.dancers
                      )
                    ? dance.dancers
                    : [];

                const oldOrder =
                  Array.isArray(
                    dance.dancerOrder
                  )
                    ? dance.dancerOrder
                    : [];

                const dancerOrder =
                  oldOrder.filter(
                    dancerId =>
                      dancerIds.some(
                        id =>
                          sameId(
                            id,
                            dancerId
                          )
                      )
                  );

                dancerIds.forEach(
                  dancerId => {

                    if (
                      !dancerOrder.some(
                        id =>
                          sameId(
                            id,
                            dancerId
                          )
                      )
                    ) {
                      dancerOrder.push(
                        dancerId
                      );
                    }
                  }
                );

                return {
                  ...dance,

                  id:
                    dance.id ??
                    uid("dance"),

                  inUse:
                    typeof dance.inUse ===
                    "boolean"
                      ? dance.inUse
                      : true,

                  dancerIds,
                  dancerOrder,

                  photos:
                    Array.isArray(
                      dance.photos
                    )
                      ? dance.photos
                      : []
                };
              }
            ),

          practices:
            practices.map(
              practice => ({
                ...practice,

                id:
                  practice.id ??
                  uid("practice"),

                attendance:
                  practice.attendance &&
                  typeof practice.attendance ===
                    "object"
                    ? practice.attendance
                    : {}
              })
            ),

          instructorNotes:
            old.instructorNotes ||
            old.notes ||
            ""
        };
      }
    );

  return normalized;
}


/* ============================================================
   LOCAL STORAGE
   ============================================================ */

function loadLocalData() {
  try {

    const current =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (current) {
      return normalizeData(
        JSON.parse(current)
      );
    }

    const old =
      localStorage.getItem(
        OLD_STORAGE_KEY
      );

    if (old) {
      return normalizeData(
        JSON.parse(old)
      );
    }

  } catch (error) {

    console.error(
      "Could not load local data:",
      error
    );
  }

  return structuredClone(defaultData);
}

let data = loadLocalData();

function saveLocalOnly() {
  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    return true;

  } catch (error) {

    console.error(
      "Local save failed:",
      error
    );

    return false;
  }
}


/* ============================================================
   SELECTED ENSEMBLE HELPERS
   ============================================================ */

function getSelectedEnsemble() {
  return data.ensembles[
    data.selectedEnsemble
  ];
}

function ensembleName() {
  return (
    getSelectedEnsemble()?.name ||
    ENSEMBLE_NAMES[
      data.selectedEnsemble
    ] ||
    "Ensemble"
  );
}

function findDancer(id) {
  return getSelectedEnsemble()
    .dancers
    .find(
      dancer =>
        sameId(
          dancer.id,
          id
        )
    );
}

function findDance(id) {
  return getSelectedEnsemble()
    .dances
    .find(
      dance =>
        sameId(
          dance.id,
          id
        )
    );
}

function findPractice(id) {
  return getSelectedEnsemble()
    .practices
    .find(
      practice =>
        sameId(
          practice.id,
          id
        )
    );
}

function groupDancers(gender) {
  return getSelectedEnsemble()
    .dancers
    .filter(
      dancer =>
        normalGender(
          dancer.gender
        ) === gender
    );
}


/* ============================================================
   FIREBASE STATE
   ============================================================ */

let firebaseReady = false;
let cloudHasLoaded = false;

/*
  These paths are temporarily protected from an older Firebase
  snapshot while a local attendance write is in progress.
*/

const pendingAttendanceWrites =
  new Map();

function getFirebase() {
  return window.vukFirebase || null;
}


/* ============================================================
   GENERAL CLOUD SAVE
   ============================================================ */

async function saveData() {
  saveLocalOnly();

  if (!firebaseReady) {
    return false;
  }

  const fb = getFirebase();

  if (!fb) {
    return false;
  }

  try {

    await fb.set(
      fb.dbRef(
        fb.database,
        CLOUD_ROOT
      ),
      data
    );

    return true;

  } catch (error) {

    console.error(
      "Firebase save failed:",
      error
    );

    showToast(
      "Saved on this phone"
    );

    return false;
  }
}


/* ============================================================
   ATTENDANCE HELPERS
   ============================================================ */

function getAttendanceStatus(
  practice,
  dancerId
) {
  if (
    !practice.attendance ||
    typeof practice.attendance !==
      "object"
  ) {
    practice.attendance = {};
  }

  const direct =
    practice.attendance[
      String(dancerId)
    ];

  if (direct) {
    return direct;
  }

  const matchingKey =
    Object.keys(
      practice.attendance
    ).find(
      key =>
        sameId(
          key,
          dancerId
        )
    );

  return matchingKey
    ? practice.attendance[
        matchingKey
      ]
    : "";
}

function setAttendanceStatus(
  practice,
  dancerId,
  status
) {
  if (
    !practice.attendance ||
    typeof practice.attendance !==
      "object"
  ) {
    practice.attendance = {};
  }

  practice.attendance[
    String(dancerId)
  ] = status;
}


/* ============================================================
   TARGETED ATTENDANCE SAVE
   ============================================================ */

async function saveAttendanceStatusToCloud(
  ensembleIndex,
  practiceId,
  dancerId,
  status
) {
  const ensemble =
    data.ensembles[
      ensembleIndex
    ];

  if (!ensemble) {
    return false;
  }

  const practiceIndex =
    ensemble.practices.findIndex(
      practice =>
        sameId(
          practice.id,
          practiceId
        )
    );

  if (practiceIndex < 0) {
    return false;
  }

  /*
    IMPORTANT:
    First make absolutely sure the LIVE data object contains
    the attendance change, then save localStorage.
  */

  const livePractice =
    ensemble.practices[
      practiceIndex
    ];

  setAttendanceStatus(
    livePractice,
    dancerId,
    status
  );

  saveLocalOnly();

  const pendingKey =
    [
      ensembleIndex,
      practiceId,
      dancerId
    ].join("|");

  pendingAttendanceWrites.set(
    pendingKey,
    status
  );

  if (!firebaseReady) {
    return false;
  }

  const fb = getFirebase();

  if (!fb) {
    return false;
  }

  const path =
    `${CLOUD_ROOT}/ensembles/${ensembleIndex}` +
    `/practices/${practiceIndex}` +
    `/attendance/${String(dancerId)}`;

  try {

    await fb.set(
      fb.dbRef(
        fb.database,
        path
      ),
      status
    );

    pendingAttendanceWrites.delete(
      pendingKey
    );

    return true;

  } catch (error) {

    /*
      Do NOT delete the pending local value here.

      The phone copy remains authoritative for this attendance
      mark until a later successful cloud save.
    */

    console.error(
      "Attendance Firebase save failed:",
      error
    );

    showToast(
      "Attendance saved on phone"
    );

    return false;
  }
}


/* ============================================================
   MARK ALL PRESENT — TARGETED SAVE
   ============================================================ */

async function savePracticeAttendanceToCloud(
  ensembleIndex,
  practiceId
) {
  const ensemble =
    data.ensembles[
      ensembleIndex
    ];

  if (!ensemble) {
    return false;
  }

  const practiceIndex =
    ensemble.practices.findIndex(
      practice =>
        sameId(
          practice.id,
          practiceId
        )
    );

  if (practiceIndex < 0) {
    return false;
  }

  const practice =
    ensemble.practices[
      practiceIndex
    ];

  saveLocalOnly();

  ensemble.dancers.forEach(
    dancer => {

      const status =
        getAttendanceStatus(
          practice,
          dancer.id
        );

      if (!status) return;

      const pendingKey =
        [
          ensembleIndex,
          practiceId,
          dancer.id
        ].join("|");

      pendingAttendanceWrites.set(
        pendingKey,
        status
      );
    }
  );

  if (!firebaseReady) {
    return false;
  }

  const fb = getFirebase();

  if (!fb) {
    return false;
  }

  const path =
    `${CLOUD_ROOT}/ensembles/${ensembleIndex}` +
    `/practices/${practiceIndex}` +
    `/attendance`;

  try {

    await fb.set(
      fb.dbRef(
        fb.database,
        path
      ),
      practice.attendance || {}
    );

    ensemble.dancers.forEach(
      dancer => {

        const pendingKey =
          [
            ensembleIndex,
            practiceId,
            dancer.id
          ].join("|");

        pendingAttendanceWrites.delete(
          pendingKey
        );
      }
    );

    return true;

  } catch (error) {

    console.error(
      "Attendance Firebase save failed:",
      error
    );

    showToast(
      "Attendance saved on phone"
    );

    return false;
  }
}


/* ============================================================
   MERGE CLOUD DATA SAFELY

   This is the important V11 change.

   Firebase can update the app, BUT any attendance mark that
   this phone has just made and is still waiting to sync is
   restored into the incoming cloud copy before it becomes the
   live app data.
   ============================================================ */

function mergeCloudDataSafely(
  cloudRaw
) {
  const incoming =
    normalizeData(
      cloudRaw
    );

  const localSelectedEnsemble =
    data.selectedEnsemble;

  pendingAttendanceWrites.forEach(
    (
      status,
      pendingKey
    ) => {

      const [
        ensembleIndexText,
        practiceId,
        dancerId
      ] =
        pendingKey.split("|");

      const ensembleIndex =
        Number(
          ensembleIndexText
        );

      const incomingEnsemble =
        incoming.ensembles[
          ensembleIndex
        ];

      if (!incomingEnsemble) {
        return;
      }

      const incomingPractice =
        incomingEnsemble
          .practices
          .find(
            practice =>
              sameId(
                practice.id,
                practiceId
              )
          );

      if (!incomingPractice) {
        return;
      }

      setAttendanceStatus(
        incomingPractice,
        dancerId,
        status
      );
    }
  );

  incoming.selectedEnsemble =
    localSelectedEnsemble;

  return incoming;
}


/* ============================================================
   PAGE NAVIGATION
   ============================================================ */

function openPage(pageId) {
  pages.forEach(
    page => {
      page.classList.toggle(
        "active",
        page.id === pageId
      );
    }
  );

  navButtons.forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.page ===
          pageId
      );
    }
  );

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

  renderPage(pageId);
}

function renderPage(pageId) {
  updateEnsembleLabels();

  if (pageId === "homePage") {
    renderEnsembles();
  }

  if (pageId === "dancersPage") {
    renderDancers();
  }

  if (pageId === "dancesPage") {
    renderDances();
  }

  if (pageId === "calendarPage") {
    renderCalendar();
    renderPractices();
  }

  if (pageId === "settingsPage") {
    renderSettings();
  }
}


/* ============================================================
   HEADER
   ============================================================ */

function removeHeaderEnsembleButton() {
  if (!ensembleButton) {
    return;
  }

  ensembleButton.style.display =
    "none";

  ensembleButton.setAttribute(
    "aria-hidden",
    "true"
  );
}

function updateEnsembleLabels() {
  const name =
    ensembleName();

  if (danceEnsemble) {
    danceEnsemble.textContent =
      name;
  }

  if (dancerEnsemble) {
    dancerEnsemble.textContent =
      name;
  }

  if (settingsEnsemble) {
    settingsEnsemble.textContent =
      name;
  }
}


/* ============================================================
   HOME / ENSEMBLES
   ============================================================ */

function renderEnsembles() {
  if (!ensembleList) {
    return;
  }

  ensembleList.innerHTML =
    data.ensembles
      .map(
        (
          ensemble,
          index
        ) => {

          const selected =
            index ===
            data.selectedEnsemble;

          const dancerCount =
            ensemble.dancers
              ?.length || 0;

          return `
            <button
              type="button"
              class="ensemble-card ${
                selected
                  ? "selected"
                  : ""
              }"
              data-ensemble="${index}"
            >

              <div
                class="ensemble-number"
              >
                ${String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}
              </div>

              <div>
                <h3>
                  ${escapeHTML(
                    ensemble.name
                  )}
                </h3>

                <p>
                  ${dancerCount}
                  ${
                    dancerCount === 1
                      ? "dancer"
                      : "dancers"
                  }
                </p>
              </div>

              <span class="radio"></span>

            </button>
          `;
        }
      )
      .join("");

  ensembleList
    .querySelectorAll(
      "[data-ensemble]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            data.selectedEnsemble =
              Number(
                button.dataset
                  .ensemble
              );

            /*
              Ensemble selection is local UI state.
              We do not need another instructor's phone
              changing which ensemble this phone is viewing.
            */

            saveLocalOnly();

            renderAll();

            showToast(
              `${ensembleName()} selected`
            );
          }
        );
      }
    );
}


/* ============================================================
   END PART 1 OF 4
   Paste Part 2 immediately underneath this.
   DO NOT commit yet.
   ============================================================ */
/* ============================================================
   PART 2 OF 4
   DANCERS + DANCES
   ============================================================ */


/* ============================================================
   DANCER LIST
   ============================================================ */

function renderDancers() {
  if (!dancerList) {
    return;
  }

  const query =
    String(
      dancerSearch?.value || ""
    )
      .trim()
      .toLowerCase();

  const groups = [
    {
      gender: "Male",
      label: "BOYS",
      className: "boys"
    },
    {
      gender: "Female",
      label: "GIRLS",
      className: "girls"
    },
    {
      gender: "Other",
      label: "OTHER",
      className: "other"
    }
  ];

  let html = "";

  groups.forEach(group => {
    let dancers =
      groupDancers(
        group.gender
      );

    if (query) {
      dancers =
        dancers.filter(
          dancer =>
            dancerName(dancer)
              .toLowerCase()
              .includes(query)
        );
    }

    if (
      group.gender === "Other" &&
      dancers.length === 0
    ) {
      return;
    }

    html += `
      <section class="roster-section">

        <div
          class="roster-section-heading"
        >
          <div
            class="roster-title ${group.className}"
          >
            ${group.label}
          </div>
        </div>

        <div
          class="roster-list"
          data-dancer-list="${group.gender}"
        >
    `;

    if (dancers.length === 0) {
      html += `
        <div
          class="empty compact-empty"
        >
          No dancers
        </div>
      `;
    } else {
      dancers.forEach(
        (dancer, index) => {

          const number =
            String(index + 1)
              .padStart(2, "0");

          const numberClass =
            group.gender === "Male"
              ? "boy"
              : group.gender === "Female"
              ? "girl"
              : "other";

          html += `
            <div
              class="dancer-row draggable-row"
              data-dancer-row="${escapeHTML(
                dancer.id
              )}"
              data-gender="${group.gender}"
            >

              <button
                type="button"
                class="dancer-open"
                data-open-dancer="${escapeHTML(
                  dancer.id
                )}"
              >

                <span
                  class="dancer-number ${numberClass}"
                >
                  ${number}
                </span>

                <span
                  class="dancer-name"
                >
                  ${escapeHTML(
                    dancerName(dancer)
                  )}
                </span>

                <span
                  class="dancer-height"
                >
                  ${
                    dancer.height
                      ? escapeHTML(
                          dancer.height
                        )
                      : ""
                  }
                </span>

                <span class="chevron">
                  ›
                </span>

              </button>

              <button
                type="button"
                class="drag-handle"
                data-dancer-drag
                aria-label="Reorder ${escapeHTML(
                  dancerName(dancer)
                )}"
              >
                ≡
              </button>

            </div>
          `;
        }
      );
    }

    html += `
        </div>
      </section>
    `;
  });

  dancerList.innerHTML =
    html;

  dancerList
    .querySelectorAll(
      "[data-open-dancer]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (
            Date.now() <
            suppressClickUntil
          ) {
            return;
          }

          showDancer(
            button.dataset
              .openDancer
          );
        }
      );
    });

  if (!query) {
    setupDancerReordering();
  }
}


/* ============================================================
   DANCER PROFILE
   ============================================================ */

function showDancer(id) {
  const dancer =
    findDancer(id);

  if (!dancer) {
    return;
  }

  const stats =
    attendanceStatsForDancer(
      dancer.id
    );

  openModal({
    eyebrow: "DANCER",

    title:
      dancerName(dancer),

    body: `
      <div class="profile-card">

        <div class="profile-name">
          ${escapeHTML(
            dancerName(dancer)
          )}
        </div>

        <div class="profile-grid">

          <div class="profile-stat">
            <span>
              Gender
            </span>

            <strong>
              ${escapeHTML(
                normalGender(
                  dancer.gender
                )
              )}
            </strong>
          </div>

          <div class="profile-stat">
            <span>
              Height
            </span>

            <strong>
              ${escapeHTML(
                dancer.height || "—"
              )}
            </strong>
          </div>

          <div class="profile-stat">
            <span>
              Shoe Size
            </span>

            <strong>
              ${escapeHTML(
                dancer.shoeSize || "—"
              )}
            </strong>
          </div>

        </div>

        <button
          type="button"
          class="attendance-profile-card"
          id="openAttendanceHistory"
        >

          <div>

            <div
              class="attendance-percent"
            >
              <strong>
                ${stats.percent}%
              </strong>

              <span>
                Present
              </span>
            </div>

            <div
              class="not-present-percent"
            >
              ${
                stats.total > 0
                  ? 100 -
                    stats.percent
                  : 0
              }% Not Present
            </div>

          </div>

          <span class="chevron">
            ›
          </span>

        </button>

      </div>

      ${
        dancer.notes
          ? `
            <div class="notes-card">

              <h3>
                Notes
              </h3>

              <p>
                ${escapeHTML(
                  dancer.notes
                )}
              </p>

            </div>
          `
          : ""
      }

      <button
        type="button"
        class="primary-button"
        id="editDancerButton"
      >
        Edit Dancer
      </button>
    `
  });

  document
    .getElementById(
      "editDancerButton"
    )
    ?.addEventListener(
      "click",
      () => {
        showDancerForm(
          dancer.id
        );
      }
    );

  document
    .getElementById(
      "openAttendanceHistory"
    )
    ?.addEventListener(
      "click",
      () => {
        showAttendanceHistory(
          dancer.id
        );
      }
    );
}


/* ============================================================
   ADD / EDIT DANCER
   ============================================================ */

function showDancerForm(
  id = null
) {
  const dancer =
    id
      ? findDancer(id)
      : null;

  openModal({
    eyebrow: "DANCER",

    title:
      dancer
        ? "Edit Dancer"
        : "Add Dancer",

    body: `
      <form id="dancerForm">

        <div class="form-group">

          <label>
            Name
          </label>

          <input
            id="dancerNameInput"
            required
            value="${escapeHTML(
              dancerName(dancer)
            )}"
          >

        </div>

        <div class="form-group">

          <label>
            Gender
          </label>

          <select
            id="dancerGenderInput"
          >

            <option
              value="Male"
              ${
                normalGender(
                  dancer?.gender
                ) === "Male"
                  ? "selected"
                  : ""
              }
            >
              Male
            </option>

            <option
              value="Female"
              ${
                normalGender(
                  dancer?.gender
                ) === "Female"
                  ? "selected"
                  : ""
              }
            >
              Female
            </option>

            <option
              value="Other"
              ${
                normalGender(
                  dancer?.gender
                ) === "Other"
                  ? "selected"
                  : ""
              }
            >
              Other
            </option>

          </select>

        </div>

        <div class="form-group">

          <label>
            Height
          </label>

          <input
            id="dancerHeightInput"
            value="${escapeHTML(
              dancer?.height || ""
            )}"
          >

        </div>

        <div class="form-group">

          <label>
            Shoe Size
          </label>

          <input
            id="dancerShoeInput"
            value="${escapeHTML(
              dancer?.shoeSize || ""
            )}"
          >

        </div>

        <div class="form-group">

          <label>
            Notes
          </label>

          <textarea
            id="dancerNotesInput"
            rows="5"
          >${escapeHTML(
            dancer?.notes || ""
          )}</textarea>

        </div>

        <button
          type="submit"
          class="primary-button"
        >
          ${
            dancer
              ? "Save Changes"
              : "Add Dancer"
          }
        </button>

        ${
          dancer
            ? `
              <button
                type="button"
                class="danger-button"
                id="deleteDancerButton"
              >
                Delete Dancer
              </button>
            `
            : ""
        }

      </form>
    `
  });

  document
    .getElementById(
      "dancerForm"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const name =
          document
            .getElementById(
              "dancerNameInput"
            )
            .value
            .trim();

        if (!name) {
          return;
        }

        const gender =
          document
            .getElementById(
              "dancerGenderInput"
            )
            .value;

        const height =
          document
            .getElementById(
              "dancerHeightInput"
            )
            .value
            .trim();

        const shoeSize =
          document
            .getElementById(
              "dancerShoeInput"
            )
            .value
            .trim();

        const notes =
          document
            .getElementById(
              "dancerNotesInput"
            )
            .value
            .trim();

        if (dancer) {

          dancer.name = name;
          dancer.gender =
            normalGender(gender);

          dancer.height =
            height;

          dancer.shoeSize =
            shoeSize;

          dancer.notes =
            notes;

        } else {

          getSelectedEnsemble()
            .dancers
            .push({
              id: uid("dancer"),
              name,
              gender:
                normalGender(
                  gender
                ),
              height,
              shoeSize,
              notes
            });
        }

        saveLocalOnly();
        renderDancers();

        closeModal();

        showToast(
          dancer
            ? "Dancer updated"
            : "Dancer added"
        );

        await saveData();
      }
    );

  document
    .getElementById(
      "deleteDancerButton"
    )
    ?.addEventListener(
      "click",
      async () => {

        if (
          !confirm(
            "Delete this dancer?"
          )
        ) {
          return;
        }

        const ensemble =
          getSelectedEnsemble();

        ensemble.dancers =
          ensemble.dancers
            .filter(
              item =>
                !sameId(
                  item.id,
                  dancer.id
                )
            );

        /*
          Also remove this dancer from
          every dance assignment.
        */

        ensemble.dances
          .forEach(
            dance => {

              dance.dancerIds =
                (
                  dance.dancerIds ||
                  []
                )
                  .filter(
                    dancerId =>
                      !sameId(
                        dancerId,
                        dancer.id
                      )
                  );

              dance.dancerOrder =
                (
                  dance.dancerOrder ||
                  []
                )
                  .filter(
                    dancerId =>
                      !sameId(
                        dancerId,
                        dancer.id
                      )
                  );
            }
          );

        saveLocalOnly();

        closeModal();

        renderDancers();
        renderDances();

        showToast(
          "Dancer deleted"
        );

        await saveData();
      }
    );
}


/* ============================================================
   DANCES LIST
   ============================================================ */

function renderDances() {
  if (!danceList) {
    return;
  }

  const dances =
    getSelectedEnsemble()
      .dances;

  const inUse =
    dances.filter(
      dance =>
        dance.inUse !== false
    );

  const notInUse =
    dances.filter(
      dance =>
        dance.inUse === false
    );

  danceList.innerHTML =
    danceSectionHTML(
      "IN USE",
      "in-use",
      inUse,
      true
    ) +
    danceSectionHTML(
      "NOT IN USE",
      "not-in-use",
      notInUse,
      false
    );

  danceList
    .querySelectorAll(
      "[data-open-dance]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (
            Date.now() <
            suppressClickUntil
          ) {
            return;
          }

          showDance(
            button.dataset
              .openDance
          );
        }
      );
    });

  setupDanceReordering();
}


/* ============================================================
   DANCE SECTION
   ============================================================ */

function danceSectionHTML(
  label,
  className,
  dances,
  inUse
) {
  return `
    <section class="dance-section">

      <div
        class="dance-section-title ${className}"
      >
        ${label}
      </div>

      <div
        class="dance-section-list"
        data-dance-section="${
          inUse
            ? "in-use"
            : "not-in-use"
        }"
      >

        ${
          dances.length
            ? dances
                .map(
                  (
                    dance,
                    index
                  ) =>
                    danceRowHTML(
                      dance,
                      index
                    )
                )
                .join("")
            : `
              <div
                class="empty compact-empty"
              >
                No dances
              </div>
            `
        }

      </div>

    </section>
  `;
}


/* ============================================================
   DANCE ROW
   ============================================================ */

function danceRowHTML(
  dance,
  index
) {
  const number =
    String(index + 1)
      .padStart(2, "0");

  return `
    <div
      class="dance-row draggable-row"
      data-dance-row="${escapeHTML(
        dance.id
      )}"
    >

      <button
        type="button"
        class="dance-open"
        data-open-dance="${escapeHTML(
          dance.id
        )}"
      >

        <span class="dance-number">
          ${number}
        </span>

        <span class="dance-row-main">

          <strong>
            ${escapeHTML(
              dance.name ||
              "Untitled Dance"
            )}
          </strong>

          ${
            dance.choreographer
              ? `
                <small>
                  ${escapeHTML(
                    dance.choreographer
                  )}
                </small>
              `
              : ""
          }

        </span>

        <span class="chevron">
          ›
        </span>

      </button>

      <button
        type="button"
        class="drag-handle"
        data-dance-drag
        aria-label="Reorder ${escapeHTML(
          dance.name ||
          "dance"
        )}"
      >
        ≡
      </button>

    </div>
  `;
}


/* ============================================================
   DANCE-SPECIFIC DANCER ORDER
   ============================================================ */

function danceOrderedDancers(
  dance
) {
  const ensemble =
    getSelectedEnsemble();

  const assignedIds =
    Array.isArray(
      dance.dancerIds
    )
      ? dance.dancerIds
      : [];

  const order =
    Array.isArray(
      dance.dancerOrder
    )
      ? [...dance.dancerOrder]
      : [];

  /*
    Make sure every assigned dancer
    appears in dancerOrder.
  */

  assignedIds.forEach(
    dancerId => {

      if (
        !order.some(
          id =>
            sameId(
              id,
              dancerId
            )
        )
      ) {
        order.push(
          dancerId
        );
      }
    }
  );

  dance.dancerOrder =
    order.filter(
      dancerId =>
        assignedIds.some(
          id =>
            sameId(
              id,
              dancerId
            )
        )
    );

  return dance.dancerOrder
    .map(
      dancerId =>
        ensemble.dancers.find(
          dancer =>
            sameId(
              dancer.id,
              dancerId
            )
        )
    )
    .filter(Boolean);
}


/* ============================================================
   DANCE DANCER GROUP
   ============================================================ */

function danceDancerGroupHTML(
  dance,
  gender,
  label,
  className
) {
  const dancers =
    danceOrderedDancers(
      dance
    )
      .filter(
        dancer =>
          normalGender(
            dancer.gender
          ) === gender
      );

  if (
    gender === "Other" &&
    dancers.length === 0
  ) {
    return "";
  }

  return `
    <section
      class="dance-dancer-section"
    >

      <div
        class="roster-title ${className}"
      >
        ${label}
      </div>

      <div
        class="dance-dancer-list"
        data-dance-dancer-list="${gender}"
        data-dance-id="${escapeHTML(
          dance.id
        )}"
      >

        ${
          dancers.length
            ? dancers
                .map(
                  (
                    dancer,
                    index
                  ) => {

                    const number =
                      String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      );

                    const numberClass =
                      gender === "Male"
                        ? "boy"
                        : gender ===
                          "Female"
                        ? "girl"
                        : "other";

                    return `
                      <div
                        class="dance-dancer-row draggable-row"
                        data-dance-dancer-row="${escapeHTML(
                          dancer.id
                        )}"
                        data-gender="${gender}"
                      >

                        <div
                          class="dance-dancer-info"
                        >

                          <span
                            class="dancer-number ${numberClass}"
                          >
                            ${number}
                          </span>

                          <span>
                            ${escapeHTML(
                              dancerName(
                                dancer
                              )
                            )}
                          </span>

                        </div>

                        <button
                          type="button"
                          class="drag-handle"
                          data-dance-dancer-drag
                          aria-label="Reorder ${escapeHTML(
                            dancerName(
                              dancer
                            )
                          )}"
                        >
                          ≡
                        </button>

                      </div>
                    `;
                  }
                )
                .join("")
            : `
              <div
                class="empty compact-empty"
              >
                No dancers
              </div>
            `
        }

      </div>

    </section>
  `;
}


/* ============================================================
   DANCE DETAILS
   ============================================================ */

function showDance(id) {
  const dance =
    findDance(id);

  if (!dance) {
    return;
  }

  const assignedCount =
    Array.isArray(
      dance.dancerIds
    )
      ? dance.dancerIds.length
      : 0;

  openModal({
    eyebrow: "DANCE",

    title:
      dance.name ||
      "Dance",

    body: `
      <div class="detail-card">

        ${
          dance.choreographer
            ? `
              <span
                class="detail-label"
              >
                Choreographer
              </span>

              <div
                class="detail-value"
              >
                ${escapeHTML(
                  dance.choreographer
                )}
              </div>
            `
            : ""
        }

        <div
          class="dance-use-status ${
            dance.inUse !== false
              ? "active"
              : "inactive"
          }"
        >
          ${
            dance.inUse !== false
              ? "IN USE"
              : "NOT IN USE"
          }
        </div>

        <div class="dance-count">
          ${assignedCount}
          ${
            assignedCount === 1
              ? "dancer"
              : "dancers"
          }
        </div>

      </div>

      <div
        class="dance-assigned-heading"
      >
        Assigned Dancers
      </div>

      ${danceDancerGroupHTML(
        dance,
        "Male",
        "BOYS",
        "boys"
      )}

      ${danceDancerGroupHTML(
        dance,
        "Female",
        "GIRLS",
        "girls"
      )}

      ${danceDancerGroupHTML(
        dance,
        "Other",
        "OTHER",
        "other"
      )}

      <button
        type="button"
        class="primary-button"
        id="editDanceButton"
      >
        Edit Dance
      </button>
    `
  });

  setupDanceDancerReordering(
    dance.id
  );

  document
    .getElementById(
      "editDanceButton"
    )
    ?.addEventListener(
      "click",
      () => {
        showDanceForm(
          dance.id
        );
      }
    );
}


/* ============================================================
   DANCE DANCER PICKER
   ============================================================ */

function danceDancerPickerHTML(
  dance
) {
  const dancers =
    getSelectedEnsemble()
      .dancers;

  if (!dancers.length) {
    return `
      <div class="empty">
        Add dancers first
      </div>
    `;
  }

  const selectedIds =
    dance?.dancerIds ||
    [];

  const groups = [
    {
      gender: "Male",
      label: "BOYS",
      className: "boys"
    },
    {
      gender: "Female",
      label: "GIRLS",
      className: "girls"
    },
    {
      gender: "Other",
      label: "OTHER",
      className: "other"
    }
  ];

  return groups
    .map(group => {

      const groupMembers =
        dancers.filter(
          dancer =>
            normalGender(
              dancer.gender
            ) === group.gender
        );

      if (!groupMembers.length) {
        return "";
      }

      return `
        <div
          class="dance-picker-group"
        >

          <div
            class="roster-title ${group.className}"
          >
            ${group.label}
          </div>

          ${groupMembers
            .map(
              dancer => {

                const checked =
                  selectedIds.some(
                    id =>
                      sameId(
                        id,
                        dancer.id
                      )
                  );

                return `
                  <label
                    class="dancer-check-row"
                  >

                    <input
                      type="checkbox"
                      value="${escapeHTML(
                        dancer.id
                      )}"
                      data-dance-dancer-checkbox
                      ${
                        checked
                          ? "checked"
                          : ""
                      }
                    >

                    <span
                      class="custom-check"
                    ></span>

                    <span>
                      ${escapeHTML(
                        dancerName(
                          dancer
                        )
                      )}
                    </span>

                  </label>
                `;
              }
            )
            .join("")}

        </div>
      `;
    })
    .join("");
}


/* ============================================================
   ADD / EDIT DANCE
   ============================================================ */

function showDanceForm(
  id = null
) {
  const dance =
    id
      ? findDance(id)
      : null;

  openModal({
    eyebrow: "DANCE",

    title:
      dance
        ? "Edit Dance"
        : "Add Dance",

    body: `
      <form id="danceForm">

        <div class="form-group">

          <label>
            Dance Name
          </label>

          <input
            id="danceNameInput"
            required
            value="${escapeHTML(
              dance?.name || ""
            )}"
          >

        </div>

        <div class="form-group">

          <label>
            Choreographer
          </label>

          <input
            id="danceChoreographerInput"
            value="${escapeHTML(
              dance?.choreographer ||
              ""
            )}"
          >

        </div>

        <div class="form-group">

          <label>
            Status
          </label>

          <select
            id="danceInUseInput"
          >

            <option
              value="true"
              ${
                dance?.inUse !== false
                  ? "selected"
                  : ""
              }
            >
              In Use
            </option>

            <option
              value="false"
              ${
                dance?.inUse === false
                  ? "selected"
                  : ""
              }
            >
              Not In Use
            </option>

          </select>

        </div>

        <div class="form-group">

          <label>
            Dancers
          </label>

          <div
            class="dance-dancer-picker"
          >
            ${danceDancerPickerHTML(
              dance
            )}
          </div>

        </div>

        <button
          type="submit"
          class="primary-button"
        >
          ${
            dance
              ? "Save Changes"
              : "Add Dance"
          }
        </button>

        ${
          dance
            ? `
              <button
                type="button"
                class="danger-button"
                id="deleteDanceButton"
              >
                Delete Dance
              </button>
            `
            : ""
        }

      </form>
    `
  });

  document
    .getElementById(
      "danceForm"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const name =
          document
            .getElementById(
              "danceNameInput"
            )
            .value
            .trim();

        if (!name) {
          return;
        }

        const choreographer =
          document
            .getElementById(
              "danceChoreographerInput"
            )
            .value
            .trim();

        const inUse =
          document
            .getElementById(
              "danceInUseInput"
            )
            .value === "true";

        const selectedIds =
          Array.from(
            modalBody.querySelectorAll(
              "[data-dance-dancer-checkbox]:checked"
            )
          )
            .map(
              checkbox =>
                checkbox.value
            );

        if (dance) {

          dance.name = name;
          dance.choreographer =
            choreographer;
          dance.inUse = inUse;

          dance.dancerIds =
            selectedIds;

          /*
            Preserve the existing
            dance-specific order for
            dancers who remain selected.
          */

          const oldOrder =
            Array.isArray(
              dance.dancerOrder
            )
              ? dance.dancerOrder
              : [];

          dance.dancerOrder =
            oldOrder.filter(
              dancerId =>
                selectedIds.some(
                  id =>
                    sameId(
                      id,
                      dancerId
                    )
                )
            );

          selectedIds.forEach(
            dancerId => {

              if (
                !dance.dancerOrder
                  .some(
                    id =>
                      sameId(
                        id,
                        dancerId
                      )
                  )
              ) {
                dance.dancerOrder
                  .push(
                    dancerId
                  );
              }
            }
          );

        } else {

          getSelectedEnsemble()
            .dances
            .push({
              id: uid("dance"),
              name,
              choreographer,
              inUse,
              dancerIds:
                selectedIds,
              dancerOrder:
                [...selectedIds],
              photos: [],
              music: null
            });
        }

        saveLocalOnly();

        closeModal();

        renderDances();

        showToast(
          dance
            ? "Dance updated"
            : "Dance added"
        );

        await saveData();
      }
    );

  document
    .getElementById(
      "deleteDanceButton"
    )
    ?.addEventListener(
      "click",
      async () => {

        if (
          !confirm(
            "Delete this dance?"
          )
        ) {
          return;
        }

        const ensemble =
          getSelectedEnsemble();

        ensemble.dances =
          ensemble.dances
            .filter(
              item =>
                !sameId(
                  item.id,
                  dance.id
                )
            );

        saveLocalOnly();

        closeModal();

        renderDances();

        showToast(
          "Dance deleted"
        );

        await saveData();
      }
    );
}


/* ============================================================
   END PART 2 OF 4

   Paste Part 3 immediately underneath this.
   DO NOT commit yet.
   ============================================================ */
/* ============================================================
   PART 3 OF 4
   REORDERING + CALENDAR + PRACTICES
   ============================================================ */


/* ============================================================
   DRAG / REORDER STATE
   ============================================================ */

let suppressClickUntil = 0;

let activeDrag = null;

function beginReorder() {
  document.body.classList.add(
    "reordering"
  );

  suppressClickUntil =
    Date.now() + 500;
}

function endReorder() {
  document.body.classList.remove(
    "reordering"
  );

  activeDrag = null;

  suppressClickUntil =
    Date.now() + 350;
}


/* ============================================================
   GENERIC POINTER DRAG
   ============================================================ */

function setupPointerReorder({
  container,
  rowSelector,
  handleSelector,
  onFinished
}) {
  if (!container) {
    return;
  }

  container
    .querySelectorAll(
      handleSelector
    )
    .forEach(handle => {

      handle.addEventListener(
        "pointerdown",
        event => {

          const row =
            handle.closest(
              rowSelector
            );

          if (!row) {
            return;
          }

          event.preventDefault();

          beginReorder();

          activeDrag = {
            row,
            container
          };

          row.classList.add(
            "dragging"
          );

          try {
            handle.setPointerCapture(
              event.pointerId
            );
          } catch (error) {
            // Safe fallback.
          }
        }
      );

      handle.addEventListener(
        "pointermove",
        event => {

          if (
            !activeDrag ||
            activeDrag.container !==
              container
          ) {
            return;
          }

          event.preventDefault();

          const dragging =
            activeDrag.row;

          const rows =
            Array.from(
              container.querySelectorAll(
                rowSelector
              )
            )
              .filter(
                row =>
                  row !== dragging
              );

          const target =
            rows.find(row => {

              const rect =
                row.getBoundingClientRect();

              return (
                event.clientY <
                rect.top +
                  rect.height / 2
              );
            });

          if (target) {
            container.insertBefore(
              dragging,
              target
            );
          } else {
            container.appendChild(
              dragging
            );
          }
        }
      );

      const finish =
        event => {

          if (
            !activeDrag ||
            activeDrag.container !==
              container
          ) {
            return;
          }

          const dragging =
            activeDrag.row;

          dragging.classList.remove(
            "dragging"
          );

          try {
            handle.releasePointerCapture(
              event.pointerId
            );
          } catch (error) {
            // Safe fallback.
          }

          endReorder();

          onFinished?.();
        };

      handle.addEventListener(
        "pointerup",
        finish
      );

      handle.addEventListener(
        "pointercancel",
        finish
      );
    });
}


/* ============================================================
   MAIN DANCER REORDERING
   Boys stay with Boys.
   Girls stay with Girls.
   ============================================================ */

function setupDancerReordering() {
  if (!dancerList) {
    return;
  }

  dancerList
    .querySelectorAll(
      "[data-dancer-list]"
    )
    .forEach(container => {

      const gender =
        container.dataset
          .dancerList;

      setupPointerReorder({
        container,

        rowSelector:
          "[data-dancer-row]",

        handleSelector:
          "[data-dancer-drag]",

        onFinished:
          async () => {

            const orderedIds =
              Array.from(
                container
                  .querySelectorAll(
                    "[data-dancer-row]"
                  )
              )
                .map(
                  row =>
                    row.dataset
                      .dancerRow
                );

            reorderMainDancers(
              gender,
              orderedIds
            );

            renderDancers();

            await saveData();
          }
      });
    });
}

function reorderMainDancers(
  gender,
  orderedIds
) {
  const ensemble =
    getSelectedEnsemble();

  const original =
    [...ensemble.dancers];

  const reorderedGroup =
    orderedIds
      .map(
        id =>
          original.find(
            dancer =>
              sameId(
                dancer.id,
                id
              )
          )
      )
      .filter(Boolean);

  let groupIndex = 0;

  ensemble.dancers =
    original.map(
      dancer => {

        if (
          normalGender(
            dancer.gender
          ) === gender
        ) {
          const replacement =
            reorderedGroup[
              groupIndex
            ];

          groupIndex++;

          return (
            replacement ||
            dancer
          );
        }

        return dancer;
      }
    );

  saveLocalOnly();
}


/* ============================================================
   MAIN DANCE REORDERING
   IN USE and NOT IN USE stay separate.
   ============================================================ */

function setupDanceReordering() {
  if (!danceList) {
    return;
  }

  danceList
    .querySelectorAll(
      "[data-dance-section]"
    )
    .forEach(container => {

      const section =
        container.dataset
          .danceSection;

      const inUse =
        section === "in-use";

      setupPointerReorder({
        container,

        rowSelector:
          "[data-dance-row]",

        handleSelector:
          "[data-dance-drag]",

        onFinished:
          async () => {

            const orderedIds =
              Array.from(
                container
                  .querySelectorAll(
                    "[data-dance-row]"
                  )
              )
                .map(
                  row =>
                    row.dataset
                      .danceRow
                );

            reorderMainDances(
              inUse,
              orderedIds
            );

            renderDances();

            await saveData();
          }
      });
    });
}

function reorderMainDances(
  inUse,
  orderedIds
) {
  const ensemble =
    getSelectedEnsemble();

  const original =
    [...ensemble.dances];

  const reorderedGroup =
    orderedIds
      .map(
        id =>
          original.find(
            dance =>
              sameId(
                dance.id,
                id
              )
          )
      )
      .filter(Boolean);

  let groupIndex = 0;

  ensemble.dances =
    original.map(
      dance => {

        const danceInUse =
          dance.inUse !== false;

        if (
          danceInUse === inUse
        ) {
          const replacement =
            reorderedGroup[
              groupIndex
            ];

          groupIndex++;

          return (
            replacement ||
            dance
          );
        }

        return dance;
      }
    );

  saveLocalOnly();
}


/* ============================================================
   DANCE-SPECIFIC DANCER REORDERING
   ============================================================ */

function setupDanceDancerReordering(
  danceId
) {
  const dance =
    findDance(danceId);

  if (!dance) {
    return;
  }

  modalBody
    ?.querySelectorAll(
      "[data-dance-dancer-list]"
    )
    .forEach(container => {

      const gender =
        container.dataset
          .danceDancerList;

      setupPointerReorder({
        container,

        rowSelector:
          "[data-dance-dancer-row]",

        handleSelector:
          "[data-dance-dancer-drag]",

        onFinished:
          async () => {

            const orderedGenderIds =
              Array.from(
                container
                  .querySelectorAll(
                    "[data-dance-dancer-row]"
                  )
              )
                .map(
                  row =>
                    row.dataset
                      .danceDancerRow
                );

            reorderDanceDancers(
              dance,
              gender,
              orderedGenderIds
            );

            saveLocalOnly();

            showDance(
              dance.id
            );

            await saveData();
          }
      });
    });
}

function reorderDanceDancers(
  dance,
  gender,
  orderedGenderIds
) {
  const existing =
    danceOrderedDancers(
      dance
    );

  const reorderedGender =
    orderedGenderIds
      .map(
        id =>
          existing.find(
            dancer =>
              sameId(
                dancer.id,
                id
              )
          )
      )
      .filter(Boolean);

  let groupIndex = 0;

  const finalOrder =
    existing.map(
      dancer => {

        if (
          normalGender(
            dancer.gender
          ) === gender
        ) {
          const replacement =
            reorderedGender[
              groupIndex
            ];

          groupIndex++;

          return (
            replacement ||
            dancer
          );
        }

        return dancer;
      }
    );

  dance.dancerOrder =
    finalOrder.map(
      dancer =>
        dancer.id
    );
}


/* ============================================================
   CALENDAR STATE
   ============================================================ */

let calendarDate =
  new Date();

calendarDate =
  new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
    1
  );

let selectedCalendarDate =
  dateToInputValue(
    new Date()
  );


/* ============================================================
   CALENDAR
   ============================================================ */

function renderCalendar() {
  if (
    !calendarGrid ||
    !calendarMonth
  ) {
    return;
  }

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  const monthName =
    calendarDate
      .toLocaleDateString(
        "en-CA",
        {
          month: "long",
          year: "numeric"
        }
      );

  calendarMonth.textContent =
    monthName;

  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const lastDay =
    new Date(
      year,
      month + 1,
      0
    );

  const daysInMonth =
    lastDay.getDate();

  /*
    Sunday = 0
    Monday = 1

    Calendar begins Monday.
  */

  const leadingDays =
    (
      firstDay.getDay() +
      6
    ) % 7;

  const practices =
    getSelectedEnsemble()
      .practices;

  const today =
    dateToInputValue(
      new Date()
    );

  let html = "";

  for (
    let index = 0;
    index < leadingDays;
    index++
  ) {
    html += `
      <div
        class="calendar-day empty-day"
      ></div>
    `;
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    const date =
      dateToInputValue(
        new Date(
          year,
          month,
          day
        )
      );

    const hasPractice =
      practices.some(
        practice =>
          practice.date ===
          date
      );

    const isToday =
      date === today;

    const isSelected =
      date ===
      selectedCalendarDate;

    html += `
      <button
        type="button"
        class="calendar-day ${
          isToday
            ? "today"
            : ""
        } ${
          isSelected
            ? "selected"
            : ""
        }"
        data-calendar-date="${date}"
      >

        <span>
          ${day}
        </span>

        ${
          hasPractice
            ? `
              <i
                class="event-dot"
              ></i>
            `
            : ""
        }

      </button>
    `;
  }

  calendarGrid.innerHTML =
    html;

  calendarGrid
    .querySelectorAll(
      "[data-calendar-date]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedCalendarDate =
            button.dataset
              .calendarDate;

          renderCalendar();
          renderPractices();
        }
      );
    });
}


/* ============================================================
   PRACTICE LIST
   ============================================================ */

function renderPractices() {
  if (!practiceList) {
    return;
  }

  const practices =
    getSelectedEnsemble()
      .practices
      .filter(
        practice =>
          practice.date ===
          selectedCalendarDate
      )
      .sort(
        (a, b) =>
          String(
            a.time || ""
          )
            .localeCompare(
              String(
                b.time || ""
              )
            )
      );

  if (!practices.length) {
    practiceList.innerHTML = `
      <div class="empty">
        No practices on
        ${escapeHTML(
          formatDate(
            selectedCalendarDate
          )
        )}
      </div>
    `;

    return;
  }

  practiceList.innerHTML =
    practices
      .map(
        practice => `
          <button
            type="button"
            class="practice-row"
            data-open-practice="${escapeHTML(
              practice.id
            )}"
          >

            <div>

              <strong>
                ${escapeHTML(
                  practice.title ||
                  practice.name ||
                  "Practice"
                )}
              </strong>

              <p>
                ${
                  practice.time
                    ? escapeHTML(
                        formatTime(
                          practice.time
                        )
                      )
                    : "Time not set"
                }

                ${
                  practice.location
                    ? ` · ${escapeHTML(
                        practice.location
                      )}`
                    : ""
                }
              </p>

            </div>

            <span class="chevron">
              ›
            </span>

          </button>
        `
      )
      .join("");

  practiceList
    .querySelectorAll(
      "[data-open-practice]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          showPractice(
            button.dataset
              .openPractice
          );
        }
      );
    });
}


/* ============================================================
   ADD PRACTICE
   One Time / Weekly
   ============================================================ */

function showPracticeForm() {
  const initialDate =
    selectedCalendarDate ||
    dateToInputValue(
      new Date()
    );

  openModal({
    eyebrow: "SCHEDULE",

    title: "Add Practice",

    body: `
      <form id="practiceForm">

        <div class="form-group">

          <label>
            Repeat
          </label>

          <div
            class="practice-repeat-selector"
          >

            <button
              type="button"
              class="practice-repeat-option selected"
              data-repeat-choice="once"
            >
              One Time
            </button>

            <button
              type="button"
              class="practice-repeat-option"
              data-repeat-choice="weekly"
            >
              Weekly
            </button>

          </div>

        </div>

        <div class="form-group">

          <label>
            Practice Name
          </label>

          <input
            id="practiceTitleInput"
            required
            value="Practice"
          >

        </div>

        <div class="form-group">

          <label>
            First Practice Date
          </label>

          <input
            type="date"
            id="practiceDateInput"
            required
            value="${initialDate}"
          >

        </div>

        <div
          class="form-group practice-end-date-group"
          id="practiceEndDateGroup"
          hidden
        >

          <label>
            End Date
          </label>

          <input
            type="date"
            id="practiceEndDateInput"
            value="${initialDate}"
          >

        </div>

        <div class="form-group">

          <label>
            Time
          </label>

          <input
            type="time"
            id="practiceTimeInput"
          >

        </div>

        <div class="form-group">

          <label>
            Location
          </label>

          <input
            id="practiceLocationInput"
          >

        </div>

        <button
          type="submit"
          class="primary-button"
        >
          Add Practice
        </button>

      </form>
    `
  });

  let recurrence =
    "once";

  const endDateGroup =
    document.getElementById(
      "practiceEndDateGroup"
    );

  const startDateInput =
    document.getElementById(
      "practiceDateInput"
    );

  const endDateInput =
    document.getElementById(
      "practiceEndDateInput"
    );

  modalBody
    .querySelectorAll(
      "[data-repeat-choice]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          recurrence =
            button.dataset
              .repeatChoice;

          modalBody
            .querySelectorAll(
              "[data-repeat-choice]"
            )
            .forEach(option => {

              option.classList.toggle(
                "selected",
                option === button
              );
            });

          if (
            recurrence ===
            "weekly"
          ) {
            endDateGroup.hidden =
              false;

            if (
              endDateInput.value <
              startDateInput.value
            ) {
              endDateInput.value =
                startDateInput.value;
            }

          } else {

            endDateGroup.hidden =
              true;
          }
        }
      );
    });

  startDateInput
    ?.addEventListener(
      "change",
      () => {

        if (
          recurrence ===
            "weekly" &&
          endDateInput.value <
            startDateInput.value
        ) {
          endDateInput.value =
            startDateInput.value;
        }
      }
    );

  document
    .getElementById(
      "practiceForm"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const title =
          document
            .getElementById(
              "practiceTitleInput"
            )
            .value
            .trim();

        const startDate =
          document
            .getElementById(
              "practiceDateInput"
            )
            .value;

        const endDate =
          document
            .getElementById(
              "practiceEndDateInput"
            )
            .value;

        const time =
          document
            .getElementById(
              "practiceTimeInput"
            )
            .value;

        const location =
          document
            .getElementById(
              "practiceLocationInput"
            )
            .value
            .trim();

        if (
          !title ||
          !startDate
        ) {
          return;
        }

        if (
          recurrence ===
            "weekly" &&
          (
            !endDate ||
            endDate <
              startDate
          )
        ) {
          alert(
            "Please choose an end date on or after the first practice date."
          );

          return;
        }

        const ensemble =
          getSelectedEnsemble();

        if (
          recurrence ===
          "weekly"
        ) {
          const seriesId =
            uid(
              "practice-series"
            );

          let date =
            startDate;

          while (
            date <= endDate
          ) {
            ensemble.practices
              .push({
                id:
                  uid(
                    "practice"
                  ),

                seriesId,

                recurrence:
                  "weekly",

                seriesStartDate:
                  startDate,

                seriesEndDate:
                  endDate,

                title,
                date,
                time,
                location,

                attendance: {}
              });

            date =
              addDaysToDateString(
                date,
                7
              );
          }

        } else {

          ensemble.practices
            .push({
              id:
                uid(
                  "practice"
                ),

              recurrence:
                "once",

              title,

              date:
                startDate,

              time,
              location,

              attendance: {}
            });
        }

        selectedCalendarDate =
          startDate;

        const selected =
          new Date(
            startDate +
            "T12:00:00"
          );

        calendarDate =
          new Date(
            selected.getFullYear(),
            selected.getMonth(),
            1
          );

        /*
          Local first, then cloud.
        */

        saveLocalOnly();

        closeModal();

        renderCalendar();
        renderPractices();

        showToast(
          recurrence === "weekly"
            ? "Weekly practices added"
            : "Practice added"
        );

        await saveData();
      }
    );
}


/* ============================================================
   END PART 3 OF 4

   Paste Part 4 immediately underneath this.
   DO NOT commit yet.
   ============================================================ */
/* ============================================================
   PART 4 OF 4
   ATTENDANCE + SETTINGS + MODAL + FIREBASE + STARTUP
   ============================================================ */


/* ============================================================
   PRACTICE DETAILS / ATTENDANCE
   ============================================================ */

function showPractice(id) {
  const ensembleIndex =
    data.selectedEnsemble;

  const practiceId =
    String(id);

  /*
    IMPORTANT:
    Never keep using one old practice object.

    Firebase may replace data while this modal is open,
    so every operation finds the CURRENT live practice.
  */

  function getLivePractice() {
    const ensemble =
      data.ensembles[
        ensembleIndex
      ];

    if (!ensemble) {
      return null;
    }

    return ensemble.practices
      .find(
        practice =>
          sameId(
            practice.id,
            practiceId
          )
      ) || null;
  }

  function getLiveEnsemble() {
    return (
      data.ensembles[
        ensembleIndex
      ] || null
    );
  }

  const initialPractice =
    getLivePractice();

  const initialEnsemble =
    getLiveEnsemble();

  if (
    !initialPractice ||
    !initialEnsemble
  ) {
    return;
  }

  openModal({
    eyebrow: "PRACTICE",

    title:
      initialPractice.title ||
      initialPractice.name ||
      "Practice",

    body: `
      <div class="detail-card">

        <span class="detail-label">
          Date
        </span>

        <div class="detail-value">
          ${escapeHTML(
            formatDate(
              initialPractice.date
            )
          )}
        </div>

        ${
          initialPractice.time
            ? `
              <div class="practice-time">
                ${escapeHTML(
                  formatTime(
                    initialPractice.time
                  )
                )}
              </div>
            `
            : ""
        }

        ${
          initialPractice.location
            ? `
              <div class="practice-time">
                ${escapeHTML(
                  initialPractice.location
                )}
              </div>
            `
            : ""
        }

        ${
          initialPractice.recurrence ===
            "weekly"
            ? `
              <span
                class="practice-repeat-badge"
              >
                Weekly
              </span>
            `
            : ""
        }

      </div>

      <button
        type="button"
        class="mark-all-button"
        id="markAllPresent"
      >
        Mark All Present
      </button>

      <div
        class="attendance-summary four"
        id="attendanceSummary"
      ></div>

      <div
        class="search-box attendance-search"
      >
        <span>⌕</span>

        <input
          id="attendanceSearch"
          placeholder="Search dancers"
        >
      </div>

      <div id="attendanceList"></div>

      <button
        type="button"
        class="danger-button"
        id="deletePracticeButton"
      >
        Delete Practice
      </button>
    `
  });

  const attendanceList =
    document.getElementById(
      "attendanceList"
    );

  const attendanceSearch =
    document.getElementById(
      "attendanceSearch"
    );


  /* ----------------------------------------------------------
     RENDER ATTENDANCE
     ---------------------------------------------------------- */

  function renderAttendanceRows() {
    const practice =
      getLivePractice();

    const ensemble =
      getLiveEnsemble();

    if (
      !practice ||
      !ensemble ||
      !attendanceList
    ) {
      return;
    }

    const query =
      String(
        attendanceSearch?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    const filtered =
      ensemble.dancers.filter(
        dancer =>
          dancerName(dancer)
            .toLowerCase()
            .includes(query)
      );

    if (!filtered.length) {
      attendanceList.innerHTML = `
        <div class="empty">
          No dancers found
        </div>
      `;

      drawAttendanceSummary(
        practice,
        ensembleIndex
      );

      return;
    }

    attendanceList.innerHTML =
      filtered
        .map(
          dancer => {

            const status =
              getAttendanceStatus(
                practice,
                dancer.id
              );

            return `
              <div
                class="attendance-row"
                data-attendance-row="${escapeHTML(
                  dancer.id
                )}"
              >

                <h4>
                  ${escapeHTML(
                    dancerName(
                      dancer
                    )
                  )}
                </h4>

                <div
                  class="attendance-buttons four"
                >

                  ${attendanceButton(
                    dancer.id,
                    "present",
                    "Present",
                    status
                  )}

                  ${attendanceButton(
                    dancer.id,
                    "late",
                    "Late",
                    status
                  )}

                  ${attendanceButton(
                    dancer.id,
                    "absent",
                    "No Show",
                    status
                  )}

                  ${attendanceButton(
                    dancer.id,
                    "excused",
                    "Excused",
                    status
                  )}

                </div>

              </div>
            `;
          }
        )
        .join("");


    /*
      Attach attendance buttons after
      creating the rows.
    */

    attendanceList
      .querySelectorAll(
        "[data-attendance-status]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const dancerId =
              button.dataset
                .attendanceDancer;

            const status =
              button.dataset
                .attendanceStatus;

            /*
              Get CURRENT practice,
              not the practice object
              from when the modal opened.
            */

            const livePractice =
              getLivePractice();

            if (!livePractice) {
              return;
            }

            /*
              1. Change live memory.
            */

            setAttendanceStatus(
              livePractice,
              dancerId,
              status
            );

            /*
              2. Save localStorage BEFORE
                 doing anything online.
            */

            saveLocalOnly();

            /*
              3. Change the button
                 immediately.
            */

            const row =
              button.closest(
                "[data-attendance-row]"
              );

            row
              ?.querySelectorAll(
                "[data-attendance-status]"
              )
              .forEach(option => {

                option.classList.toggle(
                  "selected",
                  option.dataset
                    .attendanceStatus ===
                    status
                );
              });

            /*
              4. Update counts immediately.
            */

            drawAttendanceSummary(
              livePractice,
              ensembleIndex
            );

            /*
              5. Send only this attendance
                 mark to Firebase.

              We intentionally do not await
              this before updating the UI.
            */

            saveAttendanceStatusToCloud(
              ensembleIndex,
              practiceId,
              dancerId,
              status
            );
          }
        );
      });

    drawAttendanceSummary(
      practice,
      ensembleIndex
    );
  }


  attendanceSearch
    ?.addEventListener(
      "input",
      renderAttendanceRows
    );


  /* ----------------------------------------------------------
     MARK ALL PRESENT
     ---------------------------------------------------------- */

  document
    .getElementById(
      "markAllPresent"
    )
    ?.addEventListener(
      "click",
      () => {

        const practice =
          getLivePractice();

        const ensemble =
          getLiveEnsemble();

        if (
          !practice ||
          !ensemble
        ) {
          return;
        }

        ensemble.dancers.forEach(
          dancer => {

            setAttendanceStatus(
              practice,
              dancer.id,
              "present"
            );
          }
        );

        /*
          Save locally first.
        */

        saveLocalOnly();

        /*
          Update screen immediately.
        */

        renderAttendanceRows();

        showToast(
          "Everyone marked present"
        );

        /*
          Then Firebase.
        */

        savePracticeAttendanceToCloud(
          ensembleIndex,
          practiceId
        );
      }
    );


  /* ----------------------------------------------------------
     DELETE PRACTICE
     ---------------------------------------------------------- */

  document
    .getElementById(
      "deletePracticeButton"
    )
    ?.addEventListener(
      "click",
      async () => {

        if (
          !confirm(
            "Delete this practice?"
          )
        ) {
          return;
        }

        const ensemble =
          getLiveEnsemble();

        if (!ensemble) {
          return;
        }

        ensemble.practices =
          ensemble.practices
            .filter(
              practice =>
                !sameId(
                  practice.id,
                  practiceId
                )
            );

        saveLocalOnly();

        closeModal();

        renderCalendar();
        renderPractices();

        showToast(
          "Practice deleted"
        );

        await saveData();
      }
    );


  renderAttendanceRows();
}


/* ============================================================
   ATTENDANCE BUTTON
   ============================================================ */

function attendanceButton(
  dancerId,
  value,
  label,
  currentStatus
) {
  return `
    <button
      type="button"
      class="${value} ${
        currentStatus === value
          ? "selected"
          : ""
      }"
      data-attendance-dancer="${escapeHTML(
        dancerId
      )}"
      data-attendance-status="${value}"
    >
      ${label}
    </button>
  `;
}


/* ============================================================
   ATTENDANCE COUNTS
   ============================================================ */

function practiceAttendanceCounts(
  practice,
  ensembleIndex =
    data.selectedEnsemble
) {
  const counts = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0
  };

  const ensemble =
    data.ensembles[
      ensembleIndex
    ];

  if (!ensemble) {
    return counts;
  }

  ensemble.dancers.forEach(
    dancer => {

      const status =
        getAttendanceStatus(
          practice,
          dancer.id
        );

      if (
        Object.prototype
          .hasOwnProperty.call(
            counts,
            status
          )
      ) {
        counts[status]++;
      }
    }
  );

  return counts;
}


function drawAttendanceSummary(
  practice,
  ensembleIndex =
    data.selectedEnsemble
) {
  const container =
    document.getElementById(
      "attendanceSummary"
    );

  if (!container) {
    return;
  }

  const counts =
    practiceAttendanceCounts(
      practice,
      ensembleIndex
    );

  container.innerHTML = `
    ${summaryBox(
      counts.present,
      "Present",
      "present"
    )}

    ${summaryBox(
      counts.late,
      "Late",
      "late"
    )}

    ${summaryBox(
      counts.absent,
      "No Show",
      "absent"
    )}

    ${summaryBox(
      counts.excused,
      "Excused",
      "excused"
    )}
  `;
}


function summaryBox(
  number,
  label,
  className
) {
  return `
    <div
      class="summary-box ${className}"
    >
      <strong>
        ${number}
      </strong>

      <span>
        ${label}
      </span>
    </div>
  `;
}


/* ============================================================
   DANCER ATTENDANCE STATS

   IMPORTANT:
   ONLY "present" counts as present.

   Late + No Show + Excused
   all count as NOT PRESENT.
   ============================================================ */

function attendanceStatsForDancer(
  dancerId
) {
  const practices =
    getSelectedEnsemble()
      .practices;

  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;

  const history = [];

  practices.forEach(
    practice => {

      const status =
        getAttendanceStatus(
          practice,
          dancerId
        );

      if (!status) {
        return;
      }

      if (
        status === "present"
      ) {
        present++;
      }

      if (
        status === "late"
      ) {
        late++;
      }

      if (
        status === "absent"
      ) {
        absent++;
      }

      if (
        status === "excused"
      ) {
        excused++;
      }

      history.push({
        practice,
        status
      });
    }
  );

  const total =
    present +
    late +
    absent +
    excused;

  const percent =
    total > 0
      ? Math.round(
          (
            present /
            total
          ) * 100
        )
      : 0;

  return {
    present,
    late,
    absent,
    excused,
    total,
    percent,
    history
  };
}


/* ============================================================
   ATTENDANCE HISTORY
   ============================================================ */

function showAttendanceHistory(
  dancerId
) {
  const dancer =
    findDancer(
      dancerId
    );

  if (!dancer) {
    return;
  }

  const stats =
    attendanceStatsForDancer(
      dancer.id
    );

  const history =
    [...stats.history]
      .sort(
        (a, b) =>
          String(
            b.practice.date ||
            ""
          ).localeCompare(
            String(
              a.practice.date ||
              ""
            )
          )
      );

  openModal({
    eyebrow: "ATTENDANCE",

    title:
      dancerName(
        dancer
      ),

    back:
      () => {
        showDancer(
          dancer.id
        );
      },

    body: `
      <div class="history-hero">

        <div class="history-percent">
          ${stats.percent}%
        </div>

        <div class="history-caption">
          Present
        </div>

        <div
          class="history-not-present"
        >
          ${
            stats.total > 0
              ? 100 -
                stats.percent
              : 0
          }% Not Present
        </div>

      </div>

      <div
        class="attendance-summary four"
      >

        ${summaryBox(
          stats.present,
          "Present",
          "present"
        )}

        ${summaryBox(
          stats.late,
          "Late",
          "late"
        )}

        ${summaryBox(
          stats.absent,
          "No Show",
          "absent"
        )}

        ${summaryBox(
          stats.excused,
          "Excused",
          "excused"
        )}

      </div>

      ${
        history.length
          ? history
              .map(item => {

                const statusLabel =
                  item.status ===
                    "present"
                    ? "Present"
                    : item.status ===
                      "late"
                    ? "Late"
                    : item.status ===
                      "absent"
                    ? "No Show"
                    : "Excused";

                return `
                  <div
                    class="history-row"
                  >

                    <div>

                      <strong>
                        ${escapeHTML(
                          item.practice
                            .title ||
                          item.practice
                            .name ||
                          "Practice"
                        )}
                      </strong>

                      <p>
                        ${escapeHTML(
                          formatDate(
                            item.practice
                              .date
                          )
                        )}
                      </p>

                    </div>

                    <span
                      class="history-status ${item.status}"
                    >
                      ${statusLabel}
                    </span>

                  </div>
                `;
              })
              .join("")
          : `
            <div class="empty">
              No attendance recorded
            </div>
          `
      }
    `
  });
}


/* ============================================================
   SETTINGS
   ============================================================ */

function renderSettings() {
  if (settingsEnsemble) {
    settingsEnsemble.textContent =
      ensembleName();
  }
}


function showComingSoon(title) {
  openModal({
    eyebrow: "SETTINGS",

    title,

    body: `
      <div class="empty">
        This section will be added
        in a future update.
      </div>
    `
  });
}


/* ============================================================
   INSTRUCTOR NOTES
   ============================================================ */

function setupInstructorNotesButton() {
  const possibleButtons = [
    document.getElementById(
      "instructorNotesButton"
    ),

    document.getElementById(
      "instructorNotes"
    )
  ]
    .filter(Boolean);

  possibleButtons.forEach(
    button => {

      if (
        button.dataset
          .notesReady === "true"
      ) {
        return;
      }

      button.dataset.notesReady =
        "true";

      button.addEventListener(
        "click",
        showInstructorNotes
      );
    }
  );
}


function showInstructorNotes() {
  const ensemble =
    getSelectedEnsemble();

  openModal({
    eyebrow: "SETTINGS",

    title:
      "Instructor Notes",

    body: `
      <div
        class="instructor-notes-page"
      >

        <textarea
          id="instructorNotesInput"
          class="instructor-notes-textarea"
          placeholder="Write instructor notes here..."
        >${escapeHTML(
          ensemble
            .instructorNotes ||
          ""
        )}</textarea>

        <button
          type="button"
          class="primary-button"
          id="saveInstructorNotes"
        >
          Save Notes
        </button>

      </div>
    `
  });

  document
    .getElementById(
      "saveInstructorNotes"
    )
    ?.addEventListener(
      "click",
      async () => {

        ensemble.instructorNotes =
          document
            .getElementById(
              "instructorNotesInput"
            )
            .value;

        saveLocalOnly();

        showToast(
          "Notes saved"
        );

        await saveData();
      }
    );
}


/* ============================================================
   MODAL
   ============================================================ */

let modalBackAction = null;

function openModal({
  eyebrow = "",
  title = "",
  body = "",
  back = null
}) {
  if (
    !modalOverlay ||
    !modalBody
  ) {
    return;
  }

  modalBackAction =
    typeof back === "function"
      ? back
      : null;

  if (modalEyebrow) {
    modalEyebrow.textContent =
      eyebrow;
  }

  if (modalTitle) {
    modalTitle.textContent =
      title;
  }

  modalBody.innerHTML =
    body;

  if (modalBack) {
    modalBack.hidden =
      !modalBackAction;
  }

  modalOverlay.classList.add(
    "open"
  );

  modalOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

  if (modal) {
    modal.scrollTop = 0;
  }
}


function closeModal() {
  if (!modalOverlay) {
    return;
  }

  modalOverlay.classList.remove(
    "open"
  );

  modalOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );

  modalBackAction = null;

  if (modalBody) {
    modalBody.innerHTML = "";
  }
}


/* ============================================================
   MAIN EVENT LISTENERS
   ============================================================ */

navButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const pageId =
          button.dataset.page;

        if (pageId) {
          openPage(
            pageId
          );
        }
      }
    );
  }
);


addDancerButton
  ?.addEventListener(
    "click",
    () => {
      showDancerForm();
    }
  );


addDanceButton
  ?.addEventListener(
    "click",
    () => {
      showDanceForm();
    }
  );


addPracticeButton
  ?.addEventListener(
    "click",
    () => {
      showPracticeForm();
    }
  );


dancerSearch
  ?.addEventListener(
    "input",
    renderDancers
  );


closeModalButton
  ?.addEventListener(
    "click",
    closeModal
  );


modalBack
  ?.addEventListener(
    "click",
    () => {

      if (modalBackAction) {
        const action =
          modalBackAction;

        modalBackAction = null;

        action();
      } else {
        closeModal();
      }
    }
  );


modalOverlay
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modalOverlay
      ) {
        closeModal();
      }
    }
  );


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape" &&
      modalOverlay?.classList
        .contains("open")
    ) {
      closeModal();
    }
  }
);


manageEnsemblesButton
  ?.addEventListener(
    "click",
    () => {
      showComingSoon(
        "Manage Ensembles"
      );
    }
  );


accountsButton
  ?.addEventListener(
    "click",
    () => {
      showComingSoon(
        "Instructor Accounts"
      );
    }
  );


permissionsButton
  ?.addEventListener(
    "click",
    () => {
      showComingSoon(
        "Permissions"
      );
    }
  );


cancelUploadButton
  ?.addEventListener(
    "click",
    hideUpload
  );


/* ============================================================
   CALENDAR CONTROLS
   ============================================================ */

function setupCalendarArrows() {
  const previousButtons = [
    document.getElementById(
      "calendarPrev"
    ),

    document.getElementById(
      "prevMonth"
    )
  ].filter(Boolean);

  const nextButtons = [
    document.getElementById(
      "calendarNext"
    ),

    document.getElementById(
      "nextMonth"
    )
  ].filter(Boolean);

  previousButtons.forEach(
    button => {

      if (
        button.dataset
          .calendarReady ===
        "true"
      ) {
        return;
      }

      button.dataset
        .calendarReady =
        "true";

      button.addEventListener(
        "click",
        () => {

          calendarDate =
            new Date(
              calendarDate
                .getFullYear(),
              calendarDate
                .getMonth() - 1,
              1
            );

          renderCalendar();
        }
      );
    }
  );

  nextButtons.forEach(
    button => {

      if (
        button.dataset
          .calendarReady ===
        "true"
      ) {
        return;
      }

      button.dataset
        .calendarReady =
        "true";

      button.addEventListener(
        "click",
        () => {

          calendarDate =
            new Date(
              calendarDate
                .getFullYear(),
              calendarDate
                .getMonth() + 1,
              1
            );

          renderCalendar();
        }
      );
    }
  );

  todayButton
    ?.addEventListener(
      "click",
      () => {

        const today =
          new Date();

        calendarDate =
          new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );

        selectedCalendarDate =
          dateToInputValue(
            today
          );

        renderCalendar();
        renderPractices();
      }
    );
}


/* ============================================================
   FIREBASE SYNC

   V11 RULES:

   1. Existing local data is kept until Firebase actually loads.

   2. Cloud data is normalized before use.

   3. Pending attendance changes are merged back into the
      incoming snapshot so an older snapshot cannot erase a
      button the instructor just tapped.

   4. Firebase data is saved back to localStorage after merge.

   5. We DO NOT rebuild an open attendance modal here.
   ============================================================ */

function setupFirebaseSync() {
  const fb =
    getFirebase();

  if (!fb) {
    /*
      The Firebase module in index.html
      may still be loading.

      Try again shortly instead of
      starting the app permanently
      without Firebase.
    */

    setTimeout(
      setupFirebaseSync,
      250
    );

    return;
  }

  if (firebaseReady) {
    return;
  }

  firebaseReady = true;

  const cloudReference =
    fb.dbRef(
      fb.database,
      CLOUD_ROOT
    );

  fb.onValue(
    cloudReference,

    snapshot => {

      const cloudData =
        snapshot.val();

      cloudHasLoaded = true;

      /*
        EMPTY FIREBASE

        If the cloud has no database yet,
        upload the phone's existing data.
      */

      if (!cloudData) {

        fb.set(
          cloudReference,
          data
        )
          .then(
            () => {
              console.log(
                "Initial data uploaded"
              );
            }
          )
          .catch(
            error => {

              console.error(
                "Initial Firebase upload failed:",
                error
              );

              showToast(
                "Cloud sync unavailable"
              );
            }
          );

        return;
      }


      /*
        VALID FIREBASE DATA
      */

      if (
        !Array.isArray(
          cloudData.ensembles
        )
      ) {
        console.warn(
          "Cloud data was not in the expected format."
        );

        return;
      }


      /*
        Merge cloud data while preserving
        any local attendance write that
        has not finished syncing yet.
      */

      data =
        mergeCloudDataSafely(
          cloudData
        );

      saveLocalOnly();


      /*
        Refresh background pages.

        IMPORTANT:
        We intentionally do NOT call
        showPractice() or replace
        modalBody here.
      */

      updateEnsembleLabels();

      renderEnsembles();
      renderDancers();
      renderDances();
      renderCalendar();
      renderPractices();
      renderSettings();
    },

    error => {

      console.error(
        "Firebase listener failed:",
        error
      );

      showToast(
        "Cloud sync unavailable"
      );
    }
  );
}


/* ============================================================
   FIREBASE READY EVENT

   index.html dispatches this event once
   its Firebase module is initialized.
   ============================================================ */

window.addEventListener(
  "vukFirebaseReady",
  () => {
    setupFirebaseSync();
  }
);


/* ============================================================
   RENDER EVERYTHING
   ============================================================ */

function renderAll() {
  updateEnsembleLabels();

  renderEnsembles();
  renderDancers();
  renderDances();
  renderCalendar();
  renderPractices();
  renderSettings();
}


/* ============================================================
   STARTUP
   ============================================================ */

function startApp() {
  removeHeaderEnsembleButton();

  setupInstructorNotesButton();

  setupCalendarArrows();

  renderAll();

  const activePage =
    document.querySelector(
      ".page.active"
    );

  if (!activePage) {

    openPage(
      "homePage"
    );

  } else {

    navButtons.forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            activePage.id
        );
      }
    );
  }

  /*
    If Firebase is already available,
    this connects immediately.

    Otherwise setupFirebaseSync()
    retries until index.html finishes
    loading Firebase.
  */

  setupFirebaseSync();
}


startApp();


/* ============================================================
   END SCRIPT.JS — V11
   ============================================================ */
