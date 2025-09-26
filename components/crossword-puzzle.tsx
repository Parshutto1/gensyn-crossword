"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface WordData {
  word: string
  clue: string
  startRow: number
  startCol: number
  direction: "horizontal" | "vertical"
  number: number
}

const WORDS: WordData[] = [
  { word: "GENSYN", clue: "The best project ever", startRow: 5, startCol: 1, direction: "horizontal", number: 1 },
  { word: "SWARM", clue: "The role in DC of AI co-education", startRow: 5, startCol: 4, direction: "vertical", number: 2 },
  { word: "AI", clue: "Technology that is taught at Gensyn", startRow: 7, startCol: 4, direction: "horizontal", number: 3 },
  { word: "NODES", clue: "Network members who provide resources", startRow: 2, startCol: 2, direction: "vertical", number: 4 },
  { word: "MODERATORS", clue: "Chat Guards", startRow: 3, startCol: 1, direction: "horizontal", number: 5 },
  { word: "VERIFICATION", clue: "The process of confirming the correctness of calculations", startRow: 8, startCol: 2, direction: "horizontal", number: 6 },
  { word: "VALIDATOR", clue: "One who secures the chain by staking and verifying blocks", startRow: 1, startCol: 12, direction: "vertical", number: 7 },
]

interface CellData {
  letter: string
  wordNumbers: number[]
  isIntersection: boolean
  isWordStart: boolean
  wordStartNumber?: number
}

interface LeaderboardEntry {
  nick: string
  attempts: number
  time: number
  completedAt: string
}

