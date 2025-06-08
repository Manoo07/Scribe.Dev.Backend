// src/controllers/fileController.ts
import multer from 'multer';
import { uploadFileToCloudinary } from '../utils/uploadFile';

const upload = multer({ dest: 'uploads/' });

export const uploadFileHandler = [
  upload.single('file'), // field name: 'file'
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileType = file.mimetype.includes('pdf')
        ? 'pdf'
        : file.mimetype.includes('presentation')
        ? 'ppt'
        : file.mimetype.includes('word')
        ? 'docx'
        : 'other';

      const result = await uploadFileToCloudinary(file.path, fileType);
      return res.json({ url: result.url, public_id: result.public_id });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  },
];
