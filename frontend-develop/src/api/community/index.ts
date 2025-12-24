import api from '@/api/axios';

// API Endpoints
// Post List: GET /posts
// Post Detail: GET /posts/{postId}
// Create Post: POST /posts
// ...

export interface PostCreateRequest {
    title: string;
    content: string;
    images?: string[];
}

export interface PostUpdateRequest {
    title?: string;
    content?: string;
    images?: string[];
}

export interface CommentRequest {
    content: string;
}

// --- List Response Types ---
export interface PostSummary {
    postId: number;
    authorId: number;
    authorUsername: string;
    authorProfileImageUrl: string;
    title: string;
    contentPreview: string;
    content?: string; // Fallback if preview is not provided
    images?: string[]; // Fallback if thumbnail is not provided
    thumbnailUrl: string; // Empty if no image
    likeCount: number;
    commentCount: number;
    createdAt: string;
}

export interface PostListResponse {
    page: number;
    size: number;
    totalCount: number;
    posts: PostSummary[];
}

// --- Detail Response Types ---
export interface PostDetailResponse {
    postId: number;
    authorId: number;
    authorUsername: string;
    authorProfileImageUrl: string;
    title: string;
    content: string;
    images: string[];
    likeCount: number;
    commentCount: number;
    isLikedByMe: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CommentResponse {
    commentId: number;
    postId: number;
    authorId: number;
    authorUsername: string;
    authorProfileImageUrl?: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CommentListResponse {
    postId: number;
    totalCount: number;
    comments: CommentResponse[];
}


// Just keeping this for backward compatibility if needed, but mostly replaced by specific types above
export interface PostResponse {
    postId: number;
    authorId: number;
    authorUsername: string;
    title: string;
    content: string;
    images: string[];
    likeCount: number;
    commentCount: number;
    createdAt: string;
}


// 좋아요
export interface LikeResponse {
    postId: number;
    liked: boolean;
    likeCount: number;
}

export default {
    // 게시글
    getPosts: (params?: any) => api.get<PostListResponse>('/posts', { params }),
    getPostDetail: (postId: number) => api.get<PostDetailResponse>(`/posts/${postId}`),
    createPost: (data: PostCreateRequest) => api.post<PostResponse>('/posts', data), // Create returns simple response usually
    deletePost: (postId: number) => api.delete(`/posts/${postId}`),
    updatePost: (postId: number, data: PostUpdateRequest) => api.put<PostDetailResponse>(`/posts/${postId}`, data),

    // 댓글
    getCommentsByPost: (postId: number) => api.get<CommentListResponse>(`/posts/${postId}/comments`),
    createComment: (postId: number, data: CommentRequest) => api.post<CommentResponse>(`/posts/${postId}/comments`, data),
    updateComment: (postId: number, commentId: number, data: CommentRequest) => api.put<CommentResponse>(`/posts/${postId}/comments/${commentId}`, data),
    deleteComment: (postId: number, commentId: number) => api.delete(`/posts/${postId}/comments/${commentId}`),

    // 좋아요
    likePost: (postId: number) => api.post<LikeResponse>(`/posts/${postId}/like`),
    unlikePost: (postId: number) => api.delete<LikeResponse>(`/posts/${postId}/like`),
};
