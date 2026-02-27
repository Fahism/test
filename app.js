// ─── Supabase Client ────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dwregstoxyizbkehslhm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cmVnc3RveHlpemJrZWhzbGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDYyNTIsImV4cCI6MjA4NzU4MjI1Mn0.U5wKHvEsXRliZhHFyZ_b7tAlj4VzfcVS7nievpVKiAw";

// KSCS Custom Modals Version 1.0.1
window.alert = (msg) => showAlert(msg);
window.confirm = (msg) => { console.warn("Native confirm blocked; use showConfirm instead."); return true; };

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── App State ──────────────────────────────────────────────────────────────
const state = {
  user: null,
  profile: null,
  posts: [],
  activePostId: null,
  activePost: null,
  comments: [],
  notifications: [],
  filter: { topic: null, search: "", sort: "new" },
};

const TOPICS = [
  "UI/UX", "Data Science", "Algorithms", "DevOps", "AI",
  "Cloud", "Math", "Career", "Syllabus", "Web", "Python",
];

// ─── DOM refs ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const els = {
  postsGrid:        $("posts-grid"),
  chipTopics:       $("chip-topics"),
  feedView:         $("feed-view"),
  detailView:       $("detail-view"),
  detailTitle:      $("detail-title"),
  detailBody:       $("detail-body"),
  detailAuthor:     $("detail-author"),
  detailTags:       $("detail-tags"),
  detailAttachments:$("detail-attachments"),
  detailActions:    $("detail-actions"),
  voteCount:        $("vote-count"),
  btnUpvote:        $("btn-upvote"),
  btnDownvote:      $("btn-downvote"),
  btnBack:          $("btn-back"),
  commentsHeading:  $("comments-heading"),
  comments:         $("comments-list"),
  commentForm:      $("comment-form"),
  commentText:      $("comment-text"),
  hotPosts:         $("hot-posts"),
  drawer:           $("drawer"),
  notificationList: $("notification-list"),
  notifBadge:       $("notif-badge"),
  btnNotifications: $("btn-notifications"),
  btnCloseDrawer:   $("btn-close-drawer"),
  btnAuth:          $("btn-auth"),
  btnSignout:       $("btn-signout"),
  btnProfile:       $("btn-profile"),
  btnAdmin:         $("btn-admin"),
  authPage:         $("auth-page"),
  appLayout:        $("app-layout"),
  topbar:           $("topbar"),
  authEmail:        $("auth-email"),
  authPassword:     $("auth-password"),
  authName:         $("auth-name"),
  authToggle:       $("auth-toggle"),
  authTitle:        $("auth-title"),
  authNameRow:      $("auth-name-row"),
  btnAuthSubmit:    $("btn-auth-submit"),
  modalPost:        $("modal-post"),
  postTitle:        $("post-title"),
  postBody:         $("post-body"),
  postTags:         $("post-tags"),
  postFiles:        $("post-files"),
  btnSavePost:      $("btn-save-post"),
  modalPostTitle:   $("modal-post-title"),
  postId:           $("post-id"),
  tagSuggestions:   $("tag-suggestions"),
  btnNewPost:       $("btn-new-post"),
  searchInput:      $("search-input"),
  btnComment:       $("btn-comment"),
  modalProfile:     $("modal-profile"),
  profileName:      $("profile-name"),
  btnSaveProfile:   $("btn-save-profile"),
  modalReport:      $("modal-report"),
  reportReason:     $("report-reason"),
  reportTargetType: $("report-target-type"),
  reportTargetId:   $("report-target-id"),
  btnSendReport:    $("btn-send-report"),
  adminPanel:       $("admin-panel"),
  adminReports:     $("admin-reports"),
  btnCloseAdmin:    $("btn-close-admin"),
  userGreeting:     $("user-greeting"),
  modalConfirm:     $("modal-confirm"),
  confirmTitle:     $("confirm-title"),
  confirmMessage:   $("confirm-message"),
  btnConfirmOk:     $("btn-confirm-ok"),
  btnConfirmCancel: $("btn-confirm-cancel"),
};

// ─── Auth ───────────────────────────────────────────────────────────────────
let authMode = "signin";

function showAuthPage() {
  authMode = "signin";
  els.authTitle.textContent = "Welcome back";
  els.authNameRow.hidden = true;
  els.btnAuthSubmit.textContent = "Sign in";
  els.authToggle.innerHTML = 'No account? <a href="#">Create one</a>';
  els.authEmail.value = "";
  els.authPassword.value = "";
  els.authName.value = "";
  els.authPage.hidden = false;
  els.appLayout.hidden = true;
  els.topbar.hidden = true;
}

