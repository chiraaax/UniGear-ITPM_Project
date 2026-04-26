# 🎓 UniGear – University Life Support System

UniGear is a full-stack web application designed to support university students by providing a platform for renting resources, managing tasks, handling transactions, and interacting with peers.

# 📌 Project Overview

UniGear helps students:

Rent and share resources (e.g., electronics, sports gear)
Manage personal and shared tasks
Perform secure transactions
Track activities through dashboards

This system improves resource utilization, collaboration, and student convenience within a university environment.

# 🚀 Features

🔹 Rental Module
Add, edit, delete rental items
Upload item images (AWS S3 integration)
Browse and filter available items
Book items with date validation
Prevent overlapping bookings
Return rented items
View My Rentals and My Bookings dashboard

🔹 Task Management
Create and manage tasks
Track progress

🔹 Transactions
Track rental and task-related transactions
Status updates and completion tracking

🔹 User Management
Authentication (login/register)
Trust score system
Loyalty points system

🔹 Feedback & Ratings
Users can rate and provide feedback

# 🛠️ Tech Stack

## Frontend
React.js
CSS
Playwright (Testing)

## Backend
Node.js
Express.js

## Database
MongoDB (Mongoose)

## Other Tools
AWS S3 (image upload)
Git & GitHub (version control)

## Run the application

### Start backend
cd server
npm start

### Start frontend
cd client
npm start