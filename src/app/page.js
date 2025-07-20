// app/page.js
"use client";
import { useState, useRef, useEffect } from "react";
import { CircleDot } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function Home() {
  const [cameraOpened, setCameraOpened] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
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
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      faceDetection.setOptions({
        model: "short",
        minDetectionConfidence: 0.5,
      });

      faceDetection.onResults((results) => {
        if (!canvasRef.current || !results.image) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = results.image.width;
        canvas.height = results.image.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        const faces = results.detections || [];
        setFaceCount(faces.length);

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
    const stream = videoRef.current.srcObject;
    mediaRecorderRef.current = new MediaRecorder(stream);
    const chunks = [];
    setRecordedChunks([]);

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
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex flex-col justify-center items-center">
        <Toaster />
        <h1 className="text-6xl font-extrabold mb-6 drop-shadow-[0_0_15px_#00f0ff] animate-bounce">
          🎥 Face Tracker
        </h1>
        <p className="mb-4 text-lg text-center max-w-md">
          Welcome to the face tracking app. Open your camera to start recording with real-time face detection.
        </p>
        <button
          onClick={() => setCameraOpened(true)}
          className="px-8 py-3 text-lg bg-black bg-opacity-80 hover:shadow-[0_0_25px_#00f0ff] text-white rounded-full border border-white backdrop-blur-md transition duration-300 animate-pulse"
        >
          🚀 Open Camera
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex flex-col items-center justify-center gap-6 p-6">
      <Toaster position="top-center" />
      <h2 className="text-2xl font-bold text-lime-400">
        Faces Detected: {faceCount}
      </h2>

      <div className="relative w-[720px] h-[480px] rounded border border-lime-400 shadow-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          muted
          autoPlay
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        {isRecording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 text-red-500 font-semibold">
            <CircleDot className="animate-pulse" size={20} />
            Recording...
          </div>
        )}
      </div>

      <div className="flex gap-4">
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




