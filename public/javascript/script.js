// ========================================================
// 1. GLOBAL DATA
// ========================================================

let timetableData = [];
let weeklySchedule = [];
let notice_data = [];

let mondaySchedule = [];
let tuesdaySchedule = [];
let wednesdaySchedule = [];
let thursdaySchedule = [];
let fridaySchedule = [];

const notifiedLectures = new Set();

const MAP_URLS = {
  "Mining Department": "public/assets/images/minning.svg",
  "Civil Department": "public/assets/images/civil.svg",
  "Workshop": "public/assets/images/workshop.svg",
  "Library Department": "public/assets/images/library.svg",
  "Electrical Department": "public/assets/images/electrical.svg",
  "Mechanical Department": "public/assets/images/mechanical.svg",
};

const DEFAULT_MAP = "public/assets/images/no-lecture.svg";

// ========================================================
// 2. HELPER FUNCTIONS
// ========================================================

// Decode department and floor metadata from room code
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

// Format 24-hr time string (HH:MM) to AM/PM localized representation
function formatTime(time) {
  if (!time || typeof time !== "string" || !time.includes(":")) return "--:--";
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Alias for schedule module formatting
function formatScheduleTime(time) {
  return formatTime(time);
}

// Convert "HH:MM" string to minutes elapsed from midnight
function toMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Auth routing helpers
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

// ========================================================
// 3. API / FETCH
// ========================================================

// Centralized wrapper for fetch calls
// 1. Don't auto-redirect immediately on 401 if we are on a teacher page
// Centralized wrapper for fetch calls
async function apiFetch(endpoint, options = {}) {
  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(endpoint, { ...defaultOptions, ...options });

    // 1. Session expired or unauthorized
    if (response.status === 401) {
      if (!window.location.pathname.includes("teacher-index.html")) {
        showlogin();
      }
      return null;
    }

    // 2. Prevent crash if response is HTML (like login.html or 404 page)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(
        `[apiFetch] Expected JSON from ${endpoint}, but got HTML/Text.`,
      );
      return null;
    }

    return response;
  } catch (error) {
    console.error(`[apiFetch] Network error for ${endpoint}:`, error);
    return null;
  }
}
// 2. Only run student timetable queries if on the student page
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();

  // If this is a teacher page, skip student timetable & schedule fetch entirely
  const isTeacherPage =
    window.location.pathname.includes("teacher") ||
    !!document.querySelector(".teacher-nav");

  if (!isTeacherPage) {
    if (document.getElementById("mapViewport")) {
      initMapGestures();
    }
    await reqnotification();
    await initTimetable();
    await loadSchedule();
    await loadnotice();
    await loadStudentName();
    await mon();
    setInterval(chekupcominglecture, 60000);
  }
});

// Fetch user's active timetable
async function fetchTimetable() {
  try {
    const response = await apiFetch("/fetch", { method: "GET" });
    if (!response || !response.ok)
      throw new Error(`HTTP error! status: ${response?.status}`);

    const result = await response.json();
    if (
      !result.success ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      console.warn("No timetable records found.");
      return [];
    }
    return result.data;
  } catch (error) {
    console.error("Error loading timetable:", error);
    return [];
  }
}

