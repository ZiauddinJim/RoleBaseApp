import React from "react";
import { Pencil, Trash2, FileText } from "lucide-react";

const PostList = ({ posts, role, userId, onEdit, onDelete }) => {
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
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
            <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content</th>
            <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
            <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">{post.title}</td>
              <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                {post.content}
              </td>
              <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="py-4 px-6 text-right">
                <div className="flex justify-end gap-2">
                  {(role === "Admin" || post.createdByUserId === userId) ? (
                    <>
                      <button
                        className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition"
                        title="Edit"
                        onClick={() => onEdit(post)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition"
                        title="Delete"
                        onClick={() => onDelete(post.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">No access</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PostList;
