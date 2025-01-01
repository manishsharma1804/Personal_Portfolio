// Import Firebase functions and objects
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    deleteDoc, 
    collection, 
    query, 
    orderBy, 
    getDocs, 
    updateDoc,
    serverTimestamp,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
    auth,
    db,
    adminLogin,
    isAdmin,
    updateAbout,
    updateExperience,
    addProject,
    updateProject,
    deleteProject,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    loadAboutContent,
    loadExperienceContent,
    loadProjects,
    loadBlogPosts,
    loadMessages,
    loadCertifications,
    loadProfile,
    updateProfile,
    loadSkills,
    updateSkills,
    markMessageAsRead,
    markMessageAsUnread,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToStats,
    unsubscribeFromStats
} from './firebase-config.js';
import { subscribeToNotifications } from './notifications.js';

// Theme toggle functionality
function initTheme() {
    // First check if user has a stored preference
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

    // Handle system theme changes
    function handleSystemThemeChange(e) {
        // Only update if user hasn't set a manual preference
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
        }
    }

    // Remove any old listeners first
    try {
        prefersDark.removeEventListener('change', handleSystemThemeChange);
    } catch (e) {
        // Ignore if no listener existed
    }

    // Add the listener for system theme changes
    prefersDark.addEventListener('change', handleSystemThemeChange);
    
    if (storedTheme) {
        // Use stored preference if available
        setTheme(storedTheme);
    } else {
        // Otherwise use device preference
        const theme = prefersDark.matches ? 'dark' : 'light';
        setTheme(theme);
    }
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('#sidebarThemeToggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Store user preference
    updateThemeIcon(newTheme);
}

// Initialize theme immediately and on DOM load
initTheme(); // Initialize immediately for login page

document.addEventListener('DOMContentLoaded', () => {
    // Re-initialize theme to ensure everything is set correctly
    initTheme();
    
    // Add click event listener to theme toggle button
    const themeToggle = document.getElementById('sidebarThemeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

// Notification/Toast function
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
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Alias for showNotification to maintain compatibility
const showToast = showNotification;

// Experience Functions
function addNewExperience() {
    // Reset form
    const experienceForm = document.getElementById('experienceForm');
    const experienceList = document.getElementById('experienceList');
    
    experienceForm.reset();
    currentExperienceId = null;
    
    // Show form and hide list
    experienceForm.style.display = 'block';
    experienceList.style.display = 'none';

    // Initialize rich text toolbar
    initializeRichTextToolbar();
}

function cancelExperience() {
    const experienceForm = document.getElementById('experienceForm');
    const experienceList = document.getElementById('experienceList');
    
    // Reset form
    experienceForm.reset();
    currentExperienceId = null;
    
    // Hide form and show list
    experienceForm.style.display = 'none';
    experienceList.style.display = 'block';
}

function initializeRichTextToolbar() {
    // Remove any existing toolbar and editor first
    const existingToolbar = document.querySelector('.rich-text-toolbar');
    const existingEditor = document.getElementById('experienceDescriptionEditor');
    if (existingToolbar) {
        existingToolbar.remove();
    }
    if (existingEditor) {
        existingEditor.remove();
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'rich-text-toolbar';
    toolbar.innerHTML = `
        <button type="button" onclick="formatText('bold')" title="Bold"><i class="fas fa-bold"></i></button>
        <button type="button" onclick="formatText('italic')" title="Italic"><i class="fas fa-italic"></i></button>
        <button type="button" onclick="formatText('underline')" title="Underline"><i class="fas fa-underline"></i></button>
        <div class="separator"></div>
        <button type="button" onclick="formatText('insertunorderedlist')" title="Bullet List"><i class="fas fa-list-ul"></i></button>
        <button type="button" onclick="formatText('insertorderedlist')" title="Numbered List"><i class="fas fa-list-ol"></i></button>
        <div class="separator"></div>
        <button type="button" onclick="createLink()" title="Insert Link"><i class="fas fa-link"></i></button>
    `;

    // Get the description container
    const descriptionContainer = document.getElementById('experienceDescription').parentNode;
    
    // Create a new contenteditable div for rich text
    const richTextEditor = document.createElement('div');
    richTextEditor.id = 'experienceDescriptionEditor';
    richTextEditor.className = 'rich-text-editor';
    richTextEditor.contentEditable = true;
    
    // Replace the textarea with the rich text editor
    const textarea = document.getElementById('experienceDescription');
    const content = textarea.value || '';
    richTextEditor.innerHTML = content;
    textarea.style.display = 'none';
    textarea.value = ''; // Clear the textarea
    
    // Insert toolbar and editor
    descriptionContainer.insertBefore(toolbar, textarea);
    descriptionContainer.insertBefore(richTextEditor, textarea);

    // Add styles for rich text editor
    if (!document.getElementById('richTextStyles')) {
        const style = document.createElement('style');
        style.id = 'richTextStyles';
        style.textContent = `
            .rich-text-toolbar {
                display: flex;
                gap: 5px;
                padding: 5px;
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-bottom: none;
                border-radius: 4px 4px 0 0;
                margin-bottom: 0;
            }
            .rich-text-toolbar button {
                padding: 5px 10px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 3px;
                cursor: pointer;
            }
            .rich-text-toolbar button:hover {
                background: #e9ecef;
            }
            .rich-text-toolbar .separator {
                width: 1px;
                background: #ddd;
                margin: 0 5px;
            }
            .rich-text-editor {
                min-height: 150px;
                border: 1px solid #ddd;
                border-radius: 0 0 4px 4px;
                padding: 10px;
                overflow-y: auto;
                background: white;
                margin-top: 0;
            }
            .rich-text-editor:focus {
                outline: none;
                border-color: #80bdff;
                box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
            }
            .rich-text-editor ul, .rich-text-editor ol {
                margin-left: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    // Add event listener to sync content back to textarea
    richTextEditor.addEventListener('input', function() {
        textarea.value = this.innerHTML;
    });
}

function formatText(command) {
    document.execCommand(command, false, null);
    // Focus back on the editor
    document.getElementById('experienceDescriptionEditor').focus();
}

function createLink() {
    const url = prompt('Enter URL:');
    if (url) {
        document.execCommand('createLink', false, url);
        // Focus back on the editor
        document.getElementById('experienceDescriptionEditor').focus();
    }
}

function getMonthName(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const [year, month] = date.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
}

function getMonthIndex(monthName) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const [month, year] = monthName.split(' ');
    const monthIndex = (months.indexOf(month) + 1).toString().padStart(2, '0');
    return `${year}-${monthIndex}`;
}

function editExperience(index) {
    const experience = currentExperiences[index];
    if (!experience) return;
    
    currentExperienceId = parseInt(index);
    document.getElementById('experienceTitle').value = experience.title;
    document.getElementById('experienceCompany').value = experience.company;
    
    // Initialize rich text toolbar
    initializeRichTextToolbar();
    
    // Set description in rich text editor
    const descriptionEditor = document.getElementById('experienceDescriptionEditor');
    const descriptionField = document.getElementById('experienceDescription');
    descriptionEditor.innerHTML = experience.description;
    descriptionField.value = experience.description;
    
    // Parse and set dates
    const [startDate] = experience.period.split(' to ');
    document.getElementById('experienceStart').value = getMonthIndex(startDate);
    
    const isCurrent = experience.period.includes('Present');
    document.getElementById('experienceCurrent').checked = isCurrent;
    
    if (!isCurrent) {
        const [, endDate] = experience.period.split(' to ');
        document.getElementById('experienceEnd').value = getMonthIndex(endDate);
    } else {
        document.getElementById('experienceEnd').value = '';
    }
    
    document.getElementById('experienceForm').style.display = 'block';
    document.getElementById('experienceList').style.display = 'none';
}

async function saveExperience(event) {
    // Prevent form submission
    if (event) {
        event.preventDefault();
    }
    
    try {
        const title = document.getElementById('experienceTitle').value;
        const company = document.getElementById('experienceCompany').value;
        const description = document.getElementById('experienceDescriptionEditor').innerHTML;
        const startDate = document.getElementById('experienceStart').value;
        const isCurrent = document.getElementById('experienceCurrent').checked;
        const endDate = isCurrent ? 'Present' : document.getElementById('experienceEnd').value;
        
        if (!title || !company || !startDate || !description || (!endDate && !isCurrent)) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const formattedStartDate = getMonthName(startDate);
        const formattedEndDate = isCurrent ? 'Present' : getMonthName(endDate);
        const period = `${formattedStartDate} to ${formattedEndDate}`;
        
        const experienceData = {
            title,
            company,
            description,
            period,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            current: isCurrent
        };
        
        const experiences = await loadExperienceContent() || [];
        
        if (typeof currentExperienceId === 'number' && currentExperienceId >= 0 && currentExperienceId < experiences.length) {
            // Update existing experience
            experiences[currentExperienceId] = {
                ...experiences[currentExperienceId],
                ...experienceData
            };
        } else {
            // Add new experience
            experiences.push(experienceData);
        }
        
        await updateExperience(experiences);
        await loadExperienceSection();
        
        // Reset form and hide it
        const experienceForm = document.getElementById('experienceForm');
        experienceForm.reset();
        experienceForm.style.display = 'none';
        document.getElementById('experienceList').style.display = 'block';
        currentExperienceId = null;
        
        showNotification('Experience saved successfully', 'success');
    } catch (error) {
        console.error('Error saving experience:', error);
        showNotification('Failed to save experience', 'error');
    }
}

// Add to window object immediately
window.addNewExperience = addNewExperience;
window.cancelExperience = cancelExperience;
window.editExperience = editExperience;
window.saveExperience = saveExperience;
window.formatText = formatText;
window.createLink = createLink;
window.showAddSkillDialog = showAddSkillDialog;
window.editSkillCategory = editSkillCategory;
window.deleteSkillCategory = deleteSkillCategory;
window.saveNewCategory = saveNewCategory;
window.confirmDeleteCategory = confirmDeleteCategory;
window.addSkillToCategory = addSkillToCategory;
window.removeSkillCategory = removeSkillCategory;
window.removeSkill = removeSkill;
window.updateSkillLevel = updateSkillLevel;
window.updateSkillIcon = updateSkillIcon;
window.createSkillEditItem = createSkillEditItem;
window.cancelSkillsEdit = cancelSkillsEdit;
window.expandCategory = expandCategory;

// Helper function to convert Google Drive URL to direct image URL
function convertGoogleDriveURL(url) {
    if (!url) return '';
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
        // Handle different Google Drive URL formats
        let fileId = '';
        
        // Format: https://drive.google.com/file/d/FILE_ID/view
        if (url.includes('/file/d/')) {
            fileId = url.split('/file/d/')[1].split('/')[0];
        }
        // Format: https://drive.google.com/open?id=FILE_ID
        else if (url.includes('?id=')) {
            fileId = url.split('?id=')[1].split('&')[0];
        }
        // Format: https://drive.google.com/uc?id=FILE_ID
        else if (url.includes('uc?id=')) {
            fileId = url.split('uc?id=')[1].split('&')[0];
        }
        
        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
    }
    return url;
}

// Helper function to generate unique ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Certification Functions
async function loadCertificationsContent() {
    try {
        const certifications = await loadCertifications();
        
        // Get certifications section
        const certificationsSection = document.getElementById('certificationsSection');
        const certificationsDisplay = document.getElementById('certificationsDisplay');
        const certificationsList = document.getElementById('certificationsList');
        
        if (certificationsList) {
            certificationsList.innerHTML = '';
            
            if (certifications.length === 0) {
                certificationsList.innerHTML = '<p class="no-items">No certifications added yet.</p>';
            } else {
                certifications.forEach(cert => {
                    // Separate files by type
                    const imageFiles = cert.files?.filter(f => f.type === 'image') || [];
                    const pdfFiles = cert.files?.filter(f => f.type === 'pdf') || [];
                    
                    const certDiv = document.createElement('div');
                    certDiv.className = 'certification-item';
                    certDiv.innerHTML = `
                        <div class="certification-header">
                            <div class="certification-title">
                                <h3>${cert.title}</h3>
                                <span class="organization">${cert.organization}</span>
                            </div>
                            <div class="certification-actions">
                                <button onclick="editCertification('${cert.id}')" class="btn-icon" title="Edit Certification">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteCertification('${cert.id}')" class="btn-icon delete" title="Delete Certification">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="certification-details">
                            ${cert.credentialId ? `
                                <div class="details-row">
                                    <div>Credential ID: ${cert.credentialId}</div>
                                </div>
                            ` : ''}
                            <div>Issued ${formatDate(cert.issueDate)}${cert.expiryDate ? ` | Expiry Date: ${formatDate(cert.expiryDate)}` : ''}</div>
                            <div class="mobile-order-wrapper">
                                ${cert.certificationSkills ? `<div class="certification-skills">Skills: ${cert.certificationSkills}</div>` : ''}
                                ${cert.credentialUrl ? `<button onclick="window.open('${cert.credentialUrl}', '_blank')" class="view-credential-btn">View Credential <i class="fas fa-external-link-alt"></i></button>` : ''}
                            </div>
                        </div>
                        ${cert.files && cert.files.length > 0 ? `
                            <div class="certification-files">
                                ${imageFiles.length > 0 ? `
                                    <div class="files-section">
                                        <div class="files-header" onclick="toggleFilesSection(this)">
                                            <h4><i class="fas fa-images"></i> Images</h4>
                                            <i class="fas fa-chevron-down"></i>
                                        </div>
                                        <div class="files-grid" style="display: none;">
                                            ${imageFiles.map(file => createFilePreview(file)).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                ${pdfFiles.length > 0 ? `
                                    <div class="files-section">
                                        <div class="files-header" onclick="toggleFilesSection(this)">
                                            <h4><i class="fas fa-file-pdf"></i> Documents</h4>
                                            <i class="fas fa-chevron-down"></i>
                                        </div>
                                        <div class="files-grid" style="display: none;">
                                            ${pdfFiles.map(file => createFilePreview(file)).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    `;
                    certificationsList.appendChild(certDiv);
                });
            }
        }
        
        return certifications;
    } catch (error) {
        console.error('Error loading certifications:', error);
        showNotification('Failed to load certifications', 'error');
        return [];
    }
}

// Add this function to window object for onclick access
window.toggleFilesSection = function(header) {
    const filesGrid = header.nextElementSibling;
    const icon = header.querySelector('.fa-chevron-down');
    const isHidden = filesGrid.style.display === 'none';
    
    filesGrid.style.display = isHidden ? 'flex' : 'none';
    header.classList.toggle('active', isHidden);
}

// Add certification functions to window object
window.addNewCertification = function() {
    document.getElementById('certificationsDisplay').style.display = 'none';
    document.getElementById('certificationsForm').style.display = 'block';
    document.getElementById('certificationForm').reset();
    document.getElementById('fileLinks').innerHTML = ''; // Clear file links
    currentCertificationId = null;
};

window.addFileLink = function() {
    const fileLinksContainer = document.getElementById('fileLinks');
    const fileLinkDiv = document.createElement('div');
    fileLinkDiv.className = 'file-link-group';
    fileLinkDiv.innerHTML = `
        <div class="form-group">
            <select class="file-type">
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
            </select>
            <input type="url" class="file-url" placeholder="Enter file URL (Direct URL or Google Drive URL)">
            <button type="button" class="btn secondary remove-file" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </div>
        <div class="file-preview"></div>
    `;
    fileLinksContainer.appendChild(fileLinkDiv);

    // Add event listener for URL input
    const urlInput = fileLinkDiv.querySelector('.file-url');
    const typeSelect = fileLinkDiv.querySelector('.file-type');
    const previewDiv = fileLinkDiv.querySelector('.file-preview');

    urlInput.addEventListener('input', function() {
        const url = this.value.trim();
        const type = typeSelect.value;

        if (url) {
            let fileId = '';
            if (url.includes('drive.google.com')) {
                if (url.includes('/file/d/')) {
                    fileId = url.split('/file/d/')[1].split('/')[0];
                } else if (url.includes('?id=')) {
                    fileId = url.split('?id=')[1].split('&')[0];
                } else if (url.includes('uc?id=')) {
                    fileId = url.split('uc?id=')[1].split('&')[0];
                }
            }

            switch(type) {
                case 'image':
                    const imageUrl = fileId ? 
                        `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : 
                        url;
                    previewDiv.innerHTML = `
                        <img src="${imageUrl}" alt="Preview" 
                            onerror="this.style.display='none'; this.parentElement.innerHTML='<p>Unable to load preview. Please ensure the file is publicly accessible.</p>'"
                            onload="this.style.display='block'"
                            style="display: none;">`;
                    break;
                case 'pdf':
                    // Extract filename from URL
                    let fileName = url.split('/').pop().split('?')[0];
                    if (fileId) {
                        fileName = 'Google Drive PDF';
                    }
                    previewDiv.innerHTML = `
                        <div class="pdf-preview">
                            <i class="fas fa-file-pdf"></i>
                            <span>${fileName}</span>
                            <a href="${url}" target="_blank" class="preview-link">View PDF</a>
                        </div>`;
                    break;
            }
        } else {
            previewDiv.innerHTML = '';
        }
    });

    typeSelect.addEventListener('change', function() {
        urlInput.dispatchEvent(new Event('input'));
    });
};

window.cancelCertification = function() {
    document.getElementById('certificationsDisplay').style.display = 'block';
    document.getElementById('certificationsForm').style.display = 'none';
    document.getElementById('certificationForm').reset();
    document.getElementById('fileLinks').innerHTML = ''; // Clear file links
    currentCertificationId = null;
};

window.editCertification = async function(certId) {
    try {
        const certifications = await loadCertifications();
        const certification = certifications.find(cert => cert.id === certId);
        
        if (certification) {
            document.getElementById('certificationTitle').value = certification.title;
            document.getElementById('certificationOrg').value = certification.organization;
            document.getElementById('certificationDate').value = certification.issueDate;
            document.getElementById('certificationExpiry').value = certification.expiryDate || '';
            document.getElementById('certificationId').value = certification.credentialId || '';
            document.getElementById('certificationUrl').value = certification.credentialUrl || '';
            document.getElementById('certificationSkills').value = certification.certificationSkills || '';
            
            // Clear existing file links
            const fileLinksContainer = document.getElementById('fileLinks');
            fileLinksContainer.innerHTML = '';
            
            // Add existing file links
            if (certification.files && certification.files.length > 0) {
                certification.files.forEach(file => {
                    const fileLinkDiv = document.createElement('div');
                    fileLinkDiv.className = 'file-link-group';
                    fileLinkDiv.innerHTML = `
                        <div class="form-group">
                            <select class="file-type">
                                <option value="image" ${file.type === 'image' ? 'selected' : ''}>Image</option>
                                <option value="pdf" ${file.type === 'pdf' ? 'selected' : ''}>PDF</option>
                            </select>
                            <input type="url" class="file-url" value="${file.url}" placeholder="Enter file URL (Direct URL or Google Drive URL)">
                            <button type="button" class="btn secondary remove-file" onclick="this.parentElement.parentElement.remove()">Remove</button>
                        </div>
                        <div class="file-preview"></div>
                    `;
                    fileLinksContainer.appendChild(fileLinkDiv);

                    // Trigger preview
                    const urlInput = fileLinkDiv.querySelector('.file-url');
                    urlInput.dispatchEvent(new Event('input'));
                });
            }

            currentCertificationId = certId;
            document.getElementById('certificationsDisplay').style.display = 'none';
            document.getElementById('certificationsForm').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading certification:', error);
        showNotification('Failed to load certification details', 'error');
    }
};

window.deleteCertification = async function(certId) {
    if (!confirm('Are you sure you want to delete this certification?')) {
        return;
    }

    try {
        const certifications = await loadCertifications();
        const updatedCertifications = certifications.filter(cert => cert.id !== certId);
        
        await setDoc(doc(db, 'content', 'certifications'), { certifications: updatedCertifications });
        await loadCertificationsContent();
        
        showNotification('Certification deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting certification:', error);
        showNotification('Failed to delete certification', 'error');
    }
};

window.loadCertificationsContent = loadCertificationsContent;

// Add form submission handler for Certification section
document.addEventListener('DOMContentLoaded', function() {
    const certificationForm = document.getElementById('certificationForm');
    if (certificationForm) {
        certificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
            
            try {
                // Collect all file links
                const fileLinks = Array.from(document.querySelectorAll('.file-link-group')).map(group => ({
                    type: group.querySelector('.file-type').value,
                    url: convertGoogleDriveURL(group.querySelector('.file-url').value)
                })).filter(file => file.url);

                const certificationData = {
                    id: currentCertificationId || Date.now().toString(),
                    title: document.getElementById('certificationTitle').value,
                    organization: document.getElementById('certificationOrg').value,
                    issueDate: document.getElementById('certificationDate').value,
                    expiryDate: document.getElementById('certificationExpiry').value || null,
                    credentialId: document.getElementById('certificationId').value,
                    credentialUrl: document.getElementById('certificationUrl').value,
                    certificationSkills: document.getElementById('certificationSkills').value,
                    files: fileLinks
                };

                await updateCertification(certificationData);
                
                showNotification('Certification saved successfully!', 'success');
                
                // Reset form and switch back to display view
                document.getElementById('certificationsDisplay').style.display = 'block';
                document.getElementById('certificationsForm').style.display = 'none';
                document.getElementById('certificationForm').reset();
                document.getElementById('fileLinks').innerHTML = '';
                currentCertificationId = null;
                
                // Reload certifications list
                await loadCertificationsContent();
                
            } catch (error) {
                console.error('Error saving certification:', error);
                showNotification('Failed to save certification: ' + error.message, 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
    }
});

// Add to window object immediately
window.cancelCertification = cancelCertification;
window.editCertification = editCertification;
window.replyAllSelected = replyAllSelected;

// Add form submission handler for Experience section
document.addEventListener('DOMContentLoaded', function() {
    const experienceForm = document.getElementById('experienceForm');
    if (experienceForm) {
        experienceForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveExperience(event);
        });
    }

    // Add form submission handler for Skills section
    const skillsForm = document.getElementById('skillsForm');
    if (skillsForm) {
        skillsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
            
            try {
                // Get all existing skills data
                const existingSkillsData = await loadSkills() || [];
                
                // Get the edited category data
                const editedCategory = document.querySelector('.skill-category-edit');
                const originalCategoryName = editedCategory.dataset.originalName;
                const newCategoryName = editedCategory.querySelector('.category-name').value;
                const editedCategoryData = {
                    name: newCategoryName,
                    skills: Array.from(editedCategory.querySelectorAll('.skill-edit-item')).map(item => ({
                name: item.querySelector('.skill-name').value,
                level: item.querySelector('.skill-level').value,
                icon: item.querySelector('.skill-icon').value,
                color: item.querySelector('.icon-color').value
                    })).filter(skill => skill.name && skill.icon)
                };

                // Update the category in the existing data
                const categoryIndex = existingSkillsData.findIndex(cat => cat.name === originalCategoryName);
                if (categoryIndex !== -1) {
                    existingSkillsData[categoryIndex] = editedCategoryData;
                }
                
                // Save all categories
                await updateSkills(existingSkillsData);
        await loadSkillsContent();
        
                showNotification('Skills updated successfully!', 'success');
        
        // Switch back to display view
        document.getElementById('skillsDisplay').style.display = 'block';
        document.getElementById('skillsForm').style.display = 'none';
        
    } catch (error) {
        console.error('Error updating skills:', error);
                showNotification('Failed to update skills: ' + error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
            }
        });
    }
});

// DOM Elements
const loginForm = document.getElementById('loginForm');
const adminDashboard = document.getElementById('adminDashboard');
const sections = document.querySelectorAll('.content-section');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');

// State Management
let currentSection = 'dashboard';
let editMode = false;
let currentExperiences = [];
let currentProjects = [];
let currentPosts = [];
let currentMessages = [];
let currentExperienceId = null;
let currentCertificationId = null;

// Function to update sidebar profile
async function updateSidebarProfile() {
    try {
        const profileData = await loadProfile();
        if (profileData) {
            const sidebarName = document.querySelector('.admin-info h3');
            const sidebarAvatar = document.querySelector('.admin-avatar');
            
            // Update name - show full name but use first name if too long
            const fullName = profileData.name;
            if (fullName.length > 15) { // Character limit for sidebar
                const firstName = fullName.split(' ')[0];
                sidebarName.textContent = firstName;
            } else {
                sidebarName.textContent = fullName;
            }
            
            // Update avatar
            if (profileData.imageUrl) {
                sidebarAvatar.src = profileData.imageUrl;
            } else {
                // Fallback to UI Avatars with the full name
                sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=4169E1&color=fff`;
            }
        }
    } catch (error) {
        console.error('Error updating sidebar profile:', error);
    }
}

// Initialize auth state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in - initialize everything but don't show dashboard yet
        // (loader is showing at this point from successful login)
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.style.display = 'none';
        
        await initializeSections();
        await loadAllContent();
        await updateSidebarProfile();
        
        // Now show the dashboard
        const adminDashboard = document.getElementById('adminDashboard');
        if (adminDashboard) {
            adminDashboard.style.display = 'block';
        }
        
        // Add logout event listeners
        const logoutBtn = document.querySelector('.btn-logout');
        const logoutMobile = document.querySelector('.nav-item.logout-mobile');
        
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                logout();
            };
        }
        
        if (logoutMobile) {
            logoutMobile.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                logout();
            };
        }
    } else {
        // User is signed out
        const loginForm = document.getElementById('loginForm');
        const adminDashboard = document.getElementById('adminDashboard');
        
        if (loginForm) loginForm.style.display = 'flex';
        if (adminDashboard) adminDashboard.style.display = 'none';
        
        // Clear form fields
        const emailField = document.getElementById('adminEmail');
        const passwordField = document.getElementById('adminPassword');
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
    }
});

