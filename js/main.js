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

// PWA Update Check
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                // Check for updates every hour
                setInterval(() => {
                    registration.update();
                }, 1000 * 60 * 60); // 1 hour

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showNotification('A new version is available! Close and reopen the app to update.', 'info');
                        }
                    });
                });
            })
            .catch(error => console.warn('Service worker registration failed:', error));
    });

    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'UPDATE_READY') {
            // Create update notification
            const updateDiv = document.createElement('div');
            updateDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #2196F3;
                color: white;
                padding: 16px 24px;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
            `;
            
            updateDiv.innerHTML = `
                <span>A new version is available!</span>
                <button onclick="window.location.reload()" style="
                    background: white;
                    color: #2196F3;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">Update Now</button>
            `;

            document.body.appendChild(updateDiv);
        }
    });
}

let refreshing = false;

// Function to check manifest changes
async function checkManifestChanges() {
    try {
        const response = await fetch('/manifest.json');
        const manifest = await response.json();
        
        // Get stored manifest hash
        const storedHash = localStorage.getItem('manifestHash');
        const currentHash = JSON.stringify(manifest);
        
        if (storedHash && storedHash !== currentHash) {
            showNotification('App has been updated! Please refresh for new features.', 'info');
        }
        
        // Store new hash
        localStorage.setItem('manifestHash', currentHash);
    } catch (error) {
        console.warn('Manifest check failed:', error);
    }
}

// Check manifest on load and every hour
window.addEventListener('load', () => {
    checkManifestChanges();
    setInterval(checkManifestChanges, 1000 * 60 * 60); // Every hour
});

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

// Track admin access attempts
let adminAttempts = 0;

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

// Function to get random portfolio success message
function getRandomSuccessMessage(name) {
    const firstName = getFirstName(name);
    const messages = [
        `Thanks ${firstName}! 🌟 Your message has landed in my portfolio inbox. I'll craft a thoughtful response soon!`,
        `High five, ${firstName}! 🖐️ Thanks for checking out my portfolio. I'll get back to you with creative ideas!`,
        `Message received, ${firstName}! 💼 Always excited to connect with someone interested in my work.`,
        `Hey ${firstName}! 🚀 Thanks for reaching out. Let's create something amazing together!`,
        `Awesome message, ${firstName}! 💫 Can't wait to discuss potential collaborations with you.`,
        `Thank you ${firstName}! 🎨 Your interest in my portfolio means a lot. I'll respond with some creative thoughts soon.`,
        `Message secured, ${firstName}! 🔥 Looking forward to sharing my project insights with you.`,
        `Got your note, ${firstName}! 💡 Excited to discuss how we can bring your ideas to life.`,
        `Thanks for connecting, ${firstName}! 🌈 Your message will help shape our next creative venture.`,
        `Message landed safely, ${firstName}! 🎯 Ready to turn your vision into reality.`,
        `Hey ${firstName}! 🌟 Thanks for exploring my digital playground. Let's create something unique!`,
        `Message received, ${firstName}! 🎪 Can't wait to share my portfolio journey with you.`,
        `Thank you ${firstName}! 🎭 Your interest in my creative work means the world to me.`,
        `Fantastic, ${firstName}! 🎨 Looking forward to discussing design possibilities with you.`,
        `Message noted, ${firstName}! 💻 Ready to bring some digital magic to your project.`,
        `Thanks ${firstName}! 🎯 Your message is the first step to something extraordinary.`,
        `Got it, ${firstName}! 🚀 Excited to show you how we can elevate your ideas.`,
        `Message received, ${firstName}! 💫 Let's transform your vision into digital reality.`,
        `Thank you ${firstName}! 🌈 Your interest in my portfolio sparks joy and creativity.`,
        `Hey ${firstName}! 🎪 Can't wait to add your project to my portfolio showcase!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Message limits configuration
const MESSAGE_LIMITS = {
    PER_MINUTE: 2,  // 2 messages per minute
    PER_HOUR: 5,    // 5 messages per hour
    PER_DAY: 10     // 10 messages per day
};

// Store message timestamps in localStorage
function storeMessageTimestamp() {
    const timestamps = JSON.parse(localStorage.getItem('messageTimestamps') || '[]');
    timestamps.push(Date.now());
    localStorage.setItem('messageTimestamps', JSON.stringify(timestamps));
}

// Check if user can send message
function canSendMessage() {
    const timestamps = JSON.parse(localStorage.getItem('messageTimestamps') || '[]');
    const now = Date.now();
    
    // Clean old timestamps
    const dayOld = now - (24 * 60 * 60 * 1000);
    const cleanedTimestamps = timestamps.filter(time => time > dayOld);
    localStorage.setItem('messageTimestamps', JSON.stringify(cleanedTimestamps));
    
    // Check limits
    const lastMinute = cleanedTimestamps.filter(time => time > now - 60000).length;
    const lastHour = cleanedTimestamps.filter(time => time > now - 3600000).length;
    const lastDay = cleanedTimestamps.length;
    
    if (lastMinute >= MESSAGE_LIMITS.PER_MINUTE) {
        return { allowed: false, reason: 'minute', timeLeft: 60 - Math.floor((now - cleanedTimestamps[cleanedTimestamps.length - lastMinute])/1000) };
    }
    if (lastHour >= MESSAGE_LIMITS.PER_HOUR) {
        return { allowed: false, reason: 'hour', timeLeft: 3600 - Math.floor((now - cleanedTimestamps[cleanedTimestamps.length - lastHour])/1000) };
    }
    if (lastDay >= MESSAGE_LIMITS.PER_DAY) {
        return { allowed: false, reason: 'day', timeLeft: 86400 - Math.floor((now - cleanedTimestamps[0])/1000) };
    }
    
    return { allowed: true };
}

// Check for spam content
function isSpamContent(message, name, email) {
    // Convert to lowercase for checking
    const lowerMessage = message.toLowerCase();
    const lowerName = name.toLowerCase();
    
    // Check for common spam patterns
    const spamPatterns = [
        /buy now/i,
        /\[url=/i,
        /\[link=/i,
        /http:\/\//i,
        /https:\/\//i,
        /viagra/i,
        /casino/i,
        /lottery/i,
        /win.*prize/i,
        /free.*money/i,
        /\$\$\$/,
        /[^\s]{30,}/  // No legitimate words are this long
    ];
    
    // Check for excessive special characters
    const specialCharRatio = (message.match(/[^a-zA-Z0-9\s]/g) || []).length / message.length;
    if (specialCharRatio > 0.3) return true;
    
    // Check for repetitive characters
    if (/(.)\1{4,}/.test(message)) return true;  // Same character repeated 5+ times
    
    // Check against spam patterns
    return spamPatterns.some(pattern => pattern.test(lowerMessage) || pattern.test(lowerName));
}

// Function to get random error message
function getRandomErrorMessage(name, type, timeLeft = null) {
    const firstName = getFirstName(name);
    const messages = {
        spam: [
            `🚫 Oops ${firstName}! Your message contains patterns that look like spam. Please revise and try again.`,
            `⚠️ Hold on ${firstName}! We detected some suspicious content. Mind rephrasing your message?`,
            `🔍 Hey ${firstName}, our spam filter caught something unusual. Could you modify your message?`,
            `🛡️ ${firstName}, we're keeping things clean! Please remove any promotional or suspicious content.`,
            `🤖 Beep boop! ${firstName}, that looks like spam to our systems. Want to try again?`
        ],
        length: [
            `📝 ${firstName}, your message is too ${timeLeft}. Keep it between 10-1000 characters.`,
            `✍️ Hey ${firstName}! Mind adjusting your message length? It's too ${timeLeft}.`,
            `📊 ${firstName}, we need a ${timeLeft} message. Adjust and try again?`,
            `📏 Oops! ${firstName}, your message is ${timeLeft}. Let's find that sweet spot!`,
            `✂️ ${firstName}, could you make your message ${timeLeft}? It helps us serve you better!`
        ],
        rate: [
            `⏳ Easy there, ${firstName}! You'll need to wait ${timeLeft} before sending another message.`,
            `⌛ ${firstName}, you're quite active! Take a ${timeLeft} break before your next message.`,
            `⏰ Hold your horses, ${firstName}! Just ${timeLeft} until you can send again.`,
            `🕒 ${firstName}, we love your enthusiasm! But let's wait ${timeLeft} before the next one.`,
            `⏱️ Quick break time, ${firstName}! You can send again in ${timeLeft}.`
        ],
        generic: [
            `🔧 Oops! Something went wrong, ${firstName}. Mind trying again?`,
            `⚡ Technical hiccup, ${firstName}! Give it another shot?`,
            `🌐 Connection gremlins, ${firstName}! Shall we try once more?`,
            `💫 ${firstName}, that didn't quite work. One more try?`,
            `🎯 Almost there, ${firstName}! Let's try that again.`
        ]
    };

    const messageArray = messages[type] || messages.generic;
    return messageArray[Math.floor(Math.random() * messageArray.length)];
}

