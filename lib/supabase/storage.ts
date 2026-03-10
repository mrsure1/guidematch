import { createClient } from './client';

const supabase = createClient();
const BUCKET_NAME = 'tours';

/**
 * 파일을 Supabase Storage에 업로드하고 공용 URL을 반환합니다.
 * @param file 업로드할 파일 객체
 * @param path 저장될 경로 (예: 'tour_id/filename.png')
 * @returns 업로드된 파일의 Public URL
 */
export async function uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
            upsert: true,
            cacheControl: '3600'
        });

    if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`파일 업로드 실패: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    return publicUrl;
}

/**
 * 다중 파일을 업로드하고 URL 배열을 반환합니다.
 */
export async function uploadMultipleFiles(files: File[], tourId: string): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
        const extension = file.name.split('.').pop();
        const fileName = `${Date.now()}_${index}.${extension}`;
        return uploadFile(file, `${tourId}/${fileName}`);
    });

    return Promise.all(uploadPromises);
}

/**
 * 특정 경로의 파일을 삭제합니다.
 */
export async function deleteFile(path: string) {
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) {
        console.error('Error deleting file:', error);
    }
}
