# ComView — Code. Document. View.

A professional cloud-based IDE and document management platform.

## Features

- **Code Editor** — Monaco-powered editor with support for C, C++, Java, Python, and JavaScript
- **Code Execution** — Compile and run code with real-time output and error detection
- **Document Editor** — Rich text editor with Word-like A4 page system
- **File Management** — Upload, view, download, rename, and delete PDF, DOCX, DOC, and TXT files
- **PDF Viewer** — View all pages with zoom, scroll, and search
- **DOCX Viewer** — Render documents with original formatting, images, tables, and fonts
- **PDF/DOCX Export** — Export documents preserving formatting and layout
- **Authentication** — JWT-based auth with email/password, Google OAuth, OTP verification
- **Cloud Storage** — MongoDB-backed project and file storage

## Tech Stack

- **Frontend**: React 18, Bootstrap 5, TipTap Editor, Monaco Editor, react-pdf, docx-preview
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Multer
- **APIs**: JDoodle (code execution), Google OAuth, Nodemailer

## Getting Started

```bash
# Install dependencies
npm run build

# Start development
npm start
```

## Environment Variables

### Backend (`backend/.env`)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `EMAIL_USER` / `EMAIL_PASS` — Email credentials for OTP
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `JDOODLE_CLIENT_ID` / `JDOODLE_CLIENT_SECRET` — JDoodle API keys

### Frontend (`frontend/.env`)
- `REACT_APP_API_URL` — Backend API URL
- `REACT_APP_GOOGLE_CLIENT_ID` — Google OAuth client ID

## License

MIT
