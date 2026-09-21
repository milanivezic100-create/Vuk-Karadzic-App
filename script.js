// ==========================================
// VUK KARADZIC PROBE
// V4
// ==========================================


// ==========================================
// DEFAULT DATA
// ==========================================

function createEnsemble(name, shortName) {

  return {
    name,
    shortName,
    dancers: [],
    dances: [],
    practices: []
  };

}


const defaultData = {

  selectedEnsemble: 2,

  ensembles: [

    createEnsemble(
      "First Ensemble",
      "First"
    ),

    createEnsemble(
      "Second Ensemble",
      "Second"
    ),

    {
      name: "Third Ensemble",
      shortName: "Third",

      dancers: [
        {
          id: 101,
          name: "Marko Petrović",
          gender: "Male",
          height: 188,
          shoeSize: "44",
          notes: ""
        },

        {
          id: 102,
          name: "Nikola Jovanović",
          gender: "Male",
          height: 181,
          shoeSize: "43",
          notes: ""
        },

        {
          id: 103,
          name: "Stefan Ilić",
          gender: "Male",
          height: 176,
          shoeSize: "42",
          notes: ""
        },

        {
          id: 104,
          name: "Ana Petrović",
          gender: "Female",
          height: 173,
          shoeSize: "38",
          notes: ""
        },

        {
          id: 105,
          name: "Mila Marković",
          gender: "Female",
          height: 169,
          shoeSize: "39",
          notes: ""
        }
      ],

      dances: [],

      practices: []
    },

    createEnsemble(
      "Fourth Ensemble",
      "Fourth"
    ),

    createEnsemble(
      "Fifth Ensemble",
      "Fifth"
    )

  ]

};


// ==========================================
// STORAGE
// ==========================================

let data;


try {

  const saved =
    localStorage.getItem(
      "vukProbeV4"
    );


  if (saved) {

    data =
      JSON.parse(saved);

  } else {

    // Try importing V3 automatically

    const oldData =
      localStorage.getItem(
        "vukProbeV3"
      );


    data =
      oldData
        ? JSON.parse(oldData)
        : defaultData;

  }

} catch (error) {

  data = defaultData;

}


function normalizeData() {

  if (!data.ensembles) {
    data = defaultData;
  }


  data.ensembles.forEach(
    ensembleItem => {

      ensembleItem.dancers =
        ensembleItem.dancers || [];

      ensembleItem.dances =
        ensembleItem.dances || [];

      ensembleItem.practices =
        ensembleItem.practices || [];


      ensembleItem.dancers.forEach(
        dancer => {

          if (
            dancer.notes === undefined
          ) {
            dancer.notes = "";
          }

        }
      );


      ensembleItem.dances.forEach(
        dance => {

          dance.dancerIds =
            dance.dancerIds || [];

          dance.imageNames =
            dance.imageNames || [];

          dance.musicName =
            dance.musicName || "";

        }
      );


      ensembleItem.practices.forEach(
        practice => {

          practice.attendance =
            practice.attendance || {};

        }
      );

    }
  );

}


normalizeData();


function saveData() {

  localStorage.setItem(
    "vukProbeV4",
    JSON.stringify(data)
  );

}


function ensemble() {

  return data.ensembles[
    data.selectedEnsemble
  ];

}


// ==========================================
// HELPERS
// ==========================================

function escapeHTML(value = "") {

  return String(value)

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

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
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return (
    `${year}-${month}-${day}`
  );

}


function formatDate(dateString) {

  return localDate(dateString)
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

  return localDate(dateString)
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


  const [hours, minutes] =
    time.split(":");


  const date =
    new Date();


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


function getHeight(dancer) {

  const number =
    Number(
      String(
        dancer.height || 0
      )
      .replace(
        /[^\d.]/g,
        ""
      )
    );


  return Number.isFinite(number)
    ? number
    : 0;

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
    page =>
      page.classList.remove(
        "active"
      )
  );


  const page =
    document.getElementById(
      pageId
    );


  if (page) {

    page.classList.add(
      "active"
    );

  }


  navButtons.forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageId
      );

    }
  );


  renderAll();

  window.scrollTo(0, 0);

}


navButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () =>
        openPage(
          button.dataset.page
        )
    );

  }
);


