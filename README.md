XavierCinema — Full-Stack Movie Booking & Cinema Management Platform

XavierCinema is a full-stack MERN movie booking and cinema management platform designed for modern multiplex operations. It combines a customer-facing movie booking application with a secure administrative management system for movies, theaters, screens, shows, bookings, users, snacks, analytics, and cinema operations.

The platform is designed with a focus on secure backend authorization, reliable booking workflows, interactive seat selection, QR-based ticket verification, and operational analytics.

Features
Customer Experience
Browse currently showing and upcoming movies
Search and discover movies
View detailed movie information
View movie ratings and reviews
Browse available theaters
View available showtimes
Select seats using an interactive auditorium layout
View seat availability and pricing
Book multiple seats
Add snacks and refreshments to a booking
View booking confirmation
Generate digital movie tickets
Generate QR-based tickets
View booking history
View individual booking details
Cancel eligible bookings
Manage a personal movie watchlist
Submit movie reviews
Access cinema location and navigation
Movie Discovery

XavierCinema provides a centralized movie discovery experience.

Customers can:

Browse movies
Search by movie title
Filter movies
View genres
View movie descriptions
View duration and release information
View available theaters
View available showtimes
Navigate directly from a movie to the booking process
Interactive Seat Booking

The booking system provides an interactive seat selection experience for each auditorium.

Seat Selection
Display auditorium seat layouts
Display available seats
Display selected seats
Display booked seats
Prevent selection of unavailable seats
Select multiple seats
Support different seat categories
Display ticket pricing
Calculate the total booking amount
Associate seats with a specific show
Seat Availability

Seat availability is validated by the backend before a booking is created.

This prevents users from successfully booking seats that have already been reserved.

Movie
  |
  v
Theater
  |
  v
Show
  |
  v
Seat Selection
  |
  v
Availability Validation
  |
  v
Booking
Group Seat Booking

XavierCinema can support group-oriented seat booking where users can select multiple seats for the same show.

The system can provide:

Multiple seat selection
Adjacent seat selection
Seat availability validation
Booking reference generation
Digital ticket generation
Digital Ticketing

After a successful booking, XavierCinema generates a digital ticket containing the relevant booking information.

A ticket can include:

Booking reference
Movie name
Theater
Screen
Show date
Show time
Selected seats
Ticket quantity
Booking status
QR code
QR Ticket Verification

XavierCinema includes a ticket verification workflow for authorized cinema staff.

Staff can verify tickets using:

QR code scanning
Booking reference lookup
Ticket validation
Booking status verification

The backend validates the ticket before allowing it to be accepted.

Customer
   |
   v
Digital Ticket
   |
   v
QR Code
   |
   v
Ticket Scanner
   |
   v
Backend Validation
   |
   +---- Valid
   |
   +---- Invalid

The system can also prevent an already-used ticket from being accepted again.

Snacks and Refreshments

Customers can add available snacks and refreshments to their movie booking.

Features include:

Browse snacks
View prices
Select quantities
Add items to booking
Calculate combined ticket and snack totals

Administrators can manage the available snack catalog.

Watchlist

Customers can save movies for later.

Watchlist functionality includes:

Add movies
Remove movies
View saved movies
Open movie details
Book tickets directly when shows are available
Reviews and Ratings

Customers can submit movie reviews and ratings.

The review system supports:

Star ratings
Written reviews
User association
Review timestamps
Verified booking-based reviews

Verified reviews can be associated with users who have completed an eligible booking.

Loyalty System
CineClub Loyalty Wallet

XavierCinema can provide a loyalty wallet that rewards customers for eligible purchases.

Example reward configuration:

₹100 spent = 10 CinePoints

Customers can:

Earn loyalty points
View their current balance
View loyalty history
Redeem eligible rewards
Use rewards for future purchases

The loyalty rules can be configured according to the business requirements.

Digital Gift Cards

XavierCinema can support digital movie gift cards.

Features include:

Custom gift card values
Personalized messages
Unique voucher codes
Gift card redemption
Gift card balance tracking
Gift card status management
Admin Management System

XavierCinema provides a dedicated administration area for managing cinema operations.

The admin dashboard can provide access to:

Movies
Theaters
Screens
Shows
Bookings
Users
Snacks
Analytics
Reports
Ticket verification
Cinema operations
Movie Management

