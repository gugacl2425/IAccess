// gestureModule.js
import {
    GestureRecognizer,
    FilesetResolver,
    DrawingUtils
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
  
  export default class GestureDetector {
    constructor(videoElement, canvasElement) {
      this.videoEl  = videoElement;
      this.canvasEl = canvasElement;
      this.ctx      = canvasElement.getContext('2d');
      this.runningMode   = 'VIDEO';
      this.lastVideoTime = -1;
      this.handlers      = [];
      this.recognizer    = null;
    }
  
    async init() {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );
      this.recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU'
        },
        runningMode: this.runningMode
      });
    }
  
    startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        return Promise.reject(new Error('getUserMedia no soportado'));
      }
      return navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          this.videoEl.srcObject = stream;
          return new Promise(resolve => {
            this.videoEl.onloadeddata = () => {
              // fija el tamaño del canvas una sola vez
              this.canvasEl.width  = this.videoEl.videoWidth;
              this.canvasEl.height = this.videoEl.videoHeight;
              this._loop();
              resolve();
            };
            this.videoEl.play();
          });
        });
    }
  
    onGesture(fn) {
      // registra un callback que recibe (categoryName, score)
      this.handlers.push(fn);
    }
  
    _emitGesture(cat, score) {
      this.handlers.forEach(fn => fn(cat, score));
    }
  
    _loop() {
      if (!this.recognizer) return;
      // Asegura modo vídeo
      if (this.runningMode !== 'VIDEO') {
        this.runningMode = 'VIDEO';
        this.recognizer.setOptions({ runningMode: 'VIDEO' });
      }
      const now = performance.now();
      if (this.videoEl.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.videoEl.currentTime;
        const res = this.recognizer.recognizeForVideo(this.videoEl, now);
  
        // dibuja
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
        this.ctx.drawImage(this.videoEl, 0, 0,
                           this.canvasEl.width, this.canvasEl.height);
        const dutils = new DrawingUtils(this.ctx);
        if (res.landmarks) {
          for (const lm of res.landmarks) {
            dutils.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS, { lineWidth: 4 });
            dutils.drawLandmarks(lm, { lineWidth: 2 });
          }
        }
        this.ctx.restore();
  
        // emite el gesto con mayor confianza (si lo hay)
        if (res.gestures.length > 0 && res.gestures[0].length > 0) {
          const { categoryName, score } = res.gestures[0][0];
          this._emitGesture(categoryName, score);
        }
      }
      requestAnimationFrame(this._loop.bind(this));
    }
  }
  