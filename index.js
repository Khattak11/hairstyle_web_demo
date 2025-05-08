require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure CORS to be less restrictive for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('Gemini API initialized with key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');

// LightX API Key
const LIGHTX_API_KEY = '0a00fcfafa3a4ffb9ad51fe89728946f_b3d2737cdb314f0db584123c83b4dbb0_andoraitools';

// Helper function to convert Buffer to base64
function bufferToBase64(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// Image proxy to handle CORS issues
app.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  
  if (!imageUrl) {
    return res.status(400).send('Image URL is required');
  }
  
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    const contentType = response.headers['content-type'];
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    res.send(response.data);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).send('Error proxying image');
  }
});

// Endpoint for hairstyle transformation
app.post('/transform-hairstyle', upload.fields([
  { name: 'userImage', maxCount: 1 },
  { name: 'templateImage', maxCount: 1 }
]), async (req, res) => {
  console.log('Received transformation request');
  
  try {
    if (!req.files || !req.files.userImage || !req.files.templateImage) {
      console.log('Missing files:', {
        userImage: !!req.files?.userImage,
        templateImage: !!req.files?.templateImage
      });
      return res.status(400).json({ error: 'Both user image and template image are required' });
    }

    const userImage = req.files.userImage[0];
    const templateImage = req.files.templateImage[0];
    
    console.log('Images received:', {
      userImageSize: userImage.size,
      userImageType: userImage.mimetype,
      templateImageSize: templateImage.size,
      templateImageType: templateImage.mimetype
    });

    // Convert images to base64
    const userImageBase64 = bufferToBase64(userImage.buffer, userImage.mimetype);
    const templateImageBase64 = bufferToBase64(templateImage.buffer, templateImage.mimetype);
    console.log('Images converted to base64');

    // Get the model - Updated to use gemini-1.5-flash
    console.log('Initializing Gemini model: gemini-1.5-flash');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare the prompt
    const prompt = 'Transform the hairstyle of the person in the first image to match the hairstyle in the second image. Make it look realistic.';
    console.log('Using prompt:', prompt);

    // Create parts array with images
    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: userImage.mimetype,
          data: userImageBase64.split(',')[1]
        }
      },
      {
        inlineData: {
          mimeType: templateImage.mimetype,
          data: templateImageBase64.split(',')[1]
        }
      }
    ];

    console.log('Sending request to Gemini API...');
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    console.log('Received response from Gemini API');
    const response = await result.response;
    console.log('Response structure:', JSON.stringify(response, null, 2));
    
    // Check if we have image data in the response
    if (response.candidates && response.candidates[0].content) {
      const content = response.candidates[0].content;
      console.log('Content structure:', JSON.stringify(content, null, 2));
      
      if (content.parts && content.parts.some(part => part.inlineData)) {
        const imagePart = content.parts.find(part => part.inlineData);
        console.log('Found image data in response');
        return res.json({
          success: true,
          image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
        });
      }
    }

    // If we get here, we received a text response instead of an image
    console.log('No image data found in response');
    return res.json({
      success: false,
      message: "The API returned a text response instead of an image",
      text: response.text()
    });

  } catch (error) {
    console.error('Error in transformation:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during image processing'
    });
  }
});

// LightX AI Hairstyle API endpoints
// 1. Upload image to get URL
async function getImageUploadUrl(fileSize, mimeType) {
  try {
    const response = await axios.post('https://api.lightxeditor.com/external/api/v2/uploadImageUrl', {
      uploadType: "imageUrl",
      size: fileSize,
      contentType: mimeType
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIGHTX_API_KEY
      }
    });
    
    return response.data.body;
  } catch (error) {
    console.error('Error getting image upload URL:', error.response?.data || error.message);
    throw new Error('Failed to get image upload URL');
  }
}

// 2. Upload image to the provided URL
async function uploadImageToUrl(uploadUrl, imageBuffer, mimeType) {
  try {
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'Content-Type': mimeType
      }
    });
    return true;
  } catch (error) {
    console.error('Error uploading image:', error.response?.data || error.message);
    throw new Error('Failed to upload image');
  }
}