// Initialize sections (hide all except dashboard)
function initializeSections() {
    sections.forEach(section => {
        if (section.id === 'dashboardSection') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    // Update breadcrumb for initial section
    document.querySelector('.breadcrumb span').textContent = 'Dashboard';

    // Move logout button after Settings for mobile
    const navItems = document.querySelector('.nav-items');
    const logoutContainer = document.querySelector('.logout-container');
    if (logoutContainer) {
        const logoutButton = logoutContainer.querySelector('button');
        const logoutMobile = document.createElement('a');
        logoutMobile.href = '#';
        logoutMobile.className = 'nav-item logout-mobile';
        logoutMobile.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
        logoutMobile.onclick = (e) => {
            e.preventDefault();
            logout();
        };
        
        // Insert after Settings nav item
        const settingsItem = document.querySelector('.nav-item[onclick*="settings"]');
        if (settingsItem && settingsItem.nextSibling) {
            navItems.insertBefore(logoutMobile, settingsItem.nextSibling);
        } else {
            navItems.appendChild(logoutMobile);
        }
        
        // Hide original logout container on mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .logout-container {
                    display: none !important;
                }
                .nav-item.logout-mobile {
                    display: flex !important;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    color: #dc3545;
                    margin-top: 0.5rem;
                    border-top: 1px solid #eee;
                }
                .nav-item.logout-mobile i {
                    margin-right: 0.75rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Content Loading Functions
async function loadAllContent() {
    try {
        // Initialize notifications
        await subscribeToNotifications();
        
        // Load initial data
        const [projects, posts, messages] = await Promise.all([
            loadProjects(),
            loadBlogPosts(),
            loadMessages()
        ]);

        currentProjects = projects || [];
        currentPosts = posts || [];
        currentMessages = messages || [];

        // Load all sections content
        await Promise.all([
            loadProfileContent(),
            loadAboutSection(),
            loadExperienceSection(),
            loadProjectsSection(),
            loadBlogSection(),
            loadSkillsContent(),
            loadCertificationsContent(),
            loadMessagesSection()
        ]);

        // Initial dashboard update
        updateDashboardUI();

        // Set up real-time subscriptions
        subscribeToStats((stats) => {
            updateDashboardUI();
        });

        subscribeToMessages((messages) => {
            currentMessages = messages;
            updateDashboardUI();
        });
        
    } catch (error) {
        console.error('Error loading content:', error);
        showNotification('Error loading content. Please try again.', 'error');
    }
}

// Helper function to update dashboard UI
function updateDashboardUI() {
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (!dashboardStats) return;

    const messageStats = calculateMessageStats(currentMessages);
    dashboardStats.innerHTML = `
        <div class="stat-card">
            <i class="fas fa-project-diagram"></i>
            <div class="stat-info">
                <h3>Projects</h3>
                <p id="projectCount">${currentProjects.length}</p>
            </div>
        </div>
        <div class="stat-card">
            <i class="fas fa-blog"></i>
            <div class="stat-info">
                <h3>Blog Posts</h3>
                <p id="blogCount">${currentPosts.length}</p>
            </div>
        </div>
        <div class="stat-card">
            <i class="fas fa-envelope"></i>
            <div class="stat-info">
                <h3>Messages</h3>
                <p id="messageCount">${messageStats.totalUniqueSenders}</p>
                <div class="stat-details">
                    <span><i class="fas fa-envelope"></i> <span id="unreadCount">${messageStats.sendersWithUnread}</span> unread</span>
                </div>
            </div>
        </div>
        <div class="stat-card">
            <i class="fas fa-eye"></i>
            <div class="stat-info">
                <h3>Views</h3>
                <p id="viewCount">0</p>
            </div>
        </div>
    `;
}

async function loadSectionContent(sectionId) {
    try {
        switch (sectionId) {
            case 'dashboard':
                await loadAllContent();
                break;
            case 'profile':
                await loadProfileContent();
                break;
            case 'about':
                await loadAboutSection();
                break;
            case 'experience':
                await loadExperienceSection();
                break;
            case 'projects':
                await loadProjectsSection();
                break;
            case 'blog':
                await loadBlogSection();
                break;
            case 'messages':
                await loadMessagesSection();
                break;
            case 'settings':
                loadSettings();
                break;
            case 'skills':
                await loadSkillsContent();
                break;
        }
    } catch (error) {
        console.error(`Error loading ${sectionId} content:`, error);
    }
}

// Track authentication attempts
let authAttempts = 0;

// Function to get stored auth attempts data
function getStoredAuthData() {
    const storedData = localStorage.getItem('authData');
    if (storedData) {
        const data = JSON.parse(storedData);
        // Check if the cooldown period has expired
        if (data.lockUntil && new Date().getTime() > data.lockUntil) {
            // Reset if cooldown is over
            localStorage.removeItem('authData');
            return { attempts: 0, lockUntil: null };
        }
        return data;
    }
    return { attempts: 0, lockUntil: null };
}

// Function to update stored auth attempts data
function updateStoredAuthData(attempts, lockUntil = null) {
    localStorage.setItem('authData', JSON.stringify({
        attempts,
        lockUntil
    }));
}

// Error messages
const errorMessages = {
    invalidCredentials: [
        "Invalid email or password. Please try again! 🔒",
        "Oops! Your credentials don't match our records! 🤔",
        "Access denied! Please check your details and try again! 🚫"
    ],
    tooManyAttempts: [
        "Too many login attempts! Please wait before trying again! 🛑",
        "Security check: Time to take a short break! ⏳",
        "Account protection activated. Please wait! 🛡️"
    ],
    firebaseLimit: [
        "Too many requests from this device! Please wait... ⚠️",
        "System protection activated. Try again later! 🔒",
        "Request limit reached. Take a break and try again! 🚫"
    ]
};

// Function to format time
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to show authentication error
function showAuthError(type, waitTime = 30) {
    const loginForm = document.getElementById('adminLoginForm');
    const loginBox = document.querySelector('.login-box');
    
    // Get random message based on type
    const messages = errorMessages[type];
    const message = messages[Math.floor(Math.random() * messages.length)];

    // Create error content
    const errorContent = `
        <div style="
            padding: 2rem !important;
            text-align: center !important;
            color: #ffffff !important;
            transform: scale(1) !important;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        ">
            <div style="
                font-size: 4rem !important;
                margin-bottom: 1.5rem !important;
                transform: scale(0.5) rotate(-180deg) !important;
                opacity: 0;
                transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
                transition-delay: 0.1s !important;
            ">
                ${type === 'invalidCredentials' ? '🔒' : '⚠️'}
            </div>
            <div style="
                font-size: 1.5rem !important;
                margin-bottom: 1rem !important;
                transform: translateY(20px) !important;
                opacity: 0;
                transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
                transition-delay: 0.2s !important;
            ">
                Access Denied!
            </div>
            <div style="
                font-size: 1.1rem !important;
                margin-bottom: 2rem !important;
                transform: translateY(20px) !important;
                opacity: 0;
                transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
                transition-delay: 0.3s !important;
            ">
                ${message}
                ${(type === 'tooManyAttempts' || type === 'firebaseLimit') ? `
                    <div id="timer" style="
                        margin-top: 1rem !important;
                        font-size: 0.9rem !important;
                        color: #ff4b4b !important;
                    ">
                        Please wait for ${formatTime(waitTime)} before trying again...
                    </div>
                ` : ''}
            </div>
            <button class="error-message-button" style="
                padding: 1.2rem 3rem !important;
                font-size: 1.2rem !important;
                border-radius: 0.8rem !important;
                background: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%) !important;
                color: white !important;
                border: none !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                margin: 0 auto !important;
                text-align: center !important;
                display: inline-block !important;
                font-weight: 500 !important;
                text-decoration: none !important;
                line-height: normal !important;
                box-shadow: 0 10px 20px -10px rgba(255, 65, 108, 0.5) !important;
                transform: translateY(20px) !important;
                opacity: 0;
                transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
                transition-delay: 0.4s !important;
                ${(type === 'tooManyAttempts' || type === 'firebaseLimit') ? 'opacity: 0.5 !important; cursor: not-allowed !important; filter: grayscale(1) !important;' : ''}
            ">
                Let me try again
            </button>
        </div>
    `;

    // Add transition to login box
    loginBox.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    // Animate out the login form
    loginForm.style.transition = 'all 0.3s ease';
    loginForm.style.transform = 'scale(0.8) translateY(-20px)';
    loginForm.style.opacity = '0';

    setTimeout(() => {
        // Replace content
        loginBox.innerHTML = errorContent;
        
        // Get all animated elements
        const container = loginBox.querySelector('div');
        const emoji = container.querySelector('div:nth-child(1)');
        const title = container.querySelector('div:nth-child(2)');
        const messageEl = container.querySelector('div:nth-child(3)');
        const button = container.querySelector('button');

        // Trigger animations
        requestAnimationFrame(() => {
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
            
            emoji.style.transform = 'scale(1) rotate(0deg)';
            emoji.style.opacity = '1';
            
            title.style.transform = 'translateY(0)';
            title.style.opacity = '1';
            
            messageEl.style.transform = 'translateY(0)';
            messageEl.style.opacity = '1';
            
            button.style.transform = 'translateY(0)';
            button.style.opacity = '1';
        });

        // Handle try again button
        const tryAgainButton = loginBox.querySelector('.error-message-button');
        if (tryAgainButton) {
            if (type === 'tooManyAttempts' || type === 'firebaseLimit') {
                let timeLeft = waitTime;
                const timerElement = loginBox.querySelector('#timer');
                const timerInterval = setInterval(() => {
                    timeLeft--;
                    if (timerElement) {
                        timerElement.textContent = `Please wait for ${formatTime(timeLeft)} before trying again...`;
                    }
                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        tryAgainButton.style.opacity = '1';
                        tryAgainButton.style.cursor = 'pointer';
                        tryAgainButton.style.filter = 'none';
                        if (timerElement) {
                            timerElement.textContent = "You can try again now!";
                            timerElement.style.color = '#4ade80 !important';
                        }
                        // Reset attempts counter after timeout
                        authAttempts = 0;
                        tryAgainButton.addEventListener('click', restoreLoginForm);
                    }
                }, 1000);
            } else {
                // For non-tooManyAttempts errors, always enable the button
                tryAgainButton.style.opacity = '1';
                tryAgainButton.style.cursor = 'pointer';
                tryAgainButton.style.filter = 'none';
                tryAgainButton.addEventListener('click', restoreLoginForm);
            }
        }
    }, 300);

    // Function to restore login form with animation
    function restoreLoginForm() {
        // Refresh the page instead of manually restoring the form
        window.location.reload();
    }
}

// Function to show loader after login
async function showLoader() {
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

    // Try to get profile name
    let profileName = 'Admin';
    try {
        const profileData = await loadProfileData();
        if (profileData?.name) {
            // Convert to Title Case (first letter capital, rest lowercase)
            profileName = profileData.name.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
    } catch (error) {
        console.warn('Error loading profile name:', error);
    }

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.innerHTML = `
        <div style="
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#1a1a1a'};
                font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        ">Hey, ${profileName}!</div>
        <div id="loaderMessage" style="
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#cccccc' : '#666666'};
            font-size: 1.1rem;
        ">Setting up your workspace...</div>
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
        "Setting up your workspace...",
        "Preparing your dashboard...",
        "Loading your content...",
        "Almost there...",
        "Just a few more moments..."
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

            // If minimum time has passed and content is loaded
            if (elapsedTime >= minLoadTime && document.readyState === 'complete') {
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

// Update the login form submission handler
document.getElementById('adminLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    // Get stored auth data
    const authData = getStoredAuthData();
    authAttempts = authData.attempts;

    // Check if user is in cooldown period
    if (authData.lockUntil && new Date().getTime() < authData.lockUntil) {
        const remainingTime = Math.ceil((authData.lockUntil - new Date().getTime()) / 1000);
        showAuthError('tooManyAttempts', remainingTime);
        return;
    }

    try {
        // Attempt login
        await signInWithEmailAndPassword(auth, email, password);
        // Reset attempts on successful login
        updateStoredAuthData(0);
        authAttempts = 0;
        // Show loader after successful login
        await showLoader();
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle error cases
        if (error.code === 'auth/too-many-requests') {
            const timeMatch = error.message.match(/Try again in (\d+) seconds/);
            const waitTime = timeMatch ? parseInt(timeMatch[1]) : 30;
            const lockUntil = new Date().getTime() + (waitTime * 1000);
            authAttempts = 3;
            updateStoredAuthData(authAttempts, lockUntil);
            showAuthError('firebaseLimit', waitTime);
            return;
        }
        
        // Increment attempts
        authAttempts++;
        updateStoredAuthData(authAttempts);

        // Show too many attempts error if needed
        if (authAttempts >= 3) {
            const lockUntil = new Date().getTime() + (30 * 1000);
            updateStoredAuthData(authAttempts, lockUntil);
            showAuthError('tooManyAttempts', 30);
            return;
        }

        // For all other errors, show invalid credentials
        showAuthError('invalidCredentials');
    }
});

// Sidebar Toggle
sidebarToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    } else {
        sidebar.classList.add('active');
        document.body.classList.add('sidebar-open');
    }
});

// Close sidebar when clicking on navigation items
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const sidebar = document.querySelector('.sidebar');
        const sectionId = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (sectionId) {
            sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            showSection(sectionId);
        }
    });
});

// Close sidebar when clicking outside
document.addEventListener('click', function(e) {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (!sidebar || !sidebarToggle) return;
    
    const isClickInside = sidebar.contains(e.target) || sidebarToggle.contains(e.target);
    if (!isClickInside && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }
});

// Section Navigation
function showSection(sectionId) {
    currentSection = sectionId;
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    document.getElementById(`${sectionId}Section`).style.display = 'block';
    
    // Handle messages section elements visibility
    const messagesList = document.getElementById('messagesList');
    const messageStats = document.getElementById('messageStats');
    const bulkActions = document.getElementById('bulkActions');
    
    // Show appropriate message elements only in messages section
    if (sectionId === 'messages') {
        if (messagesList) messagesList.style.display = 'block';
        if (messageStats) messageStats.style.display = 'block';
        if (bulkActions) bulkActions.style.display = 'none';
    }
    
    // Update breadcrumb
    const breadcrumbText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    document.querySelector('.breadcrumb span').textContent = breadcrumbText;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick*="'${sectionId}'"]`).classList.add('active');
    
    // Load section content
    loadSectionContent(sectionId);
    
    // Load certifications when certification section is shown
    if (sectionId === 'certifications') {
        loadCertificationsContent();
    }
}

// Add to window object
window.showSection = showSection;

// Section Loading Functions
async function loadProfileContent() {
    try {
        const [profileData, aboutContent] = await Promise.all([
            loadProfile(),
            loadAboutContent()
        ]);
        
        const profileSection = document.getElementById('profileSection');
        const form = document.getElementById('profileForm');
        
        // Create read-only view
        const readView = document.createElement('div');
        readView.className = 'read-view';
        readView.innerHTML = `
            <div class="section-content">
                <div style="text-align: right; margin-bottom: 1rem;">
                    <button onclick="enableEditMode('profile')" class="btn-icon" title="Edit Profile">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                <div class="profile-header" style="flex-direction: column; align-items: center; text-align: center; margin-bottom: 1rem;">
                    <div class="profile-image" style="width: 200px; height: 200px; margin-bottom: 0.5rem;">
                        <img src="${profileData?.imageUrl ? convertGoogleDriveUrl(profileData.imageUrl) : 'https://ui-avatars.com/api/?name=Admin&background=4169E1&color=fff'}" alt="Profile Image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    </div>
                    <div class="profile-info">
                        <h2 style="font-size: 2rem; color: #4169E1; margin: 0.5rem 0;">${profileData?.name || 'Your Name'}</h2>
                        <div class="titles">
                            ${profileData?.titles?.map(title => `<span>${title}</span>`).join('') || ''}
                        </div>
                        ${profileData?.company ? `<p style="font-size: 1.2rem; color: #666; margin: 0.5rem 0;"><i class="fas fa-building"></i> ${profileData.company}</p>` : ''}
                    </div>
                </div>
                <div class="about-content" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 2rem; border-radius: 1rem; margin: 2rem 0; position: relative;">
                    <i class="fas fa-quote-left" style="font-size: 2rem; color: #4169E1; opacity: 0.3; margin-right: 1rem;"></i>
                    <div style="font-size: 1.1rem; line-height: 1.6; text-align: justify; margin: 1rem 0;">
                        ${aboutContent?.bio || aboutContent?.content || 'No bio available'}
                        <i class="fas fa-quote-right" style="font-size: 2rem; color: #4169E1; opacity: 0.3; margin-right: 1rem;"></i>
                    </div>
                    <div class="signature-container" style="padding: 0; text-align: right; margin-top: 1rem;">
                        <div class="signature-name">
                            ${profileData?.name || 'Your Name'}
                        </div>
                        <div class="typing-titles-container">
                            <div class="typing-title"></div>
                        </div>
                    </div>
                </div>
                <div class="social-links" style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;">
                    ${profileData?.socialLinks?.map(social => `
                        <a href="${social.url}" target="_blank" class="social-link">
                            <i class="${social.icon}" style="color: ${social.color}"></i>
                        </a>
                    `).join('') || ''}
                </div>
            </div>
        `;
        
        // Update form values for edit mode
        if (profileData) {
            document.getElementById('profileName').value = profileData.name || '';
            document.getElementById('profileImageUrl').value = profileData.imageUrl || '';
            document.getElementById('profileResumeUrl').value = profileData.resumeUrl || '';
            document.getElementById('profileCompany').value = profileData.company || '';
            
            // Load titles
            const titlesList = document.getElementById('titlesList');
            titlesList.innerHTML = '';
            if (profileData.titles && profileData.titles.length > 0) {
                profileData.titles.forEach(title => addTitleField(title));
            } else {
                addTitleField();
            }
            
            // Load social links
            const socialLinks = document.getElementById('socialLinks');
            socialLinks.innerHTML = '';
            if (profileData.socialLinks && profileData.socialLinks.length > 0) {
                profileData.socialLinks.forEach(link => addSocialLinkField(link.icon, link.url, link.color));
            } else {
                addSocialLinkField();
            }
        }
        
        // Hide the form and show read view
        form.style.display = 'none';
        const existingReadView = profileSection.querySelector('.read-view');
        if (existingReadView) {
            existingReadView.replaceWith(readView);
        } else {
            profileSection.insertBefore(readView, form);
        }

        // Add Chairman font for signature
        if (!document.querySelector('link[href*="Chairman"]')) {
            const link = document.createElement('link');
            link.href = 'https://fonts.cdnfonts.com/css/the-chairman';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Add typing animation for titles
        const style = document.createElement('style');
        style.textContent = `
            .typing-titles {
                overflow: hidden;
                white-space: nowrap;
                border-right: 2px solid #666;
                animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
            }
            
            @keyframes typing {
                from { width: 0 }
                to { width: 100% }
            }
            
            @keyframes blink-caret {
                from, to { border-color: transparent }
                50% { border-color: #666; }
            }
        `;
        document.head.appendChild(style);

        // Add typing animation for titles
        if (profileData?.titles?.length) {
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
                        setTimeout(erase, 50);
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
    } catch (error) {
        console.error('Error loading profile content:', error);
        showNotification('Failed to load profile data', 'error');
    }
}

// Remove all other profile form event listeners and keep only this one
document.getElementById('profileForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    try {
        const name = document.getElementById('profileName').value.trim();
        const imageUrl = document.getElementById('profileImageUrl').value.trim();
        const resumeUrl = document.getElementById('profileResumeUrl').value.trim();
        const company = document.getElementById('profileCompany').value.trim();
        
        // Get titles
        const titleInputs = document.querySelectorAll('.title-input');
        const titles = Array.from(titleInputs)
            .map(input => input.value.trim())
            .filter(title => title !== '');
        
        // Get social links with icons and colors
        const socialLinkItems = document.querySelectorAll('.social-link-item');
        const socialLinks = Array.from(socialLinkItems)
            .map(item => ({
                icon: item.querySelector('.social-icon').value,
                color: item.querySelector('.social-color').value,
                url: item.querySelector('.social-url').value.trim()
            }))
            .filter(link => link.icon && link.url);
        
        const profileData = {
            name,
            imageUrl,
            resumeUrl,
            company,
            titles,
            socialLinks
        };
        
        await updateProfile(profileData);
        await loadProfileContent();
        
        // Switch back to read mode
        const profileSection = document.getElementById('profileSection');
        setReadMode(profileSection);
        
        showNotification('Profile updated successfully', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile', 'error');
    }
});

function addTitleField(title = '') {
    const titlesContainer = document.getElementById('titlesList');
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title-item';
    titleDiv.innerHTML = `
        <input type="text" class="title-input" value="${title}" placeholder="Enter title">
        <button type="button" class="btn-icon" onclick="removeTitleField(this)" title="Remove Title">
            <i class="fas fa-times"></i>
        </button>
    `;
    titlesContainer.appendChild(titleDiv);
}

function removeTitleField(button) {
    button.closest('.title-item').remove();
}

function addSocialLinkField(icon = 'fab fa-github', url = '', color = '#4169E1') {
    const linkDiv = document.createElement('div');
    linkDiv.className = 'social-link-item';
    linkDiv.innerHTML = `
        <div class="icon-input-group">
            <div class="icon-preview" style="color: ${color}">
                <i class="${icon}"></i>
            </div>
            <div class="input-wrapper" style="flex: 1;">
                <input type="text" class="social-icon" value="${icon}" placeholder="Enter Font Awesome class (e.g., fab fa-github)">
                <small class="form-text text-muted">Select icon from <a href="https://fontawesome.com/v5/search" target="_blank">Font Awesome v5</a></small>
            </div>
            <input type="color" class="social-color" value="${color}">
        </div>
        <input type="url" class="social-url" value="${url}" placeholder="Enter URL">
        <button type="button" class="btn-icon" onclick="removeSocialLink(this)" title="Remove Link">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add event listeners for icon preview
    const iconInput = linkDiv.querySelector('.social-icon');
    const iconPreview = linkDiv.querySelector('.icon-preview i');
    const colorInput = linkDiv.querySelector('.social-color');

    iconInput.addEventListener('input', function() {
        iconPreview.className = this.value;
    });

    colorInput.addEventListener('input', function() {
        iconPreview.style.color = this.value;
    });

    const socialLinksContainer = document.getElementById('socialLinks');
    socialLinksContainer.appendChild(linkDiv);
}

function removeSocialLink(button) {
    button.closest('.social-link-item').remove();
}

function cancelProfileEdit() {
    const profileSection = document.getElementById('profileSection');
    const form = profileSection.querySelector('form');
    if (form) {
        form.reset();
        loadProfileContent(); // Reload the current data
        setReadMode(profileSection);
    }
}

// Add to window object
window.addTitleField = addTitleField;
window.removeTitleField = removeTitleField;
window.addSocialLinkField = addSocialLinkField;
window.removeSocialLink = removeSocialLink;
window.cancelProfileEdit = cancelProfileEdit;
window.enableEditMode = enableEditMode; // Add this line

async function loadAboutSection() {
    const content = await loadAboutContent();
    const aboutSection = document.getElementById('aboutSection');
    
    // Create read-only view
    const readView = document.createElement('div');
    readView.className = 'read-view';
    readView.innerHTML = `
        <div class="section-header">
            <h2>About Me</h2>
            <button onclick="enableEditMode('about')" class="btn-icon" title="Edit About">
                <i class="fas fa-edit"></i>
            </button>
        </div>
        <div class="section-content">
            <div class="about-content">
                <div class="about-text">${content?.bio || 'No bio available'}</div>
            </div>
            
            <div class="widgets-section">
                <div class="section-header">
                <h3>Widgets</h3>
                    <button onclick="showAddWidgetDialog()" class="btn-icon" title="Add Widget">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="widgets-grid" id="widgetsGrid">
                    ${content?.widgets?.map(widget => `
                        <div class="widget-card">
                            <div class="widget-icon">
                                <i class="${widget.icon}" style="color: ${widget.iconColor}"></i>
                            </div>
                            <div class="widget-content">
                                <h4>${widget.heading}</h4>
                                <p>${widget.subheading}</p>
                                ${widget.additionalFields?.length ? `
                                    <div class="widget-fields">
                                        ${widget.additionalFields.map(field => `
                                            <div class="widget-field-item">
                                                <span class="field-name">${field.name}</span>
                                                ${field.value ? `<span class="field-value">${field.value}</span>` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="widget-actions">
                                <button onclick="editWidget('${widget.id}')" class="btn-icon" title="Edit Widget">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteWidget('${widget.id}')" class="btn-icon" title="Delete Widget">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('') || ''}
                </div>
            </div>
        </div>
    `;
    
    // Get or create edit form
    let form = aboutSection.querySelector('form');
    if (!form) {
        form = document.createElement('form');
        aboutSection.appendChild(form);
    }
    
    form.style.display = 'none';
    form.innerHTML = `
        <div class="form-group">
            <label>About Me</label>
            <div class="rich-text-editor" id="aboutEditor" contenteditable="true">
                ${content?.bio || ''}
            </div>
        </div>
        
        <div class="form-actions">
            <button type="submit" class="btn primary">Save Changes</button>
            <button type="button" class="btn" onclick="cancelAboutEdit()">Cancel</button>
        </div>
    `;
    
    // Update the section content
    const existingReadView = aboutSection.querySelector('.read-view');
    if (existingReadView) {
        existingReadView.replaceWith(readView);
    } else {
        aboutSection.insertBefore(readView, form);
    }
}

function showAddWidgetDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.style.display = 'block';
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Widget</h3>
                <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <div class="form-group">
                    <label>Icon</label>
                    <div class="icon-input">
                        <div class="icon-field">
                            <input type="text" id="widgetIcon" class="form-control" 
                                placeholder="fa-brands fa-html5" oninput="previewWidgetIcon(this)">
                            <i class="" id="widgetIconPreview"></i>
                        </div>
                        <div class="color-field">
                            <input type="color" id="widgetIconColor" value="#000000" 
                                oninput="previewWidgetIcon(document.getElementById('widgetIcon'))">
                            <span class="color-preview" style="background-color: #000000"></span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Heading</label>
                    <input type="text" id="widgetHeading" class="form-control" placeholder="Enter heading">
                </div>
                <div class="form-group">
                    <label>Subheading</label>
                    <input type="text" id="widgetSubheading" class="form-control" placeholder="Enter subheading">
                </div>
                <div class="form-group">
                    <label>Additional Fields</label>
                    <div id="additionalFields" class="additional-fields">
                        <!-- Additional fields will be added here -->
                    </div>
                    <button type="button" class="btn secondary" onclick="addWidgetField()" style="margin-top: 12px;">
                        <i class="fas fa-plus"></i> Add Field
                    </button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn primary" onclick="saveWidget(this)">Add Widget</button>
                    <button type="button" class="btn" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
}

function previewWidgetIcon(input) {
    const preview = document.getElementById('widgetIconPreview');
    const colorInput = document.getElementById('widgetIconColor');
    const colorPreview = colorInput.nextElementSibling;
    
    preview.className = input.value;
    preview.style.color = colorInput.value;
    colorPreview.style.backgroundColor = colorInput.value;
}

function addWidgetField() {
    const container = document.getElementById('additionalFields');
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'widget-field';
    fieldDiv.innerHTML = `
        <div class="field-row">
            <input type="text" class="form-control" placeholder="Field name">
            <input type="text" class="form-control" placeholder="Field value">
            <button type="button" class="btn-icon remove" onclick="removeWidgetField(this)" title="Remove Field">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    container.appendChild(fieldDiv);
}

function removeWidgetField(button) {
    button.closest('.widget-field').remove();
}

async function saveWidget(button) {
    const modal = button.closest('.modal');
    const icon = document.getElementById('widgetIcon').value.trim();
    const iconColor = document.getElementById('widgetIconColor').value;
    const heading = document.getElementById('widgetHeading').value.trim();
    const subheading = document.getElementById('widgetSubheading').value.trim();
    
    // Get additional fields and check for incomplete fields
    const allFields = Array.from(document.querySelectorAll('.widget-field')).map(field => {
        const inputs = field.querySelectorAll('input');
        return {
            name: inputs[0].value.trim(),
            value: inputs[1].value.trim(),
            isIncomplete: !inputs[0].value.trim() || !inputs[1].value.trim()
        };
    });
    
    // Check for incomplete fields
    const incompleteFields = allFields.filter(field => field.isIncomplete);
    if (incompleteFields.length > 0) {
        const warningDialog = document.createElement('div');
        warningDialog.className = 'modal';
        warningDialog.style.display = 'block';
        warningDialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Warning</h3>
                    <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <div class="alert alert-warning">
                        <p>Some fields are incomplete. Incomplete fields will be ignored.</p>
                        <p>Do you want to continue?</p>
                    </div>
                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="button" class="btn primary" onclick="proceedWithSave(this)">Continue</button>
                        <button type="button" class="btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(warningDialog);
        return;
    }
    
    await saveWidgetData(modal);
}

async function saveWidgetData(modal) {
    const icon = document.getElementById('widgetIcon').value.trim();
    const iconColor = document.getElementById('widgetIconColor').value;
    const heading = document.getElementById('widgetHeading').value.trim();
    const subheading = document.getElementById('widgetSubheading').value.trim();
    
    // Get additional fields - allow fields with only names
    const additionalFields = Array.from(document.querySelectorAll('.widget-field'))
        .map(field => {
            const inputs = field.querySelectorAll('input');
            const name = inputs[0].value.trim();
            const value = inputs[1].value.trim();
            // Return field if at least the name is filled
            return name ? { name, value } : null;
        })
        .filter(field => field !== null); // Remove null entries
    
    if (!icon || !heading || !subheading) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const content = await loadAboutContent() || {};
        const widgets = content.widgets || [];
        
        widgets.push({
            id: Date.now().toString(),
            icon,
            iconColor,
            heading,
            subheading,
            additionalFields
        });
        
        content.widgets = widgets;
        await updateAbout(content);
        await loadAboutSection();
        
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    } catch (error) {
        console.error('Error saving widget:', error);
        alert('Failed to save widget');
    }
}

async function editWidget(widgetId) {
    const content = await loadAboutContent();
    const widget = content.widgets.find(w => w.id === widgetId);
    
    if (!widget) {
        alert('Widget not found');
        return;
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.style.display = 'block';
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Widget</h3>
                <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <div class="form-group">
                    <label>Icon</label>
                    <div class="icon-input">
                        <div class="icon-field">
                            <input type="text" id="widgetIcon" class="form-control" 
                                value="${widget.icon}" oninput="previewWidgetIcon(this)">
                            <i class="${widget.icon}" id="widgetIconPreview" style="color: ${widget.iconColor}"></i>
                        </div>
                        <div class="color-field">
                            <input type="color" id="widgetIconColor" value="${widget.iconColor}" 
                                oninput="previewWidgetIcon(document.getElementById('widgetIcon'))">
                            <span class="color-preview" style="background-color: ${widget.iconColor}"></span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Heading</label>
                    <input type="text" id="widgetHeading" class="form-control" value="${widget.heading}">
                </div>
                <div class="form-group">
                    <label>Subheading</label>
                    <input type="text" id="widgetSubheading" class="form-control" value="${widget.subheading}">
                </div>
                <div class="form-group">
                    <label>Additional Fields</label>
                    <div id="additionalFields" class="additional-fields">
                        ${widget.additionalFields?.map(field => `
                            <div class="widget-field">
                                <div class="field-row">
                                    <input type="text" class="form-control" placeholder="Field name" value="${field.name}">
                                    <input type="text" class="form-control" placeholder="Field value" value="${field.value}">
                                    <button type="button" class="btn-icon remove" onclick="removeWidgetField(this)" title="Remove Field">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') || ''}
                    </div>
                    <button type="button" class="btn secondary" onclick="addWidgetField()" style="margin-top: 12px;">
                        <i class="fas fa-plus"></i> Add Field
                    </button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn primary" onclick="updateWidget('${widgetId}', this)">Save Changes</button>
                    <button type="button" class="btn" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
}

async function updateWidget(widgetId, button) {
    const modal = button.closest('.modal');
    const icon = document.getElementById('widgetIcon').value.trim();
    const iconColor = document.getElementById('widgetIconColor').value;
    const heading = document.getElementById('widgetHeading').value.trim();
    const subheading = document.getElementById('widgetSubheading').value.trim();
    
    // Get additional fields and check for incomplete fields
    const allFields = Array.from(document.querySelectorAll('.widget-field')).map(field => {
        const inputs = field.querySelectorAll('input');
        return {
            name: inputs[0].value.trim(),
            value: inputs[1].value.trim(),
            isIncomplete: !inputs[0].value.trim() || !inputs[1].value.trim()
        };
    });
    
    // Check for incomplete fields
    const incompleteFields = allFields.filter(field => field.isIncomplete);
    if (incompleteFields.length > 0) {
        const warningDialog = document.createElement('div');
        warningDialog.className = 'modal';
        warningDialog.style.display = 'block';
        warningDialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Warning</h3>
                    <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <div class="alert alert-warning">
                        <p>Some fields are incomplete. Incomplete fields will be ignored.</p>
                        <p>Do you want to continue?</p>
                    </div>
                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="button" class="btn primary" onclick="proceedWithUpdate('${widgetId}', this)">Continue</button>
                        <button type="button" class="btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(warningDialog);
        return;
    }
    
    await updateWidgetData(widgetId, modal);
}

async function updateWidgetData(widgetId, modal) {
    const icon = document.getElementById('widgetIcon').value.trim();
    const iconColor = document.getElementById('widgetIconColor').value;
    const heading = document.getElementById('widgetHeading').value.trim();
    const subheading = document.getElementById('widgetSubheading').value.trim();
    
    // Get additional fields - allow fields with only names
    const additionalFields = Array.from(document.querySelectorAll('.widget-field'))
        .map(field => {
            const inputs = field.querySelectorAll('input');
            const name = inputs[0].value.trim();
            const value = inputs[1].value.trim();
            // Return field if at least the name is filled
            return name ? { name, value } : null;
        })
        .filter(field => field !== null); // Remove null entries
    
    if (!icon || !heading || !subheading) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const content = await loadAboutContent();
        const widgetIndex = content.widgets.findIndex(w => w.id === widgetId);
        
        if (widgetIndex === -1) {
            throw new Error('Widget not found');
        }
        
        content.widgets[widgetIndex] = {
            ...content.widgets[widgetIndex],
            icon,
            iconColor,
            heading,
            subheading,
            additionalFields
        };
        
        await updateAbout(content);
        await loadAboutSection();
        
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    } catch (error) {
        console.error('Error updating widget:', error);
        alert('Failed to update widget');
    }
}

async function proceedWithSave(button) {
    const warningModal = button.closest('.modal');
    const originalModal = document.querySelector('.modal:not([style*="display: none"]):not(:last-child)');
    
    try {
    await saveWidgetData(originalModal);
        // Close both modals
    warningModal.remove();
        originalModal.remove();
    } catch (error) {
        console.error('Error saving widget:', error);
        // Close warning modal but keep original modal open in case of error
        warningModal.remove();
        alert('Failed to save widget');
    }
}

async function proceedWithUpdate(widgetId, button) {
    const warningModal = button.closest('.modal');
    const originalModal = document.querySelector('.modal:not([style*="display: none"]):not(:last-child)');
    
    try {
    await updateWidgetData(widgetId, originalModal);
        // Close both modals
    warningModal.remove();
        originalModal.remove();
    } catch (error) {
        console.error('Error updating widget:', error);
        // Close warning modal but keep original modal open in case of error
        warningModal.remove();
        alert('Failed to update widget');
    }
}

async function deleteWidget(widgetId) {
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.style.display = 'block';
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Delete Widget</h3>
                <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <div class="alert alert-warning">
                    <p>Are you sure you want to delete this widget?</p>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn primary" onclick="confirmDeleteWidget('${widgetId}', this)">Delete Widget</button>
                    <button type="button" class="btn" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
}

async function confirmDeleteWidget(widgetId, button) {
    const modal = button.closest('.modal');
    
    try {
        const content = await loadAboutContent();
        content.widgets = content.widgets.filter(w => w.id !== widgetId);
        
        await updateAbout(content);
        await loadAboutSection();
        modal.remove();
    } catch (error) {
        console.error('Error deleting widget:', error);
        alert('Failed to delete widget');
    }
}

// Add form submission handler for About section
document.getElementById('aboutSection').addEventListener('submit', async function(e) {
    if (e.target.tagName === 'FORM') {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        
        try {
            const content = await loadAboutContent() || {};
            content.bio = document.getElementById('aboutEditor').innerHTML;
            
            await updateAbout(content);
            await loadAboutSection();
            
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        } catch (error) {
            console.error('Error updating about section:', error);
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            alert('Failed to update about section');
        }
    }
});

function cancelAboutEdit() {
    const aboutSection = document.getElementById('aboutSection');
    const form = aboutSection.querySelector('form');
    const readView = aboutSection.querySelector('.read-view');
    
    if (form) form.style.display = 'none';
    if (readView) readView.style.display = 'block';
    
    // Reload the section to reset any changes
    loadAboutSection();
}

// Add to window object
window.showAddWidgetDialog = showAddWidgetDialog;
window.previewWidgetIcon = previewWidgetIcon;
window.addWidgetField = addWidgetField;
window.removeWidgetField = removeWidgetField;
window.saveWidget = saveWidget;
window.editWidget = editWidget;
window.updateWidget = updateWidget;
window.deleteWidget = deleteWidget;
window.confirmDeleteWidget = confirmDeleteWidget;
window.cancelAboutEdit = cancelAboutEdit;
window.proceedWithSave = proceedWithSave;
window.proceedWithUpdate = proceedWithUpdate;

async function loadExperienceSection() {
    try {
        const experiences = await loadExperienceContent();
        currentExperiences = experiences || [];
        const experienceSection = document.getElementById('experienceSection');
        const experienceList = document.getElementById('experienceList');
        
        if (!experienceList) {
            console.error('Experience list element not found');
            return;
        }
        
        experienceList.innerHTML = '';
        
        if (currentExperiences.length === 0) {
            experienceList.innerHTML = '<p class="text-muted">No experiences added yet.</p>';
            return;
        }
        
        currentExperiences.forEach((experience, index) => {
            const experienceItem = document.createElement('div');
            experienceItem.className = 'experience-item';
            experienceItem.innerHTML = `
                <div class="experience-header">
                    <div class="title-section">
                        <h3>${experience.title}</h3>
                        <button onclick="showExperienceInfo('${index}')" class="btn-icon info-icon" title="View Details">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                    <div class="experience-actions">
                        <button onclick="editExperience('${index}')" class="btn-icon" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="confirmDeleteExperience('${index}')" class="btn-icon" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="company">${experience.company}</p>
                <p class="period">${experience.period}</p>
            `;
            experienceList.appendChild(experienceItem);
        });
    } catch (error) {
        console.error('Failed to load experiences:', error);
        showToast('Failed to load experiences', 'error');
    }
}

// Function to show experience info in modal
function showExperienceInfo(index) {
    const experience = currentExperiences[index];
    if (!experience) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${experience.title} at ${experience.company}</h3>
                <button onclick="this.closest('.modal').remove()" class="close">&times;</button>
            </div>
            <div class="modal-body">
                <p class="period">${experience.period}</p>
                <p class="description">${experience.description}</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Function to confirm experience deletion
function confirmDeleteExperience(index) {
    if (confirm('Are you sure you want to delete this experience?')) {
        deleteExperience(index);
    }
}

// Function to delete experience
async function deleteExperience(index) {
    try {
        const experiences = await loadExperienceContent();
        experiences.splice(index, 1);
        await updateExperience(experiences);
        await loadExperienceSection();
        showToast('Experience deleted successfully', 'success');
    } catch (error) {
        console.error('Failed to delete experience:', error);
        showToast('Failed to delete experience', 'error');
    }
}

// Add functions to window object
window.showExperienceInfo = showExperienceInfo;
window.editExperience = editExperience;
window.confirmDeleteExperience = confirmDeleteExperience;
window.deleteExperience = deleteExperience;

// Remove project and blog modal functions
async function loadProjectsSection() {
    try {
        currentProjects = await loadProjects();
        const projectsSection = document.getElementById('projectsSection');
        const projectsDisplay = projectsSection.querySelector('.projects-display');
        
        if (!projectsDisplay) {
            console.error('Projects display element not found');
            return;
        }
        
        projectsDisplay.innerHTML = '';
        
        if (currentProjects.length === 0) {
            projectsDisplay.innerHTML = '<p class="text-muted">No projects added yet.</p>';
            return;
        }
        
        currentProjects.forEach((project, index) => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item mb-4';
            projectItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h4 class="mb-1">${project.title}</h4>
                        <p class="mb-2">${project.description}</p>
                        <div class="technologies mb-2">
                            ${project.technologies.map(tech => `<span class="badge bg-secondary me-1">${tech}</span>`).join('')}
                        </div>
                        <div class="project-links">
                            ${project.projectUrl ? `
                                <a href="${project.projectUrl}" target="_blank" class="btn btn-sm btn-primary me-2">
                                    <i class="fas fa-external-link-alt"></i> View Project
                                </a>
                            ` : ''}
                            ${project.githubUrl ? `
                                <a href="${project.githubUrl}" target="_blank" class="btn btn-sm btn-secondary">
                                    <i class="fab fa-github"></i> View Code
                                </a>
                            ` : ''}
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-link text-primary p-0 me-2" onclick="editProject(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-link text-danger p-0" onclick="deleteProject('${project.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <hr>
            `;
            projectsDisplay.appendChild(projectItem);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Failed to load projects', 'error');
    }
}

async function loadBlogSection() {
    try {
        const posts = await loadBlogPosts();
        currentPosts = posts || [];
        const blogSection = document.getElementById('blogSection');
        
        // Create read-only view
        const readView = document.createElement('div');
        readView.className = 'read-view';
        readView.innerHTML = `
            <div class="section-header">
                <h2>Blog Posts</h2>
                <button onclick="enableEditMode('blog')" class="btn-icon" title="Add Blog Post">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="section-content">
                <div id="blogList" class="blog-grid">
                    ${currentPosts.map(post => `
                        <div class="blog-card">
                            <div class="card-image">
                                ${post.image ? 
                                    `<img src="${post.image}" alt="${post.title}">` : 
                                    '<div class="no-image">No Image</div>'
                                }
        </div>
        <div class="card-content">
            <h3>${post.title}</h3>
            <p>${post.content.substring(0, 150)}...</p>
            <div class="tags">
                                    ${post.tags.map(tag => 
                                        `<span class="tag">${tag}</span>`
                                    ).join('')}
            </div>
            <div class="card-actions">
                <button onclick="editBlogPost('${post.id}')" class="btn-icon" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="handleDeleteBlogPost('${post.id}')" class="btn-icon" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
            </div>
        </div>
    `;

        // Update the section content
        const existingReadView = blogSection.querySelector('.read-view');
        if (existingReadView) {
            existingReadView.replaceWith(readView);
        } else {
            blogSection.appendChild(readView);
        }

    } catch (error) {
        console.error('Error loading blog posts:', error);
        showNotification('Failed to load blog posts', 'error');
    }
}

// ... existing code ...

// Add to window object
window.cancelExperience = cancelExperience;

// Message Functions
async function deleteMessage(messageId) {
    try {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this message?')) {
            return;
        }

        // Delete from Firestore
        const messageRef = doc(db, 'messages', messageId);
        await deleteDoc(messageRef);
        
        // Update local state
        currentMessages = currentMessages.filter(msg => msg.id !== messageId);
        
        // Update dashboard
        await createDashboard();
        
        // Find the deleted message element and remove it
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }

        // If no messages left in conversation, return to messages list
        const remainingMessages = currentMessages.filter(msg => msg.email === messageElement?.dataset.email);
        if (remainingMessages.length === 0) {
            await loadMessagesSection();
        }
        
        showNotification('Message deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting message:', error);
        showNotification('Failed to delete message', 'error');
    }
}



async function markSelectedMessagesAsRead() {
    const selectedMessages = document.querySelectorAll('.message-checkbox:checked');
    if (selectedMessages.length === 0) {
        showNotification('No messages selected', 'error');
        return;
    }

    try {
        const updatePromises = Array.from(selectedMessages).map(async checkbox => {
            const messageId = checkbox.dataset.messageId;
            await markMessageAsRead(messageId);
        
            // Update local state
            const message = currentMessages.find(msg => msg.id === messageId);
            if (message) {
                message.read = true;
                message.readAt = new Date().toISOString();
            }
        });
        
        await Promise.all(updatePromises);
        await loadMessagesSection();
        await createDashboard();
        showNotification('Messages marked as read', 'success');
    } catch (error) {
        console.error('Error marking messages as read:', error);
        showNotification('Failed to mark messages as read', 'error');
    }
}

async function markSelectedMessagesAsUnread() {
    const selectedMessages = document.querySelectorAll('.message-checkbox:checked');
    if (selectedMessages.length === 0) {
        showNotification('No messages selected', 'error');
        return;
    }

    try {
        const updatePromises = Array.from(selectedMessages).map(async checkbox => {
            const messageId = checkbox.dataset.messageId;
            await markMessageAsUnread(messageId);
            
            // Update local state
            const message = currentMessages.find(msg => msg.id === messageId);
            if (message) {
                message.read = false;
                message.readAt = null;
            }
        });

        await Promise.all(updatePromises);
        await loadMessagesSection();
        await createDashboard();
        showNotification('Messages marked as unread', 'success');
    } catch (error) {
        console.error('Error marking messages as unread:', error);
        showNotification('Failed to mark messages as unread', 'error');
    }
}


// Helper function to calculate message stats
function calculateMessageStats(messages) {
    const messagesByEmail = messages.reduce((acc, msg) => {
        if (!acc[msg.email]) {
            acc[msg.email] = {
                hasUnread: false,
                messages: []
            };
        }
        acc[msg.email].messages.push(msg);
        if (!msg.read) {
            acc[msg.email].hasUnread = true;
        }
        return acc;
    }, {});
    
    return {
        totalUniqueSenders: Object.keys(messagesByEmail).length,
        sendersWithUnread: Object.values(messagesByEmail).filter(sender => sender.hasUnread).length,
        messagesByEmail
    };
}

// Helper function to update message stats
function updateMessageStats(messages) {
    const stats = calculateMessageStats(messages);
    
    // Update UI elements showing message stats
    const statsElement = document.getElementById('messageStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Senders with Unread:</span>
                <span class="stat-value">${stats.sendersWithUnread}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Senders:</span>
                <span class="stat-value">${stats.totalUniqueSenders}</span>
            </div>
        `;
    }
}

// Helper function to update dashboard stats
function updateDashboardStats(stats) {
    const dashboardStats = document.getElementById('dashboardStats');
    if (!dashboardStats) return;
    
    const messageStats = calculateMessageStats(currentMessages);
    
    // Update dashboard stats UI
    dashboardStats.innerHTML = `
        <div class="stat-card">
            <div class="stat-title">Messages</div>
            <div class="stat-value">${messageStats.totalUniqueSenders}</div>
            <div class="stat-subtitle">Unread: ${messageStats.sendersWithUnread}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Projects</div>
            <div class="stat-value">${stats.totalProjects || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Blog Posts</div>
            <div class="stat-value">${stats.totalPosts || 0}</div>
        </div>
    `;
}

// Function to toggle support status for a conversation
function toggleConversationSupport(email) {
    const button = document.querySelector('.toggle-support');
    const icon = document.getElementById('conversationSupportIcon');
    
    if (button && icon) {
        button.classList.toggle('active');
        // Store the support status in local storage or your database
        const isSupport = button.classList.contains('active');
        localStorage.setItem(`support_${email}`, isSupport);
        
        showNotification(`Conversation ${isSupport ? 'marked' : 'unmarked'} for support`, 'success');
    }
}


window.toggleConversationSupport = toggleConversationSupport;

async function createDashboard() {
    try {
        // Initial update with current data
        const messageStats = calculateMessageStats(currentMessages);
        updateDashboardCounts(messageStats);
        
        // Subscribe to real-time stats updates
        subscribeToStats((stats) => {
            const messageStats = calculateMessageStats(currentMessages);
            updateDashboardCounts(messageStats);
        });
    } catch (error) {
        console.error('Error creating dashboard:', error);
    }
}

function updateDashboardCounts(messageStats) {
    document.getElementById('projectCount').textContent = currentProjects.length;
    document.getElementById('blogCount').textContent = currentPosts.length;
    document.getElementById('messageCount').textContent = messageStats.totalUniqueSenders;
    document.getElementById('unreadCount').textContent = messageStats.sendersWithUnread;
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Add modal-open class to body to prevent scrolling
    document.body.classList.add('modal-open');
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add event listener for closing modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
    
    // Add event listener for escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(modalId);
        }
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    
    // Hide modal
    modal.style.display = 'none';
    
    // Remove event listeners
    modal.removeEventListener('click', null);
    document.removeEventListener('keydown', null);
}

// Edit Mode Functions
async function enableEditMode(section) {
    const sectionElement = document.getElementById(`${section}Section`);
    const readView = sectionElement.querySelector('.read-view');
    const form = sectionElement.querySelector('form');
    
    if (readView) readView.style.display = 'none';
    if (form) {
        // For profile section, load the data into form fields before showing the form
        if (section === 'profile') {
            try {
                const profileData = await loadProfile();
                if (profileData) {
                    // Set basic profile fields
                    document.getElementById('profileName').value = profileData.name || '';
                    document.getElementById('profileImageUrl').value = profileData.imageUrl || '';
                    document.getElementById('profileResumeUrl').value = profileData.resumeUrl || '';
                    document.getElementById('profileCompany').value = profileData.company || '';
                    
                    // Update image preview
                    const profilePreview = document.getElementById('profilePreview');
                    if (profilePreview) {
                        if (profileData.imageUrl) {
                            const imageUrl = convertGoogleDriveUrl(profileData.imageUrl);
                            profilePreview.src = imageUrl;
                            profilePreview.onerror = () => {
                                profilePreview.src = 'https://ui-avatars.com/api/?name=Admin&background=4169E1&color=fff';
                            };
                        } else {
                            profilePreview.src = 'https://ui-avatars.com/api/?name=Admin&background=4169E1&color=fff';
                        }
                    }
                    
                    // Update resume preview if available
                    const resumeInput = document.getElementById('profileResumeUrl');
                    const viewResumeBtn = document.getElementById('viewResumeBtn');
                    const fileNameSpan = document.getElementById('resumeFileName');
                    
                    if (profileData.resumeUrl) {
                        resumeInput.value = profileData.resumeUrl;
                        if (viewResumeBtn) {
                            viewResumeBtn.href = profileData.resumeUrl;
                            viewResumeBtn.style.display = 'inline-block';
                        }
                        if (fileNameSpan) {
                            fileNameSpan.style.display = 'none'; // Always hide filename
                        }
                    } else {
                        resumeInput.value = '';
                        if (viewResumeBtn) viewResumeBtn.style.display = 'none';
                        if (fileNameSpan) {
                            fileNameSpan.style.display = 'none';
                        }
                    }
                    
                    // Load titles
                    const titlesList = document.getElementById('titlesList');
                    titlesList.innerHTML = '';
                    if (profileData.titles && profileData.titles.length > 0) {
                        profileData.titles.forEach(title => addTitleField(title));
                    } else {
                        addTitleField();
                    }
                    
                    // Load social links with icons and colors
                    const socialLinks = document.getElementById('socialLinks');
                    socialLinks.innerHTML = '';
                    if (profileData.socialLinks && profileData.socialLinks.length > 0) {
                        profileData.socialLinks.forEach(link => addSocialLinkField(link.icon, link.url, link.color));
                    } else {
                        addSocialLinkField();
                    }
                }
            } catch (error) {
                console.error('Error loading profile data:', error);
                showNotification('Failed to load profile data', 'error');
                return;
            }
        }
        
        form.style.display = 'block';
    }
}

// Helper function to convert Google Drive sharing URL to direct link
function convertGoogleDriveUrl(url, isResume = false) {
    if (!url) return '';
    
    if (url.includes('drive.google.com')) {
        // Extract file ID from various Google Drive URL formats
        let fileId = '';
        
        // Format: https://drive.google.com/file/d/FILE_ID/view
        if (url.includes('/file/d/')) {
            fileId = url.split('/file/d/')[1].split('/')[0];
        }
        // Format: https://drive.google.com/open?id=FILE_ID
        else if (url.includes('?id=')) {
            fileId = url.split('?id=')[1].split('&')[0];
        }
        // Format: https://drive.google.com/uc?id=FILE_ID
        else if (url.includes('uc?id=')) {
            fileId = url.split('uc?id=')[1].split('&')[0];
        }
        
        if (fileId) {
            // Use different formats for resume and images
            if (isResume) {
                return `https://drive.google.com/file/d/${fileId}/view`;
            } else {
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
            }
        }
    }
    return url;
}

function setReadMode(sectionElement) {
    const readView = sectionElement.querySelector('.read-view');
    const form = sectionElement.querySelector('form');
    
    if (readView) readView.style.display = 'block';
    if (form) form.style.display = 'none';
}

// Logout Function
async function logout() {
    try {
        // Cleanup subscriptions
        unsubscribeFromStats();
        unsubscribeFromMessages();
        
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error('Error signing out:', error);
        showNotification('Error signing out. Please try again.', 'error');
    }
}

// Add event listeners for logout buttons
document.addEventListener('DOMContentLoaded', function() {
    // Desktop logout button
    const logoutBtn = document.querySelector('.logout-container button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            logout();
        });
    }
    
    // Mobile logout button
    const mobileLogoutBtn = document.querySelector('.nav-item.logout-mobile');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            logout();
        });
    }
});

// Make logout function globally accessible
window.logout = logout;

// Make functions globally accessible
window.showSection = showSection;
window.enableEditMode = enableEditMode;
window.showModal = showModal;
window.closeModal = closeModal;
window.logout = logout;
window.editExperience = editExperience;
window.deleteExperience = deleteExperience;
window.deleteMessage = deleteMessage;
window.addSocialLinkField = addSocialLinkField;
window.removeSocialLink = removeSocialLink;
window.showAddSkillDialog = showAddSkillDialog;
window.handleSkillLevelChange = handleSkillLevelChange;
window.handleSkillIconChange = handleSkillIconChange;
window.updateSkillIcon = updateSkillIcon;
window.updateSkillLevel = updateSkillLevel;
window.addSkillCategory = addSkillCategory;
window.addSkillToCategory = addSkillToCategory;
window.removeSkillCategory = removeSkillCategory;
window.removeSkill = removeSkill;
window.cancelSkillsEdit = cancelSkillsEdit;
window.editSkillCategory = editSkillCategory;
window.saveNewCategory = saveNewCategory;
window.deleteSkillCategory = deleteSkillCategory;
window.confirmDeleteCategory = confirmDeleteCategory;
window.showToast = showToast;
window.showNotification = showNotification;

// Initialize dashboard if user is already logged in
onAuthStateChanged(auth, user => {
    if (user) {
        loginForm.style.display = 'none';
        adminDashboard.style.display = 'block';
        initializeSections();
        loadAllContent();
    } else {
        loginForm.style.display = 'block';
        adminDashboard.style.display = 'none';
    }
});

// Profile form submission handler
document.getElementById('profileForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        const name = document.getElementById('profileName').value.trim();
        const imageUrl = document.getElementById('profileImageUrl').value.trim();
        const resumeUrl = document.getElementById('profileResumeUrl').value.trim();
        const company = document.getElementById('profileCompany').value.trim();
        
        // Get titles
        const titleInputs = document.querySelectorAll('.title-input');
        const titles = Array.from(titleInputs)
            .map(input => input.value.trim())
            .filter(title => title !== '');
        
        // Get social links with icons and colors
        const socialLinkItems = document.querySelectorAll('.social-link-item');
        const socialLinks = Array.from(socialLinkItems)
            .map(item => ({
                icon: item.querySelector('.social-icon').value,
                color: item.querySelector('.social-color').value,
                url: item.querySelector('.social-url').value.trim()
            }))
            .filter(link => link.icon && link.url);
        
        const profileData = {
            name,
            imageUrl,
            resumeUrl,
            company,
            titles,
            socialLinks
        };
        
        await updateProfile(profileData);
        await updateSidebarProfile(); // Add this line to update sidebar
        showNotification('Profile updated successfully');
        
        // Reset form and refresh display
        loadProfileContent();
        setReadMode(document.getElementById('profileSection'));
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile', 'error');
    }
});

// Profile Functions
function handleProfileImageChange(input) {
    const imageUrl = input.value;
    const profilePreview = document.getElementById('profilePreview');
    
    if (imageUrl) {
        const directUrl = convertGoogleDriveUrl(imageUrl);
        profilePreview.src = directUrl;
        profilePreview.style.maxWidth = '200px'; // Ensure preview size is reasonable
        profilePreview.style.height = 'auto';
        profilePreview.onerror = () => {
            console.error('Failed to load image from URL:', directUrl);
            profilePreview.src = 'https://ui-avatars.com/api/?name=Admin&background=4169E1&color=fff';
        };
    } else {
        profilePreview.src = 'https://ui-avatars.com/api/?name=Admin&background=4169E1&color=fff';
    }
}

window.handleResumeChange = function(input) {
    const fileNameSpan = document.getElementById('resumeFileName');
    const viewResumeBtn = document.getElementById('viewResumeBtn');
    const url = input.value;
    
    if (url) {
        // Convert Google Drive link to direct link if needed
        const directUrl = convertGoogleDriveUrl(url);
        viewResumeBtn.href = directUrl;
        viewResumeBtn.style.display = 'inline-block';
        fileNameSpan.style.display = 'none';
    } else {
        viewResumeBtn.style.display = 'none';
        fileNameSpan.style.display = 'inline-block';
        fileNameSpan.textContent = 'No file chosen';
    }
};

// Add event listeners for URL inputs
document.getElementById('profileImageUrl').addEventListener('input', function() {
    handleProfileImageChange(this);
});

document.getElementById('profileResumeUrl').addEventListener('input', function() {
    handleResumeChange(this);
});

// Skill Modal Functions
function handleSkillLevelChange(input) {
    const value = input.value;
    document.getElementById('skillLevelValue').textContent = `${value}%`;
}

function handleSkillIconChange(input) {
    const iconClass = input.value;
    const preview = document.getElementById('iconPreview');
    preview.className = iconClass;
}

// Update the showAddSkillDialog function to load skills data
async function showAddSkillDialog() {
    try {
        const skillsData = await loadSkills() || [];
        
        // Create and show the category modal
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.style.display = 'block';
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Skill Category</h3>
                    <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <div class="form-group">
                        <label>Category Name</label>
                        <input type="text" id="newCategoryName" class="form-control" placeholder="e.g., Programming Languages, Frameworks, etc." required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn primary" onclick="saveNewCategory(this)">Add Category</button>
                        <button type="button" class="btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    } catch (error) {
        console.error('Error loading skills data:', error);
        alert('Failed to load skills data');
    }
}

async function saveNewCategory(button) {
    const modal = button.closest('.modal');
    const categoryName = modal.querySelector('#newCategoryName').value.trim();
        
        if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
        }

    try {
        const skillsData = await loadSkills() || [];

        // Check if category already exists
        if (skillsData.some(cat => cat.name === categoryName)) {
            showNotification('A category with this name already exists', 'error');
            return;
        }

        // Add new empty category
        const newCategory = {
            name: categoryName,
            skills: []
        };

        skillsData.push(newCategory);
        await updateSkills(skillsData);
        await loadSkillsContent();
        
        modal.remove();
        showNotification('Category added successfully! Click the edit button to add skills.', 'success');
    } catch (error) {
        console.error('Error adding category:', error);
        showNotification('Failed to add category', 'error');
    }
}

async function editSkillCategory(categoryName) {
    const skillsSection = document.getElementById('skillsSection');
    const skillsDisplay = document.getElementById('skillsDisplay');
    const skillsForm = document.getElementById('skillsForm');
    const skillCategories = document.getElementById('skillCategories');

    try {
        const skillsData = await loadSkills() || [];

        // Show the form and hide the display
        skillsDisplay.style.display = 'none';
        skillsForm.style.display = 'block';

        // Clear existing categories
        skillCategories.innerHTML = '';

        // Add all categories, but only the selected one is editable
        skillsData.forEach(category => {
            const categoryDiv = document.createElement('div');
            
            if (category.name === categoryName) {
                // Add the category being edited in edit mode
                categoryDiv.className = 'skill-category-edit';
                categoryDiv.dataset.originalName = category.name; // Store original name for reference
                categoryDiv.innerHTML = `
                    <div class="header">
                        <input type="text" class="category-name" placeholder="Category Name" value="${category.name}">
                    </div>
                    <div class="skills-edit-list">
                        ${category.skills.map(skill => createSkillEditItem(skill)).join('')}
                    </div>
                    <button type="button" class="btn secondary" onclick="addSkillToCategory(this)">Add More Skills</button>
                    <div class="save-reminder">
    <i class="fas fa-info-circle"></i>
    <span>Remember to scroll down and click "Save Changes" to save your updates</span>
</div>
                `;
            } else {
                // Add other categories in display mode
                categoryDiv.className = 'skill-category';
                categoryDiv.innerHTML = `
                    <div class="skill-category-header">
                        <h3>${category.name}</h3>
                    </div>
                    <div class="skills-list">
                        ${category.skills.map(skill => `
                            <div class="skill-item">
                                <div class="skill-icon">
                                    <i class="${skill.icon}" style="color: ${skill.color || '#000000'};"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>${skill.name}</h4>
                                    <div class="skill-level-badge ${skill.level.toLowerCase()}">
                                        ${skill.level}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            skillCategories.appendChild(categoryDiv);
        });

    } catch (error) {
        console.error('Error loading category data:', error);
        showNotification('Failed to load category data', 'error');
    }
}

function expandCategory(button) {
    const categoryDiv = button.closest('.skill-category-edit');
    const skillsList = categoryDiv.querySelector('.skills-edit-list');
    const addSkillButton = categoryDiv.querySelector('.btn.secondary');
    const icon = button.querySelector('i');

    if (categoryDiv.classList.contains('collapsed')) {
        // Expand
        categoryDiv.classList.remove('collapsed');
        skillsList.style.display = 'block';
        addSkillButton.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        categoryDiv.querySelector('.category-name').readOnly = false;
    } else {
        // Collapse
        categoryDiv.classList.add('collapsed');
        skillsList.style.display = 'none';
        addSkillButton.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        categoryDiv.querySelector('.category-name').readOnly = true;
    }
}

// Update the form submission handler
document.addEventListener('DOMContentLoaded', function() {
    const skillsForm = document.getElementById('skillsForm');
    if (skillsForm) {
        skillsForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    
    try {
                // Get all existing skills data
                const existingSkillsData = await loadSkills() || [];
                
                // Get the edited category data
                const editedCategory = document.querySelector('.skill-category-edit');
                const originalCategoryName = editedCategory.dataset.originalName;
                const newCategoryName = editedCategory.querySelector('.category-name').value;
                const editedCategoryData = {
                    name: newCategoryName,
                    skills: Array.from(editedCategory.querySelectorAll('.skill-edit-item')).map(item => ({
                name: item.querySelector('.skill-name').value,
                level: item.querySelector('.skill-level').value,
                icon: item.querySelector('.skill-icon').value,
                color: item.querySelector('.icon-color').value
                    })).filter(skill => skill.name && skill.icon)
                };

                // Update the category in the existing data
                const categoryIndex = existingSkillsData.findIndex(cat => cat.name === originalCategoryName);
                if (categoryIndex !== -1) {
                    existingSkillsData[categoryIndex] = editedCategoryData;
                }
                
                // Save all categories
                await updateSkills(existingSkillsData);
        await loadSkillsContent();
        
                showNotification('Skills updated successfully!', 'success');
        
        // Switch back to display view
        document.getElementById('skillsDisplay').style.display = 'block';
        document.getElementById('skillsForm').style.display = 'none';
        
    } catch (error) {
        console.error('Error updating skills:', error);
                showNotification('Failed to update skills: ' + error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
            }
        });
    }
});

// Make skills functions globally accessible
window.addSkillCategory = addSkillCategory;
window.addSkillToCategory = addSkillToCategory;
window.removeSkillCategory = removeSkillCategory;
window.removeSkill = removeSkill;
window.updateSkillLevel = updateSkillLevel;
window.updateSkillIcon = updateSkillIcon;
window.cancelSkillsEdit = cancelSkillsEdit;
window.showAddSkillDialog = showAddSkillDialog;

// Skills Functions
function addSkillCategory(category = { name: '', skills: [] }) {
    const categoriesContainer = document.getElementById('skillCategories');
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'skill-category-edit';
    categoryDiv.style.border = '1px solid #ddd';
    categoryDiv.style.borderRadius = '8px';
    categoryDiv.style.padding = '20px';
    categoryDiv.style.marginBottom = '20px';
    categoryDiv.style.backgroundColor = '#fff';
    categoryDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    categoryDiv.innerHTML = `
        <div class="header" style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <input type="text" class="category-name" placeholder="Category Name" value="${category.name}" style="font-size: 1.2rem; font-weight: bold; border: none; outline: none; padding: 5px;">
            <button type="button" class="btn-icon remove" onclick="removeSkillCategory(this)" title="Remove Category">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="skills-edit-list" style="display: grid; gap: 15px;">
            ${category.skills.map(skill => createSkillEditItem(skill)).join('')}
        </div>
        <button type="button" class="btn secondary" onclick="addSkillToCategory(this)" style="margin-top: 15px;">Add Skill</button>
    `;
    categoriesContainer.appendChild(categoryDiv);
}

function createSkillEditItem(skill = { name: '', level: 'Intermediate', icon: '', color: '' }) {
    const levels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return `
        <div class="skill-edit-item" style="background: #f8f9fa; padding: 15px; border-radius: 6px; gap: 10px;">
            <input type="text" class="skill-name" placeholder="Skill Name" value="${skill.name}" style="font-size: 1rem; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <div class="skill-level-select" style="display: flex; align-items: center; gap: 10px;">
                <select class="skill-level" onchange="updateSkillLevel(this)" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    ${levels.map(level => `
                        <option value="${level}" ${skill.level === level ? 'selected' : ''}>
                            ${level}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="icon-input" style="display: flex; gap: 10px; align-items: center;">
                <div class="icon-field" style="flex: 1; position: relative;">
                    <input type="text" class="skill-icon" placeholder="fa-brands fa-html5" value="${skill.icon}" 
                        oninput="updateSkillIcon(this)" style="width: 100%; padding: 8px; padding-right: 30px; border: 1px solid #ddd; border-radius: 4px;">
                    <i class="${skill.icon}" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%);"></i>
                </div>
                <div class="color-field" style="display: flex; align-items: center; gap: 5px;">
                    <input type="color" class="icon-color" value="${skill.color || '#000000'}" 
                        oninput="updateSkillIcon(this.parentElement.previousElementSibling.querySelector('.skill-icon'))" style="width: 40px; height: 40px; padding: 2px;">
                </div>
            </div>
            <div class="skill-actions" style="text-align: right;">
                <button type="button" class="btn-icon remove" onclick="removeSkill(this)" title="Remove Skill">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
}

