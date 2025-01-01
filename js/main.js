import { 
    saveContactMessage, 
    loadAboutContent, 
    loadExperienceContent, 
    loadProjects, 
    loadBlogPosts,
    loadSkills,
    loadPublicProfileData 
} from './firebase-config.js';
import { getFirestore, doc, getDoc, collection, addDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
const db = getFirestore();

// Function to hide empty sections
const hideEmptySection = (sectionId) => {
    const section = document.querySelector(`section#${sectionId}`);
    if (section) {
        section.style.display = 'none';
        // Also hide the corresponding nav link
        const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
        if (navLink) {
            navLink.style.display = 'none';
        }
    }
};

// Function to show section
const showSection = (sectionId) => {
    const section = document.querySelector(`section#${sectionId}`);
    if (section) {
        section.style.display = 'block';
        // Also show the corresponding nav link
        const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
        if (navLink) {
            navLink.style.display = 'block';
        }
    }
};

// Function to initialize theme based on device preference and user choice
function initializeTheme() {
    // First check for saved user preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // User has manually set a preference
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        // Check device theme preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', initialTheme);
        updateThemeIcon(initialTheme);
    }

    // Listen for device theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only update if user hasn't set a manual preference
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(newTheme);
        }
    });
}

// Initialize theme immediately before DOM loads
initializeTheme();

// Force scroll to top on page load/refresh
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

// Loader handling
window.addEventListener('load', () => {
    // Force scroll to top
    window.scrollTo(0, 0);
    
    const loader = document.querySelector('.loader-container');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('fade-out');
            document.body.classList.remove('loading');
            setTimeout(() => {
                loader.style.display = 'none';
                // Ensure we're still at top after loader
                window.scrollTo(0, 0);
            }, 500);
        }, 1500);
    }
});

// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Update the navbar HTML structure if it doesn't exist
if (!document.querySelector('.navbar')) {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.innerHTML = `
        <button class="hamburger">
            <span></span>
            <span></span>
            <span></span>
        </button>
        <div class="navbar-logo">
            <img src="./assets/logo/logo.png" alt="Logo" class="logo-image">
        </div>
        <div class="nav-links">
            <a href="#about">About</a>
            <a href="#experience">Experience</a>
            <a href="#skills">Skills</a>
            <a href="#certifications">Certifications</a>
            <a href="#projects">Projects</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
        </div>
    `;
    document.body.insertBefore(navbar, document.body.firstChild);
}

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.classList.toggle('nav-open');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.classList.remove('nav-open');
    }
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.classList.remove('nav-open');
    });
});

// Optimized smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
            // Close mobile nav if open
            navLinks.classList.remove('active');
            
            // Get header height for offset
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = targetPosition - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Track last shown messages
let lastSuccessMessage = '';
let lastErrorMessage = '';
let lastSendingMessage = '';

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to get first name excluding titles
function getFirstName(fullName) {
    // List of common titles to exclude
    const titles = ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'madam', 'md'];
    
    // Split the name and convert to lowercase for comparison
    let nameParts = fullName.trim().split(' ');
    
    // Remove titles from the beginning
    while (nameParts.length > 0 && titles.includes(nameParts[0].toLowerCase())) {
        nameParts.shift();
    }
    
    // Return first name if exists, otherwise return full name
    return nameParts[0] || fullName;
}

// Function to get random success message
function getRandomSuccessMessage(name) {
    const messages = [
        `Hey ${name}, thanks for contacting me! I'll get in touch with you shortly...`,
        `Thanks for reaching out, ${name}! I'll respond to your message soon...`,
        `Got your message, ${name}! I'll get back to you as soon as possible...`,
        `Thanks ${name}! I appreciate you getting in touch and will respond shortly...`,
        `Message received, ${name}! Looking forward to connecting with you soon...`,
        `Perfect timing, ${name}! I'll review your message and get back to you...`,
        `Thanks for dropping a line, ${name}! I'll respond as soon as I can...`,
        `Hey ${name}! Your message is in good hands. I'll get back to you soon...`,
        `Great to hear from you, ${name}! Expect my response shortly...`,
        `Message successfully landed, ${name}! I'll be in touch soon...`,
        `Thanks for writing, ${name}! I'll make sure to respond promptly...`,
        `Hi ${name}! Your message is important to me. I'll respond soon...`,
        `Message secured, ${name}! Looking forward to our conversation...`,
        `Awesome, ${name}! I'll review your message and respond shortly...`,
        `Thanks for reaching out ${name}! I'll get back to you with lightning speed ⚡`,
        `Message received and noted, ${name}! Expect my response soon...`,
        `Hey ${name}! Your message just made my day. I'll respond shortly...`,
        `Thanks for connecting, ${name}! I'll be in touch before you know it...`
    ];
    
    // Filter out the last shown message
    const availableMessages = messages.filter(msg => msg !== lastSuccessMessage);
    // Get random message from remaining ones
    const message = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    // Update last shown message
    lastSuccessMessage = message;
    return message;
}

