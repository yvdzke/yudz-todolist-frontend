// ======================================================
// 1. SETUP & CONFIG
// ======================================================
const token = localStorage.getItem("token");
const currentUser = localStorage.getItem("username");

if (!token) {
  window.location.href = "login.html";
}

const userNameDisplay = document.getElementById("user-name-display");
if (userNameDisplay && currentUser) {
  userNameDisplay.innerText = currentUser;
}

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://yudz-todolist-backend.vercel.app/api";

// ======================================================
// 2. STATE
// ======================================================
let tasks = [];
let editId = null;

let categories = JSON.parse(localStorage.getItem("categories")) || [
  { title: "Personal", img: "boy.png" },
  { title: "Work", img: "briefcase.png" },
  { title: "Shopping", img: "shopping.png" },
  { title: "Coding", img: "web-design.png" },
  { title: "Health", img: "healthcare.png" },
  { title: "Fitness", img: "dumbbell.png" },
  { title: "Education", img: "education.png" },
  { title: "Finance", img: "saving.png" },
  { title: "Daily Routine", img: "calendar.png" },
];

let selectedCategory = categories[0];

// DOM Elements
const wrapper = document.querySelector(".wrapper");
const menuBtn = document.querySelector(".menu-btn");
const backBtn = document.querySelector(".back-btn");
const addTaskBtn = document.querySelector(".add-task-btn");
const addTaskWrapper = document.querySelector(".add-task");
const blackBackdrop = document.querySelector(".black-backdrop");
const cancelBtn = document.querySelector(".cancel-btn");
const addBtn = document.querySelector(".add-btn");
const taskInput = document.getElementById("task-input");
const categorySelect = document.getElementById("category-select");
const dateInput = document.getElementById("date-input");
const categoriesContainer = document.querySelector(".categories");
const tasksContainer = document.querySelector(".tasks");
const categoryTitle = document.getElementById("category-title");
const totalTasks = document.getElementById("total-tasks");
const numTasks = document.getElementById("num-tasks");
const categoryImg = document.getElementById("category-img");

// Helper
const getHeaders = () => {
  return {
    "Content-Type": "application/json",
    jwt_token: localStorage.getItem("token"),
  };
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

// ======================================================
// 3. FETCH DATA (THE FIX FOR REFRESH BUG)
// ======================================================
const fetchTasks = async () => {
  try {
    // Tambah ?t=... biar browser gak pake data cache lama
    const response = await fetch(`${API_URL}/tasks?t=${new Date().getTime()}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 403 || response.status === 401) {
      logout();
      return;
    }

    const data = await response.json();

    tasks = data.map((dbTask) => {
      // LOGIKA "PINTAR": Baca True dalam segala format
      const isCompleted =
        dbTask.is_completed === true ||
        dbTask.is_completed === "true" ||
        dbTask.is_completed === "t" ||
        dbTask.is_completed === 1;

      return {
        id: dbTask.task_id,
        task: dbTask.task_name,
        category: dbTask.category,
        date: dbTask.task_date ? dbTask.task_date.split("T")[0] : "",
        completed: isCompleted, // Hasil Boolean bersih
      };
    });

    renderTasks();
    updateTotals();
  } catch (err) {
    console.error("Gagal ambil task:", err);
  }
};

// ======================================================
// 4. ADD TASK FUNCTION
// ======================================================
const addTask = async (e) => {
  e.preventDefault();
  const taskText = taskInput.value;
  const category = categorySelect.value;
  const date = dateInput.value;

  if (taskText === "") {
    alert("Please enter a task");
    return;
  }

  try {
    if (editId) {
      // MODE EDIT
      const oldTask = tasks.find((t) => t.id === editId);
      const oldStatus = oldTask ? oldTask.completed : false;

      await fetch(`${API_URL}/tasks/${editId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          task_name: taskText,
          category: category,
          task_date: date,
          is_completed: oldStatus,
        }),
      });
      editId = null;
      addBtn.innerText = "Add";
      document.querySelector(".add-task .heading").innerText = "Add Task";
    } else {
      // MODE CREATE
      await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          task_name: taskText,
          category: category,
          task_date: date,
        }),
      });
    }

    taskInput.value = "";
    dateInput.value = "";
    toggleAddTaskForm();
    fetchTasks();
  } catch (err) {
    console.error("Error save:", err);
  }
};