// Fetch full weekly schedule records
async function fetchSchedule() {
  try {
    const response = await apiFetch("/fetch-schedule", { method: "GET" });
    if (!response || !response.ok)
      throw new Error(`HTTP error! status: ${response?.status}`);

    const dataSchedule = await response.json();
    return dataSchedule.data || [];
  } catch (err) {
    console.error("Error fetching weekly schedule:", err);
    return [];
  }
}
// post  logic of student notices
async function notice() {
  const semElement = document.getElementById("Sem");
  const batchElement = document.getElementById("batch");
  const msgElement = document.getElementById("notice");

  const Sem = semElement ? semElement.value.trim() : "";
  const batch = batchElement ? batchElement.value.trim() : "";
  const msgInput = msgElement ? msgElement.value.trim() : "";

  // 1. Client-side input validation
  if (!Sem) {
    alert("Please enter the semester.");
    semElement?.focus();
    return;
  }
  if (!batch) {
    alert("Please enter the batch name.");
    batchElement?.focus();
    return;
  }
  if (!msgInput) {
    alert("Please enter a notice message.");
    msgElement?.focus();
    return;
  }

  // 2. Submit data to server
  try {
    const response = await apiFetch("/notice", {
      method: "POST",
      body: JSON.stringify({
        Sem: parseInt(Sem, 10),
        batch: batch,
        notice: msgInput,
      }),
    });

    if (!response) {
      alert("Session expired or request blocked. Please re-login.");
      return;
    }

    const data = await response.json();

    if (response.ok && data.success) {
      alert(data.message || "Notice posted successfully!");
      if (msgElement) msgElement.value = "";
    } else {
      alert("Error: " + (data.message || "Unable to post notice."));
    }
  } catch (error) {
    console.error("Notice error:", error);
    alert("Network error: Could not connect to the server.");
  }
}
async function fetchNotices() {
  try {
    const response = await apiFetch("/student/notices", { method: "GET" });
    if (!response || !response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Notice fetch error:", error);
    return null;
  }
}
// Fetch notices and populate elements
async function loadnotice() {
  const noticeResult = await fetchNotices();
  if (!noticeResult) return;

  console.log("Server response:", noticeResult);
  notice_data = noticeResult.notices || [];
  console.log("Notice data:", notice_data);

  showNotice(notice_data);
}

// ========================================================
// 4. SHOW / RENDER
// ========================================================

// Render notices to dashboard
function showNotice(notices) {
  const container = document.getElementById("notice-list");
  if (!container) return;

  const now = Date.now();
  const TWENTY_FOUR_HOURS = 12 * 60 * 60 * 1000;

  // 1. Strictly keep only valid notices posted within the last 24 hours
  const activeNotices = Array.isArray(notices)
    ? notices.filter((item) => {
        const noticeDate =
          item.notice_time || item.created_at || item.timestamp;

        const noticeTime = new Date(noticeDate).getTime();
        if (isNaN(noticeTime)) return false;

        const age = now - noticeTime;

        // Must be in the past (age >= -60000ms grace for clock drift) and 12 hours
        return age >= -60000 && age <= TWENTY_FOUR_HOURS;
      })
    : [];

  // 2. Clear old content
  container.innerHTML = "";

  // 3. Render notices or show empty fallback
  if (activeNotices.length > 0) {
    activeNotices.forEach((item) => {
      const card = document.createElement("div");
      card.className = "notice-card-wrapper";
      card.style.marginBottom = "14px";

      card.innerHTML = `
        <div class="notice-container">
          <div style="display: flex; justify-content: left; gap: 5px; align-items: baseline;">
            <h2 style="margin: 0; font-size: 1.1rem;">ATTENTION</h2>
            <span style="color: var(--muted, #666); font-size: 0.85rem; font-weight: 600;">
              ${item.faculty_code || item.faculty_name || "Unknown Faculty"}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; margin-top: 8px;">
            <p style="margin: 0; line-height: 1.5; color: inherit;">
              ${item.notice}
            </p>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  } else {
    container.innerHTML = `<p style="text-align: center; color: var(--muted, #888); margin-top: 2rem;">No notices today</p>`;
  }
}

// ========================================================
// 4. (showClassStatus)
// ========================================================

function showClassStatus(data) {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });

  // Section Containers
  const current_card = document.getElementById("delete-current-class") ||
  document.getElementById("delet-current-class");
  
  const next_card = document.getElementById("delete-next-class");
  const map_current_card= document.getElementById("map-lec");


    //light
    const green = document.getElementById('green');
    const grey = document.getElementById('grey');
    const grey_next = document.getElementById('grey-next');
    const orange = document.getElementById('orange');

  // 1. Weekend check (runs even if data is [])
  if (dayName === "Sunday" || dayName === "Saturday") {
    if (green && orange) {
      green.style.display = "none"
      orange.style.display = "none"
    }
    const message = `<div class="bold-text">Its</div>`;
    [current_card,next_card,map_current_card].forEach((el) => {
      if (el) {
        el.style.display = "";
        el.innerHTML = message;
      }
    });
    return;
  }

  // 2. Weekday but no lectures scheduled
  if (!Array.isArray(data) || data.length === 0) {
    green.style.display = "none"
      orange.style.display = "none"
    const message = `<div class="bold-text">No Classes Scheduled</div>`;
    [map_current_card,next_card,current_card].forEach((el) => {
      if (el) {
        el.style.display = "";
        el.innerHTML = message;
      }
    });
    return;
  }

  
    // getting  current time
  const currenttime_s = now.getHours() * 60 + now.getMinutes();

  // Active 
     const currenttokan = data.findIndex((lecture) => {
    const start = toMinutes(lecture.start_time);
    const end = toMinutes(lecture.end_time);
    return currenttime_s >= start && currenttime_s < end;
  });
  // upcoming class
    const upcoming_class = data.findIndex((lecture) => {
    const start = toMinutes(lecture.start_time);
    return start > currenttime_s ;
  });

     if (currenttime_s >= 1020 || currenttime_s < 540) {
      orange.style.display = "none"
      green.style.display = "none"
        if (current_card) {
          
         
          current_card.innerHTML = `<div class="bold-text"> No Classes </div>`
          map_current_card.innerHTML= `<div class="bold-text"> No Classes </div>`
        }
        if (next_card) {
          
          
          next_card.innerHTML = `<div class="bold-text"> No Classes </div>`
          
        }


    
     }else if (currenttime_s >= 540 && currenttime_s < 630) {
         green.style.display = "none"
         orange.style.display = "none"
    const first_class = data[0];

      if (first_class && current_card) {
      current_card.innerHTML= `<div class="bold-text">Class Starting Soon </div>` ;
      map_current_card.innerHTML = `<div class="bold-text">Class Starting Soon </div>`
       }

      if(next_card && first_class) {
      next_card.innerHTML = `
    <div class="card-description">
        <div class="bold-text" id="next-sub">
            ${first_class.subject_code}
        </div>

        <div class="small-text">
            <span id="next-start-time">${formatTime(first_class.start_time)}</span>
            <span id="delet-hyphen">-</span>
            <span id="next-end-time">${formatTime(first_class.end_time)}</span>
        </div>
    </div>

    <div class="card-description">
        <div class="bold-text" id="next-class-professor-label">
            Professor
        </div>

        <div class="small-text" id="next-class-professor">
            ${first_class.faculty_code}
        </div>
    </div>

    <div class="location-des" id="next-location">
        <svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em"
            viewBox="0 0 16 16">
            <title>location</title>
            <path fill="#450D5F"
                d="M8 1a6 6 0 0 1 6 6c0 2.874-3.097 6.016-4.84 7.558-.67.59-1.65.59-2.32 0C5.098 13.016 2 9.874 2 7a6 6 0 0 1 6-6m0 1a5 5 0 0 0-5 5c0 1.108.614 2.395 1.57 3.683.933 1.258 2.087 2.377 2.934 3.126.29.256.702.256.992 0c.847-.749 2-1.867 2.935-3.126C12.386 9.395 13 8.108 13 7a5 5 0 0 0-5-5m0 2.75a2.25 2.25 0 1 1 0 4.5a2.25 2.25 0 0 1 0-4.5m0 1a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5" />
        </svg>

        <span id="next-room">${first_class.room}</span>
        <span id="next-depa">${getdep(first_class.room).department}</span>
    </div>
       `;
      }


     // if current class  start
     }  else if (currenttokan !== -1){
      grey.style.display = "none"
      grey_next.style.display = "none"
      const current_class = data[currenttokan];
        if (map_current_card) {
          map_current_card.innerHTML = ` <span class="map-lec-subprof">
          <h1 id="current-map-sub">${current_class.subject_code}</h1>
          <h1 id="current-map-professor">${current_class.faculty_code}</h1>
        </span>
        <span class="map-lec-timeroom">
          <span class="map-lec-sub">
            <p class="bold-text" id="current-map-time">${formatTime(current_class.start_time)}</p>
          </span>
          <span class="map-lec-sub">
            <p class="bold-text">|</p>
          </span>
          <span class="map-lec-sub">
            <p class="bold-text" id="current-map-room">${current_class.room}</p>
          </span>
        </span>`
          
        }
          if(current_class && current_card){
            current_card.innerHTML = `
                             <div class="card-description" id="current-class-sub-div">
            <div class="bold-text" id="current-class-sub">
                ${current_class.subject_code}
            </div>

            <div class="small-text" id="current-class-time">
                <span id="current-class-starttime">
                    ${formatTime(current_class.start_time)}
                </span>
                <span id="delet-hyphen">-</span>
                <span id="current-class-endtime">
                    ${formatTime(current_class.end_time)}
                </span>
            </div>
        </div>
        <div class="card-description">
            <div class="bold-text" id="current-class-professor-label">
                Professor
            </div>
            <div class="small-text" id="current-class-professor-name">
                ${current_class.faculty_code}
            </div>
        </div>
        <div class="location-des" id="current-location">
            <svg xmlns="http://www.w3.org/2000/svg"
                width="1.1em"
                height="1.1em"
                viewBox="0 0 16 16">
                <title>location</title>
                <path fill="#450D5F"
                    d="M8 1a6 6 0 0 1 6 6c0 2.874-3.097 6.016-4.84 7.558c-.67.59-1.65.59-2.32 0C5.098 13.016 2 9.874 2 7a6 6 0 0 1 6-6m0 1a5 5 0 0 0-5 5c0 1.108.614 2.395 1.57 3.683c.933 1.258 2.087 2.377 2.934 3.126c.29.256.702.256.992 0c.847-.749 2-1.867 2.935-3.126C12.386 9.395 13 8.108 13 7a5 5 0 0 0-5-5m0 2.75a2.25 2.25 0 1 1 0 4.5a2.25 2.25 0 0 1 0-4.5m0 1a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5" />
            </svg>
            <span id="room_no">
                ${current_class.room}
            </span>
            <span id="Department">
                ${getdep(current_class.room).department}
            </span>
        </div>
            `
          }

         const next_tokan = currenttokan + 1;
          const next_class = data[next_tokan]
          if (next_class && next_card ) {
            
            next_card.innerHTML = `
              <div class="card-description" id="current-class-sub-div">
            <div class="bold-text" id="current-class-sub">
                ${next_class.subject_code}
            </div>

            <div class="small-text" id="current-class-time">
                <span id="current-class-starttime">
                    ${formatTime(next_class.start_time)}
                </span>
                <span id="delet-hyphen">-</span>
                <span id="current-class-endtime">
                    ${formatTime(next_class.end_time)}
                </span>
            </div>
        </div>
        <div class="card-description">
            <div class="bold-text" id="current-class-professor-label">
                Professor
            </div>
            <div class="small-text" id="current-class-professor-name">
                ${next_class.faculty_code}
            </div>
        </div>
        <div class="location-des" id="current-location">
            <svg xmlns="http://www.w3.org/2000/svg"
                width="1.1em"
                height="1.1em"
                viewBox="0 0 16 16">
                <title>location</title>
                <path fill="#450D5F"
                    d="M8 1a6 6 0 0 1 6 6c0 2.874-3.097 6.016-4.84 7.558c-.67.59-1.65.59-2.32 0C5.098 13.016 2 9.874 2 7a6 6 0 0 1 6-6m0 1a5 5 0 0 0-5 5c0 1.108.614 2.395 1.57 3.683c.933 1.258 2.087 2.377 2.934 3.126c.29.256.702.256.992 0c.847-.749 2-1.867 2.935-3.126C12.386 9.395 13 8.108 13 7a5 5 0 0 0-5-5m0 2.75a2.25 2.25 0 1 1 0 4.5a2.25 2.25 0 0 1 0-4.5m0 1a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5" />
            </svg>
            <span id="room_no">
                ${next_class.room}
            </span>
            <span id="Department">
                ${getdep(next_class.room).department}
            </span>
        </div>
            `
          }else{
            next_card.innerHTML = `<div class="bold-text">No More Class Today </div>`;
          }
       }
       else{
        const startlunch = 12*60 + 30;
        const endlunch  =  13*60;
        const itslunch = currenttime_s >= startlunch && currenttime_s < endlunch;
        if (itslunch) {
          const next_tokan = currenttokan + 1;
          const next_class = data[next_tokan]
              green.style.display = "none"
        current_card.innerHTML = `<div class="bold-text">Its Lunch Time 🍚 </div>`
        map_current_card.innerHTML =`<div class="bold-text">Its Lunch Time 🍚 </div>`
             if (next_card && next_class) {
               next_card.innerHTML = `<div class="card-description" id="current-class-sub-div">
            <div class="bold-text" id="current-class-sub">
                ${next_class.subject_code}
            </div>

            <div class="small-text" id="current-class-time">
                <span id="current-class-starttime">
                    ${formatTime(next_class.start_time)}
                </span>
                <span id="delet-hyphen">-</span>
                <span id="current-class-endtime">
                    ${formatTime(next_class.end_time)}
                </span>
            </div>
        </div>
        <div class="card-description">
            <div class="bold-text" id="current-class-professor-label">
                Professor
            </div>
            <div class="small-text" id="current-class-professor-name">
                ${next_class.faculty_code}
            </div>
        </div>
        <div class="location-des" id="current-location">
            <svg xmlns="http://www.w3.org/2000/svg"
                width="1.1em"
                height="1.1em"
                viewBox="0 0 16 16">
                <title>location</title>
                <path fill="#450D5F"
                    d="M8 1a6 6 0 0 1 6 6c0 2.874-3.097 6.016-4.84 7.558c-.67.59-1.65.59-2.32 0C5.098 13.016 2 9.874 2 7a6 6 0 0 1 6-6m0 1a5 5 0 0 0-5 5c0 1.108.614 2.395 1.57 3.683c.933 1.258 2.087 2.377 2.934 3.126c.29.256.702.256.992 0c.847-.749 2-1.867 2.935-3.126C12.386 9.395 13 8.108 13 7a5 5 0 0 0-5-5m0 2.75a2.25 2.25 0 1 1 0 4.5a2.25 2.25 0 0 1 0-4.5m0 1a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5" />
            </svg>
            <span id="room_no">
                ${next_class.room}
            </span>
            <span id="Department">
                ${getdep(next_class.room).department}
            </span>
        </div>`
             }

       }else if(upcoming_class !== -1 ){
        
        const next_class = data[upcoming_class];
                 if(next_card && next_class)
                 {
                  next_card.innerHTML = `
                          <div class="card-description" id="current-class-sub-div">
            <div class="bold-text" id="current-class-sub">
                ${next_class.subject_code}
            </div>

            <div class="small-text" id="current-class-time">
                <span id="current-class-starttime">
                    ${formatTime(next_class.start_time)}
                </span>
                <span id="delet-hyphen">-</span>
                <span id="current-class-endtime">
                    ${formatTime(next_class.end_time)}
                </span>
            </div>
        </div>
        <div class="card-description">
            <div class="bold-text" id="current-class-professor-label">
                Professor
            </div>
            <div class="small-text" id="current-class-professor-name">
                ${next_class.faculty_code}
            </div>
        </div>
        <div class="location-des" id="current-location">
            <svg xmlns="http://www.w3.org/2000/svg"
                width="1.1em"
                height="1.1em"
                viewBox="0 0 16 16">
                <title>location</title>
                <path fill="#450D5F"
                    d="M8 1a6 6 0 0 1 6 6c0 2.874-3.097 6.016-4.84 7.558c-.67.59-1.65.59-2.32 0C5.098 13.016 2 9.874 2 7a6 6 0 0 1 6-6m0 1a5 5 0 0 0-5 5c0 1.108.614 2.395 1.57 3.683c.933 1.258 2.087 2.377 2.934 3.126c.29.256.702.256.992 0c.847-.749 2-1.867 2.935-3.126C12.386 9.395 13 8.108 13 7a5 5 0 0 0-5-5m0 2.75a2.25 2.25 0 1 1 0 4.5a2.25 2.25 0 0 1 0-4.5m0 1a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5" />
            </svg>
            <span id="room_no">
                ${next_class.room}
            </span>
            <span id="Department">
                ${getdep(next_class.room).department}
            </span>
        </div>
                  `
                 }
          }else{
            green.style.display = "none"
          orange.style.display = "none"
            if (current_card) {
                current_card.innerHTML = `<div class="bold-text"> No More Class Today </div>`
            }
            if (next_card) {
              next_card.innerHTML = `<div class="bold-text"> No More Class Today</div>`
              
            }
            if (map_current_card) {
              map_current_card.innerHTML =`<div class="bold-text"> No More Class Today</div>`
              
            }
          }  
    }
   
}
// Render dynamic lecture list for the day
function showTodayLectures(data) {
  const todayLecturesContainer = document.getElementById("today-lectures");
  if (!todayLecturesContainer) return;

  todayLecturesContainer.innerHTML = data
    .map((lecture, index) => {
      const isFirst = index === 0 ? "first " : "";
      const formattedStartTime = formatTime(lecture.start_time);
      const faculty = lecture.faculty_code || "Staff";
      const room = lecture.room || "TBA";
      const subject = lecture.subject_code || "Lecture";

      return `
        <div class="${isFirst}lecture-div">
          <div>
            <div class="bold-text">${subject}</div>
            <div class="small-text">${faculty} - Room ${room}</div>
          </div>
          <div>
            <div>${formattedStartTime}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadStudentName() {
  try {
    const response = await apiFetch("/student-info", { method: "GET" });
    if (!response || !response.ok) return;

    const result = await response.json();
    if (!result || !result.success || !result.student) return;

    const name = result.student.name.trim().split(/\s+/)[0] || "Student";
    const greetingEl = document.getElementById("greeting");
    const initialEl = document.getElementById("initial");

    if (greetingEl) {
      greetingEl.innerText = `Hello, ${name}`;
    }

    if (initialEl && name.trim().length > 0) {
      initialEl.textContent = name.trim().charAt(0).toUpperCase();
    }
  } catch (error) {
    console.error("Name loading error:", error);
  }
}

// Render student greeting, initials, and date
function showStudentHeader(data) {
  const now = new Date();

  const studentName = data[0]?.name || "Student";

  const dateEl = document.getElementById("date");

  if (dateEl) {
    dateEl.textContent = `Today, ${now.getDate()} ${now.toLocaleString(
      "en-US",
      {
        month: "short",
      },
    )}`;
  }
}


// Primary presentation coordinator for timetable
function showTimetable(data) {
  showStudentHeader(data);
  showClassStatus(data);
  showTodayLectures(data);

  if (typeof loadTimetable === "function") {
    loadTimetable(data);
  }
}

// ========================================================
// 6. TIMETABLE (initTimetable)
// ========================================================

async function initTimetable() {
  timetableData = await fetchTimetable();

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });

  // Check weekend first
  if (dayName === "Sunday" || dayName === "Saturday") {
    showClassStatus([]);
    showStudentHeader(timetableData);
    const todayLectures = document.getElementById("today-lectures");
    if (todayLectures) {
      todayLectures.innerHTML = `<p style="text-align: center; color: var(--muted, #888); margin-top: 1rem;">No classes today</p>`;
    }
    return;
  }

  if (timetableData.length > 0) {
    showTimetable(timetableData);
  } else {
    showClassStatus([]);
    showStudentHeader([]);
    const todayLectures = document.getElementById("today-lectures");
    if (todayLectures) {
      todayLectures.innerHTML = `<p style="text-align: center; color: var(--muted, #888); margin-top: 1rem;">No lectures scheduled</p>`;
    }
  }
}

// ========================================================
// 7. WEEKLY SCHEDULE
// ========================================================

function showSchedule(schedule) {
  const container = document.getElementById("lecture-container");
  if (!container) return;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });

  if (!Array.isArray(schedule) || schedule.length === 0) {
    container.innerHTML = `<div class="schedule-empty">No classes scheduled</div>`;
    return;
  }

  container.innerHTML = schedule
    .map((lecture) => {
      const formattedStartTime = formatScheduleTime(lecture.start_time);
      const formattedEndTime = formatScheduleTime(lecture.end_time);
      const faculty = lecture.faculty_code || "Staff";
      const room = lecture.room;
      const subject = lecture.subject_code || "Lecture";
      const department = getdep(room).department;

      return `
        <div class="schedule-card">
          <div class="time">
            <span>${formattedStartTime}</span>
            <span>${formattedEndTime}</span>
          </div>
          <div class="divider"></div>
          <div class="subject">
            <strong>${subject}</strong>
            <span>${room}</span>
          </div>
          <div class="subject">
            <strong>${faculty}</strong>
            <span>${department}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function setActiveDay(day) {
  document.querySelectorAll(".day").forEach((button) => {
    button.classList.remove("active");
  });

  const button = document.querySelector(`.day[data-day="${day}"]`);
  if (button) {
    button.classList.add("active");
  }
}

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

async function loadSchedule() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });

  weeklySchedule = await fetchSchedule();

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

  if (today === "Monday") mon();
  else if (today === "Tuesday") tue();
  else if (today === "Wednesday") wed();
  else if (today === "Thursday") thur();
  else if (today === "Friday") fri();
  else {
    const container = document.getElementById("lecture-container");
    if (container) {
      container.innerHTML = `<div class="schedule-empty">No classes today</div>`;
    }
  }
}

// ========================================================
// 8. MAP
// ========================================================

function updateMapImage(roomCode) {
  const mapImage = document.getElementById("mapImage");
  if (!mapImage) return;

  if (!roomCode) {
    mapImage.src = DEFAULT_MAP;
    return;
  }
  const depart = getdep(roomCode).department;
  mapImage.src = MAP_URLS[depart] || DEFAULT_MAP;
}

function initMapGestures() {
  const viewport = document.getElementById("mapViewport");
  const img = document.getElementById("mapImage");
  if (!viewport || !img) return;

  img.draggable = false;
  if (!viewport.hasAttribute("tabindex")) viewport.tabIndex = 0;

  // Settings
  const MIN_SCALE = 1;
  const MAX_SCALE = 6;
  const DOUBLE_TAP_SCALE = 2.5;
  const DOUBLE_TAP_DELAY = 300;
  const DOUBLE_TAP_DIST = 30;
  const TAP_SLOP = 8;
  const TAP_MAX_TIME = 250;
  const DRAG_ZOOM_DIV = 150;
  const FRICTION_MS = 325;
  const ANIM_MS = 300;

  // State
  let scale = 1,
    x = 0,
    y = 0;
  const pointers = new Map();
  let gesture = null;
  let pinch = null;
  let samples = [];
  let lastTap = { time: -Infinity, x: 0, y: 0 };
  let rafRender = 0,
    rafMotion = 0;

  // Helpers
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  function local(e) {
    const r = viewport.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function clampAxis(p, view, content) {
    if (content <= view) return (view - content) / 2;
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

  function zoomAt(cx, cy, newScale) {
    newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);
    const k = newScale / scale;
    x = cx - (cx - x) * k;
    y = cy - (cy - y) * k;
    scale = newScale;
    apply();
  }

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
    if (performance.now() - last.t > 80) return;
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
      const nx = x + vx * d;
      const ny = y + vy * d;
      const c = clampPos(scale, nx, ny);
      if (c.x !== nx) vx = 0;
      if (c.y !== ny) vy = 0;
      x = c.x;
      y = c.y;
      render();
      rafMotion = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(step) : 0;
    };
    rafMotion = requestAnimationFrame(step);
  }

  function startPinch() {
    const [a, b] = [...pointers.values()];
    const m = mid(a, b);
    pinch = {
      dist: Math.max(dist(a, b), 1),
      scale,
      anchor: { x: (m.x - x) / scale, y: (m.y - y) / scale },
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

    if (gesture.second && e.pointerType !== "mouse") {
      gesture.dragZoom = true;
      const s =
        gesture.startScale * Math.exp((p.y - gesture.startY) / DRAG_ZOOM_DIV);
      zoomAt(gesture.startX, gesture.startY, s);
      return;
    }

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

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      stopMotion();
      const p = local(e);
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= 100;
      const speed = e.ctrlKey ? 0.01 : 0.0018;
      zoomAt(p.x, p.y, scale * Math.exp(-delta * speed));
    },
    { passive: false },
  );

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

  new ResizeObserver(apply).observe(viewport);
  img.addEventListener("load", apply);
  apply();
}

// ========================================================
// 9. ACCOUNT
// ========================================================

async function savepassward() {
  const passwordInputEl = document.getElementById("password-input");
  if (!passwordInputEl) {
    console.error("Input element #password-input not found in DOM");
    return;
  }

  const password = passwordInputEl.value.trim();
  if (!password) {
    alert("Please enter password first");
    return;
  }

  try {
    const response = await apiFetch("/password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    if (!response) return;
    const data = await response.json();

    if (response.ok && data.success) {
      alert("Password updated successfully!");
      passwordInputEl.value = "";
    } else {
      alert(data.message || "Failed to update password");
    }
  } catch (error) {
    console.error("Error updating password:", error);
    alert("Server error, please try again later.");
  }
}

async function savename() {
  const nameinput = document.getElementById("Name");
  if (!nameinput) {
    console.error("Input element #Name not found in DOM");
    return;
  }

  const Name = nameinput.value.trim();
  if (!Name) {
    alert("Please enter Name first");
    return;
  }

  try {
    const response = await apiFetch("/name", {
      method: "POST",
      body: JSON.stringify({ Name }),
    });

    if (!response) return;
    const data = await response.json();

    if (response.ok && data.success) {
      alert("Name updated successfully!");
      nameinput.value = "";
    } else {
      alert(data.message || "Failed to update Name");
    }
  } catch (error) {
    console.error("Error updating Name:", error);
    alert("Server error, please try again later.");
  }
}

async function logout() {
  try {
    const response = await apiFetch("/logout", { method: "GET" });
    if (!response) return;
    const result = await response.json();

    if (result.success) {
      showlogin();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// ========================================================
// 10. BROWSER CLASS REMINDERS
// ========================================================

async function reqnotification() {
  if (!("Notification" in window)) {
    console.log("Browser does not support notification");
    return;
  }
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function sendnotification(lecture) {
  if (Notification.permission !== "granted") return;

  new Notification("🔔 TimeFold — Upcoming Class", {
    body: `Next Lecture ${lecture.subject_code} will be start in 10 minuts \nRoom: ${lecture.room} \nDepartmrnt  ${getdep(lecture.room).department}`,
    icon: "./icon.png",
  });
}

function chekupcominglecture() {
  if (!Array.isArray(timetableData) || timetableData.length === 0) return;
  const current = new Date();
  const getcurrentmin = current.getHours() * 60 + current.getMinutes();
  const todayDate = current.toDateString();

  timetableData.forEach((lecture) => {
    const start = toMinutes(lecture.start_time);
    const diff = start - getcurrentmin;
    const lectureKey = `${todayDate}_${lecture.subject_code}_${lecture.start_time}`;

    if (diff > 0 && diff <= 30 && !notifiedLectures.has(lectureKey)) {
      sendnotification(lecture);
      notifiedLectures.add(lectureKey);
    }
  });
}

// ========================================================
// 5. NAVIGATION + THEME
// ========================================================

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
  if (pageId === "notice-page") {
    loadnotice();
  }
}

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

function initTheme() {
  const savedTheme = localStorage.getItem("timefold-theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme);
  } else {
    applyTheme("light");
  }
}

// ========================================================
// 5. TEACHER SECTION
// ========================================================
let faculty_name = "";
let facultytimetabel = [];

// Fetch teacher name and display greeting
async function teachername() {
  try {
    const response = await fetch("/teacherinfo", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      window.location.href = "/login.html";
      return;
    }

    const data = await response.json();
    console.log("Teacher info data:", data);

    if (data.success && data.faculty_name) {
      faculty_name = data.faculty_name;
      const greetingFaculty = document.getElementById("greeting-faculty");
      if (greetingFaculty) {
        greetingFaculty.innerText = `Hello , ${faculty_name} Sir`;
      }
    }
  } catch (error) {
    console.error("API Error in teachername:", error);
  }
  const dateEl = document.getElementById("date");
if (dateEl) {
  const now = new Date();
  dateEl.textContent = `Today, ${now.getDate()} ${now.toLocaleString("en-US", { month: "short" })}`;
}
}
facultytimetabel.sort(
    (a, b) =>
        toMinutes(a.start_time) -
        toMinutes(b.start_time)
);


// Fetch teacher timetable data
async function teachertimetabel() {
  try {
    const response = await fetch("/teachertimetabel", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("Error while fetching teacher timetable");
      return;
    }

    const data = await response.json();
    console.log("Timetable data:", data);

    facultytimetabel = Array.isArray(data.timetabel) ? data.timetabel : [];


    // Trigger status calculation once data arrives
    showteacherdata();
  } catch (error) {
    console.error("Error in teachertimetabel:", error);
  }
}

// teacher current class
// const c_subject = document.getElementById("current_class_subject");
// const c_start_time = document.getElementById("current_class_statime");
// const c_end_time = document.getElementById("current_class_entime");
// const c_sem = document.getElementById("current-class-sem");
// const c_batch = document.getElementById("current-class-batch");
// const c_room_no = document.getElementById("T_room_no");
// const c_Department = document.getElementById("T_Department");

//  teacher nexxt class
// const n_subject = document.getElementById("next_class_subject");
// const n_start_time = document.getElementById("next_class_statime");
// const n_end_time = document.getElementById("next_class_entime");
// const n_sem = document.getElementById("next-class-sem");
// const n_batch = document.getElementById("next-class-batch");
// const n_room_no = document.getElementById("Tn_room_no");
// const n_Department = document.getElementById("Tn_Department");




// Compute active lecture
function showteacherdata() {
  const current_div = document.getElementById("current_div");
  const next_div = document.getElementById("next_div");
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const dayName = now.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });

  // Weekend Check
  if (dayName === "Sunday" || dayName === "Saturday") {
    const message = `<div class="bold-text">No Class Today</div>`;
    if (current_div) current_div.innerHTML = message;
    if (next_div) next_div.innerHTML = message;
    return;
  }

  // Case 1: No timetable records at all
  if (!Array.isArray(facultytimetabel) || facultytimetabel.length === 0) {
    console.log("No teacher timetable records available.");
    const message = `<div class="bold-text">No Classes Scheduled</div>`;
    if (current_div) current_div.innerHTML = message;
    if (next_div) next_div.innerHTML = message;
    return;
  }

  // 1. Check if any class is active RIGHT NOW
  const current_lec_index = facultytimetabel.findIndex((lecture) => {
    const start = toMinutes(lecture.start_time);
    const end = toMinutes(lecture.end_time);
    return currentTime >= start && currentTime < end;
  });

  // --------------------------------------------------------
  // Case 2a: An active class is currently going on
  // --------------------------------------------------------
  if (current_lec_index !== -1) {
    const lecture_now = facultytimetabel[current_lec_index];

    // Combine batch names for the active class (e.g. "CP1, CP2")
    const currentBatches = [
      ...new Set(
        facultytimetabel
          .filter((l) => l.start_time === lecture_now.start_time)
          .map((l) => l.batch),
      ),
    ].join(", ");

    // Look for a lecture that begins AFTER the active class ends
    const next_lec = facultytimetabel.findIndex((lecture) => {
      return toMinutes(lecture.start_time) >= toMinutes(lecture_now.end_time);
    });

    const next_class = next_lec !== -1 ? facultytimetabel[next_lec] : null;

    // Render Current Class
    if (current_div) {
      current_div.innerHTML = `
        <div class="card-left-section" id="teacher-current-class">
          <div class="card-description" id="current-class-sub-div">
            <div class="bold-text" id="current-class-subject">${lecture_now.subject_code}</div>
            <div class="small-text" id="current-class-time">
              <span>${formatTime(lecture_now.start_time)}</span> - <span>${formatTime(lecture_now.end_time)}</span>
            </div>
          </div>
          <div class="card-description">
            <div class="bold-text">Sem ${lecture_now.sem}</div>
            <div class="small-text">${currentBatches}</div>
          </div>
          <div class="location-des">
            <span>Room ${lecture_now.room}</span> | <span>${getdep(lecture_now.room).department}</span>
          </div>
        </div>
        <div class="card-right-section">
          <img src="https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/current-class-tr.svg">
        </div>`;
    }

    // Render Next Class:
    // If the teacher has only 1 class, next_class will be null -> Shows "No More Classes Today"
    if (next_div) {
      if (next_class) {
        const nextBatches = [
          ...new Set(
            facultytimetabel
              .filter((l) => l.start_time === next_class.start_time)
              .map((l) => l.batch),
          ),
        ].join(", ");

        next_div.innerHTML = `
          <div class="card-left-section" id="teacher-next-class">
            <div class="card-description">
              <div class="bold-text">${next_class.subject_code}</div>
              <div class="small-text">${formatTime(next_class.start_time)} - ${formatTime(next_class.end_time)}</div>
            </div>
            <div class="card-description">
              <div class="bold-text">Sem ${next_class.sem}</div>
              <div class="small-text">${nextBatches}</div>
            </div>
            <div class="location-des">
              <span>Room ${next_class.room}</span> | <span>${getdep(next_class.room).department}</span>
            </div>
          </div>
          <div class="card-right-section">
            <img src="https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/next-class-tr.svg">
          </div>`;
      } else {
        // Only 1 class was scheduled, or this was the final class of the day
        next_div.innerHTML = `
          <div class="card-left-section">
            <div class="bold-text">No More Classes Today</div>
          </div>
          <div class="card-right-section">
            <img src="https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/next-class-tr.svg">
          </div>`;
      }
    }
  } 
  // --------------------------------------------------------
  // Case 2b: No active lecture right now
  // --------------------------------------------------------
  else {
    const start_lunch = toMinutes("12:30");
    const end_lunch = toMinutes("13:00");
    const islunchbreak = currentTime >= start_lunch && currentTime <= end_lunch;

    // Current Class Container
    if (current_div) {
      if (islunchbreak) {
        current_div.innerHTML = `<div class="map-lunchbreak">Its Lunch Time 🍛</div>`;
      } else {
        current_div.innerHTML = `
          <div class="card-left-section">
            <div class="bold-text">No Class Right Now</div>
          </div>
          <div class="card-right-section">
            <img src="https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/current-class-tr.svg">
          </div>`;
      }
    }

    // Look for the first upcoming class starting after currentTime
    const next_lec = facultytimetabel.findIndex((lecture) => {
      return toMinutes(lecture.start_time) > currentTime;
    });

    const next_class = next_lec !== -1 ? facultytimetabel[next_lec] : null;

   
    // Shows that upcoming class!
    // If after the teacher's single class has finished -> Shows "No More Classes Today"
    if (next_div) {
      if (next_class) {
        const nextBatches = [
          ...new Set(
            facultytimetabel
              .filter((l) => l.start_time === next_class.start_time)
              .map((l) => l.batch),
          ),
        ].join(", ");

        next_div.innerHTML = `
          <div class="card-left-section" id="teacher-next-class">
            <div class="card-description">
              <div class="bold-text">${next_class.subject_code}</div>
              <div class="small-text">${formatTime(next_class.start_time)} - ${formatTime(next_class.end_time)}</div>
            </div>
            <div class="card-description">
              <div class="bold-text">Sem ${next_class.sem}</div>
              <div class="small-text">${nextBatches}</div>
            </div>
            <div class="location-des">
              <span>Room ${next_class.room}</span> | <span>${getdep(next_class.room).department}</span>
            </div>
          </div>
          <div class="card-right-section">
            <img src="https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/next-class-tr.svg">
          </div>`;
      } else {
        next_div.innerHTML = `
          <div class="card-left-section">
            <div class="bold-text">No More Classes Today</div>
          </div>
          <div class="card-right-section">
            <img src="https://pub-65a41022099b4c7d9a5694377a7e4ac5.r2.dev/svgs/next-class-tr.svg">
          </div>`;
      }
    }
  }
}
// Teacher page bootstrap
if (window.location.pathname.includes("teacher-index.html")) {
  teachername();
  teachertimetabel();
}