# ⏱️ TimeFold

> A smart timetable companion designed to help students manage their daily academic schedule, lectures, classrooms, and campus information in one place.

TimeFold is a student-focused web application that simplifies the way students interact with their academic timetable.

Instead of repeatedly checking complicated timetable documents, TimeFold provides a clean and intuitive interface where students can quickly check their lectures, understand where they need to go, view important notices, and manage application preferences.

---

## ✨ Features

### 📅 Smart Timetable
- View the academic schedule in a clean and organized interface.
- Quickly switch between weekdays.
- Easily identify upcoming lectures.
- Get timely lecture reminders 10 minutes before class starts.
- Designed for quick access during college hours.

### 🧭 Campus & Classroom Information
- Helps students identify where their lectures are taking place.
- Provides a dedicated space for campus and classroom-related information.
- Designed with future navigation and map features in mind.

### 📢 Notices
- Dedicated section for important college announcements.
- Keeps academic information separate from the daily timetable.
- Designed to support future real-time notice updates.

### ⚙️ Settings
- Centralized application settings.
- Provides a foundation for future personalization and account preferences.

### 🎨 Modern Student-Friendly Interface
- Minimal and clean UI.
- Soft and consistent color palette.
- Custom illustrations and mascot.
- Smooth interface interactions.
- Focused on simplicity and readability.

### 📱 Responsive Design
TimeFold is designed to work across:

- 💻 Desktop
- 💻 Laptop
- 📱 Mobile
- 📟 Tablet

### 🖼️ Screenshots

![TimeFold Dashboard](./public/images/screenshots/dashboard.png)

---

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- Microsoft SQL Server

### Development Tools
- Visual Studio Code
- Git
- GitHub

---

## 🏗️ Application Architecture

```text
                         ┌──────────────────┐
                         │     Student      │
                         └────────┬─────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │    TimeFold Frontend    │
                     │      HTML / CSS / JS    │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │       Express.js        │
                     │         Node.js         │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   Microsoft SQL Server  │
                     │        Database         │
                     └─────────────────────────┘

```

---

## 📂 Project Structure

```text

TimeFold/
│
├── public/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   └── script.js
│   │
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── teacher-index.html
│
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── README.md

```

The project structure may evolve as new features and modules are added.

---

## 🚀 Getting Started
Follow the steps below to run TimeFold locally.

### Prerequisites
Make sure the following software is installed on your system:
- Node.js
- Git
- Microsoft SQL Server
- Visual Studio Code or another code editor

### 1. Clone the Repository

```bash
git clone https://github.com/Piyush07d/TimeFold.git
```
Navigate to the project directory:
```bash
cd TimeFold
```

### 2. Install Dependencies
Install all required Node.js packages:

```bash
npm install
```

### 3. Configure Environment Variables
Create a .env file in the root directory of the project.

```bash
PORT=3000

DB_SERVER=your-server
DB_PORT=1433
DB_DATABASE=your-database
DB_USER=your-username
DB_PASSWORD=your-password
```
Replace the values with your own database configuration.

### 4. Start the Server
Run the following command:

```bash
node server.js
```

If the server starts successfully, you should see:

```bash
Server is running on http://localhost:3000
```

Open your browser and visit:

```bash
http://localhost:3000
```

---

## 🔐 Environment Variables
TimeFold uses environment variables to keep sensitive configuration outside the source code.


| Variable      | Description                     |
| ------------- | ------------------------------- |
|  PORT         | Port used by the Node.js server |
|  DB_SERVER    | SQL Server host or IP address   |
|  DB_PORT      | SQL Server port                 |
|  DB_DATABASE  | Database name                   |
|  DB_USER      | Database username               |
|  DB_PASSWORD  | Database password               |


---

## 🔒 Security

Sensitive information should never be committed to the repository.

Make sure your .gitignore contains:

```bash

.env
node_modules/

```

If credentials are accidentally pushed to GitHub, immediately change or rotate the exposed credentials.

---

## 🎯 Project Goals

### TimeFold is designed to:

- Simplify academic timetable management.
- Help students quickly identify their upcoming lectures.
- Provide timely reminders before lectures.
- Make classroom information easier to access.
- Keep important notices in one place.
- Reduce the need to repeatedly check traditional timetables.
- Provide a clean and distraction-free student experience.
- Create a foundation for a larger student-focused campus platform.

---

## 💡 Why TimeFold?

### Traditional college timetables can be difficult to use during a busy academic day.

Students often need to repeatedly check:

- Which lecture is next?
- What time does it start?
- Which classroom should I go to?
- Is there an important notice?
- How much time is left before class?

TimeFold brings these essential pieces of information into a single, simple interface.

The goal is to make checking academic information faster, clearer, and more convenient.

---

## 📌 Project Status

### 🚧 Currently in Development

TimeFold is an actively developing project. The UI, backend, database structure, and features may continue to evolve as development progresses.

---

## 👥 Team

TimeFold was developed collaboratively by three team members, with each member responsible for a core part of the application.

| Team Member | Role | Responsibility |
|-------------|------|----------------|
| **Piyush Dubey** | Frontend Developer | UI/UX design, responsive layouts, frontend development, and user interactions |
| **Ankit Shah** | Backend Developer | Server-side development, API integration, authentication, and backend logic |
| **Satish Rout** | Database Developer | Database design, SQL queries, data management, and database integration |

### 🧩 Areas of Contribution

**Frontend**
- User interface and experience
- Responsive design
- HTML, CSS, and JavaScript
- Frontend interactions and animations

**Backend**
- Node.js and Express.js
- Server-side logic
- API development
- Authentication and application logic

**Database**
- Microsoft SQL Server
- Database architecture
- Tables and relationships
- SQL queries and data management

---

## 📄 License

### This project is currently developed for educational and project purposes.

---

## ⭐ Support

### If you find TimeFold interesting or useful, consider giving the repository a ⭐ on GitHub.

### Feedback, suggestions, and contributions are always welcome.