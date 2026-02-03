import { useEffect, useState } from "react";
import DomeGallery from "../components/gallery/DomeGallery";
import { getallGallery } from "../services/api";

export default function Gallery() {
  const [images, setImages] = useState([]);

  // Use import.meta.env for Vite, with a localhost fallback
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const fetchImages = async () => {
      try {
        const response = await getallGallery();
        console.log("Polling Gallery...", response);

        if (
          isMounted &&
          response.success &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          // 1. SORT by 'order' (Ascending: 0, 1, 2...)
          const sortedData = response.data.sort((a, b) => a.order - b.order);

          // 2. Map Backend Data -> DomeGallery Format
          const formattedImages = sortedData.map((img) => ({
            src:
              img.url.startsWith("http") || img.url.startsWith("blob:")
                ? img.url
                : `${API_BASE_URL}${img.url}`,
            alt: img.title || "Gallery Image",
          }));

          setImages(formattedImages);
          // Stop polling once we have data
        } else if (isMounted) {
          // Retry if empty
          console.warn("Gallery empty or loading... Retrying in 3s");
          timeoutId = setTimeout(fetchImages, 3000);
        }
      } catch (error) {
        console.error("Failed to load gallery images, retrying...", error);
        if (isMounted) {
          timeoutId = setTimeout(fetchImages, 3000);
        }
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="-mt-[90px]"
      style={{
        width: "100vw",
        height: "110vh",
        overflow: "hidden",
      
      }}
    >
      {/* Pass undefined if empty to trigger Skeleton Mode */}
      <DomeGallery images={images.length > 0 ? images : undefined} />
    </div>
  );
}
