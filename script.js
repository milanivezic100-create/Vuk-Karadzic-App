// ==========================================
// VUK KARADZIC PROBE
// V5
// ==========================================

const STORAGE_KEY = "vukProbeV4";
const CLOUD_ROOT = "vukProbeV4";


// ==========================================
// DEFAULT DATA
// ==========================================

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
  selectedEnsemble: 2,

  ensembles: [
    createEnsemble("First Ensemble", "First"),
    createEnsemble("Second Ensemble", "Second"),
    createEnsemble("Third Ensemble", "Third"),
    createEnsemble("Fourth Ensemble", "Fourth"),
    createEnsemble("Fifth Ensemble", "Fifth")
  ]
};


// ==========================================
// LOAD EXISTING DATA
// ==========================================

let data;

try {
  const saved =
    localStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem("vukProbeV3");

  data = saved
    ? JSON.parse(saved)
    : JSON.parse(JSON.stringify(defaultData));

} catch (error) {
  console.error("Local data could not be loaded:", error);

  data =
    JSON.parse(
      JSON.stringify(defaultData)
    );
}


let cloudReady = false;
let applyingCloud = false;

let selectedCalendarDate = null;

let calendarDate =
  new Date();

let notesTimer = null;


// ==========================================
// GENERAL HELPERS
// ==========================================

function uid() {
  return (
    Date.now() +
    Math.floor(
      Math.random() * 1000000
    )
  );
}


function normalizeData() {

  if (
    !data ||
    !Array.isArray(data.ensembles)
  ) {
    data =
      JSON.parse(
        JSON.stringify(defaultData)
      );
  }


  if (
    !Number.isInteger(
      data.selectedEnsemble
    ) ||
    !data.ensembles[
      data.selectedEnsemble
    ]
  ) {
    data.selectedEnsemble = 2;
  }


  data.ensembles.forEach(
    ensembleItem => {

      ensembleItem.dancers =
        Array.isArray(
          ensembleItem.dancers
        )
          ? ensembleItem.dancers
          : [];


      ensembleItem.dances =
        Array.isArray(
          ensembleItem.dances
        )
          ? ensembleItem.dances
          : [];


      ensembleItem.practices =
        Array.isArray(
          ensembleItem.practices
        )
          ? ensembleItem.practices
          : [];


      ensembleItem.instructorNotes =
        ensembleItem.instructorNotes ||
        "";


      ensembleItem.dancers.forEach(
        (dancer, index) => {

          dancer.notes =
            dancer.notes || "";


          if (
            dancer.order === undefined ||
            dancer.order === null
          ) {
            dancer.order = index;
          }

        }
      );


      ensembleItem.dances.forEach(
        (dance, index) => {

          dance.dancerIds =
            Array.isArray(
              dance.dancerIds
            )
              ? dance.dancerIds
              : [];


          dance.images =
            Array.isArray(
              dance.images
            )
              ? dance.images
              : [];


          dance.imageNames =
            Array.isArray(
              dance.imageNames
            )
              ? dance.imageNames
              : [];


          dance.musicName =
            dance.musicName || "";


          dance.music =
            dance.music &&
            typeof dance.music ===
              "object"

              ? dance.music
              : null;


          if (
            dance.order === undefined ||
            dance.order === null
          ) {
            dance.order = index;
          }

        }
      );


      ensembleItem.practices.forEach(
        practice => {

          practice.attendance =
            practice.attendance &&
            typeof practice.attendance ===
              "object"

              ? practice.attendance
              : {};

        }
      );

    }
  );

}


normalizeData();


function ensemble() {

  return data.ensembles[
    data.selectedEnsemble
  ];

}


function localBackup() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

}


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
    dbRef(
      database,
      CLOUD_ROOT
    ),
    data
  )
  .catch(
    error => {

      console.error(
        "Firebase save failed:",
        error
      );

      showToast(
        "Saved on this device. Cloud sync failed."
      );

    }
  );

}


function escapeHTML(value = "") {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


function localDate(dateString) {

  return new Date(
    dateString +
    "T12:00:00"
  );

}


function dateKey(date) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

}


function formatDate(dateString) {

  return localDate(
    dateString
  )
  .toLocaleDateString(
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

  return localDate(
    dateString
  )
  .toLocaleDateString(
    [],
    {
      weekday: "short",
      month: "short",
      day: "numeric"
    }
  );

}


function formatTime(time) {

  if (!time) {
    return "—";
  }


  const [
    hours,
    minutes
  ] = time.split(":");


  const date =
    new Date();


  date.setHours(
    Number(hours),
    Number(minutes)
  );


  return date
    .toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit"
      }
    );

}


function showToast(message) {

  const toast =
    document.getElementById(
      "appToast"
    );


  if (!toast) {
    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      1800
    );

}


function showUploading(
  visible,
  message = "Uploading..."
) {

  const overlay =
    document.getElementById(
      "uploadOverlay"
    );


  const label =
    document.getElementById(
      "uploadMessage"
    );


  if (!overlay) {
    return;
  }


  if (label) {
    label.textContent =
      message;
  }


  overlay.classList.toggle(
    "open",
    Boolean(visible)
  );


  overlay.setAttribute(
    "aria-hidden",
    visible
      ? "false"
      : "true"
  );

}


// ==========================================
// PAGE NAVIGATION
// ==========================================

const pages =
  document.querySelectorAll(
    ".page"
  );


const navButtons =
  document.querySelectorAll(
    ".nav-button"
  );


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


  renderAll();

  window.scrollTo(
    0,
    0
  );

}


navButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        openPage(
          button.dataset.page
        );

      }
    );

  }
);


// ==========================================
// MODAL
// ==========================================

const modalOverlay =
  document.getElementById(
    "modalOverlay"
  );


const modalBody =
  document.getElementById(
    "modalBody"
  );


const modalTitle =
  document.getElementById(
    "modalTitle"
  );


const modalEyebrow =
  document.getElementById(
    "modalEyebrow"
  );


const modalBack =
  document.getElementById(
    "modalBack"
  );


function openModal(
  title,
  eyebrow,
  html,
  backAction = null
) {

  modalTitle.textContent =
    title;


  modalEyebrow.textContent =
    eyebrow || "VUK";


  modalBody.innerHTML =
    html;


  if (backAction) {

    modalBack.classList.remove(
      "hidden"
    );

    modalBack.onclick =
      backAction;

  } else {

    modalBack.classList.add(
      "hidden"
    );

    modalBack.onclick =
      null;

  }


  modalOverlay.classList.add(
    "open"
  );

}


function closeModal() {

  modalOverlay.classList.remove(
    "open"
  );


  modalBody.innerHTML =
    "";

}


document
  .getElementById(
    "closeModal"
  )
  .addEventListener(
    "click",
    closeModal
  );


