# Marvelous App

A modern educational management platform built with **ReactJS** and **Firebase**, featuring responsive design with **Tailwind CSS** and animations with **Framer Motion**. This app includes subject, student, and staff management capabilities optimized for offline functionality and seamless user experience.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JeL0998/Marvelous-App.git
   cd Marvelous-App
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   - Set up a Firebase project and enable Firestore.
   - Create a `.env.local` file in the project root and add your Firebase configuration:
     ```env
     REACT_APP_FIREBASE_API_KEY=your_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     REACT_APP_FIREBASE_APP_ID=your_app_id
     ```
   
4. **Enable Firebase Offline Persistence** (optional for offline support):
   - In the app, enable offline persistence with `firebase.firestore().enablePersistence()` in your Firebase setup file.

## Running the Application

1. **Start the development server**:
   ```bash
   npm start
   ```
   The app will open at [http://localhost:3000](http://localhost:3000).

2. **Build for production**:
   ```bash
   npm run build
   ```
   This creates an optimized build in the `build` directory.

## Features

- **Subject Management**: Filter and manage subjects by department and course.
- **Student Management**: Manage student information with search and filter options.
- **Staff Management**: Add, edit, and clear staff data.
- **Offline Support**: Syncs data with Firebase and handles network interruptions.

## Technologies Used

- **ReactJS**
- **Firebase**
- **Tailwind CSS**
- **Framer Motion**
- **SweetAlert**
