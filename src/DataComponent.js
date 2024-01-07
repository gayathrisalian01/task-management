import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactModal from 'react-modal';
import Chart from 'chart.js/auto';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [foundTask, setFoundTask] = useState(null);
  const [dailyTaskStatusData, setDailyTaskStatusData] = useState({});
  const [taskPriorityData, setTaskPriorityData] = useState({});

  useEffect(() => {
    // Fetch all tasks from the backend when the component mounts and update the tasks state
    const fetchTasks = async () => {
      try {
        const response = await axios.get('http://localhost:3000/tasks/');
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);


  // graphhh
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/tasks/');
        const statusCounts = groupTasksByStatusAndDay(response.data);
        setDailyTaskStatusData(statusCounts);
      } catch (error) {
        console.error('Error fetching task data:', error);
      }
    };

    fetchData();
  }, []);

  const groupTasksByStatusAndDay = (tasks) => {
    const statusCounts = {};

    tasks.forEach(task => {
      const dueDate = new Date(task.due_date);
      const key = dueDate.toISOString().split('T')[0];

      if (!statusCounts[key]) {
        statusCounts[key] = {
          'To-Do': 0,
          'In Progress': 0,
          'Completed': 0,
        };
      }

      statusCounts[key][task.status]++;
    });

    return statusCounts;
  };

  useEffect(() => {
    const createChart = () => {
      const ctx = document.getElementById('dailyTaskStatusChart').getContext('2d');

      const labels = Object.keys(dailyTaskStatusData);
      const data = Object.values(dailyTaskStatusData);

      const datasets = [];
      ['To-Do', 'In Progress', 'Completed'].forEach(status => {
        const statusData = {
          label: status,
          data: labels.map(date => dailyTaskStatusData[date][status] || 0),
          backgroundColor: getStatusColor(status),
          borderColor: getStatusColor(status),
          borderWidth: 1,
        };
        datasets.push(statusData);
      });

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Tasks',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Date',
              },
            },
          },
        },
      });
    };

    if (dailyTaskStatusData && Object.keys(dailyTaskStatusData).length !== 0) {
      createChart();
    }
  }, [dailyTaskStatusData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'To-Do':
        return 'rgba(255, 99, 132, 0.5)';
      case 'In Progress':
        return 'rgba(54, 162, 235, 0.5)';
      case 'Completed':
        return 'rgba(75, 192, 192, 0.5)';
      default:
        return 'rgba(0, 0, 0, 0.5)';
    }
  };


  // pie Chart 

  useEffect(() => {
    const fetchPriorityData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/tasks/');
        const priorityCounts = groupTasksByPriority(response.data);
        setTaskPriorityData(priorityCounts);
      } catch (error) {
        console.error('Error fetching task data:', error);
      }
    };

    fetchPriorityData();
  }, []);

  const groupTasksByPriority = (tasks) => {
    const priorityCounts = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
    };

    tasks.forEach(task => {
      priorityCounts[task.priority]++;
    });

    return priorityCounts;
  };

  useEffect(() => {
    const createPriorityChart = () => {
      const ctx = document.getElementById('taskPriorityChart').getContext('2d');

      const labels = Object.keys(taskPriorityData);
      const data = Object.values(taskPriorityData);

      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Task Priority',
              data: data,
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)', // Red for Low
                'rgba(54, 162, 235, 0.5)', // Blue for Medium
                'rgba(255, 206, 86, 0.5)', // Yellow for High
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: 'right',
            },
          },
        },
      });
    };

    if (taskPriorityData && Object.keys(taskPriorityData).length !== 0) {
      createPriorityChart();
    }
  }, [taskPriorityData]);

  const refreshTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/tasks/');
      setTasks(response.data);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await axios.patch(`http://localhost:3000/api/tasks/${taskId}/status`, { status: newStatus });
      refreshTasks();
    } catch (error) {
      console.error(`Error updating status for task ${taskId}:`, error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await axios.post('http://localhost:3000/tasks/', taskData);
      closeModal();
      refreshTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/tasks/${searchId}`);
      setFoundTask(response.data);
    } catch (error) {
      console.error('Error fetching task by ID:', error);
      setFoundTask(null);
    }
  };

  const closeSearch = () => {
    setFoundTask(null);
    setSearchId(''); // Clear the search input field when closing the search results
  };

  return (
    <div>
      <button onClick={openModal}>Create Task</button>

      <ReactModal isOpen={isModalOpen} onRequestClose={closeModal}>
        <AddTaskForm onCreateTask={handleCreateTask} />
        <button onClick={closeModal}>Close</button>
      </ReactModal>

      <div>
        <input
          type="text"
          placeholder="Enter Task ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {foundTask && (
        <div>
          <button onClick={closeSearch}>Close Search</button>
          <h3>Found Task:</h3>
          <p>ID: {foundTask.id}</p>
          <p>Title: {foundTask.task_title}</p>
          <p>Description: {foundTask.task_description}</p>
          <p>Priority: {foundTask.priority}</p>
          <p>Due Date: {foundTask.due_date}</p>
          <select
            value={foundTask.status}
            onChange={(e) => handleUpdateStatus(foundTask.id, e.target.value)}
          >
            <option value="To-Do">To-Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}
      <h2>All Tasks</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>description</th>
            <th>priority</th>
            <th>due date</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.task_title}</td>
              <td>{task.task_description}</td>
              <td>{task.priority}</td>
              <td>{task.due_date}</td>
              <td>
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                >
                  <option value="To-Do">To-Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ width: '800px', margin: '20px auto' }}>
        <canvas id="dailyTaskStatusChart"></canvas>
      </div>
      <div style={{ width: '600px', margin: '20px auto' }}>
        <canvas id="taskPriorityChart"></canvas>
      </div>
    </div>
  );
};

const AddTaskForm = ({ onCreateTask }) => {
  const [taskData, setTaskData] = useState({
    task_title: '',
    task_description: '',
    priority: 'Low',
    due_date: '2024-01-10',
    status: 'To-Do'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateTask(taskData);
    setTaskData({
      task_title: '',
      task_description: '',
      priority: 'Low',
      due_date: '2024-01-10',
      status: 'To-Do'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Title:</label>
        <input
          type="text"
          name="task_title"
          value={taskData.task_title}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Description:</label>
        <textarea
          name="task_description"
          value={taskData.task_description}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Priority:</label>
        <select name="priority" value={taskData.priority} onChange={handleChange}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      <div>
        <label>Due Date:</label>
        <input
          type="date"
          name="due_date"
          value={taskData.due_date}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Status:</label>
        <select name="status" value={taskData.status} onChange={handleChange}>
          <option value="To-Do">To-Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      <button type="submit">Add Task</button>
    </form>
  );
};


export default TaskManager;
