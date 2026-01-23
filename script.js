// ======================================================
// 1. CEK LOGIN & KONFIGURASI
// ======================================================
const token = localStorage.getItem("token");
const currentUser = localStorage.getItem("username");

if (!token) {
  window.location.href = "login.html";
}

// Update Nama User
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
// 2. STATE & DATA
// ======================================================
let tasks = [];
let editId = null;

// Kategori default
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

// ======================================================
// 3. DOM ELEMENTS
// ======================================================
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

// Edit Kategori Elements
const editCatWrapper = document.querySelector(".edit-category");
const editCatInput = document.getElementById("edit-cat-input");
const editCatImg = document.getElementById("edit-cat-img");
const saveEditBtn = document.querySelector(".save-edit-btn");
const cancelEditBtn = document.querySelector(".cancel-edit-btn");
let categoryToEdit = null;

// ======================================================
// 4. HELPER FUNCTIONS
// ======================================================
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

const saveLocalCategories = () => {
  localStorage.setItem("categories", JSON.stringify(categories));
};

const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

// ======================================================
// 5. API REQUESTS
// ======================================================
// ======================================================
// UPDATE BAGIAN FETCH TASKS INI
// ======================================================
const fetchTasks = async () => {
  try {
    // Tambahkan timestamp biar browser GAK ngebaca cache lama
    const response = await fetch(`${API_URL}/tasks?t=${new Date().getTime()}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 403 || response.status === 401) {
      logout();
      return;
    }

    const data = await response.json();

    // --- DEBUG: Lihat apa yang dikirim backend ---
    console.log("[GET] Data dari Server:", data);

    tasks = data.map((dbTask) => {
      // LOGIKA "ROBUST" (Tahan Banting)
      // Apapun formatnya (1, "true", "t", true), kita paksa jadi Boolean TRUE
      const isCompleted =
        dbTask.is_completed === true ||
        dbTask.is_completed === "true" ||
        dbTask.is_completed === 1 ||
        dbTask.is_completed === "t";

      return {
        id: dbTask.task_id,
        task: dbTask.task_name,
        category: dbTask.category,
        date: dbTask.task_date ? dbTask.task_date.split("T")[0] : "",
        completed: isCompleted, // <--- Pakai hasil konversi di atas
      };
    });

    renderTasks();
    updateTotals();
  } catch (err) {
    console.error("Gagal ambil task:", err);
  }
};

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
      // MODE EDIT TASK
      // Kita perlu cari status completed yang lama biar gak kereset
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
      // MODE CREATE TASK
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

    // Reset Form
    taskInput.value = "";
    dateInput.value = "";
    toggleAddTaskForm();
    fetchTasks();
  } catch (err) {
    console.error("Error save task:", err);
    alert("Gagal menyimpan task!");
  }
};

// ======================================================
// 6. RENDER UI FUNCTIONS
// ======================================================
const toggleScreen = () => {
  wrapper.classList.toggle("show-category");
};

const toggleAddTaskForm = () => {
  addTaskWrapper.classList.toggle("active");
  blackBackdrop.classList.toggle("active");
  addTaskBtn.classList.toggle("active");
};

const closeEditModal = () => {
  editCatWrapper.classList.remove("active");
  blackBackdrop.classList.remove("active");
};

const updateTotals = () => {
  const categoryTasks = tasks.filter(
    (task) =>
      task.category.toLowerCase() === selectedCategory.title.toLowerCase(),
  );
  numTasks.innerHTML = `${categoryTasks.length} Tasks`;
  totalTasks.innerHTML = tasks.length;
};

const renderCategories = () => {
  categoriesContainer.innerHTML = "";
  categories.forEach((category) => {
    const categoryTasks = tasks.filter(
      (task) => task.category.toLowerCase() === category.title.toLowerCase(),
    );
    const div = document.createElement("div");
    div.classList.add("category");

    div.addEventListener("click", (e) => {
      if (e.target.closest(".options")) return;

      if (!isEditMode) {
        wrapper.classList.toggle("show-category");
        selectedCategory = category;
        updateTotals();
        categoryTitle.innerHTML = category.title;
        categoryImg.src = `images/${category.img}`;
        renderTasks();
      }
    });

    div.innerHTML = `
      <div class="left">
        <img src="images/${category.img}" alt="${category.title}" />
        <div class="content">
          <h1>${category.title}</h1>
          <p>${categoryTasks.length} Tasks</p>
        </div>
      </div>
      <div class="options">
         <div class="edit-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px; cursor: pointer;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
         </div>
      </div>
    `;

    const editBtn = div.querySelector(".edit-btn");
    editBtn.addEventListener("click", () => {
      categoryToEdit = category;
      editCatInput.value = category.title;
      editCatImg.value = category.img;
      editCatWrapper.classList.add("active");
      blackBackdrop.classList.add("active");
    });

    categoriesContainer.appendChild(div);
  });
};

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
      checkbox.checked = task.completed;
      // PENTING: Kita hapus event listener di sini, dipindah ke Event Delegation di bawah

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

      div.innerHTML += `
        <div class="task-options">
          <div class="edit">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <div class="delete">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
        </div>
      `;

      tasksContainer.appendChild(div);

      const editBtn = div.querySelector(".edit");
      editBtn.addEventListener("click", () => {
        taskInput.value = task.task;
        categorySelect.value = task.category.toLowerCase();
        dateInput.value = task.date;
        editId = task.id;
        addBtn.innerText = "Save";
        document.querySelector(".add-task .heading").innerText = "Edit Task";
        toggleAddTaskForm();
      });

      const deleteBtn = div.querySelector(".delete");
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Yakin mau hapus?")) return;
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

// ======================================================
// 7. DRAG & DROP + EDIT KATEGORI
// ======================================================
let sortableInstance;
const initSortable = () => {
  if (!categoriesContainer) return;
  sortableInstance = new Sortable(categoriesContainer, {
    animation: 200,
    delay: 0,
    ghostClass: "sortable-ghost",
    disabled: true,
    onEnd: (evt) => {
      const itemToMove = categories[evt.oldIndex];
      categories.splice(evt.oldIndex, 1);
      categories.splice(evt.newIndex, 0, itemToMove);
      saveLocalCategories();
    },
  });
};

const editCatBtn = document.getElementById("edit-cat-btn");
let isEditMode = false;
if (editCatBtn) {
  editCatBtn.addEventListener("click", () => {
    isEditMode = !isEditMode;
    if (isEditMode) {
      sortableInstance.option("disabled", false);
      editCatBtn.innerText = "Done";
      editCatBtn.style.color = "#28a745";
      document
        .querySelectorAll(".category")
        .forEach((el) => (el.style.border = "1px dashed #5865f2"));
    } else {
      sortableInstance.option("disabled", true);
      editCatBtn.innerText = "Edit Order";
      editCatBtn.style.color = "#5865f2";
      document
        .querySelectorAll(".category")
        .forEach((el) => (el.style.border = "none"));
    }
  });
}

saveEditBtn.addEventListener("click", async () => {
  const newName = editCatInput.value;
  const newImg = editCatImg.value;
  const oldName = categoryToEdit.title;

  if (!newName) return alert("Nama kategori tidak boleh kosong!");

  try {
    if (newName !== oldName) {
      await fetch(`${API_URL}/categories`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ old_name: oldName, new_name: newName }),
      });
    }
    categoryToEdit.title = newName;
    categoryToEdit.img = newImg;
    saveLocalCategories();
    renderCategories();

    if (selectedCategory === categoryToEdit) {
      categoryTitle.innerHTML = newName;
      categoryImg.src = `images/${newImg}`;
    }
    tasks.forEach((task) => {
      if (task.category.toLowerCase() === oldName.toLowerCase()) {
        task.category = newName;
      }
    });
    closeEditModal();
  } catch (err) {
    console.error(err);
    alert("Gagal mengupdate kategori");
  }
});

cancelEditBtn.addEventListener("click", closeEditModal);

// ======================================================
// 8. EVENT LISTENER BUTTONS UTAMA
// ======================================================
menuBtn.addEventListener("click", toggleScreen);
backBtn.addEventListener("click", toggleScreen);
addTaskBtn.addEventListener("click", toggleAddTaskForm);
blackBackdrop.addEventListener("click", () => {
  if (editCatWrapper.classList.contains("active")) {
    closeEditModal();
  } else {
    toggleAddTaskForm();
  }
});
addBtn.addEventListener("click", addTask);
cancelBtn.addEventListener("click", () => {
  toggleAddTaskForm();
  taskInput.value = "";
  dateInput.value = "";
  editId = null;
  addBtn.innerText = "Add";
  document.querySelector(".add-task .heading").innerText = "Add Task";
});

categories.forEach((category) => {
  const option = document.createElement("option");
  option.value = category.title.toLowerCase();
  option.textContent = category.title;
  categorySelect.appendChild(option);
});

// ======================================================
// 9. EVENT DELEGATION (CHECKBOX FIX) - TARUH PALING BAWAH
// ======================================================
// Ini CCTV global yang memantau setiap klik di area tasks
tasksContainer.addEventListener("change", async (e) => {
  // Cek apakah yang diklik adalah input checkbox
  if (e.target.tagName === "INPUT" && e.target.type === "checkbox") {
    const checkbox = e.target;
    const taskId = parseInt(checkbox.id); // ID Task
    const newStatus = checkbox.checked; // Status Baru

    console.log(
      `[CCTV] Klik pada Task ID: ${taskId}, Status Jadi: ${newStatus}`,
    );

    // Cari data task lengkap di memory lokal
    const currentTask = tasks.find((t) => t.id === taskId);

    if (!currentTask) {
      console.error("Task tidak ditemukan di memory!");
      return;
    }

    try {
      // Kirim request ke backend
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          task_name: currentTask.task,
          category: currentTask.category,
          task_date: currentTask.date,
          is_completed: newStatus, // Kirim status baru
        }),
      });

      if (!response.ok) throw new Error("Gagal update di server");

      const result = await response.json();
      console.log("[API] Sukses update:", result);

      // Update data lokal biar sinkron tanpa fetch ulang (opsional)
      currentTask.completed = newStatus;
      updateTotals();
    } catch (err) {
      console.error("[ERROR] Gagal save:", err);
      checkbox.checked = !newStatus; // Balikin centang kalau error
      alert("Gagal menyimpan status. Cek koneksi.");
    }
  }
});

// ======================================================
// 10. INITIALIZATION
// ======================================================
fetchTasks();
initSortable();
