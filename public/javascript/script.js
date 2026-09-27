// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
//                                                       NAV BAR JAVASCRIPT
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------

function showPage(pageId) {

    document.querySelectorAll(".page-section").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(".nav-button-div").forEach(button => {
        button.classList.remove("current-page");
    });

    const pageOrder = {
        "home-page": 0,
        "map-page": 1,
        "schedule-page": 2,
        "notice-page": 3,
        "setting-page": 4
    };

    document.querySelectorAll(".nav-button-div")[pageOrder[pageId]]
        .classList.add("current-page");

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

    // Helper: decode department from room code
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

    console.log("current tokan", currenttokan);
    console.log("upcoming tokan", upcoming_class);

    // before 10:30 what to show
    if (currentHour >= 570 && currentHour < 630) {
      const first_class = timetableData[0]; // din ka pehla lecture

      // Current Card hide kar do
      if (hide_current) {
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

    if (currenttokan !== -1) {
      const current_class = timetableData[currenttokan];
      const next_tokan = currenttokan + 1;
      const next_class = timetableData[next_tokan]; // agla lecture agar exist kare

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
      if (hide_current) {
        hide_current.style.display = "";
        hide_current.innerHTML = `
          <div class="bold-text">
            Today Class Over
          </div>
        `;
      }
      if (hide_next) {
        hide_next.style.display = "";
        hide_next.innerHTML = `
          <div class="bold-text">
            Today Class Over
          </div>
        `;
      }
    }
    // 5 PM  se lekar subah 9:30 AM tak

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
});



// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------
//                                                       SCHEDULE JAVASCRIPT
// -----------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------------

// const timetable = {

//     monday: [
//         {
//             start: "10:30 AM",
//             end: "12:30 PM",
//             subject: "DS",
//             room: "4111",
//             professor: "PGV",
//             department: "Electrical Department"
//         },

//         {
//             start: "01:00 PM",
//             end: "02:00 PM",
//             subject: "DS",
//             room: "8113",
//             professor: "SDJ",
//             department: "Mining Department"
//         }, 

//         {
//             start: "02:00 AM",
//             end: "03:00 PM",
//             subject: "DBMS",
//             room: "8113",
//             professor: "RS",
//             department: "Mining Department"
//         },

//         {
//             start: "03:10 AM",
//             end: "05:10 PM",
//             subject: "DF",
//             room: "8114",
//             professor: "KMG",
//             department: "Mining Department"
//         }
//     ],


//     tuesday: [
//         {
//             start: "10:30 AM",
//             end: "12:30 PM",
//             subject: "SL",
//             room: "Library",
//             professor: "-",
//             department: "Library"
//         },

//         {
//             start: "01:00 PM",
//             end: "02:00 PM",
//             subject: "DBMS",
//             room: "8113",
//             professor: "SDJ",
//             department: "Mining Department"
//         }, 

//         {
//             start: "02:00 AM",
//             end: "03:00 PM",
//             subject: "DBMS",
//             room: "8113",
//             professor: "RS",
//             department: "Mining Department"
//         },

//         {
//             start: "03:10 AM",
//             end: "05:10 PM",
//             subject: "DF",
//             room: "8114",
//             professor: "KMG",
//             department: "Mining Department"
//         }
//     ],


//     wednesday: [
//         {
//             start: "10:30 AM",
//             end: "12:30 PM",
//             subject: "DBMS",
//             room: "4111",
//             professor: "RS",
//             department: "Computer Department"
//         }
//     ],


//     thursday: [
//         {
//             start: "09:30 AM",
//             end: "11:30 AM",
//             subject: "Java",
//             room: "4103",
//             professor: "VP",
//             department: "Computer Department"
//         },

//         {
//             start: "01:30 PM",
//             end: "02:30 PM",
//             subject: "OS",
//             room: "4102",
//             professor: "AK",
//             department: "Computer Department"
//         }
//     ],


//     friday: [
//         {
//             start: "10:30 AM",
//             end: "12:30 PM",
//             subject: "DS",
//             room: "4201",
//             professor: "PK",
//             department: "Computer Department"
//         }
//     ]

// };


// // Get all day buttons
// const dayButtons = document.querySelectorAll(
//     "#schedule-page .day"
// );


// // Get schedule list
// const scheduleList = document.querySelector(
//     "#schedule-page .schedule-list"
// );


// // Function to show schedule
// function showSchedule(day) {

//     // Remove active from all buttons
//     dayButtons.forEach(button => {
//         button.classList.remove("active");
//     });


//     // Add active to selected button
//     const selectedButton = document.querySelector(
//         `#schedule-page .day[data-day="${day}"]`
//     );

//     if (selectedButton) {
//         selectedButton.classList.add("active");
//     }


//     // Clear old schedule
//     scheduleList.innerHTML = "";


//     // Get selected day's schedule
//     const schedule = timetable[day] || [];


//     // If there are no classes
//     if (schedule.length === 0) {

//         scheduleList.innerHTML = `
//             <div class="schedule-card">

//                 <div class="subject">

//                     <strong>No classes</strong>

//                     <span>
//                         Nothing scheduled for today
//                     </span>

//                 </div>

//             </div>
//         `;

//         return;
//     }


//     // Create schedule cards
//     schedule.forEach(classInfo => {

//         const card = document.createElement("div");

//         card.className = "schedule-card";


//         card.innerHTML = `

//             <div class="time">

//                 <span>
//                     ${classInfo.start}
//                 </span>

//                 <span>
//                     ${classInfo.end}
//                 </span>

//             </div>


//             <div class="divider"></div>


//             <div class="subject">

//                 <strong>
//                     ${classInfo.subject}
//                 </strong>

//                 <span>
//                     ${classInfo.room}
//                 </span>

//             </div>


//             <div class="subject">

//                 <strong>
//                     ${classInfo.professor}
//                 </strong>

//                 <span>
//                     ${classInfo.department}
//                 </span>

//             </div>

//         `;


//         scheduleList.appendChild(card);

//     });

// }


// Add click event to every day button
dayButtons.forEach(button => {

    button.addEventListener("click", () => {

        const day = button.dataset.day;

        showSchedule(day);

    });

});


// Show Monday by default
showSchedule("monday");

