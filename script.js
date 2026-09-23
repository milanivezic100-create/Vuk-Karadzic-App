/* ============================================================
   VUK KARADZIC PROBE
   SCRIPT.JS
   iPhone-first version
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

  ensembles: ENSEMBLE_NAMES.map(name =>
    blankEnsemble(name)
  )
};


/* ============================================================
   HELPERS
   ============================================================ */

function uid(prefix = "id") {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 9)
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
  return String(value)
    .replace(/\b\w/g, char =>
      char.toUpperCase()
    );
}

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
    .find(dancer =>
      sameId(dancer.id, id)
    );
}

function findDance(id) {
  return getSelectedEnsemble()
    .dances
    .find(dance =>
      sameId(dance.id, id)
    );
}

function findPractice(id) {
  return getSelectedEnsemble()
    .practices
    .find(practice =>
      sameId(practice.id, id)
    );
}

function normalGender(gender) {
  const value =
    String(gender || "")
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

function groupDancers(gender) {
  return getSelectedEnsemble()
    .dancers
    .filter(
      dancer =>
        normalGender(dancer.gender) ===
        gender
    );
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

function showToast(message) {
  if (!appToast) return;

  appToast.textContent = message;
  appToast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(
    () =>
      appToast.classList.remove(
        "show"
      ),
    1800
  );
}

function showUpload(message) {
  if (!uploadOverlay) return;

  if (uploadMessage) {
    uploadMessage.textContent =
      message;
  }

  uploadOverlay.classList.add(
    "open"
  );
}

function hideUpload() {
  uploadOverlay?.classList.remove(
    "open"
  );
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


/* ============================================================
   DATA NORMALIZATION
   ============================================================ */

function normalizeData(raw) {
  if (
    !raw ||
    !Array.isArray(raw.ensembles)
  ) {
    return structuredClone(
      defaultData
    );
  }

  const normalized = {
    ...raw
  };

  normalized.selectedEnsemble =
    Number.isInteger(
      Number(
        normalized.selectedEnsemble
      )
    )
      ? Number(
          normalized.selectedEnsemble
        )
      : 0;

  normalized.selectedEnsemble =
    Math.max(
      0,
      Math.min(
        4,
        normalized.selectedEnsemble
      )
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
              dance => ({
                ...dance,

                id:
                  dance.id ??
                  uid("dance"),

                inUse:
                  typeof dance.inUse ===
                  "boolean"
                    ? dance.inUse
                    : true,

                dancerIds:
                  Array.isArray(
                    dance.dancerIds
                  )
                    ? dance.dancerIds
                    : Array.isArray(
                        dance.dancers
                      )
                    ? dance.dancers
                    : [],

                photos:
                  Array.isArray(
                    dance.photos
                  )
                    ? dance.photos
                    : []
              })
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
   LOAD LOCAL DATA
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

  return structuredClone(
    defaultData
  );
}

let data = loadLocalData();


/* ============================================================
   FIREBASE
   ============================================================ */

let firebaseReady = false;
let applyingCloudUpdate = false;

function getFirebase() {
  return window.vukFirebase || null;
}

function saveLocalOnly() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}

async function saveData() {
  saveLocalOnly();

  if (
    !firebaseReady ||
    applyingCloudUpdate
  ) {
    return;
  }

  const fb = getFirebase();

  if (!fb) return;

  try {
    await fb.set(
      fb.dbRef(
        fb.database,
        CLOUD_ROOT
      ),
      data
    );
  } catch (error) {
    console.error(
      "Firebase save failed:",
      error
    );

    showToast(
      "Saved on this phone"
    );
  }
}


/* ============================================================
   PAGE NAVIGATION
   ============================================================ */

function openPage(pageId) {
  pages.forEach(page => {
    page.classList.toggle(
      "active",
      page.id === pageId
    );
  });

  navButtons.forEach(button => {
    const target =
      button.dataset.page;

    button.classList.toggle(
      "active",
      target === pageId
    );
  });

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
   REMOVE TOP ENSEMBLE BUTTON
   ============================================================ */

function removeHeaderEnsembleButton() {
  if (!ensembleButton) return;

  ensembleButton.style.display =
    "none";

  ensembleButton.setAttribute(
    "aria-hidden",
    "true"
  );
}


/* ============================================================
   ENSEMBLE LABELS
   ============================================================ */

function updateEnsembleLabels() {
  const name = ensembleName();

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
   HOME / ENSEMBLE CHOOSER
   ============================================================ */

function renderEnsembles() {
  if (!ensembleList) return;

  ensembleList.innerHTML =
    data.ensembles
      .map(
        (ensemble, index) => {
          const selected =
            index ===
            data.selectedEnsemble;

          const dancerCount =
            ensemble.dancers?.length ||
            0;

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
              <div class="ensemble-number">
                ${String(
                  index + 1
                ).padStart(2, "0")}
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
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          data.selectedEnsemble =
            Number(
              button.dataset.ensemble
            );

          saveLocalOnly();

          /*
             Selection is still included
             in the existing data model,
             but immediately update this
             device's interface.
          */

          renderAll();

          showToast(
            `${ensembleName()} selected`
          );

          await saveData();
        }
      );
    });
}


/* ============================================================
   DANCER LIST
   ============================================================ */

function renderDancers() {
  if (!dancerList) return;

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
      groupDancers(group.gender);

    if (query) {
      dancers =
        dancers.filter(dancer =>
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
      <section
        class="roster-section"
      >
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
        <div class="empty compact-empty">
          No dancers
        </div>
      `;
    } else {
      dancers.forEach(
        (dancer, index) => {
          const number =
            String(
              index + 1
            ).padStart(2, "0");

          const numberClass =
            group.gender === "Male"
              ? "boy"
              : group.gender ===
                "Female"
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

                <span class="dancer-name">
                  ${escapeHTML(
                    dancerName(
                      dancer
                    )
                  )}
                </span>

                <span class="dancer-height">
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

  dancerList.innerHTML = html;

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
   DANCER FORM
   ============================================================ */

function showDancer(id) {
  const dancer =
    findDancer(id);

  if (!dancer) return;

  const stats =
    attendanceStatsForDancer(
      dancer.id
    );

  openModal({
    eyebrow: "DANCER",
    title: dancerName(dancer),

    body: `
      <div class="profile-card">
        <div class="profile-name">
          ${escapeHTML(
            dancerName(dancer)
          )}
        </div>

        <div class="profile-grid">
          <div class="profile-stat">
            <span>Gender</span>
            <strong>
              ${escapeHTML(
                normalGender(
                  dancer.gender
                )
              )}
            </strong>
          </div>

          <div class="profile-stat">
            <span>Height</span>
            <strong>
              ${escapeHTML(
                dancer.height ||
                "—"
              )}
            </strong>
          </div>

          <div class="profile-stat">
            <span>Shoe Size</span>
            <strong>
              ${escapeHTML(
                dancer.shoeSize ||
                "—"
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
            <div class="attendance-percent">
              <strong>
                ${stats.percent}%
              </strong>

              <span>
                Present
              </span>
            </div>

            <div class="not-present-percent">
              ${
                100 -
                stats.percent
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
              <h3>Notes</h3>
              <p>${escapeHTML(
                dancer.notes
              )}</p>
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
      () =>
        showDancerForm(
          dancer.id
        )
    );

  document
    .getElementById(
      "openAttendanceHistory"
    )
    ?.addEventListener(
      "click",
      () =>
        showAttendanceHistory(
          dancer.id
        )
    );
}

function showDancerForm(id = null) {
  const dancer =
    id ? findDancer(id) : null;

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
              Boy
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
              Girl
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

        <div class="form-row">

          <div class="form-group">
            <label>
              Height
            </label>

            <input
              id="dancerHeightInput"
              value="${escapeHTML(
                dancer?.height || ""
              )}"
              placeholder="e.g. 175 cm"
            >
          </div>

          <div class="form-group">
            <label>
              Shoe Size
            </label>

            <input
              id="dancerShoeInput"
              value="${escapeHTML(
                dancer?.shoeSize ||
                ""
              )}"
            >
          </div>

        </div>

        <div class="form-group">
          <label>
            Notes
          </label>

          <textarea
            id="dancerNotesInput"
            placeholder="Notes about this dancer..."
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

        if (!name) return;

        const values = {
          name,

          gender:
            document.getElementById(
              "dancerGenderInput"
            ).value,

          height:
            document
              .getElementById(
                "dancerHeightInput"
              )
              .value
              .trim(),

          shoeSize:
            document
              .getElementById(
                "dancerShoeInput"
              )
              .value
              .trim(),

          notes:
            document
              .getElementById(
                "dancerNotesInput"
              )
              .value
              .trim()
        };

        if (dancer) {
          Object.assign(
            dancer,
            values
          );
        } else {
          getSelectedEnsemble()
            .dancers
            .push({
              id: uid("dancer"),
              ...values
            });
        }

        await saveData();

        closeModal();

        renderDancers();

        showToast(
          dancer
            ? "Dancer updated"
            : "Dancer added"
        );
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
            `Delete ${dancerName(
              dancer
            )}?`
          )
        ) {
          return;
        }

        const ensemble =
          getSelectedEnsemble();

        ensemble.dancers =
          ensemble.dancers.filter(
            item =>
              !sameId(
                item.id,
                dancer.id
              )
          );

        ensemble.dances.forEach(
          dance => {
            dance.dancerIds =
              (
                dance.dancerIds ||
                []
              ).filter(
                dancerId =>
                  !sameId(
                    dancerId,
                    dancer.id
                  )
              );
          }
        );

        await saveData();

        closeModal();

        renderDancers();

        showToast(
          "Dancer deleted"
        );
      }
    );
}


/* ============================================================
   DANCES
   ============================================================ */

