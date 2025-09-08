import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request, Response } from 'express';

// Cloudinary configuration will be done inside the request handler

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

interface UploadedImage {
  publicId: string;
  secureUrl: string;
  title: string;
}

interface CollageResponse {
  collageUrl: string;
  uploaded: UploadedImage[];
}

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(fileBuffer: Buffer, title: string, index: number): Promise<UploadedImage> {
  const timestamp = Date.now();
  const publicId = `scavenger_${timestamp}_${index}`;
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'scavenger/entries',
        tags: ['vail-scavenger'],
        public_id: publicId,
        context: { caption: title },
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            publicId: result!.public_id,
            secureUrl: result!.secure_url,
            title: title
          });
        }
      }
    ).end(fileBuffer);
  });
}

// Helper function to create proper multi-image collage using Cloudinary transformations
function createCollageUrlNew(uploadedImages: UploadedImage[]): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  if (uploadedImages.length === 0) {
    return '';
  }
  
  console.log('🔧 Creating collage with images:', uploadedImages.map(img => img.publicId));
  
  if (uploadedImages.length === 1) {
    // Single image - return with proper sizing
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_600,c_fit/${uploadedImages[0].publicId}`;
    console.log('🔧 Generated single image URL:', url);
    return url;
  }
  
  // For multiple images, create a proper side-by-side collage
  const baseImage = uploadedImages[0];
  const basePublicId = encodeURIComponent(baseImage.publicId);
  
  let transformations = [];
  
  if (uploadedImages.length === 2) {
    // Two images side by side
    const secondPublicId = uploadedImages[1].publicId.replace(/\//g, ':');  // Convert to colon format
    
    transformations = [
      'w_400,h_600,c_fill',  // Resize base image
      `l_${secondPublicId},w_400,h_600,c_fill,x_400,fl_layer_apply`  // Add second image to the right
    ];
  } else {
    // Three images in a row (most common case for 2-stop hunt)
    const imageWidth = 267;  // 800px / 3 images
    const imageHeight = 400;
    
    transformations = [
      `w_${imageWidth},h_${imageHeight},c_fill`  // Resize base image
    ];
    
    // Add remaining images
    for (let i = 1; i < Math.min(uploadedImages.length, 3); i++) {
      const publicId = uploadedImages[i].publicId.replace(/\//g, ':');  // Convert to colon format
      const xPosition = i * imageWidth;
      transformations.push(`l_${publicId},w_${imageWidth},h_${imageHeight},c_fill,x_${xPosition},fl_layer_apply`);
    }
  }
  
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join('/')}/${basePublicId}`;
  console.log('🔧 Generated collage URL:', url);
  
  return url;
}

