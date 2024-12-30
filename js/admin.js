// Import Firebase functions and objects
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
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
    updateSkills
} from './firebase-config.js';

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
        const [projects, posts, messages] = await Promise.all([
            loadProjects(),
            loadBlogPosts(),
            loadMessages(),
            loadCertificationsContent()
        ]);

        currentProjects = projects || [];
        currentPosts = posts || [];
        currentMessages = messages || [];

        // Create dashboard with updated content
        createDashboard();

    } catch (error) {
        console.error('Error loading content:', error);
        showNotification('Error loading content. Please try again.', 'error');
    }
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
    document.getElementById(`${sectionId}Section`).style.display = 'block';
    
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
window.cancelProjectEdit = cancelProjectEdit;
window.cancelBlogEdit = cancelBlogEdit;

// Message Functions
async function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            await deleteMessageFromDB(messageId);
            await loadMessagesSection(); // Reload messages after deletion
            await createDashboard(); // Update dashboard stats
            showNotification('Message deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting message:', error);
            showNotification('Failed to delete message', 'error');
        }
    }
}



async function markMessageAsRead(messageId) {
    try {
        const messageRef = doc(db, 'messages', messageId);
        await updateDoc(messageRef, {
            read: true,
            readAt: serverTimestamp()
        });
        
        // Update local state
        const message = currentMessages.find(msg => msg.id === messageId);
        if (message) {
            message.read = true;
            message.readAt = new Date().toISOString();
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
    }
}

async function markMessageAsUnread(messageId) {
    try {
        const messageRef = doc(db, 'messages', messageId);
        await updateDoc(messageRef, {
            read: false,
            readAt: null
        });
        
        // Update local state
        const message = currentMessages.find(msg => msg.id === messageId);
        if (message) {
            message.read = false;
            message.readAt = null;
        }
    } catch (error) {
        console.error('Error marking message as unread:', error);
        throw error;
    }
}

async function toggleMessageRead(messageId, isRead) {
    try {
        if (isRead) {
            await markMessageAsUnread(messageId);
        } else {
            await markMessageAsRead(messageId);
        }
        await createDashboard();
        showMessageDetails(messageId);
        showNotification(`Message marked as ${isRead ? 'unread' : 'read'}`, 'success');
    } catch (error) {
        console.error('Error toggling message read status:', error);
        showNotification('Failed to update message status', 'error');
    }
}

async function loadMessagesSection() {
    try {
        // Initialize pagination and filter state
        window.currentPage = 1;
        window.currentFilters = {
            read: 'all',
            date: 'all'
        };

        // Get messages from database
        const messages = await getMessagesFromDB();
        window.currentMessages = messages;
        
        // Initialize message list container
        const messagesContainer = document.getElementById('messagesSection');
        if (!messagesContainer) {
            throw new Error('Messages container not found');
        }
        
        messagesContainer.innerHTML = `
            <div class="section-header">
                <h2>Messages</h2>
                <div class="section-actions">
                    <button class="icon-button" onclick="toggleMessageSearch()">
                        <i class="fas fa-search"></i>
                        Search
                    </button>
                    <button class="icon-button" onclick="toggleMessageFilter()">
                        <i class="fas fa-filter"></i>
                        Filter
                    </button>
                </div>
            </div>
            <div class="search-bar" style="display: none;">
                <div class="search-input-container">
                    <input type="text" placeholder="Search messages..." oninput="handleMessageSearch()">
                    <button class="clear-search" onclick="clearMessageSearch()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="filter-bar" style="display: none;">
                <div class="filter-group">
                    <label>Status:</label>
                    <select onchange="applyMessageFilters()">
                        <option value="all">All</option>
                        <option value="read">Read</option>
                        <option value="unread">Unread</option>
                    </select>
                    <label>Date:</label>
                    <select onchange="applyMessageFilters()">
                        <option value="all">All time</option>
                        <option value="today">Today</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                    </select>
                    <button class="clear-filters" onclick="clearMessageFilters()">
                        Clear Filters
                    </button>
                </div>
            </div>
            <div class="messages-list">
                <div class="bulk-actions">
                    <div class="message-checkbox">
                        <input type="checkbox" onchange="toggleAllMessages()">
                    </div>
                    <button class="icon-button" onclick="markSelectedMessagesAsRead()">
                        <i class="fas fa-envelope-open"></i>
                        Mark as Read
                    </button>
                    <button class="icon-button" onclick="markSelectedMessagesAsUnread()">
                        <i class="fas fa-envelope"></i>
                        Mark as Unread
                    </button>
                    <button class="icon-button" onclick="deleteSelectedMessages()">
                        <i class="fas fa-trash"></i>
                        Delete Selected
                    </button>
                </div>
                <div id="messages-container"></div>
            </div>
            <div class="pagination" id="messages-pagination"></div>`;

        // Initialize message handlers
        initializeMessageListHandlers();

    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Failed to load messages. Please try again.', 'error');
    }
}

function renderMessagesList(messages, page, filters) {
    if (!messages || messages.length === 0) {
        return `<div class="no-messages">No messages found</div>`;
    }

    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    const displayedMessages = messages.slice(startIndex, endIndex);

    return displayedMessages.map(message => {
        const date = new Date(message.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="message-item ${message.read ? '' : 'message-unread'}" data-id="${message.id}">
                <div class="message-checkbox">
                    <input type="checkbox" class="message-select" data-id="${message.id}">
                </div>
                <div class="message-content" onclick="showMessageDetails(${JSON.stringify(message).replace(/"/g, '&quot;')})">
                    <div class="message-info">
                        <div class="message-header">
                            <span class="message-name">${message.name}</span>
                            <span class="message-date">${formattedDate}</span>
                        </div>
                        <div class="message-email">${message.email}</div>
                        <div class="message-preview">${message.message.substring(0, 100)}${message.message.length > 100 ? '...' : ''}</div>
                    </div>
                </div>
                <div class="message-actions">
                    <button class="icon-button" onclick="event.stopPropagation(); toggleMessageRead('${message.id}', ${!message.read})">
                        <i class="fas ${message.read ? 'fa-envelope' : 'fa-envelope-open'}"></i>
                    </button>
                    <button class="icon-button danger" onclick="event.stopPropagation(); deleteMessage('${message.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPagination(totalMessages, currentPage) {
    const totalPages = Math.ceil(totalMessages / 10);
    if (totalPages <= 1) return '';

    let paginationHtml = '<div class="pagination">';
    
    // Previous button
    paginationHtml += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHtml += `<button class="active">${i}</button>`;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHtml += `<button onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHtml += '<span class="ellipsis">...</span>';
        }
    }

    // Next button
    paginationHtml += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHtml += '</div>';
    return paginationHtml;
}

function changePage(newPage) {
    const elements = window.messageElements;
    if (!elements) return;

    window.currentPage = newPage;
    renderCurrentView();
}

// Add styles for new message management system
const msgStyles = document.createElement('style');
msgStyles.textContent = `
    .msg-section-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    .msg-header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .msg-controls {
        display: flex;
        gap: 0.5rem;
    }

    .msg-btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
    }

    .msg-btn:hover {
        background: var(--bg-hover);
    }

    .msg-btn.danger {
        background: #dc3545;
        color: white;
        border-color: #dc3545;
    }

    .msg-btn.danger:hover {
        background: #c82333;
    }

    .msg-search-bar, .msg-filter-bar {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-secondary);
    }

    .search-input-group {
        display: flex;
        gap: 0.5rem;
    }

    .search-input-group input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
    }

    .msg-list {
        padding: 1rem;
    }

    .msg-item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .msg-item:hover {
        background: var(--bg-hover);
    }

    .msg-unread {
        background: var(--bg-unread);
    }

    .msg-checkbox {
        display: flex;
        align-items: center;
    }

    .msg-checkbox input {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .msg-content {
        flex: 1;
    }

    .msg-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
    }

    .msg-sender h4 {
        margin: 0;
        color: var(--text-primary);
    }

    .msg-sender p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .msg-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .msg-date {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .msg-preview {
        color: var(--text-secondary);
        font-size: 0.95rem;
    }

    .msg-pagination {
        padding: 1rem;
        display: flex;
        justify-content: center;
        gap: 0.5rem;
    }

    .msg-page-btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-secondary);
        cursor: pointer;
    }

    .msg-page-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }

    .msg-page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .msg-empty {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
    }