function cancelSkillsEdit() {
    const skillsDisplay = document.getElementById('skillsDisplay');
    const skillsForm = document.getElementById('skillsForm');
    const skillCategories = document.getElementById('skillCategories');
    
    // Clear the form
    skillCategories.innerHTML = '';
    
    // Hide form and show display
    skillsForm.style.display = 'none';
    skillsDisplay.style.display = 'block';
    
    // Reload the skills content
    loadSkillsContent();
}

function updateSkillLevel(select) {
    // No need to update any display since we're using a select element
}

function updateSkillIcon(input) {
    const iconElement = input.nextElementSibling;
    const colorInput = input.closest('.icon-input').querySelector('.icon-color');
    const colorPreview = input.closest('.icon-input').querySelector('.color-preview');
    
    iconElement.className = input.value;
    iconElement.style.color = colorInput.value;
    colorPreview.style.backgroundColor = colorInput.value;
}

function addSkillToCategory(button) {
    const skillsList = button.previousElementSibling;
    const skillItem = document.createElement('div');
    skillItem.innerHTML = createSkillEditItem();
    skillsList.appendChild(skillItem.firstElementChild);
}

function removeSkillCategory(button) {
    button.closest('.skill-category-edit').remove();
}

function removeSkill(button) {
    button.closest('.skill-edit-item').remove();
}