modalOverlay.addEventListener(
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


// ==========================================
// HEADER + ENSEMBLES
// ==========================================

function renderHeader() {

  document
    .getElementById(
      "currentEnsembleName"
    )
    .textContent =
      ensemble().shortName;

}


function renderEnsembles() {

  const container =
    document.getElementById(
      "ensembleList"
    );


  container.innerHTML =
    "";


  data.ensembles.forEach(
    (item, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "ensemble-card";


      if (
        index ===
        data.selectedEnsemble
      ) {

        button.classList.add(
          "selected"
        );

      }


      button.innerHTML = `

        <div class="ensemble-number">

          ${
            String(index + 1)
              .padStart(
                2,
                "0"
              )
          }

        </div>


        <div>

          <h3>
            ${escapeHTML(item.name)}
          </h3>

          <p>

            ${item.dancers.length}
            dancers ·
            ${item.dances.length}
            dances

          </p>

        </div>


        <div class="radio"></div>

      `;


      button.onclick =
        () => {

          data.selectedEnsemble =
            index;


          selectedCalendarDate =
            null;


          saveData();

          renderAll();

        };


      container.appendChild(
        button
      );

    }
  );

}


document
  .getElementById(
    "ensembleButton"
  )
  .onclick =
    () => {

      openPage(
        "homePage"
      );

    };


// ==========================================
// DANCER ORDERING
// ==========================================

function groupDancers(
  gender,
  search = ""
) {

  const query =
    search
      .trim()
      .toLowerCase();


  return ensemble()
    .dancers

    .filter(
      dancer =>
        dancer.gender ===
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
        (a.order || 0) -
        (b.order || 0)
    );

}


function moveDancer(
  dancerId,
  direction
) {

  const dancer =
    ensemble()
      .dancers
      .find(
        item =>
          item.id ===
            dancerId
      );


  if (!dancer) {
    return;
  }


  const group =
    ensemble()
      .dancers

      .filter(
        item =>
          item.gender ===
            dancer.gender
      )

      .sort(
        (a, b) =>
          (a.order || 0) -
          (b.order || 0)
      );


  const currentIndex =
    group.findIndex(
      item =>
        item.id ===
          dancerId
    );


  const newIndex =
    currentIndex +
    direction;


  if (
    newIndex < 0 ||
    newIndex >=
      group.length
  ) {
    return;
  }


  const other =
    group[newIndex];


  const oldOrder =
    dancer.order;


  dancer.order =
    other.order;


  other.order =
    oldOrder;


  saveData();

  renderDancers();

}


// ==========================================
// ATTENDANCE CALCULATIONS
// ==========================================

function dancerAttendanceStats(
  dancerId
) {

  let present = 0;

  let late = 0;

  let absent = 0;

  let excused = 0;

  let recorded = 0;


  ensemble()
    .practices
    .forEach(
      practice => {

        const status =
          practice.attendance[
            dancerId
          ];


        if (!status) {
          return;
        }


        recorded++;


        if (
          status ===
          "present"
        ) {

          present++;

        } else if (
          status ===
          "late"
        ) {

          late++;

        } else if (
          status ===
          "absent"
        ) {

          absent++;

        } else if (
          status ===
          "excused"
        ) {

          excused++;

        }

      }
    );


  /*
    IMPORTANT:

    For the attendance circle:

    Present = Present

    Late,
    No Show,
    and Excused

    all count as NOT PRESENT.

    Example:

    Present
    Present
    Present
    Late

    = 75% Present
    = 25% Not Present
  */

  const percentage =
    recorded === 0

      ? null

      : Math.round(
          (
            present /
            recorded
          ) *
          100
        );


  const notPresent =
    recorded -
    present;


  const notPresentPercentage =
    recorded === 0

      ? null

      : Math.round(
          (
            notPresent /
            recorded
          ) *
          100
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


// ==========================================
// DANCER LIST
// ==========================================

function renderDancers() {

  document
    .getElementById(
      "dancerEnsemble"
    )
    .textContent =
      ensemble().name;


  const container =
    document.getElementById(
      "dancerList"
    );


  const search =
    document
      .getElementById(
        "dancerSearch"
      )
      .value;


  container.innerHTML =
    "";


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


  let hasDancers =
    false;


  groups.forEach(
    group => {

      const dancers =
        groupDancers(
          group.gender,
          search
        );


      if (
        !dancers.length
      ) {
        return;
      }


      hasDancers =
        true;


      const section =
        document.createElement(
          "section"
        );


      section.className =
        "roster-section";


      section.innerHTML = `

        <div
          class="
            roster-title
            ${group.css}
          "
        >

          ${group.title}

        </div>


        <div
          class="roster-list"
        ></div>

      `;


      const list =
        section.querySelector(
          ".roster-list"
        );


      dancers.forEach(
        (dancer, index) => {

          const row =
            document.createElement(
              "div"
            );


          row.className =
            "dancer-row reorderable-row";


          row.innerHTML = `

            <button
              class="dancer-open"
              type="button"
            >

              <span
                class="
                  dancer-number
                  ${group.numberCSS}
                "
              >

                ${
                  String(index + 1)
                    .padStart(
                      2,
                      "0"
                    )
                }

              </span>


              <strong>

                ${
                  escapeHTML(
                    dancer.name
                  )
                }

              </strong>


              <span
                class="dancer-height"
              >

                ${
                  dancer.height
                    ? escapeHTML(
                        dancer.height
                      ) +
                      " cm"

                    : "—"
                }

              </span>


              <span class="chevron">
                ›
              </span>

            </button>


            <div
              class="reorder-controls"
            >

              <button
                type="button"
                class="move-up"
                aria-label="Move dancer up"
              >
                ↑
              </button>


              <button
                type="button"
                class="move-down"
                aria-label="Move dancer down"
              >
                ↓
              </button>

            </div>

          `;


          row
            .querySelector(
              ".dancer-open"
            )
            .onclick =
              () => {

                showDancer(
                  dancer.id
                );

              };


          row
            .querySelector(
              ".move-up"
            )
            .onclick =
              () => {

                moveDancer(
                  dancer.id,
                  -1
                );

              };


          row
            .querySelector(
              ".move-down"
            )
            .onclick =
              () => {

                moveDancer(
                  dancer.id,
                  1
                );

              };


          list.appendChild(
            row
          );

        }
      );


      container.appendChild(
        section
      );

    }
  );


  if (
    !hasDancers
  ) {

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
  .getElementById(
    "dancerSearch"
  )
  .addEventListener(
    "input",
    renderDancers
  );


// ==========================================
// DANCER PROFILE
// ==========================================

function showDancer(
  dancerId
) {

  const dancer =
    ensemble()
      .dancers
      .find(
        item =>
          item.id ===
            dancerId
      );


  if (!dancer) {
    return;
  }


  const stats =
    dancerAttendanceStats(
      dancer.id
    );


  const percentText =
    stats.percentage === null

      ? "—"

      : stats.percentage +
        "%";


  const notPresentText =
    stats.notPresentPercentage ===
      null

      ? "—"

      : stats
          .notPresentPercentage +
        "%";


  openModal(

    dancer.name,

    "DANCER PROFILE",

    `

      <div class="profile-card">

        <div class="profile-name">

          ${
            escapeHTML(
              dancer.name
            )
          }

        </div>


        <div class="profile-grid">

          <div class="profile-stat">

            <span>
              Gender
            </span>

            <strong>

              ${
                escapeHTML(
                  dancer.gender ||
                  "—"
                )
              }

            </strong>

          </div>


          <div class="profile-stat">

            <span>
              Height
            </span>

            <strong>

              ${
                dancer.height

                  ? escapeHTML(
                      dancer.height
                    ) +
                    " cm"

                  : "—"
              }

            </strong>

          </div>


          <div class="profile-stat">

            <span>
              Shoe Size
            </span>

            <strong>

              ${
                escapeHTML(
                  dancer.shoeSize ||
                  "—"
                )
              }

            </strong>

          </div>


          <div class="profile-stat">

            <span>
              Ensemble
            </span>

            <strong>

              ${
                escapeHTML(
                  ensemble()
                    .shortName
                )
              }

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


            <div
              class="attendance-percent"
            >

              <strong>
                ${percentText}
              </strong>

              <span>
                Present
              </span>

            </div>


            <div
              class="not-present-percent"
            >

              ${notPresentText}
              Not Present

            </div>

          </div>


          <div
            class="attendance-mini"
          >

            <span>
              Present
            </span>

            <strong
              class="present"
            >
              ${stats.present}
            </strong>


            <span>
              Late
            </span>

            <strong
              class="late"
            >
              ${stats.late}
            </strong>


            <span>
              No Show
            </span>

            <strong
              class="absent"
            >
              ${stats.absent}
            </strong>


            <span>
              Excused
            </span>

            <strong
              class="excused"
            >
              ${stats.excused}
            </strong>

          </div>

        </button>

      </div>


      <div class="notes-card">

        <h3>
          Notes
        </h3>

        <p>

          ${
            dancer.notes

              ? escapeHTML(
                  dancer.notes
                )

              : "No notes added."
          }

        </p>

      </div>


      <button
        id="editDancer"
        class="primary-button"
        type="button"
        style="margin-top:15px"
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
    .getElementById(
      "attendanceProfile"
    )
    .onclick =
      () => {

        showDancerAttendance(
          dancer.id
        );

      };


  document
    .getElementById(
      "editDancer"
    )
    .onclick =
      () => {

        dancerForm(
          dancer,
          true
        );

      };


  document
    .getElementById(
      "deleteDancer"
    )
    .onclick =
      () => {

        if (
          !confirm(
            `Delete ${dancer.name}?`
          )
        ) {
          return;
        }


        ensemble().dancers =
          ensemble()
            .dancers
            .filter(
              item =>
                item.id !==
                  dancer.id
            );


        ensemble()
          .dances
          .forEach(
            dance => {

              dance.dancerIds =
                dance.dancerIds
                  .filter(
                    id =>
                      id !==
                        dancer.id
                  );

            }
          );


        ensemble()
          .practices
          .forEach(
            practice => {

              delete practice
                .attendance[
                  dancer.id
                ];

            }
          );


        saveData();

        closeModal();

        renderAll();

      };

}


// ==========================================
// DANCER ATTENDANCE HISTORY
// ==========================================

function showDancerAttendance(
  dancerId
) {

  const dancer =
    ensemble()
      .dancers
      .find(
        item =>
          item.id ===
            dancerId
      );


  if (!dancer) {
    return;
  }


  const stats =
    dancerAttendanceStats(
      dancerId
    );


  const history =
    [...ensemble().practices]

      .filter(
        practice =>
          practice.attendance[
            dancerId
          ]
      )

      .sort(
        (a, b) =>
          localDate(b.date) -
          localDate(a.date)
      );


  const percentage =
    stats.percentage === null

      ? "—"

      : stats.percentage +
        "%";


  const notPresent =
    stats.notPresentPercentage ===
      null

      ? "—"

      : stats
          .notPresentPercentage +
        "%";


  openModal(

    "Attendance",

    "DANCER HISTORY",

    `

      <div class="history-hero">

        <div
          class="history-percent"
        >

          ${percentage}

        </div>


        <div
          class="history-caption"
        >

          Present

        </div>


        <div
          class="history-not-present"
        >

          ${notPresent}
          Not Present

        </div>

      </div>


      <div
        class="
          attendance-summary
          four
        "
      >

        <div
          class="
            summary-box
            present
          "
        >

          <strong>
            ${stats.present}
          </strong>

          <span>
            PRESENT
          </span>

        </div>


        <div
          class="
            summary-box
            late
          "
        >

          <strong>
            ${stats.late}
          </strong>

          <span>
            LATE
          </span>

        </div>


        <div
          class="
            summary-box
            absent
          "
        >

          <strong>
            ${stats.absent}
          </strong>

          <span>
            NO SHOW
          </span>

        </div>


        <div
          class="
            summary-box
            excused
          "
        >

          <strong>
            ${stats.excused}
          </strong>

          <span>
            EXCUSED
          </span>

        </div>

      </div>


      <h3
        class="detail-heading"
      >

        Individual History

      </h3>


      ${
        history.length

          ? history
              .map(
                practice => {

                  const status =
                    practice
                      .attendance[
                        dancerId
                      ];


                  let label =
                    status;


                  if (
                    status ===
                    "present"
                  ) {
                    label =
                      "Present";
                  }


                  if (
                    status ===
                    "late"
                  ) {
                    label =
                      "Late";
                  }


                  if (
                    status ===
                    "absent"
                  ) {
                    label =
                      "No Show";
                  }


                  if (
                    status ===
                    "excused"
                  ) {
                    label =
                      "Excused";
                  }


                  return `

                    <div
                      class="history-row"
                    >

                      <div>

                        <strong>

                          ${
                            escapeHTML(
                              practice.name
                            )
                          }

                        </strong>

                        <p>

                          ${
                            formatDate(
                              practice.date
                            )
                          }

                        </p>

                      </div>


                      <span
                        class="
                          history-status
                          ${status}
                        "
                      >

                        ${label}

                      </span>

                    </div>

                  `;

                }
              )
              .join("")

          : `

              <div class="empty">

                No attendance
                recorded yet.

              </div>

            `
      }

    `,

    () => {

      showDancer(
        dancerId
      );

    }

  );

}


// ==========================================
// ADD / EDIT DANCER
// ==========================================

function dancerForm(
  dancer = null,
  fromProfile = false
) {

  const editing =
    Boolean(dancer);


  openModal(

    editing
      ? "Edit Dancer"
      : "Add Dancer",

    "ROSTER",

    `

      <div class="form-group">

        <label>
          Full Name
        </label>

        <input
          id="dName"
          value="${
            editing
              ? escapeHTML(
                  dancer.name
                )
              : ""
          }"
          placeholder="Full name"
        >

      </div>


      <div class="form-group">

        <label>
          Gender
        </label>

        <select id="dGender">

          <option value="">
            Select
          </option>


          <option
            value="Male"
            ${
              dancer?.gender ===
                "Male"
                ? "selected"
                : ""
            }
          >
            Male
          </option>


          <option
            value="Female"
            ${
              dancer?.gender ===
                "Female"
                ? "selected"
                : ""
            }
          >
            Female
          </option>


          <option
            value="Other"
            ${
              dancer?.gender ===
                "Other"
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
            Height (cm)
          </label>

          <input
            id="dHeight"
            type="number"
            inputmode="decimal"
            value="${
              editing
                ? escapeHTML(
                    dancer.height ||
                    ""
                  )
                : ""
            }"
          >

        </div>


        <div class="form-group">

          <label>
            Shoe Size
          </label>

          <input
            id="dShoe"
            value="${
              editing
                ? escapeHTML(
                    dancer.shoeSize ||
                    ""
                  )
                : ""
            }"
          >

        </div>

      </div>


      <div class="form-group">

        <label>
          Notes
        </label>

        <textarea
          id="dNotes"
          placeholder="Notes about this dancer..."
        >${
          editing
            ? escapeHTML(
                dancer.notes ||
                ""
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

    fromProfile &&
    dancer

      ? () => {

          showDancer(
            dancer.id
          );

        }

      : null

  );


  document
    .getElementById(
      "saveDancer"
    )
    .onclick =
      () => {

        const name =
          document
            .getElementById(
              "dName"
            )
            .value
            .trim();


        const gender =
          document
            .getElementById(
              "dGender"
            )
            .value;


        if (
          !name ||
          !gender
        ) {

          alert(
            "Please enter the dancer's name and gender."
          );

          return;

        }


        const height =
          document
            .getElementById(
              "dHeight"
            )
            .value;


        const shoeSize =
          document
            .getElementById(
              "dShoe"
            )
            .value
            .trim();


        const notes =
          document
            .getElementById(
              "dNotes"
            )
            .value
            .trim();


        if (editing) {

          const oldGender =
            dancer.gender;


          dancer.name =
            name;

          dancer.gender =
            gender;

          dancer.height =
            height;

          dancer.shoeSize =
            shoeSize;

          dancer.notes =
            notes;


          if (
            oldGender !==
            gender
          ) {

            const newGroup =
              ensemble()
                .dancers
                .filter(
                  item =>
                    item.gender ===
                      gender
                );


            dancer.order =
              Math.max(
                -1,
                ...newGroup.map(
                  item =>
                    item.order || 0
                )
              ) + 1;

          }

        } else {

          const sameGender =
            ensemble()
              .dancers
              .filter(
                item =>
                  item.gender ===
                    gender
              );


          const order =
            Math.max(
              -1,
              ...sameGender.map(
                item =>
                  item.order || 0
              )
            ) + 1;


          ensemble()
            .dancers
            .push({

              id: uid(),

              name,

              gender,

              height,

              shoeSize,

              notes,

              order

            });

        }


        saveData();

        renderAll();


        if (editing) {

          showDancer(
            dancer.id
          );

        } else {

          closeModal();

        }

      };

}


document
  .getElementById(
    "addDancerButton"
  )
  .onclick =
    () => {

      dancerForm();

    };


// ==========================================
// DANCES
// ==========================================

function orderedDances() {

  return [...ensemble().dances]
    .sort(
      (a, b) =>
        (a.order || 0) -
        (b.order || 0)
    );

}


function moveDance(
  danceId,
  direction
) {

  const dances =
    orderedDances();


  const currentIndex =
    dances.findIndex(
      dance =>
        dance.id ===
          danceId
    );


  const newIndex =
    currentIndex +
    direction;


  if (
    currentIndex < 0 ||
    newIndex < 0 ||
    newIndex >=
      dances.length
  ) {
    return;
  }


  const first =
    dances[
      currentIndex
    ];


  const second =
    dances[
      newIndex
    ];


  const oldOrder =
    first.order;


  first.order =
    second.order;


  second.order =
    oldOrder;


  saveData();

  renderDances();

}


function renderDances() {

  document
    .getElementById(
      "danceEnsemble"
    )
    .textContent =
      ensemble().name;


  const container =
    document.getElementById(
      "danceList"
    );


  container.innerHTML =
    "";


  const dances =
    orderedDances();


  if (
    !dances.length
  ) {

    container.innerHTML = `

      <div class="empty">

        No dances yet.
        <br>
        Tap + to add your first dance.

      </div>

    `;

    return;

  }


  dances.forEach(
    dance => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "item-card dance-list-row";


      row.innerHTML = `

        <button
          class="dance-open"
          type="button"
        >

          <div class="item-main">

            <h3>

              ${
                escapeHTML(
                  dance.name
                )
              }

            </h3>


            <p>

              ${
                escapeHTML(
                  dance.choreographer ||
                  "No choreographer"
                )
              }

              ·

              ${
                dance
                  .dancerIds
                  .length
              }

              dancers

            </p>

          </div>


          <span
            class="item-arrow"
          >
            ›
          </span>

        </button>


        <div
          class="reorder-controls"
        >

          <button
            class="dance-up"
            type="button"
          >
            ↑
          </button>


          <button
            class="dance-down"
            type="button"
          >
            ↓
          </button>

        </div>

      `;


      row
        .querySelector(
          ".dance-open"
        )
        .onclick =
          () => {

            showDance(
              dance.id
            );

          };


      row
        .querySelector(
          ".dance-up"
        )
        .onclick =
          () => {

            moveDance(
              dance.id,
              -1
            );

          };


      row
        .querySelector(
          ".dance-down"
        )
        .onclick =
          () => {

            moveDance(
              dance.id,
              1
            );

          };


      container.appendChild(
        row
      );

    }
  );

}


// ==========================================
// ADD / EDIT DANCE
// ==========================================

function danceForm(
  dance = null
) {

  const editing =
    Boolean(dance);


  openModal(

    editing
      ? "Edit Dance"
      : "Add Dance",

    "REPERTOIRE",

    `

      <div class="form-group">

        <label>
          Dance Name
        </label>

        <input
          id="danceName"
          value="${
            editing
              ? escapeHTML(
                  dance.name
                )
              : ""
          }"
          placeholder="Dance name"
        >

      </div>


      <div class="form-group">

        <label>
          Choreographer
        </label>

        <input
          id="danceChoreographer"
          value="${
            editing
              ? escapeHTML(
                  dance.choreographer ||
                  ""
                )
              : ""
          }"
          placeholder="Choreographer"
        >

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

      ? () => {

          showDance(
            dance.id
          );

        }

      : null

  );


  document
    .getElementById(
      "saveDance"
    )
    .onclick =
      () => {

        const name =
          document
            .getElementById(
              "danceName"
            )
            .value
            .trim();


        if (!name) {

          alert(
            "Please enter a dance name."
          );

          return;

        }


        const choreographer =
          document
            .getElementById(
              "danceChoreographer"
            )
            .value
            .trim();


        if (editing) {

          dance.name =
            name;

          dance.choreographer =
            choreographer;

        } else {

          ensemble()
            .dances
            .push({

              id: uid(),

              name,

              choreographer,

              dancerIds: [],

              images: [],

              music: null,

              imageNames: [],

              musicName: "",

              order:
                ensemble()
                  .dances
                  .length

            });

        }


        saveData();

        renderAll();


        if (editing) {

          showDance(
            dance.id
          );

        } else {

          closeModal();

        }

      };

}


document
  .getElementById(
    "addDanceButton"
  )
  .onclick =
    () => {

      danceForm();

    };


// ==========================================
// DANCE DANCERS
// ==========================================

function danceDancers(
  dance
) {

  return dance
    .dancerIds

    .map(
      dancerId =>
        ensemble()
          .dancers
          .find(
            dancer =>
              dancer.id ===
                dancerId
          )
    )

    .filter(Boolean);

}


// ==========================================
// DANCE PROFILE
// ==========================================

function showDance(
  danceId
) {

  const dance =
    ensemble()
      .dances
      .find(
        item =>
          item.id ===
            danceId
      );


  if (!dance) {
    return;
  }


  const selectedDancers =
    danceDancers(
      dance
    );


  function dancerGroupHTML(
    gender,
    title
  ) {

    const group =
      selectedDancers
        .filter(
          dancer =>
            dancer.gender ===
              gender
        );


    if (
      !group.length
    ) {
      return "";
    }


    return `

      <div
        class="mini-group-title"
      >

        ${title}

      </div>


      ${
        group
          .map(
            (dancer, index) => `

              <div
                class="selected-dancer"
              >

                ${index + 1}.

                ${
                  escapeHTML(
                    dancer.name
                  )
                }

              </div>

            `
          )
          .join("")
      }

    `;

  }


  const dancerHTML =

    dancerGroupHTML(
      "Male",
      "BOYS"
    ) +

    dancerGroupHTML(
      "Female",
      "GIRLS"
    ) +

    dancerGroupHTML(
      "Other",
      "OTHER"
    );


  const photoHTML =
    dance.images.length

      ? `

          <div
            class="media-grid"
          >

            ${
              dance.images
                .map(
                  (
                    image,
                    index
                  ) => `

                    <div
                      class="media-tile"
                    >

                      <img
                        src="${
                          escapeHTML(
                            image.url
                          )
                        }"
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
                )
                .join("")
            }

          </div>

        `

      : `

          <div class="file-box">

            No photos uploaded yet.

          </div>

        `;


  const musicHTML =
    dance.music &&
    dance.music.url

      ? `

          <div class="audio-card">

            <strong>

              ${
                escapeHTML(
                  dance.music.name ||
                  "Dance music"
                )
              }

            </strong>


            <audio
              controls
              preload="metadata"
              src="${
                escapeHTML(
                  dance.music.url
                )
              }"
            ></audio>


            <button
              id="deleteMusic"
              class="danger-button"
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

    "DANCE",

    `

      <div class="detail-card">

        <div class="detail-label">
          Choreographer
        </div>


        <div class="detail-value">

          ${
            escapeHTML(
              dance.choreographer ||
              "—"
            )
          }

        </div>

      </div>


      <h3 class="detail-heading">
        Dancers
      </h3>


      ${
        dancerHTML ||

        `

          <div class="empty">

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


      <label
        class="upload-button"
      >

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


      <label
        class="upload-button"
      >

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
        style="margin-top:18px"
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
    .onclick =
      () => {

        editDanceDancers(
          dance.id
        );

      };


  document
    .getElementById(
      "editDance"
    )
    .onclick =
      () => {

        danceForm(
          dance
        );

      };


  document
    .querySelectorAll(
      "[data-image-index]"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            deleteDanceImage(
              dance,
              Number(
                button.dataset
                  .imageIndex
              )
            );

          };

      }
    );


  document
    .getElementById(
      "photoUpload"
    )
    .onchange =
      event => {

        uploadDancePhotos(
          dance,
          [
            ...event
              .target
              .files
          ]
        );

      };


  document
    .getElementById(
      "musicUpload"
    )
    .onchange =
      event => {

        const file =
          event
            .target
            .files[0];


        if (file) {

          uploadDanceMusic(
            dance,
            file
          );

        }

      };


  const deleteMusicButton =
    document.getElementById(
      "deleteMusic"
    );


  if (
    deleteMusicButton
  ) {

    deleteMusicButton.onclick =
      () => {

        deleteDanceMusic(
          dance
        );

      };

  }


  document
    .getElementById(
      "deleteDance"
    )
    .onclick =
      async () => {

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
            const image
            of dance.images
          ) {

            if (
              image.path
            ) {

              await deleteStoragePath(
                image.path
              );

            }

          }


          if (
            dance.music?.path
          ) {

            await deleteStoragePath(
              dance.music.path
            );

          }

        } catch (error) {

          console.error(
            error
          );

        }


        ensemble().dances =
          ensemble()
            .dances
            .filter(
              item =>
                item.id !==
                  dance.id
            );


        saveData();

        showUploading(
          false
        );

        closeModal();

        renderAll();

      };

}


// ==========================================
// SELECT + ORDER DANCERS FOR DANCE
// ==========================================

function editDanceDancers(
  danceId
) {

  const dance =
    ensemble()
      .dances
      .find(
        item =>
          item.id ===
            danceId
      );


  if (!dance) {
    return;
  }


  function pickerGroup(
    gender,
    title
  ) {

    const dancers =
      groupDancers(
        gender
      );


    if (
      !dancers.length
    ) {
      return "";
    }


    return `

      <h3
        class="detail-heading"
      >

        ${title}

      </h3>


      <div
        class="dance-picker"
      >

        ${
          dancers
            .map(
              dancer => `

                <button
                  type="button"
                  class="
                    edit-dancer-row

                    ${
                      dance
                        .dancerIds
                        .includes(
                          dancer.id
                        )

                        ? "selected"
                        : ""
                    }
                  "
                  data-pick-dancer="${
                    dancer.id
                  }"
                >

                  <span>

                    ${
                      escapeHTML(
                        dancer.name
                      )
                    }

                  </span>


                  <span
                    class="checkmark"
                  >
                    ✓
                  </span>

                </button>

              `
            )
            .join("")
        }

      </div>

    `;

  }


  const ordered =
    danceDancers(
      dance
    );


  const orderHTML =
    ordered.length

      ? ordered
          .map(
            (dancer, index) => `

              <div
                class="order-row"
              >

                <span>

                  ${index + 1}.

                  ${
                    escapeHTML(
                      dancer.name
                    )
                  }

                </span>


                <div
                  class="reorder-controls"
                >

                  <button
                    type="button"
                    data-order-dancer="${
                      dancer.id
                    }"
                    data-direction="-1"
                  >
                    ↑
                  </button>


                  <button
                    type="button"
                    data-order-dancer="${
                      dancer.id
                    }"
                    data-direction="1"
                  >
                    ↓
                  </button>

                </div>

              </div>

            `
          )
          .join("")

      : `

          <div class="empty">

            No dancers selected.

          </div>

        `;


  openModal(

    "Select Dancers",

    "DANCE ROSTER",

    `

      <div class="file-box">

        Boys and girls stay
        separated.

        Select the dancers first,
        then arrange their order
        below.

      </div>


      ${
        pickerGroup(
          "Male",
          "BOYS"
        )
      }


      ${
        pickerGroup(
          "Female",
          "GIRLS"
        )
      }


      ${
        pickerGroup(
          "Other",
          "OTHER"
        )
      }


      <h3
        class="detail-heading"
      >

        Selected Order

      </h3>


      ${orderHTML}


      <button
        id="doneDanceDancers"
        class="primary-button"
        type="button"
        style="margin-top:18px"
      >

        Done

      </button>

    `,

    () => {

      showDance(
        dance.id
      );

    }

  );


  document
    .querySelectorAll(
      "[data-pick-dancer]"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            const dancerId =
              Number(
                button.dataset
                  .pickDancer
              );


            if (
              dance
                .dancerIds
                .includes(
                  dancerId
                )
            ) {

              dance.dancerIds =
                dance
                  .dancerIds
                  .filter(
                    id =>
                      id !==
                        dancerId
                  );

            } else {

              dance
                .dancerIds
                .push(
                  dancerId
                );

            }


            saveData();

            editDanceDancers(
              dance.id
            );

          };

      }
    );


  document
    .querySelectorAll(
      "[data-order-dancer]"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            const dancerId =
              Number(
                button.dataset
                  .orderDancer
              );


            const direction =
              Number(
                button.dataset
                  .direction
              );


            const currentIndex =
              dance
                .dancerIds
                .indexOf(
                  dancerId
                );


            const newIndex =
              currentIndex +
              direction;


            if (
              currentIndex < 0 ||
              newIndex < 0 ||
              newIndex >=
                dance
                  .dancerIds
                  .length
            ) {
              return;
            }


            const temp =
              dance
                .dancerIds[
                  currentIndex
                ];


            dance
              .dancerIds[
                currentIndex
              ] =
                dance
                  .dancerIds[
                    newIndex
                  ];


            dance
              .dancerIds[
                newIndex
              ] =
                temp;


            saveData();

            editDanceDancers(
              dance.id
            );

          };

      }
    );


  document
    .getElementById(
      "doneDanceDancers"
    )
    .onclick =
      () => {

        showDance(
          dance.id
        );

      };

}


// ==========================================
// FIREBASE STORAGE HELPERS
// ==========================================

function safeFileName(
  name
) {

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
    !window.vukFirebase ||
    !window.vukFirebase.storage
  ) {

    throw new Error(
      "Firebase Storage is not available."
    );

  }


  const {
    storage,
    storageRef,
    uploadBytes,
    getDownloadURL
  } = window.vukFirebase;


  const fileReference =
    storageRef(
      storage,
      path
    );


  await uploadBytes(
    fileReference,
    file,
    {
      contentType:
        file.type ||
        undefined
    }
  );


  return await getDownloadURL(
    fileReference
  );

}


async function deleteStoragePath(
  path
) {

  if (
    !path ||
    !window.vukFirebase ||
    !window.vukFirebase.storage
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
      storageRef(
        storage,
        path
      )
    );

  } catch (error) {

    console.warn(
      "Storage delete failed:",
      error
    );

  }

}


// ==========================================
// PHOTO UPLOAD
// ==========================================

async function uploadDancePhotos(
  dance,
  files
) {

  if (
    !files.length
  ) {
    return;
  }


  showUploading(
    true,
    files.length > 1
      ? "Uploading photos..."
      : "Uploading photo..."
  );


  try {

    for (
      const file
      of files
    ) {

      const path =

        `dance-media/ensemble-${data.selectedEnsemble}` +

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

        name:
          file.name,

        type:
          file.type ||
          "image"

      });

    }


    saveData();

    showToast(
      files.length > 1
        ? "Photos uploaded."
        : "Photo uploaded."
    );


    showDance(
      dance.id
    );

  } catch (error) {

    console.error(
      "Photo upload failed:",
      error
    );


    alert(
      "The photo could not be uploaded. Firebase Storage may need to be enabled first."
    );

  } finally {

    showUploading(
      false
    );

  }

}


// ==========================================
// DELETE PHOTO
// ==========================================

async function deleteDanceImage(
  dance,
  imageIndex
) {

  const image =
    dance.images[
      imageIndex
    ];


  if (!image) {
    return;
  }


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

    if (
      image.path
    ) {

      await deleteStoragePath(
        image.path
      );

    }


    dance.images.splice(
      imageIndex,
      1
    );


    saveData();


    showDance(
      dance.id
    );

  } finally {

    showUploading(
      false
    );

  }

}


// ==========================================
// MUSIC UPLOAD
// ==========================================

async function uploadDanceMusic(
  dance,
  file
) {

  showUploading(
    true,
    "Uploading music..."
  );


  try {

    if (
      dance.music?.path
    ) {

      await deleteStoragePath(
        dance.music.path
      );

    }


    const path =

      `dance-media/ensemble-${data.selectedEnsemble}` +

      `/dance-${dance.id}` +

      `/music/${uid()}-${safeFileName(file.name)}`;


    const url =
      await uploadFile(
        file,
        path
      );


    dance.music = {

      url,

      path,

      name:
        file.name,

      type:
        file.type ||
        "audio"

    };


    saveData();


    showToast(
      "Music uploaded."
    );


    showDance(
      dance.id
    );

  } catch (error) {

    console.error(
      "Music upload failed:",
      error
    );


    alert(
      "The music could not be uploaded. Firebase Storage may need to be enabled first."
    );

  } finally {

    showUploading(
      false
    );

  }

}


// ==========================================
// DELETE MUSIC
// ==========================================

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

    if (
      dance.music?.path
    ) {

      await deleteStoragePath(
        dance.music.path
      );

    }


    dance.music =
      null;


    saveData();


    showDance(
      dance.id
    );

  } finally {

    showUploading(
      false
    );

  }

}


// ==========================================
// CREATE WEEKLY PRACTICES
// ==========================================

function createWeeklyPractices(
  name,
  startDate,
  endDate,
  startTime,
  endTime
) {

  let current =
    localDate(
      startDate
    );


  const finalDate =
    localDate(
      endDate
    );


  const seriesId =
    uid();


  while (
    current <=
    finalDate
  ) {

    ensemble()
      .practices
      .push({

        id: uid(),

        seriesId,

        name,

        date:
          dateKey(
            current
          ),

        startTime,

        endTime,

        attendance: {}

      });


    current.setDate(
      current.getDate() +
      7
    );

  }

}


// ==========================================
// ADD PRACTICE
// ==========================================

function practiceForm() {

  openModal(

    "Add Practice",

    "SCHEDULE",

    `

      <div class="form-group">

        <label>
          Practice Name
        </label>

        <input
          id="practiceName"
          placeholder="Monday Rehearsal"
        >

      </div>


      <div class="form-group">

        <label>
          Start Date
        </label>

        <input
          id="practiceStart"
          type="date"
        >

      </div>


      <div class="form-group">

        <label>
          End Date
        </label>

        <input
          id="practiceEnd"
          type="date"
        >

      </div>


      <div class="form-row">

        <div class="form-group">

          <label>
            Start Time
          </label>

          <input
            id="practiceStartTime"
            type="time"
          >

        </div>


        <div class="form-group">

          <label>
            End Time
          </label>

          <input
            id="practiceEndTime"
            type="time"
          >

        </div>

      </div>


      <div class="file-box">

        The practice repeats
        every week through
        the end date.

      </div>


      <button
        id="savePractice"
        class="primary-button"
        type="button"
        style="margin-top:18px"
      >

        Create Practices

      </button>

    `

  );


  document
    .getElementById(
      "savePractice"
    )
    .onclick =
      () => {

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


        if (
          !name ||
          !start ||
          !end
        ) {

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
  .getElementById(
    "addPracticeButton"
  )
  .onclick =
    practiceForm;


// ==========================================
// CALENDAR
// ==========================================

function renderCalendar() {

  document
    .getElementById(
      "calendarEnsemble"
    )
    .textContent =
      ensemble().name;


  const year =
    calendarDate
      .getFullYear();


  const month =
    calendarDate
      .getMonth();


  document
    .getElementById(
      "calendarMonth"
    )
    .textContent =
      calendarDate
        .toLocaleDateString(
          [],
          {
            month: "long",
            year: "numeric"
          }
        );


  const grid =
    document.getElementById(
      "calendarGrid"
    );


  grid.innerHTML =
    "";


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
    start.getDate() -
    firstDay.getDay()
  );


  const today =
    dateKey(
      new Date()
    );


  for (
    let index = 0;
    index < 42;
    index++
  ) {

    const date =
      new Date(
        start
      );


    date.setDate(
      start.getDate() +
      index
    );


    const key =
      dateKey(
        date
      );


    const practices =
      ensemble()
        .practices
        .filter(
          practice =>
            practice.date ===
              key
        );


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "calendar-day";


    if (
      date.getMonth() !==
      month
    ) {

      button.classList.add(
        "other-month"
      );

    }


    if (
      key ===
      selectedCalendarDate
    ) {

      button.classList.add(
        "selected"
      );

    }


    if (
      key ===
      today
    ) {

      button.classList.add(
        "today"
      );

    }


    button.innerHTML = `

      <div class="day-number">

        ${date.getDate()}

      </div>


      <div class="event-dots">

        ${
          practices
            .slice(
              0,
              3
            )
            .map(
              () =>
                `<span class="event-dot"></span>`
            )
            .join("")
        }

      </div>

    `;


    button.onclick =
      () => {

        selectedCalendarDate =
          key;


        calendarDate =
          new Date(
            date
          );


        renderCalendar();

        renderPractices();

      };


    grid.appendChild(
      button
    );

  }

}


document
  .getElementById(
    "previousMonth"
  )
  .onclick =
    () => {

      calendarDate =
        new Date(
          calendarDate
            .getFullYear(),

          calendarDate
            .getMonth() -
            1,

          1
        );


      selectedCalendarDate =
        null;


      renderCalendar();

      renderPractices();

    };


document
  .getElementById(
    "nextMonth"
  )
  .onclick =
    () => {

      calendarDate =
        new Date(
          calendarDate
            .getFullYear(),

          calendarDate
            .getMonth() +
            1,

          1
        );


      selectedCalendarDate =
        null;


      renderCalendar();

      renderPractices();

    };


document
  .getElementById(
    "todayButton"
  )
  .onclick =
    () => {

      calendarDate =
        new Date();


      selectedCalendarDate =
        dateKey(
          new Date()
        );


      renderCalendar();

      renderPractices();

    };


// ==========================================
// PRACTICE LIST
// ==========================================

function renderPractices() {

  const container =
    document.getElementById(
      "practiceList"
    );


  let practices =
    [...ensemble().practices]

      .sort(
        (a, b) =>
          localDate(a.date) -
          localDate(b.date)
      );


  if (
    selectedCalendarDate
  ) {

    practices =
      practices.filter(
        practice =>
          practice.date ===
            selectedCalendarDate
      );

  }


  container.innerHTML =
    "";


  if (
    !practices.length
  ) {

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


  practices.forEach(
    practice => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "item-card";


      button.innerHTML = `

        <div class="practice-date">

          ${
            shortDate(
              practice.date
            )
          }

        </div>


        <div class="item-main">

          <h3>

            ${
              escapeHTML(
                practice.name
              )
            }

          </h3>


          <p>

            ${
              formatTime(
                practice.startTime
              )
            }

            –

            ${
              formatTime(
                practice.endTime
              )
            }

          </p>

        </div>


        <span class="item-arrow">
          ›
        </span>

      `;


      button.onclick =
        () => {

          showPractice(
            practice.id
          );

        };


      container.appendChild(
        button
      );

    }
  );

}


// ==========================================
// PRACTICE ATTENDANCE
// ==========================================

function showPractice(
  practiceId,
  search = ""
) {

  const practice =
    ensemble()
      .practices
      .find(
        item =>
          item.id ===
            practiceId
      );


  if (!practice) {
    return;
  }


  const query =
    search
      .trim()
      .toLowerCase();


  const allDancers =
    [...ensemble().dancers]
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );


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


  Object
    .values(
      practice.attendance
    )
    .forEach(
      status => {

        if (
          counts[status] !==
          undefined
        ) {

          counts[status]++;

        }

      }
    );


  const rows =
    dancers.length

      ? dancers
          .map(
            dancer => {

              const status =
                practice
                  .attendance[
                    dancer.id
                  ] || "";


              return `

                <div
                  class="attendance-row"
                >

                  <h4>

                    ${
                      escapeHTML(
                        dancer.name
                      )
                    }

                  </h4>


                  <div
                    class="
                      attendance-buttons
                      four
                    "
                    data-dancer="${
                      dancer.id
                    }"
                  >

                    <button
                      type="button"
                      class="
                        present
                        ${
                          status ===
                            "present"
                            ? "selected"
                            : ""
                        }
                      "
                      data-status="present"
                    >

                      Present

                    </button>


                    <button
                      type="button"
                      class="
                        late
                        ${
                          status ===
                            "late"
                            ? "selected"
                            : ""
                        }
                      "
                      data-status="late"
                    >

                      Late

                    </button>


                    <button
                      type="button"
                      class="
                        absent
                        ${
                          status ===
                            "absent"
                            ? "selected"
                            : ""
                        }
                      "
                      data-status="absent"
                    >

                      No Show

                    </button>


                    <button
                      type="button"
                      class="
                        excused
                        ${
                          status ===
                            "excused"
                            ? "selected"
                            : ""
                        }
                      "
                      data-status="excused"
                    >

                      Excused

                    </button>

                  </div>

                </div>

              `;

            }
          )
          .join("")

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

          ${
            formatDate(
              practice.date
            )
          }

        </div>


        <div
          class="practice-time"
        >

          ${
            formatTime(
              practice.startTime
            )
          }

          –

          ${
            formatTime(
              practice.endTime
            )
          }

        </div>

      </div>


      <button
        id="markAllPresent"
        class="mark-all-button"
        type="button"
      >

        ✓ Mark All Present

      </button>


      <div
        class="
          attendance-summary
          four
        "
      >

        <div
          class="
            summary-box
            present
          "
        >

          <strong
            id="countPresent"
          >
            ${counts.present}
          </strong>

          <span>
            PRESENT
          </span>

        </div>


        <div
          class="
            summary-box
            late
          "
        >

          <strong
            id="countLate"
          >
            ${counts.late}
          </strong>

          <span>
            LATE
          </span>

        </div>


        <div
          class="
            summary-box
            absent
          "
        >

          <strong
            id="countAbsent"
          >
            ${counts.absent}
          </strong>

          <span>
            NO SHOW
          </span>

        </div>


        <div
          class="
            summary-box
            excused
          "
        >

          <strong
            id="countExcused"
          >
            ${counts.excused}
          </strong>

          <span>
            EXCUSED
          </span>

        </div>

      </div>


      <div class="search-box">

        <span>
          ⌕
        </span>

        <input
          id="attendanceSearch"
          type="search"
          placeholder="Search dancers..."
          value="${
            escapeHTML(
              search
            )
          }"
        >

      </div>


      <h3
        class="detail-heading"
      >

        Attendance

      </h3>


      <div
        id="attendanceRows"
      >

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


    Object
      .values(
        practice.attendance
      )
      .forEach(
        status => {

          if (
            newCounts[
              status
            ] !==
            undefined
          ) {

            newCounts[
              status
            ]++;

          }

        }
      );


    document
      .getElementById(
        "countPresent"
      )
      .textContent =
        newCounts.present;


    document
      .getElementById(
        "countLate"
      )
      .textContent =
        newCounts.late;


    document
      .getElementById(
        "countAbsent"
      )
      .textContent =
        newCounts.absent;


    document
      .getElementById(
        "countExcused"
      )
      .textContent =
        newCounts.excused;

  }


  /*
    IMPORTANT:

    Attendance buttons update
    immediately on screen.

    Firebase saving happens
    AFTER the local visual
    update.

    The user does not need
    to wait for Firebase.
  */

  document
    .querySelectorAll(
      ".attendance-buttons button"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            const group =
              button.closest(
                ".attendance-buttons"
              );


            const dancerId =
              Number(
                group.dataset
                  .dancer
              );


            const status =
              button.dataset
                .status;


            practice
              .attendance[
                dancerId
              ] =
                status;


            group
              .querySelectorAll(
                "button"
              )
              .forEach(
                statusButton => {

                  statusButton
                    .classList
                    .toggle(
                      "selected",
                      statusButton ===
                        button
                    );

                }
              );


            refreshCounts();


            /*
              Save AFTER the UI
              already changed.
            */

            saveData();

          };

      }
    );


  document
    .getElementById(
      "markAllPresent"
    )
    .onclick =
      () => {

        if (
          !allDancers.length
        ) {

          alert(
            "There are no dancers in this ensemble yet."
          );

          return;

        }


        allDancers.forEach(
          dancer => {

            practice
              .attendance[
                dancer.id
              ] =
                "present";

          }
        );


        /*
          Immediately update all
          visible buttons.
        */

        document
          .querySelectorAll(
            ".attendance-buttons"
          )
          .forEach(
            group => {

              group
                .querySelectorAll(
                  "button"
                )
                .forEach(
                  button => {

                    button
                      .classList
                      .toggle(
                        "selected",
                        button
                          .dataset
                          .status ===
                          "present"
                      );

                  }
                );

            }
          );


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


      setTimeout(
        () => {

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

        },
        0
      );

    }
  );


  document
    .getElementById(
      "deletePractice"
    )
    .onclick =
      () => {

        if (
          !confirm(
            "Delete this practice?"
          )
        ) {
          return;
        }


        ensemble().practices =
          ensemble()
            .practices
            .filter(
              item =>
                item.id !==
                  practice.id
            );


        saveData();

        closeModal();

        renderAll();

      };

}


// ==========================================
// SETTINGS / INSTRUCTOR NOTES
// ==========================================

function renderSettings() {

  const ensembleLabel =
    document.getElementById(
      "settingsEnsemble"
    );


  if (
    ensembleLabel
  ) {

    ensembleLabel.textContent =
      ensemble().name;

  }


  const notes =
    document.getElementById(
      "instructorNotes"
    );


  if (
    notes &&
    document.activeElement !==
      notes
  ) {

    notes.value =
      ensemble()
        .instructorNotes ||
      "";

  }

}


const instructorNotes =
  document.getElementById(
    "instructorNotes"
  );


instructorNotes.addEventListener(
  "input",
  () => {

    ensemble().instructorNotes =
      instructorNotes.value;


    /*
      Immediately save locally
      while the instructor types.
    */

    localBackup();


    const status =
      document.getElementById(
        "notesSaveStatus"
      );


    if (status) {

      status.textContent =
        "Saving...";

    }


    clearTimeout(
      notesTimer
    );


    notesTimer =
      setTimeout(
        () => {

          saveData();


          if (status) {

            status.textContent =
              "Saved.";

          }

        },
        300
      );

  }
);


// ==========================================
// SETTINGS BUTTONS
// ==========================================

document
  .getElementById(
    "manageEnsembles"
  )
  .onclick =
    () => {

      openPage(
        "homePage"
      );

    };


document
  .getElementById(
    "accountsButton"
  )
  .onclick =
    () => {

      alert(
        "Instructor Accounts are the next security step. Shared data is already connected."
      );

    };


document
  .getElementById(
    "permissionsButton"
  )
  .onclick =
    () => {

      alert(
        "Permissions will be available when instructor sign-in is enabled."
      );

    };


// ==========================================
// RENDER EVERYTHING
// ==========================================

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


renderAll();


openPage(
  "homePage"
);


// ==========================================
// FIREBASE SHARED DATA SYNC
// ==========================================

let firebaseSyncStarted =
  false;


function startFirebaseSync() {

  if (
    firebaseSyncStarted ||
    !window.vukFirebase
  ) {
    return;
  }


  firebaseSyncStarted =
    true;


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


  let firstFirebaseLoad =
    true;


  onValue(

    sharedDataRef,

    snapshot => {

      const cloudData =
        snapshot.val();


      /*
        If Firebase is empty,
        upload the data already
        on this device.

        This protects existing
        local VUK data.
      */

      if (
        firstFirebaseLoad &&
        cloudData === null
      ) {

        firstFirebaseLoad =
          false;


        cloudReady =
          true;


        set(
          sharedDataRef,
          data
        )
        .catch(
          error => {

            console.error(
              "Initial Firebase upload failed:",
              error
            );

          }
        );


        return;

      }


      firstFirebaseLoad =
        false;


      cloudReady =
        true;


      /*
        Firebase already contains
        the shared VUK data.

        Use it without resetting
        or recreating ensembles.
      */

      if (
        cloudData
      ) {

        applyingCloud =
          true;


        data =
          cloudData;


        normalizeData();


        localBackup();


        applyingCloud =
          false;


        renderAll();

      }

    },

    error => {

      console.error(
        "Firebase sync failed:",
        error
      );


      cloudReady =
        false;

    }

  );

}


// Firebase might already
// be initialized.

if (
  window.vukFirebase
) {

  startFirebaseSync();

}


// Or Firebase may finish
// loading immediately after
// script.js starts.

window.addEventListener(
  "vukFirebaseReady",
  startFirebaseSync
);