// Main collage endpoint
export const createCollageHandler = async (req: Request, res: Response): Promise<void> => {
  console.log('🔧 CollageHandler called - Environment check:');
  console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'MISSING');
  console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'PRESENT' : 'MISSING');
  console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING');
  
  // Configure Cloudinary with current environment variables
  console.log('⚙️  Configuring Cloudinary...');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured');
  
  try {
    const files = req.files as Express.Multer.File[];
    const titlesParam = req.body.titles;
    
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No photos provided' });
      return;
    }
    
    if (!titlesParam) {
      res.status(400).json({ error: 'No titles provided' });
      return;
    }
    
    let titles: string[];
    try {
      titles = JSON.parse(titlesParam);
    } catch {
      res.status(400).json({ error: 'Invalid titles format - must be JSON array' });
      return;
    }
    
    if (titles.length !== files.length) {
      res.status(400).json({ error: 'Number of titles must match number of photos' });
      return;
    }
    
    // Upload all files to Cloudinary
    console.log(`Uploading ${files.length} files to Cloudinary...`);
    const uploadPromises = files.map((file, index) => 
      uploadToCloudinary(file.buffer, titles[index], index)
    );
    
    const uploaded = await Promise.all(uploadPromises);
    console.log('All files uploaded successfully');
    
    // Create collage URL
    const collageUrl = createCollageUrlNew(uploaded);
    console.log('Collage URL created:', collageUrl);
    
    const response: CollageResponse = {
      collageUrl,
      uploaded
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Collage creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create collage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Photo upload handler for individual photos
// Video upload handler with poster generation
export const videoUploadHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🎬 VideoUploadHandler called');
    console.log('  Method:', req.method);
    console.log('  Headers:', req.headers);
    console.log('  Body keys:', Object.keys(req.body));
    console.log('  Files:', req.file ? 'FILE PRESENT' : 'NO FILE');
    
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No video file provided' });
      return;
    }

    // Validate video file
    if (!file.mimetype.startsWith('video/')) {
      res.status(400).json({ error: 'File must be a video' });
      return;
    }

    const { locationTitle, sessionId, teamName, locationName, eventName } = req.body;
    
    console.log('📦 Parsed form data:');
    console.log('  File:', file.originalname, `(${file.size} bytes)`);
    console.log('  Location Title:', locationTitle);
    console.log('  Session ID:', sessionId);
    console.log('  Team Name:', teamName);
    console.log('  Location Name:', locationName);
    console.log('  Event Name:', eventName);

    if (!locationTitle || !sessionId) {
      res.status(400).json({ error: 'Location title and session ID are required' });
      return;
    }

    // Generate slug and public ID
    const locationSlug = slugify(locationTitle);
    const timestamp = Date.now();
    const publicId = `${sessionId}/${locationSlug}_${timestamp}`;
    
    // Generate tags for organization
    const tags = ['vail-scavenger', 'individual-video'];
    if (teamName) {
      tags.push(`team:${teamName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    }
    if (locationName) {
      tags.push(`location:${locationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    }
    
    console.log('🎥 Uploading video to Cloudinary with publicId:', publicId);
    console.log('🏷️ Using tags:', tags);
    
    const uploadResult = await new Promise<{publicId: string, secureUrl: string, posterUrl?: string}>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'scavenger/entries',
          tags: tags,
          public_id: publicId,
          context: { 
            team_name: teamName || '',
            company_name: locationName || '',
            session_id: sessionId,
            upload_time: new Date().toISOString(),
            scavenger_hunt_name: locationName || 'Vail Hunt',
            location_slug: locationSlug,
            upload_type: 'individual_video',
            event_name: eventName || ''
          },
          resource_type: 'video',
          quality: 'auto:good',
          // Generate poster/thumbnail automatically
          eager: [
            { format: 'jpg', quality: 'auto:good', transformation: [{ fetch_format: 'auto' }] }, // poster
            { format: 'jpg', width: 200, height: 200, crop: 'fill', quality: 'auto:good' } // thumbnail
          ],
          eager_async: false // Generate transformations synchronously
        },
        (error, result) => {
          if (error) {
            console.error('☁️ Cloudinary video upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary video upload successful:', result?.public_id);
            resolve({
              publicId: result!.public_id,
              secureUrl: result!.secure_url,
              posterUrl: result!.eager?.[0]?.secure_url // First eager transformation (poster)
            });
          }
        }
      ).end(file.buffer);
    });

    // Prepare response
    const response = {
      photoUrl: uploadResult.secureUrl, // Keep same field name for compatibility
      videoUrl: uploadResult.secureUrl,
      posterUrl: uploadResult.posterUrl,
      publicId: uploadResult.publicId,
      locationSlug,
      title: locationTitle,
      uploadedAt: new Date().toISOString()
    };

    console.log('📊 Video upload successful, sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('💥 Video upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const photoUploadHandler = async (req: Request, res: Response): Promise<void> => {
  console.log('📸 PhotoUploadHandler called');
  console.log('  Method:', req.method);
  console.log('  Headers:', req.headers);
  console.log('  Body keys:', Object.keys(req.body || {}));
  console.log('  Files:', req.file ? 'FILE PRESENT' : 'NO FILE');
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const file = req.file;
    const { locationTitle, sessionId, teamName, locationName, eventName } = req.body;
    
    console.log('📦 Parsed form data:');
    console.log('  File:', file ? `${file.originalname} (${file.size} bytes)` : 'MISSING');
    console.log('  Location Title:', locationTitle);
    console.log('  Session ID:', sessionId);
    console.log('  Team Name:', teamName);
    console.log('  Location Name:', locationName);
    console.log('  Event Name:', eventName);

    // Validate inputs
    if (!file) {
      console.log('❌ No photo provided');
      res.status(400).json({ error: 'No photo provided' });
      return;
    }

    if (!locationTitle) {
      console.log('❌ No location title provided');
      res.status(400).json({ error: 'No location title provided' });
      return;
    }

    if (!sessionId) {
      console.log('❌ No session ID provided');
      res.status(400).json({ error: 'No session ID provided' });
      return;
    }

    // Generate location slug
    const locationSlug = locationTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '');

    console.log('🏷️ Generated slug:', locationSlug);

    // Upload to Cloudinary
    const timestamp = Date.now();
    const publicId = `${sessionId}/${locationSlug}_${timestamp}`;
    
    // Build dynamic tags
    const tags = ['vail-scavenger', 'individual-photo'];
    if (teamName) {
      tags.push(`team:${teamName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    }
    if (locationName) {
      tags.push(`location:${locationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    }
    
    console.log('☁️ Uploading to Cloudinary with publicId:', publicId);
    console.log('🏷️ Using tags:', tags);
    
    const uploadResult = await new Promise<{publicId: string, secureUrl: string}>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'scavenger/entries',
          tags: tags,
          public_id: publicId,
          context: { 
            team_name: teamName || '',
            company_name: locationName || '',
            session_id: sessionId,
            upload_time: new Date().toISOString(),
            scavenger_hunt_name: locationName || 'Vail Hunt',
            location_slug: locationSlug,
            upload_type: 'individual_photo',
            event_name: eventName || ''
          },
          resource_type: 'image',
          format: 'jpg',
          quality: 'auto:good',
        },
        (error, result) => {
          if (error) {
            console.error('☁️ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result?.public_id);
            resolve({
              publicId: result!.public_id,
              secureUrl: result!.secure_url
            });
          }
        }
      ).end(file.buffer);
    });

    // Prepare response
    const response = {
      photoUrl: uploadResult.secureUrl,
      publicId: uploadResult.publicId,
      locationSlug,
      title: locationTitle,
      uploadedAt: new Date().toISOString()
    };

    console.log('📊 Upload successful, sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('💥 Photo upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload photo',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Express router setup
const router = express.Router();
router.post('/collage', upload.array('photos[]'), createCollageHandler);
router.post('/photo-upload', upload.single('photo'), photoUploadHandler);
router.post('/video-upload', upload.single('media'), videoUploadHandler);

export default router;