import { Jimp } from "jimp";
import { Tensor } from "onnxruntime-web";
import { classList } from "./classes";
import { useEffect, useState } from "react";
import { load_model } from "./model";
import { output_test } from "./sample_outout";
import { displayPredictions } from "./utils";
import "./App.css";
interface Prediction {
  idx: number;
  probability: number;
  class: string;
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<any>(null);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);

  useEffect(() => {
    setIsLoading(true);
    load_model().then((res) => {
      setSession(res);
      console.log(res);
      setIsLoading(false);
    });
  }, []);

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    // User needs to select an image
    if (!e.target.files) return;
    // There has to be one file.
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Read the file for preview
    // const fileReaderPreview = new FileReader();
    // fileReaderPreview.addEventListener("load", async (e) => {
    //   setPreviewImage(e.target?.result);
    //   setPredictions([]);
    // });
    // fileReaderPreview.readAsDataURL(file);

    // Read the file for ML
    const fileReaderML = new FileReader();
    fileReaderML.addEventListener("load", async (e) => {
      const image = await Jimp.fromBuffer(e.target?.result);

      const { width, height } = resizeImage(image);
      const base64String = await image.getBase64("image/jpeg");
      setPreviewImage(base64String);

      setWidth(width);
      setHeight(height);
      console.log({ width, height });
      const inputTensor = await processImageML(image, width, height);
      const feeds: any = {};
      feeds[session.inputNames[0]] = inputTensor;
      // Run inference
      try {
        const output = await session.run(feeds);
        console.log({ output });
        displayPredictions(output, width, height);
      } catch (err) {
        console.log(err);
      }
      // Format output

      // const logits = output.class_logits.cpuData as number[];
      // const _probs = softmax(logits);
      // const probs = Array.prototype.slice.call(_probs); // Need to convert into regular array
      // const tops = getTopClasses(probs, 5);
      // setPredictions(tops);
    });
    fileReaderML.readAsArrayBuffer(file);
  };

  if (isLoading) return <div className="container">Loading...</div>;
  return (
    <div className="container">
      <h1>Image Classifier</h1>
      <div>
        <input type="file" onChange={handleSelectImage} />
      </div>
      <div
        className="wrapper"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <canvas id="canvas" className="canvas" />
        {previewImage && (
          <img
            id="my-img"
            src={previewImage}
            alt="preview-image"
            className="webcam"
          />
        )}
      </div>
    </div>
  );
}

export default App;

function resizeImage(image: any, maxWidth = 800) {
  const oriWidth = image.bitmap.width;
  // const oriHeight = image.bitmap.height;
  const width = oriWidth > maxWidth ? maxWidth : oriWidth;
  image.resize({ w: width, h: Jimp.AUTO });

  const outWidth = image.bitmap.width;
  const outHeight = image.bitmap.height;

  // console.log({ oriWidth, oriHeight, outWidth, outHeight });
  return { width: outWidth, height: outHeight };
}

async function processImageML(image: any, width: number, height: number) {
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

function softmax(logits: number[]): number[] {
  // For numerical stability, subtract the max logit before exponentiation
  const maxLogit = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sumExps);
}

function getTopClasses(probs: number[], n = 5) {
  // Pair each probability with its index
  const probIdx = probs.map((prob, idx) => ({
    idx,
    probability: prob,
  }));

  // Sort by probability descending
  probIdx.sort((a, b) => b.probability - a.probability);
  // Get top n
  const probIdxSlice = probIdx.slice(0, n);
  // Add class
  const probIdxClass = probIdxSlice.map((el) => ({
    ...el,
    class: classList[el.idx],
  }));

  return probIdxClass;
}

function capital(val: string) {
  return val.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}