function renderDances() {
  if (!danceList) return;

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

  danceList.innerHTML = `
    ${danceSectionHTML(
      "IN USE",
      "in-use",
      inUse
    )}

    ${danceSectionHTML(
      "NOT IN USE",
      "not-in-use",
      notInUse
    )}
  `;

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

function danceSectionHTML(
  label,
  statusClass,
  dances
) {
  return `
    <section
      class="dance-section ${statusClass}"
    >
      <div
        class="dance-section-heading"
      >
        <div
          class="dance-status-title ${statusClass}"
        >
          ${label}
        </div>
      </div>

      <div
        class="dance-group-list"
        data-dance-list="${statusClass}"
      >

        ${
          dances.length === 0
            ? `
              <div
                class="empty compact-empty dance-empty"
              >
                No dances
              </div>
            `
            : dances
                .map(
                  (dance, index) =>
                    danceRowHTML(
                      dance,
                      index,
                      statusClass
                    )
                )
                .join("")
        }

      </div>
    </section>
  `;
}

function danceRowHTML(
  dance,
  index,
  statusClass
) {
  const number =
    String(index + 1)
      .padStart(2, "0");

  return `
    <div
      class="dance-row draggable-row ${statusClass}"
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
        <span
          class="dance-number ${statusClass}"
        >
          ${number}
        </span>

        <span
          class="dance-card-content"
        >
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
    </div>
  `;
}


/* ============================================================
   DANCE DETAILS
   ============================================================ */

function showDance(id) {
  const dance =
    findDance(id);

  if (!dance) return;

  const dancers =
    (
      dance.dancerIds || []
    )
      .map(id =>
        findDancer(id)
      )
      .filter(Boolean);

  openModal({
    eyebrow: "REPERTOIRE",

    title:
      dance.name ||
      "Dance",

    body: `
      <div
        class="dance-detail-status ${
          dance.inUse === false
            ? "not-in-use"
            : "in-use"
        }"
      >
        ${
          dance.inUse === false
            ? "NOT IN USE"
            : "IN USE"
        }
      </div>

      <div class="detail-card">
        <span class="detail-label">
          Choreographer
        </span>

        <div class="detail-value">
          ${escapeHTML(
            dance.choreographer ||
            "—"
          )}
        </div>
      </div>

      ${
        dancers.length
          ? `
            <h3 class="detail-heading">
              Dancers
            </h3>

            <div
              class="selected-dancer-list"
            >
              ${dancers
                .map(
                  (dancer, index) => `
                    <div
                      class="selected-dancer"
                    >
                      <span>
                        ${String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <strong>
                        ${escapeHTML(
                          dancerName(
                            dancer
                          )
                        )}
                      </strong>
                    </div>
                  `
                )
                .join("")}
            </div>
          `
          : ""
      }

      ${danceMediaHTML(
        dance
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

  document
    .getElementById(
      "editDanceButton"
    )
    ?.addEventListener(
      "click",
      () =>
        showDanceForm(
          dance.id
        )
    );

  setupDanceMediaEvents(
    dance
  );
}


/* ============================================================
   DANCE FORM
   ============================================================ */

function showDanceForm(id = null) {
  const dance =
    id ? findDance(id) : null;

  const selectedIds =
    dance
      ? [
          ...(
            dance.dancerIds ||
            []
          )
        ]
      : [];

  let selectedStatus =
    dance?.inUse === false
      ? false
      : true;

  openModal({
    eyebrow: "REPERTOIRE",

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
            Dance Status
          </label>

          <div
            class="dance-status-selector"
          >
            <button
              type="button"
              class="dance-status-option in-use ${
                selectedStatus
                  ? "selected"
                  : ""
              }"
              data-status-value="true"
            >
              <span
                class="status-dot"
              ></span>

              <span>
                <strong>
                  In Use
                </strong>
              </span>
            </button>

            <button
              type="button"
              class="dance-status-option not-in-use ${
                !selectedStatus
                  ? "selected"
                  : ""
              }"
              data-status-value="false"
            >
              <span
                class="status-dot"
              ></span>

              <span>
                <strong>
                  Not In Use
                </strong>
              </span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>
            Dancers
          </label>

          <div id="danceDancerPicker">
            ${danceDancerPickerHTML(
              selectedIds
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

  /*
     STATUS BUTTONS
     This is intentionally handled
     directly instead of relying on
     form values.
  */

  document
    .querySelectorAll(
      "[data-status-value]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          event.preventDefault();

          selectedStatus =
            button.dataset
              .statusValue ===
            "true";

          document
            .querySelectorAll(
              "[data-status-value]"
            )
            .forEach(option => {
              option.classList.toggle(
                "selected",
                option === button
              );
            });
        }
      );
    });

  /*
     DANCER CHECKBOX BUTTONS
  */

  document
    .querySelectorAll(
      "[data-pick-dancer]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          event.preventDefault();

          const dancerId =
            button.dataset
              .pickDancer;

          const existingIndex =
            selectedIds.findIndex(
              id =>
                sameId(
                  id,
                  dancerId
                )
            );

          if (
            existingIndex >= 0
          ) {
            selectedIds.splice(
              existingIndex,
              1
            );

            button.classList.remove(
              "selected"
            );
          } else {
            selectedIds.push(
              dancerId
            );

            button.classList.add(
              "selected"
            );
          }
        }
      );
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

        if (!name) return;

        const values = {
          name,

          choreographer:
            document
              .getElementById(
                "danceChoreographerInput"
              )
              .value
              .trim(),

          inUse:
            selectedStatus,

          dancerIds:
            [...selectedIds]
        };

        if (dance) {
          Object.assign(
            dance,
            values
          );
        } else {
          getSelectedEnsemble()
            .dances
            .push({
              id: uid("dance"),
              ...values,
              photos: [],
              music: null
            });
        }

        await saveData();

        closeModal();

        renderDances();

        showToast(
          dance
            ? "Dance updated"
            : "Dance added"
        );
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
            `Delete ${
              dance.name ||
              "this dance"
            }?`
          )
        ) {
          return;
        }

        const ensemble =
          getSelectedEnsemble();

        ensemble.dances =
          ensemble.dances.filter(
            item =>
              !sameId(
                item.id,
                dance.id
              )
          );

        await saveData();

        closeModal();

        renderDances();

        showToast(
          "Dance deleted"
        );
      }
    );
}

function danceDancerPickerHTML(
  selectedIds
) {
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
      const dancers =
        groupDancers(
          group.gender
        );

      if (!dancers.length) {
        return "";
      }

      return `
        <div
          class="picker-group"
        >
          <div
            class="mini-group-title ${group.className}"
          >
            ${group.label}
          </div>

          <div
            class="dance-picker"
          >
            ${dancers
              .map(dancer => {
                const selected =
                  selectedIds.some(
                    id =>
                      sameId(
                        id,
                        dancer.id
                      )
                  );

                return `
                  <button
                    type="button"
                    class="edit-dancer-row ${
                      selected
                        ? "selected"
                        : ""
                    }"
                    data-pick-dancer="${escapeHTML(
                      dancer.id
                    )}"
                  >
                    <span>
                      ${escapeHTML(
                        dancerName(
                          dancer
                        )
                      )}
                    </span>

                    <span
                      class="checkmark"
                    >
                      ✓
                    </span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");
}


/* ============================================================
   DANCE MEDIA
   ============================================================ */

function danceMediaHTML(dance) {
  const photos =
    Array.isArray(dance.photos)
      ? dance.photos
      : [];

  const music =
    dance.music || null;

  return `
    <h3 class="detail-heading">
      Photos
    </h3>

    ${
      photos.length
        ? `
          <div class="media-grid">
            ${photos
              .map(
                photo => `
                  <div
                    class="media-tile"
                  >
                    <img
                      src="${escapeHTML(
                        photo.url || ""
                      )}"
                      alt=""
                    >

                    <button
                      type="button"
                      class="media-delete"
                      data-delete-photo="${escapeHTML(
                        photo.path ||
                        photo.url ||
                        ""
                      )}"
                    >
                      ×
                    </button>
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : `
          <div class="file-box">
            No photos
          </div>
        `
    }

    <label
      class="upload-button"
    >
      Add Photo

      <input
        id="dancePhotoUpload"
        type="file"
        accept="image/*"
        hidden
      >
    </label>

    <h3 class="detail-heading">
      Music
    </h3>

    ${
      music?.url
        ? `
          <div class="audio-card">
            <strong>
              ${escapeHTML(
                music.name ||
                "Dance Music"
              )}
            </strong>

            <audio
              controls
              preload="metadata"
              src="${escapeHTML(
                music.url
              )}"
            ></audio>
          </div>

          <button
            type="button"
            class="danger-button compact"
            id="deleteDanceMusic"
          >
            Delete Music
          </button>
        `
        : `
          <div class="file-box">
            No music added
          </div>
        `
    }

    <label
      class="upload-button"
    >
      ${
        music?.url
          ? "Replace Music"
          : "Add Music"
      }

      <input
        id="danceMusicUpload"
        type="file"
        accept="audio/*"
        hidden
      >
    </label>
  `;
}

function setupDanceMediaEvents(
  dance
) {
  const photoInput =
    document.getElementById(
      "dancePhotoUpload"
    );

  photoInput?.addEventListener(
    "change",
    async () => {
      const file =
        photoInput.files?.[0];

      if (!file) return;

      await uploadDancePhoto(
        dance,
        file
      );
    }
  );

  const musicInput =
    document.getElementById(
      "danceMusicUpload"
    );

  musicInput?.addEventListener(
    "change",
    async () => {
      const file =
        musicInput.files?.[0];

      if (!file) return;

      await uploadDanceMusic(
        dance,
        file
      );
    }
  );

  document
    .querySelectorAll(
      "[data-delete-photo]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          await deleteDancePhoto(
            dance,
            button.dataset
              .deletePhoto
          );
        }
      );
    });

  document
    .getElementById(
      "deleteDanceMusic"
    )
    ?.addEventListener(
      "click",
      async () => {
        await deleteDanceMusic(
          dance
        );
      }
    );
}

async function uploadDancePhoto(
  dance,
  file
) {
  const fb = getFirebase();

  if (!fb?.storage) {
    showToast(
      "Storage is not available"
    );
    return;
  }

  try {
    showUpload(
      "Uploading photo..."
    );

    const path =
      `dance-media/` +
      `${dance.id}/photos/` +
      `${uid("photo")}-` +
      `${file.name}`;

    const fileRef =
      fb.storageRef(
        fb.storage,
        path
      );

    await fb.uploadBytes(
      fileRef,
      file
    );

    const url =
      await fb.getDownloadURL(
        fileRef
      );

    if (
      !Array.isArray(
        dance.photos
      )
    ) {
      dance.photos = [];
    }

    dance.photos.push({
      url,
      path,
      name: file.name
    });

    await saveData();

    hideUpload();

    showDance(dance.id);

    showToast(
      "Photo uploaded"
    );
  } catch (error) {
    console.error(error);

    hideUpload();

    showToast(
      "Photo upload failed"
    );
  }
}

async function deleteDancePhoto(
  dance,
  key
) {
  if (
    !confirm(
      "Delete this photo?"
    )
  ) {
    return;
  }

  const photo =
    (
      dance.photos || []
    ).find(
      item =>
        item.path === key ||
        item.url === key
    );

  const fb = getFirebase();

  try {
    if (
      photo?.path &&
      fb?.storage
    ) {
      await fb.deleteObject(
        fb.storageRef(
          fb.storage,
          photo.path
        )
      );
    }
  } catch (error) {
    console.warn(
      "Storage delete:",
      error
    );
  }

  dance.photos =
    (
      dance.photos || []
    ).filter(
      item =>
        item.path !== key &&
        item.url !== key
    );

  await saveData();

  showDance(dance.id);
}

async function uploadDanceMusic(
  dance,
  file
) {
  const fb = getFirebase();

  if (!fb?.storage) {
    showToast(
      "Storage is not available"
    );
    return;
  }

  try {
    showUpload(
      "Uploading music..."
    );

    const path =
      `dance-media/` +
      `${dance.id}/music/` +
      `${uid("music")}-` +
      `${file.name}`;

    const newRef =
      fb.storageRef(
        fb.storage,
        path
      );

    await fb.uploadBytes(
      newRef,
      file
    );

    const url =
      await fb.getDownloadURL(
        newRef
      );

    const oldMusic =
      dance.music;

    dance.music = {
      url,
      path,
      name: file.name
    };

    await saveData();

    /*
       Delete old music only AFTER
       the replacement has uploaded
       successfully.
    */

    if (
      oldMusic?.path &&
      oldMusic.path !== path
    ) {
      try {
        await fb.deleteObject(
          fb.storageRef(
            fb.storage,
            oldMusic.path
          )
        );
      } catch (error) {
        console.warn(
          "Old music delete:",
          error
        );
      }
    }

    hideUpload();

    showDance(dance.id);

    showToast(
      "Music uploaded"
    );
  } catch (error) {
    console.error(error);

    hideUpload();

    showToast(
      "Music upload failed"
    );
  }
}

async function deleteDanceMusic(
  dance
) {
  if (
    !confirm(
      "Delete this music?"
    )
  ) {
    return;
  }

  const fb = getFirebase();

  try {
    if (
      dance.music?.path &&
      fb?.storage
    ) {
      await fb.deleteObject(
        fb.storageRef(
          fb.storage,
          dance.music.path
        )
      );
    }
  } catch (error) {
    console.warn(error);
  }

  dance.music = null;

  await saveData();

  showDance(dance.id);
}


/* ============================================================
   REORDERING
   Touch / pointer friendly
   ============================================================ */

let dragState = null;
let suppressClickUntil = 0;

function beginReorder({
  event,
  row,
  list,
  type
}) {
  if (
    event.pointerType ===
      "mouse" &&
    event.button !== 0
  ) {
    return;
  }

  dragState = {
    pointerId:
      event.pointerId,

    row,
    list,
    type,

    startX:
      event.clientX,

    startY:
      event.clientY,

    active: false
  };

  row.setPointerCapture?.(
    event.pointerId
  );
}

function moveReorder(event) {
  if (
    !dragState ||
    event.pointerId !==
      dragState.pointerId
  ) {
    return;
  }

  const distance =
    Math.hypot(
      event.clientX -
        dragState.startX,

      event.clientY -
        dragState.startY
    );

  if (
    !dragState.active &&
    distance < 9
  ) {
    return;
  }

  if (!dragState.active) {
    dragState.active = true;

    dragState.row.classList.add(
      "dragging"
    );

    document.body.classList.add(
      "reordering"
    );
  }

  event.preventDefault();

  const element =
    document.elementFromPoint(
      event.clientX,
      event.clientY
    );

  if (!element) return;

  let targetList;

  if (
    dragState.type === "dance"
  ) {
    targetList =
      element.closest(
        "[data-dance-list]"
      );
  } else {
    targetList =
      element.closest(
        "[data-dancer-list]"
      );

    if (
      targetList &&
      targetList.dataset
        .dancerList !==
        dragState.list.dataset
          .dancerList
    ) {
      return;
    }
  }

  if (!targetList) return;

  /*
     Remove empty placeholder
     while dragging into a list.
  */

  targetList
    .querySelector(
      ".dance-empty"
    )
    ?.remove();

  const selector =
    dragState.type === "dance"
      ? "[data-dance-row]"
      : "[data-dancer-row]";

  const rows =
    [
      ...targetList
        .querySelectorAll(
          selector
        )
    ].filter(
      row =>
        row !==
        dragState.row
    );

  const before =
    rows.find(row => {
      const rect =
        row.getBoundingClientRect();

      return (
        event.clientY <
        rect.top +
          rect.height / 2
      );
    });

  if (before) {
    targetList.insertBefore(
      dragState.row,
      before
    );
  } else {
    targetList.appendChild(
      dragState.row
    );
  }

  dragState.list =
    targetList;
}

async function endReorder(event) {
  if (
    !dragState ||
    event.pointerId !==
      dragState.pointerId
  ) {
    return;
  }

  const wasActive =
    dragState.active;

  dragState.row.classList.remove(
    "dragging"
  );

  document.body.classList.remove(
    "reordering"
  );

  const type =
    dragState.type;

  dragState = null;

  if (!wasActive) {
    return;
  }

  suppressClickUntil =
    Date.now() + 350;

  if (type === "dance") {
    await saveDanceOrderFromDOM();
  } else {
    await saveDancerOrderFromDOM();
  }
}

function setupDancerReordering() {
  dancerList
    ?.querySelectorAll(
      "[data-dancer-row]"
    )
    .forEach(row => {
      const list =
        row.closest(
          "[data-dancer-list]"
        );

      row.addEventListener(
        "pointerdown",
        event =>
          beginReorder({
            event,
            row,
            list,
            type: "dancer"
          })
      );

      row.addEventListener(
        "pointermove",
        moveReorder
      );

      row.addEventListener(
        "pointerup",
        endReorder
      );

      row.addEventListener(
        "pointercancel",
        endReorder
      );
    });
}

function setupDanceReordering() {
  danceList
    ?.querySelectorAll(
      "[data-dance-row]"
    )
    .forEach(row => {
      const list =
        row.closest(
          "[data-dance-list]"
        );

      row.addEventListener(
        "pointerdown",
        event =>
          beginReorder({
            event,
            row,
            list,
            type: "dance"
          })
      );

      row.addEventListener(
        "pointermove",
        moveReorder
      );

      row.addEventListener(
        "pointerup",
        endReorder
      );

      row.addEventListener(
        "pointercancel",
        endReorder
      );
    });
}

async function saveDancerOrderFromDOM() {
  const ensemble =
    getSelectedEnsemble();

  const genders = [
    "Male",
    "Female",
    "Other"
  ];

  const ordered = [];

  genders.forEach(gender => {
    const list =
      dancerList.querySelector(
        `[data-dancer-list="${gender}"]`
      );

    if (!list) return;

    list
      .querySelectorAll(
        "[data-dancer-row]"
      )
      .forEach(row => {
        const dancer =
          findDancer(
            row.dataset
              .dancerRow
          );

        if (dancer) {
          ordered.push(dancer);
        }
      });
  });

  const remaining =
    ensemble.dancers.filter(
      dancer =>
        !ordered.some(
          item =>
            sameId(
              item.id,
              dancer.id
            )
        )
    );

  ensemble.dancers = [
    ...ordered,
    ...remaining
  ];

  await saveData();

  renderDancers();
}

async function saveDanceOrderFromDOM() {
  const ensemble =
    getSelectedEnsemble();

  const ordered = [];

  const inUseList =
    danceList.querySelector(
      '[data-dance-list="in-use"]'
    );

  const notInUseList =
    danceList.querySelector(
      '[data-dance-list="not-in-use"]'
    );

  inUseList
    ?.querySelectorAll(
      "[data-dance-row]"
    )
    .forEach(row => {
      const dance =
        findDance(
          row.dataset
            .danceRow
        );

      if (!dance) return;

      dance.inUse = true;

      ordered.push(dance);
    });

  notInUseList
    ?.querySelectorAll(
      "[data-dance-row]"
    )
    .forEach(row => {
      const dance =
        findDance(
          row.dataset
            .danceRow
        );

      if (!dance) return;

      dance.inUse = false;

      ordered.push(dance);
    });

  const remaining =
    ensemble.dances.filter(
      dance =>
        !ordered.some(
          item =>
            sameId(
              item.id,
              dance.id
            )
        )
    );

  ensemble.dances = [
    ...ordered,
    ...remaining
  ];

  await saveData();

  renderDances();
}


/* ============================================================
   CALENDAR
   ============================================================ */

let calendarDate =
  new Date();

let selectedCalendarDate =
  new Date();

function dateKey(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

  calendarMonth.textContent =
    new Date(
      year,
      month,
      1
    ).toLocaleDateString(
      "en-CA",
      {
        month: "long",
        year: "numeric"
      }
    );

  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const start =
    new Date(
      year,
      month,
      1 - firstDay.getDay()
    );

  const todayKey =
    dateKey(new Date());

  const selectedKey =
    dateKey(
      selectedCalendarDate
    );

  const practices =
    getSelectedEnsemble()
      .practices;

  let html = "";

  for (
    let index = 0;
    index < 42;
    index++
  ) {
    const day =
      new Date(start);

    day.setDate(
      start.getDate() + index
    );

    const key =
      dateKey(day);

    const eventCount =
      practices.filter(
        practice =>
          practice.date === key
      ).length;

    const otherMonth =
      day.getMonth() !==
      month;

    html += `
      <button
        type="button"
        class="calendar-day
          ${
            otherMonth
              ? "other-month"
              : ""
          }
          ${
            key === todayKey
              ? "today"
              : ""
          }
          ${
            key === selectedKey
              ? "selected"
              : ""
          }"
        data-calendar-date="${key}"
      >
        <span class="day-number">
          ${day.getDate()}
        </span>

        ${
          eventCount
            ? `
              <span class="event-dots">
                ${Array.from({
                  length:
                    Math.min(
                      eventCount,
                      3
                    )
                })
                  .map(
                    () =>
                      `<i class="event-dot"></i>`
                  )
                  .join("")}
              </span>
            `
            : ""
        }
      </button>
    `;
  }

  calendarGrid.innerHTML = html;

  calendarGrid
    .querySelectorAll(
      "[data-calendar-date]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          selectedCalendarDate =
            new Date(
              button.dataset
                .calendarDate +
                "T12:00:00"
            );

          renderCalendar();
          renderPractices();
        }
      );
    });
}


/* ============================================================
   PRACTICES
   ============================================================ */

function renderPractices() {
  if (!practiceList) return;

  const selected =
    dateKey(
      selectedCalendarDate
    );

  const practices =
    getSelectedEnsemble()
      .practices
      .filter(
        practice =>
          practice.date ===
          selected
      )
      .sort((a, b) =>
        String(
          a.startTime || ""
        ).localeCompare(
          String(
            b.startTime || ""
          )
        )
      );

  if (!practices.length) {
    practiceList.innerHTML = `
      <div class="empty">
        No practices
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
            class="item-card"
            data-practice="${escapeHTML(
              practice.id
            )}"
          >
            <div class="practice-date">
              ${formatTime(
                practice.startTime
              )}
            </div>

            <div class="item-main">
              <h3>
                ${escapeHTML(
                  practice.name ||
                  "Proba"
                )}
              </h3>

              <p>
                ${
                  practice.endTime
                    ? formatTime(
                        practice.endTime
                      )
                    : ""
                }
              </p>
            </div>

            <span class="item-arrow">
              ›
            </span>
          </button>
        `
      )
      .join("");

  practiceList
    .querySelectorAll(
      "[data-practice]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () =>
          showPractice(
            button.dataset
              .practice
          )
      );
    });
}

function showPracticeForm() {
  const defaultDate =
    dateKey(
      selectedCalendarDate
    );

  openModal({
    eyebrow: "PRACTICE",
    title: "Add Practice",

    body: `
      <form id="practiceForm">

        <div class="form-group">
          <label>
            Name
          </label>

          <input
            id="practiceName"
            value="Proba"
          >
        </div>

        <div class="form-group">
          <label>
            Date
          </label>

          <input
            type="date"
            id="practiceDate"
            value="${defaultDate}"
            required
          >
        </div>

        <div class="form-row">

          <div class="form-group">
            <label>
              Start
            </label>

            <input
              type="time"
              id="practiceStart"
              required
            >
          </div>

          <div class="form-group">
            <label>
              End
            </label>

            <input
              type="time"
              id="practiceEnd"
            >
          </div>

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

  document
    .getElementById(
      "practiceForm"
    )
    ?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const practice = {
          id:
            uid("practice"),

          name:
            document
              .getElementById(
                "practiceName"
              )
              .value
              .trim() ||
            "Proba",

          date:
            document.getElementById(
              "practiceDate"
            ).value,

          startTime:
            document.getElementById(
              "practiceStart"
            ).value,

          endTime:
            document.getElementById(
              "practiceEnd"
            ).value,

          attendance: {}
        };

        getSelectedEnsemble()
          .practices
          .push(practice);

        selectedCalendarDate =
          new Date(
            practice.date +
              "T12:00:00"
          );

        calendarDate =
          new Date(
            selectedCalendarDate
          );

        await saveData();

        closeModal();

        renderCalendar();
        renderPractices();

        showToast(
          "Practice added"
        );
      }
    );
}