els.authToggle?.addEventListener("click", (e) => {
  e.preventDefault();
  if (authMode === "signin") {
    authMode = "signup";
    els.authTitle.textContent = "Create your account";
    els.btnAuthSubmit.textContent = "Sign up";
    els.authNameRow.hidden = false;
    els.authToggle.innerHTML = 'Have an account? <a href="#">Sign in</a>';
  } else {
    authMode = "signin";
    els.authTitle.textContent = "Welcome back";
    els.btnAuthSubmit.textContent = "Sign in";
    els.authNameRow.hidden = true;
    els.authToggle.innerHTML = 'No account? <a href="#">Create one</a>';
  }
});

els.btnAuthSubmit?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  if (!email || !password) return showAlert("Email and password required.");

  try {
    if (authMode === "signup") {
      const name = els.authName.value.trim() || email.split("@")[0];
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      // auto-create profile row
      if (data.user) {
        const colors = ["lilac", "mint", "yellow"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        await supabase.from("profiles").upsert({
          id: data.user.id,
          name,
          role: "user",
          theme_color: randomColor,
        });
      }
      showAlert("Account created! If confirmation is needed, check your email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (err) {
    showAlert(err.message, "Auth Error");
  }
});

async function signOutUser() {
  await supabase.auth.signOut();
  state.user = null;
  state.profile = null;
  showAuthPage();
}

async function loadProfile() {
  if (!state.user) return;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", state.user.id)
      .single();

    if (data) {
      state.profile = data;
    } else {
      console.warn("Profile not found, creating:", error?.message);
      const name = state.user.user_metadata?.name || state.user.email.split("@")[0];
      const colors = ["lilac", "mint", "yellow"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const { data: created, error: upsertErr } = await supabase
        .from("profiles")
        .upsert({ id: state.user.id, name, role: "user", theme_color: randomColor })
        .select()
        .single();
      if (upsertErr) console.warn("Profile upsert failed:", upsertErr.message);
      state.profile = created || { name, role: "user", theme_color: randomColor };
    }
  } catch (err) {
    console.error("loadProfile error:", err);
    const name = state.user.user_metadata?.name || state.user.email?.split("@")[0] || "User";
    state.profile = { name, role: "user" };
  }
}

function updateAuthUI() {
  const signedIn = !!state.user;
  els.authPage.hidden = signedIn;
  els.appLayout.hidden = !signedIn;
  els.topbar.hidden = !signedIn;
  els.btnAuth.hidden = signedIn;
  els.btnSignout.hidden = !signedIn;
  els.btnProfile.hidden = !signedIn;
  els.btnNewPost.disabled = !signedIn;
  els.commentForm.hidden = !signedIn || !state.activePostId;
  els.btnAdmin.hidden = !(state.profile?.role === "admin");
  if (signedIn && state.profile) {
    els.userGreeting.textContent = state.profile.name || state.user.email;
    els.userGreeting.hidden = false;
  } else {
    els.userGreeting.hidden = true;
  }
}

// ─── Posts ───────────────────────────────────────────────────────────────────
async function loadPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(name, theme_color), likes(user_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadPosts:", error);
    return;
  }
  state.posts = (data || []).map((p) => ({
    ...p,
    authorName: p.profiles?.name || "Anon",
    authorTheme: p.profiles?.theme_color || "",
    liked_by: (p.likes || []).map(l => l.user_id),
    comment_count: 0,
  }));

  // Fetch comment counts per post
  try {
    const postIds = state.posts.map((p) => p.id);
    if (postIds.length) {
      const { data: comments } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);
      if (comments) {
        const countMap = {};
        comments.forEach((c) => { countMap[c.post_id] = (countMap[c.post_id] || 0) + 1; });
        state.posts.forEach((p) => { p.comment_count = countMap[p.id] || 0; });
      }
    }
  } catch (_) { /* fallback: counts stay 0 */ }

  renderPosts();
  // refresh active detail if open
  if (state.activePostId) {
    const refreshed = state.posts.find((p) => p.id === state.activePostId);
    if (refreshed) {
      state.activePost = refreshed;
      renderDetail(refreshed);
    }
  }
}

function subscribePosts() {
  supabase
    .channel("public:posts")
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadPosts())
    .subscribe();
}

function getFilteredPosts() {
  let list = [...state.posts];
  const q = state.filter.search.toLowerCase();
  if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
  if (state.filter.topic) list = list.filter((p) => (p.tags || []).includes(state.filter.topic));
  if (state.filter.sort === "hot") list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
}