// Function to format time remaining
function formatTimeRemaining(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.ceil(seconds/60)} minutes`;
    if (seconds < 86400) return `${Math.ceil(seconds/3600)} hours`;
    return `${Math.ceil(seconds/86400)} days`;
}

// Function to handle contact form submission
async function handleContactSubmit(event) {
    event.preventDefault();
    let form = event.target;
    let submitButton = form.querySelector('button[type="submit"]');
    let originalButtonText = submitButton?.innerHTML || '';
    
    try {
        const nameInput = form.querySelector('#contactName');
        const emailInput = form.querySelector('#contactEmail');
        const messageInput = form.querySelector('#contactMessage');
        
        // Check if all form elements exist
        if (!nameInput || !emailInput || !messageInput || !submitButton) {
            console.error('Form elements not found');
            showNotification(getRandomErrorMessage('Friend', 'generic'), 'error');
            return;
        }

        // Get form values
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const messageText = messageInput.value.trim();
        
        // Check for admin access
        if (messageText.toLowerCase() === 'hello! its admin' && !name && !email) {
            adminAttempts++;
            if (adminAttempts === 5) {
                adminAttempts = 0;
                window.location.href = 'admin.html';
            return;
        }
            return;
        }

        // Reset admin attempts if different message
        adminAttempts = 0;
        
        // Regular form validation
        if (!name || !email || !messageText) {
            const userName = name || 'Friend';
            showNotification(`Hey ${userName}! Please fill in all fields to continue our conversation.`, 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification(`Hey ${getFirstName(name)}! That email address doesn't look quite right. Mind double-checking?`, 'error');
            return;
        }

        // Check message length
        if (messageText.length < 10) {
            showNotification(getRandomErrorMessage(name, 'length', 'short'), 'error');
            return;
        }
        
        if (messageText.length > 1000) {
            showNotification(getRandomErrorMessage(name, 'length', 'long'), 'error');
            return;
        }

        // Check for spam content
        if (isSpamContent(messageText, name, email)) {
            showNotification(getRandomErrorMessage(name, 'spam'), 'error');
                return;
            }

        // Check rate limits
        const rateCheck = canSendMessage();
        if (!rateCheck.allowed) {
            const timeLeft = formatTimeRemaining(rateCheck.timeLeft);
            showNotification(getRandomErrorMessage(name, 'rate', timeLeft), 'error');
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
            timestamp: Date.now()
        };

        // Save the message
        await saveContactMessage(messageData);
        
        // Store timestamp for rate limiting
        storeMessageTimestamp();
        
        // Clear form
        form.reset();
        
        // Show personalized success message
        showNotification(getRandomSuccessMessage(name), 'success');
    } catch (error) {
        console.error('Error sending message:', error);
        // Use the name if available, otherwise use 'Friend'
        const userName = (nameInput && nameInput.value.trim()) || 'Friend';
        showNotification(getRandomErrorMessage(userName, 'generic'), 'error');
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
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
    return messages[Math.floor(Math.random() * messages.length)];
} 