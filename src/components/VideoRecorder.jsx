"use client";
import { useEffect, useRef, useState } from "react";
import { CircleDot, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function VideoRecorder() {
  const [cameraOpened, setCameraOpened] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videos, setVideos] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    setVideos(saved);
  }, []);

  useEffect(() => {
    if (cameraOpened) {
      const loadScripts = async () => {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await initVideo();
      };

      loadScripts();
    }
  }, [cameraOpened]);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;

    videoRef.current.onloadeddata = () => {
      videoRef.current.play();
      setupFaceDetection();
    };
  };

  const setupFaceDetection = () => {
    const faceDetection = new window.FaceDetection({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({
      model: "short",
      minDetectionConfidence: 0.5,
    });

    faceDetection.onResults((results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.detections) {
        setFaceCount(results.detections.length);
        results.detections.forEach((detection) => {
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
      }
    });

    const detect = async () => {
      if (videoRef.current.videoWidth === 0) return;
      await faceDetection.send({ image: videoRef.current });
      requestAnimationFrame(detect);
    };

    detect();
  };

  const startRecording = () => {
    const stream = videoRef.current.srcObject;
    mediaRecorderRef.current = new MediaRecorder(stream);
    setRecordedChunks([]);

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const storedVideos = JSON.parse(localStorage.getItem("savedVideos") || "[]");
      storedVideos.push(url);
      localStorage.setItem("savedVideos", JSON.stringify(storedVideos));
      toast.success("🎉 Video saved!");
      router.push("/videos");
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    toast("🔴 Recording started", { icon: "🎬" });
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const deleteVideo = (url) => {
    const updated = videos.filter((v) => v !== url);
    localStorage.setItem("savedVideos", JSON.stringify(updated));
    setVideos(updated);
    toast.success("🗑️ Video deleted");
  };

  if (!cameraOpened) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex flex-col justify-center items-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-center gap-6 p-6">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold text-lime-400">🎯 Faces Detected: {faceCount}</h1>

      <div className="relative w-[500px] shadow-xl rounded-lg overflow-hidden border border-lime-500">
        <video
          ref={videoRef}
          className="rounded w-full h-auto"
          muted
          autoPlay
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          width={500}
          height={375}
        />
        {isRecording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 text-red-500 font-semibold">
            <CircleDot className="animate-pulse" size={20} /> Recording
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-6 py-2 bg-green-600 hover:shadow-[0_0_15px_#22c55e] hover:scale-105 transition-transform text-white rounded-md shadow duration-300"
          >
            🎬 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-2 bg-red-600 hover:shadow-[0_0_15px_#ef4444] hover:scale-105 transition-transform text-white rounded-md shadow duration-300"
          >
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {videos.length > 0 && (
        <div className="mt-6 w-full max-w-3xl">
          <h2 className="text-xl mb-4 font-semibold">🧾 Your Saved Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((url, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-md shadow-md relative">
                <video src={url} controls className="w-full rounded mb-2"></video>
                <div className="flex justify-between items-center">
                  <a
                    href={url}
                    download={`recording-${index + 1}.webm`}
                    className="text-lime-400 hover:underline"
                  >
                    ⬇️ Download
                  </a>
                  <button
                    onClick={() => deleteVideo(url)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}








