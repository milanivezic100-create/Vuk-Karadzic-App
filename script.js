/* ============================================================
   VUK KARADZIC PROBE
   SCRIPT.JS
   Clean rebuild + recurrence + drag ordering
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

const app =
  document.getElementById("app");

const ensembleButton =
  document.getElementById("ensembleButton");

const ensembleList =
  document.getElementById("ensembleList");

const pages =
  document.querySelectorAll(".page");

const navButtons =
  document.querySelectorAll(".nav-button");

const danceEnsemble =
  document.getElementById("danceEnsemble");

const dancerEnsemble =
  document.getElementById("dancerEnsemble");

const settingsEnsemble =
  document.getElementById("settingsEnsemble");

const danceList =
  document.getElementById("danceList");

const dancerList =
  document.getElementById("dancerList");

const dancerSearch =
  document.getElementById("dancerSearch");

const addDanceButton =
  document.getElementById("addDanceButton");

const addDancerButton =
  document.getElementById("addDancerButton");

const calendarMonth =
  document.getElementById("calendarMonth");

const calendarGrid =
  document.getElementById("calendarGrid");

const todayButton =
  document.getElementById("todayButton");

const practiceList =
  document.getElementById("practiceList");

const addPracticeButton =
  document.getElementById("addPracticeButton");

const modalOverlay =
  document.getElementById("modalOverlay");

const modal =
  modalOverlay?.querySelector(".modal");

const modalBack =
  document.getElementById("modalBack");

const modalEyebrow =
  document.getElementById("modalEyebrow");

const modalTitle =
  document.getElementById("modalTitle");

const modalBody =
  document.getElementById("modalBody");

const closeModalButton =
  document.getElementById("closeModal");

const appToast =
  document.getElementById("appToast");

const uploadOverlay =
  document.getElementById("uploadOverlay");

const uploadMessage =
  document.getElementById("uploadMessage");

const cancelUploadButton =
  document.getElementById(
    "cancelUploadButton"
  );

const manageEnsemblesButton =
  document.getElementById(
    "manageEnsembles"
  );

const accountsButton =
  document.getElementById(
    "accountsButton"
  );

const permissionsButton =
  document.getElementById(
    "permissionsButton"
  );


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

  ensembles:
    ENSEMBLE_NAMES.map(
      name =>
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
    .replace(
      /\b\w/g,
      char =>
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
        normalGender(
          dancer.gender
        ) === gender
    );
}

function dancerName(dancer) {
  if (!dancer) {
    return "";
  }

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
  if (!appToast) {
    return;
  }

  appToast.textContent =
    message;

  appToast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {
        appToast.classList.remove(
          "show"
        );
      },
      1800
    );
}

function showUpload(message) {
  if (!uploadOverlay) {
    return;
  }

  if (uploadMessage) {
    uploadMessage.textContent =
      message;
  }

  uploadOverlay.classList.add(
    "open"
  );

  uploadOverlay.setAttribute(
    "aria-hidden",
    "false"
  );
}

function hideUpload() {
  uploadOverlay?.classList.remove(
    "open"
  );

  uploadOverlay?.setAttribute(
    "aria-hidden",
    "true"
  );
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      dateString +
      "T12:00:00"
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
  if (!time) {
    return "";
  }

  const [hour, minute] =
    time.split(":");

  const date =
    new Date();

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

  return (
    `${year}-${month}-${day}`
  );
}

function addDaysToDateString(
  dateString,
  numberOfDays
) {
  const date =
    new Date(
      dateString +
      "T12:00:00"
    );

  date.setDate(
    date.getDate() +
    numberOfDays
  );

  return dateToInputValue(
    date
  );
}


/* ============================================================
   DATA NORMALIZATION
   ============================================================ */

function normalizeData(raw) {
  if (
    !raw ||
    !Array.isArray(
      raw.ensembles
    )
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
        normalized
          .selectedEnsemble
      )
    )
      ? Number(
          normalized
            .selectedEnsemble
        )
      : 0;

  normalized.selectedEnsemble =
    Math.max(
      0,
      Math.min(
        4,
        normalized
          .selectedEnsemble
      )
    );

  normalized.ensembles =
    ENSEMBLE_NAMES.map(
      (
        fallbackName,
        index
      ) => {

        const old =
          raw.ensembles[
            index
          ] || {};

        const dancers =
          Array.isArray(
            old.dancers
          )
            ? old.dancers
            : [];

        const dances =
          Array.isArray(
            old.dances
          )
            ? old.dances
            : [];

        const practices =
          Array.isArray(
            old.practices
          )
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
                  dancer.notes ||
                  ""
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

                /*
                  Each dance keeps
                  its own dancer order.
                */

                const oldOrder =
                  Array.isArray(
                    dance.dancerOrder
                  )
                    ? dance.dancerOrder
                    : [];

                const dancerOrder =
                  oldOrder
                    .filter(
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
                  typeof practice
                    .attendance ===
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
        JSON.parse(
          current
        )
      );
    }

    const old =
      localStorage.getItem(
        OLD_STORAGE_KEY
      );

    if (old) {
      return normalizeData(
        JSON.parse(
          old
        )
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

let data =
  loadLocalData();


/* ============================================================
   FIREBASE
   ============================================================ */

let firebaseReady = false;

let applyingCloudUpdate =
  false;

function getFirebase() {
  return (
    window.vukFirebase ||
    null
  );
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

  const fb =
    getFirebase();

  if (!fb) {
    return;
  }

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

      const target =
        button.dataset.page;

      button.classList.toggle(
        "active",
        target === pageId
      );
    }
  );

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

  renderPage(
    pageId
  );
}

function renderPage(pageId) {
  updateEnsembleLabels();

  if (
    pageId ===
    "homePage"
  ) {
    renderEnsembles();
  }

  if (
    pageId ===
    "dancersPage"
  ) {
    renderDancers();
  }

  if (
    pageId ===
    "dancesPage"
  ) {
    renderDances();
  }

  if (
    pageId ===
    "calendarPage"
  ) {
    renderCalendar();
    renderPractices();
  }

  if (
    pageId ===
    "settingsPage"
  ) {
    renderSettings();
  }
}


/* ============================================================
   REMOVE TOP ENSEMBLE BUTTON
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


/* ============================================================
   ENSEMBLE LABELS
   ============================================================ */

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
   HOME / ENSEMBLE CHOOSER
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
            ensemble
              .dancers
              ?.length ||
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

              <span
                class="radio"
              ></span>

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
          async () => {

            data.selectedEnsemble =
              Number(
                button.dataset
                  .ensemble
              );

            saveLocalOnly();

            renderAll();

            showToast(
              `${ensembleName()} selected`
            );

            await saveData();
          }
        );
      }
    );
}


