import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let imageBucket;
let resumeBucket;

// Initialize GridFS buckets after MongoDB connection
export const initGridFS = () => {
  const db = mongoose.connection.db;

  imageBucket = new GridFSBucket(db, {
    bucketName: 'images'
  });

  resumeBucket = new GridFSBucket(db, {
    bucketName: 'resume'
  });

  console.log('✅ GridFS buckets initialized');
};

// Get image bucket
export const getImageBucket = () => {
  if (!imageBucket) {
    throw new Error('GridFS image bucket not initialized');
  }
  return imageBucket;
};

// Get resume bucket
export const getResumeBucket = () => {
  if (!resumeBucket) {
    throw new Error('GridFS resume bucket not initialized');
  }
  return resumeBucket;
};

// Upload file to GridFS
export const uploadToGridFS = async (buffer, filename, contentType, metadata = {}, bucketName = 'images') => {
  const bucket = bucketName === 'resume' ? getResumeBucket() : getImageBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', () => {
      // Construct file object from upload stream properties
      const file = {
        _id: uploadStream.id,
        filename: uploadStream.filename,
        contentType: contentType,
        length: uploadStream.length || buffer.length,
        metadata: metadata
      };
      resolve(file);
    });

    uploadStream.end(buffer);
  });
};

// Download file from GridFS
export const downloadFromGridFS = async (fileId, bucketName = 'images') => {
  const bucket = bucketName === 'resume' ? getResumeBucket() : getImageBucket();

  return new Promise((resolve, reject) => {
    const chunks = [];

    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('error', (error) => {
      reject(error);
    });

    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

// Delete file from GridFS
export const deleteFromGridFS = async (fileId, bucketName = 'images') => {
  const bucket = bucketName === 'resume' ? getResumeBucket() : getImageBucket();

  try {
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    return true;
  } catch (error) {
    throw error;
  }
};

// Get file metadata from GridFS
export const getFileMetadata = async (fileId, bucketName = 'images') => {
  const bucket = bucketName === 'resume' ? getResumeBucket() : getImageBucket();

  try {
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    return files.length > 0 ? files[0] : null;
  } catch (error) {
    throw error;
  }
};

// Stream file from GridFS (for serving images/PDFs)
export const streamFromGridFS = (fileId, bucketName = 'images') => {
  const bucket = bucketName === 'resume' ? getResumeBucket() : getImageBucket();
  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};
