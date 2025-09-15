import { Jimp } from "jimp";
import { useEffect, useState } from "react";
import { load_model } from "./model";
import {
  convertImageToTensor,
  displayPredictions,
  resizeImage,
  formatOutput,
  type Prediction,
} from "./ml";
import "./App.css";

function App() {
  const [session, setSession] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<any>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    setIsLoading(true);
    load_model().then((res) => {
      setSession(res);
      // console.log(res);
      setIsLoading(false);
    });
  }, []);

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    // User needs to select an image
    if (!e.target.files) return;
    // There has to be one file.
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];

    const fileReaderML = new FileReader();
    fileReaderML.addEventListener("load", async (e) => {
      const buffer = e.target?.result;
      if (!buffer || !(buffer instanceof ArrayBuffer)) return;
      const image = await Jimp.fromBuffer(buffer);

      // ---------- Generate Image Preview ----------
      const { width, height, imageBase64 } = await resizeImage(image);
      setPreviewImage(imageBase64);
      setWidth(width);
      setHeight(height);

      // ---------- ML Inference ----------
      const inputTensor = await convertImageToTensor(image, width, height);
      const feeds: any = {};
      feeds[session.inputNames[0]] = inputTensor;
      const output = await session.run(feeds);
      const _predictions = formatOutput(output);
      console.log(_predictions);
      setPredictions(_predictions);
      displayPredictions(_predictions, width, height);
    });
    fileReaderML.readAsArrayBuffer(file); // Start reading the file
  };

  if (isLoading) return <div className="container">Loading...</div>;
  return (
    <div className="container">
      <h1>Object Detection</h1>
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
            className="image-holder"
          />
        )}
      </div>
      {predictions.length > 0 && (
        <article>
          <h2>Predictions</h2>
          {predictions?.map((p) => (
            <div key={p.idx}>
              <b>{p.className}</b>
              &nbsp; &nbsp;
              <em>({(p.probability * 100).toFixed(0)}% likely)</em>
            </div>
          ))}
        </article>
      )}
    </div>
  );
}

export default App;