async function loadSkillsContent() {
    try {
        const skillsData = await loadSkills() || [];
        const skillsSection = document.getElementById('skillsSection');
        const skillsDisplay = document.getElementById('skillsDisplay');
        const skillsForm = document.getElementById('skillsForm');
        const skillCategories = document.getElementById('skillCategories');

        // Update the "Add Skill" button to "Add Skill Category"
        const addButton = skillsSection.querySelector('.section-header button');
        addButton.innerHTML = '<i class="fas fa-plus"></i> Add Skill Category';

        // Clear existing content
        skillsDisplay.innerHTML = '';
        skillCategories.innerHTML = '';

        // Create read-only view with categories
        if (skillsData?.length) {
            skillsData.forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'skill-category';
                categoryDiv.style.border = '1px solid #ddd';
                categoryDiv.style.borderRadius = '8px';
                categoryDiv.style.padding = '20px';
                categoryDiv.style.marginBottom = '20px';
                categoryDiv.style.backgroundColor = '#fff';
                categoryDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                categoryDiv.innerHTML = `
                    <div class="skill-category-header" style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">${category.name}</h3>
                        <div class="category-actions">
                            <button onclick="editSkillCategory('${category.name}')" class="btn-icon" title="Edit Category">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteSkillCategory('${category.name}')" class="btn-icon" title="Delete Category">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="skills-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        ${category.skills.map(skill => `
                            <div class="skill-item" style="background: #f8f9fa; padding: 12px; border-radius: 6px; display: flex; align-items: center; gap: 12px;">
                                <div class="skill-icon" style="font-size: 1.5rem;">
                                    <i class="${skill.icon}" style="color: ${skill.color || '#000000'};"></i>
                                </div>
                                <div class="skill-info">
                                    <h4 style="margin: 0 0 5px 0;">${skill.name}</h4>
                                    <div class="skill-level-badge ${skill.level.toLowerCase()}" style="font-size: 0.8rem; padding: 2px 8px; border-radius: 12px; background: #e9ecef; display: inline-block;">
                                        ${skill.level}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                skillsDisplay.appendChild(categoryDiv);
            });
        } else {
            // Show a message when no categories exist
            skillsDisplay.innerHTML = `
                <div class="empty-state">
                    <p>No skill categories added yet.</p>
                </div>
            `;
        }

        // Show the display view by default
        skillsForm.style.display = 'none';
        skillsDisplay.style.display = 'block';

    } catch (error) {
        console.error('Error loading skills:', error);
        alert('Failed to load skills data');
    }
}

