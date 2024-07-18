import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import Ximg from './../../public/x.png'
import Oimg from './../../public/o.png'
import Win from './../../public/win.jpg'
import Lose from './../../public/lose.png'
import { toast } from 'react-toastify';

interface GameProps {
  socket: Socket;
  username: string
}

interface GameState {
  board: string[];
  currentPlayer: string;
  players: { [socketId: string]: string };
}

interface User {
  name: string,
  id: string
}
interface Room {
  name: string,
  id: string;
  creatorUsername: string;
  players: User[];
}

const Game: React.FC<GameProps> = ({ socket, username }) => {
  const [roomId, setRoomId] = useState<string>('');
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [iswin, setIsWin] = useState<boolean>(false);
  const [roomName, setRoomName] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isInRoom, setIsInRoom] = useState<boolean>(false);

  console.log(username);


  useEffect(() => {
    // Socket event listeners
    socket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    socket.on('rooms', (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
    });

    socket.on('errorMessage', (message: string) => {
      toast(message)
    });

    socket.on('gameOver', (data: any) => {
      if (data.type === 'win') {
        if (data.userId === socket.id) {
          setIsWin(true)
        } else {
          setIsWin(false)
        }
      }
      setShowPopup(true)
    });

    socket.on('user-join', (username: string) => {
      let message = 'New Partner '+ username + 'is Joined!'
      toast(message)
    });

    socket.on('user-leave', () => {
      let message = 'Your partner '+ username + 'is Leaved!'
      toast(message)
    });


    // Cleanup function for disconnecting event listeners
    return () => {
      socket.off('gameState');
      socket.off('rooms');
      socket.off('errorMessage');
    };
  }, [socket]);

  // Create a new game room
  const createGame = () => {
    if (roomName.trim()) {
      socket.emit('createRoom', roomName);
      setRoomName('');
    } else {
      toast('Please enter a room name');
    }
  };

  // Join an existing game room
  const joinGame = (roomId: string) => {
    socket.emit('joinRoom', roomId);
    setRoomId(roomId);
    setIsInRoom(true);
  };

  // Exit the current game room
  const exitGame = () => {
    socket.emit('exitRoom', roomId);
    setRoomId('');
    setIsInRoom(false);
    setGameState(null); // Reset game state upon exiting
  };

  // Check if the current game room is full (has 2 players)
  const isRoomFull = () => {
    const room = rooms.find((room) => room.id === roomId);
    return room?.players.length === 2;
  };

  const getUserName = () => {
    const room = rooms.find((r) => r.id === roomId)
    if (room) {
      console.log(room);

      return room
    } else {
      return null
    }
  }

  const closePopup = () => {
    setShowPopup(false)
    exitGame()
  }

  // Handle making a move in the game
  const makeMove = (index: number) => {
    if (roomId.trim() && gameState?.currentPlayer === socket.id) {
      socket.emit('makeMove', { roomId, index });
    }
  };

  return (
    <div className="p-4">
      {!isInRoom ? (
        // Display list of available rooms if not in a game room
        <div className='text-center'>
          <h1 className='text-[#F01040] my-4 font-bold text-xl'>Play With Online User</h1>
          <input
            type="text"
            placeholder="Enter Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="p-2 border text-center rounded-2xl mb-4 w-60 me-4 focus:outline-none"
          />
          <button onClick={createGame} className="btn-gradient text-white p-2 rounded-2xl mb-12">
            Create Game
          </button>
          <h3 className="text-xl text-[#F11845] mb-6">Available Rooms</h3>
          <div className='grid grid-cols-2 gap-4'>
            {rooms.map((room) => (
              <div key={room.id} className="bg-[#F22753] p-4 rounded-2xl" onClick={() => joinGame(room.id)}>
                <div className='flex justify-center gap-4 items-center'>
                  <img src={Ximg} alt="x" className='w-14' />
                  <img src={Oimg} alt="x" className='w-14' />
                </div>
                <p className='bg-[#fbb9c7] block p-2 rounded-xl mt-2'>{room.name}  ({room.players.length}/2)</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Display game board and status if in a game room
        <div className="h-full text-center flex flex-col items-center justify-center">
          <button onClick={exitGame} className="bg-red-500 text-white p-2 rounded block absolute top-4 left-4">
            Exit Game
          </button>

          <div className='flex justify-between items-center'>
            <div className='bg-white p-4 rounded-2xl'>
              <p>{getUserName() ? getUserName()?.players[0]?.name : username}</p>
              <div className='px-6 py-2 bg-[#F22753] rounded-lg mt-2'>
                <img src={Ximg} alt="x" className='w-8 ' />
              </div>
            </div>
            vs
            <div>
              <div className='bg-white p-4 rounded-2xl'>
                <p>{getUserName()?.players[1]?.name ? getUserName()?.players[1]?.name : 'Waiting...'}</p>
                <div className='px-6 py-2 bg-[#F22753] rounded-lg mt-2'>
                  <img src={Oimg} alt="x" className='w-8 ' />
                </div>
              </div>
            </div>
          </div>
          {/* <p>{isRoomFull() ? 'Ready to play' : 'Waiting for other player'}</p> */}
          {gameState && isRoomFull() && (
            <div className='grid-box mt-16 rounded-2xl'>
              <div className=" grid grid-cols-3 bg-[#F22753] rounded-2xl overflow-hidden ">
                {gameState.board.map((cell, index) => (
                  <div
                    key={index}
                    className="border border-gray-300 flex items-center justify-center h-24 w-24 text-2xl cursor-pointer"
                    onClick={() => makeMove(index)}
                  >
                    {
                      cell ? <img src={cell === 'O' ? Oimg : Ximg} alt="" className='w-12' /> : ''
                    }

                  </div>
                ))}
              </div>
            </div>

          )}

          {
            gameState?.currentPlayer === socket.id ?
              <div className='w-72 absolute bottom-20'>
                <p className='yellow-gradient w-full py-2 mt-6 rounded-2xl'>Your Turn</p>
              </div>
              :
              ''
          }

          {
            showPopup ? <div className='absolute popup-shadow flex flex-col gap-4 bg-white px-10 py-10 rounded-2xl origin-center'>
              {
                iswin ?
                  <div>
                    <img src={Win} alt="" className='mx-auto w-52' />
                    <p className='text-shadow text-3xl font-bold'>Congratulations!</p>
                    <p className='text-shadow'>You Win the Match</p>
                  </div>
                  :
                  <div>
                    <img src={Lose} alt="" className='mx-auto w-52' />
                    <p className='text-shadow text-3xl font-bold mt-4'>You Lose</p>
                  </div>
              }
              <button className='btn-gradient text-white px-20 py-2 rounded-xl mt-2' onClick={closePopup}>Close</button>
            </div> : ''
          }

        </div>
      )}
    </div>
  );
};

export default Game;