/* ============================================================
   ATTENDANCE
   ============================================================ */

function showPractice(id) {
  const practice =
    findPractice(id);

  if (!practice) return;

  const dancers =
    getSelectedEnsemble()
      .dancers;

  const attendance =
    practice.attendance ||
    (practice.attendance = {});

  openModal({
    eyebrow: "PRACTICE",

    title:
      practice.name ||
      "Proba",

    body: `
      <div class="detail-card">
        <div class="detail-value">
          ${formatDate(
            practice.date
          )}
        </div>

        <div class="practice-time">
          ${formatTime(
            practice.startTime
          )}
          ${
            practice.endTime
              ? ` – ${formatTime(
                  practice.endTime
                )}`
              : ""
          }
        </div>
      </div>

      <button
        type="button"
        class="mark-all-button"
        id="markAllPresent"
      >
        ✓ Mark All Present
      </button>

      <div
        id="attendanceSummary"
      ></div>

      <div class="search-box attendance-search">
        <span>⌕</span>

        <input
          id="attendanceSearch"
          placeholder="Search dancers..."
        >
      </div>

      <div
        class="mini-group-title"
      >
        ATTENDANCE
      </div>

      <div
        id="attendanceList"
      ></div>
    `
  });

  const attendanceList =
    document.getElementById(
      "attendanceList"
    );

  const search =
    document.getElementById(
      "attendanceSearch"
    );

  function drawAttendance() {
    const query =
      String(
        search?.value || ""
      )
        .trim()
        .toLowerCase();

    const visible =
      dancers.filter(
        dancer =>
          dancerName(dancer)
            .toLowerCase()
            .includes(query)
      );

    attendanceList.innerHTML =
      visible
        .map(dancer => {
          const current =
            getAttendanceStatus(
              attendance,
              dancer.id
            );

          return `
            <div
              class="attendance-row"
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
                data-attendance-dancer="${escapeHTML(
                  dancer.id
                )}"
              >
                ${attendanceButton(
                  "present",
                  "Present",
                  current
                )}

                ${attendanceButton(
                  "late",
                  "Late",
                  current
                )}

                ${attendanceButton(
                  "absent",
                  "No Show",
                  current
                )}

                ${attendanceButton(
                  "excused",
                  "Excused",
                  current
                )}
              </div>
            </div>
          `;
        })
        .join("");

    attendanceList
      .querySelectorAll(
        "[data-attendance-status]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          async () => {
            const group =
              button.closest(
                "[data-attendance-dancer]"
              );

            const dancerId =
              group.dataset
                .attendanceDancer;

            const status =
              button.dataset
                .attendanceStatus;

            setAttendanceStatus(
              attendance,
              dancerId,
              status
            );

            /*
               Instant visual update
               before network save.
            */

            group
              .querySelectorAll(
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

            drawAttendanceSummary(
              practice
            );

            await saveData();
          }
        );
      });

    drawAttendanceSummary(
      practice
    );
  }

  search?.addEventListener(
    "input",
    drawAttendance
  );

  document
    .getElementById(
      "markAllPresent"
    )
    ?.addEventListener(
      "click",
      async () => {
        dancers.forEach(
          dancer => {
            setAttendanceStatus(
              attendance,
              dancer.id,
              "present"
            );
          }
        );

        /*
           Update immediately.
        */

        drawAttendance();

        await saveData();

        showToast(
          "Everyone marked present"
        );
      }
    );

  drawAttendance();
}