function renderPosts() {
  const list = getFilteredPosts();
  els.postsGrid.innerHTML = "";

  if (!list.length) {
    const q = state.filter.search.trim();
    if (q) {
      els.postsGrid.innerHTML = `
        <div class="empty-state">
          No posts found for "${esc(q)}".
          <div style="margin-top:20px;">
            <button class="pill yellow" id="btn-search-add">Ask a question about "${esc(q)}"?</button>
          </div>
        </div>`;
      $("btn-search-add")?.addEventListener("click", () => {
        openNewPost();
        els.postTitle.value = q;
        // Optionally add it to tags too if they muốn
      });
    } else {
      els.postsGrid.innerHTML = '<div class="empty-state">No posts yet. Be the first to share knowledge!</div>';
    }
    return;
  }

  list.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    const initial = (p.authorName || "A").charAt(0).toUpperCase();
    const colorClass = p.authorTheme || "";
    
    // Clean preview from fallback attachments JSON
    let bodyText = p.body || "";
    if (bodyText.includes("---Attachments---")) {
      bodyText = bodyText.split("---Attachments---")[0].trim();
    }
    const preview = bodyText.length > 140 ? bodyText.slice(0, 140) + "…" : bodyText;
    
    const commentCount = p.comment_count || 0;
    card.innerHTML = `
      <div class="card-author">
        <div class="avatar ${colorClass}">${initial}</div>
        <div class="author-info">
          <span class="author-name">${esc(p.authorName)}</span>
          <span class="author-date">${timeAgo(p.created_at)}</span>
        </div>
      </div>
      <div class="card-title">${esc(p.title)}</div>
      <div class="card-preview">${esc(preview)}</div>
      <div class="card-tags">${(p.tags || []).map((t) => `<span class="card-tag">${esc(t)}</span>`).join("")}</div>
      <div class="card-stats">
        <span class="card-stat"><span class="icon">▲</span> ${p.likes || 0} votes</span>
        <span class="card-stat"><span class="icon">💬</span> ${commentCount} comments</span>
      </div>`;
    card.addEventListener("click", () => selectPost(p.id));
    els.postsGrid.appendChild(card);
  });

  // Also render hot posts in sidebar
  renderHotPosts();
}

async function selectPost(id) {
  state.activePostId = id;
  const post = state.posts.find((p) => p.id === id);
  state.activePost = post;

  // Switch from feed to detail view
  els.feedView.hidden = true;
  els.detailView.hidden = false;

  renderDetail(post);
  await loadComments(id);
  els.commentForm.hidden = !state.user;
}

function showFeedView() {
  state.activePostId = null;
  state.activePost = null;
  els.feedView.hidden = false;
  els.detailView.hidden = true;
}

function renderDetail(post) {
  if (!post) {
    showFeedView();
    return;
  }

  const initial = (post.authorName || "A").charAt(0).toUpperCase();
  const colorClass = post.authorTheme || "";
  // Fallback for missing liked_by column: check the likes table logic if needed, 
  // but for now we'll just check if the property exists.
  const liked = post.liked_by ? post.liked_by.includes(state.user?.id) : false;

  els.detailAuthor.innerHTML = `
    <div class="avatar ${colorClass}">${initial}</div>
    <div class="author-info">
      <span class="author-name">${esc(post.authorName)}</span>
      <span class="author-date">${timeAgo(post.created_at)}</span>
    </div>`;

  els.detailTitle.textContent = post.title;
  els.detailTags.innerHTML = (post.tags || []).map((t) => `<span class="detail-tag">${esc(t)}</span>`).join("");
  
  // Parse attachments from body if using fallback
  let displayBody = post.body;
  let attachments = [];
  if (post.body.includes("---Attachments---")) {
    const parts = post.body.split("\n\n---Attachments---\n");
    displayBody = parts[0];
    try { attachments = JSON.parse(parts[1]); } catch(e) {}
  }
  
  els.detailBody.textContent = displayBody;
  
  // Render Attachments
  els.detailAttachments.innerHTML = "";
  attachments.forEach(file => {
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = file.url;
      img.className = "attachment-img";
      img.alt = file.name;
      els.detailAttachments.appendChild(img);
    } else {
      const link = document.createElement("a");
      link.href = file.url;
      link.className = "attachment-link";
      link.target = "_blank";
      link.innerHTML = `📄 <span>${esc(file.name)}</span>`;
      els.detailAttachments.appendChild(link);
    }
  });

  els.voteCount.textContent = post.likes || 0;
  els.btnUpvote.className = `vote-btn ${liked ? "active" : ""}`;

  let actions = "";
  if (state.user) {
    actions += `<button class="pill ghost" id="btn-report-post">⚑ Report</button>`;
  }
  if (state.user && post.author_id === state.user.id) {
    actions += `<button class="pill ghost" id="btn-edit-post">✎ Edit</button>`;
    actions += `<button class="pill ghost danger" id="btn-delete-post">✕ Delete</button>`;
  }
  els.detailActions.innerHTML = actions;

  // Wire vote buttons
  els.btnUpvote.onclick = () => toggleLike(post.id);
  els.btnDownvote.onclick = () => {}; // placeholder

  $("btn-report-post")?.addEventListener("click", () => openReportModal("post", post.id));
  $("btn-edit-post")?.addEventListener("click", () => openEditPost(post));
  $("btn-delete-post")?.addEventListener("click", () => deletePost(post.id));
}

