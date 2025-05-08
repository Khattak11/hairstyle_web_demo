# AI Hairstyle Generator

A web application that allows users to transform their hairstyles using AI. The app offers two main features:

1. **Hairstyle Transformation**: Upload your photo and a template hairstyle to see how the template hairstyle would look on you. This feature uses Google's Gemini API.

2. **AI Hairstyle Generator**: Upload your photo and describe the hairstyle you want (or choose from preset options), and the AI will generate a new photo of you with that hairstyle. This feature uses the LightX AI Hairstyle API.

## Features

- Drag and drop image uploads
- Real-time image preview
- Selection of preset hairstyles for men and women
- Custom hairstyle description support
- Modern, responsive UI

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript
- **APIs**: Google Gemini API, LightX AI Hairstyle API
- **Deployment**: Vercel

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Khattak11/hairstyle_dummy_web.git
   cd hairstyle_dummy_web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3000
   ```

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### Hairstyle Transformation
1. Upload your photo
2. Upload a template hairstyle photo
3. Click "Transform Hairstyle"
4. View the result

### AI Hairstyle Generator
1. Select men's or women's styles
2. Upload your photo
3. Choose a preset hairstyle or enter a custom description
4. Click "Generate Hairstyle"
5. View the result

## Deployment on Vercel

This application is configured for deployment on Vercel:

1. Fork/Clone this repository to your GitHub account
2. Sign up for a [Vercel account](https://vercel.com)
3. Click on "Add New..." > "Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
6. Click "Deploy"

Once deployed, Vercel will give you a URL to access your application. The deployment will automatically update whenever you push changes to your GitHub repository.

## License

MIT 