async function deleteSkillCategory(categoryName) {
    // Create and show the confirmation modal
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.style.display = 'block';
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Delete Category</h3>
                <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <div class="alert alert-warning">
                    <h4>Warning: You are about to delete the "${categoryName}" category!</h4>
                    <p>This will permanently remove:</p>
                    <ul>
                        <li>The entire category</li>
                        <li>All skills within this category</li>
                    </ul>
                    <p>Are you sure you want to proceed?</p>
                </div>
                <div class="form-actions" style="margin-top: 20px;">
                    <button type="button" class="btn primary" onclick="confirmDeleteCategory('${categoryName}', this)">Delete Category</button>
                    <button type="button" class="btn" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
}

async function confirmDeleteCategory(categoryName, button) {
    const modal = button.closest('.modal');
    try {
        const skillsData = await loadSkills() || [];
        const updatedSkills = skillsData.filter(cat => cat.name !== categoryName);
        await updateSkills(updatedSkills);
        await loadSkillsContent();
        modal.remove();
        
        // Show success message in a modal
        const successDialog = document.createElement('div');
        successDialog.className = 'modal';
        successDialog.style.display = 'block';
        successDialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Success</h3>
                    <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <div class="alert alert-success">
                        <p>Category and its skills have been successfully deleted.</p>
                    </div>
                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="button" class="btn primary" onclick="this.closest('.modal').remove()">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(successDialog);
    } catch (error) {
        console.error('Error deleting category:', error);
        // Show error message in a modal
        const errorDialog = document.createElement('div');
        errorDialog.className = 'modal';
        errorDialog.style.display = 'block';
        errorDialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Error</h3>
                    <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <div class="alert alert-error">
                        <p>Failed to delete category. Please try again.</p>
                    </div>
                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="button" class="btn primary" onclick="this.closest('.modal').remove()">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(errorDialog);
    }
}

