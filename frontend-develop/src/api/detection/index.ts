import axios from "axios";

// Types based on user spec
export interface DetectionBox {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface DetectionResult {
  box: DetectionBox;
  class_id: number;
  confidence: number;
  label: string;
}

export interface DetectionResponse {
  results: DetectionResult[];
}

const detectionApi = {
  detectImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    // Python Server is on port 8000
    // Auth is NOT required, so we use plain axios instead of the interceptor instance
    const response = await axios.post<DetectionResponse>("http://localhost:8000/api/v1/detect", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default detectionApi;
