export function extractInfoFromPrediction(output: any) {
  const n_obj = output?.["num_detections:0"]?.["cpuData"]?.["0"];

  const _dBoxes = output?.["detection_boxes:0"]?.["cpuData"];
  let dBoxes1D = Object.keys(_dBoxes).map((key) => _dBoxes[key]);
  dBoxes1D = dBoxes1D.slice(0, n_obj * 4);
  const dBoxes2D = [];
  while (dBoxes1D.length) dBoxes2D.push(dBoxes1D.splice(0, 4));

  const _classesNames = output?.["detection_classes:0"]?.["cpuData"];
  let classNames = Object.keys(_classesNames).map((key) => _classesNames[key]);
  classNames = classNames.slice(0, n_obj);

  const _scores = output?.["detection_scores:0"]?.["cpuData"];
  let scores = Object.keys(_scores).map((key) => _scores[key]);
  scores = scores.slice(0, n_obj);

  console.log({ n_obj, dBoxes2D, classNames, scores });
  return { n_obj, dBoxes2D, classNames, scores };
}

export function displayPredictions(output: any, width: number, height: number) {
  const { n_obj, dBoxes2D, classNames, scores } =
    extractInfoFromPrediction(output);

  if (!n_obj) return;

  const canvas =
    (document.getElementById("canvas") as HTMLCanvasElement) || null;
  canvas.width = width; // Set sizing first
  canvas.height = height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) return;

  // Start painting
  ctx.clearRect(0, 0, width, height);

  for (let n = 0; n < n_obj; n++) {
    drawBox(ctx, dBoxes2D[n], classNames[n], scores[n], width, height);
  }
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  dbox: number[], // Top, Left, Bottom, Right
  className: string,
  score: number,
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

  console.log({
    width,
    height,
    top,
    left,
    bottom,
    right,
    bboxTop,
    bboxLeft,
    bboxHeight,
    bboxWidth,
  });

  ctx.beginPath();
  ctx.font = "28px Arial";
  ctx.fillStyle = "red";

  ctx.fillText(
    className + ": " + Math.round(score * 100) + "%",
    bboxLeft + 5,
    bboxTop + 30
  );

  ctx.rect(bboxLeft, bboxTop, bboxWidth, bboxHeight);
  //   ctx.rect(0, 0, 50, 50);
  ctx.strokeStyle = "#FF0000";
  ctx.fillStyle = "rgba(140, 41, 162, 0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fill();
  console.log("here");
}
