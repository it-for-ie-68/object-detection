export interface ONNX_Output {
  detection_boxes: ONNX_Data;
  detection_classes: ONNX_Data;
  detection_scores: ONNX_Data;
  num_detections: NumDetections0;
}

export interface ONNX_Data {
  cpuData: { [key: string]: number };
  dataLocation: string;
  type: string;
  dims: number[];
  size: number;
}

export interface NumDetections0 {
  cpuData: {
    "0": number;
  };
  dataLocation: string;
  type: string;
  dims: number[];
  size: number;
}