// Add to window object
window.confirmDeleteCategory = confirmDeleteCategory;

// Add to window object
window.loadMessagesSection = loadMessagesSection; 
window.showMessageDetails = showMessageDetails;

function createCertificationCard(certification) {
    const { title, organization, issueDate, expiryDate, credentialId, credentialUrl, files, certificationSkills } = certification;

        return `
        <div class="certification-item">
            <div class="certification-header">
                <div class="certification-title">
                    <h3>${title}</h3>
                    <span class="organization">${organization}</span>
                </div>
                <div class="certification-actions">
                    <button onclick="editCertification('${certification.id}')" class="btn-icon" title="Edit Certification">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCertification('${certification.id}')" class="btn-icon delete" title="Delete Certification">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="certification-details">
                ${cert.credentialId ? `
                    <div class="details-row">
                        <div>Credential ID: ${cert.credentialId}</div>
                    </div>
                ` : ''}
                <div>Issued ${formatDate(cert.issueDate)}${cert.expiryDate ? ` | Expiry Date: ${formatDate(cert.expiryDate)}` : ''}</div>
                <div class="mobile-order-wrapper">
                    ${cert.certificationSkills ? `<div class="certification-skills">Skills: ${cert.certificationSkills}</div>` : ''}
                    ${cert.credentialUrl ? `<button onclick="window.open('${cert.credentialUrl}', '_blank')" class="view-credential-btn">View Credential <i class="fas fa-external-link-alt"></i></button>` : ''}
                </div>
            </div>
            ${cert.files && cert.files.length > 0 ? `
                <div class="certification-files">
                    ${imageFiles.length > 0 ? `
                        <div class="files-section">
                            <div class="files-header" onclick="toggleFilesSection(this)">
                                <h4><i class="fas fa-images"></i> Images</h4>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="files-grid" style="display: none;">
                                ${imageFiles.map(file => createFilePreview(file)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${pdfFiles.length > 0 ? `
                        <div class="files-section">
                            <div class="files-header" onclick="toggleFilesSection(this)">
                                <h4><i class="fas fa-file-pdf"></i> Documents</h4>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="files-grid" style="display: none;">
                                ${pdfFiles.map(file => createFilePreview(file)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            </div>
        `;
}

// Helper function to format date in YYYY-MM format
function formatDate(dateInput, format = 'MMMM YYYY') {
    if (!dateInput) return 'N/A';
    
    let date;
    
    // Handle Firestore Timestamp
    if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
    }
    // Handle Date object
    else if (dateInput instanceof Date) {
        date = dateInput;
    }
    // Handle string or number
    else {
        date = new Date(dateInput);
    }
    
    // Return empty string if date is invalid
    if (isNaN(date.getTime())) return '';
    
    if (format === 'MMMM YYYY') {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    }
    
    // Default format for messages and other cases
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function saveCertification(event) {
    event.preventDefault();
    try {
        const certificationData = {
            title: document.getElementById('certificationTitle').value,
            organization: document.getElementById('certificationOrg').value,
            issueDate: document.getElementById('certificationDate').value,
            expiryDate: document.getElementById('certificationExpiry').value || null,
            credentialId: document.getElementById('certificationId').value,
            credentialUrl: document.getElementById('certificationUrl').value,
            certificationSkills: document.getElementById('certificationSkills').value,
            files: []
        };

        // Get all file links
        const fileLinkInputs = document.querySelectorAll('.file-link-input');
        certificationData.files = Array.from(fileLinkInputs).map(input => input.value).filter(Boolean);

        if (editingCertificationId) {
            // Update existing certification
            await updateDoc(doc(db, 'certifications', editingCertificationId), certificationData);
        } else {
            // Add new certification
            await addDoc(collection(db, 'certifications'), certificationData);
        }

        // Reset form and refresh display
        document.getElementById('certificationForm').reset();
        document.getElementById('certificationsForm').style.display = 'none';
        document.getElementById('fileLinks').innerHTML = '';
        editingCertificationId = null;
        await loadCertificationsContent();

    } catch (error) {
        console.error('Error saving certification:', error);
        alert('Failed to save certification');
    }
}

// Add event listener for certification form
document.getElementById('certificationForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        const certificationData = {
            title: document.getElementById('certificationTitle').value,
            organization: document.getElementById('certificationOrg').value,
            issueDate: document.getElementById('certificationDate').value,
            expiryDate: document.getElementById('certificationExpiry').value || null,
            credentialId: document.getElementById('certificationId').value,
            credentialUrl: document.getElementById('certificationUrl').value,
            certificationSkills: document.getElementById('certificationSkills').value,
            files: []
        };

        // Get all file links
        const fileLinkInputs = document.querySelectorAll('.file-link-input');
        certificationData.files = Array.from(fileLinkInputs).map(input => input.value).filter(Boolean);

        await updateCertification(editingCertificationId, certificationData);

        // Reset form and refresh display
        document.getElementById('certificationForm').reset();
        document.getElementById('certificationsForm').style.display = 'none';
        document.getElementById('fileLinks').innerHTML = '';
        editingCertificationId = null;
        await loadCertificationsContent();
        showNotification('Certification saved successfully');

    } catch (error) {
        console.error('Error saving certification:', error);
        showNotification('Failed to save certification', 'error');
    }
});

function createFilePreview(file) {
    switch(file.type) {
        case 'image':
            return `
                <div class="file-item image">
                    <a href="${file.url}" target="_blank" title="View full image">
                        <img src="${file.url}" alt="Preview" 
                            onerror="this.parentElement.innerHTML='<p>Unable to load preview</p>'"
                            style="object-fit: cover; height: 56px; width: 106px;">
                    </a>
                </div>`;
        case 'pdf':
            return `
                <div class="file-item pdf">
                    <a href="${file.url}" target="_blank" class="pdf-link" title="View PDF">
                        <i class="fas fa-file-pdf"></i>
                        <span style="width: 106px; height: 56px; display: flex; align-items: center;">View PDF</span>
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>`;
        default:
            return '';
    }
}

// Password toggle function
function togglePassword() {
    const passwordInput = document.getElementById('adminPassword');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
                    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    }
}

// Make password toggle function globally accessible
window.togglePassword = togglePassword;

document.addEventListener('DOMContentLoaded', function() {
    // Add image URL input event listener for live preview
    const imageUrlInput = document.getElementById('profileImageUrl');
    const profilePreview = document.getElementById('profilePreview');
    
    if (imageUrlInput && profilePreview) {
        imageUrlInput.addEventListener('input', function() {
            const imageUrl = this.value.trim();
            if (imageUrl) {
                const convertedUrl = convertGoogleDriveUrl(imageUrl);
                profilePreview.src = convertedUrl;
                profilePreview.onerror = () => {
                    profilePreview.src = 'https://ui-avatars.com/api/?name=Admin&background=4169E1&color=fff';
                };
            } else {
                profilePreview.src = 'https://ui-avatars.com/api/?name=Admin&background=4169E1&color=fff';
            }
        });
    }
    
    // Existing event listeners...
});

// About form submission handler
document.addEventListener('DOMContentLoaded', () => {
    const aboutForm = document.querySelector('#aboutSection form');
    if (aboutForm) {
        aboutForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            try {
                const aboutEditor = document.getElementById('aboutEditor');
                const content = aboutEditor.innerHTML;
                
                await updateAbout({ bio: content });
                await loadAboutSection();
                
                // Switch back to read mode
                const aboutSection = document.getElementById('aboutSection');
                setReadMode(aboutSection);
                
                showNotification('About section updated successfully', 'success');
            } catch (error) {
                console.error('Error updating about section:', error);
                showNotification('Failed to update about section', 'error');
            }
        });
    }
});


// Add these lines at the end of your admin.js file
window.addSkillCategory = addSkillCategory;
window.loadSkillsContent = loadSkillsContent;
window.showNotification = showNotification;

// Add styles for message management
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    /* Message Management Styles */
    .replied-badge {
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        margin-left: 8px;
    }

    .not-replied-badge {
        background: #6c757d;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        margin-left: 8px;
    }

    /* Message Section Styles */
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 0.5rem 0;
    }
    
    .section-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .icon-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .icon-button:hover {
        background: #f5f5f5;
    }
    
    .icon-button.active {
        background: #e0e0e0;
    }
    
    /* Search Bar Styles */
    .search-bar {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
    }
    
    .search-input-container {
        display: flex;
        gap: 0.5rem;
    }
    
    .search-input-container input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .clear-search {
        padding: 0.5rem;
        border: none;
        background: none;
        cursor: pointer;
        color: #666;
    }
    
    .clear-search:hover {
        color: #333;
    }
    
    /* Filter Bar Styles */
    .filter-bar {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
    }
    
    .filter-group {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .filter-group select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
    }
    
    .clear-filters {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
    }

    .clear-filters:hover {
        background: #f5f5f5;
    }

    /* Bulk Actions Styles */
    .bulk-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
    }
    
    .bulk-actions button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
    }
    
    .bulk-actions button:hover:not(:disabled) {
        background: #f5f5f5;
    }
    
    .bulk-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Messages List Styles */
    .messages-list {
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .msg-item {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid #ddd;
        background: white;
        transition: background-color 0.2s;
    }
    
    .msg-item:last-child {
        border-bottom: none;
    }
    
    .msg-item:hover {
        background: #f9f9f9;
    }
    
    .msg-item.unread {
        background: #f0f7ff;
    }
    
    .msg-item.unread:hover {
        background: #e5f0ff;
    }
    
    .msg-checkbox {
        display: none;
        align-items: center;
        padding: 1rem;
        border-right: 1px solid #ddd;
    }
    
    .msg-content {
        flex: 1;
        display: flex;
        padding: 1rem;
        cursor: pointer;
    }
    
    .msg-icon {
        display: flex;
        align-items: center;
        padding-right: 1rem;
        color: #666;
    }
    
    .msg-info {
        flex: 1;
    }
    
    .msg-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;
    }
    
    .msg-name {
        font-weight: bold;
        color: #333;
    }
    
    .msg-date {
        color: #666;
        font-size: 0.9em;
    }
    
    .msg-email {
        color: #666;
        margin-bottom: 0.25rem;
        font-size: 0.9em;
    }
    
    .msg-preview {
        color: #666;
        font-size: 0.9em;
        line-height: 1.4;
    }
    
    .no-messages {
        padding: 2rem;
        text-align: center;
        color: #666;
    }
    
    /* Pagination Styles */
    .pagination {
        display: flex;
        justify-content: center;
        gap: 0.25rem;
        margin-top: 1rem;
    }
    
    .pagination button {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
    }

    .pagination button:hover:not(:disabled) {
        background: #f5f5f5;
    }
    
    .pagination button.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
    }
    
    .pagination button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .pagination .ellipsis {
        padding: 0.5rem;
        color: #666;
    }
    
    /* Message Detail Styles */
    .message-detail {
        background: white;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .message-detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
    }
`;

document.head.appendChild(messageStyles);

// Message state management
let currentPage = 1;
let currentFilters = {
    search: '',
    status: 'all',
    date: 'all'
};

// Initialize message list handlers
function initializeMessageListHandlers() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    // Add click event listeners for message selection
    messagesList.addEventListener('click', (event) => {
        const messageItem = event.target.closest('.message-item');
        if (!messageItem) return;

        if (event.ctrlKey || event.metaKey) {
            messageItem.classList.toggle('selected');
            updateBulkActionState();
        } else {
            // Single message selection
            document.querySelectorAll('.message-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            messageItem.classList.add('selected');
            updateBulkActionState();
        }
    });

    // Initialize select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllMessages');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (event) => {
            const messages = document.querySelectorAll('.message-item');
            messages.forEach(message => {
                message.classList.toggle('selected', event.target.checked);
            });
    updateBulkActionState();
        });
    }
}



// Handle message selection
function handleMessageSelect(event) {
    event.stopPropagation();
    
    const checkbox = event.target;
    const messageId = checkbox.dataset.messageId;
    const isChecked = checkbox.checked;
    
    // Update message item UI
    const messageItem = checkbox.closest('.message-item, .message-thread-item');
    if (messageItem) {
        messageItem.classList.toggle('selected', isChecked);
    }
    
    updateBulkActionButtons();
}



// Select all visible messages
function selectAllVisibleMessages(event) {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll('.message-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const messageItem = checkbox.closest('.message-item');
        if (messageItem) {
            messageItem.classList.toggle('selected', isChecked);
        }
    });
    
    updateBulkActionButtons();
}

// Reset selection mode
function resetSelectionMode() {
    const selectAllContainer = document.querySelector('.select-all-container');
    const messageCheckboxes = document.querySelectorAll('.message-select, .msg-checkbox');
    const selectBtn = document.querySelector('.conversation-select-btn');
    const bulkActions = document.getElementById('msgBulkActions');
    const selectToggle = document.getElementById('msgSelectToggle');
    
    // Hide select all and checkboxes
    if (selectAllContainer) {
        selectAllContainer.style.display = 'none';
    }
    messageCheckboxes.forEach(checkbox => {
        checkbox.style.display = 'none';
    });
    
    // Reset button text
    if (selectBtn) {
        selectBtn.textContent = 'Select Conversation';
    }
    
    // Hide bulk actions and deactivate toggle
    if (bulkActions) {
        bulkActions.style.display = 'none';
    }
    if (selectToggle) {
        selectToggle.classList.remove('active');
    }
    
    // Uncheck all checkboxes
    document.querySelectorAll('.message-checkbox, .select-all-checkbox').forEach(cb => {
        cb.checked = false;
    });
    
    // Remove selected class from all message types
    document.querySelectorAll('.message-item, .message-thread-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Reset button states to default
    const buttons = {
        'delete-all': 'Delete All',
        'reply-all': 'Reply All',
        'mark-read': '',
        'mark-unread': ''
    };
    
    Object.entries(buttons).forEach(([action, label]) => {
        const button = document.querySelector(`[data-action="${action}"]`);
        if (button) {
            button.textContent = label;
            button.disabled = false;
        }
    });
}

// Add to window object
window.resetSelectionMode = resetSelectionMode;

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for select all checkbox
    const selectAllCheckbox = document.querySelector('.select-all-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('click', selectAllVisibleMessages);
    }

    // Add click handlers for individual message checkboxes
    const messageCheckboxes = document.querySelectorAll('.message-checkbox');
    messageCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleMessageSelect);
    });
});

// Add to window object
window.handleMessageSelect = handleMessageSelect;
window.selectAllVisibleMessages = selectAllVisibleMessages;
window.replyAllSelected = replyAllSelected;