// Function to get random error message for rate limiting
function getRandomErrorMessage(name, timeLeft) {
    const messages = [
        `Whoa ${name}! Looks like someone's been busy - either you or someone using your IP. Take a ${timeLeft} breather...`,
        `${name}, you're quite the enthusiast! But let's wait ${timeLeft} - my inbox needs to catch its breath...`,
        `Plot twist, ${name}! Someone with your IP already sent messages. Next episode in ${timeLeft}...`,
        `${name}, you're breaking records here! But let's pause for ${timeLeft} - even superheroes need rest...`,
        `Impressive dedication, ${name}! But we've hit the limit. Grab a coffee and come back in ${timeLeft}...`,
        `${name}, either you're really eager or your IP is popular! Either way, let's reconnect in ${timeLeft}...`,
        `Hold that thought, ${name}! Your IP address has been quite chatty. Next chat window opens in ${timeLeft}...`,
        `${name}, you've unlocked the 'Super Active User' badge! Cooldown period: ${timeLeft}...`,
        `Breaking news, ${name}! Your IP hit the message limit. Next available slot: ${timeLeft}...`,
        `${name}, you're too fast for your own IP! Take a ${timeLeft} break - maybe do some yoga?`,
        `Detected: Enthusiastic messaging! ${name}, let's continue this lovely conversation in ${timeLeft}...`,
        `${name}, your IP is quite the social butterfly! Time for a quick ${timeLeft} breather...`,
        `Message limit reached! ${name}, I admire your enthusiasm, but let's wait ${timeLeft}...`,
        `${name}, you or your IP twin has been quite active! Next window of opportunity: ${timeLeft}...`,
        `Slow down, speed racer ${name}! Your IP needs a ${timeLeft} pit stop...`
    ];
    
    // Filter out the last shown message
    const availableMessages = messages.filter(msg => msg !== lastErrorMessage);
    // Get random message from remaining ones
    const message = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    // Update last shown message
    lastErrorMessage = message;
    return message;
}

// Function to get random generic error message
function getRandomGenericErrorMessage() {
    const messages = [
        "Looks like the internet is playing hide and seek! Check your connection and try again...",
        "The internet gremlins are at it again! Please check your connection...",
        "Your message got lost in the digital void. Quick connection check?",
        "Error 404: Internet not found! Time to check that connection...",
        "The digital carrier pigeons are confused. Maybe check your internet?",
        "Your bits and bytes took a wrong turn. Let's check that connection...",
        "The internet hamsters need a reboot! Please verify your connection...",
        "Your message tried to swim the internet, but got tired. Connection check?",
        "The cyber highway is experiencing traffic. Check your internet route...",
        "Your packets got lost in cyberspace! Time for a connection check...",
        "The internet tubes are clogged! Let's check that connection...",
        "Your message hit a digital pothole. Quick internet check?",
        "The web weaver is napping. Maybe check your connection?",
        "Your data took a coffee break. Time to check the internet...",
        "Message delivery service is doing jumping jacks. Connection check?"
    ];
    
    // Filter out the last shown message
    const availableMessages = messages.filter(msg => msg !== lastErrorMessage);
    // Get random message from remaining ones
    const message = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    // Update last shown message
    lastErrorMessage = message;
    return message;
}