function attendanceButton(
  status,
  label,
  current
) {
  return `
    <button
      type="button"
      class="${status} ${
        current === status
          ? "selected"
          : ""
      }"
      data-attendance-status="${status}"
    >
      ${label}
    </button>
  `;
}

function getAttendanceStatus(
  attendance,
  dancerId
) {
  const key =
    Object.keys(
      attendance || {}
    ).find(key =>
      sameId(
        key,
        dancerId
      )
    );

  return key
    ? attendance[key]
    : null;
}

function setAttendanceStatus(
  attendance,
  dancerId,
  status
) {
  const existing =
    Object.keys(
      attendance || {}
    ).find(key =>
      sameId(
        key,
        dancerId
      )
    );

  if (existing) {
    attendance[existing] =
      status;
  } else {
    attendance[
      String(dancerId)
    ] = status;
  }
}

function practiceAttendanceCounts(
  practice
) {
  const values =
    Object.values(
      practice.attendance || {}
    );

  return {
    present:
      values.filter(
        value =>
          value === "present"
      ).length,

    late:
      values.filter(
        value =>
          value === "late"
      ).length,

    absent:
      values.filter(
        value =>
          value === "absent"
      ).length,

    excused:
      values.filter(
        value =>
          value === "excused"
      ).length
  };
}