Administrators can:

Add movies
Update movies
Delete movies
Manage movie information
Manage genres
Manage duration
Manage release information
Manage movie posters and images
Control movie availability
Theater Management

Administrators can manage cinema locations and screens.

Features include:

Add theaters
Update theaters
Remove theaters
Manage screens
Configure auditorium capacity
Configure seat layouts
Configure seat categories
Manage cinema locations
Show Management

Administrators can create and manage movie schedules.

Features include:

Create shows
Assign movies to theaters
Assign movies to screens
Configure show dates
Configure show times
Configure ticket prices
Update shows
Remove shows
Control show availability

Example:

Movie
  |
  v
Theater
  |
  v
Screen
  |
  v
Show
  |
  v
Seats
Booking Management

Administrators can monitor and manage customer bookings.

Features include:

View bookings
Search bookings
Filter bookings
View booking details
Check booking status
Verify tickets
Monitor booking activity
Monitor booking revenue
User Management

Administrators can manage platform users and monitor account activity.

The system can distinguish between:

Customer
Admin

Administrative permissions are controlled by the backend.

Analytics Dashboard

XavierCinema provides an analytics dashboard for monitoring cinema performance.

Key Metrics
Total movies
Total shows
Total users
Total bookings
Total revenue
Movie performance
Theater performance
Show occupancy
Booking trends
Popular movies
Revenue trends
Date Filters

Analytics can support:

Today
This Week
This Month
All Time
Custom Date Range
Revenue Analytics

Administrators can analyze:

Ticket revenue
Snack revenue
Total booking revenue
Movie-wise revenue
Theater-wise revenue
Date-wise revenue
Reports

XavierCinema can generate business reports for administrative analysis.

Supported formats can include:

PDF
CSV

Reports can contain:

Revenue statistics
Booking statistics
Movie performance
Theater performance
Show performance
Date-based analytics
Smart Cinema IoT Console

XavierCinema includes a simulated IoT operations console for demonstrating how cinema infrastructure can integrate with a centralized management platform.

The IoT functionality is designed as a software simulation and can be extended to work with physical hardware.

Smart Entrance Gate

The platform can simulate QR-based cinema entrance gates.

Example gates:

Auditorium 01
Auditorium 02 IMAX
VIP Lounge

A valid ticket scan can trigger a simulated gate relay.

QR Ticket
   |
   v
Ticket Validation
   |
   v
Access Granted
   |
   v
Gate Relay Trigger
ANPR Parking Automation

XavierCinema can simulate automatic number plate recognition for cinema parking.

The workflow can be represented as:

Vehicle
   |
   v
License Plate Detection
   |
   v
Parking Pass Validation
   |
   v
Access Granted / Denied

This demonstrates how parking infrastructure can be integrated with the cinema management system.

Seat Occupancy Monitoring

The IoT console can simulate auditorium seat occupancy sensors.

The system can compare booking information with simulated occupancy data.

For example:

Booked Seat
     +
Occupied Seat
     |
     v
Expected Occupancy

If a seat is occupied without an associated booking, the system can generate an operational alert.

UNBOOKED SEAT OCCUPANCY DETECTED

This feature demonstrates how sensor-based monitoring could be integrated into a cinema environment.

Smart Lighting and HVAC

The IoT console can simulate auditorium environment controls.

Supported simulations can include:

Auditorium lighting
Air conditioning
Temperature
Showtime status
Auditorium environment state

Example:

Intermission
     |
     v
100% Lighting
     |
     v
Showtime
     |
     v
15% Lighting
Authentication and Authorization

Security is a core part of XavierCinema.

The application uses authentication and backend authorization to protect customer and administrative resources.

Authentication

JWT-based authentication can be used for:

User registration
User login
Password verification
Token generation
Protected API access
Authentication validation

Passwords are hashed using bcrypt before being stored.

Role-Based Access Control

XavierCinema separates customer and administrator permissions.

Customer

Customers can access:

Movie browsing
Movie details
Showtimes
Seat booking
Bookings
Watchlist
Reviews
Loyalty features
Administrator

Administrators can access:

Movie management
Theater management
Screen management
Show management
Booking management
User management
Analytics
Reports
Ticket verification
IoT operations
Backend Authorization

Administrative authorization is enforced on the backend.