// Add styles for message management UI
const style = document.createElement('style');
style.textContent = `
    /* Message Section Styles */
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 0.5rem 0;
    }
    
    .section-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .icon-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .icon-button:hover {
        background: #f5f5f5;
    }
    
    .icon-button.active {
        background: #e0e0e0;
    }
    
    /* Search Bar Styles */
    .search-bar {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
    }
    
    .search-input-container {
        display: flex;
        gap: 0.5rem;
    }
    
    .search-input-container input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .clear-search {
        padding: 0.5rem;
        border: none;
        background: none;
        cursor: pointer;
        color: #666;
    }
    
    .clear-search:hover {
        color: #333;
    }
    
    /* Filter Bar Styles */
    .filter-bar {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
    }
    
    .filter-group {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .filter-group select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
    }
    
    .clear-filters {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
    }
    
    .clear-filters:hover {
        background: #f5f5f5;
    }
    
    /* Bulk Actions Styles */
    .bulk-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
    }
    
    .bulk-actions button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
    }
    
    .bulk-actions button:hover:not(:disabled) {
        background: #f5f5f5;
    }
    
    .bulk-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Messages List Styles */
    .messages-list {
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .msg-item {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid #ddd;
        background: white;
        transition: background-color 0.2s;
    }
    
    .msg-item:last-child {
        border-bottom: none;
    }
    
    .msg-item:hover {
        background: #f9f9f9;
    }
    
    .msg-item.unread {
        background: #f0f7ff;
    }
    
    .msg-item.unread:hover {
        background: #e5f0ff;
    }
    
    .msg-checkbox {
        display: none;
        align-items: center;
        padding: 1rem;
        border-right: 1px solid #ddd;
    }
    
    .msg-content {
        flex: 1;
        display: flex;
        padding: 1rem;
        cursor: pointer;
    }
    
    .msg-icon {
        display: flex;
        align-items: center;
        padding-right: 1rem;
        color: #666;
    }
    
    .msg-info {
        flex: 1;
    }
    
    .msg-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;
    }
    
    .msg-name {
        font-weight: bold;
        color: #333;
    }
    
    .msg-date {
        color: #666;
        font-size: 0.9em;
    }
    
    .msg-email {
        color: #666;
        margin-bottom: 0.25rem;
        font-size: 0.9em;
    }
    
    .msg-preview {
        color: #666;
        font-size: 0.9em;
        line-height: 1.4;
    }
    
    .no-messages {
        padding: 2rem;
        text-align: center;
        color: #666;
    }
    
    /* Pagination Styles */
    .pagination {
        display: flex;
        justify-content: center;
        gap: 0.25rem;
        margin-top: 1rem;
    }
    
    .pagination button {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
    }

    .pagination button:hover:not(:disabled) {
        background: #f5f5f5;
    }
    
    .pagination button.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
    }
    
    .pagination button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .pagination .ellipsis {
        padding: 0.5rem;
        color: #666;
    }
    
    /* Message Detail Styles */
    .message-detail {
        background: white;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .message-detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
    }
    
    .back-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .back-button:hover {
        background: #f5f5f5;
    }
    
    .message-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .message-actions button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .message-actions button:hover {
        background: #f5f5f5;
    }
    
    .message-actions .delete-button {
        border-color: #dc3545;
        color: #dc3545;
    }
    
    .message-actions .delete-button:hover {
        background: #dc3545;
        color: white;
    }
    
    .message-detail-content {
        padding: 2rem;
    }
    
    .message-detail-info {
        margin-bottom: 2rem;
    }
    
    .message-detail-info h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }
    
    .message-detail-email {
        margin: 0 0 0.25rem 0;
        color: #666;
    }
    
    .message-detail-date {
        margin: 0;
        color: #666;
        font-size: 0.9em;
    }
    
    .message-detail-body {
        color: #333;
        line-height: 1.6;
    }
    
    .message-detail-body p {
        margin: 0 0 1rem 0;
    }
    
    .message-detail-body p:last-child {
        margin-bottom: 0;
    }
`;

document.head.appendChild(style);




async function getMessagesFromDB() {
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            let timestamp = new Date().toISOString(); // default to current time

            // Handle different timestamp formats
            if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                    // Firestore Timestamp
                    timestamp = data.createdAt.toDate().toISOString();
                } else if (data.createdAt instanceof Date) {
                    // JavaScript Date
                    timestamp = data.createdAt.toISOString();
                } else if (typeof data.createdAt === 'string') {
                    // ISO String
                    timestamp = data.createdAt;
                }
            }

            return {
                id: doc.id,
                ...data,
                createdAt: timestamp
            };
        });
    } catch (error) {
        console.error('Error getting messages from database:', error);
        throw error;
    }
}

// Add to window object
window.toggleMessageRead = toggleMessageRead;
window.deleteMessage = deleteMessage;
window.markSelectedMessagesAsRead = markSelectedMessagesAsRead;
window.markSelectedMessagesAsUnread = markSelectedMessagesAsUnread;
window.showMessageDetails = showMessageDetails;

// Function to compose a reply to a message
async function composeReply(email, isReplyAll, messageId = null) {
    try {
        const message = messageId ? currentMessages.find(m => m.id === messageId) : null;
        const subject = message ? `Re: Message from ${message.name}` : `Re: Conversation`;
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
        
        if (message) {
            // Update the message with reply timestamp
            const messageRef = doc(db, 'messages', messageId);
            await updateDoc(messageRef, {
                repliedAt: serverTimestamp()
            });

            // Create a reply template with original message context
            const replyBody = `\n\n-------------------\nOn ${new Date(message.createdAt).toLocaleString()}, ${message.name} wrote:\n${message.message}`;
            window.location.href = `${mailtoLink}&body=${encodeURIComponent(replyBody)}`;

            // Update UI to show replied status
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const repliedInfo = document.createElement('div');
                repliedInfo.className = 'replied-info';
                repliedInfo.innerHTML = `<span class="replied-badge">Replied ${formatDate(new Date(), 'MMM D, YYYY h:mm A')}</span>`;
                
                // Remove any existing replied-info
                const existingRepliedInfo = messageElement.querySelector('.replied-info');
                if (existingRepliedInfo) {
                    existingRepliedInfo.remove();
                }
                
                // Add the new replied info after message-content
                const messageContent = messageElement.querySelector('.message-content');
                if (messageContent) {
                    messageContent.appendChild(repliedInfo);
                }
            }
        } else {
            window.location.href = mailtoLink;
        }
    } catch (error) {
        console.error('Error updating reply status:', error);
        showNotification('Failed to update reply status', 'error');
    }
}

// Add to window object
window.composeReply = composeReply;

// Add handleReply function
async function handleReply(email, isReplyAll, messageId) {
    try {
        // Update the message with reply timestamp
        const messageRef = doc(db, 'messages', messageId);
        await updateDoc(messageRef, {
            repliedAt: serverTimestamp()
        });

        // Update local state
        const message = currentMessages.find(m => m.id === messageId);
        if (message) {
            message.repliedAt = new Date().toISOString();
            
            // Update the UI immediately
            const replyBadge = document.querySelector(`[data-message-id="${messageId}"]`)
                .closest('.message-thread-item')
                .querySelector('.metadata-left .not-replied-badge');
            if (replyBadge) {
                replyBadge.className = 'replied-badge';
                replyBadge.textContent = `Replied ${formatDate(message.repliedAt, 'MMM D, YYYY HH:mm')}`;
            }
        }

        // Compose the reply
        composeReply(email, isReplyAll, messageId);
    } catch (error) {
        console.error('Error updating reply status:', error);
        showNotification('Failed to update reply status', 'error');
    }
}

// Add to window object
window.handleReply = handleReply;


function handleConversationSelect(event) {
    const checkbox = event.target;
    const email = checkbox.dataset.email;
    const isChecked = checkbox.checked;
    
    // Update all message checkboxes in the conversation
    const messageCheckboxes = document.querySelectorAll('.message-checkbox');
    messageCheckboxes.forEach(msgCheckbox => {
        msgCheckbox.checked = isChecked;
    });
    
    // Update UI to reflect selection
    const messageItems = document.querySelectorAll('.message-thread-item');
    messageItems.forEach(item => {
        item.classList.toggle('selected', isChecked);
    });
    
    updateBulkActionButtons();
}

// Remove first updateBulkActionButtons function
// Add to window object
window.handleConversationSelect = handleConversationSelect;

function toggleConversationSelect(email) {
    const messageCheckboxes = document.querySelectorAll('.message-select');
    const selectAllContainer = document.querySelector('.select-all-container');
    const selectButton = document.querySelector('.message-btn-secondary');
    const bulkActions = document.querySelector('.bulk-actions');
    
    // Early return if required elements don't exist
    if (!selectButton) return;
    
    // Get current selection mode state from the button text
    const isSelectionMode = selectButton.innerHTML.includes('Cancel Selection');
    
    // Toggle message checkboxes
    messageCheckboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.style.display = !isSelectionMode ? 'block' : 'none';
        }
    });
    
    // Toggle select all container
    if (selectAllContainer) {
        selectAllContainer.style.display = !isSelectionMode ? 'flex' : 'none';
    }
    
    // Update button text and icon
    selectButton.innerHTML = !isSelectionMode ? 
        '<i class="fas fa-times"></i> Cancel Selection' : 
        '<i class="fas fa-check-square"></i> Select Messages';
    
    // Reset checkboxes and selection when exiting selection mode
    if (isSelectionMode) {
        const selectAllCheckbox = document.getElementById('selectAllMessages');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        document.querySelectorAll('.message-checkbox').forEach(cb => {
            if (cb) cb.checked = false;
        });
        document.querySelectorAll('.message-thread-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Hide bulk actions and all its buttons
        if (bulkActions) {
            bulkActions.style.display = 'none';
            const actionButtons = bulkActions.querySelectorAll('button');
            actionButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
    }
}

// Function to handle select all messages
function handleSelectAllMessages(event) {
    event.stopPropagation();
    const isChecked = event.target.checked;
    document.querySelectorAll('.message-checkbox').forEach(checkbox => {
        if (checkbox) checkbox.checked = isChecked;
    });
    updateBulkActionButtons();
}





function selectAllMessages(event) {
    const isChecked = event.target.checked;
    const messageCheckboxes = document.querySelectorAll('.message-checkbox');
    
    messageCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const messageItem = checkbox.closest('.message-thread-item');
        if (messageItem) {
            messageItem.classList.toggle('selected', isChecked);
        }
    });
    
    updateBulkActionButtons();
}

// Add to window object
window.toggleConversationSelect = toggleConversationSelect;
window.selectAllMessages = selectAllMessages;
window.resetSelectionMode = resetSelectionMode;

// ... existing code ...

async function deleteSelectedMessages() {
    const selectedMessages = document.querySelectorAll('.message-checkbox:checked');
    if (selectedMessages.length === 0) {
        showNotification('No messages selected', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete the selected messages?')) {
        return;
    }

    try {
        const deletePromises = Array.from(selectedMessages).map(async checkbox => {
            const messageId = checkbox.dataset.messageId;
            const messageRef = doc(db, 'messages', messageId);
            await deleteDoc(messageRef);
            
            // Remove from local state
            currentMessages = currentMessages.filter(msg => msg.id !== messageId);
            
            // Remove element from DOM
            const messageElement = checkbox.closest('.message-thread-item');
            if (messageElement) {
                messageElement.remove();
            }
        });

        await Promise.all(deletePromises);
        await createDashboard();

        // If no messages left in conversation, return to messages list
        const email = selectedMessages[0].dataset.email;
        const remainingMessages = currentMessages.filter(msg => msg.email === email);
        if (remainingMessages.length === 0) {
            await loadMessagesSection();
        } else {
            resetSelectionMode();
        }

        showNotification('Messages deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting messages:', error);
        showNotification('Failed to delete messages', 'error');
    }
}

// Add to window object
window.deleteSelectedMessages = deleteSelectedMessages;

// Add the missing updateBulkActionState function
function updateBulkActionState() {
    const selectedMessages = document.querySelectorAll('.message-item.selected');
    const bulkActions = document.getElementById('bulkActions');
    const selectAllCheckbox = document.getElementById('selectAllMessages');
    
    if (bulkActions) {
        if (selectedMessages.length > 0) {
            bulkActions.classList.remove('hidden');
            // Update select all checkbox state
            if (selectAllCheckbox) {
                const allMessages = document.querySelectorAll('.message-item');
                selectAllCheckbox.checked = selectedMessages.length === allMessages.length;
                selectAllCheckbox.indeterminate = selectedMessages.length > 0 && selectedMessages.length < allMessages.length;
            }
        } else {
            bulkActions.classList.add('hidden');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        }
    }
}



// Update loadMessagesSection to use a single consistent layout
async function loadMessagesSection() {
    const messagesSection = document.getElementById('messagesSection');
    if (!messagesSection) return;

    try {
        messagesSection.classList.add('loading');
        
        // Check authentication first
        if (!isAdmin()) {
            throw new Error('Please log in to access messages');
        }
        
        // Create or update the messages list container
        messagesSection.innerHTML = `
            <div class="section-header">
                <h2>Messages</h2>
                <div class="message-filters">
                    <div class="search-container">
                        <input type="text" id="messageSearch" placeholder="Search by name or email..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    <select id="messageFilter" class="filter-select">
                        <option value="all">All Messages</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                    </select>
                    <input type="date" id="dateFilter" class="filter-select" title="Filter by date">
                    <button id="resetFilters" class="message-btn" onclick="resetFilters()" style="display: none;">
                        <i class="fas fa-times"></i> Reset Filters
                    </button>
                </div>
            </div>
            <div id="messageStats" class="stats-container"></div>
            <div class="bulk-actions" style="display: none;">
                <button onclick="markSelectedMessagesAsRead()" class="message-btn" data-action="mark-read">
                    <i class="fas fa-envelope-open"></i> Mark as Read
                </button>
                <button onclick="markSelectedMessagesAsUnread()" class="message-btn" data-action="mark-unread">
                    <i class="fas fa-envelope"></i> Mark as Unread
                </button>
                <button onclick="replyAllSelected()" class="message-btn" data-action="reply-all">
                    <i class="fas fa-reply-all"></i> Reply All
                </button>
                <button onclick="deleteSelectedMessages()" class="message-btn delete-button" data-action="delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <div id="messagesList" class="messages-list">
                <p class="no-messages">No messages found.</p>
            </div>
        `;
        
        // Set up realtime listener for messages
        subscribeToMessages((messages) => {
            if (Array.isArray(messages)) {
                // Update current messages in memory
                window.currentMessages = messages;
                renderMessagesList(messages);
                updateMessageStats(messages);
            }
        });
        
        // Set up realtime listener for dashboard stats
        subscribeToStats((stats) => {
            if (stats) {
                updateDashboardStats(stats);
            }
        });
        
        initializeMessageListHandlers();
        initializeSearch();
        initializeFilters();
        messagesSection.classList.remove('loading');
    } catch (error) {
        console.error('Error loading messages section:', error);
        showNotification(error.message, 'error');
        messagesSection.classList.remove('loading');
    }
}

// Simplify backToMessages to just reset and reload the messages section
function backToMessages() {
    // Reset the current open conversation
    window.currentOpenConversation = null;
    
    // Reset message section state
    resetMessageSectionState();
    
    // Reload messages section
    loadMessagesSection();
}





// Helper function to toggle message read status
async function toggleMessageRead(messageId) {
    try {
        const messageElement = document.querySelector(`.message-item[data-id="${messageId}"]`);
        const isCurrentlyRead = messageElement.classList.contains('read');
        
        if (isCurrentlyRead) {
            await markMessageAsUnread(messageId);
        } else {
            await markMessageAsRead(messageId);
        }
    } catch (error) {
        console.error('Error toggling message status:', error);
        showNotification('Failed to update message status', 'error');
    }
}

// Add to window object for onclick handlers
window.toggleMessageRead = toggleMessageRead;
window.deleteMessage = deleteMessage;
window.replyAllSelected = replyAllSelected;

// Update the messages list function to restore conversation grouping
function updateMessagesList(messages) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    // Group messages by email
    const groupedMessages = messages.reduce((groups, message) => {
        if (!groups[message.email]) {
            groups[message.email] = [];
        }
        groups[message.email].push(message);
        return groups;
    }, {});

    // Sort messages within each group by date and create list items
    messagesList.innerHTML = Object.keys(groupedMessages).length === 0 ? 
        '<p class="no-messages">No messages found.</p>' :
        Object.entries(groupedMessages).map(([email, emailMessages]) => {
            // Sort messages by date (newest first)
            emailMessages.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());
            const latestMessage = emailMessages[0];
            const unreadCount = emailMessages.filter(msg => !msg.read).length;
            
            return `
                <div class="message-thread-item ${unreadCount > 0 ? 'unread' : ''}" 
                     data-message-id="${latestMessage.id}"
                     data-email="${email}"
                     onclick="showMessageDetails('${latestMessage.id}')">
                    <div class="message-checkbox">
                        <input type="checkbox" 
                               class="message-select" 
                               data-id="${latestMessage.id}"
                               data-email="${email}"
                               onclick="event.stopPropagation()">
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <div class="message-info">
                                <span class="message-name">${latestMessage.name}</span>
                                ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount} unread</span>` : ''}
                            </div>
                            <span class="message-date">${formatDate(latestMessage.createdAt)}</span>
                        </div>
                        <div class="message-email">${email} (${emailMessages.length} messages)</div>
                        <div class="message-preview">${latestMessage.message?.substring(0, 100)}${latestMessage.message?.length > 100 ? '...' : ''}</div>
                    </div>
                    <div class="message-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); toggleConversationRead('${email}')">
                            <i class="fas ${unreadCount > 0 ? 'fa-envelope' : 'fa-envelope-open'}"></i>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); deleteConversation('${email}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    // Initialize message handlers
    initializeMessageListHandlers();
}

