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

![TimeFold Dashboard](./public/images/screenshots/dashboard.png)

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
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

TimeFold/
│
├── public/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   └── script.js
│   │
│   └── *.html
│
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── README.md

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