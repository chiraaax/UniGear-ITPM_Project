import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";
const ITEMS_PER_PAGE = 6;

const RentalPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Electronics",
    dailyRate: "",
  });

  const [bookingData, setBookingData] = useState({});
  const [isBooking, setIsBooking] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // NEW STATES
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // CALENDAR AVAILABILITY STATE
  const [availability, setAvailability] = useState({});
  const [selectedCalendarItem, setSelectedCalendarItem] = useState(null);

  // IMAGE UPLOAD STATES
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Helper function to format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  // Helper function to get today's date with time reset
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const fetchAvailability = useCallback(async (itemId) => {
    try {
      const res = await fetch(
        `${API_BASE}/rentals/items/${itemId}/availability`,
      );
      const data = await res.json();

      setAvailability((prev) => ({
        ...prev,
        [itemId]: data,
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/rentals/items`);
      const data = await res.json();
      setItems(data);

      // fetch availability for each item
      data.forEach((item) => {
        fetchAvailability(item._id);
      });
    } catch (err) {
      console.error(err);
    }
  }, [fetchAvailability]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]); // fetchItems dependency explicitly included

  // Filter and search items
  useEffect(() => {
    let filtered = [...items];

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredItems(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [items, categoryFilter, searchTerm]);

  // CHECK IF DATE IS BOOKED (timezone fix)
  const isDateBooked = (itemId, date) => {
    const bookings = availability[itemId] || [];

    return bookings.some((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);

      const check = date.toISOString().split("T")[0];
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      return check >= startStr && check <= endStr;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // RESET FORM FUNCTION
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      category: "Electronics",
      dailyRate: "",
    });
    setImages([]);
    setPreviewUrls([]);
    setExistingImages([]);
    setEditingItem(null);
  };

  // HANDLE ADD NEW ITEM
  const handleAddNewItem = () => {
    resetForm(); // Reset everything before opening
    setShowModal(true);
  };

  // HANDLE CLOSE MODAL
  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  // ENHANCED IMAGE HANDLERS WITH DRAG & DROP
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length + images.length > 3) {
      alert("Maximum 3 images allowed");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(newPreviews);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 3) {
      alert("Maximum 3 images allowed");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    const previews = newImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const removeImage = (index, isExisting = false) => {
    if (isExisting) {
      const updated = existingImages.filter((_, i) => i !== index);
      setExistingImages(updated);
    } else {
      const newImages = images.filter((_, i) => i !== index);
      const newPreviews = previewUrls.filter((_, i) => i !== index);

      setImages(newImages);
      setPreviewUrls(newPreviews);

      // Clean up object URLs to prevent memory leaks
      URL.revokeObjectURL(previewUrls[index]);
    }
  };

  // S3 UPLOAD FUNCTION
  const uploadImagesToS3 = async () => {
    const uploadedUrls = [];

    for (let file of images) {
      const res = await fetch(`${API_BASE}/upload/generate-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      const { signedUrl, publicUrl } = await res.json();

      await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  // UPDATED EDIT HANDLER - loads existing images
  const handleEdit = (item) => {
    setEditingItem(item._id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      dailyRate: item.dailyRate,
    });
    setExistingImages(item.photos || []);
    setImages([]);
    setPreviewUrls([]);
    setShowModal(true);
  };

  // DELETE HANDLER
  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE}/rentals/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Item deleted successfully ✅");
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingChange = (itemId, field, value) => {
    setBookingData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // UPDATED HANDLE BOOKING WITH DATE VALIDATION
  const handleBooking = async (itemId) => {
    if (!token) {
      alert("Please login first");
      navigate("/auth");
      return;
    }

    const data = bookingData[itemId];

    if (!data?.startDate || !data?.endDate) {
      alert("Please select dates");
      return;
    }

    // Validate dates
    const today = getTodayDate();
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate < today) {
      alert(
        "Cannot book dates in the past. Please select a start date from today onwards.",
      );
      return;
    }

    if (endDate < startDate) {
      alert("End date must be after start date");
      return;
    }

    setIsBooking(itemId);

    try {
      const res = await fetch(`${API_BASE}/rentals/items/${itemId}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message);
        setIsBooking(null);
        return;
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setBookingData((prev) => ({
        ...prev,
        [itemId]: { startDate: "", endDate: "" },
      }));
      setIsBooking(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setIsBooking(null);
    }
  };

  // UPDATED SUBMIT HANDLER - merges existing and new images
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Please sign in to create a rental listing.");
      navigate("/auth");
      return;
    }

    try {
      // UPLOAD NEW IMAGES TO S3
      let uploadedUrls = [];

      if (images.length > 0) {
        uploadedUrls = await uploadImagesToS3();
      }

      // MERGE EXISTING + NEW IMAGES
      const finalPhotos = [...existingImages, ...uploadedUrls];

      const url = editingItem
        ? `${API_BASE}/rentals/items/${editingItem}`
        : `${API_BASE}/rentals/items`;

      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          dailyRate: Number(form.dailyRate),
          photos: finalPhotos,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to create item");
        return;
      }

      // Reset form and close modal
      resetForm();
      setShowModal(false);
      fetchItems();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // UPDATED CALCULATE DAYS FUNCTION
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If same day, return 1 day
    return diffDays === 0 ? 1 : diffDays;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Electronics":
        return "⚡";
      case "Lab Gear":
        return "🔬";
      case "Sports":
        return "⚽";
      default:
        return "📦";
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        resetForm();
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <div className="rental-page-container">
      {showSuccess && (
        <div className="success-toast">
          {editingItem
            ? "✓ Item updated successfully!"
            : "✓ Booking successful!"}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
            UniGear Rental System
          </h1>
          <p className="page-description">
            Browse and rent gear from fellow students
          </p>
        </div>
        <button className="add-item-btn" onClick={handleAddNewItem}>
          <span className="btn-icon">➕</span>
          Add New Item
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search items by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Lab Gear">Lab Gear</option>
            <option value="Sports">Sports</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      <div className="items-grid">
        {currentItems.map((item) => {
          const bookingInfo = bookingData[item._id];
          const days = calculateDays(
            bookingInfo?.startDate,
            bookingInfo?.endDate,
          );
          const totalPrice = days ? days * item.dailyRate : null;
          const isOwner =
            token && item.owner && user && item.owner._id === user._id;

          return (
            <div key={item._id} className="item-card">
              <div className="card-badge">{item.category}</div>
              <div className="card-header">
                <div className="item-title-section">
                  <span className="item-icon">
                    {getCategoryIcon(item.category)}
                  </span>
                  <h3>{item.title}</h3>
                </div>
              </div>

              {item.description && (
                <p className="item-description">{item.description}</p>
              )}

              {/* 🔥 DYNAMIC IMAGE DISPLAY - SINGLE VS MULTIPLE */}
              {item.photos && item.photos.length > 0 && (
                <>
                  {item.photos.length === 1 ? (
                    // Single image - centered larger thumbnail
                    <div className="single-image-container">
                      <img
                        src={item.photos[0]}
                        alt={item.title}
                        className="single-item-image"
                        onClick={() => window.open(item.photos[0], "_blank")}
                      />
                    </div>
                  ) : (
                    // Multiple images - grid layout
                    <div className="thumbnail-gallery">
                      {item.photos.slice(0, 3).map((img, i) => (
                        <div key={i} className="thumbnail-item">
                          <img
                            src={img}
                            alt={`${item.title} ${i + 1}`}
                            className="thumbnail-image"
                            onClick={() => window.open(img, "_blank")}
                          />
                        </div>
                      ))}
                      {item.photos.length > 3 && (
                        <div className="thumbnail-more">
                          +{item.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="price-section">
                <div className="daily-rate">
                  <span className="currency">LKR</span>
                  <span className="rate">{item.dailyRate}</span>
                  <span className="period">/day</span>
                </div>
              </div>

              {item.owner && (
                <div className="owner-section">
                  <div className="owner-avatar">
                    {item.owner.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="owner-details">
                    <span className="owner-name">{item.owner.name}</span>
                    <div className="trust-score">
                      <span>⭐</span>
                      <span>Trust {item.owner.trustScore?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar Toggle */}
              <div className="calendar-section">
                <button
                  className="calendar-toggle"
                  onClick={() =>
                    setSelectedCalendarItem(
                      selectedCalendarItem?._id === item._id ? null : item,
                    )
                  }
                >
                  📅 {selectedCalendarItem?._id === item._id ? "Hide" : "View"}{" "}
                  Availability
                </button>
              </div>

              {/* UPDATED CALENDAR WITH TODAY DATE FIX */}
              {selectedCalendarItem?._id === item._id && (
                <div className="calendar-popup">
                  <Calendar
                    tileDisabled={({ date }) =>
                      isDateBooked(selectedCalendarItem._id, date)
                    }
                    tileClassName={({ date }) =>
                      isDateBooked(selectedCalendarItem._id, date)
                        ? "booked-date"
                        : null
                    }
                    minDate={getTodayDate()}
                    defaultActiveStartDate={getTodayDate()}
                  />
                  <p className="calendar-legend">🔴 Booked dates</p>
                </div>
              )}

              {/* Owner Controls */}
              {isOwner && (
                <div className="owner-controls">
                  <button
                    onClick={() => handleEdit(item)}
                    className="edit-button"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="delete-button"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}

              {/* Booking Section */}
              {!isOwner && (
                <div className="booking-section">
                  <div className="date-inputs">
                    <input
                      type="date"
                      className="date-input"
                      value={formatDateForInput(bookingInfo?.startDate)}
                      onChange={(e) =>
                        handleBookingChange(
                          item._id,
                          "startDate",
                          e.target.value,
                        )
                      }
                    />
                    <span className="arrow">→</span>
                    <input
                      type="date"
                      className="date-input"
                      value={formatDateForInput(bookingInfo?.endDate)}
                      onChange={(e) =>
                        handleBookingChange(item._id, "endDate", e.target.value)
                      }
                    />
                  </div>

                  {days && totalPrice && (
                    <div className="price-summary">
                      <span>
                        📆 {days} day{days !== 1 ? "s" : ""}
                      </span>
                      <span className="total">💰 LKR {totalPrice}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleBooking(item._id)}
                    className={`book-button ${isBooking === item._id ? "booking" : ""}`}
                    disabled={isBooking === item._id}
                  >
                    {isBooking === item._id ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      "📖 Book Now"
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No items found</p>
          <p className="empty-subtitle">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ← Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`page-number ${currentPage === page ? "active" : ""}`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next →
          </button>
        </div>
      )}

      {/* Modal for Add/Edit Item */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" ref={modalRef}>
            <div className="modal-header">
              <h2>{editingItem ? "Edit Item" : "Add New Item"}</h2>
              <button className="close-modal" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Lab Gear">Lab Gear</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Daily Rate (LKR)
                <input
                  type="number"
                  min="0"
                  name="dailyRate"
                  value={form.dailyRate}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* Drag & Drop Image Upload */}
              <div className="image-upload-section">
                <label>Upload Images (Max 3)</label>
                <div
                  className={`drag-drop-area ${isDragging ? "dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="drag-drop-content">
                    <span className="upload-icon">📸</span>
                    <p>Drag & drop images here or click to select</p>
                    <span className="upload-hint">
                      Supports: JPG, PNG, GIF (Max 5MB each)
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                  />
                </div>

                {existingImages.length > 0 && (
                  <div className="image-preview-grid">
                    <label>Existing Images</label>
                    <div className="preview-container">
                      {existingImages.map((url, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={url} alt={`Existing ${index + 1}`} />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage(index, true)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewUrls.length > 0 && (
                  <div className="image-preview-grid">
                    <label>New Images</label>
                    <div className="preview-container">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={url} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage(index, false)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="card-hint">Click to view details & ratings →</p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingItem ? "Update Item" : "Publish Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .rental-page-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          min-height: 100vh;
        }

        .success-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          padding: 12px 20px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 500;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: semibold;
          background: linear-gradient(135deg, #fff, #a5f3fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-description {
          color: #94a3b8;
          margin-top: 0.5rem;
        }

        .add-item-btn {
          background: linear-gradient(135deg, #4f46e5, #3b82f6);
          color: white;
          border: none;
          padding: 0.55rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
        }

        .add-item-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
        }

        .search-filter-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 1.2rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #4f46e5;
          background: rgba(15, 23, 42, 0.95);
        }

        .filter-box {
          min-width: 200px;
        }

        .filter-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .item-card {
          background: radial-gradient(circle at top left, rgba(30, 64, 175, 0.3), rgba(15, 23, 42, 0.98));
          border-radius: 1rem;
          padding: 1.25rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
          transition: all 0.3s ease;
          position: relative;
          backdrop-filter: blur(10px);
        }

        .item-card:hover {
          transform: translateY(-4px);
          border-color: rgba(96, 165, 250, 0.6);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .card-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(34, 197, 94, 0.2));
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.7rem;
          color: #bfdbfe;
          border: 1px solid rgba(96, 165, 250, 0.3);
        }

        .card-header {
          margin-bottom: 1rem;
          padding-right: 4rem;
        }

        .item-title-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .item-icon {
          font-size: 1.5rem;
        }

        .item-card h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #f9fafb;
        }

        .item-description {
          font-size: 0.85rem;
          color: #cbd5f5;
          margin-bottom: 1rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* 🔥 SINGLE IMAGE STYLES */
        .single-image-container {
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .single-item-image {
          width: 100%;
          max-height: 280px;
          object-fit: cover;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: transform 0.3s ease;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .single-item-image:hover {
          transform: scale(1.02);
        }

        /* MULTIPLE IMAGES GRID */
        .thumbnail-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .thumbnail-item {
          position: relative;
          border-radius: 0.5rem;
          overflow: hidden;
          cursor: pointer;
          aspect-ratio: 1;
          background: rgba(0, 0, 0, 0.2);
        }

        .thumbnail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .thumbnail-item:hover .thumbnail-image {
          transform: scale(1.1);
        }

        .thumbnail-more {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          font-size: 0.8rem;
          font-weight: bold;
          border-radius: 0.5rem;
          aspect-ratio: 1;
        }

        .price-section {
          margin-bottom: 1rem;
          padding: 0.5rem 0;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .daily-rate {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .currency {
          font-size: 0.85rem;
          color: #9ca3af;
        }

        .rate {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #bfdbfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .period {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .owner-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 0.75rem;
        }

        .owner-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #4f46e5, #22c55e);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          color: white;
        }

        .owner-details {
          flex: 1;
        }

        .owner-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: #e5e7eb;
          display: block;
        }

        .trust-score {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          color: #fbbf24;
        }

        .calendar-section {
          margin-bottom: 1rem;
        }

        .calendar-toggle {
          width: 100%;
          padding: 0.5rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(96, 165, 250, 0.4);
          background: rgba(79, 70, 229, 0.2);
          color: #e5e7eb;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .calendar-toggle:hover {
          background: rgba(79, 70, 229, 0.3);
        }

        .calendar-popup {
          margin-bottom: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 0.75rem;
        }

        .calendar-popup .react-calendar {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 0.75rem;
          width: 100%;
          font-family: inherit;
        }

        .calendar-popup .react-calendar__navigation {
          background: rgba(30, 41, 59, 0.8);
          border-radius: 0.75rem 0.75rem 0 0;
          padding: 0.5rem;
        }

        .calendar-popup .react-calendar__navigation button {
          color: #e5e7eb;
          background: transparent;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .calendar-popup .react-calendar__navigation button:enabled:hover,
        .calendar-popup .react-calendar__navigation button:enabled:focus {
          background-color: rgba(79, 70, 229, 0.3);
          border-radius: 0.5rem;
        }

        .calendar-popup .react-calendar__navigation button[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .calendar-popup .react-calendar__month-view__weekdays {
          color: #9ca3af;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.7rem;
          padding: 0.5rem 0;
        }

        .calendar-popup .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }

        .calendar-popup .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
          cursor: default;
        }

        .calendar-popup .react-calendar__month-view__days__day {
          color: #e5e7eb;
          padding: 0.75rem 0;
          font-weight: normal;
          transition: all 0.2s ease;
        }

        .calendar-popup .react-calendar__month-view__days__day--weekend {
          color: #fbbf24;
        }

        .calendar-popup .react-calendar__month-view__days__day--neighboringMonth {
          color: #6b7280;
        }

        .calendar-popup .react-calendar__tile {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          padding: 0.75rem 0.5rem;
        }

        .calendar-popup .react-calendar__tile:enabled:hover,
        .calendar-popup .react-calendar__tile:enabled:focus {
          background-color: rgba(79, 70, 229, 0.5);
          border-radius: 0.5rem;
          transform: scale(0.98);
        }

        .calendar-popup .react-calendar__tile--now {
          background: rgba(34, 197, 94, 0.3);
          border: 1px solid rgba(34, 197, 94, 0.5);
          font-weight: bold;
        }

        .calendar-popup .react-calendar__tile--now:enabled:hover,
        .calendar-popup .react-calendar__tile--now:enabled:focus {
          background: rgba(34, 197, 94, 0.5);
        }

        .calendar-popup .react-calendar__tile--active {
          background: linear-gradient(135deg, #4f46e5, #3b82f6) !important;
          color: white !important;
          border-radius: 0.5rem;
        }

        .calendar-popup .react-calendar__tile--active:enabled:hover,
        .calendar-popup .react-calendar__tile--active:enabled:focus {
          background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
        }

        .calendar-popup .booked-date {
          background: linear-gradient(135deg, #ef4444, #dc2626) !important;
          color: white !important;
          text-decoration: line-through;
          position: relative;
        }

        .calendar-popup .booked-date:enabled:hover,
        .calendar-popup .booked-date:enabled:focus {
          background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
          transform: scale(0.98);
        }

        .calendar-popup .react-calendar__tile:disabled {
          background: rgba(100, 116, 139, 0.2);
          color: #6b7280;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .calendar-legend {
          margin-top: 0.75rem;
          font-size: 0.7rem;
          color: #9ca3af;
          text-align: center;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.5rem;
        }

        .owner-controls {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .edit-button, .delete-button {
          flex: 1;
          padding: 0.5rem;
          border-radius: 0.75rem;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-button {
          background: linear-gradient(135deg, #4f46e5, #3b82f6);
          color: white;
        }

        .delete-button {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
        }

        .booking-section {
          margin-top: 0.5rem;
        }

        .date-inputs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .date-input {
          flex: 1;
          padding: 0.5rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.5);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          font-size: 0.8rem;
        }

        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }

        .arrow {
          display: flex;
          align-items: center;
          color: #9ca3af;
        }

        .price-summary {
          display: flex;
          justify-content: space-between;
          background: rgba(34, 197, 94, 0.1);
          padding: 0.5rem;
          border-radius: 0.75rem;
          margin-bottom: 0.75rem;
          font-size: 0.8rem;
        }

        .total {
          font-weight: 600;
          color: #22c55e;
        }

        .book-button {
          width: 100%;
          padding: 0.6rem;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #4f46e5, #22c55e);
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .book-button:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 4rem;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 1rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .page-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-btn:hover:not(:disabled) {
          background: rgba(79, 70, 229, 0.3);
          border-color: #4f46e5;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 0.5rem;
        }

        .page-number {
          width: 36px;
          height: 36px;
          border-radius: 0.5rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-number.active {
          background: linear-gradient(135deg, #4f46e5, #3b82f6);
          border-color: transparent;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 1.5rem;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(148, 163, 184, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          color: #f9fafb;
          font-size: 1.5rem;
        }

        .close-modal {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #94a3b8;
          transition: color 0.2s ease;
        }

        .close-modal:hover {
          color: #ef4444;
        }

        .modal-form label {
          display: block;
          margin-bottom: 1rem;
          color: #e5e7eb;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .modal-form input,
        .modal-form textarea,
        .modal-form select {
          width: 100%;
          margin-top: 0.25rem;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          font-size: 0.9rem;
        }

        .image-upload-section {
          margin-bottom: 1rem;
        }

        .drag-drop-area {
          border: 2px dashed rgba(96, 165, 250, 0.5);
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(15, 23, 42, 0.5);
          margin-top: 0.5rem;
        }

        .drag-drop-area.dragging {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
          transform: scale(0.98);
        }

        .drag-drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-icon {
          font-size: 2.5rem;
        }

        .upload-hint {
          font-size: 0.7rem;
          color: #9ca3af;
        }

        .image-preview-grid {
          margin-top: 1rem;
        }

        .preview-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }

        .image-preview-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 2px solid rgba(96, 165, 250, 0.3);
        }

        .image-preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-image-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: 2px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
        }

        .remove-image-btn:hover {
          transform: scale(1.1);
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .cancel-btn {
          flex: 1;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(100, 116, 139, 0.3);
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn {
          flex: 1;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: none;
          background: linear-gradient(135deg, #4f46e5, #22c55e);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        @media (max-width: 768px) {
          .rental-page-container {
            padding: 1rem;
          }

          .items-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .search-filter-bar {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default RentalPage;
