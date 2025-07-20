"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, ArrowLeft } from "lucide-react";

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    setVideos(saved);
  }, []);

  const handleDelete = (index) => {
    const updated = [...videos];
    updated.splice(index, 1);
    localStorage.setItem("savedVideos", JSON.stringify(updated));
    setVideos(updated);
    toast.success("🗑️ Video deleted");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white p-6 flex flex-col items-center">
      <Toaster />
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-lime-400 drop-shadow-[0_0_15px_#00f0ff] text-center">
        🎞️ Saved Recordings
      </h1>

      {videos.length === 0 ? (
        <p className="text-lg text-white opacity-75 mt-10">No videos saved yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {videos.map((url, index) => (
            <div
              key={index}
              className="relative border border-lime-500 rounded-lg p-2 bg-black bg-opacity-40 backdrop-blur-md"
            >
              <video
                src={url}
                controls
                className="w-full rounded-md"
              />
              <button
                onClick={() => handleDelete(index)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:shadow-[0_0_15px_#ef4444] transition"
                aria-label="Delete video"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => router.push("/")}
        className="mt-8 px-6 py-2 bg-lime-400 text-black font-semibold rounded-full hover:shadow-[0_0_25px_#39FF14] transition flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        Back to HomePage
      </button>
    </main>
  );
}