export default function CrosswordPuzzle() {
  const [gameStarted, setGameStarted] = useState(false)
  const [discordNick, setDiscordNick] = useState("")
  const [timer, setTimer] = useState(0)
  const [playerAttempts, setPlayerAttempts] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [grid, setGrid] = useState<{ [key: string]: CellData }>({})
  const [userInput, setUserInput] = useState<{ [key: string]: string }>({})
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set())
  const [incorrectWords, setIncorrectWords] = useState<Set<number>>(new Set())
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize grid
  useEffect(() => {
    const newGrid: { [key: string]: CellData } = {}

    WORDS.forEach((wordData) => {
      for (let i = 0; i < wordData.word.length; i++) {
        const row = wordData.direction === "horizontal" ? wordData.startRow : wordData.startRow + i
        const col = wordData.direction === "horizontal" ? wordData.startCol + i : wordData.startCol
        const key = `${row}-${col}`

        if (!newGrid[key]) {
          newGrid[key] = {
            letter: wordData.word[i],
            wordNumbers: [wordData.number],
            isIntersection: false,
            isWordStart: i === 0,
            wordStartNumber: i === 0 ? wordData.number : undefined,
          }
        } else {
          newGrid[key].wordNumbers.push(wordData.number)
          newGrid[key].isIntersection = true
          if (i === 0 && !newGrid[key].wordStartNumber) {
            newGrid[key].isWordStart = true
            newGrid[key].wordStartNumber = wordData.number
          }
        }
      }
    })

    setGrid(newGrid)
    console.log(
      "[v0] Grid initialized with words:",
      WORDS.map((w) => `${w.number}: ${w.word}`),
    )
  }, [])

  // Timer effect
  useEffect(() => {
    if (gameStarted && !gameCompleted && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }

    if ((!gameStarted || gameCompleted) && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameStarted, gameCompleted])

  const handleInputChange = (key: string, value: string) => {
    if (value.length > 1) return

    const newUserInput = { ...userInput, [key]: value.toUpperCase() }
    setUserInput(newUserInput)

    // Auto-advance to next cell if letter was entered
    if (value && value.trim() !== "") {
      const [row, col] = key.split("-").map(Number)

      // Find the word this cell belongs to and move to next cell in that word
      const currentWord = WORDS.find((word) => {
        for (let i = 0; i < word.word.length; i++) {
          const wordRow = word.direction === "horizontal" ? word.startRow : word.startRow + i
          const wordCol = word.direction === "horizontal" ? word.startCol + i : word.startCol
          if (wordRow === row && wordCol === col) {
            // Check if there's a next cell in this word
            if (i < word.word.length - 1) {
              const nextRow = word.direction === "horizontal" ? word.startRow : word.startRow + i + 1
              const nextCol = word.direction === "horizontal" ? word.startCol + i + 1 : word.startCol
              const nextKey = `${nextRow}-${nextCol}`

              // Focus next input
              setTimeout(() => {
                const nextInput = inputRefs.current[nextKey]
                if (nextInput) {
                  nextInput.focus()
                }
              }, 10)
            }
            return true
          }
        }
        return false
      })
    }

    // Check word completion
    checkWordCompletion(newUserInput)
  }

  const checkWordCompletion = (currentInput: { [key: string]: string }) => {
    const newCompletedWords = new Set<number>()
    const newIncorrectWords = new Set<number>()

    WORDS.forEach((wordData) => {
      let userWord = ""
      let isComplete = true

      for (let i = 0; i < wordData.word.length; i++) {
        const row = wordData.direction === "horizontal" ? wordData.startRow : wordData.startRow + i
        const col = wordData.direction === "horizontal" ? wordData.startCol + i : wordData.startCol
        const key = `${row}-${col}`
        const userLetter = currentInput[key] || ""

        if (!userLetter) {
          isComplete = false
          break
        }
        userWord += userLetter
      }

      if (isComplete) {
        if (userWord === wordData.word) {
          newCompletedWords.add(wordData.number)
        } else {
          newIncorrectWords.add(wordData.number)
        }
      }
    })

    setCompletedWords(newCompletedWords)
    setIncorrectWords(newIncorrectWords)

    // Check if all words are solved
    if (newCompletedWords.size === WORDS.length && newIncorrectWords.size === 0) {
      setGameCompleted(true)
      saveToLeaderboard(discordNick, playerAttempts, timer)
      console.log('🎉 Crossword completed! Time stopped:', timer, 'seconds')
    }
  }

  const getCellStatus = (key: string, wordNumbers: number[]) => {
    const hasCompleted = wordNumbers.some((num) => completedWords.has(num))
    const hasIncorrect = wordNumbers.some((num) => incorrectWords.has(num))

    if (hasCompleted && !hasIncorrect) return "correct"
    if (hasIncorrect) return "incorrect"
    return "default"
  }

  const renderGrid = () => {
    if (!gameStarted) return null

    const maxRow = Math.max(...Object.keys(grid).map((key) => Number.parseInt(key.split("-")[0])))
    const maxCol = Math.max(...Object.keys(grid).map((key) => Number.parseInt(key.split("-")[1])))

    const rows = []
    for (let row = 1; row <= maxRow; row++) {
      const cells = []
      for (let col = 1; col <= maxCol; col++) {
        const key = `${row}-${col}`
        const cellData = grid[key]

        if (cellData) {
          const status = getCellStatus(key, cellData.wordNumbers)
          cells.push(
            <div key={key} className="relative">
              <input
                ref={(el) => { inputRefs.current[key] = el }}
                type="text"
                value={userInput[key] || ""}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className={cn(
                  "w-12 h-12 border-2 border-gray-800 text-center font-bold text-xl uppercase bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mondwest",
                  status === "correct" && "bg-green-400 text-white",
                  status === "incorrect" && "bg-red-400 text-white",
                )}
                maxLength={1}
              />
              {cellData.isWordStart && cellData.wordStartNumber && (
                <div className="absolute -top-2 -left-2 w-5 h-5 text-black text-xs font-bold rounded-full flex items-center justify-center" style={{backgroundColor: '#fad7d1'}}>
                  {cellData.wordStartNumber}
                </div>
              )}
            </div>,
          )
        } else {
          cells.push(<div key={key} className="w-12 h-12" />)
        }
      }
      rows.push(
        <div key={row} className="flex gap-1">
          {cells}
        </div>,
      )
    }
    return rows
  }

  const renderCluesList = () => {
    if (!gameStarted) return null

    const sortedWords = [...WORDS].sort((a, b) => a.number - b.number)

    return (
      <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h2 className="text-4xl font-bold text-white mb-4 text-center font-mondwest">CLUES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sortedWords.map((word) => (
            <div key={word.number} className={`flex items-start gap-3 text-white font-mondwest ${word.number === 7 ? '-mt-4' : ''}`}>
              <div className="w-6 h-6 text-black text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-mondwest" style={{backgroundColor: '#fad7d1'}}>
                {word.number}
              </div>
              <div className="text-lg leading-relaxed">
                <span className="font-semibold">{word.direction === "horizontal" ? "Across" : "Down"}:</span>{" "}
                {word.clue}?
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const saveToLeaderboard = (nick: string, attempts: number, time: number) => {
    const entry: LeaderboardEntry = {
      nick,
      attempts,
      time,
      completedAt: new Date().toISOString()
    }

    const existingData = localStorage.getItem('gensyn_leaderboard')
    let leaderboard: LeaderboardEntry[] = existingData ? JSON.parse(existingData) : []

    // Check if there's already an entry for this player
    const existingEntryIndex = leaderboard.findIndex(entry => entry.nick === nick)

    if (existingEntryIndex >= 0) {
      const existingEntry = leaderboard[existingEntryIndex]
      // Replace only if new result is better (fewer attempts or same attempts with less time)
      if (attempts < existingEntry.attempts ||
          (attempts === existingEntry.attempts && time < existingEntry.time)) {
        leaderboard[existingEntryIndex] = entry
      }
    } else {
      leaderboard.push(entry)
    }

    // Sort: first by attempts, then by time
    leaderboard.sort((a, b) => {
      if (a.attempts !== b.attempts) {
        return a.attempts - b.attempts
      }
      return a.time - b.time
    })

    // Keep top-100
    leaderboard = leaderboard.slice(0, 100)

    localStorage.setItem('gensyn_leaderboard', JSON.stringify(leaderboard))
  }

  const getLeaderboard = (): LeaderboardEntry[] => {
    const data = localStorage.getItem('gensyn_leaderboard')
    const leaderboard = data ? JSON.parse(data) : []

    console.log('📊 Leaderboard loaded:', leaderboard.length, 'users')
    return leaderboard
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-center bg-no-repeat" style={{backgroundImage: 'url(/background.jpg)', backgroundSize: '130%'}}>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-white text-center mb-8 text-shadow font-mondwest">GENSYN CROSSWORD</h1>

        {!gameStarted ? (
          <div className="flex flex-col items-center max-w-md mx-auto">
            <p className="text-white text-2xl mb-8 text-center font-mondwest">
              Solve all 7 questions as fast as you can
            </p>

            <div className="w-full mb-6">
              <label htmlFor="discord-nick" className="block text-white text-xl mb-3 text-center font-mondwest">
                Enter your Discord handle:
              </label>
              <input
                id="discord-nick"
                type="text"
                value={discordNick}
                onChange={(e) => {
                  const nick = e.target.value
                  setDiscordNick(nick)

                  // Show attempts count when typing nickname
                  if (nick.trim()) {
                    const storedAttempts = localStorage.getItem(`gensyn_attempts_${nick.trim()}`)
                    const attempts = storedAttempts ? parseInt(storedAttempts) : 0
                    setPlayerAttempts(attempts)
                  } else {
                    setPlayerAttempts(0)
                  }
                }}
                placeholder="@your_handle"
                className="w-full px-4 py-3 rounded-lg text-center text-lg font-bold bg-white/90 backdrop-blur-sm border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mondwest"
                maxLength={50}
              />
            </div>

            {discordNick.trim() && (
              <div className="mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-white text-lg font-bold text-center font-mondwest">
                    {playerAttempts === 0
                      ? 'First attempt'
                      : `Attempt #${playerAttempts + 1}`
                    }
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="font-bold py-3 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-mondwest text-black"
                style={{backgroundColor: '#fad7d1'}}
              >
                🏆 Leaderboard
              </button>

              <button
                onClick={() => {
                if (discordNick.trim()) {
                  // Get current attempts count for this nickname
                  const storedAttempts = localStorage.getItem(`gensyn_attempts_${discordNick.trim()}`)
                  const currentAttempts = storedAttempts ? parseInt(storedAttempts) : 0
                  const newAttempts = currentAttempts + 1

                  // Save updated attempts count
                  localStorage.setItem(`gensyn_attempts_${discordNick.trim()}`, newAttempts.toString())

                  setGameStarted(true)
                  setPlayerAttempts(newAttempts)
                  setTimer(0)
                  setGameCompleted(false)
                } else {
                  alert('Please enter your Discord handle!')
                }
              }}
              disabled={!discordNick.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl text-2xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg font-mondwest"
            >
              START
            </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-lg px-6 py-4 text-black font-bold font-mondwest" style={{backgroundColor: '#fad7d1'}}>
                <div className="flex flex-wrap items-center justify-center divide-x divide-black/30">
                  <div className="text-lg px-4">
                    Player: {discordNick}
                  </div>
                  <div className="text-2xl px-4">
                    Time: {formatTime(timer)}
                  </div>
                  <div className="text-lg px-4">
                    Attempt: {playerAttempts}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-8">{renderGrid()}</div>

            {gameCompleted && (
              <div className="mb-6 text-center">
                <div className="bg-green-500/90 backdrop-blur-sm rounded-xl p-6">
                  <h2 className="text-3xl font-bold text-white mb-2 font-mondwest">
                    🎉 Congratulations!
                  </h2>
                  <p className="text-white text-lg font-mondwest">
                    Crossword completed in {formatTime(timer)}!
                  </p>
                  <p className="text-white text-sm font-mondwest opacity-80 mt-2">
                    Attempt #{playerAttempts} • Player: {discordNick}
                  </p>
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg mt-4 transition-all duration-200 font-mondwest"
                  >
                    Show Leaderboard
                  </button>
                </div>
              </div>
            )}

            {renderCluesList()}
          </div>
        )}

        {/* Leaderboard modal window */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-pink-300" style={{backgroundColor: '#fad7d1'}}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-black font-mondwest">🏆 Leaderboard</h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-black hover:text-gray-600 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Search input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/80 text-black placeholder-gray-500 border border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mondwest"
                />
              </div>

              {/* Current player position if not in top 10 */}
              {(() => {
                const fullLeaderboard = getLeaderboard()
                const currentPlayerIndex = fullLeaderboard.findIndex(entry => entry.nick === discordNick)
                const currentPlayerEntry = currentPlayerIndex >= 0 ? fullLeaderboard[currentPlayerIndex] : null

                return currentPlayerEntry && currentPlayerIndex >= 10 && !searchQuery ? (
                  <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <div className="text-black/80 text-sm font-mondwest mb-1">Your position:</div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gray-700 text-white">
                          {currentPlayerIndex + 1}
                        </div>
                        <div>
                          <div className="text-black font-bold font-mondwest text-lg">
                            {currentPlayerEntry.nick}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-black font-bold font-mondwest text-lg">
                          {formatTime(currentPlayerEntry.time)}
                        </div>
                        <div className="text-black/70 text-base font-mondwest">
                          Attempt #{currentPlayerEntry.attempts}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              })()}

              <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                {(() => {
                  const fullLeaderboard = getLeaderboard()
                  const filteredLeaderboard = searchQuery
                    ? fullLeaderboard.filter(entry =>
                        entry.nick.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    : fullLeaderboard.slice(0, 20) // Show top 20 by default

                  if (filteredLeaderboard.length === 0) {
                    return searchQuery ? (
                      <p className="text-black text-center font-mondwest opacity-70 text-lg">
                        No players found matching "{searchQuery}"
                      </p>
                    ) : (
                      <p className="text-black text-center font-mondwest opacity-70 text-xl">
                        Leaderboard is empty. Be the first!
                      </p>
                    )
                  }

                  return filteredLeaderboard.map((entry, index) => {
                    const actualIndex = searchQuery
                      ? getLeaderboard().findIndex(e => e.nick === entry.nick)
                      : index

                    return (
                    <div
                      key={entry.nick}
                      className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between ${
                        actualIndex === 0 ? 'ring-2 ring-yellow-400' :
                        actualIndex === 1 ? 'ring-2 ring-gray-400' :
                        actualIndex === 2 ? 'ring-2 ring-orange-400' : ''
                      } ${
                        entry.nick === discordNick ? 'ring-2 ring-blue-400 bg-blue-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          actualIndex === 0 ? 'bg-yellow-500 text-black' :
                          actualIndex === 1 ? 'bg-gray-400 text-black' :
                          actualIndex === 2 ? 'bg-orange-500 text-black' :
                          entry.nick === discordNick ? 'bg-blue-500 text-white' :
                          'bg-gray-700 text-white'
                        }`}>
                          {actualIndex + 1}
                        </div>
                        <div>
                          <div className="text-black font-bold font-mondwest text-xl">
                            {entry.nick}
                          </div>
                          <div className="text-black/70 text-lg font-mondwest">
                            {new Date(entry.completedAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-black font-bold font-mondwest text-xl">
                          {formatTime(entry.time)}
                        </div>
                        <div className="text-black/70 text-lg font-mondwest">
                          Attempt #{entry.attempts}
                        </div>
                      </div>
                    </div>
                    )
                  })
                })()}
              </div>

              {!searchQuery && getLeaderboard().length > 20 && (
                <div className="text-center mt-4">
                  <p className="text-black/60 text-sm font-mondwest">
                    Showing top 20 of {getLeaderboard().length} players. Use search to find specific players.
                  </p>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-black text-lg font-mondwest">
                  Sorting: first by attempts, then by time
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <img
            src="/gensyn-logo.png"
            alt="Gensyn Logo"
            className="mx-auto h-12 object-contain"
          />
        </div>
      </div>
    </div>
  )
}
