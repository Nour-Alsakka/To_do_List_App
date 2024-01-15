import "./app.css";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Route, Routes, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faTriangleExclamation,
    faPenToSquare,
    faSquareXmark,
    faCheckDouble,
    faHeart,
} from "@fortawesome/free-solid-svg-icons";

const TasksContext = createContext();

export default function App() {
    const [tasks, setTasks] = useState(
        () => JSON.parse(localStorage.getItem("to_do_list_tasks")) || []
    );
    const [openAdd, setOpenAdd] = useState(false);

    useEffect(
        function () {
            localStorage.setItem("to_do_list_tasks", JSON.stringify(tasks));
        },
        [tasks]
    );

    function handleToggleOpenAdd() {
        setOpenAdd((x) => !x);
    }
    function handleAddTask(newTask) {
        setTasks((tasks) => [...tasks, newTask]);
    }

    function handleChecked(id) {
        setTasks((tasks) =>
            tasks.map((task) =>
                task.id === id ? { ...task, isDone: !task.isDone } : task
            )
        );
    }
    function handleEdit(id, title, date) {
        setTasks((tasks) =>
            tasks.map((task) =>
                task.id === id ? { ...task, title: title, date: date } : task
            )
        );
    }
    function handleDeleteTask(id) {
        setTasks((tasks) => tasks.filter((task) => task.id !== id));
    }
    function handleClear() {
        if (window.confirm(`Are you sure about clearing your tasks list?`))
            setTasks([]);
    }

    // converte the day into a string to comparison it with task.date
    const today = new Date();
    const year = today.getFullYear();
    const month =
        today.getMonth() + 1 > 9
            ? today.getMonth() + 1
            : `0${today.getMonth() + 1}`;
    const day = today.getDate() > 9 ? today.getDate() : `0${today.getDate()}`;
    const todayString = `${year}-${month}-${day}`;

    //Main Color
    const [color, setColor] = useState(
        localStorage.getItem("to_do_list_app_main_color") || "#673ab7"
    );
    function handleColor(color) {
        setColor(color);
    }
    document.documentElement.style.setProperty("--main-color", color);
    localStorage.setItem("to_do_list_app_main_color", color);

    return (
        <div className="app">
            <Navbar openAdd={openAdd} handleOpenAdd={handleToggleOpenAdd} />

            {openAdd ? (
                <AddTask
                    openAdd={openAdd}
                    setOpenAdd={setOpenAdd}
                    onAdd={handleAddTask}
                    handleToggleOpenAdd={handleToggleOpenAdd}
                    todayString={todayString}
                />
            ) : (
                <TasksContext.Provider value={tasks}>
                    <Routes>
                        <Route
                            path="/To_do_List_App"
                            element={
                                <Main
                                    color={color}
                                    handleColor={handleColor}
                                    onChecked={handleChecked}
                                    onDelete={handleDeleteTask}
                                    onEdit={handleEdit}
                                    todayString={todayString}
                                    onClear={handleClear}
                                />
                            }
                        />
                        <Route
                            path="/today"
                            element={
                                <TodayTasks
                                    onEdit={handleEdit}
                                    onChecked={handleChecked}
                                    onDelete={handleDeleteTask}
                                    todayString={todayString}
                                />
                            }
                        />
                        <Route path="/finished" element={<FinishedTasks />} />
                    </Routes>

                    <Footer />
                </TasksContext.Provider>
            )}
        </div>
    );
}
function Navbar({ openAdd, handleOpenAdd }) {
    const location = useLocation();
    const selected = location.pathname;

    return (
        <div className="navbar">
            <div className="logo">To Do List</div>
            {!openAdd && (
                <ul>
                    <Link
                        className={`link ${
                            (selected === "/To_do_List_App" ||
                                selected === "/To_do_List_App/") &&
                            "active"
                        }`}
                        to="/To_do_List_App"
                    >
                        All tasks
                    </Link>
                    <Link
                        className={`link ${selected === "/today" && "active"}`}
                        to="today"
                    >
                        Today's tasks
                    </Link>
                    <Link
                        className={`link ${
                            selected === "/finished" && "active"
                        }`}
                        to="finished"
                    >
                        Finished tasks
                    </Link>
                </ul>
            )}
            <button onClick={handleOpenAdd}>
                {openAdd ? "Close" : "Add task"}
            </button>
        </div>
    );
}
function AddTask({ openAdd, onAdd, handleToggleOpenAdd, todayString }) {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(todayString);
    const input = useRef(null);

    useEffect(
        function () {
            if (openAdd) input.current.focus();
        },
        [openAdd]
    );

    const newTask = {
        title,
        date,
        id: new Date(),
        isDone: false,
    };
    function handleSubmit(e) {
        e.preventDefault();
        if (title && date) {
            onAdd(newTask);
            handleToggleOpenAdd();
        }
    }
    return (
        <div className="add-task content" onSubmit={(e) => handleSubmit(e)}>
            <form>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="your task.."
                    ref={input}
                />
                <label>
                    Deadline
                    <input
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        type="date"
                    />
                </label>
                <button type="submit">Add task</button>
            </form>
        </div>
    );
}
function Main({
    color,
    handleColor,
    onChecked,
    onDelete,
    onEdit,
    todayString,
    onClear,
}) {
    const tasks = useContext(TasksContext);

    const [sortby, setSortby] = useState(
        localStorage.getItem("sortby") || "input"
    );

    let sortedTasks;
    if (sortby === "input") sortedTasks = tasks;
    if (sortby === "finished")
        sortedTasks = [
            ...tasks.filter((task) => !task.isDone),
            ...tasks.filter((task) => task.isDone),
        ];
    if (sortby === "deadline")
        sortedTasks = tasks
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date));

    useEffect(
        function () {
            localStorage.setItem("sortby", sortby);
        },
        [sortby]
    );

    return (
        <main className="content">
            <Quote />
            <div className="settings">
                {tasks.length > 0 && (
                    <select
                        value={sortby}
                        onChange={(e) => setSortby(e.target.value)}
                    >
                        <option value="input">Sort by input</option>
                        <option value="finished">Sort by finished tasks</option>
                        <option value="deadline">
                            Sort by tasks's deadline
                        </option>
                    </select>
                )}

                <ul className="color-options">
                    <li
                        className={color === "#9c27b0" ? "active" : ""}
                        onClick={() => handleColor("#9c27b0")}
                    ></li>
                    <li
                        className={color === "#673ab7" ? "active" : ""}
                        onClick={() => handleColor("#673ab7")}
                    ></li>
                    <li
                        className={color === "#3f51b5" ? "active" : ""}
                        onClick={() => handleColor("#3f51b5")}
                    ></li>
                    <li
                        className={color === "#03a9f4" ? "active" : ""}
                        onClick={() => handleColor("#03a9f4")}
                    ></li>
                    <li
                        className={color === "#009688" ? "active" : ""}
                        onClick={() => handleColor("#009688")}
                    ></li>
                    <li
                        className={color === "#8bc34a" ? "active" : ""}
                        onClick={() => handleColor("#8bc34a")}
                    ></li>
                </ul>
            </div>
            {tasks.length > 0 && (
                <button className="clear" onClick={onClear}>
                    Clear the list
                </button>
            )}
            {sortedTasks.map((task) => (
                <Task
                    task={task}
                    onChecked={onChecked}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    key={task.id}
                    todayString={todayString}
                />
            ))}
        </main>
    );
}
function Task({ task, onChecked, onDelete, onEdit, todayString }) {
    const [openEditTask, setopenEditTask] = useState(false);
    const [newTitle, setNewTitle] = useState(task.title);
    const [newDate, setNewDate] = useState(task.date);

    const input = useRef(null);

    useEffect(
        function () {
            if (openEditTask) input.current.focus();
        },
        [openEditTask]
    );

    function handleSubmit(e) {
        e.preventDefault();
        if (newTitle && newDate) {
            onEdit(task.id, newTitle, newDate);
            setopenEditTask(false);
        }
    }

    return (
        <>
            {openEditTask ? (
                <div className="edit-task">
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            ref={input}
                        />
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />

                        <button type="submit" className="done-edit-btn">
                            <FontAwesomeIcon icon={faCheckDouble} />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="task">
                    <div
                        className={`checkbox ${task.isDone && "checked"}`}
                        onClick={() => onChecked(task.id)}
                    >
                        {task.isDone && (
                            <FontAwesomeIcon
                                icon={faCheck}
                                style={{ color: "#ffffff", fontSize: "16px" }}
                            />
                        )}
                    </div>
                    <div className="task-title">
                        <p
                            style={
                                task.isDone
                                    ? { textDecoration: "line-through" }
                                    : {}
                            }
                        >
                            {task.title}
                        </p>

                        <span className="date">
                            {task.isDone ? (
                                <FontAwesomeIcon
                                    className="heart-icon"
                                    icon={faHeart}
                                    size="lg"
                                />
                            ) : (
                                <>
                                    {todayString > task.date ? (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faTriangleExclamation}
                                                beat
                                                style={{
                                                    color: "#e0b51a",
                                                    marginRight: "4px",
                                                }}
                                            />
                                            Late, your deadline:{" "}
                                        </>
                                    ) : (
                                        "Deadline: "
                                    )}
                                </>
                            )}
                            {task.date}
                        </span>
                    </div>
                    <div className="control-btns">
                        <button
                            className="edit-btn"
                            onClick={() => setopenEditTask(true)}
                        >
                            <FontAwesomeIcon
                                icon={faPenToSquare}
                                size="xl"
                                style={{ color: "#016019" }}
                            />
                        </button>
                        <button
                            className="delete-btn"
                            onClick={() => {
                                if (window.confirm(`Delete ${task.title} ?`))
                                    onDelete(task.id);
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faSquareXmark}
                                size="xl"
                                style={{ color: "#680000" }}
                            />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function Quote() {
    const [quote, setQuote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(function () {
        async function fetchQuote() {
            try {
                setLoading(true);
                const res = await fetch(
                    "https://api.api-ninjas.com/v1/quotes?category=success",
                    {
                        headers: {
                            "X-Api-Key":
                                "z7eIbwlYBmkWdV/eUPbAKQ==nmTPHT8n83Yz34a9",
                        },
                    }
                );
                const data = await res.json();
                setQuote(data[0]);
            } catch (error) {
                console.error(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchQuote();
    }, []);

    return (
        <div className="quote">
            {loading ? (
                <p>loading quote....</p>
            ) : (
                <>
                    {quote.quote ? (
                        <>
                            <q>{quote.quote}</q>
                            <span>{quote.author}</span>
                        </>
                    ) : (
                        <p>Can't load quote !!</p>
                    )}
                </>
            )}
        </div>
    );
}

function TodayTasks({ onChecked, onDelete, onEdit, todayString }) {
    const tasks = useContext(TasksContext);
    const [specificDate, setSpecificDate] = useState("");

    return (
        <div className="content">
            {tasks.filter((task) => task.date === todayString).length === 0 && (
                <p className="no-tasks">You haven't any task today</p>
            )}
            <label>
                Choose another specific day{" "}
                <input
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    type="date"
                />
            </label>

            {specificDate ? (
                <>
                    {tasks.filter((task) => task.date === specificDate).length >
                    0 ? (
                        tasks
                            .filter((task) => task.date === specificDate)
                            .map((task) => (
                                <Task
                                    task={task}
                                    onChecked={onChecked}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    key={task.id}
                                    todayString={todayString}
                                />
                            ))
                    ) : (
                        <p className="no-tasks">No tasks at {specificDate}</p>
                    )}
                </>
            ) : (
                tasks
                    .filter((task) => task.date === todayString)
                    .map((task) => (
                        <Task
                            task={task}
                            onChecked={onChecked}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            key={task.id}
                            todayString={todayString}
                        />
                    ))
            )}
        </div>
    );
}

function FinishedTasks() {
    const tasks = useContext(TasksContext);
    const finishedTasks = tasks.filter((task) => task.isDone);

    return (
        <div className="finished content">
            {finishedTasks.length > 0 ? (
                <h2>
                    You did{" "}
                    {finishedTasks.length > 1 ? "these tasks:" : "this task:"}
                </h2>
            ) : (
                <p className="no-tasks">You didn't finish any task yet</p>
            )}
            {tasks
                .filter((task) => task.isDone)
                .map((task, i) => (
                    <div className="task" key={task.id}>
                        <span>{i + 1}-</span> {task.title}{" "}
                    </div>
                ))}
        </div>
    );
}

function Footer() {
    const tasks = useContext(TasksContext);
    const finishesTasks = tasks.filter((task) => task.isDone).length;

    const allTasksDone = tasks.length === finishesTasks && tasks.length > 0;

    return (
        <footer>
            {allTasksDone && (
                <div className="animate-done">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            )}

            {tasks.length > 0 ? (
                <div>
                    You have {tasks.length} task{tasks.length > 1 && "s"}, you
                    finished {finishesTasks} task
                    {finishesTasks.length > 1 && "s"} (
                    {Math.round((finishesTasks / tasks.length) * 100)}% Done )
                </div>
            ) : (
                <p>Start adding tasks </p>
            )}
        </footer>
    );
}