// Function to handle contact form submission
async function handleContactSubmit(event) {
    event.preventDefault();
    let form = event.target;
    let submitButton = form.querySelector('button[type="submit"]');
    let originalButtonText = submitButton?.innerHTML || '';
    let useFirebaseTracking = true;  // Flag to track if Firebase is accessible
    
    try {
        const nameInput = form.querySelector('#contactName');
        const emailInput = form.querySelector('#contactEmail');
        const messageInput = form.querySelector('#contactMessage');
        
        // Check if all form elements exist
        if (!nameInput || !emailInput || !messageInput || !submitButton) {
            console.error('Form elements not found');
            showNotification(getRandomGenericErrorMessage(), 'error');
            return;
        }

        // Get form values
        const name = nameInput.value.trim();
        const firstName = getFirstName(name);  // Get first name early for messages
        const email = emailInput.value.trim();
        const messageText = messageInput.value.trim();
        
        // Form validation
        if (!name || !email || !messageText) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Get user's IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const userIP = ipData.ip;
        
        // Get message history from device
        const deviceMessages = JSON.parse(localStorage.getItem('messageHistory') || '[]');
        
        // Check 5-minute limit (2 messages)
        const recentMessages = deviceMessages.filter(timestamp => 
            Date.now() - timestamp < 5 * 60 * 1000 // Last 5 minutes
        );
        
        // Check 24-hour limit (5 messages)
        const dailyMessages = deviceMessages.filter(timestamp => 
            Date.now() - timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
        );

        let ipHistory = [];
        let recentIPMessages = [];
        let dailyIPMessages = [];
        
        try {
            // Try to get IP-based limits from Firebase
            const ipRef = doc(db, 'messageTracking', userIP);
            const ipDoc = await getDoc(ipRef);
            ipHistory = ipDoc.exists() ? ipDoc.data().messages || [] : [];
            
            recentIPMessages = ipHistory.filter(timestamp => 
                Date.now() - timestamp < 5 * 60 * 1000 // Last 5 minutes
            );
            
            dailyIPMessages = ipHistory.filter(timestamp => 
                Date.now() - timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
            );
        } catch (firebaseError) {
            console.warn('Firebase tracking unavailable:', firebaseError);
            useFirebaseTracking = false;
        }
        
        // Check 5-minute limit
        if (recentMessages.length >= 2 || (useFirebaseTracking && recentIPMessages.length >= 2)) {
            const deviceTimeUntilReset = recentMessages.length > 0 ? 
                5 * 60 * 1000 - (Date.now() - recentMessages[0]) : 0;
            const ipTimeUntilReset = useFirebaseTracking && recentIPMessages.length > 0 ? 
                5 * 60 * 1000 - (Date.now() - recentIPMessages[0]) : 0;
            const timeUntilReset = Math.max(deviceTimeUntilReset, ipTimeUntilReset);
            const minutesLeft = Math.ceil(timeUntilReset / (60 * 1000));
            const timeDisplay = `${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
            showNotification(getRandomErrorMessage(firstName, timeDisplay), 'error');
            return;
        }
        
        // Check 24-hour limit
        if (dailyMessages.length >= 5 || (useFirebaseTracking && dailyIPMessages.length >= 5)) {
            const deviceTimeUntilReset = dailyMessages.length > 0 ? 
                24 * 60 * 60 * 1000 - (Date.now() - dailyMessages[0]) : 0;
            const ipTimeUntilReset = useFirebaseTracking && dailyIPMessages.length > 0 ? 
                24 * 60 * 60 * 1000 - (Date.now() - dailyIPMessages[0]) : 0;
            const timeUntilReset = Math.max(deviceTimeUntilReset, ipTimeUntilReset);
            const hoursLeft = Math.ceil(timeUntilReset / (60 * 60 * 1000));
            const timeDisplay = `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`;
            showNotification(getRandomErrorMessage(firstName, timeDisplay), 'error');
            return;
        }

        // Admin check
        if (messageText.toLowerCase() === 'hello! its admin') {
            document.activeElement.blur();
            if (checkAdminAccess(messageText)) {
                activateSecretCode();
                return;
            }
            return;
        }

        // Show sending animation
        submitButton.innerHTML = getRandomSendingMessage();
        submitButton.disabled = true;

        // Create message object
        const messageData = {
            name: name,
            email: email,
            message: messageText,
            timestamp: Date.now(),
            ip: userIP
        };

        // Save the message
        await saveContactMessage(messageData);
        
        // Update device tracking
        deviceMessages.push(Date.now());
        localStorage.setItem('messageHistory', JSON.stringify(deviceMessages));
        
        // Update Firebase tracking if available
        if (useFirebaseTracking) {
            try {
                ipHistory.push(Date.now());
                await setDoc(doc(db, 'messageTracking', userIP), { messages: ipHistory }, { merge: true });
            } catch (firebaseError) {
                console.warn('Failed to update Firebase tracking:', firebaseError);
            }
        }
        
        // Clear form
        form.reset();
        
        // Show personalized success message
        showNotification(getRandomSuccessMessage(firstName), 'success');
    } catch (error) {
        console.error('Error sending message:', error);
        // Use personalized message if we have the name, otherwise use generic
        const errorMessage = name 
            ? `Oops! Sorry ${firstName}, something went wrong. Please try again...`
            : getRandomGenericErrorMessage();
        showNotification(errorMessage, 'error');
    } finally {
        if (submitButton) {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }
}

// Add contact form submit handler and mobile touch handlers
const contactForm = document.querySelector('#contactForm');
if (contactForm) {
    // Regular form submission
    contactForm.addEventListener('submit', handleContactSubmit);
}

// Function to show notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after delay - 6s for success, 7s for error
    const displayDuration = type === 'success' ? 6000 : 7000;
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, displayDuration);
}

// Dynamic content loading from Firebase
async function loadContent() {
    try {
        // Load Hero content
        const heroContent = document.getElementById('heroContent');
        if (heroContent) {
            try {
                const profileData = await loadPublicProfileData();
                if (profileData) {
                    heroContent.innerHTML = `
                        <div class="hero-layout">
                            <div class="hero-image">
                                <img src="${profileData.imageUrl ? convertGoogleDriveUrl(profileData.imageUrl) : ''}" 
                                     alt="Profile Picture"
                                     onerror="this.src=''">
                            </div>
                            <div class="hero-text">
                                <h1>Hello, I'm</h1>
                                <h2>${profileData.name || ''}</h2>
                                ${profileData.titles && profileData.titles.length > 0 ? `
                                    <div class="titles-wrapper">
                                        <div class="typing-title"></div>
                                        <div class="all-titles">${profileData.titles.join(' • ')}</div>
                                    </div>
                                ` : ''}
                                ${profileData.company ? `
                                    <div class="company-name">
                                        <i class="fas fa-building"></i> ${profileData.company}
                                    </div>
                                ` : ''}
                                <div class="hero-buttons">
                                    ${profileData.resumeUrl ? `
                                        <a href="${profileData.resumeUrl}" class="btn-outline" id="downloadCV" target="_blank">Download CV</a>
                                    ` : ''}
                                    <a href="#contact" class="btn-filled">Contact Info</a>
                                </div>
                            </div>
                        </div>
                    `;

                    // Initialize typing animation if titles exist
                    if (profileData.titles && profileData.titles.length > 0) {
                        const typingTitle = document.querySelector('.typing-title');
                        let currentTitleIndex = 0;
                        
                        function typeTitle(title) {
                            let i = 0;
                            typingTitle.textContent = '';
                            
                            function type() {
                                if (i < title.length) {
                                    typingTitle.textContent += title.charAt(i);
                                    i++;
                                    setTimeout(type, 100);
                                } else {
                                    // Wait for 2 seconds before erasing
                                    setTimeout(erase, 2000);
                                }
                            }
                            
                            function erase() {
                                let text = typingTitle.textContent;
                                if (text.length > 0) {
                                    typingTitle.textContent = text.slice(0, -1);
                                    setTimeout(erase, 100);
                                } else {
                                    // Move to next title
                                    currentTitleIndex = (currentTitleIndex + 1) % profileData.titles.length;
                                    setTimeout(() => typeTitle(profileData.titles[currentTitleIndex]), 500);
                                }
                            }
                            
                            type();
                        }
                        
                        // Start the typing animation
                        typeTitle(profileData.titles[currentTitleIndex]);
                    }
                }
            } catch (error) {
                console.warn('Error loading hero content:', error);
                heroContent.innerHTML = '';
            }
        }

        // Load Profile content
        const profileContent = document.getElementById('profileContent');
        if (profileContent) {
            try {
                const profileData = await loadPublicProfileData();
                if (profileData) {
                    profileContent.innerHTML = `
                        <div class="profile-header">
                            <div class="profile-image">
                                <img src="${profileData.imageUrl ? convertGoogleDriveUrl(profileData.imageUrl) : ''}" 
                                     alt="Profile Picture"
                                     onerror="this.src=''">
                            </div>
                            <div class="profile-info">
                                ${profileData.name ? `<h1>${profileData.name}</h1>` : ''}
                                ${profileData.titles && profileData.titles.length > 0 ? `
                                    <div class="titles">
                                        ${profileData.titles.map(title => `<p class="title">${title}</p>`).join('')}
                                    </div>
                                ` : ''}
                                ${profileData.company ? `<p class="company"><i class="fas fa-building"></i> ${profileData.company}</p>` : ''}
                                ${profileData.socialLinks && profileData.socialLinks.length > 0 ? `
                                    <div class="social-links">
                                        ${profileData.socialLinks.map(social => `
                                            <a href="${social.url}" target="_blank" class="social-link">
                                                <i class="${social.icon}" style="color: ${social.color}"></i>
                                            </a>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    profileContent.innerHTML = ''; // Show nothing if no data
                }
            } catch (error) {
                console.warn('Error loading profile data:', error);
                profileContent.innerHTML = ''; // Show nothing on error
            }
        }

        // Load About content
        const aboutContent = document.getElementById('aboutContent');
        if (aboutContent) {
            try {
                const [content, profileData] = await Promise.all([
                    loadAboutContent(),
                    loadPublicProfileData()
                ]);
                if (content) {
                    aboutContent.innerHTML = `
                        <div class="about-content">
                            <div class="about-text">
                                <i class="fas fa-quote-left quote-icon quote-left"></i>
                                ${content.bio || content.content || 'No bio available'}
                                <i class="fas fa-quote-right quote-icon quote-right"></i>
                            </div>
                            ${content.widgets && content.widgets.length > 0 ? `
                                <div class="widgets-section">
                                    <div class="widgets-grid">
                                        ${content.widgets.map(widget => `
                                            <div class="widget-card">
                                                <div class="widget-icon">
                                                    <i class="${widget.icon || 'fas fa-info'}" style="color: ${widget.iconColor || '#4169E1'}"></i>
                                                </div>
                                                <div class="widget-content">
                                                    <h4>${widget.heading || ''}</h4>
                                                    ${widget.subheading ? `<div class="widget-subheading">${widget.subheading}</div>` : ''}
                                                    ${widget.additionalFields ? `
                                                        <div class="widget-fields">
                                                            ${widget.additionalFields.length > 0 ? `
                                                                <div class="hidden-fields">
                                                                    ${widget.additionalFields.map((field, index) => `
                                                                        <div class="widget-field-item">
                                                                            <span class="field-name">${field.name || ''}</span>
                                                                            <span class="field-value">${field.value || ''}</span>
                                                                        </div>
                                                                    `).join('')}
                                                                </div>
                                                                <button class="expand-button">
                                                                    <span>Show more</span>
                                                                    <i class="fas fa-chevron-down"></i>
                                                                </button>
                                                            ` : ''}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <div class="about-footer">
                                <div class="social-links-section">
                                    ${profileData?.socialLinks?.map(social => `
                                        <a href="${social.url}" target="_blank" class="social-link">
                                            <i class="${social.icon}" style="color: ${social.color}"></i>
                                        </a>
                                    `).join('') || ''}
                                </div>
                                <div class="signature-section">
                                    <div class="signature-container">
                                        <div class="signature-name">
                                            ${profileData?.name || 'Manish Sharma'}
                                        </div>
                                        <div class="typing-titles-container">
                                            <div class="typing-title"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    // Initialize typing animation if titles exist
                    if (profileData?.titles?.length) {
                        const typingTitle = aboutContent.querySelector('.typing-title');
                        let currentTitleIndex = 0;
                        
                        function typeTitle(title) {
                            let i = 0;
                            typingTitle.textContent = '';
                            
                            function type() {
                                if (i < title.length) {
                                    typingTitle.textContent += title.charAt(i);
                                    i++;
                                    setTimeout(type, 100);
                                } else {
                                    // Wait for 2 seconds before erasing
                                    setTimeout(erase, 2000);
                                }
                            }
                            
                            function erase() {
                                let text = typingTitle.textContent;
                                if (text.length > 0) {
                                    typingTitle.textContent = text.slice(0, -1);
                                    setTimeout(erase, 100);
                                } else {
                                    // Move to next title
                                    currentTitleIndex = (currentTitleIndex + 1) % profileData.titles.length;
                                    setTimeout(() => typeTitle(profileData.titles[currentTitleIndex]), 500);
                                }
                            }
                            
                            type();
                        }
                        
                        // Start the typing animation
                        typeTitle(profileData.titles[currentTitleIndex]);
                    }
                }
            } catch (error) {
                console.warn('Error loading about content:', error);
                aboutContent.innerHTML = '';
            }
        }

        // Load Experience content
        const experienceContent = document.getElementById('experienceContent');
        if (experienceContent) {
            try {
                const experiences = await loadExperienceContent();
                if (experiences && experiences.length > 0) {
                    experienceContent.innerHTML = experiences.map((exp, index) => `
                        <div class="experience-item" style="${index >= 4 ? 'display: none;' : ''}">
                            <div class="experience-header">
                                <div class="experience-header-content">
                                    <h3>${exp.title}</h3>
                                    <div class="company">
                                        <i class="fas fa-building"></i>
                                        ${exp.company}
                                    </div>
                                    <div class="period">
                                        <i class="fas fa-calendar-alt"></i>
                                        ${exp.period}
                                    </div>
                                </div>
                                <button class="experience-toggle" onclick="toggleDescription(this)" aria-expanded="false">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <div class="experience-description">
                                ${exp.description}
                            </div>
                        </div>
                    `).join('');
                    if (experiences.length > 4) {
                        addViewMoreButton('experienceContent');
                    }
                    showSection('experience');
                } else {
                    hideEmptySection('experience');
                }
            } catch (error) {
                console.warn('Error loading experience content:', error);
                hideEmptySection('experience');
            }
        }

        // Load Projects
        const projectsContent = document.getElementById('projectsContent');
        if (projectsContent) {
            try {
                const projects = await loadProjects();
                if (projects && projects.length > 0) {
                    projectsContent.innerHTML = projects.map(project => `
                        <div class="project-card">
                            ${project.image ? `<img src="${project.image}" alt="${project.title}">` : ''}
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                            <div class="technologies">
                                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                            </div>
                            <div class="project-links">
                                ${project.link ? `<a href="${project.link}" target="_blank" class="btn primary">View Project</a>` : ''}
                                ${project.github ? `<a href="${project.github}" target="_blank" class="btn secondary">GitHub</a>` : ''}
                            </div>
                        </div>
                    `).join('');
                    showSection('projects');
                } else {
                    hideEmptySection('projects');
                }
            } catch (error) {
                console.warn('Error loading projects:', error);
                hideEmptySection('projects');
            }
        }

        // Load Blog posts
        const blogContent = document.getElementById('blogContent');
        if (blogContent) {
            try {
                const posts = await loadBlogPosts();
                if (posts && posts.length > 0) {
                    blogContent.innerHTML = posts.map(post => `
                        <div class="blog-card">
                            ${post.image ? `<img src="${post.image}" alt="${post.title}">` : ''}
                            <h3>${post.title}</h3>
                            <p>${post.content.substring(0, 150)}...</p>
                            <div class="tags">
                                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    `).join('');
                    showSection('blog');
                } else {
                    hideEmptySection('blog');
                }
            } catch (error) {
                console.warn('Error loading blog posts:', error);
                hideEmptySection('blog');
            }
        }

        // Load Skills content with view more
        const skillsContent = document.getElementById('skillsContent');
        if (skillsContent) {
            try {
                const skills = await loadSkills();
                if (skills && skills.length > 0) {
                    skillsContent.innerHTML = skills.map((category, index) => `
                        <div class="skills-category" style="${index >= 4 ? 'display: none;' : ''}">
                            <h3>${category.name}</h3>
                            <div class="skills-grid">
                                ${category.skills.map(skill => `
                                    <div class="skill-item">
                                        <div class="skill-icon">
                                            <i class="${skill.icon}" style="color: ${skill.color}"></i>
                                        </div>
                                        <div class="skill-info">
                                            <h4>${skill.name}</h4>
                                            <div class="skill-level">
                                                <span class="proficiency-badge" style="background-color: ${getProficiencyColor(skill.level)}">
                                                    ${skill.level || 'Basic'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('');
                    if (skills.length > 4) {
                        addViewMoreButton('skillsContent');
                    }
                    showSection('skills');
                } else {
                    hideEmptySection('skills');
                }
            } catch (error) {
                console.warn('Error loading skills:', error);
                hideEmptySection('skills');
            }
        }

        // Load Certifications content with view more
        const certificationsContent = document.getElementById('certificationsContent');
        if (certificationsContent) {
            try {
                const profileData = await loadPublicProfileData();
                if (profileData && profileData.certifications && profileData.certifications.length > 0) {
                    certificationsContent.innerHTML = profileData.certifications.map((cert, index) => `
                        <div class="certification-card" style="${index >= 4 ? 'display: none;' : ''}">
                            <div class="certification-header">
                                <div class="certification-title">
                                    <div class="certification-icon">
                                        <i class="fas fa-certificate"></i>
                                    </div>
                                    <h3>${cert.title || ''}</h3>
                                </div>
                                ${cert.credentialUrl ? `
                                    <a href="${cert.credentialUrl}" target="_blank" class="cert-link">
                                        <i class="fas fa-external-link-alt"></i> View Certificate
                                    </a>
                                ` : ''}
                            </div>
                            <div class="certification-info">
                                <div class="certification-meta">
                                    <div class="issuer-group">
                                        <span class="info-label">Issuer:</span>
                                        <p class="issuer">${cert.organization || ''}</p>
                                    </div>
                                    <p class="date">
                                        ${cert.issueDate ? `Issued: ${new Date(cert.issueDate).toLocaleString('default', { month: 'short' })} ${new Date(cert.issueDate).getFullYear()}` : ''} 
                                        ${cert.expiryDate ? ` • Expires: ${new Date(cert.expiryDate).toLocaleString('default', { month: 'short' })} ${new Date(cert.expiryDate).getFullYear()}` : ''}
                                    </p>
                                    ${cert.credentialId ? `
                                        <p class="credential-id">Credential ID: ${cert.credentialId}</p>
                                    ` : ''}
                                </div>
                                ${cert.certificationSkills ? `
                                    <div class="certification-skills">
                                        <span class="skills-label">Skills:</span>
                                        ${cert.certificationSkills.split(',').map(skill => `
                                            <span class="skill-tag">${skill.trim()}</span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                ${cert.files && cert.files.length > 0 ? `
                                    <div class="certification-buttons">
                                        <button class="cert-images-toggle" onclick="toggleCertImages(this)">
                                            <i class="fas fa-chevron-down"></i>
                                            View Files
                                        </button>
                                        ${cert.credentialUrl ? `
                                            <a href="${cert.credentialUrl}" target="_blank" class="mobile-cert-link">
                                                <i class="fas fa-external-link-alt"></i> View Certificate
                                            </a>
                                        ` : ''}
                                    </div>
                                    <div class="certification-images hidden">
                                        ${cert.files.map(file => {
                                            if (file.type === 'pdf') {
                                                return `
                                                    <div class="cert-file-wrapper">
                                                        <div class="pdf-box">
                                                            <i class="fas fa-file-pdf"></i>
                                                            <a href="${file.url}" target="_blank" class="file-link">
                                                                <i class="fas fa-external-link-alt"></i>
                                                            </a>
                                                        </div>
                                                    </div>
                                                `;
                                            } else {
                                                return `
                                                    <div class="cert-file-wrapper">
                                                        <img src="${file.url}" alt="Certificate" class="cert-thumbnail">
                                                        <a href="${file.url}" target="_blank" class="file-link">
                                                            <i class="fas fa-external-link-alt"></i>
                                                        </a>
                                                    </div>
                                                `;
                                            }
                                        }).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('');
                    if (profileData.certifications.length > 4) {
                        addViewMoreButton('certificationsContent');
                    }
                    showSection('certifications');
                } else {
                    hideEmptySection('certifications');
                }
            } catch (error) {
                console.warn('Error loading certifications:', error);
                hideEmptySection('certifications');
            }
        }
    } catch (error) {
        console.warn('Error in loadContent:', error);
    }
}

// Helper function to convert Google Drive URL
function convertGoogleDriveUrl(url) {
    if (!url) return '';
    
    if (url.includes('drive.google.com')) {
        let fileId = '';
        if (url.includes('/file/d/')) {
            fileId = url.split('/file/d/')[1].split('/')[0];
        } else if (url.includes('?id=')) {
            fileId = url.split('?id=')[1].split('&')[0];
        }
        
        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
    }
    return url;
}

// Function to convert string to Title Case
function toTitleCase(str) {
    return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Function to update document title and meta
async function updateTitleAndMeta() {
    try {
        const profileData = await loadPublicProfileData();
        if (profileData?.name) {
            // Convert name to Title Case
            const formattedName = toTitleCase(profileData.name);
            
            // Update document title
            document.title = `${formattedName} - Portfolio`;
            
            // Update meta name
            const metaName = document.querySelector('meta[name="description"]');
            if (metaName) {
                metaName.setAttribute('name', formattedName);
                metaName.setAttribute('content', `${formattedName}-Portfolio`);
            } else {
                // Create meta if it doesn't exist
                const meta = document.createElement('meta');
                meta.setAttribute('name', formattedName);
                meta.setAttribute('content', `${formattedName}-Portfolio`);
                document.head.appendChild(meta);
            }
        }
    } catch (error) {
        console.warn('Error updating title and meta:', error);
    }
}

// Initialize content loading and update title/meta
document.addEventListener('DOMContentLoaded', async () => {
    await updateTitleAndMeta();
    loadContent();
});

// Add event listener for expand buttons after content is loaded
document.addEventListener('click', function(e) {
    if (e.target.closest('.expand-button')) {
        const button = e.target.closest('.expand-button');
        const hiddenFields = button.previousElementSibling;
        hiddenFields.classList.toggle('show');
        button.classList.toggle('expanded');
        button.querySelector('span').textContent = hiddenFields.classList.contains('show') ? 'Show less' : 'Show more';
    }
}); 

// Helper function to get color based on proficiency text
function getProficiencyColor(level) {
    const colors = {
        'Expert': 'rgba(0, 123, 255, 0.8)',      // Blue with opacity
        'Advanced': 'rgba(40, 167, 69, 0.8)',    // Green with opacity
        'Intermediate': 'rgba(23, 162, 184, 0.8)', // Cyan with opacity
        'Basic': 'rgba(108, 117, 125, 0.8)'       // Gray with opacity
    };
    return colors[level] || colors['Basic'];
} 

// Add event listener for skill name overflow detection
document.addEventListener('DOMContentLoaded', function() {
    function checkOverflow() {
        document.querySelectorAll('.skill-info h4').forEach(element => {
            const isOverflowing = element.scrollWidth > element.clientWidth;
            if (isOverflowing) {
                element.classList.add('truncated');
            } else {
                element.classList.remove('truncated');
            }
        });
    }

    // Check on load
    checkOverflow();

    // Check on window resize
    window.addEventListener('resize', checkOverflow);

    // Footer hover effect
    const copyright = document.querySelector('.copyright');
    if (copyright) {
        // Get profile data for name
        loadPublicProfileData().then(profileData => {
            // Format name to title case (first letter capital)
            const formatName = (name) => {
                return name.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            };
            const name = formatName(profileData?.name || 'Manish Sharma');
            const currentYear = new Date().getFullYear();
            const originalText = `© ${currentYear} ${name}. All rights reserved.`;
            const hoverText = `🎨 Designed • 💻 Developed • 🛠️ Maintained by <a href='https://www.instagram.com/me.manish18/' target='_blank' style='text-decoration: none; color: inherit;'>Manish Sharma</a>`;
            
            copyright.setAttribute('data-original', originalText);
            copyright.setAttribute('data-hover', hoverText);
            copyright.innerHTML = originalText;
        });

        copyright.addEventListener('mouseenter', () => {
            copyright.innerHTML = copyright.getAttribute('data-hover');
        });
        copyright.addEventListener('mouseleave', () => {
            copyright.innerHTML = copyright.getAttribute('data-original');
        });
    }
}); 

// Function to update theme icon
function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Function to toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Save user preference
    updateThemeIcon(newTheme);
}

// Initialize theme and add toggle button when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initializeTheme();
    
    // Add theme toggle button to sidebar
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        const themeToggleWrapper = document.createElement('div');
        themeToggleWrapper.className = 'theme-toggle-wrapper';
        
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        const currentTheme = document.documentElement.getAttribute('data-theme');
        themeToggle.innerHTML = `
            <i class="fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}"></i>
            <span>Toggle ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode</span>
        `;
        themeToggle.onclick = toggleTheme;
        
        themeToggleWrapper.appendChild(themeToggle);
        navLinks.appendChild(themeToggleWrapper);
    }
    
    // Remove the old theme toggle if it exists
    const oldThemeToggle = document.querySelector('.theme-toggle[style*="position: fixed"]');
    if (oldThemeToggle) {
        oldThemeToggle.remove();
    }
});

// Function to toggle certification images
window.toggleCertImages = function(button) {
    const imagesContainer = button.parentElement.nextElementSibling;
    const isHidden = imagesContainer.classList.contains('hidden');
    
    // Toggle hidden class
    imagesContainer.classList.toggle('hidden');
    
    // Toggle expanded class on button
    button.classList.toggle('expanded');
    
    // Update button text and icon
    button.innerHTML = `
        <i class="fas fa-chevron-${isHidden ? 'up' : 'down'}"></i>
        ${isHidden ? 'Hide Files' : 'View Files'}
    `;
}; 

// Function to handle view more/less
window.toggleViewMore = function(sectionId, button) {
    const section = document.getElementById(sectionId);
    const items = section.querySelectorAll('.experience-item, .skills-category, .certification-card, .project-card');
    const isExpanded = button.getAttribute('data-expanded') === 'true';
    
    items.forEach((item, index) => {
        if (index >= 4) {
            item.style.display = isExpanded ? 'none' : 'flex';
        }
    });
    
    button.innerHTML = `
        <i class="fas fa-chevron-${isExpanded ? 'down' : 'up'}"></i>
        ${isExpanded ? 'View More' : 'View Less'}
    `;
    button.setAttribute('data-expanded', isExpanded ? 'false' : 'true');
}

// Function to add view more button and hide excess items
function addViewMoreButton(contentId) {
    const content = document.getElementById(contentId);
    if (!content) return;

    const items = content.querySelectorAll('.experience-item, .skills-category, .certification-card, .project-card');
    
    if (items.length > 4) {
        // Hide items beyond the first 4
        items.forEach((item, index) => {
            if (index >= 4) {
                item.style.display = 'none';
            }
        });
        
        // Add view more button
        const viewMoreBtn = document.createElement('button');
        viewMoreBtn.className = 'view-more-btn';
        viewMoreBtn.setAttribute('data-expanded', 'false');
        viewMoreBtn.innerHTML = '<i class="fas fa-chevron-down"></i> View More';
        viewMoreBtn.onclick = () => toggleViewMore(contentId, viewMoreBtn);
        
        content.parentElement.appendChild(viewMoreBtn);
    }
} 

// Function to toggle experience description
window.toggleDescription = function(button) {
    const description = button.closest('.experience-header').nextElementSibling;
    const isExpanded = button.classList.contains('expanded');
    
    // Toggle description visibility
    description.classList.toggle('show');
    
    // Toggle button state
    button.classList.toggle('expanded');
    
    // Update aria-expanded attribute for accessibility
    button.setAttribute('aria-expanded', !isExpanded);
}; 

// Add logo click handler
document.querySelector('.logo-image').addEventListener('click', async () => {
    try {
        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Force reload from server without cache
        window.location.reload(true);
    } catch (error) {
        console.error('Error clearing cache:', error);
        // Fallback to simple reload if cache clearing fails
        window.location.reload();
    }
}); 

// Function to activate secret code
async function activateSecretCode() {
    try {
        await showAdminRedirectLoader();
        window.location.href = 'admin.html';
    } catch (error) {
        console.error('Error during login:', error);
    }
}

// Function to show loader before admin redirection
async function showAdminRedirectLoader() {
    // Create container with solid background
    const adminLoaderContainer = document.createElement('div');
    adminLoaderContainer.className = 'admin-loader-container';
    adminLoaderContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#1a1a1a' : '#ffffff'} !important;
        z-index: 9999999999;
        opacity: 1;
        transition: opacity 0.5s ease-out;
    `;

    // Create loader box with glass effect
    const loaderBox = document.createElement('div');
    loaderBox.style.cssText = `
        background: ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(37, 37, 37, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
        border-radius: 20px;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        transform: scale(0.9);
        opacity: 0;
        transition: all 0.3s ease-out;
    `;

    // Create and style the loader
    const adminLoader = document.createElement('div');
    adminLoader.className = 'admin-loader';
    adminLoader.style.cssText = `
        width: 80px;
        height: 80px;
        position: relative;
        margin: 0 auto 1.5rem;
        animation: adminLoaderPulse 2s ease-in-out infinite;
    `;

    const loaderImg = document.createElement('img');
    loaderImg.src = 'logo/logo.png';
    loaderImg.alt = 'Loading...';
    loaderImg.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'brightness(100)' : 'brightness(0)'};
        transition: filter 0.3s ease;
    `;

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.innerHTML = `
        <div style="
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#1a1a1a'};
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        ">Welcome to Admin Panel!</div>
        <div id="loaderMessage" style="
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#cccccc' : '#666666'};
            font-size: 1.1rem;
        ">Preparing your workspace...</div>
        <div class="progress-bar" style="
            width: 200px;
            height: 4px;
            background: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#333' : '#eee'};
            margin: 1.5rem auto 0;
            border-radius: 2px;
            overflow: hidden;
        ">
            <div class="progress" style="
                width: 100%;
                height: 100%;
                background: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#8bb9dd' : '#2a6496'};
                transform: translateX(-100%);
                animation: progress 5s linear forwards;
            "></div>
        </div>
    `;

    // Add animation keyframes
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes adminLoaderPulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(styleSheet);

    // Assemble the loader
    adminLoader.appendChild(loaderImg);
    loaderBox.appendChild(adminLoader);
    loaderBox.appendChild(messageContainer);
    adminLoaderContainer.appendChild(loaderBox);
    document.body.appendChild(adminLoaderContainer);

    // Messages for loading state
    const loadingMessages = [
        "Preparing your workspace...",
        "Setting up admin access...",
        "Almost there...",
        "Redirecting to admin panel..."
    ];

    // Show loader with animation
    requestAnimationFrame(() => {
        loaderBox.style.transform = 'scale(1)';
        loaderBox.style.opacity = '1';
    });

    // Cycle through loading messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        const messageElement = document.getElementById('loaderMessage');
        if (messageElement) {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                messageElement.textContent = loadingMessages[messageIndex];
                messageElement.style.opacity = '1';
                messageIndex = (messageIndex + 1) % loadingMessages.length;
            }, 200);
        }
    }, 2000);

    // Return a promise that resolves when loading is done
    return new Promise((resolve) => {
        const minLoadTime = 5000; // Minimum 5 seconds
        const startTime = Date.now();

        // Function to check if content is loaded
        const checkContentLoaded = () => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadTime - elapsedTime);

            // If minimum time has passed
            if (elapsedTime >= minLoadTime) {
                clearInterval(messageInterval);
                
                // Fade out loader
                loaderBox.style.transform = 'scale(0.9)';
                loaderBox.style.opacity = '0';
                setTimeout(() => {
                    adminLoaderContainer.style.opacity = '0';
                    setTimeout(() => {
                        adminLoaderContainer.remove();
                        styleSheet.remove();
                        resolve();
                    }, 300);
                }, 200);
            } else {
                // Check again in 100ms
                setTimeout(checkContentLoaded, 100);
            }
        };

        // Start checking
        checkContentLoaded();
    });
}

