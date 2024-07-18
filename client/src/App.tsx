// src/App.tsx
import React, { useState } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Game from './components/Game';
import './App.css'
import { Bounce, ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

const socket = io('http://localhost:3000'); // Adjust the URL if necessary

const App: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);

  const handleLoginSuccess = (username: string) => {
    setUsername(username);
  };

  return (
    <div className="min-h-screen flex justify-center ">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
      {username ? (
        <Game socket={socket} username={username} />
      ) : (
        <Login socket={socket} onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