`;

document.head.appendChild(msgStyles);

// Function to toggle all message checkboxes
function toggleAllMessages() {
    const checkboxes = document.querySelectorAll('.message-select');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
}

// Function to delete selected messages
async function deleteSelectedMessages() {
    const selectedMessages = document.querySelectorAll('.message-select:checked');
    if (selectedMessages.length === 0) {
        showNotification('No messages selected', 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete ${selectedMessages.length} selected message(s)?`)) {
        try {
            const deletePromises = Array.from(selectedMessages).map(checkbox => {
                const messageId = checkbox.closest('.message-item').dataset.messageId;
                return deleteMessageFromDB(messageId);
            });

            await Promise.all(deletePromises);
            await loadMessagesSection();
            await createDashboard();
            showNotification('Selected messages deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting messages:', error);
            showNotification('Failed to delete some messages', 'error');
        }
    }
}

// Function to delete all messages
async function deleteAllMessages() {
    if (currentMessages.length === 0) {
        showNotification('No messages to delete', 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete all ${currentMessages.length} messages? This action cannot be undone.`)) {
        try {
            const deletePromises = currentMessages.map(message => deleteMessageFromDB(message.id));
            await Promise.all(deletePromises);
            await loadMessagesSection();
            await createDashboard();
            showNotification('All messages deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting all messages:', error);
            showNotification('Failed to delete all messages', 'error');
        }
    }
}

// Add to window object
window.toggleAllMessages = toggleAllMessages;
window.deleteSelectedMessages = deleteSelectedMessages;
window.deleteAllMessages = deleteAllMessages;

function showMessageDetails(message) {
    const messagesContent = document.getElementById('messagesContent');
    const date = new Date(message.createdAt);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const detailsView = `
        <div class="message-details">
            <div class="details-header">
                <button onclick="loadMessagesSection()" class="btn-icon" title="Back to Messages">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h3>Message Details</h3>
            </div>
            <div class="details-content">
                <div class="sender-info">
                    <h4>${message.name}</h4>
                    <p>${message.email}</p>
                    <p class="date">${formattedDate} ${formattedTime}</p>
                </div>
                <div class="message-body">
                    <p>${message.message}</p>
                </div>
                <div class="details-actions">
                    <button onclick="window.location.href='mailto:${message.email}'" class="btn primary">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button onclick="deleteMessage('${message.id}')" class="btn danger">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    
    messagesContent.innerHTML = detailsView;
}

// Add to window object
window.deleteMessage = deleteMessage;
window.toggleMessageRead = toggleMessageRead;
window.loadMessagesSection = loadMessagesSection;

async function createDashboard() {
    try {
        // Update counts
        document.getElementById('projectCount').textContent = currentProjects.length;
        document.getElementById('blogCount').textContent = currentPosts.length;
        document.getElementById('messageCount').textContent = currentMessages.length;
        
        // Update unread count
        const unreadCount = currentMessages.filter(msg => !msg.read).length;
        document.getElementById('unreadCount').textContent = unreadCount;
    } catch (error) {
        console.error('Error creating dashboard:', error);
    }
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
        // First sign out from Firebase
        await signOut(auth);
        
        // Hide the dashboard immediately
        const adminDashboard = document.getElementById('adminDashboard');
        if (adminDashboard) adminDashboard.style.display = 'none';

        // Show login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.style.display = 'flex';
            
            // Clear form fields
            const emailField = document.getElementById('adminEmail');
            const passwordField = document.getElementById('adminPassword');
            if (emailField) emailField.value = '';
            if (passwordField) passwordField.value = '';
        }

        // Clear any stored data
        localStorage.removeItem('theme');
        
        // Reload the page to reset all states
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
window.editProject = editProject;
window.deleteProject = handleDeleteProject;
window.editBlogPost = editBlogPost;
window.deleteBlogPost = handleDeleteBlogPost;
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
window.loadRecentActivity = loadRecentActivity;
window.loadExperienceSection = loadExperienceSection;
window.loadSkillsContent = loadSkillsContent;

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
window.proceedToAddSkill = proceedToAddSkill;
window.saveNewSkill = saveNewSkill;

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
function formatDate(dateString, format = 'MMMM YYYY') {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (format === 'YYYY-MM') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
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
    .bulk-actions {
        display: flex;
        gap: 10px;
        align-items: center;
    }

    .message-checkbox {
        display: flex;
        align-items: center;
        padding: 0 10px;
    }

    .message-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .message-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid #eee;
        transition: background-color 0.3s;
    }

    .message-item:hover {
        background-color: #f8f9fa;
    }

    .message-unread {
        background-color: #f0f7ff;
    }

    .message-unread:hover {
        background-color: #e5f1ff;
    }

    .message-actions {
        display: flex;
        gap: 8px;
    }

    .btn.danger {
        background-color: #dc3545;
        color: white;
    }

    .btn.danger:hover {
        background-color: #c82333;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid #eee;
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
    const searchToggle = document.querySelector('.icon-button[onclick="toggleMessageSearch()"]');
    const filterToggle = document.querySelector('.icon-button[onclick="toggleMessageFilter()"]');
    const searchBar = document.querySelector('.search-bar');
    const filterBar = document.querySelector('.filter-bar');
    const messagesContainer = document.getElementById('messages-container');
    const pagination = document.getElementById('messages-pagination');

    if (!searchToggle || !filterToggle || !searchBar || !filterBar || !messagesContainer || !pagination) {
        console.error('Required message elements not found');
        return;
    }

    // Store references to DOM elements
    window.messageElements = {
        searchToggle,
        filterToggle,
        searchBar,
        filterBar,
        messagesContainer,
        pagination,
        searchVisible: false,
        filterVisible: false
    };

    // Initial render
    renderCurrentView();
}

// Toggle message selection mode
function toggleMessageSelection() {
    const checkboxes = document.querySelectorAll('.msg-checkbox');
    const bulkActions = document.getElementById('msgBulkActions');
    const selectToggle = document.getElementById('msgSelectToggle');
    
    const isSelectionMode = checkboxes[0]?.style.display === 'flex';
    
    checkboxes.forEach(checkbox => {
        checkbox.style.display = isSelectionMode ? 'none' : 'flex';
        checkbox.querySelector('input').checked = false;
    });
    
    bulkActions.style.display = isSelectionMode ? 'none' : 'flex';
    selectToggle.classList.toggle('active', !isSelectionMode);
}

// Handle message selection
function handleMessageSelect(event) {
    event.stopPropagation();
    updateBulkActionState();
}

// Select all visible messages
function selectAllVisibleMessages() {
    const checkboxes = document.querySelectorAll('.msg-checkbox input:not([disabled])');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
    
    updateBulkActionState();
}

// Update bulk action buttons state
function updateBulkActionState() {
    const selectedCount = document.querySelectorAll('.msg-checkbox input:checked').length;
    const bulkButtons = document.querySelectorAll('#msgBulkActions button:not(#msgSelectAll)');
    
    bulkButtons.forEach(button => {
        button.disabled = selectedCount === 0;
    });
}

// Toggle search bar
function toggleMessageSearch() {
    const elements = window.messageElements;
    if (!elements) return;
    
    elements.searchVisible = !elements.searchVisible;
    elements.filterVisible = false;
    renderCurrentView();
}

// Handle message search
function handleMessageSearch() {
    const searchInput = document.getElementById('msgSearchInput');
    currentFilters.search = searchInput.value.toLowerCase();
    currentPage = 1;
    renderCurrentView();
}

// Clear message search
function clearMessageSearch() {
    const searchInput = document.getElementById('msgSearchInput');
    searchInput.value = '';
    currentFilters.search = '';
    renderCurrentView();
}

// Toggle filter bar
function toggleMessageFilter() {
    const elements = window.messageElements;
    if (!elements) return;
    
    elements.filterVisible = !elements.filterVisible;
    elements.searchVisible = false;
    renderCurrentView();
}

// Apply message filters
function applyMessageFilters() {
    const statusFilter = document.getElementById('msgStatusFilter');
    const dateFilter = document.getElementById('msgDateFilter');
    
    currentFilters.status = statusFilter.value;
    currentFilters.date = dateFilter.value;
    currentPage = 1;
    renderCurrentView();
}

// Clear message filters
function clearMessageFilters() {
    const statusFilter = document.getElementById('msgStatusFilter');
    const dateFilter = document.getElementById('msgDateFilter');
    
    statusFilter.value = 'all';
    dateFilter.value = 'all';
    currentFilters.status = 'all';
    currentFilters.date = 'all';
    renderCurrentView();
}

// Filter messages based on current filters
function filterMessages(messages, filters) {
    return messages.filter(message => {
        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesSearch = message.name.toLowerCase().includes(searchTerm) ||
                                message.email.toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
        }
        
        // Status filter
        if (filters.status !== 'all') {
            const isRead = message.read;
            if (filters.status === 'read' && !isRead) return false;
            if (filters.status === 'unread' && isRead) return false;
        }
        
        // Date filter
        if (filters.date !== 'all') {
            const messageDate = new Date(message.createdAt);
            const now = new Date();
            
            switch (filters.date) {
                case 'today':
                    if (!isSameDay(messageDate, now)) return false;
                    break;
                case 'week':
                    if (!isThisWeek(messageDate, now)) return false;
                    break;
                case 'month':
                    if (!isThisMonth(messageDate, now)) return false;
                    break;
            }
        }
        
        return true;
    });
}

// Date helper functions
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function isThisWeek(date, now) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return date >= weekStart && date <= weekEnd;
}