Frontend route protection alone is not considered sufficient security.

Every protected administrative API verifies the authenticated user's authorization before performing sensitive operations.

Unauthorized requests should return:

401 Unauthorized

when authentication is missing or invalid.

403 Forbidden

when a valid authenticated user does not have sufficient permissions.

Client-side requests cannot be trusted to change their own role or authorization privileges.

REST API

XavierCinema follows a RESTful backend architecture.

Example API groups:

/api/auth
/api/users
/api/movies
/api/theaters
/api/screens
/api/shows
/api/seats
/api/bookings
/api/reviews
/api/snacks
/api/watchlist
/api/loyalty
/api/gift-cards
/api/admin
/api/analytics
/api/iot
Technology Stack
Frontend
React.js
React Router
Tailwind CSS
Axios
JavaScript
QRCode
jsPDF
AutoTable
Backend
Node.js
Express.js
RESTful APIs
JWT
bcrypt
Middleware
Role-Based Access Control
Database
MongoDB
Mongoose
Architecture
React.js Frontend
        |
        | REST API
        v
Express.js Backend
        |
        +---- Authentication
        |
        +---- Authorization
        |
        +---- Business Logic
        |
        +---- Booking System
        |
        +---- Analytics
        |
        +---- IoT Services
        |
        v
MongoDB
Booking Workflow

The complete customer booking process follows this flow:

Browse Movies
      |
      v
Select Movie
      |
      v
Select Theater
      |
      v
Select Show
      |
      v
Select Seats
      |
      v
Add Snacks
      |
      v
Review Booking
      |
      v
Confirm Booking
      |
      v
Generate Ticket
      |
      v
QR Ticket
Admin Workflow
Admin Login
     |
     v
Authentication
     |
     v
Backend Role Verification
     |
     v
Admin Dashboard
     |
     +---- Movies
     |
     +---- Theaters
     |
     +---- Screens
     |
     +---- Shows
     |
     +---- Bookings
     |
     +---- Users
     |
     +---- Analytics
     |
     +---- Reports
     |
     +---- IoT Console
Installation
Prerequisites

Before running XavierCinema, install:

Node.js
npm
MongoDB or MongoDB Atlas
Git
Clone the Repository
git clone <your-repository-url>


cd xavier-cinema
Backend Setup
cd server
npm install

Create a .env file inside the server directory:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret

Start the backend:

npm run dev

The backend will run on:

http://localhost:5000
Frontend Setup

Open another terminal:

cd client
npm install

Create a .env file inside the client directory:

VITE_API_URL=http://localhost:5000/api

Start the frontend:

npm run dev
Environment Variables
Backend
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
Frontend
VITE_API_URL=http://localhost:5000/api

Additional environment variables may be required depending on the external services and integrations enabled in the application.

Production Security

Before deploying XavierCinema to production, the application should use:

HTTPS
Secure environment variables
Strong JWT secrets
Secure CORS configuration
Input validation
Rate limiting
Secure HTTP headers
Proper authentication middleware
Backend role-based authorization
Database indexes
Centralized error handling
Structured application logging
Secure cookie configuration where applicable
Production MongoDB configuration

Sensitive credentials and environment files should never be committed to the repository.

Future Enhancements

Potential future improvements include:

Online payment integration
Redis-based seat locking
WebSocket-based real-time seat availability
Email booking confirmations
SMS notifications
Cloudinary image management
Advanced movie recommendation system
Coupon and promotional system
Dynamic ticket pricing
Multi-city cinema management
Docker deployment
Automated unit testing
Integration testing
End-to-end testing
CI/CD pipeline
Application monitoring
Centralized logging
Real hardware integration for IoT functionality
Project Objective

XavierCinema demonstrates the development of a production-oriented full-stack cinema platform using the MERN stack.

The project brings together:

React application development
REST API development
MongoDB data modeling
Mongoose
JWT authentication
Backend authorization
Role-Based Access Control
Movie management
Theater management
Show scheduling
Interactive seat booking
Booking management
QR ticket generation
Ticket verification
Reviews and ratings
Loyalty functionality
Gift cards
Administrative analytics
Business reporting
Cinema IoT simulation

The primary objective is to demonstrate how a real-world movie booking platform can be designed with a secure frontend, protected backend APIs, structured business logic, and administrative operations.

License