import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, FileText, LogOut, Plus, Users } from "lucide-react";
import API from "../API/api";
import Swal from "sweetalert2";
import PostList from "../components/PostList";
import PostGrid from "../components/PostGrid";
import PostModal from "../components/PostModal";
import ThemeToggle from "../components/ThemeToggle";

const Dashboard = () => {
  const { role, userId, userName, userEmail, logout, token } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeTab, setActiveTab] = useState("my_posts"); // useful for User role

  // Sidebar navigation state synced with localStorage to survive page reloads
  const [activeMenu, setActiveMenu] = useState(
    localStorage.getItem("activeMenu") || "dashboard"
  );

  useEffect(() => {
    localStorage.setItem("activeMenu", activeMenu);
  }, [activeMenu]);

  const fetchData = async () => {
    try {
      // Fetch all posts
      const resPosts = await API.get("/posts");
      setPosts(resPosts.data);

      // If admin, fetch total users
      if (role === "Admin") {
        const resUsers = await API.get("/auth/users/count");
        setTotalUsers(resUsers.data.totalUsers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, role]);

  const handleCreate = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  // Delete confirmation with SweetAlert2
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Post?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#111827",
    });

    if (!result.isConfirmed) return;

    try {
      await API.delete(`/posts/${id}`);
      fetchData();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The post has been removed.",
        timer: 1800,
        showConfirmButton: false,
        background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
        color: document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#111827",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Could not delete the post.",
        confirmButtonColor: "#4f46e5",
        background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
        color: document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#111827",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = role === "Admin";

  // RBAC logic: Controls how posts are displayed to the user based on active tab
  // Admins always see all posts natively in the current view pipeline.
  const displayedPosts = isAdmin
    ? posts
    : (activeTab === "my_posts" ? posts.filter((p) => p.createdByUserId === userId) : posts);

  // Calculate user-specific metrics for the dashboard summary
  const myPostsCount = posts.filter(p => p.createdByUserId === userId).length;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">

      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col transition-colors duration-200">
        <div className="p-6 text-xl font-bold text-indigo-600 dark:text-indigo-400">
          Post Management </div>

        {/* Sidebar Navigation logic for switching tabs */}
        <nav className="flex-1 px-4 space-y-2">
          <a
            onClick={() => setActiveMenu("dashboard")}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${activeMenu === "dashboard"
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a
            onClick={() => setActiveMenu("posts")}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${activeMenu === "posts"
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            <FileText size={18} /> Posts
          </a>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {userName || "Dashboard User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userEmail || "user@example.com"}
            </p>
            <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${role === "Admin"
              ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
              : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              }`}>
              {role} Account
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border dark:border-gray-600 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 transition-colors duration-200">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {isAdmin ? "Admin Dashboard" : "User Dashboard"}
          </h1>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <span className={`px-3 py-1 text-xs rounded font-semibold border ${isAdmin
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800 border-transparent'
              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800 border-transparent'
              }`}>
              {role}
            </span>

            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
            >
              <Plus size={16} /> New Post
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Stats - Only visible on Dashboard menu */}
          {activeMenu === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isAdmin ? (
                <>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded shadow dark:shadow-none border border-transparent dark:border-gray-700 transition-colors duration-200">
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2"><Users size={16} /> Total Users</p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{totalUsers}</h2>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded shadow dark:shadow-none border border-transparent dark:border-gray-700 transition-colors duration-200">
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2"><FileText size={16} /> Total Posts</p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{posts.length}</h2>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded shadow dark:shadow-none border border-transparent dark:border-gray-700 transition-colors duration-200">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Role Privilege</p>
                    <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">Full Control</h2>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded shadow dark:shadow-none border border-transparent dark:border-gray-700 transition-colors duration-200">
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2"><FileText size={16} /> My Posts</p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{myPostsCount}</h2>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded shadow dark:shadow-none border border-transparent dark:border-gray-700 transition-colors duration-200">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Platform Total Posts</p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{posts.length}</h2>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded shadow dark:shadow-none border border-transparent dark:border-gray-700 transition-colors duration-200">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Role Privilege</p>
                    <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">Manage Own</h2>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-none border border-transparent dark:border-gray-700 transition-colors duration-200">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">

              {isAdmin ? (
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">Recent Posts</h2>
              ) : (
                <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded p-1">
                  <button
                    onClick={() => setActiveTab("my_posts")}
                    className={`px-4 py-1.5 text-sm font-medium rounded ${activeTab === "my_posts"
                      ? "bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                  >
                    My Posts
                  </button>
                  <button
                    onClick={() => setActiveTab("all_posts")}
                    className={`px-4 py-1.5 text-sm font-medium rounded ${activeTab === "all_posts"
                      ? "bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                  >
                    All Posts
                  </button>
                </div>
              )}

              <button
                onClick={handleCreate}
                className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
              >
                <Plus size={14} /> Create Post
              </button>
            </div>

            {activeMenu === "dashboard" ? (
              <PostList
                posts={displayedPosts}
                role={role}
                userId={userId}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <PostGrid
                posts={posts} // Posts screen always shows ALL posts as requested
                role={role}
                userId={userId}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <PostModal
          post={editingPost}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};

export default Dashboard;