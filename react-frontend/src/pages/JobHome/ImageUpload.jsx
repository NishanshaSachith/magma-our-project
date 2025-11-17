import React, { useState, useRef, useContext, useEffect, useCallback } from "react";
import { FaCheckCircle, FaTimesCircle, FaRedo, FaTrash, FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { UploadIcon, XIcon } from "lucide-react";
import axios from "axios";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import LoadingItems from "../../components/Loading/LoadingItems";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import Notification from "../../components/Notification/Notification";

const ImageUpload = ({ jobHomeId }) => {
  const { isDarkMode } = useContext(ThemeContext);

  // === State for the UI and Modals ===
  const [showPopup, setShowPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [albumIdToDelete, setAlbumIdToDelete] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  // === API Service & Helpers ===
  const API_BASE_URL = 'http://127.0.0.1:8000/api';
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification({ message: '', type: 'success' });
  }, []);

  const groupImagesByBatch = (images) => {
    if (!images) return [];
    const albumsMap = images.reduce((acc, image) => {
      const albumKey = image.description || "No Description";
      if (!acc[albumKey]) {
        acc[albumKey] = {
          id: albumKey,
          description: image.description,
          images: [],
          created_at: image.created_at,
        };
      }
      acc[albumKey].images.push(image);
      return acc;
    }, {});
    return Object.values(albumsMap).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  // === Custom Hook for Image Gallery Logic ===
  const useImageGallery = (id) => {
    const [uploadedAlbums, setUploadedAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchImages = useCallback(async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/job-homes/${id}/images`, { headers: getAuthHeaders() });
        const albums = groupImagesByBatch(response.data.images);
        setUploadedAlbums(albums);
      } catch (err) {
        console.error("Failed to fetch images:", err);
        setError("Failed to load images. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }, [id, getAuthHeaders]);

    const deleteImage = useCallback(async (albumId, imageId) => {
      const prevAlbums = uploadedAlbums;
      try {
        // Optimistic UI update: remove the image immediately
        setUploadedAlbums(prev => prev
          .map(album => album.id === albumId ? { ...album, images: album.images.filter(img => img.id !== imageId) } : album)
          .filter(album => album.images.length > 0)
        );
        
        await axios.delete(`${API_BASE_URL}/job-homes/${id}/images/${imageId}`, { headers: getAuthHeaders() });
        showNotification("Image deleted successfully!", "success");
      } catch (err) {
        console.error("Failed to delete image:", err);
        // Rollback the state if the API call fails
        setUploadedAlbums(prevAlbums);
        showNotification("Failed to delete image. Please try again.", "error");
      }
    }, [id, uploadedAlbums, getAuthHeaders, showNotification]);

    useEffect(() => {
      fetchImages();
    }, [fetchImages]);

    return { uploadedAlbums, loading, error, deleteImage, fetchImages };
  };

  // === Custom Hook for Image Upload Logic ===
  const useImageUploader = (id, onUploadSuccess) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState(false);
    const [description, setDescription] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const MAX_FILE_SIZE = 25 * 1024 * 1024;

    const validateFile = useCallback((file) => {
      const errors = [];
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: Not a valid image file`);
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size exceeds 25MB limit`);
      }
      return errors;
    }, []);

    const processFiles = useCallback((selectedFiles) => {
      const validFiles = [];
      const errors = [];
      selectedFiles.forEach(file => {
        const fileErrors = validateFile(file);
        if (fileErrors.length === 0) {
          validFiles.push({ file, id: `${file.name}-${file.lastModified}-${Date.now()}`, name: file.name, preview: URL.createObjectURL(file), progress: 0, error: false, uploaded: false });
        } else {
          errors.push(...fileErrors);
        }
      });
      if (errors.length > 0) alert("Some files were rejected:\n" + errors.join("\n"));
      if (validFiles.length > 0) setFiles(prev => [...prev, ...validFiles.filter(f => !prev.some(p => p.name === f.name))]);
    }, [validateFile]);

    const handleUpload = useCallback(async () => {
      if (files.length === 0 || uploading) return;
      setUploading(true); setUploadError(false); setUploadProgress(0);

      const formData = new FormData();
      formData.append("description", description || "No description provided");
      files.forEach((file, index) => formData.append(`images[${index}]`, file.file));

      try {
        const response = await axios.post(`${API_BASE_URL}/job-homes/${id}/images`, formData, {
          headers: { "Content-Type": "multipart/form-data", ...getAuthHeaders() },
          onUploadProgress: (progressEvent) => setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total)),
        });

        setFiles(prev => prev.map(file => ({ ...file, uploaded: true, progress: 100 })));
        showNotification("Images uploaded successfully!", "success");
        onUploadSuccess(response.data.images);
        
        setTimeout(() => { setFiles([]); setDescription(""); setUploading(false); setShowPopup(false); }, 1500);
      } catch (err) {
        console.error("Upload failed:", err.response?.data || err.message);
        setUploading(false); setUploadError(true); setUploadProgress(0);
        setFiles(prev => prev.map(file => ({ ...file, error: true, progress: 0 })));
        showNotification(err.response?.data?.message || "File upload failed. Please try again.", "error");
      }
    }, [files, uploading, description, id, getAuthHeaders, showNotification, onUploadSuccess]);

    const removeFile = useCallback((idToRemove) => {
      setFiles(prev => prev.filter(file => file.id !== idToRemove));
    }, []);

    const retryFileUpload = useCallback(() => {
      setFiles(prev => prev.map(file => (file.error ? { ...file, error: false, progress: 0 } : file)));
      setUploadError(false);
      handleUpload();
    }, [handleUpload]);

    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return { files, setFiles, uploading, uploadProgress, uploadError, description, setDescription, fileInputRef, isDragging, setIsDragging, processFiles, handleUpload, removeFile, retryFileUpload, formatFileSize };
  };

  // === Connect the hooks and UI logic ===
  const { uploadedAlbums, loading, error, deleteImage, fetchImages } = useImageGallery(jobHomeId);
  const {
    files, uploading, uploadProgress, uploadError, description, setDescription,
    fileInputRef, isDragging, setIsDragging, processFiles, handleUpload, removeFile, retryFileUpload, formatFileSize
  } = useImageUploader(jobHomeId, (newImages) => {
    // Callback to refresh the gallery after a successful upload
    fetchImages();
  });

  const totalImageCount = uploadedAlbums.reduce((acc, album) => acc + album.images.length, 0);

  const openDeleteModal = (e, albumId, imageId) => {
    e.stopPropagation();
    setImageToDelete(imageId);
    setAlbumIdToDelete(albumId);
    setShowDeleteModal(true);
  };

  const confirmedDelete = () => {
    if (imageToDelete && albumIdToDelete) {
      deleteImage(albumIdToDelete, imageToDelete);
      const currentAlbum = uploadedAlbums.find(a => a.id === albumIdToDelete);
      if (currentAlbum && currentAlbum.images.length === 1) {
        closeImageViewer();
      }
    }
    setShowDeleteModal(false);
  };

  const openImageViewer = (albumIndex, imageIndex = 0) => {
    setSelectedAlbumIndex(albumIndex);
    setSelectedImageIndex(imageIndex);
  };

  const closeImageViewer = () => {
    setSelectedAlbumIndex(null);
    setSelectedImageIndex(null);
  };

  const goToPrev = (e) => {
    e.stopPropagation(); // Prevent modal from closing
    const currentAlbum = uploadedAlbums[selectedAlbumIndex];
    if (!currentAlbum) return;
    setSelectedImageIndex(prevIndex => (prevIndex === 0 ? currentAlbum.images.length - 1 : prevIndex - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation(); // Prevent modal from closing
    const currentAlbum = uploadedAlbums[selectedAlbumIndex];
    if (!currentAlbum) return;
    setSelectedImageIndex(prevIndex => (prevIndex === currentAlbum.images.length - 1 ? 0 : prevIndex + 1));
  };

  if (loading) {
    return <div className={`min-h-[60vh] flex items-center justify-center ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}><LoadingItems isDarkMode={isDarkMode} /></div>;
  }

  // Determine the current image for the viewer
  const currentImage = selectedAlbumIndex !== null && selectedImageIndex !== null
    ? uploadedAlbums[selectedAlbumIndex]?.images[selectedImageIndex]
    : null;
  const currentAlbum = selectedAlbumIndex !== null
    ? uploadedAlbums[selectedAlbumIndex]
    : null;

  return (
    <>
      <Notification message={notification.message} type={notification.type} onClose={clearNotification} />
      <ConfirmationModal show={showDeleteModal} isDarkMode={isDarkMode} title="Confirm Deletion" message="Are you sure you want to permanently delete this image? This action cannot be undone." onConfirm={confirmedDelete} onCancel={() => setShowDeleteModal(false)} confirmLabel="Delete" />

      <div className={`${uploadedAlbums.length === 0 ? "min-h-[60vh]" : "min-h-screen"} p-6 transition-colors ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Image Gallery</h1>
            <p className="text-gray-500 mt-1">{totalImageCount} image{totalImageCount !== 1 ? "s" : ""} uploaded</p>
          </div>
          <button onClick={() => setShowPopup(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md transition">
            <UploadIcon size={20} /> Upload Images
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}<button onClick={fetchImages} className="ml-2 underline hover:no-underline">Refresh</button></div>}

        <LayoutGroup>
          {uploadedAlbums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 mb-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><UploadIcon size={32} className="text-gray-400" /></div>
              <h3 className="text-xl font-semibold mb-2">No images uploaded yet</h3>
              <p className="text-gray-500 mb-6">Get started by uploading your first images</p>
              <button onClick={() => setShowPopup(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition">Upload Images</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {uploadedAlbums.map((album, albumIndex) => (
                <motion.div key={album.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="relative w-full aspect-square">
                    <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
                      {album.images.slice(0, 4).map((image, imageIndex) => (
                        <div key={image.id} className={`relative group ${album.images.length === 1 && imageIndex === 0 ? "col-span-2 row-span-2" : ""}`}>
                          <img src={`${API_BASE_URL.replace("/api", "")}${image.image_path}`} alt={image.original_name} className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105" onClick={() => openImageViewer(albumIndex, imageIndex)} onError={(e) => { e.target.src = "data:image/svg+xml;base64,..."; }} />
                          <button onClick={(e) => openDeleteModal(e, album.id, image.id)} className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" title="Delete image"> <FaTrash size={12} /> </button>
                        </div>
                      ))}
                      {album.images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white/90 cursor-pointer" onClick={() => openImageViewer(albumIndex, 0)}>
                          <span className="text-2xl font-bold">+{album.images.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate mb-1" title={album.description}>{album.description || "No description"}</h3>
                    <p className="text-sm text-gray-400 mb-2">{new Date(album.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-400 mb-2">{new Date(album.created_at).toLocaleTimeString()}</p>
                    <button onClick={() => openImageViewer(albumIndex, 0)} className="text-blue-600 hover:underline">View Album</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </LayoutGroup>

        {/* Upload Popup */}
        <AnimatePresence>
          {showPopup && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !uploading && setShowPopup(false)}>
              <motion.div className={`rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Upload Images</h2>
                  {!uploading && <button onClick={() => setShowPopup(false)} className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition" aria-label="Close upload dialog"><XIcon size={20} /></button>}
                </div>
                <div className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-all cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-500"}`} onClick={() => !uploading && fileInputRef.current?.click()} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)); }}>
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={e => processFiles(Array.from(e.target.files))} disabled={uploading} />
                  <UploadIcon size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-2">Drag & drop images or <span className="text-blue-600 font-semibold">browse</span></p>
                  <p className="text-sm text-gray-400">Maximum file size: {formatFileSize(25 * 1024 * 1024)} per image</p>
                </div>
                {files.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Selected Files ({files.length})</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {files.map(file => (
                        <div key={file.id} className={`flex items-center p-3 rounded-lg transition ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                          <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500 mb-1">{formatFileSize(file.file.size)}</p>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-full h-2 mr-2">
                                <div className={`h-2 rounded-full transition-all duration-300 ${file.error ? "bg-red-500" : file.uploaded ? "bg-green-500" : "bg-blue-600"}`} style={{ width: `${file.progress}%` }}></div>
                              </div>
                              <span className="text-xs text-gray-500">{file.progress}%</span>
                            </div>
                          </div>
                          <div className="flex items-center ml-2">
                            {file.error ? <button onClick={retryFileUpload} className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded" title="Retry upload"><FaRedo size={16} /></button> : file.uploaded ? <FaCheckCircle className="text-green-600 ml-1" size={16} /> : !uploading && <button onClick={() => removeFile(file.id)} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded ml-1" title="Remove file"><FaTimesCircle size={16} /></button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea placeholder="Add a description for these images..." className={`w-full p-3 border rounded-lg resize-none transition ${isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`} rows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={uploading} maxLength={1000} />
                  <p className="text-xs text-gray-400 mt-1">{description.length}/1000 characters</p>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setShowPopup(false); setFiles([]); setDescription(""); }} disabled={uploading} className={`px-6 py-2.5 rounded-lg transition ${uploading ? "bg-red-500 text-white cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}>Cancel</button>
                  <button onClick={handleUpload} disabled={!files.length || uploading} className={`px-6 py-2.5 rounded-lg shadow transition ${!files.length || uploading ? "bg-blue-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white`}>
                    {uploading ? `Uploading... ${uploadProgress}%` : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Viewer Modal */}
        <AnimatePresence>
          {selectedAlbumIndex !== null && selectedImageIndex !== null && (
            <motion.div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeImageViewer}>
              {currentImage && currentAlbum && (
                <>
                  {/* Left navigation button outside the image frame */}
                  {currentAlbum.images.length > 1 && (
                    <button onClick={goToPrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-green-600 text-white shadow-lg transition-colors hover:bg-green-700" aria-label="Previous image">
                      <FaChevronLeft size={20} />
                    </button>
                  )}
                  <motion.div 
                    key={`${selectedAlbumIndex}-${selectedImageIndex}`} 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.8, opacity: 0 }} 
                    transition={{ duration: 0.3 }} 
                    className="relative mx-16" 
                    onClick={e => e.stopPropagation()}
                  >
                    <img src={`${API_BASE_URL.replace("/api", "")}${currentImage.image_path}`} alt={currentImage.original_name} className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" />
                    {currentAlbum.description && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-black/50 text-white rounded-b-xl">
                        <h3 className="text-xl sm:text-2xl font-bold mb-1">{currentAlbum.description}</h3>
                        <p className="text-sm sm:text-base">{`${selectedImageIndex + 1} of ${currentAlbum.images.length} images`}</p>
                      </motion.div>
                    )}
                    {/* Updated Close button style */}
                    <button onClick={closeImageViewer} className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white backdrop-blur-md transition" aria-label="Close">
                      <XIcon size={24} />
                    </button>
                    {/* Delete button within the viewer */}
                    <button onClick={(e) => openDeleteModal(e, currentAlbum.id, currentImage.id)} className="absolute top-2 right-14 sm:top-4 sm:right-16 p-2 rounded-full bg-red-600 text-white backdrop-blur-md hover:bg-red-700 transition" aria-label="Delete image">
                      <FaTrash size={20} />
                    </button>
                  </motion.div>
                  {/* Right navigation button outside the image frame */}
                  {currentAlbum.images.length > 1 && (
                    <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-green-600 text-white shadow-lg transition-colors hover:bg-green-700" aria-label="Next image">
                      <FaChevronRight size={20} />
                    </button>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ImageUpload;