/* ============================================================
   END OF PART 1 OF 4

   Part 2 goes DIRECTLY underneath this line.
   Do not add another <script> tag.
   Do not commit yet.
   ============================================================ */
/* ============================================================
   DANCER LIST
   BOYS / GIRLS + DEDICATED DRAG HANDLE
   ============================================================ */

function renderDancers() {
  if (!dancerList) {
    return;
  }

  const query =
    String(
      dancerSearch?.value ||
      ""
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

  groups.forEach(
    group => {

      let dancers =
        groupDancers(
          group.gender
        );

      if (query) {
        dancers =
          dancers.filter(
            dancer =>
              dancerName(
                dancer
              )
                .toLowerCase()
                .includes(
                  query
                )
          );
      }

      if (
        group.gender ===
          "Other" &&
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

      if (
        dancers.length === 0
      ) {

        html += `
          <div
            class="empty compact-empty"
          >
            No dancers
          </div>
        `;

      } else {

        dancers.forEach(
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
              group.gender ===
                "Male"
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

                  <span
                    class="dancer-name"
                  >
                    ${escapeHTML(
                      dancerName(
                        dancer
                      )
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

                  <span
                    class="chevron"
                  >
                    ›
                  </span>

                </button>

                <button
                  type="button"
                  class="drag-handle"
                  data-dancer-drag
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
        );
      }

      html += `
          </div>
        </section>
      `;
    }
  );

  dancerList.innerHTML =
    html;

  dancerList
    .querySelectorAll(
      "[data-open-dancer]"
    )
    .forEach(
      button => {

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
      }
    );

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
    eyebrow:
      "DANCER",

    title:
      dancerName(
        dancer
      ),

    body: `
      <div
        class="profile-card"
      >

        <div
          class="profile-name"
        >
          ${escapeHTML(
            dancerName(
              dancer
            )
          )}
        </div>

        <div
          class="profile-grid"
        >

          <div
            class="profile-stat"
          >
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

          <div
            class="profile-stat"
          >
            <span>
              Height
            </span>

            <strong>
              ${escapeHTML(
                dancer.height ||
                "—"
              )}
            </strong>
          </div>

          <div
            class="profile-stat"
          >
            <span>
              Shoe Size
            </span>

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
                100 -
                stats.percent
              }% Not Present
            </div>

          </div>

          <span
            class="chevron"
          >
            ›
          </span>

        </button>

      </div>

      ${
        dancer.notes
          ? `
            <div
              class="notes-card"
            >
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
    eyebrow:
      "DANCER",

    title:
      dancer
        ? "Edit Dancer"
        : "Add Dancer",

    body: `
      <form
        id="dancerForm"
      >

        <div
          class="form-group"
        >
          <label>
            Name
          </label>

          <input
            id="dancerNameInput"
            required
            value="${escapeHTML(
              dancerName(
                dancer
              )
            )}"
          >
        </div>

        <div
          class="form-group"
        >
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

        <div
          class="form-group"
        >
          <label>
            Height
          </label>

          <input
            id="dancerHeightInput"
            value="${escapeHTML(
              dancer?.height ||
              ""
            )}"
          >
        </div>

        <div
          class="form-group"
        >
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

        <div
          class="form-group"
        >
          <label>
            Notes
          </label>

          <textarea
            id="dancerNotesInput"
            rows="5"
          >${escapeHTML(
            dancer?.notes ||
            ""
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

        const values = {
          name,

          gender:
            document
              .getElementById(
                "dancerGenderInput"
              )
              .value,

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
              id:
                uid("dancer"),

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

            dance.dancerOrder =
              (
                dance.dancerOrder ||
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
    .forEach(
      button => {

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
      }
    );

  /*
    This activates the dedicated
    ≡ handles for the dance list.

    IN USE dances stay within
    IN USE and NOT IN USE dances
    stay within NOT IN USE.
  */

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
                  (
                    dance,
                    index
                  ) =>
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
      data-dance-status="${statusClass}"
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

        <span
          class="chevron"
        >
          ›
        </span>

      </button>

      <button
        type="button"
        class="drag-handle dance-drag-handle"
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
  const assignedIds =
    Array.isArray(
      dance.dancerIds
    )
      ? dance.dancerIds
      : [];

  if (
    !Array.isArray(
      dance.dancerOrder
    )
  ) {
    dance.dancerOrder =
      [];
  }

  dance.dancerOrder =
    dance.dancerOrder.filter(
      dancerId =>
        assignedIds.some(
          id =>
            sameId(
              id,
              dancerId
            )
        )
    );

  assignedIds.forEach(
    dancerId => {

      const alreadyThere =
        dance.dancerOrder.some(
          id =>
            sameId(
              id,
              dancerId
            )
        );

      if (!alreadyThere) {
        dance.dancerOrder.push(
          dancerId
        );
      }
    }
  );

  return dance.dancerOrder
    .map(
      dancerId =>
        findDancer(
          dancerId
        )
    )
    .filter(Boolean);
}


function danceDancerGroupHTML(
  label,
  className,
  dancers
) {
  if (!dancers.length) {
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
        class="dance-dancer-order-list"
        data-dance-dancer-list="${className}"
      >

        ${dancers
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
                className ===
                  "boys"
                  ? "boy"
                  : className ===
                    "girls"
                  ? "girl"
                  : "other";

              return `
                <div
                  class="dance-dancer-row draggable-row"
                  data-dance-dancer-row="${escapeHTML(
                    dancer.id
                  )}"
                >

                  <div
                    class="dance-dancer-main"
                  >

                    <span
                      class="dancer-number ${numberClass}"
                    >
                      ${number}
                    </span>

                    <strong
                      class="dance-dancer-name"
                    >
                      ${escapeHTML(
                        dancerName(
                          dancer
                        )
                      )}
                    </strong>

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
          .join("")}

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

  const orderedDancers =
    danceOrderedDancers(
      dance
    );

  const boys =
    orderedDancers.filter(
      dancer =>
        normalGender(
          dancer.gender
        ) === "Male"
    );

  const girls =
    orderedDancers.filter(
      dancer =>
        normalGender(
          dancer.gender
        ) === "Female"
    );

  const other =
    orderedDancers.filter(
      dancer =>
        normalGender(
          dancer.gender
        ) === "Other"
    );

  openModal({
    eyebrow:
      "REPERTOIRE",

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

      <div
        class="detail-card"
      >
        <span
          class="detail-label"
        >
          Choreographer
        </span>

        <div
          class="detail-value"
        >
          ${escapeHTML(
            dance.choreographer ||
            "—"
          )}
        </div>
      </div>

      ${
        orderedDancers.length
          ? `
            <h3
              class="detail-heading"
            >
              Dancers
            </h3>

            <div
              class="dance-assigned-dancers"
            >

              ${danceDancerGroupHTML(
                "BOYS",
                "boys",
                boys
              )}

              ${danceDancerGroupHTML(
                "GIRLS",
                "girls",
                girls
              )}

              ${danceDancerGroupHTML(
                "OTHER",
                "other",
                other
              )}

            </div>
          `
          : `
            <div
              class="empty compact-empty"
            >
              No dancers assigned
            </div>
          `
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

  setupDanceMediaEvents(
    dance
  );

  setupDanceDancerReordering(
    dance
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
   ADD / EDIT DANCE
   ============================================================ */

function showDanceForm(
  id = null
) {
  const dance =
    id
      ? findDance(id)
      : null;

  const selectedIds =
    new Set(
      (
        dance?.dancerIds ||
        []
      ).map(String)
    );

  openModal({
    eyebrow:
      "REPERTOIRE",

    title:
      dance
        ? "Edit Dance"
        : "Add Dance",

    body: `
      <form
        id="danceForm"
      >

        <div
          class="form-group"
        >
          <label>
            Dance Name
          </label>

          <input
            id="danceNameInput"
            required
            value="${escapeHTML(
              dance?.name ||
              ""
            )}"
          >
        </div>

        <div
          class="form-group"
        >
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

        <div
          class="form-group"
        >
          <label>
            Status
          </label>

          <div
            class="dance-status-selector"
          >

            <button
              type="button"
              class="dance-status-option in-use ${
                dance?.inUse === false
                  ? ""
                  : "selected"
              }"
              data-dance-status-choice="true"
            >
              <span
                class="status-dot"
              ></span>

              <strong>
                In Use
              </strong>
            </button>

            <button
              type="button"
              class="dance-status-option not-in-use ${
                dance?.inUse === false
                  ? "selected"
                  : ""
              }"
              data-dance-status-choice="false"
            >
              <span
                class="status-dot"
              ></span>

              <strong>
                Not In Use
              </strong>
            </button>

          </div>
        </div>

        <div
          class="form-group"
        >
          <label>
            Dancers
          </label>

          ${danceDancerPickerHTML(
            selectedIds
          )}
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

  let inUse =
    dance?.inUse === false
      ? false
      : true;

  modalBody
    .querySelectorAll(
      "[data-dance-status-choice]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            inUse =
              button.dataset
                .danceStatusChoice ===
              "true";

            modalBody
              .querySelectorAll(
                "[data-dance-status-choice]"
              )
              .forEach(
                option =>
                  option.classList
                    .toggle(
                      "selected",
                      option ===
                        button
                    )
              );
          }
        );
      }
    );

  modalBody
    .querySelectorAll(
      "[data-picker-dancer]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const dancerId =
              String(
                button.dataset
                  .pickerDancer
              );

            if (
              selectedIds.has(
                dancerId
              )
            ) {
              selectedIds.delete(
                dancerId
              );
            } else {
              selectedIds.add(
                dancerId
              );
            }

            button.classList.toggle(
              "selected",
              selectedIds.has(
                dancerId
              )
            );
          }
        );
      }
    );

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

        const newDancerIds =
          Array.from(
            selectedIds
          );

        const values = {
          name,

          choreographer:
            document
              .getElementById(
                "danceChoreographerInput"
              )
              .value
              .trim(),

          inUse,

          dancerIds:
            newDancerIds
        };

        if (dance) {

          const oldOrder =
            Array.isArray(
              dance.dancerOrder
            )
              ? [
                  ...dance
                    .dancerOrder
                ]
              : [];

          Object.assign(
            dance,
            values
          );

          dance.dancerOrder =
            oldOrder.filter(
              dancerId =>
                newDancerIds.some(
                  id =>
                    sameId(
                      id,
                      dancerId
                    )
                )
            );

          newDancerIds.forEach(
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
              id:
                uid("dance"),

              ...values,

              dancerOrder:
                [
                  ...newDancerIds
                ],

              photos: []
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
              dance?.name ||
              "this dance"
            }?`
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

        await saveData();

        closeModal();

        renderDances();

        showToast(
          "Dance deleted"
        );
      }
    );
}


/* ============================================================
   DANCE DANCER PICKER
   ============================================================ */

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
    .map(
      group => {

        const dancers =
          groupDancers(
            group.gender
          );

        if (
          dancers.length === 0
        ) {
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
                .map(
                  dancer => {

                    const selected =
                      selectedIds.has(
                        String(
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
                        data-picker-dancer="${escapeHTML(
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
                  }
                )
                .join("")}

            </div>
          </div>
        `;
      }
    )
    .join("");
}


/* ============================================================
   END OF PART 2 OF 4

   Part 3 goes DIRECTLY underneath this line.
   Do not add a <script> tag.
   Do not commit yet.
   ============================================================ */
/* ============================================================
   DANCE MEDIA
   ============================================================ */

function danceMediaHTML(dance) {
  const photos =
    Array.isArray(
      dance.photos
    )
      ? dance.photos
      : [];

  const music =
    dance.music ||
    null;

  return `
    <h3
      class="detail-heading"
    >
      Photos
    </h3>

    ${
      photos.length
        ? `
          <div
            class="media-grid"
          >
            ${photos
              .map(
                (
                  photo,
                  index
                ) => {

                  const url =
                    typeof photo ===
                    "string"
                      ? photo
                      : photo.url;

                  return `
                    <div
                      class="media-tile"
                    >

                      <img
                        src="${escapeHTML(
                          url ||
                          ""
                        )}"
                        alt="Dance photo"
                      >

                      <button
                        type="button"
                        class="media-delete"
                        data-delete-photo="${index}"
                        aria-label="Delete photo"
                      >
                        ×
                      </button>

                    </div>
                  `;
                }
              )
              .join("")}
          </div>
        `
        : `
          <div
            class="file-box"
          >
            No photos added
          </div>
        `
    }

    <label
      class="upload-button"
    >
      Add Photo

      <input
        type="file"
        id="dancePhotoInput"
        accept="image/*"
        hidden
      >
    </label>


    <h3
      class="detail-heading"
    >
      Music
    </h3>

    ${
      music?.url
        ? `
          <div
            class="audio-card"
          >

            <strong>
              ${escapeHTML(
                music.name ||
                "Dance Music"
              )}
            </strong>

            <audio
              controls
              src="${escapeHTML(
                music.url
              )}"
            ></audio>

            <button
              type="button"
              class="danger-button compact"
              id="deleteDanceMusic"
            >
              Delete Music
            </button>

          </div>
        `
        : `
          <div
            class="file-box"
          >
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
        type="file"
        id="danceMusicInput"
        accept="audio/*"
        hidden
      >
    </label>
  `;
}


function setupDanceMediaEvents(
  dance
) {
  document
    .getElementById(
      "dancePhotoInput"
    )
    ?.addEventListener(
      "change",
      event => {

        const file =
          event.target
            .files?.[0];

        if (file) {
          uploadDancePhoto(
            dance,
            file
          );
        }
      }
    );

  document
    .getElementById(
      "danceMusicInput"
    )
    ?.addEventListener(
      "change",
      event => {

        const file =
          event.target
            .files?.[0];

        if (file) {
          uploadDanceMusic(
            dance,
            file
          );
        }
      }
    );

  modalBody
    ?.querySelectorAll(
      "[data-delete-photo]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset
                  .deletePhoto
              );

            deleteDancePhoto(
              dance,
              index
            );
          }
        );
      }
    );

  document
    .getElementById(
      "deleteDanceMusic"
    )
    ?.addEventListener(
      "click",
      () => {
        deleteDanceMusic(
          dance
        );
      }
    );
}


async function uploadDancePhoto(
  dance,
  file
) {
  const fb =
    getFirebase();

  if (
    !fb ||
    !fb.storage
  ) {
    showToast(
      "Photo storage unavailable"
    );
    return;
  }

  showUpload(
    "Uploading photo…"
  );

  try {

    const safeName =
      file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    const path =
      `dance-media/${data.selectedEnsemble}/${dance.id}/photos/${Date.now()}-${safeName}`;

    const storageReference =
      fb.storageRef(
        fb.storage,
        path
      );

    await fb.uploadBytes(
      storageReference,
      file
    );

    const url =
      await fb.getDownloadURL(
        storageReference
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

    showDance(
      dance.id
    );

    showToast(
      "Photo added"
    );

  } catch (error) {

    console.error(
      "Photo upload failed:",
      error
    );

    hideUpload();

    showToast(
      "Photo upload failed"
    );
  }
}


async function uploadDanceMusic(
  dance,
  file
) {
  const fb =
    getFirebase();

  if (
    !fb ||
    !fb.storage
  ) {
    showToast(
      "Music storage unavailable"
    );
    return;
  }

  showUpload(
    "Uploading music…"
  );

  try {

    if (
      dance.music?.path
    ) {
      try {

        await fb.deleteObject(
          fb.storageRef(
            fb.storage,
            dance.music.path
          )
        );

      } catch (error) {

        console.warn(
          "Old music could not be deleted:",
          error
        );
      }
    }

    const safeName =
      file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    const path =
      `dance-media/${data.selectedEnsemble}/${dance.id}/music/${Date.now()}-${safeName}`;

    const storageReference =
      fb.storageRef(
        fb.storage,
        path
      );

    await fb.uploadBytes(
      storageReference,
      file
    );

    const url =
      await fb.getDownloadURL(
        storageReference
      );

    dance.music = {
      url,
      path,
      name: file.name
    };

    await saveData();

    hideUpload();

    showDance(
      dance.id
    );

    showToast(
      "Music added"
    );

  } catch (error) {

    console.error(
      "Music upload failed:",
      error
    );

    hideUpload();

    showToast(
      "Music upload failed"
    );
  }
}


async function deleteDancePhoto(
  dance,
  index
) {
  const photo =
    dance.photos?.[
      index
    ];

  if (!photo) {
    return;
  }

  if (
    !confirm(
      "Delete this photo?"
    )
  ) {
    return;
  }

  const fb =
    getFirebase();

  const path =
    typeof photo ===
      "string"
      ? null
      : photo.path;

  if (
    fb &&
    path
  ) {
    try {

      await fb.deleteObject(
        fb.storageRef(
          fb.storage,
          path
        )
      );

    } catch (error) {

      console.warn(
        "Photo could not be removed from storage:",
        error
      );
    }
  }

  dance.photos.splice(
    index,
    1
  );

  await saveData();

  showDance(
    dance.id
  );

  showToast(
    "Photo deleted"
  );
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

  const fb =
    getFirebase();

  if (
    fb &&
    dance.music?.path
  ) {
    try {

      await fb.deleteObject(
        fb.storageRef(
          fb.storage,
          dance.music.path
        )
      );

    } catch (error) {

      console.warn(
        "Music could not be removed from storage:",
        error
      );
    }
  }

  dance.music = null;

  await saveData();

  showDance(
    dance.id
  );

  showToast(
    "Music deleted"
  );
}


/* ============================================================
   DRAG / REORDER SYSTEM
   ============================================================ */

let activeReorder =
  null;

let suppressClickUntil =
  0;


/* ------------------------------------------------------------
   START REORDER
   ------------------------------------------------------------ */

function beginReorder(
  event,
  {
    row,
    container,
    onSave
  }
) {
  if (
    !row ||
    !container
  ) {
    return;
  }

  event.preventDefault();

  const pointerId =
    event.pointerId;

  activeReorder = {
    row,
    container,
    pointerId,
    onSave,
    moved: false
  };

  row.classList.add(
    "dragging"
  );

  document.body.classList.add(
    "reordering"
  );

  try {
    event.currentTarget
      .setPointerCapture(
        pointerId
      );
  } catch (error) {
    /* safe to ignore */
  }

  window.addEventListener(
    "pointermove",
    moveReorder,
    {
      passive: false
    }
  );

  window.addEventListener(
    "pointerup",
    endReorder
  );

  window.addEventListener(
    "pointercancel",
    endReorder
  );
}


/* ------------------------------------------------------------
   MOVE REORDER
   ------------------------------------------------------------ */

function moveReorder(event) {
  if (!activeReorder) {
    return;
  }

  if (
    event.pointerId !==
    activeReorder.pointerId
  ) {
    return;
  }

  event.preventDefault();

  activeReorder.moved =
    true;

  const {
    row,
    container
  } =
    activeReorder;

  const rows =
    Array.from(
      container.children
    ).filter(
      child =>
        child !== row &&
        child.classList.contains(
          "draggable-row"
        )
    );

  let inserted =
    false;

  for (
    const candidate
    of rows
  ) {

    const rect =
      candidate
        .getBoundingClientRect();

    const middle =
      rect.top +
      rect.height / 2;

    if (
      event.clientY <
      middle
    ) {

      container.insertBefore(
        row,
        candidate
      );

      inserted = true;

      break;
    }
  }

  if (!inserted) {
    container.appendChild(
      row
    );
  }
}


/* ------------------------------------------------------------
   END REORDER
   ------------------------------------------------------------ */

async function endReorder(
  event
) {
  if (!activeReorder) {
    return;
  }

  if (
    event?.pointerId != null &&
    event.pointerId !==
      activeReorder.pointerId
  ) {
    return;
  }

  const reorder =
    activeReorder;

  activeReorder =
    null;

  reorder.row.classList.remove(
    "dragging"
  );

  document.body.classList.remove(
    "reordering"
  );

  window.removeEventListener(
    "pointermove",
    moveReorder
  );

  window.removeEventListener(
    "pointerup",
    endReorder
  );

  window.removeEventListener(
    "pointercancel",
    endReorder
  );

  suppressClickUntil =
    Date.now() + 350;

  if (
    typeof reorder.onSave ===
    "function"
  ) {
    await reorder.onSave();
  }
}


/* ============================================================
   MAIN DANCER REORDERING
   ============================================================ */

function setupDancerReordering() {
  dancerList
    ?.querySelectorAll(
      "[data-dancer-drag]"
    )
    .forEach(
      handle => {

        handle.addEventListener(
          "pointerdown",
          event => {

            const row =
              handle.closest(
                "[data-dancer-row]"
              );

            const container =
              row?.closest(
                "[data-dancer-list]"
              );

            if (
              !row ||
              !container
            ) {
              return;
            }

            beginReorder(
              event,
              {
                row,
                container,

                onSave:
                  async () => {
                    await saveDancerOrderFromDOM(
                      container
                    );
                  }
              }
            );
          }
        );
      }
    );
}


async function saveDancerOrderFromDOM(
  container
) {
  const gender =
    container.dataset
      .dancerList;

  const orderedIds =
    Array.from(
      container.querySelectorAll(
        "[data-dancer-row]"
      )
    ).map(
      row =>
        String(
          row.dataset
            .dancerRow
        )
    );

  const ensemble =
    getSelectedEnsemble();

  const reordered =
    orderedIds
      .map(
        id =>
          ensemble.dancers
            .find(
              dancer =>
                sameId(
                  dancer.id,
                  id
                )
            )
      )
      .filter(Boolean);

  const iterator =
    reordered[
      Symbol.iterator
    ]();

  ensemble.dancers =
    ensemble.dancers.map(
      dancer => {

        if (
          normalGender(
            dancer.gender
          ) === gender
        ) {
          return (
            iterator.next()
              .value ||
            dancer
          );
        }

        return dancer;
      }
    );

  saveLocalOnly();

  renderDancers();

  await saveData();
}


/* ============================================================
   MAIN DANCE REORDERING
   NEW ≡ HANDLES
   ============================================================ */

function setupDanceReordering() {
  danceList
    ?.querySelectorAll(
      "[data-dance-drag]"
    )
    .forEach(
      handle => {

        handle.addEventListener(
          "pointerdown",
          event => {

            const row =
              handle.closest(
                "[data-dance-row]"
              );

            const container =
              row?.closest(
                "[data-dance-list]"
              );

            if (
              !row ||
              !container
            ) {
              return;
            }

            beginReorder(
              event,
              {
                row,
                container,

                onSave:
                  async () => {
                    await saveDanceOrderFromDOM(
                      container
                    );
                  }
              }
            );
          }
        );
      }
    );
}


async function saveDanceOrderFromDOM(
  container
) {
  const statusClass =
    container.dataset
      .danceList;

  const inUseGroup =
    statusClass ===
    "in-use";

  const orderedIds =
    Array.from(
      container.querySelectorAll(
        "[data-dance-row]"
      )
    ).map(
      row =>
        String(
          row.dataset
            .danceRow
        )
    );

  const ensemble =
    getSelectedEnsemble();

  const reordered =
    orderedIds
      .map(
        id =>
          ensemble.dances
            .find(
              dance =>
                sameId(
                  dance.id,
                  id
                )
            )
      )
      .filter(Boolean);

  const iterator =
    reordered[
      Symbol.iterator
    ]();

  /*
    Replace only dances belonging
    to this status group.

    This means IN USE dances can
    never accidentally jump into
    NOT IN USE, and vice versa.
  */

  ensemble.dances =
    ensemble.dances.map(
      dance => {

        const danceIsInUse =
          dance.inUse !== false;

        if (
          danceIsInUse ===
          inUseGroup
        ) {
          return (
            iterator.next()
              .value ||
            dance
          );
        }

        return dance;
      }
    );

  saveLocalOnly();

  /*
    Re-render immediately so
    01, 02, 03... update to match
    the new order.
  */

  renderDances();

  await saveData();

  showToast(
    "Dance order saved"
  );
}


/* ============================================================
   DANCERS INSIDE A DANCE REORDERING
   ============================================================ */

function setupDanceDancerReordering(
  dance
) {
  modalBody
    ?.querySelectorAll(
      "[data-dance-dancer-drag]"
    )
    .forEach(
      handle => {

        handle.addEventListener(
          "pointerdown",
          event => {

            const row =
              handle.closest(
                "[data-dance-dancer-row]"
              );

            const container =
              row?.closest(
                "[data-dance-dancer-list]"
              );

            if (
              !row ||
              !container
            ) {
              return;
            }

            beginReorder(
              event,
              {
                row,
                container,

                onSave:
                  async () => {
                    await saveDanceDancerOrderFromDOM(
                      dance,
                      container
                    );
                  }
              }
            );
          }
        );
      }
    );
}


async function saveDanceDancerOrderFromDOM(
  dance,
  container
) {
  const className =
    container.dataset
      .danceDancerList;

  const gender =
    className ===
      "boys"
      ? "Male"
      : className ===
        "girls"
      ? "Female"
      : "Other";

  const orderedIds =
    Array.from(
      container.querySelectorAll(
        "[data-dance-dancer-row]"
      )
    ).map(
      row =>
        String(
          row.dataset
            .danceDancerRow
        )
    );

  if (
    !Array.isArray(
      dance.dancerOrder
    )
  ) {
    dance.dancerOrder =
      [];
  }

  const orderedSet =
    new Set(
      orderedIds.map(
        String
      )
    );

  const oldOrder =
    dance.dancerOrder
      .map(String);

  const replacementIterator =
    orderedIds[
      Symbol.iterator
    ]();

  /*
    Replace only members of the
    selected gender inside this
    dance's custom order.
  */

  const newOrder =
    oldOrder.map(
      dancerId => {

        const dancer =
          findDancer(
            dancerId
          );

        if (
          dancer &&
          normalGender(
            dancer.gender
          ) === gender &&
          orderedSet.has(
            String(
              dancer.id
            )
          )
        ) {
          return (
            replacementIterator
              .next()
              .value ||
            dancerId
          );
        }

        return dancerId;
      }
    );

  /*
    Safety: if an assigned dancer
    was missing from old order,
    append them.
  */

  orderedIds.forEach(
    dancerId => {

      if (
        !newOrder.some(
          id =>
            sameId(
              id,
              dancerId
            )
        )
      ) {
        newOrder.push(
          dancerId
        );
      }
    }
  );

  dance.dancerOrder =
    newOrder;

  saveLocalOnly();

  await saveData();

  /*
    Re-open the dance so the
    numbers update immediately.
  */

  showDance(
    dance.id
  );
}


/* ============================================================
   CALENDAR
   ============================================================ */

let calendarDate =
  new Date();

calendarDate.setDate(1);

let selectedCalendarDate =
  dateToInputValue(
    new Date()
  );


function dateKey(date) {
  return dateToInputValue(
    date
  );
}


function renderCalendar() {
  if (
    !calendarMonth ||
    !calendarGrid
  ) {
    return;
  }

  const year =
    calendarDate
      .getFullYear();

  const month =
    calendarDate
      .getMonth();

  calendarMonth.textContent =
    calendarDate
      .toLocaleDateString(
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
      firstDay
    );

  start.setDate(
    firstDay.getDate() -
    firstDay.getDay()
  );

  const practices =
    getSelectedEnsemble()
      .practices;

  const today =
    dateToInputValue(
      new Date()
    );

  let html = "";

  for (
    let i = 0;
    i < 42;
    i++
  ) {

    const day =
      new Date(
        start
      );

    day.setDate(
      start.getDate() +
      i
    );

    const key =
      dateKey(
        day
      );

    const dayPractices =
      practices.filter(
        practice =>
          practice.date ===
          key
      );

    const otherMonth =
      day.getMonth() !==
      month;

    const selected =
      key ===
      selectedCalendarDate;

    const isToday =
      key === today;

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
            selected
              ? "selected"
              : ""
          }
          ${
            isToday
              ? "today"
              : ""
          }"
        data-calendar-date="${key}"
      >

        <span
          class="day-number"
        >
          ${day.getDate()}
        </span>

        ${
          dayPractices.length
            ? `
              <span
                class="event-dots"
              >
                ${dayPractices
                  .slice(
                    0,
                    3
                  )
                  .map(
                    () =>
                      `
                        <span
                          class="event-dot"
                        ></span>
                      `
                  )
                  .join("")}
              </span>
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
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            selectedCalendarDate =
              button.dataset
                .calendarDate;

            const selected =
              new Date(
                selectedCalendarDate +
                "T12:00:00"
              );

            if (
              selected.getMonth() !==
                calendarDate
                  .getMonth() ||
              selected.getFullYear() !==
                calendarDate
                  .getFullYear()
            ) {
              calendarDate =
                new Date(
                  selected
                    .getFullYear(),
                  selected
                    .getMonth(),
                  1
                );
            }

            renderCalendar();

            renderPractices();
          }
        );
      }
    );
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
        (
          a,
          b
        ) =>
          String(
            a.time ||
            ""
          ).localeCompare(
            String(
              b.time ||
              ""
            )
          )
      );

  if (
    practices.length === 0
  ) {
    practiceList.innerHTML = `
      <div
        class="empty"
      >
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
            class="item-card"
            data-open-practice="${escapeHTML(
              practice.id
            )}"
          >

            <div
              class="practice-date"
            >
              ${
                practice.time
                  ? escapeHTML(
                      formatTime(
                        practice.time
                      )
                    )
                  : "Practice"
              }
            </div>

            <div
              class="item-main"
            >
              <h3>
                ${escapeHTML(
                  practice.title ||
                  practice.name ||
                  "Practice"
                )}
              </h3>

              <p>
                ${escapeHTML(
                  practice.location ||
                  ""
                )}
              </p>
            </div>

            <span
              class="item-arrow"
            >
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
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {
            showPractice(
              button.dataset
                .openPractice
            );
          }
        );
      }
    );
}


/* ============================================================
   ADD PRACTICE
   ONE TIME OR WEEKLY THROUGH END DATE
   ============================================================ */

function showPracticeForm() {
  const initialDate =
    selectedCalendarDate ||
    dateToInputValue(
      new Date()
    );

  openModal({
    eyebrow:
      "SCHEDULE",

    title:
      "Add Practice",

    body: `
      <form
        id="practiceForm"
      >

        <div
          class="form-group"
        >
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

        <div
          class="form-group"
        >
          <label>
            Practice Name
          </label>

          <input
            id="practiceTitleInput"
            required
            value="Practice"
          >
        </div>

        <div
          class="form-group"
        >
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

        <div
          class="form-group"
        >
          <label>
            Time
          </label>

          <input
            type="time"
            id="practiceTimeInput"
          >
        </div>

        <div
          class="form-group"
        >
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
    .forEach(
      button => {

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
              .forEach(
                option => {
                  option.classList
                    .toggle(
                      "selected",
                      option ===
                        button
                    );
                }
              );

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
      }
    );

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
            .trim() ||
          "Practice";

        const startDate =
          startDateInput
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

        if (!startDate) {
          return;
        }

        const ensemble =
          getSelectedEnsemble();

        if (
          recurrence ===
          "once"
        ) {

          ensemble.practices
            .push({
              id:
                uid("practice"),

              title,
              date:
                startDate,
              time,
              location,

              recurrence:
                "once",

              attendance: {}
            });

        } else {

          const endDate =
            endDateInput.value;

          if (!endDate) {
            showToast(
              "Choose an end date"
            );
            return;
          }

          if (
            endDate <
            startDate
          ) {
            showToast(
              "End date must be after the first practice"
            );
            return;
          }

          const seriesId =
            uid("series");

          let currentDate =
            startDate;

          let safetyCount =
            0;

          while (
            currentDate <=
              endDate &&
            safetyCount < 105
          ) {

            ensemble.practices
              .push({
                id:
                  uid(
                    "practice"
                  ),

                title,

                date:
                  currentDate,

                time,

                location,

                recurrence:
                  "weekly",

                seriesId,

                seriesStart:
                  startDate,

                seriesEnd:
                  endDate,

                attendance: {}
              });

            currentDate =
              addDaysToDateString(
                currentDate,
                7
              );

            safetyCount++;
          }
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
            selected
              .getFullYear(),
            selected
              .getMonth(),
            1
          );

        await saveData();

        closeModal();

        renderCalendar();

        renderPractices();

        showToast(
          recurrence ===
            "weekly"
            ? "Weekly practices added"
            : "Practice added"
        );
      }
    );
}


/* ============================================================
   PRACTICE DETAILS + ATTENDANCE
   ============================================================ */

function showPractice(id) {
  const practice =
    findPractice(id);

  if (!practice) {
    return;
  }

  const dancers =
    getSelectedEnsemble()
      .dancers;

  openModal({
    eyebrow:
      "PRACTICE",

    title:
      practice.title ||
      practice.name ||
      "Practice",

    body: `
      <div
        class="detail-card"
      >

        <span
          class="detail-label"
        >
          Date
        </span>

        <div
          class="detail-value"
        >
          ${escapeHTML(
            formatDate(
              practice.date
            )
          )}
        </div>

        ${
          practice.time
            ? `
              <div
                class="practice-time"
              >
                ${escapeHTML(
                  formatTime(
                    practice.time
                  )
                )}
              </div>
            `
            : ""
        }

        ${
          practice.location
            ? `
              <div
                class="practice-time"
              >
                ${escapeHTML(
                  practice.location
                )}
              </div>
            `
            : ""
        }

        ${
          practice.recurrence ===
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
        <span>
          ⌕
        </span>

        <input
          id="attendanceSearch"
          placeholder="Search dancers"
        >
      </div>

      <div
        id="attendanceList"
      ></div>

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

  function renderAttendanceRows() {
    const query =
      String(
        attendanceSearch
          ?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    const filtered =
      dancers.filter(
        dancer =>
          dancerName(
            dancer
          )
            .toLowerCase()
            .includes(
              query
            )
      );

    if (
      filtered.length === 0
    ) {
      attendanceList.innerHTML = `
        <div
          class="empty"
        >
          No dancers found
        </div>
      `;

      drawAttendanceSummary(
        practice
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
                data-attendance-dancer="${escapeHTML(
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

    attendanceList
      .querySelectorAll(
        "[data-attendance-status]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            async () => {

              const dancerId =
                button.dataset
                  .attendanceDancer;

              const status =
                button.dataset
                  .attendanceStatus;

              /*
                Update the data first.
              */

              setAttendanceStatus(
                practice,
                dancerId,
                status
              );

              /*
                Then update this row
                instantly BEFORE waiting
                for Firebase.
              */

              const row =
                button.closest(
                  "[data-attendance-dancer]"
                );

              row
                ?.querySelectorAll(
                  "[data-attendance-status]"
                )
                .forEach(
                  option => {
                    option.classList
                      .toggle(
                        "selected",
                        option.dataset
                          .attendanceStatus ===
                          status
                      );
                  }
                );

              drawAttendanceSummary(
                practice
              );

              saveLocalOnly();

              await saveData();
            }
          );
        }
      );

    drawAttendanceSummary(
      practice
    );
  }

  attendanceSearch
    ?.addEventListener(
      "input",
      renderAttendanceRows
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
              practice,
              dancer.id,
              "present"
            );
          }
        );

        /*
          Instant visual update.
        */

        renderAttendanceRows();

        saveLocalOnly();

        await saveData();

        showToast(
          "Everyone marked present"
        );
      }
    );

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
          getSelectedEnsemble();

        ensemble.practices =
          ensemble.practices
            .filter(
              item =>
                !sameId(
                  item.id,
                  practice.id
                )
            );

        await saveData();

        closeModal();

        renderCalendar();

        renderPractices();

        showToast(
          "Practice deleted"
        );
      }
    );

  renderAttendanceRows();
}


