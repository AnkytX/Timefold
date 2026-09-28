const express = require("express");
const sql = require("mssql");
const session = require("express-session");
require("dotenv").config();

const app = express();
const port = 3000;




app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "college-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // false because you are on http://localhost:3000
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (persists across reloads)
      sameSite: "lax",
    },
  }),
);
// TEST LOGOUT

app.use(express.static("public"))

// SQL Server configuration
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  database_2: process.env.DB_DATABSE_2,

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Connect to SQL Server
async function connectDatabase() {
  try {
    await sql.connect(dbConfig);
    console.log("Connected to SQL Server");
    console.log("Database:", process.env.DB_DATABASE);
  } catch (error) {
    console.error(" SQL Server connection failed:");
    console.error(error.message);
  }
}

connectDatabase();

// Agar user logged in nahi hai to login.html pe bhejo
app.get("/", (req, res) => {
  if (req.session.enroll_no) {
    return res.redirect("./index.html");
  }
  return res.redirect("/login.html");
});
;
// LOGIN
app.post("/login", async (req, res) => {
  const { enroll, password, batch } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("Enroll_no", sql.VarChar(12), enroll)
      .input("passwd", sql.VarChar(8), password)
      .input("batch", sql.VarChar(5), batch).query(`
                SELECT Enroll_no, name, batch
                FROM dbo.login
                WHERE Enroll_no = @Enroll_no
                AND passwd = @passwd
                AND batch = @batch
            `);

    if (result.recordset.length > 0) {
      const student = result.recordset[0];
      req.session.enroll_no = student.Enroll_no; // for login redirect loop

      console.log("LOGIN SESSION:", req.session.enroll_no);
      // Ensure session is saved before sending the response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Session failed" });
        }

        res.json({
          success: true,
          message: "Login successful",
          student: {
            enroll: student.Enroll_no,
            name: student.name,
            batch: student.batch,
          },
        });
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid enrollment number, password, or batch",
      });
    }
  } catch (error) {
    console.error(" Login query error:", error);

    res.status(500).json({
      success: false,
      message: "Please enter valid credentials",
    });
  }
});

//REGISTRATION

app.post("/register", async (req, res) => {
  // RECEIVE data from frontend ok
  const { name, enroll, password, batch } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // CHECK ALREADY REGISTER  OR NOT
    const checkUser = await pool
      .request()
      .input("Enroll_no", sql.VarChar(12), enroll).query(`
                SELECT Enroll_no FROM dbo.login
                WHERE Enroll_no = @Enroll_no
            `);

    if (checkUser.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already registered",
      });
    }

    // INSERT data into database
    await pool
      .request()

      .input("name", sql.VarChar(20), name)
      .input("Enroll_no", sql.VarChar(12), enroll)
      .input("passwd", sql.VarChar(8), password)
      .input("batch", sql.VarChar(5), batch).query(`
                INSERT INTO dbo.login
                (
                    name,
                    Enroll_no,
                    passwd,
                    batch
                )
                VALUES
                (
                    @name,
                    @Enroll_no,
                    @passwd,
                    @batch
                )
            `);

    // SEND response back to frontend
    res.json({
      success: true,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

app.get("/fetch", async (req, res) => {
  try {
    const enroll_no = req.session.enroll_no;

    if (!enroll_no) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    // Get current day
    // Get current day in India
    const actualDay = new Date()
      .toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "Asia/Kolkata",
      })
      .toLowerCase();

    let currentDay;

    const dayName = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    currentDay = dayName;

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("Enroll_no", sql.VarChar(12), enroll_no)
      .input("currentDay", sql.VarChar(15), currentDay).query(`
                SELECT
                    l.enroll_no,
                    l.name,
                    l.batch,
                    t.day,
                    CONVERT(VARCHAR(5), t.start_time, 108)
                    AS start_time,
                    CONVERT(VARCHAR(5), t.end_time, 108)
                    AS end_time,
                    s.subject_code,
                    s.subject_name,
                    f.faculty_code,
                    t.room,
                    t.type
                FROM dbo.login l

                JOIN dbo.timetable_batch tb
                    ON l.batch = tb.batch

                JOIN dbo.timetable t
                    ON tb.timetable_id = t.timetable_id

                JOIN dbo.subject s
                    ON t.subject_id = s.subject_id

                JOIN dbo.faculty f
                    ON t.faculty_id = f.faculty_id

                WHERE l.enroll_no = @Enroll_no

                 AND LOWER(t.day) = @currentDay

                  AND t.sem = CASE
                      WHEN LEFT(l.enroll_no, 2) = '25' THEN 3
                      WHEN LEFT(l.enroll_no, 2) = '26' THEN 1
                  END

                ORDER BY t.start_time;
            `);

    console.log("FETCHED DAY:", currentDay);
    console.log("NUMBER OF CLASSES:", result.recordset.length);

    res.json({
      success: true,
      day: currentDay,
      actualDay: actualDay,
      count: result.recordset.length,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
    });
  }
});

app.get("/fetch-schedule", async (req, res) => {
  try {
    const enroll_no = req.session.enroll_no;
    if (!enroll_no) {
      return res
        .status(401)
        .json({ success: false, message: "Please login first" });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("Enroll_no", sql.VarChar(12), enroll_no).query(`
        SELECT
            l.enroll_no,
            l.name,
            l.batch,
            t.day,
            CONVERT(VARCHAR(5), t.start_time, 108) AS start_time,
            CONVERT(VARCHAR(5), t.end_time, 108) AS end_time,
            s.subject_code,
            s.subject_name,
            f.faculty_code,
            t.room,
            t.type
        FROM dbo.login l
        JOIN dbo.timetable_batch tb ON l.batch = tb.batch
        JOIN dbo.timetable t ON tb.timetable_id = t.timetable_id
        JOIN dbo.subject s ON t.subject_id = s.subject_id
        JOIN dbo.faculty f ON t.faculty_id = f.faculty_id
        WHERE l.enroll_no = @Enroll_no
          AND t.sem = CASE
              WHEN LEFT(l.enroll_no, 2) = '25' THEN 3
              WHEN LEFT(l.enroll_no, 2) = '26' THEN 1
          END
        ORDER BY 
            CASE LOWER(t.day)
                WHEN 'monday'    THEN 1
                WHEN 'tuesday'   THEN 2
                WHEN 'wednesday' THEN 3
                WHEN 'thursday'  THEN 4
                WHEN 'friday'    THEN 5
                WHEN 'saturday'  THEN 6
                WHEN 'sunday'    THEN 7
                ELSE 8
            END,
            t.start_time;
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Fetch schedule error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch full schedule" });
  }
});
// logout things

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error while logging out:", err);

      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      success: true,
      message: "Logout successful",
    });
  });
});

app.get("/logout", (req, res) => {
    console.log("🔥 LOGOUT ROUTE HIT");

    res.json({
        success: true,
        message: "Logout route is working"
    });
});

// START SERVER
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
