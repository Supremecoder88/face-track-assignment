"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export default function VideosPage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    setVideos(saved);
  }, []);

  const handleDelete = (index) => {
    const updated = [...videos];
    updated.splice(index, 1);
    localStorage.setItem("savedVideos", JSON.stringify(updated));
    setVideos(updated);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white p-6">
      <h1 className="text-4xl font-bold text-center mb-10">🎞 Saved Recordings</h1>

      {videos.length === 0 ? (
        <p className="text-center text-gray-300">No recordings found.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((url, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden border border-lime-400 shadow-md">
              <video src={url} controls className="w-full h-[300px] object-cover bg-black" />
              <div className="flex justify-between items-center p-2 bg-black bg-opacity-70">
                <a
                  href={url}
                  download={`recording-${i + 1}.webm`}
                  className="text-lime-400 hover:underline"
                >
                  ⬇️ Download
                </a>
                <button
                  onClick={() => handleDelete(i)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}




