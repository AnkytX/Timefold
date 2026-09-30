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

function showdashboard() {
  window.location.href = "/index.html";
}




let timetableData = []
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
//                                                    helper function
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
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

// minut converter
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}



// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
//                                                       NAV BAR JAVASCRIPT
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------

function showPage(pageId) {
  document.querySelectorAll(".page-section").forEach((page) => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageId);

  if (!page) return;

  page.classList.add("active");

  const navButtons = document.querySelectorAll(".nav-button-div");

  navButtons.forEach((button) => {
    button.classList.remove("current-page");
  });

  // Find the nav button that opens this page
  navButtons.forEach((button) => {
    const navButton = button.querySelector(".nav-button");

    if (
      navButton &&
      navButton.getAttribute("onclick")?.includes(`'${pageId}'`)
    ) {
      button.classList.add("current-page");
    }
  });

  window.location.hash = pageId;
}



// ============================================================
// DARK / LIGHT THEME
// ============================================================

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.body.classList.toggle("dark-theme", isDark);

  localStorage.setItem("timefold-theme", isDark ? "dark" : "light");

  const label = document.getElementById("theme-label");

  if (label) {
    label.textContent = isDark ? "Dark" : "Light";
  }

  const toggle = document.getElementById("theme-toggle");

  if (toggle) {
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
  }
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("dark-theme")
    ? "dark"
    : "light";

  applyTheme(currentTheme === "dark" ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("timefold-theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme);
  } else {
    applyTheme("light");
  }
});


