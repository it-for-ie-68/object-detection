export interface ONNX_Output {
  "detection_boxes:0": DetectionEs0;
  "detection_classes:0": DetectionEs0;
  "detection_scores:0": DetectionEs0;
  "num_detections:0": NumDetections0;
}

export interface DetectionEs0 {
  cpuData: { [key: string]: number };
  dataLocation: string;
  type: string;
  dims: number[];
  size: number;
}

export interface NumDetections0 {
  cpuData: CPUData;
  dataLocation: string;
  type: string;
  dims: number[];
  size: number;
}

export interface CPUData {
  "0": number;
}
