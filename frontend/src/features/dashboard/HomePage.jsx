import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FileText, Users, UserCircle2 } from "lucide-react";
import API from "../../API/api";
import { useAuth } from "../../context/AuthContext";
import { PK, can } from "../../lib/permissionKeys";

export default function HomePage() {
  const { permissions, userId } = useAuth();
  const [postsCount, setPostsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [myPosts, setMyPosts] = useState(0);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (can(permissions, PK.postsView)) {
          const { data } = await API.get("/posts");
          if (!cancelled) {
            setPostsCount(data.length);
            setMyPosts(data.filter((p) => p.createdByUserId === userId).length);
          }
        }
        if (can(permissions, PK.adminUsers)) {
          const { data } = await API.get("/auth/users/count");
          if (!cancelled) setUsersCount(data.totalUsers);
        }
        const { data: profileData } = await API.get("/auth/profile");
        if (!cancelled) setProfile(profileData);
      } catch {
        /* handled globally / 403 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [permissions, userId]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm opacity-70">Modules depend on your permissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {can(permissions, PK.postsView) && (
          <div className="stats shadow bg-base-200 border border-base-300">
            <div className="stat">
              <div className="stat-figure text-primary">
                <FileText className="w-8 h-8" />
              </div>
              <div className="stat-title">Posts (platform)</div>
              <div className="stat-value text-primary">{postsCount}</div>
              <div className="stat-desc">My posts: {myPosts}</div>
            </div>
          </div>
        )}
        {can(permissions, PK.adminUsers) && (
          <div className="stats shadow bg-base-200 border border-base-300">
            <div className="stat">
              <div className="stat-figure text-secondary">
                <Users className="w-8 h-8" />
              </div>
              <div className="stat-title">Users</div>
              <div className="stat-value text-secondary">{usersCount}</div>
              <div className="stat-desc">Total accounts</div>
            </div>
          </div>
        )}
        {can(permissions, PK.dashboardPosts) && (
          <div className="stats shadow bg-base-200 border border-base-300">
            <div className="stat">
              <div className="stat-title">Quick link</div>
              <div className="stat-value text-lg">
                <Link to="/app/posts" className="link link-primary">
                  Open posts
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base">
            <UserCircle2 className="w-5 h-5" /> My profile
          </h2>
          {profile ? (
            <div className="text-sm space-y-3">
              <div className="flex items-center gap-3">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border border-base-300"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-base-300 flex items-center justify-center">
                    <UserCircle2 className="w-7 h-7 opacity-60" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{profile.fullName || "-"}</p>
                  <p className="opacity-70">{profile.email || "-"}</p>
                  {profile.publicUserId ? <p className="text-xs font-mono mt-1">ID: {profile.publicUserId}</p> : null}
                </div>
              </div>
              <p>
                <span className="opacity-70">Company:</span> {profile.company || "-"}
              </p>
              <p>
                <span className="opacity-70">Department:</span> {profile.department || "-"}
              </p>
              <Link to="/app/my-submission" className="link link-primary text-sm">
                Edit profile
              </Link>
            </div>
          ) : (
            <p className="text-sm opacity-70">Profile info not available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
