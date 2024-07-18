// src/components/Login.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Socket } from 'socket.io-client';

interface LoginProps {
  socket: Socket;
  onLoginSuccess: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ socket, onLoginSuccess }) => {
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    if (username.trim()) {
      socket.emit('login', username);
      socket.on('loginSuccess', (username: string) => {
        onLoginSuccess(username);
      });
      socket.on('errorMessage', (message: string) => {
        toast(message);
      });
    } else {
      toast('Please enter a username')
    }
  };

  return (
    <div className="flex flex-col items-center my-auto">
      <p className='text-[#F44D6D] font-bold mb-4'>Enter Username And Play With Online User</p>
      <input
        type="text"
        placeholder="Enter username here"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="p-4 border border-gray-300 mb-4 w-80 text-center focus:outline-none rounded-2xl"
      />
      <button onClick={handleLogin} className="btn-gradient text-white py-4 px-32 rounded-2xl">
        Let Play
      </button>
    </div>
  );
};

export default Login;
