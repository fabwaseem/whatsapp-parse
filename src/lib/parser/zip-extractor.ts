import JSZip from 'jszip';
import { MediaFile, ParsingProgress } from '@/types/chat';

const CHAT_FILE_PATTERNS = [
  /^_chat\.txt$/i,
  /^chat\.txt$/i,
  /^WhatsApp Chat.*\.txt$/i,
  /\.txt$/i,
];

const MEDIA_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp4', '.mov', '.avi', '.mkv', '.3gp',
  '.opus', '.ogg', '.mp3', '.m4a', '.wav', '.aac', '.ptt',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
];

export interface ExtractedData {
  chatText: string;
  mediaFiles: Map<string, MediaFile>;
}

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    '3gp': 'video/3gpp',
    opus: 'audio/opus',
    ogg: 'audio/ogg',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    aac: 'audio/aac',
    ptt: 'audio/ogg', // WhatsApp voice note
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function isMediaFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return MEDIA_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

function findChatFile(fileNames: string[]): string | null {
  // Try each pattern in order of preference
  for (const pattern of CHAT_FILE_PATTERNS) {
    for (const fileName of fileNames) {
      const baseName = fileName.split('/').pop() || '';
      if (pattern.test(baseName)) {
        return fileName;
      }
    }
  }
  return null;
}

export async function extractZipFile(
  file: File,
  onProgress?: (progress: ParsingProgress) => void
): Promise<ExtractedData> {
  onProgress?.({
    stage: 'extracting',
    progress: 0,
    message: 'Loading ZIP file...',
  });

  const zip = await JSZip.loadAsync(file);
  const fileNames = Object.keys(zip.files);
  
  onProgress?.({
    stage: 'extracting',
    progress: 10,
    message: 'Finding chat file...',
  });

  // Find the chat text file
  const chatFileName = findChatFile(fileNames);
  if (!chatFileName) {
    throw new Error('No chat file found in the ZIP. Please make sure this is a valid WhatsApp export.');
  }

  onProgress?.({
    stage: 'extracting',
    progress: 20,
    message: 'Extracting chat content...',
  });

  // Extract chat text
  const chatFile = zip.files[chatFileName];
  const chatText = await chatFile.async('string');

  onProgress?.({
    stage: 'extracting',
    progress: 30,
    message: 'Extracting media files...',
  });

  // Extract media files
  const mediaFiles = new Map<string, MediaFile>();
  const mediaFileNames = fileNames.filter(name => isMediaFile(name));
  
  let processed = 0;
  const total = mediaFileNames.length;

  for (const fileName of mediaFileNames) {
    try {
      const file = zip.files[fileName];
      if (!file.dir) {
        const blob = await file.async('blob');
        const baseName = fileName.split('/').pop() || fileName;
        const mimeType = getMimeType(baseName);
        
        const mediaFile: MediaFile = {
          name: baseName,
          type: mimeType,
          blob: new Blob([blob], { type: mimeType }),
          url: '', // Will be set when needed
        };
        
        // Create object URL
        mediaFile.url = URL.createObjectURL(mediaFile.blob);
        mediaFiles.set(baseName, mediaFile);
      }
    } catch (error) {
      console.warn(`Failed to extract media file: ${fileName}`, error);
    }
    
    processed++;
    onProgress?.({
      stage: 'extracting',
      progress: 30 + (processed / total) * 50,
      message: `Extracting media... (${processed}/${total})`,
    });
  }

  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: 'Extraction complete!',
  });

  return {
    chatText,
    mediaFiles,
  };
}

export function cleanupMediaUrls(mediaFiles: Map<string, MediaFile>): void {
  for (const file of mediaFiles.values()) {
    if (file.url) {
      URL.revokeObjectURL(file.url);
    }
  }
}
