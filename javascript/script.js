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
        pageID === "setting-page"
    ) {
        showPage(pageId);
    } else {
        showPage("home-page");
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

