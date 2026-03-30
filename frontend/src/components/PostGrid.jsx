import React from "react";
import { Pencil, Trash2, Calendar, FileText } from "lucide-react";

const PostGrid = ({ posts, role, userId, onEdit, onDelete }) => {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-gray-500 dark:text-gray-400">
        <FileText size={48} className="mb-4 opacity-50" />
        <p className="text-center">
          No posts found. {(role === "Admin") ? "Create your first post!" : "Posts will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-2">
      {posts.map((post) => {
        const hasAccess = role === "Admin" || post.createdByUserId === userId;

        return (
          <div 
            key={post.id} 
            className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {post.title}
              </h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                <Calendar size={14} className="mr-1 opacity-70" />
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>

            {/* Content Full View */}
            <div className="p-5 flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between mt-auto">
              {!hasAccess ? (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">Read Only - No Access</span>
              ) : (
                <div className="flex gap-2 ml-auto">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                    onClick={() => onEdit(post)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PostGrid;
