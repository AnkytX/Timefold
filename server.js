const express = require("express");
const sql = require("mssql");
const session = require("express-session");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, //process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  }),
);
// TEST LOGOUT

app.use(express.static("public"));

// SQL Server configuration
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
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
    return res.redirect("/index.html");
  }
  return res.redirect("/login.html");
});

// LOGIN student
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
      req.session.student_name = student.name;
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

// teacher login
app.post("/teacherlogin", async (req, res) => {
  try {
    const { faculty_login_id, faculty_login_password } = req.body;

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("faculty_login_id", sql.VarChar, faculty_login_id)
      .input("faculty_login_password", sql.VarChar, faculty_login_password)
      .query(`
                SELECT *
                FROM faculty
                WHERE faculty_login_id = @faculty_login_id
                AND password_hash = @faculty_login_password
            `);

    // Login failed
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid login ID or password",
      });
    }

    // Login successful
    const faculty = result.recordset[0];
    req.session.faculty_login_id = faculty.faculty_login_id;
    req.session.faculty_name = faculty.faculty_code;
    req.session.faculty_id = faculty.faculty_id;

    console.log("TEACHER LOGIN SESSION:", req.session);

    req.session.save((err) => {
      if (err) {
        console.error("Teacher session save error:", err);

        return res.status(500).json({
          success: false,
          message: "Session failed",
        });
      }

      return res.json({
        success: true,
        message: "Teacher login successful",
       faculty_name: req.session.faculty_name,
      });
    });
  } catch (error) {
    console.error("Teacher login error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});
// fetchteacheer  data
app.get("/teacherinfo", (req, res) => {
  if (!req.session.faculty_login_id) {
    return res.status(401).json({
      success: false,
      message: "Not logged in",
    });
  }

  return res.json({
    success: true,
    id: req.session.faculty_id,
    faculty_name: req.session.faculty_name,
    faculty_code: req.session.faculty_name,
  });
}); 

// fetch name and show
app.get("/student-info", (req, res) => {
  if (!req.session.enroll_no) {
    return res.status(401).json({
      success: false,
      message: "Please login first",
    });
  }

  res.json({
    success: true,
    student: {
      enroll: req.session.enroll_no,
      name: req.session.student_name,
    },
  });
});

//teacher  time table
app.get("/teachertimetabel", async (req, res) => {
  try {
    if (!req.session.faculty_login_id) {
      return res.status(401).json({
        success: false,
        message: "please login",
      });
    }
    const Day = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const faculty_login_id = req.session.faculty_login_id;
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("faculty_login_id", sql.VarChar, faculty_login_id)
      .input("Day" ,sql.VarChar,Day).query(`
         SELECT
    t.day,
    CONVERT(VARCHAR(5), t.start_time, 108) AS start_time,
    CONVERT(VARCHAR(5), t.end_time, 108) AS end_time,
    t.sem,
    s.subject_code,
    tb.batch,
    t.room,
    t.type
FROM timetable t
INNER JOIN faculty f
    ON t.faculty_id = f.faculty_id
LEFT JOIN subject s
    ON t.subject_id = s.subject_id
LEFT JOIN timetable_batch tb
    ON t.timetable_id = tb.timetable_id
WHERE f.faculty_login_id = @faculty_login_id
AND t.day = LOWER(@Day)
ORDER BY t.start_time;
        `);
res.json({
  success:true,
  timetabel: result.recordset
});

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server error",
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

    currentDay = actualDay;

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("Enroll_no", sql.VarChar(12), enroll_no)
      .input("currentDay", sql.VarChar(15), actualDay).query(`
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

                 AND LOWER(t.day) = LOWER(@currentDay)

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
// student fetch shedule
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

// ========================================================
// PASSWORD UPDATE (Supports both Teacher & Student sessions)
// ========================================================
app.post("/password", async (req, res) => {
  try {
    const enroll_no = req.session.enroll_no;

    if (!enroll_no) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in first.",
      });
    }

    const { password } = req.body;

    if (!password || password.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Password cannot be empty.",
      });
    }

    const pool = await sql.connect(dbConfig);

    // Teacher password change
    // const result = await pool
    //   .request()
    //   .input("password_hash", sql.VarChar(50), password.trim())
    //   .input("faculty_id", sql.Int, faculty_id)
    //   .query(`
    //     UPDATE dbo.faculty
    //     SET password_hash = @password_hash
    //     WHERE faculty_id = @faculty_id
    //   `);

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty record not found." });
    }

    // Student password change
    if (password.length > 8) {
      return res.status(400).json({
        success: false,
        message: "Password cannot exceed 8 characters.",
      });
    }

    const result = await pool
      .request()
      .input("passwd", sql.VarChar(8), password.trim())
      .input("Enroll_no", sql.VarChar(12), enroll_no).query(`
          UPDATE dbo.login
          SET passwd = @passwd
          WHERE Enroll_no = @Enroll_no
        `);

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Student record not found." });
    }

    res.json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password. Please try again.",
    });
  }
});
// mname update
app.post("/name", async (req, res) => {
  try {
    const enroll_no = req.session.enroll_no;

    if (!enroll_no) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in first.",
      });
    }

    const { Name } = req.body;

    if (!Name || Name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty.",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("name", sql.VarChar(50), Name.trim())
      .input("Enroll_no", sql.VarChar(12), enroll_no).query(`
                UPDATE dbo.login
                SET name = @name
                WHERE Enroll_no = @Enroll_no
            `);

    // Check if database update happened
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    req.session.student_name = Name.trim();

    res.json({
      success: true,
      message: "Name updated successfully",
    });
  } catch (err) {
    console.error("Name update error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update name",
    });
  }
});