// ======================================================
// 5. RENDER FUNCTIONS
// ======================================================
const renderTasks = () => {
  tasksContainer.innerHTML = "";
  const categoryTasks = tasks.filter(
    (task) =>
      task.category.toLowerCase() === selectedCategory.title.toLowerCase(),
  );

  if (categoryTasks.length === 0) {
    tasksContainer.innerHTML = `<p class="no-tasks">No tasks added for this category</p>`;
  } else {
    categoryTasks.forEach((task) => {
      const div = document.createElement("div");
      div.classList.add("task-wrapper");

      const label = document.createElement("label");
      label.classList.add("task");
      label.setAttribute("for", task.id);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = task.id;

      // PENTING: Pakai property 'completed' yang sudah diolah di fetchTasks
      checkbox.checked = task.completed;

      label.innerHTML = `
        <span class="checkmark">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
        <div class="task-text-wrapper">
          <p>${task.task}</p>
          ${task.date ? `<small class="task-date">📅 ${formatDate(task.date)}</small>` : ""}
        </div>
      `;

      label.prepend(checkbox);
      div.prepend(label);

      // Tombol Edit & Delete
      div.innerHTML += `
        <div class="task-options">
          <div class="edit"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></div>
          <div class="delete"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></div>
        </div>
      `;

      tasksContainer.appendChild(div);

      // Event Edit
      div.querySelector(".edit").addEventListener("click", () => {
        taskInput.value = task.task;
        categorySelect.value = task.category.toLowerCase();
        dateInput.value = task.date;
        editId = task.id;
        addBtn.innerText = "Save";
        document.querySelector(".add-task .heading").innerText = "Edit Task";
        toggleAddTaskForm();
      });

      // Event Delete
      div.querySelector(".delete").addEventListener("click", async () => {
        if (!confirm("Hapus task ini?")) return;
        try {
          await fetch(`${API_URL}/tasks/${task.id}`, {
            method: "DELETE",
            headers: getHeaders(),
          });
          fetchTasks();
        } catch (err) {
          console.error(err);
        }
      });
    });
  }
  renderCategories();
  updateTotals();
};

const renderCategories = () => {
  categoriesContainer.innerHTML = "";
  categories.forEach((category) => {
    const categoryTasks = tasks.filter(
      (t) => t.category.toLowerCase() === category.title.toLowerCase(),
    );
    const div = document.createElement("div");
    div.classList.add("category");
    div.innerHTML = `
      <div class="left">
        <img src="images/${category.img}" alt="${category.title}" />
        <div class="content"><h1>${category.title}</h1><p>${categoryTasks.length} Tasks</p></div>
      </div>
    `;
    div.addEventListener("click", () => {
      wrapper.classList.toggle("show-category");
      selectedCategory = category;
      categoryTitle.innerHTML = category.title;
      categoryImg.src = `images/${category.img}`;
      updateTotals();
      renderTasks();
    });
    categoriesContainer.appendChild(div);
  });
};

const updateTotals = () => {
  const categoryTasks = tasks.filter(
    (t) => t.category.toLowerCase() === selectedCategory.title.toLowerCase(),
  );
  numTasks.innerHTML = `${categoryTasks.length} Tasks`;
  totalTasks.innerHTML = tasks.length;
};

// ======================================================
// 6. EVENT DELEGATION (CCTV CHECKBOX)
// ======================================================
tasksContainer.addEventListener("change", async (e) => {
  if (e.target.tagName === "INPUT" && e.target.type === "checkbox") {
    const checkbox = e.target;
    const taskId = parseInt(checkbox.id);
    const newStatus = checkbox.checked;

    console.log(`[CCTV] Klik Task ID: ${taskId} -> Status: ${newStatus}`);

    // Cari data di lokal
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    // Optimistic Update (Biar UI cepet)
    currentTask.completed = newStatus;

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          task_name: currentTask.task,
          category: currentTask.category,
          task_date: currentTask.date,
          is_completed: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Gagal");
      console.log("✅ Sukses Update DB");
    } catch (err) {
      console.error("Gagal save:", err);
      checkbox.checked = !newStatus; // Balikin kalau error
      currentTask.completed = !newStatus;
      alert("Gagal koneksi server!");
    }
  }
});

// ======================================================
// 7. INIT
// ======================================================
menuBtn.addEventListener("click", () =>
  wrapper.classList.toggle("show-category"),
);
backBtn.addEventListener("click", () =>
  wrapper.classList.toggle("show-category"),
);
addTaskBtn.addEventListener("click", toggleAddTaskForm);
blackBackdrop.addEventListener("click", toggleAddTaskForm);
addBtn.addEventListener("click", addTask);
cancelBtn.addEventListener("click", toggleAddTaskForm);

categories.forEach((c) => {
  const option = document.createElement("option");
  option.value = c.title.toLowerCase();
  option.textContent = c.title;
  categorySelect.appendChild(option);
});

fetchTasks();
