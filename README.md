# Personal Portfolio Website

A dynamic, responsive personal portfolio website with an admin panel for content management. Built with HTML, CSS, JavaScript, and Firebase.

## Features

- 🎨 Modern and responsive design
- 📱 Mobile-friendly navigation
- 🔒 Secure admin panel with authentication
- 📝 Dynamic content management
- 🖼️ Image upload support
- 📊 CRUD operations for all sections
- 🌓 Sections include:
  - About
  - Experience
  - Projects
  - Contact
  - Blog

## Setup Instructions

1. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Cloud Firestore
   - Enable Storage
   - Copy your Firebase configuration from Project Settings
   - Replace the configuration in `js/firebase-config.js`

2. **Admin Account Setup**
   - Go to Firebase Authentication
   - Add a new user with email and password
   - This will be your admin credentials

3. **Local Development**
   - Clone this repository
   - Open `index.html` in your browser
   - For the admin panel, navigate to `admin.html`

4. **Deployment**
   - Deploy to your preferred hosting service
   - Configure Firebase security rules for production

## File Structure

```
├── index.html              # Main portfolio page
├── admin.html             # Admin panel interface
├── css/
│   ├── style.css         # Main styles
│   └── admin.css         # Admin panel styles
├── js/
│   ├── main.js           # Main JavaScript
│   ├── admin.js          # Admin panel functionality
│   └── firebase-config.js # Firebase configuration
└── README.md
```

## Firebase Collections Structure

```
firestore/
├── content/
│   ├── about
│   └── experience
├── projects/
│   └── [project_documents]
├── blog/
│   └── [blog_documents]
└── messages/
    └── [contact_messages]
```

## Usage

### Public Portfolio

- Visit the main page to view the portfolio
- Navigate through different sections
- Use the contact form to send messages

### Admin Panel

1. Access the admin panel at `/admin.html`
2. Log in with your admin credentials
3. Manage content for all sections:
   - Update about information
   - Add/edit/delete experiences
   - Manage projects
   - Create blog posts
   - View contact messages

## Customization

### Styling
- Edit `css/style.css` to customize the main portfolio appearance
- Edit `css/admin.css` to customize the admin panel

### Content Sections
- Modify HTML files to add or remove sections
- Update corresponding JavaScript files for new functionality

## Security

- Firebase security rules are essential for production
- Implement the following rules for Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access for content
    match /content/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Public read access for projects and blog
    match /projects/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /blog/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Only authenticated users can read messages
    match /messages/{document} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update, delete: if request.auth != null;
    }
  }
}
```

## Contributing

Feel free to fork this repository and customize it for your needs. If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Manish Sharma

---

Designed, developed and maintained by Manish Sharma 