app.post("/notice", async (req, res) => {
  try {
    // 1. Ensure the teacher is logged in
    const facultyId = req.session.faculty_id;
    if (!facultyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in as a teacher.",
      });
    }

    const { batch, Sem, notice } = req.body;

    // 2. Validate input
    if (!batch || !Sem || !notice || notice.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please enter batch, sem and notice text.",
      });
    }

    const pool = await sql.connect(dbConfig);

    // 3. Insert notice along with faculty_id and notice_time
    await pool
      .request()
      .input("sem", sql.Int, parseInt(Sem, 10))
      .input("batch", sql.VarChar(10), batch.trim())
      .input("notice", sql.NVarChar(sql.MAX), notice.trim())
      .input("faculty_id", sql.Int, facultyId).query(`
        INSERT INTO dbo.notice (sem, batch, notice, faculty_id, notice_time)
        VALUES (@sem, @batch, @notice, @faculty_id, SYSUTCDATETIME());
      `);

    res.json({
      success: true,
      message: "Notice saved successfully",
    });
  } catch (err) {
    console.error("Teacher notice error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send notice",
    });
  }
});

//notification fetch from database
app.get("/student/notices", async (req, res) => {
  try {
    if (!req.session.enroll_no) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const enrollNo = req.session.enroll_no;
    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("enroll_no", sql.VarChar, enrollNo).query(`
        SELECT
            l.enroll_no,
            l.batch,
            n.sem,
            n.notice,
            n.notice_time,
            nf.faculty_id,
            ISNULL(nf.faculty_code, 'Admin') AS faculty_code
        FROM login l
        JOIN notice n
            ON RTRIM(LTRIM(n.batch)) = RTRIM(LTRIM(l.batch))
            AND n.sem = CASE
                WHEN LEFT(l.enroll_no, 2) = '25' THEN 3
                WHEN LEFT(l.enroll_no, 2) = '26' THEN 1
            END
        LEFT JOIN faculty nf
            ON n.faculty_id = nf.faculty_id
        WHERE l.enroll_no = @enroll_no
        ORDER BY n.notice_id DESC;
      `);

    res.json({
      success: true,
      notices: result.recordset,
    });
  } catch (err) {
    console.error("Student notice error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notices",
    });
  }
});
// START SERVER

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