function drawAttendanceSummary(
  practice
) {
  const container =
    document.getElementById(
      "attendanceSummary"
    );

  if (!container) return;

  const counts =
    practiceAttendanceCounts(
      practice
    );

  container.innerHTML = `
    <div
      class="attendance-summary four"
    >
      ${summaryBox(
        "present",
        counts.present,
        "PRESENT"
      )}

      ${summaryBox(
        "late",
        counts.late,
        "LATE"
      )}

      ${summaryBox(
        "absent",
        counts.absent,
        "NO SHOW"
      )}

      ${summaryBox(
        "excused",
        counts.excused,
        "EXCUSED"
      )}
    </div>
  `;
}

function summaryBox(
  className,
  number,
  label
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
   ATTENDANCE HISTORY
   Only Present counts as Present.
   Late, No Show and Excused count
   as Not Present.
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

  practices.forEach(
    practice => {
      const status =
        getAttendanceStatus(
          practice.attendance ||
            {},
          dancerId
        );

      if (!status) return;

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
    }
  );

  const total =
    present +
    late +
    absent +
    excused;

  const percent =
    total
      ? Math.round(
          (present / total) *
            100
        )
      : 0;

  return {
    present,
    late,
    absent,
    excused,
    total,
    percent
  };
}

function showAttendanceHistory(
  dancerId
) {
  const dancer =
    findDancer(dancerId);

  if (!dancer) return;

  const stats =
    attendanceStatsForDancer(
      dancer.id
    );

  const history =
    getSelectedEnsemble()
      .practices
      .map(practice => ({
        practice,
        status:
          getAttendanceStatus(
            practice.attendance ||
              {},
            dancer.id
          )
      }))
      .filter(
        item => item.status
      )
      .sort(
        (a, b) =>
          String(
            b.practice.date
          ).localeCompare(
            String(
              a.practice.date
            )
          )
      );

  openModal({
    eyebrow: "ATTENDANCE",
    title: dancerName(dancer),

    body: `
      <div class="history-hero">
        <div class="history-percent">
          ${stats.percent}%
        </div>

        <div class="history-caption">
          Present
        </div>

        <div class="history-not-present">
          ${
            stats.total
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
          "present",
          stats.present,
          "PRESENT"
        )}

        ${summaryBox(
          "late",
          stats.late,
          "LATE"
        )}

        ${summaryBox(
          "absent",
          stats.absent,
          "NO SHOW"
        )}

        ${summaryBox(
          "excused",
          stats.excused,
          "EXCUSED"
        )}
      </div>

      ${
        history.length
          ? history
              .map(item => `
                <div
                  class="history-row"
                >
                  <div>
                    <strong>
                      ${escapeHTML(
                        item.practice
                          .name ||
                        "Proba"
                      )}
                    </strong>

                    <p>
                      ${formatDate(
                        item.practice
                          .date
                      )}
                    </p>
                  </div>

                  <span
                    class="history-status ${
                      item.status
                    }"
                  >
                    ${attendanceLabel(
                      item.status
                    )}
                  </span>
                </div>
              `)
              .join("")
          : `
            <div class="empty">
              No attendance recorded
            </div>
          `
      }
    `,

    showBack: true,

    onBack: () =>
      showDancer(
        dancer.id
      )
  });
}

function attendanceLabel(status) {
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

  return "";
}


/* ============================================================
   SETTINGS
   ============================================================ */

function renderSettings() {
  updateEnsembleLabels();

  /*
     Convert Instructor Notes into
     one normal Settings row.
  */

  const notesCard =
    document.querySelector(
      ".instructor-notes-card"
    );

  if (notesCard) {
    notesCard.innerHTML = `
      <button
        type="button"
        class="settings-notes-row"
        id="openInstructorNotes"
      >
        <span>
          Instructor Notes
        </span>

        <span
          class="settings-chevron"
        >
          ›
        </span>
      </button>
    `;

    notesCard
      .querySelector(
        "#openInstructorNotes"
      )
      ?.addEventListener(
        "click",
        openInstructorNotes
      );
  }
}


/* ============================================================
   FULL SCREEN INSTRUCTOR NOTES
   ============================================================ */

function openInstructorNotes() {
  const ensemble =
    getSelectedEnsemble();

  openModal({
    eyebrow:
      ensemble.name.toUpperCase(),

    title:
      "Instructor Notes",

    body: `
      <div
        class="notes-full-page"
      >
        <div
          class="notes-save-line"
        >
          <span
            class="notes-live-dot"
          ></span>

          <span id="notesSaveText">
            Saved
          </span>
        </div>

        <textarea
          id="fullInstructorNotes"
          class="instructor-notes-editor"
          placeholder="Start typing..."
          spellcheck="true"
        >${escapeHTML(
          ensemble.instructorNotes ||
          ""
        )}</textarea>
      </div>
    `,

    fullScreen: true
  });

  const editor =
    document.getElementById(
      "fullInstructorNotes"
    );

  const saveText =
    document.getElementById(
      "notesSaveText"
    );

  let timer;

  editor?.addEventListener(
    "input",
    () => {
      ensemble.instructorNotes =
        editor.value;

      saveLocalOnly();

      if (saveText) {
        saveText.textContent =
          "Saving...";
      }

      clearTimeout(timer);

      timer = setTimeout(
        async () => {
          await saveData();

          if (saveText) {
            saveText.textContent =
              "Saved";
          }
        },
        500
      );
    }
  );
}


/* ============================================================
   SETTINGS PLACEHOLDERS
   ============================================================ */

function placeholderModal(title) {
  openModal({
    eyebrow: "SETTINGS",
    title,

    body: `
      <div class="empty">
        This section will be available
        when instructor accounts and
        permissions are configured.
      </div>
    `
  });
}


/* ============================================================
   MODAL
   ============================================================ */

let modalBackAction = null;

function openModal({
  eyebrow = "",
  title = "",
  body = "",
  showBack = true,
  onBack = null,
  fullScreen = false
}) {
  if (
    !modalOverlay ||
    !modal
  ) {
    return;
  }

  modalEyebrow.textContent =
    eyebrow;

  modalTitle.textContent =
    title;

  modalBody.innerHTML =
    body;

  modalBackAction =
    onBack;

  modalBack?.classList.toggle(
    "hidden",
    !showBack
  );

  modal.classList.toggle(
    "full-screen-modal",
    fullScreen
  );

  modal.classList.toggle(
    "notes-modal",
    fullScreen
  );

  modalOverlay.classList.add(
    "open"
  );

  document.body.classList.add(
    "modal-open"
  );

  /*
     Always start modal at top.
  */

  modalBody.scrollTop = 0;
}

function closeModal() {
  if (!modalOverlay) return;

  modalOverlay.classList.remove(
    "open"
  );

  modal?.classList.remove(
    "full-screen-modal",
    "notes-modal"
  );

  document.body.classList.remove(
    "modal-open"
  );

  modalBackAction = null;
}

modalBack?.addEventListener(
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

closeModalButton?.addEventListener(
  "click",
  closeModal
);


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

navButtons.forEach(button => {
  button.addEventListener(
    "click",
    () => {
      const page =
        button.dataset.page;

      if (page) {
        openPage(page);
      }
    }
  );
});

addDancerButton?.addEventListener(
  "click",
  () =>
    showDancerForm()
);

addDanceButton?.addEventListener(
  "click",
  () =>
    showDanceForm()
);

addPracticeButton?.addEventListener(
  "click",
  showPracticeForm
);

dancerSearch?.addEventListener(
  "input",
  renderDancers
);

todayButton?.addEventListener(
  "click",
  () => {
    calendarDate =
      new Date();

    selectedCalendarDate =
      new Date();

    renderCalendar();
    renderPractices();
  }
);

document
  .querySelectorAll(
    ".calendar-arrow"
  )
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const direction =
          button.dataset
            .direction ||
          button.dataset
            .calendarDirection;

        const amount =
          direction === "prev" ||
          direction === "-1"
            ? -1
            : 1;

        calendarDate =
          new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() +
              amount,
            1
          );

        renderCalendar();
      }
    );
  });

manageEnsemblesButton
  ?.addEventListener(
    "click",
    () =>
      openPage("homePage")
  );

accountsButton?.addEventListener(
  "click",
  () =>
    placeholderModal(
      "Instructor Accounts"
    )
);

permissionsButton
  ?.addEventListener(
    "click",
    () =>
      placeholderModal(
        "Permissions"
      )
  );


/* ============================================================
   FIREBASE SYNC
   ============================================================ */

function connectFirebase() {
  const fb = getFirebase();

  if (!fb) return;

  firebaseReady = true;

  try {
    fb.onValue(
      fb.dbRef(
        fb.database,
        CLOUD_ROOT
      ),

      snapshot => {
        const cloud =
          snapshot.val();

        if (!cloud) {
          saveData();
          return;
        }

        applyingCloudUpdate =
          true;

        /*
           Preserve the ensemble currently
           selected on THIS phone so another
           instructor changing ensemble does
           not jump this phone to a different
           ensemble.
        */

        const localSelection =
          data.selectedEnsemble;

        data =
          normalizeData(cloud);

        data.selectedEnsemble =
          localSelection;

        saveLocalOnly();

        applyingCloudUpdate =
          false;

        renderAll();
      },

      error => {
        console.error(
          "Firebase listener failed:",
          error
        );
      }
    );
  } catch (error) {
    console.error(
      "Firebase setup failed:",
      error
    );
  }
}

window.addEventListener(
  "vukFirebaseReady",
  connectFirebase
);


/* ============================================================
   RENDER ALL
   ============================================================ */

function renderAll() {
  removeHeaderEnsembleButton();

  updateEnsembleLabels();

  renderEnsembles();
  renderDancers();
  renderDances();
  renderCalendar();
  renderPractices();

  const activePage =
    document.querySelector(
      ".page.active"
    );

  if (
    activePage?.id ===
    "settingsPage"
  ) {
    renderSettings();
  }
}