/* ============================================================
   END OF PART 3 OF 4

   Part 4 goes DIRECTLY underneath this line.
   Do not add a <script> tag.
   Do not commit yet.
   ============================================================ */
/* ============================================================
   ATTENDANCE HELPERS
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
      dancerId
    ];

  if (direct) {
    return direct;
  }

  const key =
    Object.keys(
      practice.attendance
    ).find(
      id =>
        sameId(
          id,
          dancerId
        )
    );

  return key
    ? practice.attendance[
        key
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


function practiceAttendanceCounts(
  practice
) {
  const counts = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0
  };

  getSelectedEnsemble()
    .dancers
    .forEach(
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
          counts[
            status
          ]++;
        }
      }
    );

  return counts;
}


function drawAttendanceSummary(
  practice
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
      practice
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
   ONLY "Present" counts as present.

   Late, No Show and Excused
   ALL count as Not Present.
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
        (
          a,
          b
        ) =>
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
    eyebrow:
      "ATTENDANCE",

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
      <div
        class="history-hero"
      >

        <div
          class="history-percent"
        >
          ${stats.percent}%
        </div>

        <div
          class="history-caption"
        >
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
              .map(
                item => {

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
                }
              )
              .join("")
          : `
            <div
              class="empty"
            >
              No attendance recorded yet
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
  updateEnsembleLabels();
}


function showPlaceholder(
  title
) {
  openModal({
    eyebrow:
      "SETTINGS",

    title,

    body: `
      <div
        class="detail-card"
      >
        <p
          style="
            margin:0;
            line-height:1.5;
          "
        >
          This section is ready
          for the next setup step.
        </p>
      </div>
    `
  });
}


/* ============================================================
   INSTRUCTOR NOTES
   ============================================================ */