function isThisMonth(date, now) {
    return date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
}



// Render current view based on filters and pagination
function renderCurrentView() {
    const elements = window.messageElements;
    if (!elements) {
        console.error('Message elements not initialized');
        return;
    }

    // Update search bar visibility
    if (elements.searchBar) {
        elements.searchBar.style.display = elements.searchVisible ? 'block' : 'none';
        if (elements.searchToggle) {
            elements.searchToggle.classList.toggle('active', elements.searchVisible);
        }
    }

    // Update filter bar visibility
    if (elements.filterBar) {
        elements.filterBar.style.display = elements.filterVisible ? 'block' : 'none';
        if (elements.filterToggle) {
            elements.filterToggle.classList.toggle('active', elements.filterVisible);
        }
    }

    // Get current messages and filters
    const messages = window.currentMessages || [];
    const filters = window.currentFilters || { read: 'all', date: 'all' };
    const page = window.currentPage || 1;

    // Apply filters
    const filteredMessages = filterMessages(messages, filters);

    // Render messages
    if (elements.messagesContainer) {
        elements.messagesContainer.innerHTML = renderMessagesList(filteredMessages, page, filters);
    }

    // Render pagination
    if (elements.pagination) {
        elements.pagination.innerHTML = renderPagination(filteredMessages.length, page);
    }
}

