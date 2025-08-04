const App = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center text-foreground">Stakedriven</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Web3 Fundable Polls - Vote and fund features with on-chain funds
        </p>
        <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default App;