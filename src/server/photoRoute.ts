import express from 'express';
import { Request, Response } from 'express';

interface PhotoRecord {
  photoUrl: string;
  publicId: string;
  locationSlug: string;
  title: string;
  uploadedAt: string;
  locationId: string;
  teamName?: string; // Add team name to photo record
}

interface PhotosByCompanyEventResponse {
  photos: PhotoRecord[];
  totalCount: number;
  companyName: string;
  eventName: string;
}

interface PhotosByTeamResponse {
  photos: PhotoRecord[];
  totalCount: number;
  companyName: string;
  eventName: string;
  teamName: string;
}

// In-memory storage for development (should be replaced with proper database)
const photoStorage = new Map<string, PhotoRecord[]>();

// Helper function to create storage key
const createStorageKey = (companyName: string, eventName: string, teamName?: string): string => {
  const base = `${companyName.toLowerCase()}:${eventName.toLowerCase()}`;
  return teamName ? `${base}:${teamName.toLowerCase()}` : base;
};

// GET /api/photos/company/:companyName/event/:eventName - Get all photos for company/event
export const getPhotosByCompanyEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, eventName } = req.params;
    
    if (!companyName || !eventName) {
      res.status(400).json({ error: 'Company name and event name are required' });
      return;
    }
    
    console.log(`🔍 PHOTO API: Getting photos for company=${companyName}, event=${eventName}`);
    
    // Get all photos for this company/event across all teams
    const allPhotos: PhotoRecord[] = [];
    
    for (const [key, photos] of photoStorage.entries()) {
      const keyParts = key.split(':');
      if (keyParts.length >= 2 && 
          keyParts[0] === companyName.toLowerCase() && 
          keyParts[1] === eventName.toLowerCase()) {
        allPhotos.push(...photos);
      }
    }
    
    console.log(`📸 PHOTO API: Found ${allPhotos.length} photos for ${companyName}/${eventName}`);
    
    const response: PhotosByCompanyEventResponse = {
      photos: allPhotos,
      totalCount: allPhotos.length,
      companyName,
      eventName
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ PHOTO API: Error getting photos by company/event:', error);
    res.status(500).json({ 
      error: 'Failed to get photos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/photos/company/:companyName/event/:eventName/team/:teamName - Get photos for specific team
export const getPhotosByTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, eventName, teamName } = req.params;
    
    if (!companyName || !eventName || !teamName) {
      res.status(400).json({ error: 'Company name, event name, and team name are required' });
      return;
    }
    
    console.log(`🔍 PHOTO API: Getting photos for company=${companyName}, event=${eventName}, team=${teamName}`);
    
    const storageKey = createStorageKey(companyName, eventName, teamName);
    const photos = photoStorage.get(storageKey) || [];
    
    console.log(`📸 PHOTO API: Found ${photos.length} photos for ${companyName}/${eventName}/${teamName}`);
    
    const response: PhotosByTeamResponse = {
      photos,
      totalCount: photos.length,
      companyName,
      eventName,
      teamName
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ PHOTO API: Error getting photos by team:', error);
    res.status(500).json({ 
      error: 'Failed to get photos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /api/photos/company/:companyName/event/:eventName/team/:teamName - Save photo for team
export const saveTeamPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, eventName, teamName } = req.params;
    const photo: PhotoRecord = req.body;
    
    if (!companyName || !eventName || !teamName) {
      res.status(400).json({ error: 'Company name, event name, and team name are required' });
      return;
    }
    
    if (!photo || !photo.photoUrl || !photo.locationId) {
      res.status(400).json({ error: 'Valid photo record with photoUrl and locationId is required' });
      return;
    }
    
    console.log(`💾 PHOTO API: Saving photo for company=${companyName}, event=${eventName}, team=${teamName}`);
    console.log(`📸 Photo details:`, { locationId: photo.locationId, url: photo.photoUrl });
    
    const storageKey = createStorageKey(companyName, eventName, teamName);
    let photos = photoStorage.get(storageKey) || [];
    
    // Remove any existing photo for this location (replace)
    photos = photos.filter(p => p.locationId !== photo.locationId);
    
    // Add team name to photo record before saving
    const photoWithTeam = { ...photo, teamName };
    
    // Add the new photo
    photos.push(photoWithTeam);
    
    // Save back to storage
    photoStorage.set(storageKey, photos);
    
    console.log(`✅ PHOTO API: Photo saved. Team now has ${photos.length} photos`);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ PHOTO API: Error saving team photo:', error);
    res.status(500).json({ 
      error: 'Failed to save photo',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// DELETE /api/photos/company/:companyName/event/:eventName/team/:teamName/location/:locationId - Delete photo
export const deleteTeamPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, eventName, teamName, locationId } = req.params;
    
    if (!companyName || !eventName || !teamName || !locationId) {
      res.status(400).json({ error: 'Company name, event name, team name, and location ID are required' });
      return;
    }
    
    console.log(`🗑️ PHOTO API: Deleting photo for company=${companyName}, event=${eventName}, team=${teamName}, location=${locationId}`);
    
    const storageKey = createStorageKey(companyName, eventName, teamName);
    let photos = photoStorage.get(storageKey) || [];
    
    const beforeCount = photos.length;
    photos = photos.filter(p => p.locationId !== locationId);
    const afterCount = photos.length;
    
    // Update storage
    photoStorage.set(storageKey, photos);
    
    console.log(`✅ PHOTO API: Deleted ${beforeCount - afterCount} photos. Team now has ${afterCount} photos`);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ PHOTO API: Error deleting team photo:', error);
    res.status(500).json({ 
      error: 'Failed to delete photo',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Express router setup
const router = express.Router();
router.get('/photos/company/:companyName/event/:eventName', getPhotosByCompanyEvent);
router.get('/photos/company/:companyName/event/:eventName/team/:teamName', getPhotosByTeam);
router.post('/photos/company/:companyName/event/:eventName/team/:teamName', saveTeamPhoto);
router.delete('/photos/company/:companyName/event/:eventName/team/:teamName/location/:locationId', deleteTeamPhoto);

export default router;