// Bulk action handlers
async function markSelectedMessagesAsRead() {
    const selectedMessages = getSelectedMessageIds();
    if (selectedMessages.length === 0) return;
    
    try {
        const updatePromises = selectedMessages.map(messageId => markMessageAsRead(messageId));
        await Promise.all(updatePromises);
        await createDashboard();
        renderCurrentView();
        showNotification('Messages marked as read', 'success');
    } catch (error) {
        console.error('Error marking messages as read:', error);
        showNotification('Failed to mark messages as read', 'error');
    }
}

async function markSelectedMessagesAsUnread() {
    const selectedMessages = getSelectedMessageIds();
    if (selectedMessages.length === 0) return;
    
    try {
        const updatePromises = selectedMessages.map(messageId => markMessageAsUnread(messageId));
        await Promise.all(updatePromises);
        await createDashboard();
        renderCurrentView();
        showNotification('Messages marked as unread', 'success');
    } catch (error) {
        console.error('Error marking messages as unread:', error);
        showNotification('Failed to mark messages as unread', 'error');
    }
}



// Helper function to get selected message IDs
function getSelectedMessageIds() {
    return Array.from(document.querySelectorAll('.msg-checkbox input:checked'))
        .map(checkbox => checkbox.closest('.msg-item').dataset.messageId);
}

