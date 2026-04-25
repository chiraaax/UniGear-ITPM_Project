import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const ProfilePage = () => {
  const { user, token, login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    profileImage: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchLatestUser = async () => {
      if (!token) return;
      try {
        const { data } = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        login(token, data);
      } catch (err) {
        console.error("Failed to fetch latest user data:", err);
      }
    };
    fetchLatestUser();
  }, [token, login]); // Included token and login as dependencies

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      console.log("Starting upload for:", file.name);
      const { data } = await axios.post(
        "http://localhost:5000/api/upload/generate-url",
        {
          fileName: file.name,
          fileType: file.type,
          folder: "profiles",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Got signed URL:", data.signedUrl);

      await axios.put(data.signedUrl, file, {
        headers: { "Content-Type": file.type },
      });

      console.log("Public URL:", data.publicUrl);

      setFormData((prev) => ({ ...prev, profileImage: data.publicUrl }));
      setMessage({ type: "success", text: "Image uploaded! Save changes to apply." });
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      setMessage({ type: "error", text: `Upload failed: ${err.response?.data?.message || err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { data } = await axios.put(
        "http://localhost:5000/api/users/profile",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      login(token, data);
      setMessage({ type: "success", text: "Profile updated!" });
    } catch (err) {
      setMessage({ type: "error", text: "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  const getRank = (points) => {
    if (points >= 500) return "Gold";
    if (points >= 200) return "Silver";
    return "Bronze";
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case "Gold": return "🏆";
      case "Silver": return "🥈";
      default: return "🥉";
    }
  };

  const getNextRankInfo = (points) => {
    if (points >= 500) return { nextRank: "Master", pointsNeeded: 0, progress: 100, currentMax: 500, nextThreshold: 500 };
    if (points >= 200) {
      const nextThreshold = 500;
      const pointsNeeded = nextThreshold - points;
      const progress = ((points - 200) / 300) * 100;
      return { nextRank: "Gold", pointsNeeded, progress, currentMax: 200, nextThreshold };
    }
    const nextThreshold = 200;
    const pointsNeeded = nextThreshold - points;
    const progress = (points / 200) * 100;
    return { nextRank: "Silver", pointsNeeded, progress, currentMax: 0, nextThreshold };
  };

  const rank = getRank(user?.loyaltyPoints || 0);
  const rankIcon = getRankIcon(rank);
  const nextRankInfo = getNextRankInfo(user?.loyaltyPoints || 0);
  const points = user?.loyaltyPoints || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Floating Glass Card */}
        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-indigo-500/10">
          
          {/* Animated Gradient Header */}
          <div className="relative h-48 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%239C92AC%22%20fill-opacity=%220.05%22%3E%3Cpath%20d=%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            <div className="absolute -bottom-12 left-0 w-full h-24 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          </div>

          <div className="px-8 pb-8">
            {/* Profile Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 -mt-16 mb-8">
              
              {/* Avatar Section */}
              <div className="relative group ml-4 lg:ml-0">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-900 bg-slate-800 shadow-2xl">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    
                    <label className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm">
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs text-white font-medium">Change</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* User Info & Stats */}
              <div className="flex-1 text-center lg:text-right space-y-3">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {user?.name}
                  </h1>
                  <p className="text-slate-400 mt-1">{user?.email}</p>
                </div>
                
                <div className="flex flex-wrap justify-center lg:justify-end gap-3">
                  <div className="px-4 py-2 rounded-full bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30">
                    <span className="text-indigo-300 text-sm font-semibold flex items-center gap-2">
                      {rankIcon} {rank} Member
                    </span>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/30">
                    <span className="text-cyan-300 text-sm font-semibold flex items-center gap-2">
                      ⭐ {points} Points
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Toast */}
            {message.text && (
              <div className={`mb-8 p-4 rounded-xl backdrop-blur-sm border animate-slideDown ${
                message.type === "success" 
                  ? "bg-green-500/10 border-green-500/30 text-green-400" 
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                <div className="flex items-center gap-3">
                  {message.type === "success" ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {/* Loyalty Progress Section */}
            <div className="mb-8 p-5 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-300">Progress to {nextRankInfo.nextRank}</span>
                <span className="text-sm font-semibold text-indigo-400">
                  {nextRankInfo.pointsNeeded > 0 ? `${nextRankInfo.pointsNeeded} points needed` : "Max Level"}
                </span>
              </div>
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, nextRankInfo.progress)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>{nextRankInfo.currentMax} pts</span>
                <span>{nextRankInfo.nextThreshold} pts</span>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Your name"
                    className="w-full p-3 rounded-xl bg-slate-800/70 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 text-white placeholder-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Email Address</label>
                  <input 
                    value={formData.email} 
                    disabled 
                    className="w-full p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Phone Number</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+1 234 567 8900"
                    className="w-full p-3 rounded-xl bg-slate-800/70 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 text-white placeholder-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Address</label>
                  <input 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder="Your address"
                    className="w-full p-3 rounded-xl bg-slate-800/70 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Changes...</span>
                  </div>
                ) : (
                  "Save Profile"
                )}
              </button>
            </form>

            {/* Stats Footer */}
            <div className="mt-10 pt-6 border-t border-slate-800/50 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm text-center">
                <p className="text-slate-400 text-sm mb-1">Trust Score</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-green-400">{user?.trustScore?.toFixed(1) || "3.0"}</span>
                  <span className="text-yellow-400">★</span>
                </div>
                <div className="flex justify-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map((star) => (
                    <svg key={star} className={`w-3 h-3 ${star <= (user?.trustScore || 3) ? 'text-yellow-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm text-center">
                <p className="text-slate-400 text-sm mb-1">Member Since</p>
                <p className="text-lg font-bold text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "N/A"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {user?.createdAt ? `${Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 365))} years` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;