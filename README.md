# 🎫 Event Registration Portal
A web-based portal for browsing and registering for events, with email verification, digital ticket generation, and an admin management panel.

## 📌 Features
- 🔐 User Registration & Login with **Email Verification** (Nodemailer)
- 📋 Browse available events
- ✅ Online event registration
- 🎟️ Digital ticket generation with **QR Codes**
- 🛡️ Role-based access (Admin & User)
- 🛠️ Admin panel for event management

## 🛠️ Tech Stack
| Layer         | Technology 

| Frontend      | HTML, CSS, JavaScript 
| Backend       | Node.js, Express.js 
| Database      | MongoDB 
| Email Service | Nodemailer 
| QR Code       | qrcode.js 

## 📁 Project Structure
miniproject/
├── admin.html        # Admin panel UI
├── admin.js          # Admin panel logic
├── server.js         # Node.js backend server
├── index.html        # Main landing page
├── style.css         # Styling
└── README.md

## 🚀 Getting Started
### Prerequisites
Make sure you have these installed:
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

### Installation
**1. Clone the repository**
```bash
git clone https://github.com/ggreeshma-lab/miniproject.git
cd miniproject
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**
Create a `.env` file in the root folder:
```
MONGO_URI=your_mongodb_connection_string
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
PORT=3000
```

**4. Run the server**
```bash
node server.js
```

**5. Open in browser**
```
http://localhost:3000
```

## 📧 Email Verification Flow
1. User registers with their email
2. Server sends a verification link via **Nodemailer**
3. User clicks the link to verify their account
4. After verification, user can log in and register for events


## 👤 Role-Based Access
| Role  | Access 

| User  | Browse events, register, view tickets 
| Admin | Add/edit/delete events, view registrations 


## 📷 Screenshots
<img width="1857" height="967" alt="image" src="https://github.com/user-attachments/assets/6db5092e-7296-4ba2-a426-7b0ce06c8ff5" />
<img width="1877" height="917" alt="image" src="https://github.com/user-attachments/assets/6501c3fe-cbfe-4b80-86aa-21e2c0e05c62" />
<img width="1881" height="917" alt="image" src="https://github.com/user-attachments/assets/fe04fdc7-5c79-4071-961e-1daf08402085" />
<img width="1880" height="916" alt="image" src="https://github.com/user-attachments/assets/71a4f269-489b-432d-a20c-68d4795aa4d4" />
<img width="1882" height="902" alt="image" src="https://github.com/user-attachments/assets/6c8ff742-7580-4341-b0c8-5a77a82d76ec" />


## 👩‍💻 Developed By
**Golconda Greeshma**
B.E. Computer Science — Neil Gogte Institute of Technology (2023–27)
GitHub: [github.com/ggreeshma-lab](https://github.com/ggreeshma-lab)

## 📄 License
This project is for educational purposes — Mini Project | NGIT | 2026