// 3. Generate hairstyle using LightX API
async function generateHairstyle(imageUrl, textPrompt) {
  try {
    const response = await axios.post('https://api.lightxeditor.com/external/api/v1/hairstyle', {
      imageUrl: imageUrl,
      textPrompt: textPrompt
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIGHTX_API_KEY
      }
    });
    
    return response.data.body;
  } catch (error) {
    console.error('Error generating hairstyle:', error.response?.data || error.message);
    throw new Error('Failed to generate hairstyle');
  }
}

// 4. Check order status
async function checkOrderStatus(orderId) {
  try {
    const response = await axios.post('https://api.lightxeditor.com/external/api/v1/order-status', {
      orderId: orderId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIGHTX_API_KEY
      }
    });
    
    return response.data.body;
  } catch (error) {
    console.error('Error checking order status:', error.response?.data || error.message);
    throw new Error('Failed to check order status');
  }
}

// Endpoint for LightX hairstyle generation
app.post('/generate-hairstyle', upload.single('userImage'), async (req, res) => {
  console.log('Received hairstyle generation request');
  
  try {
    if (!req.file || !req.body.textPrompt) {
      console.log('Missing data:', {
        hasImage: !!req.file,
        hasPrompt: !!req.body.textPrompt
      });
      return res.status(400).json({ 
        success: false,
        error: 'Both user image and text prompt are required' 
      });
    }

    const userImage = req.file;
    const textPrompt = req.body.textPrompt;
    
    console.log('Request data:', {
      imageSize: userImage.size,
      imageType: userImage.mimetype,
      prompt: textPrompt
    });

    // Step 1: Get image upload URL
    console.log('Getting image upload URL...');
    const uploadData = await getImageUploadUrl(userImage.size, userImage.mimetype);
    console.log('Upload URL received:', uploadData.uploadImage);

    // Step 2: Upload image to the provided URL
    console.log('Uploading image...');
    await uploadImageToUrl(uploadData.uploadImage, userImage.buffer, userImage.mimetype);
    console.log('Image uploaded successfully');

    // Step 3: Generate hairstyle
    console.log('Generating hairstyle...');
    const generationData = await generateHairstyle(uploadData.imageUrl, textPrompt);
    console.log('Generation request sent, order ID:', generationData.orderId);

    // Step 4: Check status until complete (with retries)
    console.log('Checking order status...');
    let status = null;
    let attempts = 0;
    const maxAttempts = generationData.maxRetriesAllowed || 5;
    const checkInterval = 3000; // 3 seconds

    while (attempts < maxAttempts) {
      // Wait before checking status
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      status = await checkOrderStatus(generationData.orderId);
      console.log(`Status check attempt ${attempts + 1}:`, status.status);
      
      if (status.status === 'active') {
        console.log('Generation complete, result URL:', status.output);
        
        // Use an HTTPS URL and remove any query parameters that might cause issues
        let imageUrl = status.output;
        if (imageUrl.includes('?')) {
          imageUrl = imageUrl.split('?')[0];
        }
        
        // Use our proxy to avoid CORS issues
        const host = req.get('host');
        const protocol = req.protocol || 'https';
        const proxyUrl = `${protocol}://${host}/image-proxy?url=${encodeURIComponent(imageUrl)}`;
        
        console.log('Proxied image URL:', proxyUrl);
        
        return res.json({
          success: true,
          imageUrl: imageUrl,
          proxyUrl: proxyUrl
        });
      } else if (status.status === 'failed') {
        throw new Error('Hairstyle generation failed');
      }
      
      attempts++;
    }

    throw new Error('Timeout while waiting for hairstyle generation');

  } catch (error) {
    console.error('Error in hairstyle generation:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during hairstyle generation'
    });
  }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve index2.html for the /hairstyle-generator route
app.get('/hairstyle-generator', (req, res) => {
  console.log('Serving index2.html');
  res.sendFile(path.join(__dirname, 'public', 'index2.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