// Add to window object
window.toggleMessageSelection = toggleMessageSelection;
window.handleMessageSelect = handleMessageSelect;
window.selectAllVisibleMessages = selectAllVisibleMessages;
window.toggleMessageSearch = toggleMessageSearch;
window.handleMessageSearch = handleMessageSearch;
window.clearMessageSearch = clearMessageSearch;
window.toggleMessageFilter = toggleMessageFilter;
window.applyMessageFilters = applyMessageFilters;
window.clearMessageFilters = clearMessageFilters;
window.changePage = changePage;
window.markSelectedMessagesAsRead = markSelectedMessagesAsRead;
window.markSelectedMessagesAsUnread = markSelectedMessagesAsUnread;
window.deleteSelectedMessages = deleteSelectedMessages;

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



// Helper function to format message body with paragraphs
function formatMessageBody(text) {
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<p>${line}</p>`)
        .join('');
}



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
window.changePage = changePage;
window.toggleMessageSearch = toggleMessageSearch;
window.toggleMessageFilter = toggleMessageFilter;
window.handleMessageSearch = handleMessageSearch;
window.clearMessageSearch = clearMessageSearch;
window.applyMessageFilters = applyMessageFilters;
window.clearMessageFilters = clearMessageFilters;
window.toggleAllMessages = toggleAllMessages;
window.markSelectedMessagesAsRead = markSelectedMessagesAsRead;
window.markSelectedMessagesAsUnread = markSelectedMessagesAsUnread;
window.deleteSelectedMessages = deleteSelectedMessages;
window.showMessageDetails = showMessageDetails;