// ─── Create / Edit / Delete Post ────────────────────────────────────────────
function openNewPost() {
  if (!state.user) return showAuthPage();
  els.modalPostTitle.textContent = "New post";
  els.postId.value = "";
  els.postTitle.value = "";
  els.postBody.value = "";
  els.postTags.value = "";
  els.postFiles.value = ""; // Clear file input
  els.modalPost.showModal();
}

async function uploadFiles(files) {
  const uploadedUrls = [];
  for (const file of files) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${state.user.id}/${fileName}`;

    try {
      const { data, error } = await supabase.storage.from("kscs-bucket").upload(filePath, file);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from("kscs-bucket").getPublicUrl(filePath);
      uploadedUrls.push({ name: file.name, url: publicUrl, type: file.type });
    } catch (err) {
      console.warn("Upload failed:", err.message);
    }
  }
  return uploadedUrls;
}

function openEditPost(post) {
  els.modalPostTitle.textContent = "Edit post";
  els.postId.value = post.id;
  els.postTitle.value = post.title;
  els.postBody.value = post.body.split("\n\n---Attachments---")[0];
  els.postTags.value = (post.tags || []).join(", ");
  els.modalPost.showModal();
}

async function savePost() {
  const id = els.postId.value;
  const title = els.postTitle.value.trim();
  const body = els.postBody.value.trim();
  const tags = els.postTags.value.split(",").map((t) => t.trim()).filter(Boolean);
  const files = els.postFiles.files;
  
  if (!title || !body) return showAlert("Title and details are required.");

  // Evaluate words & commands (tags)
  const vTitle = validateWords(title);
  if (!vTitle.ok) return showAlert(vTitle.msg, "Invalid Title");
  
  const vBody = validateWords(body);
  if (!vBody.ok) return showAlert(vBody.msg, "Invalid Details");

  for (const tag of tags) {
    const vTag = validateCommand(tag);
    if (!vTag.ok) return showAlert(`${vTag.msg} in tag: ${tag}`, "Invalid Tag");
  }

  try {
    els.btnSavePost.disabled = true;
    els.btnSavePost.textContent = "Publishing...";

    let postData = { title, body, tags };

    // Handle file uploads
    if (files.length) {
      const attachments = await uploadFiles(files);
      if (attachments.length) {
        // Fix for missing attachments column: store as JSON in body
        postData.body += "\n\n---Attachments---\n" + JSON.stringify(attachments);
      }
    }

    if (id) {
      const { error } = await supabase.from("posts").update(postData).eq("id", id);
      if (error) throw error;
    } else {
      postData.author_id = state.user.id;
      // We removed 'likes: 0' and 'liked_by' to avoid schema errors.
      // The database will use defaults or the join table handles it.
      const { error } = await supabase.from("posts").insert(postData);
      if (error) throw error;
    }
    
    els.modalPost.close();
    await loadPosts();
  } catch (err) {
    showAlert(err.message, "Post Error");
  } finally {
    els.btnSavePost.disabled = false;
    els.btnSavePost.textContent = "Publish";
  }
}

async function deletePost(id) {
  const ok = await showConfirm("Are you sure you want to delete this post? This cannot be undone.");
  if (!ok) return;
  try {
    // delete comments first
    await supabase.from("comments").delete().eq("post_id", id);
    // delete likes
    await supabase.from("likes").delete().eq("post_id", id);
    // delete the post
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;
    state.activePostId = null;
    state.activePost = null;
    showFeedView();
    await loadPosts();
  } catch (err) {
    showAlert(err.message, "Delete failed");
  }
}

// ─── Comments ───────────────────────────────────────────────────────────────
async function loadComments(postId) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(name, theme_color)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadComments:", error);
    return;
  }
  state.comments = (data || []).map((c) => ({
    ...c,
    authorName: c.profiles?.name || "User",
    authorTheme: c.profiles?.theme_color || "",
  }));
  renderComments();
}

function subscribeComments() {
  supabase
    .channel("public:comments")
    .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
      if (state.activePostId) loadComments(state.activePostId);
    })
    .subscribe();
}

function renderComments() {
  els.comments.innerHTML = "";
  els.commentsHeading.textContent = `Comments (${state.comments.length})`;
  if (!state.comments.length) {
    els.comments.innerHTML = '<div class="empty-state">No comments yet. Be the first to answer!</div>';
    return;
  }
  state.comments.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "comment";
    const isOwn = state.user && c.author_id === state.user.id;
    const initial = (c.authorName || "U").charAt(0).toUpperCase();
    const colorClass = c.authorTheme || "";
    div.innerHTML = `
      <div class="comment-header">
        <div class="comment-author-info">
          <div class="avatar sm ${colorClass}">${initial}</div>
          <span class="author">${esc(c.authorName)}</span>
        </div>
        <span class="time">${timeAgo(c.created_at)}</span>
      </div>
      <div class="comment-body">${esc(c.body)}</div>
      <div class="comment-actions">
        ${state.user ? `<button class="link-btn report-comment" data-id="${c.id}">⚑ Report</button>` : ""}
        ${isOwn ? `<button class="link-btn delete-comment" data-id="${c.id}">✕ Delete</button>` : ""}
      </div>`;
    els.comments.appendChild(div);
  });
  document.querySelectorAll(".report-comment").forEach((btn) =>
    btn.addEventListener("click", () => openReportModal("comment", btn.dataset.id))
  );
  document.querySelectorAll(".delete-comment").forEach((btn) =>
    btn.addEventListener("click", () => deleteComment(btn.dataset.id))
  );
}

async function addComment() {
  const body = els.commentText.value.trim();
  if (!body || !state.activePostId) return;

  const v = validateWords(body);
  if (!v.ok) return showAlert(v.msg, "Validation Error");

  try {
    const { error } = await supabase.from("comments").insert({
      post_id: state.activePostId,
      author_id: state.user.id,
      body,
    });
    if (error) throw error;
    els.commentText.value = "";
    await loadComments(state.activePostId);

    // notify post author (if not self)
    if (state.activePost && state.activePost.author_id !== state.user.id) {
      await supabase.from("notifications").insert({
        user_id: state.activePost.author_id,
        kind: "comment",
        ref_id: state.activePostId,
        seen: false,
      });
    }
  } catch (err) {
    showAlert(err.message, "Comment Error");
  }
}

async function deleteComment(commentId) {
  const ok = await showConfirm("Delete this comment?");
  if (!ok) return;
  try {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) throw error;
    await loadComments(state.activePostId);
  } catch (err) {
    showAlert(err.message, "Delete failed");
  }
}

// ─── Likes ──────────────────────────────────────────────────────────────────
async function toggleLike(postId) {
  if (!state.user) return showAuthPage();
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  // Since 'liked_by' is missing from DB, we use the separate 'likes' table as the source of truth
  try {
    const uid = state.user.id;
    // Check if like exists in 'likes' table
    const { data: existingLike } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", uid)
      .single();

    if (existingLike) {
      // remove like
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", uid);
      await supabase
        .from("posts")
        .update({ likes: Math.max(0, (post.likes || 0) - 1) })
        .eq("id", postId);
    } else {
      // add like
      await supabase.from("likes").insert({ post_id: postId, user_id: uid });
      await supabase
        .from("posts")
        .update({ likes: (post.likes || 0) + 1 })
        .eq("id", postId);

      if (post.author_id !== uid) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          kind: "like",
          ref_id: postId,
          seen: false,
        });
      }
    }
    await loadPosts();
  } catch (err) {
    showAlert(err.message, "Like failed");
  }
}

// ─── Notifications ──────────────────────────────────────────────────────────
async function loadNotifications() {
  if (!state.user) return;
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", state.user.id)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) { console.error("loadNotifications:", error); return; }
  state.notifications = data || [];
  renderNotifications();
  updateBadge();
}

function subscribeNotifications() {
  supabase
    .channel("public:notifications")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        if (payload.new.user_id === state.user?.id) loadNotifications();
      }
    )
    .subscribe();
}

function renderNotifications() {
  els.notificationList.innerHTML = "";
  if (!state.notifications.length) {
    els.notificationList.innerHTML = '<div class="empty-state">No notifications.</div>';
    return;
  }
  state.notifications.forEach((n) => {
    const div = document.createElement("div");
    div.className = `notification ${n.seen ? "" : "unseen"}`;
    const icon = n.kind === "comment" ? "💬" : n.kind === "like" ? "❤" : "🔔";
    const label = n.kind === "comment" ? "New comment on your post"
      : n.kind === "like" ? "Someone liked your post"
      : n.kind;
    div.innerHTML = `
      <span>${icon} ${label}</span>
      <span class="time">${timeAgo(n.created_at)}</span>`;
    div.addEventListener("click", async () => {
      if (!n.seen) {
        await supabase.from("notifications").update({ seen: true }).eq("id", n.id);
        n.seen = true;
        renderNotifications();
        updateBadge();
      }
      if (n.ref_id) {
        selectPost(n.ref_id);
        toggleDrawer(false);
      }
    });
    els.notificationList.appendChild(div);
  });
}

function updateBadge() {
  const unseen = state.notifications.filter((n) => !n.seen).length;
  els.notifBadge.textContent = unseen || "";
  els.notifBadge.hidden = !unseen;
}

function toggleDrawer(open) {
  els.drawer.classList.toggle("open", open);
  els.drawer.setAttribute("aria-hidden", !open);
}

// ─── Reports / Admin ────────────────────────────────────────────────────────
function openReportModal(targetType, targetId) {
  if (!state.user) return showAuthPage();
  els.reportTargetType.value = targetType;
  els.reportTargetId.value = targetId;
  els.reportReason.value = "";
  els.modalReport.showModal();
}

async function sendReport() {
  const reason = els.reportReason.value.trim();
  if (!reason) return showAlert("Please describe the issue.");
  try {
    const { error } = await supabase.from("reports").insert({
      target_type: els.reportTargetType.value,
      target_id: els.reportTargetId.value,
      reason,
      reporter_id: state.user.id,
      status: "open",
    });
    if (error) throw error;
    els.modalReport.close();
    showAlert("Report submitted. Thank you.", "Success");
  } catch (err) {
    showAlert(err.message, "Report Error");
  }
}

async function loadAdminReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("loadAdminReports:", error); return; }
  renderAdminReports(data || []);
}

function renderAdminReports(reports) {
  els.adminReports.innerHTML = "";
  if (!reports.length) {
    els.adminReports.innerHTML = '<div class="empty-state">No reports.</div>';
    return;
  }
  reports.forEach((r) => {
    const div = document.createElement("div");
    div.className = `report-card ${r.status}`;
    div.innerHTML = `
      <div class="report-header">
        <span class="badge ${r.status}">${r.status}</span>
        <span>${r.target_type} · ${timeAgo(r.created_at)}</span>
      </div>
      <div class="report-body">${esc(r.reason)}</div>
      <div class="report-meta">Reporter: ${r.reporter_id?.slice(0, 8)}… · Target: ${r.target_id?.slice(0, 8)}…</div>
      <div class="report-actions">
        ${r.status === "open" ? `
          <button class="pill small yellow" data-rid="${r.id}" data-action="resolved">Resolve</button>
          <button class="pill small ghost" data-rid="${r.id}" data-action="dismissed">Dismiss</button>
          <button class="pill small danger" data-rid="${r.id}" data-action="delete-target" data-type="${r.target_type}" data-target="${r.target_id}">Delete content</button>
        ` : ""}
      </div>`;
    els.adminReports.appendChild(div);
  });

  els.adminReports.querySelectorAll("[data-rid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const rid = btn.dataset.rid;
      const action = btn.dataset.action;
      try {
        if (action === "delete-target") {
          const type = btn.dataset.type;
          const target = btn.dataset.target;
          const ok = await showConfirm(`Are you sure you want to delete this ${type}?`);
          if (!ok) return;
          if (type === "post") {
            await supabase.from("comments").delete().eq("post_id", target);
            await supabase.from("likes").delete().eq("post_id", target);
            await supabase.from("posts").delete().eq("id", target);
          } else if (type === "comment") {
            await supabase.from("comments").delete().eq("id", target);
          }
          await supabase.from("reports").update({ status: "resolved" }).eq("id", rid);
        } else {
          await supabase.from("reports").update({ status: action }).eq("id", rid);
        }
        loadAdminReports();
        loadPosts();
      } catch (err) {
        showAlert(err.message, "Admin Error");
      }
    });
  });
}

// ─── Profile ────────────────────────────────────────────────────────────────
function openProfileModal() {
  els.profileName.value = state.profile?.name || "";
  els.modalProfile.showModal();
}

async function saveProfile() {
  const name = els.profileName.value.trim();
  if (!name) return showAlert("Name is required.");
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", state.user.id);
    if (error) throw error;
    state.profile.name = name;
    updateAuthUI();
    els.modalProfile.close();
  } catch (err) {
    showAlert(err.message, "Profile Error");
  }
}

// ─── Chips / Search / Sort ──────────────────────────────────────────────────
function renderChips() {
  els.chipTopics.innerHTML = "";
  TOPICS.forEach((topic) => {
    const chip = document.createElement("button");
    chip.className = `chip ${state.filter.topic === topic ? "active" : ""}`;
    chip.textContent = topic;
    chip.addEventListener("click", () => {
      state.filter.topic = state.filter.topic === topic ? null : topic;
      renderChips();
      renderPosts();
      // If we're on detail view, go back to feed
      if (!els.feedView.hidden === false) showFeedView();
    });
    els.chipTopics.appendChild(chip);
  });
}

function renderHotPosts() {
  if (!els.hotPosts) return;
  // Get top 5 posts by likes
  const hot = [...state.posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);
  els.hotPosts.innerHTML = "";
  if (!hot.length) {
    els.hotPosts.innerHTML = '<div class="empty-state" style="padding:16px 0;font-size:13px;">No trending posts yet.</div>';
    return;
  }
  hot.forEach((p) => {
    const div = document.createElement("div");
    div.className = "hot-post";
    div.innerHTML = `
      <div class="hot-post-title">${esc(p.title)}</div>
      <div class="hot-post-stats">
        <span class="hot-post-stat">▲ ${p.likes || 0}</span>
        <span class="hot-post-stat">💬 ${p.comment_count || 0}</span>
      </div>`;
    div.addEventListener("click", () => selectPost(p.id));
    els.hotPosts.appendChild(div);
  });
}

function renderTagSuggestions() {
  const value = els.postTags.value.trim();
  const parts = value.split(",").map(p => p.trim());
  const currentTag = parts[parts.length - 1].toLowerCase();

  if (!currentTag) {
    els.tagSuggestions.hidden = true;
    return;
  }

  // Find matches among existing TOPICS
  const matches = TOPICS.filter(t => t.toLowerCase().includes(currentTag) && !parts.slice(0, -1).includes(t));
  
  els.tagSuggestions.innerHTML = "";
  
  if (matches.length > 0 || currentTag.length > 1) {
    els.tagSuggestions.hidden = false;
    
    matches.forEach(m => {
      const div = document.createElement("div");
      div.className = "tag-suggestion";
      div.textContent = m;
      div.onclick = () => {
        parts[parts.length - 1] = m;
        els.postTags.value = parts.join(", ") + ", ";
        els.tagSuggestions.hidden = true;
        els.postTags.focus();
      };
      els.tagSuggestions.appendChild(div);
    });

    // Option to add new tag if not in TOPICS
    if (!TOPICS.map(t => t.toLowerCase()).includes(currentTag)) {
      const addDiv = document.createElement("div");
      addDiv.className = "tag-suggestion add-btn";
      addDiv.textContent = `+ Add as new command: "${parts[parts.length - 1]}"`;
      addDiv.onclick = () => {
        // Validation check before adding
        const v = validateCommand(parts[parts.length - 1]);
        if (!v.ok) return showAlert(v.msg, "Invalid Command");
        
        els.postTags.value = parts.join(", ") + ", ";
        els.tagSuggestions.hidden = true;
        els.postTags.focus();
      };
      els.tagSuggestions.appendChild(addDiv);
    }
  } else {
    els.tagSuggestions.hidden = true;
  }
}

// ─── Utilities ──────────────────────────────────────────────────────────────
function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Simple word & command validation
function validateWords(text) {
  if (!text) return false;
  // Check for minimum length
  if (text.length < 3) return { ok: false, msg: "Word must be at least 3 characters long." };
  // Placeholder for forbidden words
  const forbidden = ["spam", "advert", "fake"]; 
  const found = forbidden.find(w => text.toLowerCase().includes(w));
  if (found) return { ok: false, msg: `The word "${found}" is not allowed.` };
  return { ok: true };
}

function validateCommand(tag) {
  if (!tag) return false;
  // Commands (tags) must be alpha-numeric and within TOPICS or added
  if (!/^[a-zA-Z0-9\s/]+$/.test(tag)) return { ok: false, msg: "Commands/Tags should only contain letters and numbers." };
  return { ok: true };
}

function showAlert(message, title = "Alert") {
  els.confirmTitle.textContent = title;
  els.confirmMessage.textContent = message;
  els.btnConfirmCancel.hidden = true;
  els.btnConfirmOk.textContent = "OK";
  els.btnConfirmOk.onclick = () => els.modalConfirm.close();
  els.modalConfirm.showModal();
}

function showConfirm(message, title = "Confirm") {
  return new Promise((resolve) => {
    els.confirmTitle.textContent = title;
    els.confirmMessage.textContent = message;
    els.btnConfirmCancel.hidden = false;
    els.btnConfirmOk.textContent = "Confirm";
    els.btnConfirmOk.onclick = () => { els.modalConfirm.close(); resolve(true); };
    els.btnConfirmCancel.onclick = () => { els.modalConfirm.close(); resolve(false); };
    els.modalConfirm.showModal();
  });
}

function esc(s) {
  if (!s) return "";
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Event wiring ───────────────────────────────────────────────────────────
function wireEvents() {
  els.btnAuth?.addEventListener("click", showAuthPage);
  els.btnSignout?.addEventListener("click", signOutUser);
  els.btnProfile?.addEventListener("click", openProfileModal);
  els.btnSaveProfile?.addEventListener("click", (e) => { e.preventDefault(); saveProfile(); });
  els.btnNewPost?.addEventListener("click", openNewPost);
  els.btnSavePost?.addEventListener("click", savePost);
  els.btnComment?.addEventListener("click", addComment);
  els.btnNotifications?.addEventListener("click", () => { toggleDrawer(true); loadNotifications(); });
  els.btnCloseDrawer?.addEventListener("click", () => toggleDrawer(false));
  els.btnSendReport?.addEventListener("click", (e) => { e.preventDefault(); sendReport(); });
  els.btnAdmin?.addEventListener("click", () => {
    els.adminPanel.hidden = !els.adminPanel.hidden;
    if (!els.adminPanel.hidden) loadAdminReports();
  });
  els.btnCloseAdmin?.addEventListener("click", () => { els.adminPanel.hidden = true; });
  els.adminPanel?.addEventListener("click", (e) => {
    if (e.target === els.adminPanel) els.adminPanel.hidden = true;
  });

  // Back button
  els.btnBack?.addEventListener("click", showFeedView);

  // Tag suggestions (was laggy)
  const debouncedTags = debounce(() => {
    renderTagSuggestions();
  }, 200);
  els.postTags?.addEventListener("input", debouncedTags);

  // Close suggestions on blur (give click chance)
  els.postTags?.addEventListener("blur", () => {
    setTimeout(() => { if (els.tagSuggestions) els.tagSuggestions.hidden = true; }, 200);
  });

  // Search input (live search on Enter or on input) with debounce
  const debouncedSearch = debounce(() => {
    state.filter.search = els.searchInput.value.trim();
    renderPosts();
  }, 300);
  els.searchInput?.addEventListener("input", debouncedSearch);

  // Sort pills
  document.querySelectorAll(".sort-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sort-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.filter.sort = btn.dataset.sort;
      renderPosts();
    });
  });
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────
let hasBootstrapped = false;

async function handleSignIn(user) {
  state.user = user;
  try {
    await loadProfile();
  } catch (e) {
    console.warn("Profile load failed, using fallback:", e);
    state.profile = { name: user.email?.split("@")[0] || "User", role: "user" };
  }
  // ALWAYS transition to dashboard, even if profile load hiccups
  updateAuthUI();
  console.log("✅ Signed in as", user.email);

  // Load data in background (don't block UI)
  loadPosts().catch((e) => console.warn("loadPosts:", e));
  loadNotifications().catch((e) => console.warn("loadNotifications:", e));

  if (!hasBootstrapped) {
    hasBootstrapped = true;
    subscribePosts();
    subscribeComments();
    subscribeNotifications();
  }
}

async function init() {
  console.log("⏳ Connecting to Supabase…");
  wireEvents();
  renderChips();

  // 1. Check existing session immediately
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    console.log("✅ Existing session for", session.user.email);
    await handleSignIn(session.user);
  } else {
    console.log("ℹ No active session — showing auth page");
    showAuthPage();
  }

  // 2. Listen for future auth changes (sign-in, sign-out, token refresh)
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("🔑 Auth event:", event);
    if (event === "SIGNED_OUT") {
      state.user = null;
      state.profile = null;
      hasBootstrapped = false;
      showAuthPage();
    } else if (session?.user && event !== "INITIAL_SESSION") {
      await handleSignIn(session.user);
    }
  });
}

init();