// ==========================================
// MODAL NAVIGATION
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


let modalHistory = [];


function renderModalScreen(
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


function openRootModal(
  title,
  eyebrow,
  html
) {

  modalHistory = [];

  renderModalScreen(
    title,
    eyebrow,
    html,
    null
  );

}


function openChildModal(
  title,
  eyebrow,
  html,
  backAction
) {

  renderModalScreen(
    title,
    eyebrow,
    html,
    backAction
  );

}


function closeModal() {

  modalOverlay.classList.remove(
    "open"
  );

  modalBody.innerHTML = "";

  modalHistory = [];

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


  container.innerHTML = "";


  data.ensembles.forEach(
    (item, index) => {

      const button =
        document.createElement(
          "button"
        );


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
              .padStart(2, "0")
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


      button.addEventListener(
        "click",
        () => {

          data.selectedEnsemble =
            index;

          selectedCalendarDate =
            null;

          saveData();

          renderAll();

        }
      );


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
  .addEventListener(
    "click",
    () =>
      openPage("homePage")
  );


// ==========================================
// DANCER ATTENDANCE CALCULATIONS
// ==========================================

function dancerAttendanceStats(
  dancerId
) {

  let present = 0;
  let late = 0;
  let absent = 0;
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

      }
    );


  /*
    Present counts as 100%.
    Late counts as attended,
    but at 50% for the percentage.
    No Show counts as 0%.

    You can change this later if
    you want late to count as 100%.
  */

  const percentage =
    recorded === 0

      ? null

      : Math.round(
          (
            present +
            late * 0.5
          )
          /
          recorded
          *
          100
        );


  return {
    present,
    late,
    absent,
    recorded,
    percentage
  };

}


// ==========================================
// DANCERS
// ==========================================

function sortedGender(
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
        dancer.gender === gender
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
        getHeight(b) -
        getHeight(a)
    );

}


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
    document.getElementById(
      "dancerSearch"
    ).value;


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


  let hasDancers = false;


  groups.forEach(
    group => {

      const dancers =
        sortedGender(
          group.gender,
          search
        );


      if (!dancers.length) {
        return;
      }


      hasDancers = true;


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
              "button"
            );


          row.className =
            "dancer-row";


          row.innerHTML = `

            <span
              class="
                dancer-number
                ${group.numberCSS}
              "
            >

              ${
                String(index + 1)
                  .padStart(2, "0")
              }

            </span>


            <strong>
              ${escapeHTML(dancer.name)}
            </strong>


            <span
              class="dancer-height"
            >

              ${
                dancer.height
                  ? dancer.height + " cm"
                  : "—"
              }

            </span>


            <span class="chevron">
              ›
            </span>

          `;


          row.addEventListener(
            "click",
            () =>
              showDancer(
                dancer.id
              )
          );


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


  if (!hasDancers) {

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


function showDancer(id) {

  const dancer =
    ensemble()
      .dancers
      .find(
        dancer =>
          dancer.id === id
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
      : stats.percentage + "%";


  openRootModal(

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
              ${dancer.gender || "—"}
            </strong>

          </div>


          <div class="profile-stat">

            <span>Height</span>

            <strong>

              ${
                dancer.height
                  ? dancer.height + " cm"
                  : "—"
              }

            </strong>

          </div>


          <div class="profile-stat">

            <span>Shoe Size</span>

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

            <span>Ensemble</span>

            <strong>
              ${ensemble().shortName}
            </strong>

          </div>

        </div>


        <button
          id="attendanceProfile"
          class="attendance-profile-card"
        >

          <div>

            <div class="detail-label">
              Attendance
            </div>

            <div class="attendance-percent">

              <strong>
                ${percentText}
              </strong>

              <span>
                ${stats.recorded}
                recorded
              </span>

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

          </div>

        </button>

      </div>


      <div class="notes-card">

        <h3>Notes</h3>

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
        style="margin-top:15px"
      >
        Edit Dancer
      </button>


      <button
        id="deleteDancer"
        class="danger-button"
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
      () =>
        showDancerAttendance(
          dancer.id
        );


  document
    .getElementById(
      "editDancer"
    )
    .onclick =
      () =>
        dancerForm(
          dancer,
          true
        );


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
                item.id !== id
            );


        /*
          Remove deleted dancer
          from dances too.
        */

        ensemble()
          .dances
          .forEach(
            dance => {

              dance.dancerIds =
                dance.dancerIds
                  .filter(
                    dancerId =>
                      dancerId !== id
                  );

            }
          );


        saveData();

        closeModal();

        renderAll();

      };

}


function dancerForm(
  dancer = null,
  fromProfile = false
) {

  const editing =
    Boolean(dancer);


  const html = `

    <div class="form-group">

      <label>Full Name</label>

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

      <label>Gender</label>

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
              ? dancer.height || ""
              : ""
          }"
          placeholder="173"
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
          placeholder="38"
        >

      </div>

    </div>


    <div class="form-group">

      <label>
        Notes
      </label>

      <textarea
        id="dNotes"
        placeholder="Costume, positioning, rehearsal notes..."
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
    >

      ${
        editing
          ? "Save Changes"
          : "Add Dancer"
      }

    </button>

  `;


  if (
    editing &&
    fromProfile
  ) {

    openChildModal(

      "Edit Dancer",

      "ROSTER",

      html,

      () =>
        showDancer(
          dancer.id
        )

    );

  } else {

    openRootModal(

      editing
        ? "Edit Dancer"
        : "Add Dancer",

      "ROSTER",

      html

    );

  }


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


        const height =
          Number(
            document
              .getElementById(
                "dHeight"
              )
              .value
          ) || "";


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


        if (
          !name ||
          !gender
        ) {

          alert(
            "Please enter a name and gender."
          );

          return;

        }


        if (editing) {

          Object.assign(
            dancer,
            {
              name,
              gender,
              height,
              shoeSize,
              notes
            }
          );

        } else {

          ensemble()
            .dancers
            .push({

              id:
                Date.now() +
                Math.random(),

              name,
              gender,
              height,
              shoeSize,
              notes

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
    () =>
      dancerForm();


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
          item.id === dancerId
      );


  if (!dancer) {
    return;
  }


  const stats =
    dancerAttendanceStats(
      dancerId
    );


  const percentage =
    stats.percentage === null
      ? "—"
      : stats.percentage + "%";


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


  const historyHTML =
    history.length

      ? history
          .map(
            practice => {

              const status =
                practice.attendance[
                  dancerId
                ];


              const label =
                status === "absent"
                  ? "No Show"
                  : status
                      .charAt(0)
                      .toUpperCase()
                    +
                    status.slice(1);


              return `

                <div class="history-row">

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

            No attendance has been
            recorded for this dancer yet.

          </div>

        `;


  openChildModal(

    "Attendance",

    dancer.name,

    `

      <div class="history-hero">

        <div class="history-percent">

          ${percentage}

        </div>

        <div class="history-caption">

          Attendance across
          ${stats.recorded}
          recorded practices

        </div>

      </div>


      <div
        class="attendance-summary"
        style="margin-top:12px"
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

          <span>PRESENT</span>

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

          <span>LATE</span>

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

          <span>NO SHOW</span>

        </div>

      </div>


      <h3 class="detail-heading">

        Recent Practices

      </h3>


      ${historyHTML}

    `,

    () =>
      showDancer(
        dancerId
      )

  );

}


// ==========================================
// DANCES
// ==========================================

function renderDances() {

  document
    .getElementById(
      "danceEnsemble"
    )
    .textContent =
      ensemble().name;


  const list =
    document.getElementById(
      "danceList"
    );


  list.innerHTML = "";


  if (
    !ensemble().dances.length
  ) {

    list.innerHTML = `

      <div class="empty">

        No dances yet.<br>
        Tap + to add a dance.

      </div>

    `;

    return;

  }


  ensemble()
    .dances
    .forEach(
      (dance, index) => {

        const button =
          document.createElement(
            "button"
          );


        button.className =
          "item-card";


        button.innerHTML = `

          <div
            style="
              width:42px;
              color:var(--burgundy);
              font-family:Georgia,serif;
            "
          >

            ${
              String(index + 1)
                .padStart(2, "0")
            }

          </div>


          <div class="item-main">

            <h3>
              ${escapeHTML(dance.name)}
            </h3>

            <p>

              ${
                dance.choreographer
                  ? "Choreographer: " +
                    escapeHTML(
                      dance.choreographer
                    )
                  : "No choreographer"
              }

              ·

              ${
                dance.dancerIds.length
              }
              dancers

            </p>

          </div>


          <span class="item-arrow">
            ›
          </span>

        `;


        button.onclick =
          () =>
            showDance(
              dance.id
            );


        list.appendChild(
          button
        );

      }
    );

}


function newDance() {

  openRootModal(

    "Add Dance",

    "REPERTOIRE",

    `

      <div class="form-group">

        <label>
          Dance Name
        </label>

        <input
          id="newDanceName"
        >

      </div>


      <div class="form-group">

        <label>
          Choreographer
        </label>

        <input
          id="newChoreographer"
        >

      </div>


      <button
        id="createDance"
        class="primary-button"
      >

        Add Dance

      </button>

    `

  );


  document
    .getElementById(
      "createDance"
    )
    .onclick =
      () => {

        const name =
          document
            .getElementById(
              "newDanceName"
            )
            .value
            .trim();


        if (!name) {

          alert(
            "Please enter a dance name."
          );

          return;

        }


        const dance = {

          id:
            Date.now() +
            Math.random(),

          name,

          choreographer:
            document
              .getElementById(
                "newChoreographer"
              )
              .value
              .trim(),

          dancerIds: [],

          imageNames: [],

          musicName: ""

        };


        ensemble()
          .dances
          .push(dance);


        saveData();

        renderAll();

        showDance(
          dance.id
        );

      };

}


function showDance(id) {

  const dance =
    ensemble()
      .dances
      .find(
        item =>
          item.id === id
      );


  if (!dance) {
    return;
  }


  const assigned =
    dance.dancerIds

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


  const dancerHTML =
    assigned.length

      ? assigned
          .map(
            dancer => `

              <div
                class="selected-dancer"
              >

                ${
                  escapeHTML(
                    dancer.name
                  )
                }

              </div>

            `
          )
          .join("")

      : `

          <div class="empty">
            No dancers assigned.
          </div>

        `;


  openRootModal(

    dance.name,

    "DANCE DETAILS",

    `

      <div class="detail-card">

        <div class="detail-label">
          Dance Name
        </div>

        <div class="detail-value">
          ${escapeHTML(dance.name)}
        </div>

      </div>


      <div class="detail-card">

        <div class="detail-label">
          Choreographer
        </div>

        <div class="detail-value">

          ${
            escapeHTML(
              dance.choreographer
            ) || "—"
          }

        </div>

      </div>


      <h3 class="detail-heading">

        Dancers
        (${assigned.length})

      </h3>


      <div>
        ${dancerHTML}
      </div>


      <h3 class="detail-heading">
        Images
      </h3>


      <div class="file-box">

        ${
          dance.imageNames.length

            ? escapeHTML(
                dance.imageNames
                  .join(", ")
              )

            : "No images added."
        }

      </div>


      <h3 class="detail-heading">
        Music
      </h3>


      <div class="file-box">

        ${
          dance.musicName

            ? "♫ " +
              escapeHTML(
                dance.musicName
              )

            : "No music added."
        }

      </div>


      <button
        id="editDance"
        class="primary-button"
        style="margin-top:22px"
      >

        Edit Dance

      </button>

    `

  );


  document
    .getElementById(
      "editDance"
    )
    .onclick =
      () =>
        editDance(
          dance.id
        );

}


function editDance(id) {

  const dance =
    ensemble()
      .dances
      .find(
        item =>
          item.id === id
      );


  if (!dance) {
    return;
  }


  let selectedIds =
    [...dance.dancerIds];


  const roster =
    [...ensemble().dancers]
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );


  const rows =
    roster
      .map(
        dancer => `

          <button
            type="button"

            class="
              edit-dancer-row

              ${
                selectedIds.includes(
                  dancer.id
                )
                  ? "selected"
                  : ""
              }
            "

            data-id="${dancer.id}"
          >

            <span>
              ${escapeHTML(dancer.name)}
            </span>

            <span class="checkmark">
              ✓
            </span>

          </button>

        `
      )
      .join("");


  openChildModal(

    "Edit Dance",

    "REPERTOIRE",

    `

      <div class="form-group">

        <label>
          Dance Name
        </label>

        <input
          id="editDanceName"
          value="${
            escapeHTML(
              dance.name
            )
          }"
        >

      </div>


      <div class="form-group">

        <label>
          Choreographer
        </label>

        <input
          id="editDanceChoreographer"
          value="${
            escapeHTML(
              dance.choreographer ||
              ""
            )
          }"
        >

      </div>


      <h3 class="detail-heading">
        Dancers
      </h3>


      <div id="danceRoster">

        ${
          rows ||
          `
            <div class="empty">
              Add dancers to this
              ensemble first.
            </div>
          `
        }

      </div>


      <h3 class="detail-heading">
        Images
      </h3>


      <div class="form-group">

        <input
          id="danceImages"
          type="file"
          accept="image/*"
          multiple
        >

      </div>


      <div class="file-box">

        ${
          dance.imageNames.length

            ? escapeHTML(
                dance.imageNames
                  .join(", ")
              )

            : "No images selected."
        }

      </div>


      <h3 class="detail-heading">
        Music
      </h3>


      <div class="form-group">

        <input
          id="danceMusic"
          type="file"
          accept="audio/*"
        >

      </div>


      <div class="file-box">

        ${
          dance.musicName

            ? escapeHTML(
                dance.musicName
              )

            : "No music selected."
        }

      </div>


      <button
        id="saveDance"
        class="primary-button"
        style="margin-top:22px"
      >

        Save Changes

      </button>


      <button
        id="deleteDance"
        class="danger-button"
      >

        Delete Dance

      </button>

    `,

    () =>
      showDance(
        dance.id
      )

  );


  document
    .querySelectorAll(
      ".edit-dancer-row"
    )
    .forEach(
      row => {

        row.onclick =
          () => {

            const dancerId =
              Number(
                row.dataset.id
              );


            if (
              selectedIds.includes(
                dancerId
              )
            ) {

              selectedIds =
                selectedIds.filter(
                  id =>
                    id !== dancerId
                );


              row.classList.remove(
                "selected"
              );

            } else {

              selectedIds.push(
                dancerId
              );


              row.classList.add(
                "selected"
              );

            }

          };

      }
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
              "editDanceName"
            )
            .value
            .trim();


        if (!name) {

          alert(
            "Dance name cannot be blank."
          );

          return;

        }


        dance.name =
          name;


        dance.choreographer =
          document
            .getElementById(
              "editDanceChoreographer"
            )
            .value
            .trim();


        dance.dancerIds =
          selectedIds;


        const imageFiles =
          document
            .getElementById(
              "danceImages"
            )
            .files;


        if (
          imageFiles.length
        ) {

          dance.imageNames =
            Array.from(
              imageFiles
            )
            .map(
              file =>
                file.name
            );

        }


        const musicFile =
          document
            .getElementById(
              "danceMusic"
            )
            .files[0];


        if (musicFile) {

          dance.musicName =
            musicFile.name;

        }


        saveData();

        renderAll();

        showDance(
          dance.id
        );

      };


  document
    .getElementById(
      "deleteDance"
    )
    .onclick =
      () => {

        if (
          !confirm(
            `Delete ${dance.name}?`
          )
        ) {
          return;
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

        closeModal();

        renderAll();

      };

}


document
  .getElementById(
    "addDanceButton"
  )
  .onclick =
    newDance;


// ==========================================
// PRACTICES
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
    Date.now() +
    Math.random();


  while (
    current <= finalDate
  ) {

    ensemble()
      .practices
      .push({

        id:
          Date.now() +
          Math.random(),

        seriesId,

        name,

        date:
          dateKey(current),

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

  openRootModal(

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


      <div class="form-group">

        <label>Repeat</label>

        <select id="practiceRepeat">

          <option value="weekly">
            Every week
          </option>

        </select>

      </div>


      <div class="file-box">

        Choose the first practice date.
        The practice will repeat on the
        same weekday every week until
        the end date.

      </div>


      <button
        id="savePractice"
        class="primary-button"
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

let calendarDate =
  new Date();


let selectedCalendarDate =
  null;


function renderCalendar() {

  document
    .getElementById(
      "calendarEnsemble"
    )
    .textContent =
      ensemble().name;


  const year =
    calendarDate.getFullYear();


  const month =
    calendarDate.getMonth();


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


  grid.innerHTML = "";


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


  const todayKey =
    dateKey(
      new Date()
    );


  for (
    let index = 0;
    index < 42;
    index++
  ) {

    const date =
      new Date(start);


    date.setDate(
      start.getDate() +
      index
    );


    const key =
      dateKey(date);


    const practices =
      ensemble()
        .practices
        .filter(
          practice =>
            practice.date === key
        );


    const button =
      document.createElement(
        "button"
      );


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
      selectedCalendarDate ===
      key
    ) {

      button.classList.add(
        "selected"
      );

    }


    if (
      key === todayKey
    ) {

      button.classList.add(
        "today"
      );

    }


    const dots =
      practices
        .slice(0, 3)
        .map(
          () =>
            `<span class="event-dot"></span>`
        )
        .join("");


    button.innerHTML = `

      <div class="day-number">

        ${date.getDate()}

      </div>


      <div class="event-dots">

        ${dots}

      </div>

    `;


    button.onclick =
      () => {

        selectedCalendarDate =
          key;


        calendarDate =
          new Date(date);


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
          calendarDate.getFullYear(),
          calendarDate.getMonth() - 1,
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
          calendarDate.getFullYear(),
          calendarDate.getMonth() + 1,
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

      const today =
        new Date();


      calendarDate =
        new Date(today);


      selectedCalendarDate =
        dateKey(today);


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


  practices.forEach(
    practice => {

      const button =
        document.createElement(
          "button"
        );


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
        () =>
          showPractice(
            practice.id
          );


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
  id,
  search = ""
) {

  const practice =
    ensemble()
      .practices
      .find(
        item =>
          item.id === id
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
    absent: 0
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
                practice.attendance[
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
                    class="attendance-buttons"

                    data-dancer="${
                      dancer.id
                    }"
                  >

                    <button
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

                : "Add dancers to this ensemble before taking attendance."
            }

          </div>

        `;


  openRootModal(

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
          style="
            margin-top:7px;
            color:var(--grey);
          "
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
      >

        ✓ Mark All Present

      </button>


      <div class="attendance-summary">

        <div
          class="
            summary-box
            present
          "
        >

          <strong>
            ${counts.present}
          </strong>

          <span>PRESENT</span>

        </div>


        <div
          class="
            summary-box
            late
          "
        >

          <strong>
            ${counts.late}
          </strong>

          <span>LATE</span>

        </div>


        <div
          class="
            summary-box
            absent
          "
        >

          <strong>
            ${counts.absent}
          </strong>

          <span>NO SHOW</span>

        </div>

      </div>


      <div class="search-box">

        <span>⌕</span>

        <input
          id="attendanceSearch"
          type="search"
          placeholder="Search dancers..."
          value="${
            escapeHTML(search)
          }"
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
      >

        Delete This Practice

      </button>

    `

  );


  const searchInput =
    document.getElementById(
      "attendanceSearch"
    );


  /*
    Keep cursor in search box
    while filtering.
  */

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

            practice.attendance[
              dancer.id
            ] =
              "present";

          }
        );


        saveData();

        showPractice(
          practice.id,
          search
        );

      };


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
                group.dataset.dancer
              );


            const status =
              button.dataset.status;


            if (
              practice.attendance[
                dancerId
              ] === status
            ) {

              delete practice
                .attendance[
                  dancerId
                ];

            } else {

              practice.attendance[
                dancerId
              ] =
                status;

            }


            saveData();


            showPractice(
              practice.id,
              search
            );

          };

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
// SETTINGS
// ==========================================

document
  .getElementById(
    "manageEnsembles"
  )
  .onclick =
    () =>
      openPage(
        "homePage"
      );


document
  .getElementById(
    "accountsButton"
  )
  .onclick =
    () =>
      alert(
        "Instructor accounts will be enabled when the shared database is connected."
      );


document
  .getElementById(
    "permissionsButton"
  )
  .onclick =
    () =>
      alert(
        "Permissions will be enabled with instructor accounts."
      );


// ==========================================
// RENDER
// ==========================================

function renderAll() {

  renderHeader();

  renderEnsembles();

  renderDancers();

  renderDances();

  renderCalendar();

  renderPractices();

}


renderAll();

openPage(
  "homePage"
);
