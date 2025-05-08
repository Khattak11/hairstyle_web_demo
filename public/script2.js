// Store the selected file
let userImage = null;

console.log('Script initialized');

// Get DOM elements
const userImageInput = document.getElementById('userImageInput');
const userImagePreview = document.getElementById('userImagePreview');
const userImageDropZone = document.getElementById('userImageDropZone');
const textPrompt = document.getElementById('textPrompt');
const generateButton = document.getElementById('generateButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');
const errorMessage = document.getElementById('errorMessage');
const styleOptions = document.querySelectorAll('.style-option');
const genderButtons = document.querySelectorAll('.gender-btn');
const womenStyles = document.querySelector('.women-styles');
const menStyles = document.querySelector('.men-styles');

// Helper function to handle file selection
function handleFileSelect(file, previewElement) {
    console.log(`Handling file selection:`, {
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size
    });

    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log(`File read complete`);
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
            previewElement.parentElement.querySelector('.upload-prompt').style.display = 'none';
            
            userImage = file;
            
            // Enable generate button if image is selected and prompt has text
            updateButtonState();
        };
        reader.onerror = function(e) {
            console.error(`Error reading file:`, e);
        };
        reader.readAsDataURL(file);
    } else {
        console.warn('Invalid file selected:', {
            type: file?.type,
            isImage: file?.type.startsWith('image/')
        });
    }
}

function updateButtonState() {
    const hasImage = !!userImage;
    const hasPrompt = textPrompt.value.trim().length > 0;
    generateButton.disabled = !(hasImage && hasPrompt);
    console.log('Generate button state:', { enabled: !(hasImage && hasPrompt) });
}

// Initialize the default style suggestion for men
window.addEventListener('DOMContentLoaded', function() {
    // Make sure men's styles are showing by default
    womenStyles.style.display = 'none';
    menStyles.style.display = 'block';
    
    // Update the active class on gender buttons
    genderButtons.forEach(btn => {
        if (btn.getAttribute('data-gender') === 'men') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Set the placeholder text for men's styles by default
    textPrompt.placeholder = "Describe the hairstyle you want (e.g., 'classic short fade haircut with clean sides')";
});

// Gender toggle handlers
genderButtons.forEach(button => {
    button.addEventListener('click', () => {
        const gender = button.getAttribute('data-gender');
        
        // Update active state of buttons
        genderButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show/hide appropriate style section
        if (gender === 'women') {
            womenStyles.style.display = 'block';
            menStyles.style.display = 'none';
            textPrompt.placeholder = "Describe the hairstyle you want (e.g., 'long wavy blonde hair with bangs')";
        } else {
            womenStyles.style.display = 'none';
            menStyles.style.display = 'block';
            textPrompt.placeholder = "Describe the hairstyle you want (e.g., 'classic short fade haircut with clean sides')";
        }
        
        // Clear selected styles
        styleOptions.forEach(opt => opt.classList.remove('selected'));
        textPrompt.value = '';
        updateButtonState();
    });
});

// Style option click handlers
styleOptions.forEach(option => {
    option.addEventListener('click', () => {
        const style = option.getAttribute('data-style');
        textPrompt.value = style;
        
        // Highlight the selected style
        styleOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Update button state
        updateButtonState();
    });
});

// File input change handler
userImageInput.addEventListener('change', (e) => {
    console.log('User image input changed');
    handleFileSelect(e.target.files[0], userImagePreview);
});

// Text prompt change handler
textPrompt.addEventListener('input', updateButtonState);

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

function handleDrop(e, previewElement) {
    console.log(`File dropped`);
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file, previewElement);
}

// Add drag and drop event listeners
userImageDropZone.addEventListener('dragover', handleDragOver);
userImageDropZone.addEventListener('dragleave', handleDragLeave);
userImageDropZone.addEventListener('drop', (e) => handleDrop(e, userImagePreview));

// Generate button click handler
generateButton.addEventListener('click', async () => {
    console.log('Generate button clicked');
    
    if (!userImage || !textPrompt.value.trim()) {
        console.warn('Missing image or prompt');
        return;
    }

    // Show loading spinner
    loadingSpinner.style.display = 'block';
    resultContainer.style.display = 'none';
    errorMessage.textContent = '';
    generateButton.disabled = true;

    console.log('Preparing form data');
    try {
        const formData = new FormData();
        formData.append('userImage', userImage);
        formData.append('textPrompt', textPrompt.value.trim());

        console.log('Sending request to server');
        const response = await fetch('/generate-hairstyle', {
            method: 'POST',
            body: formData
        });

        console.log('Received response from server');
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            // Create a new image to preload
            const img = new Image();
            
            // Set up load event before setting src
            img.onload = function() {
                console.log('Image successfully loaded');
                resultImage.src = img.src;
                resultContainer.style.display = 'block';
                loadingSpinner.style.display = 'none';
            };
            
            // Set up error event
            img.onerror = function() {
                console.error('Error loading image from URL');
                // Try the direct URL as a fallback
                const directImg = new Image();
                directImg.onload = function() {
                    console.log('Direct image successfully loaded');
                    resultImage.src = directImg.src;
                    resultContainer.style.display = 'block';
                    loadingSpinner.style.display = 'none';
                };
                directImg.onerror = function() {
                    console.error('Both proxy and direct image URLs failed');
                    errorMessage.textContent = 'Failed to load the generated image';
                    resultContainer.style.display = 'block';
                    loadingSpinner.style.display = 'none';
                };
                directImg.src = data.imageUrl;
            };
            
            // Start loading the image using the proxy URL if available
            if (data.proxyUrl) {
                console.log('Using proxy URL:', data.proxyUrl);
                img.src = data.proxyUrl;
            } else {
                console.log('Using direct URL:', data.imageUrl);
                img.src = data.imageUrl;
            }
            
            // Set a timeout in case the image loading gets stuck
            setTimeout(() => {
                if (loadingSpinner.style.display !== 'none') {
                    console.warn('Image loading timeout - forcing display');
                    // Try both URLs
                    if (data.proxyUrl) {
                        resultImage.src = data.proxyUrl;
                    } else {
                        resultImage.src = data.imageUrl;
                    }
                    resultContainer.style.display = 'block';
                    loadingSpinner.style.display = 'none';
                }
            }, 10000); // 10 second timeout
        } else {
            throw new Error(data.error || 'Failed to generate hairstyle');
        }
    } catch (error) {
        console.error('Error during generation:', error);
        errorMessage.textContent = error.message;
        resultContainer.style.display = 'block';
        loadingSpinner.style.display = 'none';
    } finally {
        console.log('Request complete');
        generateButton.disabled = false;
    }
}); 