/* ============================================================
   START APP
   ============================================================ */

removeHeaderEnsembleButton();

renderAll();

openPage("homePage");

if (window.vukFirebase) {
  connectFirebase();
}



/* ============================================================
   VUK PROBE — V7 IPHONE / FUNCTIONAL UPDATES
   Paste this ENTIRE section at the VERY BOTTOM of script.js
   ============================================================ */


/* ============================================================
   1. SMALL FIREBASE WRITES
   ============================================================ */

/*
  The original app still keeps its normal saveData() system
  for compatibility.

  These helpers allow high-frequency actions such as
  attendance and notes to update only the relevant Firebase
  path instead of rewriting the whole app every single tap.
*/

function firebaseSafeKey(value) {
  return String(value)
    .replace(/[.#$\[\]\/]/g, "_");
}


async function saveCloudPath(path, value) {
  saveLocalOnly();

  if (
    !firebaseReady ||
    applyingCloudUpdate
  ) {
    return;
  }

  const fb = getFirebase();

  if (!fb) return;

  try {
    await fb.set(
      fb.dbRef(
        fb.database,
        `${CLOUD_ROOT}/${path}`
      ),
      value
    );
  } catch (error) {
    console.error(
      "Firebase path save failed:",
      error
    );

    showToast(
      "Saved on this phone"
    );
  }
}


async function removeCloudPath(path) {
  saveLocalOnly();

  if (
    !firebaseReady ||
    applyingCloudUpdate
  ) {
    return;
  }

  const fb = getFirebase();

  if (!fb) return;

  try {
    await fb.remove(
      fb.dbRef(
        fb.database,
        `${CLOUD_ROOT}/${path}`
      )
    );
  } catch (error) {
    console.error(
      "Firebase path remove failed:",
      error
    );
  }
}


function selectedEnsembleCloudPath() {
  return `ensembles/${data.selectedEnsemble}`;
}



/* ============================================================
   2. UPLOAD SAFETY
   ============================================================ */

const cancelUploadButton =
  document.getElementById(
    "cancelUploadButton"
  );

let currentUploadCancelled = false;

let currentUploadTimeout = null;


function startSafeUpload(message) {
  currentUploadCancelled = false;

  clearTimeout(
    currentUploadTimeout
  );

  showUpload(message);

  uploadOverlay?.setAttribute(
    "aria-hidden",
    "false"
  );

  currentUploadTimeout =
    setTimeout(() => {

      currentUploadCancelled = true;

      hideUpload();

      uploadOverlay?.setAttribute(
        "aria-hidden",
        "true"
      );

      showToast(
        "Upload took too long. Please try again."
      );

    }, 30000);
}


function finishSafeUpload() {
  clearTimeout(
    currentUploadTimeout
  );

  currentUploadTimeout = null;

  hideUpload();

  uploadOverlay?.setAttribute(
    "aria-hidden",
    "true"
  );
}


cancelUploadButton?.addEventListener(
  "click",
  () => {

    currentUploadCancelled = true;

    finishSafeUpload();

    showToast(
      "Upload cancelled"
    );
  }
);


function promiseWithTimeout(
  promise,
  milliseconds = 25000
) {
  return Promise.race([
    promise,

    new Promise(
      (_, reject) => {

        setTimeout(
          () => {
            reject(
              new Error(
                "Upload timed out"
              )
            );
          },
          milliseconds
        );

      }
    )
  ]);
}



/* ============================================================
   3. SAFER PHOTO UPLOAD
   ============================================================ */

async function uploadDancePhoto(
  dance,
  file
) {
  const fb = getFirebase();

  if (!fb?.storage) {
    showToast(
      "Photo storage is not available"
    );

    return;
  }

  if (!file) return;


  /*
    Avoid enormous phone photos making
    the app feel frozen.
  */

  const maxSize =
    15 * 1024 * 1024;

  if (file.size > maxSize) {
    showToast(
      "Photo is too large"
    );

    return;
  }


  try {

    startSafeUpload(
      "Uploading photo..."
    );


    const cleanName =
      String(file.name || "photo")
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );


    const path =
      `dance-media/` +
      `${firebaseSafeKey(dance.id)}/` +
      `photos/` +
      `${uid("photo")}-${cleanName}`;


    const fileRef =
      fb.storageRef(
        fb.storage,
        path
      );


    await promiseWithTimeout(
      fb.uploadBytes(
        fileRef,
        file
      )
    );


    if (currentUploadCancelled) {
      finishSafeUpload();
      return;
    }


    const url =
      await promiseWithTimeout(
        fb.getDownloadURL(
          fileRef
        )
      );


    if (currentUploadCancelled) {
      finishSafeUpload();
      return;
    }


    if (
      !Array.isArray(
        dance.photos
      )
    ) {
      dance.photos = [];
    }


    dance.photos.push({
      url,
      path,
      name:
        file.name ||
        "Photo"
    });


    /*
      Save locally immediately.
    */

    saveLocalOnly();


    /*
      Save only the selected ensemble.
      This is much smaller than saving
      the entire app database.
    */

    await saveCloudPath(
      selectedEnsembleCloudPath(),
      getSelectedEnsemble()
    );


    finishSafeUpload();

    showDance(
      dance.id
    );

    showToast(
      "Photo uploaded"
    );


  } catch (error) {

    console.error(
      "Photo upload failed:",
      error
    );

    finishSafeUpload();

    showToast(
      "Photo upload failed"
    );
  }
}



/* ============================================================
   4. SAFER MUSIC UPLOAD
   ============================================================ */

async function uploadDanceMusic(
  dance,
  file
) {
  const fb = getFirebase();

  if (!fb?.storage) {

    showToast(
      "Music storage is not available"
    );

    return;
  }

  if (!file) return;


  try {

    startSafeUpload(
      "Uploading music..."
    );


    const cleanName =
      String(
        file.name ||
        "music"
      )
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );


    const path =
      `dance-media/` +
      `${firebaseSafeKey(dance.id)}/` +
      `music/` +
      `${uid("music")}-${cleanName}`;


    const newRef =
      fb.storageRef(
        fb.storage,
        path
      );


    await promiseWithTimeout(
      fb.uploadBytes(
        newRef,
        file
      )
    );


    if (currentUploadCancelled) {
      finishSafeUpload();
      return;
    }


    const url =
      await promiseWithTimeout(
        fb.getDownloadURL(
          newRef
        )
      );


    if (currentUploadCancelled) {
      finishSafeUpload();
      return;
    }


    const oldMusic =
      dance.music;


    dance.music = {
      url,
      path,
      name:
        file.name ||
        "Dance Music"
    };


    saveLocalOnly();


    await saveCloudPath(
      selectedEnsembleCloudPath(),
      getSelectedEnsemble()
    );


    /*
      Only remove the old file AFTER
      the new music has successfully
      uploaded and saved.
    */

    if (
      oldMusic?.path &&
      oldMusic.path !== path
    ) {

      try {

        await fb.deleteObject(
          fb.storageRef(
            fb.storage,
            oldMusic.path
          )
        );

      } catch (error) {

        console.warn(
          "Old music could not be removed:",
          error
        );
      }
    }


    finishSafeUpload();

    showDance(
      dance.id
    );

    showToast(
      "Music uploaded"
    );


  } catch (error) {

    console.error(
      "Music upload failed:",
      error
    );

    finishSafeUpload();

    showToast(
      "Music upload failed"
    );
  }
}



/* ============================================================
   5. DANCER LIST WITH DEDICATED DRAG HANDLE
   ============================================================ */

