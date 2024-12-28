import { 
    saveContactMessage, 
    loadAboutContent, 
    loadExperienceContent, 
    loadProjects, 
    loadBlogPosts,
    loadSkills,
    loadPublicProfileData 
} from './firebase-config.js';
import { getFirestore, doc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
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

// Function to handle contact form submission
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const nameInput = form.querySelector('#contactName');
    const emailInput = form.querySelector('#contactEmail');
    const messageInput = form.querySelector('#contactMessage');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Check if all form elements exist
    if (!nameInput || !emailInput || !messageInput || !submitButton) {
        console.error('Form elements not found');
        showNotification('Form error: Required fields not found', 'error');
        return;
    }
    
    const originalButtonText = submitButton.innerHTML;
    
    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        // Get form data
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        
        // Validate form data
        if (!name || !email || !message) {
            throw new Error('Please fill in all fields');
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // Create message document
        const messageData = {
            name,
            email,
            message,
            createdAt: new Date().toISOString()
        };
        
        // Add to Firebase
        const messagesRef = collection(db, 'messages');
        await addDoc(messagesRef, messageData);
        
        // Show success message
        showNotification('Message sent successfully!', 'success');
        
        // Reset form
        form.reset();
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'Failed to send message. Please try again.', 'error');
        
    } finally {
        // Restore submit button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
}

// Add contact form submit handler only if form exists
const contactForm = document.querySelector('#contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
}

// Function to show notification
function showNotification(message, type = 'success') {
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
                                                <i class="fab fa-${social.platform}"></i>
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
                                            <i class="fab fa-${social.platform}"></i>
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

// Initialize content loading
document.addEventListener('DOMContentLoaded', loadContent); 

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
        copyright.addEventListener('mouseenter', () => {
            copyright.textContent = copyright.getAttribute('data-hover');
        });
        copyright.addEventListener('mouseleave', () => {
            copyright.textContent = copyright.getAttribute('data-original');
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

// Secret admin panel access
const secretCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'm', 's'];
let secretCodePosition = 0;
let lastKeyTime = Date.now();
const MAX_DELAY = 2000;

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    const currentTime = Date.now();
    
    if (currentTime - lastKeyTime > MAX_DELAY && secretCodePosition > 0) {
        secretCodePosition = 0;
    }
    
    lastKeyTime = currentTime;
    
    // Normalize the input key
    let pressedKey = e.key.startsWith('Arrow') ? e.key : e.key.toLowerCase();
    
    // Check if key matches
    if (pressedKey === secretCode[secretCodePosition]) {
        secretCodePosition++;
        
        if (secretCodePosition === secretCode.length) {
            activateSecretCode();
        }
    } else {
        secretCodePosition = 0;
    }
});

// Touch coordinates for swipe detection
let touchStartX = 0;
let touchStartY = 0;
let isTouchSequence = false;

// Handle touch input
document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isTouchSequence = true;
}, { passive: true });

document.addEventListener('touchend', function(e) {
    if (!isTouchSequence) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 50;
    
    const currentTime = Date.now();
    if (currentTime - lastKeyTime > MAX_DELAY && secretCodePosition > 0) {
        secretCodePosition = 0;
    }
    
    let swipeDirection = '';
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
            swipeDirection = deltaX > 0 ? 'ArrowRight' : 'ArrowLeft';
        }
    } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
            swipeDirection = deltaY > 0 ? 'ArrowDown' : 'ArrowUp';
        }
    }
    
    if (swipeDirection && swipeDirection === secretCode[secretCodePosition]) {
        secretCodePosition++;
        lastKeyTime = currentTime;
        
        if (secretCodePosition === secretCode.length - 2) {
            showLetterInput();
        }
    } else if (swipeDirection) {
        secretCodePosition = 0;
    }
    
    isTouchSequence = false;
}, { passive: true });

// Remove touchmove listener since we're using touchend
document.removeEventListener('touchmove', () => {});

// Function to show letter input on mobile
function showLetterInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 2;
    input.autocomplete = 'off';
    input.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 15px;
        border: 2px solid var(--primary-color, #4169E1);
        border-radius: 8px;
        font-size: 18px;
        width: 80px;
        text-align: center;
        background: var(--bg-color, #ffffff);
        color: var(--text-color, #000000);
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        if (value === 'ms') {
            input.remove();
            activateSecretCode();
        } else if (value.length === 2) {
            input.remove();
            secretCodePosition = 0;
        }
    });
    
    document.body.appendChild(input);
    setTimeout(() => input.focus(), 100);
    
    // Remove input if not used
    setTimeout(() => {
        if (document.body.contains(input)) {
            input.remove();
            secretCodePosition = 0;
        }
    }, 5000);
}

// Function to activate secret code
function activateSecretCode() {
    secretCodePosition = 0;
    
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease-in;
    `;
    
    const message = document.createElement('div');
    message.style.cssText = `
        color: #fff;
        font-size: 2.5rem;
        font-weight: bold;
        text-align: center;
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.5s ease-out;
    `;
    message.innerHTML = `
        <div style="margin-bottom: 10px;">👋 Hello Manish!</div>
        <div style="font-size: 1.5rem; color: #4169E1;">Welcome to Admin Panel</div>
    `;
    
    flash.appendChild(message);
    document.body.appendChild(flash);
    
    // Trigger animations
    requestAnimationFrame(() => {
        flash.style.opacity = '1';
        message.style.opacity = '1';
        message.style.transform = 'scale(1)';
    });
    
    // Redirect after animation
    setTimeout(() => {
        flash.style.opacity = '0';
        message.style.transform = 'scale(1.2)';
        message.style.opacity = '0';
        setTimeout(() => {
            flash.remove();
            window.location.href = 'admin.html';
        }, 300);
    }, 1000);
} 