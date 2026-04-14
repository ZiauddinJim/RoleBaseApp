import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import API from "../../API/api";
import { useAuth } from "../../context/AuthContext";
import { PK, can } from "../../lib/permissionKeys";
import PostList from "../../components/PostList";
import PostGrid from "../../components/PostGrid";
import PostModal from "../../components/PostModal";
import Swal from "sweetalert2";

export default function PostsPage() {
  const { role, userId, permissions } = useAuth();
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("my_posts");
  const [view, setView] = useState("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const isAdmin = role === "Admin";
  const canManageAll = can(permissions, PK.postsManageAll);

  const fetchPosts = async () => {
    try {
      const { data } = await API.get("/posts");
      setPosts(data);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    void fetchPosts();
  }, []);

  const displayedPosts = isAdmin || canManageAll
    ? posts
    : activeTab === "my_posts"
      ? posts.filter((p) => p.createdByUserId === userId)
      : posts;

  const handleDelete = async (id) => {
    const r = await Swal.fire({
      title: "Delete post?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "oklch(var(--er))",
    });
    if (!r.isConfirmed) return;
    try {
      await API.delete(`/posts/${id}`);
      fetchPosts();
      Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data || "" });
    }
  };

  const canCreate = can(permissions, PK.postsCreate);

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Posts</h1>
        <div className="flex flex-wrap gap-2 items-center">
          {!isAdmin && !canManageAll && (
            <div className="join border border-base-300 rounded-lg overflow-hidden">
              <button
                type="button"
                className={activeTab === "my_posts" ? "btn btn-sm btn-primary join-item" : "btn btn-sm btn-ghost join-item"}
                onClick={() => setActiveTab("my_posts")}
              >
                Mine
              </button>
              <button
                type="button"
                className={activeTab === "all_posts" ? "btn btn-sm btn-primary join-item" : "btn btn-sm btn-ghost join-item"}
                onClick={() => setActiveTab("all_posts")}
              >
                All
              </button>
            </div>
          )}
          <div className="join border border-base-300 rounded-lg overflow-hidden">
            <button
              type="button"
              className={view === "list" ? "btn btn-sm btn-primary join-item" : "btn btn-sm btn-ghost join-item"}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              type="button"
              className={view === "grid" ? "btn btn-sm btn-primary join-item" : "btn btn-sm btn-ghost join-item"}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
          </div>
          {canCreate && (
            <button
              type="button"
              className="btn btn-primary btn-sm gap-2"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> New
            </button>
          )}
        </div>
      </div>

      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-0 sm:p-4">
          {view === "list" ? (
            <PostList
              posts={displayedPosts}
              role={isAdmin || canManageAll ? "Admin" : role}
              userId={userId}
              onEdit={(p) => {
                setEditing(p);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ) : (
            <PostGrid
              posts={displayedPosts}
              role={isAdmin || canManageAll ? "Admin" : role}
              userId={userId}
              onEdit={(p) => {
                setEditing(p);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {modalOpen && (
        <PostModal post={editing} onClose={() => setModalOpen(false)} onRefresh={fetchPosts} />
      )}
    </div>
  );
}
