import { type ONNX_Output } from "./types";
import { classList } from "./classes";
import { Tensor } from "onnxruntime-web";
import { Jimp } from "jimp";

export async function resizeImage(image: any, maxWidth = 800) {
  const oriWidth = image.bitmap.width;
  // const oriHeight = image.bitmap.height;
  const width = oriWidth > maxWidth ? maxWidth : oriWidth;
  //@ts-ignore
  image.resize({ w: width, h: Jimp.AUTO });
  const imageBase64 = await image.getBase64("image/jpeg");
  const outWidth = image.bitmap.width;
  const outHeight = image.bitmap.height;
  // console.log({ oriWidth, oriHeight, outWidth, outHeight });
  return { width: outWidth, height: outHeight, imageBase64 };
}

export async function convertImageToTensor(
  image: any,
  width: number,
  height: number
) {
  const dims = [1, height, width, 3]; // batch_size, height, width, channels

  // 1. Get buffer data
  const imageBufferData = image.bitmap.data; // RGBA format

  // 2. Prepare the output array (uint8), size: batch_size * height * width * channels
  const batchSize = dims[0];
  const finalArray = new Uint8Array(batchSize * height * width * 3);

  // 3. Fill the array in (batch, height, width, channels) order
  // Assuming batchSize = 1 for simple inference
  let idx = 0;
  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      const offset = (h * width + w) * 4;
      const r = imageBufferData[offset];
      const g = imageBufferData[offset + 1];
      const b = imageBufferData[offset + 2];
      finalArray[idx++] = r; // Red
      finalArray[idx++] = g; // Green
      finalArray[idx++] = b; // Blue
    }
  }

  // 4. If your tensor lib requires a Tensor object:
  const inputTensor = new Tensor("uint8", finalArray, dims);

  // console.log(inputTensor);
  // 5. Return the typed array (for direct manipulation) or the tensor object if needed
  return inputTensor;
}

export interface Prediction {
  idx: number;
  className: string;
  dBoxes: number[];
  probability: number;
}

export function formatOutput(output: ONNX_Output) {
  const n_obj = output?.["num_detections"]?.["cpuData"]?.["0"];

  if (n_obj == 0) return [];

  const _dBoxes = output?.["detection_boxes"]?.["cpuData"];
  let dBoxes1D = Object.keys(_dBoxes).map((key) => _dBoxes[key]);
  dBoxes1D = dBoxes1D.slice(0, n_obj * 4);
  const dBoxes2D: number[][] = [];
  while (dBoxes1D.length) dBoxes2D.push(dBoxes1D.splice(0, 4));

  const _classesNames = output?.["detection_classes"]?.["cpuData"];
  let classIdx = Object.keys(_classesNames).map((key) => _classesNames[key]);
  classIdx = classIdx.slice(0, n_obj);
  const classNames = classIdx.map((i) => classList[i]);

  const _scores = output?.["detection_scores"]?.["cpuData"];
  let scores = Object.keys(_scores).map((key) => _scores[key]);
  scores = scores.slice(0, n_obj);

  // console.log({ n_obj, dBoxes2D, classNames, scores });

  const predictions = classNames.map((classname, idx) => ({
    idx: idx,
    className: capital(classname),
    dBoxes: dBoxes2D[idx],
    probability: scores[idx],
  }));

  return predictions;
}

export function displayPredictions(
  predictions: Prediction[],
  width: number,
  height: number
) {
  const canvas =
    (document.getElementById("canvas") as HTMLCanvasElement) || null;
  // Need to set sizing before painting
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) return;

  // Start painting
  ctx.clearRect(0, 0, width, height);

  const n_obj = predictions.length;
  if (n_obj == 0) return;

  for (let n = 0; n < n_obj; n++) {
    const { dBoxes, className, probability } = predictions[n];
    drawBox(ctx, dBoxes, className, probability, width, height);
  }
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  dbox: number[], // Top, Left, Bottom, Right
  className: string,
  probability: number,
  width: number,
  height: number
) {
  let top = dbox[0] * height;
  let left = dbox[1] * width;
  let bottom = dbox[2] * height;
  let right = dbox[3] * width;

  let bboxTop = top;
  let bboxLeft = left;
  let bboxWidth = right - left;
  let bboxHeight = bottom - top;

  // console.log({
  //   width,
  //   height,
  //   top,
  //   left,
  //   bottom,
  //   right,
  //   bboxTop,
  //   bboxLeft,
  //   bboxHeight,
  //   bboxWidth,
  // });

  ctx.beginPath();
  ctx.font = "28px Arial";
  ctx.fillStyle = "red";

  ctx.fillText(
    className + ": " + Math.round(probability * 100) + "%",
    bboxLeft + 5,
    bboxTop + 30
  );

  ctx.rect(bboxLeft, bboxTop, bboxWidth, bboxHeight);
  // ctx.rect(0, 0, 50, 50);
  ctx.strokeStyle = "#be3535ff";
  ctx.fillStyle = "rgba(140, 41, 162, 0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fill();
}

function capital(val: string) {
  return val.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}
