import React, {
  useState,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useMemo,
} from "react";
import { getAuth } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import "./KanbanBoard.css";

import { KanbanContext } from "./KanbanContext";

const initialState = {
  todo: [],
  inProgress: [],
  done: [],
};

function kanbanReducer(state, action) {
  switch (action.type) {
    case "LOAD_TASKS": {
      return {
        ...state,
        ...action.payload,
      };
    }
   case "MOVE_CARD": {
  const { card, from, to, targetId } = action.payload;

  const updatedCard = { ...card, status: to }; 
  const newFromList = state[from].filter((c) => c.id !== card.id);
  const newToList = [...state[to].filter((c) => c.id !== card.id)];

  const insertAtIndex = newToList.findIndex((c) => c.id === targetId);
  if (insertAtIndex === -1) {
    newToList.push(updatedCard);
  } else {
    newToList.splice(insertAtIndex, 0, updatedCard);
  }

  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (currentUser) {
    currentUser.getIdToken().then((token) => {
      fetch(`http://localhost:5000/api/tasks/${card.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: to }),
      }).catch((err) => {
        console.error("Failed to update status:", err);
      });
    });
  }

  return {
    ...state,
    [from]: newFromList,
    [to]: newToList,
  };
}
    case "ADD_TASK": {
      const newTask = {
        id: Date.now().toString(),
        text: action.payload.text,
        description: action.payload.description,
        dueDate: action.payload.dueDate,
        priority: action.payload.priority,
        sharedWith: action.payload.sharedWith || [],
        status: "todo",
      };

      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        currentUser.getIdToken().then(token => {
          fetch("http://localhost:5000/api/tasksa", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: currentUser.uid,
              text: newTask.text,
              description: newTask.description,
              status: newTask.status,
              priority: newTask.priority,
              due_date: newTask.dueDate,
            }),
          }).catch(console.error);
        });
      }

      toast.success("Task added");
      return {
        ...state,
        todo: [...state.todo, newTask],
      };
    }
    case "DELETE_TASK": {
      const { cardId, from } = action.payload;
      toast("Task deleted", { icon: "🗑️" });
      return {
        ...state,
        [from]: state[from].filter((card) => card.id !== cardId),
      };
    }
    case "EDIT_CARD": {
      const { cardId, from, newText, sharedWith } = action.payload;
      toast.success("Task updated");
      return {
        ...state,
        [from]: state[from].map((card) =>
          card.id === cardId ? { ...card, text: newText, sharedWith } : card
        ),
      };
    }
    default:
      return state;
  }
}

function KanbanProvider({ children }) {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [hoverTargetId, setHoverTargetId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      fetch(`http://localhost:5000/api/tasks?user_id=${currentUser.uid}`)
        .then((res) => res.json())
        .then((data) => {
          const organized = {
            todo: [],
            inProgress: [],
            done: [],
          };
          if (Array.isArray(data)) {
            data.forEach((task) => {
              const status = task.status || "todo";
              organized[status].push(task);
            });
            dispatch({ type: "LOAD_TASKS", payload: organized });
          } else {
            console.error("Failed to load tasks:", data);
          }
        })
        .catch(console.error);
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      draggedCardId,
      setDraggedCardId,
      hoverTargetId,
      setHoverTargetId,
    }),
    [state, draggedCardId, hoverTargetId]
  );

  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>;
}

function TaskInput() {
  const { dispatch } = useContext(KanbanContext);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [sharedWith, setSharedWith] = useState("");

  const [formData, setFormData] = useState({
    text: '',
    description: '',
    status: 'todo',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please log in first.");
      return;
    }

    const task = {
      user_id: user.uid,
      text: formData.text,
      description: formData.description,
      status: formData.status,
      due_date: dueDate,
      priority,
      shared_with: sharedWith, 
    };

    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      const data = await res.json();
      dispatch({ type: "ADD_TASK", payload: data });
      toast.success("Task added!");

      // reset form
      setFormData({ text: '', description: '', status: 'todo' });
      setDueDate("");
      setPriority("Medium");
      setSharedWith("");
    } catch (error) {
      console.error("Failed to store task:", error);
      toast.error("DB error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <input
        type="text"
        name="text"
        className="task-input"
        value={formData.text}
        onChange={handleInputChange}
        placeholder="Task Title"
        required
      />
      <textarea
        name="description"
        className="task-input"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Description"
      />
      <input
        type="date"
        className="task-input"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <select
        className="task-input"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
      <select
        name="status"
        className="task-input"
        value={formData.status}
        onChange={handleInputChange}
      >
        <option value="todo">To Do</option>
        <option value="inprogress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <input
        type="text"
        className="task-input"
        value={sharedWith}
        onChange={(e) => setSharedWith(e.target.value)}
        placeholder="Share with (comma-separated emails)"
      />
      <button type="submit" className="add-btn">
        Add Task
      </button>
    </form>
  );
}

function Card({ card, from, isFirst}) {
  const { dispatch, draggedCardId, setDraggedCardId, hoverTargetId, setHoverTargetId } = useContext(KanbanContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(card.text);
  const [sharedWith, setSharedWith] = useState((card.sharedWith || []).join(", "));
  const inputRef = useRef(null);

  const handleDragStart = (e) => {
    if (!isEditing) {
      setDraggedCardId(card.id);
      e.dataTransfer.setData("card", JSON.stringify({ card, from }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (draggedCardId !== card.id) {
      setHoverTargetId(card.id);
    }
  };

  const handleDragLeave = () => {
    if (hoverTargetId !== card.id) {
      setHoverTargetId(null);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleEditSubmit = () => {
    const trimmed = editedText.trim();
    const shared = sharedWith.split(",").map((s) => s.trim()).filter(Boolean);
    if (trimmed && (trimmed !== card.text || shared.join() !== (card.sharedWith || []).join())) {
      dispatch({
        type: "EDIT_CARD",
        payload: { cardId: card.id, from, newText: trimmed, sharedWith: shared },
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleEditSubmit();
    } else if (e.key === "Escape") {
      setEditedText(card.text);
      setSharedWith((card.sharedWith || []).join(", "));
      setIsEditing(false);
    }
  };

  const handleStatusChange = async (e) => {
  const newStatus = e.target.value;

  if (newStatus !== card.status) {
    dispatch({
      type: "MOVE_CARD",
      payload: {
        card,
        from,
        to: newStatus,
        targetId: null, // or you can insert logic if you want to move to a specific position
      },
    });

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        await fetch(`http://localhost:5000/api/tasks/${card.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });
        toast.success("Status updated!");
      } catch (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to update task status");
      }
    }
  }
};

  const handleDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("card"));
    dispatch({
      type: "MOVE_CARD",
      payload: {
        card: data.card,
        from: data.from,
        to: from,
        targetId: card.id,
      },
    });
    setDraggedCardId(null);
    setHoverTargetId(null);
  };

  return (
    <div
      className={`card ${hoverTargetId === card.id ? "drop-indicator" : ""} ${isFirst ? "first-card" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isEditing ? (
        <>
          <input
            type="text"
            ref={inputRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            className="edit-input"
          />
          <input
            type="text"
            value={sharedWith}
            onChange={(e) => setSharedWith(e.target.value)}
            onKeyDown={handleKeyDown}
            className="edit-input"
            placeholder="Share with"
          />
        </>
      ) : (
        <>
          <div className="card-text">{card.text}</div>
<div className="card-description">{card.description}</div>
<div className="card-meta">
  <span className="due-date">📅 {card.dueDate}</span>
  <span className="priority">⭐ {card.priority}</span>
</div>
{card.sharedWith && card.sharedWith.length > 0 && (
  <div className="shared-with">👥 {card.sharedWith.join(", ")}</div>
)}

<select
  value={card.status}
  onChange={handleStatusChange}
  className="task-input"
>
  <option value="todo">To Do</option>
  <option value="inProgress">In Progress</option>
  <option value="done">Done</option>
</select>
        </>
      )}
    </div>
  );
}

function Column({ title, columnKey, className }) {
  const { state, dispatch, setDraggedCardId } = useContext(KanbanContext);

  const handleDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("card"));
    if (data.from !== columnKey) {
      dispatch({
        type: "MOVE_CARD",
        payload: { card: data.card, from: data.from, to: columnKey, targetId: null },
      });
    }
    setDraggedCardId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className={`column ${className}`} onDrop={handleDrop} onDragOver={handleDragOver}>
      <h3>{title}</h3>
      {state[columnKey].map((card, index) => (
        <Card key={card.id} card={card} from={columnKey} isFirst={index === 0} />
      ))}
    </div>
  );
}

function TrashDropZone({ onCardDrop }) {
  const { setDraggedCardId } = useContext(KanbanContext);

  const handleDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("card"));
    onCardDrop(data);
    setDraggedCardId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="trash-drop-zone" onDrop={handleDrop} onDragOver={handleDragOver}>
      🗑️ Drag here to delete
    </div>
  );
}

function KanbanBoard() {
  const { dispatch } = useContext(KanbanContext);
  const [modalData, setModalData] = useState(null);

  const handleConfirmDelete = () => {
    if (modalData) {
      dispatch({
        type: "DELETE_TASK",
        payload: { cardId: modalData.card.id, from: modalData.from },
      });
      setModalData(null);
    }
  };

  return (
    <div className="board-container">
      <Toaster />
      <TaskInput />
      <div className="board">
        <Column title="📝 To-Do" columnKey="todo" className="column-red" />
        <Column title="⏳ In Progress" columnKey="inProgress" className="column-yellow" />
        <Column title="✅ Done" columnKey="done" className="column-green" />
        <TrashDropZone onCardDrop={setModalData} />
      </div>
      {modalData && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Are you sure you want to delete this task: <strong>{modalData.card.text}</strong>?</p>
            <div className="modal-buttons">
              <button className="delete-btn" onClick={handleConfirmDelete}>Yes, Delete</button>
              <button className="cancel-btn" onClick={() => setModalData(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanBoardWrapper() {
  return (
    <KanbanProvider>
      <KanbanBoard />
    </KanbanProvider>
  );
}

export default KanbanBoardWrapper;
