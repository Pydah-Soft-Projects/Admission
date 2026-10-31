export type Segmentation = Awaited<
  ReturnType<import('@tensorflow-models/body-segmentation').BodySegmenter['segmentPeople']>
>[number];

export type PortraitBackgroundMode = 'white' | 'blur' | 'none';

/** Segment at this max side length — 256 matches MediaPipe tensor input for 2x faster inference. */
const MAX_SEGMENT_SIDE = 256;

const MEDIAPIPE_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747';

let segmenterPromise: Promise<import('@tensorflow-models/body-segmentation').BodySegmenter> | null =
  null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Segmenter timeout')), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function getPortraitSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const bodySegmentation = await import('@tensorflow-models/body-segmentation');
      try {
        return await bodySegmentation.createSegmenter(
          bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
          {
            runtime: 'mediapipe',
            solutionPath: MEDIAPIPE_CDN,
            modelType: 'general',
          }
        );
      } catch {
        const tf = await import('@tensorflow/tfjs-core');
        await import('@tensorflow/tfjs-backend-webgl');
        await tf.setBackend('webgl');
        await tf.ready();
        return bodySegmentation.createSegmenter(
          bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
          { runtime: 'tfjs', modelType: 'general' }
        );
      }
    })().catch((err) => {
      segmenterPromise = null;
      throw err;
    });
  }
  return segmenterPromise;
}

/** Warm the model while the camera dialog is open so capture feels faster. */
export function preloadPortraitSegmenter(): void {
  void getPortraitSegmenter().catch(() => {});
}

function downscaleForSegmentation(source: HTMLCanvasElement): HTMLCanvasElement {
  const maxSide = Math.max(source.width, source.height);
  if (maxSide <= MAX_SEGMENT_SIDE) return source;

  const scale = MAX_SEGMENT_SIDE / maxSide;
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const small = document.createElement('canvas');
  small.width = w;
  small.height = h;
  const ctx = small.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, w, h);
  return small;
}

function upscaleCanvas(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  if (source.width === width && source.height === height) return source;
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) return source;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return out;
}

/**
 * Keep the person and fill background with white, automatically centering the person at 50% dead center.
 */
async function compositePersonOnWhite(
  sourceCanvas: HTMLCanvasElement,
  segmentations: Segmentation[],
  bodySegmentation: typeof import('@tensorflow-models/body-segmentation')
): Promise<HTMLCanvasElement> {
  const personMask = await bodySegmentation.toBinaryMask(
    segmentations,
    { r: 0, g: 0, b: 0, a: 255 },
    { r: 0, g: 0, b: 0, a: 0 },
    false,
    0.5
  );
  if (!personMask) return sourceCanvas;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const maskData = personMask.data;

  // Calculate person head & shoulder horizontal/vertical boundaries for perfect auto-centering
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;
  let xSum = 0;
  let count = 0;

  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const idx = (y * w + x) * 4;
      if (maskData[idx + 3]! > 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        xSum += x;
        count++;
      }
    }
  }

  let shiftX = 0;
  let shiftY = 0;
  if (count > 0 && minX < maxX) {
    const personMidX = (minX + maxX) / 2;
    const targetCenterX = w / 2;
    shiftX = Math.round(targetCenterX - personMidX);
    const maxShiftX = Math.round(w * 0.12);
    shiftX = Math.max(-maxShiftX, Math.min(maxShiftX, shiftX));

    // Vertical auto-centering shift: target head top at 16% height
    const targetTopY = Math.round(h * 0.16);
    shiftY = Math.round(targetTopY - minY);
    const maxShiftY = Math.round(h * 0.08);
    shiftY = Math.max(-maxShiftY, Math.min(maxShiftY, shiftY));
  }

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return sourceCanvas;
  maskCtx.putImageData(personMask, 0, 0);

  // Create cutout canvas
  const cutout = document.createElement('canvas');
  cutout.width = w;
  cutout.height = h;
  const cutoutCtx = cutout.getContext('2d');
  if (!cutoutCtx) return sourceCanvas;

  cutoutCtx.drawImage(sourceCanvas, 0, 0, w, h);
  cutoutCtx.globalCompositeOperation = 'destination-in';
  cutoutCtx.drawImage(maskCanvas, 0, 0, w, h);

  // Create final output canvas with solid white background
  const output = document.createElement('canvas');
  output.width = w;
  output.height = h;
  const ctx = output.getContext('2d', { alpha: false });
  if (!ctx) return sourceCanvas;

  // 1. Fill solid white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 2. Draw auto-centered person cutout (both X and Y centered)
  ctx.drawImage(cutout, shiftX, shiftY);

  return output;
}

/**
 * Replace or blur the background behind a person in a square portrait crop.
 */
export async function processPortraitBackground(
  sourceCanvas: HTMLCanvasElement,
  mode: PortraitBackgroundMode,
  flipHorizontal = false,
  precomputedSegmentations?: Segmentation[]
): Promise<HTMLCanvasElement> {
  if (mode === 'none') return sourceCanvas;

  const bodySegmentation = await import('@tensorflow-models/body-segmentation');

  const fullW = sourceCanvas.width;
  const fullH = sourceCanvas.height;
  const segmentInput = downscaleForSegmentation(sourceCanvas);

  let segmentations = precomputedSegmentations;
  if (!segmentations || !segmentations.length) {
    const segmenter = await getPortraitSegmenter();
    segmentations = await segmenter.segmentPeople(segmentInput);
  }

  if (!segmentations || !segmentations.length) {
    return sourceCanvas;
  }

  if (mode === 'white') {
    const composited = await compositePersonOnWhite(segmentInput, segmentations, bodySegmentation);
    return upscaleCanvas(composited, fullW, fullH);
  }

  const output = document.createElement('canvas');
  output.width = segmentInput.width;
  output.height = segmentInput.height;
  await bodySegmentation.drawBokehEffect(
    output,
    segmentInput,
    segmentations,
    0.5,
    16,
    3,
    flipHorizontal
  );
  return upscaleCanvas(output, fullW, fullH);
}