function renderDancers() {
  if (!dancerList) return;


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

        <div class="roster-section-heading">

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


    if (!dancers.length) {

      html += `
        <div class="empty compact-empty">
          No dancers
        </div>
      `;

    } else {

      dancers.forEach(
        (dancer, index) => {

          const number =
            String(
              index + 1
            ).padStart(
              2,
              "0"
            );


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


                <span class="dancer-name">
                  ${escapeHTML(
                    dancerName(
                      dancer
                    )
                  )}
                </span>


                <span class="dancer-height">
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
                aria-label="Reorder dancer"
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
   6. DANCE LIST WITH NUMBERS + DRAG HANDLE
   ============================================================ */

function renderDances() {
  if (!danceList) return;


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


  danceList.innerHTML = `
    ${danceSectionHTML(
      "IN USE",
      "in-use",
      inUse
    )}

    ${danceSectionHTML(
      "NOT IN USE",
      "not-in-use",
      notInUse
    )}
  `;


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


function danceSectionHTML(
  label,
  statusClass,
  dances
) {

  return `
    <section
      class="dance-section ${statusClass}"
    >

      <div class="dance-section-heading">

        <div
          class="dance-status-title ${statusClass}"
        >
          ${label}
        </div>

      </div>


      <div
        class="dance-group-list"
        data-dance-list="${statusClass}"
      >

        ${
          dances.length
            ? dances
                .map(
                  (dance, index) =>
                    danceRowHTML(
                      dance,
                      index,
                      statusClass
                    )
                )
                .join("")
            : `
              <div
                class="empty compact-empty dance-empty"
              >
                No dances
              </div>
            `
        }

      </div>

    </section>
  `;
}


function danceRowHTML(
  dance,
  index,
  statusClass
) {

  const number =
    String(
      index + 1
    ).padStart(
      2,
      "0"
    );


  return `
    <div
      class="dance-row draggable-row ${statusClass}"
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

        <span
          class="dance-number ${statusClass}"
        >
          ${number}
        </span>


        <span class="dance-card-content">

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
        aria-label="Reorder dance"
      >
        ≡
      </button>

    </div>
  `;
}



/* ============================================================
   7. DRAG ONLY FROM THE ≡ HANDLE
   ============================================================ */

function setupDancerReordering() {

  dancerList
    ?.querySelectorAll(
      "[data-dancer-drag]"
    )
    .forEach(handle => {

      const row =
        handle.closest(
          "[data-dancer-row]"
        );


      const list =
        row?.closest(
          "[data-dancer-list]"
        );


      if (
        !row ||
        !list
      ) {
        return;
      }


      handle.addEventListener(
        "pointerdown",
        event => {

          event.preventDefault();

          beginReorder({
            event,
            row,
            list,
            type: "dancer"
          });
        }
      );


      handle.addEventListener(
        "pointermove",
        moveReorder
      );


      handle.addEventListener(
        "pointerup",
        endReorder
      );


      handle.addEventListener(
        "pointercancel",
        endReorder
      );

    });
}


function setupDanceReordering() {

  danceList
    ?.querySelectorAll(
      "[data-dance-drag]"
    )
    .forEach(handle => {

      const row =
        handle.closest(
          "[data-dance-row]"
        );


      const list =
        row?.closest(
          "[data-dance-list]"
        );


      if (
        !row ||
        !list
      ) {
        return;
      }


      handle.addEventListener(
        "pointerdown",
        event => {

          event.preventDefault();

          beginReorder({
            event,
            row,
            list,
            type: "dance"
          });
        }
      );


      handle.addEventListener(
        "pointermove",
        moveReorder
      );


      handle.addEventListener(
        "pointerup",
        endReorder
      );


      handle.addEventListener(
        "pointercancel",
        endReorder
      );

    });
}



/* ============================================================
   8. NUMBER REFRESH DURING DRAGGING
   ============================================================ */

function refreshDancerNumbers() {

  dancerList
    ?.querySelectorAll(
      "[data-dancer-list]"
    )
    .forEach(list => {

      list
        .querySelectorAll(
          "[data-dancer-row]"
        )
        .forEach(
          (row, index) => {

            const number =
              row.querySelector(
                ".dancer-number"
              );

            if (number) {

              number.textContent =
                String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                );
            }
          }
        );

    });
}


function refreshDanceNumbers() {

  danceList
    ?.querySelectorAll(
      "[data-dance-list]"
    )
    .forEach(list => {

      list
        .querySelectorAll(
          "[data-dance-row]"
        )
        .forEach(
          (row, index) => {

            const number =
              row.querySelector(
                ".dance-number"
              );

            if (number) {

              number.textContent =
                String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                );
            }
          }
        );

    });
}



/*
  Replace the original movement function
  so numbering changes while you move
  a row instead of only after saving.
*/

moveReorder = function(event) {

  if (
    !dragState ||
    event.pointerId !==
      dragState.pointerId
  ) {
    return;
  }


  dragState.active = true;


  dragState.row.classList.add(
    "dragging"
  );


  document.body.classList.add(
    "reordering"
  );


  event.preventDefault();


  const element =
    document.elementFromPoint(
      event.clientX,
      event.clientY
    );


  if (!element) return;


  let targetList;


  if (
    dragState.type ===
    "dance"
  ) {

    targetList =
      element.closest(
        "[data-dance-list]"
      );

  } else {

    targetList =
      element.closest(
        "[data-dancer-list]"
      );


    /*
      Boys remain in Boys,
      Girls remain in Girls.
    */

    if (
      targetList &&
      targetList.dataset
        .dancerList !==
        dragState.list.dataset
          .dancerList
    ) {
      return;
    }
  }


  if (!targetList) return;


  targetList
    .querySelector(
      ".dance-empty"
    )
    ?.remove();


  const selector =
    dragState.type === "dance"
      ? "[data-dance-row]"
      : "[data-dancer-row]";


  const rows =
    [
      ...targetList.querySelectorAll(
        selector
      )
    ]
      .filter(
        row =>
          row !==
          dragState.row
      );


  const before =
    rows.find(row => {

      const rect =
        row.getBoundingClientRect();

      return (
        event.clientY <
        rect.top +
          rect.height / 2
      );
    });


  if (before) {

    targetList.insertBefore(
      dragState.row,
      before
    );

  } else {

    targetList.appendChild(
      dragState.row
    );
  }


  dragState.list =
    targetList;


  if (
    dragState.type ===
    "dance"
  ) {

    refreshDanceNumbers();

  } else {

    refreshDancerNumbers();
  }
};



/* ============================================================
   9. PRACTICE FORM — SINGLE OR WEEKLY UNTIL DATE
   ============================================================ */

function showPracticeForm() {

  const defaultDate =
    dateKey(
      selectedCalendarDate
    );


  openModal({

    eyebrow:
      "PRACTICE",

    title:
      "Add Practice",

    body: `
      <form id="practiceForm">

        <div class="form-group">

          <label>
            Name
          </label>

          <input
            id="practiceName"
            value="Proba"
          >

        </div>


        <div class="form-group">

          <label>
            Date
          </label>

          <input
            type="date"
            id="practiceDate"
            value="${defaultDate}"
            required
          >

        </div>


        <div class="form-row">

          <div class="form-group">

            <label>
              Start
            </label>

            <input
              type="time"
              id="practiceStart"
              required
            >

          </div>


          <div class="form-group">

            <label>
              End
            </label>

            <input
              type="time"
              id="practiceEnd"
              required
            >

          </div>

        </div>


        <div class="form-group">

          <label>
            Repeat
          </label>

          <div class="repeat-selector">

            <button
              type="button"
              class="repeat-option selected"
              data-repeat="none"
            >
              One Time
            </button>


            <button
              type="button"
              class="repeat-option"
              data-repeat="weekly"
            >
              Weekly
            </button>

          </div>

        </div>


        <div
          class="form-group repeat-until-group"
          id="repeatUntilGroup"
          hidden
        >

          <label>
            Repeat Until
          </label>

          <input
            type="date"
            id="practiceRepeatUntil"
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


  let repeatMode =
    "none";


  const repeatUntilGroup =
    document.getElementById(
      "repeatUntilGroup"
    );


  const repeatUntil =
    document.getElementById(
      "practiceRepeatUntil"
    );


  document
    .querySelectorAll(
      "[data-repeat]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();


          repeatMode =
            button.dataset.repeat;


          document
            .querySelectorAll(
              "[data-repeat]"
            )
            .forEach(option => {

              option.classList.toggle(
                "selected",
                option === button
              );

            });


          const weekly =
            repeatMode ===
            "weekly";


          if (
            repeatUntilGroup
          ) {
            repeatUntilGroup.hidden =
              !weekly;
          }


          if (
            repeatUntil
          ) {
            repeatUntil.required =
              weekly;
          }

        }
      );

    });


  document
    .getElementById(
      "practiceForm"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const name =
          document
            .getElementById(
              "practiceName"
            )
            .value
            .trim() ||
          "Proba";


        const firstDate =
          document
            .getElementById(
              "practiceDate"
            )
            .value;


        const startTime =
          document
            .getElementById(
              "practiceStart"
            )
            .value;


        const endTime =
          document
            .getElementById(
              "practiceEnd"
            )
            .value;


        if (
          !firstDate ||
          !startTime ||
          !endTime
        ) {

          showToast(
            "Enter the date and times"
          );

          return;
        }


        const ensemble =
          getSelectedEnsemble();


        const practicesToAdd =
          [];


        if (
          repeatMode ===
          "weekly"
        ) {

          const endDate =
            repeatUntil?.value;


          if (!endDate) {

            showToast(
              "Choose the last practice date"
            );

            return;
          }


          const current =
            new Date(
              firstDate +
              "T12:00:00"
            );


          const final =
            new Date(
              endDate +
              "T12:00:00"
            );


          if (
            final < current
          ) {

            showToast(
              "Repeat Until must be after the first practice"
            );

            return;
          }


          /*
            Safety limit:
            maximum two years of weekly
            practices from one submission.
          */

          let count = 0;


          while (
            current <= final &&
            count < 105
          ) {

            practicesToAdd.push({

              id:
                uid(
                  "practice"
                ),

              name,

              date:
                dateKey(
                  current
                ),

              startTime,

              endTime,

              attendance: {},

              recurring:
                true

            });


            current.setDate(
              current.getDate() +
              7
            );


            count++;
          }

        } else {

          practicesToAdd.push({

            id:
              uid(
                "practice"
              ),

            name,

            date:
              firstDate,

            startTime,

            endTime,

            attendance: {}

          });
        }


        ensemble.practices.push(
          ...practicesToAdd
        );


        selectedCalendarDate =
          new Date(
            firstDate +
            "T12:00:00"
          );


        calendarDate =
          new Date(
            selectedCalendarDate
          );


        saveLocalOnly();


        await saveCloudPath(
          selectedEnsembleCloudPath(),
          ensemble
        );


        closeModal();

        renderCalendar();

        renderPractices();


        showToast(
          practicesToAdd.length === 1
            ? "Practice added"
            : `${practicesToAdd.length} practices added`
        );

      }
    );
}



/* ============================================================
   10. ATTENDANCE — TAP SELECTED STATUS TO REMOVE IT
   ============================================================ */

function clearAttendanceStatus(
  attendance,
  dancerId
) {

  const existing =
    Object.keys(
      attendance || {}
    )
      .find(
        key =>
          sameId(
            key,
            dancerId
          )
      );


  if (existing !== undefined) {
    delete attendance[
      existing
    ];
  }
}


async function saveAttendanceOnly(
  practice
) {

  saveLocalOnly();


  /*
    Save the selected ensemble only.
    This avoids rewriting every other
    ensemble for every attendance tap.
  */

  await saveCloudPath(
    selectedEnsembleCloudPath(),
    getSelectedEnsemble()
  );
}


function showPractice(id) {

  const practice =
    findPractice(id);


  if (!practice) return;


  const dancers =
    getSelectedEnsemble()
      .dancers;


  const attendance =
    practice.attendance ||
    (
      practice.attendance = {}
    );


  openModal({

    eyebrow:
      "PRACTICE",

    title:
      practice.name ||
      "Proba",

    body: `

      <div class="detail-card">

        <div class="detail-value">
          ${formatDate(
            practice.date
          )}
        </div>


        <div class="practice-time">

          ${formatTime(
            practice.startTime
          )}

          ${
            practice.endTime
              ? ` – ${formatTime(
                  practice.endTime
                )}`
              : ""
          }

        </div>

      </div>


      <button
        type="button"
        class="mark-all-button"
        id="markAllPresent"
      >
        ✓ Mark All Present
      </button>


      <div
        id="attendanceSummary"
      ></div>


      <div
        class="search-box attendance-search"
      >

        <span>
          ⌕
        </span>

        <input
          id="attendanceSearch"
          placeholder="Search dancers..."
          autocomplete="off"
        >

      </div>


      <div
        class="mini-group-title attendance-title"
      >
        ATTENDANCE
      </div>


      <div
        id="attendanceList"
      ></div>

    `
  });


  const attendanceList =
    document.getElementById(
      "attendanceList"
    );


  const search =
    document.getElementById(
      "attendanceSearch"
    );


  function drawAttendance() {

    if (!attendanceList) {
      return;
    }


    const query =
      String(
        search?.value || ""
      )
        .trim()
        .toLowerCase();


    const visible =
      dancers.filter(
        dancer =>
          dancerName(dancer)
            .toLowerCase()
            .includes(query)
      );


    attendanceList.innerHTML =
      visible
        .map(dancer => {

          const current =
            getAttendanceStatus(
              attendance,
              dancer.id
            );


          return `
            <div class="attendance-row">

              <h4>
                ${escapeHTML(
                  dancerName(
                    dancer
                  )
                )}
              </h4>


              <div
                class="attendance-buttons four"
                data-attendance-dancer="${escapeHTML(
                  dancer.id
                )}"
              >

                ${attendanceButton(
                  "present",
                  "Present",
                  current
                )}

                ${attendanceButton(
                  "late",
                  "Late",
                  current
                )}

                ${attendanceButton(
                  "absent",
                  "No Show",
                  current
                )}

                ${attendanceButton(
                  "excused",
                  "Excused",
                  current
                )}

              </div>

            </div>
          `;
        })
        .join("");


    attendanceList
      .querySelectorAll(
        "[data-attendance-status]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            const group =
              button.closest(
                "[data-attendance-dancer]"
              );


            if (!group) return;


            const dancerId =
              group.dataset
                .attendanceDancer;


            const clickedStatus =
              button.dataset
                .attendanceStatus;


            const oldStatus =
              getAttendanceStatus(
                attendance,
                dancerId
              );


            /*
              IMPORTANT:
              Clicking the currently selected
              status removes attendance.
            */

            if (
              oldStatus ===
              clickedStatus
            ) {

              clearAttendanceStatus(
                attendance,
                dancerId
              );

            } else {

              setAttendanceStatus(
                attendance,
                dancerId,
                clickedStatus
              );
            }


            const newStatus =
              getAttendanceStatus(
                attendance,
                dancerId
              );


            /*
              Change the buttons instantly.
              No waiting for Firebase.
            */

            group
              .querySelectorAll(
                "[data-attendance-status]"
              )
              .forEach(option => {

                option.classList.toggle(
                  "selected",
                  option.dataset
                    .attendanceStatus ===
                    newStatus
                );

              });


            drawAttendanceSummary(
              practice
            );


            /*
              Save locally immediately,
              then sync.
            */

            saveLocalOnly();


            await saveAttendanceOnly(
              practice
            );

          }
        );

      });


    drawAttendanceSummary(
      practice
    );
  }


  search?.addEventListener(
    "input",
    drawAttendance
  );


  document
    .getElementById(
      "markAllPresent"
    )
    ?.addEventListener(
      "click",
      async () => {

        dancers.forEach(
          dancer => {

            setAttendanceStatus(
              attendance,
              dancer.id,
              "present"
            );

          }
        );


        /*
          Instant screen update.
        */

        drawAttendance();


        saveLocalOnly();


        await saveAttendanceOnly(
          practice
        );


        showToast(
          "Everyone marked present"
        );

      }
    );


  drawAttendance();
}



/* ============================================================
   11. SETTINGS — CLEAN OLD FORMAT
   ============================================================ */

function renderSettings() {

  updateEnsembleLabels();


  const notesCard =
    document.querySelector(
      ".instructor-notes-card"
    );


  if (!notesCard) {
    return;
  }


  notesCard.innerHTML = `
    <button
      type="button"
      class="settings-notes-row"
      id="openInstructorNotes"
    >

      <span>
        Instructor Notes
      </span>

      <span class="settings-chevron">
        ›
      </span>

    </button>
  `;


  notesCard
    .querySelector(
      "#openInstructorNotes"
    )
    ?.addEventListener(
      "click",
      openInstructorNotes
    );
}



/* ============================================================
   12. INSTRUCTOR NOTES — FULL SCREEN
   ============================================================ */

function openInstructorNotes() {

  const ensemble =
    getSelectedEnsemble();


  openModal({

    eyebrow:
      ensemble.name
        .toUpperCase(),

    title:
      "Instructor Notes",

    body: `

      <div class="notes-full-page">

        <div class="notes-save-line">

          <span
            class="notes-live-dot"
          ></span>

          <span id="notesSaveText">
            Saved
          </span>

        </div>


        <textarea
          id="fullInstructorNotes"
          class="instructor-notes-editor"
          placeholder="Start typing..."
          spellcheck="true"
        >${escapeHTML(
          ensemble.instructorNotes ||
          ""
        )}</textarea>

      </div>

    `,

    fullScreen:
      true

  });


  const editor =
    document.getElementById(
      "fullInstructorNotes"
    );


  const saveText =
    document.getElementById(
      "notesSaveText"
    );


  let saveTimer;


  editor?.addEventListener(
    "input",
    () => {

      ensemble.instructorNotes =
        editor.value;


      saveLocalOnly();


      if (saveText) {
        saveText.textContent =
          "Saving...";
      }


      clearTimeout(
        saveTimer
      );


      saveTimer =
        setTimeout(
          async () => {

            await saveCloudPath(
              `${selectedEnsembleCloudPath()}/instructorNotes`,
              ensemble.instructorNotes
            );


            if (saveText) {
              saveText.textContent =
                "Saved";
            }

          },
          600
        );

    }
  );
}



/* ============================================================
   13. REMOVE ALL OLD HELPER / PROMPT WRITING
   ============================================================ */

function removeHelperWriting() {

  document
    .querySelectorAll(
      ".reorder-hint, .roster-help, .settings-note"
    )
    .forEach(element => {

      element.textContent =
        "";

      element.style.display =
        "none";

    });
}



/* ============================================================
   14. HEADER ENSEMBLE BUTTON MUST STAY GONE
   ============================================================ */

function removeHeaderEnsembleButton() {

  if (!ensembleButton) {
    return;
  }


  ensembleButton.style.setProperty(
    "display",
    "none",
    "important"
  );


  ensembleButton.setAttribute(
    "aria-hidden",
    "true"
  );


  ensembleButton.tabIndex =
    -1;
}



/* ============================================================
   15. LOCAL ENSEMBLE SELECTION
   ============================================================ */

/*
  The ensemble selected on one instructor's
  phone should not switch another instructor's
  phone to the same ensemble.

  Store this phone's choice separately.
*/

const LOCAL_ENSEMBLE_KEY =
  "vukSelectedEnsemble";


try {

  const storedSelection =
    localStorage.getItem(
      LOCAL_ENSEMBLE_KEY
    );


  if (
    storedSelection !== null &&
    !Number.isNaN(
      Number(
        storedSelection
      )
    )
  ) {

    data.selectedEnsemble =
      Math.max(
        0,
        Math.min(
          4,
          Number(
            storedSelection
          )
        )
      );
  }

} catch (error) {

  console.warn(
    "Could not load ensemble selection",
    error
  );
}



/*
  Rebuild the Home ensemble chooser so
  changing ensemble is local to this phone.
*/

function renderEnsembles() {

  if (!ensembleList) {
    return;
  }


  ensembleList.innerHTML =
    data.ensembles
      .map(
        (ensemble, index) => {

          const selected =
            index ===
            data.selectedEnsemble;


          const dancerCount =
            ensemble.dancers?.length ||
            0;


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

              <div class="ensemble-number">

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
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          data.selectedEnsemble =
            Number(
              button.dataset
                .ensemble
            );


          try {

            localStorage.setItem(
              LOCAL_ENSEMBLE_KEY,
              String(
                data.selectedEnsemble
              )
            );

          } catch (error) {

            console.warn(
              "Could not save ensemble selection",
              error
            );
          }


          saveLocalOnly();


          renderAll();


          showToast(
            `${ensembleName()} selected`
          );

        }
      );

    });
}



/* ============================================================
   16. MODAL OPEN — ALWAYS START BELOW IPHONE STATUS BAR
   ============================================================ */

const originalOpenModalV7 =
  openModal;


openModal = function(options) {

  originalOpenModalV7(
    options
  );


  requestAnimationFrame(
    () => {

      if (modalBody) {
        modalBody.scrollTop =
          0;
      }


      if (modal) {
        modal.scrollTop =
          0;
      }

    }
  );
};



/* ============================================================
   17. RENDER CLEANUP
   ============================================================ */

const originalRenderAllV7 =
  renderAll;


renderAll = function() {

  originalRenderAllV7();

  removeHeaderEnsembleButton();

  removeHelperWriting();

};



/* ============================================================
   18. INITIAL V7 REFRESH
   ============================================================ */

removeHeaderEnsembleButton();

removeHelperWriting();

renderAll();


/* ============================================================
   END V7 UPDATE
   ============================================================ */