function showInstructorNotes() {
  const ensemble =
    getSelectedEnsemble();

  openModal({
    eyebrow:
      ensembleName()
        .toUpperCase(),

    title:
      "Instructor Notes",

    fullScreen:
      true,

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

          <span
            id="notesSaveStatus"
          >
            Saved
          </span>
        </div>

        <textarea
          class="instructor-notes-editor"
          id="instructorNotesEditor"
          placeholder="Write instructor notes here..."
        >${escapeHTML(
          ensemble
            .instructorNotes ||
          ""
        )}</textarea>

      </div>
    `
  });

  const editor =
    document.getElementById(
      "instructorNotesEditor"
    );

  const status =
    document.getElementById(
      "notesSaveStatus"
    );

  let timer =
    null;

  editor
    ?.addEventListener(
      "input",
      () => {

        ensemble.instructorNotes =
          editor.value;

        saveLocalOnly();

        if (status) {
          status.textContent =
            "Saving…";
        }

        clearTimeout(
          timer
        );

        timer =
          setTimeout(
            async () => {

              await saveData();

              if (
                status &&
                document.body
                  .contains(
                    status
                  )
              ) {
                status.textContent =
                  "Saved";
              }
            },
            500
          );
      }
    );
}


/* ============================================================
   MODAL
   ============================================================ */

let modalBackAction =
  null;


function openModal({
  eyebrow = "",
  title = "",
  body = "",
  back = null,
  fullScreen = false
}) {
  if (
    !modalOverlay ||
    !modal ||
    !modalBody
  ) {
    return;
  }

  modalBackAction =
    typeof back ===
      "function"
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
    modalBack.classList.toggle(
      "hidden",
      !modalBackAction
    );
  }

  modal.classList.toggle(
    "full-screen-modal",
    fullScreen
  );

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

  modalBody.scrollTop =
    0;
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

  modal?.classList.remove(
    "full-screen-modal"
  );

  modalBackAction =
    null;
}


/* ============================================================
   UPLOAD CANCEL
   ============================================================ */

cancelUploadButton
  ?.addEventListener(
    "click",
    () => {

      hideUpload();

      showToast(
        "Upload screen closed"
      );
    }
  );


/* ============================================================
   MAIN EVENT LISTENERS
   ============================================================ */

navButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const page =
          button.dataset.page;

        if (page) {
          openPage(
            page
          );
        }
      }
    );
  }
);


dancerSearch
  ?.addEventListener(
    "input",
    renderDancers
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


todayButton
  ?.addEventListener(
    "click",
    () => {

      const today =
        new Date();

      selectedCalendarDate =
        dateToInputValue(
          today
        );

      calendarDate =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );

      renderCalendar();

      renderPractices();
    }
  );


modalBack
  ?.addEventListener(
    "click",
    () => {

      if (
        typeof modalBackAction ===
        "function"
      ) {

        const action =
          modalBackAction;

        modalBackAction =
          null;

        action();
      }
    }
  );


closeModalButton
  ?.addEventListener(
    "click",
    closeModal
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
      "Escape"
    ) {

      if (
        uploadOverlay
          ?.classList
          .contains(
            "open"
          )
      ) {
        hideUpload();
        return;
      }

      if (
        modalOverlay
          ?.classList
          .contains(
            "open"
          )
      ) {
        closeModal();
      }
    }
  }
);


manageEnsemblesButton
  ?.addEventListener(
    "click",
    () => {
      showPlaceholder(
        "Manage Ensembles"
      );
    }
  );


accountsButton
  ?.addEventListener(
    "click",
    () => {
      showPlaceholder(
        "Instructor Accounts"
      );
    }
  );


permissionsButton
  ?.addEventListener(
    "click",
    () => {
      showPlaceholder(
        "Permissions"
      );
    }
  );


/* ============================================================
   INSTRUCTOR NOTES SETTINGS ROW
   Supports either ID used by the page.
   ============================================================ */

function setupInstructorNotesButton() {
  const possibleButtons = [
    document.getElementById(
      "instructorNotesButton"
    ),

    document.getElementById(
      "instructorNotes"
    ),

    document.querySelector(
      "[data-instructor-notes]"
    )
  ].filter(Boolean);

  const uniqueButtons =
    [...new Set(
      possibleButtons
    )];

  uniqueButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        showInstructorNotes
      );
    }
  );
}


/* ============================================================
   CALENDAR ARROWS
   ============================================================ */

function setupCalendarArrows() {
  const previousButton =
    document.getElementById(
      "prevMonth"
    ) ||
    document.getElementById(
      "previousMonth"
    );

  const nextButton =
    document.getElementById(
      "nextMonth"
    );

  previousButton
    ?.addEventListener(
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

  nextButton
    ?.addEventListener(
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


/* ============================================================
   FIREBASE SYNC
   ============================================================ */

function setupFirebaseSync() {
  const fb =
    getFirebase();

  if (!fb) {

    console.warn(
      "Firebase is not available yet."
    );

    return;
  }

  firebaseReady =
    true;

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

      /*
        If Firebase already contains
        app data, use it.
      */

      if (
        cloudData &&
        Array.isArray(
          cloudData.ensembles
        )
      ) {

        applyingCloudUpdate =
          true;

        data =
          normalizeData(
            cloudData
          );

        saveLocalOnly();

        renderAll();

        applyingCloudUpdate =
          false;

        return;
      }

      /*
        If Firebase is empty, upload
        the current local data once.
      */

      if (!cloudData) {

        fb.set(
          cloudReference,
          data
        ).catch(
          error => {

            console.error(
              "Initial Firebase upload failed:",
              error
            );
          }
        );
      }
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

  /*
    Keep whichever page index.html
    marked active. If none is active,
    open Home.
  */

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
    index.html creates
    window.vukFirebase before this
    script runs, but this tiny delay
    also protects against timing
    differences in Safari.
  */

  setTimeout(
    setupFirebaseSync,
    0
  );
}


startApp();


/* ============================================================
   END OF SCRIPT.JS — V9.2
   ============================================================ */