// Fetching Data

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


    if (
      !result.success ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      console.warn("No timetable records found.");
      return;
    }
    timetableData = result.data;
    const now = new Date();
    const currentHour = now.getHours() * 60 + now.getMinutes();
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



    const hide_current = document.getElementById("delet-current-class");
    const hide_next = document.getElementById("delete-next-class");

    // map elemants
    const sub = document.getElementById("current-map-sub");
    const sub_tec = document.getElementById("current-map-professor");
    const start_map_time = document.getElementById("current-map-time");
    const map_room = document.getElementById("current-map-room");
    const delete_map_lec = document.getElementById("map-lec");


    /////////////////////////////////////////////////

    // tokan geneartion
    const currenttokan = timetableData.findIndex((lecture) => {
      const start = toMinutes(lecture.start_time);
      const end = toMinutes(lecture.end_time);

      return currentHour >= start && currentHour <= end;
    });

    // upcoming lecture
    const upcoming_class = timetableData.findIndex((lecture) => {
      const start = toMinutes(lecture.start_time);
      return start > currentHour && start - currentHour <= 30;
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

    // ========================================================
    // LECTURE INSERTION // lecture insert dynamicly
    // ========================================================

    const dayName = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    if (dayName === "Sunday" || dayName === "Saturday") {
      const message = `<div class="bold-text">No Class Right Now</div>`;

      [hide_current, hide_next, delete_map_lec].forEach((el) => {
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
      updateMapImage(current_class.room);

      // map ka data
      if (delete_map_lec) {
        delete_map_lec.style.display = "";
        delete_map_lec.innerHTML = `<span class="map-lec-subprof">
                                    <h1 id="current-map-sub">${current_class.subject_code} </h1>

                                    <h1 id="current-map-professor">
                                        ${current_class.faculty_code}
                                    </h1>
                                </span>

                                <span class="map-lec-timeroom">
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
                                </span>`;
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
             No Class Right Now
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
          hide_current.innerHTML = `<div class="map-lunchbreak">Its Lunch Time 🍛</div>`;
        }
        if (delete_map_lec) {
          delete_map_lec.innerHTML = ` <div class="map-lunchbreak">
              Its Lunch Time 🍛
            </div>`;
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
          hide_current.innerHTML = `<div class="bold-text">No Class Right Now</div>`;
        }
        if (hide_next) {
          hide_next.style.display = "";
          hide_next.innerHTML = `<div class="bold-text">No Class Right Now</div>`;
        }
        if (delete_map_lec) {
          delete_map_lec.innerHTML = "";
          delete_map_lec.innerHTML = ` <div class="bold-text">
             No Class Right Now
            </div>`;
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

///// lecture of  doday logic
function showSchedule(schedule) {
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

async function logout() {
  try {
    const response = await fetch("/logout", {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = "/login.html";
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
}

//map double event

/*
  Smooth pan / zoom map (Google-Maps-like)
  Required CSS (see bottom of reply):
    #mapViewport { overflow:hidden; touch-action:none; user-select:none; position:relative; }
    #mapImage    { width:100%; height:100%; transform-origin:0 0; will-change:transform;
                   -webkit-user-drag:none; user-select:none; }
  Optional buttons: #zoomIn  #zoomOut  #resetView
*/
(() => {
  const viewport = document.getElementById("mapViewport");
  const img = document.getElementById("mapImage");
  img.draggable = false;
  if (!viewport.hasAttribute("tabindex")) viewport.tabIndex = 0; // keyboard support

  // ---------- Settings ----------
  const MIN_SCALE = 1;
  const MAX_SCALE = 6;
  const DOUBLE_TAP_SCALE = 2.5;
  const DOUBLE_TAP_DELAY = 300; // ms
  const DOUBLE_TAP_DIST = 30; // px
  const TAP_SLOP = 8; // px movement allowed for a "tap"
  const TAP_MAX_TIME = 250; // ms
  const DRAG_ZOOM_DIV = 150; // one-finger zoom sensitivity (lower = faster)
  const FRICTION_MS = 325; // inertia decay time constant
  const ANIM_MS = 300;

  // ---------- State ----------
  let scale = 1,
    x = 0,
    y = 0;
  const pointers = new Map();
  let gesture = null; // info about the current touch/click sequence
  let pinch = null;
  let samples = []; // recent pan samples for inertia
  let lastTap = { time: -Infinity, x: 0, y: 0 };
  let rafRender = 0,
    rafMotion = 0;

  // ---------- Helpers ----------
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  function local(e) {
    const r = viewport.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function clampAxis(p, view, content) {
    if (content <= view) return (view - content) / 2; // centre if smaller
    return clamp(p, view - content, 0);
  }

  function clampPos(s, px, py) {
    return {
      x: clampAxis(px, viewport.clientWidth, img.offsetWidth * s),
      y: clampAxis(py, viewport.clientHeight, img.offsetHeight * s),
    };
  }

  function render() {
    if (rafRender) return;
    rafRender = requestAnimationFrame(() => {
      rafRender = 0;
      img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    });
  }

  function apply() {
    const c = clampPos(scale, x, y);
    x = c.x;
    y = c.y;
    render();
  }

  // Zoom keeping the point (cx, cy) fixed on screen
  function zoomAt(cx, cy, newScale) {
    newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);
    const k = newScale / scale;
    x = cx - (cx - x) * k;
    y = cy - (cy - y) * k;
    scale = newScale;
    apply();
  }

  // ---------- Motion (animation + inertia) ----------
  function stopMotion() {
    cancelAnimationFrame(rafMotion);
    rafMotion = 0;
  }

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function animateTo(tScale, tx, ty, duration = ANIM_MS) {
    stopMotion();
    tScale = clamp(tScale, MIN_SCALE, MAX_SCALE);
    const c = clampPos(tScale, tx, ty);
    const s0 = scale,
      x0 = x,
      y0 = y;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = easeOutCubic(t);
      scale = s0 + (tScale - s0) * e;
      x = x0 + (c.x - x0) * e;
      y = y0 + (c.y - y0) * e;
      render();
      rafMotion = t < 1 ? requestAnimationFrame(step) : 0;
    };
    rafMotion = requestAnimationFrame(step);
  }

  function zoomToAnimated(cx, cy, newScale) {
    newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);
    const k = newScale / scale;
    animateTo(newScale, cx - (cx - x) * k, cy - (cy - y) * k);
  }

  function startInertia() {
    if (samples.length < 2) return;
    const last = samples[samples.length - 1];
    if (performance.now() - last.t > 80) return; // finger rested before release
    const first = samples.find((s) => last.t - s.t <= 100) || samples[0];
    const dt = last.t - first.t;
    if (dt <= 0) return;
    let vx = (last.x - first.x) / dt;
    let vy = (last.y - first.y) / dt;
    if (Math.hypot(vx, vy) < 0.1) return;

    stopMotion();
    let prev = performance.now();
    const step = (now) => {
      const d = Math.min(now - prev, 50);
      prev = now;
      const decay = Math.exp(-d / FRICTION_MS);
      vx *= decay;
      vy *= decay;
      const nx = x + vx * d,
        ny = y + vy * d;
      const c = clampPos(scale, nx, ny);
      if (c.x !== nx) vx = 0; // hit an edge -> stop that axis
      if (c.y !== ny) vy = 0;
      x = c.x;
      y = c.y;
      render();
      rafMotion = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(step) : 0;
    };
    rafMotion = requestAnimationFrame(step);
  }

  // ---------- Pointer events ----------
  function startPinch() {
    const [a, b] = [...pointers.values()];
    const m = mid(a, b);
    pinch = {
      dist: Math.max(dist(a, b), 1),
      scale,
      anchor: { x: (m.x - x) / scale, y: (m.y - y) / scale }, // content point under fingers
    };
  }

  viewport.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (pointers.size >= 2) return;
    stopMotion();
    viewport.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.set(e.pointerId, p);

    if (pointers.size === 1) {
      gesture = {
        startX: p.x,
        startY: p.y,
        startTime: e.timeStamp,
        startScale: scale,
        moved: false,
        multi: false,
        dragZoom: false,
        second:
          e.timeStamp - lastTap.time < DOUBLE_TAP_DELAY &&
          dist(p, lastTap) < DOUBLE_TAP_DIST,
      };
      samples = [{ t: performance.now(), x: p.x, y: p.y }];
    } else if (gesture) {
      gesture.multi = true;
      startPinch();
    }
  });

  viewport.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev || !gesture) return;
    const p = local(e);
    pointers.set(e.pointerId, p);

    // Two fingers: pinch + pan around the midpoint
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const m = mid(a, b);
      scale = clamp(
        pinch.scale * (dist(a, b) / pinch.dist),
        MIN_SCALE,
        MAX_SCALE,
      );
      x = m.x - pinch.anchor.x * scale;
      y = m.y - pinch.anchor.y * scale;
      apply();
      return;
    }

    if (pointers.size !== 1) return;

    if (!gesture.moved) {
      if (Math.hypot(p.x - gesture.startX, p.y - gesture.startY) < TAP_SLOP)
        return;
      gesture.moved = true;
    }

    // Double-tap + drag = one-finger zoom (touch only, like Google Maps)
    if (gesture.second && e.pointerType !== "mouse") {
      gesture.dragZoom = true;
      const s =
        gesture.startScale * Math.exp((p.y - gesture.startY) / DRAG_ZOOM_DIV);
      zoomAt(gesture.startX, gesture.startY, s);
      return;
    }

    // One finger / mouse drag pan
    x += p.x - prev.x;
    y += p.y - prev.y;
    apply();
    const t = performance.now();
    samples.push({ t, x: p.x, y: p.y });
    while (samples.length > 2 && t - samples[0].t > 150) samples.shift();
  });

  function endPointer(e, cancelled) {
    if (!pointers.has(e.pointerId)) return;
    const p = local(e);
    pointers.delete(e.pointerId);
    if (viewport.hasPointerCapture(e.pointerId))
      viewport.releasePointerCapture(e.pointerId);

    if (pointers.size === 1) {
      // Pinch -> single finger: continue panning smoothly with the remaining finger
      pinch = null;
      gesture.moved = true;
      gesture.second = false;
      samples = [];
      return;
    }
    if (pointers.size > 0 || !gesture) return;

    const g = gesture;
    gesture = null;
    pinch = null;
    if (cancelled) return;

    const isTap =
      !g.moved && !g.multi && e.timeStamp - g.startTime < TAP_MAX_TIME;
    if (isTap) {
      if (g.second) {
        lastTap.time = -Infinity;
        if (scale > 1.05) animateTo(1, 0, 0);
        else zoomToAnimated(p.x, p.y, DOUBLE_TAP_SCALE);
      } else {
        lastTap = { time: e.timeStamp, x: p.x, y: p.y };
      }
    } else if (g.moved && !g.multi && !g.dragZoom) {
      startInertia();
    }
  }

  viewport.addEventListener("pointerup", (e) => endPointer(e, false));
  viewport.addEventListener("pointercancel", (e) => endPointer(e, true));

  // ---------- Mouse wheel / trackpad pinch ----------
  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      stopMotion();
      const p = local(e);
      let delta = e.deltaY;
      if (e.deltaMode === 1)
        delta *= 16; // lines -> px
      else if (e.deltaMode === 2) delta *= 100; // pages -> px
      const speed = e.ctrlKey ? 0.01 : 0.0018; // ctrlKey = trackpad pinch
      zoomAt(p.x, p.y, scale * Math.exp(-delta * speed));
    },
    { passive: false },
  );

  // ---------- Buttons & keyboard ----------
  const cx = () => viewport.clientWidth / 2;
  const cy = () => viewport.clientHeight / 2;
  const zoomBy = (f) => zoomToAnimated(cx(), cy(), scale * f);
  const reset = () => animateTo(1, 0, 0);

  document
    .getElementById("zoomIn")
    ?.addEventListener("click", () => zoomBy(1.6));
  document
    .getElementById("zoomOut")
    ?.addEventListener("click", () => zoomBy(1 / 1.6));
  document.getElementById("resetView")?.addEventListener("click", reset);

  viewport.addEventListener("keydown", (e) => {
    const step = 80;
    const pan = (dx, dy) => animateTo(scale, x + dx, y + dy, 150);
    switch (e.key) {
      case "+":
      case "=":
        zoomBy(1.6);
        break;
      case "-":
      case "_":
        zoomBy(1 / 1.6);
        break;
      case "0":
        reset();
        break;
      case "ArrowLeft":
        pan(step, 0);
        break;
      case "ArrowRight":
        pan(-step, 0);
        break;
      case "ArrowUp":
        pan(0, step);
        break;
      case "ArrowDown":
        pan(0, -step);
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  // ---------- Keep things valid on resize ----------
  new ResizeObserver(apply).observe(viewport);
  img.addEventListener("load", apply);
  apply();
})();

// map behaviar




const MAP_URLS = {
  "Mining Department": "https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/timefold%20map/minning.svg",
  "Civil Department": "https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/timefold%20map/civil.svg",
  "Workshop": "https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/timefold%20map/workshop.svg",
  "Library Department": "https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/timefold%20map/library.svg",
  "Electrical Department": "https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/timefold%20map/electrical.svg",
  "Mechanical Department": "https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/timefold%20map/mechanical.svg"
};
const defoult_map = "https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/timefold%20map/no-lecture.svg"



function updateMapImage(roomCode) {
  const mapImage = document.getElementById('mapImage');
  if (!roomCode) {
    mapImage.src = defoult_map;
    return;
  }
  const depart = getdep(roomCode).department;
  mapImage.src = MAP_URLS[depart] || defoult_map;
}



// save pasward 
async function savepassward() {
  const passwordInputEl = document.getElementById("password-input");

  if (!passwordInputEl) {
    console.error("Input element #pasward-input not found in DOM");
    return;
  }

  const password = passwordInputEl.value.trim();

  if (!password) {
    alert("Please enter password first");
    return; // Stop execution here
  }

  try {
    const response = await fetch("/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        password: password, // Sending the plain text value
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert("Password updated successfully!");
      passwordInputEl.value = ""; // Clear input after successful update
    } else {
      alert(data.message || "Failed to update password");
    }
  } catch (error) {
    console.error("Error updating password:", error);
    alert("Server error, please try again later.");
  }
}

// for  name 
async function savename() {
  const nameunput = document.getElementById("Name");

  if (!nameunput) {
    console.error("Input element #Name not found in DOM");
    return;
  }

  const Name = nameunput.value.trim();

  if (!Name) {
    alert("Please enter Name first");
    return; // Stop execution here
  }

  try {
    const response = await fetch("/name", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        Name: Name, // Sending the plain text value
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert("Name updated successfully!");
      nameunput.value = ""; // Clear input after successful update
    } else {
      alert(data.message || "Failed to update Name");
    }
  } catch (error) {
    console.error("Error updating Name:", error);
    alert("Server error, please try again later.");
  }
}



// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
//                                                       Notification
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
const notifiedLectures = new Set()

async function reqnotification() {

  if (!("Notification" in window)) {
    console.log("Browser does not support notification");
    return
  }
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

}


function sendnotification(lecture) {

  if (Notification.permission !== "granted") {
    return
  }
  new Notification("🔔 TimeFold — Upcoming Class", {
    body: `Next Lecture ${lecture.subject_code} will be start in 10 minuts \nRoom: ${lecture.room} \nDepartmrnt  ${getdep(lecture.room).department}`
    , icon: "./icon.png"
  })

}

function chekupcominglecture() {
  if (!Array.isArray(timetableData) || timetableData.length === 0) return;
  const current = new Date()
  const getcurrentmin = current.getHours() * 60 + current.getMinutes();
  const todayDate = current.toDateString();
  timetableData.forEach(lecture => {
    const start = toMinutes(lecture.start_time)
    const diff = start - getcurrentmin;
    const lectureKey = `${todayDate}_${lecture.subject_code}_${lecture.start_time}`;
    if (diff > 0 && diff <= 10 && !notifiedLectures.has(lectureKey)) {
      sendnotification(lecture);
      notifiedLectures.add(lectureKey); // Mark as sent so it NEVER sends again
    }

  });

}
// Add an interval to periodically check every minute:
setInterval(chekupcominglecture, 60000);