// Function to show message details/conversation
async function showMessageDetails(messageId) {
    try {
        const messages = window.currentMessages;
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const email = message.email;
        
        // Store the current email in a global variable to track which conversation is open
        window.currentOpenConversation = email;

        const conversationMessages = messages.filter(m => m.email === email)
            .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());

        // Get sender details
        const nameFrequency = {};
        conversationMessages.forEach(msg => {
            nameFrequency[msg.name] = (nameFrequency[msg.name] || 0) + 1;
        });
        const mostUsedName = Object.entries(nameFrequency)
            .sort((a, b) => b[1] - a[1])[0][0];

        // Mark all unread messages in this conversation as read
        const unreadMessages = conversationMessages.filter(msg => !msg.read);
        if (unreadMessages.length > 0) {
            try {
                await Promise.all(unreadMessages.map(msg => markMessageAsRead(msg.id)));
                unreadMessages.forEach(msg => {
                    const messageIndex = window.currentMessages.findIndex(m => m.id === msg.id);
                    if (messageIndex !== -1) {
                        window.currentMessages[messageIndex].read = true;
                    }
                });
                updateMessagesList(window.currentMessages);
                updateMessageStats(window.currentMessages);
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        }

        const messagesSection = document.getElementById('messagesSection');
        messagesSection.innerHTML = `
            <div class="sender-details">
                <div class="sender-header">
                    <button onclick="backToMessages()" class="btn-circle">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="sender-info">
                        <h3>Sender Details</h3>
                        <p><strong>Name:</strong> ${mostUsedName}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Total Messages:</strong> ${conversationMessages.length}</p>
                    </div>
                </div>
                <hr class="sender-divider">
            </div>
            <div class="section-header">
                <div class="section-actions">
                    <button onclick="toggleConversationSelect('${email}')" class="message-btn-secondary message-btn">
                        <i class="fas fa-check-square"></i> Select Messages
                    </button>
                    <div class="select-all-container" style="display: none;">
                        <input type="checkbox" id="selectAllMessages" class="select-all-checkbox" onchange="selectAllMessages(event)">
                        <span>Select All (0/0)</span>
                    </div>
                    <div class="bulk-actions" style="display: none;">
                        <button onclick="markSelectedMessagesAsRead()" class="message-btn btn-primary" data-action="mark-read">
                            <i class="fas fa-envelope-open"></i>
                        </button>
                        <button onclick="markSelectedMessagesAsUnread()" class="message-btn btn-info" data-action="mark-unread">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <button onclick="replyAllSelected()" class="message-btn btn-success" data-action="reply-all">
                            <i class="fas fa-reply-all"></i>
                        </button>
                        <button onclick="deleteSelectedMessages()" class="message-btn btn-danger" data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="messages-timeline">
                ${conversationMessages.map(msg => `
                    <div class="message-thread-item ${msg.read ? 'read' : 'unread'}" data-message-id="${msg.id}">
                        <div class="message-select" style="display: none;">
                            <input type="checkbox" 
                                   class="message-checkbox" 
                                   data-message-id="${msg.id}"
                                   data-email="${email}"
                                   data-read="${msg.read}"
                                   onclick="handleMessageSelect(event)">
                        </div>
                        <div class="message-entry">
                            <div class="message-time">${formatDate(msg.createdAt, 'MMM D, YYYY h:mm A')}</div>
                            <div class="message-content">
                                <div class="message-sender">
                                    From: ${msg.name}
                                    ${!msg.read ? '<span class="unread-dot"></span>' : ''}
                                </div>
                                <div class="message-text">${msg.message}</div>
                                ${msg.repliedAt ? `
                                    <div class="replied-info">
                                        <span class="replied-badge">
                                            <i class="fas fa-reply"></i> Replied ${formatDate(msg.repliedAt, 'MMM D, YYYY h:mm A')}
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="hover-actions">
                                <button onclick="composeReply('${email}', false, '${msg.id}')" class="btn-icon" data-action="reply">
                                    <i class="fas fa-reply"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Initialize message handlers
        initializeMessageListHandlers();
        
    } catch (error) {
        console.error('Error showing message details:', error);
        showNotification('Failed to load conversation', 'error');
    }
}

// Function to handle marking messages as read (all or selected)
async function markMessagesAsRead(email) {
    const isSelectionMode = document.querySelector('.select-all-container')?.style.display !== 'none';
    
    try {
        if (isSelectionMode) {
            // Handle selected messages
            const selectedCheckboxes = document.querySelectorAll('.message-checkbox:checked, .message-list-checkbox:checked');
            if (selectedCheckboxes.length === 0) {
                showNotification('No messages selected', 'error');
                return;
            }

            const updatePromises = Array.from(selectedCheckboxes).map(async checkbox => {
                const messageId = checkbox.dataset.messageId;
                await markMessageAsRead(messageId);
            });
            
            await Promise.all(updatePromises);
            showNotification('Selected messages marked as read', 'success');
        } else {
            // Handle single message
            const messageId = document.querySelector('.message-thread-item.selected')?.dataset.messageId;
            if (!messageId) {
                showNotification('No message selected', 'error');
                return;
            }

            await markMessageAsRead(messageId);
            showNotification('Message marked as read', 'success');
        }
        
        // Reset state and refresh view
        resetMessageSectionState();
        await loadMessagesSection();
        
    } catch (error) {
        console.error('Error marking messages as read:', error);
        showNotification('Failed to mark messages as read', 'error');
    }
}

// Function to handle marking messages as unread (all or selected)
async function markMessagesAsUnread(email) {
    const isSelectionMode = document.querySelector('.select-all-container')?.style.display !== 'none';
    
    try {
        if (isSelectionMode) {
            // Handle selected messages
            const selectedCheckboxes = document.querySelectorAll('.message-checkbox:checked, .message-list-checkbox:checked');
            if (selectedCheckboxes.length === 0) {
                showNotification('No messages selected', 'error');
                return;
            }

            const updatePromises = Array.from(selectedCheckboxes).map(async checkbox => {
                const messageId = checkbox.dataset.messageId;
                await markMessageAsUnread(messageId);
            });
            
            await Promise.all(updatePromises);
            showNotification('Selected messages marked as unread', 'success');
        } else {
            // Handle all messages in conversation
            const messages = window.currentMessages.filter(m => m.email === email);
            if (!messages || messages.length === 0) {
                showNotification('No messages found', 'error');
                return;
            }

            const updatePromises = messages.map(async msg => {
                if (msg.read) {
                    await markMessageAsUnread(msg.id);
                }
            });
            
            await Promise.all(updatePromises);
            showNotification('All messages marked as unread', 'success');
        }
        
        // Reset state and refresh view
        resetMessageSectionState();
        await loadMessagesSection();
        
    } catch (error) {
        console.error('Error marking messages as unread:', error);
        showNotification('Failed to mark messages as unread', 'error');
    }
}

// Function to handle deleting messages (all or selected)
async function deleteMessages(email) {
    const isSelectionMode = document.querySelector('.select-all-container')?.style.display !== 'none';
    const isInConversationView = window.currentOpenConversation !== null;
    
    try {
        if (isSelectionMode) {
            // Handle selected messages
            const selectedCheckboxes = document.querySelectorAll('.message-checkbox:checked, .message-list-checkbox:checked');
            if (selectedCheckboxes.length === 0) {
                showNotification('No messages selected', 'error');
                return;
            }

            if (!confirm('Are you sure you want to delete the selected messages?')) {
                return;
            }

            const deletePromises = Array.from(selectedCheckboxes).map(async checkbox => {
                const messageId = checkbox.dataset.messageId;
                await deleteDoc(doc(db, 'messages', messageId));
            });
            
            await Promise.all(deletePromises);
            showNotification('Selected messages deleted', 'success');
            
            // Reset selection mode
            const selectButton = document.querySelector('.message-btn-secondary');
            if (selectButton && selectButton.innerHTML.includes('Cancel Selection')) {
                toggleConversationSelect(email);
            }
        } else {
            // Handle all messages in conversation
            if (!confirm('Are you sure you want to delete all messages in this conversation?')) {
                return;
            }
            
            const messages = window.currentMessages.filter(m => m.email === email);
            const deletePromises = messages.map(msg => deleteDoc(doc(db, 'messages', msg.id)));
            
            await Promise.all(deletePromises);
            showNotification('All messages deleted', 'success');
            
            // If in conversation view, go back to message list
            if (isInConversationView) {
                backToMessages();
                return;
            }
        }
        
        // Only reset state and refresh if we're in the message list view
        if (!isInConversationView) {
            resetMessageSectionState();
            await loadMessagesSection();
        }
        
    } catch (error) {
        console.error('Error deleting messages:', error);
        showNotification('Failed to delete messages', 'error');
    }
}

// Add to window object
window.markMessagesAsRead = markMessagesAsRead;
window.markMessagesAsUnread = markMessagesAsUnread;
window.deleteMessages = deleteMessages;



// Add to window object
window.showMessageDetails = showMessageDetails;
window.backToMessages = backToMessages;

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('messageSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce(function() {
        filterMessages();
    }, 300));
}

// Initialize filter functionality
function initializeFilters() {
    const statusFilter = document.getElementById('messageFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (statusFilter) {
        statusFilter.addEventListener('change', filterMessages);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', filterMessages);
    }
}

// Filter messages based on search and filters
function filterMessages() {
    const searchTerm = document.getElementById('messageSearch').value.toLowerCase();
    const statusFilter = document.getElementById('messageFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    // Show/hide reset button based on filter state
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.style.display = (searchTerm || statusFilter !== 'all' || dateFilter) ? 'inline-flex' : 'none';
    }

    const filteredMessages = window.currentMessages.filter(message => {
        // Search filter
        const matchesSearch = message.name.toLowerCase().includes(searchTerm) || 
                            message.message.toLowerCase().includes(searchTerm) ||
                            message.email.toLowerCase().includes(searchTerm);

        // Status filter
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'unread' && !message.read) ||
                            (statusFilter === 'read' && message.read);

        // Date filter
        let matchesDate = true;
        if (dateFilter) {
            const messageDate = message.createdAt?.toDate?.() || new Date(message.createdAt);
            const filterDate = new Date(dateFilter);
            matchesDate = messageDate.toDateString() === filterDate.toDateString();
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    renderMessagesList(filteredMessages);
    updateMessageStats(filteredMessages);
}

// Function to reset all filters
function resetFilters() {
    document.getElementById('messageSearch').value = '';
    document.getElementById('messageFilter').value = 'all';
    document.getElementById('dateFilter').value = '';
    
    renderMessagesList(window.currentMessages);
    updateMessageStats(window.currentMessages);
    
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.style.display = 'none';
    }
}

// Add to window object for onclick handler
window.resetFilters = resetFilters;



// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function renderMessagesList(messages) {
    const messagesList = document.querySelector('.messages-list');
    if (!messagesList) return;

    if (!messages || messages.length === 0) {
        messagesList.innerHTML = `
            <div class="messages-empty">
                <i class="fas fa-inbox"></i>
                <p>No messages found</p>
            </div>
        `;
        return;
    }

    // Group messages by email (conversation)
    const conversations = messages.reduce((acc, msg) => {
        if (!acc[msg.email]) {
            acc[msg.email] = [];
        }
        acc[msg.email].push(msg);
        return acc;
    }, {});

    // Sort conversations by latest message
    const sortedConversations = Object.entries(conversations)
        .map(([email, msgs]) => {
            const latestMsg = msgs.reduce((latest, msg) => 
                msg.createdAt > latest.createdAt ? msg : latest
            );
            const unreadCount = msgs.filter(msg => !msg.read).length;
            return {
                email,
                name: msgs[0].name,
                latestMessage: latestMsg,
                unreadCount,
                messages: msgs
            };
        })
        .sort((a, b) => b.latestMessage.createdAt - a.latestMessage.createdAt);

    // Create header with selection button and action buttons
    const headerHtml = `
        <div class="messages-header">
            <div class="header-left">
                <button id="msgSelectToggle" class="message-btn" onclick="toggleMessageSelection()">
                    <i class="fas fa-check-square"></i> Select Messages
                </button>
                <div class="select-all-container" style="display: none;">
                    <input type="checkbox" id="selectAllMessages" onchange="selectAllMessages(event)">
                    <span>Select All (0/0)</span>
                </div>
            </div>
            <div id="msgBulkActions" class="bulk-actions" style="display: none;">
                <button class="message-btn btn-primary" data-action="mark-read" onclick="markSelectedMessagesAsRead()">
                    <i class="fas fa-envelope-open"></i>
                </button>
                <button class="message-btn btn-info" data-action="mark-unread" onclick="markSelectedMessagesAsUnread()">
                    <i class="fas fa-envelope"></i>
                </button>
                <button class="message-btn btn-success" data-action="reply-all" onclick="replyAllSelected()">
                    <i class="fas fa-reply-all"></i>
                </button>
                <button class="message-btn btn-danger" data-action="delete" onclick="deleteSelectedMessages()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    // Render conversations
    const conversationsHtml = sortedConversations.map(conv => {
        const { email, name, latestMessage, unreadCount, messages } = conv;
        const isUnread = unreadCount > 0;
        const messageCount = messages.length;
        
        return `
            <div class="message-list-item ${isUnread ? 'unread' : ''}" 
                 onclick="showMessageDetails('${latestMessage.id}')"
                 data-email="${email}">
                <div class="msg-checkbox" style="display: none;">
                    <input type="checkbox" 
                           class="message-checkbox" 
                           onclick="handleMessageSelect(event)"
                           data-message-id="${latestMessage.id}"
                           data-email="${email}">
                </div>
                <div class="message-list-content">
                    <div class="message-list-sender">${name}</div>
                    <div class="message-list-preview">
                        ${latestMessage.message?.substring(0, 100)}${latestMessage.message?.length > 100 ? '...' : ''}
                        ${messageCount > 1 ? `<span class="message-count">+${messageCount - 1} messages</span>` : ''}
                    </div>
                    <div class="message-list-time">${formatDate(latestMessage.createdAt, 'MMM D, YYYY h:mm A')}</div>
                </div>
            </div>
        `;
    }).join('');

    messagesList.innerHTML = headerHtml + conversationsHtml;
}

// Toggle message selection mode
function toggleMessageSelection() {
    const checkboxContainers = document.querySelectorAll('.msg-checkbox');
    const bulkActions = document.getElementById('msgBulkActions');
    const selectToggle = document.getElementById('msgSelectToggle');
    const selectAllContainer = document.querySelector('.select-all-container');
    
    const isSelectionMode = selectToggle.innerHTML.includes('Cancel Selection');
    
    checkboxContainers.forEach(container => {
        container.style.display = isSelectionMode ? 'none' : 'flex';
        if (container.querySelector('input')) {
            container.querySelector('input').checked = false;
        }
    });
    
    if (isSelectionMode) {
        // Hide all action buttons and containers when canceling selection
        if (bulkActions) {
            bulkActions.style.display = 'none';
        }
        if (selectAllContainer) {
            selectAllContainer.style.display = 'none';
        }
        if (selectToggle) {
            selectToggle.innerHTML = '<i class="fas fa-check-square"></i> Select Messages';
        }
    } else {
        if (selectAllContainer) {
            selectAllContainer.style.display = 'flex';
        }
        if (selectToggle) {
            selectToggle.innerHTML = '<i class="fas fa-times"></i> Cancel Selection';
            // Initialize selection count
            if (selectAllContainer) {
                selectAllContainer.querySelector('span').textContent = 
                    `Select All (0/${checkboxContainers.length})`;
            }
        }
        // Show bulk actions container but keep buttons hidden initially
        if (bulkActions) {
            bulkActions.style.display = 'flex';
        }
    }
    
    // Reset all selections and update bulk action buttons
    updateBulkActionButtons();
}

// Update bulk action buttons based on selection
function updateBulkActionButtons() {
    // First check if we're in list view or detail view
    const bulkActions = document.getElementById('msgBulkActions') || document.querySelector('.bulk-actions');
    if (!bulkActions) return;
    
    const selectedMessages = document.querySelectorAll('.message-checkbox:checked');
    const totalMessages = document.querySelectorAll('.message-checkbox');
    const markReadBtn = bulkActions.querySelector('[data-action="mark-read"]');
    const markUnreadBtn = bulkActions.querySelector('[data-action="mark-unread"]');
    const replyAllBtn = bulkActions.querySelector('[data-action="reply-all"]');
    const deleteBtn = bulkActions.querySelector('[data-action="delete"]');
    
    // Update selection count
    const selectAllContainer = document.querySelector('.select-all-container');
    if (selectAllContainer) {
        selectAllContainer.querySelector('span').textContent = 
            `Select All (${selectedMessages.length}/${totalMessages.length})`;
    }
    
    if (selectedMessages.length > 0) {
        // Show bulk actions container
        bulkActions.style.display = 'flex';
        
        // Check if all selected messages are read/unread
        const allRead = Array.from(selectedMessages).every(cb => {
            const messageItem = cb.closest('.message-list-item, .message-thread-item');
            return !messageItem.classList.contains('unread');
        });
        
        const allUnread = Array.from(selectedMessages).every(cb => {
            const messageItem = cb.closest('.message-list-item, .message-thread-item');
            return messageItem.classList.contains('unread');
        });
        
        // Show/hide appropriate buttons
        if (markReadBtn) {
            markReadBtn.style.display = allRead ? 'none' : 'inline-flex';
        }
        if (markUnreadBtn) {
            markUnreadBtn.style.display = allUnread ? 'none' : 'inline-flex';
        }
        if (replyAllBtn) {
            replyAllBtn.style.display = 'inline-flex';
        }
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-flex';
        }
    } else {
        // Hide bulk actions container
        bulkActions.style.display = 'none';
    }
}

// Function to reset message section to default state
function resetMessageSectionState() {
    const selectAllContainer = document.querySelector('.select-all-container');
    const messageCheckboxes = document.querySelectorAll('.msg-checkbox, .message-select');
    const selectButton = document.querySelector('.message-btn-secondary');
    const bulkActions = document.getElementById('msgBulkActions') || document.querySelector('.bulk-actions');
    const selectToggle = document.getElementById('msgSelectToggle');

    if (selectAllContainer) {
        selectAllContainer.style.display = 'none';
    }

    messageCheckboxes.forEach(checkbox => {
        checkbox.style.display = 'none';
    });

    if (selectToggle) {
        selectToggle.innerHTML = '<i class="fas fa-check-square"></i> Select Messages';
    }

    // Uncheck all checkboxes
    document.querySelectorAll('.message-checkbox, .message-select input[type="checkbox"]').forEach(cb => {
        if (cb) cb.checked = false;
    });

    // Remove selected class from all messages
    document.querySelectorAll('.message-list-item, .message-thread-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Reset bulk actions
    if (bulkActions) {
        bulkActions.style.display = 'none';
    }
}

// Add functions to window object
window.toggleMessageSelection = toggleMessageSelection;
window.handleMessageSelect = handleMessageSelect;
window.resetMessageSectionState = resetMessageSectionState;
window.backToMessages = backToMessages;
window.selectAllMessages = selectAllMessages;

// Add replyAllSelected function
async function replyAllSelected() {
    const selectedMessages = document.querySelectorAll('.message-checkbox:checked');
    if (selectedMessages.length === 0) {
        showNotification('No messages selected', 'error');
        return;
    }

    try {
        const updatePromises = Array.from(selectedMessages).map(async checkbox => {
            const messageId = checkbox.dataset.messageId;
            const messageRef = doc(db, 'messages', messageId);
            await updateDoc(messageRef, {
                repliedAt: serverTimestamp()
            });
            
            // Update local state
            const message = currentMessages.find(m => m.id === messageId);
            if (message) {
                message.repliedAt = new Date().toISOString();
            }
        });

        await Promise.all(updatePromises);
        showNotification('Messages marked as replied successfully', 'success');
        resetSelectionMode();
    } catch (error) {
        console.error('Error marking messages as replied:', error);
        showNotification('Failed to mark messages as replied', 'error');
    }
}

// Add to window object
window.replyAllSelected = replyAllSelected;

// Mobile device detection
function isMobileDevice() {
    return (window.innerWidth <= 768) || 
           (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

// Function to show mobile warning
function showMobileWarning() {
    const adminName = localStorage.getItem('adminName') || 'Admin';
    const warningMessage = `
        <div class="mobile-warning">
            <i class="fas fa-mobile-alt"></i>
            <h2>Hey ${adminName}!</h2>
            <p>It looks like you're using a mobile device to access the admin panel.</p>
            <p>For the best experience and easier content management, please use a tablet or desktop computer.</p>
            <div class="warning-actions">
                <button class="btn-primary continue-anyway">Continue Anyway</button>
                <a href="/" class="btn-secondary">Go to Main Site</a>
            </div>
        </div>
    `;

    const warningOverlay = document.createElement('div');
    warningOverlay.className = 'mobile-warning-overlay';
    warningOverlay.innerHTML = warningMessage;
    document.body.appendChild(warningOverlay);

    // Add event listener for "Continue Anyway"
    warningOverlay.querySelector('.continue-anyway').addEventListener('click', () => {
        warningOverlay.classList.add('fade-out');
        setTimeout(() => warningOverlay.remove(), 300);
        localStorage.setItem('ignoreMobileWarning', 'true');
    });
}

// Check device on load
document.addEventListener('DOMContentLoaded', () => {
    if (isMobileDevice() && !localStorage.getItem('ignoreMobileWarning')) {
        showMobileWarning();
    }
});

// Check on resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (isMobileDevice() && !localStorage.getItem('ignoreMobileWarning')) {
            showMobileWarning();
        }
    }, 250);
});