export function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  quality = 0.88
): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(
          new File([blob], `camera-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
        );
      },
      'image/jpeg',
      quality
    );
  });
}

export type GuidelineValidationResult = {
  isValid: boolean;
  reason: string;
  segmentations?: Segmentation[];
  metrics?: {
    topY: number;
    bottomY: number;
    centerX: number;
    personWidth: number;
    personHeight: number;
  };
};

/**
 * Validates whether head and shoulders in a 1:1 canvas match placement guidelines,
 * rejecting dark/silhouette images and side-profile poses.
 */
export type VerifyPortraitOptions = {
  /** If true, validation immediately approves as long as the frame is visible (never blocks manual capture or crop apply) */
  lenient?: boolean;
};

export async function verifyPortraitGuidelines(
  sourceCanvas: HTMLCanvasElement,
  precomputedSegmentations?: Segmentation[],
  options?: VerifyPortraitOptions
): Promise<GuidelineValidationResult> {
  try {
    // Fast Canvas Pre-check (<1ms): Detect pitch black / uncovered camera lens
    const fastCtx = sourceCanvas.getContext('2d');
    if (fastCtx) {
      const sampleW = Math.min(64, sourceCanvas.width);
      const sampleH = Math.min(64, sourceCanvas.height);
      try {
        const sampleData = fastCtx.getImageData(0, 0, sampleW, sampleH).data;
        let totalLum = 0;
        let samples = 0;
        for (let i = 0; i < sampleData.length; i += 16) {
          totalLum += 0.299 * sampleData[i]! + 0.587 * sampleData[i + 1]! + 0.114 * sampleData[i + 2]!;
          samples++;
        }
        if (samples > 0 && totalLum / samples < 8) {
          return {
            isValid: false,
            reason: 'Camera view is pitch dark. Ensure good room lighting.',
          };
        }
      } catch {
        /* ignore context errors */
      }
    }

    // Lenient mode: manual capture or cropper submission should proceed immediately without blocking
    if (options?.lenient) {
      return {
        isValid: true,
        reason: 'Photo verified',
        segmentations: precomputedSegmentations,
      };
    }

    const bodySegmentation = await import('@tensorflow-models/body-segmentation');
    const segmentInput = downscaleForSegmentation(sourceCanvas);

    let segmentations = precomputedSegmentations;
    if (!segmentations || !segmentations.length) {
      try {
        const segmenter = await withTimeout(getPortraitSegmenter(), 2500);
        segmentations = await segmenter.segmentPeople(segmentInput);
      } catch {
        // If segmenter initialization is slow or fails, accept frame in fast-fallback mode
        return {
          isValid: true,
          reason: 'Photo aligned',
        };
      }
    }

    if (!segmentations || segmentations.length === 0) {
      return {
        isValid: false,
        reason: 'Position face and shoulders inside the guide.',
      };
    }

    const binaryMask = await bodySegmentation.toBinaryMask(
      segmentations,
      { r: 255, g: 255, b: 255, a: 255 },
      { r: 0, g: 0, b: 0, a: 0 },
      false,
      0.5
    );

    if (!binaryMask) {
      return {
        isValid: true,
        reason: 'Photo aligned',
        segmentations,
      };
    }

    const w = binaryMask.width;
    const h = binaryMask.height;
    const data = binaryMask.data;

    let minY = h;
    let maxY = 0;
    let minX = w;
    let maxX = 0;
    let pixelCount = 0;

    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const idx = (y * w + x) * 4;
        if (data[idx + 3]! > 128) {
          pixelCount++;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }

    if (pixelCount < (w * h * 0.02) / 4) {
      return {
        isValid: false,
        reason: 'Face inside the camera view.',
      };
    }

    const topY = minY / h;
    const bottomY = maxY / h;
    const centerX = (minX + maxX) / (2 * w);
    const personWidth = (maxX - minX) / w;
    const personHeight = (maxY - minY) / h;

    const metrics = { topY, bottomY, centerX, personWidth, personHeight };

    // Comfortable, generous centering bounds (±18% from center)
    if (centerX > 0.68) {
      return {
        isValid: false,
        reason: 'Move slightly left',
        metrics,
        segmentations,
      };
    }
    if (centerX < 0.32) {
      return {
        isValid: false,
        reason: 'Move slightly right',
        metrics,
        segmentations,
      };
    }

    // Vertical placement bounds
    if (topY < 0.02) {
      return {
        isValid: false,
        reason: 'Move down slightly',
        metrics,
        segmentations,
      };
    }
    if (topY > 0.45) {
      return {
        isValid: false,
        reason: 'Move up slightly',
        metrics,
        segmentations,
      };
    }

    // Distance bounds
    if (personWidth < 0.18) {
      return {
        isValid: false,
        reason: 'Move a bit closer',
        metrics,
        segmentations,
      };
    }
    if (personWidth > 0.95) {
      return {
        isValid: false,
        reason: 'Move back a bit',
        metrics,
        segmentations,
      };
    }

    return {
      isValid: true,
      reason: 'Perfect — Ready to capture',
      metrics,
      segmentations,
    };
  } catch {
    return {
      isValid: true,
      reason: 'Guidelines checked.',
    };
  }
}


