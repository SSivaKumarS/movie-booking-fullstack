# Xavier - Full Stack Movie Ticket Booking Web Application

Xavier is a full-stack movie ticket booking web application built using the MERN stack (MongoDB, Express.js, React.js, and Node.js).

The application provides a complete movie booking experience where users can browse movies, explore theatres, view available shows, book tickets, make online payments, and manage their booking history.

The project also includes role-based access for administrators, theatre administrators, and regular users.

## Features

- Browse movies with posters, descriptions, and details
- Filter cinemas based on city
- View available movie shows and timings
- Book movie tickets
- Razorpay payment integration
- Booking history for users
- Role-based access control
- Admin movie management
- Theatre admin show management
- Cloudinary integration for media storage
- MongoDB Atlas support
- Responsive user interface
- Progressive Web App (PWA) support
- RESTful API architecture

## User Roles

### Admin

The Admin has global access to manage movie information.

- Add movies
- Update movie details
- Delete movies
- Manage movie listings

### Theatre Admin

The Theatre Admin manages a specific theatre and its shows.

- Manage theatre information
- Add movie shows
- Update show timings
- Manage theatre-specific content

### User

Users can browse and book movies.

- Browse movies
- Explore theatres
- View show timings
- Select available shows
- Book tickets
- Make online payments
- View booking history

## Tech Stack

### Frontend

- React.js
- Vite
- JavaScript ES6+
- CSS
- Progressive Web App (PWA)
- Service Workers
- Web App Manifest

### Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication
- Role-based authorization

### Database

- MongoDB
- MongoDB Atlas

### Payment Gateway

- Razorpay

### Media Storage

- Cloudinary

### Email

- Gmail SMTP

## Project Architecture

```text
cineplus/
│


## Environment Variables

Environment variables are required to run the backend.

Create a `.env` file inside the `backend` directory.

```env
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development
JWT_SECRET=your_jwt_secret
PORT=5000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
EMAIL_FROM="CinePlus Admin <your_email>"
```

If the frontend requires the Razorpay public key, create a `.env` file inside the `frontend` directory:

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Do not commit `.env` files to GitHub.

Add the following to `.gitignore`:

```gitignore
.env
.env.local
.env.development
.env.production
node_modules/
```

## Installation

### 1. Clone the Repository

```bash
git clone 
cd Xavier
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Backend Environment Variables

Create:

```text
backend/.env
```

Add the required MongoDB, JWT, Cloudinary, Razorpay, and email configuration.

### 4. Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

Create the frontend environment file if required:

```text
client/.env
```

Add the Razorpay public key.

## Running the Application

### Start Backend

```bash
cd server
npm run dev
```

The server server runs on:

```text
http://localhost:5000
```

### Start Frontend

```bash
cd client
npm run dev
```

The frontend development server runs on:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

## Database

CinePlus uses MongoDB as its database.

For local development, MongoDB can be configured using:

```text
mongodb://127.0.0.1:27017/xaviercinema
```

For production, MongoDB Atlas can be used by replacing the local connection string with a secure MongoDB Atlas connection URI.

## Payment Integration

CinePlus integrates Razorpay for online ticket payments.

The application uses:

- Razorpay Key ID
- Razorpay Key Secret
- Server-side payment processing
- Payment verification

For development and testing, Razorpay test credentials should be used.

Never expose the Razorpay secret key in frontend code or commit it to GitHub.

## Email Integration

The backend supports email functionality using Gmail SMTP.

Required environment variables:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
EMAIL_FROM="CinePlus Admin <your_email>"
```

For Gmail, an App Password should be used instead of the normal Gmail account password when SMTP authentication requires it.

## Progressive Web App

Xavier supports Progressive Web App functionality.

The PWA implementation provides:

- Installable web application
- Web app manifest
- Service worker support
- Mobile-friendly experience
- App-like user experience

## Screenshots

### Home Page

### Movie Details

### Booking Page

### Ticket


### Booking History

## Security

The application uses environment variables for sensitive configuration.

Sensitive information such as the following should never be committed to the repository:

- MongoDB credentials
- JWT secrets
- Razorpay secret keys
- Cloudinary API secrets
- Email passwords
- Other private API credentials

If credentials are accidentally pushed to GitHub, they should be revoked or rotated immediately.

## Future Improvements

- Advanced seat selection
- Movie ratings and reviews
- Notifications and reminders
- Improved authentication and authorization
- Booking cancellation and refund functionality
- Theatre seat management
- Advanced admin analytics
- Movie search and filtering
- Improved PWA offline capabilities

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature-name
```

3. Make your changes.
4. Commit your changes.

```bash
git commit -m "Add feature"
```

5. Push the branch.

```bash
git push origin feature-name
```

6. Create a Pull Request.

## Project Status

Xavier is an active full-stack MERN project designed to demonstrate real-world movie ticket booking functionality, REST API development, database integration, authentication, role-based authorization, payment processing, email integration, cloud media storage, and PWA development.
