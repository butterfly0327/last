import api from '@/api/axios';
import axios from 'axios';

// Types matches backend DTOs
export type ImagePurpose = 'PROFILE' | 'POST' | 'DIET' | 'CHALLENGE';

export interface PresignRequest {
    purpose: ImagePurpose;
    fileName: string;
    contentType: string;
}

export interface PresignResponse {
    presignedUrl: string;
    objectKey: string;
    expiresAt: string;
    cdnUrl: string; // Used for display/saving to DB
}

export default {
    // 1. Get Presigned URL
    getPresignedUrl: (data: PresignRequest) =>
        api.post<PresignResponse>('/images/presign', data),

    // 2. Upload file to S3 via Presigned URL
    uploadToS3: (presignedUrl: string, file: File) =>
        axios.put(presignedUrl, file, {
            headers: {
                'Content-Type': file.type,
            },
        }),

    // Helper: Combined wrapper for convenience
    uploadImage: async (file: File, purpose: ImagePurpose): Promise<string> => {
        try {
            // Step 1: Get Presigned URL
            const { data: presignData } = await api.post<PresignResponse>('/images/presign', {
                purpose,
                fileName: file.name,
                contentType: file.type
            });

            // Step 2: Upload to S3 (Directly using axios to bypass interceptors/base URL)
            await axios.put(presignData.presignedUrl, file, {
                headers: {
                    'Content-Type': file.type
                }
            });

            // Return the objectKey as required by backend
            return presignData.objectKey;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }
};
