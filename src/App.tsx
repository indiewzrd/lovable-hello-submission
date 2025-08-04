const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Stakedriven</h1>
        <p className="text-gray-600 mb-6 text-center">
          Web3 Fundable Polls - Vote and fund features with on-chain funds
        </p>
        <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default App;