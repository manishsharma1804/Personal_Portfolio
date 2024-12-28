// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDM4VTFBHocqRQbNzBDo4NT8L9QN_B-jEc",
    authDomain: "portfolio-64574.firebaseapp.com",
    projectId: "portfolio-64574",
    storageBucket: "portfolio-64574.appspot.com",
    messagingSenderId: "536280530710",
    appId: "1:536280530710:web:4cb253e0747e8f04d51a37",
    measurementId: "G-NSSMSRZK03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin Authentication
async function adminLogin(email, password) {
    try {
        // Set persistence before signing in
        await setPersistence(auth, browserLocalPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Login error:', error.code, error.message);
        throw error;
    }
}

// Check admin status
function isAdmin() {
    const user = auth.currentUser;
    return user !== null;
}

// Content Management Functions
async function updateAbout(content) {
    if (!isAdmin()) return;
    try {
        await setDoc(doc(db, 'content', 'about'), {
            content,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating about:', error);
        throw error;
    }
}

async function updateExperience(experiences) {
    if (!isAdmin()) return;
    try {
        await setDoc(doc(db, 'content', 'experience'), {
            experiences,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating experience:', error);
        throw error;
    }
}

async function addProject(project) {
    if (!isAdmin()) return;
    try {
        await addDoc(collection(db, 'projects'), {
            ...project,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error adding project:', error);
        throw error;
    }
}

async function updateProject(projectId, project) {
    if (!isAdmin()) return;
    try {
        await updateDoc(doc(db, 'projects', projectId), {
            ...project,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
}

async function deleteProject(projectId) {
    if (!isAdmin()) return;
    try {
        await deleteDoc(doc(db, 'projects', projectId));
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}

async function addBlogPost(post) {
    if (!isAdmin()) return;
    try {
        await addDoc(collection(db, 'blog'), {
            ...post,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error adding blog post:', error);
        throw error;
    }
}

async function updateBlogPost(postId, post) {
    if (!isAdmin()) return;
    try {
        await updateDoc(doc(db, 'blog', postId), {
            ...post,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating blog post:', error);
        throw error;
    }
}

async function deleteBlogPost(postId) {
    if (!isAdmin()) return;
    try {
        await deleteDoc(doc(db, 'blog', postId));
    } catch (error) {
        console.error('Error deleting blog post:', error);
        throw error;
    }
}

// Content Loading Functions
async function loadAboutContent() {
    try {
        const docSnap = await getDoc(doc(db, 'content', 'about'));
        return docSnap.exists() ? docSnap.data()?.content : null;
    } catch (error) {
        console.error('Error loading about content:', error);
        throw error;
    }
}

async function loadExperienceContent() {
    try {
        const docSnap = await getDoc(doc(db, 'content', 'experience'));
        return docSnap.exists() ? docSnap.data()?.experiences : null;
    } catch (error) {
        console.error('Error loading experience content:', error);
        throw error;
    }
}

async function loadProjects() {
    try {
        const querySnapshot = await getDocs(collection(db, 'projects'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading projects:', error);
        throw error;
    }
}

async function loadBlogPosts() {
    try {
        const querySnapshot = await getDocs(collection(db, 'blog'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading blog posts:', error);
        throw error;
    }
}

// Contact Form Function
async function saveContactMessage(message) {
    try {
        await addDoc(collection(db, 'messages'), {
            ...message,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving contact message:', error);
        throw error;
    }
}

async function loadMessages() {
    try {
        if (!isAdmin()) {
            throw new Error('Access denied. Please log in first.');
        }
        const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading messages:', error);
        if (error.code === 'permission-denied') {
            throw new Error('Access denied. Please make sure you are logged in.');
        }
        throw error;
    }
}

async function deleteMessageFromDB(id) {
    const docRef = doc(db, 'messages', id);
    await deleteDoc(docRef);
}

// Image Upload Function
async function uploadImage(file, folder = 'profile') {
    if (!file) return null;
    if (!isAdmin()) throw new Error('Unauthorized');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPG, PNG, and WebP images are allowed');
    }

    try {
        // Convert image to base64
        const base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Compress image
        const compressedBase64 = await compressImage(base64String, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8
        });

        // Create a unique ID for the image
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 15);
        const imageId = `${folder}_${timestamp}_${uniqueId}`;

        // Split the base64 string into chunks (max 1MB per chunk)
        const chunkSize = 900 * 1024; // 900KB chunks to be safe
        const chunks = [];
        let offset = 0;
        
        while (offset < compressedBase64.length) {
            chunks.push(compressedBase64.slice(offset, offset + chunkSize));
            offset += chunkSize;
        }

        // Store metadata
        await setDoc(doc(db, 'images', imageId), {
            type: file.type,
            folder: folder,
            originalName: file.name,
            uploadedBy: auth.currentUser.email,
            uploadedAt: serverTimestamp(),
            totalChunks: chunks.length,
            size: compressedBase64.length
        });

        // Store chunks
        const chunkPromises = chunks.map((chunk, index) => 
            setDoc(doc(db, 'images', `${imageId}_chunk_${index}`), {
                data: chunk,
                index: index
            })
        );

        await Promise.all(chunkPromises);
        return compressedBase64;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file: ' + (error.message || 'Unknown error'));
    }
}

// Helper function to load image from chunks
async function loadImageFromChunks(imageId) {
    try {
        // Get metadata
        const metadataDoc = await getDoc(doc(db, 'images', imageId));
        if (!metadataDoc.exists()) {
            throw new Error('Image not found');
        }

        const metadata = metadataDoc.data();
        const totalChunks = metadata.totalChunks;

        // Load all chunks
        const chunkPromises = Array.from({ length: totalChunks }, (_, index) =>
            getDoc(doc(db, 'images', `${imageId}_chunk_${index}`))
        );

        const chunkDocs = await Promise.all(chunkPromises);
        
        // Combine chunks
        const base64String = chunkDocs
            .sort((a, b) => a.data().index - b.data().index)
            .map(doc => doc.data().data)
            .join('');

        return base64String;
    } catch (error) {
        console.error('Error loading image:', error);
        throw error;
    }
}

// Helper function to compress images
async function compressImage(base64String, options = {}) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (options.maxWidth && width > options.maxWidth) {
                height = (height * options.maxWidth) / width;
                width = options.maxWidth;
            }
            if (options.maxHeight && height > options.maxHeight) {
                width = (width * options.maxHeight) / height;
                height = options.maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Get compressed base64 string
            resolve(canvas.toDataURL(options.type || 'image/jpeg', options.quality || 0.8));
        };
        img.onerror = reject;
        img.src = base64String;
    });
}

// Profile Management Functions
async function loadProfileData() {
    try {
        if (!isAdmin()) {
            throw new Error('Access denied. Please log in first.');
        }
        const docSnap = await getDoc(doc(db, 'content', 'profile'));
        if (!docSnap.exists()) {
            return null;
        }

        return docSnap.data();
    } catch (error) {
        console.error('Error loading profile data:', error);
        if (error.code === 'permission-denied') {
            throw new Error('Access denied. Please make sure you are logged in.');
        }
        throw error;
    }
}

async function updateProfileData(profileData) {
    if (!isAdmin()) return;
    try {
        // Update profile document with direct URLs
        await setDoc(doc(db, 'content', 'profile'), {
            ...profileData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Function to handle resume upload
async function uploadResume(file) {
    if (!file) return null;
    if (!isAdmin()) throw new Error('Unauthorized');

    // Validate file type
    if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed for resume');
    }

    try {
        // Convert PDF to base64
        const base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        return base64String;
    } catch (error) {
        console.error('Error uploading resume:', error);
        throw new Error('Failed to upload resume: ' + (error.message || 'Unknown error'));
    }
}

// Skills functions
async function loadSkills() {
    try {
        const skillsDoc = await getDoc(doc(db, 'content', 'skills'));
        return skillsDoc.exists() ? skillsDoc.data().categories : [];
    } catch (error) {
        console.error('Error loading skills:', error);
        throw error;
    }
}

async function updateSkills(skillsData) {
    if (!isAdmin()) return;
    try {
        await setDoc(doc(db, 'content', 'skills'), {
            categories: skillsData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating skills:', error);
        throw error;
    }
}

// Delete image/file function
async function deleteImage(fileId) {
    if (!isAdmin()) return;
    try {
        // Get metadata first
        const metadataDoc = await getDoc(doc(db, 'images', fileId));
        if (!metadataDoc.exists()) {
            console.log('No metadata found for file:', fileId);
            return;
        }

        const metadata = metadataDoc.data();
        const totalChunks = metadata.totalChunks;
        
        // Delete metadata document first
        try {
            await deleteDoc(doc(db, 'images', fileId));
            console.log('Metadata document deleted');
        } catch (error) {
            console.error('Error deleting metadata:', error);
        }
        
        // Delete all possible chunks (try a few extra just in case)
        const maxPossibleChunks = totalChunks + 2;
        for (let i = 0; i < maxPossibleChunks; i++) {
            const chunkId = `${fileId}_chunk_${i}`;
            try {
                // Try to delete chunk without checking existence
                await deleteDoc(doc(db, 'images', chunkId));
                console.log(`Deleted chunk ${i + 1}`);
            } catch (error) {
                console.log(`No chunk at index ${i}`);
            }
        }
        
        // Final verification
        let remainingFiles = [];
        
        // Check metadata
        const finalMetadataCheck = await getDoc(doc(db, 'images', fileId));
        if (finalMetadataCheck.exists()) {
            remainingFiles.push('metadata');
            // One last try to delete metadata
            try {
                await deleteDoc(doc(db, 'images', fileId));
            } catch (error) {
                console.error('Failed final metadata deletion attempt');
            }
        }
        
        // Check all possible chunks
        for (let i = 0; i < maxPossibleChunks; i++) {
            const chunkDoc = await getDoc(doc(db, 'images', `${fileId}_chunk_${i}`));
            if (chunkDoc.exists()) {
                remainingFiles.push(`chunk_${i}`);
                // One last try to delete chunk
                try {
                    await deleteDoc(doc(db, 'images', `${fileId}_chunk_${i}`));
                } catch (error) {
                    console.error(`Failed final deletion attempt for chunk ${i}`);
                }
            }
        }
        
        console.log(`Deletion complete. File: ${fileId}`);
        if (remainingFiles.length > 0) {
            console.warn('Warning: Some files could not be deleted:', remainingFiles);
        } else {
            console.log('All files successfully deleted');
        }
        
        return {
            success: remainingFiles.length === 0,
            totalAttempted: maxPossibleChunks,
            remainingFiles
        };
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

async function loadProfile() {
    try {
        if (!isAdmin()) {
            throw new Error('Access denied. Please log in first.');
        }
        const docRef = doc(db, 'content', 'profile');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                name: data.name,
                imageUrl: data.imageUrl,
                resumeUrl: data.resumeUrl,
                company: data.company,
                titles: data.titles || [],
                socialLinks: data.socialLinks || []
            };
        }
        return null;
    } catch (error) {
        console.error('Error loading profile:', error);
        throw error;
    }
}

async function updateProfile(profileData) {
    try {
        if (!isAdmin()) {
            throw new Error('Access denied. Please log in first.');
        }
        const docRef = doc(db, 'content', 'profile');
        await setDoc(docRef, {
            name: profileData.name,
            imageUrl: profileData.imageUrl,
            resumeUrl: profileData.resumeUrl,
            company: profileData.company,
            titles: profileData.titles,
            socialLinks: profileData.socialLinks,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Blog Comments Functions
async function loadBlogComments() {
    try {
        const commentsRef = collection(db, 'blogComments');
        const querySnapshot = await getDocs(commentsRef);
        const comments = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        return comments;
    } catch (error) {
        console.error('Error loading blog comments:', error);
        throw error;
    }
}

async function updateBlogComment(commentId, commentData) {
    try {
        const commentRef = doc(db, 'blogComments', commentId);
        await updateDoc(commentRef, commentData);
    } catch (error) {
        console.error('Error updating blog comment:', error);
        throw error;
    }
}

async function deleteBlogComment(commentId) {
    try {
        const commentRef = doc(db, 'blogComments', commentId);
        await deleteDoc(commentRef);
    } catch (error) {
        console.error('Error deleting blog comment:', error);
        throw error;
    }
}

async function loadPublicProfileData() {
    try {
        const [profileDoc, certDoc] = await Promise.all([
            getDoc(doc(db, 'content', 'profile')),
            getDoc(doc(db, 'content', 'certifications'))
        ]);
        
        const profileData = profileDoc.exists() ? profileDoc.data() : null;
        const certifications = certDoc.exists() ? certDoc.data().certifications : [];
        
        return {
            ...profileData,
            certifications
        };
    } catch (error) {
        console.error('Error loading public profile data:', error);
        throw error;
    }
}

// Certification Functions
async function loadCertifications() {
    try {
        const docSnap = await getDoc(doc(db, 'content', 'certifications'));
        return docSnap.exists() ? docSnap.data().certifications : [];
    } catch (error) {
        console.error('Error loading certifications:', error);
        throw error;
    }
}

async function updateCertification(certificationData) {
    if (!isAdmin()) return;
    try {
        const docRef = doc(db, 'content', 'certifications');
        const docSnap = await getDoc(docRef);
        const certifications = docSnap.exists() ? docSnap.data().certifications : [];
        
        const index = certifications.findIndex(cert => cert.id === certificationData.id);
        if (index !== -1) {
            certifications[index] = certificationData;
        } else {
            // Add new certification with a unique ID
            certificationData.id = Date.now().toString();
            certifications.push(certificationData);
        }
        
        await setDoc(docRef, { certifications });
        return true;
    } catch (error) {
        console.error('Error updating certification:', error);
        throw error;
    }
}

// Export all functions
export {
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
    saveContactMessage,
    loadMessages,
    deleteMessageFromDB,
    loadProfileData,
    updateProfileData,
    uploadImage,
    uploadResume,
    deleteImage,
    signOut,
    loadSkills,
    updateSkills,
    loadProfile,
    updateProfile,
    loadBlogComments,
    updateBlogComment,
    deleteBlogComment,
    loadPublicProfileData,
    loadCertifications,
    updateCertification
}; 