"use client";
import { useState, useRef, useEffect } from "react";
import { CircleDot, Video } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function Home() {
  const [cameraOpened, setCameraOpened] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const combinedCanvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [noFaceToastShown, setNoFaceToastShown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (cameraOpened) {
      loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js").then(() => {
        loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js").then(() => {
          initVideo();
        });
      });
    }
  }, [cameraOpened]);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const faceDetection = new window.FaceDetection({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      faceDetection.setOptions({
        model: "short",
        minDetectionConfidence: 0.5,
      });

      faceDetection.onResults((results) => {
        if (!canvasRef.current || !combinedCanvasRef.current || !results.image) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = results.image.width;
        canvas.height = results.image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        const faces = results.detections || [];
        setFaceCount(faces.length);

        if (faces.length === 0 && !noFaceToastShown) {
          toast("😅 No face detected");
          setNoFaceToastShown(true);
        } else if (faces.length > 0) {
          setNoFaceToastShown(false);
        }

        faces.forEach((detection) => {
          const box = detection.boundingBox;
          ctx.strokeStyle = "#39FF14";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            box.xCenter * canvas.width - (box.width * canvas.width) / 2,
            box.yCenter * canvas.height - (box.height * canvas.height) / 2,
            box.width * canvas.width,
            box.height * canvas.height
          );
        });

        const combinedCanvas = combinedCanvasRef.current;
        const combinedCtx = combinedCanvas.getContext("2d");
        combinedCanvas.width = canvas.width;
        combinedCanvas.height = canvas.height;
        combinedCtx.clearRect(0, 0, combinedCanvas.width, combinedCanvas.height);
        combinedCtx.drawImage(videoRef.current, 0, 0, combinedCanvas.width, combinedCanvas.height);
        combinedCtx.drawImage(canvas, 0, 0, combinedCanvas.width, combinedCanvas.height);
      });

      const detect = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          requestAnimationFrame(detect);
          return;
        }

        await faceDetection.send({ image: videoRef.current });
        requestAnimationFrame(detect);
      };

      detect();
    } catch (err) {
      console.error("Error initializing video:", err);
      alert("Webcam access failed or is not supported.");
    }
  };

  const startRecording = () => {
    const stream = combinedCanvasRef.current.captureStream(30);
    mediaRecorderRef.current = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const saved = JSON.parse(localStorage.getItem("savedVideos") || "[]");
      saved.push(url);
      localStorage.setItem("savedVideos", JSON.stringify(saved));
      toast.success("🎥 Video saved!");
      router.push("/videos");
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    toast("🔴 Recording started", { icon: "📹" });
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  if (!cameraOpened) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex flex-col justify-center items-center px-4">
        <Toaster />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-[0_0_15px_#00f0ff] animate-bounce text-center">
          🎥 Face Tracker
        </h1>
        <p className="mb-4 text-base sm:text-lg text-center max-w-md">
          Welcome to the face tracking app. Open your camera to start recording with real-time face detection.
        </p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={() => setCameraOpened(true)}
            className="px-6 py-3 text-base sm:text-lg bg-black bg-opacity-80 hover:shadow-[0_0_25px_#00f0ff] text-white rounded-full border border-white backdrop-blur-md transition duration-300 animate-pulse"
          >
            🚀 Open Camera
          </button>
          <button
            onClick={() => router.push("/videos")}
            className="px-6 py-3 text-base sm:text-lg bg-lime-500 text-black hover:shadow-[0_0_25px_#00ff88] rounded-full border border-white transition duration-300 flex items-center gap-2"
          >
            <Video size={20} /> View Saved Videos
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex flex-col items-center justify-center gap-6 px-4 py-6">
      <Toaster position="top-center" />
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-lime-400">
        Faces Detected: {faceCount}
      </h2>

      <div className="relative w-full max-w-3xl aspect-video rounded border border-lime-400 shadow-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          autoPlay
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        <canvas
          ref={combinedCanvasRef}
          className="hidden"
        />
        {isRecording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 text-red-500 font-semibold">
            <CircleDot className="animate-pulse" size={20} />
            Recording... {recordingTime}s
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-6 py-2 bg-green-600 text-white rounded hover:shadow-[0_0_15px_#22c55e] transition"
          >
            🎬 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-2 bg-red-600 text-white rounded hover:shadow-[0_0_15px_#ef4444] transition"
          >
            ⏹ Stop Recording
          </button>
        )}
      </div>
    </main>
  );
}