// Update the secret key handler to use the loader
document.addEventListener('keydown', async function(event) {
    if (event.key === 'a' && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        await showAdminRedirectLoader();
        window.location.href = 'admin.html';
    }
}); 

// Function to get random sending message
function getRandomSendingMessage() {
    const messages = [
        '<i class="fas fa-paper-plane fa-spin"></i> Sending your message...',
        '<i class="fas fa-spinner fa-spin"></i> Almost there...',
        '<i class="fas fa-circle-notch fa-spin"></i> Processing your message...',
        '<i class="fas fa-sync fa-spin"></i> Delivering your message...',
        '<i class="fas fa-envelope fa-spin"></i> Sending...',
        '<i class="fas fa-clock fa-spin"></i> Just a moment...',
        '<i class="fas fa-satellite-dish fa-spin"></i> Transmitting...',
        '<i class="fas fa-broadcast-tower fa-spin"></i> Broadcasting...',
        '<i class="fas fa-dove fa-spin"></i> Message in flight...',
        '<i class="fas fa-paper-plane fa-spin"></i> On its way...'
    ];
    
    // Filter out the last shown message
    const availableMessages = messages.filter(msg => msg !== lastSendingMessage);
    // Get random message from remaining ones
    const message = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    // Update last shown message
    lastSendingMessage = message;
    return message;
} 