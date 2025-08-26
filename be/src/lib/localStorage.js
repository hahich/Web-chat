import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const avatarsDir = path.join(uploadsDir, 'avatars');

// Ensure directories exist
[uploadsDir, imagesDir, avatarsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Convert base64 to file and save locally
export const saveBase64Image = async (base64String, type = 'image') => {
    try {
        // Remove data:image/jpeg;base64, prefix if present
        const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = base64String.includes('data:image/jpeg') ? 'jpg' : 
                         base64String.includes('data:image/png') ? 'png' : 
                         base64String.includes('data:image/gif') ? 'gif' : 'jpg';
        
        const filename = `${timestamp}_${randomString}.${extension}`;
        
        // Determine save directory based on type
        const saveDir = type === 'avatar' ? avatarsDir : imagesDir;
        const filePath = path.join(saveDir, filename);
        
        // Convert base64 to buffer and save
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);
        
        // Return the relative path for database storage
        const relativePath = type === 'avatar' ? `/uploads/avatars/${filename}` : `/uploads/images/${filename}`;
        
        return {
            url: relativePath,
            filename: filename,
            path: filePath
        };
    } catch (error) {
        console.error('Error saving image:', error);
        throw new Error('Failed to save image');
    }
};

// Delete file from local storage
export const deleteLocalFile = (filePath) => {
    try {
        if (filePath && filePath.startsWith('/uploads/')) {
            const fullPath = path.join(__dirname, '../..', filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

// Get full URL for a file
export const getFileUrl = (filePath, req) => {
    if (!filePath) return null;
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}${filePath}`;
};
