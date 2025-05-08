// Store the selected files
let userImage = null;
let templateImage = null;

console.log('Script initialized');

// Get DOM elements
const userImageInput = document.getElementById('userImageInput');
const templateImageInput = document.getElementById('templateImageInput');
const userImagePreview = document.getElementById('userImagePreview');
const templateImagePreview = document.getElementById('templateImagePreview');
const userImageDropZone = document.getElementById('userImageDropZone');
const templateImageDropZone = document.getElementById('templateImageDropZone');
const transformButton = document.getElementById('transformButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');
const errorMessage = document.getElementById('errorMessage');

// Helper function to handle file selection
function handleFileSelect(file, previewElement, type) {
    console.log(`Handling file selection for ${type}:`, {
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size
    });

    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log(`File read complete for ${type}`);
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
            previewElement.parentElement.querySelector('.upload-prompt').style.display = 'none';
            
            if (type === 'user') {
                userImage = file;
            } else {
                templateImage = file;
            }
            
            // Enable transform button if both images are selected
            const canTransform = !!(userImage && templateImage);
            console.log('Transform button state:', { enabled: canTransform });
            transformButton.disabled = !canTransform;
        };
        reader.onerror = function(e) {
            console.error(`Error reading file for ${type}:`, e);
        };
        reader.readAsDataURL(file);
    } else {
        console.warn('Invalid file selected:', {
            type: file?.type,
            isImage: file?.type.startsWith('image/')
        });
    }
}

// File input change handlers
userImageInput.addEventListener('change', (e) => {
    console.log('User image input changed');
    handleFileSelect(e.target.files[0], userImagePreview, 'user');
});

templateImageInput.addEventListener('change', (e) => {
    console.log('Template image input changed');
    handleFileSelect(e.target.files[0], templateImagePreview, 'template');
});

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, previewElement, type) {
    console.log(`File dropped for ${type}`);
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file, previewElement, type);
}

// Add drag and drop event listeners
[userImageDropZone, templateImageDropZone].forEach(dropZone => {
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
});

userImageDropZone.addEventListener('drop', (e) => handleDrop(e, userImagePreview, 'user'));
templateImageDropZone.addEventListener('drop', (e) => handleDrop(e, templateImagePreview, 'template'));

// Transform button click handler
transformButton.addEventListener('click', async () => {
    console.log('Transform button clicked');
    
    if (!userImage || !templateImage) {
        console.warn('Missing images:', {
            hasUserImage: !!userImage,
            hasTemplateImage: !!templateImage
        });
        return;
    }

    // Show loading spinner
    loadingSpinner.style.display = 'block';
    resultContainer.style.display = 'none';
    errorMessage.textContent = '';
    transformButton.disabled = true;

    console.log('Preparing form data');
    try {
        const formData = new FormData();
        formData.append('userImage', userImage);
        formData.append('templateImage', templateImage);

        console.log('Sending request to server');
        const response = await fetch('http://localhost:3000/transform-hairstyle', {
            method: 'POST',
            body: formData
        });

        console.log('Received response from server');
        const data = await response.json();
        console.log('Response data:', {
            success: data.success,
            hasImage: !!data.image,
            error: data.error
        });

        if (data.success) {
            resultImage.src = data.image;
            resultContainer.style.display = 'block';
        } else {
            throw new Error(data.error || 'Failed to transform image');
        }
    } catch (error) {
        console.error('Error during transformation:', error);
        errorMessage.textContent = error.message;
        resultContainer.style.display = 'block';
    } finally {
        console.log('Request complete');
        loadingSpinner.style.display = 'none';
        transformButton.disabled = false;
    }
}); 