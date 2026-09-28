// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
//
// test  mode func

function autologin() {
  const user_token = localStorage.getItem("usertokan");

  if (user_token) {
    showdashboard();
  } else {
    showlogin();
  }
}

function showlogin() {
  window.location.href = "/login.html";
}
// -----------------------------------------------------------------------------------------------------------------------------
function showdashboard() {
  window.location.href = "/index.html";
}
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
//                                                       NAV BAR JAVASCRIPT
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------

function showPage(pageId) {
  document.querySelectorAll(".page-section").forEach((page) => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  document.querySelectorAll(".nav-button-div").forEach((button) => {
    button.classList.remove("current-page");
  });

  const pageOrder = {
    "home-page": 0,
    "map-page": 1,
    "schedule-page": 2,
    "notice-page": 3,
    "setting-page": 4,
  };

  document
    .querySelectorAll(".nav-button-div")
    [pageOrder[pageId]].classList.add("current-page");

  // Remember current page in URL
  window.location.hash = pageId;
}

// Open the page stored in URL when the website loads
window.addEventListener("DOMContentLoaded", () => {
  const pageId = window.location.hash.substring(1);

  if (
    pageId === "home-page" ||
    pageId === "map-page" ||
    pageId === "schedule-page" ||
    pageId === "notice-page" ||
    pageId === "setting-page"
  ) {
    showPage(pageId);
  } else {
    showPage("home-page");
  }
});
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Fetch data from server
    const response = await fetch("/fetch", {
      credentials: "include",
    });
    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    console.log("FETCH RESPONSE:", result);

    if (
      !result.success ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      console.warn("No timetable records found.");
      return;
    }
    const timetableData = result.data;

    // Current class elements
    const currentClassNameEl = document.getElementById("current-class-sub");
    const currentStartTimeEl = document.getElementById(
      "current-class-starttime",
    );
    const currentEndTimeEl = document.getElementById("current-class-endtime");
    const currentProfessorEl = document.getElementById(
      "current-class-professor-name",
    );
    const currentProfLabel = document.getElementById(
      "current-class-professor-label",
    );
    const roomNoEl = document.getElementById("room_no");
    const departmentEl = document.getElementById("Department");
    const current_location = document.getElementById("current-location");

    // Next class elements
    const nextSubEl = document.getElementById("next-sub");
    const nextStartTimeEl = document.getElementById("next-start-time");
    const nextEndTimeEl = document.getElementById("next-end-time");
    const nextProfessorEl = document.getElementById("next-class-professor");
    const nextProfLabel = document.getElementById("next-class-professor-label");
    const nextRoomEl = document.getElementById("next-room");
    const nextDepartmentEl = document.getElementById("next-depa");
    const next_location = document.getElementById("next-location");

    const now = new Date();
    const currentHour = now.getHours() * 60 + now.getMinutes();
    console.log(currentHour);
    const hide_current = document.getElementById("delet-current-class");
    const hide_next = document.getElementById("delete-next-class");

    // map elemants
    const sub = document.getElementById("current-map-sub");
    const sub_tec = document.getElementById("current-map-professor");
    const start_map_time = document.getElementById("current-map-time");
    const map_room = document.getElementById("current-map-room");
    const delete_map_lec = document.getElementById("map-lec");


    // Helper: decode department from room code
    function getdep(roomcode) {
      if (!roomcode) return { department: "Unknown", floor: 0 };
      const code = String(roomcode).padStart(4, "0");
      const departments = {
        8: "Mining Department",
        6: "Workshop",
        7: "Civil Department",
        5: "Mechanical Department",
        4: "Electrical Department",
        2: "Library Department",
      };

      return {
        department: departments[code[0]] || "Unknown",
        floor: Number(code[1]),
      };
    }
    /////////////////////////////////////////////////
    // minut converter
    function toMinutes(timeStr) {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    }
    // tokan geneartion
    const currenttokan = timetableData.findIndex((lecture) => {
      const start = toMinutes(lecture.start_time);
      const end = toMinutes(lecture.end_time);

      return currentHour >= start && currentHour <= end;
    });

    // upcoming lecture
    const upcoming_class = timetableData.findIndex((lecture) => {
      return toMinutes(lecture.start_time) > currentHour;
    });

    // before 10:30 what to show
    if (currentHour >= 570 && currentHour < 630) {
      const first_class = timetableData[0]; // din ka pehla lecture

      // Current Card hide kar do
      if (hide_current && delete_map_lec) {
        hide_current.style.display = "none";
       
      }

      // Next Card me first class ka data inject karo
      if (hide_next && first_class) {
        hide_next.style.display = "";
        if (nextSubEl) nextSubEl.innerText = first_class.subject_code;
        if (nextStartTimeEl)
          nextStartTimeEl.innerText = formatTime(first_class.start_time);
        if (nextEndTimeEl)
          nextEndTimeEl.innerText = formatTime(first_class.end_time);
        if (nextProfessorEl)
          nextProfessorEl.innerText = first_class.faculty_code;
        if (nextRoomEl) nextRoomEl.innerText = first_class.room;
        if (nextDepartmentEl)
          nextDepartmentEl.innerText = getdep(first_class.room).department;
      }
    }

    // lecture insert dynamicly

    // ========================================================
    // LECTURE INSERTION
    // ========================================================

    const dayName = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      timeZone:  "Asia/Kolkata",
    });

    if (dayName === "Sunday" || dayName === "Saturday") {
      const message = `<div class="bold-text">Today Class Over</div>`;

      [hide_current, hide_next ,delete_map_lec].forEach((el) => {
        if (el) {
          el.style.display = "";
          el.innerHTML = message;
        }
      });
    }

    if (currenttokan !== -1) {
      const current_class = timetableData[currenttokan];
      const next_tokan = currenttokan + 1;
      const next_class = timetableData[next_tokan]; // agla lecture agar exist kare

      // map ka data
      if (delete_map_lec) {
             delete_map_lec.style.display = "";
           delete_map_lec.innerHTML = `<span>
                                    <h1 id="current-map-sub">${current_class.subject_code} </h1>

                                    <h1 id="current-map-professor">
                                        ${current_class.faculty_code}
                                    </h1>
                                </span>

                                <span
                                    style="background-color: rgb(244, 210, 72); border-radius: 15px; padding: 10px 20px;">
                                    <span class="map-lec-sub">
                                        <p class="bold-text" id="current-map-time">
                                           ${formatTime(current_class.start_time)}
                                        </p>
                                    </span>
                                    <span class="map-lec-sub">
                                        <p class="bold-text">
                                            |
                                        </p>
                                    </span>
                                    <span class="map-lec-sub">
                                        <p class="bold-text" id="current-map-room">
                                           ${current_class.room}
                                        </p>

                                    </span>
                                </span>`

      }
    
      // 1. Current Class Card Update
      if (hide_current) {
        hide_current.style.display = "";
      }
      if (currentClassNameEl)
        currentClassNameEl.innerText = current_class.subject_code;
      if (currentStartTimeEl)
        currentStartTimeEl.innerText = formatTime(current_class.start_time);
      if (currentEndTimeEl)
        currentEndTimeEl.innerText = formatTime(current_class.end_time);
      if (currentProfessorEl)
        currentProfessorEl.innerText = current_class.faculty_code;
      if (roomNoEl) roomNoEl.innerText = current_class.room;
      if (departmentEl)
        departmentEl.innerText = getdep(current_class.room).department;

      if (hide_next) {
        hide_next.style.display = "";

        if (next_class) {
          if (nextSubEl) nextSubEl.innerText = next_class.subject_code;
          if (nextStartTimeEl)
            nextStartTimeEl.innerText = formatTime(next_class.start_time);
          if (nextEndTimeEl)
            nextEndTimeEl.innerText = formatTime(next_class.end_time);
          if (nextProfessorEl)
            nextProfessorEl.innerText = next_class.faculty_code;
          if (nextRoomEl) nextRoomEl.innerText = next_class.room;
          if (nextDepartmentEl)
            nextDepartmentEl.innerText = getdep(next_class.room).department;
        } else {
          hide_next.innerHTML = `
            <div class="bold-text">
              No More Classes Today
            </div>
          `;
              

        }
      }
    } else {
      // 1. Check Lunch Window (12:30 PM - 1:00 PM)
      const lunchstart = toMinutes("12:30");
      const lunchend = toMinutes("13:00");
      const islunchtime = currentHour >= lunchstart && currentHour < lunchend;

      if (islunchtime) {
        if (hide_current) {
          hide_current.style.display = "";
          hide_current.innerHTML = `<div class="bold-text">Its Lunch Time 🍛</div>`;
        }
        if (delete_map_lec) {
          delete_map_lec.innerHTML = ` <div class="bold-text">
              Its Lunch Time 🍛
            </div>`
        }
         

        if (hide_next) {
          hide_next.style.display = "";
          // During lunch, next class is the first afternoon class from upcoming_class
          if (upcoming_class !== -1) {
            const next_class = timetableData[upcoming_class];
            if (nextSubEl) nextSubEl.innerText = next_class.subject_code;
            if (nextStartTimeEl)
              nextStartTimeEl.innerText = formatTime(next_class.start_time);
            if (nextEndTimeEl)
              nextEndTimeEl.innerText = formatTime(next_class.end_time);
            if (nextProfessorEl)
              nextProfessorEl.innerText = next_class.faculty_code;
            if (nextRoomEl) nextRoomEl.innerText = next_class.room;
            if (nextDepartmentEl)
              nextDepartmentEl.innerText = getdep(next_class.room).department;
          } else {
            hide_next.innerHTML = `<div class="bold-text">No More Classes Today</div>`;
          }
        }
      }
      // 2. Free Period / Gap Between Classes
      else if (upcoming_class !== -1) {
        if (hide_current) {
          hide_current.style.display = "";
          hide_current.innerHTML = `<div class="bold-text">Break / Free Period</div>`;
        }


        if (hide_next) {
          hide_next.style.display = "";
          const next_class = timetableData[upcoming_class];
          if (nextSubEl) nextSubEl.innerText = next_class.subject_code;
          if (nextStartTimeEl)
            nextStartTimeEl.innerText = formatTime(next_class.start_time);
          if (nextEndTimeEl)
            nextEndTimeEl.innerText = formatTime(next_class.end_time);
          if (nextProfessorEl)
            nextProfessorEl.innerText = next_class.faculty_code;
          if (nextRoomEl) nextRoomEl.innerText = next_class.room;
          if (nextDepartmentEl)
            nextDepartmentEl.innerText = getdep(next_class.room).department;
        }
      } else {
        if (hide_current) {
          hide_current.style.display = "";
          hide_current.innerHTML = `<div class="bold-text">Today Class Over</div>`;
        }
        if (hide_next) {
          hide_next.style.display = "";
          hide_next.innerHTML = `<div class="bold-text">Today Class Over</div>`;
        }
        if (delete_map_lec) {
          delete_map_lec.innerHTML = ""
          delete_map_lec.innerHTML = ` <div class="bold-text">
              No More Classes Today
            </div>`
        }
         
      }
    }

    const todayLecturesContainer = document.getElementById("today-lectures");

    if (todayLecturesContainer) {
      todayLecturesContainer.innerHTML = timetableData
        .map((lecture, index) => {
          const isFirst = index === 0 ? "first " : "";
          const formattedStartTime = formatTime(lecture.start_time);
          const faculty = lecture.faculty_code || "Staff";
          const room = lecture.room || "TBA";
          const subject = lecture.subject_code || "Lecture";

          return `
            <div class="${isFirst}lecture-div">
              <div>
                <div class="bold-text">
                  ${subject}
                </div>
                <div class="small-text">
                  ${faculty} - Room ${room}
                </div>
              </div>
              <div>
                <div>
                  ${formattedStartTime}
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }
    // Helper: format time string to AM/PM
    function formatTime(time) {
      if (!time || typeof time !== "string" || !time.includes(":"))
        return "--:--";
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(Number(hours), Number(minutes), 0, 0);

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    
    // ========================================================
    // HEADER (Student greeting & Date)
    // ========================================================
    const studentName = timetableData[0]?.name || "Student";
    const firstWord = studentName.trim().split(/\s+/)[0];
    const formattedName =
      firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();

    const greetingEl = document.getElementById("greeting");
    if (greetingEl) {
      greetingEl.innerText = `Hello, ${formattedName}`;
    }
    const insert_name = document.getElementById("initial");
    if (insert_name && formattedName) {
      insert_name.textContent = formattedName.charAt(0); // ya formattedName[0]
    }

    const dateEl = document.getElementById("date");
    if (dateEl) {
      dateEl.textContent = `Today, ${now.getDate()} ${now.toLocaleString("en-US", { month: "short" })}`;
    }

    if (typeof loadTimetable === "function") {
      loadTimetable(timetableData);
    }

    
  } catch (error) {
    console.error("Error loading timetable:", error);
  }

  // Check if it's the saturday or sunday
});

// ========================================================
// SCHEDULE JAVASCRIPT
// ========================================================

let weeklySchedule = [];
let mondaySchedule = [];
let tuesdaySchedule = [];
let wednesdaySchedule = [];
let thursdaySchedule = [];
let fridaySchedule = [];

// --------------------------------------------------------
// FORMAT TIME
// --------------------------------------------------------

function formatScheduleTime(time) {
  if (!time || typeof time !== "string" || !time.includes(":")) {
    return "--:--";
  }

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// --------------------------------------------------------
// SHOW SCHEDULE CARDS
// --------------------------------------------------------

function showSchedule(schedule) {
  function getdep(roomcode) {
    if (!roomcode) return { department: "Unknown", floor: 0 };
    const code = String(roomcode).padStart(4, "0");
    const departments = {
      8: "Mining Department",
      6: "Civil Department",
      5: "Mechanical Department",
      4: "Electrical Department",
      2: "Library Department",
    };

    return {
      department: departments[code[0]] || "Unknown",
      floor: Number(code[1]),
    };
  }

  const container = document.getElementById("lecture-container");

  if (!container) return;

  if (!schedule || schedule.length === 0) {
    container.innerHTML = `
      <div class="schedule-empty">
        No classes scheduled
      </div>
    `;

    return;
  }

  container.innerHTML = schedule
    .map((lecture) => {
      const formattedStartTime = formatScheduleTime(lecture.start_time);
      const formattedEndTime = formatScheduleTime(lecture.end_time);
      const faculty = lecture.faculty_code || "Staff";
      const room = lecture.room || "TBA";
      const subject = lecture.subject_code || "Lecture";
      const department = getdep(room).department;

      return `
        <div class="schedule-card">

          <div class="time">

            <span>
              ${formattedStartTime}
            </span>

            <span>
              ${formattedEndTime}
            </span>

          </div>


          <div class="divider"></div>


          <div class="subject">

            <strong>
              ${subject}
            </strong>

            <span>
              ${room}
            </span>

          </div>


          <div class="subject">

            <strong>
              ${faculty}
            </strong>

            <span>
              ${department}
            </span>

          </div>

        </div>
      `;
    })
    .join("");
}

// --------------------------------------------------------
// ACTIVE DAY BUTTON
// --------------------------------------------------------

function setActiveDay(day) {
  document.querySelectorAll(".day").forEach((button) => {
    button.classList.remove("active");
  });

  const button = document.querySelector(`.day[data-day="${day}"]`);

  if (button) {
    button.classList.add("active");
  }
}

// --------------------------------------------------------
// DAY BUTTON FUNCTIONS
// --------------------------------------------------------

function mon() {
  setActiveDay("monday");

  showSchedule(mondaySchedule);
}

function tue() {
  setActiveDay("tuesday");

  showSchedule(tuesdaySchedule);
}

function wed() {
  setActiveDay("wednesday");

  showSchedule(wednesdaySchedule);
}

function thur() {
  setActiveDay("thursday");

  showSchedule(thursdaySchedule);
}

function fri() {
  setActiveDay("friday");

  showSchedule(fridaySchedule);
}

// --------------------------------------------------------
// LOAD WEEKLY SCHEDULE
// --------------------------------------------------------

async function loadSchedule() {
  try {
    const response_schedule = await fetch("/fetch-schedule", {
      credentials: "include",
    });

    if (response_schedule.status === 401) {
      window.location.href = "/login.html";

      return;
    }

    if (!response_schedule.ok) {
      throw new Error(`HTTP error! status: ${response_schedule.status}`);
    }

    const dataSchedule = await response_schedule.json();

    console.log("SCHEDULE RESPONSE:", dataSchedule);

    weeklySchedule = dataSchedule.data || [];

    // ----------------------------------------------------
    // FILTER DAYS
    // ----------------------------------------------------

    mondaySchedule = weeklySchedule.filter(
      (item) => item.day?.trim().toLowerCase() === "monday",
    );

    tuesdaySchedule = weeklySchedule.filter(
      (item) => item.day?.trim().toLowerCase() === "tuesday",
    );

    wednesdaySchedule = weeklySchedule.filter(
      (item) => item.day?.trim().toLowerCase() === "wednesday",
    );

    thursdaySchedule = weeklySchedule.filter(
      (item) => item.day?.trim().toLowerCase() === "thursday",
    );

    fridaySchedule = weeklySchedule.filter(
      (item) => item.day?.trim().toLowerCase() === "friday",
    );

    console.log("Monday:", mondaySchedule);
    console.log("Tuesday:", tuesdaySchedule);
    console.log("Wednesday:", wednesdaySchedule);
    console.log("Thursday:", thursdaySchedule);
    console.log("Friday:", fridaySchedule);

    // ----------------------------------------------------
    // AUTOMATICALLY SHOW TODAY
    // ----------------------------------------------------

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    if (today === "Monday") {
      mon();
    } else if (today === "Tuesday") {
      tue();
    } else if (today === "Wednesday") {
      wed();
    } else if (today === "Thursday") {
      thur();
    } else if (today === "Friday") {
      fri();
    } else {
      const container = document.getElementById("lecture-container");

      if (container) {
        container.innerHTML = `
          <div class="schedule-empty">
            No classes today
          </div>
        `;
      }
    }
  } catch (err) {
    console.error("Error fetching weekly schedule:", err);
  }
}

loadSchedule();
