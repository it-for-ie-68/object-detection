import * as ort from "onnxruntime-web";
export async function load_model() {
  // Path must be relative to public folder in Vite projects
  const modelUrl = `/ssd_mobilenet_v1_12.onnx`;
  // const modelUrl = `/ssd_mobilenet_v1_12-int8.onnx`;
  console.log({ modelUrl });

  // Create session
  const session = await ort.InferenceSession.create(modelUrl);
  return session;
}
export { ort };
