import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  UserRound,
  Trash2,
  RefreshCw,
  Mail,
  CalendarDays,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";

import API from "../api/axios";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [processingUserId, setProcessingUserId] = useState(null);

  const currentUserEmail = localStorage.getItem("email");

  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await API.get("/users/");

      const data = response.data;

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(
        "User management loading error:",
        err.response?.data || err.message
      );

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError(
          "Access denied. User Management is available only to Admin accounts."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load users. Please check your backend connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  useEffect(() => {
    if (!success && !error) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4500);

    return () => clearTimeout(timer);
  }, [success, error]);

  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        String(user.username || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.email || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        String(user.role || "").toLowerCase() === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalUsers = users.length;

  const adminCount = users.filter(
    (user) => user.role?.toLowerCase() === "admin"
  ).length;

  const analystCount = users.filter(
    (user) => user.role?.toLowerCase() === "analyst"
  ).length;

  // =========================================================
  // CHECK CURRENT USER
  // =========================================================

  const isCurrentUser = (user) => {
    if (!currentUserEmail) {
      return false;
    }

    return (
      String(user.email || "").toLowerCase() ===
      String(currentUserEmail).toLowerCase()
    );
  };

  // =========================================================
  // CHANGE ROLE
  // =========================================================

  const handleRoleChange = async (user) => {
    if (isCurrentUser(user)) {
      setError("You cannot change your own role.");
      return;
    }

    const newRole =
      user.role?.toLowerCase() === "admin"
        ? "analyst"
        : "admin";

    const confirmed = window.confirm(
      `Change ${user.username || user.email} to ${newRole.toUpperCase()}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingUserId(user.id);
      setError("");
      setSuccess("");

      await API.put(`/users/${user.id}/role`, {
        role: newRole,
      });

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                role: newRole,
              }
            : item
        )
      );

      setSuccess(
        `${user.username || user.email} is now ${newRole.toUpperCase()}.`
      );
    } catch (err) {
      console.error(
        "Role update error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
          "Unable to update the user's role."
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const handleDelete = async (user) => {
    if (isCurrentUser(user)) {
      setError("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        user.username || user.email
      }?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingUserId(user.id);
      setError("");
      setSuccess("");

      await API.delete(`/users/${user.id}`);

      setUsers((previousUsers) =>
        previousUsers.filter(
          (item) => item.id !== user.id
        )
      );

      setSuccess(
        `${user.username || user.email} was deleted successfully.`
      );
    } catch (err) {
      console.error(
        "Delete user error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
          "Unable to delete the user."
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // ROLE BADGE
  // =========================================================

  const getRoleBadge = (role) => {
    const normalizedRole = String(
      role || "analyst"
    ).toLowerCase();

    if (normalizedRole === "admin") {
      return {
        label: "ADMIN",
        icon: ShieldCheck,
        wrapper:
          "border-lime-300/50 bg-lime-300/10 text-lime-200 shadow-[0_0_14px_rgba(163,230,53,0.18)]",
        iconClass: "text-lime-300",
      };
    }

    return {
      label: "ANALYST",
      icon: UserRound,
      wrapper:
        "border-blue-400/40 bg-blue-400/10 text-blue-200 shadow-[0_0_14px_rgba(96,165,250,0.14)]",
      iconClass: "text-blue-300",
    };
  };

  // =========================================================
  // AUTH PROVIDER BADGE
  // =========================================================

  const getAuthProviderBadge = (provider) => {
    const normalizedProvider = String(
      provider || "local"
    ).toLowerCase();

    if (normalizedProvider === "google") {
      return {
        label: "Google",
        icon: ShieldCheck,
        wrapper:
          "border-purple-400/30 bg-purple-400/10 text-purple-200",
        iconClass: "text-purple-300",
      };
    }

    return {
      label: "Password",
      icon: KeyRound,
      wrapper:
        "border-slate-400/25 bg-slate-400/10 text-slate-200",
      iconClass: "text-slate-300",
    };
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-9 w-9 animate-spin text-lime-300 drop-shadow-[0_0_12px_rgba(163,230,53,0.8)]" />

          <p className="mt-5 text-sm font-semibold text-white">
            Loading user management...
          </p>

          <p className="mt-1 text-xs text-white/50">
            Fetching registered users
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-[#0B1220] px-6 py-7 text-white lg:px-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-300/50 bg-lime-300/10 shadow-[0_0_30px_rgba(163,230,53,0.30),inset_0_0_18px_rgba(163,230,53,0.08)]">

            <Users className="h-7 w-7 text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.9)]" />

          </div>

          <div>

            

            <h1 className="text-3xl font-bold tracking-tight text-white">
              User Management
            </h1>

            <p className="mt-1 text-sm font-medium text-white/65">
              Manage platform users, roles and access
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-lime-300/45 bg-lime-300/10 px-5 py-3 text-sm font-bold text-lime-200 shadow-[0_0_22px_rgba(163,230,53,0.18)] transition-all duration-200 hover:border-lime-300/75 hover:bg-lime-300/15 hover:text-lime-100 hover:shadow-[0_0_32px_rgba(163,230,53,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Users
        </button>

      </div>


      {/* =====================================================
          STATUS MESSAGES
      ====================================================== */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/40 bg-red-400/10 px-5 py-4 text-sm font-semibold text-red-200 shadow-[0_0_24px_rgba(248,113,113,0.12)]">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

          <span>{error}</span>

        </div>
      )}

      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-lime-300/45 bg-lime-300/10 px-5 py-4 text-sm font-semibold text-lime-200 shadow-[0_0_24px_rgba(163,230,53,0.16)]">

          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lime-300" />

          <span>{success}</span>

        </div>
      )}


      {/* =====================================================
          PLATFORM OVERVIEW
      ====================================================== */}

      <div className="mb-7 overflow-hidden rounded-2xl border border-lime-300/25 bg-[#111C2E] shadow-[0_0_30px_rgba(163,230,53,0.10)]">

        <div className="flex flex-col lg:flex-row">

          {/* TOTAL USERS */}

          <div className="flex flex-1 items-center gap-4 px-6 py-5 lg:border-r lg:border-white/10">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-lime-300/30 bg-lime-300/10">

              <Users className="h-5 w-5 text-lime-300" />

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Total Users
              </p>

              <div className="mt-1 flex items-baseline gap-2">

                <span className="text-2xl font-bold text-white">
                  {totalUsers}
                </span>

                <span className="text-xs font-medium text-white/35">
                  registered
                </span>

              </div>

            </div>

          </div>


          {/* ADMINISTRATORS */}

          <div className="flex flex-1 items-center gap-4 border-t border-white/10 px-6 py-5 lg:border-t-0 lg:border-r">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-lime-300/30 bg-lime-300/10">

              <ShieldCheck className="h-5 w-5 text-lime-300" />

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Administrators
              </p>

              <div className="mt-1 flex items-baseline gap-2">

                <span className="text-2xl font-bold text-white">
                  {adminCount}
                </span>

                <span className="text-xs font-medium text-lime-300/60">
                  admin access
                </span>

              </div>

            </div>

          </div>


          {/* ANALYSTS */}

          <div className="flex flex-1 items-center gap-4 border-t border-white/10 px-6 py-5 lg:border-t-0">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-400/10">

              <UserRound className="h-5 w-5 text-blue-300" />

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Analysts
              </p>

              <div className="mt-1 flex items-baseline gap-2">

                <span className="text-2xl font-bold text-white">
                  {analystCount}
                </span>

                <span className="text-xs font-medium text-blue-300/60">
                  analyst access
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN USER PANEL
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-lime-300/45 bg-[#111C2E] shadow-[0_0_38px_rgba(163,230,53,0.18),0_0_80px_rgba(163,230,53,0.06)]">

        {/* ===================================================
            PANEL HEADER
        ==================================================== */}

        <div className="border-b border-lime-300/20 px-6 py-5 lg:px-7">

          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">

            <div>

              <h2 className="text-xl font-bold text-white">
                Platform Users
              </h2>

              <p className="mt-1 text-sm font-medium text-white/55">
                Review and manage registered accounts
              </p>

            </div>


            {/* LIVE STATUS */}

            <div className="flex items-center gap-2 self-start rounded-full border border-lime-300/35 bg-lime-300/10 px-4 py-2 shadow-[0_0_18px_rgba(163,230,53,0.12)]">

              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,1)]" />

              <span className="text-xs font-bold uppercase tracking-wider text-lime-200">
                Admin Access
              </span>

            </div>

          </div>

        </div>


        {/* ===================================================
            SEARCH / FILTER
        ==================================================== */}

        <div className="border-b border-lime-300/15 bg-[#0F192A] px-6 py-5 lg:px-7">

          <div className="flex flex-col gap-3 md:flex-row">

            {/* SEARCH */}

            <div className="relative flex-1">

              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by username or email..."
                className="w-full rounded-xl border border-lime-300/20 bg-[#0B1220] py-3 pl-11 pr-4 text-sm font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-lime-300/60 focus:shadow-[0_0_22px_rgba(163,230,53,0.14)]"
              />

            </div>


            {/* ROLE FILTER */}

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
              className="w-full rounded-xl border border-lime-300/20 bg-[#0B1220] px-4 py-3 text-sm font-semibold text-white/75 outline-none transition-all focus:border-lime-300/60 focus:shadow-[0_0_22px_rgba(163,230,53,0.14)] md:w-48"
            >

              <option value="all">
                All Roles
              </option>

              <option value="admin">
                Administrators
              </option>

              <option value="analyst">
                Analysts
              </option>

            </select>


            {/* RESET */}

            {(search || roleFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/65 transition-all hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-lime-200"
              >

                <RotateCcw className="h-4 w-4" />

                Reset

              </button>
            )}

          </div>

        </div>


        {/* ===================================================
            TABLE
        ==================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead>

              <tr className="border-b border-lime-300/20 bg-[#0D1727]">

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/65">
                  User
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/65">
                  Role
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/65">
                  Authentication
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/65">
                  Created
                </th>

                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-white/65">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredUsers.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="px-6 py-20"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-300/25 bg-lime-300/10 shadow-[0_0_25px_rgba(163,230,53,0.12)]">

                        <Users className="h-8 w-8 text-lime-300/70" />

                      </div>

                      <p className="mt-5 text-lg font-bold text-white">
                        No Users Found
                      </p>

                      <p className="mt-1 text-sm font-medium text-white/45">
                        Try changing your search or filter.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredUsers.map((user) => {

                  const roleBadge = getRoleBadge(
                    user.role
                  );

                  const authBadge =
                    getAuthProviderBadge(
                      user.auth_provider
                    );

                  const RoleIcon =
                    roleBadge.icon;

                  const AuthIcon =
                    authBadge.icon;

                  const currentUser =
                    isCurrentUser(user);

                  const processing =
                    processingUserId === user.id;

                  return (

                    <tr
                      key={user.id}
                      className="group border-b border-white/5 transition-all duration-200 hover:bg-lime-300/[0.035]"
                    >

                      {/* USER */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lime-300/35 bg-lime-300/10 text-sm font-bold text-lime-300 shadow-[0_0_16px_rgba(163,230,53,0.10)]">

                            {String(
                              user.username ||
                                user.email ||
                                "U"
                            )
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div className="min-w-0">

                            <div className="flex items-center gap-2">

                              <p className="truncate text-sm font-bold text-white group-hover:text-lime-200">

                                {user.username ||
                                  "Unnamed User"}

                              </p>

                              {currentUser && (

                                <span className="rounded-full border border-lime-300/35 bg-lime-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-lime-200">

                                  You

                                </span>

                              )}

                            </div>

                            <div className="mt-1 flex items-center gap-1.5">

                              <Mail className="h-3 w-3 text-white/30" />

                              <p className="truncate text-xs font-medium text-white/45">

                                {user.email || "No email"}

                              </p>

                            </div>

                          </div>

                        </div>

                      </td>


                      {/* ROLE */}

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wider ${roleBadge.wrapper}`}
                        >

                          <RoleIcon
                            className={`h-3.5 w-3.5 ${roleBadge.iconClass}`}
                          />

                          {roleBadge.label}

                        </span>

                      </td>


                      {/* AUTHENTICATION */}

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${authBadge.wrapper}`}
                        >

                          <AuthIcon
                            className={`h-3.5 w-3.5 ${authBadge.iconClass}`}
                          />

                          {authBadge.label}

                        </span>

                      </td>


                      {/* CREATED */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2 text-sm font-medium text-white/60">

                          <CalendarDays className="h-4 w-4 text-white/30" />

                          {formatDate(
                            user.created_at
                          )}

                        </div>

                      </td>


                      {/* ACTIONS */}

                      <td className="px-6 py-5">

                        <div className="flex items-center justify-center gap-2">

                          {/* CHANGE ROLE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleRoleChange(
                                user
                              )
                            }
                            disabled={
                              currentUser ||
                              processing
                            }
                            title={
                              currentUser
                                ? "You cannot change your own role"
                                : "Change role"
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime-300/25 bg-lime-300/10 text-lime-300 transition-all hover:border-lime-300/60 hover:bg-lime-300/20 hover:shadow-[0_0_18px_rgba(163,230,53,0.20)] disabled:cursor-not-allowed disabled:opacity-30"
                          >

                            {processing ? (

                              <Loader2 className="h-4 w-4 animate-spin" />

                            ) : (

                              <RotateCcw className="h-4 w-4" />

                            )}

                          </button>


                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(user)
                            }
                            disabled={
                              currentUser ||
                              processing
                            }
                            title={
                              currentUser
                                ? "You cannot delete your own account"
                                : "Delete user"
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/25 bg-red-400/10 text-red-300 transition-all hover:border-red-400/60 hover:bg-red-400/20 hover:shadow-[0_0_18px_rgba(248,113,113,0.18)] disabled:cursor-not-allowed disabled:opacity-30"
                          >

                            <Trash2 className="h-4 w-4" />

                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>


        {/* ===================================================
            FOOTER
        ==================================================== */}

        <div className="flex flex-col gap-3 border-t border-lime-300/15 bg-[#0D1727] px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-7">

          <div className="flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,1)]" />

            <span className="text-xs font-semibold text-white/65">

              Showing {filteredUsers.length} of{" "}
              {totalUsers} users

            </span>

          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-white/40">

            <KeyRound className="h-3.5 w-3.5" />

            Admin-only management controls

          </div>

        </div>

      </section>

    </div>
  );
}

export default UserManagement;